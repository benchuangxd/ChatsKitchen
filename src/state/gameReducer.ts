import { GameState, Station, Order, ChatMessage, StationSlot, PlayerStats, StationCapacity } from './types'
import { RECIPES, STATION_DEFS } from '../data/recipes'

export const HEAT_PER_COOK = 20
export const COOL_AMOUNT   = 30

export type GameAction =
  | { type: 'TICK'; delta: number; now: number }
  | { type: 'COOK'; user: string; action: string; target: string; now: number }
  | { type: 'SERVE'; user: string; orderId: number }
  | { type: 'EXTINGUISH'; user: string; stationId: string }
  | { type: 'COOL'; user: string; stationId: string }
  | { type: 'SPAWN_ORDER'; now: number }
  | { type: 'ADD_CHAT'; username: string; text: string; msgType: ChatMessage['type'] }
  | { type: 'RESET'; shiftDuration: number; cookingSpeed: number; orderSpeed: number; orderSpawnRate: number; stationCapacity: StationCapacity; restrictSlots: boolean; enabledRecipes: string[]; teams?: Record<string, 'red' | 'blue'> }
  | { type: 'ADJUST_COOK_TIMES'; offset: number }
  | { type: 'SET_STATION_HEAT'; stationId: string; heat: number }
  | { type: 'OVERHEAT_STATION'; stationId: string }
  | { type: 'REMOVE_PREPARED_ITEMS'; count: number }
  | { type: 'SET_COOKING_SPEED_MODIFIER'; multiplier: number; expiresAt: number }
  | { type: 'DISABLE_STATIONS'; stationIds: string[] }
  | { type: 'ENABLE_STATIONS'; stationIds: string[] }
  | { type: 'ADD_MONEY_MULTIPLIER'; multiplier: number; expiresAt: number }
  | { type: 'ADD_PREPARED_ITEMS'; items: string[] }
  | { type: 'EXTEND_ORDER_PATIENCE'; ms: number }
  | { type: 'RECORD_EVENT_PARTICIPATION'; user: string }
  | { type: 'JOIN_TEAM'; username: string; team: 'red' | 'blue' }
  | { type: 'BALANCE_TEAMS' }
  | { type: 'MOVE_TO_TEAM'; username: string; team: 'red' | 'blue' }

export function createInitialState(
  shiftDuration = 120000,
  cookingSpeed = 1,
  orderSpeed = 1,
  orderSpawnRate = 1,
  stationCapacity: StationCapacity = { chopping: 3, cooking: 2 },
  restrictSlots = false,
  enabledRecipes: string[] = Object.keys(RECIPES),
  teams: Record<string, 'red' | 'blue'> = {}
): GameState {
  const stations: Record<string, Station> = {}
  for (const id of Object.keys(STATION_DEFS)) {
    stations[id] = { id, slots: [], heat: 0, overheated: false, extinguishVotes: [] }
  }

  const pvp = Object.keys(teams).length > 0
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
    disabledStations: undefined,
    cookingSpeedModifier: undefined,
    moneyMultiplier: undefined,
    teams: pvp ? teams : undefined,
    redPreparedItems: pvp ? [] : undefined,
    bluePreparedItems: pvp ? [] : undefined,
    redMoney: pvp ? 0 : undefined,
    blueMoney: pvp ? 0 : undefined,
    redServed: pvp ? 0 : undefined,
    blueServed: pvp ? 0 : undefined,
  }
}

function addMsg(state: GameState, username: string, text: string, msgType: ChatMessage['type'] = 'normal'): GameState {
  const msg: ChatMessage = { id: state.nextMessageId, username, text, type: msgType }
  const messages = [...state.chatMessages, msg].slice(-200)
  return { ...state, chatMessages: messages, nextMessageId: state.nextMessageId + 1 }
}

const EMPTY_STATS: PlayerStats = { cooked: 0, served: 0, moneyEarned: 0, extinguished: 0, firesCaused: 0, cooled: 0, eventParticipations: 0 }

function addStat(state: GameState, user: string, stat: keyof PlayerStats, amount: number): GameState {
  const prev = state.playerStats[user] || { ...EMPTY_STATS }
  return { ...state, playerStats: { ...state.playerStats, [user]: { ...prev, [stat]: prev[stat] + amount } } }
}

