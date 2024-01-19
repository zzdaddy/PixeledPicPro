import { counter } from "./counter";
import { globalUser } from "./user";
const appStore: any = {};

/**
 * 注册app状态库
 */
export function registerStore() {
  appStore.counter = counter();
  appStore.globalUser = globalUser();
}

export default appStore;
