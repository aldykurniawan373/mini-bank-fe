<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/auth';
import { RefreshCw, User, Mail, Shield, Calendar } from 'lucide-vue-next';

const authStore = useAuthStore();

const isLoading = ref(false);
const errorMessage = ref<string>('');
const successMessage = ref<string>('');

const refreshProfile = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  successMessage.value = '';
  
  try {
    await authStore.getMe();
    successMessage.value = 'Profile berhasil diperbarui';
    setTimeout(() => {
      successMessage.value = '';
    }, 3000);
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    errorMessage.value = axiosError.response?.data?.message || 'Gagal memperbarui profile';
  } finally {
    isLoading.value = false;
  }
};

const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getRoleLabel = (role: string) => {
  return role === 'admin' ? 'Admin (Petugas Teller)' : role === 'pimpinan' ? 'Pimpinan' : role;
};

const getRoleVariant = (role: string) => {
  return role === 'admin' ? 'default' : role === 'pimpinan' ? 'secondary' : 'outline';
};

onMounted(() => {
  // Refresh profile on mount to ensure fresh data
  refreshProfile();
});
</script>

<template>
  <div>
    <page-header title="Profile">
      <Button @click="refreshProfile" :disabled="isLoading" variant="outline">
        <RefreshCw :class="['mr-2 h-4 w-4', isLoading && 'animate-spin']" />
        {{ isLoading ? 'Memperbarui...' : 'Perbarui' }}
      </Button>
    </page-header>

    <div v-if="errorMessage" class="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
      {{ errorMessage }}
    </div>

    <div v-if="successMessage" class="mb-4 p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
      {{ successMessage }}
    </div>

    <div v-if="authStore.user" class="mt-4 grid gap-4">
      <!-- Profile Header -->
      <Card>
        <CardContent class="pt-6">
          <div class="flex flex-col md:flex-row items-center md:items-start gap-6">
            <Avatar class="h-24 w-24">
              <AvatarImage
                :src="`https://ui-avatars.com/api/?name=${encodeURIComponent(authStore.user.name)}&background=random&size=128`"
              />
            </Avatar>
            <div class="flex-1 text-center md:text-left">
              <h2 class="text-2xl font-bold mb-2">{{ authStore.user.name }}</h2>
              <p class="text-muted-foreground mb-3">{{ authStore.user.email }}</p>
              <Badge :variant="getRoleVariant(authStore.user.role)">
                {{ getRoleLabel(authStore.user.role) }}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Profile Details -->
      <Card>
        <CardHeader>
          <CardTitle>Informasi Akun</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="flex items-start gap-4">
            <User class="h-5 w-5 text-muted-foreground mt-0.5" />
            <div class="flex-1">
              <label class="text-sm font-medium text-muted-foreground">Nama</label>
              <p class="text-lg">{{ authStore.user.name }}</p>
            </div>
          </div>

          <div class="flex items-start gap-4">
            <Mail class="h-5 w-5 text-muted-foreground mt-0.5" />
            <div class="flex-1">
              <label class="text-sm font-medium text-muted-foreground">Email</label>
              <p class="text-lg">{{ authStore.user.email }}</p>
            </div>
          </div>

          <div class="flex items-start gap-4">
            <Shield class="h-5 w-5 text-muted-foreground mt-0.5" />
            <div class="flex-1">
              <label class="text-sm font-medium text-muted-foreground">Role</label>
              <div class="mt-1">
                <Badge :variant="getRoleVariant(authStore.user.role)">
                  {{ getRoleLabel(authStore.user.role) }}
                </Badge>
              </div>
            </div>
          </div>

          <div class="flex items-start gap-4">
            <Calendar class="h-5 w-5 text-muted-foreground mt-0.5" />
            <div class="flex-1">
              <label class="text-sm font-medium text-muted-foreground">Akun Dibuat</label>
              <p class="text-lg">{{ formatDate(authStore.user.created_at) }}</p>
            </div>
          </div>

          <div v-if="authStore.user.updated_at" class="flex items-start gap-4">
            <Calendar class="h-5 w-5 text-muted-foreground mt-0.5" />
            <div class="flex-1">
              <label class="text-sm font-medium text-muted-foreground">Terakhir Diperbarui</label>
              <p class="text-lg">{{ formatDate(authStore.user.updated_at) }}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Permissions Info -->
      <Card>
        <CardHeader>
          <CardTitle>Hak Akses</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-2">
            <div v-if="authStore.isAdmin" class="flex items-center gap-2">
              <div class="h-2 w-2 rounded-full bg-green-500"></div>
              <span>Admin (Petugas Teller) - Dapat mengelola nasabah dan transaksi</span>
            </div>
            <div v-if="authStore.isPimpinan" class="flex items-center gap-2">
              <div class="h-2 w-2 rounded-full bg-blue-500"></div>
              <span>Pimpinan - Dapat mengelola user dan monitoring data</span>
            </div>
            <div v-if="!authStore.isAdmin && !authStore.isPimpinan" class="flex items-center gap-2">
              <div class="h-2 w-2 rounded-full bg-gray-500"></div>
              <span>User - Akses terbatas</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <div v-else class="mt-4">
      <Card>
        <CardContent class="pt-6">
          <p class="text-center text-muted-foreground">Memuat data profile...</p>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

