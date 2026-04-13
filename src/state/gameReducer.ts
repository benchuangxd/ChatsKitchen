import { GameState, Station, Order, ChatMessage, StationSlot, PlayerStats, StationCapacity } from './types'
import { RECIPES, STATION_DEFS } from '../data/recipes'

export const HEAT_PER_COOK = 20
export const COOL_AMOUNT   = 30
export const RUSH_CHANCE   = 0.25
export const RUSH_PATIENCE = 0.5
export const RUSH_REWARD   = 1.75

export type GameAction =
  | { type: 'TICK'; delta: number; now: number }
  | { type: 'COOK'; user: string; action: string; target: string; now: number }
  | { type: 'SERVE'; user: string; orderId: number }
  | { type: 'EXTINGUISH'; user: string; stationId: string }
  | { type: 'COOL'; user: string; stationId: string }
  | { type: 'SPAWN_ORDER'; now: number }
  | { type: 'ADD_CHAT'; username: string; text: string; msgType: ChatMessage['type'] }
  | { type: 'RESET'; shiftDuration: number; cookingSpeed: number; orderSpeed: number; orderSpawnRate: number; stationCapacity: StationCapacity; restrictSlots: boolean; enabledRecipes: string[] }

export function createInitialState(
  shiftDuration = 120000,
  cookingSpeed = 1,
  orderSpeed = 1,
  orderSpawnRate = 1,
  stationCapacity: StationCapacity = { chopping: 3, cooking: 2 },
  restrictSlots = false,
  enabledRecipes: string[] = Object.keys(RECIPES)
): GameState {
  const stations: Record<string, Station> = {}
  for (const id of Object.keys(STATION_DEFS)) {
    stations[id] = { id, slots: [], heat: 0, overheated: false, extinguishVotes: [] }
  }

  return {
    money: 0,
    served: 0,
    lost: 0,
    timeLeft: shiftDuration,
    cookingSpeed,
    orderSpeed,
    orderSpawnRate,
    stationCapacity,
    restrictSlots,
    enabledRecipes,
    stations,
    orders: [],
    preparedItems: [],
    nextOrderId: 1,
    userCooldowns: {},
    activeUsers: {},
    nextSlotId: 1,
    chatMessages: [],
    nextMessageId: 1,
    playerStats: {},
  }
}

function addMsg(state: GameState, username: string, text: string, msgType: ChatMessage['type'] = 'normal'): GameState {
  const msg: ChatMessage = { id: state.nextMessageId, username, text, type: msgType }
  const messages = [...state.chatMessages, msg].slice(-200)
  return { ...state, chatMessages: messages, nextMessageId: state.nextMessageId + 1 }
}

const EMPTY_STATS: PlayerStats = { cooked: 0, served: 0, moneyEarned: 0, extinguished: 0, firesCaused: 0 }

function addStat(state: GameState, user: string, stat: keyof PlayerStats, amount: number): GameState {
  const prev = state.playerStats[user] || { ...EMPTY_STATS }
  return { ...state, playerStats: { ...state.playerStats, [user]: { ...prev, [stat]: prev[stat] + amount } } }
}

