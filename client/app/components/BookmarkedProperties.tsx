'use client';

import React from 'react';
import PropertyCard from './PropertyCard';

interface Property {
  id: number;
  nameOfProperty: string;
  description?: string;
  price: number;
  location: string;
  type: string;
  agentPhoneNumber: string;
  createdAt: string;
  updatedAt: string;
}

interface BookmarkedPropertiesProps {
  properties: Property[];
  bookmarkedIds: Set<number>;
  onBookmark: (propertyId: number) => void;
}

export default function BookmarkedProperties({
  properties,
  bookmarkedIds,
  onBookmark,
}: BookmarkedPropertiesProps) {
  const bookmarkedProperties = properties.filter(p => bookmarkedIds.has(p.id));

  if (bookmarkedProperties.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No bookmarked properties</h3>
        <p className="text-gray-500">
          Browse properties and click the heart icon to save your favorites!
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">
        My Bookmarks ({bookmarkedProperties.length})
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bookmarkedProperties.map(property => (
          <PropertyCard
            key={property.id}
            property={property}
            isBookmarked={bookmarkedIds.has(property.id)}
            onBookmark={onBookmark}
          />
        ))}
      </div>
    </div>
  );
}
