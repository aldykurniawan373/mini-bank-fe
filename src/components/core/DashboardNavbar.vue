<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import GlobalSearchPopover from '@/components/core/GlobalSearchPopover.vue';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Breadcrumb from '@/components/ui/Breadcrumb.vue';
import {
  LogOut,
  User,
  Bell,
  Sun,
  MoonStar,
  Menu,
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const appStore = useAppStore();
const authStore = useAuthStore();

const toggleMode = () => {
  appStore.toggleTheme();
};

const handleLogout = async () => {
  await authStore.logout();
};

const handleProfile = () => {
  router.push('/dashboard/profile');
};

// Computed for user display
const userName = computed(() => authStore.user?.name || 'User');
const userEmail = computed(() => authStore.user?.email || '');
</script>

<template>
  <nav class="flex items-center justify-between h-[64px] border-b-[1px] px-4 fixed z-40 top-0 bg-background/80 backdrop-blur-lg border-b border-border" :style="{ width: appStore.navWidth }">
    <div class="w-24 hidden lg:block">
      <Breadcrumb />
    </div>
    <div class="w-2/5 hidden lg:block">
      <GlobalSearchPopover />
    </div>
    <Button
      variant="outline"
      class="p-[6px] w-8 h-8 transition-all duration-200 block lg:hidden"
      :class="appStore.sidebarExpanded ? 'bg-transparent' : 'dark:bg-white'"
      @click="appStore.toggleSidebar()"
    >
      <Menu class="transition-all duration-500 text-black" />
    </Button>
    <div class="flex items-center">
      <Button variant="outline" class="border-0 p-[6px] w-8 h-8">
        <Bell />
      </Button>
      <Button variant="outline" class="border-0 p-[6px] ml-2 w-8 h-8" @click="toggleMode">
        <Sun v-if="appStore.isDark" />
        <MoonStar v-else />
      </Button>
      <div class="border-x-[1px] border-gray-300 h-[24px] w-[1px] mx-2"></div>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="outline" class="border-0 flex items-center max-w-[200px] w-full justify-start">
            <Avatar class="h-8 w-8">
              <AvatarImage :src="`https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random`" />
            </Avatar>
            <span class="ml-2 hidden md:flex justify-start flex-col items-start">
              <p class="mb-0">{{ userName }}</p>
              <small class="text-xs text-slate-400 font-light">{{ userEmail }}</small>
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent class="w-56 relative mr-4">
          <DropdownMenuLabel>{{ userName }}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem @click="handleProfile">
            <User class="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem @click="handleLogout">
            <LogOut class="mr-2 h-4 w-4" />
            <span>Log out</span>
            <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </nav>
</template>
