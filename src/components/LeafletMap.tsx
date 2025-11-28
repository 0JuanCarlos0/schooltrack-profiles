import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Vehicle {
  id: string;
  name: string;
  route: [number, number][];
  color: string;
  currentPosition: number;
  direction: 'forward' | 'backward';
}

interface LeafletMapProps {
  center: [number, number];
}

// Función para calcular distancia entre dos puntos en metros
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Radio de la Tierra en metros
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

// Función para calcular el tiempo de viaje en segundos a 40 km/h
const calculateTravelTime = (distanceMeters: number): number => {
  const speedKmH = 40;
  const speedMS = speedKmH * 1000 / 3600; // Convertir a m/s
  return (distanceMeters / speedMS) * 1000; // Retornar en milisegundos
};

export function LeafletMap({ center }: LeafletMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const vehicleMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const routeLinesRef = useRef<Map<string, L.Polyline>>(new Map());
  const animationTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  
  const [vehicles] = useState<Vehicle[]>([
    {
      id: 'bus-001',
      name: 'BUS-001 - Ruta Centro',
      // Ruta realista siguiendo calles principales de San Juan del Río (Centro a UTSJR)
      route: [
        [20.3880, -99.9960], // Centro - Plaza Principal
        [20.3885, -99.9950], // Av. Juárez
        [20.3890, -99.9940], // Continúa Juárez
        [20.3895, -99.9925], // Cruce importante
        [20.3900, -99.9910], // Av. Central
        [20.3905, -99.9895], // Zona comercial
        [20.3910, -99.9880], // Continúa hacia UTSJR
        [20.3915, -99.9870], // Cerca de UTSJR
        [20.3918, -99.9860], // Boulevard
        [20.3920, -99.9850], // Acceso UTSJR
        [20.3920, -99.9840], // Campus UTSJR
        // Ruta de regreso
        [20.3918, -99.9850],
        [20.3915, -99.9860],
        [20.3910, -99.9875],
        [20.3905, -99.9890],
        [20.3900, -99.9905],
        [20.3895, -99.9920],
        [20.3890, -99.9935],
        [20.3885, -99.9945],
        [20.3880, -99.9955]
      ],
      color: '#3B82F6',
      currentPosition: 0,
      direction: 'forward'
    },
    {
      id: 'bus-002',
      name: 'BUS-002 - Ruta Norte',
      // Ruta desde zona norte siguiendo calles
      route: [
        [20.4050, -99.9980], // Zona Norte
        [20.4040, -99.9970], // Calle principal norte
        [20.4030, -99.9960], // Continúa sur
        [20.4020, -99.9950], // Boulevard norte
        [20.4010, -99.9940], // Intersección
        [20.4000, -99.9930], // Av. Principal
        [20.3990, -99.9920], // Zona comercial
        [20.3980, -99.9910], // Continúa
        [20.3970, -99.9900], // Cerca centro
        [20.3960, -99.9885], // Aproximándose
        [20.3950, -99.9870], // Boulevard UTSJR
        [20.3940, -99.9860], // Cerca UTSJR
        [20.3930, -99.9850], // Acceso UTSJR
        [20.3925, -99.9845], // Campus
        // Regreso
        [20.3930, -99.9855],
        [20.3940, -99.9865],
        [20.3950, -99.9875],
        [20.3960, -99.9890],
        [20.3970, -99.9905],
        [20.3980, -99.9915],
        [20.3990, -99.9925],
        [20.4000, -99.9935],
        [20.4010, -99.9945],
        [20.4020, -99.9955],
        [20.4030, -99.9965],
        [20.4040, -99.9975]
      ],
      color: '#10B981',
      currentPosition: 0,
      direction: 'forward'
    },
    {
      id: 'bus-003',
      name: 'BUS-003 - Ruta Sur',
      // Ruta desde zona sur
      route: [
        [20.3650, -99.9750], // Zona Sur
        [20.3665, -99.9760], // Calle sur
        [20.3680, -99.9770], // Av. Sur principal
        [20.3695, -99.9780], // Continúa norte
        [20.3710, -99.9790], // Boulevard
        [20.3730, -99.9800], // Zona residencial
        [20.3750, -99.9810], // Comercial
        [20.3770, -99.9820], // Aproximación
        [20.3790, -99.9830], // Centro cercano
        [20.3810, -99.9835], // Cerca destino
        [20.3830, -99.9840], // Boulevard UTSJR
        [20.3850, -99.9845], // Acceso
        [20.3870, -99.9848], // Campus UTSJR
        [20.3885, -99.9850], // Llegada
        // Regreso
        [20.3870, -99.9845],
        [20.3850, -99.9840],
        [20.3830, -99.9835],
        [20.3810, -99.9830],
        [20.3790, -99.9825],
        [20.3770, -99.9815],
        [20.3750, -99.9805],
        [20.3730, -99.9795],
        [20.3710, -99.9785],
        [20.3695, -99.9775],
        [20.3680, -99.9765],
        [20.3665, -99.9755]
      ],
      color: '#F59E0B',
      currentPosition: 0,
      direction: 'forward'
    }
  ]);

  // Crear icono de vehículo personalizado
  const createBusIcon = (color: string) => {
    const svgIcon = `
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="18" fill="${color}" opacity="0.95" stroke="white" stroke-width="3"/>
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
        weight: 5,
        opacity: 0.7,
        smoothFactor: 1,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);
      
      // Agregar popup a la línea
      routeLine.bindPopup(`
        <div style="padding: 8px;">
          <strong>${vehicle.name}</strong>
          <p style="font-size: 12px; margin-top: 4px;">Circuito completo</p>
        </div>
      `);
      
      routeLinesRef.current.set(vehicle.id, routeLine);

      // Crear marcador de vehículo
      const marker = L.marker(vehicle.route[0], {
        icon: createBusIcon(vehicle.color),
        zIndexOffset: 1000
      }).addTo(map);
      
      marker.bindPopup(`
        <div style="padding: 8px;">
          <p style="font-weight: 600; margin-bottom: 4px;">${vehicle.name}</p>
          <p style="font-size: 12px; color: #666;">
            Velocidad: 40 km/h
          </p>
          <p style="font-size: 12px; color: #16a34a; font-weight: 500; margin-top: 4px;">
            <span style="display: inline-block; width: 8px; height: 8px; background: #16a34a; border-radius: 50%; margin-right: 4px;"></span>
            En ruta
          </p>
        </div>
      `);
      
      vehicleMarkersRef.current.set(vehicle.id, marker);
    });

    return () => {
      // Limpiar timers
      animationTimersRef.current.forEach(timer => clearTimeout(timer));
      animationTimersRef.current.clear();
      
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [center, vehicles]);

  // Animar el movimiento de los vehículos con velocidad realista
  useEffect(() => {
    if (!mapRef.current) return;

    const animateVehicle = (vehicle: Vehicle) => {
      const marker = vehicleMarkersRef.current.get(vehicle.id);
      if (!marker) return;

      const currentPos = vehicle.route[vehicle.currentPosition];
      const nextIndex = vehicle.currentPosition + 1;

      // Si llegamos al final de la ruta, cambiar dirección
      if (nextIndex >= vehicle.route.length) {
        vehicle.currentPosition = 0;
        vehicle.direction = vehicle.direction === 'forward' ? 'backward' : 'forward';
        scheduleNextMove(vehicle);
        return;
      }

      const nextPos = vehicle.route[nextIndex];
      
      // Calcular distancia y tiempo de viaje
      const distance = calculateDistance(
        currentPos[0], currentPos[1],
        nextPos[0], nextPos[1]
      );
      const travelTime = calculateTravelTime(distance);

      // Mover marcador
      marker.setLatLng(nextPos);
      vehicle.currentPosition = nextIndex;

      // Programar siguiente movimiento
      const timer = setTimeout(() => animateVehicle(vehicle), travelTime);
      animationTimersRef.current.set(vehicle.id, timer);
    };

    const scheduleNextMove = (vehicle: Vehicle) => {
      // Pequeña pausa al completar el circuito (30 segundos)
      const timer = setTimeout(() => animateVehicle(vehicle), 30000);
      animationTimersRef.current.set(vehicle.id, timer);
    };

    // Iniciar animación para cada vehículo con un delay inicial diferente
    vehicles.forEach((vehicle, index) => {
      const initialDelay = index * 5000; // 5 segundos entre cada vehículo
      setTimeout(() => animateVehicle(vehicle), initialDelay);
    });

    return () => {
      animationTimersRef.current.forEach(timer => clearTimeout(timer));
      animationTimersRef.current.clear();
    };
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
