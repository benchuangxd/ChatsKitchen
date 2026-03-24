import { GameState } from '../state/types'
import { RECIPES, INGREDIENT_EMOJI } from '../data/recipes'
import styles from './AssemblyArea.module.css'

interface Props {
  state: GameState
}

const MAX_PLATES = 5

export default function AssemblyArea({ state }: Props) {
  // Match each plated dish to a pending order for serve hints
  const matchedPlates: { dish: string; orderId: number }[] = []
  const usedOrderIds = new Set<number>()

  for (const dish of state.platedDishes) {
    const order = state.orders.find(o => !o.served && o.dish === dish && !usedOrderIds.has(o.id))
    if (order) {
      usedOrderIds.add(order.id)
      matchedPlates.push({ dish, orderId: order.id })
    } else {
      matchedPlates.push({ dish, orderId: 0 })
    }
  }

  return (
    <div className={styles.assembly}>
      <div className={styles.divider}>— ASSEMBLY —</div>
      <div className={styles.plates}>
        {Array.from({ length: MAX_PLATES }, (_, i) => {
          const plate = matchedPlates[i]

          if (!plate) {
            return (
              <div key={i} className={`${styles.plate} ${styles.empty}`}>
                <div className={styles.plateNum}>#{i + 1}</div>
                <div className={styles.plateIcon}>{'\u{1F37D}\u{FE0F}'}</div>
                <div className={styles.emptyLabel}>empty</div>
              </div>
            )
          }

          const recipe = RECIPES[plate.dish]
          return (
            <div key={i} className={`${styles.plate} ${styles.filled}`}>
              <div className={styles.plateNum}>#{i + 1}</div>
              <div className={styles.dishName}>{recipe.emoji} {recipe.name}</div>
              <div className={styles.ingredients}>
                {recipe.plate.map((item, j) => (
                  <span key={j} className={styles.ingredientEmoji}>
                    {INGREDIENT_EMOJI[item] || '?'}
                  </span>
                ))}
              </div>
              {plate.orderId > 0 && (
                <div className={styles.serveHint}>!serve {plate.orderId}</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
