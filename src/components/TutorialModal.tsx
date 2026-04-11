import { RECIPES } from '../data/recipes'
import styles from './TutorialModal.module.css'

interface Props {
  onClose: () => void
  onStartCooking: () => void
}

export default function TutorialModal({ onClose, onStartCooking }: Props) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <div className={styles.eyebrow}>Quick Guide</div>
            <h2 className={styles.title}>How To Play</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close tutorial">
            {'\u2715'}
          </button>
        </div>

        <div className={styles.scrollArea}>
          <div className={styles.content}>
            <section className={styles.section}>
              <h3>Goal</h3>
              <p>Work with your chat to cook dishes and serve orders before time runs out.</p>
            </section>

            <section className={styles.section}>
              <h3>How A Round Works</h3>
              <ul className={styles.list}>
                <li>Orders appear at the top with the order number, dish name, ingredients needed, and a patience timer.</li>
                <li>Players type commands in chat to prepare ingredients at the cooking stations.</li>
                <li>Once all required ingredients are ready, serve the matching order number to complete it.</li>
                <li>Orders expire if their patience runs out — a lost order counts against your team's score.</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h3>Commands</h3>
              <div className={styles.commandGrid}>
                <span><code>!chop [ingredient]</code></span>
                <span><code>!grill [ingredient]</code></span>
                <span><code>!fry [ingredient]</code></span>
                <span><code>!stir [ingredient]</code></span>
                <span><code>!steam [ingredient]</code></span>
                <span><code>!simmer [ingredient]</code></span>
                <span><code>!cook [ingredient]</code></span>
                <span><code>!toast [ingredient]</code></span>
                <span><code>!roast [ingredient]</code></span>
                <span><code>!extinguish [station]</code></span>
                <span><code>!serve [order#]</code></span>
              </div>
              <p className={styles.note}>Each player can only work one station at a time. The <code>!</code> prefix is optional.</p>
            </section>

            <section className={styles.section}>
              <h3>Recipes</h3>
              <div className={styles.recipeCardGrid}>
                {Object.values(RECIPES).map(recipe => (
                  <div key={recipe.name} className={styles.recipeCard}>
                    <div className={styles.recipeCardHeader}>
                      <span className={styles.recipeCardName}>{recipe.emoji} {recipe.name}</span>
                      <span className={styles.recipeCardReward}>${recipe.reward}</span>
                    </div>
                    <div className={styles.recipeCardSteps}>
                      {recipe.steps.map((step, i) => (
                        <span key={i} className={styles.recipeStep}>
                          <code>{step.action} {step.target}</code>
                          {i < recipe.steps.length - 1 && <span className={styles.recipeArrow}>{recipe.steps[i + 1].requires ? '→' : '+'}</span>}
                        </span>
                      ))}
                    </div>
                    <div className={styles.recipeCardServe}>then <code>serve [#]</code></div>
                  </div>
                ))}
              </div>
              <p className={styles.note}><code>+</code> steps can be done in any order. <code>→</code> steps need the prior ingredient in the tray first (e.g. chop potato before frying it).</p>
            </section>

            <section className={styles.section}>
              <h3>Helpful Tips</h3>
              <ul className={styles.list}>
                <li>Serve orders quickly — you earn a time bonus of up to +$30 based on how much patience was left.</li>
                <li>If something catches 🔥 fire, type <code>extinguish [station]</code> fast — it blocks the whole station!</li>
                <li>Connect to Twitch before playing if you want your community to join in.</li>
                <li>Enable <strong>Shortform Commands</strong> in Options to use <code>c</code>, <code>g</code>, <code>f</code>, etc. instead of full names.</li>
                <li>Open the in-game <strong>Commands &amp; Recipes</strong> panel anytime for a quick reference.</li>
              </ul>
            </section>
          </div>

          <div className={styles.footer}>
            <button className={styles.doneBtn} onClick={onStartCooking}>Start Cooking!</button>
          </div>
        </div>
      </div>
    </div>
  )
}
