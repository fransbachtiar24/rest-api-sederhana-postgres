const express = require("express");
const router = express.Router();
const connection = require("../config/connections/connection");
const multer = require("multer");
const path = require("path");

// set penyimpanan diarahkan kemana
const storage = multer.diskStorage({
  destination: "../public/image",
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

// upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 8000000 },
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
}).single("image");

// check type file
function checkFileType(file, cb) {
  // type yang diperbolehkan
  const filetypes = /jpeg|jpg|png|gif/;

  // check extensi dari file tersebut
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  // mime check
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb("Error: Images Only !");
  }
}

// get akaklsds
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

// get by id
router.get("/:id", (req, res) => {
  const query = "SELECT title, image FROM news WHERE id = $1";
  const values = [req.params.id];
  connection.query(query, values, (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send({ error: "Error Mengambil data" });
    } else {
      res.send({
        status: 200,
        message: "Success",
        data: {
          title: result.rows[0].title,
          image: result.rows[0].image,
        },
      });
    }
  });
});

// create
router.post("/add", upload, (req, res) => {
  const title = req.body.title;
  const image = req.file.filename;
  // Query untuk memasukkan data ke dalam tabel news
  const query = "INSERT INTO news (title, image) VALUES ($1, $2)";
  const values = [title, image];
  connection.query(query, values, (err) => {
    if (err) {
      console.error(err);
      res.status(500).send({ error: "Error Menambahkan data" });
    } else {
      res.send({
        status: 201,
        data: {
          message: "Data berhasil ditambah",
        },
      });
    }
  });
});

router.use("/image", express.static("../public/image"));

// get
router.get("/image/:image", (req, res) => {
  const query = "SELECT image FROM news WHERE image = $1";
  const values = [req.params.image];
  connection.query(query, values, (err, results) => {
    if (err) {
      res.status(500).send({ error: "Error Mengambil data" });
    } else {
      res.sendFile(
        path.join(__dirname, "..public/image", results.rows[0].image)
      );
    }
  });
});

// Update News
router.put("/:id", upload, (req, res) => {
  const id = req.params.id;
  const title = req.body.title;
  const image = req.file.filename;
  const query = "UPDATE news SET title = $1, image = $2 WHERE id = $3";
  const values = [title, image, id];
  connection.query(query, values, (err) => {
    if (err) {
      console.error(err);
      res.status(500).send({ error: "Error mengupdate data" });
    } else {
      res.send({
        status: 200,
        data: {
          message: "Data berhasil diupdate",
        },
      });
    }
  });
});

// Delete News
router.delete("/:id", (req, res) => {
  const id = req.params.id;
  const query = "DELETE FROM news WHERE id = $1";
  const values = [id];
  connection.query(query, values, (err) => {
    if (err) {
      console.error(err);
      res.status(500).send({ error: "Error menghapus data" });
    } else {
      res.send({
        status: 200,
        data: {
          message: "Data berhasil dihapus",
        },
      });
    }
  });
});

module.exports = router;