function getStationCapacity(stationId: string, capacity: StationCapacity, restricted: boolean): number {
  if (!restricted) return Infinity
  if (stationId === 'cutting_board') return capacity.chopping
  return capacity.cooking
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'RESET':
      return createInitialState(action.shiftDuration, action.cookingSpeed, action.orderSpeed, action.orderSpawnRate, action.stationCapacity, action.restrictSlots, action.enabledRecipes)

    case 'ADD_CHAT':
      return addMsg(state, action.username, action.text, action.msgType)

    case 'EXTINGUISH': {
      const { user, stationId } = action
      const station = state.stations[stationId]
      if (!station) return addMsg(state, 'KITCHEN', 'Unknown station!', 'error')
      if (!station.overheated) return addMsg(state, 'KITCHEN', `No overheat on the ${STATION_DEFS[stationId]?.name ?? stationId}!`, 'error')
      if (station.extinguishVotes.includes(user)) return addMsg(state, 'KITCHEN', `${user} already voted to extinguish!`, 'error')

      const newVotes = [...station.extinguishVotes, user]
      // playerStats resets to {} on every RESET (new round) — reflects current-round participants only
      const totalPlayers = Math.max(1, Object.keys(state.playerStats).length)
      const needed = Math.max(1, Math.ceil(totalPlayers * 0.3))
      const withStat = addStat(state, user, 'extinguished', 1)

      if (newVotes.length >= needed) {
        const newStations = {
          ...withStat.stations,
          [stationId]: { ...station, slots: [], heat: 0, overheated: false, extinguishVotes: [] },
        }
        return addMsg({ ...withStat, stations: newStations }, 'KITCHEN',
          `🧯 ${STATION_DEFS[stationId].name} extinguished! Station restored.`, 'success')
      } else {
        const newStations = {
          ...withStat.stations,
          [stationId]: { ...station, extinguishVotes: newVotes },
        }
        return addMsg({ ...withStat, stations: newStations }, 'KITCHEN',
          `${user} voted to extinguish ${STATION_DEFS[stationId].name} (${newVotes.length}/${needed})`, 'system')
      }
    }

    case 'COOL': {
      const { user, stationId } = action
      const station = state.stations[stationId]
      if (!station) return addMsg(state, 'KITCHEN', 'Unknown station!', 'error')
      if (station.overheated) return addMsg(state, 'KITCHEN', `${STATION_DEFS[stationId].name} is overheated — extinguish it first!`, 'error')
      if (station.heat === 0) return addMsg(state, 'KITCHEN', `${STATION_DEFS[stationId].name} is already cool.`, 'error')

      const cooldown = state.userCooldowns[user] ?? 0
      if (Date.now() - cooldown < 1500) return addMsg(state, 'KITCHEN', `${user} is on cooldown!`, 'error')

      const newHeat = Math.max(0, station.heat - COOL_AMOUNT)
      const newStations = { ...state.stations, [stationId]: { ...station, heat: newHeat } }
      const withCooldown = { ...state, stations: newStations, userCooldowns: { ...state.userCooldowns, [user]: Date.now() } }
      return addMsg(withCooldown, 'KITCHEN', `${user} cooled the ${STATION_DEFS[stationId].name}! Heat: ${newHeat}%`, 'success')
    }

    case 'SERVE': {
      const { user, orderId } = action
      const orderIdx = state.orders.findIndex(o => o.id === orderId && !o.served)
      if (orderIdx === -1) return addMsg(state, 'KITCHEN', `No pending order #${orderId}!`, 'error')

      const order = state.orders[orderIdx]
      const recipe = RECIPES[order.dish]

      // Check preparedItems has all required ingredients
      const needed = [...recipe.plate]
      const available = [...state.preparedItems]
      for (const item of needed) {
        const idx = available.indexOf(item)
        if (idx === -1) return addMsg(state, 'KITCHEN', `Missing ${item.replace(/_/g, ' ')} for ${recipe.name}!`, 'error')
        available.splice(idx, 1)
      }

      const newOrders = state.orders.map((o, i) =>
        i === orderIdx ? { ...o, served: true, outcome: 'served' as const, completedAt: Date.now() } : o
      )
      const timeBonus = Math.max(0, Math.floor((order.patienceLeft / order.patienceMax) * 30))
      const reward = Math.round(recipe.reward * order.rewardMultiplier + timeBonus)

      let withStats = addStat(state, user, 'served', 1)
      withStats = addStat(withStats, user, 'moneyEarned', reward)
      return addMsg(
        { ...withStats, preparedItems: available, orders: newOrders, money: withStats.money + reward, served: withStats.served + 1 },
        'KITCHEN', `${user} served ${recipe.emoji} ${recipe.name}! +$${reward}`, 'success'
      )
    }

    case 'COOK': {
      const { user, action: cookAction, target, now } = action

      // Cooldown check
      if (state.userCooldowns[user] && now - state.userCooldowns[user] < 1500) return state
      const withCooldown = { ...state, userCooldowns: { ...state.userCooldowns, [user]: now } }

      // Per-user busy check (belt-and-suspenders: also scan station slots in case activeUsers is stale)
      const alreadyCooking = withCooldown.activeUsers[user] || Object.values(withCooldown.stations).some(
        s => s.slots.some(slot => slot.state === 'cooking' && slot.user === user)
      )
      if (alreadyCooking) {
        return addMsg(withCooldown, 'KITCHEN', `${user} is already busy!`, 'error')
      }

      const stationEntry = Object.entries(STATION_DEFS).find(([, def]) => def.actions.includes(cookAction))
      if (!stationEntry) return withCooldown

      const [stationId] = stationEntry
      const station = withCooldown.stations[stationId]

      // Station capacity check
      const maxSlots = getStationCapacity(stationId, state.stationCapacity, state.restrictSlots)
      if (station.slots.length >= maxSlots) {
        return addMsg(withCooldown, 'KITCHEN', `The ${STATION_DEFS[stationId].name} is full! Try again later.`, 'error')
      }

      let matchedStep = null
      for (const recipe of Object.values(RECIPES)) {
        for (const step of recipe.steps) {
          if (step.action === cookAction && step.target === target) { matchedStep = step; break }
        }
        if (matchedStep) break
      }
      if (!matchedStep) return addMsg(withCooldown, 'KITCHEN', `Can't ${cookAction} ${(target || '').replace(/_/g, ' ')} there!`, 'error')

      // Check ingredient prerequisite
      let afterRequire = withCooldown
      if (matchedStep.requires) {
        const idx = afterRequire.preparedItems.indexOf(matchedStep.requires)
        if (idx === -1) {
          return addMsg(afterRequire, 'KITCHEN', `Need ${matchedStep.requires.replace(/_/g, ' ')} first!`, 'error')
        }
        const newItems = [...afterRequire.preparedItems]
        newItems.splice(idx, 1)
        afterRequire = { ...afterRequire, preparedItems: newItems }
      }

      const speed = state.cookingSpeed
      const newSlot: StationSlot = {
        id: `slot_${afterRequire.nextSlotId}`,
        user,
        target: matchedStep.target,
        produces: matchedStep.produces,
        cookStart: now,
        cookDuration: matchedStep.duration / speed,
        state: 'cooking',
      }

      const PAST_TENSE: Record<string, string> = { chop: 'chopped', grill: 'grilled', fry: 'fried', boil: 'boiled', toast: 'toasted', roast: 'roasted', stir: 'stir-fried', steam: 'steamed', simmer: 'simmered', cook: 'cooked' }

      if (matchedStep.duration === 0) {
        const withStat = addStat(afterRequire, user, 'cooked', 1)
        return addMsg(
          { ...withStat, preparedItems: [...withStat.preparedItems, matchedStep.produces] },
          'KITCHEN', `${user} ${PAST_TENSE[cookAction] || cookAction + 'ed'} ${target.replace(/_/g, ' ')}!`, 'success'
        )
      }

      const withStat = addStat(afterRequire, user, 'cooked', 1)
      return addMsg(
        {
          ...withStat,
          stations: {
            ...withStat.stations,
            [stationId]: { ...station, slots: [...station.slots, newSlot] }
          },
          activeUsers: { ...withStat.activeUsers, [user]: stationId },
          nextSlotId: withStat.nextSlotId + 1,
        },
        'KITCHEN', `${user} started ${cookAction}ing ${target.replace(/_/g, ' ')}!`, 'success'
      )
    }

    case 'SPAWN_ORDER': {
      const activeOrders = state.orders.filter(o => !o.served).length
      if (activeOrders >= 5) return state

      const dishKeys = state.enabledRecipes.length > 0 ? state.enabledRecipes : Object.keys(RECIPES)
      const dish = dishKeys[Math.floor(Math.random() * dishKeys.length)]
      const recipe = RECIPES[dish]

      const existingRush = state.orders.some(o => o.isRush && !o.outcome)
      const isRush = !existingRush && Math.random() < RUSH_CHANCE
      const basePatience = recipe.patience / state.orderSpeed
      const patience = basePatience * (isRush ? RUSH_PATIENCE : 1)

      const order: Order = {
        id: state.nextOrderId,
        dish,
        served: false,
        patienceMax: patience,
        patienceLeft: patience,
        spawnTime: action.now,
        isRush,
        rewardMultiplier: isRush ? RUSH_REWARD : 1,
      }
      return addMsg(
        { ...state, orders: [...state.orders, order], nextOrderId: state.nextOrderId + 1 },
        'CUSTOMER', `${isRush ? '⚡ RUSH ' : ''}Order #${order.id}: ${recipe.emoji} ${recipe.name}!`, 'system'
      )
    }

    case 'TICK': {
      const { delta, now } = action
      const newStations = { ...state.stations }
      const newActiveUsers = { ...state.activeUsers }
      const messages = [...state.chatMessages]
      let nextMsgId = state.nextMessageId
      const newPreparedItems = [...state.preparedItems]
      let newPlayerStats = { ...state.playerStats }
      // Update all station slots
      for (const [id, station] of Object.entries(newStations)) {
        if (station.overheated || station.slots.length === 0) continue

        let slotsChanged = false
        const updatedSlots: StationSlot[] = []

        for (const slot of station.slots) {
          const elapsed = now - slot.cookStart

          if (slot.state === 'cooking' && elapsed >= slot.cookDuration) {
            // Auto-collect: all stations work like cutting_board
            newPreparedItems.push(slot.produces)
            delete newActiveUsers[slot.user]
            slotsChanged = true
            messages.push({
              id: nextMsgId++,
              username: 'KITCHEN',
              text: `${slot.user} finished ${slot.target.replace(/_/g, ' ')}!`,
              type: 'success',
            })

            // Heat accumulation
            const stationHeat = (newStations[id].heat ?? 0) + HEAT_PER_COOK
            if (stationHeat >= 100) {
              // Overheat — destroy all slots and lock station
              const statSnap = addStat({ ...state, playerStats: newPlayerStats }, slot.user, 'firesCaused', 1)
              newPlayerStats = statSnap.playerStats
              // Free all users assigned to remaining slots
              for (const s of newStations[id].slots) delete newActiveUsers[s.user]
              newStations[id] = { ...newStations[id], slots: [], heat: 100, overheated: true, extinguishVotes: [] }
              messages.push({
                id: nextMsgId++,
                username: 'KITCHEN',
                text: `🔥 ${STATION_DEFS[id].name} OVERHEATED! Type !extinguish ${id} to restore it!`,
                type: 'system',
              })
              slotsChanged = true
              break // station is locked, skip remaining slots
            } else {
              newStations[id] = { ...newStations[id], heat: stationHeat }
              // slot NOT pushed — removed (auto-collected)
            }
          } else {
            updatedSlots.push(slot)
          }
        }

        if (slotsChanged && !newStations[id].overheated) {
          newStations[id] = { ...newStations[id], slots: updatedSlots }
        }
      }

      // Update order patience + expire
      let orders = [...state.orders]
      let lost = state.lost
      orders = orders.map(order => {
        if (order.served) return order
        const newPatience = order.patienceLeft - delta
        if (newPatience <= 0) {
          lost++
          messages.push({ id: nextMsgId++, username: 'CUSTOMER', text: `Order #${order.id} expired! Lost a ${RECIPES[order.dish].emoji}!`, type: 'error' })
          return { ...order, served: true, patienceLeft: 0, outcome: 'lost' as const, completedAt: now }
        }
        return { ...order, patienceLeft: newPatience }
      })

      // Clean up old served orders
      orders = orders.filter(o => !o.served || (o.completedAt !== undefined && now - o.completedAt < 1500))

      // Timer countdown
      const timeLeft = Math.max(0, state.timeLeft - delta)

      return { ...state, stations: newStations, activeUsers: newActiveUsers, preparedItems: newPreparedItems, playerStats: newPlayerStats, orders, lost, timeLeft, chatMessages: messages.slice(-200), nextMessageId: nextMsgId }
    }

    default:
      return state
  }
}
