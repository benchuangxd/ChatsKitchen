import styles from './TutorialPrompt.module.css'

interface Props {
  onStartTutorial: () => void
  onNo: () => void
  onDontShowAgain: () => void
}

export default function TutorialPrompt({ onStartTutorial, onNo, onDontShowAgain }: Props) {
  return (
    <div className={styles.overlay}>
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <span className={styles.dot} />
          New to ChatsKitchen?
        </div>
        <div className={styles.body}>
          <p className={styles.message}>Jump into a guided tutorial round to learn the basics — it only takes 2 minutes.</p>
          <div className={styles.actions}>
            <button className={styles.primaryBtn} onClick={onStartTutorial}>Play Tutorial</button>
            <button className={styles.secondaryBtn} onClick={onNo}>Skip</button>
            <button className={styles.ghostBtn} onClick={onDontShowAgain}>Don't Show Again</button>
          </div>
        </div>
      </div>
    </div>
  )
}
