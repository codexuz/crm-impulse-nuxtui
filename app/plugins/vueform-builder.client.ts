import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin(async (nuxtApp) => {
  if (import.meta.client) {
    const Builder = (await import('@vueform/builder')).default
    const builderConfig = (await import('../../builder.config')).default
    nuxtApp.vueApp.use(Builder, builderConfig)
  }
})
