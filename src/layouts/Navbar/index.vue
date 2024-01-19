<script setup lang="ts">
// import ThemeChange from "./components/ThemeChange/index.vue";

// import { getUserInfo } from "~/api/user";
import LoginModal from "./components/LoginModal/index.vue";
import UnoCSSIconButton from "~/components/Icon/UnoCSSIconButton.vue";
import appStore from "~/store/index";
defineOptions({
  name: "Navbar",
});

// const userInfo: any = useStorage(Storage.USER_INFO, {}, localStorage);
// console.log(`userInfo`, userInfo.value);
const username = computed(() => {
  return appStore.globalUser?.user?.nickname;
});

const handleLoginSuccess = async () => {
  //   const user = await getUserInfo();
  //   appStore.globalUser.setUserInfo(user);
};
// @ts-expect-error
const version = ref({ __APP_VERSION__ });
</script>

<template>
  <div
    class="sticky top-0 z-30 h-16 w-full flex justify-center text-base-content opacity-90 backdrop-blur transition-all duration-100 shadow-lg"
  >
    <nav class="w-full navbar">
      <div class="flex flex-1 lg:gap-2 md:gap-1">
        <RouterLink
          to="/"
          aria-current="page"
          aria-label="Homepage"
          class="px-2 btn btn-ghost"
        >
          <div
            class="inline-flex text-lg text-primary transition-all duration-200 md:text-3xl"
          >
            <span class="text-primary"
              >P<span class="lowercase">ixeled</span></span
            >
            <span class="text-accent-content"
              >P<span class="lowercase">ic</span></span
            >
            <span class="text-accent-content"
              >P<span class="lowercase">ro</span></span
            >
            <sup
              ><em class="text-xs">Beta v{{ version.__APP_VERSION__ }}</em></sup
            >
          </div>
        </RouterLink>
      </div>
      <div>
        <!-- <ThemeChange /> -->
        <!-- <LocalesChange /> -->
        <span class="mr-2" id="busuanzi_container_site_pv"
          ><span class="text-primary text-sm" id="busuanzi_value_site_pv"></span
        ></span>
        <!-- <button class="btn btn-outline btn-sm glass" v-if="!!!userInfo">
          登录
        </button> -->
        <LoginModal v-if="!!!username" @ok="handleLoginSuccess"></LoginModal>
        <button class="btn btn-outline btn-sm glass">
          {{ username }}
        </button>
        <!-- <span id="busuanzi_container_site_pv">本站总访问量<span id="busuanzi_value_site_pv"></span>次</span> -->

        <span
          class="tooltip tooltip-bottom before:text-xs before:content-[attr(data-tip)]"
          data-tip="GitHub"
        >
          <span class="flex-none items-center">
            <a
              aria-label="Github"
              target="_blank"
              href="https://github.com/zzdaddy/PixeledPicPro"
              class="drawer-button normal-case btn btn-square btn-ghost"
            >
              <UnoCSSIconButton icon="i-mdi-github" />
            </a>
          </span>
        </span>
      </div>
    </nav>
  </div>
</template>
