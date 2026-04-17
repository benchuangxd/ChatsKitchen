import { Order } from '../state/types'
import { RECIPES, INGREDIENT_EMOJI } from '../data/recipes'
import FoodIcon from './FoodIcon'
import styles from './OrderTicket.module.css'

interface Props {
  order: Order
  orderNumber: number
  simple?: boolean
}

const STRIP_PREFIX = /^(chopped|grilled|fried|boiled|roasted|toasted|sliced|steamed|wok|simmered|cooked)_/

export default function OrderTicket({ order, orderNumber, simple = false }: Props) {
  const recipe = RECIPES[order.dish]
  const urgency = order.patienceLeft / order.patienceMax
  const barColor = urgency < 0.25 ? '#d94f4f' : urgency < 0.5 ? '#e8943a' : '#5aad5e'
  const urgencyClass = urgency < 0.25 ? styles.critical : urgency < 0.5 ? styles.warning : styles.normal

  const isServed = order.outcome === 'served'
  const isLost = order.outcome === 'lost'
  const actualReward = Math.round(recipe.reward + Math.max(0, Math.floor((order.patienceLeft / order.patienceMax) * 30)))
  const outcomeClass = isServed ? styles.ticketServed : isLost ? styles.ticketLost : ''

  if (simple) {
    return (
      <div className={styles.ticketWrapper}>
        <div className={`${styles.ticketSimple} ${urgencyClass} ${outcomeClass}`}>
          <div className={styles.simpleRow}>
            <span className={styles.orderNumSimple}>#{orderNumber}</span>
            <FoodIcon icon={recipe.emoji} size={24} />
            <div className={styles.simpleIngredients}>
              {recipe.plate.map((item, i) => (
                <div key={i} className={styles.simpleIngredientTile}>
                  <FoodIcon icon={INGREDIENT_EMOJI[item] || '?'} size={32} />
                </div>
              ))}
            </div>
          </div>
          <div className={styles.patienceBg}>
            <div className={styles.patienceFill} style={{ width: `${urgency * 100}%`, backgroundColor: barColor }} />
          </div>
          {isLost && <div className={styles.fireOverlay} />}
        </div>
        {isServed && (
          <div className={styles.moneyFloat}>
            +${actualReward}
            {order.servedBy && <span className={styles.moneyFloatPlayer}>{order.servedBy}</span>}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={styles.ticketWrapper}>
      <div className={`${styles.ticket} ${urgencyClass} ${outcomeClass}`}>
        <div className={styles.header}>
          <span className={styles.orderNum}>#{orderNumber}</span>
          <FoodIcon icon={recipe.emoji} size={22} className={styles.dishEmoji} />
          <span className={styles.dishName}>{recipe.name}</span>
        </div>
        <div className={styles.body}>
          <div className={styles.ingredients}>
            {recipe.plate.map((item, i) => (
              <div key={i} className={styles.ingredientTile}>
                <FoodIcon icon={INGREDIENT_EMOJI[item] || '?'} size={32} className={styles.ingredientEmoji} />
                <span className={styles.ingredientName}>
                  {item.replace(STRIP_PREFIX, '').replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
          <div className={styles.patienceBg}>
            <div
              className={styles.patienceFill}
              style={{ width: `${urgency * 100}%`, backgroundColor: barColor }}
            />
          </div>
        </div>
        {isLost && <div className={styles.fireOverlay} />}
      </div>
      {isServed && (
        <div className={styles.moneyFloat}>
          +${actualReward}
          {order.servedBy && <span className={styles.moneyFloatPlayer}>{order.servedBy}</span>}
        </div>
      )}
    </div>
  )
}
