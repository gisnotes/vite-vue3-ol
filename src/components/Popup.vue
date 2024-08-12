<script setup>
import useOlMapStore from "@/stores/olMap.js";
import Overlay from "ol/Overlay";
import { onBeforeUnmount } from "vue";

const mapStore = useOlMapStore();

const props = defineProps({
  title: {
    type: String,
    default: "标题",
  },
  position: {
    type: Array,
    default: () => [],
  },
  offset: {
    type: Array,
    default: () => [0, -5],
  },
  autoPan: {
    type: Boolean,
    default: true,
  },
  //属性相关
  propeties: {
    type: Object,
    default: () => {
      return {};
    },
  },
  popupInfo: {
    type: Object,
    default: () => {
      return {};
    },
  },
});

let popOverLay = null;
let popup = ref();
const emits = defineEmits(["close"]);

const getAutoPan = computed(() => {
  return props.autoPan
    ? {
        animation: {
          duration: 250,
        },
        margin: 30,
      }
    : props.autoPan;
});

watch(
  () => props.position,
  (val) => {
    popOverLay?.setPosition(val);
  },
  { deep: true }
);

watch(
  () => props.offset,
  (val) => {
    popOverLay?.setOffset(val);
  },
  { deep: true }
);

onMounted(() => {
  init();
});

function init() {
  popOverLay = new Overlay({
    element: popup.value,
    offset: props.offset,
    autoPan: getAutoPan,
    positioning: "bottom-center",
  });
  console.log("sibling","onMounted");
  console.log("popup", mapStore.map);
  mapStore.map.addOverlay(popOverLay);
}

function close() {
  popOverLay.setPosition(undefined);
  emits("close");
}

onBeforeUnmount(() => {
  popOverLay.setPosition(undefined);
});
</script>

<template>
  <div class="popup" ref="popup">
    <div class="popup-header">
      <div class="popup-title">
        {{ title }}
      </div>
      <div class="popup-close" @click="close">
        <i-ep-close />
      </div>
    </div>
    <div class="popup-content">
      <el-descriptions class="margin-top" :column="1" :size="'small'" border>
        <el-descriptions-item
          width="25px"
          v-for="prop in propeties"
          :key="prop.val"
          :label="prop.val">
          {{
            popupInfo[prop.key]
              ? popupInfo[prop.key] + " " + (prop.unit ? prop.unit : "")
              : "--"
          }}
        </el-descriptions-item>
      </el-descriptions>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.popup {
  position: absolute;
  width: 240px;
  background-color: white;
  box-shadow: 0 2px 4px 0 rgba(100, 100, 100, 0.12),
    0 0 6px 0 rgba(100, 100, 100, 0.6);
  transform: translate(-50%, -100%);
  border-radius: 4px;

  &:after,
  &:before {
    top: 100%;
    border: solid transparent;
    content: " ";
    height: 0;
    width: 0;
    position: absolute;
    pointer-events: none;
    left: 50%;
  }

  &:after {
    border-top-color: #fff;
    border-width: 10px;
    margin-left: -10px;
  }

  &:before {
    border-top-color: #999;
    border-width: 11px;
    margin-left: -11px;
  }

  &-header {
    display: flex;
    align-items: center;
    line-height: 35px;
    color: #000;
    user-select: none;
    border-bottom: 1px solid #eaeaea;
  }

  &-title {
    flex: 1;
    padding-left: 10px;
    font-size: 15px;
    user-select: none;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &-close {
    width: 35px;
    height: 35px;
    border-radius: 0 4px 0 0;
    font-size: 21px;
    text-align: center;
    border: transparent;
    cursor: pointer;
  }

  &-content {
    max-height: 300px;
    font-size: 13px;
    max-height: 300px;
    overflow-y: auto;
    padding: 8px;

    // 滚动条
    &::-webkit-scrollbar {
      width: 10px;
      height: 10px;
    }

    &::-webkit-scrollbar-track {
      background: none;
    }

    &::-webkit-scrollbar-thumb {
      background: #eaeaea;
      border-radius: 10px;
    }

    .cell-item {
      font-size: 12px;
      padding: 4px 7px;
      font-weight: bold;
      text-align: right;
    }

    .see-all {
      text-align: center;
      padding: 8px 0;
    }
  }
}

:deep(.el-descriptions__label.el-descriptions__cell) {
  font-weight: bold;
  text-align: right;
}
</style>
