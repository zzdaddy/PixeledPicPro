const home = [
  {
    path: "/home",
    name: "Home",
    component: () => import("~/pages/home/index.vue"),
    meta: {
      title: "Home",
    },
  },
  {
    path: "/hero",
    name: "Hero",
    component: () => import("~/pages/home/components/Hero.vue"),
  },
  {
    path: "/factory",
    name: "Factory",
    component: () => import("~/pages/home/components/Factory.vue"),
  },
];

export default home;
