import { GameState } from '../state/types'
import { getEnabledStations } from '../data/recipes'
import Station from './Station'
import PreparedItems from './PreparedItems'
import CommandsStrip from './CommandsStrip'
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
  const stationIds = getEnabledStations(state.enabledRecipes)

  return (
    <div className={styles.kitchen}>
      <PreparedItems items={state.preparedItems} enabledRecipes={state.enabledRecipes} />
      <div className={styles.stationsSection}>
        <div className={styles.stationsGrid}>
          {stationIds.map(id => (
            <Station
              key={id}
              station={state.stations[id]}
              capacity={getStationCapacity(id, state.stationCapacity, state.restrictSlots)}
              playerCount={Object.keys(state.playerStats).length}
            />
          ))}
        </div>
      </div>
      <CommandsStrip stationIds={stationIds} enabledRecipes={state.enabledRecipes} />
    </div>
  )
}
