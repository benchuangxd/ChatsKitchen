import { useState, useEffect } from 'react'
import { PlayerStats } from '../state/types'
import { NAME_COLORS } from '../data/recipes'
import styles from './GameOver.module.css'

function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return h
}

interface RoundRecord {
  money: number
  served: number
  lost: number
}

interface Props {
  money: number
  served: number
  lost: number
  playerStats: Record<string, PlayerStats>
  level: number | null
  highScore?: number
  isNewHighScore?: boolean
  roundHistory?: RoundRecord[]
  autoRestart?: boolean
  autoRestartDelay?: number
  autoRestartSignal?: number
  onPlayAgain: () => void
  onNextLevel?: () => void
  onMenu: () => void
}

export default function GameOver({ money, served, lost, playerStats, level, highScore, isNewHighScore, roundHistory, autoRestart, autoRestartDelay, autoRestartSignal, onPlayAgain, onNextLevel, onMenu }: Props) {
  const totalActions = (s: PlayerStats) => s.cooked + s.taken + s.served + s.extinguished - s.firesCaused
  const leaderboard = Object.entries(playerStats)
    .sort(([, a], [, b]) => totalActions(b) - totalActions(a))

  const [countdown, setCountdown] = useState<number | null>(null)

  // Sync countdown when autoRestart changes or !onAutoRestart re-fires (signal increments)
  useEffect(() => {
    if (autoRestart) {
      setCountdown(autoRestartDelay ?? 60)
    } else {
      setCountdown(null)
    }
  }, [autoRestart, autoRestartDelay, autoRestartSignal])

  // Tick the countdown down and fire onPlayAgain at zero
  useEffect(() => {
    if (countdown === null) return
    if (countdown <= 0) {
      onPlayAgain()
      return
    }
    const id = setTimeout(() => setCountdown(c => (c ?? 1) - 1), 1000)
    return () => clearTimeout(id)
  }, [countdown, onPlayAgain])

  const bestRoundMoney = roundHistory && roundHistory.length > 0
    ? Math.max(...roundHistory.map(r => r.money))
    : null

  const recentRounds = roundHistory
    ? roundHistory.slice(-3).reverse().map((r, i) => ({
        ...r,
        roundNum: roundHistory.length - i,
      }))
    : []

  return (
    <div className={styles.screen}>
      <div className={styles.leftCol}>
        <h1 className={styles.title}>{level != null ? `Level ${level} Complete!` : "Time's Up!"}</h1>

<div className={styles.stats}>
          <div className={styles.stat}>
            <div className={styles.statValue}>${money}</div>
            <div className={styles.statLabel}>Money Earned</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statValue}>{served}</div>
            <div className={styles.statLabel}>Orders Served</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statValue}>{lost}</div>
            <div className={styles.statLabel}>Orders Lost</div>
          </div>
        </div>

        {isNewHighScore && (
          <div className={styles.highScoreNew}>🏆 New High Score!</div>
        )}

        <div className={styles.buttons}>
          {level != null && onNextLevel && level < 10 && (
            <button className={styles.playAgainBtn} onClick={onNextLevel}>
              Next Level
            </button>
          )}
          <button className={level != null ? styles.menuBtn : styles.playAgainBtn} onClick={onPlayAgain}>
            {level != null ? 'Repeat Level' : 'Play Again'}
          </button>
          <button className={styles.menuBtn} onClick={onMenu}>
            Main Menu
          </button>
        </div>

        {level === null && (
          <div className={styles.autoRestartBar}>
            {countdown !== null ? (
              <>
                <div className={styles.autoRestartText}>
                  Auto-restarting in <span className={styles.countdownNum}>{countdown}</span>s…
                </div>
                <div className={styles.autoRestartHint}>
                  <span>!start</span> to begin now · <span>!offAutoRestart</span> to cancel
                </div>
                <button className={styles.cancelBtn} onClick={() => setCountdown(null)}>
                  Cancel
                </button>
              </>
            ) : (
              <>
                <div className={styles.autoRestartText}>Auto-restart is OFF</div>
                <div className={styles.autoRestartHint}>
                  <span>!start</span> to begin now · <span>!onAutoRestart</span> to enable
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className={styles.rightCol}>
        <div className={styles.panels}>
          {roundHistory !== undefined && (
            <div className={styles.historyPanel}>
              <div className={styles.panelTitle}>
                Round History
                {highScore !== undefined && highScore > 0 && (
                  <span className={styles.historyBest}>Best: ${highScore}</span>
                )}
              </div>
              {roundHistory.length === 0 ? (
                <div className={styles.historyEmpty}>No rounds played yet</div>
              ) : (
                <>
                  <div className={styles.historyHeader}>
                    <span className={styles.historyRound}>#</span>
                    <span className={styles.historyMoney}>Money</span>
                    <span className={styles.historyServed}>{'\u{2705}'}</span>
                    <span className={styles.historyLost}>{'\u{274C}'}</span>
                  </div>
                  {recentRounds.map((r) => (
                    <div key={r.roundNum} className={`${styles.historyRow} ${r.money === bestRoundMoney ? styles.historyRowBest : ''}`}>
                      <span className={styles.historyRound}>{r.roundNum}</span>
                      <span className={styles.historyMoney}>${r.money}</span>
                      <span className={styles.historyServed}>{r.served}</span>
                      <span className={styles.historyLost}>{r.lost}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          <div className={styles.leaderboard}>
            <div className={styles.lbStickyHead}>
              <div className={styles.lbTitle}>Leaderboard</div>
              <div className={styles.lbHeader}>
                <span className={styles.lbRank}>#</span>
                <span className={styles.lbName}>Player</span>
                <span className={styles.lbDetail} title="Cooked">{'\u{1F373}'}</span>
                <span className={styles.lbDetail} title="Taken">{'\u{270B}'}</span>
                <span className={styles.lbDetail} title="Served">{'\u{2705}'}</span>
                <span className={styles.lbDetail} title="Extinguished">{'\u{1F9EF}'}</span>
                <span className={styles.lbDetail} title="Fires Caused">{'\u{1F525}'}</span>
                <span className={styles.lbTotal}>Total</span>
              </div>
            </div>
            {leaderboard.length === 0 ? (
              <div className={styles.lbEmpty}>No players this round</div>
            ) : (
              leaderboard.map(([name, stats], i) => {
                const color = NAME_COLORS[Math.abs(hashStr(name)) % NAME_COLORS.length]
                const isYou = name === 'You'
                return (
                  <div key={name} className={`${styles.lbRow} ${isYou ? styles.lbYou : ''}`}>
                    <span className={styles.lbRank}>{i + 1}</span>
                    <span className={styles.lbName} style={{ color }}>{name}</span>
                    <span className={styles.lbDetail}>{stats.cooked}</span>
                    <span className={styles.lbDetail}>{stats.taken}</span>
                    <span className={styles.lbDetail}>{stats.served}</span>
                    <span className={styles.lbDetail}>{stats.extinguished}</span>
                    <span className={styles.lbDetail} style={{ color: '#d94f4f' }}>{stats.firesCaused}</span>
                    <span className={styles.lbTotal}>{totalActions(stats)}</span>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
