import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "Openlayers一张图",
      component: () => import("../views/OneMap.vue"),
    },
  ],
});

export default router;
