const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const express = require('express');

const app = express();
const port = 8888;
const dbPort = 3306; // Defina a porta corretamente

app.use(cors());
app.use(bodyParser.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'hearme',
    port: dbPort // Inclua a porta na configuração
});

db.connect((err) => {
    if (err) {
        return console.error('Error Connecting to database:', err.message);
    }
    console.log(`Connection established on port ${dbPort}`);
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

module.exports = { db, app };
