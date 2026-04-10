import { useState } from 'react'
import { INGREDIENT_EMOJI, RECIPES } from '../data/recipes'
import styles from './PreparedItems.module.css'

interface Props {
  items: string[]
  enabledRecipes: string[]
}

export default function PreparedItems({ items, enabledRecipes }: Props) {
  const [showNames, setShowNames] = useState(() => {
    const stored = localStorage.getItem('preparedItems.showNames')
    return stored === null ? true : stored === 'true'
  })

  const toggleShowNames = () => setShowNames(s => {
    const next = !s
    localStorage.setItem('preparedItems.showNames', String(next))
    return next
  })

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
        <div className={styles.sectionTitle}>🥘 Prepped Ingredients</div>
        <button className={styles.toggle} onClick={toggleShowNames}>
          {showNames ? 'Hide names' : 'Show names'}
        </button>
      </div>
      <div className={`${styles.items} ${showNames ? styles.itemsWithNames : styles.itemsCompact}`}>
        {visibleIngredients.map((item) => {
          const count = counts[item] || 0
          const filled = count > 0
          return (
            <div key={item} className={`${styles.tray} ${filled ? styles.trayFilled : styles.trayEmpty}`}>
              <span className={styles.emoji}>{INGREDIENT_EMOJI[item]}</span>
              {showNames && (
                <span className={styles.name}>{item.replace(/_/g, ' ')}</span>
              )}
              <span className={styles.count}>×{count}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
