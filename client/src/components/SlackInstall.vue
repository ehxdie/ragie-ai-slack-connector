<template>
  <div class="flex justify-center items-center h-screen">
    <div class="text-center">
      <h1 class="text-2xl font-bold mb-4">Welcome to the Slack Integration Chat Application</h1>
      <p class="mb-6">Click the button below to install the Slack app.</p>
      <a
        href="https://slack.com/oauth/v2/authorize?scope=channels:history,channels:read,groups:history,groups:read,im:history,im:read&redirect_uri=https://ragie-ai-slack-connector-9yhn.onrender.com/api/slack/install&client_id=7845719592723.8080143556001"
        class="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
      >
        Install Slack App
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

// Check if the token is already available in the URL or localStorage
onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token') || localStorage.getItem('ragie_token');

  // If the token is found, store it and redirect to the chat page
  if (token) {
    localStorage.setItem('ragie_token', token);
    router.push("/chat");
  }
});
</script>
