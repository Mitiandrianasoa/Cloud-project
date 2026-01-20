<template>
  <div class="map-wrapper">
    <div id="report-map" ref="mapContainer" class="leaflet-map"></div>
    <div v-if="!mapLoaded" class="map-loading">
      <div class="loading-spinner"></div>
      <p>Chargement de la carte...</p>
    </div>
    
    <!-- Marqueur de position sélectionnée -->
    <div v-if="selectedPosition" class="position-marker">
      <div class="marker-pulse"></div>
      <div class="marker-icon">📍</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Geolocation } from '@capacitor/geolocation';

const props = defineProps({
  selectedPosition: Object
});

const emit = defineEmits(['position-selected']);

// URLs pour les icônes Leaflet
const markerIcon2x = new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href;
const markerIcon = new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href;
const markerShadow = new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href;

// Références
const mapContainer = ref(null);
const map = ref(null);
const userMarker = ref(null);
const positionMarker = ref(null);
const mapLoaded = ref(false);

// Watcher pour la position sélectionnée
watch(() => props.selectedPosition, (newPosition) => {
  if (newPosition && map.value) {
    updatePositionMarker(newPosition);
  }
}, { immediate: true });

onMounted(async () => {
  console.log('ReportMap mounted');
  
  await nextTick();
  
  if (mapContainer.value) {
    console.log('Initializing map...');
    await initMap();
    mapLoaded.value = true;
    
    // Centrer sur l'utilisateur
    setTimeout(async () => {
      await centerOnUser();
    }, 300);
  } else {
    console.error('Map container not found!');
  }
});

onUnmounted(() => {
  console.log('ReportMap unmounted');
  if (map.value) {
    map.value.remove();
    map.value = null;
  }
});

const fixLeafletIcons = () => {
  if (L.Icon.Default.prototype._getIconUrl) {
    delete L.Icon.Default.prototype._getIconUrl;
  }
  
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
    fixLeafletIcons();
    
    console.log('Creating Leaflet map...');
    
    map.value = L.map(mapContainer.value, {
      center: [-18.8792, 47.5079], // Antananarivo
      zoom: 13,
      zoomControl: true,
      attributionControl: true,
      preferCanvas: true
    });

    console.log('Map created');
    
    // Tiles OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      detectRetina: false
    }).addTo(map.value);

    // Contrôle de zoom
    L.control.zoom({
      position: 'bottomright'
    }).addTo(map.value);
    
    // Événement de clic sur la carte
    map.value.on('click', (e) => {
      console.log('Map clicked at:', e.latlng);
      const position = {
        lat: e.latlng.lat,
        lng: e.latlng.lng
      };
      emit('position-selected', position);
      updatePositionMarker(position);
    });
    
    // Redimensionnement
    setTimeout(() => {
      if (map.value) {
        map.value.invalidateSize();
        console.log('Map invalidateSize called');
      }
    }, 300);

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
      map.value.setView([latitude, longitude], 15);
      
      // Ajouter marqueur utilisateur
      if (userMarker.value) {
        userMarker.value.setLatLng([latitude, longitude]);
      } else {
        userMarker.value = L.marker([latitude, longitude], {
          title: 'Votre position',
          zIndexOffset: 1000,
          icon: L.divIcon({
            className: 'user-marker',
            html: `<div style="
              background: linear-gradient(135deg, #4D96FF, #A8D8EA);
              width: 30px;
              height: 30px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 16px;
              border: 3px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            ">📍</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 30]
          })
        }).addTo(map.value)
        .bindPopup('<b>Vous êtes ici</b>');
      }
    }
  } catch (error) {
    console.warn('Could not get user location:', error);
    if (map.value) {
      map.value.setView([-18.8792, 47.5079], 13);
    }
  }
};

const updatePositionMarker = (position) => {
  if (!map.value || !L) return;
  
  // Supprimer l'ancien marqueur
  if (positionMarker.value) {
    map.value.removeLayer(positionMarker.value);
  }
  
  // Créer un nouveau marqueur
  positionMarker.value = L.marker([position.lat, position.lng], {
    icon: L.divIcon({
      className: 'selected-marker',
      html: `<div style="
        background: linear-gradient(135deg, #FF6B6B, #FF9E6D);
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 20px;
        border: 3px solid white;
        box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
      ">📍</div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 40]
    }),
    zIndexOffset: 2000
  }).addTo(map.value)
  .bindPopup('<b>Position sélectionnée</b>')
  .openPopup();
  
  // Recentrer sur la position
  map.value.setView([position.lat, position.lng], 15);
};

// Exposer des méthodes si nécessaire
defineExpose({
  getMap: () => map.value
});
</script>

<style scoped>
.map-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 400px;
  background: #f8f9fa;
}

.leaflet-map {
  width: 100%;
  height: 100%;
  min-height: 400px;
  z-index: 1;
  cursor: crosshair; /* Curseur pour indiquer la sélection */
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

/* Marqueur de position */
.position-marker {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
  pointer-events: none;
}

.marker-pulse {
  width: 60px;
  height: 60px;
  background: rgba(255, 107, 107, 0.3);
  border-radius: 50%;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: pulse 2s infinite;
}

.marker-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 30px;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
}

@keyframes pulse {
  0% {
    width: 60px;
    height: 60px;
    opacity: 0.7;
  }
  70% {
    width: 100px;
    height: 100px;
    opacity: 0;
  }
  100% {
    width: 60px;
    height: 60px;
    opacity: 0;
  }
}
</style>

<style>
/* Styles globaux pour Leaflet dans cette carte */
#report-map .leaflet-container {
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  background: #e8f4f8 !important;
}

#report-map .leaflet-popup-content-wrapper {
  border-radius: 12px !important;
  background: #FFF9F9 !important;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1) !important;
  border: 1px solid rgba(170, 150, 218, 0.2) !important;
}

#report-map .leaflet-popup-content {
  margin: 12px !important;
  font-size: 14px !important;
  color: #5D5D5D !important;
}

#report-map .leaflet-control-zoom {
  border: none !important;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1) !important;
  border-radius: 10px !important;
  overflow: hidden !important;
  margin-right: 10px !important;
  margin-bottom: 10px !important;
}

#report-map .leaflet-control-zoom a {
  background: white !important;
  color: #5D5D5D !important;
  border-bottom: 1px solid rgba(170, 150, 218, 0.2) !important;
  width: 35px !important;
  height: 35px !important;
  line-height: 35px !important;
  font-size: 18px !important;
}

#report-map .leaflet-control-zoom a:hover {
  background: #FFF9F9 !important;
  color: #AA96DA !important;
}
</style>