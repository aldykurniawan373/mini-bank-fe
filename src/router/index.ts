import { createRouter, createWebHistory, type RouteMeta } from 'vue-router'
import DashboardLayoutVue from '@/layouts/dashboard.vue';
import { useAuthStore } from '@/stores/auth';

interface IRouteMeta {
  title: string
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/dashboard/home',
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/Login.vue'),
      meta: {
        title: 'Login',
      } as RouteMeta & IRouteMeta,
    },
    {
      path: '/customers',
      component: DashboardLayoutVue,
      children: [
        {
          path: '',
          name: 'customers_index',
          component: () => import('@/views/dashboard/customers/Index.vue'),
          meta: {
            title: 'Nasabah',
          } as RouteMeta & IRouteMeta
        },
        {
          path: 'create',
          name: 'customers_create',
          component: () => import('@/views/dashboard/customers/Create.vue'),
          meta: {
            title: 'Tambah Nasabah',
            requiresRole: 'admin',
          } as RouteMeta & IRouteMeta
        },
        {
          path: ':id',
          name: 'customers_show',
          component: () => import('@/views/dashboard/customers/Show.vue'),
          meta: {
            title: 'Detail Nasabah',
          } as RouteMeta & IRouteMeta
        },
        {
          path: ':id/edit',
          name: 'customers_edit',
          component: () => import('@/views/dashboard/customers/Edit.vue'),
          meta: {
            title: 'Edit Nasabah',
            requiresRole: 'admin',
          } as RouteMeta & IRouteMeta
        },
      ],
    },
    {
      path: '/dashboard',
      component: DashboardLayoutVue,
      redirect: '/dashboard/home',
      meta: {
        title: 'Dashboard',
      },
      children: [
        {
          path: 'home',
          name: 'home',
          component: () => import('@/views/dashboard/examples/Home.vue'),
          meta: {
            title: 'Home',
          } as RouteMeta & IRouteMeta
        },
        {
          path: 'profile',
          name: 'profile',
          component: () => import('@/views/dashboard/profile/Index.vue'),
          meta: {
            title: 'Profile',
          } as RouteMeta & IRouteMeta
        },
        {
          path: 'users',
          name: 'users_index',
          component: () => import('@/views/dashboard/users/Index.vue'),
          meta: {
            title: 'Users',
            requiresRole: 'pimpinan',
          } as RouteMeta & IRouteMeta
        },
        {
          path: 'accounts/:id',
          name: 'accounts_show',
          component: () => import('@/views/dashboard/accounts/Show.vue'),
          meta: {
            title: 'Detail Rekening',
          } as RouteMeta & IRouteMeta
        },
      ],
    },
    {
      path: '/transactions',
      component: DashboardLayoutVue,
      children: [
        {
          path: '',
          name: 'transactions_index',
          component: () => import('@/views/dashboard/transactions/Index.vue'),
          meta: {
            title: 'Transaksi',
          } as RouteMeta & IRouteMeta
        },
        {
          path: 'new/deposit',
          name: 'transactions_new_deposit',
          component: () => import('@/views/dashboard/transactions/NewDeposit.vue'),
          meta: {
            title: 'Setoran',
            requiresRole: 'admin',
          } as RouteMeta & IRouteMeta
        },
        {
          path: 'new/withdraw',
          name: 'transactions_new_withdraw',
          component: () => import('@/views/dashboard/transactions/NewWithdraw.vue'),
          meta: {
            title: 'Penarikan',
            requiresRole: 'admin',
          } as RouteMeta & IRouteMeta
        },
        {
          path: 'new/transfer',
          name: 'transactions_new_transfer',
          component: () => import('@/views/dashboard/transactions/NewTransfer.vue'),
          meta: {
            title: 'Transfer',
            requiresRole: 'admin',
          } as RouteMeta & IRouteMeta
        },
        {
          path: 'from-account/:accountId/deposit',
          name: 'transactions_deposit_from_account',
          component: () => import('@/views/dashboard/transactions/DepositFromAccount.vue'),
          meta: {
            title: 'Setoran',
            requiresRole: 'admin',
          } as RouteMeta & IRouteMeta
        },
        {
          path: 'from-account/:accountId/withdraw',
          name: 'transactions_withdraw_from_account',
          component: () => import('@/views/dashboard/transactions/WithdrawFromAccount.vue'),
          meta: {
            title: 'Penarikan',
            requiresRole: 'admin',
          } as RouteMeta & IRouteMeta
        },
        {
          path: 'from-account/:accountId/transfer',
          name: 'transactions_transfer_from_account',
          component: () => import('@/views/dashboard/transactions/TransferFromAccount.vue'),
          meta: {
            title: 'Transfer',
            requiresRole: 'admin',
          } as RouteMeta & IRouteMeta
        },
        {
          path: ':accountId/balance',
          name: 'transactions_balance',
          component: () => import('@/views/dashboard/transactions/Balance.vue'),
          meta: {
            title: 'Cek Saldo',
          } as RouteMeta & IRouteMeta
        },
        {
          path: ':accountId/history',
          name: 'transactions_history',
          component: () => import('@/views/dashboard/transactions/History.vue'),
          meta: {
            title: 'Riwayat Transaksi',
          } as RouteMeta & IRouteMeta
        },
        {
          path: ':accountId/deposit',
          name: 'transactions_deposit',
          component: () => import('@/views/dashboard/transactions/Deposit.vue'),
          meta: {
            title: 'Setoran',
            requiresRole: 'admin',
          } as RouteMeta & IRouteMeta
        },
        {
          path: ':accountId/withdraw',
          name: 'transactions_withdraw',
          component: () => import('@/views/dashboard/transactions/Withdraw.vue'),
          meta: {
            title: 'Penarikan',
            requiresRole: 'admin',
          } as RouteMeta & IRouteMeta
        },
        {
          path: ':accountId/transfer',
          name: 'transactions_transfer',
          component: () => import('@/views/dashboard/transactions/Transfer.vue'),
          meta: {
            title: 'Transfer',
            requiresRole: 'admin',
          } as RouteMeta & IRouteMeta
        },
        {
          path: ':accountId/export',
          name: 'transactions_export',
          component: () => import('@/views/dashboard/transactions/Export.vue'),
          meta: {
            title: 'Ekspor Transaksi',
            requiresRole: 'admin',
          } as RouteMeta & IRouteMeta
        },
      ],
    },
    {
      path: '/:pathMatch(.*)',
      name: 'not-found',
      component: () => import('@/views/404.vue'),
      meta: {
        title: 'Page Not Found',
      } as RouteMeta & IRouteMeta,
    },
  ]
});

router.beforeEach((to, from, next) => {
  document.title = to.meta.title as string;
  
  const authStore = useAuthStore();
  
  // Check if route requires authentication
  const requiresAuth = to.path !== '/login' && to.path !== '/404' && !to.path.startsWith('/:pathMatch');
  
  if (requiresAuth && !authStore.isAuthenticated) {
    // Redirect to login if not authenticated
    next('/login');
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    // Redirect to dashboard if already logged in
    next('/dashboard/home');
  } else {
    // Check role-based access
    const requiresRole = to.meta.requiresRole as string | undefined;
    if (requiresRole) {
      if (requiresRole === 'pimpinan' && !authStore.isPimpinan) {
        next('/dashboard/home'); // Redirect if not authorized
        return;
      }
      if (requiresRole === 'admin' && !authStore.isAdmin) {
        next('/dashboard/home'); // Redirect if not authorized
        return;
      }
    }
    next();
  }
})

export default router
