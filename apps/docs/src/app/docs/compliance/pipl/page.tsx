import type { Metadata } from 'next'
import { CodeBlock } from '@/components/CodeBlock'
import { Callout } from '@/components/Callout'

export const metadata: Metadata = {
  title: 'PIPL Compliance Guide (China 2021)',
  description:
    "PIPL compliance guide for Consenti — China's Personal Information Protection Law, enforced by the Cyberspace Administration of China.",
  alternates: { canonical: '/docs/compliance/pipl' },
  openGraph: {
    title: 'PIPL Compliance Guide (China 2021)',
    description:
      "PIPL compliance guide for Consenti — China's Personal Information Protection Law, enforced by the Cyberspace Administration of China.",
    url: 'https://consenti.dev/docs/compliance/pipl',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PIPL Compliance Guide (China 2021)',
    description:
      "PIPL compliance guide for Consenti — China's Personal Information Protection Law, enforced by the Cyberspace Administration of China.",
    images: ['/og-image.jpg'],
  },
}

export default function PIPLPage() {
  return (
    <div className="prose max-w-none">
      <h1>PIPL Compliance Guide (China)</h1>
      <Callout type="info">
        <strong>Compliance group:</strong> <code>opt-in-china</code> — China-specific opt-in with
        separate consent required per processing purpose and strict cross-border transfer rules. Use{' '}
        <code>compliance: {"{ type: 'opt-in-china' }"}</code> in your <code>ConsentiSetup</code>{' '}
        config.
      </Callout>
      <p>
        China's <strong>Personal Information Protection Law (PIPL)</strong> — effective 1 November
        2021 — is China's first comprehensive personal data protection law and is enforced by the{' '}
        <strong>Cyberspace Administration of China (CAC)</strong>. PIPL applies to the processing of
        personal information of individuals located in China, regardless of where the processing
        entity is based.
      </p>

      <h2>Official references</h2>
      <ul>
        <li>
          <a
            href="http://www.npc.gov.cn/npc/c30834/202108/a8c4e3672c74491a80b53a172bb753fe.shtml"
            target="_blank"
            rel="noopener noreferrer"
          >
            Personal Information Protection Law — NPC full text (Chinese)
          </a>
        </li>
        <li>
          <a href="https://www.cac.gov.cn/" target="_blank" rel="noopener noreferrer">
            Cyberspace Administration of China (CAC)
          </a>
        </li>
        <li>
          <a
            href="https://www.cac.gov.cn/2022-06/24/c_1657193454901740.htm"
            target="_blank"
            rel="noopener noreferrer"
          >
            Measures on Security Assessment of Cross-Border Data Transfer (2022)
          </a>
        </li>
      </ul>

      <h2>Key requirements and how Consenti meets them</h2>
      <table>
        <thead>
          <tr>
            <th>Requirement</th>
            <th>Implementation</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Separate consent per purpose</td>
            <td>
              Per-cookie granularity — each cookie purpose has its own consent toggle and stored
              value
            </td>
          </tr>
          <tr>
            <td>Informed consent</td>
            <td>
              <code>htmlText</code> on each category describes the processing purpose clearly
            </td>
          </tr>
          <tr>
            <td>Explicit opt-in</td>
            <td>
              All non-mandatory cookies default to <code>'denied'</code> until actively granted
            </td>
          </tr>
          <tr>
            <td>Right to withdraw</td>
            <td>
              Consent can be revoked at any time via <code>widget.showModal()</code> or the API
            </td>
          </tr>
          <tr>
            <td>Cross-border transfer disclosure</td>
            <td>
              Add cross-border transfer information to the relevant category's <code>htmlText</code>
            </td>
          </tr>
          <tr>
            <td>Records kept</td>
            <td>
              Immutable <code>consent_history</code> table; <code>audit_logs</code> for admin
              actions
            </td>
          </tr>
        </tbody>
      </table>

      <h2>Consent model</h2>
      <p>
        PIPL requires <strong>informed, voluntary, specific, and unambiguous</strong> consent before
        collecting or processing personal information. Unlike GDPR, PIPL does not recognise
        "legitimate interest" as a lawful basis for processing personal information — consent or
        another listed basis must be obtained.
      </p>

      <h2>Cross-border data transfers</h2>
      <p>PIPL imposes strict requirements on cross-border transfers of personal information:</p>
      <ul>
        <li>
          Transfers must pass a <strong>security assessment</strong> by the CAC (for critical data
          or large volumes)
        </li>
        <li>
          Processors must obtain a <strong>personal information protection certification</strong>{' '}
          from a CAC-approved body
        </li>
        <li>
          A <strong>standard contract</strong> must be signed with the overseas recipient
        </li>
        <li>User consent must explicitly cover cross-border transfer</li>
      </ul>
      <Callout type="warning">
        When collecting personal information that will be transferred outside China, disclose the
        overseas recipient's name, country, and processing purpose in your profile's category
        descriptions. Users must explicitly consent to cross-border transfer.
      </Callout>

      <h2>Children's data</h2>
      <p>
        PIPL requires separate parental consent for personal information of children under 14. Use
        the <code>compliance.ageGate</code> config option to enable the age gate:
      </p>
      <CodeBlock
        lang="ts"
        code={`new ConsentiSetup({
  compliance: {
    type: 'opt-in-china',
    ageGate: {
      enabled: true,
      minimumAge: 14,             // PIPL threshold: under 14 requires parental consent
      requireParentalConsent: true,
    },
  },
})`}
      />

      <h2>Consent configuration example</h2>
      <CodeBlock
        lang="ts"
        code={`import { ConsentiSetup } from '@consenti/ui'

new ConsentiSetup({
  compliance: { type: 'opt-in-china' },
  profileOverride: {
    cookies: {
      necessary: {},
      analytics: {},
      marketing: {},
    },
    expiryDays: 365,
    mainBanner: {
      position: 'bottom',
      heading: '个人信息保护声明',
      htmlText: '我们使用Cookie改善您的体验，跨境传输数据需要您的明确同意。',
      buttons: {
        'accept-all': { text: '全部接受', style: 'primary',   action: 'custom', cookies: '*' },
        'reject-optional': { text: '拒绝可选', style: 'secondary', action: 'custom', cookies: '!' },
        'customize': { text: '自定义',   style: 'secondary', action: 'manage' },
      },
    },
    preferenceModal: {
      heading: 'Cookie偏好设置',
      subheading: '请选择您同意我们使用的Cookie类型。',
      showClose: true,
      overlayOpacity: 50,
      buttons: {
        'save-preferences': { text: '保存设置', style: 'primary', action: 'submit' },
        'accept-all': { text: '全部接受', style: 'primary', action: 'custom', cookies: '*' },
      },
      categories: {
        necessary: {
          heading: '必要Cookie',
          htmlText: '网站正常运行所必需，无法关闭。',
          legalBasis: 'mandatory',
          cookies: ['necessary'],
        },
        analytics: {
          heading: '分析Cookie',
          htmlText: '帮助我们了解访客使用网站的方式。数据可能传输至境外服务器（美国），受当地法律管辖。',
          legalBasis: 'consent',
          cookies: ['analytics'],
        },
        marketing: {
          heading: '营销Cookie',
          htmlText: '用于投放个性化广告。数据传输至第三方广告平台，可能存储于中国境外。',
          legalBasis: 'consent',
          cookies: ['marketing'],
        },
      },
    },
  },
})`}
      />

      <h2>Enforcement</h2>
      <p>
        The CAC and local cybersecurity bureaus enforce PIPL. Penalties include fines of up to 50
        million RMB or 5% of annual revenue, suspension of business, and revocation of licences.
        Foreign companies targeting Chinese users are subject to PIPL even if they have no physical
        presence in China.
      </p>
    </div>
  )
}
