// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  ssr: false,
  modules: ["@nuxt/ui", "nuxt-echarts"],
  css: ["~/assets/css/tailwind.css"],
  echarts: {
    charts: ["LineChart", "BarChart", "PieChart"],
    components: [
      "TooltipComponent",
      "GridComponent",
      "LegendComponent",
      "DatasetComponent",
    ],
  },
});
