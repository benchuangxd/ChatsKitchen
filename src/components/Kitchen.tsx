import { GameState } from '../state/types'
import { STATION_DEFS } from '../data/recipes'
import Station from './Station'
import PreparedItems from './PreparedItems'
import styles from './Kitchen.module.css'

interface Props {
  state: GameState
}

function getStationCapacity(stationId: string, cap: GameState['stationCapacity'], restricted: boolean): number {
  if (!restricted) return Infinity
  if (stationId === 'cutting_board') return cap.chopping
  return cap.cooking
}

export default function Kitchen({ state }: Props) {
  const stationIds = Object.keys(STATION_DEFS)

  return (
    <div className={styles.kitchen}>
      <PreparedItems items={state.preparedItems} enabledRecipes={state.enabledRecipes} />
      <div className={styles.divider}>🔥 STATIONS</div>
      <div className={styles.stations}>
        {stationIds.map(id => (
          <Station
            key={id}
            station={state.stations[id]}
            capacity={getStationCapacity(id, state.stationCapacity, state.restrictSlots)}
          />
        ))}
      </div>
    </div>
  )
}
