<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'vue-sonner';
import { customerService } from '@/services/customer.service';
import { accountService } from '@/services/account.service';
import { transactionService, type TransactionListParams } from '@/services/transaction.service';
import type { Customer } from '@/types/customer';
import type { Account } from '@/types/account';
import type { Transaction } from '@/types/transaction';
import { useAuthStore } from '@/stores/auth';
import { ArrowLeft, Plus, Pencil, Trash2, Wallet, History, Download, ArrowUpRight, ArrowDownLeft, ArrowLeftRight, CreditCard } from 'lucide-vue-next';
import { h } from 'vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const customer = ref<Customer | null>(null);
const accounts = ref<Account[]>([]);
const isLoading = ref(false);
const errorMessage = ref<string>('');
const successMessage = ref<string>('');

const isBalanceDialogOpen = ref(false);
const isHistoryDialogOpen = ref(false);
const isExportsDialogOpen = ref(false);
const selectedAccount = ref<Account | null>(null);
const selectedAccountForExport = ref<Account | null>(null);
const accountBalance = ref<Account | null>(null);
const transactions = ref<Transaction[]>([]);
const exports = ref<Array<{ filename: string; filepath: string; size: number; created_at: string; download_url: string }>>([]);
const isLoadingBalance = ref(false);
const isLoadingHistory = ref(false);
const isLoadingExports = ref(false);
const historyError = ref<string>('');
const historyPage = ref(1);
const historyPerPage = ref(10);
const historyTotalPages = ref(1);
const historyTotal = ref(0);
let exportsRefreshInterval: ReturnType<typeof setInterval> | null = null;

const loadCustomer = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const response = await customerService.show(Number(route.params.id));
    customer.value = response.data;
    if (response.data.accounts) {
      accounts.value = response.data.accounts;
      console.log(accounts.value);
    }
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    errorMessage.value = axiosError.response?.data?.message || 'Gagal memuat data nasabah';
  } finally {
    isLoading.value = false;
  }
};

const handleCreateAccount = async () => {
  if (!customer.value) return;
  
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const response = await accountService.create(customer.value.id);
    accounts.value.push(response.data);
    toast.success('Rekening berhasil dibuat', {
      description: `Rekening ${response.data.account_number} telah dibuat untuk ${customer.value.name}`,
    });
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    const errorMsg = axiosError.response?.data?.message || 'Gagal membuat rekening';
    errorMessage.value = errorMsg;
    toast.error('Gagal membuat rekening', {
      description: errorMsg,
    });
  } finally {
    isLoading.value = false;
  }
};

const handleDelete = async () => {
  if (!authStore.isPimpinan) {
    alert('Hanya pimpinan yang dapat menghapus nasabah');
    return;
  }

  if (!customer.value || !confirm(`Apakah Anda yakin ingin menghapus nasabah ${customer.value.name}?`)) {
    return;
  }

  isLoading.value = true;
  try {
    await customerService.delete(customer.value.id);
    toast.success('Nasabah berhasil dihapus', {
      description: `Data nasabah ${customer.value.name} telah dihapus`,
    });
    router.push('/customers');
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    const errorMsg = axiosError.response?.data?.message || 'Gagal menghapus nasabah';
    errorMessage.value = errorMsg;
    toast.error('Gagal menghapus nasabah', {
      description: errorMsg,
    });
  } finally {
    isLoading.value = false;
  }
};

const handleExport = async (account: Account) => {
  isLoading.value = true;
  try {
    await transactionService.export(account.id);
    
    toast.success('Proses ekspor dimulai', {
      description: 'File sedang diproses, silakan cek riwayat export',
    });

    selectedAccountForExport.value = account;
    if (isExportsDialogOpen.value) {
      loadExports(account.id);
    } else {
      openExportsDialog(account.id);
    }
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    const errorMsg = axiosError.response?.data?.message || 'Gagal memulai proses ekspor';
    toast.error('Gagal memulai ekspor', {
      description: errorMsg,
    });
  } finally {
    isLoading.value = false;
  }
};

const loadExports = async (accountId?: number) => {
  isLoadingExports.value = true;
  try {
    const response = await transactionService.listExports(accountId);
    exports.value = response.data;
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    toast.error('Gagal memuat daftar export', {
      description: axiosError.response?.data?.message || 'Terjadi kesalahan',
    });
  } finally {
    isLoadingExports.value = false;
  }
};

