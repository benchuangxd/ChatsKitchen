import styles from './TutorialPrompt.module.css'

interface Props {
  onYes: () => void
  onNo: () => void
  onDontShowAgain: () => void
}

export default function TutorialPrompt({ onYes, onNo, onDontShowAgain }: Props) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <span className={styles.dot} />
        CHAT TIP
      </div>
      <div className={styles.body}>
        <p className={styles.message}>First time here? Want a quick tutorial before the kitchen gets chaotic?</p>
        <div className={styles.actions}>
          <button className={styles.primaryBtn} onClick={onYes}>Yes</button>
          <button className={styles.secondaryBtn} onClick={onNo}>No</button>
          <button className={styles.ghostBtn} onClick={onDontShowAgain}>Don't Show Again</button>
        </div>
      </div>
    </div>
  )
}
