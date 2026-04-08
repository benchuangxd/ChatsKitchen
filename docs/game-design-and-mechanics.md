# Let Chat Cook: Game Design And Mechanics

## Overview

Let Chat Cook is a livestream-friendly kitchen coordination game where a streamer and their audience work together to complete food orders in real time. The core fantasy is simple: chat becomes the kitchen crew.

The game is built around short, high-energy rounds where players type commands to prepare ingredients, plate dishes, and serve orders before time runs out. It is designed to feel readable on stream, easy to join quickly, and chaotic in a fun way when multiple people are participating.

## Design Goals

### 1. Make chat participation immediate

Players should be able to join by typing a short command without learning a deep control scheme. The game uses simple text verbs such as `chop`, `grill`, `take`, and `serve`.

### 2. Encourage cooperation

Most dishes require multiple steps across different stations. That means one person can start a task, another can take the finished ingredient, and someone else can plate or serve the final dish.

### 3. Create readable kitchen chaos

The game is meant to be busy, but not unreadable. UI panels, order tickets, the commands panel, the tutorial, and station-specific visuals are all there to keep the chaos understandable.

### 4. Support both sandbox and progression play

The game supports:

- `Free Play`, where the player can tune settings such as speeds and station capacity
- `Levels`, where difficulty is fixed and progress is measured with star ratings

## Core Game Loop

Each round follows the same basic loop:

1. Orders spawn over time.
2. Players read the requested dish and identify the needed ingredients.
3. Players type cooking commands in chat to process those ingredients at the correct stations.
4. Finished ingredients move into the prepared-items pool (automatically for the chopping board; via `take` for all other stations).
5. A player serves the dish to the correct order number once all required ingredients are ready.
6. The team earns money based on the dish value and how quickly it was delivered.

This loop repeats until the round timer expires.

## Main Modes

## Free Play

Free Play is the flexible mode. It uses the current Options settings for:

- cooking speed
- order speed
- round duration
- station slot capacity

It is the best mode for experimenting, practicing, or playing casually with chat.

## Levels

Levels are fixed-parameter challenge runs. Each level scales difficulty by increasing cooking and order pressure while keeping round structure predictable.

Every level has:

- a level number
- fixed cooking speed
- fixed order speed
- a fixed shift duration
- 1-star, 2-star, and 3-star money thresholds

Progress is tracked as the highest star rating earned per level.

## Orders And Scoring

An order contains:

- an order number
- the requested dish
- a patience timer
- a money value

Serving an order grants:

- the recipe’s base reward
- a time bonus based on how much patience remained

This means fast service is rewarded, not just successful service.

## Recipes And Food Structure

Recipes are built from step-based ingredient preparation. Each dish defines:

- the visible dish name and emoji
- a base reward
- patience
- a list of cooking/prep steps
- the exact set of prepared ingredients needed for plating

Examples:

- `Burger`: chop lettuce, grill patty, grill bun, then serve
- `Fries`: chop potato, fry potato (requires chopped potato), then serve
- `Pasta`: boil pasta, chop tomato, grill cheese, then serve

Some steps require a previously prepared ingredient. For example, fries require chopped potato before frying, and mushroom soup requires chopped mushroom before boiling.

## Stations

The kitchen is divided into five stations, each tied to specific actions:

- `Chopping Board` for `chop`
- `Grill` for `grill`
- `Fryer` for `fry`
- `Stove` for `boil`
- `Oven` for `toast` and `roast`

Each station has a slot limit. If a station is full, new actions at that station are rejected until space opens up.

In Free Play, capacity can be adjusted in Options. In gameplay terms, capacity strongly affects how crowded or forgiving the kitchen feels.

## Command System

The command system is the main input method for chat participation. Commands are entered by name — no prefix required. The `!` prefix is also accepted (e.g. `!chop lettuce`), making it natural for Twitch chat users. The currently supported commands are:

