# Spec: Feedback Modal & Credits Screen

**Date:** 2026-04-17
**Branch:** feat/feedback-and-credits

---

## Overview

Add two new entry points from the Main Menu's Options row:

1. **Feedback** — a modal overlay embedding a Tally feedback form
2. **Credits** — a full-screen page listing contributors, art credits, and music credits

---

## 1. MainMenu Changes

The existing `modeBottomRow` in the right panel currently holds one button (Options). It becomes a 3-button row:

```
[ Options ]  [ Feedback ]  [ Credits ]
```

`MainMenu` receives two new props:
- `onFeedback: () => void` — opens the feedback modal
- `onCredits: () => void` — navigates to the credits screen

---

## 2. Feedback Modal

### Behaviour
- Clicking **Feedback** in the Options row opens a modal overlay.
- The modal renders the Tally embed iframe using the provided embed code.
- A close button (✕) in the top-right corner dismisses the modal.
- A semi-transparent dark backdrop sits behind the modal; clicking it also closes the modal.
- No new screen or route is introduced.

### Tally Embed
The iframe is rendered in JSX using React-compatible attributes (no deprecated `frameborder`/`marginheight`/`marginwidth` HTML attributes):

```tsx
<iframe
  data-tally-src="https://tally.so/embed/Bzb124?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1"
  loading="lazy"
  width="100%"
  height={753}
  style={{ border: 'none', margin: 0 }}
  title="Let Chat Cook - Feedback"
/>
```

### Tally Script Injection
The Tally loader script is injected via `useEffect` on modal mount. To avoid duplicate injection across open/close cycles, the effect first checks both `window.Tally` and `document.querySelector('script[src*="tally.so"]')` before appending a new `<script>` tag. A global type declaration is added to handle strict-mode TypeScript:

```ts
declare global {
  interface Window {
    Tally?: { loadEmbeds: () => void }
  }
}
```

This declaration lives at the top of `FeedbackModal.tsx`.

### State
`App.tsx` holds a `showFeedback` boolean (local state, not part of `GameState`). `MainMenu` receives `onFeedback` which sets this to `true`. `<FeedbackModal onClose={() => setShowFeedback(false)} />` is rendered when `showFeedback` is true.

### z-index
`FeedbackModal` uses `z-index: 300` (matching `PauseModal`) for the backdrop and a higher value for the modal content panel, ensuring it layers correctly over any in-game toasts or other overlays.

### New Files
- `src/components/FeedbackModal.tsx`
- `src/components/FeedbackModal.module.css`

---

## 3. Credits Screen

### Behaviour
- Clicking **Credits** navigates to a full-screen credits page.
- A `← Back` button returns to the main menu.
- Follows the same structural pattern as `OptionsScreen`.

### Screen Route
`'credits'` is added to the `Screen` union type in `App.tsx`:

```ts
type Screen = 'menu' | ... | 'credits'
```

`App.tsx` renders `<CreditsScreen onBack={() => setScreen('menu')} />` when `screen === 'credits'`.

`MainMenu` receives `onCredits: () => void` → `App.tsx` calls `setScreen('credits')`.

### Content (placeholder)

**Contributors**
- THIANzeren — Game Design & Development
- [Contributor Name] — [Role]

**Art Credits**
- [Artist Name] — [Asset description]

**Music Credits**
- [Track Title] — [Artist / Source]

### Scroll Behaviour
The credits content container uses `overflow-y: auto` so the page scrolls on short viewports rather than clipping content.

### New Files
- `src/components/CreditsScreen.tsx`
- `src/components/CreditsScreen.module.css`

---

## 4. Files Modified

| File | Change |
|------|--------|
| `src/App.tsx` | Add `'credits'` to `Screen` union; add `showFeedback` state; wire `onFeedback`, `onCredits`, render `FeedbackModal`, render `CreditsScreen` |
| `src/components/MainMenu.tsx` | Add `onFeedback: () => void` + `onCredits: () => void` to the `Props` interface; expand Options row to 3 buttons |
| `src/components/FeedbackModal.tsx` | New — modal with Tally embed |
| `src/components/FeedbackModal.module.css` | New — modal styles |
| `src/components/CreditsScreen.tsx` | New — full-screen credits layout |
| `src/components/CreditsScreen.module.css` | New — credits styles |

---

## 5. Out of Scope

- No backend, form processing, or analytics integration
- No persistence of feedback state
- Actual credits content (placeholders only — to be filled in before release)
