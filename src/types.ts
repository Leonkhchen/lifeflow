export type Label = { id: string; name: string; color: string }
export type ChecklistItem = { id: string; text: string; done: boolean }
export type Card = { id: string; title: string; description: string; dueDate: string; labels: string[]; checklist: ChecklistItem[]; createdAt: string }
export type List = { id: string; title: string; cards: Card[] }
export type Board = { id: string; name: string; icon: string; color: string; labels: Label[]; lists: List[] }
export type Data = { boards: Board[] }
