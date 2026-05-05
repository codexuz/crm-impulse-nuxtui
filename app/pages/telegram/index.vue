<template>
    <UDashboardPanel id="telegram-chat">
        <template #header>
            <UDashboardNavbar>
                <template #leading>
                    <UDashboardSidebarCollapse />
                    <div class="flex items-center gap-2">
                        <UIcon name="i-lucide-send" class="size-5 text-primary" />
                        <span class="font-semibold">Telegram Chat</span>
                        <UBadge v-if="totalUnread > 0" color="error" size="sm" class="tabular-nums">
                            {{ totalUnread }}
                        </UBadge>
                    </div>
                </template>

                <template #description>
                    Ota-onalar bilan Telegram orqali real-vaqt muloqoti
                </template>

                <template #right>
                    <UTooltip text="Yangilash">
                        <UButton icon="i-lucide-refresh-cw" color="neutral" variant="ghost"
                            :loading="isLoadingConversations" @click="fetchConversations" />
                    </UTooltip>
                </template>
            </UDashboardNavbar>
        </template>

        <template #body>
            <!-- Full-bleed two-pane layout inside the panel body -->
            <div class="flex h-full overflow-hidden -m-4">

                <!-- ── Left pane ────────────────────────────────────────────── -->
                <div class="w-80 shrink-0 border-r border-default flex flex-col">

                    <!-- Tabs -->
                    <div class="flex border-b border-default shrink-0">
                        <button type="button"
                            class="flex-1 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none"
                            :class="leftTab === 'inbox'
                                ? 'text-primary border-b-2 border-primary'
                                : 'text-muted hover:text-default'" @click="leftTab = 'inbox'">
                            Kiruvchi
                            <UBadge v-if="totalUnread > 0" color="error" size="xs" class="ml-1 tabular-nums">
                                {{ totalUnread }}
                            </UBadge>
                        </button>
                        <button type="button"
                            class="flex-1 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none"
                            :class="leftTab === 'contacts'
                                ? 'text-primary border-b-2 border-primary'
                                : 'text-muted hover:text-default'" @click="leftTab = 'contacts'">
                            Kontaktlar
                        </button>
                    </div>

                    <!-- ── INBOX TAB ── -->
                    <template v-if="leftTab === 'inbox'">
                        <div class="p-3 border-b border-default">
                            <UInput v-model="search" icon="i-lucide-search" placeholder="Qidirish..." class="w-full" />
                        </div>

                        <div v-if="isLoadingConversations && conversations.length === 0"
                            class="flex-1 flex items-center justify-center">
                            <UIcon name="i-lucide-loader-2" class="size-5 animate-spin text-muted" />
                        </div>

                        <div v-else-if="filteredConversations.length === 0"
                            class="flex-1 flex flex-col items-center justify-center p-6 text-center">
                            <UIcon name="i-lucide-inbox" class="size-8 text-muted mb-3" />
                            <p class="text-sm text-muted">Suhbatlar topilmadi</p>
                        </div>

                        <div v-else class="flex-1 overflow-y-auto">
                            <button v-for="conv in filteredConversations" :key="conv.parent_id" type="button"
                                class="w-full text-left px-3 py-3 hover:bg-elevated/60 transition-colors border-b border-default/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                                :class="activeParentId === conv.parent_id ? 'bg-primary/10 dark:bg-primary/15' : ''"
                                @click="handleOpenConversation(conv.parent_id)">
                                <div class="flex items-start gap-3">
                                    <UAvatar :alt="conv.parent_name" size="sm" class="shrink-0 mt-0.5" />
                                    <div class="flex-1 min-w-0">
                                        <div class="flex items-center justify-between gap-1">
                                            <span class="text-sm font-medium truncate">{{ conv.parent_name }}</span>
                                            <span class="text-xs text-muted shrink-0">{{
                                                formatRelativeTime(conv.last_message_at) }}</span>
                                        </div>
                                        <div class="flex items-center justify-between gap-1 mt-0.5">
                                            <p class="text-xs text-muted truncate">{{ conv.last_message || '—' }}</p>
                                            <UBadge v-if="conv.unread_count > 0" color="primary" size="xs"
                                                class="shrink-0 tabular-nums">
                                                {{ conv.unread_count }}
                                            </UBadge>
                                        </div>
                                        <p class="text-xs text-muted/60 mt-0.5 truncate">{{ conv.parent_phone }}</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </template>

                    <!-- ── CONTACTS TAB ── -->
                    <template v-else>
                        <!-- Search fields -->
                        <div class="p-3 space-y-2 border-b border-default">
                            <UInput v-model="parentName" icon="i-lucide-user" placeholder="Ism bo'yicha qidirish..."
                                class="w-full" />
                            <UInput v-model="parentPhone" icon="i-lucide-phone"
                                placeholder="Telefon bo'yicha qidirish..." class="w-full" />
                        </div>

                        <!-- Loading -->
                        <div v-if="parentsPending && parents.length === 0"
                            class="flex-1 flex items-center justify-center">
                            <UIcon name="i-lucide-loader-2" class="size-5 animate-spin text-muted" />
                        </div>

                        <!-- Empty -->
                        <div v-else-if="parents.length === 0"
                            class="flex-1 flex flex-col items-center justify-center p-6 text-center">
                            <UIcon name="i-lucide-users" class="size-8 text-muted mb-3" />
                            <p class="text-sm text-muted">Telegram ulangan ota-ona topilmadi</p>
                        </div>

                        <!-- Parent items -->
                        <div v-else class="flex-1 overflow-y-auto">
                            <button v-for="parent in parents" :key="parent.id" type="button"
                                class="w-full text-left px-3 py-3 hover:bg-elevated/60 transition-colors border-b border-default/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                                :class="activeParentId === parent.id ? 'bg-primary/10 dark:bg-primary/15' : ''"
                                @click="handleOpenContactConversation(parent.id)">
                                <div class="flex items-center gap-3">
                                    <UAvatar :alt="parent.full_name" size="sm" class="shrink-0" />
                                    <div class="flex-1 min-w-0">
                                        <p class="text-sm font-medium truncate">{{ parent.full_name }}</p>
                                        <p class="text-xs text-muted truncate">{{ parent.phone_number ||
                                            parent.additional_number }}</p>
                                    </div>
                                    <UIcon name="i-lucide-message-circle" class="size-4 text-muted shrink-0" />
                                </div>
                            </button>

                            <!-- Sentinel: triggers next page load when visible -->
                            <div ref="contactsSentinelRef" class="h-8 flex items-center justify-center">
                                <UIcon v-if="parentsPending && parents.length > 0" name="i-lucide-loader-2"
                                    class="size-4 animate-spin text-muted" />
                            </div>
                        </div>
                    </template>
                </div>

                <!-- ── Right pane: Message thread ──────────────────────────── -->
                <div class="flex-1 flex flex-col overflow-hidden">

                    <!-- Empty state: no conversation selected -->
                    <div v-if="!activeParentId"
                        class="flex-1 flex flex-col items-center justify-center text-center p-8">
                        <div class="size-16 rounded-full bg-elevated flex items-center justify-center mb-4">
                            <UIcon name="i-lucide-message-square-text" class="size-8 text-muted" />
                        </div>
                        <p class="text-base font-semibold">Suhbat tanlang</p>
                        <p class="text-sm text-muted mt-1">Chap tarafdan ota-ona suhbatini tanlang</p>
                    </div>

                    <template v-else>
                        <!-- Chat header -->
                        <div class="flex items-center justify-between px-4 py-3 border-b border-default shrink-0">
                            <div class="flex items-center gap-3">
                                <UAvatar :alt="activeConversation?.parent_name" size="sm" />
                                <div>
                                    <p class="text-sm font-semibold leading-tight">{{ activeConversation?.parent_name }}
                                    </p>
                                    <p class="text-xs text-muted">{{ activeConversation?.parent_phone }}</p>
                                </div>
                            </div>
                            <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="sm" @click="handleClose" />
                        </div>

                        <!-- Messages scroll area -->
                        <div ref="messagesContainerRef" class="flex-1 overflow-y-auto px-4 py-4 space-y-2">
                            <!-- Load more older messages -->
                            <div class="flex justify-center pb-2">
                                <UButton v-if="hasMoreMessages" color="neutral" variant="outline" size="xs"
                                    :loading="isLoadingMessages" icon="i-lucide-chevron-up" label="Oldingi xabarlar"
                                    @click="handleLoadMore" />
                                <div v-else-if="isLoadingMessages" class="flex items-center gap-2 text-xs text-muted">
                                    <UIcon name="i-lucide-loader-2" class="size-3 animate-spin" />
                                    Yuklanmoqda...
                                </div>
                            </div>

                            <!-- No messages yet -->
                            <div v-if="messages.length === 0 && !isLoadingMessages"
                                class="flex flex-col items-center justify-center py-12 text-center">
                                <UIcon name="i-lucide-message-circle" class="size-8 text-muted mb-2" />
                                <p class="text-sm text-muted">Hali xabar yo'q</p>
                            </div>

                            <!-- Message bubbles -->
                            <div v-for="msg in messages" :key="msg.id" class="flex"
                                :class="msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'">
                                <div class="max-w-[72%] rounded-2xl px-3.5 py-2 text-sm shadow-xs" :class="msg.direction === 'outgoing'
                                    ? 'bg-primary text-white rounded-br-sm'
                                    : 'bg-elevated rounded-bl-sm'">
                                    <p v-if="msg.sender_name && msg.direction === 'outgoing'"
                                        class="text-xs font-medium mb-1"
                                        :class="msg.direction === 'outgoing' ? 'text-white/70' : 'text-muted'">
                                        {{ msg.sender_name }}
                                    </p>
                                    <p class="whitespace-pre-wrap wrap-break-word leading-relaxed">{{ msg.message }}</p>
                                    <p class="text-xs mt-1 text-right"
                                        :class="msg.direction === 'outgoing' ? 'text-white/60' : 'text-muted'">
                                        {{ formatTime(msg.createdAt) }}
                                    </p>
                                </div>
                            </div>

                            <!-- Anchor for scrolling to bottom -->
                            <div ref="messagesBottomRef" />
                        </div>

                        <!-- Error banner -->
                        <div v-if="error" class="mx-4 mb-2">
                            <UAlert color="error" variant="soft" :description="error" icon="i-lucide-alert-circle" />
                        </div>

                        <!-- Compose area -->
                        <div class="px-4 py-3 border-t border-default shrink-0">
                            <div class="flex items-end gap-2">
                                <UTextarea v-model="newMessage" placeholder="Xabar yozing..." class="flex-1" :rows="1"
                                    autoresize :maxrows="5" @keydown="handleTextareaKeydown" />
                                <UButton icon="i-lucide-send" :loading="isSending"
                                    :disabled="!newMessage.trim() || isSending" @click="handleSend" />
                            </div>
                            <p class="text-xs text-muted mt-1.5">
                                <kbd class="font-mono">Enter</kbd> — yuborish &nbsp;·&nbsp;
                                <kbd class="font-mono">Shift+Enter</kbd> — yangi qator
                            </p>
                        </div>
                    </template>
                </div>
            </div>
        </template>
    </UDashboardPanel>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch, onMounted, onUnmounted } from 'vue'
