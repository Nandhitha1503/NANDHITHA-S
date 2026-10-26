import React, { useEffect, useRef, useState } from 'react';
import { 
  MapPin, 
  Navigation, 
  Crosshair, 
  Compass, 
  Maximize2, 
  Minimize2, 
  Building2, 
  Truck, 
  Clock 
} from 'lucide-react';
import L from 'leaflet';
import { TelemetryReading, MissionConfig } from '../types';

interface RouteMapProps {
  reading: TelemetryReading | null;
  config: MissionConfig;
  waypoints: { lat: number; lng: number }[];
}

export const RouteMap: React.FC<RouteMapProps> = ({ reading, config, waypoints }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const vehicleMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const traveledPolylineRef = useRef<L.Polyline | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const currentLat = reading?.latitude ?? config.donorHospital.latitude;
  const currentLng = reading?.longitude ?? config.donorHospital.longitude;
  const speed = reading?.speedKmh ?? 62.4;

  // Calculate approximate distance between coordinates (Haversine formula in km)
  const calcDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const totalDistanceKm = calcDistance(
    config.donorHospital.latitude,
    config.donorHospital.longitude,
    config.recipientHospital.latitude,
    config.recipientHospital.longitude
  );

  const remainingDistanceKm = calcDistance(
    currentLat,
    currentLng,
    config.recipientHospital.latitude,
    config.recipientHospital.longitude
  );

  const distanceCoveredKm = Math.max(0, totalDistanceKm - remainingDistanceKm);
  const progressPercent = Math.min(100, Math.max(0, (distanceCoveredKm / (totalDistanceKm || 1)) * 100));

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Fix default marker icon issues if needed
    delete (L.Icon.Default.prototype as any)._getIconUrl;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([currentLat, currentLng], 11);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // OpenStreetMap dark-styled tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    // Hospital A Marker (Donor Hospital)
    const hospitalAIcon = L.divIcon({
      className: 'custom-hospital-marker',
      html: `
        <div style="background-color: #0369a1; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #38bdf8; box-shadow: 0 0 10px rgba(56, 189, 248, 0.5);">
          <span style="font-weight: bold; font-size: 14px;">H-A</span>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });

    const hospitalBIcon = L.divIcon({
      className: 'custom-hospital-marker',
      html: `
        <div style="background-color: #059669; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #34d399; box-shadow: 0 0 10px rgba(52, 211, 153, 0.5);">
          <span style="font-weight: bold; font-size: 14px;">H-B</span>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });

    // Add Hospital A & B markers with popups
    L.marker([config.donorHospital.latitude, config.donorHospital.longitude], { icon: hospitalAIcon })
      .addTo(map)
      .bindPopup(`<strong style="color: #0369a1;">HOSPITAL A (Donor)</strong><br/>${config.donorHospital.name}<br/>${config.donorHospital.city}`);

    L.marker([config.recipientHospital.latitude, config.recipientHospital.longitude], { icon: hospitalBIcon })
      .addTo(map)
      .bindPopup(`<strong style="color: #059669;">HOSPITAL B (Recipient)</strong><br/>${config.recipientHospital.name}<br/>${config.recipientHospital.city}`);

    // Planned Route Polyline
    const routePoints: [number, number][] = waypoints.length > 0 
      ? waypoints.map(w => [w.lat, w.lng] as [number, number])
      : [
          [config.donorHospital.latitude, config.donorHospital.longitude],
          [config.recipientHospital.latitude, config.recipientHospital.longitude]
        ];

    routePolylineRef.current = L.polyline(routePoints, {
      color: '#38bdf8',
      weight: 4,
      opacity: 0.6,
      dashArray: '6, 8',
    }).addTo(map);

    // Vehicle / Organ Carrier Marker with pulsing radar ring
    const vehicleIcon = L.divIcon({
      className: 'custom-vehicle-marker',
      html: `
        <div style="position: relative; width: 36px; height: 36px;">
          <div style="position: absolute; inset: -8px; border-radius: 50%; background-color: rgba(244, 63, 94, 0.3); animation: radar-pulse 2s infinite;"></div>
          <div style="background-color: #e11d48; color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid #ffffff; box-shadow: 0 0 15px rgba(225, 29, 72, 0.8);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="1" y="3" width="15" height="13"></rect>
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
              <circle cx="5.5" cy="18.5" r="2.5"></circle>
              <circle cx="18.5" cy="18.5" r="2.5"></circle>
            </svg>
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    vehicleMarkerRef.current = L.marker([currentLat, currentLng], { icon: vehicleIcon })
      .addTo(map)
      .bindPopup(`<strong>Organ Transport Unit</strong><br/>Speed: ${speed} km/h<br/>Lat: ${currentLat}<br/>Lng: ${currentLng}`);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update vehicle position when telemetry coordinates change
  useEffect(() => {
    if (!mapInstanceRef.current || !vehicleMarkerRef.current) return;
    
    vehicleMarkerRef.current.setLatLng([currentLat, currentLng]);
    vehicleMarkerRef.current.setPopupContent(`
      <strong style="color:#e11d48;">Organ Transit Vehicle</strong><br/>
      Speed: ${speed} km/h<br/>
      GPS: ${currentLat.toFixed(5)}, ${currentLng.toFixed(5)}<br/>
      Organ: ${config.organType}
    `);
  }, [currentLat, currentLng, speed, config.organType]);

  const handleCenterVehicle = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([currentLat, currentLng], 13, { duration: 1.2 });
    }
  };

  const handleFitRoute = () => {
    if (mapInstanceRef.current) {
      const bounds = L.latLngBounds([
        [config.donorHospital.latitude, config.donorHospital.longitude],
        [config.recipientHospital.latitude, config.recipientHospital.longitude],
        [currentLat, currentLng]
      ]);
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  };

  return (
    <div className={`p-5 rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-md flex flex-col transition-all ${
      isFullscreen ? 'fixed inset-4 z-50 bg-slate-950 border-cyan-500 shadow-2xl' : 'relative'
    }`}>
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2.5 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800/80">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-200">GPS Route Tracking & Geolocation</h2>
            <p className="text-xs text-slate-400">
              {config.donorHospital.name.split(' ')[0]} (H-A) → {config.recipientHospital.name.split(' ')[0]} (H-B)
            </p>
          </div>
        </div>

        {/* GPS Coordinates & Map Controls */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-950/80 border border-slate-800 px-2.5 py-1 rounded-lg text-xs font-mono text-slate-300">
            <span className="text-slate-500 mr-1">GPS:</span>
            <span className="text-cyan-400 font-bold">{currentLat.toFixed(5)}°N</span>,{' '}
            <span className="text-cyan-400 font-bold">{Math.abs(currentLng).toFixed(5)}°W</span>
          </div>

          <button
            onClick={handleCenterVehicle}
            title="Center on Transport Vehicle"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
          >
            <Crosshair className="w-4 h-4" />
          </button>

          <button
            onClick={handleFitRoute}
            title="View Full Route"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer text-xs font-semibold px-2"
          >
            Fit Route
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Map"}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className={`relative w-full rounded-xl overflow-hidden border border-slate-800/80 shadow-inner ${
        isFullscreen ? 'flex-1 min-h-[450px]' : 'h-72 sm:h-80'
      }`}>
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Floating Telemetry Badge on Map */}
        <div className="absolute top-3 left-3 z-[1000] bg-slate-950/90 backdrop-blur-md border border-slate-700/80 p-2.5 rounded-xl shadow-lg flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-rose-400 font-bold">
            <Truck className="w-4 h-4" />
            <span>{speed.toFixed(0)} km/h</span>
          </div>
          <div className="h-4 w-[1px] bg-slate-700" />
          <div className="text-slate-300">
            Rem: <strong className="text-white font-mono">{remainingDistanceKm.toFixed(1)} km</strong>
          </div>
          <div className="h-4 w-[1px] bg-slate-700" />
          <div className="text-emerald-400 font-medium">
            ETA: <strong className="font-mono">~{Math.round((remainingDistanceKm / (speed || 50)) * 60)} min</strong>
          </div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-3 left-3 z-[1000] bg-slate-950/85 backdrop-blur-md border border-slate-800 px-2.5 py-1.5 rounded-lg text-[10px] text-slate-300 flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block"></span> H-A: Donor
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span> Transit Unit
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> H-B: Recipient
          </span>
        </div>
      </div>

      {/* Transit Route Progress Footer */}
      <div className="mt-3 pt-3 border-t border-slate-800 text-xs space-y-2">
        <div className="flex items-center justify-between text-slate-300">
          <span className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-sky-400" />
            <span>{config.donorHospital.name}</span>
          </span>
          <span className="font-mono text-cyan-400 font-semibold">{progressPercent.toFixed(0)}% Journey Completed</span>
          <span className="flex items-center gap-1.5 text-right">
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{config.recipientHospital.name}</span>
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
          <div 
            className="h-full bg-gradient-to-r from-sky-500 via-rose-500 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

    </div>
  );
};
