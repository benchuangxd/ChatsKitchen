import { useEffect, useRef, useState, useCallback } from 'react'
import tmi from 'tmi.js'

export type TwitchStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

interface UseTwitchChatResult {
  status: TwitchStatus
  error: string | undefined
}

export function useTwitchChat(
  channel: string | null,
  onMessage: (user: string, text: string) => void
): UseTwitchChatResult {
  const [status, setStatus] = useState<TwitchStatus>('disconnected')
  const [error, setError] = useState<string>()
  const clientRef = useRef<tmi.Client | null>(null)
  const onMessageRef = useRef(onMessage)

  useEffect(() => {
    onMessageRef.current = onMessage
  }, [onMessage])

  const cleanup = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.disconnect().catch(() => {})
      clientRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!channel) {
      cleanup()
      setStatus('disconnected')
      setError(undefined)
      return
    }

    cleanup()
    setStatus('connecting')
    setError(undefined)

    const client = new tmi.Client({
      connection: { reconnect: true, secure: true },
      channels: [channel],
    })

    clientRef.current = client

    client.on('message', (_channel, tags, message, self) => {
      if (self) return
      const username = tags['display-name'] || tags.username || 'anonymous'
      onMessageRef.current(username, message)
    })

    client.connect()
      .then(() => setStatus('connected'))
      .catch((err: unknown) => {
        setStatus('error')
        setError(err instanceof Error ? err.message : 'Connection failed')
      })

    return () => {
      client.disconnect().catch(() => {})
      clientRef.current = null
    }
  }, [channel, cleanup])

  return { status, error }
}
