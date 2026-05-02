import type { EventType, GameOptions } from '../state/types'

export interface Playset {
  id: string
  name: string
  tag?: string
  flag: string
  themeColor: string
  stationsLabel: string
  recipes: string[]
  events: [EventType, EventType]  // [hazard, opportunity]
}

export type Difficulty = 'normal' | 'hard'

export const DIFFICULTY_PRESETS: Record<Difficulty, Pick<GameOptions, 'shiftDuration' | 'orderSpeed' | 'orderSpawnRate'>> = {
  normal: { shiftDuration: 180000, orderSpeed: 1.0, orderSpawnRate: 1.0 },
  hard:   { shiftDuration: 180000, orderSpeed: 1.5, orderSpawnRate: 1.5 },
}

export const PLAYSETS: Playset[] = [
  {
    id: 'western',
    name: 'Western Diner',
    tag: 'Beginners',
    flag: '🇺🇸',
    themeColor: '#b87333',
    stationsLabel: 'Chop · Grill · Oven · Fryer',
    recipes: ['burger', 'fish_burger', 'salad'],
    events: ['rat_invasion', 'chefs_chant'],
  },
  {
    id: 'chinese',
    name: 'Chinese Restaurant',
    flag: '🇨🇳',
    themeColor: '#4a9e6a',
    stationsLabel: 'Rice Pot · Wok · Chop · Steamer',
    recipes: ['fried_rice', 'stir_fried_pork', 'steamed_buns'],
    events: ['angry_chef', 'mystery_recipe'],
  },
  {
    id: 'japanese',
    name: 'Japanese Cafe',
    flag: '🇯🇵',
    themeColor: '#9a5ab8',
    stationsLabel: 'Knead · Oven · Mix · Steamer',
    recipes: ['shio_pan', 'melon_pan', 'matcha_latte'],
    events: ['power_trip', 'complete_dish'],
  },
  {
    id: 'korean',
    name: 'Korean Kitchen',
    flag: '🇰🇷',
    themeColor: '#cc3333',
    stationsLabel: 'Chop · Grill · Mix · Stove',
    recipes: ['bulgogi', 'tteokbokki'],
    events: ['smoke_blast', 'dance'],
  },
  {
    id: 'sg',
    name: 'SG Hawker',
    flag: '🇸🇬',
    themeColor: '#c47b00',
    stationsLabel: 'Oven · Mix · Fryer · Wok',
    recipes: ['kaya_toast', 'economic_bee_hoon'],
    events: ['inventory_audit', 'typing_frenzy'],
  },
]
