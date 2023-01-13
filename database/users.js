const connection = require("../config/connections/connection");

function createTabelUsers() {
  connection.query(
    `CREATE TABLE users(
            id SERIAL PRIMARY KEY, 
             nama VARCHAR(255) NOT NULL,
             email VARCHAR(255) NOT NULL UNIQUE,
             password VARCHAR(255) NOT NULL,
             gender VARCHAR(255),
            alamat VARCHAR(255),
                role VARCHAR(255) NOT NULL DEFAULT 'user',
                verified BOOLEAN NOT NULL DEFAULT FALSE
        )`,
    function (err) {
      if (err) throw err;
      console.log("Tabel Users Berhasil dibuat");
    }
  );
}

module.exports = {
  createTabelUsers,
};
