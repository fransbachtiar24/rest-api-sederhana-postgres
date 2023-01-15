const express = require("express");
const router = express.Router();
const connection = require("../config/connections/connection");
const multer = require("multer");
const path = require("path");

// set penyimpanan diarahkan kemana
const storage = multer.diskStorage({
  destination: "../public/doc",
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
  limits: { fileSize: 30000000 },
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
}).single("document");

// check type file
function checkFileType(file, cb) {
  // type yang diperbolehkan
  const filetypes = /pdf|doc|docx|ppt|pptx/;

  // check extensi dari file tersebut
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  // mime check
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb("Error: Only pdf, doc, docx, ppt, pptx files are allowed!");
  }
}

// create
router.post("/add", upload, (req, res) => {
  const perihal = req.body.perihal;
  const file = req.file.file;
  // Query untuk memasukkan data ke dalam tabel documents
  const query = "INSERT INTO documents (perihal, file) VALUES ($1, $2)";
  const values = [perihal, file];
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

router.use("/documents", express.static("../public/documents"));

module.exports = router;
