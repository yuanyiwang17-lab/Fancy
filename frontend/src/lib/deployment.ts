export const BROWSER_RESEARCH = import.meta.env.VITE_BROWSER_RESEARCH === 'true'
export const PUBLIC_READ_ONLY = !BROWSER_RESEARCH && import.meta.env.VITE_PUBLIC_READ_ONLY === 'true'
export const STATIC_SITE = BROWSER_RESEARCH || PUBLIC_READ_ONLY

export const publicAsset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`