import { useIntersectionObserver } from '@vueuse/core'
import { useTelegramChat } from '~/composables/useTelegramChat'
import { useParentsWithTelegram } from '~/composables/useParentsWithTelegram'

definePageMeta({
    middleware: ['auth'],
})

// ── Chat composable ────────────────────────────────────────────────────────────

const {
    conversations,
    messages,
    activeParentId,
    totalUnread,
    isSending,
    isLoadingConversations,
    isLoadingMessages,
    error,
    activeConversation,
    hasMoreMessages,
    fetchConversations,
    openConversation,
    closeConversation,
    sendMessage,
    loadMoreMessages,
} = useTelegramChat()

// ── Parents with Telegram composable ──────────────────────────────────────────

const {
    parents,
    hasMore,
    pending: parentsPending,
    parentName,
    parentPhone,
    loadMore: loadMoreParents,
    refresh: refreshParents,
} = useParentsWithTelegram()

// ── Local state ────────────────────────────────────────────────────────────────

const leftTab = ref<'inbox' | 'contacts'>('inbox')
const search = ref('')
const newMessage = ref('')
const messagesContainerRef = ref<HTMLElement | null>(null)
const messagesBottomRef = ref<HTMLElement | null>(null)
const contactsSentinelRef = ref<HTMLElement | null>(null)

