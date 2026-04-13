import { GameState } from '../state/types'

export interface TutorialStep {
  title: string
  body: string
  highlight: 'none' | 'orders' | 'cutting_board' | 'fryer' | 'prepared'
  advanceMode: 'button' | 'auto'
  advanceCondition?: (state: GameState) => boolean
  commandHint?: string
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: "Welcome to the Kitchen! 👨‍🍳",
    body: "You're the chef — your Twitch chat is your kitchen crew. Together you'll cook dishes and fill orders before time runs out. Let's learn with a simple dish: Fries!",
    highlight: 'none',
    advanceMode: 'button',
  },
  {
    title: "📋 Orders",
    body: "The left panel shows active orders. Each ticket has an order number and a patience bar. If the bar runs out before you serve the dish, the order is lost!",
    highlight: 'orders',
    advanceMode: 'button',
  },
  {
    title: "Tonight's dish: Fries! 🍟",
    body: "A customer ordered Fries. To make them:\n① !chop potato  →  adds chopped potato to the tray\n② !fry potato  →  needs the chopped potato first\nThen serve the order.",
    highlight: 'orders',
    advanceMode: 'button',
  },
  {
    title: "🍳 Stations",
    body: "The centre panel is your kitchen. Each station handles different actions — the Chopping Board preps ingredients, the Fryer cooks in oil. Only one station at a time per player.",
    highlight: 'none',
    advanceMode: 'button',
  },
  {
    title: "Step 1 — Chop the potato 🔪",
    body: "Type the command below in the chat box and press Enter.",
    highlight: 'cutting_board',
    advanceMode: 'auto',
    commandHint: '!chop potato',
    advanceCondition: (state) =>
      (state.stations['cutting_board']?.slots.some(s => s.target === 'potato') ?? false) ||
      state.preparedItems.includes('chopped_potato'),
  },
  {
    title: "Chopping in progress…",
    body: "Watch the progress bar fill up. In a real game, multiple players can prep different ingredients simultaneously — coordination is key!",
    highlight: 'cutting_board',
    advanceMode: 'auto',
    advanceCondition: (state) => state.preparedItems.includes('chopped_potato'),
  },
  {
    title: "🥘 Prepared Ingredients",
    body: "Finished ingredients appear in the tray at the top of the kitchen. The chopped potato is ready — it can now be used in the next step.",
    highlight: 'prepared',
    advanceMode: 'button',
  },
  {
    title: "Step 2 — Fry the potato 🫕",
    body: "The fryer needs the chopped potato first (the → arrow in recipes means dependency). Type:",
    highlight: 'fryer',
    advanceMode: 'auto',
    commandHint: '!fry potato',
    advanceCondition: (state) =>
      (state.stations['fryer']?.slots.some(s => s.target === 'potato') ?? false) ||
      state.preparedItems.includes('fried_potato'),
  },
  {
    title: "Frying in progress…",
    body: "When done, the fried potato appears in the tray and the order is ready to serve.",
    highlight: 'fryer',
    advanceMode: 'auto',
    advanceCondition: (state) => state.preparedItems.includes('fried_potato'),
  },
  {
    title: "🍟 Serve the order!",
    body: "All ingredients are in the tray! Serve order #1 by typing:",
    highlight: 'orders',
    advanceMode: 'auto',
    commandHint: '!serve 1',
    advanceCondition: (state) =>
      state.orders.some(o => o.dish === 'fries' && o.served),
  },
  {
    title: "Order served! 🎉",
    body: "You completed your first order! In real play, your entire Twitch chat types commands together. The more you coordinate across stations, the more you earn before time runs out. Good luck, chef!",
    highlight: 'none',
    advanceMode: 'button',
  },
]
