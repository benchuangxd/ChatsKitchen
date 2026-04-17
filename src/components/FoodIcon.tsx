interface Props {
  icon: string
  size?: number
  className?: string
}

export default function FoodIcon({ icon, size = 28, className }: Props) {
  if (icon.startsWith('/')) {
    return <img src={icon} width={size} height={size} className={className} style={{ objectFit: 'contain', display: 'inline-block', verticalAlign: 'middle' }} />
  }
  return <span className={className} style={{ fontSize: size * 0.85, lineHeight: 1 }}>{icon}</span>
}
