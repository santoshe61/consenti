type ConsoleLevel = 'info' | 'log' | 'warning' | 'error'

let _levels: ConsoleLevel[] = ['error']

export function initConsole(levels: ConsoleLevel[]): void {
  _levels = levels
}

export const logger = {
  info:  (...args: unknown[]) => { if (_levels.includes('info'))    console.info('[Consenti]',  ...args) },
  log:   (...args: unknown[]) => { if (_levels.includes('log'))     console.log('[Consenti]',   ...args) },
  warn:  (...args: unknown[]) => { if (_levels.includes('warning')) console.warn('[Consenti]',  ...args) },
  error: (...args: unknown[]) => { if (_levels.includes('error'))   console.error('[Consenti]', ...args) },
}
