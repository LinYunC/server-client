//
// app.get('/download/:assetid', async (req, res) => {...});
//
// downloads an asset from S3 bucket and sends it back to the
// client as a base64-encoded string.
//
const dbConnection = require('./database.js')
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { s3, s3_bucket_name, s3_region_name } = require('./aws.js');


exports.get_download = async (req, res) => {

  console.log("call to /download...");

  try {
    //find assetid in db->lookup to bucketkey in db

    const asset_id = req.params.assetid;
    if (asset_id === undefined){
      console.log("no asset id")
    }
    
    const rds_response = new Promise((resolve, reject) => {

      console.log("/stats: calling RDS...");

      var sql = `
      Select bucketKey As bucketKey, userid as userid, assetname as assetname From assets where assetid = ${asset_id};
      `;

      //console.log(sql);

      dbConnection.query(sql, (err, results) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(results);
      });
    });

    const rds_result = await rds_response;
    //console.log(rds_result);
    
    if (rds_result.length === 0) {
      throw new Error("No such assets...");
    }

    const bucketkey = rds_result[0]["bucketKey"];
    const userid = rds_result[0]["userid"];
    const assetname = rds_result[0]["assetname"];
    

    //get object from bucketKey that is found previously
    const command = new GetObjectCommand({
      Bucket: s3_bucket_name,
      Key: bucketkey
    });
    const s3_response = await s3.send(command);
    const datastr = await s3_response.Body.transformToString("base64");

    //console.log(datastr);
    

    res.json({
      "message": "success",
      "user_id" : userid,
      "asset_name" : assetname,
      "bucket_key" : bucketkey,
      "data" : datastr
    });


/*

    
    //console.log(s3_response);
    
    Promise.all([s3_response, rds_response]).then(results => {

    console.log("/stats done, sending response...");

      res.json({
        "message": "success",
      });
    });
      
    
    
    // AWS:
    //   https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/javascript_s3_code_examples.html
    //   https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/classes/getobjectcommand.html
    //   https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/
    //
    
*/

    
  }//try
    
  catch (err) {
    //
    // generally we end up here if we made a 
    // programming error, like undefined variable
    // or function:
    //
    res.status(200).json({
      "message": err.message,
      "user_id": -1,
      "asset_name": "?",
      "bucket_key": "?",
      "data": []
    });
  }//catch

}//get