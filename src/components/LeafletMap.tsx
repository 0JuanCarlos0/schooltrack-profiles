import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix para los iconos de Leaflet
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadowUrl from 'leaflet/dist/images/marker-shadow.png';

const defaultIcon = L.icon({
  iconUrl,
  shadowUrl: iconShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});

L.Marker.prototype.options.icon = defaultIcon;

interface LocationPoint {
  id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
}

interface LeafletMapProps {
  locations: LocationPoint[];
  center: [number, number];
  sampleRoute: [number, number][];
  getUserName: (location: LocationPoint) => string;
}

export function LeafletMap({ locations, center, sampleRoute, getUserName }: LeafletMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const polylineRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Inicializar el mapa
    const map = L.map(containerRef.current).setView(center, 13);
    mapRef.current = map;

    // Agregar la capa de tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [center]);

  // Actualizar marcadores
  useEffect(() => {
    if (!mapRef.current) return;

    // Limpiar marcadores anteriores
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Agregar nuevos marcadores
    locations.forEach(location => {
      const marker = L.marker([location.latitude, location.longitude])
        .bindPopup(`
          <div style="padding: 8px;">
            <p style="font-weight: 600; margin-bottom: 4px;">${getUserName(location)}</p>
            <p style="font-size: 12px; color: #666; margin-bottom: 4px;">
              ${new Date(location.timestamp).toLocaleString('es-MX')}
            </p>
            ${location.accuracy ? `<p style="font-size: 12px; color: #999;">Precisión: ${location.accuracy.toFixed(0)}m</p>` : ''}
          </div>
        `)
        .addTo(mapRef.current!);
      
      markersRef.current.push(marker);
    });
  }, [locations, getUserName]);

  // Actualizar polilínea
  useEffect(() => {
    if (!mapRef.current) return;

    // Limpiar polilínea anterior
    if (polylineRef.current) {
      polylineRef.current.remove();
    }

    // Agregar nueva polilínea
    polylineRef.current = L.polyline(sampleRoute, {
      color: 'blue',
      weight: 3,
      opacity: 0.6
    }).addTo(mapRef.current);
  }, [sampleRoute]);

  return (
    <div 
      ref={containerRef} 
      style={{ 
        height: '100%', 
        width: '100%', 
        borderRadius: '0.5rem',
        zIndex: 0
      }} 
    />
  );
}
