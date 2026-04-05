import { useState } from 'react'
import { RECIPES } from '../data/recipes'
import styles from './InfoBar.module.css'

export default function InfoBar() {
  const [open, setOpen] = useState(false)

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
              <span>chop [item]</span>
              <span>grill [item]</span>
              <span>fry [item]</span>
              <span>boil [item]</span>
              <span>toast [item]</span>
              <span>take [ingredient]</span>
              <span>plate [dish]</span>
              <span>serve [order#]</span>
              <span>extinguish [station]</span>
            </div>
            <div className={styles.hint}>
              Items: lettuce(lett), tomato, patty, bun, potato, pasta, cheese, fish
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
                    {' \u{2192} '}plate {key.replace(/_/g, ' ')} {'\u{2192}'} serve #
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
