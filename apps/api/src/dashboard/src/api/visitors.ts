import { apiFetch } from './client'
import type { Visitor } from '@consenti/types'

export const visitorsApi = {
  list: (params?: { page?: number }) => {
    const q = new URLSearchParams()
    if (params?.page) q.set('page', String(params.page))
    return apiFetch<Visitor[]>(`/visitors?${q}`)
  },
}
