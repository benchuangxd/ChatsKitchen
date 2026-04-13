import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { GameState } from '../state/types'
import { TUTORIAL_STEPS } from '../data/tutorialData'
import styles from './TutorialOverlay.module.css'

interface Props {
  stepIndex: number
  state: GameState
  onNext: () => void
  onSkip: () => void
  onRepeat: () => void
}

export default function TutorialOverlay({ stepIndex, state, onNext, onSkip, onRepeat }: Props) {
  const step = TUTORIAL_STEPS[stepIndex]
  const isLast = stepIndex === TUTORIAL_STEPS.length - 1

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
        <div className={styles.body}>{step.body}</div>
        {step.commandHint && (
          <div className={styles.commandHint}>
            <code>{step.commandHint}</code>
          </div>
        )}
        <div className={styles.actions}>
          {!isLast && (
            <button className={styles.skipBtn} onClick={onSkip}>Skip Tutorial</button>
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
