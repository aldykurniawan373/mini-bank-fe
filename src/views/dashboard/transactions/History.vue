<script setup lang="ts">
import { ref, h, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { transactionService, type TransactionListParams } from '@/services/transaction.service';
import type { Transaction } from '@/types/transaction';
import { ArrowLeft } from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();

const transactions = ref<Transaction[]>([]);
const isLoading = ref(false);
const errorMessage = ref<string>('');
const searchQuery = ref('');
const typeFilter = ref<'deposit' | 'withdrawal' | 'transfer' | ''>('');
const directionFilter = ref<'in' | 'out' | ''>('');
const currentPage = ref(1);
const perPage = ref(10);
const totalPages = ref(1);
const total = ref(0);

const loadTransactions = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const params: TransactionListParams = {
      page: currentPage.value,
      per_page: perPage.value,
      search: searchQuery.value || undefined,
      type: typeFilter.value || undefined,
      direction: directionFilter.value || undefined,
      sort_by: 'created_at',
      sort_dir: 'desc',
    };

    const response = await transactionService.history(Number(route.params.accountId), params);
    transactions.value = response.data;
    totalPages.value = response.meta.last_page;
    total.value = response.meta.total;
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    errorMessage.value = axiosError.response?.data?.message || 'Gagal memuat riwayat transaksi';
  } finally {
    isLoading.value = false;
  }
};

const handleSearch = () => {
  currentPage.value = 1;
  loadTransactions();
};

const columns: ColumnDef<Transaction>[] = [
  {
    accessorKey: 'transaction_code',
    header: 'Kode Transaksi',
  },
  {
    accessorKey: 'type_label',
    header: 'Tipe',
    cell: ({ row }) => {
      const type = row.original.type;
      return h(Badge, {
        variant: type === 'deposit' ? 'default' : type === 'withdrawal' ? 'destructive' : 'secondary',
      }, () => row.original.type_label);
    },
  },
  {
    accessorKey: 'direction_label',
    header: 'Arah',
    cell: ({ row }) => {
      return h(Badge, {
        variant: row.original.direction === 'in' ? 'default' : 'secondary',
      }, () => row.original.direction_label);
    },
  },
  {
    accessorKey: 'amount',
    header: 'Jumlah',
    cell: ({ row }) => {
      return `Rp ${row.original.amount.toLocaleString('id-ID')}`;
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Tanggal',
    cell: ({ row }) => {
      const date = new Date(row.original.created_at);
      return date.toLocaleString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    },
  },
];

onMounted(() => {
  loadTransactions();
});
</script>

<template>
  <div>
    <page-header title="Riwayat Transaksi">
      <Button variant="outline" @click="router.back()">
        <ArrowLeft class="mr-2 h-4 w-4" />
        Kembali
      </Button>
    </page-header>

    <div v-if="errorMessage" class="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
      {{ errorMessage }}
    </div>

    <div class="mt-4 space-y-4">
      <div class="flex items-center gap-2">
        <Input
          v-model="searchQuery"
          placeholder="Cari kode transaksi..."
          class="w-[250px]"
          @keyup.enter="handleSearch"
        />
        <select
          v-model="typeFilter"
          class="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          @change="handleSearch"
        >
          <option value="">Semua Tipe</option>
          <option value="deposit">Setoran</option>
          <option value="withdrawal">Penarikan</option>
          <option value="transfer">Transfer</option>
        </select>
        <select
          v-model="directionFilter"
          class="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          @change="handleSearch"
        >
          <option value="">Semua Arah</option>
          <option value="in">Masuk</option>
          <option value="out">Keluar</option>
        </select>
        <Button @click="handleSearch" :disabled="isLoading">
          Cari
        </Button>
      </div>

      <DataTable :columns="columns" :data="transactions" />

      <div v-if="totalPages > 1" class="flex items-center justify-between">
        <div class="text-sm text-muted-foreground">
          Menampilkan {{ (currentPage - 1) * perPage + 1 }} sampai {{ Math.min(currentPage * perPage, total) }} dari {{ total }} transaksi
        </div>
        <div class="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            @click="currentPage--; loadTransactions()"
            :disabled="currentPage === 1 || isLoading"
          >
            Sebelumnya
          </Button>
          <Button
            variant="outline"
            size="sm"
            @click="currentPage++; loadTransactions()"
            :disabled="currentPage === totalPages || isLoading"
          >
            Selanjutnya
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

