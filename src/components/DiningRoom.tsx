import { GameState } from '../state/types'
import OrderTicket from './OrderTicket'
import styles from './DiningRoom.module.css'

interface Props {
  state: GameState
}

export default function OrdersBar({ state }: Props) {
  const activeOrders = state.orders.filter(o => !o.served || o.outcome !== undefined)

  const totalSec = Math.max(0, Math.ceil(state.timeLeft / 1000))
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  const timerStr = `${min}:${sec.toString().padStart(2, '0')}`
  const timerColor = totalSec <= 15 ? '#d94f4f' : totalSec <= 30 ? '#e8943a' : '#5cb85c'

  return (
    <div className={styles.dining}>
      <div className={styles.orderBar}>
        <div className={styles.orderBarStat}>
          <span className={styles.orderBarLabel}>TIME</span>
          <span className={styles.orderBarValue} style={{ color: timerColor }}>{timerStr}</span>
        </div>
        <div className={styles.orderBarCenter}>📋 ORDERS</div>
        <div className={styles.orderBarStat}>
          <span className={styles.orderBarLabel}>MONEY</span>
          <span className={styles.orderBarValue} style={{ color: '#f0c850' }}>${state.money}</span>
        </div>
      </div>
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
