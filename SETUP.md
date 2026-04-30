# Property Browser with Bookmarks

A full-stack application for browsing properties and bookmarking your favorites.

## Features

- 🏠 **Browse Properties**: View all available properties with details including price, location, type, and agent contact
- ❤️ **Bookmark Properties**: Save your favorite properties with a single click
- 📱 **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- ⚡ **Real-time Updates**: Instant bookmark status updates across the application

## Project Structure

```
client/                 # Next.js frontend
├── app/
│   ├── page.tsx       # Main browsing page
│   ├── components/
│   │   ├── PropertyCard.tsx
│   │   └── BookmarkedProperties.tsx
│   ├── globals.css
│   └── layout.tsx
└── package.json

server/                # Express backend
├── src/
│   └── index.ts       # API server with routes
├── prisma/
│   ├── schema.prisma  # Database schema
│   └── migrations/    # Database migrations
├── generated/         # Prisma client
├── lib/
│   └── prisma.ts      # Prisma configuration
└── package.json
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database (connection string in `.env`)

### Installation

1. **Install server dependencies**:
   ```bash
   cd server
   npm install
   ```

2. **Install client dependencies**:
   ```bash
   cd client
   npm install
   ```

### Database Setup

The database migrations are already applied. If you need to reset the database:

```bash
cd server
npx prisma migrate reset --force
```

### Environment Setup

**Server** (`.env` already configured):
```
DATABASE_URL=your_postgresql_connection_string
```

**Client** (`.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Running the Application

Open two terminal windows:

**Terminal 1 - Start the backend server**:
```bash
cd server
npm run dev
```
The API will run on `http://localhost:3000`

**Terminal 2 - Start the frontend**:
```bash
cd client
npm run dev
```
The application will be available at `http://localhost:3000`

## API Endpoints

### Properties
- `GET /api/properties` - List all properties
- `GET /api/properties/:id` - Get a specific property
- `POST /api/properties` - Create a new property

### Bookmarks
- `GET /api/bookmarks` - Get current user's bookmarks
- `POST /api/bookmarks` - Add a bookmark
- `DELETE /api/bookmarks/:propertyId` - Remove a bookmark

## Usage

1. Open the application in your browser
2. The **Browse Properties** tab shows all available properties
3. Click the heart icon on any property card to bookmark it
4. Your bookmark count appears in the **My Bookmarks** tab
5. Switch to the **My Bookmarks** tab to view all your saved properties
6. Click the heart icon again to remove a bookmark

## Technology Stack

### Frontend
- **Next.js 16** - React framework
- **React 19** - UI library
- **Tailwind CSS 4** - Styling
- **Lucide React** - Icons
- **TypeScript** - Type safety

### Backend
- **Express 5** - Web framework
- **Prisma 7** - ORM
- **PostgreSQL** - Database
- **TypeScript** - Type safety
- **CORS** - Cross-origin support

## Features

### Database Models

**User**
- Tracks registered users
- Has many bookmarks

**Property**
- Property listings with details (name, price, location, type, agent contact)
- Can be bookmarked by multiple users

**Bookmark**
- Junction table linking users to properties
- Tracks when properties were bookmarked
- Ensures no duplicate bookmarks per user

## Future Enhancements

- 🔐 User authentication with login/signup
- 📝 Add personal notes to bookmarks
- 🔍 Search and filter properties by price, location, type
- ⭐ Rating system for properties
- 📊 Analytics dashboard
- 💬 Property inquiry messaging system
- 📸 Property image gallery
- 🗺️ Map view for properties

## Troubleshooting

### Port already in use
If port 3000 is already in use, you can specify a different port:
- Backend: `PORT=3001 npm run dev`
- Frontend: `npm run dev` (specify port when prompted or set PORT env var)

### Database connection issues
- Verify the `DATABASE_URL` in `.env` is correct
- Ensure PostgreSQL is running and accessible
- Run `npx prisma db push` to sync schema

### CORS errors
- Check that the frontend `.env.local` has `NEXT_PUBLIC_API_URL=http://localhost:3000`
- Verify the backend is running on the correct port

## License

MIT
