import { useEffect, useRef, useState, useCallback } from 'react'
import { GameState, KitchenEvent, EventType } from '../state/types'
import { GameAction } from '../state/gameReducer'
import { getAudioManager } from '../audio/AudioManager'
import {
  EVENT_DEFS, EVENT_SPAWN_MIN_MS, EVENT_SPAWN_MAX_MS,
  RESOLVE_THRESHOLD_RATIO,
  ANGRY_CHEF_DEBUFF_MULTIPLIER, ANGRY_CHEF_DEBUFF_DURATION_MS,
  CHEFS_CHANT_BOOST_MULTIPLIER, CHEFS_CHANT_BOOST_DURATION_MS,
  TYPING_FRENZY_MULTIPLIER, TYPING_FRENZY_DURATION_MS,
  makeTypingFrenzyPhrase, makePowerTripEquation, makeDanceSequence, DANCE_PATIENCE_BONUS_MS,
  RAT_INVASION_ITEMS_STOLEN, MYSTERY_RECIPE_ITEMS_REWARDED,
  EVENT_DURATION_MS,
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
  enabledEvents: EventType[] = [],
  spawnMinMs: number = EVENT_SPAWN_MIN_MS,
  spawnMaxMs: number = EVENT_SPAWN_MAX_MS,
  eventDurationMs: number = EVENT_DURATION_MS,
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
  const enabledEventsRef = useRef(enabledEvents)
  enabledEventsRef.current = enabledEvents
  const spawnMinRef = useRef(spawnMinMs)
  spawnMinRef.current = spawnMinMs
  const spawnMaxRef = useRef(spawnMaxMs)
  spawnMaxRef.current = spawnMaxMs
  const eventDurationRef = useRef(eventDurationMs)
  eventDurationRef.current = eventDurationMs
  const lastEventTypeRef = useRef<EventType | null>(null)
  const concludingEventIdRef = useRef<string | null>(null)  // prevents double resolve/fail if React hasn't re-rendered yet
  const spawnTimerRef = useRef(0)
  const pickSpawnInterval = () => {
    const lo = spawnMinRef.current
    const hi = spawnMaxRef.current
    return hi > lo ? lo + Math.random() * (hi - lo) : lo
  }

  const spawnIntervalRef = useRef(pickSpawnInterval())

  // Reset the spawn countdown whenever the min/max settings change so the new
  // interval takes effect immediately rather than after the old one expires.
  useEffect(() => {
    spawnIntervalRef.current = pickSpawnInterval()
    spawnTimerRef.current = 0
  }, [spawnMinMs, spawnMaxMs])

  // ── Spawn a new event ──────────────────────────────────────────────────────
  const spawnEvent = useCallback(() => {
    const s = stateRef.current
    const playerCount = Object.keys(s.playerStats).length
    const threshold = calcThreshold(playerCount)

    const enabled = enabledEventsRef.current
    const eligibleStations = Object.values(s.stations).filter(st => !st.overheated)

    const isAllowed = (type: EventType) =>
      (enabled.length === 0 || enabled.includes(type)) &&
      !(type === 'power_trip' && eligibleStations.length < 2)

    // Prefer no back-to-back; fall back to full pool if only one event type enabled
    let candidates = EVENT_DEFS.filter(d => isAllowed(d.type) && d.type !== lastEventTypeRef.current)
    if (candidates.length === 0) candidates = EVENT_DEFS.filter(d => isAllowed(d.type))
    if (candidates.length === 0) return  // all events disabled or ineligible

    const def = pickRandom(candidates)
    lastEventTypeRef.current = def.type

    const id = `evt_${Date.now()}`
    const timeLeft = def.category === 'hazard-immediate' ? null : eventDurationRef.current

    let chosenCommand = pickRandom(def.commandPool.length > 0 ? def.commandPool : [''])
    const payload: KitchenEvent['payload'] = {}

    if (def.type === 'power_trip') {
      const shuffled = [...eligibleStations].sort(() => Math.random() - 0.5)
      const toDisable = shuffled.slice(0, 2).map(st => st.id)
      payload.disabledStations = toDisable
      dispatch({ type: 'DISABLE_STATIONS', stationIds: toDisable })
      const eq = makePowerTripEquation()
      payload.powerTripAnswer = eq.answer
      chosenCommand = eq.display
    }

    if (def.type === 'mystery_recipe') {
      const targets = getIngredientTargets(s.enabledRecipes)
      const raw = pickRandom(targets)
      const answer = raw.replace(/_/g, ' ')  // normalise so players never need to type underscores
      payload.anagramAnswer = answer
      chosenCommand = makeAnagram(answer)
    }

    if (def.type === 'typing_frenzy') {
      const phrase = makeTypingFrenzyPhrase()
      payload.typingPhrase = phrase
      chosenCommand = phrase
    }

    if (def.type === 'dance') {
      const sequence = makeDanceSequence()
      payload.danceSequence = sequence
      chosenCommand = sequence.join(' ')
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
      initialTimeLeft: timeLeft,
      resolved: false,
      failed: false,
      payload,
    }

    const label = def.category === 'opportunity' ? '⚡ Opportunity' : '⚠️ Hazard'
    const chatText = def.type === 'dance'
      ? `${label}: ${def.emoji} ${def.label}! Memorise the sequence and type it in chat!`
      : `${label}: ${def.emoji} ${def.label}! Type ${chosenCommand} in chat to help!`
    dispatch({
      type: 'ADD_CHAT',
      username: 'KITCHEN',
      text: chatText,
      msgType: 'system',
    })

    concludingEventIdRef.current = null
    setActiveEvent(event)

    const am = getAudioManager()
    am.startEventAmbient(def.audio.ambient)
  }, [dispatch])

  // ── Resolve an event ──────────────────────────────────────────────────────
  const resolveEvent = useCallback((event: KitchenEvent) => {
    if (concludingEventIdRef.current === event.id) return
    concludingEventIdRef.current = event.id
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

    const def = EVENT_DEFS.find(d => d.type === event.type)!
    const am = getAudioManager()
    am.stopEventAmbient()
    setTimeout(() => am.playEventSfx(def.audio.success), 500)

    setTimeout(() => setActiveEvent(null), 1500)
  }, [dispatch])

  // ── Fail an event ─────────────────────────────────────────────────────────
  const failEvent = useCallback((event: KitchenEvent) => {
    if (concludingEventIdRef.current === event.id) return
    concludingEventIdRef.current = event.id
    const now = Date.now()
    if (event.type === 'rat_invasion') {
      dispatch({ type: 'REMOVE_PREPARED_ITEMS', count: RAT_INVASION_ITEMS_STOLEN })
    }
    if (event.type === 'angry_chef') {
      dispatch({ type: 'SET_COOKING_SPEED_MODIFIER', multiplier: ANGRY_CHEF_DEBUFF_MULTIPLIER, expiresAt: now + ANGRY_CHEF_DEBUFF_DURATION_MS })
      dispatch({ type: 'ADD_CHAT', username: 'KITCHEN', text: `👨‍🍳 Chef is angry! Cooking speed reduced for 15s!`, msgType: 'error' })
    }

    setActiveEvent(prev => prev?.id === event.id ? { ...prev, failed: true } : prev)

    const def = EVENT_DEFS.find(d => d.type === event.type)!
    const am = getAudioManager()
    am.stopEventAmbient()
    if (def.audio.fail) setTimeout(() => am.playEventSfx(def.audio.fail!), 500)

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
            spawnIntervalRef.current = pickSpawnInterval()
            spawnEvent()
          }
        }
        return
      }

      if (ev.resolved || ev.failed || concludingEventIdRef.current === ev.id) return

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

    const normalized = text.trim()

    const matchTarget = ev.type === 'mystery_recipe'
      ? ev.payload.anagramAnswer!.toUpperCase()
      : ev.type === 'power_trip'
      ? String(ev.payload.powerTripAnswer!)
      : ev.chosenCommand

    if (normalized !== matchTarget) return
    if (ev.respondedUsers.includes(user)) return

    const newUsers = [...ev.respondedUsers, user]
    const progress = Math.min(100, Math.round(newUsers.length / ev.threshold * 100))
    dispatch({ type: 'RECORD_EVENT_PARTICIPATION', user })

    if (newUsers.length >= ev.threshold) {
      resolveEvent({ ...ev, respondedUsers: newUsers, progress: 100 })
    } else {
      setActiveEvent(prev => prev?.id === ev.id
        ? { ...prev, respondedUsers: newUsers, progress }
        : prev)
    }
  }, [resolveEvent, dispatch])

  // Stop events when deactivated (e.g. game ends)
  useEffect(() => {
    if (!active) {
      const ev = activeEventRef.current
      if (ev?.type === 'power_trip' && ev.payload.disabledStations) {
        dispatch({ type: 'ENABLE_STATIONS', stationIds: ev.payload.disabledStations })
      }
      getAudioManager().stopEventAmbient()
      setActiveEvent(null)
      spawnTimerRef.current = 0
      concludingEventIdRef.current = null
    }
  }, [active, dispatch])

  return { activeEvent, handleEventCommand }
}
