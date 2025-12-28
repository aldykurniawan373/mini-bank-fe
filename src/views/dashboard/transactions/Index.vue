<script setup lang="ts">
import { ref, h, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { transactionService, type TransactionListParams } from '@/services/transaction.service';
import type { Transaction } from '@/types/transaction';
import { useAuthStore } from '@/stores/auth';
import { Search, Filter, Plus } from 'lucide-vue-next';

const router = useRouter();
const authStore = useAuthStore();

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

    const response = await transactionService.index(params);
    transactions.value = response.data;
    totalPages.value = response.meta.last_page;
    total.value = response.meta.total;
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    errorMessage.value = axiosError.response?.data?.message || 'Gagal memuat transaksi';
  } finally {
    isLoading.value = false;
  }
};

const handleSearch = () => {
  currentPage.value = 1;
  loadTransactions();
};

const handleAccountClick = (accountId: number) => {
  window.location.href = `/dashboard/accounts/${accountId}`;
};

const columns: ColumnDef<Transaction>[] = [
  {
    accessorKey: 'transaction_code',
    header: 'Kode Transaksi',
  },
  {
    accessorKey: 'account_number',
    header: 'Nomor Rekening',
    cell: ({ row }) => {
      const accountId = row.original.account?.id;
      if (!accountId) return '-';
      return h('span', {
        class: 'text-primary cursor-pointer hover:underline',
        onClick: () => handleAccountClick(accountId),
      }, row.original.account?.account_number || '-');
    },
  },
  {
    accessorKey: 'customer_name',
    header: 'Nasabah',
    cell: ({ row }) => {
      const accountId = row.original.account?.id;
      const customerName = row.original.account?.customer?.name || row.original.account?.customer?.full_name || '-';
      if (!accountId) return customerName;
      return h('span', {
        class: 'text-primary cursor-pointer hover:underline',
        onClick: () => handleAccountClick(accountId),
      }, customerName);
    },
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
    <page-header title="Transaksi">
      <div v-if="authStore.isAdmin" class="flex items-center gap-2">
        <Button @click="router.push('/transactions/new/deposit')">
          <Plus class="mr-2 h-4 w-4" />
          Setoran
        </Button>
        <Button variant="outline" @click="router.push('/transactions/new/withdraw')">
          Penarikan
        </Button>
      </div>
    </page-header>

    <div v-if="errorMessage" class="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
      {{ errorMessage }}
    </div>

    <div class="mt-4 space-y-4">
      <div class="flex flex-wrap items-center gap-2">
        <div class="relative flex-1 min-w-[250px]">
          <Search class="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            v-model="searchQuery"
            placeholder="Cari kode transaksi, nomor rekening, atau nama nasabah..."
            class="pl-8"
            @keyup.enter="handleSearch"
          />
        </div>
        <Select :model-value="typeFilter || undefined" @update:model-value="(val) => { typeFilter = (val || '') as typeof typeFilter; handleSearch(); }">
          <SelectTrigger class="w-[180px]">
            <SelectValue placeholder="Semua Tipe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem :value="null">Semua Tipe</SelectItem>
            <SelectItem value="deposit">Setoran</SelectItem>
            <SelectItem value="withdrawal">Penarikan</SelectItem>
            <SelectItem value="transfer">Transfer</SelectItem>
          </SelectContent>
        </Select>
        <Select :model-value="directionFilter || undefined" @update:model-value="(val) => { directionFilter = (val || '') as typeof directionFilter; handleSearch(); }">
          <SelectTrigger class="w-[180px]">
            <SelectValue placeholder="Semua Arah" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem :value="null">Semua Arah</SelectItem>
            <SelectItem value="in">Masuk</SelectItem>
            <SelectItem value="out">Keluar</SelectItem>
          </SelectContent>
        </Select>
        <Button @click="handleSearch" :disabled="isLoading">
          <Filter class="mr-2 h-4 w-4" />
          Filter
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
