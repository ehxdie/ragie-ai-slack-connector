<template>
  <div 
    :class="[
      'flex gap-3 p-4 rounded-lg transition-colors',
      isUser ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-50 dark:bg-gray-800/50'
    ]"
    :data-role="role"
  >
    <!-- Avatar -->
    <div class="flex-shrink-0 mt-1">
      <div 
        v-if="isUser" 
        class="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center"
        aria-label="User Avatar"
      >
        <span class="text-sm">👤</span>
      </div>
      <img
        v-else
        src="../assets/chatgpt.svg"
        alt="Assistant Avatar"
        class="w-8 h-8"
      />
    </div>

    <!-- Message Content -->
    <div class="flex-1 min-w-0">
      <!-- Name -->
      <div 
        :class="[
          'font-medium mb-1',
          isUser ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
        ]"
      >
        {{ isUser ? 'You' : 'Ragie' }}
      </div>

      <!-- Message Text -->
      <div 
        class="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-200"
        v-html="renderedContent"
      />

      <!-- Timestamp (optional) -->
      <div 
        v-if="timestamp" 
        class="mt-2 text-xs text-gray-500 dark:text-gray-400"
      >
        {{ formatTimestamp(timestamp) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Marked } from 'marked';
import DOMPurify from 'dompurify';

interface MessageProps {
  content: string;
  role: string;
  timestamp?: Date;
}

const props = withDefaults(defineProps<MessageProps>(), {
  timestamp: undefined
});

const isUser = computed(() => props.role === "user");
const renderedContent = ref('');

// Initialize marked instance
const marked = new Marked({
  breaks: true,
  gfm: true
});

// Watch for content changes and render markdown
watch(
  () => props.content,
  async (newContent) => {
    const rawHtml = await marked.parse(newContent);
    renderedContent.value = DOMPurify.sanitize(rawHtml);
  },
  { immediate: true }
);

// Format timestamp (if provided)
function formatTimestamp(date: Date): string {
  return new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  }).format(date);
}
</script>

<style scoped>
/* Ensure code blocks are properly styled */
:deep(pre) {
  @apply bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto;
}

:deep(code) {
  @apply font-mono text-sm;
}

/* Style links */
:deep(a) {
  @apply text-blue-600 dark:text-blue-400 hover:underline;
}

/* Style lists */
:deep(ul), :deep(ol) {
  @apply pl-4 mb-4;
}

:deep(li) {
  @apply mb-2;
}

/* Add spacing for paragraphs */
:deep(p) {
  @apply mb-4 last:mb-0;
}

/* Style blockquotes */
:deep(blockquote) {
  @apply border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic;
}
</style>