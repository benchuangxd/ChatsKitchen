import { useState } from 'react'
import { RECIPES } from '../data/recipes'
import styles from './InfoBar.module.css'

interface Props {
  shortformEnabled?: boolean
}

export default function InfoBar({ shortformEnabled = false }: Props) {
  const [open, setOpen] = useState(false)

  const cmd = (full: string, short: string) =>
    shortformEnabled ? `${full}/${short}` : full

  return (
    <div className={styles.bar}>
      <button className={styles.toggle} onClick={() => setOpen(o => !o)}>
        {open ? '\u{25BC}' : '\u{25B2}'} Commands & Recipes
      </button>
      {open && (
        <div className={styles.content}>
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Commands</div>
            <div className={styles.commands}>
              <span>{cmd('chop', 'c')} [item]</span>
              <span>{cmd('grill', 'g')} [item]</span>
              <span>{cmd('fry', 'f')} [item]</span>
              <span>{cmd('boil', 'b')} [item]</span>
              <span>{cmd('toast', 't')} [item]</span>
              <span>{cmd('roast', 'r')} [item]</span>
              <span>{cmd('take', 'ta')} [ingredient]</span>
              <span>{cmd('serve', 's')} [order#]</span>
              <span>extinguish [station]</span>
            </div>
            <div className={styles.hint}>
              Items: lettuce(lett), tomato, patty, bun, potato, pasta, cheese, fish, pepper
            </div>
            <div className={styles.hint}>
              Shortforms: cboard=cutting board, fburger=fish burger, msoup=mushroom soup
            </div>
          </div>
          <div className={styles.divider} />
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Recipes</div>
            <div className={styles.recipes}>
              {Object.entries(RECIPES).map(([key, recipe]) => (
                <div key={key} className={styles.recipe}>
                  <span className={styles.recipeName}>{recipe.emoji} {recipe.name}</span>
                  <span className={styles.recipeReward}>${recipe.reward}</span>
                  <span className={styles.recipeSteps}>
                    {recipe.steps.map(s => `${s.action} ${s.target}`).join(' \u{2192} ')}
                    {' \u{2192} '}serve #
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