| Command | Syntax | Description |
|---------|--------|-------------|
| `chop` | `chop <item>` | Chop an ingredient at the chopping board |
| `grill` | `grill <item>` | Grill an ingredient |
| `fry` | `fry <item>` | Fry an ingredient |
| `boil` | `boil <item>` | Boil an ingredient on the stove |
| `toast` | `toast <item>` | Toast an item in the oven |
| `roast` | `roast <item>` | Roast an item in the oven |
| `take` | `take <ingredient>` | Move a finished ingredient to the prepared-items pool |
| `serve` | `serve <order#>` | Serve a completed dish to an order |
| `extinguish` | `extinguish <station>` | Put out a fire at a station |

### Shortform aliases

When shortform commands are enabled in Options, single-letter aliases can be used:

| Alias | Expands to |
|-------|-----------|
| `c` | `chop` |
| `g` | `grill` |
| `f` | `fry` |
| `b` | `boil` |
| `t` | `toast` |
| `r` | `roast` |
| `ta` | `take` |
| `s` | `serve` |

Ingredient name shortcuts are always active: `lett` → `lettuce`, `cboard` → `cutting_board`, `fburger` → `fish_burger`, `msoup` → `mushroom_soup`.

### Command flow

The intended flow is:

1. Start preparation with a cooking command.
2. Wait for the ingredient to finish.
3. Use `take` to move the completed ingredient into the prepared-items pool. (Chopping board items complete automatically — no `take` needed.)
4. Use `serve <order#>` once all required ingredients for that order are in the pool.

## Player Constraints And Team Dynamics

The game intentionally limits what one user can do at once.

### Busy state

A user cannot keep starting new work while already committed to an active station task. This prevents a single chatter from dominating the entire kitchen and pushes the team toward shared execution.

### Cooldown

There is a short per-user command cooldown to reduce spam and accidental repeated actions.

### Shared kitchen state

Prepared ingredients, active stations, and orders all exist in a shared state. This is what makes the game collaborative: everyone is acting on the same kitchen.

## Fire And Failure Pressure

Some cooking actions have a burn threshold. If an item sits too long, it can create failure pressure and lead to a station being blocked by fire.

When a station is on fire:

- it cannot be used normally
- players must type `extinguish [station]`
- the fire response becomes a team priority

This adds urgency and gives the round texture beyond simple recipe execution.

## UI Structure

The game is designed to remain understandable even during busy rounds.

### Main Menu

The Main Menu is the hub for:

- connecting Twitch
- entering Levels or Free Play
- opening the tutorial
- changing Options

### Tutorial Flow

The tutorial system is meant to lower the learning curve without forcing a long onboarding sequence.

Current tutorial behavior:

- clicking `Play Levels` or `Free Play` first shows a tutorial prompt
- `Yes` opens the tutorial
- `No` continues into the selected mode
- `Don't Show Again` suppresses the prompt for the current session and continues
- clicking `Tutorial` directly opens the tutorial from the menu

### Gameplay HUD

The gameplay screen includes:

- the main game logo
- a mode indicator showing either `Level X` or `Free Play`
- score and round stats
- Twitch connection indicator
- chat toggle
- bot toggle
- audio controls
- an exit button

### Commands & Recipes panel

An expandable reference panel shows valid commands, shorthand hints, and recipe breakdowns. This helps first-time chat participants join quickly without leaving the game view.

## Twitch Integration

Twitch integration is a major part of the design identity.

When connected:

- live Twitch chat messages are read into the game
- commands from chat become gameplay actions
- the UI shows connected-channel status

When disconnected:

- the game can still be played locally
- the UI warns that Twitch should be connected before playing with a community

## Audio And Feedback

Audio settings are split into music and sound effects. This lets streamers balance the game against their broadcast mix.

The game also gives frequent textual feedback through kitchen messages such as:

- action success
- missing ingredient errors
- station full errors
- fire warnings
- serve rewards

These messages reinforce what the team should do next.

## Reset And Persistence Model

The project currently uses lightweight local browser storage.

