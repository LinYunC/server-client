//
// app.put('/user', async (req, res) => {...});
//
// Inserts a new user into the database, or if the
// user already exists (based on email) then the
// user's data is updated (name and bucket folder).
// Returns the user's userid in the database.
//
const dbConnection = require('./database.js')

exports.put_user = async (req, res) => {

  console.log("call to /user...");

  try {


    const data = req.body;  // data => JS object
    console.log(data);

    const rds_response = new Promise((resolve, reject) => {

      console.log("/user: calling RDS...");

      var sql = `
      select count(*) as count from users where email = '${data.email}';
      `;
      console.log(sql);

      dbConnection.query(sql, (err, results, _) => {

        console.log(err);
        if (err) {
          reject(err);
          return;
        }


        console.log("/user query done");
        resolve(results);
      });

    });

    const count = (await rds_response)[0].count;
    console.log(count);

    if (count === 0) {
      const rds_response = new Promise((resolve, reject) => {
        const sql = `
      INSERT INTO users (email, lastname, firstname, bucketfolder) VALUES ('${data.email}', '${data.lastname}', '${data.firstname}', '${data.bucketfolder}');
      `;
        console.log(sql);

        dbConnection.query(sql, (err, results, _) => {

          console.log(err);
          if (err) {
            reject(err);
            return;
          }

          console.log("insert done");
          resolve(results);
        });

      });

      const result = await rds_response;
      console.log(result)
      console.log(result.affectedRows)
      console.log(result.insertId)
      if (result.affectedRows !== 1) {
        throw "affectedRows !== 1"
      }

      res.status(200).json({
        "message": "inserted",
        "userid": result.insertId
      });


    } else {

      const rds_response = new Promise((resolve, reject) => {

        const sql = `
      select userid from users where email = '${data.email}';
      update users 
      set lastname = '${data.lastname}', firstname = '${data.firstname}', bucketfolder = '${data.bucketfolder}'
      where email = '${data.email}';
      `;
        console.log(sql);

        dbConnection.query(sql, (err, results, _) => {

          console.log(err);
          if (err) {
            reject(err);
            return;
          }

          console.log("insert done");
          resolve(results);
        });

      });

      const result = await rds_response;

      console.log(result)

      res.status(200).json({
        "message": "updated",
        "userid": result[0][0].userid
      });
    }

  } //try
  catch (err) {
    res.status(400).json({
      "message": "some sort of error message",
      "userid": -1
    });
  }//catch

}//put
