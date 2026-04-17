import { useEffect, useRef, useState, useCallback } from 'react'
import { GameState, KitchenEvent, EventType } from '../state/types'
import { GameAction } from '../state/gameReducer'
import {
  EVENT_DEFS, EVENT_SPAWN_MIN_MS, EVENT_SPAWN_MAX_MS,
  RESOLVE_THRESHOLD_RATIO,
  ANGRY_CHEF_DEBUFF_MULTIPLIER, ANGRY_CHEF_DEBUFF_DURATION_MS,
  CHEFS_CHANT_BOOST_MULTIPLIER, CHEFS_CHANT_BOOST_DURATION_MS,
  TYPING_FRENZY_MULTIPLIER, TYPING_FRENZY_DURATION_MS,
  TYPING_FRENZY_PHRASES, DANCE_PATIENCE_BONUS_MS,
  RAT_INVASION_ITEMS_STOLEN, MYSTERY_RECIPE_ITEMS_REWARDED,
  HAZARD_TIME_LIMIT_MS, OPPORTUNITY_TIME_LIMIT_MS,
  getIngredientTargets, getProducesValues, makeAnagram,
} from '../data/kitchenEventDefs'

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function calcThreshold(playerCount: number): number {
  return Math.max(1, Math.ceil(playerCount * RESOLVE_THRESHOLD_RATIO))
}

