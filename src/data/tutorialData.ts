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
    body: "You're the chef — your Twitch chat is your kitchen crew. Together you'll cook dishes and fill orders before time runs out. Let's learn with a simple dish: Fries!\n\nNote: during this tutorial, only the broadcaster's commands are recognised.",
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
    body: "A customer ordered Fries. To make them:\n① chop potato  →  adds chopped potato to the tray\n② fry potato  →  needs the chopped potato first\nThen serve the order.",
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
    commandHint: 'chop potato',
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
    commandHint: 'fry potato',
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
    commandHint: 'serve 1',
    advanceCondition: (state) =>
      state.orders.some(o => o.dish === 'fries' && o.served),
  },
  {
    title: "🌡️ Station Heat",
    body: "Every cook at a non-chopping station adds heat. The fryer has run hot — watch its border colour. Green is safe, yellow is warm, orange means cool it soon. At 100% the station overheats and all active cooks are cancelled!",
    highlight: 'fryer',
    advanceMode: 'button',
  },
  {
    title: "❄️ Cool it down!",
    body: "The fryer is at 90% heat — one more cook and it'll overheat. Cool it now by typing the command below.",
    highlight: 'fryer',
    advanceMode: 'auto',
    commandHint: 'cool fryer',
    advanceCondition: (state) => (state.stations['fryer']?.heat ?? 100) < 90,
  },
  {
    title: "Station cooled! ✅",
    body: "The fryer dropped to 60% heat — notice the border is now yellow. Keep cooling regularly during a busy shift to stay in the safe zone.",
    highlight: 'fryer',
    advanceMode: 'button',
  },
  {
    title: "⚠️ What if it overheats?",
    body: "If heat reaches 100%, the station catches fire. All active cooks are lost and the station locks — no one can use it until it's extinguished. Let's see that happen now.",
    highlight: 'fryer',
    advanceMode: 'button',
  },
  {
    title: "🔥 Station on fire!",
    body: "The fryer has overheated — all active cooks were cancelled and it's locked. Vote to extinguish it by typing the command below.",
    highlight: 'fryer',
    advanceMode: 'auto',
    commandHint: 'extinguish fryer',
    advanceCondition: (state) => state.stations['fryer']?.overheated === false,
  },
  {
    title: "You're ready! 🎉",
    body: "You know the full loop — cook, prep, serve, and manage heat. In real play, your entire Twitch chat pitches in across all stations at once. The more you coordinate, the more you earn. Good luck, chef!",
    highlight: 'none',
    advanceMode: 'button',
  },
]
