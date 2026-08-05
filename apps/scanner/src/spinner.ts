import { color } from './log.js'

const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
const TICK_MS = 80

/** A scrolling log of completed steps with one still-animating line for whatever's running right
 * now — the only way to tell a multi-minute scan (page loads, three consent states per page,
 * screenshots) apart from a hung process, since nothing else was printed until the whole scan
 * finished. Each call to `update()` finalizes the *previous* line as a permanent, non-animating
 * entry (so the history of what already happened stays visible) before starting a new spinner
 * line for the next one — earlier versions overwrote the previous message entirely, which made it
 * impossible to tell what the scan had already gotten through.
 *
 * Ticks on its own timer so it stays visibly alive even during a single long await (e.g. a slow
 * `page.goto()`) with no new progress message in between.
 *
 * Falls back to plain appended lines when stdout isn't a TTY (piped output, CI logs) — carriage-
 * return redraws only make sense on an interactive terminal; in a log file they'd just corrupt
 * the output. */
export class Spinner {
  private frame = 0
  private text = ''
  private started = false
  private timer: ReturnType<typeof setInterval> | null = null
  private readonly interactive = process.stdout.isTTY === true

  start(text: string): void {
    this.text = text
    this.started = true
    if (!this.interactive) {
      console.log(text)
      return
    }
    this.render()
    this.timer = setInterval(() => {
      this.frame++
      this.render()
    }, TICK_MS)
  }

  /** Finalizes the outgoing line as a permanent, completed entry, then starts a new live spinner
   * line for `text`. */
  update(text: string): void {
    if (!this.started) {
      this.start(text)
      return
    }
    if (!this.interactive) {
      console.log(text)
      this.text = text
      return
    }
    process.stdout.write(`\r\x1b[K${color.green('✓')} ${this.text}\n`)
    this.text = text
    this.render()
  }

  stop(finalText?: string): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    if (this.interactive) {
      process.stdout.write('\r\x1b[K')
      if (finalText) console.log(finalText)
      else if (this.text) console.log(`${color.green('✓')} ${this.text}`)
    } else if (finalText) {
      console.log(finalText)
    }
  }

  private render(): void {
    const frame = FRAMES[this.frame % FRAMES.length] as string
    process.stdout.write(`\r\x1b[K${color.cyan(frame)} ${this.text}`)
  }
}
