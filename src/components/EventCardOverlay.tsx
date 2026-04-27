import { useEffect, useRef, useState } from 'react'
import { KitchenEvent, EventCategory } from '../state/types'
import { createPortal } from 'react-dom'
import { EVENT_DEFS, DanceDir } from '../data/kitchenEventDefs'
import styles from './EventCardOverlay.module.css'

const DANCE_ARROWS: Record<DanceDir, string> = { UP: '⬆', DOWN: '⬇', LEFT: '⬅', RIGHT: '➡' }

interface Props {
  activeEvent: KitchenEvent | null
}

function cmdLabelText(type: KitchenEvent['type']): string {
  if (type === 'power_trip') return 'Type the answer'
  if (type === 'mystery_recipe') return 'Unscramble'
  if (type === 'typing_frenzy') return 'Type exactly'
  if (type === 'complete_dish') return 'Type the missing ingredient'
  if (type === 'inventory_audit') return 'Type the count'
  return 'Type in chat'
}

function badgeText(category: EventCategory): string {
  if (category === 'hazard-penalty') return '⚠ Hazard'
  if (category === 'hazard-immediate') return '⚠ Immediate'
  return '⚡ Opportunity'
}

type AnimState = 'idle' | 'stamping' | 'tearing'

export default function EventCardOverlay({ activeEvent }: Props) {
  const prevIdRef = useRef<string | null>(null)
  const flashCategoryRef = useRef<EventCategory>('hazard-penalty')
  const [flashing, setFlashing] = useState(false)
  const [animState, setAnimState] = useState<AnimState>('idle')
  const tearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Screen flash on new event spawn (unchanged behaviour)
  useEffect(() => {
    if (activeEvent && activeEvent.id !== prevIdRef.current) {
      prevIdRef.current = activeEvent.id
      flashCategoryRef.current = activeEvent.category
      setFlashing(true)
      setAnimState('idle')
      if (tearTimerRef.current) clearTimeout(tearTimerRef.current)
      const t = setTimeout(() => setFlashing(false), 800)
      return () => clearTimeout(t)
    }
  }, [activeEvent])

  // Stamp → tear when event concludes
  useEffect(() => {
    if (!activeEvent || (!activeEvent.resolved && !activeEvent.failed)) return
    setAnimState('stamping')
    tearTimerRef.current = setTimeout(() => setAnimState('tearing'), 900)
    return () => {
      if (tearTimerRef.current) clearTimeout(tearTimerRef.current)
    }
  }, [activeEvent])

  if (!activeEvent && !flashing) return null

  const flashIsHazard = flashCategoryRef.current !== 'opportunity'

  return createPortal(
    <>
      {flashing && (
        <div className={`${styles.screenFlash} ${flashIsHazard ? styles.flashHazard : styles.flashOpp}`} />
      )}
      {activeEvent && !activeEvent.resolved && !activeEvent.failed && (
        <div className={`${styles.vignette} ${activeEvent.category !== 'opportunity' ? styles.vignetteHazard : styles.vignetteOpp}`} />
      )}
      {activeEvent && (() => {
        const ev = activeEvent
        const def = EVENT_DEFS.find(d => d.type === ev.type)!
        const isHazard = ev.category !== 'opportunity'
        const description = isHazard ? (def.failDescription ?? '') : (def.rewardDescription ?? '')
        const timePercent = ev.timeLeft !== null && ev.initialTimeLeft
          ? (ev.timeLeft / ev.initialTimeLeft) * 100
          : null
        const timeSeconds = ev.timeLeft !== null ? (ev.timeLeft / 1000).toFixed(1) : null
        const showStamp = animState === 'stamping' || animState === 'tearing'
        const danceSequence = ev.type === 'dance' ? (ev.payload.danceSequence ?? null) : null
        // First 3 s of the event window: show all arrows; then hide
        const isDanceRevealing = danceSequence !== null && ev.timeLeft !== null && ev.initialTimeLeft !== null
          && ev.timeLeft > ev.initialTimeLeft - 3_000

        return (
          <div className={styles.overlay}>
            {/* key={ev.id} forces full remount on each new event, restarting CSS entry animations */}
            <div key={ev.id} className={`${styles.assembly} ${animState === 'tearing' ? styles.tearing : ''}`}>
              <div className={styles.clip} />
              {/* ticketRevealWrapper carries clip-path; ticket carries box-shadow + bounce */}
              <div className={styles.ticketRevealWrapper}>
                <div
                  className={styles.ticket}
                  style={{
                    '--event-color': def.color,
                    '--event-cmd-color': def.cmdColor,
                  } as React.CSSProperties}
                >
                  <div className={styles.header}>
                    <div className={styles.headerStripe} />
                    <span className={styles.badge}>{badgeText(ev.category)}</span>
                    <span className={styles.title}>{def.emoji} {def.label}</span>
                  </div>
                  <div className={styles.body}>
                    {danceSequence ? (
                      <>
                        <div className={styles.cmdLabel}>{isDanceRevealing ? '🧠 Memorise!' : '🕺 Type the full sequence!'}</div>
                        <div className={styles.danceRow}>
                          {danceSequence.map((dir, i) => (
                            <div key={i} className={`${styles.danceStep} ${isDanceRevealing ? styles.danceStepReveal : styles.danceStepPending}`}>
                              {isDanceRevealing ? DANCE_ARROWS[dir] : '?'}
                            </div>
                          ))}
                        </div>
                        <div className={styles.desc}>{description}</div>
                        {!ev.resolved && !ev.failed && (
                          <div className={styles.bars}>
                            {timePercent !== null && (
                              <div>
                                <div className={styles.barMeta}><span>Time</span><span>{timeSeconds}s</span></div>
                                <div className={styles.barTrack}><div className={styles.barFillTime} style={{ width: `${timePercent}%` }} /></div>
                              </div>
                            )}
                            <div>
                              <div className={styles.barMeta}>
                                <span>Progress</span>
                                <span>{ev.respondedUsers.length} / {ev.threshold}</span>
                              </div>
                              <div className={styles.barTrack}><div className={styles.barFillProg} style={{ width: `${ev.progress}%` }} /></div>
                            </div>
                          </div>
                        )}
                      </>
                    ) : ev.type === 'inventory_audit' && ev.payload.auditGrid ? (
                      <>
                        <div className={styles.cmdLabel}>How many {ev.payload.auditTarget}?</div>
                        <div className={styles.auditGrid}>
                          {ev.payload.auditGrid.map((emoji, i) => (
                            <div key={i} className={styles.auditTile}>{emoji}</div>
                          ))}
                        </div>
                        <div className={styles.desc}>{description}</div>
                        {!ev.resolved && !ev.failed && (
                          <div className={styles.bars}>
                            {timePercent !== null && (
                              <div>
                                <div className={styles.barMeta}><span>Time</span><span>{timeSeconds}s</span></div>
                                <div className={styles.barTrack}><div className={styles.barFillTime} style={{ width: `${timePercent}%` }} /></div>
                              </div>
                            )}
                            <div>
                              <div className={styles.barMeta}>
                                <span>Progress</span>
                                <span>{ev.respondedUsers.length} / {ev.threshold}</span>
                              </div>
                              <div className={styles.barTrack}><div className={styles.barFillProg} style={{ width: `${ev.progress}%` }} /></div>
                            </div>
                          </div>
                        )}
                      </>
                    ) : ev.type === 'complete_dish' && ev.payload.shownIngredients ? (
                      <>
                        <div className={styles.dishHeader}>
                          <span className={styles.dishEmoji}>{ev.payload.dishEmoji}</span>
                          <span className={styles.dishName}>{ev.payload.dishName}</span>
                        </div>
                        <div className={styles.dishChecklist}>
                          {ev.payload.shownIngredients.map((ing, i) => (
                            <div key={i} className={styles.dishCheckItem}>
                              <span className={styles.dishCheck}>✓</span>{ing}
                            </div>
                          ))}
                          <div className={`${styles.dishCheckItem} ${styles.dishBlank}`}>
                            <span className={styles.dishCheck}>?</span>___________
                          </div>
                        </div>
                        <div className={styles.cmdLabel}>{cmdLabelText(ev.type)}</div>
                        <div className={styles.desc}>{description}</div>
                        {!ev.resolved && !ev.failed && (
                          <div className={styles.bars}>
                            {timePercent !== null && (
                              <div>
                                <div className={styles.barMeta}><span>Time</span><span>{timeSeconds}s</span></div>
                                <div className={styles.barTrack}><div className={styles.barFillTime} style={{ width: `${timePercent}%` }} /></div>
                              </div>
                            )}
                            <div>
                              <div className={styles.barMeta}>
                                <span>Progress</span>
                                <span>{ev.respondedUsers.length} / {ev.threshold}</span>
                              </div>
                              <div className={styles.barTrack}><div className={styles.barFillProg} style={{ width: `${ev.progress}%` }} /></div>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className={styles.cmdLabel}>{cmdLabelText(ev.type)}</div>
                        <div className={`${styles.cmdBox}${ev.type === 'typing_frenzy' ? ` ${styles.cmdBoxFrenzy}` : ''}`}>
                          {ev.type === 'glitched_orders'
                            ? ev.chosenCommand.split('').map((char, i) => (
                                <span
                                  key={i}
                                  className={char !== ' ' ? styles.glitchChar : undefined}
                                  style={{ animationDelay: `${i * 0.11}s` }}
                                >{char}</span>
                              ))
                            : ev.chosenCommand
                          }
                        </div>
                        <div className={styles.desc}>{description}</div>
                        {!ev.resolved && !ev.failed && (
                          <div className={styles.bars}>
                            {timePercent !== null && (
                              <div>
                                <div className={styles.barMeta}>
                                  <span>Time</span>
                                  <span>{timeSeconds}s</span>
                                </div>
                                <div className={styles.barTrack}>
                                  <div className={styles.barFillTime} style={{ width: `${timePercent}%` }} />
                                </div>
                              </div>
                            )}
                            <div>
                              <div className={styles.barMeta}>
                                <span>Progress</span>
                                <span>{ev.respondedUsers.length} / {ev.threshold}</span>
                              </div>
                              <div className={styles.barTrack}>
                                <div className={styles.barFillProg} style={{ width: `${ev.progress}%` }} />
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    {showStamp && (
                      <div className={styles.stamp}>
                        <div className={`${styles.stampCircle} ${ev.resolved ? styles.stampResolved : styles.stampFailed}`}>
                          <div className={styles.stampIcon}>{ev.resolved ? '✓' : '✗'}</div>
                          <div className={styles.stampText}>{ev.resolved ? 'RESOLVED' : 'FAILED'}</div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className={styles.perf} />
                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </>,
    document.body
  )
}
