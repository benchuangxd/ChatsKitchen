import { EventCategory, EventType } from '../state/types'
import { RECIPES } from './recipes'

// Tunable constants
export const EVENT_SPAWN_MIN_MS = 30_000
export const EVENT_SPAWN_MAX_MS = 60_000
export const RESOLVE_THRESHOLD_RATIO = 0.8
export const ANGRY_CHEF_DEBUFF_MULTIPLIER = 0.7
export const ANGRY_CHEF_DEBUFF_DURATION_MS = 15_000
export const CHEFS_CHANT_BOOST_MULTIPLIER = 1.5
export const CHEFS_CHANT_BOOST_DURATION_MS = 20_000
export const TYPING_FRENZY_MULTIPLIER = 1.5
export const TYPING_FRENZY_DURATION_MS = 20_000
export const DANCE_PATIENCE_BONUS_MS = 15_000
export const RAT_INVASION_ITEMS_STOLEN = 3
export const MYSTERY_RECIPE_ITEMS_REWARDED = 3
export const EVENT_DURATION_MS = 20_000  // default duration for all timed events; overridden by kitchenEventDuration in GameOptions

function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1))
}

// Generates a random maths equation. Answer is always a positive integer.
// Add/subtract: 3 numbers; multiply/divide: 2 numbers.
export function makePowerTripEquation(): { display: string; answer: number } {
  const type = Math.floor(Math.random() * 3)

  if (type === 1) {
    const a = randInt(2, 12)
    const b = randInt(2, 12)
    return { display: `${a} × ${b} = ?`, answer: a * b }
  }

  if (type === 2) {
    const divisor = randInt(2, 9)
    const quotient = randInt(2, 12)
    return { display: `${divisor * quotient} ÷ ${divisor} = ?`, answer: quotient }
  }

  // Add / subtract with 3 numbers — retry until answer is positive
  let display: string, answer: number
  do {
    const a = randInt(20, 60)
    const b = randInt(5, 25)
    const c = randInt(5, 25)
    const op1 = Math.random() < 0.6 ? '+' : '-'
    const op2 = Math.random() < 0.6 ? '+' : '-'
    answer = a + (op1 === '+' ? b : -b) + (op2 === '+' ? c : -c)
    display = `${a} ${op1} ${b} ${op2} ${c} = ?`
  } while (answer <= 0)
  return { display, answer }
}

const FRENZY_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*+='
const FRENZY_ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

// Generates a random 15 char gibberish string. First char is always
// alphanumeric so Twitch doesn't interpret it as a command prefix.
export function makeTypingFrenzyPhrase(): string {
  const len = 15
  let result = FRENZY_ALPHA[Math.floor(Math.random() * FRENZY_ALPHA.length)]
  for (let i = 1; i < len; i++) {
    result += FRENZY_CHARS[Math.floor(Math.random() * FRENZY_CHARS.length)]
  }
  return result
}

export interface EventDef {
  type: EventType
  category: EventCategory
  emoji: string
  label: string
  commandPool: string[]
  failDescription?: string
  rewardDescription?: string
  color: string    // accent for time bar fill and header gradient end
  cmdColor: string // darker shade for command box and header gradient start
  audio: {
    ambient: string
    success: string
    fail?: string
  }
}

