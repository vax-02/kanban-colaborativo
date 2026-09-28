import { create } from 'zustand'
import type { MemberDto } from '../lib/types'

export type ModalState =
  | { type: 'collaborators'; boardId?: string }
  | { type: 'createBoard' }
  | { type: 'editBoard'; boardId: string }
  | { type: 'boardMembers'; boardId: string }
  | { type: 'task'; taskId: string; columnId: string; boardId: string }
  | { type: 'filters' }
  | { type: 'activity' }
  | { type: 'labels'; boardId: string }
  | { type: 'deleteBoard'; boardId: string }
  | { type: 'archiveBoard'; boardId: string; boardNombre: string; boardColor: string }
  | { type: 'removeMember'; boardId: string; boardNombre: string; member: MemberDto }
  | null

type UiStore = {
  modal: ModalState
  openModal: (m: NonNullable<ModalState>) => void
  closeModal: () => void
}

export const useUiStore = create<UiStore>((set) => ({
  modal: null,
  openModal: (m) => set({ modal: m }),
  closeModal: () => set({ modal: null }),
}))