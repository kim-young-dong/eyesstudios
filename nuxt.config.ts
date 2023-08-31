// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ["@vueuse/nuxt"],
  build: {
    transpile: ["three"],
  },
  app: {
    head: {
      title: "eyesstudios",
      htmlAttrs: {
        lang: "ko",
      },
      meta: [
        { charset: "utf-8" },
        {
          name: "viewport",
          content:
            "width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no",
        },
        { name: "description", content: "a mini-game with nuxt3 and three.js" },
        { name: "format-detection", content: "telephone=no" },
      ],
    },
  },
})
