<script setup>
import Map from "ol/Map.js";
import View from "ol/View.js";
import { defaults as defaultInteractions } from "ol/interaction.js";
import { unByKey } from "ol/Observable.js";

import Tianditu from "@/utils/tdt.js";

let map;
let mapDivRef = ref();
let mapClickEvtKey = null;

const emits = defineEmits(["mapCreated", "mapClick"]);

const props = defineProps({
  defaultTdtLyrType: {
    type: String,
    default: "vec",
  },
});

const TDT = new Tianditu();
const vecLyrGrp = TDT.createTileLayerGroup(
  "vec",
  "vec" === props.defaultTdtLyrType
);

const imgLyrGrp = TDT.createTileLayerGroup(
  "img",
  "img" === props.defaultTdtLyrType
);

const view = new View({
  center: [0, 0],
  zoom: 2,
  maxZoom: 28,
  projection: "EPSG:4326",
});

onMounted(() => {
  createMap();
  initMapEvt();
});

function createMap() {
  map = new Map({
    target: mapDivRef.value,
    layers: [vecLyrGrp, imgLyrGrp],
    view,
    controls: [], //为空数组时，则将默认的控件全部关闭
    interactions: defaultInteractions({ doubleClickZoom: false }), //关闭双击交互
  });
  emits("mapCreated", map);
}

function initMapEvt() {
  mapClickEvtKey = map.on("singleclick", (e) => {
    emits("mapClick", e);
  });
}

onBeforeUnmount(() => {
  unByKey(mapClickEvtKey);
  mapClickEvtKey = null;
  map = null;
});
</script>

<template>
  <div class="map" ref="mapDivRef"></div>
</template>

<style lang="scss" scoped>
.map {
  position: relative;
  height: 100%;
}
</style>
