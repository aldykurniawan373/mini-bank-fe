<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { accountService } from '@/services/account.service';
import type { Account } from '@/types/account';
import { useAuthStore } from '@/stores/auth';
import { ArrowLeft } from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const account = ref<Account | null>(null);
const isLoading = ref(false);
const errorMessage = ref<string>('');

const loadAccount = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const response = await accountService.show(Number(route.params.id));
    account.value = response.data;
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    errorMessage.value = axiosError.response?.data?.message || 'Gagal memuat data rekening';
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadAccount();
});
</script>

<template>
  <div>
    <page-header title="Detail Rekening">
      <Button variant="outline" @click="router.back()">
        <ArrowLeft class="mr-2 h-4 w-4" />
        Kembali
      </Button>
    </page-header>

    <div v-if="errorMessage" class="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
      {{ errorMessage }}
    </div>

    <div v-if="account" class="mt-4 grid gap-4">
      <!-- Card Informasi Rekening Lengkap -->
      <Card>
        <CardHeader>
          <CardTitle>Informasi Rekening</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="text-sm font-medium text-muted-foreground">Nomor Rekening</label>
              <p class="text-lg font-semibold">{{ account.account_number }}</p>
            </div>
            <div>
              <label class="text-sm font-medium text-muted-foreground">Saldo</label>
              <p class="text-2xl font-bold text-primary">
                Rp {{ account.balance.toLocaleString('id-ID') }}
              </p>
            </div>
            <div v-if="account.customer">
              <label class="text-sm font-medium text-muted-foreground">Nama Nasabah</label>
              <p class="text-lg">{{ account.customer.name }}</p>
            </div>
            <div>
              <label class="text-sm font-medium text-muted-foreground">Tanggal Dibuat</label>
              <p class="text-lg">{{ account.created_at ? new Date(account.created_at).toLocaleDateString('id-ID') : '-' }}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div class="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Transaksi</CardTitle>
          </CardHeader>
          <CardContent class="space-y-2">
            <Button
              class="w-full justify-start"
              variant="outline"
              @click="router.push(`/transactions/${account.id}/history`)"
            >
              Riwayat Transaksi
            </Button>
            <Button
              class="w-full justify-start"
              variant="outline"
              @click="router.push(`/transactions/${account.id}/balance`)"
            >
              Cek Saldo
            </Button>
          </CardContent>
        </Card>

        <Card v-if="authStore.isAdmin">
          <CardHeader>
            <CardTitle>Aksi</CardTitle>
          </CardHeader>
          <CardContent class="space-y-2">
            <Button
              class="w-full justify-start"
              @click="router.push(`/transactions/${account.id}/deposit`)"
            >
              Setoran
            </Button>
            <Button
              class="w-full justify-start"
              variant="outline"
              @click="router.push(`/transactions/${account.id}/withdraw`)"
            >
              Penarikan
            </Button>
            <Button
              class="w-full justify-start"
              variant="outline"
              @click="router.push(`/transactions/${account.id}/transfer`)"
            >
              Transfer
            </Button>
            <Button
              class="w-full justify-start"
              variant="outline"
              @click="router.push(`/transactions/${account.id}/export`)"
            >
              Ekspor Transaksi
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>

