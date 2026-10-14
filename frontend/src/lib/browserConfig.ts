export interface BrowserConfig {
  modelKey: string
  modelBase: string
  coreModel: string
  auxModel: string
  fastModel: string
  searchKey: string
  searchBase: string
}

export const DEFAULT_CONFIG: BrowserConfig = {
  modelKey: '', modelBase: 'https://open.bigmodel.cn/api/paas/v4',
  coreModel: 'glm-5.2', auxModel: 'glm-5.1', fastModel: 'glm-z1-air',
  searchKey: '', searchBase: 'https://api.bocha.cn/v1',
}
const SESSION_KEY = 'fancy.api.session.v1'
const REMEMBER_KEY = 'fancy.api.remember.v1'

export function getBrowserConfig(): BrowserConfig {
  try {
    const saved = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(REMEMBER_KEY)
    return { ...DEFAULT_CONFIG, ...(saved ? JSON.parse(saved) : {}) }
  } catch { return { ...DEFAULT_CONFIG } }
}

export function endpoint(base: string, path: string): string {
  const url = new URL(base.trim())
  if (url.username || url.password || url.search || url.hash) throw new Error('API 地址不能包含用户名、密码、查询参数或片段')
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
  if (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) throw new Error('API 地址必须使用 HTTPS')
  return `${url.href.replace(/\/+$/, '')}/${path}`
}

export function validateConfig(config: BrowserConfig) {
  if (!config.modelKey.trim() || !config.searchKey.trim()) throw new Error('请先填写模型 API Key 和博查搜索 API Key')
  if (![config.coreModel, config.auxModel, config.fastModel].every((s) => s.trim())) throw new Error('请填写三个板块使用的模型名称')
  endpoint(config.modelBase, 'chat/completions')
  endpoint(config.searchBase, 'web-search')
}

export function saveBrowserConfig(config: BrowserConfig, remember: boolean) {
  validateConfig(config)
  const clean = Object.fromEntries(Object.entries(config).map(([key, value]) => [key, value.trim()])) as unknown as BrowserConfig
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(clean))
  if (remember) localStorage.setItem(REMEMBER_KEY, JSON.stringify(clean))
  else localStorage.removeItem(REMEMBER_KEY)
  window.dispatchEvent(new Event('fancy-config-changed'))
}

export function clearBrowserConfig() {
  sessionStorage.removeItem(SESSION_KEY)
  localStorage.removeItem(REMEMBER_KEY)
  window.dispatchEvent(new Event('fancy-config-changed'))
}

export function isRemembered() { return !!localStorage.getItem(REMEMBER_KEY) }

export function isConfigured() {
  try { validateConfig(getBrowserConfig()); return true } catch { return false }
}
