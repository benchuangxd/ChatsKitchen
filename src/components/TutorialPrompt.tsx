import styles from './TutorialPrompt.module.css'

interface Props {
  onYes: () => void
  onNo: () => void
  onDontShowAgain: () => void
}

export default function TutorialPrompt({ onYes, onNo, onDontShowAgain }: Props) {
  return (
    <div className={styles.overlay}>
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <span className={styles.dot} />
          Tutorial Prompt
        </div>
        <div className={styles.body}>
          <p className={styles.message}>Would you like to view the tutorial before jumping in?</p>
          <div className={styles.actions}>
            <button className={styles.primaryBtn} onClick={onYes}>Yes</button>
            <button className={styles.secondaryBtn} onClick={onNo}>No</button>
            <button className={styles.ghostBtn} onClick={onDontShowAgain}>Don't Show Again</button>
          </div>
        </div>
      </div>
    </div>
  )
}
