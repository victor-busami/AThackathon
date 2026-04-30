'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
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
    if (!mapContainer.current) return;

    // Initialize map
    map.current = L.map(mapContainer.current).setView(defaultCenter, 10);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map.current!);

    // Restrict map to bounds
    map.current.setMaxBounds(bounds);
    map.current.fitBounds(bounds);

    // Display property markers
    // Clear previous property markers
    propertyMarkers.current.forEach(m => map.current?.removeLayer(m));
    propertyMarkers.current = [];

    properties.forEach(property => {
      const coords = locationCoords[property.location] || [-1.2921, 36.8219]; // Default to Nairobi
      
      // Create custom property marker icon (blue)
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

    // Handle map clicks
    map.current.on('click', async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;

      // Remove old marker
      if (marker.current) {
        map.current?.removeLayer(marker.current);
      }

      // Create custom selection marker icon (red)
      const selectionIcon = L.divIcon({
        html: `<div style="background-color: #ef4444; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">✓</div>`,
        iconSize: [30, 30],
        className: 'selection-marker',
      });

      // Add new marker with red icon
      marker.current = L.marker([lat, lng], { icon: selectionIcon }).addTo(map.current!);

      // Try to get location name from reverse geocoding (using nominatim)
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
        );
        const data = await response.json();
        const locationName = data.address?.city || data.address?.county || data.address?.country || 'Selected Location';

        onLocationSelect?.({ name: locationName, lat, lng });
        marker.current.bindPopup(`<b>${locationName}</b><br/>Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`).openPopup();
      } catch (error) {
        onLocationSelect?.({ name: 'Selected Location', lat, lng });
        marker.current.bindPopup(`<b>Selected Location</b><br/>Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`).openPopup();
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [onLocationSelect, defaultCenter, properties]);

  return <div ref={mapContainer} className="h-96 w-full" />;
}
