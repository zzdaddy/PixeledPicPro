<template>
  <ZModal ref="presetModal">
    <ZButton
      tooltip="打开预设面板"
      :imgSrc="BtnSetting"
      btnText="预设"
      btnClass="btn-primary mr-2"
      @tap="showPresetSetting"
    />
    <template #content>
      <textarea
        v-show="false"
        v-model="copyPreset"
        class="absolute left--60 textarea textarea-primary textarea-md"
        placeholder="json"
      />
      <!-- <h3 class="font-bold text-lg">全部预设</h3> -->
      <div class="overscroll-y-auto flex flex-wrap gap-2">
        <div
          class="tooltip-top w-full tooltip"
          data-tip="复制JSON到输入框内会自动导入"
        >
          <div class="w-34 dropdown dropdown-left">
            <div tabindex="0" role="button" class="w-full btn btn-primary">
              导入JSON预设
            </div>
            <div
              tabindex="0"
              class="dropdown-content z-[1] bg-base-100 p-2 shadow menu rounded-box"
            >
              <textarea
                v-if="showPasteTextarea"
                v-model="pastePreset"
                class="textarea textarea-primary textarea-md"
                placeholder="json"
              />
            </div>
          </div>
        </div>
        <template v-for="config in awsomePreset">
          <div class="card w-1/4 bg-base-100 shadow-xl">
            <figure>
              <div class="colors flex w-auto h-20 overflow-hidden">
                <div
                  class="w-10 h-10"
                  v-for="color in config.colors"
                  :style="{ backgroundColor: color }"
                ></div>
              </div>
            </figure>
            <div class="card-body">
              <h2 class="card-title">
                {{ config.name }}
                <div class="badge badge-secondary">NEW</div>
              </h2>
              <p>
                单元格(方格)
                <span class="text-primary font-bold text-xl">{{
                  `${config.cellConfig.size} x ${config.cellConfig.size}`
                }}</span>
                px
              </p>
              <p>
                单元格数量
                <span class="text-primary font-bold text-xl">{{
                  `${config.cellConfig.xCount} x ${config.cellConfig.yCount}`
                }}</span>
                个
              </p>
              <div class="card-actions justify-end">
                <button class="btn btn-sm btn-accent" @click="exportPreset">
                  {{ isSupported ? "复制" : "不支持复制" }}
                </button>
                <button
                  class="btn btn-sm btn-primary"
                  @click="() => applyAwsomePreset(config.name)"
                >
                  使用
                </button>
              </div>
            </div>
          </div>
        </template>
      </div>
    </template>
  </ZModal>
</template>
<script lang="ts" setup>
import BtnSetting from "~/assets/btn-setting.png";
import { ref } from "vue";
import { toast } from "vue3-toastify";
const presetModal = ref();
const pastePreset = ref<string>("");
const showPasteTextarea = ref<boolean>(true);
const copyPreset = ref<string>("");

const { isSupported, copy } = useClipboard();

// 优秀的预设, 改为从接口获取用户自己的预设
const awsomePreset = ref([
  {
    name: "基础预设",
    cellConfig: {
      size: 10,
      border: 0.5,
      xCount: 10,
      yCount: 10,
    },
    colors: ["#000000", "#ffffff", "#1e80ff", "#f53f3f"],
  },
  {
    name: "IKUN",
    cellConfig: {
      size: 5,
      border: 0.5,
      xCount: 20,
      yCount: 20,
    },
    colors: [
      "#564A54",
      "#DDDBED",
      "#1C1A25",
      "#DDB3C0",
      "#908B96",
      "#CC7A76",
      "#ffffff",
    ],
  },
]);

const emits = defineEmits(["apply"]);
const showPresetSetting = () => {
  presetModal.value.openModal();
};
const closePresetSetting = () => {
  presetModal.value.closeModal();
};

const exportPreset = () => {
  if (isSupported) {
    copy(copyPreset.value);
    toast("已复制到剪切板", {
      type: "success",
    });
  }
};

const applyAwsomePreset = (name: string) => {
  const preset = awsomePreset.value.find((item) => item.name === name);
  if (preset) {
    copyPreset.value = JSON.stringify(preset, null, 2);
    // 应用预设, 改变页面上的配置信息
    emits("apply", preset);
    // 设置当前配置
    // baseRectSize.value = cellConfig.size;
    // shapeTableCol.value = cellConfig.yCount;
    // shapeTableRow.value = cellConfig.xCount;
    // colorConfig.value = colors;
    // resetAndRebuildStage();
    closePresetSetting();
    // 根据预设生成
    // genRectPixelBox()
  } else {
    toast("不存在的预设", {
      type: "error",
    });
  }
};
</script>
