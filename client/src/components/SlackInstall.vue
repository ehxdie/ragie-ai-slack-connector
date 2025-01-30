<template>
  <div class="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 w-full">
    <div 
      class="max-w-lg w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 space-y-6 animate-fade-in"
      :class="{ 'animate-pulse': isLoading }"
    >
      <!-- Logo/Icon (optional) -->
      <div class="flex justify-center mb-6">
        <img
          src="../assets/pUt_KSgB_400x400.png"
          alt="Ragie AI Logo"
          class="w-16 h-16"
        />
      </div>

      <!-- Title and Description -->
      <div class="text-center space-y-4">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome to Ragie AI Slack Conversations
        </h1>
        <p class="text-gray-600 dark:text-gray-300 text-lg">
          Connect your Slack workspace to get started with our AI-powered chat assistant.
        </p>
      </div>

      <!-- Loom Video Embed -->
      <div class="relative w-full" style="padding-bottom: 56.25%;">
        <iframe 
          src="https://www.loom.com/embed/74911670cb3d4112ae71cdf2aef20436?sid=fbcb6df6-ee3a-4d62-8a2c-6cb8e1830456" 
          frameborder="0" 
          allowfullscreen 
          class="absolute top-0 left-0 w-full h-full rounded-lg"
        ></iframe>
      </div>

      <!-- Installation Button -->
      <div class="flex flex-col items-center space-y-4">
        <a
          href="https://slack.com/oauth/v2/authorize?scope=channels:history,channels:read,groups:history,groups:read,im:history,im:read&redirect_uri=https://ragie-ai-slack-connector-9yhn.onrender.com/api/slack/install&client_id=7845719592723.8080143556001"
          class="w-full max-w-md flex items-center justify-center gap-2 px-6 py-3 
                 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg
                 transition-all duration-200 transform hover:scale-[1.02]
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="isLoading"
        >
          <svg v-if="isLoading" class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          <span>Install Slack App</span>
        </a>

        <!-- Features List -->
        <div class="mt-8 grid grid-cols-1 gap-4 text-left w-full max-w-md">
          <div class="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            <span>Access AI assistance directly in Slack</span>
          </div>
          <div class="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            <span>Seamless channel integration</span>
          </div>
          <div class="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            <span>Secure and private communications</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const isLoading = ref(false); // Ensure isLoading is properly declared

onMounted(async () => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token") || localStorage.getItem("ragie_token");

    if (token) {
      isLoading.value = true;
      localStorage.setItem("ragie_token", token);

      // Add a small delay to show loading state
      await new Promise((resolve) => setTimeout(resolve, 500));

      router.push("/chat");
    }
  } catch (error) {
    console.error("Error during authentication:", error);
    isLoading.value = false;
  }
});
</script>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.5s ease-out;
}
</style>
