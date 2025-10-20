/**
 * 🗺️ MAPA LEAFLET - 100% GRATUITO
 * 
 * Substituto do Google Maps usando OpenStreetMap
 * - Sem API Key
 * - Sem limites
 * - Sem cobranças
 */

import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix do ícone padrão do Leaflet (necessário no React)
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';

let DefaultIcon = L.icon({
  iconRetinaUrl,
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// ==========================================
// ÍCONES CUSTOMIZADOS
// ==========================================

const createCustomIcon = (color: string, emoji: string) => {
  return L.divIcon({
    html: `
      <div style="
        background: ${color};
        width: 44px;
        height: 44px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 4px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.25);
        font-size: 24px;
      ">
        ${emoji}
      </div>
    `,
    className: '',
    iconSize: [44, 44],
    iconAnchor: [22, 44],
    popupAnchor: [0, -44]
  });
};

const icons = {
  delivery: createCustomIcon('#FF6B35', '🛵'),
  store: createCustomIcon('#4CAF50', '🏪'),
  customer: createCustomIcon('#2196F3', '🏠'),
  food: createCustomIcon('#FF9800', '🍔'),
};

// ==========================================
// TYPES
// ==========================================

interface MapMarker {
  position: [number, number]; // [latitude, longitude]
  popup?: string;
  icon?: 'default' | 'delivery' | 'store' | 'customer' | 'food';
}

interface LeafletMapProps {
  center: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  showRadius?: boolean;
  radiusKm?: number;
  radiusColor?: string;
  height?: string;
  className?: string;
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export const LeafletMap: React.FC<LeafletMapProps> = ({
  center,
  zoom = 15,
  markers = [],
  showRadius = false,
  radiusKm = 5,
  radiusColor = '#FF6B35',
  height = '400px',
  className = ''
}) => {
  
  const getIcon = (type?: string) => {
    switch (type) {
      case 'delivery':
        return icons.delivery;
      case 'store':
        return icons.store;
      case 'customer':
        return icons.customer;
      case 'food':
        return icons.food;
      default:
        return DefaultIcon;
    }
  };

  return (
    <div 
      style={{ height, width: '100%', borderRadius: '12px', overflow: 'hidden' }}
      className={className}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        zoomControl={true}
      >
        {/* 
          Tiles do OpenStreetMap - 100% GRATUITO 
          Sem API Key, sem limites, sem cobranças
        */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        
        {/* Marcadores personalizados */}
        {markers.map((marker, index) => (
          <Marker 
            key={`marker-${index}`}
            position={marker.position}
            icon={getIcon(marker.icon)}
          >
            {marker.popup && (
              <Popup>
                <div style={{ padding: '8px', minWidth: '150px' }}>
                  {marker.popup}
                </div>
              </Popup>
            )}
          </Marker>
        ))}
        
        {/* Círculo de raio (ex: área de entrega) */}
        {showRadius && (
          <Circle
            center={center}
            radius={radiusKm * 1000} // converter km para metros
            pathOptions={{
              color: radiusColor,
              fillColor: radiusColor,
              fillOpacity: 0.1,
              weight: 2,
              dashArray: '10, 10'
            }}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default LeafletMap;

