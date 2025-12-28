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
import { toast } from 'vue-sonner';
import { transactionService } from '@/services/transaction.service';
import { accountService } from '@/services/account.service';
import type { Account } from '@/types/account';
import { useAuthStore } from '@/stores/auth';
import { ArrowLeft } from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

if (!authStore.isAdmin) {
  router.push('/dashboard/home');
}

const formSchema = toTypedSchema(z.object({
  amount: z.coerce.number().min(1, 'Jumlah harus lebih dari 0'),
}));

const form = useForm({
  validationSchema: formSchema,
});

const account = ref<Account | null>(null);
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

const handleSubmit = form.handleSubmit(async (values) => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    await transactionService.deposit(Number(route.params.accountId), {
      amount: values.amount,
    });
    toast.success('Setoran berhasil', {
      description: `Setoran sebesar Rp ${values.amount.toLocaleString('id-ID')} berhasil dilakukan`,
    });
    // Wait a bit for toast to show before redirecting
    setTimeout(() => {
      router.push(`/dashboard/accounts/${route.params.accountId}`);
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
    <page-header title="Setoran">
      <Button variant="outline" @click="router.back()">
        <ArrowLeft class="mr-2 h-4 w-4" />
        Kembali
      </Button>
    </page-header>

    <div v-if="errorMessage" class="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
      {{ errorMessage }}
    </div>

    <Card v-if="account" class="mt-4 max-w-md">
      <CardHeader>
        <CardTitle>Setoran Tunai</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="mb-4 space-y-2">
          <label class="text-sm font-medium text-muted-foreground">Nomor Rekening</label>
          <p class="text-lg font-semibold">{{ account.account_number }}</p>
          <label class="text-sm font-medium text-muted-foreground">Saldo Saat Ini</label>
          <p class="text-xl font-bold">Rp {{ account.balance.toLocaleString('id-ID') }}</p>
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
            <Button type="button" variant="outline" @click="router.back()">
              Batal
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  </div>
</template>

