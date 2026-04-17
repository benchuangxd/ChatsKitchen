import styles from './CreditsScreen.module.css'

interface Props {
  onBack: () => void
}

export default function CreditsScreen({ onBack }: Props) {
  return (
    <div className={styles.screen}>
      <button className={styles.backBtn} onClick={onBack}>← Back</button>
      <h1 className={styles.title}>Credits</h1>

      <div className={styles.content}>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Contributors</h2>
          <ul className={styles.list}>
            <li className={styles.item}>
              <span className={styles.name}>THIANzeren</span>
              <span className={styles.role}>Game Design & Development</span>
            </li>
            <li className={styles.item}>
              <span className={styles.name}>[Contributor Name]</span>
              <span className={styles.role}>[Role]</span>
            </li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Art Credits</h2>
          <ul className={styles.list}>
            <li className={styles.item}>
              <span className={styles.name}>[Artist Name]</span>
              <span className={styles.role}>[Asset description]</span>
            </li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Music Credits</h2>
          <ul className={styles.list}>
            <li className={styles.item}>
              <span className={styles.name}>[Track Title]</span>
              <span className={styles.role}>[Artist / Source]</span>
            </li>
          </ul>
        </section>

      </div>
    </div>
  )
}
