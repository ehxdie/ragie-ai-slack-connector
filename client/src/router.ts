import { createRouter, createWebHistory } from "vue-router";
import SlackInstall from "@/components/SlackInstall.vue";
import ChatArea from "@/components/ChatArea.vue";

const routes = [
    {
        path: "/",
        name: "SlackInstall",
        component: SlackInstall,
    },
    {
        path: "/chat",
        name: "ChatArea",
        component: ChatArea,
        meta: { requiresAuth: true }, // Mark this route as requiring authentication
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

// Navigation Guard: Redirect to "/" if no token is found
router.beforeEach((to, _from,next) => {
    const token = localStorage.getItem("ragie_token");

    if (to.meta.requiresAuth && !token) {
        next("/"); // Redirect to Slack install page
    } else {
        next(); // Continue to the route
    }
});

export default router;
