import Overlay from "ol/Overlay.js";
import { getDistance } from "ol/sphere.js";

export default class PulsingPoint {
  constructor(map, options = {}) {
    this.map_ = map;
    this.options_ = options;
  }

  add(position, properties) {
    this.overlay_ = new Overlay({
      element: createElement(),
      position,
      positioning: "center-center", // 以圆心为中心点
      autoPan: false, // 防止地图自动平移
      stopEvent: false,
    });
    this.overlay_.setProperties({
      ...properties,
    });
    this.map_.addOverlay(this.overlay_);
  }

  /**
   * 获取和点击地图的坐标位置最近的overlay对象
   * @param {Array} clickCoor
   * @returns {Overlay | null}
   */
  findNearestOverlay(clickCoor, minDistance = Infinity) {
    const collection = this.map_.getOverlays();
    if (!collection?.getLength()) return null;

    let res = null;

    collection
      .getArray()
      .filter(
        (item) =>
          item.getProperties().name &&
          item.getProperties().name.includes("pulsing")
      )
      .forEach((c) => {
        const props = c.getProperties();
        const dist = getDistance(clickCoor, props.position);
        // console.log("🚀 | dist:", dist);
        if (dist <= minDistance) {
          if (minDistance === Infinity) {
            minDistance = dist;
          }
          res = c;
        }
      });

    return res;
  }

  clear() {
    const collection = this.map_.getOverlays();
    if (collection.getLength()) {
      collection.forEach((o) => {
        if (Object.keys(o.getProperties()).includes("imgX"))
          this.map_.removeOverlay(o);
      });
    }
  }
}

function createElement() {
  const pulsingDiv = document.createElement("div");
  pulsingDiv.className = "my_pulsing";
  pulsingDiv.style.transform = "translate(-50%, -50%)";
  return pulsingDiv;
}
