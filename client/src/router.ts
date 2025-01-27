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
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;
