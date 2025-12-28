<script setup lang="ts">
import { RouterView } from 'vue-router'
import { onMounted } from 'vue';
import { useAppStore } from '@/stores/app';
import { ScrollArea, ScrollBar } from './components/ui/scroll-area';
import { Toaster } from './components/ui/sonner';

onMounted(() => {
  useAppStore().initTheme();
});
</script>

<template>
  <ScrollArea class="h-screen">
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
    <ScrollBar class="z-50" />
  </ScrollArea>
  <Toaster />
</template>
