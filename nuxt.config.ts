// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  ssr: false,
  telemetry: { enabled: false },
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL ?? "https://backend.impulselc.uz/api",
    },
  },
  devServer: {
    host: '0.0.0.0',
  },
  vite: {
    // Better support for Tauri CLI output
    clearScreen: false,
    // Enable environment variables
    // Additional environment variables can be found at
    // https://v2.tauri.app/reference/environment-variables/
    envPrefix: ['VITE_', 'TAURI_'],
    server: {
      // Tauri requires a consistent port
      strictPort: true,
    },
  },
  // Avoids error [unhandledRejection] EMFILE: too many open files, watch
  ignore: ['**/src-tauri/**'],
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
