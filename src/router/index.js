import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      meta: {
        // #region 已完成
        // title: "一张图",
        // title: "测试百度坐标偏移",
        // title: "添加波纹效果的点要素",
        // #endregion
        title: "高级视图定位",
      },
      // #region 已完成
      // component: () => import("@/views/OneMap.vue"),
      // component: () => import("@/views/TestCoordinateOffset.vue"),
      // component: () => import("@/views/TestPulsingEffect.vue"),
      // #endregion
      component: () => import("@/views/AdvancedViewPositioning.vue"),
    },
  ],
});

router.beforeEach((to, from, next) => {
  if (to.meta.title) {
    document.title = to.meta.title;
  } else {
    document.title = "Openlayers 一张图";
  }

  next();
});

export default router;
