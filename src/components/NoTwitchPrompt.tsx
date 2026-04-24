import styles from './NoTwitchPrompt.module.css'

interface Props {
  onContinue: () => void
  onBack: () => void
}

export default function NoTwitchPrompt({ onContinue, onBack }: Props) {
  return (
    <div className={styles.overlay}>
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <span className={styles.icon}>📡</span>
          No Twitch Channel Connected
        </div>
        <div className={styles.body}>
          <p className={styles.message}>
            This game is played through Twitch chat — viewers send commands to cook, serve, and manage the kitchen.
            Without a connected channel, only local chat works.
          </p>
          <div className={styles.actions}>
            <button className={styles.backBtn} onClick={onBack}>Back to Menu</button>
            <button className={styles.continueBtn} onClick={onContinue}>Continue Anyway</button>
          </div>
        </div>
      </div>
    </div>
  )
}
