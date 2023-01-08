const connection = require("../config/connections/connection");

function createTabelNews() {
  connection.query(
    `CREATE TABLE news(
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            image VARCHAR(255) NOT NULL
            
        )`,
    function (err) {
      if (err) throw err;
      console.log("Tabel news berhasil dibuat");
    }
  );
}

module.exports = {
  createTabelNews,
};
