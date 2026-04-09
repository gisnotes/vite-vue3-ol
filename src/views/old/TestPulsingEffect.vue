<script setup>
import PulsingPoint from "@/utils/PulsingPoint.js";
import "@/assets/pulsing.css";
import Overlay from "ol/Overlay.js";
import { toFixed } from "ol/math";

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
let propeties = ref([
  { key: "name", val: "名称", unit: null },
  { key: "position", val: "经纬度", unit: null },
]);
let popupInfo = ref({});

let pulsingPointInstance;

function mapCreated(map) {
  state.map = map;
  isMapCreated.value = true;
  pulsingPointInstance = new PulsingPoint(map, {});

  const dataList = [
    [113.60510072327322, 34.763978243544706],
    [113.71583938853964, 34.76764038085938],
    [113.64170852330412, 34.64679077148438],
  ];

  dataList.forEach((coor, idx) => {
    pulsingPointInstance.add(coor, { name: `pulsing-${idx + 1}` });
  });
}

function mapClick(evt) {
  const view = state.map.getView();
  const resolution = view.getResolution();
  const metersPerUnit = view.getProjection().getMetersPerUnit();
  console.log("🚀 | metersPerUnit:", metersPerUnit);
  const distance = (15 / 2) * resolution * metersPerUnit;
  // console.log("🚀 | distance:", distance);

  const pickedOverlay = pulsingPointInstance.findNearestOverlay(
    evt.coordinate,
    distance
  );
  if (pickedOverlay && pickedOverlay instanceof Overlay) {
    const props = pickedOverlay.getProperties();
    title.value = props.name;
    let [x, y] = props.position;
    popupInfo.value = {
      name: props.name,
      position: [toFixed(x, 4), toFixed(y, 4)],
    };
    position.value = props.position;
  }
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
