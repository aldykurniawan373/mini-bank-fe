<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'vue-sonner';
import { transactionService } from '@/services/transaction.service';
import { accountService } from '@/services/account.service';
import type { Account } from '@/types/account';
import { useAuthStore } from '@/stores/auth';
import { ArrowLeft, Search } from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

if (!authStore.isAdmin) {
  router.push('/dashboard/home');
}

const formSchema = toTypedSchema(z.object({
  to_account_id: z.number().min(1, 'Rekening tujuan harus dipilih'),
  amount: z.coerce.number().min(1, 'Jumlah harus lebih dari 0'),
  description: z.string().optional(),
}));

const form = useForm({
  validationSchema: formSchema,
});

const account = ref<Account | null>(null);
const toAccountId = ref<number | null>(null);
const toAccount = ref<Account | null>(null);
const accounts = ref<Account[]>([]);
const searchQuery = ref('');
const isSearching = ref(false);
const isSelectOpen = ref(false);
const isLoading = ref(false);
const errorMessage = ref<string>('');

const loadAccount = async () => {
  isLoading.value = true;
  try {
    const response = await accountService.show(Number(route.params.accountId));
    account.value = response.data;
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    errorMessage.value = axiosError.response?.data?.message || 'Gagal memuat data rekening';
  } finally {
    isLoading.value = false;
  }
};

const searchAccounts = async (query: string) => {
  if (!query || query.length < 2) {
    accounts.value = [];
    return;
  }

  isSearching.value = true;
  try {
    const response = await accountService.search(query, account.value?.id, 20);
    accounts.value = response.data;
  } catch (error: unknown) {
    console.error('Search accounts error:', error);
    accounts.value = [];
  } finally {
    isSearching.value = false;
  }
};

// Watch search query with debounce
let searchTimeout: ReturnType<typeof setTimeout>;
watch(searchQuery, (newQuery) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    if (isSelectOpen.value) {
      searchAccounts(newQuery);
    }
  }, 300);
});

const selectedAccountLabel = computed(() => {
  if (!toAccount.value) return 'Pilih rekening tujuan...';
  return toAccount.value.account_number;
});

const loadToAccount = async (accountId: number) => {
  try {
    const response = await accountService.show(accountId);
    toAccount.value = response.data;
  } catch (error: unknown) {
    console.error('Load to account error:', error);
    toAccount.value = null;
  }
};

