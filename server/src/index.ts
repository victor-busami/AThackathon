import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import {prisma} from '../lib/prisma';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

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

const expireStaleBookings = async () => {
  await prisma.booking.updateMany({
    where: {
      status: 'PENDING',
      expiresAt: {
        lt: new Date(),
      },
    },
    data: {
      status: 'EXPIRED',
    },
  });
};

const isPropertyActiveBooked = async (propertyId: number) => {
  const now = new Date();
  const activeBooking = await prisma.booking.findFirst({
    where: {
      propertyId,
      status: {
        in: ['PENDING', 'CONFIRMED'],
      },
      expiresAt: {
        gt: now,
      },
    },
  });
  return Boolean(activeBooking);
};

// Properties endpoints
app.get('/api/properties', async (req, res) => {
  try {
    await expireStaleBookings();
    const now = new Date();
    const properties = await prisma.property.findMany({
      include: {
        bookings: {
          where: {
            status: {
              in: ['PENDING', 'CONFIRMED'],
            },
            expiresAt: {
              gt: now,
            },
          },
          orderBy: { expiresAt: 'desc' },
          take: 1,
        },
      },
    });

    const response = properties.map(property => {
      const [activeBooking] = property.bookings;
      const { bookings, ...rest } = property;
      return {
        ...rest,
        isBooked: Boolean(activeBooking),
        bookedUntil: activeBooking?.expiresAt ?? null,
        bookedStatus: activeBooking?.status ?? null,
      };
    });

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
});

app.get('/api/properties/:id', async (req, res) => {
  try {
    await expireStaleBookings();
    const propertyId = parseInt(req.params.id);
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        bookings: {
          where: {
            status: {
              in: ['PENDING', 'CONFIRMED'],
            },
            expiresAt: {
              gt: new Date(),
            },
          },
          orderBy: { expiresAt: 'desc' },
          take: 1,
        },
      },
    });
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const [activeBooking] = property.bookings;
    const { bookings, ...rest } = property;
    res.json({
      ...rest,
      isBooked: Boolean(activeBooking),
      bookedUntil: activeBooking?.expiresAt ?? null,
      bookedStatus: activeBooking?.status ?? null,
    });
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
    const now = new Date();
    const bookmarks = await prisma.bookmark.findMany({
      where: {
        userId,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
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
    const propertyId = parseInt(req.body.propertyId);

    // Ensure user exists
    await ensureUserExists(userId);

    const existingBookmark = await prisma.bookmark.findUnique({
      where: {
        userId_propertyId: {
          userId,
          propertyId,
        },
      },
    });

    if (existingBookmark) {
      const now = new Date();
      if (!existingBookmark.expiresAt || existingBookmark.expiresAt > now) {
        return res.status(400).json({ error: 'Property already bookmarked' });
      }

      const bookmark = await prisma.bookmark.update({
        where: {
          userId_propertyId: {
            userId,
            propertyId,
          },
        },
        data: {
          expiresAt: null,
        },
      });
      return res.status(200).json(bookmark);
    }

    const bookmark = await prisma.bookmark.create({
      data: {
        userId,
        propertyId,
      },
    });
    res.status(201).json(bookmark);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to create bookmark' });
  }
});

app.delete('/api/bookmarks/:propertyId', async (req, res) => {
  try {
    const userId = getUserId(req);
    const propertyId = parseInt(req.params.propertyId);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const bookmark = await prisma.bookmark.update({
      where: {
        userId_propertyId: {
          userId,
          propertyId,
        },
      },
      data: {
        expiresAt,
      },
    });

    res.json(bookmark);
  } catch (error) {
    res.status(404).json({ error: 'Bookmark not found' });
  }
});

const AT_USERNAME = process.env.AT_USERNAME;
const AT_API_KEY = process.env.AT_API_KEY;
const AT_SENDER = process.env.AT_SENDER;

const sendSms = async (payload: URLSearchParams) => {
  const response = await fetch('https://api.africastalking.com/version1/messaging', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      apikey: AT_API_KEY!,
    },
    body: payload.toString(),
  });

  const data = await response.json().catch(() => ({}));
  return { response, data };
};

