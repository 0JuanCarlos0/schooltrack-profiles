import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Vehicle {
  id: string;
  name: string;
  route: [number, number][];
  color: string;
  currentPosition: number;
}

interface LeafletMapProps {
  center: [number, number];
}

export function LeafletMap({ center }: LeafletMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const vehicleMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const routeLinesRef = useRef<Map<string, L.Polyline>>(new Map());
  const [vehicles] = useState<Vehicle[]>([
    {
      id: 'bus-001',
      name: 'BUS-001 - Ruta Centro',
      route: [
        [20.3850, -99.9800],
        [20.3860, -99.9810],
        [20.3870, -99.9820],
        [20.3880, -99.9825],
        [20.3883, -99.9830],
        [20.3890, -99.9840],
        [20.3900, -99.9850]
      ],
      color: '#3B82F6',
      currentPosition: 0
    },
    {
      id: 'bus-002',
      name: 'BUS-002 - Ruta Norte',
      route: [
        [20.4000, -99.9900],
        [20.3980, -99.9880],
        [20.3960, -99.9860],
        [20.3940, -99.9850],
        [20.3920, -99.9840],
        [20.3900, -99.9835],
        [20.3883, -99.9830]
      ],
      color: '#10B981',
      currentPosition: 0
    },
    {
      id: 'bus-003',
      name: 'BUS-003 - Ruta Sur',
      route: [
        [20.3700, -99.9750],
        [20.3720, -99.9770],
        [20.3750, -99.9790],
        [20.3780, -99.9810],
        [20.3800, -99.9820],
        [20.3830, -99.9825],
        [20.3883, -99.9830]
      ],
      color: '#F59E0B',
      currentPosition: 0
    }
  ]);

  // Crear icono de vehículo personalizado
  const createBusIcon = (color: string) => {
    const svgIcon = `
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="18" fill="${color}" opacity="0.9" stroke="white" stroke-width="2"/>
        <path d="M12 16h16v8h-16z" fill="white"/>
        <rect x="13" y="17" width="6" height="6" fill="${color}"/>
        <rect x="21" y="17" width="6" height="6" fill="${color}"/>
        <circle cx="15" cy="26" r="2" fill="white"/>
        <circle cx="25" cy="26" r="2" fill="white"/>
        <rect x="19" y="12" width="2" height="4" fill="white" rx="1"/>
      </svg>
    `;
    
    return L.divIcon({
      html: svgIcon,
      className: 'bus-marker',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20]
    });
  };

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Inicializar el mapa
    const map = L.map(containerRef.current).setView(center, 13);
    mapRef.current = map;

    // Agregar la capa de tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);

    // Inicializar vehículos y rutas
    vehicles.forEach(vehicle => {
      // Crear línea de ruta
      const routeLine = L.polyline(vehicle.route, {
        color: vehicle.color,
        weight: 4,
        opacity: 0.6,
        smoothFactor: 1
      }).addTo(map);
      
      // Agregar popup a la línea
      routeLine.bindPopup(`<div style="padding: 8px;"><strong>${vehicle.name}</strong></div>`);
      
      routeLinesRef.current.set(vehicle.id, routeLine);

      // Crear marcador de vehículo
      const marker = L.marker(vehicle.route[0], {
        icon: createBusIcon(vehicle.color)
      }).addTo(map);
      
      marker.bindPopup(`
        <div style="padding: 8px;">
          <p style="font-weight: 600; margin-bottom: 4px;">${vehicle.name}</p>
          <p style="font-size: 12px; color: #666;">
            En ruta - ${new Date().toLocaleTimeString('es-MX')}
          </p>
          <p style="font-size: 12px; color: #16a34a; font-weight: 500;">● Activo</p>
        </div>
      `);
      
      vehicleMarkersRef.current.set(vehicle.id, marker);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [center, vehicles]);

  // Animar el movimiento de los vehículos
  useEffect(() => {
    if (!mapRef.current) return;

    const animationInterval = setInterval(() => {
      vehicles.forEach(vehicle => {
        const marker = vehicleMarkersRef.current.get(vehicle.id);
        if (!marker) return;

        // Avanzar posición
        vehicle.currentPosition = (vehicle.currentPosition + 1) % vehicle.route.length;
        const newPosition = vehicle.route[vehicle.currentPosition];
        
        // Animar movimiento suave
        marker.setLatLng(newPosition);
        
        // Si está cerca del final, hacer un efecto de ida y vuelta
        if (vehicle.currentPosition === vehicle.route.length - 1) {
          setTimeout(() => {
            vehicle.currentPosition = 0;
          }, 2000);
        }
      });
    }, 3000); // Mover cada 3 segundos

    return () => clearInterval(animationInterval);
  }, [vehicles]);

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
