import { useState } from 'react'
import { INGREDIENT_EMOJI } from '../data/recipes'
import styles from './PreparedItems.module.css'

interface Props {
  items: string[]
}

export default function PreparedItems({ items }: Props) {
  const [showNames, setShowNames] = useState(false)

  const counts: Record<string, number> = {}
  for (const item of items) {
    counts[item] = (counts[item] || 0) + 1
  }

  const entries = Object.entries(counts)

  return (
    <div className={styles.prep}>
      <div className={styles.header}>
        <div className={styles.divider}>— PREPPED INGREDIENTS —</div>
        <button className={styles.toggle} onClick={() => setShowNames(s => !s)}>
          {showNames ? 'Hide names' : 'Show names'}
        </button>
      </div>
      <div className={styles.items}>
        {entries.length > 0 ? entries.map(([item, count]) => (
          <div key={item} className={styles.pill}>
            <span className={styles.emoji}>{INGREDIENT_EMOJI[item] || '?'}</span>
            <span className={styles.count}>{count > 1 ? `\u{00D7}${count}` : ''}</span>
            {showNames && <span className={styles.name}>{item.replace(/_/g, ' ')}</span>}
          </div>
        )) : (
          <div className={styles.empty}>No ingredients prepared</div>
        )}
      </div>
    </div>
  )
}
