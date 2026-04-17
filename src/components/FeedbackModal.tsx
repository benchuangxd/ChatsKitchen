import { useEffect } from 'react'
import styles from './FeedbackModal.module.css'

declare global {
  interface Window {
    Tally?: { loadEmbeds: () => void }
  }
}

interface Props {
  onClose: () => void
}

export default function FeedbackModal({ onClose }: Props) {
  useEffect(() => {
    const TALLY_SRC = 'https://tally.so/widgets/embed.js'
    if (window.Tally) {
      window.Tally.loadEmbeds()
    } else if (!document.querySelector(`script[src="${TALLY_SRC}"]`)) {
      const s = document.createElement('script')
      s.src = TALLY_SRC
      s.onload = () => window.Tally?.loadEmbeds()
      s.onerror = () => window.Tally?.loadEmbeds()
      document.body.appendChild(s)
    }
  }, [])

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.panel} onClick={e => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>
        <iframe
          data-tally-src="https://tally.so/embed/Bzb124?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1"
          loading="lazy"
          width="100%"
          height={753}
          style={{ border: 'none', margin: 0 }}
          title="Let Chat Cook - Feedback"
        />
      </div>
    </div>
  )
}
