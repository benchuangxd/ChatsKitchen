import { useEffect, useRef } from 'react'
import { GameAction } from '../state/gameReducer'
import { GameState } from '../state/types'

export function useGameLoop(
  state: GameState,
  dispatch: React.Dispatch<GameAction>,
  onGameOver?: () => void,
  paused?: boolean,
  resetKey?: number,
) {
  const lastTimeRef = useRef(Date.now())
  const gameTimeRef = useRef(0)
  const orderTimerRef = useRef(0)
  const firstOrderSpawned = useRef(false)
  const gameOverFired = useRef(false)
  const stateRef = useRef(state)
  stateRef.current = state
  const pausedRef = useRef(paused)
  pausedRef.current = paused
  const prevPausedRef = useRef(paused)
  const pauseStartRef = useRef<number | null>(null)

  // Reset refs when a new game starts (timeLeft is full and no orders served yet)
  useEffect(() => {
    if (onGameOver) {
      lastTimeRef.current = Date.now()
      gameTimeRef.current = 0
      orderTimerRef.current = 0
      firstOrderSpawned.current = false
      gameOverFired.current = false
    }
  }, [onGameOver, resetKey])

  useEffect(() => {
    if (!onGameOver) return // Only run when game is active

    const interval = setInterval(() => {
      const now = Date.now()
      const delta = now - lastTimeRef.current
      lastTimeRef.current = now
      gameTimeRef.current += delta

      const s = stateRef.current
      const nowPaused = pausedRef.current
      const wasPaused = prevPausedRef.current

      // Detect pause start
      if (!wasPaused && nowPaused) {
        pauseStartRef.current = now
      }

      // Detect unpause — shift all cookStart timestamps forward so elapsed
      // calculations exclude the time spent paused
      if (wasPaused && !nowPaused && pauseStartRef.current !== null) {
        const pauseDuration = now - pauseStartRef.current
        dispatch({ type: 'ADJUST_COOK_TIMES', offset: pauseDuration })
        pauseStartRef.current = null
      }

      prevPausedRef.current = nowPaused

      // Check game over before ticking
      if (s.timeLeft <= 0 && !gameOverFired.current) {
        gameOverFired.current = true
        onGameOver()
        return
      }

      if (nowPaused) return

      // Tick game state
      dispatch({ type: 'TICK', delta, now })

      // Spawn orders
      orderTimerRef.current += delta
      const orderInterval = 13000 / s.orderSpawnRate

      if (!firstOrderSpawned.current && gameTimeRef.current > 2000) {
        dispatch({ type: 'SPAWN_ORDER', now })
        firstOrderSpawned.current = true
        orderTimerRef.current = 0
      } else if (orderTimerRef.current > orderInterval) {
        dispatch({ type: 'SPAWN_ORDER', now })
        orderTimerRef.current = 0
      }
    }, 100)

    return () => clearInterval(interval)
  }, [dispatch, onGameOver])
}
