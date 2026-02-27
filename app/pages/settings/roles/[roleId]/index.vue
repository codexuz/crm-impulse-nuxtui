<template>
    <UDashboardPanel id="role-users">
        <template #header>
            <UDashboardNavbar :title="`${roleName} — foydalanuvchilar`" :ui="{ right: 'gap-3' }">
                <template #leading>
                    <UButton icon="i-lucide-arrow-left" color="neutral" variant="ghost"
                        @click="navigateTo('/settings/roles')" />
                </template>

                <template #description>
                    Ushbu lavozimga biriktirilgan foydalanuvchilar ro'yxati
                </template>
            </UDashboardNavbar>

            <UDashboardToolbar>
                <template #left>
                    <UInput v-model="searchQuery" icon="i-lucide-search" placeholder="Foydalanuvchini qidirish..."
                        class="w-64" />
                </template>

                <template #right>
                    <USelectMenu v-model="limit" :items="[10, 20, 30, 50]" class="w-24">
                        <template #label> {{ limit }} ta </template>
                    </USelectMenu>

                    <UButton icon="i-lucide-refresh-cw" label="Yangilash" variant="outline" @click="fetchUsers" />
                </template>
            </UDashboardToolbar>
        </template>

        <template #body>
            <div>
                <UCard>
                    <template #header>
                        <h3 class="text-base font-semibold">Foydalanuvchilar ro'yxati</h3>
                    </template>

                    <UTable :data="users" :columns="columns" :loading="isLoading"
                        :empty="'Foydalanuvchilar topilmadi'" />

                    <template #footer>
                        <div class="flex items-center justify-between">
                            <div class="text-sm text-gray-500">
                                <span class="font-medium">{{ paginationStart }}</span> dan
                                <span class="font-medium">{{ paginationEnd }}</span> gacha, jami
                                <span class="font-medium">{{ total }}</span> ta foydalanuvchi
                            </div>

                            <UPagination v-if="total > limit" :model-value="page" :total="total" :items-per-page="limit"
                                show-last show-first @update:page="onPageChange" />
                        </div>
                    </template>
                </UCard>
            </div>
        </template>
    </UDashboardPanel>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { User } from '~/types'
import { api } from '~/lib/api'
import { useAuth } from '~/composables/useAuth'

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UPopover = resolveComponent('UPopover')

definePageMeta({
    middleware: ['auth'],
})

const { apiService } = useAuth()
const toast = useToast()
const route = useRoute()
const router = useRouter()

const roleId = route.params.roleId as string
const roleName = computed(() => (route.query.name as string) || 'Lavozim')

// State
const users = ref<User[]>([])
const total = ref(0)
const isLoading = ref(true)
const searchQuery = ref('')
const page = ref(1)
const limit = ref(10)
const isRemoving = ref(false)
const removePopoverOpen = ref<Record<string, boolean>>({})

// Helpers
const formatDate = (dateString?: string) => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString()
}

