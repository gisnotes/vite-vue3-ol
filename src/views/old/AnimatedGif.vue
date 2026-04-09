<template>
  <div class="oneMap">
    <TdtMap @mapCreated="mapCreated" />
  </div>
</template>

<script setup>
import Feature from "ol/Feature.js";
import Point from "ol/geom/Point.js";
import VectorLayer from "ol/layer/Vector.js";
import VectorSource from "ol/source/Vector.js";
import Icon from "ol/style/Icon.js";
import Style from "ol/style/Style.js";

let map, gifler;

const iconFeature = new Feature({
  geometry: new Point([0, 0]),
});

const vectorSource = new VectorSource({
  features: [iconFeature],
});

const vectorLayer = new VectorLayer({
  source: vectorSource,
});

async function mapCreated(m) {
  map = m;
  map.addLayer(vectorLayer);
  gifler = (await import("gifler")).default || window.gifler;
  // console.log("🚀 ~ :13 ~ gifler:", gifler);
  const gif = gifler("data/globe.gif");
  // 参考文档：https://themadcreator.github.io/gifler/docs.html
  gif.frames(
    document.createElement("canvas"),
    function (ctx, frame) {
      if (!iconFeature.getStyle()) {
        iconFeature.setStyle(
          new Style({
            image: new Icon({
              img: ctx.canvas,
              opacity: 0.8,
            }),
          })
        );
      }
      ctx.clearRect(0, 0, frame.width, frame.height);
      ctx.drawImage(frame.buffer, frame.x, frame.y);
      map.render();
    },
    true
  );

  map.on("pointermove", function (e) {
    const hit = map.hasFeatureAtPixel(e.pixel);
    map.getTargetElement().style.cursor = hit ? "pointer" : "";
  });
}
</script>

<style lang="scss" scoped>
.oneMap {
  position: relative;
  height: 100%;
  overflow: hidden;
}
</style>
