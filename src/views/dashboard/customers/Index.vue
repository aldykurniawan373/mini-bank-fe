<script setup lang="ts">
import { ref, h, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { customerService, type CustomerListParams } from '@/services/customer.service';
import type { Customer } from '@/types/customer';
import { useAuthStore } from '@/stores/auth';
import { toast } from 'vue-sonner';
import { MoreHorizontal, Plus, Eye, Pencil, Trash2, AlertTriangle } from 'lucide-vue-next';

const router = useRouter();
const authStore = useAuthStore();

// Form schema for create
const createFormSchema = toTypedSchema(z.object({
  name: z.string().min(1, 'Nama harus diisi'),
  nik: z.string().min(16, 'NIK harus 16 karakter').max(16, 'NIK harus 16 karakter'),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
}));

const createForm = useForm({
  validationSchema: createFormSchema,
});

// State
const customers = ref<Customer[]>([]);
const isLoading = ref(false);
const errorMessage = ref<string>('');
const searchQuery = ref('');
const currentPage = ref(1);
const perPage = ref(10);
const totalPages = ref(1);
const total = ref(0);

// Dialog states
const isDeleteDialogOpen = ref(false);
const isCreateDialogOpen = ref(false);
const selectedCustomer = ref<Customer | null>(null);

// Load customers
const loadCustomers = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const params: CustomerListParams = {
      page: currentPage.value,
      per_page: perPage.value,
      search: searchQuery.value || undefined,
      sort_by: 'created_at',
      sort_dir: 'desc',
    };

    const response = await customerService.list(params);
    customers.value = response.data;
    totalPages.value = response.meta.last_page;
    total.value = response.meta.total;
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    errorMessage.value = axiosError.response?.data?.message || 'Gagal memuat data nasabah';
  } finally {
    isLoading.value = false;
  }
};

// Search handler
const handleSearch = () => {
  currentPage.value = 1;
  loadCustomers();
};

// Navigate to detail page
const viewDetail = (customer: Customer) => {
  router.push(`/customers/${customer.id}`);
};

// Open delete confirmation dialog
const openDeleteDialog = (customer: Customer) => {
  if (!authStore.isPimpinan) {
    errorMessage.value = 'Hanya pimpinan yang dapat menghapus nasabah';
    return;
  }
  selectedCustomer.value = customer;
  isDeleteDialogOpen.value = true;
};

// Close delete dialog
const closeDeleteDialog = () => {
  isDeleteDialogOpen.value = false;
  selectedCustomer.value = null;
};


// Navigate to edit
const editCustomer = (customer: Customer) => {
  router.push(`/customers/${customer.id}/edit`);
};

// Open create dialog
const openCreateDialog = () => {
  createForm.resetForm();
  isCreateDialogOpen.value = true;
};

// Close create dialog
const closeCreateDialog = () => {
  isCreateDialogOpen.value = false;
  createForm.resetForm();
  errorMessage.value = '';
};

