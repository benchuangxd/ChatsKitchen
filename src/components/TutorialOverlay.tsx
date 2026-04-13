import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { GameState } from '../state/types'
import { TUTORIAL_STEPS } from '../data/tutorialData'
import styles from './TutorialOverlay.module.css'

const HIGHLIGHT_LABELS: Record<string, string> = {
  orders:        'Orders panel',
  kitchen:       'Kitchen (centre panel)',
  cutting_board: 'Chopping Board',
  fryer:         'Fryer',
  prepared:      'Prepared Ingredients tray',
}

interface Props {
  stepIndex: number
  state: GameState
  onNext: () => void
  onBack: () => void
  onSkip: () => void
  onRepeat: () => void
}

export default function TutorialOverlay({ stepIndex, state, onNext, onBack, onSkip, onRepeat }: Props) {
  const step = TUTORIAL_STEPS[stepIndex]
  const isLast = stepIndex === TUTORIAL_STEPS.length - 1
  const [skipConfirm, setSkipConfirm] = useState(false)

  useEffect(() => {
    setSkipConfirm(false)
  }, [stepIndex])

  useEffect(() => {
    if (step.advanceMode === 'auto' && step.advanceCondition?.(state)) {
      onNext()
    }
  }, [state, step, onNext])

  return createPortal(
    <div className={styles.overlay}>
      <div className={styles.card}>
        <div className={styles.stepCounter}>{stepIndex + 1} / {TUTORIAL_STEPS.length}</div>
        <div className={styles.title}>{step.title}</div>
        {step.highlight !== 'none' && (
          <div className={styles.highlightHint}>
            ● {HIGHLIGHT_LABELS[step.highlight]} highlighted in purple
          </div>
        )}
        <div className={styles.body}>{step.body}</div>
        {step.commandHint && (
          <div className={styles.commandHint}>
            <code>{step.commandHint}</code>
          </div>
        )}
        <div className={styles.actions}>
          {stepIndex > 0 && (
            <button className={styles.backBtn} onClick={onBack}>← Back</button>
          )}
          {!isLast && !skipConfirm && (
            <button className={styles.skipBtn} onClick={() => setSkipConfirm(true)}>Skip Tutorial</button>
          )}
          {!isLast && skipConfirm && (
            <span className={styles.skipConfirm}>
              Skip tutorial?
              <button className={styles.skipConfirmYes} onClick={onSkip}>Yes, skip</button>
              <button className={styles.skipConfirmNo} onClick={() => setSkipConfirm(false)}>Cancel</button>
            </span>
          )}
          {isLast && (
            <button className={styles.repeatBtn} onClick={onRepeat}>Repeat Tutorial</button>
          )}
          {step.advanceMode === 'button' && (
            <button className={styles.nextBtn} onClick={isLast ? onSkip : onNext}>
              {isLast ? 'Start Playing!' : 'Next →'}
            </button>
          )}
          {step.advanceMode === 'auto' && !isLast && (
            <span className={styles.waitingHint}>Waiting for action…</span>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
