import express from 'express';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config(); // Load environment variables from .env file

const app = express();
const PORT = process.env.PORT || 3000;

// Get the directory name for the current module (workaround for ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../dist/client'))); // Serve static files from the client folder

// Route to serve index.html
app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});

// Route to fetch search history
app.get('/api/weather/history', (_req, res) => {
    try {
        const history = JSON.parse(fs.readFileSync('server/db/searchHistory.json', 'utf8'));
        res.json(history); // Send search history as JSON
    } catch (error) {
        console.error('Error reading search history:', error);
        res.status(500).send('Error reading search history');
    }
});

// Route to add a new city to the search history
app.post('/api/weather', (req, res) => {
    const { city } = req.body;
    if (!city) {
        return res.status(400).send('City name is required');
    }
    try {
        const history = JSON.parse(fs.readFileSync('server/db/searchHistory.json', 'utf8'));
        // Add new city to the history with a unique id
        const newCity = {
            id: uuidv4(),
            city,
        };
        history.push(newCity); // Add new city data to the search history
        // Save the updated search history back to the file
        fs.writeFileSync('server/db/searchHistory.json', JSON.stringify(history, null, 2));
        return res.json(newCity); // Send back the added city as response
    } catch (error) {
        console.error('Error processing city weather:', error);
        return res.status(500).send('Error adding city to search history');
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
