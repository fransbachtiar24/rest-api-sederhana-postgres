const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const connection = require("../config/connections/connection");
const { check, validationResult } = require("express-validator");

// register
router.post(
  "/register",
  [
    check("nama").not().isEmpty().withMessage("Nama harus diisi"),
    check("email").isEmail().withMessage("Format email tidak valid"),
    check("password")
      .isLength({ min: 8 })
      .withMessage("Password minimal 8 karakter"),
    check("confirmPassword").custom(
      (value, { req }) => value === req.body.password
    ),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // cek email apakah sudah terdaftar
    connection.query(
      `SELECT COUNT(*) as count FROM users WHERE email = $1`,
      [req.body.email],
      (error, results) => {
        if (error) {
          return res
            .status(500)
            .send({ message: "Kesalahan saat cek email di database" });
        }

        if (results.rows[0].count > 0) {
          return res
            .status(400)
            .send({ data: { message: "Email sudah terdaftar" } });
        }

        // enkripsi password yang diterima
        bcrypt.hash(req.body.password, 10, (error, hash) => {
          if (error) {
            return res
              .status(500)
              .send({ message: "Kesalahan saat enkripsi password" });
          }

          // tambahkan data user ke tabel users di database
          const newUser = {
            nama: req.body.nama,
            email: req.body.email,
            password: hash,
            verified: false,
          };
          connection.query(
            `INSERT INTO users (nama, email, password, verified) VALUES($1, $2, $3, $4)`,
            [newUser.nama, newUser.email, newUser.password, newUser.verified],
            (error, results) => {
              if (error) {
                return res.status(500).send({
                  message: "Kesalahan saat menambahkan user ke database",
                });
              }

              // kirim kode verifikasi ke email yang didaftarkan
              const transport = nodemailer.createTransport({
                service: "gmail",
                auth: {
                  user: process.env.EMAIL_USERNAME,
                  pass: process.env.EMAIL_PASSWORD,
                },
              });
              const mailOptions = {
                from: process.env.EMAIL_USERNAME,
                to: req.body.email,
                subject: "Verifikasi Email Anda",
                html: `
                <!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="description" content="ngawurNews">
  <meta name="keywords" content="ngawurNews, Javascript, NodeJS, ExpressJS">
  <meta name="author" content="Frans Bachtiar">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous">
  <style>
    @import "https://fonts.googleapis.com/css2?family=Open+Sans&display=swap";
    * {
      font-family: "Open Sans", sans-serif;
      box-sizing: border-box;
    }
    .auth-title {
      text-align: center;
      color: white;
      margin: 0;
      margin-top: 30px;
      margin-bottom: 10px;
    }
    .auth-content {
      border: 2px solid #0a1d37;
      border-radius: 3px;
      line-height: 30px;
      max-width: 800px;
      margin: 0 auto;
      margin-bottom: 30px;
      padding: 25px;
    }
    .auth-button {
      background-color: #6c63ff;
      text-decoration: none;
      text-align: center;
      border-radius: 5px;
      font-weight: bold;
      margin: 0 auto;
      padding: 5px;
      display: block;
      width: 150px;
  }
  </style>
  <title>Verify Your Account!</title>
</head>
<body style="background-color: #6c63ff; padding: 20px;">
  <h1 class="auth-title">
   NgawurNews.com
  </h1>
  <div class="auth-content" style="background-color: white;">
    <p style="font-size: 20px;">Hello! Welcome To Our ngawurNews</p>
    <hr>
     <p>
    You received this email because your account has been registered at ngawurNews
    <br>
    Immediately activate your account by clicking the button below.
  </p>
  <a
  href="https://rest-api-sederhana-postgres-production-ba57.up.railway.app/auth/verify?email=${
    req.body.email
  }"
  class="btn btn-primary"
>
  Activate Account
</a>
<p>
  If you don't feel like registering an account at NgawurNews, please ignore this email.
    <br>
    Link alternatif: <a href="https://rest-api-sederhana-postgres-production-ba57.up.railway.app/auth/verify?email=${
      req.body.email
    }">${req.body.email}</a>
  </p>
   <hr>
  
  <p>Copyright &copy; ${new Date().getFullYear()} ngawurNews 
   </div>
</body>
</html>
                `,
              };
              transport.sendMail(mailOptions, (error, info) => {
                if (error) {
                  return res.status(500).send({
                    message: "Kesalahan saat mengirim email verifikasi",
                  });
                }
                res.status(200).send({
                  message:
                    "Berhasil mendaftar, silahkan cek email Anda untuk verifikasi",
                });
              });
            }
          );
        });
      }
    );
  }
);

