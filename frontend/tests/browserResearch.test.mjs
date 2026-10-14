import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'

const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'fancy-browser-tests-'))
for (const name of ['browserConfig', 'browserResearch']) {
  const source = await fs.readFile(new URL(`../src/lib/${name}.ts`, import.meta.url), 'utf8')
  const output = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText
    .replaceAll("'./browserConfig'", "'./browserConfig.mjs'")
  await fs.writeFile(path.join(directory, `${name}.mjs`), output)
}
const { runBrowserResearch, normalizeClaims } = await import(pathToFileURL(path.join(directory, 'browserResearch.mjs')))
const { validateConfig, endpoint } = await import(pathToFileURL(path.join(directory, 'browserConfig.mjs')))
const config = { modelKey: 'visitor-model-key', searchKey: 'visitor-search-key', modelBase: 'https://model.provider.test/v1',
  searchBase: 'https://search.provider.test/v1', coreModel: 'core', auxModel: 'aux', fastModel: 'fast' }
const task = { id: 't_test', query: 'Compare Example A', mode: 'quick', status: 'ready' }
const evidence = [{ evidence_id: 'e_one', domain: 'example.com' }, { evidence_id: 'e_two', domain: 'example.org' }]

function mockProvider({ empty = false, badCitation = false } = {}) {
  const requests = []
  return { requests, fetch: async (url, init) => {
    const payload = JSON.parse(init.body)
    requests.push({ url, payload, auth: init.headers.Authorization })
    if (url.includes('search.provider')) return Response.json({ code: 200, data: { webPages: { value: empty ? [] : [
      { url: 'https://example.com/a', name: 'Example A', summary: 'Example A offers X.' },
      { url: 'https://example.org/a', name: 'Example A review', summary: 'Example A offers X.' },
    ] } } })
    const prompt = payload.messages[1].content
    const refs = [...prompt.matchAll(/\[(e_[a-zA-Z0-9]+)\]/g)].map((match) => match[1])
    let result
    if (prompt.includes('制定研究计划')) result = { title: 'Example research', brands: ['Example A'], focus: ['features'], queries: ['Example A pricing'] }
    else if (prompt.includes('以下是搜索摘要')) result = { claims: [{ text: 'Example A offers X.', field: 'overview', evidence_ids: refs }], gaps: ['Price not verified'] }
    else if (prompt.includes('撰写章节：')) result = { paragraphs: [`Evidence says Example A offers X. [${badCitation ? 'e_missing' : refs[0]}]`], key_takeaway: 'Example A offers X.', evidence_ids: refs }
    else result = { review: 'Review complete; human verification needed.', issues: [], suggestions: [] }
    return Response.json({ choices: [{ message: { content: JSON.stringify(result) } }], usage: { total_tokens: 12 } })
  } }
}

test('missing visitor credentials fail before any provider request', async () => {
  let calls = 0
  const original = globalThis.fetch
  globalThis.fetch = async () => { calls++; throw new Error('Unexpected request') }
  try { await assert.rejects(runBrowserResearch(task, { ...config, modelKey: '' }, () => {}, new AbortController().signal), /API Key/); assert.equal(calls, 0) }
  finally { globalThis.fetch = original }
})
test('endpoint rejects unsafe protocols and embedded credentials', () => {
  assert.throws(() => endpoint('http://untrusted.test/api', 'chat'), /HTTPS/)
  assert.throws(() => endpoint('https://user:pass@provider.test/api', 'chat'))
  assert.doesNotThrow(() => validateConfig(config))
})
test('claims reject invented IDs, deduplicate references and ignore model confidence', () => {
  const claims = normalizeClaims([{ text: 'Unsupported', evidence_ids: ['missing'], confidence: 'high' },
    { text: 'One source', evidence_ids: ['e_one', 'e_one', 'missing'], author: 'L2-002', confidence: 'high' },
    { text: 'Two domains', evidence_ids: ['e_one', 'e_two'] }], evidence)
  assert.equal(claims.length, 2); assert.equal(claims[0].confidence, 'low'); assert.equal(claims[0].author, 'L2-001')
  assert.deepEqual(claims[0].evidence_ids, ['e_one']); assert.equal(claims[1].cross_validated, true)
})
test('complete workflow uses only visitor keys, dispatches models by section, and returns a cited report', async () => {
  const provider = mockProvider(), original = globalThis.fetch
  globalThis.fetch = provider.fetch
  try {
    const report = await runBrowserResearch(task, config, () => {}, new AbortController().signal)
    assert.equal(report.sections.filter((s) => s.id !== 'collection-notes').length, 5)
    assert.equal(report.evidence.length, 2)
    assert.equal(report.experts.length, 4)
    assert.ok(report.sections[0].charts.length)
    assert.ok(provider.requests.some((r) => r.payload.model === 'core'))
    assert.ok(provider.requests.some((r) => r.payload.model === 'aux'))
    for (const request of provider.requests) {
      assert.equal(request.auth, `Bearer ${request.url.includes('search.provider') ? config.searchKey : config.modelKey}`)
      assert.ok(request.url.startsWith(config.searchBase) || request.url.startsWith(config.modelBase))
    }
    assert.ok(!JSON.stringify(report).includes(config.modelKey)); assert.ok(!JSON.stringify(report).includes(config.searchKey))
  } finally { globalThis.fetch = original }
})
test('no search results never produce a report', async () => {
  const provider = mockProvider({ empty: true }), original = globalThis.fetch
  globalThis.fetch = provider.fetch
  try { await assert.rejects(runBrowserResearch(task, config, () => {}, new AbortController().signal), /未搜索到/)
    assert.equal(provider.requests.filter((r) => r.url.includes('model.provider')).length, 1)
  } finally { globalThis.fetch = original }
})
test('a chapter with invented citations fails instead of publishing a report', async () => {
  const provider = mockProvider({ badCitation: true }), original = globalThis.fetch
  globalThis.fetch = provider.fetch
  try { await assert.rejects(runBrowserResearch(task, config, () => {}, new AbortController().signal), /不存在的引用/) }
  finally { globalThis.fetch = original }
})
