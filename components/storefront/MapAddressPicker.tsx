'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import './MapAddressPicker.css';

// Kathmandu default center
const DEFAULT_CENTER: [number, number] = [27.7172, 85.3240];
const DEFAULT_ZOOM = 14;

interface Props {
  onChange: (coords: { lat: number; lng: number } | null, address: string) => void;
  hasError?: boolean;
}

interface LatLng { lat: number; lng: number; }

// Reverse-geocode via OpenStreetMap Nominatim (free, no key)
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    const json = await res.json();
    return json.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

// Forward-geocode via Nominatim
async function forwardGeocode(query: string): Promise<LatLng | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=np`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    const json = await res.json();
    if (json[0]) return { lat: parseFloat(json[0].lat), lng: parseFloat(json[0].lon) };
    return null;
  } catch { return null; }
}

export default function MapAddressPicker({ onChange, hasError }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gpsMarkerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deliveryMarkerRef = useRef<any>(null);
  const autoLocateTriggered = useRef(false);

  const [addressText, setAddressText] = useState('');
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState<'idle' | 'loading' | 'error'>('idle');
  const [locating, setLocating] = useState(false);
  const [pinning, setPinning] = useState(false);
  const [deliveryCoords, setDeliveryCoordsState] = useState<LatLng | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const updateDelivery = useCallback(async (latlng: LatLng, map: unknown) => {
    setDeliveryCoordsState(latlng);
    setStatus('Getting address…');
    setStatusType('loading');
    const addr = await reverseGeocode(latlng.lat, latlng.lng);
    setAddressText(addr);
    setStatus('');
    setStatusType('idle');
    onChange(latlng, addr);

    // Move delivery marker
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const L = (window as any).L;
    if (!L) return;
    if (deliveryMarkerRef.current) {
      deliveryMarkerRef.current.setLatLng(latlng);
    } else {
      const icon = L.divIcon({
        html: `<svg width="32" height="42" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 24 12 24s12-15 12-24c0-6.63-5.37-12-12-12zm0 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" fill="#ef4444"/><circle cx="12" cy="12" r="4" fill="#fff"/></svg>`,
        iconSize: [32, 42],
        iconAnchor: [16, 42],
        className: '',
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const marker = L.marker(latlng, { icon }).addTo(map as any);
      deliveryMarkerRef.current = marker;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onChange]);

  // Init Leaflet map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Dynamically load Leaflet CSS + JS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const initMap = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const L = (window as any).L;
      if (!L || !mapRef.current) return;
      
      // Prevent "Map container is already initialized" error in React Strict Mode / Fast Refresh
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((mapRef.current as any)._leaflet_id) return;

      const map = L.map(mapRef.current, {
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      // Keep marker at center while dragging
      map.on('move', () => {
        if (deliveryMarkerRef.current) {
          deliveryMarkerRef.current.setLatLng(map.getCenter());
        }
      });

      // Update delivery address when dragging stops
      map.on('moveend', () => {
        const center = map.getCenter();
        updateDelivery({ lat: center.lat, lng: center.lng }, map);
      });

      setMapReady(true);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).L) {
      initMap();
    } else {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = initMap;
      document.head.appendChild(script);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        gpsMarkerRef.current = null;
        deliveryMarkerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // "Use My Location"
  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('Geolocation not supported by your browser.');
      setStatusType('error');
      return;
    }
    setLocating(true);
    setStatus('Getting your location…');
    setStatusType('loading');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const latlng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const map = mapInstanceRef.current;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const L = (window as any).L;
        if (map && L) {
          map.setView(latlng, 17);
          // GPS marker (blue, non-draggable)
          if (gpsMarkerRef.current) {
            gpsMarkerRef.current.setLatLng(latlng);
          } else {
            const gpsIcon = L.divIcon({
              html: `<div style="position:relative;width:20px;height:20px">
                <div style="position:absolute;inset:0;background:#3b82f6;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(59,130,246,0.6)"></div>
                <div style="position:absolute;inset:-6px;background:rgba(59,130,246,0.2);border-radius:50%;animation:none"></div>
              </div>`,
              iconSize: [20, 20],
              iconAnchor: [10, 10],
              className: '',
            });
            gpsMarkerRef.current = L.marker(latlng, { icon: gpsIcon }).addTo(map)
              .bindPopup('<b>Your location</b>');
          }
          // Also set delivery pin to GPS location
          await updateDelivery(latlng, map);
        }
        setLocating(false);
        setStatus('Location found ✓');
        setStatusType('idle');
        setTimeout(() => setStatus(''), 3000);
      },
      (err) => {
        setLocating(false);
        setStatus(err.code === 1 ? 'Location access denied.' : 'Could not get location.');
        setStatusType('error');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [updateDelivery]);

  // Auto-locate once map is ready
  useEffect(() => {
    if (mapReady && !autoLocateTriggered.current) {
      autoLocateTriggered.current = true;
      handleLocate();
    }
  }, [mapReady, handleLocate]);



  // "Pin on Map" — geocode typed address
  const handlePinAddress = useCallback(async () => {
    if (!addressText.trim()) return;
    setPinning(true);
    setStatus('Searching address…');
    setStatusType('loading');
    const coords = await forwardGeocode(addressText);
    if (coords) {
      const map = mapInstanceRef.current;
      if (map) {
        map.setView(coords, 17);
        await updateDelivery(coords, map);
      }
      setStatus('Location pinned ✓');
      setTimeout(() => setStatus(''), 3000);
    } else {
      setStatus('Address not found. Try a more specific address.');
      setStatusType('error');
    }
    setPinning(false);
  }, [addressText, updateDelivery]);

  // When user types address manually, notify parent
  const handleAddressChange = useCallback((val: string) => {
    setAddressText(val);
    onChange(deliveryCoords, val);
  }, [deliveryCoords, onChange]);

  return (
    <div className="map-picker">
      {/* Map */}
      <div ref={mapRef} className="map-picker__map" />

      {/* Controls */}
      <div className="map-picker__controls">
        {/* Legend */}
        <div className="map-picker__legend">
          <div className="map-picker__legend-item">
            <div className="map-picker__legend-dot map-picker__legend-dot--gps" />
            Your GPS location
          </div>
          <div className="map-picker__legend-item">
            <div className="map-picker__legend-dot map-picker__legend-dot--delivery" style={{background: '#ef4444'}} />
            Drag the map to set the red pin exactly on your delivery location
          </div>
        </div>

        {/* Buttons */}
        <div className="map-picker__btn-row">
          <button
            type="button"
            className="map-picker__locate-btn"
            onClick={handleLocate}
            disabled={locating}
            aria-label="Use my current GPS location"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
              <circle cx="12" cy="12" r="9" strokeWidth="1.5" strokeOpacity="0.4"/>
            </svg>
            {locating ? 'Locating…' : 'Use My Location'}
          </button>
        </div>

        {/* Address text input + pin button */}
        <div className="map-picker__btn-row">
          <input
            type="text"
            className={`map-picker__address-input${hasError && !addressText.trim() ? ' has-error' : ''}`}
            placeholder="Search address or tap map to pin..."
            value={addressText}
            onChange={e => handleAddressChange(e.target.value)}
            aria-label="Delivery address text"
          />
          <button
            type="button"
            className="map-picker__pin-btn"
            onClick={handlePinAddress}
            disabled={pinning || !addressText.trim()}
            title="Pin typed address on map"
            aria-label="Search typed address on map"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            {pinning ? 'Searching…' : 'Pin'}
          </button>
        </div>

        {/* Status */}
        {status && (
          <div className={`map-picker__status map-picker__status--${statusType === 'idle' ? '' : statusType}`}>
            {status}
          </div>
        )}
      </div>
    </div>
  );
}
