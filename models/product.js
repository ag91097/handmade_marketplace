var mongoose = require("mongoose");
const Comment = require('./comment');


// SCHEMA SETUP
var productSchema = new mongoose.Schema({
    name: String,
    price: String,
    image: String,
    imageId: String,
    description: String,
    createdAt: {type: Date, default: Date.now },
    author: {
        id:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    comments: [
        {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment"
        }
    ],
    // ------------reviews ObjectId references array
    reviews: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Review"
        }
    ],
    //----------rating which will hold the average rating for the selected product, based on all user reviews.
    rating: {
        type: Number,
        default: 0
    }
});

//------------------------pre hook to delete comment if author is deleting the product
productSchema.pre('remove', async function(){
    await Comment.deleteMany({
        _id: {
            $in: this.comments
        }
    });
});

module.exports =  mongoose.model("Product", productSchema);

