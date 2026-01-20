import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { IonicVue } from '@ionic/vue';

// Import CSS globaux
import '@/theme/global.css';

/* Core CSS for Ionic */
import '@ionic/vue/css/core.css';
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';

/* Optional CSS utils */
import '@ionic/vue/css/padding.css';
import '@ionic/vue/css/float-elements.css';
import '@ionic/vue/css/text-alignment.css';
import '@ionic/vue/css/text-transformation.css';
import '@ionic/vue/css/flex-utils.css';
import '@ionic/vue/css/display.css';

const app = createApp(App);
const pinia = createPinia();

// IMPORTANT: Installer Pinia AVANT le router
app.use(pinia);
app.use(IonicVue);
app.use(router);

// Attendre que le router soit prêt
router.isReady().then(() => {
  app.mount('#app');
  console.log('App Ionic Vue + Pinia montée avec succès!');
});