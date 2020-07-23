// config.js
const dotenv = require('dotenv')
dotenv.config()


module.exports = {
    //DB creds
    dbUsername: process.env.dbUsername,
    dbPassword: process.env.dbPassword,
    dbName: process.env.dbName
}