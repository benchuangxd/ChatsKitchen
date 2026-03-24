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
  const borderColor = barColor

  const urgencyClass = urgency < 0.25 ? styles.critical : urgency < 0.5 ? styles.warning : ''

  return (
    <div className={`${styles.ticket} ${urgencyClass}`} style={{ borderColor }}>
      <div className={styles.orderLabel}>Order #{order.id}</div>
      <div className={styles.dishName}>{recipe.emoji} {recipe.name}</div>
      <div className={styles.ingredients}>
        {recipe.plate.map((item, i) => (
          <span key={i} className={styles.ingredientEmoji} title={item.replace(/_/g, ' ')}>
            {INGREDIENT_EMOJI[item] || '?'}
          </span>
        ))}
      </div>
      <div className={styles.patienceBg}>
        <div className={styles.patienceFill} style={{ width: `${urgency * 100}%`, backgroundColor: barColor }} />
      </div>
    </div>
  )
}
