import type { RouteRecordRaw } from "vue-router";
import { createRouter, createWebHashHistory } from "vue-router";
import { basicRoutes } from "./routes";
import NProgress from "~/config/nprogress";
import { getUserInfo } from "~/api/user";
import { Storage } from "~/config/Enum";
import appStore from "~/store";
export const router = createRouter({
  history: createWebHashHistory(),
  routes: basicRoutes as unknown as RouteRecordRaw[],
  strict: true,
  // When switching pages, scroll to the top
  // 当切换页面，滚动到最顶部
  scrollBehavior: () => ({ left: 0, top: 0 }),
});

// Injection Progress
router.beforeEach(async (to, from, next) => {
  if (!NProgress.isStarted()) {
    NProgress.start();
  }
  let access_token = localStorage.getItem(Storage.ACCESS_TOKEN);
  // 如果登录过,则校验有没有过期
  if (access_token) {
    const res = await getUserInfo().catch((err) => {
      next();
    });

    if (res) {
      console.log(`res`, res);
      appStore.globalUser.setUserInfo(res);
    }
  }
  // 否则不需要去请求接口,避免产生提示, 等到用户操作时再提示
  next();
});

router.afterEach(() => {
  NProgress.done();
});
