import styles from './MainMenu.module.css'

interface Props {
  onPlay: () => void
  onOptions: () => void
  onTwitch: () => void
}

export default function MainMenu({ onPlay, onOptions, onTwitch }: Props) {
  return (
    <div className={styles.menu}>
      <h1 className={styles.title}>🍳 Let Chat Cook 🔪</h1>
      <p className={styles.subtitle}>A Livestream Chat Restaurant Game — v0.1</p>
      <p className={styles.disclaimer}>Work in progress — features and balance may change</p>
      <div className={styles.buttons}>
        <button className={`${styles.btn} ${styles.btnPlay}`} onClick={onPlay}>
          Play
        </button>
        <button className={`${styles.btn} ${styles.btnTwitch}`} onClick={onTwitch}>
          Connect to Twitch
        </button>
        <button className={`${styles.btn} ${styles.btnOptions}`} onClick={onOptions}>
          Options
        </button>
      </div>
      <p className={styles.footer}>created by THIANzeren</p>
    </div>
  )
}
