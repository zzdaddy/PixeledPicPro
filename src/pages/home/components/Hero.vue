<script setup lang="ts">
// import { userLogin } from "~/api/user";
const router = useRouter();

function testStore() {
  router.push({
    name: "Factory",
  });
}
</script>

<template>
  <div class="mt-[-4rem] min-h-screen text-primary-content hero">
    <!--  <div class="hero min-h-screen from-primary to-secondary" style="background-image: url(https://img.js.design/assets/Resources/background/home-bg-2.png);"> -->
    <div class="place-items-center" />
    <div class="text-center hero-content">
      <div class="max-w-md">
        <!-- <h1 class="mb-5 text-5xl font-bold">功能开发中,略显简陋</h1> -->
        <!-- <a-button type="primary">测试</a-button>
        <a-button type="primary">测试</a-button>
        <a-button type="primary">测试</a-button>
        <a-input
          :style="{ width: '320px' }"
          default-value="content"
          placeholder="Please enter something"
          allow-clear
        /> -->

        <p class="mb-5" />
        <a-button type="primary" @click="testStore">开始创作</a-button>
        <!-- <button class="btn btn-primary" @click="testStore">开始创作</button> -->
      </div>
    </div>
  </div>
</template>

<style scoped></style>
