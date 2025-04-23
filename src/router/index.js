import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      meta: {
        title: "利用三方库纠偏百度坐标测试",
      },
      // #region 已完成
      // component: () => import("../views/OneMap.vue"),
      // #endregion
      component: () => import("../views/TestCoordinateOffset.vue"),
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
