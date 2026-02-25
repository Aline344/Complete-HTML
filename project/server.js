const express = require('express');
const cors = require('cors');
const path = require('path');
const admin = require('firebase-admin');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files from the project directory
app.use(express.static(path.join(__dirname)));

// ===== FIREBASE INITIALIZATION =====
let db;
let usingMock = false;

try {
    // Check if the service account key exists
    if (fs.existsSync('./serviceAccountKey.json')) {
        const serviceAccount = require('./serviceAccountKey.json');

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });

        db = admin.firestore();
        console.log("Firebase initialized successfully with credentials.");
    } else {
        throw new Error("serviceAccountKey.json not found.");
    }
} catch (error) {
    console.warn(`\n⚠️ WARNING: ${error.message} \n`);
    console.warn("Using in-memory mock database instead of Firebase.");
    console.warn("To use real Firebase, please add serviceAccountKey.json to the project root.\n");
    usingMock = true;
}

// In-memory mock storage (used if Firebase initialization fails)
let mockCart = [];

// ===================================
// API ENDPOINTS
// ===================================

// Get cart items
app.get('/api/cart', async (req, res) => {
    try {
        if (usingMock) {
            return res.json(mockCart);
        }

        const snapshot = await db.collection('cart').get();
        const cartItems = [];

        snapshot.forEach(doc => {
            cartItems.push({ id: doc.id, ...doc.data() });
        });

        res.json(cartItems);
    } catch (error) {
        console.error("Error fetching cart:", error);
        res.status(500).json({ error: "Failed to fetch cart items" });
    }
});

// Add item to cart
app.post('/api/cart', async (req, res) => {
    const { name, price } = req.body;

    if (!name || price === undefined) {
        return res.status(400).json({ error: 'Name and price are required' });
    }

    const newItem = { name, price, addedAt: new Date().toISOString() };

    try {
        if (usingMock) {
            newItem.id = Date.now().toString();
            mockCart.push(newItem);
            return res.status(201).json({ message: 'Item added to mock cart', cart: mockCart });
        }

        const docRef = await db.collection('cart').add(newItem);

        // Fetch updated cart to return to the client
        const snapshot = await db.collection('cart').get();
        const cartItems = [];
        snapshot.forEach(doc => {
            cartItems.push({ id: doc.id, ...doc.data() });
        });

        res.status(201).json({ message: 'Item added to Firebase cart', cart: cartItems });
    } catch (error) {
        console.error("Error adding to cart:", error);
        res.status(500).json({ error: "Failed to add item to cart" });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
