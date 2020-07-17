var express     = require("express");
var router      = express.Router({mergeParams: true});
var Product     = require("../models/product");
var Comment     = require("../models/comment");
var middleware  = require("../middleware/index.js");


//----------------------------------------------------COMMENTS NEW ROUTE
router.get("/new",middleware.isLoggedIn, function(req,res){
    Product.findById(req.params.id, function(err, foundProduct){
        if(err){
            console.log(err);
        }else{
            res.render("comments/new", {product: foundProduct});
        }
    });
});


//----------------------------------------------------COMMENTS CREATE ROUTE
router.post('/',middleware.isLoggedIn, function(req, res){
    // lookup product using id
    Product.findById(req.params.id, function(err, foundProduct){
        if(err){
            console.log(err);
            res.redirect("/products");
        }else{
            // create new comment
            Comment.create(req.body.comment, function(err, createdComment){
                if(err){
                    req.flash("error", "Something went wrong");
                    console.log(err);
                }else{
                    // add username and id to comment
                    createdComment.author.id = req.user._id;
                    createdComment.author.username = req.user.username;
                    
                    //save comment
                    createdComment.save();

                    //connect new comment to product
                    foundProduct.comments.push(createdComment);
                    foundProduct.save();

                    // redirect to product show page
                    req.flash("success", "Successfully added comment");
                    res.redirect('/products/' + foundProduct._id);
                }
            });
        }
    });
});

//---------------------------------------------------COMMENTS EDIT ROUTE
router.get('/:comment_id/edit',middleware.checkCommentOwnership, function(req, res){
    Product.findById(req.params.id, function(err, foundProduct){
        if(err || !foundProduct){
            req.flash("error", "Product not found");
            return res.redirect("back");
        }
        Comment.findById(req.params.comment_id, function(err, foundComment){
            if(err){
                res.redirect("back");
            }else{
                res.render("comments/edit", {product_id: req.params.id, comment: foundComment});
            }
        });
    });  
});


// --------------------------------------------------COMMENTS UPDATE ROUTE
router.put("/:comment_id",middleware.checkCommentOwnership, function(req, res){
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment){
        if(err){
            res.redirect("back");
        }else{
            res.redirect("/products/" + req.params.id);
        }
    });
});

//------------------------------------------------------COMMENTS DESTROY ROUTE
router.delete('/:comment_id',middleware.checkCommentOwnership, function(req,res){
    Comment.findByIdAndRemove(req.params.comment_id, function(err){
        if(err){
            res.redirect("back");
        }else{
            Product.findByIdAndUpdate(req.params.id, 
                {
                 $pull: {comments:req.params.comment_id}   
                }, function(err){
                    if(err){
                        return res.redirect("back");
                    }
                    req.flash("success", "Comment deleted");
                    res.redirect("/products/" + req.params.id);
            });
        }
    });
});


module.exports = router;