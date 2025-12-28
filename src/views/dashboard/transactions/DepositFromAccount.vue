<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { transactionService } from '@/services/transaction.service';
import { accountService } from '@/services/account.service';
import type { Account } from '@/types/account';
import { useAuthStore } from '@/stores/auth';
import { toast } from 'vue-sonner';
import { ArrowLeft } from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

if (!authStore.isAdmin) {
  router.push('/customers');
}

const accountId = Number(route.params.accountId);
if (!accountId) {
  router.push('/customers');
}

const formSchema = toTypedSchema(z.object({
  amount: z.coerce.number({ required_error: 'Jumlah harus diisi' }).min(1, 'Jumlah harus lebih dari 0'),
}));

const form = useForm({
  validationSchema: formSchema,
  validateOnMount: false,
  validateOnBlur: false,
  validateOnChange: false,
});

const account = ref<Account | null>(null);
const isLoading = ref(false);
const errorMessage = ref<string>('');

const loadAccount = async () => {
  isLoading.value = true;
  try {
    const response = await accountService.show(accountId);
    account.value = response.data;
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

const handleSubmit = form.handleSubmit(async (values) => {
  if (!account.value) return;

  isLoading.value = true;
  errorMessage.value = '';
  try {
    await transactionService.deposit(accountId, {
      amount: values.amount,
    });
    toast.success('Setoran berhasil', {
      description: `Setoran sebesar Rp ${values.amount.toLocaleString('id-ID')} berhasil dilakukan`,
    });
    setTimeout(() => {
      router.push(`/customers/${account.value?.customer?.id || account.value?.customer_id}`);
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
  loadAccount();
});
</script>

<template>
  <div>
    <page-header title="Setoran Tunai">
      <Button variant="outline" @click="router.back()">
        <ArrowLeft class="mr-2 h-4 w-4" />
        Kembali
      </Button>
    </page-header>

    <div v-if="errorMessage" class="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
      {{ errorMessage }}
    </div>

    <div v-if="account" class="mt-4 grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Form Setoran</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="mb-4 space-y-2 p-3 bg-muted rounded-md">
            <label class="text-sm font-medium text-muted-foreground">Rekening</label>
            <p class="text-lg font-semibold">{{ account.account_number }}</p>
            <label class="text-sm font-medium text-muted-foreground">Saldo Saat Ini</label>
            <p class="text-xl font-bold text-green-600">
              Rp {{ account.balance.toLocaleString('id-ID') }}
            </p>
          </div>

          <form @submit.prevent="handleSubmit" class="space-y-4">
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
              <Button type="button" variant="outline" @click="router.back()" :disabled="isLoading">
                Batal
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detail Rekening</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div>
            <label class="text-sm font-medium text-muted-foreground">Nomor Rekening</label>
            <p class="text-lg font-semibold">{{ account.account_number }}</p>
          </div>
          <div v-if="account.customer">
            <label class="text-sm font-medium text-muted-foreground">Nama Nasabah</label>
            <p class="text-lg">{{ account.customer.name || account.customer.full_name }}</p>
          </div>
          <div>
            <label class="text-sm font-medium text-muted-foreground">Saldo Saat Ini</label>
            <p class="text-2xl font-bold text-green-600">
              Rp {{ account.balance.toLocaleString('id-ID') }}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

