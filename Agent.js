const { response } = require('express')
const express = require('express')
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const app = express();
const AWS = require('aws-sdk');
const fs = require('fs');
const {v4: uuidv4} = require('uuid');

const {S3Client, PutObjectCommand, BucketType} = require('@aws-sdk/client-s3')
const dotenv = require('dotenv');
dotenv.config();
// Initialize express-session to manage sessions
app.use(session({ secret: 'your-secret-key', resave: false, saveUninitialized: false }));

// const Pool = require('pg').Pool
// const pool = new Pool({
//     host: 'localhost',
//     port: 5432,
//     database: 'login',
//     user: 'postgres',
//     password: 'Abhi@2001',
// })
AWS.config.update({
  accessKeyId:  process.env.ACCESS_KEY,
  secretAccessKey:  process.env.SECRET_ACCESS_KEY,
  region:  process.env.BUCKET_REGION,
});
console.log(AWS.config.update)
const s4 = new AWS.S3();

const mysql = require('mysql');
const bucketname = process.env.BUCKET_NAME;
const bucketRegion =  process.env.BUCKET_REGION;
const accessKey =  process.env.ACCESS_KEY;
const secretAccessKey =  process.env.SECRET_ACCESS_KEY;
console.log(bucketname,bucketRegion,accessKey)
const s3 = new S3Client({
  region: bucketRegion,
  credentials: ({
    accessKeyId: accessKey,  
    secretAccessKey: secretAccessKey,
  }),
});
const connection = mysql.createConnection({
  host: '68.178.149.116', 
  port:'3306',
  user: 'truckbooking',
  password: 'truckbooking',
  database: 'truckbooking',
  connectTimeout: 30000,
 
});                            
 
connection.connect((err,connection) => {
  if (err) {
    console.error('Error connecting to MySQL:', err.stack);
    return;
  } 

  console.log('Connected to MySQL as ID:', connection.threadId);

  // Release the connection when done

});  
connection.on('error', (err) => {
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.error('Database connection was closed.');
  } else if (err.code === 'ER_CON_COUNT_ERROR') {
    console.error('Database has too many connections.');
  } else if (err.code === 'ECONNRESET') {
    console.error('Connection to database was reset.');
  } else { 
    console.error('Unexpected database error:', err.message);
  }
});
const sessionStore = new MySQLStore({
  expiration: 86400000, // Set the session expiration time (in milliseconds)
  createDatabaseTable: true,
  schema: {
    tableName: 'agent',
    columnNames: {
      session_id: 'session_id',
      expires: 'expires',
      data: 'data',
    },
  },
}, connection);


app.use(session({
  secret: 'asdfghjkl',
  store: sessionStore,
  resave: false,
  saveUninitialized: true,
}));