// Table columns
const columns: TableColumn<User>[] = [
    {
        accessorKey: 'first_name',
        header: 'Ism',
        cell: ({ row }) => {
            return h('div', { class: 'flex items-center gap-2' }, [
                h('span', { class: 'i-lucide-user text-primary h-4 w-4' }),
                h('span', { class: 'font-medium' }, `${row.original.first_name} ${row.original.last_name}`),
            ])
        },
    },
    {
        accessorKey: 'phone',
        header: 'Telefon',
        cell: ({ row }) => row.original.phone || '—',
    },
    {
        accessorKey: 'username',
        header: 'Login',
        cell: ({ row }) => row.original.username || '—',
    },
    {
        accessorKey: 'is_active',
        header: 'Holat',
        cell: ({ row }) => {
            return h(
                UBadge,
                { variant: row.original.is_active ? 'solid' : 'subtle' },
                () => (row.original.is_active ? 'Faol' : 'Faol emas'),
            )
        },
    },
    {
        accessorKey: 'created_at',
        header: 'Yaratilgan',
        cell: ({ row }) => formatDate(row.original.created_at),
    },
    {
        id: 'actions',
        header: 'Amallar',
        cell: ({ row }) => {
            const userId = row.original.user_id
            return h('div', { class: 'flex justify-end gap-1' }, [
                h(
                    UPopover,
                    {
                        open: removePopoverOpen.value[userId] || false,
                        'onUpdate:open': (value: boolean) => {
                            removePopoverOpen.value[userId] = value
                        },
                    },
                    {
                        default: () =>
                            h(UButton, {
                                color: 'error',
                                variant: 'ghost',
                                icon: 'i-lucide-user-minus',
                                size: 'sm',
                                square: true,
                                title: 'Lavozimni olib tashlash',
                            }),
                        content: () =>
                            h('div', { class: 'p-4 max-w-sm space-y-3' }, [
                                h('h4', { class: 'font-semibold text-sm' }, 'Ishonchingiz komilmi?'),
                                h(
                                    'p',
                                    { class: 'text-sm text-gray-600' },
                                    `${row.original.first_name} ${row.original.last_name} foydalanuvchisidan ushbu lavozimni olib tashlamoqchimisiz?`,
                                ),
                                h('div', { class: 'flex justify-end gap-2 mt-3' }, [
                                    h(UButton, {
                                        color: 'neutral',
                                        variant: 'subtle',
                                        label: 'Bekor qilish',
                                        size: 'sm',
                                        onClick: () => {
                                            removePopoverOpen.value[userId] = false
                                        },
                                    }),
                                    h(UButton, {
                                        color: 'error',
                                        label: isRemoving.value ? "O'chirilmoqda..." : "Olib tashlash",
                                        loading: isRemoving.value,
                                        size: 'sm',
                                        onClick: async () => {
                                            await removeRoleFromUser(userId)
                                            removePopoverOpen.value[userId] = false
                                        },
                                    }),
                                ]),
                            ]),
                    },
                ),
            ])
        },
    },
]

// Computed
const paginationStart = computed(() => {
    return total.value === 0 ? 0 : (page.value - 1) * limit.value + 1
})

const paginationEnd = computed(() => {
    return Math.min(page.value * limit.value, total.value)
})

// API calls
const fetchUsers = async () => {
    isLoading.value = true
    try {
        const params = new URLSearchParams({
            page: page.value.toString(),
            limit: limit.value.toString(),
        })

        const response = await api.get<{ data: User[]; total: number }>(
            apiService.value,
            `/users/by-role/${encodeURIComponent(roleName.value)}?${params.toString()}`,
        )

        users.value = response.data || []
        total.value = response.total || 0
    } catch (error) {
        console.error('Failed to fetch users by role:', error)
        toast.add({
            title: 'Xatolik',
            description: 'Foydalanuvchilarni yuklashda xatolik yuz berdi',
            color: 'error',
        })
        users.value = []
        total.value = 0
    } finally {
        isLoading.value = false
    }
}

const removeRoleFromUser = async (userId: string) => {
    isRemoving.value = true
    try {
        await api.delete(apiService.value, `/users/${userId}/roles/${roleId}`)
        toast.add({
            title: 'Muvaffaqiyat',
            description: 'Lavozim muvaffaqiyatli olib tashlandi',
            color: 'success',
        })
        fetchUsers()
    } catch (error) {
        console.error('Failed to remove role from user:', error)
        toast.add({
            title: 'Xatolik',
            description: 'Lavozimni olib tashlashda xatolik yuz berdi',
            color: 'error',
        })
    } finally {
        isRemoving.value = false
    }
}

// Pagination
const onPageChange = (newPage: number) => {
    page.value = newPage
    updateUrlParams()
    fetchUsers()
}

const updateUrlParams = () => {
    const query: Record<string, string> = {
        page: page.value.toString(),
        name: roleName.value,
    }
    if (searchQuery.value) query.search = searchQuery.value
    router.push({ query })
}

// Init
onMounted(() => {
    if (route.query.page) page.value = parseInt(route.query.page as string, 10)
    fetchUsers()
})

watch(limit, () => {
    page.value = 1
    fetchUsers()
})

watch(searchQuery, () => {
    page.value = 1
    fetchUsers()
})
</script>
