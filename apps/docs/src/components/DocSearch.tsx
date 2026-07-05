'use client'

import { DocSearch as AlgoliaDocSearch } from '@docsearch/react'

export function DocSearch() {
  return (
    <AlgoliaDocSearch
      appId={process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!}
      apiKey={process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY!}
      indexName={process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME ?? 'Consenti Doc'}
    />
  )
}
