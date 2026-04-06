export type SlotState = 'cooking' | 'done' | 'onFire'

export interface StationSlot {
  id: string
  user: string
  target: string
  produces: string
  cookStart: number
  cookDuration: number
  burnAt: number
  state: SlotState
}

export interface Station {
  id: string
  slots: StationSlot[]
}

export interface Order {
  id: number
  dish: string
  served: boolean
  patienceMax: number
  patienceLeft: number
  spawnTime: number
}

export interface ChatMessage {
  id: number
  username: string
  text: string
  type: 'normal' | 'system' | 'error' | 'success'
}

export interface PlayerStats {
  cooked: number
  taken: number
  served: number
  moneyEarned: number
  extinguished: number
  firesCaused: number
}

export interface StationCapacity {
  chopping: number    // slots for cutting_board
  cooking: number     // slots per cooking station (grill, fryer, stove, oven)
}

export interface GameOptions {
  cookingSpeed: number
  orderSpeed: number
  shiftDuration: number
  stationCapacity: StationCapacity
  restrictSlots: boolean
  enabledRecipes: string[]
  allowShortformCommands: boolean
}

export interface AudioSettings {
  masterVolume: number
  musicVolume: number
  sfxVolume: number
  musicMuted: boolean
  sfxMuted: boolean
  darkMode: boolean
  trackEnabled: { menu: boolean; gameplay: boolean; gameover: boolean }
}

export interface LevelProgress {
  [level: number]: number // level → best stars (0-3)
}

export interface GameState {
  money: number
  served: number
  lost: number
  timeLeft: number
  cookingSpeed: number
  orderSpeed: number
  stationCapacity: StationCapacity
  restrictSlots: boolean
  enabledRecipes: string[]
  stations: Record<string, Station>
  orders: Order[]
  preparedItems: string[]
  nextOrderId: number
  userCooldowns: Record<string, number>
  activeUsers: Record<string, string>
  nextSlotId: number
  chatMessages: ChatMessage[]
  nextMessageId: number
  playerStats: Record<string, PlayerStats>
}
