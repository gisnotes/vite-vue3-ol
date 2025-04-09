<script setup>
import { toFixed } from "ol/math.js";

const isMapCreated = ref(false);
const state = shallowReactive({
  map: null,
});

provide("state", state);
provide("isMapCreated", isMapCreated);

//弹窗
let title = ref("");
let position = ref([]);
let offset = ref([0, -10]);
let propeties = ref([{ key: "coor", val: "坐标", unit: null }]);
let popupInfo = ref({});

function mapCreated(map) {
  state.map = map;
  isMapCreated.value = true;
}

function mapClick(evt) {
  title.value = "鼠标点击坐标";
  position.value = evt.coordinate;
  const [lng, lat] = evt.coordinate;
  popupInfo.value = {
    coor: [toFixed(lng, 4), toFixed(lat, 4)],
  };
}

function closePopup() {
  //TODO
}
</script>

<template>
  <div class="oneMap">
    <TdtMap @mapCreated="mapCreated" @mapClick="mapClick" />
    <Popup :title :position :offset :propeties :popupInfo @close="closePopup" />
  </div>
</template>

<style lang="scss" scoped>
.oneMap {
  position: relative;
  height: 100%;
  overflow: hidden;
}
</style>