// Function to execute a query
function getItems() {
  const query = 'SELECT * FROM main'; // Change 'main' to your actual table name

  return new Promise((resolve, reject) => {
    pool.query(query, (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}

  
  // Middleware to ensure the user is authenticated and retrieve the CRN from the session
  app.use((req, res, next) => {
    if (req.session && req.session.crn) {
      res.locals.crn = req.session.crn; // Make CRN available to routes
    }
    next();
  });
  const authenticateUser = (request, response) => {
    const { agentId, password } = request.body;
  
    connection.query(
      'SELECT * FROM agent WHERE agentId = ? AND password = ?',
      [agentId, password],
      (error, results) => {
        if (error) {
          throw error; 
        }
  
        if (results.length === 0) {
          // Authentication failed
          response.status(401).json({ message: 'Please enter valid details and try again' });
        } else {
          // Authentication successful, return user data
          const user = results[0];
          response.status(200).json({ message: 'Authentication successful', user });
        }
      }
      );
    };

    const getInfo=(request,response)=>{
      const { crn} =request.query;
      console.log(crn)
      connection.query('select phonenumber from agent where crn=?',[crn],(error,results)=>{
          if(error){
              throw error
          } 
          const phonenumbers = results.map((row) => row.phonenumber);
          response.json(phonenumbers);
      })
  } 
  const getAgent=(request,response)=>{
    const { crn,phonenumber} =request.query;
    console.log('fetched',crn,phonenumber)
    connection.query('select agentType, name, email, password, phonenumber,aadharNumber, uploadAadhar, doorNo, street, landmark, village, pincode, pancardNumber, uploadPan, mandal, state, district,agentId from agent where crn=? and phonenumber=?',[crn,phonenumber],(error,results)=>{
        if(error){
            throw error 
        } 
        response.status(200).json(results)
console.log(results)
    })
}  
  const getAgentInfo=(request,response)=>{
    const { crn } = request.query;
    console.log(`Fetching data for date range: ${crn}`); // Add a log statement to check query parameters

    connection.query('select * from agent where crn= ?',[crn],(error,results)=>{
        if(error){ 
            throw error
        } 
        response.status(200).json(results)
console.log(results)    
    })
}  
const getAgentUpdate=(request,response)=>{
  
  const{   
    id,
      agentType,
  name,
  email,
  password,
  phonenumber,
  aadharNumber,
  uploadAadhar,
  doorNo,
  street,
  landmark,
  village,
  pincode,
  pancardNumber,
  uploadPan,
  mandal,
  crn,
  state,
  district
  }=request.body
  connection.query('update agent set "agentType"=$2, name=$3, email=$4, password=$5, phonenumber=$6, "aadharNumber"=$7, "uploadAadhar"=$8, "pancardNumber"=$9, "uploadPan"=$10, "doorNo"=$11, street=$12, landmark=$13, village=$14, pincode=$15, mandal=$16, district=$17, state=$18, crn=$19 where id=$1 ',[id,agentType, name, email, password, phonenumber, aadharNumber, uploadAadhar, pancardNumber, uploadPan, doorNo, street, landmark, village, pincode, mandal, district, state, crn],(error,results)=>{
      if(error){
          throw error
      }
      response.status(200).send(`Agent updated with id:${id}`) 
     })
} 

const getAgentInfo1 = (request, response) => {
  const { crn, phonenumber } = request.query;
  console.log(`Fetching data for CRN: ${crn} and Phone Number: ${phonenumber}`); // Log the CRN and phone number

  connection.query(
    'SELECT agentType, name, phonenumber, village, district, state FROM agent WHERE crn = ? AND phonenumber = ?',
    [crn, phonenumber],
    (error, results) => {
      if (error) {
        throw error;
      }
      response.status(200).json(results);
      console.log(results);
    }
  );
};

const getAgentType = (request, response) => {
  const { agentId } = request.query; // Change agentType to phonenumber
  console.log(`Fetching data for phone number: ${agentId}`);

  connection.query('SELECT t1.*, t2.ownername, t2.owneremail FROM agent AS t1 JOIN owner1 AS t2 ON t1.crn = t2.crn WHERE t1.agentId = ?', [agentId], (error, results) => {
    if (error) {
      throw error;
    }
    response.status(200).json(results);
    console.log(results)
  });
};
const getTrucks = (request, response) => {
  const {crn } = request.query;
  console.log(crn);

  connection.query(
    'SELECT t1.*, t2.* FROM truck AS t1 JOIN post1 AS t2 ON t1.truckNumber = t2.truckNumber WHERE t2.crn = ?',
    [crn],
    async (error, results) => {
      if (error) {
        throw error;
      }

      const trucksWithImageURLs = await Promise.all(
        results.map(async (truck) => {
          // Function to get the S3 URL for an image
          const getImageUrl = async (imageName) => {       
            const params = {  
              Bucket: bucketname,  
              Key: imageName,
            };

            const signedUrl = await s4.getSignedUrlPromise('getObject', params);
            return signedUrl;
          };

          const uploadRegistrationUrl = await getImageUrl(truck.uploadRegistration);
          const truckFrontSideWithNumberPlateUrl = await getImageUrl(truck.truckFrontSideWithNumberPlate);
          const truckBackSideWithNumberPlateUrl = await getImageUrl(truck.truckBackSideWithNumberPlate);
          const truckCabinUrl = await getImageUrl(truck.truckCabin);
          const truckOdometerUrl = await getImageUrl(truck.truckOdometer);
          const truckVideoUrl = await getImageUrl(truck.truckVideo);
          const truckPermitUrl = await getImageUrl(truck.truckPermit);
          const truckFitUrl = await getImageUrl(truck.truckFit);
          const truckPollutionCertificateUrl = await getImageUrl(truck.truckPollutionCertificate);
          const truckInsuranceCertificateUrl = await getImageUrl(truck.truckInsuranceCertificate);
          const truckOwnerPassportSizePhotoUrl = await getImageUrl(truck.truckOwnerPassportSizePhoto);
          const rightsideUrl = await getImageUrl(truck.rightside);
          const leftsideUrl = await getImageUrl(truck.leftside);

          return {
            ...truck,
            uploadRegistrationUrl,
            truckFrontSideWithNumberPlateUrl,
            truckBackSideWithNumberPlateUrl,
            truckCabinUrl,
            truckOdometerUrl,
            truckVideoUrl,
            truckPermitUrl,  
            truckFitUrl,
            truckPollutionCertificateUrl,
            truckInsuranceCertificateUrl,
            truckOwnerPassportSizePhotoUrl,
            rightsideUrl,
            leftsideUrl,
          };
        })
      );

      response.status(200).json(trucksWithImageURLs);
    }
  );
};


// Function to get signed URLs for images from S3 bucket

const getOwner=(request,response)=>{
  connection.query('select * from agent ',(error,results)=>{
        if(error){
            throw error
        } 
        response.status(200).json(results)
    })
} 
const getOwnerById=(request,respose)=>{
    const id = parseInt(request.params.id)
    connection.query('select * from agent where id=?',[id],(error,results)=>{
        if(error){
            throw error
        }
           
        respose.status(200).json(results)
    })
}
const createOwner = async (request, response) => {
  try {
    
    const {
      agentType,
    name,
    email,
    password,
    phonenumber,
    aadharNumber,    
  
    doorNo,
    street,
    landmark,
    village,
    pincode,
    pancardNumber,
   
    mandal,
    state,
    district,
    crn,
    } = request.body;

    const { uploadAadhar, uploadPan } = request.files;
    const filenames = {
      uploadAadhar: `aadhar_${uuidv4()}.jpg`, // Use UUID for unique filenames
      uploadPan: `pan_${uuidv4()}.jpg`,
    };

    // Upload files to AWS S3
    await Promise.all([
      uploadFileToS3(uploadAadhar[0], filenames.uploadAadhar),
      uploadFileToS3(uploadPan[0], filenames.uploadPan),
    ]);
    console.log(request.files)
console.log('requst file buffer',request.files.buffer)
    // Insert data into the MySQL database   
    const results = await insertOwnerDataIntoDB({
      agentType,
      name,
      email,
      password,
      phonenumber,
      aadharNumber,  
    
      doorNo,
      street,
      landmark,
      village,
      pincode,
      pancardNumber,
     
      mandal,
      state,
      district,
      crn,
      filenames,
    });

    response.status(200).send(`Truck added with ID: ${results.insertId}`);
  } catch (error) {
    console.error(error);
    response.status(500).send("Internal Server Error");
  }
};

// Function to upload a file to AWS S3
const uploadFileToS3 = async (file, filename) => {
  const params = {
    Bucket: bucketname,
    Key: filename,
    Body: fs.createReadStream(file.path),  
    ContentType: file.mimetype,   
  };    
console.log(params)    
  try {     
    const command = new PutObjectCommand(params);  
    await s3.send(command);
  } catch (error) {   
    console.error('Error uploading file to S3:', error);
    throw error;    
  }  
};    
const agentId = generateRandomAgentId();  
// Function to insert owner data into the MySQL database
const insertOwnerDataIntoDB = async ({ 
  agentType,
    name,
    email,
    password,
    phonenumber,
    aadharNumber,  
  
    doorNo,
    street,
    landmark,
    village,
    pincode,
    pancardNumber,
   
    mandal,
    state,
    district,
    crn,
  filenames,
}) => {
  return new Promise((resolve, reject) => {
    connection.query('insert into agent (agentType, name, email, password, phonenumber, aadharNumber, uploadAadhar, pancardNumber, uploadPan, doorNo, street, landmark, village, pincode, mandal, district, state, crn, agentId) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    [agentType, name, email, password, phonenumber, aadharNumber, filenames.uploadAadhar, pancardNumber, filenames.uploadPan, doorNo, street, landmark, village, pincode, mandal, district, state, crn, agentId],
      (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      }
    );
  });
};
// Function to generate a random 6-digit agent ID
function generateRandomAgentId() {
  const min = 100000; // Minimum 6-digit number
  const max = 999999; // Maximum 6-digit number
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const updateOwner=(request,response)=>{
    const id=parseInt(request.params.id)
    const{ 
        agentType,
    name,
    email,
    password,
    phonenumber,
    aadharNumber,
    uploadAadhar,
    doorNo,
    street,
    landmark,
    village,
    pincode,
    pancardNumber,
    uploadPan,
    mandal,
    crn,
    state,
    district
    }=request.body
    connection.query('update agent set agentType=$2, name=$3, email=$4, password=$5, phonenumber=$6, aadharNumber=$7, "uploadAadhar"=$8, "pancardNumber"=$9, "uploadPan"=$10, "doorNo"=$11, street=$12, landmark=$13, village=$14, pincode=$15, mandal=$16, district=$17, state=$18, crn=$19 where id=$1',[agentType, name, email, password, phonenumber, aadharNumber, uploadAadhar, pancardNumber, uploadPan, doorNo, street, landmark, village, pincode, mandal, district, state, crn],(error,results)=>{
        if(error){
            throw error
        }
        response.status(200).send(`Agent updated with id:${id}`) 
       })
} 
const deleteOwner=(request,response)=>{
    const id=parseInt(request.params.id)
    connection.query('DELETE FROM agent  WHERE id=?',[id],(error,results)=>
    {
        if(error){    
            throw error  
        }
        response.status(200).send(` deleted  Agent with id:${id}`)
    })
}
const deleteBooking = (request, response) => {
    const { id } = request.params;
  
    // Retrieve the booking details to get the truck data
    connection.query('SELECT * FROM booking WHERE id = ?', [id], (error, bookingSelectResult) => {
      if (error) {
        throw error;  
      }
  
      const bookingData = bookingSelectResult[0];
  
      if (bookingData) {
        // Delete the canceled booking
        connection.query('UPDATE booking SET status = ? WHERE id = ?', ['canceled', id], (error, bookingDeleteResult) => {
          if (error) {
            throw error;
          }
  
          // Now, move data from the 'post' table to the 'post1' table based on some criteria (e.g., truckNumber)
          connection.query(
            'INSERT INTO post1 SELECT * FROM post WHERE truckNumber = ?',
            [bookingData.truckNumber],
            (error, post1InsertResult) => {
              if (error) {
                throw error;
              }
  
              response.status(200).send(`Canceled booking with ID ${id}, truck data moved to post1.`);
            } 
          );   
        });    
      } else {
        response.status(404).send('Booking data not found for cancellation.');
      }
    });  
  };
  const getBookDate = (request, response) => {
    const { from, to } = request.query;
    console.log(`Fetching data for date range1: from ${from} to ${to}`);
  
    connection.query(
      'SELECT truckNumber, date, time, `from`, `to`, fromSublocation, toSublocation, totalPrice, tbr, status FROM booking WHERE DATE(`date`) >= ? AND DATE(`date`) <= ?',
      [from, to],
      (error, results) => {  
        if (error) {
          throw error;
        }
        response.status(200).json(results);
      }
    );
  };
  
const getTable1=(request,respose)=>{
  const {feildcrn}=request.query;
  connection.query('select * from owner1 where feildcrn=?',[feildcrn],(error,results)=>{
      if(error){
          throw error
      }
      
      respose.status(200).json(results)
  })
}
const getTable2=(request,respose)=>{
  const {feildcrn}=request.query;
  connection.query('select * from truck where feildcrn=?',[feildcrn],(error,results)=>{
      if(error){
          throw error
      }
  
      respose.status(200).json(results)
  })
}
const getTable3=(request,respose)=>{
  const {feildcrn}=request.query;
  connection.query('select * from truck where feildcrn=?',[feildcrn],(error,results)=>{
      if(error){
          throw error
      }
      
      respose.status(200).json(results)
  })
}

module.exports = { 
  getAgentType,
  getInfo,
    getTrucks,
    getAgentInfo1,
    authenticateUser,
    getAgentInfo,
    getOwner,
    getAgent,
    getOwnerById,
    createOwner,
    updateOwner,
    deleteOwner,
    deleteBooking,
    getBookDate,
    getAgentUpdate,
    getTable1,
    getTable2,
    getTable3,
}  