function getStationCapacity(stationId: string, capacity: StationCapacity, restricted: boolean): number {
  if (!restricted) return Infinity
  if (stationId === 'cutting_board' || stationId === 'mixing_bowl' || stationId === 'grinder' || stationId === 'knead_board') return capacity.chopping
  return capacity.cooking
}

function isUserBusy(state: GameState, user: string): boolean {
  return Boolean(state.activeUsers[user]) || Object.values(state.stations).some(
    station => station.slots.some(slot => slot.state === 'cooking' && slot.user === user)
  )
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'RESET':
      return createInitialState(action.shiftDuration, action.cookingSpeed, action.orderSpeed, action.orderSpawnRate, action.stationCapacity, action.restrictSlots, action.enabledRecipes, action.teams ?? {})

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
      const needed = Math.max(1, Math.ceil(totalPlayers * 0.5))
      const withStat = addStat(state, user, 'extinguished', 1)

      if (newVotes.length >= needed) {
        const newStations = {
          ...withStat.stations,
          [stationId]: { ...station, slots: [], heat: 0, overheated: false, extinguishVotes: [], lastExtinguishedAt: Date.now(), lastExtinguishedBy: newVotes },
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
      if (stationId === 'cutting_board' || stationId === 'mixing_bowl' || stationId === 'grinder' || stationId === 'knead_board') return addMsg(state, 'KITCHEN', `The ${STATION_DEFS[stationId].name} doesn't overheat!`, 'error')
      if (station.overheated) return addMsg(state, 'KITCHEN', `${STATION_DEFS[stationId].name} is overheated — extinguish it first!`, 'error')
      if (station.heat === 0) return addMsg(state, 'KITCHEN', `${STATION_DEFS[stationId].name} is already cool.`, 'error')
      if (isUserBusy(state, user)) return addMsg(state, 'KITCHEN', `${user} is busy cooking and can't cool right now!`, 'error')

      const cooldown = state.userCooldowns[user] ?? 0
      if (Date.now() - cooldown < 1500) return addMsg(state, 'KITCHEN', `${user} is on cooldown!`, 'error')

      const newHeat = Math.max(0, station.heat - COOL_AMOUNT)
      const newStations = { ...state.stations, [stationId]: { ...station, heat: newHeat, lastCooledAt: Date.now(), lastCooledBy: user } }
      const withCooldown = { ...state, stations: newStations, userCooldowns: { ...state.userCooldowns, [user]: Date.now() } }
      const withStat = addStat(withCooldown, user, 'cooled', 1)
      return addMsg(withStat, 'KITCHEN', `${user} cooled the ${STATION_DEFS[stationId].name}! Heat: ${newHeat}%`, 'success')
    }

    case 'SERVE': {
      const { user, orderId } = action
      if (isUserBusy(state, user)) {
        return addMsg(state, 'KITCHEN', `${user} is busy cooking at a station and can't serve right now!`, 'error')
      }

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
        i === orderIdx ? { ...o, served: true, outcome: 'served' as const, completedAt: Date.now(), servedBy: user } : o
      )
      const timeBonus = Math.max(0, Math.floor((order.patienceLeft / order.patienceMax) * 30))
      const baseReward = recipe.reward + timeBonus
      const multiplier = state.moneyMultiplier?.multiplier ?? 1
      const reward = Math.round(baseReward * multiplier)

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
      if (isUserBusy(withCooldown, user)) {
        return addMsg(withCooldown, 'KITCHEN', `${user} is already busy!`, 'error')
      }

      const stationEntry = Object.entries(STATION_DEFS).find(([, def]) => def.actions.includes(cookAction))
      if (!stationEntry) return withCooldown

      const [stationId] = stationEntry
      const station = withCooldown.stations[stationId]

      // Overheated check
      if (station.overheated) {
        return addMsg(withCooldown, 'KITCHEN', `The ${STATION_DEFS[stationId].name} is overheated! Extinguish it first.`, 'error')
      }

      // Disabled station check (Kitchen Events — Power Trip)
      if ((state.disabledStations ?? []).includes(stationId)) {
        return addMsg(withCooldown, 'KITCHEN', `The ${STATION_DEFS[stationId].name} is offline! Help restore power!`, 'error')
      }

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
        cookDuration: matchedStep.duration / (speed * (state.cookingSpeedModifier?.multiplier ?? 1)),
        heatApplied: 0,
        state: 'cooking',
      }

      const PAST_TENSE: Record<string, string> = { chop: 'chopped', grill: 'grilled', fry: 'fried', boil: 'boiled', toast: 'toasted', roast: 'roasted', stir: 'stir-fried', steam: 'steamed', simmer: 'simmered', cook: 'cooked', mix: 'mixed', grind: 'ground', knead: 'kneaded' }

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

      const patience = recipe.patience / state.orderSpeed

      const order: Order = {
        id: state.nextOrderId,
        dish,
        served: false,
        patienceMax: patience,
        patienceLeft: patience,
        spawnTime: action.now,
      }
      return addMsg(
        { ...state, orders: [...state.orders, order], nextOrderId: state.nextOrderId + 1 },
        'CUSTOMER', `Order #${order.id}: ${recipe.emoji} ${recipe.name}!`, 'system'
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
        let currentHeat = newStations[id].heat

        for (const slot of station.slots) {
          const elapsed = now - slot.cookStart

          // Step A: Apply incremental heat delta (chopping board is exempt)
          let updatedSlot = slot
          if (id !== 'cutting_board' && id !== 'mixing_bowl' && id !== 'grinder' && id !== 'knead_board' && slot.state === 'cooking') {
            const progress = Math.min(1, elapsed / slot.cookDuration)
            const expectedHeat = progress * HEAT_PER_COOK
            const heatDelta = expectedHeat - slot.heatApplied
            if (heatDelta > 0) {
              currentHeat += heatDelta
              updatedSlot = { ...slot, heatApplied: expectedHeat }
              slotsChanged = true
            }
          }

          // Step B: Check overheat
          if (currentHeat >= 100) {
            const statSnap = addStat({ ...state, playerStats: newPlayerStats }, slot.user, 'firesCaused', 1)
            newPlayerStats = statSnap.playerStats
            // Free all users assigned to all slots on this station
            for (const s of newStations[id].slots) delete newActiveUsers[s.user]
            newStations[id] = { ...newStations[id], slots: [], heat: 100, overheated: true, extinguishVotes: [] }
            messages.push({
              id: nextMsgId++,
              username: 'KITCHEN',
              text: `🔥 ${STATION_DEFS[id].name} OVERHEATED! Type extinguish ${id} to restore it!`,
              type: 'system',
            })
            slotsChanged = true
            break // station is locked, skip remaining slots
          }

          // Step C: Check completion (no heat addition — already applied incrementally)
          if (slot.state === 'cooking' && elapsed >= slot.cookDuration) {
            newPreparedItems.push(slot.produces)
            delete newActiveUsers[slot.user]
            slotsChanged = true
            messages.push({
              id: nextMsgId++,
              username: 'KITCHEN',
              text: `${slot.user} finished ${slot.target.replace(/_/g, ' ')}!`,
              type: 'success',
            })
            newStations[id] = { ...newStations[id], lastCompletion: { ingredient: slot.produces, at: now, by: slot.user } }
            // slot NOT pushed — removed (auto-collected)
          } else {
            updatedSlots.push(updatedSlot)
          }
        }

        if (slotsChanged && !newStations[id].overheated) {
          newStations[id] = { ...newStations[id], heat: currentHeat, slots: updatedSlots }
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

      // Expire timed modifiers
      const cookingSpeedModifier = state.cookingSpeedModifier && now < state.cookingSpeedModifier.expiresAt
        ? state.cookingSpeedModifier : undefined
      const moneyMultiplier = state.moneyMultiplier && now < state.moneyMultiplier.expiresAt
        ? state.moneyMultiplier : undefined

      return { ...state, stations: newStations, activeUsers: newActiveUsers, preparedItems: newPreparedItems, playerStats: newPlayerStats, orders, lost, timeLeft, chatMessages: messages.slice(-200), nextMessageId: nextMsgId, cookingSpeedModifier, moneyMultiplier }
    }

    case 'ADJUST_COOK_TIMES': {
      // Shift all cookStart timestamps forward by the pause duration so elapsed
      // calculations exclude the time the game was paused.
      const { offset } = action
      const newStations = { ...state.stations }
      for (const [id, station] of Object.entries(newStations)) {
        if (station.slots.length === 0) continue
        newStations[id] = {
          ...station,
          slots: station.slots.map(slot => ({ ...slot, cookStart: slot.cookStart + offset })),
        }
      }
      return { ...state, stations: newStations }
    }

    case 'SET_STATION_HEAT': {
      const { stationId, heat } = action
      const station = state.stations[stationId]
      if (!station) return state
      return { ...state, stations: { ...state.stations, [stationId]: { ...station, heat: Math.max(0, Math.min(100, heat)) } } }
    }

    case 'OVERHEAT_STATION': {
      const station = state.stations[action.stationId]
      if (!station) return state
      return { ...state, stations: { ...state.stations, [action.stationId]: { ...station, slots: [], heat: 100, overheated: true, extinguishVotes: [] } } }
    }

    case 'REMOVE_PREPARED_ITEMS': {
      const count = Math.min(action.count, state.preparedItems.length)
      if (count === 0) return state
      const items = [...state.preparedItems]
      for (let i = 0; i < count; i++) {
        const idx = Math.floor(Math.random() * items.length)
        items.splice(idx, 1)
      }
      return addMsg({ ...state, preparedItems: items }, 'KITCHEN', `🐀 Rats stole ${count} prepared ingredient(s)!`, 'error')
    }

    case 'SET_COOKING_SPEED_MODIFIER':
      return { ...state, cookingSpeedModifier: { multiplier: action.multiplier, expiresAt: action.expiresAt } }

    case 'DISABLE_STATIONS': {
      const current = state.disabledStations ?? []
      const merged = [...new Set([...current, ...action.stationIds])]
      return { ...state, disabledStations: merged }
    }

    case 'ENABLE_STATIONS': {
      const current = state.disabledStations ?? []
      const remaining = current.filter(id => !action.stationIds.includes(id))
      return { ...state, disabledStations: remaining.length > 0 ? remaining : undefined }
    }

    case 'ADD_MONEY_MULTIPLIER':
      return { ...state, moneyMultiplier: { multiplier: action.multiplier, expiresAt: action.expiresAt } }

    case 'ADD_PREPARED_ITEMS':
      return addMsg(
        { ...state, preparedItems: [...state.preparedItems, ...action.items] },
        'KITCHEN', `🧩 Mystery solved! ${action.items.length} ingredients added to the tray!`, 'success'
      )

    case 'EXTEND_ORDER_PATIENCE': {
      const updatedOrders = state.orders.map(o =>
        o.served ? o : { ...o, patienceLeft: Math.min(o.patienceMax, o.patienceLeft + action.ms) }
      )
      return addMsg({ ...state, orders: updatedOrders }, 'KITCHEN', `🕺 Dance worked! All orders got extra time!`, 'success')
    }

    case 'RECORD_EVENT_PARTICIPATION':
      return addStat(state, action.user, 'eventParticipations', 1)

    case 'JOIN_TEAM': {
      const teams = { ...(state.teams ?? {}), [action.username]: action.team }
      return addMsg({ ...state, teams }, 'KITCHEN', `${action.username} joined Team ${action.team === 'red' ? '🔴 Red' : '🔵 Blue'}!`, 'system')
    }

    case 'BALANCE_TEAMS': {
      const players = Object.keys(state.teams ?? {})
      const shuffled = [...players].sort(() => Math.random() - 0.5)
      const balanced: Record<string, 'red' | 'blue'> = {}
      shuffled.forEach((p, i) => { balanced[p] = i % 2 === 0 ? 'red' : 'blue' })
      return addMsg({ ...state, teams: balanced }, 'KITCHEN', '⚖️ Teams auto-balanced!', 'system')
    }

    case 'MOVE_TO_TEAM': {
      const teams = { ...(state.teams ?? {}), [action.username]: action.team }
      return addMsg({ ...state, teams }, 'KITCHEN', `${action.username} moved to Team ${action.team === 'red' ? '🔴 Red' : '🔵 Blue'}`, 'system')
    }

    default:
      return state
  }
}
