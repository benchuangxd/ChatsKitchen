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
              <p>Work with your chat to cook dishes, plate them correctly, and serve orders before time runs out.</p>
            </section>

            <section className={styles.section}>
              <h3>How A Round Works</h3>
              <ul className={styles.list}>
                <li>Orders appear on the top left with the order number, dish name, ingredients needed, and time remaining.</li>
                <li>Players type commands in chat to prepare ingredients at the cooking stations.</li>
                <li>Prepared ingredients must be plated into the matching dish, then served to the order number.</li>
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
                <span><code>plate burger</code></span>
                <span><code>serve 1</code></span>
              </div>
              <p className={styles.note}>If something catches fire, use <code>extinguish [station]</code> fast.</p>
            </section>

            <section className={styles.section}>
              <h3>Simple Flow</h3>
              <ul className={styles.list}>
                <li>Read the order ticket.</li>
                <li>Cook or prep each ingredient needed for that dish.</li>
                <li>Use `take` once an ingredients has been cooked or prepped.</li>
                <li>Use `plate [dish]` when all required ingredients are ready.</li>
                <li>Finish with `serve [order#]`.</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h3>Helpful Tips</h3>
              <ul className={styles.list}>
                <li>Connect to Twitch before playing if you want to play with your community.</li>
                <li>Open the in-game `Commands & Recipes` panel anytime for a quick reference.</li>
                <li>Free Play uses your Options settings, while Levels use fixed parameters.</li>
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
