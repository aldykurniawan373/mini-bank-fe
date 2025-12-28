<script setup lang="ts">
import { ref } from 'vue';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { FormControl, FormField, FormLabel, FormItem, FormMessage } from '@/components/ui/form';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

const formSchema = toTypedSchema(z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(1, 'Password harus diisi'),
}));

const form = useForm({
  validationSchema: formSchema,
});

const errorMessage = ref<string>('');
const rememberMe = ref<boolean>(false);

const onSubmit = form.handleSubmit(async (values) => {
  errorMessage.value = '';
  try {
    await authStore.login({
      email: values.email,
      password: values.password,
    });
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Login gagal. Silakan coba lagi.';
  }
});
</script>

<template>
  <main class="h-screen w-screen flex items-center justify-center">
    <Card class="max-w-[320px] md:max-w-[400px] w-full">
      <CardHeader>
        <CardTitle class="text-center">Login</CardTitle>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="onSubmit">
          <div v-if="errorMessage" class="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            {{ errorMessage }}
          </div>
          <FormField v-slot="{ componentField }" name="email">
            <FormItem class="mb-4">
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="example@mail.com" v-bind="componentField" :disabled="authStore.isLoading" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>
          <FormField v-slot="{ componentField }" name="password">
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Masukkan password" v-bind="componentField" :disabled="authStore.isLoading" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>
          <div class="flex items-center space-x-2 mt-4">
            <Checkbox id="remember" v-model:checked="rememberMe" :disabled="authStore.isLoading" />
            <Label for="remember">Remember Me</Label>
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <div class="w-full">
          <Button 
            class="w-full" 
            type="submit" 
            @click="onSubmit"
            :disabled="authStore.isLoading"
          >
            <span v-if="authStore.isLoading">Memproses...</span>
            <span v-else>Login</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  </main>
</template>