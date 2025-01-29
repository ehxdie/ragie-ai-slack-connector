<template>
  <div class="flex gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
    <form @submit.prevent="sendChats" class="flex-1 flex items-center">
      <div class="flex-1 relative">
        <input
          v-model="message"
          type="text"
          class="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 
                 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                 placeholder-gray-400 dark:placeholder-gray-500
                 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400
                 transition-colors duration-200"
          placeholder="Type your message..."
          :disabled="isLoading"
        />
      </div>

      <div class="flex items-center gap-3 ml-3">
        <a
          href="https://slack.com/oauth/v2/authorize?scope=channels:history,channels:read,groups:history,groups:read,im:history,im:read&redirect_uri=https://ragie-ai-slack-connector-9yhn.onrender.com/api/slack/install&client_id=7845719592723.8080143556001"
          class="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600
                 text-gray-700 dark:text-gray-200 rounded-lg transition-colors duration-200
                 flex items-center gap-2"
        >
          <span class="hidden sm:inline">Connect to</span> Slack
        </a>

        <button
          type="submit"
          class="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700
                 text-white rounded-lg transition-colors duration-200 flex items-center
                 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="!message.trim() || isLoading"
        >
          <span v-if="isLoading" class="animate-spin mr-2">↻</span>
          <span v-else>➤</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { sendAllMessages } from "@/service";
import { CHATS } from "@/stores/chat";

const message = ref("");
const isLoading = ref(false);

async function sendChats() {
  if (!message.value.trim() || isLoading.value) return;

  try {
    isLoading.value = true;
    
    const userMessage = {
      role: "user",
      content: message.value.trim(),
    };
    CHATS.value.push(userMessage);

    const chatGPTMessage = await sendAllMessages(CHATS.value);

    if (chatGPTMessage) {
      CHATS.value.push(chatGPTMessage);
    } else {
      throw new Error("Failed to get a response from ChatGPT");
    }

    message.value = ""; // Clear input after sending
  } catch (error) {
    console.error(error);
    // You might want to add error handling UI here
  } finally {
    isLoading.value = false;
  }
}
</script>