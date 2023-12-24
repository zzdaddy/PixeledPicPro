<script setup lang="ts">
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
        <h1 class="mb-5 text-5xl font-bold">此处应该有一个动图</h1>
        <p class="mb-5" />
        <button class="btn btn-primary" @click="testStore">开始创作</button>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
