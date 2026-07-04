// Define the structure of a single message object
export interface Message {
  id?: string | number
  system?: boolean
  createdAt?: string | number | Date | null
  username?: string | null
  content?: string | null
  [key: string]: any // Flexible fallback to absorb any other backend properties
}

// Define the shape of a date separator in the chat view
export interface DividerItem {
  type: 'divider'
  label: string
}

// Define the shape of a standard message wrapper in the chat list
export interface MessageItem {
  type: 'message'
  data: Message
}

// Discriminated union type representing any item in the rendered chat stream
export type GroupedChatFlowItem = DividerItem | MessageItem

/**
 * Groups an array of messages by date.
 * Returns an array of objects of two types:
 * { type: 'divider', label: 'Today' | 'Yesterday' | 'Day before yesterday' | 'June 12, 2026' }
 * { type: 'message', data: msg }
 */
export function groupMessagesByDate(messages: Message[]): GroupedChatFlowItem[] {
  const groups: GroupedChatFlowItem[] = []
  let lastLabel: string | null = null

  for (const msg of messages) {
    // System messages are skipped without injecting date dividers
    if (msg.system) {
      groups.push({ type: 'message', data: msg })
      continue
    }

    const date = msg.createdAt ? new Date(msg.createdAt) : null
    
    // In TypeScript, use date.getTime() inside isNaN to check for invalid dates properly
    if (!date || isNaN(date.getTime())) {
      groups.push({ type: 'message', data: msg })
      continue
    }

    const label = getDateLabel(date)
    if (label !== lastLabel) {
      groups.push({ type: 'divider', label })
      lastLabel = label
    }
    groups.push({ type: 'message', data: msg })
  }

  return groups
}

// Generates human-readable labels for chat date breaks
function getDateLabel(date: Date): string {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  
  // Calculate the difference in milliseconds and convert to whole days
  const diffDays = Math.round((today.getTime() - d.getTime()) / 86_400_000)

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays === 2) return 'Day before yesterday'

  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    // Hide the year if the message matches the current calendar year
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}