const handleSubmit = form.handleSubmit(async (values) => {
  if (!account.value || !toAccountId.value) return;

  if (values.amount > account.value.balance || account.value.balance === 0) {
    errorMessage.value = 'Saldo tidak mencukupi untuk melakukan transfer';
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';
  try {
    await transactionService.transfer(Number(route.params.accountId), {
      to_account_id: toAccountId.value,
      amount: values.amount,
      description: values.description,
    });
    toast.success('Transfer berhasil', {
      description: `Transfer sebesar Rp ${values.amount.toLocaleString('id-ID')} berhasil dilakukan`,
    });
    // Wait a bit for toast to show before redirecting
    setTimeout(() => {
      router.push(`/dashboard/accounts/${route.params.accountId}`);
    }, 500);
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    const errorMsg = axiosError.response?.data?.message || 'Gagal melakukan transfer';
    errorMessage.value = errorMsg;
    toast.error('Gagal melakukan transfer', {
      description: errorMsg,
    });
  } finally {
    isLoading.value = false;
  }
});

const handleSelectChange = async (value: string) => {
  const accountId = Number(value);
  toAccountId.value = accountId;
  form.setFieldValue('to_account_id', accountId);
  // Load full account details with customer
  await loadToAccount(accountId);
};

const searchInputRef = ref<HTMLInputElement | null>(null);

const handleSelectOpenChange = async (open: boolean) => {
  isSelectOpen.value = open;
  if (open) {
    // Focus search input when select opens
    await nextTick();
    setTimeout(() => {
      const input = document.querySelector('.select-search-input') as HTMLInputElement;
      if (input) {
        input.focus();
      }
    }, 150);
    if (searchQuery.value.length >= 2) {
      searchAccounts(searchQuery.value);
    }
  } else {
    searchQuery.value = '';
    accounts.value = [];
  }
};

onMounted(() => {
  loadAccount();
});
</script>

<template>
  <div>
    <page-header title="Transfer">
      <Button variant="outline" @click="router.back()">
        <ArrowLeft class="mr-2 h-4 w-4" />
        Kembali
      </Button>
    </page-header>

    <div v-if="errorMessage" class="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
      {{ errorMessage }}
    </div>

    <div v-if="account" class="mt-4 grid gap-4 md:grid-cols-2">
      <!-- Form Transfer -->
      <Card>
        <CardHeader>
          <CardTitle>Transfer Antar Rekening</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="mb-4 space-y-2">
            <label class="text-sm font-medium text-muted-foreground">Rekening Asal</label>
            <p class="text-lg font-semibold">{{ account.account_number }}</p>
            <label class="text-sm font-medium text-muted-foreground">Saldo Saat Ini</label>
            <p class="text-xl font-bold">Rp {{ account.balance.toLocaleString('id-ID') }}</p>
          </div>

          <form @submit.prevent="handleSubmit" class="space-y-4">
          <FormField v-slot="{ componentField }" name="to_account_id">
            <FormItem>
              <FormLabel>Rekening Tujuan</FormLabel>
              <Select
                :model-value="toAccountId?.toString()"
                @update:model-value="handleSelectChange"
                @update:open="handleSelectOpenChange"
                :disabled="isLoading"
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih rekening tujuan..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <div class="px-2 py-1.5 border-b">
                    <div class="relative">
                      <Search class="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        ref="searchInputRef"
                        v-model="searchQuery"
                        placeholder="Cari nomor rekening..."
                        class="pl-8 h-9 select-search-input"
                        @input="() => { if (searchQuery.length >= 2) searchAccounts(searchQuery); }"
                        @keydown.enter.prevent
                      />
                    </div>
                  </div>
                  <div class="max-h-[300px] overflow-y-auto">
                    <div v-if="!isSearching && searchQuery.length < 2" class="px-2 py-6 text-center text-sm text-muted-foreground">
                      Ketik minimal 2 karakter untuk mencari...
                    </div>
                    <div v-else-if="isSearching" class="px-2 py-6 text-center text-sm text-muted-foreground">
                      Mencari...
                    </div>
                    <div v-else-if="accounts.length === 0" class="px-2 py-6 text-center text-sm text-muted-foreground">
                      Tidak ada rekening ditemukan
                    </div>
                    <template v-else>
                      <SelectItem
                        v-for="acc in accounts"
                        :key="acc.id"
                        :value="acc.id.toString()"
                      >
                        {{ acc.account_number }}
                      </SelectItem>
                    </template>
                  </div>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          </FormField>
          <FormField v-slot="{ componentField }" name="amount">
            <FormItem>
              <FormLabel>Jumlah Transfer</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Masukkan jumlah"
                  v-bind="componentField"
                  :disabled="isLoading"
                  :max="account.balance"
                  step="1"
                  min="1"
                />
              </FormControl>
              <FormMessage />
              <p v-if="account" class="text-xs text-muted-foreground">
                Maksimal: Rp {{ account.balance.toLocaleString('id-ID') }}
              </p>
            </FormItem>
          </FormField>
          <FormField v-slot="{ componentField }" name="description">
            <FormItem>
              <FormLabel>Keterangan (Opsional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Keterangan transfer"
                  v-bind="componentField"
                  :disabled="isLoading"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>
          <div class="flex gap-2">
            <Button type="submit" :disabled="isLoading" class="flex-1">
              {{ isLoading ? 'Memproses...' : 'Transfer' }}
            </Button>
            <Button type="button" variant="outline" @click="router.back()">
              Batal
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>

    <!-- Detail Pemilik Rekening Tujuan -->
    <Card v-if="toAccount">
      <CardHeader>
        <CardTitle>Detail Pemilik Rekening</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="space-y-4">
          <div>
            <label class="text-sm font-medium text-muted-foreground">Nomor Rekening</label>
            <p class="text-lg font-semibold">{{ toAccount.account_number }}</p>
          </div>
          <div v-if="toAccount.customer">
            <label class="text-sm font-medium text-muted-foreground">Nama Nasabah</label>
            <p class="text-base font-medium">{{ toAccount.customer.name || toAccount.customer.full_name || '-' }}</p>
          </div>
          <div v-if="toAccount.customer?.nik">
            <label class="text-sm font-medium text-muted-foreground">NIK</label>
            <p class="text-base">{{ toAccount.customer.nik }}</p>
          </div>
          <div v-if="toAccount.customer?.phone">
            <label class="text-sm font-medium text-muted-foreground">Telepon</label>
            <p class="text-base">{{ toAccount.customer.phone }}</p>
          </div>
          <div v-if="toAccount.customer?.address">
            <label class="text-sm font-medium text-muted-foreground">Alamat</label>
            <p class="text-base">{{ toAccount.customer.address }}</p>
          </div>
          <div>
            <label class="text-sm font-medium text-muted-foreground">Saldo Rekening</label>
            <p class="text-xl font-bold text-primary">Rp {{ toAccount.balance.toLocaleString('id-ID') }}</p>
          </div>
        </div>
      </CardContent>
    </Card>
    </div>
  </div>
</template>

