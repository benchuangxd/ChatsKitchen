import { GameOptions, EventType } from '../state/types'
import { RECIPES, getEnabledStations } from './recipes'

const BASE_SPAWN_INTERVAL_MS = 14000
const REACTION_TIME_MS = 8000
const COORD_FLOOR = 0.20
const COORD_RANGE = 0.75  // ceiling = COORD_FLOOR + COORD_RANGE = 0.95

const HAZARD_TYPES: EventType[] = [
  'rat_invasion', 'angry_chef', 'power_trip', 'smoke_blast', 'glitched_orders',
]
const OPP_TYPES: EventType[] = [
  'chefs_chant', 'mystery_recipe', 'typing_frenzy', 'dance',
]

export function computeStarThresholds(options: GameOptions): [number, number, number] {
  const {
    shiftDuration, cookingSpeed, orderSpeed, orderSpawnRate,
    enabledRecipes, stationCapacity, expectedPlayers,
    kitchenEventsEnabled, enabledKitchenEvents,
  } = options

  const recipes = enabledRecipes.map(k => RECIPES[k]).filter(Boolean)
  if (recipes.length === 0) return [100, 200, 350]

  const avgReward = recipes.reduce((s, r) => s + r.reward, 0) / recipes.length
  const avgCookTime = recipes.reduce(
    (s, r) => s + r.steps.reduce((t, step) => t + step.duration, 0), 0
  ) / recipes.length
  const avgPatience = recipes.reduce((s, r) => s + r.patience, 0) / recipes.length

  const totalSpawnableOrders = shiftDuration / (BASE_SPAWN_INTERVAL_MS / orderSpawnRate)

  const effectiveCookTime = avgCookTime / cookingSpeed
  const effectivePatience = avgPatience / orderSpeed
  const completionTime = REACTION_TIME_MS + effectiveCookTime
  const patienceFactor = Math.min(1.0, Math.max(0.15, effectivePatience / (completionTime * 1.5)))

  // cutting_board, mixing_bowl, grinder, and knead_board all use stationCapacity.chopping
  // (matches the actual slot-limit logic in gameReducer.ts and Kitchen.tsx)
  const CHOPPING_CAPACITY_STATIONS = new Set(['cutting_board', 'mixing_bowl', 'grinder', 'knead_board'])
  const enabledStations = getEnabledStations(enabledRecipes)
  const stationSlots = enabledStations.reduce(
    (sum, id) => sum + (CHOPPING_CAPACITY_STATIONS.has(id) ? stationCapacity.chopping : stationCapacity.cooking),
    0
  )
  const playerFactor = Math.min(1.0, expectedPlayers / Math.max(1, stationSlots))
  const coordinationEfficiency = COORD_FLOOR + COORD_RANGE * playerFactor

  const theoreticalMax = totalSpawnableOrders * avgReward * patienceFactor * coordinationEfficiency

  let eventFactor = 1.0
  if (kitchenEventsEnabled && enabledKitchenEvents.length > 0) {
    const hazardCount = enabledKitchenEvents.filter(e => HAZARD_TYPES.includes(e)).length
    const oppCount = enabledKitchenEvents.filter(e => OPP_TYPES.includes(e)).length
    eventFactor = (1.0 - hazardCount * 0.03) * (1.0 + oppCount * 0.02)
  }

  const adjustedMax = theoreticalMax * eventFactor
  const round5 = (n: number) => Math.round(n / 5) * 5
  return [
    round5(adjustedMax * 0.40),
    round5(adjustedMax * 0.65),
    round5(adjustedMax * 0.88),
  ]
}

export function getStarCount(money: number, thresholds: [number, number, number]): number {
  if (money >= thresholds[2]) return 3
  if (money >= thresholds[1]) return 2
  if (money >= thresholds[0]) return 1
  return 0
}