// Create customer
const handleCreate = createForm.handleSubmit(async (values) => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    await customerService.create({
      name: values.name,
      nik: values.nik,
      phone: values.phone || undefined,
      address: values.address || undefined,
    });
    toast.success('Nasabah berhasil dibuat', {
      description: `Nasabah ${values.name} telah ditambahkan ke sistem`,
    });
    closeCreateDialog();
    loadCustomers();
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

// Delete customer
const confirmDelete = async () => {
  if (!selectedCustomer.value) return;

  isLoading.value = true;
  errorMessage.value = '';
  try {
    await customerService.delete(selectedCustomer.value.id);
    toast.success('Nasabah berhasil dihapus', {
      description: `Data nasabah ${selectedCustomer.value.name} telah dihapus`,
    });
    closeDeleteDialog();
    loadCustomers();
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

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Columns
const columns: ColumnDef<Customer>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
  },
  {
    accessorKey: 'name',
    header: 'Nama',
  },
  {
    accessorKey: 'nik',
    header: 'NIK',
  },
  {
    accessorKey: 'phone',
    header: 'Telepon',
  },
  {
    accessorKey: 'address',
    header: 'Alamat',
    cell: ({ row }) => {
      const address = row.original.address;
      return address ? (address.length > 50 ? address.substring(0, 50) + '...' : address) : '-';
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Dibuat',
    cell: ({ row }) => {
      const date = new Date(row.original.created_at);
      return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    },
  },
  {
    id: 'actions',
    header: 'Aksi',
    cell: ({ row }) => {
      return h('div', { class: 'flex justify-end' }, [
        h(DropdownMenu, {}, {
          default: () => [
            h(DropdownMenuTrigger, { asChild: true }, {
              default: () => h(Button, {
                variant: 'ghost',
                class: 'h-8 w-8 p-0',
              }, {
                default: () => [
                  h('span', { class: 'sr-only' }, 'Open menu'),
                  h(MoreHorizontal, { class: 'h-4 w-4' }),
                ],
              }),
            }),
            h(DropdownMenuContent, { align: 'end' }, {
              default: () => [
                h(DropdownMenuItem, {
                  onClick: () => viewDetail(row.original),
                }, {
                  default: () => [
                    h(Eye, { class: 'mr-2 h-4 w-4' }),
                    'Lihat Detail',
                  ],
                }),
                h(DropdownMenuItem, {
                  onClick: () => editCustomer(row.original),
                  class: authStore.isAdmin ? '' : 'hidden',
                }, {
                  default: () => [
                    h(Pencil, { class: 'mr-2 h-4 w-4' }),
                    'Edit',
                  ],
                }),
                h(DropdownMenuItem, {
                  onClick: () => openDeleteDialog(row.original),
                  class: authStore.isPimpinan ? 'text-destructive focus:text-destructive' : 'hidden',
                }, {
                  default: () => [
                    h(Trash2, { class: 'mr-2 h-4 w-4' }),
                    'Hapus',
                  ],
                }),
              ],
            }),
          ],
        }),
      ]);
    },
  },
];

onMounted(() => {
  loadCustomers();
});
</script>

<template>
  <div>
    <page-header title="Nasabah">
      <div class="flex items-center gap-2">
        <Input
          v-model="searchQuery"
          placeholder="Cari nama, NIK, atau telepon..."
          class="w-[250px]"
          @keyup.enter="handleSearch"
        />
        <Button @click="handleSearch" :disabled="isLoading">
          Cari
        </Button>
        <Button v-if="authStore.isAdmin" @click="openCreateDialog" :disabled="isLoading">
          <Plus class="mr-2 h-4 w-4" />
          Tambah Nasabah
        </Button>
      </div>
    </page-header>

    <div v-if="errorMessage" class="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
      {{ errorMessage }}
    </div>

    <div class="mt-4">
      <DataTable :columns="columns" :data="customers" />
    </div>

    <div v-if="totalPages > 1" class="flex items-center justify-between mt-4">
      <div class="text-sm text-muted-foreground">
        Menampilkan {{ (currentPage - 1) * perPage + 1 }} sampai {{ Math.min(currentPage * perPage, total) }} dari {{ total }} nasabah
      </div>
      <div class="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          @click="currentPage--; loadCustomers()"
          :disabled="currentPage === 1 || isLoading"
        >
          Sebelumnya
        </Button>
        <Button
          variant="outline"
          size="sm"
          @click="currentPage++; loadCustomers()"
          :disabled="currentPage === totalPages || isLoading"
        >
          Selanjutnya
        </Button>
      </div>
    </div>

    <!-- Create Customer Dialog -->
    <Dialog v-model:open="isCreateDialogOpen">
      <DialogContent class="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Tambah Nasabah</DialogTitle>
          <DialogDescription>
            Tambahkan nasabah baru ke sistem
          </DialogDescription>
        </DialogHeader>
        <form @submit.prevent="handleCreate" class="space-y-4">
          <div v-if="errorMessage" class="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            {{ errorMessage }}
          </div>
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
          <DialogFooter>
            <Button type="button" variant="outline" @click="closeCreateDialog" :disabled="isLoading">
              Batal
            </Button>
            <Button type="submit" :disabled="isLoading">
              {{ isLoading ? 'Menyimpan...' : 'Simpan' }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <Dialog v-model:open="isDeleteDialogOpen">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2 text-destructive">
            <AlertTriangle class="h-5 w-5" />
            Konfirmasi Hapus
          </DialogTitle>
          <DialogDescription>
            Tindakan ini tidak dapat dibatalkan. Data nasabah akan dihapus secara permanen.
          </DialogDescription>
        </DialogHeader>
        <div v-if="selectedCustomer" class="py-4">
          <div class="p-4 bg-red-50 border border-red-200 rounded-md">
            <p class="text-sm font-medium text-red-900 mb-2">
              Apakah Anda yakin ingin menghapus nasabah berikut?
            </p>
            <div class="space-y-1 text-sm">
              <p><span class="font-medium">Nama:</span> {{ selectedCustomer.name }}</p>
              <p><span class="font-medium">NIK:</span> {{ selectedCustomer.nik || '-' }}</p>
              <p><span class="font-medium">Telepon:</span> {{ selectedCustomer.phone || '-' }}</p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="closeDeleteDialog" :disabled="isLoading">
            Batal
          </Button>
          <Button variant="destructive" @click="confirmDelete" :disabled="isLoading">
            <Trash2 class="mr-2 h-4 w-4" />
            {{ isLoading ? 'Menghapus...' : 'Hapus' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
