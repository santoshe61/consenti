import { apiFetch } from './client'
import type { OverviewStats, CategoryStats, TimelineEntry, CountryStat, GpcStats } from '@consenti/types'

export const statsApi = {
  overview: () => apiFetch<OverviewStats>('/stats/overview'),
  categories: () => apiFetch<CategoryStats>('/stats/categories'),
  timeline: (days = 30) => apiFetch<TimelineEntry[]>(`/stats/timeline?days=${days}`),
  countries: () => apiFetch<CountryStat[]>('/stats/countries'),
  gpc: () => apiFetch<GpcStats>('/stats/gpc'),
}
