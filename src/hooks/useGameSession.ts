import { useState, useRef, useCallback } from 'react'
import { PlayerStats, RoundRecord } from '../state/types'

interface FinalStats {
  money: number
  served: number
  lost: number
  playerStats: Record<string, PlayerStats>
  teams?: Record<string, 'red' | 'blue'>
  redMoney?: number
  blueMoney?: number
  redServed?: number
  blueServed?: number
}

// Owns game-result state: finalStats, star thresholds, high score, history.
export function useGameSession() {
  const [finalStats, setFinalStats] = useState<FinalStats>({ money: 0, served: 0, lost: 0, playerStats: {} })
  const finalStatsRef = useRef<FinalStats>(finalStats)
  finalStatsRef.current = finalStats

  const [starThresholds, setStarThresholds] = useState<[number, number, number] | null>(null)

  const [freePlayHighScore, setFreePlayHighScore] = useState<number>(() => {
    try { return parseInt(localStorage.getItem('chatsKitchen_freePlayHighScore') || '0', 10) } catch { return 0 }
  })
  const [isNewHighScore, setIsNewHighScore] = useState(false)
  const [freePlayHistory, setFreePlayHistory] = useState<RoundRecord[]>(() => {
    try {
      const saved = localStorage.getItem('chatsKitchen_freePlayHistory')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })

  const resetSession = useCallback(() => {
    setFreePlayHighScore(0)
    setIsNewHighScore(false)
    setFreePlayHistory([])
    try {
      localStorage.removeItem('chatsKitchen_freePlayHighScore')
      localStorage.removeItem('chatsKitchen_freePlayHistory')
    } catch { /* ignore */ }
  }, [])

  return {
    finalStats,
    setFinalStats,
    finalStatsRef,
    starThresholds,
    setStarThresholds,
    freePlayHighScore,
    setFreePlayHighScore,
    isNewHighScore,
    setIsNewHighScore,
    freePlayHistory,
    setFreePlayHistory,
    resetSession,
  }
}
