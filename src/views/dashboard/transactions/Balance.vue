<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { transactionService } from '@/services/transaction.service';
import type { Account } from '@/types/account';
import { ArrowLeft, RefreshCw, Wallet, TrendingUp, TrendingDown } from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const account = ref<Account | null>(null);
const isLoading = ref(false);
const errorMessage = ref<string>('');

const loadBalance = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const response = await transactionService.balance(Number(route.params.accountId));
    account.value = response.data;
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    errorMessage.value = axiosError.response?.data?.message || 'Gagal memuat saldo';
  } finally {
    isLoading.value = false;
  }
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

onMounted(() => {
  loadBalance();
});
</script>

<template>
  <div>
    <page-header title="Cek Saldo Rekening">
      <div class="flex items-center gap-2">
        <Button variant="outline" @click="loadBalance" :disabled="isLoading">
          <RefreshCw class="mr-2 h-4 w-4" :class="{ 'animate-spin': isLoading }" />
          Refresh
        </Button>
        <Button variant="outline" @click="router.back()">
          <ArrowLeft class="mr-2 h-4 w-4" />
          Kembali
        </Button>
      </div>
    </page-header>

    <div v-if="errorMessage" class="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
      {{ errorMessage }}
    </div>

    <div v-if="account" class="mt-4 max-w-2xl mx-auto">
      <!-- Card Saldo Utama - Fokus pada Saldo -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Wallet class="h-5 w-5" />
            Cek Saldo Rekening
          </CardTitle>
          <CardDescription>
            Informasi saldo untuk rekening {{ account.account_number }}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="space-y-6">
            <!-- Saldo Besar di Tengah -->
            <div class="text-center py-8 border-b">
              <p class="text-sm font-medium text-muted-foreground mb-3">Saldo Saat Ini</p>
              <p class="text-6xl font-bold text-primary mb-2">
                {{ formatCurrency(account.balance) }}
              </p>
              <p class="text-xs text-muted-foreground">
                Terakhir diperbarui: {{ new Date().toLocaleString('id-ID') }}
              </p>
            </div>

            <!-- Informasi Rekening Ringkas -->
            <div class="grid gap-4 md:grid-cols-2 pt-4">
              <div>
                <label class="text-sm font-medium text-muted-foreground">Nomor Rekening</label>
                <p class="text-base font-semibold mt-1">{{ account.account_number }}</p>
              </div>
              <div v-if="account.customer">
                <label class="text-sm font-medium text-muted-foreground">Nama Nasabah</label>
                <p class="text-base mt-1">{{ account.customer.name }}</p>
              </div>
            </div>

            <!-- Navigasi ke Halaman Lain -->
            <div class="pt-4 border-t space-y-2">
              <Button
                class="w-full"
                variant="outline"
                @click="router.push(`/dashboard/accounts/${account.id}`)"
              >
                Lihat Detail Rekening Lengkap
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

