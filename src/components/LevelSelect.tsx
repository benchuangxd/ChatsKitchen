import { LevelProgress } from '../state/types'
import { getLevelConfig } from '../data/levels'
import styles from './LevelSelect.module.css'

interface Props {
  progress: LevelProgress
  onSelectLevel: (level: number) => void
  onBack: () => void
}

export default function LevelSelect({ progress, onSelectLevel, onBack }: Props) {
  return (
    <div className={styles.screen}>
      <button className={styles.backBtn} onClick={onBack}>{'\u{2190}'} Back</button>
      <h1 className={styles.title}>Select Level</h1>
      <div className={styles.subtitle}>NO PROGRESS SAVED once you exit the browser, take a screenshot to flex your stars if you would like :D</div>
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
  )
}
