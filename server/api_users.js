//
// app.get('/users', async (req, res) => {...});
//
// Return all the users from the database:
//
const dbConnection = require('./database.js')


exports.get_users = async (req, res) => {
  
  console.log("call to /users...");


  try {

      var rds_response = new Promise((resolve, reject) => {

      console.log("/users: calling RDS...");

      var sql = `
      Select * From users order by userid;
      `;

      dbConnection.query(sql, (err, results, _) => {
        if (err) {
          reject(err);
          return;
        }

        console.log("/users query done");
        resolve(results);
      });
        
    });

    const users = await rds_response;

    console.log("/users done, sending response...");

    res.json({
      "message": "success",
      "data": users
    });
 
    // MySQL in JS:
    //   https://expressjs.com/en/guide/database-integration.html#mysql
    //   https://github.com/mysqljs/mysql
    //
    

  }//try
  catch (err) {
    res.status(400).json({
      "message": err.message,
      "data": []
    });
   }//catch

}//get


