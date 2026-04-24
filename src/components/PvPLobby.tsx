import ChatPanel from './ChatPanel'
import { ChatMessage } from '../state/types'
import styles from './PvPLobby.module.css'

interface Props {
  red: string[]
  blue: string[]
  messages: ChatMessage[]
  onChatSend: (text: string) => void
  onNext: () => void
}

export default function PvPLobby({ red, blue, messages, onChatSend, onNext }: Props) {
  return (
    <div className={styles.screen}>
      <div className={styles.main}>
        <div className={styles.title}>⚔️ PvP — Choose Your Team</div>
        <div className={styles.hint}>Type <strong>!red</strong> or <strong>!blue</strong> in chat to join a team</div>

        <div className={styles.rosters}>
          <div className={`${styles.teamCard} ${styles.teamCardRed}`}>
            <div className={`${styles.teamHeader} ${styles.teamHeaderRed}`}>🔴 Red Team</div>
            <div className={styles.memberList}>
              {red.length === 0
                ? <div className={styles.empty}>No players yet</div>
                : red.map(p => <div key={p} className={`${styles.member} ${styles.memberRed}`}>{p}</div>)
              }
            </div>
            <div className={styles.count}>{red.length} players</div>
          </div>

          <div className={styles.vs}>VS</div>

          <div className={`${styles.teamCard} ${styles.teamCardBlue}`}>
            <div className={`${styles.teamHeader} ${styles.teamHeaderBlue}`}>🔵 Blue Team</div>
            <div className={styles.memberList}>
              {blue.length === 0
                ? <div className={styles.empty}>No players yet</div>
                : blue.map(p => <div key={p} className={`${styles.member} ${styles.memberBlue}`}>{p}</div>)
              }
            </div>
            <div className={styles.count}>{blue.length} players</div>
          </div>
        </div>

        <div className={styles.modHints}>
          <span className={styles.modCmd}>!balance</span> auto-fill teams &nbsp;·&nbsp;
          <span className={styles.modCmd}>!move red @name</span> / <span className={styles.modCmd}>!move blue @name</span> move a player
        </div>

        <button className={styles.nextBtn} onClick={onNext}>
          Configure &amp; Start →
        </button>
      </div>

      <div className={styles.chatWrapper}>
        <ChatPanel
          messages={messages}
          onSend={onChatSend}
          onClose={() => {}}
        />
      </div>
    </div>
  )
}
