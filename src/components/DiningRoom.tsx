import { useState } from 'react'
import { GameState } from '../state/types'
import OrderTicket from './OrderTicket'
import styles from './DiningRoom.module.css'

interface Props {
  state: GameState
  isHighlighted?: boolean
  isGlitched?: boolean
}

export default function OrdersBar({ state, isHighlighted, isGlitched }: Props) {
  const [simpleTickets, setSimpleTickets] = useState(
    () => localStorage.getItem('diningRoom.simpleTickets') === 'true'
  )

  const toggleSimple = () => setSimpleTickets(v => {
    const next = !v
    localStorage.setItem('diningRoom.simpleTickets', String(next))
    return next
  })

  const activeOrders = state.orders
    .filter(o => !o.served || o.outcome !== undefined)
    .sort((a, b) => a.spawnTime - b.spawnTime)
  const pendingCount = activeOrders.filter(o => !o.outcome).length

  const totalSec = Math.max(0, Math.ceil(state.timeLeft / 1000))
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  const timerStr = `${min}:${sec.toString().padStart(2, '0')}`
  const isUrgent = totalSec <= 60

  return (
    <div className={`${styles.dining} ${isHighlighted ? styles.highlighted : ''}`}>
      <div className={styles.timeBlock}>
        <span className={styles.timeLabel}>TIME LEFT</span>
        <span className={`${styles.timeValue} ${isUrgent ? styles.urgent : ''}`}>{timerStr}</span>
      </div>
      <div className={styles.ordersHeader}>
        <span className={styles.ordersTitle}>📋 Orders</span>
        <span className={styles.ordersCount}>{pendingCount}</span>
        <button className={styles.viewToggle} onClick={toggleSimple}>
          {simpleTickets ? 'Detailed' : 'Simple'}
        </button>
      </div>
      <div className={styles.ordersList}>
        {activeOrders.map((order) => (
          <OrderTicket
            key={order.id}
            order={order}
            orderNumber={order.id}
            simple={simpleTickets}
            isGlitched={isGlitched}
          />
        ))}
        {activeOrders.length === 0 && (
          <div className={styles.empty}>No orders yet...</div>
        )}
      </div>
    </div>
  )
}
