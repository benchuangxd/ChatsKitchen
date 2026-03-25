import { Order } from '../state/types'
import { RECIPES, INGREDIENT_EMOJI } from '../data/recipes'
import styles from './OrderTicket.module.css'

interface Props {
  order: Order
}

export default function OrderTicket({ order }: Props) {
  const recipe = RECIPES[order.dish]
  const urgency = order.patienceLeft / order.patienceMax
  const barColor = urgency < 0.25 ? '#d94f4f' : urgency < 0.5 ? '#e8943a' : '#5aad5e'

  const urgencyClass = urgency < 0.25 ? styles.critical : urgency < 0.5 ? styles.warning : styles.normal

  return (
    <div className={`${styles.ticket} ${urgencyClass}`}>
      <div className={styles.header} style={{ backgroundColor: barColor }}>
        <span className={styles.orderNum}>#{order.id}</span>
      </div>
      <div className={styles.body}>
        <div className={styles.dishName}>{recipe.emoji} {recipe.name}</div>
        <div className={styles.divider} />
        <div className={styles.ingredients}>
          {recipe.plate.map((item, i) => (
            <div key={i} className={styles.ingredientRow}>
              <span className={styles.ingredientEmoji}>{INGREDIENT_EMOJI[item] || '?'}</span>
              <span className={styles.ingredientName}>{item.replace(/_/g, ' ')}</span>
            </div>
          ))}
        </div>
        <div className={styles.patienceBg}>
          <div className={styles.patienceFill} style={{ width: `${urgency * 100}%`, backgroundColor: barColor }} />
        </div>
      </div>
    </div>
  )
}
