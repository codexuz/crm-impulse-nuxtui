/**
 * useTelegramChat
 *
 * Full Nuxt 3 composable for the Telegram-parent chat feature.
 *
 * Features:
 *  - Real-time incoming messages via SSE
 *  - Conversations inbox with unread badges
 *  - Paginated message thread per parent
 *  - Send a message from the CRM panel
 *  - Mark conversation as read
 *  - Total unread badge counter
 *  - Auto-reconnect SSE on disconnect
 *  - Cleanup on component unmount
 *
 * Usage:
 *   const chat = useTelegramChat()
 *   await chat.fetchConversations()
 *   await chat.openConversation(parentId)
 *   await chat.sendMessage('Hello!')
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type MessageDirection = 'incoming' | 'outgoing'

export interface TelegramMessage {
  id: string
  parent_id: string
  student_id: string
  telegram_chat_id: string
  message: string
  direction: MessageDirection
  sender_name: string | null
  is_read: boolean
  createdAt: string
  updatedAt: string
}

export interface TelegramConversation {
  parent_id: string
  student_id: string
  telegram_chat_id: string
  parent_name: string
  parent_phone: string
  student_name?: string
  last_message: string
  last_message_at: string
  unread_count: number
}

export interface MessagesPage {
  data: TelegramMessage[]
  total: number
  page: number
  limit: number
}

export interface SseIncomingEvent {
  parent_id: string
  student_id: string
  telegram_chat_id: string
  message: string
  createdAt: string
}

// ─── Composable ───────────────────────────────────────────────────────────────

export function useTelegramChat() {
  const config = useRuntimeConfig()
  const toast = useToast()

  /** Base API URL — set NUXT_PUBLIC_API_BASE_URL in .env, defaults to /api */
  const apiBase = (config.public.apiBaseUrl as string)

  /** Bearer token — read from the shared auth state initialised by useAuth */
  const authState = useState<{ token: string | null; user: any | null }>('auth')
  const token = computed(() => authState.value?.token ?? null)

  // ── State ──────────────────────────────────────────────────────────────────

  const conversations = ref<TelegramConversation[]>([])
  const messages = ref<TelegramMessage[]>([])
  // useState so all composable instances (layout + page) share the same value
  const activeParentId = useState<string | null>('telegram-active-parent', () => null)
  const totalUnread = ref(0)
  const isSending = ref(false)
  const isLoadingConversations = ref(false)
  const isLoadingMessages = ref(false)
  const messagePage = ref(1)
  const messageTotal = ref(0)
  const messageLimit = 50
  const error = ref<string | null>(null)

  // ── SSE connection ──────────────────────────────────────────────────────────

  // fetch-based SSE so we can send Authorization header (EventSource cannot)
  let sseAbortController: AbortController | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  const SSE_RECONNECT_DELAY = 5_000

  async function connectSSE() {
    if (import.meta.server) return
    disconnectSSE()

    if (!token.value) return

    sseAbortController = new AbortController()
    const { signal } = sseAbortController

    try {
      const res = await fetch(`${apiBase}/telegram-chat/events`, {
        headers: { Authorization: `Bearer ${token.value}` },
        signal,
      })

      if (!res.ok || !res.body) {
        throw new Error(`SSE connect failed: ${res.status}`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        // SSE frames are separated by double newlines
        const frames = buffer.split(/\n\n/)
        buffer = frames.pop() ?? ''

        for (const frame of frames) {
          // Extract the "data:" line
          const dataLine = frame.split('\n').find((l) => l.startsWith('data:'))
          if (!dataLine) continue
          const jsonStr = dataLine.slice('data:'.length).trim()
          try {
            const payload: SseIncomingEvent = JSON.parse(jsonStr)
            handleIncomingSSEEvent(payload)
          } catch {
            // malformed JSON — ignore
          }
        }
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return // intentional disconnect
    }

    // Connection dropped — schedule reconnect
    reconnectTimer = setTimeout(connectSSE, SSE_RECONNECT_DELAY)
  }

  function disconnectSSE() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    if (sseAbortController) {
      sseAbortController.abort()
      sseAbortController = null
    }
  }

  function handleIncomingSSEEvent(event: SseIncomingEvent) {
    // 1. Append to open message thread if this parent is active
    if (activeParentId.value === event.parent_id) {
      const newMsg: TelegramMessage = {
        id: crypto.randomUUID(),
        parent_id: event.parent_id,
        student_id: event.student_id,
        telegram_chat_id: event.telegram_chat_id,
        message: event.message,
        direction: 'incoming',
        sender_name: null,
        is_read: false,
        createdAt: event.createdAt,
        updatedAt: event.createdAt,
      }
      messages.value.push(newMsg)
      messageTotal.value++
    }

    // 2. Update conversation list — bump last message & unread badge
    const idx = conversations.value.findIndex(
      (c) => c.parent_id === event.parent_id,
    )
    if (idx !== -1) {
      const conv = conversations.value[idx] as TelegramConversation
      conversations.value[idx] = {
        ...conv,
        last_message: event.message,
        last_message_at: event.createdAt,
        // Only count as unread if this conversation is NOT currently open
        unread_count:
          activeParentId.value === event.parent_id
            ? conv.unread_count
            : conv.unread_count + 1,
      }
      // Re-sort so most recent is first
      sortConversations()
    } else {
      // Unknown conversation — refresh the list
      fetchConversations()
    }

    // 3. Update global unread badge + toast notification
    if (activeParentId.value !== event.parent_id) {
      totalUnread.value++
      // Find the sender name from conversations list
      const conv = conversations.value.find((c) => c.parent_id === event.parent_id)
      const senderLabel = conv?.parent_name ?? 'Telegram'
      toast.add({
        title: senderLabel,
        description: event.message,
        icon: 'i-lucide-message-circle',
        duration: 5000,
      })
    }
  }

  // ── API helpers ─────────────────────────────────────────────────────────────

  async function apiFetch<T>(
    path: string,
    options?: Parameters<typeof $fetch>[1],
  ): Promise<T> {
    return $fetch<T>(`${apiBase}${path}`, {
      headers: token.value ? { Authorization: `Bearer ${token.value}` } : {},
      ...options,
    })
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /** Load / refresh the conversations inbox */
  async function fetchConversations(): Promise<void> {
    isLoadingConversations.value = true
    error.value = null
    try {
      const data = await apiFetch<TelegramConversation[]>(
        '/telegram-chat/conversations',
      )
      conversations.value = data
      sortConversations()
      totalUnread.value = data.reduce((sum, c) => sum + c.unread_count, 0)
    } catch (err: any) {
      error.value = err?.message ?? 'Failed to load conversations'
    } finally {
      isLoadingConversations.value = false
    }
  }

  /** Refresh only the global unread badge counter */
  async function fetchUnreadCount(): Promise<void> {
    try {
      const res = await apiFetch<{ unread_count: number }>(
        '/telegram-chat/unread-count',
      )
      totalUnread.value = res.unread_count
    } catch {
      // non-critical, swallow
    }
  }

  /**
   * Load the message thread for a parent.
   * Pass reset=true (default) when opening a new conversation.
   * Pass reset=false to append the next page.
   */
  async function fetchMessages(
    parent_id: string,
    reset = true,
  ): Promise<void> {
    if (reset) {
      messages.value = []
      messagePage.value = 1
      messageTotal.value = 0
    }
    isLoadingMessages.value = true
    error.value = null
    try {
      const res = await apiFetch<MessagesPage>('/telegram-chat/messages', {
        params: {
          parent_id,
          page: messagePage.value,
          limit: messageLimit,
        },
      })
      if (reset) {
        messages.value = res.data
      } else {
        messages.value = [...res.data, ...messages.value] // prepend older
      }
      messageTotal.value = res.total
    } catch (err: any) {
      error.value = err?.message ?? 'Failed to load messages'
    } finally {
      isLoadingMessages.value = false
    }
  }

  /** Load the next (older) page of messages */
  async function loadMoreMessages(): Promise<void> {
    if (!activeParentId.value) return
    if (messages.value.length >= messageTotal.value) return
    messagePage.value++
    await fetchMessages(activeParentId.value, false)
  }

  /**
   * Open a conversation:
   * 1. Set as active parent
   * 2. Load message thread
   * 3. Mark all messages as read
   */
  async function openConversation(parent_id: string): Promise<void> {
    activeParentId.value = parent_id
    await fetchMessages(parent_id)
    await markAsRead(parent_id)
  }

  /** Close the active conversation (e.g. when panel is closed) */
  function closeConversation(): void {
    activeParentId.value = null
    messages.value = []
    messagePage.value = 1
    messageTotal.value = 0
  }

  /**
   * Send a message from the CRM to a parent.
   * Uses activeParentId by default, or pass an explicit parent_id.
   */
  async function sendMessage(
    text: string,
    opts: { parent_id?: string } = {},
  ): Promise<TelegramMessage | null> {
    const parent_id = opts.parent_id ?? activeParentId.value
    if (!parent_id || !text.trim()) return null

    isSending.value = true
    error.value = null
    try {
      const saved = await apiFetch<TelegramMessage>('/telegram-chat/send', {
        method: 'POST',
        body: {
          parent_id,
          message: text.trim(),
        },
      })

      // Optimistically append to local messages
      messages.value.push(saved)
      messageTotal.value++

      // Update conversation last message, or fetch list if this is a new contact
      const idx = conversations.value.findIndex(
        (c) => c.parent_id === parent_id,
      )
      if (idx !== -1) {
        const conv = conversations.value[idx] as TelegramConversation
        conversations.value[idx] = {
          ...conv,
          last_message: saved.message,
          last_message_at: saved.createdAt,
        }
        sortConversations()
      } else {
        // Parent not yet in inbox (came from Contacts tab) — refresh to show them
        await fetchConversations()
      }

      return saved
    } catch (err: any) {
      // $fetch wraps the response body under err.data for non-2xx responses
      error.value =
        err?.data?.message ?? err?.message ?? 'Failed to send message'
      return null
    } finally {
      isSending.value = false
    }
  }

  /** Mark all incoming messages from a parent as read */
  async function markAsRead(parent_id: string): Promise<void> {
    try {
      await apiFetch(`/telegram-chat/${parent_id}/read`, { method: 'PATCH' })

      // Zero out local unread count
      const idx = conversations.value.findIndex(
        (c) => c.parent_id === parent_id,
      )
      if (idx !== -1) {
        const conv = conversations.value[idx] as TelegramConversation
        const prev = conv.unread_count
        conversations.value[idx] = {
          ...conv,
          unread_count: 0,
        }
        totalUnread.value = Math.max(0, totalUnread.value - prev)
      }

      // Mark local messages as read
      messages.value = messages.value.map((m) =>
        m.direction === 'incoming' ? { ...m, is_read: true } : m,
      )
    } catch {
      // non-critical
    }
  }

  // ── Utilities ───────────────────────────────────────────────────────────────

  function sortConversations() {
    conversations.value.sort(
      (a, b) =>
        new Date(b.last_message_at).getTime() -
        new Date(a.last_message_at).getTime(),
    )
  }

  /** Computed: active conversation meta */
  const activeConversation = computed(() =>
    conversations.value.find((c) => c.parent_id === activeParentId.value) ??
    null,
  )

  /** Computed: true if there are more pages to load */
  const hasMoreMessages = computed(
    () => messages.value.length < messageTotal.value,
  )

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  onMounted(() => {
    connectSSE()
  })

  onUnmounted(() => {
    disconnectSSE()
  })

  // ── Expose ──────────────────────────────────────────────────────────────────

  return {
    // State (readonly refs)
    conversations: readonly(conversations),
    messages: readonly(messages),
    activeParentId: readonly(activeParentId),
    totalUnread: readonly(totalUnread),
    isSending: readonly(isSending),
    isLoadingConversations: readonly(isLoadingConversations),
    isLoadingMessages: readonly(isLoadingMessages),
    messageTotal: readonly(messageTotal),
    error: readonly(error),

    // Computed
    activeConversation,
    hasMoreMessages,

    // Actions
    fetchConversations,
    fetchUnreadCount,
    fetchMessages,
    loadMoreMessages,
    openConversation,
    closeConversation,
    sendMessage,
    markAsRead,

    // SSE control
    connectSSE,
    disconnectSSE,
  }
}
