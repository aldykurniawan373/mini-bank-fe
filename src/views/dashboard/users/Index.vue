<script setup lang="ts">
import { ref, h, computed, onMounted } from 'vue';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'vue-sonner';
import { userService, type UserListParams } from '@/services/user.service';
import type { User } from '@/types/user';
import { useAuthStore } from '@/stores/auth';
import { MoreHorizontal, Plus, Pencil, Trash2 } from 'lucide-vue-next';
import type { Component } from 'vue';

const authStore = useAuthStore();

// Check permission - hanya pimpinan
if (!authStore.isPimpinan) {
  // Redirect atau show error
}

// Form schema
const createSchema = toTypedSchema(z.object({
  name: z.string().min(1, 'Nama harus diisi'),
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
}));

const updateSchema = toTypedSchema(z.object({
  name: z.string().min(1, 'Nama harus diisi'),
}));

// State
const users = ref<User[]>([]);
const isLoading = ref(false);
const isDialogOpen = ref(false);
const isEditMode = ref(false);
const selectedUser = ref<User | null>(null);
const errorMessage = ref<string>('');
const searchQuery = ref('');
const roleFilter = ref<'admin' | 'pimpinan' | ''>('');
const currentPage = ref(1);
const perPage = ref(10);
const totalPages = ref(1);
const total = ref(0);

// Form
const createForm = useForm({
  validationSchema: createSchema,
});

const updateForm = useForm({
  validationSchema: updateSchema,
});


// Load users
const loadUsers = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const params: UserListParams = {
      page: currentPage.value,
      per_page: perPage.value,
      search: searchQuery.value || undefined,
      role: roleFilter.value || undefined,
      sort_by: 'created_at',
      sort_dir: 'desc',
    };

    const response = await userService.list(params);
    users.value = response.data;
    totalPages.value = response.meta.last_page;
    total.value = response.meta.total;
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    errorMessage.value = axiosError.response?.data?.message || 'Gagal memuat data users';
  } finally {
    isLoading.value = false;
  }
};

// Search handler
const handleSearch = () => {
  currentPage.value = 1;
  loadUsers();
};

// Open create dialog
const openCreateDialog = () => {
  isEditMode.value = false;
  selectedUser.value = null;
  createForm.resetForm();
  isDialogOpen.value = true;
};

// Open edit dialog
const openEditDialog = (user: User) => {
  isEditMode.value = true;
  selectedUser.value = user;
  updateForm.setValues({
    name: user.name,
  });
  isDialogOpen.value = true;
};

// Close dialog
const closeDialog = () => {
  isDialogOpen.value = false;
  isEditMode.value = false;
  selectedUser.value = null;
  createForm.resetForm();
  updateForm.resetForm();
};

// Create user
const handleCreate = async (values: any) => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    await userService.create({
      name: values.name,
      email: values.email,
      password: values.password,
    });
    toast.success('User berhasil dibuat', {
      description: `User ${values.name} telah ditambahkan ke sistem`,
    });
    closeDialog();
    loadUsers();
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    const errorMsg = axiosError.response?.data?.message || 'Gagal membuat user';
    errorMessage.value = errorMsg;
    toast.error('Gagal membuat user', {
      description: errorMsg,
    });
  } finally {
    isLoading.value = false;
  }
};

// Update user
const handleUpdate = async (values: any) => {
  if (!selectedUser.value) return;

  isLoading.value = true;
  errorMessage.value = '';
  try {
    await userService.update(selectedUser.value.id, {
      name: values.name,
      email: selectedUser.value.email,
    });
    toast.success('User berhasil diperbarui', {
      description: `Data user ${values.name} telah diperbarui`,
    });
    closeDialog();
    loadUsers();
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    const errorMsg = axiosError.response?.data?.message || 'Gagal memperbarui user';
    errorMessage.value = errorMsg;
    toast.error('Gagal memperbarui user', {
      description: errorMsg,
    });
  } finally {
    isLoading.value = false;
  }
};

