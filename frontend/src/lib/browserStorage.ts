import type { Report, ReportCard, DashboardStats, EvidenceQueryResp } from '../types'

export interface BrowserTask {
  id: string; query: string; mode: string; reportId?: string; status: 'ready' | 'running' | 'done' | 'error'
}
let connection: Promise<IDBDatabase> | undefined
function database(): Promise<IDBDatabase> {
  if (!connection) connection = new Promise((resolve, reject) => {
    const request = indexedDB.open('fancy.research.v1', 1)
    request.onupgradeneeded = () => {
      request.result.createObjectStore('reports', { keyPath: 'id' })
      request.result.createObjectStore('tasks', { keyPath: 'id' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => { connection = undefined; reject(new Error('浏览器存储不可用，请检查隐私模式或网站存储权限')) }
  })
  return connection
}
async function transact<T>(store: string, mode: IDBTransactionMode, action: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await database()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode)
    const request = action(tx.objectStore(store))
    tx.oncomplete = () => resolve(request.result)
    tx.onerror = tx.onabort = () => reject(new Error('保存失败，请检查浏览器存储空间'))
  })
}
export async function putTask(task: BrowserTask) { await transact('tasks', 'readwrite', (s) => s.put(task)) }
export function getTask(id: string): Promise<BrowserTask | undefined> { return transact('tasks', 'readonly', (s) => s.get(id)) }
export async function putReport(report: Report) { await transact('reports', 'readwrite', (s) => s.put(report)); window.dispatchEvent(new Event('fancy-report-changed')) }
export function getReport(id: string): Promise<Report | undefined> { return transact('reports', 'readonly', (s) => s.get(id)) }
export function allReports(): Promise<Report[]> { return transact('reports', 'readonly', (s) => s.getAll()) }
export async function reportCards(): Promise<ReportCard[]> {
  return (await allReports()).sort((a, b) => b.created_at.localeCompare(a.created_at)).map((r) => ({
    id: r.id, report_id: r.id, title: r.title, subtitle: r.subtitle, query: r.query || r.title,
    brands: r.brands || [], experts: r.experts, cover_image: r.cover_image,
    evidence_count: r.evidence.length, claim_count: r.claims.length,
    high_conf_count: r.claims.filter((c) => c.confidence === 'high').length, created_at: r.created_at,
  }))
}
export async function dashboard(): Promise<DashboardStats> {
  const reports = await allReports()
  const evidence = reports.flatMap((r) => r.evidence)
  const claims = reports.flatMap((r) => r.claims)
  const platforms: Record<string, number> = {}, brands: Record<string, number> = {}
  for (const e of evidence) { platforms[e.source_type] = (platforms[e.source_type] || 0) + 1; if (e.brand) brands[e.brand] = (brands[e.brand] || 0) + 1 }
  return { reports: reports.length, evidence_total: evidence.length, claim_total: claims.length,
    high_conf_total: claims.filter((c) => c.confidence === 'high').length,
    avg_evidence_per_report: reports.length ? evidence.length / reports.length : 0,
    fact_accuracy: claims.length ? Math.round(claims.filter((c) => c.cross_validated).length / claims.length * 100) : 0,
    platform_distribution: platforms, brand_distribution: brands,
    research_cards: reports.map((r) => ({ id: r.id, title: r.title, query: r.query || r.title,
      brands: r.brands || [], evidence_count: r.evidence.length, claim_count: r.claims.length,
      high_conf_count: r.claims.filter((c) => c.confidence === 'high').length, created_at: r.created_at })),
  }
}
export async function evidenceQuery(params?: { brand?: string; source_type?: string; min_cred?: number }): Promise<EvidenceQueryResp> {
  const items = (await allReports()).flatMap((r) => r.evidence.map((e) => ({ ...e, report_id: r.id, domain: e.domain || '', brand: e.brand || '' }))).filter((e) =>
    (!params?.brand || e.brand === params.brand) && (!params?.source_type || e.source_type === params.source_type) && e.credibility >= (params?.min_cred || 0))
  const by_type: Record<string, number> = {}, by_brand: Record<string, number> = {}
  for (const e of items) { by_type[e.source_type] = (by_type[e.source_type] || 0) + 1; if (e.brand) by_brand[e.brand] = (by_brand[e.brand] || 0) + 1 }
  return { items, facets: { total: items.length, by_type, by_brand } }
}
