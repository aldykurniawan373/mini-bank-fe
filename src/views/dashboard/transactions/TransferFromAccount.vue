<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { transactionService } from '@/services/transaction.service';
import { accountService } from '@/services/account.service';
import type { Account } from '@/types/account';
import { useAuthStore } from '@/stores/auth';
import { toast } from 'vue-sonner';
import { ArrowLeft, Search, CheckCircle2, XCircle } from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

if (!authStore.isAdmin) {
  router.push('/transactions');
}

const accountId = Number(route.params.accountId);
if (!accountId) {
  router.push('/transactions');
}

const formSchema = toTypedSchema(z.object({
  to_account_id: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      return Number(val);
    },
    z.number({ required_error: 'Rekening tujuan harus dipilih' }).min(1, 'Rekening tujuan harus dipilih')
  ),
  amount: z.coerce.number({ required_error: 'Jumlah harus diisi' }).min(1, 'Jumlah harus lebih dari 0'),
  description: z.string().optional(),
}));

const form = useForm({
  validationSchema: formSchema,
  validateOnMount: false,
  validateOnBlur: false,
  validateOnChange: false,
});

const fromAccount = ref<Account | null>(null);
const toAccount = ref<Account | null>(null);
const isSearchModalOpen = ref(false);
const accountNumberSearch = ref('');
const isSearching = ref(false);
const searchError = ref<string>('');
const isLoading = ref(false);
const errorMessage = ref<string>('');

const loadFromAccount = async () => {
  isLoading.value = true;
  try {
    const response = await accountService.show(accountId);
    fromAccount.value = response.data;
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    errorMessage.value = axiosError.response?.data?.message || 'Gagal memuat data rekening';
    toast.error('Gagal memuat data rekening', {
      description: errorMessage.value,
    });
  } finally {
    isLoading.value = false;
  }
};

const searchAccount = async () => {
  const searchValue = accountNumberSearch.value.trim();
  
  if (!searchValue) {
    searchError.value = 'Masukkan nomor rekening';
    return;
  }

  if (searchValue.length < 3) {
    searchError.value = 'Masukkan minimal 3 karakter nomor rekening';
    return;
  }

  isSearching.value = true;
  searchError.value = '';
  
  try {
    const response = await accountService.search(searchValue, accountId);
    
    if (response.data.length === 0) {
      searchError.value = 'Rekening tidak ditemukan. Pastikan nomor rekening sudah benar dan lengkap.';
      toAccount.value = null;
      return;
    }

    const foundAccount = response.data.find(acc => 
      acc.account_number.toLowerCase() === searchValue.toLowerCase()
    );

    if (!foundAccount) {
      if (response.data.length === 1) {
        const singleResult = response.data[0];
        if (singleResult.account_number.toLowerCase().includes(searchValue.toLowerCase())) {
          searchError.value = `Ditemukan rekening ${singleResult.account_number}. Masukkan nomor rekening lengkap untuk memastikan.`;
          toAccount.value = null;
          return;
        }
      }
      searchError.value = 'Rekening tidak ditemukan. Pastikan nomor rekening sudah benar dan lengkap.';
      toAccount.value = null;
      return;
    }

    if (foundAccount.id === accountId) {
      searchError.value = 'Tidak dapat transfer ke rekening sendiri';
      toAccount.value = null;
      return;
    }

    toAccount.value = foundAccount;
    searchError.value = '';
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    searchError.value = axiosError.response?.data?.message || 'Gagal mencari rekening';
    toAccount.value = null;
  } finally {
    isSearching.value = false;
  }
};

const confirmToAccount = () => {
  if (!toAccount.value) return;
  
  form.setFieldValue('to_account_id', toAccount.value.id);
  isSearchModalOpen.value = false;
  accountNumberSearch.value = '';
  searchError.value = '';
};

const openSearchModal = () => {
  isSearchModalOpen.value = true;
  accountNumberSearch.value = '';
  searchError.value = '';
  toAccount.value = null;
};

