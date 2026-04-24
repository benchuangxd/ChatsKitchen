import styles from './SmokeOverlay.module.css'

interface Props {
  progress: number  // 0–100; opacity = 1 - progress/100
}

export default function SmokeOverlay({ progress }: Props) {
  const opacity = 1 - progress / 100
  return <div className={styles.smoke} style={{ opacity }} />
}
