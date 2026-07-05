declare module '*.css' {
  const content: Record<string, string>
  export default content
}

declare module '@docsearch/css'

interface Grecaptcha {
  ready(callback: () => void): void
  execute(siteKey: string, options: { action: string }): Promise<string>
}

interface Window {
  grecaptcha: Grecaptcha
}
