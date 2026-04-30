'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for Leaflet marker icons in Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

// Custom marker icons (only create these on client side)
const getPropertyIcon = (status: 'available' | 'booked', isSelected: boolean = false) => {
  if (typeof window === 'undefined') return null;
  
  if (isSelected) {
    return L.divIcon({
      html: `<div style="background-color: #ef4444; color: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">✓</div>`,
      iconSize: [40, 40],
      className: 'selection-marker',
    });
  }
  
  const color = status === 'available' ? '#10b981' : '#f59e0b';
  const label = status === 'available' ? 'A' : 'B';
  
  return L.divIcon({
    html: `<div style="background-color: ${color}; color: white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${label}</div>`,
    iconSize: [32, 32],
    className: 'property-marker',
  });
};

interface Property {
  id: string;
  nameOfProperty: string;
  description: string;
  price: number;
  location: string;
  type: string;
  agentPhoneNumber: string;
  status: 'available' | 'booked';
  latitude?: number | null;
  longitude?: number | null;
  createdAt?: string;
}

interface MapComponentProps {
  onLocationSelect?: (location: { name: string; lat: number; lng: number }) => void;
  defaultCenter?: [number, number];
  properties?: Property[];
  selectedPropertyId?: string | null;
  onPropertyClick?: (property: Property) => void;
  isSelectionMode?: boolean;
}

