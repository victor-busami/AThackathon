import express from 'express';
import cors from 'cors';
import {prisma} from '../lib/prisma';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(express.json());
app.use(cors());

// Admin credentials (hardcoded)
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123',
};

// Simple token store (in-memory, reset on server restart)
const adminTokens = new Set<string>();

// Middleware to extract userId from headers
const getUserId = (req: any) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    throw new Error('Missing x-user-id header');
  }
  return parseInt(userId as string);
};

// Middleware to verify admin token
const verifyAdminToken = (req: any) => {
  const token = req.headers['x-admin-token'];
  if (!token || !adminTokens.has(token as string)) {
    throw new Error('Unauthorized: Invalid or missing admin token');
  }
  return token;
};

// Ensure user exists or create if needed
const ensureUserExists = async (userId: number, name?: string, email?: string) => {
  let user = await prisma.user.findUnique({
    where: { id: userId },
  }).catch(() => null);
  
  if (!user) {
    user = await prisma.user.create({
      data: {
        id: userId,
        name: name || `User ${userId}`,
        email: email || null,
      },
    }).catch(() => null);
  }
  return user;
};

// Properties endpoints
app.get('/api/properties', async (req, res) => {
  try {
    const properties = await prisma.property.findMany();
    res.json(properties);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
});

app.get('/api/properties/:id', async (req, res) => {
  try {
    const property = await prisma.property.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    res.json(property);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch property' });
  }
});

app.post('/api/properties', async (req, res) => {
  try {
    const { nameOfProperty, description, price, location, type, agentPhoneNumber } = req.body;
    const property = await prisma.property.create({
      data: {
        nameOfProperty,
        description,
        price: parseFloat(price),
        location,
        type,
        agentPhoneNumber,
      },
    });
    res.status(201).json(property);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create property' });
  }
});

// Bookmarks endpoints
app.get('/api/bookmarks', async (req, res) => {
  try {
    const userId = getUserId(req);
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId },
      include: { property: true },
    });
    res.json(bookmarks);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to fetch bookmarks' });
  }
});

app.post('/api/bookmarks', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { propertyId } = req.body;
    
    // Ensure user exists
    await ensureUserExists(userId);
    
    const bookmark = await prisma.bookmark.create({
      data: {
        userId,
        propertyId: parseInt(propertyId),
      },
    });
    res.status(201).json(bookmark);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Property already bookmarked' });
    }
    res.status(400).json({ error: error.message || 'Failed to create bookmark' });
  }
});

app.delete('/api/bookmarks/:propertyId', async (req, res) => {
  try {
    const userId = getUserId(req);
    const bookmark = await prisma.bookmark.delete({
      where: {
        userId_propertyId: {
          userId,
          propertyId: parseInt(req.params.propertyId),
        },
      },
    });
    res.json(bookmark);
  } catch (error) {
    res.status(404).json({ error: 'Bookmark not found' });
  }
});

// Admin endpoints
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      // Generate a simple token
      const token = `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      adminTokens.add(token);
      
      res.json({
        success: true,
        token,
        message: 'Admin login successful',
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/admin/logout', async (req, res) => {
  try {
    const token = req.headers['x-admin-token'] as string;
    if (token) {
      adminTokens.delete(token);
    }
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

app.post('/api/admin/properties', async (req, res) => {
  try {
    verifyAdminToken(req);
    
    const { nameOfProperty, description, price, location, type, agentPhoneNumber } = req.body;

    // Validate required fields
    if (!nameOfProperty || !price || !location || !type || !agentPhoneNumber) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const property = await prisma.property.create({
      data: {
        nameOfProperty,
        description: description || '',
        price: parseFloat(price),
        location,
        type,
        agentPhoneNumber,
      },
    });

    res.status(201).json({
      success: true,
      property,
      message: 'Property created successfully',
    });
  } catch (error: any) {
    if (error.message.includes('Unauthorized')) {
      return res.status(401).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to create property' });
  }
});

const main = async () => {
    await prisma.$connect();
    console.log('Connected to the database');
    
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

main()