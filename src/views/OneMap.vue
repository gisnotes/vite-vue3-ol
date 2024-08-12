<script setup>
import useOlMapStore from "@/stores/olMap.js";
import { toFixed } from "ol/math.js";

const mapStore = useOlMapStore();

let title = ref("");
let position = ref([]);
let offset = ref([0, -10]);
let propeties = ref([{ key: "coor", val: "坐标", unit: null }]);
let popupInfo = ref({});

onMounted(() => {
  console.log("parent", "onMounted", mapStore.map);
});

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
  <TdtMap @mapClick="mapClick" />
  <Popup :title :position :offset :propeties :popupInfo @close="closePopup" />
</template>
