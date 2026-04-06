import { PlayerStats } from '../state/types'
import { NAME_COLORS } from '../data/recipes'
import { getLevelConfig, getStarRating } from '../data/levels'
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
  level: number | null
  onPlayAgain: () => void
  onNextLevel?: () => void
  onMenu: () => void
}

export default function GameOver({ money, served, lost, playerStats, level, onPlayAgain, onNextLevel, onMenu }: Props) {
  const totalActions = (s: PlayerStats) => s.cooked + s.taken + s.served + s.extinguished - s.firesCaused
  const leaderboard = Object.entries(playerStats)
    .sort(([, a], [, b]) => totalActions(b) - totalActions(a))

  const stars = level != null ? getStarRating(level, money) : null
  const config = level != null ? getLevelConfig(level) : null

  return (
    <div className={styles.screen}>
      <h1 className={styles.title}>{level != null ? `Level ${level} Complete!` : "Time's Up!"}</h1>

      {stars != null && config && (
        <div className={styles.starSection}>
          <div className={styles.starRow}>
            {[1, 2, 3].map(s => (
              <span key={s} className={s <= stars ? styles.starFilled : styles.starEmpty}>
                {'\u{2B50}'}
              </span>
            ))}
          </div>
          <div className={styles.starThresholds}>
            {config.stars.map((t, i) => (
              <span key={i} className={money >= t ? styles.thresholdMet : styles.thresholdUnmet}>
                {i + 1}{'\u{2B50}'} ${t}
              </span>
            ))}
          </div>
        </div>
      )}

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
            <span className={styles.lbDetail} title="Cooked">{'\u{1F373}'}</span>
            <span className={styles.lbDetail} title="Taken">{'\u{270B}'}</span>
            <span className={styles.lbDetail} title="Served">{'\u{2705}'}</span>
            <span className={styles.lbDetail} title="Extinguished">{'\u{1F9EF}'}</span>
            <span className={styles.lbDetail} title="Fires Caused">{'\u{1F525}'}</span>
            <span className={styles.lbTotal}>Total</span>
          </div>
          {leaderboard.map(([name, stats], i) => {
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
          })}
        </div>
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
    </div>
  )
}
