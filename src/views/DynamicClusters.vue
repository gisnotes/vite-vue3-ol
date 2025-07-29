<template>
  <div class="oneMap">
    <TdtMap @mapCreated="mapCreated" />
  </div>
</template>

<script setup>
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

let map, hoverFeature, clickFeature, clickResolution;

const circleDistanceMultiplier = 1; //圆形距离倍数
const circleFootSeparation = 28; //圆脚间距
const circleStartAngle = Math.PI / 2; //圆开始角度

// 凸包样式
const convexHullFill = new Fill({
  color: "rgba(255, 153, 0, 0.4)",
});
const convexHullStroke = new Stroke({
  color: "rgba(204, 85, 0, 1)",
  width: 1.5,
});

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
const darkIcon = new Icon({
  src: "data/icons/emoticon-cool.svg",
});
const lightIcon = new Icon({
  src: "data/icons/emoticon-cool-outline.svg",
});

const vectorSource = new VectorSource({
  format: new GeoJSON(),
  url: "data/geojson/photovoltaic.json",
});

const clusterSource = new Cluster({
  attributions:
    'Data: <a href="https://www.data.gv.at/auftritte/?organisation=stadt-wien">Stadt Wien</a>',
  distance: 35, //35像素距离范围内的要素将被聚类在一起,该属性默认值为20
  source: vectorSource,
});

/**
 * 聚类的凸包样式，在鼠标悬停时激活
 * @param {Feature} cluster 聚类要素
 * @return {Style|null} 聚类凸包的 Polygon 样式。
 */
const clusterHullStyle = (cluster) => {
  // console.log("🚀 ~ :82 ~ cluster:", cluster)
  if (cluster !== hoverFeature) {
    return null;
  }
  const originalFeatures = cluster.get("features");
  const points = originalFeatures.map((feature) =>
    feature.getGeometry().getCoordinates()
  );
  return new Style({
    geometry: new Polygon([monotoneChainConvexHull(points)]),
    fill: convexHullFill,
    stroke: convexHullStroke,
  });
};

// 显示鼠标悬停时，聚类的凸包的图层。
const clusterHulls = new VectorLayer({
  source: clusterSource,
  style: clusterHullStyle,
});

// ------------------聚类要素样式
const clusterMemberStyle = (clusterMember) => {
  return new Style({
    geometry: clusterMember.getGeometry(),
    //LEISTUNG:该属性字段为功率的意思，就是功率大于5为深色图标，否则为浅色图标
    image: clusterMember.get("LEISTUNG") > 5 ? darkIcon : lightIcon,
  });
};

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
  return clusterMemberStyle(originalFeature);
};

// 显示聚类和单个要素的图层。
const clusters = new VectorLayer({
  source: clusterSource,
  style: clusterStyle,
});

// ----------------------------
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

function mapCreated(m) {
  map = m;

  initMap();
  initMapEvt();
}

function initMap() {
  map.setView(
    new View({
      center: [0, 0],
      zoom: 2,
      maxZoom: 19,
      // extent: [
      //   ...fromLonLat([16.1793, 48.1124]),
      //   ...fromLonLat([16.5559, 48.313]),
      // ],
      showFullExtent: true,
    })
  );
  map.addLayer(clusterHulls);
  map.addLayer(clusters);
  map.addLayer(clusterCircles);
}

function initMapEvt() {
  map.on("pointermove", (event) => {
    clusters.getFeatures(event.pixel).then((features) => {
      if (features[0] !== hoverFeature) {
        //鼠标悬停(聚类)时显示凸包。
        hoverFeature = features[0];
        clusterHulls.setStyle(clusterHullStyle);
        // 更改鼠标光标样式以指示聚类可单击。
        map.getTargetElement().style.cursor =
          hoverFeature && hoverFeature.get("features").length > 1
            ? "pointer"
            : "";
      }
    });
  });

  map.on("click", (event) => {
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
</script>

<style lang="scss" scoped>
.oneMap {
  position: relative;
  height: 100%;
  overflow: hidden;
}
</style>
