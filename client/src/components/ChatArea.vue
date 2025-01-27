<template>
  <div class="h-screen flex flex-col">
    <div class="flex-grow overflow-auto">
      <ChatsContainer />
    </div>
    <ChatBox />
  </div>
</template>

<script setup lang="ts">
import ChatsContainer from "./ChatsContainer.vue";
import ChatBox from "./ChatBox.vue";
</script>
