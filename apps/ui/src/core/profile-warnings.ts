import type { ResolvedProfile, MainBanner } from '../types'

// Equal-prominence for refusal is mandated by CNIL/EDPB cookie-banner guidance and GDPR Art. 7(3)
// ("as easy to withdraw as to give"); a banner that can only accept is the failure mode a
// `'*': null` button wipe makes easy to hit by accident.
function canOnlyAccept(banner: MainBanner): boolean {
  const buttons = Object.values(banner.buttons ?? {})
  const grantsAll = buttons.some(b => b.action === 'custom' && b.cookies === '*')
  const hasRefusalPath = buttons.some(b => b.action === 'manage' || (b.action === 'custom' && b.cookies === '!'))
  return grantsAll && !hasRefusalPath
}

/** Names of banners (`mainBanner`/`gpcBanner`) that offer "accept all" with no reject or manage path. */
export function findAcceptOnlyBanners(profile: ResolvedProfile): string[] {
  const names: string[] = []
  if (canOnlyAccept(profile.mainBanner)) names.push('mainBanner')
  if (profile.gpcBanner && canOnlyAccept(profile.gpcBanner)) names.push('gpcBanner')
  return names
}
