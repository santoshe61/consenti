import { createServer } from 'node:http'
import { createConsenti } from '@consenti/api'

const PORT = Number(process.env.PORT ?? 3000)
const BASE_PATH = process.env.CONSENTI_BASE_PATH ?? '/consenti'

// createConsenti() reads every CONSENTI_* environment variable itself as a fallback default
// for any config field not passed explicitly — see apps/api/README.md's "Environment
// Variables" table for the full list. Nothing needs mapping here.
const consenti = createConsenti({})

await consenti.ready

const server = createServer(consenti.handler)
server.listen(PORT, () => {
  console.log(`Consenti listening on :${PORT}`)
  console.log(`Admin dashboard → http://localhost:${PORT}${BASE_PATH}/`)
  console.log(`REST API        → http://localhost:${PORT}${BASE_PATH}/api/v1/`)
})

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, async () => {
    await consenti.destroy()
    server.close(() => process.exit(0))
  })
}
