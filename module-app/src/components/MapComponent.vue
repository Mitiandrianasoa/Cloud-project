<template>
  <div class="map-wrapper">
    <div id="map" ref="mapContainer" class="leaflet-map"></div>
    <div v-if="!mapLoaded" class="map-loading">
      <div class="loading-spinner"></div>
      <p>Chargement de la carte...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Geolocation } from '@capacitor/geolocation';

// URLs pour les icônes Leaflet (solution Vite compatible)
const markerIcon2x = new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href;
const markerIcon = new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href;
const markerShadow = new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href;

const props = defineProps({
  center: {
    type: Array,
    default: () => [-18.8792, 47.5079] // Antananarivo
  },
  zoom: {
    type: Number,
    default: 13
  },
  reports: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['location-updated', 'map-ready', 'report-clicked']);

// Références
const mapContainer = ref(null);
const map = ref(null);
const userMarker = ref(null);
const mapLoaded = ref(false);
const reportMarkers = ref([]);

onMounted(async () => {
  console.log('MapComponent mounted');
  console.log('Container element:', mapContainer.value);
  
  // Attendre que le DOM soit complètement chargé
  await nextTick();
  
  if (mapContainer.value) {
    console.log('Initializing map...');
    await initMap();
    mapLoaded.value = true;
    emit('map-ready', map.value);
    
    // Attendre un peu puis centrer sur l'utilisateur
    setTimeout(async () => {
      await centerOnUser();
      addReportMarkers();
    }, 300);
  } else {
    console.error('Map container not found!');
  }
});

onUnmounted(() => {
  console.log('MapComponent unmounted');
  if (map.value) {
    map.value.remove();
    map.value = null;
  }
});

// Fix pour les icônes Leaflet
const fixLeafletIcons = () => {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

const initMap = async () => {
  if (!mapContainer.value) {
    console.error('Map container element not found');
    return;
  }

  try {
    // Appliquer le fix des icônes
    fixLeafletIcons();
    
    console.log('Creating Leaflet map...');
    
    // Créer la carte
    map.value = L.map(mapContainer.value, {
      center: props.center,
      zoom: props.zoom,
      zoomControl: true,
      attributionControl: true,
      preferCanvas: true
    });

    console.log('Map created:', map.value);
    
    // Ajouter les tuiles OpenStreetMap (pour test)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      detectRetina: false
    }).addTo(map.value);

    console.log('Tiles added');
    
    // Ajouter un contrôle de zoom personnalisé
    L.control.zoom({
      position: 'bottomright'
    }).addTo(map.value);
    
    // Forcer le redimensionnement après un délai
    setTimeout(() => {
      if (map.value) {
        map.value.invalidateSize();
        console.log('Map invalidateSize called');
      }
    }, 200);
    
    // Ajouter un événement de clic sur la carte
    map.value.on('click', (e) => {
      console.log('Map clicked at:', e.latlng);
    });

  } catch (error) {
    console.error('Error initializing map:', error);
  }
};

const centerOnUser = async () => {
  try {
    console.log('Getting user location...');
    const coordinates = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000
    });
    
    const { latitude, longitude } = coordinates.coords;
    console.log('User location found:', latitude, longitude);
    
    if (map.value) {
      // Centrer sur l'utilisateur
      map.value.setView([latitude, longitude], 15);
      
      // Ajouter ou mettre à jour le marqueur utilisateur
      if (userMarker.value) {
        userMarker.value.setLatLng([latitude, longitude]);
      } else {
        userMarker.value = L.marker([latitude, longitude], {
          title: 'Votre position',
          zIndexOffset: 1000
        }).addTo(map.value)
        .bindPopup('<b>Vous êtes ici</b>')
        .openPopup();
      }
      
      emit('location-updated', { lat: latitude, lng: longitude });
      console.log('Map centered on user');
    }
  } catch (error) {
    console.warn('Could not get user location:', error);
    // Centrer sur Antananarivo par défaut
    if (map.value) {
      map.value.setView(props.center, props.zoom);
      console.log('Map centered on default location');
    }
  }
};

const addReportMarkers = () => {
  // Nettoyer les anciens marqueurs
  reportMarkers.value.forEach(marker => {
    if (map.value && marker) {
      map.value.removeLayer(marker);
    }
  });
  reportMarkers.value = [];
  
  // Ajouter les marqueurs de signalement
  props.reports.forEach(report => {
    if (report.lat && report.lng) {
      const marker = L.marker([report.lat, report.lng])
        .addTo(map.value)
        .bindPopup(`
          <div style="font-family: 'Poppins', sans-serif; padding: 5px;">
            <strong>${report.title || 'Signalement'}</strong><br/>
            ${report.description || ''}
          </div>
        `)
        .on('click', () => {
          emit('report-clicked', report);
        });
      
      reportMarkers.value.push(marker);
    }
  });
  
  console.log('Report markers added:', reportMarkers.value.length);
};

// Méthode pour recentrer la carte
const recenter = () => {
  centerOnUser();
};

// Exposer les méthodes au parent
defineExpose({
  recenter,
  getMap: () => map.value
});
</script>

<style scoped>
.map-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 500px;
  background: #f8f9fa;
}

.leaflet-map {
  width: 100%;
  height: 100%;
  min-height: 500px;
  z-index: 1;
}

/* État de chargement */
.map-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 2;
  color: #666;
  background: rgba(255, 255, 255, 0.95);
  padding: 20px 30px;
  border-radius: 15px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(170, 150, 218, 0.2);
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 3px solid rgba(170, 150, 218, 0.2);
  border-top-color: #AA96DA;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.map-loading p {
  margin: 0;
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  color: #5D5D5D;
}
</style>

<style>
/* Styles globaux pour Leaflet */
.leaflet-container {
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  background: #e8f4f8 !important;
}

.leaflet-popup-content-wrapper {
  border-radius: 12px !important;
  background: #FFF9F9 !important;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1) !important;
  border: 1px solid rgba(170, 150, 218, 0.2) !important;
}

.leaflet-popup-content {
  margin: 12px !important;
  font-size: 14px !important;
  color: #5D5D5D !important;
}

.leaflet-control-zoom {
  border: none !important;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1) !important;
  border-radius: 10px !important;
  overflow: hidden !important;
  margin-right: 10px !important;
  margin-bottom: 10px !important;
}

.leaflet-control-zoom a {
  background: white !important;
  color: #5D5D5D !important;
  border-bottom: 1px solid rgba(170, 150, 218, 0.2) !important;
  width: 35px !important;
  height: 35px !important;
  line-height: 35px !important;
  font-size: 18px !important;
}

.leaflet-control-zoom a:hover {
  background: #FFF9F9 !important;
  color: #AA96DA !important;
}

.leaflet-control-attribution {
  font-size: 10px !important;
  background: rgba(255, 255, 255, 0.8) !important;
  padding: 2px 5px !important;
  border-radius: 3px !important;
}
</style>