// verify email
router.get("/verify/:email", (req, res) => {
  const email = req.params.email;
  connection.query(
    `UPDATE users SET verified = true WHERE email = $1`,
    [email],
    (error, results) => {
      if (error) {
        return res
          .status(500)
          .send({ message: "Kesalahan saat memverifikasi email di database" });
      }

      if (results.rowCount === 0) {
        return res.status(404).send({ message: "Email tidak ditemukan" });
      }

      connection.query(
        `SELECT * FROM users WHERE email = $1`,
        [email],
        (error, results) => {
          if (error) {
            return res.status(500).send({
              message: "Kesalahan saat mendapatkan data user dari database",
            });
          }

          const user = results.rows[0];
          const payload = {
            userId: user.id,
            nama: user.nama,
            email: user.email,
          };

          jwt.sign(
            payload,
            process.env.SECRET_KEY,
            { expiresIn: "5m" },
            (error, token) => {
              if (error) {
                return res
                  .status(500)
                  .send({ message: "Kesalahan saat mengenerate token" });
              }

              res
                .status(200)
                .send({ message: "Email berhasil diverifikasi", token });
            }
          );
        }
      );
    }
  );
});

// login
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email dan password harus diisi" });
  }

  // cek apakah email sudah terdaftar
  connection.query(
    `SELECT * FROM users WHERE email = $1`,
    [email],
    (error, results) => {
      if (error) {
        return res.status(500).json({ message: "Error cek email di database" });
      }

      if (results.rowCount === 0) {
        return res.status(404).json({ message: "Silahkan Register" });
      }

      const user = results.rows[0];

      // cek apakah password sesuai
      bcrypt.compare(password, user.password, (error, isMatch) => {
        if (error) {
          return res.status(500).json({ message: "Error Cek Password" });
        }

        if (!isMatch) {
          return res.status(401).json({ message: "Password salaah" });
        }

        // jika email dan password sesuai maka generate sebuah jwt
        const payload = {
          userId: user.id,
          nama: user.nama,
          role: user.role,
        };
        jwt.sign(
          payload,
          process.env.SECRET_KEY,
          { expiresIn: "10m" },
          (error, token) => {
            if (error) {
              return res.status(500).json({ message: "Error membuat token" });
            }

            res.status(200).json({
              status: true,
              message: "Success Login!",
              data: {
                email: user.email,
                role: user.role,
                token: token,
              },
            });
          }
        );
      });
    }
  );
});

