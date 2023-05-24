//
// app.post('/image/:userid', async (req, res) => {...});
//
// Uploads an image to the bucket and updates the database,
// returning the asset id assigned to this image.
//
const dbConnection = require('./database.js')
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { s3, s3_bucket_name, s3_region_name } = require('./aws.js');

const uuid = require('uuid');

exports.post_image = async (req, res) => {

  console.log("call to /image...");

  try {

    const userid = req.params.userid;
    const rds_response = new Promise((resolve, reject) => {

      console.log("/api_image: calling RDS...");

      var sql = `
        select count(*) as count, bucketfolder as bucketfolder from users where userid = '${userid}';
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
    const rds_result = await rds_response;
    const count = rds_result[0].count;
    const bucketfolder = rds_result[0].bucketfolder;

    if (count === 0) {
      res.status(200).json({
        "message": "no such user...",
        "assetid": -1
      });
    }

    else {
      // call s3
      var data = req.body;
      var bytes = Buffer.from(data.data, 'base64');

      name = uuid.v4();
      bucketkey = bucketfolder.concat("/", name, ".jpg")
      const command = new PutObjectCommand({
        Bucket: s3_bucket_name,
        Key: bucketkey,
        Body: bytes
      });
      const s3_response = await s3.send(command);
      console.log(s3_response);

      const rds_response1 = new Promise((resolve, reject) => {
        const sql = `
      INSERT INTO assets (userid, assetname, bucketkey) VALUES ('${userid}', '${data.assetname}', '${bucketkey}');
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

      await rds_response1;

      // select assetid from assets where userid = '${userid}' and assetname = '${data.assetname}' and bucketkey = '${bucketkey}';


      const rds_response2 = new Promise((resolve, reject) => {
        const sql = `
      select assetid from assets where userid = '${userid}' and assetname = '${data.assetname}' and bucketkey = '${bucketkey}';
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
      const result = await rds_response2;
      console.log(result);
      console.log(result[0].assetid);

      res.json({
        "message": "success",
        "assetid": result[0].assetid
      });

    }


  }//try
  catch (err) {
    res.status(400).json({
      "message": "some sort of error message",
      "assetid": -1
    });
  }//catch

}//post
