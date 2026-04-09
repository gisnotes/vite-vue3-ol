<template>
  <div class="draw-line-with-webgl">
    <TdtMap @mapCreated="mapCreated" />
    <div class="panel">
      <el-form :model="form" label-suffix=":" label-width="auto">
        <el-form-item label="线宽(px)">
          <el-slider v-model="form.width" :min="1" :max="40" />
        </el-form-item>
        <el-form-item label="线偏移量(px)">
          <el-slider v-model="form.offset" :min="-40" :max="40" />
        </el-form-item>
        <el-form-item label="端点样式">
          <el-radio-group v-model="form.capType">
            <el-radio :value="'butt'">平头(butt)</el-radio>
            <el-radio :value="'round'">圆头(round)</el-radio>
            <el-radio :value="'square'">方头(square)</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="连接点(拐角)样式">
          <el-radio-group v-model="form.joinType">
            <el-radio :value="'miter'">尖角(miter)</el-radio>
            <el-radio :value="'round'">圆角(round)</el-radio>
            <el-radio :value="'bevel'">平角(bevel)</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="(拐角)尖角限制(比例)">
          <el-slider
            :disabled="form.joinType !== 'miter'"
            v-model="form.miterLimit"
            :min="1"
            :max="20"
            :step="0.1" />
        </el-form-item>
        <el-form-item label="启用虚线">
          <el-switch v-model="form.dashEnabled" />
        </el-form-item>
        <el-form-item label="虚线分段样式(px)">
          <el-input-number
            v-model="form.dashLength1"
            :min="0"
            :max="100"
            :controls="false"
            :disabled="!form.dashEnabled"
            controls-position="right" />
          <el-input-number
            v-model="form.dashLength2"
            :min="0"
            :max="100"
            :controls="false"
            :disabled="!form.dashEnabled"
            controls-position="right" />
          <el-input-number
            v-model="form.dashLength3"
            :min="0"
            :max="100"
            :controls="false"
            :disabled="!form.dashEnabled"
            controls-position="right" />
          <el-input-number
            v-model="form.dashLength4"
            :min="0"
            :max="100"
            :controls="false"
            :disabled="!form.dashEnabled"
            controls-position="right" />
        </el-form-item>
        <el-form-item label="虚线偏移量(px)">
          <el-slider
            v-model="form.dashOffset"
            :min="-200"
            :max="200"
            :disabled="!form.dashEnabled" />
        </el-form-item>
        <el-form-item label="启用图案">
          <el-switch v-model="form.patternEnabled" />
        </el-form-item>
        <el-form-item label="图案间距(px)">
          <el-slider
            v-model="form.patternSpacing"
            :min="0"
            :max="64"
            :disabled="!form.patternEnabled" />
        </el-form-item>
        <el-form-item label="图案起始偏移量(px)">
          <el-slider
            v-model="form.patternOffset"
            :min="0"
            :max="64"
            :disabled="!form.patternEnabled" />
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import Map from "ol/Map.js";
import View from "ol/View.js";
import GeoJSON from "ol/format/GeoJSON.js";
import Draw from "ol/interaction/Draw.js";
import Modify from "ol/interaction/Modify.js";
import Snap from "ol/interaction/Snap.js";
import TileLayer from "ol/layer/Tile.js";
import WebGLVectorLayer from "ol/layer/WebGLVector.js";
import { fromLonLat } from "ol/proj.js";
import OSM from "ol/source/OSM.js";
import VectorSource from "ol/source/Vector.js";

const state = shallowReactive({
  map: null,
  mapCreated: false,
});

const form = reactive({
  width: 12,
  offset: 0,
  capType: "butt",
  joinType: "miter",
  miterLimit: 10,
  dashEnabled: false,
  dashLength1: 25,
  dashLength2: 15,
  dashLength3: 15,
  dashLength4: 15,
  dashOffset: 0,
  patternEnable: false,
  patternSpacing: 0,
  patternOffset: 0,
});

const source = new VectorSource({
  url: "/data/geojson/switzerland.geojson",
  format: new GeoJSON(),
});

/**
 * @param {boolean} dash Include line dash
 * @param {boolean} pattern Include image pattern
 * @return {import('ol/style/flat.js').FlatStyle} Generated style
 */
const getStyle = (dash, pattern) => {
  let newStyle = {
    "stroke-width": ["var", "width"],
    "stroke-color": "rgba(24,86,34,0.7)",
    "stroke-offset": ["var", "offset"],
    "stroke-miter-limit": ["var", "miterLimit"],
    "stroke-line-cap": ["var", "capType"],
    "stroke-line-join": ["var", "joinType"],
  };
  if (form.dashEnabled) {
    newStyle = {
      ...newStyle,
      "stroke-line-dash": [
        ["var", "dashLength1"],
        ["var", "dashLength2"],
        ["var", "dashLength3"],
        ["var", "dashLength4"],
      ],
      "stroke-line-dash-offset": ["var", "dashOffset"],
    };
  }
  if (form.patternEnabled) {
    delete newStyle["stroke-color"];
    newStyle = {
      ...newStyle,
      "stroke-pattern-src": "/data/dot.svg",
      "stroke-pattern-spacing": ["var", "patternSpacing"],
      "stroke-pattern-start-offset": ["var", "patternOffset"],
    };
  }
  return newStyle;
};

let style = getStyle(false, false);

let vector = new WebGLVectorLayer({
  source,
  style,
  variables: { ...form },
});

function mapCreated(map) {
  state.map = map;
  state.mapCreated = true;
}
</script>

<style lang="scss" scoped>
.draw-line-with-webgl {
  height: 100%;
  position: relative;

  .panel {
    position: absolute;
    top: 8px;
    left: 8px;
    background-color: rgba(255, 255, 255, 0.85);
    width: 420px;
    padding: 5px;
    z-index: 2;
    border-radius: 4px;
    box-shadow: 3px 0 16px 0 rgba(0, 0, 0, 0.08);
  }
}

:deep(.el-radio) {
  margin-right: 5px;
}

//滑块右侧的输入框的长度
:deep(.el-input-number) {
  width: 60px;
  margin-right: 5px;
}
</style>
