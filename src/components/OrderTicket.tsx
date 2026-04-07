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

  const isServed = order.outcome === 'served'
  const isLost = order.outcome === 'lost'
  const reward = recipe.reward + Math.max(0, Math.floor((order.patienceLeft / order.patienceMax) * 30))
  const outcomeClass = isServed ? styles.ticketServed : isLost ? styles.ticketLost : ''

  return (
    <div className={styles.ticketWrapper}>
      <div className={`${styles.ticket} ${urgencyClass} ${outcomeClass}`}>
        <div className={styles.header} style={{ backgroundColor: barColor }}>
          #{order.id} {recipe.emoji} {recipe.name}
        </div>
        <div className={styles.body}>
          <div className={styles.divider} />
          <div className={styles.ingredients}>
            {recipe.plate.map((item, i) => (
              <span key={i} className={styles.ingredientEmoji}>{INGREDIENT_EMOJI[item] || '?'}</span>
            ))}
          </div>
          <div className={styles.patienceBg}>
            <div className={styles.patienceFill} style={{ width: `${urgency * 100}%`, backgroundColor: barColor }} />
          </div>
        </div>
        {isLost && <div className={styles.fireOverlay} />}
      </div>
      {isServed && <div className={styles.moneyFloat}>+${reward}</div>}
    </div>
  )
}
