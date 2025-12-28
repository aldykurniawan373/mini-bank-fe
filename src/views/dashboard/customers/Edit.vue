<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'vue-sonner';
import { customerService } from '@/services/customer.service';
import type { Customer } from '@/types/customer';
import { useAuthStore } from '@/stores/auth';
import { ArrowLeft } from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

if (!authStore.isAdmin) {
  router.push('/customers');
}

const formSchema = toTypedSchema(z.object({
  full_name: z.string().min(1, 'Nama harus diisi'),
  phone: z.string().optional(),
  address: z.string().optional(),
}));

const form = useForm({
  validationSchema: formSchema,
});

const customer = ref<Customer | null>(null);
const isLoading = ref(false);
const errorMessage = ref<string>('');

const loadCustomer = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const response = await customerService.show(Number(route.params.id));
    customer.value = response.data;
    form.setValues({
      full_name: response.data.full_name,
      phone: response.data.phone || '',
      address: response.data.address || '',
    });
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    errorMessage.value = axiosError.response?.data?.message || 'Gagal memuat data nasabah';
  } finally {
    isLoading.value = false;
  }
};

const handleSubmit = form.handleSubmit(async (values) => {
  if (!customer.value) return;

  isLoading.value = true;
  errorMessage.value = '';
  try {
    await customerService.update(customer.value.id, {
      full_name: values.full_name,
      phone: values.phone,
      address: values.address,
    });
    toast.success('Nasabah berhasil diperbarui', {
      description: `Data nasabah ${values.full_name} telah diperbarui`,
    });
    router.push(`/customers/${customer.value.id}`);
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    const errorMsg = axiosError.response?.data?.message || 'Gagal memperbarui nasabah';
    errorMessage.value = errorMsg;
    toast.error('Gagal memperbarui nasabah', {
      description: errorMsg,
    });
  } finally {
    isLoading.value = false;
  }
});

onMounted(() => {
  loadCustomer();
});
</script>

<template>
  <div>
    <page-header title="Edit Nasabah">
      <Button variant="outline" @click="router.push('/customers')">
        <ArrowLeft class="mr-2 h-4 w-4" />
        Kembali
      </Button>
    </page-header>

    <div v-if="errorMessage" class="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
      {{ errorMessage }}
    </div>

    <Card v-if="customer" class="mt-4">
      <CardHeader>
        <CardTitle>Edit Data Nasabah</CardTitle>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <FormField v-slot="{ componentField }" name="full_name">
            <FormItem>
              <FormLabel>Nama</FormLabel>
              <FormControl>
                <Input placeholder="Nama lengkap" v-bind="componentField" :disabled="isLoading" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>
          <div class="space-y-2">
            <Label>NIK</Label>
            <Input :value="customer.nik || ''" disabled />
            <p class="text-xs text-muted-foreground">NIK tidak dapat diubah</p>
          </div>
          <FormField v-slot="{ componentField }" name="phone">
            <FormItem>
              <FormLabel>Telepon</FormLabel>
              <FormControl>
                <Input placeholder="Nomor telepon" v-bind="componentField" :disabled="isLoading" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>
          <FormField v-slot="{ componentField }" name="address">
            <FormItem>
              <FormLabel>Alamat</FormLabel>
              <FormControl>
                <Input placeholder="Alamat lengkap" v-bind="componentField" :disabled="isLoading" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>
          <div class="flex gap-2">
            <Button type="submit" :disabled="isLoading">
              {{ isLoading ? 'Menyimpan...' : 'Simpan' }}
            </Button>
            <Button type="button" variant="outline" @click="router.push('/customers')">
              Batal
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  </div>
</template>

