import { useLocalStorage } from "@vueuse/core";
import { createApp } from "vue";
import Vue3Toasity, { toast, type ToastContainerOptions } from "vue3-toastify";
import "vue3-toastify/dist/index.css";

// Vue Router
import { createPinia } from "pinia";
import { createI18n } from "vue-i18n";

import messages from "@intlify/unplugin-vue-i18n/messages";
import { router } from "./router";

import { registerStore } from "./store";
import App from "~/App.vue";

// reset css
import "@kirklin/reset-css/kirklin.css";
import "~/styles/main.css";
import "uno.css";

const app = createApp(App);
app.use(
  createI18n({
    legacy: false,
    locale: unref(useLocalStorage("locale", "zh")),
    messages,
  })
);
app.use(Vue3Toasity, {
  autoClose: 2500,
  theme: "dark", // 主题
  hideProgressBar: false, // 隐藏timer进度条 开着有助于颜色高亮提示
  dangerouslyHTMLString: true,
  pauseOnFocusLoss: false, // 鼠标移入后暂停timer
  transition: toast.TRANSITIONS.BOUNCE, // 动画效果 BOUNCE 为默认
} as ToastContainerOptions);
app.use(createPinia());
registerStore();
app.use(router);
app.mount("#app");