export function useKitchenEvents(
  state: GameState,
  dispatch: React.Dispatch<GameAction>,
  active: boolean,
  paused: boolean,
) {
  const [activeEvent, setActiveEvent] = useState<KitchenEvent | null>(null)

  const activeEventRef = useRef(activeEvent)
  activeEventRef.current = activeEvent
  const stateRef = useRef(state)
  stateRef.current = state
  const pausedRef = useRef(paused)
  pausedRef.current = paused
  const activeRef = useRef(active)
  activeRef.current = active
  const lastEventTypeRef = useRef<EventType | null>(null)
  const spawnTimerRef = useRef(0)
  const spawnIntervalRef = useRef(
    EVENT_SPAWN_MIN_MS + Math.random() * (EVENT_SPAWN_MAX_MS - EVENT_SPAWN_MIN_MS)
  )

  // ── Spawn a new event ──────────────────────────────────────────────────────
  const spawnEvent = useCallback(() => {
    const s = stateRef.current
    const playerCount = Object.keys(s.playerStats).length
    const threshold = calcThreshold(playerCount)

    // Build candidate pool — exclude last event type to prevent back-to-back
    let candidates = EVENT_DEFS.filter(d => d.type !== lastEventTypeRef.current)

    // Power Trip: needs at least 2 non-overheated stations
    const eligibleStations = Object.values(s.stations).filter(st => !st.overheated)
    if (eligibleStations.length < 2) {
      candidates = candidates.filter(d => d.type !== 'power_trip')
    }

    // Safety fallback — preserve the power_trip eligibility filter even when resetting
    if (candidates.length === 0) {
      candidates = eligibleStations.length < 2
        ? EVENT_DEFS.filter(d => d.type !== 'power_trip')
        : EVENT_DEFS
    }
    if (candidates.length === 0) candidates = EVENT_DEFS  // absolute last resort

    const def = pickRandom(candidates)
    lastEventTypeRef.current = def.type

    const id = `evt_${Date.now()}`
    const timeLeft = def.category === 'hazard-immediate' ? null
      : def.category === 'hazard-penalty' ? HAZARD_TIME_LIMIT_MS
      : OPPORTUNITY_TIME_LIMIT_MS

    let chosenCommand = pickRandom(def.commandPool.length > 0 ? def.commandPool : [''])
    const payload: KitchenEvent['payload'] = {}

    if (def.type === 'power_trip') {
      const shuffled = [...eligibleStations].sort(() => Math.random() - 0.5)
      const toDisable = shuffled.slice(0, 2).map(st => st.id)
      payload.disabledStations = toDisable
      dispatch({ type: 'DISABLE_STATIONS', stationIds: toDisable })
    }

    if (def.type === 'mystery_recipe') {
      const targets = getIngredientTargets(s.enabledRecipes)
      const answer = pickRandom(targets)
      payload.anagramAnswer = answer
      chosenCommand = makeAnagram(answer)
    }

    if (def.type === 'typing_frenzy') {
      const phrase = pickRandom(TYPING_FRENZY_PHRASES)
      payload.typingPhrase = phrase
      chosenCommand = phrase
    }

    if (def.type === 'dance') {
      payload.danceProgress = { UP: [], DOWN: [], LEFT: [], RIGHT: [] }
      chosenCommand = 'UP / DOWN / LEFT / RIGHT'
    }

    const event: KitchenEvent = {
      id,
      category: def.category,
      type: def.type,
      chosenCommand,
      progress: 0,
      threshold,
      respondedUsers: [],
      timeLeft,
      resolved: false,
      failed: false,
      payload,
    }

    const cmdDisplay = def.type === 'dance' ? 'UP / DOWN / LEFT / RIGHT'
      : chosenCommand
    const label = def.category === 'opportunity' ? '⚡ Opportunity' : '⚠️ Hazard'
    dispatch({
      type: 'ADD_CHAT',
      username: 'KITCHEN',
      text: `${label}: ${def.emoji} ${def.label}! Type ${cmdDisplay} in chat to help!`,
      msgType: 'system',
    })

    setActiveEvent(event)
  }, [dispatch])

  // ── Resolve an event ──────────────────────────────────────────────────────
  const resolveEvent = useCallback((event: KitchenEvent) => {
    const s = stateRef.current
    const now = Date.now()

    if (event.type === 'power_trip' && event.payload.disabledStations) {
      dispatch({ type: 'ENABLE_STATIONS', stationIds: event.payload.disabledStations })
    }
    if (event.type === 'chefs_chant') {
      dispatch({ type: 'SET_COOKING_SPEED_MODIFIER', multiplier: CHEFS_CHANT_BOOST_MULTIPLIER, expiresAt: now + CHEFS_CHANT_BOOST_DURATION_MS })
      dispatch({ type: 'ADD_CHAT', username: 'KITCHEN', text: `📢 YES CHEF! Cooking speed boosted for 20s!`, msgType: 'success' })
    }
    if (event.type === 'mystery_recipe') {
      const produces = getProducesValues(s.enabledRecipes)
      const items: string[] = []
      for (let i = 0; i < MYSTERY_RECIPE_ITEMS_REWARDED; i++) {
        items.push(pickRandom(produces))
      }
      dispatch({ type: 'ADD_PREPARED_ITEMS', items })
    }
    if (event.type === 'typing_frenzy') {
      dispatch({ type: 'ADD_MONEY_MULTIPLIER', multiplier: TYPING_FRENZY_MULTIPLIER, expiresAt: now + TYPING_FRENZY_DURATION_MS })
      dispatch({ type: 'ADD_CHAT', username: 'KITCHEN', text: `⚡ Money multiplier × 1.5 active for 20s!`, msgType: 'success' })
    }
    if (event.type === 'dance') {
      dispatch({ type: 'EXTEND_ORDER_PATIENCE', ms: DANCE_PATIENCE_BONUS_MS })
    }

    setActiveEvent(prev => prev?.id === event.id ? { ...prev, resolved: true, progress: 100 } : prev)
    setTimeout(() => setActiveEvent(null), 1500)
  }, [dispatch])

  // ── Fail an event ─────────────────────────────────────────────────────────
  const failEvent = useCallback((event: KitchenEvent) => {
    const now = Date.now()
    if (event.type === 'rat_invasion') {
      dispatch({ type: 'REMOVE_PREPARED_ITEMS', count: RAT_INVASION_ITEMS_STOLEN })
    }
    if (event.type === 'angry_chef') {
      dispatch({ type: 'SET_COOKING_SPEED_MODIFIER', multiplier: ANGRY_CHEF_DEBUFF_MULTIPLIER, expiresAt: now + ANGRY_CHEF_DEBUFF_DURATION_MS })
      dispatch({ type: 'ADD_CHAT', username: 'KITCHEN', text: `👨‍🍳 Chef is angry! Cooking speed reduced for 15s!`, msgType: 'error' })
    }

    setActiveEvent(prev => prev?.id === event.id ? { ...prev, failed: true } : prev)
    setTimeout(() => setActiveEvent(null), 1500)
  }, [dispatch])

  // ── 100ms tick ────────────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      if (!activeRef.current) return

      const ev = activeEventRef.current
      const isPaused = pausedRef.current

      if (!ev) {
        if (!isPaused) {
          spawnTimerRef.current += 100
          if (spawnTimerRef.current >= spawnIntervalRef.current) {
            spawnTimerRef.current = 0
            spawnIntervalRef.current = EVENT_SPAWN_MIN_MS + Math.random() * (EVENT_SPAWN_MAX_MS - EVENT_SPAWN_MIN_MS)
            spawnEvent()
          }
        }
        return
      }

      if (ev.resolved || ev.failed) return

      if (ev.timeLeft !== null && !isPaused) {
        const newTimeLeft = ev.timeLeft - 100
        if (newTimeLeft <= 0) {
          failEvent(ev)
          return
        }
        setActiveEvent(prev => prev?.id === ev.id ? { ...prev, timeLeft: newTimeLeft } : prev)
      }
    }, 100)

    return () => clearInterval(interval)
  }, [spawnEvent, failEvent])

  // ── Command handler ────────────────────────────────────────────────────────
  const handleEventCommand = useCallback((user: string, text: string) => {
    const ev = activeEventRef.current
    if (!ev || ev.resolved || ev.failed) return

    const normalized = text.trim().toUpperCase()

    if (ev.type === 'dance') {
      const dir = normalized as 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
      if (!['UP', 'DOWN', 'LEFT', 'RIGHT'].includes(dir)) return
      const prog = ev.payload.danceProgress!
      if (prog[dir].includes(user)) return

      const newProg = { ...prog, [dir]: [...prog[dir], user] }
      const minCount = Math.min(...Object.values(newProg).map(arr => arr.length))
      const progress = Math.min(100, Math.round(minCount / ev.threshold * 100))

      if (minCount >= ev.threshold) {
        resolveEvent({ ...ev, payload: { ...ev.payload, danceProgress: newProg }, progress: 100 })
      } else {
        setActiveEvent(prev => prev?.id === ev.id
          ? { ...prev, progress, payload: { ...prev.payload, danceProgress: newProg } }
          : prev)
      }
      return
    }

    const matchTarget = ev.type === 'mystery_recipe'
      ? ev.payload.anagramAnswer!.toUpperCase()
      : ev.chosenCommand

    if (normalized !== matchTarget) return
    if (ev.respondedUsers.includes(user)) return

    const newUsers = [...ev.respondedUsers, user]
    const progress = Math.min(100, Math.round(newUsers.length / ev.threshold * 100))

    if (newUsers.length >= ev.threshold) {
      resolveEvent({ ...ev, respondedUsers: newUsers, progress: 100 })
    } else {
      setActiveEvent(prev => prev?.id === ev.id
        ? { ...prev, respondedUsers: newUsers, progress }
        : prev)
    }
  }, [resolveEvent])

  // Stop events when deactivated (e.g. game ends)
  useEffect(() => {
    if (!active) {
      const ev = activeEventRef.current
      if (ev?.type === 'power_trip' && ev.payload.disabledStations) {
        dispatch({ type: 'ENABLE_STATIONS', stationIds: ev.payload.disabledStations })
      }
      setActiveEvent(null)
      spawnTimerRef.current = 0
    }
  }, [active, dispatch])

  return { activeEvent, handleEventCommand }
}
