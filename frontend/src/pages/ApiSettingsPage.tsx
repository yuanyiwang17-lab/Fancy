import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Check, KeyRound, Trash2 } from 'lucide-react'
import { BROWSER_RESEARCH } from '../lib/deployment'
import { clearBrowserConfig, DEFAULT_CONFIG, getBrowserConfig, isRemembered, saveBrowserConfig, type BrowserConfig } from '../lib/browserConfig'
import { testBrowserConfig } from '../lib/browserResearch'

export default function ApiSettingsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [config, setConfig] = useState(getBrowserConfig)
  const [remember, setRemember] = useState(isRemembered)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const draft = typeof location.state?.draft === 'string' ? location.state.draft : ''
  function update(key: keyof BrowserConfig, value: string) { setConfig((c) => ({ ...c, [key]: value })); setMessage(''); setError('') }
  function save() {
    try { saveBrowserConfig(config, remember); setMessage('已保存，可以返回工作台发起调研。'); setError('') }
    catch (e) { setError(e instanceof Error ? e.message : '保存失败') }
  }
  async function validate() {
    setBusy(true); setMessage(''); setError('')
    try { await testBrowserConfig(config); setMessage('模型和搜索连接正常。验证不会自动保存，请点击保存。') }
    catch (e) { setError(e instanceof Error ? e.message : '验证失败') }
    finally { setBusy(false) }
  }
  const field = (key: keyof BrowserConfig, label: string, secret = false) => (
    <label className="flex min-w-0 flex-col gap-2 text-aux text-ink-2" key={key}>
      {label}
      <input type={secret ? 'password' : 'text'} value={config[key]} onChange={(e) => update(key, e.target.value)}
        autoComplete="off" spellCheck={false} className="min-w-0 w-full rounded-btn border border-line bg-bg px-3 py-2.5 text-ink outline-none focus:border-primary"
        placeholder={secret ? '填写你自己的 API Key' : DEFAULT_CONFIG[key]} />
    </label>
  )
  if (!BROWSER_RESEARCH) return <div className="p-8 text-ink-2">本机版本使用 backend/.env 配置 API。此页面用于公网浏览器版。</div>
  return <div className="mx-auto max-w-3xl px-6 py-8">
    <h1 className="flex items-center gap-2 font-serif text-h1 text-ink"><KeyRound size={24} /> API 设置</h1>
    <p className="mt-3 text-aux leading-relaxed text-ink-2">使用你自己的模型和搜索账户。密钥只保存于此浏览器，调用时直接发送到下方配置的 API 地址，不上传到 Fancy 或 GitHub。</p>
    <div className="mt-6 space-y-5 rounded-card border border-line bg-card p-5 shadow-card">
      {field('modelKey', '模型 API Key', true)}
      {field('modelBase', '模型 API 地址（OpenAI 兼容接口，需允许浏览器跨域）')}
      <div className="grid gap-4 sm:grid-cols-3">
        {field('fastModel', '任务规划模型')}{field('coreModel', '核心分析与写作模型')}{field('auxModel', '辅助写作与检查模型')}
      </div>
      <p className="text-tag leading-relaxed text-ink-3">模型名称需与你的账户权限一致，也可以全部填写同一个可用模型。章节最多并行调用两个请求。</p>
      {field('searchKey', '博查搜索 API Key', true)}
      {field('searchBase', '博查搜索 API 地址')}
      <label className="flex items-center gap-2 text-aux text-ink-2"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> 在这台设备记住密钥</label>
      <p className="text-tag text-ink-3">默认只保留在当前标签页会话。勾选后保存在浏览器本地，请勿在共用设备勾选。可随时清除。</p>
      {error && <p role="alert" className="text-aux text-red-600">{error}</p>}
      {message && <p role="status" className="flex items-start gap-2 text-aux text-primary-deep"><Check size={16} />{message}</p>}
      <div className="flex flex-wrap gap-3">
        <button disabled={busy} onClick={validate} className="rounded-btn border border-line px-4 py-2 text-aux text-ink-2 disabled:opacity-50">{busy ? '验证中…' : '验证连接'}</button>
        <button disabled={busy} onClick={save} className="rounded-btn bg-primary px-4 py-2 text-aux font-medium text-white disabled:opacity-50">保存配置</button>
        <button onClick={() => navigate('/', { state: { draft } })} className="rounded-btn bg-primary-tint px-4 py-2 text-aux text-primary-deep">返回工作台</button>
        <button disabled={busy} onClick={() => { clearBrowserConfig(); setConfig({ ...DEFAULT_CONFIG }); setRemember(false); setMessage('已清除本浏览器保存的 API 密钥。'); setError('') }} className="inline-flex items-center gap-1 rounded-btn px-3 py-2 text-aux text-ink-3"><Trash2 size={14} /> 清除密钥</button>
      </div>
      <p className="text-tag text-ink-3">验证会调用一次快速模型和一次搜索，消耗少量你自己的 API 额度。</p>
    </div>
    <div className="mt-5 text-aux leading-relaxed text-ink-2">报告保存在当前浏览器，可直接阅读、编辑和批注。清除网站数据会删除本地报告。生成时请保持页面打开；此版本尚未提供跨设备同步、公开报告分享和多人实时协作。</div>
  </div>
}
