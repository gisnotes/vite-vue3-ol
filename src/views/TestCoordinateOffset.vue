<template>
  <div class="wrap">
    <div class="bd" ref="bdDivRef"></div>
    <div class="divider"></div>
    <div class="tdt">
      <TdtMap @mapCreated="mapCreated" />
    </div>
    <!-- 下拉框 -->
    <el-select
      class="select"
      v-model="id"
      placeholder="空"
      @change="handleSelectChange">
      <el-option
        v-for="item in options"
        :key="item.id"
        :label="item.label"
        :value="item.id" />
    </el-select>
  </div>
</template>

<script setup>
import { AddLocation } from "@/utils/utils.js";
import coordtransform from "coordtransform";
import gcoord from "gcoord";

//#region --------------------- 定义变量----------------
const bdDivRef = ref();

let bdMap, bdMarker;

let tdtMap, addLocationInstance;

const id = ref("1");
const center = ref([116.404, 39.915]);

/**
 * 下列坐标利用百度拾取坐标系统拾取的坐标。
 * 访问地址：https://api.map.baidu.com/lbsapi/getpoint/
 */
const options = [
  { id: "1", label: "北京天安门", value: [116.404, 39.915] },
  {
    id: "2",
    label: "哈尔滨太阳岛国家湿地公园",
    value: [126.544486, 45.801535],
  },
  { id: "3", label: "长春市南湖公园", value: [125.314365, 43.862527] },
  { id: "4", label: "辽宁市图书馆", value: [123.458123, 41.684045] },
  { id: "5", label: "天津水上公园", value: [117.172877, 39.093623] },
  { id: "6", label: "呼和浩特成吉思汗公园", value: [111.717666, 40.865822] },
  { id: "7", label: "乌鲁木齐市政府", value: [87.623272, 43.831565] },
  { id: "8", label: "银川市宝湖公园", value: [106.260271, 38.457067] },
  { id: "9", label: "西宁市体育公园", value: [101.750095, 36.665025] },
  { id: "10", label: "兰州站", value: [103.856768, 36.039997] },
  { id: "11", label: "西安世博园", value: [109.06461, 34.32843] },
  { id: "12", label: "拉萨滨河公园", value: [91.107169, 29.651013] },
  { id: "13", label: "成都东湖公园", value: [104.094448, 30.622388] },
  { id: "14", label: "重庆园博园", value: [106.55815, 29.687418] },
  { id: "15", label: "贵阳首开紫郡", value: [106.772919, 26.548091] },
  { id: "16", label: "昆明小白龙森林公园", value: [103.100742, 24.939493] },
  { id: "17", label: "太原晋阳湖公园", value: [112.51414, 37.772326] },
  { id: "18", label: "石家庄西三教", value: [114.483763, 38.023109] },
  { id: "19", label: "济南趵突泉", value: [117.022339, 36.665586] },
  { id: "20", label: "郑州市人民公园", value: [113.669142, 34.768246] },
  { id: "21", label: "合肥天鹅湖体育公园", value: [117.231429, 31.817742] },
  { id: "22", label: "南京八卦洲", value: [118.798802, 32.157515] },
  { id: "23", label: "上海长风公园", value: [121.406232, 31.231112] },
  { id: "24", label: "武汉梦泽湖公园", value: [114.249998, 30.597099] },
  { id: "25", label: "长沙秀峰山公园", value: [112.983558, 28.296357] },
  { id: "26", label: "南昌青山湖风景区", value: [115.942486, 28.706438] },
  { id: "27", label: "杭州东站", value: [120.219175, 30.29681] },
  { id: "28", label: "福州晋安公园", value: [119.352338, 26.097562] },
  { id: "29", label: "台北南港展览馆站", value: [121.628112, 25.05792] },
  { id: "30", label: "南宁金湖广场", value: [108.376787, 22.819808] },
  { id: "31", label: "海口恒大旅游城", value: [110.350014, 19.963868] },
  { id: "32", label: "广州越秀公园", value: [113.272148, 23.146901] },
  { id: "33", label: "香港山顶公园", value: [114.155718, 22.277579] },
  { id: "34", label: "澳门国际机场", value: [113.588002,22.16052] },
];
//#endregion

//#region ----------------入口函数----------------
function mapCreated(map) {
  tdtMap = map;
  createBdMap();
  addLocationInstance = new AddLocation(tdtMap);
  addTdtMarker(center.value);
}
//#endregion

//#region --------------------- 方法区域----------------
function createBdMap() {
  bdMap = new BMapGL.Map(bdDivRef.value);
  bdMap.enableScrollWheelZoom(true);

  addBdMarker(center.value);
}

function handleSelectChange(id) {
  center.value = options.find((item) => item.id === id).value;
  addBdMarker(center.value);
  addTdtMarker(center.value);
}

function addTdtMarker(lngLat) {
  if (addLocationInstance) {
    addLocationInstance.clear();
  }

  tdtMap.getView().animate({ zoom: 14.4 });
  //添加百度坐标点标记
  addLocationInstance.add(lngLat, "百度坐标");

  //添加第三方API转换的坐标的点标记
  const wgs84LngLat = convertBdToWgs84(lngLat);
  addLocationInstance.add(wgs84LngLat, "纠偏后的百度坐标", true);
}

function addBdMarker(lngLat) {
  if (bdMarker) {
    bdMap.clearOverlays();
  }
  const point = new BMapGL.Point(...lngLat);
  bdMap.centerAndZoom(point, 15);
  bdMarker = new BMapGL.Marker(new BMapGL.Point(...lngLat));
  bdMap.addOverlay(bdMarker);
}

// function convertBdToWgs84(lngLat) {
//   const gcj02LngLat = coordtransform.bd09togcj02(...lngLat);
//   return coordtransform.gcj02towgs84(...gcj02LngLat);
// }

function convertBdToWgs84(lngLat) {
  return gcoord.transform(lngLat, gcoord.BD09, gcoord.WGS84);
}
//#endregion
</script>

<style lang="scss" scoped>
.wrap {
  height: 100%;
  display: flex;
  overflow: hidden;

  .divider {
    height: 100%;
    border-right: 2px solid red;
  }

  .bd,
  .tdt {
    height: 100%;
    width: calc(50% - 1px);
  }

  .select {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 270px;
  }
}
</style>
