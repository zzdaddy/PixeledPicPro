import { useStorage } from "@vueuse/core";
import { Storage } from "~/config/Enum";
import { defineStore } from "pinia";

export const globalUser = defineStore("globalUser", () => {
  let localUser = null;
  try {
    localUser = JSON.parse(localStorage.getItem(Storage.USER_INFO) || "{}");
  } catch (error) {
    localUser = {};
  }
  const user = useStorage(Storage.USER_INFO, localUser);
  console.log(`user.value`, user.value);
  function setUserInfo(userInfo: any) {
    user.value = userInfo;
    console.log(`user.value`, user.value);
  }

  return { user, setUserInfo };
});
