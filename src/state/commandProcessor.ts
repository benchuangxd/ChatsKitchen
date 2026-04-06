import { GameAction } from './gameReducer'

const ALIASES: Record<string, string> = {
  cboard: 'cutting_board',
  lett: 'lettuce',
  fburger: 'fish_burger',
  msoup: 'mushroom_soup',
}

const COMMAND_ALIASES: Record<string, string> = {
  c: 'chop', g: 'grill', f: 'fry', b: 'boil', t: 'toast',
  ta: 'take', p: 'plate', s: 'serve', e: 'extinguish',
}

function expand(value: string): string {
  return ALIASES[value] || value
}

export function parseCommand(user: string, text: string, shortformEnabled = false): GameAction | null {
  const trimmed = text.startsWith('!') ? text.slice(1) : text
  const parts = trimmed.toLowerCase().split(/\s+/)
  if (parts.length === 0) return null
  const action = parts[0]
  const rawTarget = parts.slice(1).join('_') || ''
  const target = expand(rawTarget)

  const resolvedAction = shortformEnabled ? (COMMAND_ALIASES[action] ?? action) : action

  switch (resolvedAction) {
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
      return target ? { type: 'COOK', user, action: resolvedAction, target, now: Date.now() } : null
    default:
      return null
  }
}
