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
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Geolocation } from '@capacitor/geolocation';

const markerIcon2x = new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href;
const markerIcon = new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href;
const markerShadow = new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href;

const props = defineProps({
  center: {
    type: Array,
    default: () => [-18.8792, 47.5079]
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

const emit = defineEmits(['location-updated', 'map-ready', 'report-clicked', 'map-clicked']);

// Références
const mapContainer = ref(null);
const map = ref(null);
const userMarker = ref(null);
const mapLoaded = ref(false);
const reportMarkers = ref([]);

// Watcher pour les reports - MAINTENANT AVEC CONDITIONS
watch(() => props.reports, (newReports) => {
  console.log('Reports updated, adding markers:', newReports.length);
  // N'ajouter les marqueurs que si la carte est chargée
  if (mapLoaded.value && map.value) {
    addReportMarkers();
  }
}, { deep: true });

onMounted(async () => {
  console.log('MapComponent mounted');
  
  await nextTick();
  
  if (mapContainer.value) {
    console.log('Initializing map...');
    await initMap();
    mapLoaded.value = true;
    emit('map-ready', map.value);
    
    // Attendre que la carte soit complètement chargée
    setTimeout(async () => {
      await centerOnUser();
      // Maintenant, ajouter les marqueurs des reports
      addReportMarkers();
    }, 500);
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
      center: props.center,
      zoom: props.zoom,
      zoomControl: true,
      attributionControl: true,
      preferCanvas: true
    });

    console.log('Map created:', map.value);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      detectRetina: false
    }).addTo(map.value);

    console.log('Tiles added');
    
    L.control.zoom({
      position: 'bottomright'
    }).addTo(map.value);
    
    // Ajouter l'événement de clic sur la carte
    map.value.on('click', (e) => {
      console.log('🗺️ Map clicked at:', e.latlng);
      // Émettre la position cliquée vers le parent
      emit('map-clicked', {
        lat: e.latlng.lat,
        lng: e.latlng.lng
      });
    });
    
    // Forcer le redimensionnement après un délai
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
    if (map.value) {
      map.value.setView(props.center, props.zoom);
      console.log('Map centered on default location');
    }
  }
};

const addReportMarkers = () => {
  // Vérifier que la carte est bien initialisée
  if (!map.value || !L) {
    console.warn('Map not ready, skipping markers');
    return;
  }
  
  // Nettoyer les anciens marqueurs
  reportMarkers.value.forEach(marker => {
    if (map.value && marker) {
      map.value.removeLayer(marker);
    }
  });
  reportMarkers.value = [];
  
  // Ajouter les marqueurs de signalement avec des icônes colorées
  props.reports.forEach(report => {
    if (report.position && report.position.lat && report.position.lng) {
      // Créer une icône colorée selon le type
      const iconColor = getIconColor(report.type);
      const markerIcon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            background: ${iconColor};
            width: 35px;
            height: 35px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 18px;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            cursor: pointer;
          ">
            ${getTypeIcon(report.type)}
          </div>
        `,
        iconSize: [35, 35],
        iconAnchor: [17.5, 35]
      });
      
      const marker = L.marker([report.position.lat, report.position.lng], { icon: markerIcon })
        .addTo(map.value)
        .bindPopup(`
          <div style="font-family: 'Poppins', sans-serif; padding: 10px; min-width: 250px;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
              <span style="font-size: 20px;">${getTypeIcon(report.type)}</span>
              <h3 style="margin: 0; color: #333; font-size: 1.1rem;">${report.title || 'Signalement'}</h3>
            </div>
            <p style="margin: 0 0 10px 0; color: #666; font-size: 0.9rem;">${report.description || ''}</p>
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: #888;">
              <span>${new Date(report.date).toLocaleDateString()}</span>
              <span style="padding: 4px 8px; background: ${getUrgencyColor(report.urgency)}; color: white; border-radius: 12px;">
                Urgence: ${report.urgency}
              </span>
            </div>
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

// Fonctions utilitaires pour les couleurs et icônes
const getIconColor = (type) => {
  const colors = {
    danger: '#FF6B6B',
    obstacle: '#4D96FF',
    damage: '#06D6A0',
    other: '#AA96DA'
  };
  return colors[type] || '#666';
};

const getTypeIcon = (type) => {
  const icons = {
    danger: '⚠️',
    obstacle: '🚧',
    damage: '🛠️',
    other: '📝'
  };
  return icons[type] || '📍';
};

const getUrgencyColor = (urgency) => {
  switch(urgency) {
    case 1: return '#06D6A0'; // Vert
    case 2: return '#FF9E6D'; // Orange
    case 3: return '#FF6B6B'; // Rouge
    default: return '#AA96DA'; // Violet
  }
};

// Méthode pour recentrer la carte
const recenter = () => {
  centerOnUser();
};

// Méthode pour obtenir la carte
const getMap = () => map.value;

defineExpose({
  recenter,
  getMap
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
  cursor: pointer; /* Indiquer que la carte est cliquable */
}

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

/* Style pour les marqueurs personnalisés */
.custom-marker {
  background: none !important;
  border: none !important;
}
</style>