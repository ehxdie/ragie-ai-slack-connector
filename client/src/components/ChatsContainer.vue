<template>
  <div 
    ref="chatsContainer" 
    class="flex flex-col space-y-4 py-4 px-2"
  >
    <TransitionGroup 
      name="message"
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 transform -translate-y-4"
      enter-to-class="opacity-100 transform translate-y-0"
    >
      <Message
        v-for="(chat, index) in CHATS"
        :key="index"
        :content="chat.content"
        :role="chat.role"
        class="message-item"
      />
    </TransitionGroup>

    <!-- Scroll to bottom button -->
    <button
      v-show="showScrollButton"
      @click="scrollToBottom"
      class="fixed bottom-24 right-8 bg-blue-500 hover:bg-blue-600 text-white 
             rounded-full p-3 shadow-lg transition-all duration-200 
             opacity-90 hover:opacity-100"
      aria-label="Scroll to bottom"
    >
      ↓
    </button>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, nextTick, onUnmounted } from "vue";
import Message from "./Message.vue";
import { CHATS } from "@/stores/chat";

const chatsContainer = ref<HTMLElement | null>(null);
const showScrollButton = ref(false);

// Scroll to bottom when new messages are added
watch(() => CHATS.value.length, async () => {
  await nextTick();
  scrollToBottom();
});

// Handle scroll behavior
function handleScroll() {
  if (!chatsContainer.value) return;
  
  const { scrollTop, scrollHeight, clientHeight } = chatsContainer.value;
  const scrolledToBottom = scrollHeight - scrollTop - clientHeight < 100;
  
  showScrollButton.value = !scrolledToBottom;
}

function scrollToBottom() {
  if (!chatsContainer.value) return;
  
  chatsContainer.value.scrollTo({
    top: chatsContainer.value.scrollHeight,
    behavior: 'smooth'
  });
}

// Setup scroll handling and initial scroll
onMounted(() => {
  if (!chatsContainer.value) return;
  
  // Add scroll event listener
  chatsContainer.value.addEventListener('scroll', handleScroll);
  
  // Initial scroll to bottom
  scrollToBottom();
});

// Clean up event listener
onUnmounted(() => {
  if (!chatsContainer.value) return;
  chatsContainer.value.removeEventListener('scroll', handleScroll);
});
</script>

<style scoped>
.message-item {
  max-width: 85%;
  margin-left: auto;
  margin-right: auto;
  width: 100%;
}

/* Optional: Add different widths for user/assistant messages */
.message-item[data-role="user"] {
  margin-left: auto;
  max-width: 75%;
}

.message-item[data-role="assistant"] {
  margin-right: auto;
  max-width: 75%;
}
</style>