const sendBookingNotification = async (message: string, recipient: string) => {
  if (!AT_USERNAME) {
    throw new Error('Africa\'s Talking SMS username is not configured');
  }
  if (!AT_API_KEY) {
    throw new Error('Africa\'s Talking API key is not configured');
  }

  const buildPayload = (useSender: boolean) => {
    const payload = new URLSearchParams({
      username: AT_USERNAME!,
      to: recipient,
      message,
    });

    if (useSender && AT_SENDER?.trim()) {
      payload.append('from', AT_SENDER.trim());
    }

    return payload;
  };

  const attempt = async (useSender: boolean) => {
    const payload = buildPayload(useSender);
    const { response, data } = await sendSms(payload);
    const recipientResult = data?.SMSMessageData?.Recipients?.[0];

    if (response.ok && recipientResult?.status === 'Success') {
      return data;
    }

    const errorParts = [
      data?.SMSMessageData?.Message,
      data?.errorMessage,
      data?.error,
      data?.message,
      JSON.stringify(data),
    ];
    const errorMessage = errorParts.find(Boolean) || 'Failed to send booking SMS';
    throw new Error(String(errorMessage));
  };

  const tryWithoutSender = async (previousError: string) => {
    if (!AT_SENDER?.trim()) {
      throw new Error(previousError);
    }

    const invalidSenderPattern = /invalid sender id|invalid from|sender id invalid|invalid originator|unknown sender/i;
    if (!invalidSenderPattern.test(previousError)) {
      throw new Error(previousError);
    }

    console.warn('Africa\'s Talking sender ID invalid; retrying without from field');
    return await attempt(false);
  };

  try {
    return await attempt(!!AT_SENDER?.trim());
  } catch (error: any) {
    const message = String(error.message || '');
    return await tryWithoutSender(message);
  }
};

// Daraja M-Pesa API Configuration
const DARAJA_CONSUMER_KEY = process.env.DARAJA_CONSUMER_KEY;
const DARAJA_CONSUMER_SECRET = process.env.DARAJA_CONSUMER_SECRET;
const DARAJA_SHORTCODE = process.env.DARAJA_SHORTCODE;
const DARAJA_PASSKEY = process.env.DARAJA_PASSKEY;
const DARAJA_BASE_URL = process.env.DARAJA_BASE_URL || 'https://sandbox.safaricom.co.ke';

// Get Daraja access token
const getDarajaAccessToken = async (): Promise<string> => {
  if (!DARAJA_CONSUMER_KEY || !DARAJA_CONSUMER_SECRET) {
    throw new Error('Daraja API credentials not configured');
  }

  const auth = Buffer.from(`${DARAJA_CONSUMER_KEY}:${DARAJA_CONSUMER_SECRET}`).toString('base64');

  const response = await fetch(`${DARAJA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${auth}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get Daraja access token');
  }

  const data = await response.json();
  return data.access_token;
};

// Initiate STK Push
const initiateSTKPush = async (phoneNumber: string, amount: number, accountReference: string, transactionDesc: string) => {
  const accessToken = await getDarajaAccessToken();

  if (!DARAJA_SHORTCODE || !DARAJA_PASSKEY) {
    throw new Error('Daraja shortcode or passkey not configured');
  }

  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
  const password = Buffer.from(`${DARAJA_SHORTCODE}${DARAJA_PASSKEY}${timestamp}`).toString('base64');

  const payload = {
    BusinessShortCode: DARAJA_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: amount,
    PartyA: phoneNumber,
    PartyB: DARAJA_SHORTCODE,
    PhoneNumber: phoneNumber,
    CallBackURL: `${process.env.BASE_URL || 'http://localhost:4000'}/api/mpesa/callback`,
    AccountReference: accountReference,
    TransactionDesc: transactionDesc,
  };

  const response = await fetch(`${DARAJA_BASE_URL}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to initiate STK push');
  }

  const data = await response.json();
  return data;
};

