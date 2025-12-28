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
import { ArrowLeft, Download } from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

if (!authStore.isAdmin) {
  router.push('/dashboard/home');
}

const formSchema = toTypedSchema(z.object({
  start_date: z.string().optional(),
  end_date: z.string().optional(),
}).refine((data) => {
  if (data.end_date && data.start_date) {
    return new Date(data.end_date) >= new Date(data.start_date);
  }
  return true;
}, {
  message: 'Tanggal akhir harus setelah tanggal mulai',
  path: ['end_date'],
}));

const form = useForm({
  validationSchema: formSchema,
});

const account = ref<Account | null>(null);
const isLoading = ref(false);
const errorMessage = ref<string>('');
const successMessage = ref<string>('');

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

const handleSubmit = form.handleSubmit(async (values) => {
  isLoading.value = true;
  errorMessage.value = '';
  successMessage.value = '';
  try {
    await transactionService.export(Number(route.params.accountId), {
      start_date: values.start_date,
      end_date: values.end_date,
    });
    successMessage.value = 'Proses ekspor sedang diproses. File akan tersedia di storage/app/public/exports setelah selesai.';
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    errorMessage.value = axiosError.response?.data?.message || 'Gagal melakukan ekspor';
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
    <page-header title="Ekspor Transaksi">
      <Button variant="outline" @click="router.back()">
        <ArrowLeft class="mr-2 h-4 w-4" />
        Kembali
      </Button>
    </page-header>

    <div v-if="errorMessage" class="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
      {{ errorMessage }}
    </div>

    <div v-if="successMessage" class="mb-4 p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
      {{ successMessage }}
    </div>

    <Card v-if="account" class="mt-4 max-w-md">
      <CardHeader>
        <CardTitle>Ekspor Data Transaksi</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="mb-4 space-y-2">
          <label class="text-sm font-medium text-muted-foreground">Nomor Rekening</label>
          <p class="text-lg font-semibold">{{ account.account_number }}</p>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <FormField v-slot="{ componentField }" name="start_date">
            <FormItem>
              <FormLabel>Tanggal Mulai (Opsional)</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  v-bind="componentField"
                  :disabled="isLoading"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>
          <FormField v-slot="{ componentField }" name="end_date">
            <FormItem>
              <FormLabel>Tanggal Akhir (Opsional)</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  v-bind="componentField"
                  :disabled="isLoading"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>
          <div class="flex gap-2">
            <Button type="submit" :disabled="isLoading" class="flex-1">
              <Download class="mr-2 h-4 w-4" />
              {{ isLoading ? 'Memproses...' : 'Ekspor' }}
            </Button>
            <Button type="button" variant="outline" @click="router.back()">
              Batal
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  </div>
</template>

