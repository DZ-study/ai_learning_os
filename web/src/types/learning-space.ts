export type CardType =
  | 'course'
  | 'chapter'
  | 'node'

export type CardStatus =
  | 'generating'
  | 'ready'
  | 'learning'
  | 'completed'

export type CardSource =
  | 'agent'
  | 'user'

export interface CardPosition {
  x: number
  y: number
}

export interface LearningCard {
  id: string

  type: CardType

  title: string

  description?: string

  status: CardStatus

  /**
   * Learning hierarchy relationship.
   *
   * course
   *   └── chapter
   *         └── node
   */
  parentId?: string

  /**
   * Position on the canvas.
   */
  position: CardPosition

  /**
   * The last actor who modified the content.
   */
  source: CardSource

  /**
   * Track whether a field was edited by the user so
   * later agent generation does not overwrite it.
   */
  fieldSource?: {
    title?: CardSource
    description?: CardSource
  }
}
