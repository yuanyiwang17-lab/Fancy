export const PUBLIC_READ_ONLY = import.meta.env.VITE_PUBLIC_READ_ONLY === 'true'

export const publicAsset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`
