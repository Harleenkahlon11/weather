import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const SEARCH_HISTORY_FILE = path.join(__dirname, '../../db/searchHistory.json');

// Helper function to read the search history
const readHistory = (): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    fs.readFile(SEARCH_HISTORY_FILE, 'utf8', (err, data) => {
      if (err) {
        if (err.code === 'ENOENT') {
          resolve([]);
        } else {
          reject(err);
        }
      } else {
        resolve(JSON.parse(data));
      }
    });
  });
};

// Helper function to save the search history
const saveHistory = (history: any): Promise<void> => {
  return new Promise((resolve, reject) => {
    fs.writeFile(SEARCH_HISTORY_FILE, JSON.stringify(history), (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

// POST: Fetch weather data for a city and add it to search history
router.post('/', async (req, res) => {
  const { cityName } = req.body;

  if (!cityName) {
    return res.status(400).json({ error: 'City name is required' });
  }

  try {
    // Fetch weather data from OpenWeather API
    const weatherResponse = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&appid=be955bf1c93f4894df21d1eb27a3da57`
    );
    
    const weatherData = weatherResponse.data.list.map((forecast: any) => ({
      date: forecast.dt_txt,
      temperature: forecast.main.temp,
      humidity: forecast.main.humidity,
      windSpeed: forecast.wind.speed,
      weatherIcon: forecast.weather[0].icon,
    }));

    // Create a new city object with unique ID
    const cityId = uuidv4();
    const cityData = {
      id: cityId,
      name: cityName,
      forecast: weatherData,
    };

    // Read existing history, add new city, and save back to file
    const history = await readHistory();
    history.push(cityData);
    await saveHistory(history);

    return res.json(cityData); // Return the weather data for the city
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

// GET: Retrieve search history
router.get('/history', async (_req, res) => {
  try {
    const history = await readHistory();
    res.json(history); // Return all saved cities from search history
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve search history' });
  }
});

// DELETE: Remove a city from search history by ID (Bonus)
router.delete('/history/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const history = await readHistory();
    const updatedHistory = history.filter((city) => city.id !== id);

    if (updatedHistory.length === history.length) {
      return res.status(404).json({ error: 'City not found in history' });
    }

    await saveHistory(updatedHistory);
    return res.json({ message: 'City removed from history' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to remove city from history' });
  }
});

export default router;
