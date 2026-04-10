import { GameAction } from './gameReducer'

const COMMAND_ALIASES: Record<string, string> = {
  c: 'chop', g: 'grill', f: 'fry', b: 'boil', t: 'toast', r: 'roast',
  st: 'stir', sm: 'steam', si: 'simmer', ck: 'cook',
  ta: 'take', s: 'serve',
}

export function parseCommand(user: string, text: string, shortformEnabled = false): GameAction | null {
  const trimmed = text.startsWith('!') ? text.slice(1) : text
  const parts = trimmed.toLowerCase().split(/\s+/)
  if (parts.length === 0) return null
  const action = parts[0]
  const target = parts.slice(1).join('_') || ''

  const resolvedAction = shortformEnabled ? (COMMAND_ALIASES[action] ?? action) : action

  switch (resolvedAction) {
    case 'extinguish':
      return target ? { type: 'EXTINGUISH', user, stationId: target } : null
    case 'take':
      return target ? { type: 'TAKE', user, ingredient: target } : null
    case 'serve': {
      const match = target.match(/(\d+)/)
      return match ? { type: 'SERVE', user, orderId: parseInt(match[1]) } : null
    }
    case 'chop':
    case 'grill':
    case 'fry':
    case 'boil':
    case 'toast':
    case 'roast':
    case 'stir':
    case 'steam':
    case 'simmer':
    case 'cook':
      return target ? { type: 'COOK', user, action: resolvedAction, target, now: Date.now() } : null
    default:
      return null
  }
}
