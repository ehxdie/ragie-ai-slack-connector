<template>
  <main class="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
    <!-- Chat container with messages -->
    <div class="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
      <div class="container mx-auto max-w-4xl px-4 py-6">
        <ChatsContainer class="space-y-4" />
      </div>
    </div>
    
    <!-- Fixed chat input at bottom -->
    <div class="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
      <div class="container mx-auto max-w-4xl px-4 py-4">
        <ChatBox class="w-full" />
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import ChatsContainer from "./ChatsContainer.vue";
import ChatBox from "./ChatBox.vue";
</script>