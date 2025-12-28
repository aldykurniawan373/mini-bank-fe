interface IDashboardMenus {
  title: string
  icon: string
  path: string
  description?: string
  hidden?: boolean
}

export const SIDEBAR_EXPAND_WIDTH = 280;
export const SIDEBAR_COLLAPSED_WIDTH = 72;
export const APP_MENU: Record<string, { name: string, routes: IDashboardMenus[] }> = {
  main: {
    name: 'Menu Utama',
    routes: [
      {
        title: 'Dashboard',
        icon: 'LayoutDashboard',
        path: 'home',
      },
      {
        title: 'Nasabah',
        icon: 'Users',
        path: '/customers',
        description: 'Kelola data nasabah'
      },
    ],
  },
  management: {
    name: 'Manajemen',
    routes: [
      {
        path: 'users',
        title: 'Users',
        icon: 'UserCog',
        description: 'Kelola user (Pimpinan)',
        hidden: false, // Will be filtered by role in component
      },
    ],
  },
};

export const globalSearch = {

};
