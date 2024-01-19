<template>
  <ZModal modalId="pixel_login_modal_1" modalClass="max-w-2xl" ref="loginModal">
    <ZButton
      tooltip="登录解锁更多功能"
      btnText="登录"
      btnClass="btn btn-outline btn-sm glass"
      @tap="showLoginModal"
    />
    <template #content>
      <div class="text-center font-bold text-xl mb-4">登录</div>
      <div class="flex justify-center items-center mb-2">
        <span class="inline-block w-20 text-right mr-2">用户名:</span>
        <input
          type="text"
          placeholder="用户名"
          class="input input-bordered w-100"
          v-model="username"
        />
      </div>
      <div class="flex justify-center items-center mb-2">
        <span class="inline-block w-20 text-right mr-2">密码:</span>
        <input
          type="password"
          placeholder="密码"
          class="input input-bordered w-100"
          v-model="password"
        />
      </div>
      <div class="flex justify-center items-center mb-2" v-if="isNeedRegister">
        <span class="inline-block w-20 text-right mr-2">昵称:</span>
        <input
          type="text"
          placeholder="昵称(长度2-6)"
          class="input input-bordered w-100"
          v-model="nickname"
        />
      </div>
      <div class="modal-footer flex justify-end">
        <button
          class="btn btn-secondary btn-sm mr-2"
          @click="handleRegistAndLogin"
        >
          注册并登录
        </button>
        <button class="btn btn-primary btn-sm" @click="handleLogin">
          登录
        </button>
      </div>
    </template>
  </ZModal>
</template>
<script lang="ts" setup>
import { ref, onMounted } from "vue";
import { getUserInfo, userLogin, userRegister } from "~/api/user";
import { md5 } from "js-md5";
import { toast } from "vue3-toastify";
import { Storage } from "~/config/Enum";
import appStore from "~/store";
const loginModal = ref();
const username = ref("");
const nickname = ref("");
const password = ref("");
// 摊位名称
const appName = ref(import.meta.env.VITE_APP_NAME);
const isNeedRegister = ref(false);

const emit = defineEmits(["ok"]);

const showLoginModal = () => {
  loginModal.value.openModal();
};

const handleRegistAndLogin = async () => {
  isNeedRegister.value = true;
  if (!username.value || !password.value || !nickname.value) {
    toast("先补充完整吧!", {
      type: "error",
      position: toast.POSITION.TOP_CENTER,
    });
    return;
  }
  // 注册并登录
  await userRegister({
    username: username.value,
    password: md5(password.value),
    nickname: nickname.value,
    source: appName.value, // 来源必传
  });

  handleLogin();
};
const handleLogin = async () => {
  if (!username.value || !password.value) {
    toast("先补充完整吧!", {
      type: "error",
      position: toast.POSITION.TOP_CENTER,
    });
    return;
  }
  let { access_token, refresh_token } = await userLogin({
    username: username.value,
    password: md5(password.value),
  });
  console.log(`access_token`, access_token);
  localStorage.setItem(Storage.ACCESS_TOKEN, access_token);
  localStorage.setItem(Storage.REFRESH_TOKEN, refresh_token);
  //   localStorage.setItem(
  //     Storage.USER_INFO,
  //     JSON.stringify({ username: username.value })
  //   );
  const user = await getUserInfo();
  appStore.globalUser.setUserInfo(user);
  loginModal.value.closeModal();
  toast("登录成功!", {
    type: "success",
    autoClose: 1500,
    position: toast.POSITION.TOP_CENTER,
  });
  emit("ok");
};

onMounted(() => {
  isNeedRegister.value = false;
});
</script>
<style lang="less" scoped></style>
