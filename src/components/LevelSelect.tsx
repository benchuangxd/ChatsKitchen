import { LevelProgress } from '../state/types'
import { getLevelConfig } from '../data/levels'
import styles from './LevelSelect.module.css'

interface Props {
  progress: LevelProgress
  onSelectLevel: (level: number) => void
  onBack: () => void
  twitchChannel: string | null
  twitchConnected: boolean
}

export default function LevelSelect({ progress, onSelectLevel, onBack, twitchChannel, twitchConnected }: Props) {
  return (
    <div className={styles.screen}>
      <div className={styles.leftCol}>
        <button className={styles.backBtn} onClick={onBack}>{'\u{2190}'} Back</button>
        <h1 className={styles.title}>Select Level</h1>
        <div className={styles.subtitle}>PROGRESS will disappear / be deleted, take a screenshot to flex your achievements if you would like :D</div>
        {twitchConnected && twitchChannel && (
          <div className={styles.twitchStatus}>
            <span className={styles.twitchDot} />
            Welcome <span className={styles.twitchChannel}>{twitchChannel}</span> and your community!
          </div>
        )}
      </div>

      <div className={styles.rightCol}>
        <div className={styles.grid}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map(level => {
            const config = getLevelConfig(level)
            const bestStars = progress[level] || 0
            return (
              <button
                key={level}
                className={styles.card}
                onClick={() => onSelectLevel(level)}
              >
                <div className={styles.levelNum}>Level {level}</div>
                <div className={styles.stars}>
                  {[1, 2, 3].map(s => (
                    <span key={s} className={s <= bestStars ? styles.starFilled : styles.starEmpty}>
                      {'\u{2B50}'}
                    </span>
                  ))}
                </div>
                <div className={styles.thresholds}>
                  {config.stars.map((t, i) => (
                    <span key={i} className={i < bestStars ? styles.thresholdDone : styles.threshold}>
                      ${t}
                    </span>
                  ))}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
