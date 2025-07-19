import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- CONFIGURATION ---
const app = express();
const PORT = process.env.PORT || 3001;

const dbConfig = {
    host: '62.146.236.71',
    port: 3306,
    user: 'trinh',
    password: 'R4mcP3FsePkz2d3C',
    database: 'trinh',
    connectTimeout: 10000
};

// --- MIDDLEWARE ---
app.use(cors()); // Allow requests from our React app
app.use(express.json()); // Allow the server to understand JSON

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'dist')));

// --- API ENDPOINTS ---

/**
 * @api {get} /api/tables
 * @description Returns a list of all tables in the database.
 */
app.get('/api/tables', async (req, res) => {
    let connection;
    try {
        console.log('Attempting to connect to the database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('Database connection successful!');

        console.log('Fetching table list...');
        const [rows] = await connection.execute('SHOW TABLES');
        console.log(`Found ${rows.length} tables.`);

        // The result is an array of objects, we need to extract the table names.
        const tables = rows.map(row => Object.values(row)[0]);

        res.json({ success: true, tables: tables });

    } catch (error) {
        console.error('An error occurred:', error.message);
        res.status(500).json({ success: false, message: 'An error occurred while connecting to the database or fetching data.', error: error.message });
    } finally {
        if (connection) {
            await connection.end();
            console.log('Database connection closed.');
        }
    }
});

// Serve React app for all other routes (SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// --- SERVER STARTUP ---
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`📱 Frontend: http://localhost:${PORT}`);
    console.log(`🔧 API: http://localhost:${PORT}/api`);
}); 