import Link from 'next/link'

export type ComplianceTier = 'maintained' | 'supported' | 'in-development' | 'partial' | 'routing-only'

interface ComplianceTierBadgeProps {
  tier: ComplianceTier
}

export const COMPLIANCE_TIER_LABELS: Record<ComplianceTier, string> = {
  'maintained': 'Maintained',
  'supported': 'Supported',
  'in-development': 'In development',
  'partial': 'Partial',
  'routing-only': 'Routing-only',
}

export const COMPLIANCE_TIER_STYLES: Record<ComplianceTier, string> = {
  'maintained': 'bg-green-50 border-green-300 text-green-800',
  'supported': 'bg-blue-50 border-blue-300 text-blue-800',
  'in-development': 'bg-amber-50 border-amber-300 text-amber-800',
  'partial': 'bg-amber-50 border-amber-300 text-amber-800',
  'routing-only': 'bg-slate-50 border-slate-300 text-slate-700',
}

/**
 * Surfaced on each regulation page's own header — status reflects how confidently Consenti
 * tracks ongoing legal changes for that regulation, not just whether code exists. Links to the
 * tier definitions and full regulation-to-tier table on the Jurisdiction Coverage Map.
 */
export function ComplianceTierBadge({ tier }: ComplianceTierBadgeProps) {
  return (
    <div className="not-prose -mt-2 mb-4">
      <Link
        href="/docs/compliance/jurisdiction-coverage-map/#compliance-tiers"
        className={`inline-flex items-center gap-1.5 text-xs font-medium border rounded-full px-2.5 py-1 no-underline hover:opacity-80 ${COMPLIANCE_TIER_STYLES[tier]}`}
      >
        {COMPLIANCE_TIER_LABELS[tier]}
      </Link>
    </div>
  )
}
