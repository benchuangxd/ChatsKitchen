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
                <li>Orders appear at the top with the order number, dish name, ingredients needed, and time remaining.</li>
                <li>Players type commands in chat to prepare ingredients at the cooking stations.</li>
                <li>Once ingredients are prepared, serve the matching order number to complete it.</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h3>Core Commands</h3>
              <div className={styles.commandGrid}>
                <span><code>chop lettuce</code></span>
                <span><code>grill patty</code></span>
                <span><code>fry fish</code></span>
                <span><code>boil pasta</code></span>
                <span><code>toast bun</code></span>
                <span><code>take lettuce</code></span>
                <span><code>serve [order#]</code></span>
                <span><code>extinguish [station]</code></span>
              </div>
              <p className={styles.note}>Chopping auto-deposits. For all other stations, use <code>take</code> once done.</p>
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
                          {i < recipe.steps.length - 1 && <span className={styles.recipeArrow}>→</span>}
                        </span>
                      ))}
                    </div>
                    <div className={styles.recipeCardServe}>then <code>serve [#]</code></div>
                  </div>
                ))}
              </div>
            </section>

            <section className={styles.section}>
              <h3>Simple Flow</h3>
              <ul className={styles.list}>
                <li>Read the order ticket — it shows which ingredients are needed.</li>
                <li>Cook or prep each ingredient. Chopping auto-deposits; other stations need <code>take</code>.</li>
                <li>Use <code>serve [order#]</code> when all required ingredients are in the prepared tray.</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h3>Helpful Tips</h3>
              <ul className={styles.list}>
                <li>Connect to Twitch before playing if you want to play with your community.</li>
                <li>Open the in-game <code>Commands &amp; Recipes</code> panel anytime for a quick reference.</li>
                <li>Free Play uses your Options settings, while Levels use fixed parameters.</li>
                <li>If something catches 🔥 fire, type <code>extinguish [station]</code> fast!</li>
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
