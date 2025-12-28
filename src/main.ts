import './assets/css/main.css';
import 'vue-sonner/style.css';

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import VueFeather from 'vue-feather';
import PageHeaderVue from './components/ui/PageHeader.vue';
import Icon from '@/components/ui/Icon.vue';

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'

const app = createApp(App)
const pinia = createPinia()

app.component(VueFeather.name, VueFeather);
app.component('PageHeader', PageHeaderVue);
app.component('Icon', Icon);
app.use(pinia)
app.use(router)

// Initialize auth store
const authStore = useAuthStore();
authStore.initAuth().catch((error) => {
  console.error('Error initializing auth:', error);
});

app.mount('#app')