app.post('/api/bookings', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { propertyId, phoneNumber } = req.body;

    if (!propertyId) {
      return res.status(400).json({ error: 'Missing propertyId' });
    }

    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return res.status(400).json({ error: 'Missing phoneNumber' });
    }

    const parsedPropertyId = parseInt(propertyId);
    const property = await prisma.property.findUnique({
      where: { id: parsedPropertyId },
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    await expireStaleBookings();

    if (await isPropertyActiveBooked(parsedPropertyId)) {
      return res.status(409).json({ error: 'Property is already held or booked' });
    }

    await ensureUserExists(userId);

    const recipient = phoneNumber.trim();

    // Format phone number for M-Pesa (ensure it starts with 254)
    let formattedPhone = recipient;
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith('+')) {
      formattedPhone = formattedPhone.substring(1);
    }

    // Create initial booking with PENDING status
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const booking = await prisma.booking.create({
      data: {
        userId,
        propertyId: parsedPropertyId,
        phoneNumber: recipient,
        expiresAt,
        status: 'PENDING',
      },
    });

    // Initiate STK Push for KSH 100
    const stkPushResponse = await initiateSTKPush(
      formattedPhone,
      100,
      `Booking-${booking.id}`,
      `Booking fee for ${property.nameOfProperty}`
    );

    // Send initial SMS notification
    const message = `Booking request initiated for property ${property.nameOfProperty}. Please complete payment of KSH 100 via M-Pesa.`;
    await sendBookingNotification(message, recipient);

    res.status(200).json({
      message: 'STK push initiated. Please complete payment on your phone.',
      booking,
      stkPush: {
        checkoutRequestId: stkPushResponse.CheckoutRequestID,
        responseCode: stkPushResponse.ResponseCode,
        responseDescription: stkPushResponse.ResponseDescription,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to initiate booking' });
  }
});

app.get('/api/bookings', async (req, res) => {
  try {
    const userId = getUserId(req);
    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: { property: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(bookings);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to fetch bookings' });
  }
});

app.post('/api/bookings/:id/confirm-payment', async (req, res) => {
  try {
    const userId = getUserId(req);
    const bookingId = parseInt(req.params.id, 10);
    const { paymentReference } = req.body;
    const now = new Date();

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking || booking.userId !== userId) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.status === 'EXPIRED' || booking.expiresAt < now) {
      return res.status(400).json({ error: 'Booking has expired' });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CONFIRMED',
        commitmentFeePaid: true,
        paymentReference: paymentReference || null,
      },
    });

    res.json({
      message: 'Commitment fee confirmed. Property remains reserved.',
      booking: updatedBooking,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to confirm payment' });
  }
});

// M-Pesa STK Push Callback
app.post('/api/mpesa/callback', async (req, res) => {
  try {
    const callbackData = req.body;

    console.log('M-Pesa Callback received:', JSON.stringify(callbackData, null, 2));

    // Check if payment was successful
    const resultCode = callbackData.Body?.stkCallback?.ResultCode;
    const resultDesc = callbackData.Body?.stkCallback?.ResultDesc;
    const checkoutRequestId = callbackData.Body?.stkCallback?.CheckoutRequestID;

    if (resultCode === 0) {
      // Payment successful
      const callbackMetadata = callbackData.Body?.stkCallback?.CallbackMetadata?.Item || [];

      // Extract transaction details
      let mpesaReceiptNumber = '';
      let transactionDate = '';
      let phoneNumber = '';

      callbackMetadata.forEach((item: any) => {
        switch (item.Name) {
          case 'MpesaReceiptNumber':
            mpesaReceiptNumber = item.Value;
            break;
          case 'TransactionDate':
            transactionDate = item.Value;
            break;
          case 'PhoneNumber':
            phoneNumber = item.Value;
            break;
        }
      });

      // Extract booking ID from AccountReference (format: Booking-{id})
      const accountReference = callbackData.Body?.stkCallback?.AccountReference;
      const bookingIdMatch = accountReference?.match(/^Booking-(\d+)$/);
      if (!bookingIdMatch) {
        console.error('Invalid account reference format:', accountReference);
        return res.status(400).json({ error: 'Invalid account reference' });
      }

      const bookingId = parseInt(bookingIdMatch[1]);

      // Update booking status to CONFIRMED
      const booking = await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: 'CONFIRMED',
          commitmentFeePaid: true,
          paymentReference: mpesaReceiptNumber,
        },
        include: { property: true, user: true },
      });

      // Send confirmation SMS
      const property = booking.property;
      const message = `Payment confirmed! Your booking for ${property.nameOfProperty} is now confirmed. Receipt: ${mpesaReceiptNumber}. Agent: ${property.agentPhoneNumber}.`;
      await sendBookingNotification(message, booking.phoneNumber);

      console.log(`Booking ${bookingId} confirmed with payment ${mpesaReceiptNumber}`);
    } else {
      // Payment failed
      console.log(`Payment failed for checkout ${checkoutRequestId}: ${resultDesc}`);

      // Extract booking ID and mark as expired if payment failed
      const accountReference = callbackData.Body?.stkCallback?.AccountReference;
      const bookingIdMatch = accountReference?.match(/^Booking-(\d+)$/);
      if (bookingIdMatch) {
        const bookingId = parseInt(bookingIdMatch[1]);
        await prisma.booking.update({
          where: { id: bookingId },
          data: { status: 'EXPIRED' },
        });
      }
    }

    // Always respond with success to M-Pesa
    res.json({ ResultCode: 0, ResultDesc: 'Callback received successfully' });
  } catch (error: any) {
    console.error('M-Pesa callback error:', error);
    // Still respond with success to avoid retries
    res.json({ ResultCode: 0, ResultDesc: 'Callback processed with errors' });
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