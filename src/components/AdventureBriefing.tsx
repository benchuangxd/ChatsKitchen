import { AdventureRun, AdventureBestRun } from '../state/types'
import { RECIPES } from '../data/recipes'
import styles from './AdventureBriefing.module.css'

interface Props {
  run: AdventureRun
  bestRun: AdventureBestRun | null
  onStart: () => void
  onMenu: () => void
}

export default function AdventureBriefing({ run, bestRun, onStart, onMenu }: Props) {
  const lastResult = run.shiftResults.length > 0
    ? run.shiftResults[run.shiftResults.length - 1]
    : null

  return (
    <div className={styles.screen}>
      {/* ── LEFT ── */}
      <div className={styles.leftCol}>
        <h1 className={styles.shiftTitle}>Shift {run.currentShift}</h1>
        <div className={styles.goalLine}>Goal: ${run.currentGoal}</div>

        {lastResult && (
          <div className={styles.prevResult}>
            Previous: ${lastResult.moneyEarned} / ${lastResult.goalMoney}
            {' · '}
            <span style={{ color: '#5cb85c' }}>PASSED</span>
          </div>
        )}

        {bestRun && (
          <div className={styles.bestChip}>
            Best run: Shift {bestRun.furthestShift} · ${bestRun.totalMoney}
          </div>
        )}

        <div className={styles.buttons}>
          <button className={styles.startBtn} onClick={onStart}>START</button>
          <button className={styles.menuBtn} onClick={onMenu}>Main Menu</button>
        </div>
      </div>

      {/* ── RIGHT ── */}
      <div className={styles.rightCol}>
        <div className={styles.menuPanel}>
          <div className={styles.panelTitle}>This Shift's Menu</div>
          {run.currentRecipes.map((key, i) => {
            const recipe = RECIPES[key]
            if (!recipe) return null
            return (
              <div key={key} className={`${styles.recipeCard} ${i > 0 ? styles.recipeCardBorder : ''}`}>
                <span className={styles.recipeEmoji}>{recipe.emoji}</span>
                <span className={styles.recipeName}>{recipe.name}</span>
                <span className={styles.recipeReward}>${recipe.reward}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
