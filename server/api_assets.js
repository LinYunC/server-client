//
// app.get('/assets', async (req, res) => {...});
//
// Return all the assets from the database:
//
const dbConnection = require('./database.js')

exports.get_assets = async (req, res) => {

  console.log("call to /assets...");

  try {    
      var rds_response = new Promise((resolve, reject) => {

      console.log("/assets: calling RDS...");

      var sql = `
      Select * From assets order by assetid;
      `;

      dbConnection.query(sql, (err, results, _) => {
        if (err) {
          reject(err);
          return;
        }

        console.log("/assets query done");
        resolve(results);
      });
        
    });

    const assets = await rds_response;

    console.log("/stats done, sending response...");

    res.json({
      "message": "success",
      "data": assets
    });
  }//try

    
  catch (err) {
    res.status(400).json({
      "message": err.message,
      "data": []
    });
  }//catch

}//get
