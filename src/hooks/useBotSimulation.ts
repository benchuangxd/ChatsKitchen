import { useEffect, useRef } from 'react'
import { GameAction } from '../state/gameReducer'
import { GameState } from '../state/types'
import { RECIPES, BOT_NAMES } from '../data/recipes'

const CHATTER = ["let's go!", 'waiting for orders...', 'COOK COOK COOK', 'we got this chat!', 'any orders?']

function pickBotAction(state: GameState): { name: string; command: string } | null {
  const name = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)]

  // Skip if this bot is already busy
  if (state.activeUsers[name]) return null

  // Fire — any burning slot across all stations
  for (const [id, station] of Object.entries(state.stations)) {
    if (station.slots.some(s => s.state === 'onFire')) return { name, command: `extinguish ${id}` }
  }

  // Done slots — take bot's own first, then any done slot
  for (const [id, station] of Object.entries(state.stations)) {
    const doneSlot = station.slots.find(s => s.state === 'done' && s.user === name)
      || station.slots.find(s => s.state === 'done')
    if (doneSlot) return { name, command: `take ${doneSlot.target}` }
    void id
  }

  // Serve — check if preparedItems has all ingredients for an active order
  for (const order of state.orders) {
    if (order.served) continue
    const recipe = RECIPES[order.dish]
    const available = [...state.preparedItems]
    let canServe = true
    for (const item of recipe.plate) {
      const idx = available.indexOf(item)
      if (idx === -1) { canServe = false; break }
      available.splice(idx, 1)
    }
    if (canServe) return { name, command: `serve ${order.id}` }
  }

  // Cook something needed — check station capacity
  for (const order of state.orders) {
    if (order.served) continue
    const recipe = RECIPES[order.dish]
    for (const step of recipe.steps) {
      const station = state.stations[step.station]
      if (!station) continue

      // Check capacity
      const capacity = step.station === 'cutting_board'
        ? state.stationCapacity.chopping
        : state.stationCapacity.cooking
      if (station.slots.length >= capacity) continue

      if (state.preparedItems.includes(step.produces)) continue
      const alreadyCooking = station.slots.some(s => s.produces === step.produces)
      if (alreadyCooking) continue
      if (step.requires && !state.preparedItems.includes(step.requires)) continue
      return { name, command: `${step.action} ${step.target}` }
    }
  }

  // Idle chatter
  return { name, command: CHATTER[Math.floor(Math.random() * CHATTER.length)] }
}

export function useBotSimulation(
  state: GameState,
  dispatch: React.Dispatch<GameAction>,
  onCommand: (user: string, text: string) => void,
  enabled: boolean,
) {
  const stateRef = useRef(state)
  useEffect(() => { stateRef.current = state }, [state])

  useEffect(() => {
    if (!enabled) return

    const interval = setInterval(() => {
      const action = pickBotAction(stateRef.current)
      if (action) {
        dispatch({ type: 'ADD_CHAT', username: action.name, text: action.command, msgType: 'normal' })
        onCommand(action.name, action.command)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [dispatch, onCommand, enabled])
}