Persisted data includes:

- audio settings
- level progress

Session-level or resettable state includes:

- tutorial prompt suppression
- Twitch connection state

There is also a full reset flow in Options that restores the game to a clean default state.

## Recipe Reference

| Dish | Ingredients & Steps | Reward | Patience |
|------|---------------------|--------|---------|
| 🍔 Burger | `chop lettuce` + `grill patty` + `grill bun` | $60 | 80s |
| 🍟 Fries | `chop potato` → `fry potato` (needs chopped potato) | $50 | 60s |
| 🍝 Pasta | `boil pasta` + `chop tomato` + `grill cheese` | $60 | 90s |
| 🥗 Salad | `chop lettuce` + `chop tomato` | $20 | 45s |
| 🍲 Mushroom Soup | `chop mushroom` → `boil mushroom` (needs chopped mushroom) | $50 | 60s |
| 🍔 Fish Burger | `fry fish` + `chop lettuce` + `grill bun` | $60 | 80s |
| 🥬 Roasted Veggies | `chop tomato` + `chop pepper` + `roast tomato` + `roast pepper` | $70 | 90s |

Prerequisites: steps marked with `→` require the prior ingredient to already be in the prepared-items pool before they can start.

## Station Reference

| Station | Command(s) | Burns after | Default slots |
|---------|-----------|-------------|---------------|
| 🔪 Chopping Board | `chop` | never (auto-completes) | 3 |
| 🔥 Grill | `grill` | 25 seconds | 2 |
| 🍳 Fryer | `fry` | 25 seconds | 2 |
| 🌡️ Stove | `boil` | 25 seconds | 2 |
| 🔲 Oven | `toast` / `roast` | 28 seconds | 2 |

Slot limits apply separately to the chopping board and to each cooking station. In Free Play, both limits are configurable in Options.

## Level Reference

There are 10 levels, each with fixed cooking speed, order speed, and a 120-second shift. Difficulty scales with level number.

| Level | Cooking speed | Order speed | ⭐ | ⭐⭐ | ⭐⭐⭐ |
|-------|--------------|-------------|-----|------|-------|
| 1 | 1.00× | 1.0× | $100 | $200 | $350 |
| 2 | 1.05× | 1.1× | $125 | $250 | $438 |
| 3 | 1.10× | 1.2× | $150 | $300 | $525 |
| 4 | 1.15× | 1.3× | $175 | $350 | $613 |
| 5 | 1.20× | 1.4× | $200 | $400 | $700 |
| 6 | 1.25× | 1.5× | $225 | $450 | $788 |
| 7 | 1.30× | 1.6× | $250 | $500 | $875 |
| 8 | 1.35× | 1.7× | $275 | $550 | $963 |
| 9 | 1.40× | 1.8× | $300 | $600 | $1050 |
| 10 | 1.45× | 1.9× | $325 | $650 | $1138 |

Star progress is saved to the browser and persists between sessions.

## Player Stats

The game tracks per-player statistics during each round:

| Stat | Description |
|------|-------------|
| `cooked` | Number of cooking actions started |
| `taken` | Number of ingredients taken from stations |
| `served` | Number of orders served |
| `moneyEarned` | Total money earned from serves |
| `extinguished` | Number of fires put out |
| `firesCaused` | Number of slots that burned on this player's watch |

## Why The Game Works

The game works because it combines:

- very simple individual inputs
- a shared cooperative objective
- visible time pressure
- messy but readable coordination

Each individual command is easy, but running the whole kitchen well requires teamwork, timing, and awareness. That makes it especially well suited for chat-driven play.

## Future Design Expansion Ideas

Natural extension points for the design include:

- more recipes and station types
- modifiers per level
- special event orders
- stronger player identity or contribution summaries
- stream-specific scoring or audience challenges
- persistent progression beyond level stars

Even without these additions, the current design already delivers a clear loop: read the order, coordinate the kitchen, beat the timer, and let chat cook.
