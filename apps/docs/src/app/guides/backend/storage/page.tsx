import type { Metadata } from 'next'
import { CodeBlock } from '@/components/CodeBlock'
import { CodeTabs } from '@/components/CodeTabs'
import { Callout } from '@/components/Callout'
import { FAQ } from '@/components/FAQ'
import { RelatedDocs } from '@/components/RelatedDocs'

export const metadata: Metadata = {
  title: 'Choosing a Storage Driver — Backend Guide — Consenti',
  description:
    'Compare JSON, SQLite, PostgreSQL, MySQL, and MongoDB storage drivers and learn when to use each.',
  alternates: { canonical: '/guides/backend/storage' },
  openGraph: {
    title: 'Choosing a Storage Driver — Backend Guide — Consenti',
    description:
      'Compare JSON, SQLite, PostgreSQL, MySQL, and MongoDB storage drivers and learn when to use each.',
    url: 'https://consenti.dev/guides/backend/storage',
    siteName: 'Consenti Docs',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Choosing a Storage Driver — Backend Guide — Consenti',
    description:
      'Compare JSON, SQLite, PostgreSQL, MySQL, and MongoDB storage drivers and learn when to use each.',
    images: ['/og-image.jpg'],
  },
}

export default function BackendStorageGuide() {
  return (
    <div className="prose max-w-none">
      <h1>Choosing a Storage Driver</h1>
      <p className="lead">
        Consenti ships a zero-config JSON file storage driver that works out of the box. When you
        outgrow it, you can swap to SQLite, PostgreSQL, MySQL, or MongoDB with a single config
        change. This guide explains the trade-offs and gives you a config snippet for each.
      </p>

      <h2>Decision guide</h2>

      <div className="not-prose overflow-x-auto my-6">
        <table className="min-w-full text-sm border border-slate-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <thead className="bg-slate-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-gray-200">
                Driver
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-gray-200">
                Node req.
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-gray-200">
                Extra install
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-gray-200">
                Best for
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
            {[
              ['json', '≥ 20', 'None', 'Development, small/personal sites'],
              [
                'node:sqlite',
                '≥ 22.5',
                'None (built-in)',
                'Single-server production, low/medium traffic',
              ],
              [
                'node-sqlite3-wasm',
                '≥ 20',
                'npm install node-sqlite3-wasm',
                'Node 20/21, no C++ toolchain',
              ],
              [
                'better-sqlite3',
                '≥ 20',
                'npm install better-sqlite3',
                'Highest-performance SQLite, needs C++ toolchain',
              ],
              [
                'postgresql',
                '≥ 20',
                'npm install pg',
                'Multi-server production, high traffic, existing PG infra',
              ],
              [
                'mysql',
                '≥ 20',
                'npm install mysql2',
                'Multi-server production, existing MySQL infra',
              ],
              [
                'mongodb',
                '≥ 20',
                'npm install mongodb',
                'Document-oriented workloads, existing Mongo infra',
              ],
            ].map(([driver, node, install, best], i) => (
              <tr
                key={driver}
                className={
                  i % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-slate-50 dark:bg-gray-800'
                }
              >
                <td className="px-4 py-3 font-mono text-xs text-brand-600 dark:text-brand-400">
                  {driver}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-gray-300">{node}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-gray-300">{install}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-gray-300">{best}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>JSON (default)</h2>
      <p>
        No installation, no setup. Consenti writes a <code>consenti-data.json</code> file to the
        configured <code>storage.path</code>. Suitable for development and deployments with very low
        write volume.
      </p>

      <CodeBlock
        lang="typescript"
        code={`createConsenti({
  storage: { driver: 'json', path: './consenti-data' },
  // ...
})`}
      />

      <Callout type="warning">
        JSON storage reads and writes the entire file on every operation. It is not suitable for
        concurrent access or high write volume. Migrate to SQLite or a database before going to
        production.
      </Callout>

      <h2>SQLite</h2>
      <p>
        SQLite runs in-process — no separate database server, no connection string. It handles
        hundreds of writes per second and is a great production choice for single-server
        deployments.
      </p>

      <CodeTabs
        tabs={[
          {
            label: 'node:sqlite (Node 22.5+)',
            lang: 'typescript',
            code: `// No extra install — uses Node's built-in SQLite
createConsenti({
  storage: { driver: 'node:sqlite', path: './consenti-data' },
})`,
          },
          {
            label: 'node-sqlite3-wasm (Node 20+)',
            lang: 'typescript',
            code: `// npm install node-sqlite3-wasm
// Pure WASM — no C++ compilation, works on Alpine/musl/ARM
createConsenti({
  storage: { driver: 'node-sqlite3-wasm', path: './consenti-data' },
})`,
          },
          {
            label: 'better-sqlite3 (fastest)',
            lang: 'typescript',
            code: `// npm install better-sqlite3
// Native binary — fastest option, needs a C++ toolchain
createConsenti({
  storage: { driver: 'better-sqlite3', path: './consenti-data' },
})`,
          },
        ]}
      />

      <h2>PostgreSQL</h2>
      <p>
        Use PostgreSQL when you need multi-server deployments, an existing PG infrastructure, or
        higher write throughput than SQLite can provide. Consenti uses <code>pg</code> (the{' '}
        <code>pg</code> package) as the driver.
      </p>

      <CodeBlock
        lang="typescript"
        code={`// npm install pg
createConsenti({
  storage: {
    driver: 'postgresql',
    uri: process.env.DATABASE_URL,  // e.g. postgresql://user:pass@host:5432/consenti
    database: 'consenti',           // optional if included in uri
    path: './consenti-data',        // for profile files (still written locally)
  },
})`}
      />

      <h2>MySQL</h2>

      <CodeBlock
        lang="typescript"
        code={`// npm install mysql2
createConsenti({
  storage: {
    driver: 'mysql',
    uri: process.env.DATABASE_URL,  // e.g. mysql://user:pass@host:3306/consenti
    database: 'consenti',
    path: './consenti-data',
  },
})`}
      />

      <h2>MongoDB</h2>

      <CodeBlock
        lang="typescript"
        code={`// npm install mongodb
createConsenti({
  storage: {
    driver: 'mongodb',
    uri: process.env.MONGODB_URI,   // e.g. mongodb://localhost:27017/consenti
    database: 'consenti',
    path: './consenti-data',
  },
})`}
      />

      <Callout type="tip">
        All config values can also be set via environment variables: <code>CONSENTI_DB_DRIVER</code>
        , <code>CONSENTI_DB_URI</code>, <code>CONSENTI_DB_DATABASE</code>, etc. Code config takes
        precedence over env vars.
      </Callout>

      <RelatedDocs
        items={[
          {
            href: '/docs/api/advanced-configuration/',
            label: 'Advanced Configuration',
            desc: 'Full storage options reference, including s3Api for profile file syncing',
          },
          {
            href: '/docs/api/installation/',
            label: 'Installation',
            desc: 'Per-framework setup requirements',
          },
        ]}
      />

      <h2>Frequently asked questions</h2>
      <FAQ
        items={[
          {
            question: "What's the difference between node:sqlite and better-sqlite3?",
            answer: (
              <>
                <ul className="m-0 pl-4 space-y-1">
                  <li>
                    <strong>node:sqlite</strong> — built into Node 22.5+, zero install, slightly
                    lower raw throughput than better-sqlite3 but perfectly adequate for most
                    deployments.
                  </li>
                  <li>
                    <strong>better-sqlite3</strong> — native binary compiled against your
                    system&apos;s SQLite, typically 20–40% faster, but requires a C++ toolchain and
                    may fail on Alpine/musl/ARM without extra configuration.
                  </li>
                </ul>
                <p className="m-0 mt-2">
                  Use <code>node:sqlite</code> if you&apos;re on Node 22+ — zero friction, no
                  compilation. Use <code>better-sqlite3</code> only if you&apos;ve benchmarked and
                  need the extra throughput.
                </p>
              </>
            ),
          },
          {
            question: 'Can I migrate from JSON to SQLite without losing data?',
            answer: (
              <p className="m-0">
                Consenti does not currently ship an automated migration tool between storage
                drivers. For development data, the simplest approach is to change the driver config
                and let Consenti create a fresh database — the initial admin seed and default
                profile run again automatically. For production data, export consent records from
                the JSON file and import them into the new database using the admin API or a one-off
                script.
              </p>
            ),
          },
          {
            question: 'Do I need to create the database tables manually?',
            answer: (
              <p className="m-0">
                No. Consenti runs all migrations automatically on start. For SQL databases, it
                creates the required tables and indexes on first start. Subsequent starts only run
                pending migrations.
              </p>
            ),
          },
          {
            question: 'Where are profile JSON files stored when using a SQL/Mongo driver?',
            answer: (
              <p className="m-0">
                Profile JSON files (banner/modal content per locale) are always written to the local
                filesystem at <code>storage.path/profiles/</code> — regardless of which database
                driver is configured. The database stores metadata; the locale JSON files are served
                statically (zero DB on the hot path). Configure <code>s3Api</code> to also sync
                profile files to S3 for CDN-scale serving.
              </p>
            ),
          },
        ]}
      />
    </div>
  )
}
