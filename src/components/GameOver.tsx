import { PlayerStats } from '../state/types'
import { NAME_COLORS } from '../data/recipes'
import styles from './GameOver.module.css'

function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return h
}

interface Props {
  money: number
  served: number
  lost: number
  playerStats: Record<string, PlayerStats>
  onPlayAgain: () => void
  onMenu: () => void
}

export default function GameOver({ money, served, lost, playerStats, onPlayAgain, onMenu }: Props) {
  const totalActions = (s: PlayerStats) => s.cooked + s.taken + s.plated + s.served + s.extinguished
  const leaderboard = Object.entries(playerStats)
    .sort(([, a], [, b]) => totalActions(b) - totalActions(a))

  return (
    <div className={styles.screen}>
      <h1 className={styles.title}>Time's Up!</h1>

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

      {leaderboard.length > 0 && (
        <div className={styles.leaderboard}>
          <div className={styles.lbTitle}>Leaderboard</div>
          <div className={styles.lbHeader}>
            <span className={styles.lbRank}>#</span>
            <span className={styles.lbName}>Player</span>
            <span className={styles.lbDetail}>{'\u{1F373}'}</span>
            <span className={styles.lbDetail}>{'\u{1F4E6}'}</span>
            <span className={styles.lbDetail}>{'\u{1F37D}\u{FE0F}'}</span>
          </div>
          {leaderboard.map(([name, stats], i) => {
            const color = NAME_COLORS[Math.abs(hashStr(name)) % NAME_COLORS.length]
            const isYou = name === 'You'
            return (
              <div key={name} className={`${styles.lbRow} ${isYou ? styles.lbYou : ''}`}>
                <span className={styles.lbRank}>{i + 1}</span>
                <span className={styles.lbName} style={{ color }}>{name}</span>
                <span className={styles.lbDetail}>{stats.cooked}</span>
                <span className={styles.lbDetail}>{stats.plated}</span>
                <span className={styles.lbDetail}>{stats.served}</span>
              </div>
            )
          })}
        </div>
      )}

      <div className={styles.buttons}>
        <button className={styles.playAgainBtn} onClick={onPlayAgain}>
          Play Again
        </button>
        <button className={styles.menuBtn} onClick={onMenu}>
          Main Menu
        </button>
      </div>
    </div>
  )
}
