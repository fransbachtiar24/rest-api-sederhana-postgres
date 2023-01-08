const express = require("express");
const app = express();
const cors = require("cors");
const konek = require("./config/connections/connection");
const news = require("./database/news");
const newsRoutes = require("./routes/news");
const bodyParser = require("body-parser");

// middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// buat tabel
// news.createTabelNews(konek);

// buatr sebuah routes
app.use("/news", newsRoutes);

// buat server local
app.listen("5000", () => {
  console.log("Koneksi to server https://localhost:5000");
});
