const express = require("express");
const app = express();
const cors = require("cors");
const konek = require("./config/connections/connection");
const users = require("./database/users");
const newsRoutes = require("./routes/news");
const authRoutes = require("./routes/auth");
const bodyParser = require("body-parser");
require("dotenv").config();

// middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// buat tabel
// users.createTabelUsers(konek);
// buatr sebuah routes
app.use("/news", newsRoutes);
app.use("/auth", authRoutes);

// buat server local
app.listen(process.env.PORT, () => {
  console.log("Koneksi to server");
});
