import { GameState } from '../state/types'
import { RECIPES } from '../data/recipes'
import styles from './AssemblyArea.module.css'

interface Props {
  state: GameState
}

export default function AssemblyArea({ state }: Props) {
  // Match each plated dish to a pending order for serve hints
  const usedOrderIds = new Set<number>()
  const matchedPlates = state.platedDishes.map(dish => {
    const order = state.orders.find(o => !o.served && o.dish === dish && !usedOrderIds.has(o.id))
    if (order) usedOrderIds.add(order.id)
    return { dish, orderId: order?.id ?? 0 }
  })

  return (
    <div className={styles.assembly}>
      <div className={styles.divider}>🍽️ READY TO SERVE</div>
      <div className={styles.plates}>
        {matchedPlates.map((plate, i) => {
          const recipe = RECIPES[plate.dish]
          return (
            <div key={i} className={styles.plate}>
              <span className={styles.emoji}>{recipe.emoji}</span>
              <span className={styles.name}>{recipe.name}</span>
              {plate.orderId > 0 && (
                <span className={styles.serveHint}>!serve {plate.orderId}</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
