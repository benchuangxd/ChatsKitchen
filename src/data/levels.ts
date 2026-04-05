export interface LevelConfig {
  level: number
  stars: [number, number, number] // money thresholds for 1/2/3 stars
  cookingSpeed: number
  orderSpeed: number
  shiftDuration: number
}

const BASE_STARS: [number, number, number] = [100, 200, 350]

export function getLevelConfig(level: number): LevelConfig {
  const scale = 1 + (level - 1) * 0.25
  return {
    level,
    stars: [
      Math.round(BASE_STARS[0] * scale),
      Math.round(BASE_STARS[1] * scale),
      Math.round(BASE_STARS[2] * scale),
    ],
    cookingSpeed: 1 + (level - 1) * 0.05,
    orderSpeed: 1 + (level - 1) * 0.1,
    shiftDuration: 120000,
  }
}

export function getStarRating(level: number, money: number): number {
  const config = getLevelConfig(level)
  if (money >= config.stars[2]) return 3
  if (money >= config.stars[1]) return 2
  if (money >= config.stars[0]) return 1
  return 0
}
