<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'vue-sonner';
import { customerService } from '@/services/customer.service';
import { useAuthStore } from '@/stores/auth';
import { ArrowLeft } from 'lucide-vue-next';

const router = useRouter();
const authStore = useAuthStore();

const formSchema = toTypedSchema(z.object({
  name: z.string().min(1, 'Nama harus diisi'),
  nik: z.string().min(16, 'NIK harus 16 karakter').max(16, 'NIK harus 16 karakter'),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
}));

const form = useForm({
  validationSchema: formSchema,
});

const isLoading = ref(false);
const errorMessage = ref<string>('');

const handleSubmit = form.handleSubmit(async (values) => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const response = await customerService.create({
      name: values.name,
      nik: values.nik,
      phone: values.phone || undefined,
      address: values.address || undefined,
    });
    toast.success('Nasabah berhasil dibuat', {
      description: `Nasabah ${values.name} telah ditambahkan ke sistem`,
    });
    router.push(`/customers/${response.data.id}`);
  } catch (error: unknown) {
    console.error('Create customer error:', error);
    const axiosError = error as { response?: { data?: { message?: string } } };
    const errorMsg = axiosError.response?.data?.message || 'Gagal membuat nasabah';
    errorMessage.value = errorMsg;
    toast.error('Gagal membuat nasabah', {
      description: errorMsg,
    });
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <div>
    <page-header title="Tambah Nasabah">
      <Button variant="outline" @click="router.push('/customers')">
        <ArrowLeft class="mr-2 h-4 w-4" />
        Kembali
      </Button>
    </page-header>

    <div v-if="errorMessage" class="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
      {{ errorMessage }}
    </div>

    <Card class="mt-4">
      <CardHeader>
        <CardTitle>Tambah Data Nasabah</CardTitle>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <FormField v-slot="{ componentField }" name="name">
            <FormItem>
              <FormLabel>Nama</FormLabel>
              <FormControl>
                <Input placeholder="Nama lengkap" v-bind="componentField" :disabled="isLoading" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>
          <FormField v-slot="{ componentField }" name="nik">
            <FormItem>
              <FormLabel>NIK</FormLabel>
              <FormControl>
                <Input placeholder="16 digit NIK" v-bind="componentField" :disabled="isLoading" maxlength="16" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>
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

