<template>
  <div class="oneMap">
    <TdtMap @mapCreated="mapCreated" />
    <div class="btns">
      <el-button type="primary" @click="zoomToSwitzerland">
        缩放至Switzerland
      </el-button>
      <el-button type="primary" @click="zoomToLausanne">
        缩放至Lausanne
      </el-button>
      <el-button type="primary" @click="centerOnLausanne">
        使Lausanne居中
      </el-button>
    </div>
  </div>
</template>

<script setup>
import VectorSource from "ol/source/Vector.js";
import GeoJSON from "ol/format/GeoJSON.js";
import VectorLayer from "ol/layer/Vector.js";
import { Style, Fill, Stroke, Circle } from "ol/style";

let map, view;

const keyValueStyle = {
  "fill-color": "rgba(255, 255, 255, 0.6)",
  "stroke-width": 1,
  "stroke-color": "#319FD3",
  "circle-radius": 5,
  "circle-fill-color": "rgba(255, 255, 255, 0.6)",
  "circle-stroke-width": 1,
  "circle-stroke-color": "#319FD3",
};

const deafultStyle = new Style({
  fill: new Fill({
    color: keyValueStyle["fill-color"],
  }),
  stroke: new Stroke({
    color: keyValueStyle["stroke-color"],
    width: keyValueStyle["stroke-width"],
  }),
  image: new Circle({
    radius: keyValueStyle["circle-radius"],
    fill: new Fill({
      color: keyValueStyle["circle-fill-color"],
    }),
    stroke: new Stroke({
      color: keyValueStyle["circle-stroke-color"],
      width: keyValueStyle["circle-stroke-width"],
    }),
  }),
});

const source = new VectorSource({
  url: "data/geojson/switzerland.geojson",
  format: new GeoJSON(),
});

function mapCreated(m) {
  map = m;
  view = map.getView();
  init();
}

function init() {
  const vectorLayer = new VectorLayer({
    source,
    // 形式1
    // style: keyValueStyle,
    //形式2
    // style: null,
    //形式3
    // style: undefined,
    //形式4：style function(feature, resolution) {}
    style: (feature, resolution) => {
      // console.log("🚀 ~ :36 ~ feature, resolution:", feature, resolution);
      feature.setStyle(deafultStyle);
      // return deafultStyle;
    },
  });

  map.addLayer(vectorLayer);
}

function zoomToSwitzerland() {
  const feature = source.getFeatures()[0];
  const polygon = feature.getGeometry();
  view.fit(polygon, { padding: [170, 50, 30, 150] });
}
function zoomToLausanne() {
  const feature = source.getFeatures()[1];
  const point = feature.getGeometry();
  view.fit(point, { padding: [170, 50, 30, 150], minResolution: 50 });
}
function centerOnLausanne() {
  const feature = source.getFeatures()[1];
  const point = feature.getGeometry();
  const size = map.getSize();
  view.centerOn(point.getCoordinates(), size, [size[0] / 2, size[1] / 2]);
}
</script>

<style lang="scss" scoped>
.oneMap {
  position: relative;
  height: 100%;
  overflow: hidden;

  .btns {
    position: absolute;
    top: 50px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 2;
  }
}
</style>
