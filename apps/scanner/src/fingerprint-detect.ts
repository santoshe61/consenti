import type { Page } from 'playwright'

const RECORDER_GLOBAL = '__consentiScannerFingerprintCalls'

/** Injected via `SessionOptions.initScripts` (runs before any page script, same mechanism the
 * GPC-stub tests in `apps/test-runner` use). Monkey-patches the canvas/font/audio APIs most
 * commonly abused for device fingerprinting, recording each call instead of blocking it — this
 * tool observes, it doesn't interfere with the page under test. Kept as a plain string (not a
 * function `.toString()`'d) so it has zero dependency on this module's own scope/imports, which
 * wouldn't exist in the injected page context anyway. */
export const FINGERPRINT_INIT_SCRIPT = `
(() => {
  window.${RECORDER_GLOBAL} = [];
  const record = (technique) => { window.${RECORDER_GLOBAL}.push({ technique, url: document.currentScript ? document.currentScript.src : null }); };

  try {
    const proto = CanvasRenderingContext2D.prototype;
    const origGetImageData = proto.getImageData;
    proto.getImageData = function (...args) { record('canvas'); return origGetImageData.apply(this, args); };
    const origToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function (...args) { record('canvas'); return origToDataURL.apply(this, args); };
  } catch (e) {}

  try {
    if (window.OfflineAudioContext || window.webkitOfflineAudioContext) {
      const Ctx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      const origStart = Ctx.prototype.startRendering;
      if (origStart) {
        Ctx.prototype.startRendering = function (...args) { record('audio'); return origStart.apply(this, args); };
      }
    }
  } catch (e) {}

  try {
    if (document.fonts && document.fonts.check) {
      const origCheck = document.fonts.check.bind(document.fonts);
      let checkCount = 0;
      document.fonts.check = function (...args) {
        checkCount++;
        // A handful of individual checks is normal (e.g. an icon-font availability test);
        // dozens in a row is the enumeration pattern fingerprinting libraries use.
        if (checkCount === 20) record('font-enumeration');
        return origCheck.apply(this, args);
      };
    }
  } catch (e) {}
})();
`

export interface RawFingerprintCall {
  technique: 'canvas' | 'font-enumeration' | 'audio'
  url: string | null
}

export async function readFingerprintSignals(page: Page): Promise<RawFingerprintCall[]> {
  try {
    return await page.evaluate(
      key => (window as unknown as Record<string, RawFingerprintCall[]>)[key] ?? [],
      RECORDER_GLOBAL
    )
  } catch {
    return []
  }
}