const handleSubmit = form.handleSubmit(async (values) => {
  if (!fromAccount.value) return;

  if (values.amount > fromAccount.value.balance || fromAccount.value.balance === 0) {
    errorMessage.value = 'Saldo tidak mencukupi untuk melakukan transfer';
    toast.error('Gagal melakukan transfer', {
      description: errorMessage.value,
    });
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';
  try {
    await transactionService.transfer(accountId, {
      to_account_id: values.to_account_id,
      amount: values.amount,
      description: values.description,
    });
    toast.success('Transfer berhasil', {
      description: `Transfer sebesar Rp ${values.amount.toLocaleString('id-ID')} berhasil dilakukan`,
    });
    setTimeout(() => {
      router.push(`/customers/${fromAccount.value?.customer?.id || fromAccount.value?.customer_id}`);
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

onMounted(() => {
  loadFromAccount();
});
</script>

<template>
  <div>
    <page-header title="Transfer Antar Rekening">
      <Button variant="outline" @click="router.back()">
        <ArrowLeft class="mr-2 h-4 w-4" />
        Kembali
      </Button>
    </page-header>

    <div v-if="errorMessage" class="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
      {{ errorMessage }}
    </div>

    <div v-if="fromAccount" class="mt-4 grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Form Transfer</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="mb-4 space-y-2 p-3 bg-muted rounded-md">
            <label class="text-sm font-medium text-muted-foreground">Rekening Asal</label>
            <p class="text-lg font-semibold">{{ fromAccount.account_number }}</p>
            <label class="text-sm font-medium text-muted-foreground">Saldo Saat Ini</label>
            <p class="text-xl font-bold text-green-600">
              Rp {{ fromAccount.balance.toLocaleString('id-ID') }}
            </p>
          </div>

          <form @submit.prevent="handleSubmit" class="space-y-4">
            <FormField v-slot="{ componentField }" name="to_account_id">
              <FormItem>
                <FormLabel>Rekening Tujuan</FormLabel>
                <div class="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    class="w-full justify-start"
                    @click="openSearchModal"
                    :disabled="isLoading"
                  >
                    <Search class="mr-2 h-4 w-4" />
                    <span v-if="toAccount">
                      {{ toAccount.account_number }} - {{ toAccount.customer?.name || toAccount.customer?.full_name || 'Tidak diketahui' }}
                    </span>
                    <span v-else>Cari Rekening Tujuan</span>
                  </Button>
                  <FormMessage />
                </div>
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
                    :disabled="isLoading || !toAccount"
                    :max="fromAccount.balance"
                    step="1"
                    min="1"
                  />
                </FormControl>
                <FormMessage />
                <p class="text-xs text-muted-foreground">
                  Maksimal: Rp {{ fromAccount.balance.toLocaleString('id-ID') }}
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
              <Button type="submit" :disabled="isLoading || !toAccount" class="flex-1">
                {{ isLoading ? 'Memproses...' : 'Transfer' }}
              </Button>
              <Button type="button" variant="outline" @click="router.back()" :disabled="isLoading">
                Batal
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div class="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Detail Rekening Asal</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div>
              <label class="text-sm font-medium text-muted-foreground">Nomor Rekening</label>
              <p class="text-lg font-semibold">{{ fromAccount.account_number }}</p>
            </div>
            <div v-if="fromAccount.customer">
              <label class="text-sm font-medium text-muted-foreground">Nama Nasabah</label>
              <p class="text-lg">{{ fromAccount.customer.name || fromAccount.customer.full_name }}</p>
            </div>
            <div>
              <label class="text-sm font-medium text-muted-foreground">Saldo Saat Ini</label>
              <p class="text-2xl font-bold text-green-600">
                Rp {{ fromAccount.balance.toLocaleString('id-ID') }}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card v-if="toAccount">
          <CardHeader>
            <CardTitle>Detail Rekening Tujuan</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div>
              <label class="text-sm font-medium text-muted-foreground">Nomor Rekening</label>
              <p class="text-lg font-semibold">{{ toAccount.account_number }}</p>
            </div>
            <div v-if="toAccount.customer">
              <label class="text-sm font-medium text-muted-foreground">Nama Nasabah</label>
              <p class="text-lg">{{ toAccount.customer.name || toAccount.customer.full_name }}</p>
            </div>
            <div>
              <label class="text-sm font-medium text-muted-foreground">Saldo Rekening</label>
              <p class="text-2xl font-bold text-green-600">
                Rp {{ toAccount.balance.toLocaleString('id-ID') }}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <Dialog v-model:open="isSearchModalOpen">
      <DialogContent class="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Cari Rekening Tujuan</DialogTitle>
          <DialogDescription>
            Masukkan nomor rekening lengkap untuk mencari rekening tujuan
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-4">
          <div>
            <label class="text-sm font-medium mb-2 block">Nomor Rekening</label>
            <div class="flex gap-2">
              <Input
                v-model="accountNumberSearch"
                placeholder="Masukkan nomor rekening lengkap"
                @keyup.enter="searchAccount"
                :disabled="isSearching"
                class="flex-1"
              />
              <Button
                type="button"
                @click="searchAccount"
                :disabled="isSearching || !accountNumberSearch || accountNumberSearch.trim().length < 3"
              >
                <Search class="mr-2 h-4 w-4" />
                Cari
              </Button>
            </div>
            <p v-if="accountNumberSearch && accountNumberSearch.trim().length < 3" class="text-xs text-muted-foreground mt-1">
              Masukkan minimal 3 karakter
            </p>
          </div>

          <div v-if="searchError" class="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
            <XCircle class="h-4 w-4" />
            {{ searchError }}
          </div>

          <div v-if="toAccount && !searchError" class="p-4 border rounded-md bg-green-50 border-green-200">
            <div class="flex items-start gap-3">
              <CheckCircle2 class="h-5 w-5 text-green-600 mt-0.5" />
              <div class="flex-1 space-y-2">
                <p class="font-semibold text-green-900">Rekening Ditemukan</p>
                <div class="space-y-1">
                  <div>
                    <label class="text-xs font-medium text-muted-foreground">Nomor Rekening</label>
                    <p class="text-lg font-semibold">{{ toAccount.account_number }}</p>
                  </div>
                  <div v-if="toAccount.customer">
                    <label class="text-xs font-medium text-muted-foreground">Nama Nasabah</label>
                    <p class="text-base">{{ toAccount.customer.name || toAccount.customer.full_name }}</p>
                  </div>
                  <div>
                    <label class="text-xs font-medium text-muted-foreground">Saldo</label>
                    <p class="text-base">Rp {{ toAccount.balance.toLocaleString('id-ID') }}</p>
                  </div>
                </div>
                <p class="text-xs text-muted-foreground mt-2">
                  Pastikan informasi rekening tujuan sudah benar sebelum melanjutkan
                </p>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            @click="isSearchModalOpen = false"
            :disabled="isSearching"
          >
            Batal
          </Button>
          <Button
            type="button"
            @click="confirmToAccount"
            :disabled="!toAccount || isSearching"
          >
            Konfirmasi & Gunakan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