const openExportsDialog = (accountId?: number) => {
  isExportsDialogOpen.value = true;
  loadExports(accountId);
  
  if (exportsRefreshInterval) {
    clearInterval(exportsRefreshInterval);
  }
  
  exportsRefreshInterval = setInterval(() => {
    if (isExportsDialogOpen.value) {
      loadExports(accountId);
    } else {
      if (exportsRefreshInterval) {
        clearInterval(exportsRefreshInterval);
        exportsRefreshInterval = null;
      }
    }
  }, 3000);
};

const closeExportsDialog = () => {
  isExportsDialogOpen.value = false;
  if (exportsRefreshInterval) {
    clearInterval(exportsRefreshInterval);
    exportsRefreshInterval = null;
  }
};

const downloadExportFile = async (filename: string) => {
  try {
    const blob = await transactionService.downloadExport(filename);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    toast.success('File berhasil diunduh', {
      description: `File ${filename} telah diunduh`,
    });
  } catch (error) {
    toast.error('Gagal mengunduh file', {
      description: 'Terjadi kesalahan saat mengunduh file',
    });
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

const exportColumns: ColumnDef<{ filename: string; filepath: string; size: number; created_at: string; download_url: string }>[] = [
  {
    accessorKey: 'filename',
    header: 'Nama File',
  },
  {
    accessorKey: 'size',
    header: 'Ukuran',
    cell: ({ row }) => {
      return formatFileSize(row.original.size);
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Tanggal Dibuat',
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
  {
    id: 'actions',
    header: 'Aksi',
    cell: ({ row }) => {
      return h(Button, {
        variant: 'outline',
        size: 'sm',
        onClick: () => downloadExportFile(row.original.filename),
      }, {
        default: () => [
          h(Download, { class: 'mr-2 h-4 w-4' }),
          'Unduh',
        ],
      });
    },
  },
];

const openBalanceDialog = async (account: Account) => {
  selectedAccount.value = account;
  isBalanceDialogOpen.value = true;
  isLoadingBalance.value = true;
  try {
    const response = await transactionService.balance(account.id);
    accountBalance.value = response.data;
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    toast.error('Gagal memuat saldo', {
      description: axiosError.response?.data?.message || 'Terjadi kesalahan',
    });
  } finally {
    isLoadingBalance.value = false;
  }
};

const openHistoryDialog = async (account: Account) => {
  selectedAccount.value = account;
  isHistoryDialogOpen.value = true;
  historyPage.value = 1;
  await loadHistory();
};

const loadHistory = async () => {
  if (!selectedAccount.value) return;
  
  isLoadingHistory.value = true;
  historyError.value = '';
  try {
    const params: TransactionListParams = {
      page: historyPage.value,
      per_page: historyPerPage.value,
      sort_by: 'created_at',
      sort_dir: 'desc',
    };

    const response = await transactionService.history(selectedAccount.value.id, params);
    transactions.value = response.data;
    historyTotalPages.value = response.meta.last_page;
    historyTotal.value = response.meta.total;
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    historyError.value = axiosError.response?.data?.message || 'Gagal memuat riwayat transaksi';
  } finally {
    isLoadingHistory.value = false;
  }
};

const transactionColumns: ColumnDef<Transaction>[] = [
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
      const amount = row.original.amount;
      const direction = row.original.direction;
      return h('span', {
        class: direction === 'in' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold',
      }, `${direction === 'in' ? '+' : '-'}Rp ${amount.toLocaleString('id-ID')}`);
    },
  },
  {
    accessorKey: 'related_account',
    header: 'Rekening Terkait',
    cell: ({ row }) => {
      const transaction = row.original;
      if (transaction.type === 'transfer' && transaction.related_account) {
        return h('div', { class: 'space-y-1' }, [
          h('p', { class: 'font-medium' }, transaction.related_account.account_number),
          transaction.related_account.customer 
            ? h('p', { class: 'text-xs text-muted-foreground' }, transaction.related_account.customer.name || '')
            : null,
        ]);
      }
      return h('span', { class: 'text-muted-foreground' }, '-');
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
  loadCustomer();
});

onUnmounted(() => {
  if (exportsRefreshInterval) {
    clearInterval(exportsRefreshInterval);
  }
});
</script>

<template>
  <div>
    <page-header title="Detail Nasabah">
      <div class="flex items-center gap-2">
        <Button variant="outline" @click="router.push('/customers')">
          <ArrowLeft class="mr-2 h-4 w-4" />
          Kembali
        </Button>
        <Button
          v-if="authStore.isAdmin"
          variant="outline"
          @click="router.push(`/customers/${route.params.id}/edit`)"
        >
          <Pencil class="mr-2 h-4 w-4" />
          Edit
        </Button>
        <Button
          v-if="authStore.isPimpinan"
          variant="destructive"
          @click="handleDelete"
          :disabled="isLoading"
        >
          <Trash2 class="mr-2 h-4 w-4" />
          Hapus
        </Button>
      </div>
    </page-header>

    <div v-if="errorMessage" class="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
      {{ errorMessage }}
    </div>

    <div v-if="successMessage" class="mb-4 p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
      {{ successMessage }}
    </div>

    <div v-if="customer" class="mt-4 grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Informasi Nasabah</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div>
            <label class="text-sm font-medium text-muted-foreground">Nama</label>
            <p class="text-lg">{{ customer.name }}</p>
          </div>
          <div>
            <label class="text-sm font-medium text-muted-foreground">NIK</label>
            <p class="text-lg">{{ customer.nik || '-' }}</p>
          </div>
          <div>
            <label class="text-sm font-medium text-muted-foreground">Telepon</label>
            <p class="text-lg">{{ customer.phone || '-' }}</p>
          </div>
          <div>
            <label class="text-sm font-medium text-muted-foreground">Alamat</label>
            <p class="text-lg">{{ customer.address || '-' }}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div class="flex items-center justify-between">
            <CardTitle>Rekening</CardTitle>
            <Button
              v-if="authStore.isAdmin"
              size="sm"
              @click="handleCreateAccount"
              :disabled="isLoading"
            >
              <Plus class="mr-2 h-4 w-4" />
              Tambah Rekening
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p v-if="accounts.length === 0" class="text-muted-foreground">Belum ada rekening</p>
          <div v-else class="grid gap-4 md:grid-cols-2">
            <Card
              v-for="account in accounts"
              :key="account.id"
              class="hover:shadow-md transition-shadow cursor-pointer"
              @click="openBalanceDialog(account)"
            >
              <CardHeader>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <CreditCard class="h-5 w-5 text-muted-foreground" />
                    <CardTitle class="text-lg">{{ account.account_number }}</CardTitle>
                  </div>
                  <Badge variant="default">Aktif</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div class="space-y-3">
                  <div>
                    <label class="text-xs font-medium text-muted-foreground">Saldo</label>
                    <p class="text-2xl font-bold text-green-600">
                      Rp {{ account.balance.toLocaleString('id-ID') }}
                    </p>
                  </div>
                  <div v-if="account.customer">
                    <label class="text-xs font-medium text-muted-foreground">Nasabah</label>
                    <p class="text-sm">{{ account.customer.name }}</p>
                  </div>
                  <div class="flex gap-2 pt-2 border-t">
                    <Button
                      v-if="authStore.isAdmin"
                      variant="outline"
                      size="sm"
                      class="flex-1"
                      @click.stop="router.push(`/transactions/from-account/${account.id}/deposit`)"
                    >
                      <ArrowDownLeft class="mr-2 h-4 w-4" />
                      Setoran
                    </Button>
                    <Button
                      v-if="authStore.isAdmin"
                      variant="outline"
                      size="sm"
                      class="flex-1"
                      @click.stop="router.push(`/transactions/from-account/${account.id}/withdraw`)"
                    >
                      <ArrowUpRight class="mr-2 h-4 w-4" />
                      Penarikan
                    </Button>
                    <Button
                      v-if="authStore.isAdmin"
                      variant="outline"
                      size="sm"
                      class="flex-1"
                      @click.stop="router.push(`/transactions/from-account/${account.id}/transfer`)"
                    >
                      <ArrowLeftRight class="mr-2 h-4 w-4" />
                      Transfer
                    </Button>
                  </div>
                  <div class="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      class="flex-1"
                      @click.stop="openBalanceDialog(account)"
                    >
                      <Wallet class="mr-2 h-4 w-4" />
                      Cek Saldo
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      class="flex-1"
                      @click.stop="openHistoryDialog(account)"
                    >
                      <History class="mr-2 h-4 w-4" />
                      History
                    </Button>
                    <Button
                      v-if="authStore.isAdmin"
                      variant="outline"
                      size="sm"
                      @click.stop="handleExport(account)"
                    >
                      <Download class="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>

    <Dialog v-model:open="isBalanceDialogOpen">
      <DialogContent class="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Cek Saldo Rekening</DialogTitle>
          <DialogDescription>
            Informasi saldo dan detail rekening
          </DialogDescription>
        </DialogHeader>
        <div v-if="isLoadingBalance" class="p-8 text-center">
          <p class="text-muted-foreground">Memuat data saldo...</p>
        </div>
        <div v-else-if="accountBalance" class="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Rekening</CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <div>
                <label class="text-sm font-medium text-muted-foreground">Nomor Rekening</label>
                <p class="text-lg font-semibold">{{ accountBalance.account_number }}</p>
              </div>
              <div v-if="accountBalance.customer">
                <label class="text-sm font-medium text-muted-foreground">Nama Nasabah</label>
                <p class="text-lg">{{ accountBalance.customer.name }}</p>
              </div>
              <div>
                <label class="text-sm font-medium text-muted-foreground">Status</label>
                <p class="text-lg">
                  <Badge variant="default">Aktif</Badge>
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Saldo Rekening</CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <div>
                <label class="text-sm font-medium text-muted-foreground">Saldo Saat Ini</label>
                <p class="text-4xl font-bold text-green-600">
                  Rp {{ accountBalance.balance.toLocaleString('id-ID') }}
                </p>
              </div>
              <div class="pt-4 border-t">
                <p class="text-xs text-muted-foreground">
                  Saldo terakhir diperbarui: {{ new Date(accountBalance.updated_at || accountBalance.created_at).toLocaleString('id-ID') }}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="isHistoryDialogOpen">
      <DialogContent class="max-w-[95vw] w-full h-[90vh] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Riwayat Transaksi</DialogTitle>
          <DialogDescription>
            Daftar transaksi untuk rekening {{ selectedAccount?.account_number }}
          </DialogDescription>
        </DialogHeader>
        <div v-if="isLoadingHistory" class="p-8 text-center">
          <p class="text-muted-foreground">Memuat riwayat transaksi...</p>
        </div>
        <div v-else-if="historyError" class="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {{ historyError }}
        </div>
        <div v-else class="space-y-4">
          <div v-if="transactions.length === 0" class="p-8 text-center text-muted-foreground">
            Belum ada transaksi
          </div>
          <div v-else>
            <DataTable :columns="transactionColumns" :data="transactions" />
            <div v-if="historyTotalPages > 1" class="flex items-center justify-between pt-4 border-t mt-4">
              <div class="text-sm text-muted-foreground">
                Menampilkan {{ (historyPage - 1) * historyPerPage + 1 }} sampai {{ Math.min(historyPage * historyPerPage, historyTotal) }} dari {{ historyTotal }} transaksi
              </div>
              <div class="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  @click="historyPage--; loadHistory()"
                  :disabled="historyPage === 1 || isLoadingHistory"
                >
                  Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  @click="historyPage++; loadHistory()"
                  :disabled="historyPage === historyTotalPages || isLoadingHistory"
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="isExportsDialogOpen" @update:open="(val) => !val && closeExportsDialog()">
      <DialogContent class="max-w-[95vw] w-full h-[90vh] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Riwayat Export Transaksi</DialogTitle>
          <DialogDescription>
            <span v-if="selectedAccountForExport">
              Daftar file export untuk rekening {{ selectedAccountForExport.account_number }}
            </span>
            <span v-else>
              Daftar file export yang tersedia untuk diunduh
            </span>
          </DialogDescription>
        </DialogHeader>
        <div v-if="isLoadingExports" class="p-8 text-center">
          <p class="text-muted-foreground">Memuat daftar export...</p>
        </div>
        <div v-else class="space-y-4">
          <div v-if="exports.length === 0" class="p-8 text-center text-muted-foreground">
            Belum ada file export
          </div>
          <div v-else>
            <DataTable :columns="exportColumns" :data="exports" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

