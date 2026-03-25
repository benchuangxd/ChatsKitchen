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
      <p className={styles.subtitle}>A Twitch Chat Restaurant Game</p>
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
    </div>
  )
}
