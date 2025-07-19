import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';

// --- CONFIGURATION ---
const app = express();
const PORT = 3001; // We'll run this on a different port than the React app

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


// --- SERVER STARTUP ---
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
}); 