export default function MapComponent({ 
  onLocationSelect, 
  defaultCenter = [-1.2921, 36.8219],
  properties = [], 
  selectedPropertyId = null,
  onPropertyClick,
  isSelectionMode = true
}: MapComponentProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const selectionMarker = useRef<L.Marker | null>(null);
  const propertyMarkers = useRef<Map<string, L.Marker>>(new Map());
  const [mapError, setMapError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Set isClient to true when component mounts on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  const getPropertyCoordinates = useCallback((property: Property): [number, number] | null => {
    if (property.latitude && property.longitude) {
      return [property.latitude, property.longitude];
    }
    
    const locationCoords: Record<string, [number, number]> = {
      'Nairobi': [-1.2921, 36.8219],
      'Kiambu': [-1.1667, 36.8333],
      'Westlands': [-1.2667, 36.8167],
      'Karen': [-1.3167, 36.7667],
      'Lavington': [-1.3333, 36.7833],
      'Upper Hill': [-1.3, 36.8],
      'Parklands': [-1.2833, 36.85],
      'Thika': [-1.05, 37.0833],
      'Ruaka': [-1.2, 36.8167],
      'Runda': [-1.2167, 36.8333],
      'Gigiri': [-1.2333, 36.8167],
      'Kilimani': [-1.2833, 36.7833],
      'Kileleshwa': [-1.3, 36.7667],
    };
    
    return locationCoords[property.location] || null;
  }, []);

  const fitMapToBounds = useCallback(() => {
    if (!map.current || !isClient) return;
    
    const allMarkers = Array.from(propertyMarkers.current.values());
    if (allMarkers.length === 0 && !selectionMarker.current) {
      map.current.setView(defaultCenter, 11);
      return;
    }
    
    const bounds = L.latLngBounds([]);
    allMarkers.forEach(marker => bounds.extend(marker.getLatLng()));
    if (selectionMarker.current) bounds.extend(selectionMarker.current.getLatLng());
    
    if (bounds.isValid()) {
      map.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [defaultCenter, isClient]);

  const updatePropertyMarkers = useCallback(() => {
    if (!map.current || !isClient) return;

    propertyMarkers.current.forEach(marker => map.current?.removeLayer(marker));
    propertyMarkers.current.clear();

    properties.forEach(property => {
      const coords = getPropertyCoordinates(property);
      if (!coords) {
        console.warn(`No coordinates found for property: ${property.nameOfProperty}`);
        return;
      }

      const isSelected = selectedPropertyId === property.id;
      const icon = getPropertyIcon(property.status, isSelected);
      if (!icon) return;
      
      const marker = L.marker(coords, { icon }).addTo(map.current!);
      
      const popupContent = `
        <div style="min-width: 200px; max-width: 300px;">
          <h4 style="margin: 0 0 8px 0; font-weight: bold; color: #333; font-size: 16px;">
            ${property.nameOfProperty}
          </h4>
          <div style="margin: 8px 0;">
            <span style="display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; background-color: ${property.status === 'available' ? '#d1fae5' : '#fed7aa'}; color: ${property.status === 'available' ? '#065f46' : '#92400e'};">
              ${property.status.toUpperCase()}
            </span>
          </div>
          <p style="margin: 4px 0; font-size: 14px;">
            <strong>💰 Price:</strong> KSH ${property.price.toLocaleString()}
          </p>
          <p style="margin: 4px 0; font-size: 14px;">
            <strong>📍 Location:</strong> ${property.location}
          </p>
          <p style="margin: 4px 0; font-size: 14px;">
            <strong>🏠 Type:</strong> ${property.type}
          </p>
          <p style="margin: 4px 0; font-size: 14px;">
            <strong>📞 Agent:</strong> ${property.agentPhoneNumber}
          </p>
          ${property.description ? `<p style="margin: 8px 0; font-size: 12px; color: #666;">${property.description.substring(0, 100)}${property.description.length > 100 ? '...' : ''}</p>` : ''}
          <button 
            onclick="window.dispatchEvent(new CustomEvent('propertyClick', { detail: { propertyId: '${property.id}' } }))"
            style="margin-top: 8px; width: 100%; padding: 8px; background-color: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;"
          >
            View Details
          </button>
        </div>
      `;
      
      marker.bindPopup(popupContent);
      
      marker.on('click', () => {
        if (onPropertyClick) {
          onPropertyClick(property);
        }
      });
      
      propertyMarkers.current.set(property.id, marker);
    });

    setTimeout(() => fitMapToBounds(), 100);
  }, [properties, selectedPropertyId, getPropertyCoordinates, fitMapToBounds, onPropertyClick, isClient]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current || !isClient) return;

    try {
      map.current = L.map(mapContainer.current).setView(defaultCenter, 12);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map.current);

      L.control.scale({ metric: true, imperial: false }).addTo(map.current);

    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError('Failed to initialize map');
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [defaultCenter, isClient]);

  // Update markers when properties change
  useEffect(() => {
    if (map.current && isClient) {
      updatePropertyMarkers();
    }
  }, [updatePropertyMarkers, isClient]);

  // Handle map clicks for location selection
  useEffect(() => {
    if (!map.current || !isSelectionMode || !isClient) return;

    const handleMapClick = async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;

      if (selectionMarker.current) {
        map.current?.removeLayer(selectionMarker.current);
      }

      const selectionIcon = getPropertyIcon('available', true);
      if (!selectionIcon) return;
      
      selectionMarker.current = L.marker([lat, lng], { icon: selectionIcon }).addTo(map.current!);

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
        );
        const data = await response.json();
        
        let locationName = 'Selected Location';
        if (data.address) {
          locationName = data.address.road || 
                        data.address.neighbourhood || 
                        data.address.suburb || 
                        data.address.city || 
                        data.address.town || 
                        data.address.county ||
                        'Selected Location';
        }
        
        onLocationSelect?.({ name: locationName, lat, lng });
        
        selectionMarker.current.bindPopup(`
          <b>📍 ${locationName}</b><br/>
          Lat: ${lat.toFixed(6)}<br/>
          Lng: ${lng.toFixed(6)}
        `).openPopup();
        
      } catch (error) {
        console.error('Reverse geocoding error:', error);
        onLocationSelect?.({ name: 'Selected Location', lat, lng });
        selectionMarker.current.bindPopup(`
          <b>Selected Location</b><br/>
          Lat: ${lat.toFixed(6)}<br/>
          Lng: ${lng.toFixed(6)}
        `).openPopup();
      }
    };

    map.current.on('click', handleMapClick);

    return () => {
      if (map.current) {
        map.current.off('click', handleMapClick);
      }
    };
  }, [onLocationSelect, isSelectionMode, isClient]);

  // Listen for custom events from popup buttons
  useEffect(() => {
    const handlePropertyClick = (event: CustomEvent) => {
      const property = properties.find(p => p.id === event.detail.propertyId);
      if (property && onPropertyClick) {
        onPropertyClick(property);
      }
    };

    if (isClient) {
      window.addEventListener('propertyClick' as EventListener, handlePropertyClick);
    }
    
    return () => {
      if (isClient) {
        window.removeEventListener('propertyClick' as EventListener, handlePropertyClick);
      }
    };
  }, [properties, onPropertyClick, isClient]);

  if (!isClient) {
    return (
      <div className="h-96 w-full bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  if (mapError) {
    return (
      <div className="h-96 w-full bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-2">{mapError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div ref={mapContainer} className="h-96 w-full rounded-lg shadow-lg" />
      <div className="absolute bottom-2 right-2 bg-white bg-opacity-90 p-2 rounded-md text-xs text-gray-600 shadow">
        <div className="flex gap-3">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span>Booked</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Selected</span>
          </div>
        </div>
      </div>
    </div>
  );
}