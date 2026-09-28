import { create } from 'zustand'
import { EMPTY_FILTERS, type TaskFilters } from '../lib/filters'

type FiltersStore = {
  filters: TaskFilters
  setFilters: (boardId: string, patch: Omit<TaskFilters, 'boardId'>) => void
  clear: () => void
}

export const useFiltersStore = create<FiltersStore>((set) => ({
  filters: EMPTY_FILTERS,
  setFilters: (boardId, patch) => set({ filters: { boardId, ...patch } }),
  clear: () => set({ filters: EMPTY_FILTERS }),
}))