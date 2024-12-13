<!-- ChatBOX.vue -->
<template>
  <div class="flex gap-1">
    <div class="flex-1 relative border-2 border-gray-300 p-3 rounded-lg flex">
      <input
        v-model="message"
        type="text"
        class="w-full outline-none"
        placeholder="Message ChatGPT..."
      />
      <div class="flex gap-2">
        <a href="https://slack.com/oauth/v2/authorize?scope=channels%3Ahistory%2Cchannels%3Aread%2Cgroups%3Ahistory%2Cgroups%3Aread%2Cim%3Ahistory%2Cim%3Aread&amp;user_scope=channels%3Ahistory%2Cchannels%3Aread%2Cgroups%3Ahistory%2Cgroups%3Aread%2Cim%3Ahistory%2Cim%3Aread&amp;redirect_uri=https%3A%2F%2Fragie-ai-slack-connector-9yhn.onrender.com%2Fapi%2Fslack%2Finstall&amp;client_id=7845719592723.8080143556001" style="align-items:center;color:#000;background-color:#fff;border:1px solid #ddd;border-radius:4px;display:inline-flex;font-family:Lato, sans-serif;font-size:14px;font-weight:600;height:36px;justify-content:center;text-decoration:none;width:36px"><svg xmlns="http://www.w3.org/2000/svg" style="height:18px;width:18px;margin-right:0" viewBox="0 0 122.8 122.8"><path d="M25.8 77.6c0 7.1-5.8 12.9-12.9 12.9S0 84.7 0 77.6s5.8-12.9 12.9-12.9h12.9v12.9zm6.5 0c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9v32.3c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V77.6z" fill="#e01e5a"></path><path d="M45.2 25.8c-7.1 0-12.9-5.8-12.9-12.9S38.1 0 45.2 0s12.9 5.8 12.9 12.9v12.9H45.2zm0 6.5c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H12.9C5.8 58.1 0 52.3 0 45.2s5.8-12.9 12.9-12.9h32.3z" fill="#36c5f0"></path><path d="M97 45.2c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9-5.8 12.9-12.9 12.9H97V45.2zm-6.5 0c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V12.9C64.7 5.8 70.5 0 77.6 0s12.9 5.8 12.9 12.9v32.3z" fill="#2eb67d"></path><path d="M77.6 97c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9-12.9-5.8-12.9-12.9V97h12.9zm0-6.5c-7.1 0-12.9-5.8-12.9-12.9s5.8-12.9 12.9-12.9h32.3c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H77.6z" fill="#ecb22e"></path></svg></a>
        <button @click="sendChats">➤</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { sendAllMessages } from "@/service";
import { CHATS } from "@/stores/chat";
import { useSpeechRecognition } from "@vueuse/core";

const message = ref("");
const isUserVoiceEnabled = ref(false);

const { isListening, result, start, stop, isSupported } = useSpeechRecognition({
  lang: "en-US",
  continuous: false,
});

if (isSupported.value) {
  watch(result, (value) => {
    if (isUserVoiceEnabled.value) {
      message.value = value;
    }
  });
}

watch(isListening, (value) => {
  if (!value && isUserVoiceEnabled.value) {
    start();
  }
});

watch(isUserVoiceEnabled, (value) => {
  if (value) {
    start();
  } else {
    stop();
  }
});

async function sendChats() {
  const userMessage = {
    role: "user",
    content: message.value,
  };
  CHATS.value.push(userMessage);

  let chatGPTMessage = await sendAllMessages(CHATS.value);
  CHATS.value.push(chatGPTMessage);
}
</script>
