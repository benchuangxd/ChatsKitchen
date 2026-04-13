import { STATION_DEFS, RECIPES } from '../data/recipes'
import styles from './CommandsStrip.module.css'

interface Props {
  stationIds: string[]
  enabledRecipes: string[]
}

function getTargets(stationId: string, enabledRecipes: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const key of enabledRecipes) {
    const recipe = RECIPES[key]
    if (!recipe) continue
    for (const step of recipe.steps) {
      if (step.station === stationId && !seen.has(step.target)) {
        seen.add(step.target)
        out.push(step.target)
      }
    }
  }
  return out
}

export default function CommandsStrip({ stationIds, enabledRecipes }: Props) {
  const groups: { label: string; targets: string }[] = []

  for (const id of stationIds) {
    const def = STATION_DEFS[id]
    if (!def) continue
    const targets = getTargets(id, enabledRecipes)
    for (const action of def.actions) {
      const relevantTargets = targets.filter(t =>
        enabledRecipes.some(key =>
          RECIPES[key]?.steps.some(s => s.action === action && s.station === id && s.target === t)
        )
      )
      if (relevantTargets.length > 0) {
        groups.push({ label: action, targets: '[ingredient]' })
      }
    }
  }

  groups.push({ label: 'serve', targets: '[order#]' })
  groups.push({ label: 'cool', targets: '[station]' })
  groups.push({ label: 'extinguish', targets: '[station]' })

  return (
    <div className={styles.strip}>
      {groups.map((g, i) => (
        <span key={i} className={styles.group}>
          {i > 0 && <span className={styles.sep} />}
          <span className={styles.cmd}>{g.label}</span>
          {g.targets && <span className={styles.args}>{g.targets}</span>}
        </span>
      ))}
    </div>
  )
}
