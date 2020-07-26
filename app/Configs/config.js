// config.js
const dotenv = require('dotenv')
dotenv.config()


module.exports = {
    //DB creds
    dbUsername: process.env.dbUsername,
    dbPassword: process.env.dbPassword,
    dbName: process.env.dbName,

    cloud_name: process.env.cloud_name,
    api_key: process.env.api_key,
    api_secret: process.env.api_secret
}