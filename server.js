const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const port = 3000;

// Sample drink data
let drinks = [
    { name: "Pina Colada", price: 400, popularity: 0 },
    { name: "Californication", price: 450, popularity: 0 },
    { name: "Margarita", price: 450, popularity: 0 },
    { name: "Mint Julep", price: 400, popularity: 0 },
    { name: "Mojito", price: 450, popularity: 0 }
];

// Function to adjust prices of drinks based on popularity

function adjustPrices() {

    const basePriceChangePercentage = 0.05; // Base percentage for price change



    // Calculate the average popularity of all drinks

    const totalPopularity = drinks.reduce((total, drink) => total + drink.popularity, 0);

    const averagePopularity = totalPopularity / drinks.length;



    if (averagePopularity > 0) {

        let totalAdjustment = 0;



        // First pass: calculate new prices and total adjustment needed

        drinks.forEach(drink => {

            const popularityRatio = drink.popularity / averagePopularity;

            const priceMultiplier = Math.log10(popularityRatio + 1);

            const newPrice = drink.price * (1 + basePriceChangePercentage * priceMultiplier);

            totalAdjustment += newPrice - drink.price;

            drink.newPrice = newPrice; // Temporarily store new price

        });



        // Calculate the average adjustment per drink

        const averageAdjustment = totalAdjustment / drinks.length;



        // Second pass: apply the average adjustment

        drinks.forEach(drink => {

            const oldPrice = drink.price;

            drink.price = drink.newPrice - averageAdjustment;

            drink.priceChange = drink.price - oldPrice; // Calculate price change

            const minPrice = 100; // Minimum price a drink can have

            const maxPrice = 1000; // Maximum price a drink can have

            drink.price = Math.min(Math.max(drink.price, minPrice), maxPrice);

            delete drink.newPrice; // Clean up temporary property

        });

    } else {

        console.log("No popularity changes detected, prices remain unchanged.");

    }

}

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// WebSocket connection handling
wss.on('connection', ws => {
    console.log('Client connected');


    // Handle disconnection
    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// Update the popularity of a drink based on user input
app.put('/api/drinks/:drinkName/popularity/:action', (req, res) => {
    const { drinkName, action } = req.params;
    const drink = drinks.find(drink => drink.name === drinkName);

    if (!drink) {
        return res.status(404).json({ error: 'Drink not found' });
    }

    if (action === 'increase') {
        drink.popularity += 1;
    } else if (action === 'decrease') {
        if (drink.popularity > 0) {
            drink.popularity -= 1;
        } else {
            return res.status(400).json({ error: 'Popularity cannot go below zero' });
        }
    } else {
        return res.status(400).json({ error: 'Invalid action' });
    }

    // After updating popularity, adjust prices
    adjustPrices();

    // Broadcast updated drink data to all connected clients
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(drinks));
        }
    });

    res.json({ success: true, drink });
});

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Serve index.html for the root URL
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html');
});

// Authentication middleware
function authenticate(req, res, next) {
    const auth = { login: 'admin', password: 'secret' }; // Example credentials

    // parse login and password from headers
    const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
    const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':');

    // Verify login and password are set and correct
    if (login && password && login === auth.login && password === auth.password) {
        return next(); // Access granted
    }

    // Access denied
    res.set('WWW-Authenticate', 'Basic realm="401"'); // Change this as per security requirements
    res.status(401).send('Authentication required.'); // custom message
}

// Serve popularity.html for the '/popularity' URL with authentication
app.get('/popularity', authenticate, (req, res) => {
    res.sendFile(__dirname + '/views/popularity.html');
});

// Serve drinks data via API endpoint
app.get('/api/drinks', (req, res) => {
    // Delay to mimic server processing
    setTimeout(() => {
        res.json(drinks);
    }, 1000); // 1-second delay
});

// Start the HTTP server
server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
