<script setup lang="ts">
import { useBonusPenalty } from "~/composables/useBonusPenalty";

const props = defineProps<{
  bonusTotal: number;
  jarimaTotal: number;
  referalTotal: number;
  count: number;
}>();

const { formatCurrency } = useBonusPenalty();

// Net effect on teacher wallets: credits (bonus + referal) minus penalties.
const net = computed(() => props.bonusTotal + props.referalTotal - props.jarimaTotal);

const cards = computed(() => [
  {
    label: "Bonuslar",
    value: formatCurrency(props.bonusTotal),
    icon: "i-lucide-trending-up",
    accent: "text-green-600",
  },
  {
    label: "Jarimalar",
    value: formatCurrency(props.jarimaTotal),
    icon: "i-lucide-trending-down",
    accent: "text-red-600",
  },
  {
    label: "Referal to'lovlari",
    value: formatCurrency(props.referalTotal),
    icon: "i-lucide-gift",
    accent: "text-blue-600",
  },
  {
    label: "Sof balans",
    value: formatCurrency(net.value),
    icon: "i-lucide-wallet",
    accent: net.value >= 0 ? "text-green-600" : "text-red-600",
  },
]);
</script>

<template>
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <UCard v-for="card in cards" :key="card.label">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-500">{{ card.label }}</p>
          <p class="text-xl font-bold mt-1" :class="card.accent">{{ card.value }}</p>
        </div>
        <span :class="`${card.icon} ${card.accent} text-2xl`"></span>
      </div>
    </UCard>
  </div>
</template>
