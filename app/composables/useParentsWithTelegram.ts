export interface ParentWithTelegram {
  id: string
  student_id: string
  full_name: string
  phone_number: string
  additional_number: string
  telegram_chat_id: string
  createdAt: string
  updatedAt: string
}

export interface ParentsWithTelegramPage {
  data: ParentWithTelegram[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export function useParentsWithTelegram() {
  const { public: publicConfig } = useRuntimeConfig()
  const authState = useState<{ token: string | null } | null>('auth')

  const page = ref(1)
  const limit = 20
  const parentName = ref('')
  const parentPhone = ref('')

  const allParents = ref<ParentWithTelegram[]>([])
  const total = ref(0)
  const totalPages = ref(1)
  const pending = ref(false)
  const error = ref<string | null>(null)

  const hasMore = computed(() => page.value < totalPages.value)

  function buildHeaders(): Record<string, string> {
    const t = authState.value?.token
    return t ? { Authorization: `Bearer ${t}` } : {}
  }

  async function fetchPage(p: number, reset: boolean) {
    pending.value = true
    error.value = null
    try {
      const res = await $fetch<ParentsWithTelegramPage>(
        `${publicConfig.apiBaseUrl as string}/student-parents/with-telegram`,
        {
          headers: buildHeaders(),
          query: {
            page: p,
            limit,
            ...(parentName.value.trim() && { parent_name: parentName.value.trim() }),
            ...(parentPhone.value.trim() && { parent_phone: parentPhone.value.trim() }),
          },
        },
      )
      if (reset) {
        allParents.value = res.data
      } else {
        allParents.value.push(...res.data)
      }
      total.value = res.total
      totalPages.value = res.totalPages
    } catch (e: any) {
      error.value = e?.data?.message ?? e?.message ?? 'Failed to load'
    } finally {
      pending.value = false
    }
  }

  /** Load next page (called by IntersectionObserver sentinel) */
  async function loadMore() {
    if (pending.value || !hasMore.value) return
    page.value++
    await fetchPage(page.value, false)
  }

  /** Reset and reload from page 1 */
  async function refresh() {
    page.value = 1
    await fetchPage(1, true)
  }

  // Re-fetch from page 1 whenever search filters change
  watch([parentName, parentPhone], () => {
    page.value = 1
    fetchPage(1, true)
  })

  return {
    parents: allParents,
    total,
    totalPages,
    hasMore,
    pending,
    error,
    page,
    parentName,
    parentPhone,
    loadMore,
    refresh,
  }
}
