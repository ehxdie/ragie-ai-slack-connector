<template>
  <div class="flex gap-1 p-3 border-t">
    <div class="flex-1 relative border-2 border-gray-300 p-3 rounded-lg flex">
      <input
        v-model="message"
        type="text"
        class="w-full outline-none"
        placeholder="Message ChatGPT..."
      />
      <div class="flex gap-2">
        <a
          href="https://slack.com/oauth/v2/authorize?scope=channels:history,channels:read,groups:history,groups:read,im:history,im:read&redirect_uri=https://ragie-ai-slack-connector-9yhn.onrender.com/api/slack/install&client_id=7845719592723.8080143556001"
          class="px-4 py-2 bg-gray-100 rounded-md"
        >
          Slack
        </a>
        <button @click="sendChats" class="px-4 py-2 bg-blue-500 text-white rounded-md">
          ➤
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { sendAllMessages } from "@/service";
import { CHATS } from "@/stores/chat";

const message = ref("");

async function sendChats() {
  const userMessage = {
    role: "user",
    content: message.value,
  };
  CHATS.value.push(userMessage);

  const chatGPTMessage = await sendAllMessages(CHATS.value);

  if (chatGPTMessage) {
    CHATS.value.push(chatGPTMessage);
  } else {
    console.error("Failed to get a response from ChatGPT");
  }

  message.value = ""; // Clear input after sending
}
</script>
