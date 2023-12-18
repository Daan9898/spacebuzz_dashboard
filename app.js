const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const fs = require("fs");
// const https = require('https');
const expressWs = require('express-ws'); // Import express-ws
const WebSocket = require('ws');



const app = express();
const port = 5500;

// // Read the certificate and key files
// const privateKey = fs.readFileSync('./certs/private.key', 'utf8');
// const certificate = fs.readFileSync('./certs/certificate.crt', 'utf8');

// const credentials = { key: privateKey, cert: certificate };
// const httpsServer = https.createServer(credentials, app);

// Use CORS middleware
app.use(cors());





// Database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'spacebuzz'
});

// Connect to MySQL
db.connect(err => {
    if (err) throw err;
    console.log('Connected to the MySQL server.');
});

// Add WebSocket support using express-ws
const wsInstance = expressWs(app);

// Handle WebSocket connections
app.ws('/', (ws, req) => {
  console.log('WebSocket connection established.');

  // Handle WebSocket messages here
  ws.on('message', (message) => {
    console.log(`Received message: ${message}`);

    // Broadcast the message to all connected clients
    wsInstance.getWss().clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        // Send the message to other clients (excluding the sender)
        client.send(message);
      }
    });
  });
});




app.get("/video", function (req, res) {
    res.sendFile(__dirname + "/video-stream.html");
  });

// Route to display chairs
app.get('/chair', (req, res) => {
    const query = 'SELECT * FROM chair';
    db.query(query, (err, results) => {
        if (err) throw err;

        let html = '<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">';

        results.forEach(chair => {
            // Determine the status color
            let statusColor = chair.status_chair === 'Playing' ? 'green' : chair.status_chair === 'Paused' ? 'gray' : 'red';

            // Determine the battery color
            let batteryColor = chair.battery_vr_glasses < 20 ? 'red' : 'orange';

            html += `
                <div class="bg-white shadow-md rounded-lg relative hover:shadow-lg transition-shadow duration-300">     
                    <div class="my-4 flex items-center justify-between px-4">
                        <p class="font-bold text-lg text-gray-500">${chair.name_chair}</p>
                        <div class="dropdown relative">
                        <button class="dropdown-toggle hover:text-blue-500 transition-colors duration-300">
                            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M6 10.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM12 10.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM18 10.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" />
                            </svg>
                        </button>
                        <div class="dropdown-menu absolute hidden right-0 bg-gray-100 shadow-md rounded p-2">
                            <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-200">Select Language</a>
                            <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-200">Reset Chair</a>
                        </div>
                    </div>    
                    </div>
                    <div class="my-4 flex items-center justify-between px-4">
                        <p class="text-sm font-semibold text-gray-500">Status</p>
                        <p class="rounded-full bg-${statusColor}-200 px-2 py-0.5 text-xs font-semibold text-${statusColor}-600">${chair.status_chair}</p>
                    </div>
                    <div class="my-4 flex items-center justify-between px-4">
                        <p class="text-sm font-semibold text-gray-500">Time</p>
                        <p class="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-600">${chair.time_video}</p>
                    </div>
                    <div class="my-4 flex items-center justify-between px-4">
                        <p class="text-sm font-semibold text-gray-500">Language</p>
                        <p class="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-600">${chair.language}</p>
                    </div>
                    <div class="my-4 flex items-center justify-between px-4">
                        <p class="text-sm font-semibold text-gray-500">Battery</p>
                        <p class="rounded-full bg-${batteryColor}-200 px-2 py-0.5 text-xs font-semibold text-${batteryColor}-600">${chair.battery_vr_glasses}%</p>
                    </div>
                </div>`;
        });

        html += '</div>';
        res.send(html);
    });
});

// Route to fetch chair names
app.get('/api/chair-name', (req, res) => {
    const query = 'SELECT id, name_chair FROM chair'; // Include the 'id' column in the query
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error in query:', err);
            return res.status(500).send('Server error');
        }
        // Sending back the results as JSON
        res.json(results);
    });
});

// API endpoint to update the chair's group
app.put('/api/update-chair-group/:chairId', (req, res) => {
    const chairId = req.params.chairId;
    const newGroupId = req.body.groupId; // Assuming you send the new group ID in the request body

    // Update the chair's group in the database
    const updateQuery = 'UPDATE assigned_chairs SET group_id = ? WHERE chair_id = ?';
    db.query(updateQuery, [newGroupId, chairId], (error, results) => {
        if (error) {
            console.error('Error updating chair group:', error);
            res.status(500).json({ message: 'Error updating chair group' });
        } else {
            res.status(200).json({ message: 'Chair group updated successfully' });
        }
    });
});

app.get('/api/chair-data', (req, res) => {
    const query = 'SELECT chair.id, chair.name_chair, assigned_chairs.group_id FROM chair LEFT JOIN assigned_chairs ON chair.id = assigned_chairs.chair_id';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error in query:', err);
            return res.status(500).send('Server error');
        }
        // Sending back the results as JSON
        res.json(results);
    });
});

// Define the video streaming route
app.get("/video", (req, res) => {
    // Ensure there is a range given for the video
    const range = req.headers.range;
    if (!range) {
      res.status(400).send("Requires Range header");
    }
  
    const videoPath = "./spacebuzz_video.mp4";
    const videoSize = fs.statSync("./spacebuzz_video.mp4").size;
  
    const CHUNK_SIZE = 10 ** 6; // 1MB
    const start = Number(range.replace(/\D/g, ""));
    const end = Math.min(start + CHUNK_SIZE, videoSize - 1);
  
    // Create headers
    const contentLength = end - start + 1;
    const headers = {
      "Content-Range": `bytes ${start}-${end}/${videoSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": contentLength,
      "Content-Type": "video/mp4",
    };
  
    // HTTP Status 206 for Partial Content
    res.writeHead(206, headers);
  
    // create video read stream for this particular chunk
    const videoStream = fs.createReadStream(videoPath, { start, end });
  
    // Stream the video chunk to the client
    videoStream.pipe(res);
  });





// Start the server
// app.listen(port, () => {
//     console.log(`Server running at http://localhost:${port}/`);
// });

app.listen(5500, '0.0.0.0', () => {
    console.log('Server running on port 5500');
  });
  
//   httpsServer.listen(5500, '0.0.0.0', () => {
//     console.log('HTTPS Server running on port 5500');
//   });
  