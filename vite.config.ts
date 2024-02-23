import { resolve } from "node:path";
import { defineConfig } from "vite";
import Vue from "@vitejs/plugin-vue";
import Components from "unplugin-vue-components/vite";
import AutoImport from "unplugin-auto-import/vite";
import Icons from "unplugin-icons/vite";
import IconsResolver from "unplugin-icons/resolver";
import Inspect from "vite-plugin-inspect";
import { VitePWA } from "vite-plugin-pwa";
import VueDevTools from "vite-plugin-vue-devtools";
import { ArcoResolver } from "unplugin-vue-components/resolvers";
// vite.config.ts
import VueI18nPlugin from "@intlify/unplugin-vue-i18n/vite";
import UnoCss from "unocss/vite";
import { vitePluginForArco } from "@arco-plugins/vite-vue";

// const isDev = process.env.NODE_ENV === "development";
// import packageJson from './package.json';
const packageJson = require("./package.json");

// https://vitejs.dev/config/
export default defineConfig({
  base: "./",
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  server: {
    host: "localhost",
    port: 8888,
    open: true,
    proxy: {},
  },
  plugins: [
    Vue({
      script: {
        propsDestructure: true,
        defineModel: true,
      },
    }),
    Icons({
      scale: 1.5, // Scale of icons against 1em
      defaultStyle: "", // Style apply to icons
      defaultClass: "inline-block h-5 w-5 stroke-current md:h-6 md:w-6", // Class names apply to icons
      compiler: "vue3", // "vue2", "vue3", "jsx"
      jsx: "react", // "react" or "preact"
      autoInstall: true,
    }),
    // https://github.com/antfu/unplugin-auto-import
    AutoImport({
      imports: [
        "vue",
        "vue-router",
        "vue-i18n",
        "vue/macros",
        "@vueuse/head",
        "@vueuse/core",
      ],
      resolvers: [ArcoResolver()],
      dts: "types/auto-imports.d.ts",
      // 自动引入components
      dirs: ["src/composables", "src/store"],
      vueTemplate: true,
    }),

    // https://github.com/antfu/unplugin-vue-components
    Components({
      extensions: ["vue"],
      include: [/\.vue$/, /\.vue\?vue/],
      dts: "types/components.d.ts",
      exclude: [
        /[\\/]node_modules[\\/]/,
        /[\\/]\.git[\\/]/,
        /[\\/]\.nuxt[\\/]/,
      ],
      resolvers: [
        IconsResolver(),
        ArcoResolver({
          //   importStyle: "less", // 可以不写
          resolveIcons: true,
          // 这里必须设置为 true，否则 yarn build 不会将自动导入的 arco 组件的样式文件打包
          sideEffect: true,
        }),
      ],
    }),
    vitePluginForArco({
      theme: "@arco-themes/vue-zzstudio",
    }),
    // https://github.com/intlify/bundle-tools/tree/main/packages/unplugin-vue-i18n
    VueI18nPlugin({
      runtimeOnly: true,
      compositionOnly: true,
      fullInstall: true,
      include: [resolve(__dirname, "src/locales/**")],
    }),

    // https://github.com/antfu/vite-plugin-pwa
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico"],
      manifest: {
        name: "BootVue",
        short_name: "BootVue",
        theme_color: "#ffffff",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),

    // https://github.com/antfu/vite-plugin-inspect
    // Visit http://localhost:3333/__inspect/ to see the inspector
    Inspect(),

    // https://github.com/webfansplz/vite-plugin-vue-devtools
    VueDevTools(),

    // https://github.com/unocss/unocss
    // see unocss.config.ts for config
    UnoCss(),
  ],
  resolve: {
    alias: {
      "~/": `${resolve(__dirname, "src")}/`,
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
      @import "~/styles/variables.scss";
    `,
        javascriptEnabled: true,
      },
    },
  },
  // https://github.com/vitest-dev/vitest
  test: {
    environment: "jsdom",
  },
  // 不开 sourcemap 也能调试
  build: {
    sourcemap: false,
  },
});