export const EVENT_DEFS: EventDef[] = [
  {
    type: 'rat_invasion',
    category: 'hazard-penalty',
    emoji: '🐀',
    label: 'Rat Invasion',
    commandPool: ['SHOO SHOO SHOO', 'CHASE CHASE CHASE', 'BEGONE BEGONE BEGONE'],
    failDescription: 'Fail: lose prepped ingredients',
    color: '#a0603a',
    cmdColor: '#7a4020',
    audio: { ambient: 'event-rat-ambient', success: 'event-success', fail: 'event-fail' },
  },
  {
    type: 'angry_chef',
    category: 'hazard-penalty',
    emoji: '👨‍🍳',
    label: 'Angry Chef',
    commandPool: ['SORRY CHEF', 'APOLOGIES CHEF', 'MY BAD CHEF'],
    failDescription: 'Fail: cooking speed debuff for 15s',
    color: '#e05020',
    cmdColor: '#c0390a',
    audio: { ambient: 'event-angry-chef-ambient', success: 'event-success', fail: 'event-fail' },
  },
  {
    type: 'power_trip',
    category: 'hazard-immediate',
    emoji: '🔌',
    label: 'Power Trip',
    commandPool: [],
    failDescription: 'Stations offline until resolved',
    color: '#2a5acc',
    cmdColor: '#1a3a8a',
    audio: { ambient: 'event-power-trip-ambient', success: 'event-success' },
  },
  {
    type: 'smoke_blast',
    category: 'hazard-immediate',
    emoji: '💨',
    label: 'Smoke Blast',
    commandPool: ['CLEAR', 'VENTILATE', 'BLOW'],
    failDescription: 'Kitchen obscured until resolved',
    color: '#888888',
    cmdColor: '#555555',
    audio: { ambient: 'event-smoke-blast-ambient', success: 'event-success' },
  },
  {
    type: 'glitched_orders',
    category: 'hazard-immediate',
    emoji: '📦',
    label: 'Glitched Orders',
    commandPool: ['FIX', 'DEBUG', 'PATCH'],
    failDescription: 'Orders scrambled until resolved',
    color: '#7a30cc',
    cmdColor: '#4a1a7a',
    audio: { ambient: 'event-glitch-ambient', success: 'event-success' },
  },
  {
    type: 'chefs_chant',
    category: 'opportunity',
    emoji: '📢',
    label: "Chef's Chant",
    commandPool: ['YES CHEF', 'AYE CHEF', 'OF COURSE CHEF'],
    rewardDescription: 'Reward: cooking speed boost for 20s',
    color: '#c09020',
    cmdColor: '#8a6000',
    audio: { ambient: 'event-chant-ambient', success: 'event-success', fail: 'event-fail' },
  },
  {
    type: 'mystery_recipe',
    category: 'opportunity',
    emoji: '🧩',
    label: 'Mystery Recipe',
    commandPool: [],
    rewardDescription: 'Reward: 3 free prepped ingredients',
    color: '#5030a0',
    cmdColor: '#2a1a6a',
    audio: { ambient: 'event-mystery-ambient', success: 'event-success', fail: 'event-fail' },
  },
  {
    type: 'typing_frenzy',
    category: 'opportunity',
    emoji: '⚡',
    label: 'Typing Frenzy',
    commandPool: [],
    rewardDescription: 'Reward: money multiplier ×1.5 for 20s',
    color: '#88cc00',
    cmdColor: '#4a7800',
    audio: { ambient: 'event-frenzy-ambient', success: 'event-success', fail: 'event-fail' },
  },
  {
    type: 'dance',
    category: 'opportunity',
    emoji: '🕺',
    label: 'Dance',
    commandPool: ['UP', 'DOWN', 'LEFT', 'RIGHT'],
    rewardDescription: 'Reward: all orders +15s patience',
    color: '#cc30aa',
    cmdColor: '#7a1a6a',
    audio: { ambient: 'event-dance-ambient', success: 'event-success', fail: 'event-fail' },
  },
]

// Returns all unique step target values from the given recipe keys.
// Falls back to all recipes if the list is empty.
export function getIngredientTargets(enabledRecipes: string[]): string[] {
  const keys = enabledRecipes.length > 0 ? enabledRecipes : Object.keys(RECIPES)
  const targets = new Set<string>()
  for (const key of keys) {
    const recipe = RECIPES[key]
    if (!recipe) continue
    for (const step of recipe.steps) targets.add(step.target)
  }
  return [...targets]
}

// Returns all unique step produces values from the given recipe keys.
export function getProducesValues(enabledRecipes: string[]): string[] {
  const keys = enabledRecipes.length > 0 ? enabledRecipes : Object.keys(RECIPES)
  const produces = new Set<string>()
  for (const key of keys) {
    const recipe = RECIPES[key]
    if (!recipe) continue
    for (const step of recipe.steps) produces.add(step.produces)
  }
  return [...produces]
}

const DANCE_DIRS = ['UP', 'DOWN', 'LEFT', 'RIGHT'] as const
export type DanceDir = typeof DANCE_DIRS[number]

export function makeDanceSequence(): DanceDir[] {
  return Array.from({ length: 4 }, () => DANCE_DIRS[Math.floor(Math.random() * DANCE_DIRS.length)])
}

// Produces a simple character-shuffle anagram of the input string.
// Guaranteed to differ from the original (retries up to 10 times).
export function makeAnagram(word: string): string {
  const chars = word.toUpperCase().split('')
  for (let attempt = 0; attempt < 10; attempt++) {
    for (let i = chars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chars[i], chars[j]] = [chars[j], chars[i]]
    }
    const result = chars.join('')
    if (result !== word.toUpperCase()) return result
  }
  return chars.join('')
}

// Stable character scramble seeded by a number (for glitched order tickets).
// Same seed → same result across renders.
export function seededScramble(text: string, seed: number): string {
  const chars = text.split('')
  let s = seed
  for (let i = chars.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    const j = Math.abs(s) % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars.join('')
}
