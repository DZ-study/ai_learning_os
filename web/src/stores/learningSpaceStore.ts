
import type {
  CardPosition,
  LearningCard,
} from '@/types/learning-space'
import { create } from 'zustand'

interface LearningSpaceState {
  /**
   * Card data shared by the canvas and sidebar.
   */
  cards: LearningCard[]

  /**
   * Currently selected card.
   */
  selectedCardId: string | null

  /**
   * Add a card.
   */
  addCard: (card: LearningCard) => void

  /**
   * Delete a card.
   */
  removeCard: (id: string) => void

  /**
   * Update a card from the user.
   */
  updateCardFromUser: (
    id: string,
    updates: Partial<Pick<LearningCard, 'title' | 'description'>>
  ) => void

  /**
   * Update a card from the agent.
   */
  updateCardFromAgent: (
    id: string,
    updates: Partial<Pick<LearningCard, 'title' | 'description' | 'status'>>
  ) => void

  /**
   * Update the canvas position.
   */
  updateCardPosition: (
    id: string,
    position: CardPosition
  ) => void

  /**
   * Select a card.
   */
  selectCard: (id: string | null) => void
}

export const useLearningSpaceStore =
  create<LearningSpaceState>((set) => ({
    cards: [],
    selectedCardId: null,

    addCard: (card) =>
      set((state) => ({
        cards: [...state.cards, card],
      })),

    removeCard: (id) =>
      set((state) => ({
        cards: state.cards.filter(
          (card) => card.id !== id
        ),
        selectedCardId:
          state.selectedCardId === id
            ? null
            : state.selectedCardId,
      })),

    updateCardFromUser: (id, updates) =>
      set((state) => ({
        cards: state.cards.map((card) => {
          if (card.id !== id) {
            return card
          }

          return {
            ...card,
            ...updates,
            source: 'user',
            fieldSource: {
              ...card.fieldSource,
              ...(updates.title !== undefined
                ? { title: 'user' as const }
                : {}),
              ...(updates.description !== undefined
                ? { description: 'user' as const }
                : {}),
            },
          }
        }),
      })),

    updateCardFromAgent: (id, updates) =>
      set((state) => ({
        cards: state.cards.map((card) => {
          if (card.id !== id) {
            return card
          }

          const nextCard = {
            ...card,
          }

          /**
           * When the agent updates title, preserve user edits.
           */
          if (
            updates.title !== undefined &&
            card.fieldSource?.title !== 'user'
          ) {
            nextCard.title = updates.title
          }

          /**
           * When the agent updates description, preserve user edits.
           */
          if (
            updates.description !== undefined &&
            card.fieldSource?.description !== 'user'
          ) {
            nextCard.description =
              updates.description
          }

          /**
           * Status is always controlled by the agent.
           */
          if (updates.status !== undefined) {
            nextCard.status = updates.status
          }

          return nextCard
        }),
      })),

    updateCardPosition: (id, position) =>
      set((state) => ({
        cards: state.cards.map((card) =>
          card.id === id
            ? {
              ...card,
              position,
            }
            : card
        ),
      })),

    selectCard: (id) =>
      set({
        selectedCardId: id,
      }),
  }))
