<script setup>
import { toFixed } from "ol/math.js";
import View from "ol/View.js";
import VectorLayer from "ol/layer/Vector.js";
import VectorSource from "ol/source/Vector.js";
import Cluster from "ol/source/Cluster.js";
import Feature from "ol/Feature.js";
import GeoJSON from "ol/format/GeoJSON.js";
import { LineString, Point, Polygon } from "ol/geom.js";
import { fromLonLat } from "ol/proj.js";
import monotoneChainConvexHull from "monotone-chain-convex-hull";
import {
  Fill,
  Icon,
  Stroke,
  Style,
  Text,
  Circle as CircleStyle,
} from "ol/style";
import { createEmpty, extend, getHeight, getWidth } from "ol/extent.js";

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
  { key: "Name", val: "企业名称", unit: null },
  { key: "Rank", val: "企业排名", unit: null },
]);
let popupInfo = ref({});

let clickFeature, clickResolution;
// 聚类圆样式
const outerCircleFill = new Fill({
  color: "rgba(255, 153, 102, 0.3)",
});
const innerCircleFill = new Fill({
  color: "rgba(255, 165, 0, 0.7)",
});
const textFill = new Fill({
  color: "#fff",
});
const textStroke = new Stroke({
  color: "rgba(0, 0, 0, 0.6)",
  width: 3,
});
const innerCircle = new CircleStyle({
  radius: 14,
  fill: innerCircleFill,
});
const outerCircle = new CircleStyle({
  radius: 20,
  fill: outerCircleFill,
});

// 单个要素图标样式
const iconStyle = new Icon({
  src: "data/enterprise.png",
  width: 24,
  height: 24,
});

const vectorSource = new VectorSource({
  format: new GeoJSON(),
  url: "data/Top100GISEnterprise.json",
});

const clusterSource = new Cluster({
  distance: 35, //35像素距离范围内的要素将被聚类在一起,该属性默认值为20
  source: vectorSource,
});

const clusterStyle = (feature) => {
  const size = feature.get("features").length;
  if (size > 1) {
    return [
      new Style({
        image: outerCircle,
      }),
      new Style({
        image: innerCircle,
        text: new Text({
          text: size.toString(),
          fill: textFill,
          stroke: textStroke,
        }),
      }),
    ];
  }
  const originalFeature = feature.get("features")[0];
  return new Style({
    geometry: originalFeature.getGeometry(),
    image: iconStyle,
  });
};

// 显示聚类和单个要素的图层。
const clusters = new VectorLayer({
  source: clusterSource,
  style: clusterStyle,
});

/**
 * 参考的Leaflet的实现：
 * https://github.com/Leaflet/Leaflet.markercluster/blob/31360f2/src/MarkerCluster.Spiderfier.js#L55-L72
 * 将点围绕聚类中心排列成一个圆圈，并从中心指向每个点的一条线。
 * @param {number} count 聚类成员的数量
 * @param {Array<number>} clusterCenter 聚类的中心坐标
 * @param {number} resolution 当前地图视图的分辨率
 * @return {Array<Array<number>>} 表示聚类成员的坐标数组。
 */
const generatePointsCircle = (count, clusterCenter, resolution) => {
  //计算周长，这里是根据一定规则计算周长，考虑进去点的数量，circleFootSeparation可以认为是点之间的的基准距离
  const circumference =
    circleDistanceMultiplier * circleFootSeparation * (2 + count);
  //计算半径
  let legLength = circumference / (Math.PI * 2);
  //计算角度步长
  const angleStep = (Math.PI * 2) / count;
  const res = [];
  let angle;
  legLength = Math.max(legLength, 35) * resolution; // 到达聚类图标之外的最小距离

  for (let i = 0; i < count; ++i) {
    // 顺时针方向，像螺旋一样。
    angle = circleStartAngle + i * angleStep;
    res.push([
      clusterCenter[0] + legLength * Math.cos(angle),
      clusterCenter[1] + legLength * Math.sin(angle),
    ]);
  }

  return res;
};

/**
 * 该样式用于具有彼此太接近的要素的聚类，在单击时激活。
 * @param {Feature} cluster 具有重叠成员的聚类
 * @param {number} resolution 当前视图的分辨率
 * @return {Array<Style>|null} 用于呈现聚类成员的展开视图的样式。
 */
const clusterCircleStyle = (cluster, resolution) => {
  if (cluster !== clickFeature || resolution !== clickResolution) {
    return null;
  }
  const clusterMembers = cluster.get("features");
  const centerCoordinates = cluster.getGeometry().getCoordinates();
  //reduce的三个参数依次为：累积变量，当前变量，当前变量位置(索引)
  return generatePointsCircle(
    clusterMembers.length,
    cluster.getGeometry().getCoordinates(),
    resolution
  ).reduce((styles, coordinates, i) => {
    const point = new Point(coordinates);
    const line = new LineString([centerCoordinates, coordinates]);
    styles.unshift(
      new Style({
        geometry: line,
        stroke: convexHullStroke,
      })
    );
    styles.push(
      clusterMemberStyle(
        new Feature({
          ...clusterMembers[i].getProperties(),
          geometry: point,
        })
      )
    );
    return styles;
  }, []);
};

// 显示重叠聚类成员的展开视图的图层。
const clusterCircles = new VectorLayer({
  source: clusterSource,
  style: clusterCircleStyle,
});

function mapCreated(map) {
  state.map = map;
  isMapCreated.value = true;
  state.map.addLayer(clusters);
  state.map.addLayer(clusterCircles);

  state.map.getView().fit([73.62, 16.7, 134.77, 53.56], {
    duration: 500,
    // padding: [50, 50, 50, 50],
  });

  state.map.on("click", (event) => {
    clusters.getFeatures(event.pixel).then((features) => {
      if (features.length > 0) {
        const clusterMembers = features[0].get("features");
        if (clusterMembers.length > 1) {
          //计算聚类成员的范围
          const extent = createEmpty();
          clusterMembers.forEach((feature) => {
            extend(extent, feature.getGeometry().getExtent());
          });
          const view = map.getView();
          const resolution = view.getResolution();
          if (
            view.getZoom() === view.getMaxZoom() ||
            (getWidth(extent) < resolution && getHeight(extent) < resolution)
          ) {
            //显示聚类成员的展开视图
            clickFeature = features[0];
            clickResolution = resolution;
            clusterCircles.setStyle(clusterCircleStyle);
          } else {
            // 缩放至聚类成员的范围
            view.fit(extent, { duration: 500, padding: [50, 50, 50, 50] });
          }
        }
      }
    });
  });
}

function mapClick(evt) {
  const feature = state.map.forEachFeatureAtPixel(
    evt.pixel,
    (feature) => feature,
    {
      hitTolerance: 12,
    }
  );
  if (feature) {
    const { features } = feature.getProperties();
    if (features?.length && features.length === 1) {
      const props = features[0].getProperties();
      popupInfo.value = props;
      title.value = props["Name"];
      offset.value = [0, -24];
      position.value = feature.getGeometry().getCoordinates();
    }
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
