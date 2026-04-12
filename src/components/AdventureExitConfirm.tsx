import styles from './AdventureExitConfirm.module.css'

interface Props {
  onConfirm: () => void
  onCancel: () => void
}

export default function AdventureExitConfirm({ onConfirm, onCancel }: Props) {
  return (
    <div className={styles.backdrop} onClick={onCancel}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h2 className={styles.title}>End Run?</h2>
        <p className={styles.warning}>
          Exiting to Main Menu will <strong>end your current adventure run</strong>. Your progress will be lost.
        </p>
        <div className={styles.buttons}>
          <button className={styles.cancelBtn} onClick={onCancel}>Keep Playing</button>
          <button className={styles.confirmBtn} onClick={onConfirm}>End Run</button>
        </div>
      </div>
    </div>
  )
}
