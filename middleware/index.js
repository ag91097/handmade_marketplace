// all middleware goes here
var Product     = require("../models/product");
var Comment     = require("../models/comment");
var Review      = require("../models/review");

//--All middleware function stored in this
var middlewareObj = {};

//Middleware to allow authorised person to edit or delete products
middlewareObj.checkProductOwnership = function(req, res, next){
    if(req.isAuthenticated()){
        Product.findById(req.params.id, function(err, foundProduct){
            if(err || !foundProduct){
                req.flash("error", "Product not found");
                res.redirect("back");
            }else{
                //console.log(foundProduct.author.id);      //** mongoose object
                //console.log(req.user._id);                   //** this is string
                //---------------------does user own product?
                if(foundProduct.author.id.equals(req.user._id) || req.user.isAdmin){    //**equals is a method that comes with mongoose */
                    next();
                }else{
                    // otherwise , redirect
                    req.flash("error", "You don't have permission to do that");
                    res.redirect("back");
                }
            }
        });
    }else{
        // if not logged in, redirect
        req.flash("error", "You need to be Logged In");
        res.redirect("back");
    }
}

// Middleware to allow authorised person to edit or delete comments
middlewareObj.checkCommentOwnership = function(req, res, next){
    if(req.isAuthenticated()){
        Comment.findById(req.params.comment_id, function(err, foundComment){
            if(err || !foundComment){
                req.flash("error", "Comment not found");
                res.redirect("back");
            }else{
                
                if(foundComment.author.id.equals(req.user._id) || req.user.isAdmin){  
                    next();
                }else{
                    req.flash("error", "You dont have permission to do that");
                    res.redirect("back");
                }
            }
        });
    }else{
        req.flash("error", "You need to be Logged In");
        res.redirect("back");
    }
}

// Middleware to allow authorised person to edit or delete reviews
middlewareObj.checkReviewOwnership = function(req, res, next) {
    if(req.isAuthenticated()){
        Review.findById(req.params.review_id, function(err, foundReview){
            if(err || !foundReview){
                res.redirect("back");
            }  else {
                // does user own the comment?
                if(foundReview.author.id.equals(req.user._id) || req.user.isAdmin) {
                    next();
                } else {
                    req.flash("error", "You don't have permission to do that");
                    res.redirect("back");
                }
            }
        });
    } else {
        req.flash("error", "You need to be logged in to do that");
        res.redirect("back");
    }
};

// Middleware to allow authorised person to add review only once
middlewareObj.checkReviewExistence = function (req, res, next) {
    if (req.isAuthenticated()) {
        Product.findById(req.params.id).populate("reviews").exec(function (err, foundProduct) {
            if (err || !foundProduct) {
                req.flash("error", "Product not found.");
                res.redirect("back");
            } else {
                // check if req.user._id exists in foundProduct.reviews
                var foundUserReview = foundProduct.reviews.some(function (review) {
                    return review.author.id.equals(req.user._id);
                });
                if (foundUserReview) {
                    req.flash("error", "You already wrote a review.");
                    return res.redirect("/products/" + foundProduct._id);
                }
                // if the review was not found, go to the next middleware
                next();
            }
        });
    } else {
        req.flash("error", "You need to login first.");
        res.redirect("back");
    }
};

// Middleware to check whether user is loggedin or not while creating new comment or product
middlewareObj.isLoggedIn = function(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error", "You need to be Logged In");
    res.redirect('/login');
};

module.exports = middlewareObj;