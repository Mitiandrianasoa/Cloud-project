import { createRouter, createWebHistory } from '@ionic/vue-router';
import HomePage from '../views/HomePage.vue';
import ReportPage from '@/views/ReportPage.vue';

const routes = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/home',
    name: 'Home',
    component: HomePage,
  },
   {
    path: '/report',
    name: 'Report',
    component: ReportPage,
  },
  {
    path: '/reports',
    name: 'Reports',
    component: ()=> import('../views/ReportList.vue'),
  },

];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

export default router;
