import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import Login from '../views/Login.vue';
import Register from '../views/Register.vue';
import Map from '../views/Map.vue';
import Reports from '../views/Reports.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/register',
    name: 'Register',
    component: Register
  },
  {
    path: '/map',
    name: 'Map',
    component: Map,
    meta: { requiresAuth: true }
  },
  {
    path: '/reports',
    name: 'Reports',
    component: Reports,
    meta: { requiresAuth: true }
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

// Guard pour vérifier l'authentification (à implémenter plus tard)
router.beforeEach((to, from, next) => {
  // Pour l'instant, on laisse passer tout le monde
  // Plus tard, tu ajouteras la vérification Firebase ici
  next();
});

export default router;