// handle reset
router.post("/password/reset", (req, res) => {
  // cek apakah email terdaftar di database
  connection.query(
    `SELECT COUNT(*) as count FROM users WHERE email = $1`,
    [req.body.email],
    (error, results) => {
      if (error) {
        return res.status(500).send({ message: error.message });
      }
      if (results.rows[0].count === 0) {
        return res.status(404).send({ data: { message: "Email kosong" } });
      }

      // jika email terdaftar
      const token = jwt.sign(
        {
          email: req.body.email,
        },
        process.env.SECRET_KEY,
        {
          expiresIn: "5m",
        }
      );

      const transpoter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
      const mailOptions = {
        from: process.env.EMAIL_USERNAME,
        to: req.body.email,
        subject: "Reset Password",
        html: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="description" content="ngawurNews">
  <meta name="keywords" content="ngawurNews, Javascript, NodeJS, ExpressJS">
  <meta name="author" content="Frans Bachtiar">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous">
  <style>
    @import "https://fonts.googleapis.com/css2?family=Open+Sans&display=swap";
    * {
      font-family: "Open Sans", sans-serif;
      box-sizing: border-box;
    }
    .auth-title {
      text-align: center;
      color: white;
      margin: 0;
      margin-top: 30px;
      margin-bottom: 10px;
    }
    .auth-content {
      border: 2px solid #0a1d37;
      border-radius: 3px;
      line-height: 30px;
      max-width: 800px;
      margin: 0 auto;
      margin-bottom: 30px;
      padding: 25px;
    }
    .auth-button {
      background-color: #6c63ff;
      text-decoration: none;
      text-align: center;
      border-radius: 5px;
      font-weight: bold;
      margin: 0 auto;
      padding: 5px;
      display: block;
      width: 150px;
  }
  </style>
  <title>Reset Password!</title>
</head>
<body style="background-color: #6c63ff; padding: 20px;">
  <h1 class="auth-title">
   NgawurNews.com
  </h1>
  <div class="auth-content" style="background-color: white;">
    <p style="font-size: 20px;">Reset Yours Password</p>
    <hr>
     <p>
    You received this email because your account has been reset password at ngawurNews
    <br>
    Immediately activate your account by clicking the button below.
  </p>
   <p>Klik <a href="https://rest-api-sederhana-postgres-production-ba57.up.railway.app/auth/password/change?token=${token}">link ini</a> untuk merubah password Anda</p>
<p>
  If you don't feel like registering an account at NgawurNews, please ignore this email.
   <p>Token ini akan kedaluwarsa dalam 5 Menit.</p>
    <br>
    Link alternatif: <a href="https://rest-api-sederhana-postgres-production-ba57.up.railway.app/auth/password/change?token=${token}">${token}</a>
  </p>
   <hr>
  <p>Copyright &copy; ${new Date().getFullYear()} ngawurNews 
   </div>
</body>
</html>`,
      };

      // kirim email
      transpoter.sendMail(mailOptions, (error, info) => {
        if (error) {
          return res.status(500).send({ message: error.message });
        }
        res
          .status(200)
          .send({ data: { message: "Reset password email sent" } });
      });
    }
  );
});

// get handle rest
router.get("/password/change", (req, res) => {
  // cek validatiasi token
  jwt.verify(req.query.token, process.env.SECRET_KEY, (error, decode) => {
    if (error) {
      return res.status(401).send({ data: { message: "Invalid Token" } });
    }

    // token valid
    return res.status(200).send({
      data: {
        message: "Token verified",
        email: decode.email,
      },
    });
  });
});

// handle connfirm reset password
router.put("/password/change", (req, res) => {
  // verifikasi token
  jwt.verify(req.query.token, process.env.SECRET_KEY, (error, decode) => {
    if (error) {
      return res.status(401).send({ data: { message: "Unauthorized" } });
    }
    // cek password dan confirm password sama
    if (req.body.password !== req.body.confirmPassword) {
      return res.status(400).send({
        data: { message: "Confirm password harus sama dengan password" },
      });
    }

    bcrypt.hash(req.body.password, 10, (error, hash) => {
      if (error) {
        return res.status(500).send({ message: "Error encrypting password" });
      }

      // update password di database
      connection.query(
        `UPDATE users SET password = $1 WHERE email = $2`,
        [hash, decode.email],
        (error, results) => {
          if (error) {
            return res.status(500).send({
              data: { message: "Error updating password in database" },
            });
          }
          return res
            .status(200)
            .send({ data: { message: "Password Berhasil Di ubah" } });
        }
      );
    });
  });
});
module.exports = router;