// Trigger next page when sentinel scrolls into view
useIntersectionObserver(
    contactsSentinelRef,
    ([entry]) => {
        if (entry?.isIntersecting) loadMoreParents()
    },
    { threshold: 0.1 },
)

// Load first page when Contacts tab is first opened
watch(leftTab, (tab) => {
    if (tab === 'contacts' && parents.value.length === 0) {
        refreshParents()
    }
})

// Track scroll position before load-more so we can restore it
let scrollHeightBeforeLoad = 0

// ── Filtered conversations ─────────────────────────────────────────────────────

const filteredConversations = computed(() => {
    if (!search.value.trim()) return conversations.value
    const q = search.value.toLowerCase()
    return conversations.value.filter(
        (c) =>
            c.parent_name.toLowerCase().includes(q) ||
            c.parent_phone.toLowerCase().includes(q) ||
            c.last_message.toLowerCase().includes(q),
    )
})

// ── Handlers ───────────────────────────────────────────────────────────────────

async function handleOpenConversation(parentId: string) {
    await openConversation(parentId)
    await nextTick()
    scrollToBottom('instant')
}

/** Open from Contacts tab — switch to inbox tab so context is visible */
async function handleOpenContactConversation(parentId: string) {
    leftTab.value = 'inbox'
    await openConversation(parentId)
    await nextTick()
    scrollToBottom('instant')
}

