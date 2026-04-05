import { GameAction } from './gameReducer'

const ALIASES: Record<string, string> = {
  cboard: 'cutting_board',
  lett: 'lettuce',
  fburger: 'fish_burger',
  msoup: 'mushroom_soup',
}

function expand(value: string): string {
  return ALIASES[value] || value
}

export function parseCommand(user: string, text: string): GameAction | null {
  const trimmed = text.startsWith('!') ? text.slice(1) : text
  const parts = trimmed.toLowerCase().split(/\s+/)
  if (parts.length === 0) return null
  const action = parts[0]
  const rawTarget = parts.slice(1).join('_') || ''
  const target = expand(rawTarget)

  switch (action) {
    case 'extinguish':
      return target ? { type: 'EXTINGUISH', user, stationId: expand(target) } : null
    case 'take':
      return target ? { type: 'TAKE', user, ingredient: target } : null
    case 'plate':
      return target ? { type: 'PLATE', user, dishKey: expand(target), now: Date.now() } : null
    case 'serve': {
      const match = target.match(/(\d+)/)
      return match ? { type: 'SERVE', user, orderId: parseInt(match[1]) } : null
    }
    case 'chop':
    case 'grill':
    case 'fry':
    case 'boil':
    case 'toast':
      return target ? { type: 'COOK', user, action, target, now: Date.now() } : null
    default:
      return null
  }
}
