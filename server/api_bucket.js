//
// app.get('/bucket?startafter=bucketkey', async (req, res) => {...});
//
// Retrieves the contents of the S3 bucket and returns the 
// information about each asset to the client. Note that it
// returns 12 at a time, use startafter query parameter to pass
// the last bucketkey and get the next set of 12, and so on.
//
const { ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { s3, s3_bucket_name, s3_region_name } = require('./aws.js');


exports.get_bucket = async (req, res) => {

  console.log("call to /bucket...");

  try {
    const input = {
      Bucket: s3_bucket_name,
      MaxKeys: 12
    };
    
    if (req.query.startafter){
      input["StartAfter"] = req.query.startafter;
    }

    console.log("/bucket: calling S3...");

    // var command = new ListObjectsV2Command(input);

    const command = new ListObjectsV2Command(input);
    var s3_response = await s3.send(command);

    if (s3_response["KeyCount"]){
      bucket = s3_response["Contents"];
    }
    else{
      bucket = [];
      console.log(`No more asset after (key = {$input["StartAfter"]})`)
    }

    // app.get('?startafter=key', (req, res) => {
    //   key = req.params.key;
    // });

    res.json({
        "message": "success",
        "data": bucket
      });
    //
    // AWS:
    //   https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/javascript_s3_code_examples.html
    //   https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/classes/listobjectsv2command.html
    //   https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/
    //
    

  }//try
  catch (err) {
    res.status(400).json({
      "message": err.message,
      "data": []
    });
  }//catch

}//get
