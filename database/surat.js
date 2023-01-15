const connection = require("../config/connections/connection");

function createTabelSurat() {
  connection.query(
    `CREATE TABLE surat(
            id SERIAL PRIMARY KEY, 
            perihal VARCHAR(255) NOT NULL,
            file BYTEA
        )`,
    function (err) {
      if (err) throw err;
      console.log("Tabel Surat");
    }
  );
}

module.exports = {
  createTabelSurat,
};
