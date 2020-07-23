// db.js

const mongoose = require("mongoose")
const {dbUsername, dbPassword, dbName} = require("../Configs/config")

const dbConnectionUrl = `mongodb+srv://${dbUsername}:${dbPassword}@billel-ap34a.mongodb.net/${dbName}?retryWrites=true&w=majority`

exports.InitiateMongoServer = async () => {
    try {
        console.log("test")
        await mongoose.connect(dbConnectionUrl, {
            useNewUrlParser: true
        });

        console.log("Connected to DB !!")
    } catch (e) {
        console.log(e);
        throw e;
    }
};