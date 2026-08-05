import { color, statusLabel } from '@consenti/utils'
import type { ComboOutcome, FunctionalCheck } from './types.js'

/** Streamed one line per result, as it completes — see `RunHooks` in types.ts. Each
 * message is built from colored segments (status / jurisdiction+state / detail) rather than
 * one flat color, so a scrolling terminal stays scannable across a full matrix run. */
export function logVisualOutcome(outcome: ComboOutcome): void {
  const label = `${color.cyan(outcome.combo.jurisdiction)}${color.dim(' / ')}${color.magenta(outcome.combo.state)}`
  switch (outcome.status) {
    case 'pass':
      console.log(`${statusLabel('pass')} ${label}`)
      return
    case 'new-baseline':
      console.log(`${statusLabel('new-baseline')} ${label}  ${color.dim(outcome.outputPath)}`)
      return
    case 'not-applicable':
      console.log(`${statusLabel('not-applicable')} ${label}  ${color.gray('— ' + outcome.reason)}`)
      return
    case 'error':
      console.log(`${statusLabel('error')} ${label}  ${color.red('— ' + outcome.message)}`)
      return
    case 'fail':
      console.log(
        `${statusLabel('fail')} ${label}  ${color.yellow(`${(outcome.diffRatio * 100).toFixed(2)}% pixels differ`)} ` +
        `${color.dim(`(diff: ${outcome.diffPath})`)}`,
      )
      return
  }
}

export function logFunctionalCheck(check: FunctionalCheck): void {
  const state = check.state ? `${color.dim(' / ')}${color.magenta(check.state)}` : ''
  const label = `${color.cyan(check.jurisdiction)}${state}${color.dim(' — ')}${color.blue(check.kind)}${color.dim(':')}${check.target}`
  switch (check.status) {
    case 'pass':
      console.log(`${statusLabel('pass')} ${label}`)
      return
    case 'not-applicable':
      console.log(`${statusLabel('not-applicable')} ${label}  ${color.gray(check.message ?? '')}`)
      return
    case 'error':
      console.log(`${statusLabel('error')} ${label}  ${color.red(check.message ?? '')}`)
      return
    case 'fail':
      console.log(`${statusLabel('fail')} ${label}  ${color.yellow(check.message ?? '')}`)
      return
  }
}