function handleClose() {
    closeConversation()
    newMessage.value = ''
}

async function handleSend() {
    const text = newMessage.value.trim()
    if (!text || isSending.value) return
    newMessage.value = ''
    await sendMessage(text)
    await nextTick()
    scrollToBottom('smooth')
}

function handleTextareaKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
    }
}

async function handleLoadMore() {
    if (!messagesContainerRef.value) return
    // Save scroll height before prepending messages
    scrollHeightBeforeLoad = messagesContainerRef.value.scrollHeight
    await loadMoreMessages()
    await nextTick()
    // Restore scroll position so the view doesn't jump to top
    if (messagesContainerRef.value) {
        const added = messagesContainerRef.value.scrollHeight - scrollHeightBeforeLoad
        messagesContainerRef.value.scrollTop += added
    }
}

// ── Scroll helpers ─────────────────────────────────────────────────────────────

function scrollToBottom(behavior: ScrollBehavior = 'smooth') {
    messagesBottomRef.value?.scrollIntoView({ behavior, block: 'end' })
}

// ── Watchers ───────────────────────────────────────────────────────────────────

// Auto-scroll when new messages arrive in the active thread
watch(
    () => messages.value.length,
    async (newLen, oldLen) => {
        if (newLen <= oldLen) return
        // Only auto-scroll if user is near the bottom (within 200px)
        const el = messagesContainerRef.value
        if (!el) return
        const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
        if (distFromBottom < 200) {
            await nextTick()
            scrollToBottom('smooth')
        }
    },
)

// ── Time formatters ────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
    if (!iso) return ''
    const d = new Date(iso)
    return d.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
}

function formatRelativeTime(iso: string): string {
    if (!iso) return ''
    const d = new Date(iso)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const mins = Math.floor(diff / 60_000)
    const hours = Math.floor(diff / 3_600_000)
    const days = Math.floor(diff / 86_400_000)

    if (mins < 1) return 'Hozir'
    if (mins < 60) return `${mins}m`
    if (hours < 24) return `${hours}s`
    if (days === 1) return 'Kecha'
    if (days < 7)
        return d.toLocaleDateString('uz-UZ', { weekday: 'short' })
    return d.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit' })
}

// ── Init ───────────────────────────────────────────────────────────────────────

onMounted(() => {
    fetchConversations()
})

onUnmounted(() => {
    // Reset shared activeParentId so the layout's SSE toast fires on other pages
    closeConversation()
})
</script>
