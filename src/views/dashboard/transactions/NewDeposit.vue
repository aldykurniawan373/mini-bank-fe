<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { transactionService } from '@/services/transaction.service';
import { accountService } from '@/services/account.service';
import type { Account } from '@/types/account';
import { useAuthStore } from '@/stores/auth';
import { toast } from 'vue-sonner';
import { ArrowLeft, Search } from 'lucide-vue-next';

const router = useRouter();
const authStore = useAuthStore();

if (!authStore.isAdmin) {
  router.push('/transactions');
}

const formSchema = toTypedSchema(z.object({
  account_id: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      return Number(val);
    },
    z.number({ required_error: 'Rekening harus dipilih' }).min(1, 'Rekening harus dipilih')
  ),
  amount: z.coerce.number({ required_error: 'Jumlah harus diisi' }).min(1, 'Jumlah harus lebih dari 0'),
}));

const form = useForm({
  validationSchema: formSchema,
  validateOnMount: false,
  validateOnBlur: false,
  validateOnChange: false,
});

const accounts = ref<Account[]>([]);
const accountSearch = ref('');
const isLoading = ref(false);
const errorMessage = ref<string>('');

const filteredAccounts = computed(() => {
  if (accountSearch.value.length < 2) {
    return accounts.value;
  }
  const search = accountSearch.value.toLowerCase();
  return accounts.value.filter(acc => 
    acc.account_number.toLowerCase().includes(search) ||
    acc.customer?.name?.toLowerCase().includes(search) ||
    acc.customer?.full_name?.toLowerCase().includes(search)
  );
});

const selectedAccount = computed(() => {
  const accountId = form.values.account_id;
  return accountId ? accounts.value.find(a => a.id === accountId) : null;
});

const loadAccounts = async () => {
  try {
    const response = await accountService.list({ per_page: 100 });
    const uniqueAccounts = response.data.filter((acc, index, self) => 
      index === self.findIndex(a => a.id === acc.id)
    );
    accounts.value = uniqueAccounts;
  } catch (error) {
    console.error('Load accounts error:', error);
  }
};

const handleSubmit = form.handleSubmit(async (values) => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    await transactionService.deposit(values.account_id, {
      amount: values.amount,
    });
    toast.success('Setoran berhasil', {
      description: `Setoran sebesar Rp ${values.amount.toLocaleString('id-ID')} berhasil dilakukan`,
    });
    setTimeout(() => {
      router.push('/transactions');
    }, 500);
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    const errorMsg = axiosError.response?.data?.message || 'Gagal melakukan setoran';
    errorMessage.value = errorMsg;
    toast.error('Gagal melakukan setoran', {
      description: errorMsg,
    });
  } finally {
    isLoading.value = false;
  }
});

onMounted(() => {
  loadAccounts();
});
</script>

<template>
  <div>
    <page-header title="Setoran Tunai">
      <Button variant="outline" @click="router.push('/transactions')">
        <ArrowLeft class="mr-2 h-4 w-4" />
        Kembali
      </Button>
    </page-header>

    <div v-if="errorMessage" class="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
      {{ errorMessage }}
    </div>

    <div class="mt-4 grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Form Setoran</CardTitle>
        </CardHeader>
        <CardContent>
          <form @submit.prevent="handleSubmit" class="space-y-4">
            <FormField v-slot="{ componentField, handleChange }" name="account_id">
              <FormItem>
                <FormLabel>Rekening</FormLabel>
                <Select
                  :model-value="form.values.account_id?.toString() || undefined"
                  @update:model-value="(val) => { 
                    if (val) {
                      const numVal = Number(val);
                      form.setFieldValue('account_id', numVal);
                      handleChange(numVal);
                    } else {
                      form.setFieldValue('account_id', undefined);
                      handleChange(undefined);
                    }
                  }"
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih rekening..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <div class="px-2 py-1.5 border-b">
                      <div class="relative">
                        <Search class="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          v-model="accountSearch"
                          placeholder="Cari nomor rekening..."
                          class="pl-8 h-9"
                          @keydown.enter.prevent
                        />
                      </div>
                    </div>
                    <div class="max-h-[300px] overflow-y-auto">
                      <div v-if="filteredAccounts.length === 0" class="px-2 py-6 text-center text-sm text-muted-foreground">
                        Tidak ada rekening ditemukan
                      </div>
                      <template v-else>
                        <SelectItem
                          v-for="acc in filteredAccounts"
                          :key="acc.id"
                          :value="acc.id.toString()"
                        >
                          <div class="flex flex-col">
                            <span class="font-medium">{{ acc.account_number }}</span>
                            <span class="text-xs text-muted-foreground">{{ acc.customer?.name || acc.customer?.full_name || 'Tidak diketahui' }}</span>
                          </div>
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
                <FormLabel>Jumlah Setoran</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Masukkan jumlah"
                    v-bind="componentField"
                    :disabled="isLoading"
                    step="1"
                    min="1"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>
            <div class="flex gap-2">
              <Button type="submit" :disabled="isLoading" class="flex-1">
                {{ isLoading ? 'Memproses...' : 'Setor' }}
              </Button>
              <Button type="button" variant="outline" @click="router.push('/transactions')" :disabled="isLoading">
                Batal
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card v-if="selectedAccount">
        <CardHeader>
          <CardTitle>Detail Rekening</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div>
            <label class="text-sm font-medium text-muted-foreground">Nomor Rekening</label>
            <p class="text-lg font-semibold">{{ selectedAccount.account_number }}</p>
          </div>
          <div v-if="selectedAccount.customer">
            <label class="text-sm font-medium text-muted-foreground">Nama Nasabah</label>
            <p class="text-lg">{{ selectedAccount.customer.name || selectedAccount.customer.full_name }}</p>
          </div>
          <div>
            <label class="text-sm font-medium text-muted-foreground">Saldo Saat Ini</label>
            <p class="text-2xl font-bold text-green-600">
              Rp {{ selectedAccount.balance.toLocaleString('id-ID') }}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

