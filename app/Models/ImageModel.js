const mongoose = require("mongoose");

const ImageSchema = mongoose.Schema({
    finalImg: {
        contentType: {type: String},
        image: {type: Buffer}
    }
});

const Image = mongoose.model("Image", ImageSchema);
module.exports = Image;
