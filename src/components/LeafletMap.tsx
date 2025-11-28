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
      // Ruta siguiendo Av. Juárez y Boulevard Bernardo Quintana
      route: [
        [20.3880, -99.9960], // Plaza Principal
        [20.3882, -99.9955], // Av. Juárez inicio
        [20.3884, -99.9950], // Av. Juárez
        [20.3886, -99.9945], // Av. Juárez
        [20.3888, -99.9940], // Av. Juárez
        [20.3890, -99.9935], // Cruce con Allende
        [20.3892, -99.9930], // Continúa Juárez
        [20.3894, -99.9925], // Juárez
        [20.3896, -99.9920], // Vuelta a Av. Central
        [20.3898, -99.9915], // Av. Central norte
        [20.3900, -99.9910], // Av. Central
        [20.3902, -99.9905], // Av. Central
        [20.3904, -99.9900], // Av. Central comercial
        [20.3906, -99.9895], // Zona comercial
        [20.3908, -99.9890], // Acercándose a Boulevard
        [20.3910, -99.9885], // Boulevard Quintana
        [20.3912, -99.9880], // Boulevard Quintana
        [20.3914, -99.9875], // Boulevard Quintana
        [20.3916, -99.9870], // Boulevard Quintana
        [20.3918, -99.9865], // Boulevard cerca UTSJR
        [20.3920, -99.9860], // Entrada zona UTSJR
        [20.3921, -99.9855], // Acceso UTSJR
        [20.3922, -99.9850], // Campus UTSJR
        [20.3923, -99.9845], // Interior Campus
        // Ruta de regreso por mismas calles
        [20.3922, -99.9850],
        [20.3920, -99.9855],
        [20.3918, -99.9860],
        [20.3916, -99.9865],
        [20.3914, -99.9870],
        [20.3912, -99.9875],
        [20.3910, -99.9880],
        [20.3908, -99.9885],
        [20.3906, -99.9890],
        [20.3904, -99.9895],
        [20.3902, -99.9900],
        [20.3900, -99.9905],
        [20.3898, -99.9910],
        [20.3896, -99.9915],
        [20.3894, -99.9920],
        [20.3892, -99.9925],
        [20.3890, -99.9930],
        [20.3888, -99.9935],
        [20.3886, -99.9940],
        [20.3884, -99.9945],
        [20.3882, -99.9950],
        [20.3880, -99.9955]
      ],
      color: '#3B82F6',
      currentPosition: 0,
      direction: 'forward'
    },
    {
      id: 'bus-002',
      name: 'BUS-002 - Ruta Norte',
      // Ruta desde zona norte por Carretera Federal 57
      route: [
        [20.4050, -99.9980], // Zona Norte - cerca de salida a Querétaro
        [20.4045, -99.9978], // Carretera 57
        [20.4040, -99.9976], // Carretera 57 sur
        [20.4035, -99.9974], // Carretera 57
        [20.4030, -99.9972], // Carretera 57
        [20.4025, -99.9970], // Carretera 57
        [20.4020, -99.9968], // Carretera 57
        [20.4015, -99.9965], // Entrando zona urbana
        [20.4010, -99.9962], // Boulevard norte
        [20.4005, -99.9958], // Boulevard norte
        [20.4000, -99.9954], // Av. Principal
        [20.3995, -99.9950], // Av. Principal
        [20.3990, -99.9946], // Zona comercial norte
        [20.3985, -99.9942], // Continúa sur
        [20.3980, -99.9938], // Acercándose centro
        [20.3975, -99.9933], // Zona centro
        [20.3970, -99.9928], // Centro ciudad
        [20.3965, -99.9923], // Saliendo centro
        [20.3960, -99.9918], // Hacia UTSJR
        [20.3955, -99.9913], // Av. hacia UTSJR
        [20.3950, -99.9908], // Boulevard UTSJR
        [20.3945, -99.9903], // Boulevard UTSJR
        [20.3940, -99.9898], // Cerca UTSJR
        [20.3935, -99.9893], // Acceso zona
        [20.3930, -99.9888], // Entrada UTSJR
        [20.3927, -99.9885], // Campus UTSJR
        [20.3925, -99.9883], // Interior Campus
        // Regreso por misma ruta
        [20.3927, -99.9885],
        [20.3930, -99.9888],
        [20.3935, -99.9893],
        [20.3940, -99.9898],
        [20.3945, -99.9903],
        [20.3950, -99.9908],
        [20.3955, -99.9913],
        [20.3960, -99.9918],
        [20.3965, -99.9923],
        [20.3970, -99.9928],
        [20.3975, -99.9933],
        [20.3980, -99.9938],
        [20.3985, -99.9942],
        [20.3990, -99.9946],
        [20.3995, -99.9950],
        [20.4000, -99.9954],
        [20.4005, -99.9958],
        [20.4010, -99.9962],
        [20.4015, -99.9965],
        [20.4020, -99.9968],
        [20.4025, -99.9970],
        [20.4030, -99.9972],
        [20.4035, -99.9974],
        [20.4040, -99.9976],
        [20.4045, -99.9978]
      ],
      color: '#10B981',
      currentPosition: 0,
      direction: 'forward'
    },
    {
      id: 'bus-003',
      name: 'BUS-003 - Ruta Sur',
      // Ruta desde zona sur siguiendo vialidades principales
      route: [
        [20.3650, -99.9750], // Zona Sur - San Cayetano
        [20.3658, -99.9755], // Calle sur principal
        [20.3666, -99.9760], // Continuación norte
        [20.3674, -99.9765], // Av. Sur
        [20.3682, -99.9770], // Av. Sur
        [20.3690, -99.9775], // Zona residencial
        [20.3698, -99.9780], // Av. hacia centro
        [20.3706, -99.9785], // Acercándose centro
        [20.3714, -99.9790], // Boulevard
        [20.3722, -99.9795], // Boulevard sur
        [20.3730, -99.9800], // Zona comercial sur
        [20.3738, -99.9805], // Comercial
        [20.3746, -99.9810], // Av. Principal
        [20.3754, -99.9815], // Centro sur
        [20.3762, -99.9820], // Aproximación centro
        [20.3770, -99.9823], // Centro ciudad
        [20.3778, -99.9826], // Saliendo centro
        [20.3786, -99.9829], // Hacia norte
        [20.3794, -99.9832], // Av. Central
        [20.3802, -99.9835], // Av. Central norte
        [20.3810, -99.9838], // Boulevard Quintana
        [20.3818, -99.9841], // Boulevard hacia UTSJR
        [20.3826, -99.9844], // Boulevard UTSJR
        [20.3834, -99.9847], // Cerca UTSJR
        [20.3842, -99.9850], // Acceso zona
        [20.3850, -99.9853], // Entrada UTSJR
        [20.3858, -99.9856], // Acceso campus
        [20.3866, -99.9859], // Campus UTSJR
        [20.3874, -99.9862], // Interior Campus
        [20.3880, -99.9864], // Llegada final
        // Regreso por misma ruta
        [20.3874, -99.9862],
        [20.3866, -99.9859],
        [20.3858, -99.9856],
        [20.3850, -99.9853],
        [20.3842, -99.9850],
        [20.3834, -99.9847],
        [20.3826, -99.9844],
        [20.3818, -99.9841],
        [20.3810, -99.9838],
        [20.3802, -99.9835],
        [20.3794, -99.9832],
        [20.3786, -99.9829],
        [20.3778, -99.9826],
        [20.3770, -99.9823],
        [20.3762, -99.9820],
        [20.3754, -99.9815],
        [20.3746, -99.9810],
        [20.3738, -99.9805],
        [20.3730, -99.9800],
        [20.3722, -99.9795],
        [20.3714, -99.9790],
        [20.3706, -99.9785],
        [20.3698, -99.9780],
        [20.3690, -99.9775],
        [20.3682, -99.9770],
        [20.3674, -99.9765],
        [20.3666, -99.9760],
        [20.3658, -99.9755]
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
