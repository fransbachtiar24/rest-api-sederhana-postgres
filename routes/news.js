const express = require("express");
const router = express.Router();
const connection = require("../config/connections/connection");

// get
router.get("/all", (req, res) => {
  connection.query("SELECT id, title, image FROM news", (error, results) => {
    if (error) throw error;
    res.send({
      status: 200,
      message: "Success",
      data: {
        resutls: results.rows,
      },
    });
  });
});

// create
router.post("/add", (req, res) => {
  const { title, image } = req.body;
  // Query untuk memasukkan data ke dalam tabel news
  const query = "INSERT INTO news (title, image) VALUES ($1, $2)";
  const values = [title, image];
  connection.query(query, values, (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send({ error: "Error inserting data into database" });
    } else {
      res.send({ message: "Data inserted into database successfully" });
    }
  });
});

module.exports = router;
