const { Client } = require("pg");
require("dotenv").config();

const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

client.connect((err) => {
  if (err) {
    console.log("Koneksi ke database gagal:", err.stack);
  } else {
    console.log("Koneksi ke database berhasil");
  }
});

module.exports = client;
