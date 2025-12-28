<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { dashboardService } from '@/services/dashboard.service';
import type { DashboardStatistics } from '@/types/dashboard';
import { 
  Wallet, 
  Users, 
  CreditCard, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  DollarSign,
  ArrowRightLeft,
  History
} from 'lucide-vue-next';

const statistics = ref<DashboardStatistics | null>(null);
const isLoading = ref(false);
const errorMessage = ref<string>('');

const loadStatistics = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const response = await dashboardService.getStatistics();
    statistics.value = response.data;
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    errorMessage.value = axiosError.response?.data?.message || 'Gagal memuat statistik dashboard';
  } finally {
    isLoading.value = false;
  }
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('id-ID').format(num);
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getChangeColor = (change: number) => {
  return change >= 0 ? 'text-green-600' : 'text-red-600';
};

const getChangeIcon = (change: number) => {
  return change >= 0 ? ArrowUpRight : ArrowDownRight;
};

onMounted(() => {
  loadStatistics();
});
</script>

<template>
  <div>
    <page-header title="Dashboard Mini Bank">
      <Button @click="loadStatistics" :disabled="isLoading" variant="outline">
        <History :class="['mr-2 h-4 w-4', isLoading && 'animate-spin']" />
        {{ isLoading ? 'Memuat...' : 'Refresh' }}
      </Button>
    </page-header>

    <div v-if="errorMessage" class="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
      {{ errorMessage }}
    </div>

    <div v-if="isLoading && !statistics" class="mt-4">
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card v-for="i in 4" :key="i">
          <CardHeader>
            <div class="h-4 bg-gray-200 rounded animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div class="h-8 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div class="h-3 bg-gray-200 rounded animate-pulse"></div>
          </CardContent>
        </Card>
      </div>
    </div>

    <div v-else-if="statistics" class="mt-4 space-y-4">
      <!-- Summary Cards -->
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">
              Total Saldo Nasabah
            </CardTitle>
            <Wallet class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              {{ formatCurrency(statistics.summary.total_balance) }}
            </div>
            <p class="text-xs text-muted-foreground mt-1">
              Semua rekening aktif
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">
              Total Nasabah
            </CardTitle>
            <Users class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              {{ formatNumber(statistics.summary.total_customers) }}
            </div>
            <p class="text-xs text-muted-foreground mt-1">
              <span :class="getChangeColor(statistics.changes.customers)" class="flex items-center">
                <component :is="getChangeIcon(statistics.changes.customers)" class="h-3 w-3 mr-1" />
                {{ Math.abs(statistics.changes.customers).toFixed(1) }}% dari kemarin
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">
              Total Rekening
            </CardTitle>
            <CreditCard class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              {{ formatNumber(statistics.summary.total_accounts) }}
            </div>
            <p class="text-xs text-muted-foreground mt-1">
              <span :class="getChangeColor(statistics.changes.accounts)" class="flex items-center">
                <component :is="getChangeIcon(statistics.changes.accounts)" class="h-3 w-3 mr-1" />
                {{ Math.abs(statistics.changes.accounts).toFixed(1) }}% dari kemarin
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">
              Transaksi Hari Ini
            </CardTitle>
            <TrendingUp class="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              {{ formatNumber(statistics.today.transactions) }}
            </div>
            <p class="text-xs text-muted-foreground mt-1">
              <span :class="getChangeColor(statistics.changes.transactions)" class="flex items-center">
                <component :is="getChangeIcon(statistics.changes.transactions)" class="h-3 w-3 mr-1" />
                {{ Math.abs(statistics.changes.transactions).toFixed(1) }}% dari kemarin
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      <!-- Today's Activity -->
      <div class="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle class="text-sm font-medium flex items-center">
              <DollarSign class="h-4 w-4 mr-2 text-green-600" />
              Setoran Hari Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold text-green-600">
              {{ formatCurrency(statistics.today.deposits) }}
            </div>
            <p class="text-xs text-muted-foreground mt-1">
              Kemarin: {{ formatCurrency(statistics.yesterday.deposits) }}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle class="text-sm font-medium flex items-center">
              <ArrowDownRight class="h-4 w-4 mr-2 text-red-600" />
              Penarikan Hari Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold text-red-600">
              {{ formatCurrency(statistics.today.withdrawals) }}
            </div>
            <p class="text-xs text-muted-foreground mt-1">
              Kemarin: {{ formatCurrency(statistics.yesterday.withdrawals) }}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle class="text-sm font-medium flex items-center">
              <ArrowRightLeft class="h-4 w-4 mr-2 text-blue-600" />
              Transfer Hari Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold text-blue-600">
              {{ formatCurrency(statistics.today.transfers) }}
            </div>
            <p class="text-xs text-muted-foreground mt-1">
              Kemarin: {{ formatCurrency(statistics.yesterday.transfers) }}
            </p>
          </CardContent>
        </Card>
      </div>

      <!-- Recent Transactions & Monthly Stats -->
      <div class="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Transaksi Terakhir</CardTitle>
          </CardHeader>
          <CardContent>
            <div v-if="statistics.recent_transactions.length === 0" class="text-center py-8 text-muted-foreground">
              Belum ada transaksi
            </div>
            <div v-else class="space-y-3">
              <div
                v-for="transaction in statistics.recent_transactions"
                :key="transaction.id"
                class="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
              >
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <span class="font-medium">{{ transaction.type_label }}</span>
                    <span
                      class="text-xs px-2 py-0.5 rounded"
                      :class="transaction.direction === 'in' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
                    >
                      {{ transaction.direction === 'in' ? 'Masuk' : 'Keluar' }}
                    </span>
                  </div>
                  <p class="text-sm text-muted-foreground mt-1">
                    {{ transaction.customer_name }} - {{ transaction.account_number }}
                  </p>
                  <p class="text-xs text-muted-foreground">
                    {{ formatDateTime(transaction.created_at) }}
                  </p>
                </div>
                <div class="text-right">
                  <p
                    class="font-semibold"
                    :class="transaction.direction === 'in' ? 'text-green-600' : 'text-red-600'"
                  >
                    {{ transaction.direction === 'in' ? '+' : '-' }}{{ formatCurrency(transaction.amount) }}
                  </p>
                  <p class="text-xs text-muted-foreground">{{ transaction.transaction_code }}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistik Bulanan</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <span class="text-sm text-muted-foreground">Transaksi Bulan Ini</span>
                <span class="font-semibold">{{ formatNumber(statistics.summary.transactions_this_month) }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-muted-foreground">Total Saldo</span>
                <span class="font-semibold">{{ formatCurrency(statistics.summary.total_balance) }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-muted-foreground">Total Rekening</span>
                <span class="font-semibold">{{ formatNumber(statistics.summary.total_accounts) }}</span>
              </div>
              <div class="pt-4 border-t">
                <p class="text-xs text-muted-foreground mb-2">Statistik 7 Hari Terakhir</p>
                <div class="space-y-2">
                  <div
                    v-for="stat in statistics.daily_stats"
                    :key="stat.date"
                    class="flex items-center justify-between text-sm"
                  >
                    <span>{{ formatDate(stat.date) }}</span>
                    <span class="font-medium">{{ stat.total }} transaksi</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
