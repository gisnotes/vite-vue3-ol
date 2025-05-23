import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      meta: {
        title: "添加波纹效果的点要素",
      },
      // #region 已完成
      // component: () => import("../views/OneMap.vue"),
      // component: () => import("../views/TestCoordinateOffset.vue"),
      // #endregion
      component: () => import("../views/TestPulsingEffect.vue"),
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
