import { GameState } from '../state/types'
import OrderTicket from './OrderTicket'
import styles from './DiningRoom.module.css'

interface Props {
  state: GameState
}

export default function OrdersBar({ state }: Props) {
  const activeOrders = state.orders.filter(o => !o.served)

  return (
    <div className={styles.dining}>
      <div className={styles.divider}>📋 ORDERS</div>
      <div className={styles.tables}>
        {activeOrders.map(order => (
          <OrderTicket
            key={order.id}
            order={order}
          />
        ))}
        {activeOrders.length === 0 && (
          <div className={styles.empty}>No orders yet...</div>
        )}
      </div>
    </div>
  )
}
