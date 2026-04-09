import { useState } from 'react'
import { INGREDIENT_EMOJI, RECIPES } from '../data/recipes'
import styles from './PreparedItems.module.css'

interface Props {
  items: string[]
  enabledRecipes: string[]
}

export default function PreparedItems({ items, enabledRecipes }: Props) {
  const [showNames, setShowNames] = useState(true)

  const allowedIngredients = new Set(
    enabledRecipes.flatMap(key => RECIPES[key]?.steps.map(s => s.produces) ?? [])
  )
  const visibleIngredients = Object.keys(INGREDIENT_EMOJI).filter(i => allowedIngredients.has(i))

  const counts: Record<string, number> = {}
  for (const item of items) {
    counts[item] = (counts[item] || 0) + 1
  }

  return (
    <div className={styles.prep}>
      <div className={styles.header}>
        <div className={styles.divider}>🥘 PREPPED INGREDIENTS</div>
        <button className={styles.toggle} onClick={() => setShowNames(s => !s)}>
          {showNames ? 'Hide names' : 'Show names'}
        </button>
      </div>
      <div className={styles.items}>
        {visibleIngredients.map((item) => {
          const count = counts[item] || 0
          const filled = count > 0
          return (
            <div key={item} className={`${styles.tray} ${filled ? styles.trayFilled : styles.trayEmpty}`}>
              <span className={styles.emoji}>{INGREDIENT_EMOJI[item]}</span>
              <div className={styles.prepText}>
                <span className={styles.count}>×{count}</span>
                {showNames && <span className={styles.name}>{item}</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
