require('dotenv').config()
const axios = require('axios')
var BoxSDK = require('box-node-sdk');
const fs = require('fs');

// Global constants
const S3_URL = 'https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/images/s3-photo-album-example.png';
const FILE_NAME = 's3Img.png';
const FOLDER_ID = '0'; // All Files (root folder)

// Initialize the SDK with your app credentials
var sdk = new BoxSDK({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET
});

// Create a basic API client, which does not automatically refresh the access token
var client = sdk.getBasicClient(process.env.DEVELOPER_TOKEN);

// Helper Functions

const downloadImage = async(url, filepath) => {
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    });
    return new Promise((resolve, reject) => {
        response.data.pipe(fs.createWriteStream(filepath))
            .on('error', reject)
            .once('close', () => resolve(filepath)); 
    });
}


// Main
const main = async () => {
    // Check access token by fetching my user object
    try {
        const profile = await client.users.get(client.CURRENT_USER_ID);
        console.log(`INFO: Logged in as ${profile.name}`)
    } catch (error) {
        return console.error(`Error: ${error.message}`); 
    }

    // Downloads image from S3
    console.log(`INFO: Attempting to download photo from ${S3_URL}`);
    try {
        await downloadImage(S3_URL, FILE_NAME);
    } catch (error) {
        return console.error(`Error: ${error.message}`); 
    }

    // Uploads image to Box
    console.log(`INFO: Attempting to upload file ${FILE_NAME} to folder with ID ${FOLDER_ID}`);
    try {
       const uploadResponse = await client.files.uploadFile(FOLDER_ID, FILE_NAME, fs.readFileSync(FILE_NAME));
    } catch (error) {
        // Don't return as we wan't to local file either way
        console.error(`Error: ${error.message}`); 
    }
    
    // Deletes local file
    console.log(`INFO: Attempting to delete file ${FILE_NAME} locally`);
    fs.unlinkSync(FILE_NAME);

    console.log('INFO: Done!')
}

main();