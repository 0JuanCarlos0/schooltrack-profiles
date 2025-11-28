import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix para los iconos de Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});

L.Marker.prototype.options.icon = DefaultIcon;

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

interface MapProps {
  locations: LocationPoint[];
  center: [number, number];
  sampleRoute: [number, number][];
  getUserName: (location: LocationPoint) => string;
}

// Componente auxiliar para ajustar el mapa
function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, 13);
  }, [center, map]);
  
  return null;
}

export function Map({ locations, center, sampleRoute, getUserName }: MapProps) {
  return (
    <MapContainer
      center={center}
      zoom={13}
      scrollWheelZoom={true}
      style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
    >
      <MapController center={center} />
      
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {locations.map((location) => (
        <Marker
          key={location.id}
          position={[location.latitude, location.longitude]}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">{getUserName(location)}</p>
              <p className="text-xs text-gray-500">
                {new Date(location.timestamp).toLocaleString('es-MX')}
              </p>
              {location.accuracy && (
                <p className="text-xs text-gray-400">
                  Precisión: {location.accuracy.toFixed(0)}m
                </p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}

      <Polyline
        positions={sampleRoute}
        pathOptions={{ color: 'blue', weight: 3, opacity: 0.6 }}
      />
    </MapContainer>
  );
}
