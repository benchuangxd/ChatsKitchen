import { GameState } from '../state/types'
import { STATION_DEFS } from '../data/recipes'
import Station from './Station'
import PreparedItems from './PreparedItems'
import AssemblyArea from './AssemblyArea'
import styles from './Kitchen.module.css'

interface Props {
  state: GameState
}

function getStationCapacity(stationId: string, cap: GameState['stationCapacity']): number {
  if (stationId === 'cutting_board') return cap.chopping
  if (stationId === 'plating') return cap.plating
  return cap.cooking
}

export default function Kitchen({ state }: Props) {
  const cookingStationIds = Object.keys(STATION_DEFS).filter(id => id !== 'plating')

  return (
    <div className={styles.kitchen}>
      <div className={styles.divider}>— STATIONS —</div>
      <div className={styles.stations}>
        {cookingStationIds.map(id => (
          <Station
            key={id}
            station={state.stations[id]}
            capacity={getStationCapacity(id, state.stationCapacity)}
          />
        ))}
      </div>
      <PreparedItems items={state.preparedItems} />
      <div className={styles.divider}>— PLATING —</div>
      <div className={styles.stations}>
        <Station
          station={state.stations['plating']}
          capacity={state.stationCapacity.plating}
        />
      </div>
      <AssemblyArea state={state} />
    </div>
  )
}
