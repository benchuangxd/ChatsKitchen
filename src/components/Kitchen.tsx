import { useState } from 'react'
import { GameState } from '../state/types'
import { getEnabledStations } from '../data/recipes'
import Station from './Station'
import PreparedItems from './PreparedItems'
import CommandsStrip from './CommandsStrip'
import styles from './Kitchen.module.css'

interface Props {
  state: GameState
  tutorialHighlight?: string | null
}

function getStationCapacity(stationId: string, cap: GameState['stationCapacity'], restricted: boolean): number {
  if (!restricted) return Infinity
  if (stationId === 'cutting_board' || stationId === 'mixing_bowl' || stationId === 'grinder' || stationId === 'knead_board') return cap.chopping
  return cap.cooking
}

export default function Kitchen({ state, tutorialHighlight }: Props) {
  const stationIds = getEnabledStations(state.enabledRecipes)
  const [showCommands, setShowCommands] = useState(() =>
    localStorage.getItem('kitchen.showCommands') !== 'false'
  )

  const toggleCommands = () => setShowCommands(v => {
    const next = !v
    localStorage.setItem('kitchen.showCommands', String(next))
    return next
  })

  return (
    <div className={`${styles.kitchen} ${tutorialHighlight === 'kitchen' ? styles.highlighted : ''}`}>
      <PreparedItems items={state.preparedItems} enabledRecipes={state.enabledRecipes} isHighlighted={tutorialHighlight === 'prepared'} />
      <div className={styles.stationsSection}>
        <div className={styles.stationsGrid}>
          {stationIds.map(id => (
            <Station
              key={id}
              station={state.stations[id]}
              capacity={getStationCapacity(id, state.stationCapacity, state.restrictSlots)}
              playerCount={Object.keys(state.playerStats).length}
              isHighlighted={tutorialHighlight === id}
            />
          ))}
        </div>
      </div>
      <div className={styles.commandsRow}>
        <div className={styles.commandsHeader}>
          <button
            className={styles.commandsToggle}
            onClick={toggleCommands}
          >
            {showCommands ? '▼ Hide Commands' : '▲ Show Commands'}
          </button>
        </div>
        {showCommands && <CommandsStrip stationIds={stationIds} enabledRecipes={state.enabledRecipes} />}
      </div>
    </div>
  )
}
