// server.js
const express = require('express');
const fs = require('fs-extra');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io'); // Import socket.io
const app = express();
const port = 3000;
const dataFilePath = './sensorData.json';

app.use(express.json());
app.use(cors());

const server = http.createServer(app); // Tạo server HTTP
const io = new Server(server); // Khởi tạo socket.io với server

fs.ensureFileSync(dataFilePath);

app.post('/api/data', async (req, res) => {
    const { temperature, humidity } = req.body;

    if (temperature === undefined || humidity === undefined) {
        return res.status(400).json({ error: 'Temperature and humidity are required' });
    }

    const newData = { temperature, humidity, timestamp: new Date() };

    try {
        const currentData = await fs.readJson(dataFilePath);
        currentData.push(newData);
        await fs.writeJson(dataFilePath, currentData);

        // Gửi dữ liệu mới đến tất cả client qua WebSocket
        io.emit('data-updated', newData);

        console.log(`Received data - Temperature: ${temperature}, Humidity: ${humidity}`);
        res.status(200).json({ status: 'success', temperature, humidity });
    } catch (error) {
        console.error('Error writing to file:', error);
        res.status(500).json({ error: 'Failed to save data' });
    }
});

app.get('/api/data', async (req, res) => {
    try {
        const data = await fs.readJson(dataFilePath);
        res.status(200).json(data);
    } catch (error) {
        console.error('Error reading from file:', error);
        res.status(500).json({ error: 'Failed to read data' });
    }
});

server.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});