'use client';

import React, { useEffect, useLayoutEffect, useRef } from 'react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for Leaflet marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapProps {
  onLocationSelect?: (location: { name: string; lat: number; lng: number }) => void;
  defaultCenter?: [number, number];
  properties?: Array<{
    id: number;
    nameOfProperty: string;
    price: number;
    location: string;
  }>;
}

export default function Map({ onLocationSelect, defaultCenter = [-1.3, 36.8], properties = [] }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.Marker | null>(null);
  const propertyMarkers = useRef<L.Marker[]>([]);
  const onLocationSelectRef = useRef(onLocationSelect);

  // Location coordinates for Nairobi and Kiambu
  const locationCoords: Record<string, [number, number]> = {
    'Nairobi': [-1.2921, 36.8219],
    'Kiambu': [-1.01, 36.65],
    'Westlands': [-1.2667, 36.8167],
    'Karen': [-1.3167, 36.7667],
    'Lavington': [-1.3333, 36.7833],
    'Upper Hill': [-1.3, 36.8],
    'Parklands': [-1.2833, 36.85],
    'Thika': [-1.05, 37.0833],
  };

  // Bounds for Nairobi and Kiambu (southwest, northeast corners)
  const bounds = L.latLngBounds(
    [-1.5, 36.4], // Southwest corner
    [-0.8, 37.2]  // Northeast corner
  );

  useEffect(() => {
    onLocationSelectRef.current = onLocationSelect;
  }, [onLocationSelect]);

  useLayoutEffect(() => {
    if (!mapContainer.current || map.current) return;

    const mapInstance = L.map(mapContainer.current, {
      center: defaultCenter,
      zoom: 10,
      zoomAnimation: false,
      fadeAnimation: false,
      markerZoomAnimation: false,
      zoomControl: true,
    });
    map.current = mapInstance;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(mapInstance);

    mapInstance.setMaxBounds(bounds);
    mapInstance.fitBounds(bounds, { animate: false });
    setTimeout(() => mapInstance.invalidateSize(), 0);

    mapInstance.on('click', async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;

      if (marker.current) {
        mapInstance.removeLayer(marker.current);
      }

      const selectionIcon = L.divIcon({
        html: `<div style="background-color: #ef4444; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">✓</div>`,
        iconSize: [30, 30],
        className: 'selection-marker',
      });

      marker.current = L.marker([lat, lng], { icon: selectionIcon }).addTo(mapInstance);

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
        );
        const data = await response.json();
        const locationName = data.address?.city || data.address?.county || data.address?.country || 'Selected Location';

        onLocationSelectRef.current?.({ name: locationName, lat, lng });
        marker.current?.bindPopup(`<b>${locationName}</b><br/>Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`).openPopup();
      } catch (error) {
        onLocationSelectRef.current?.({ name: 'Selected Location', lat, lng });
        marker.current?.bindPopup(`<b>Selected Location</b><br/>Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`).openPopup();
      }
    });

    return () => {
      mapInstance.off();
      mapInstance.remove();
      propertyMarkers.current = [];
      marker.current = null;
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!map.current) return;

    propertyMarkers.current.forEach(marker => map.current?.removeLayer(marker));
    propertyMarkers.current = [];

    properties.forEach(property => {
      const coords = locationCoords[property.location] || [-1.2921, 36.8219];
      const propertyIcon = L.divIcon({
        html: `<div style="background-color: #3b82f6; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">P</div>`,
        iconSize: [30, 30],
        className: 'property-marker',
      });

      const propertyMarker = L.marker(coords, { icon: propertyIcon }).addTo(map.current!);
      propertyMarker.bindPopup(`
        <div style="width: 200px;">
          <h4 style="margin: 0 0 8px 0; font-weight: bold; color: #333;">${property.nameOfProperty}</h4>
          <p style="margin: 4px 0; font-size: 14px;">
            <strong>KSH</strong> ${property.price.toLocaleString()}
          </p>
          <p style="margin: 4px 0; font-size: 13px; color: #666;">
            📍 ${property.location}
          </p>
        </div>
      `);

      propertyMarkers.current.push(propertyMarker);
    });
  }, [properties]);

  useEffect(() => {
    if (!map.current) return;
    map.current.setView(defaultCenter, map.current.getZoom());
  }, [defaultCenter]);

  return <div ref={mapContainer} className="h-96 w-full" />;
}