// Delete user
const handleDelete = async (user: User) => {
  if (!confirm(`Apakah Anda yakin ingin menghapus user ${user.name}?`)) {
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';
  try {
    await userService.delete(user.id);
    toast.success('User berhasil dihapus', {
      description: `User ${user.name} telah dihapus dari sistem`,
    });
    loadUsers();
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    const errorMsg = axiosError.response?.data?.message || 'Gagal menghapus user';
    errorMessage.value = errorMsg;
    toast.error('Gagal menghapus user', {
      description: errorMsg,
    });
  } finally {
    isLoading.value = false;
  }
};

// Columns
const columns: ColumnDef<User>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
  },
  {
    accessorKey: 'name',
    header: 'Nama',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => {
      const role = row.original.role;
      return h(Badge, {
        variant: role === 'admin' ? 'default' : 'secondary',
      }, () => role === 'admin' ? 'Admin' : 'Pimpinan');
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
                default: () => h('span', { class: 'sr-only' }, 'Open menu'),
                icon: () => h(MoreHorizontal, { class: 'h-4 w-4' }),
              }),
            }),
            h(DropdownMenuContent, { align: 'end' }, {
              default: () => [
                h(DropdownMenuItem, {
                  onClick: () => openEditDialog(row.original),
                }, {
                  default: () => [
                    h(Pencil, { class: 'mr-2 h-4 w-4' }),
                    'Edit',
                  ],
                }),
                h(DropdownMenuItem, {
                  onClick: () => handleDelete(row.original),
                  class: 'text-destructive',
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
  loadUsers();
});
</script>

<template>
  <div>
    <page-header title="Users">
      <div class="flex items-center gap-2">
        <Input
          v-model="searchQuery"
          placeholder="Cari nama atau email..."
          class="w-[250px]"
          @keyup.enter="handleSearch"
        />
        <select
          v-model="roleFilter"
          class="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          @change="handleSearch"
        >
          <option value="">Semua Role</option>
          <option value="admin">Admin</option>
          <option value="pimpinan">Pimpinan</option>
        </select>
        <Button @click="handleSearch" :disabled="isLoading">
          Cari
        </Button>
        <Dialog v-model:open="isDialogOpen">
          <DialogTrigger as-child>
            <Button @click="openCreateDialog" :disabled="isLoading">
              <Plus class="mr-2 h-4 w-4" />
              Tambah User
            </Button>
          </DialogTrigger>
          <DialogContent class="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{{ isEditMode ? 'Edit User' : 'Tambah User' }}</DialogTitle>
              <DialogDescription>
                {{ isEditMode ? 'Ubah informasi user' : 'Tambahkan user baru ke sistem' }}
              </DialogDescription>
            </DialogHeader>
            <div v-if="errorMessage" class="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {{ errorMessage }}
            </div>
            <Form v-if="!isEditMode" :validation-schema="createSchema" @submit="handleCreate">
              <div class="grid gap-4 py-4">
                <FormField v-slot="{ componentField }" name="name">
                  <FormItem>
                    <FormLabel>Nama</FormLabel>
                    <FormControl>
                      <Input placeholder="Nama lengkap" v-bind="componentField" :disabled="isLoading" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="email">
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@example.com" v-bind="componentField" :disabled="isLoading" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="password">
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Minimal 6 karakter" v-bind="componentField" :disabled="isLoading" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" @click="closeDialog" :disabled="isLoading">
                  Batal
                </Button>
                <Button type="submit" :disabled="isLoading">
                  {{ isLoading ? 'Menyimpan...' : 'Tambah' }}
                </Button>
              </DialogFooter>
            </Form>
            <Form v-else :validation-schema="updateSchema" @submit="handleUpdate">
              <div class="grid gap-4 py-4">
                <FormField v-slot="{ componentField }" name="name">
                  <FormItem>
                    <FormLabel>Nama</FormLabel>
                    <FormControl>
                      <Input placeholder="Nama lengkap" v-bind="componentField" :disabled="isLoading" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
                <div class="space-y-2">
                  <Label>Email</Label>
                  <Input :value="selectedUser?.email" disabled />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" @click="closeDialog" :disabled="isLoading">
                  Batal
                </Button>
                <Button type="submit" :disabled="isLoading">
                  {{ isLoading ? 'Menyimpan...' : 'Simpan' }}
                </Button>
              </DialogFooter>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </page-header>

    <div v-if="errorMessage && !isDialogOpen" class="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
      {{ errorMessage }}
    </div>

    <div class="mt-4">
      <DataTable :columns="columns" :data="users" />
    </div>

    <div v-if="totalPages > 1" class="flex items-center justify-between mt-4">
      <div class="text-sm text-muted-foreground">
        Menampilkan {{ (currentPage - 1) * perPage + 1 }} sampai {{ Math.min(currentPage * perPage, total) }} dari {{ total }} user
      </div>
      <div class="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          @click="currentPage--; loadUsers()"
          :disabled="currentPage === 1 || isLoading"
        >
          Sebelumnya
        </Button>
        <Button
          variant="outline"
          size="sm"
          @click="currentPage++; loadUsers()"
          :disabled="currentPage === totalPages || isLoading"
        >
          Selanjutnya
        </Button>
      </div>
    </div>
  </div>
</template>

