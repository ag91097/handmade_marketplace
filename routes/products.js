var express    = require("express");
var router     = express.Router();
var Product = require("../models/product");
var middleware = require("../middleware/index.js");
var Comment = require("../models/comment");
var Review = require("../models/review");
require('dotenv').config()

//----------------------Adding multer and cloudinary configuration
//----multer configuration
var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

// ------------------------------------cloudinary configuration
var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'dkf8v2slv', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});



// *************** INDEX - show all products
router.get("/", function(req,res){
    
    // console.log(req.user);    // ************info of currently logged in user

    //fuzzy search implementation
    var noMatch = null;
    if(req.query.search){
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
         // Get all products from DB
         Product.find({name: regex}, function(err, allProducts){
            if(err){
                console.log(err);
            } else {
               if(allProducts.length < 1) {
                   noMatch = "No products match that query, please try again.";
               }
               //req.flash('error', err.message);
               res.render("products/index",{products:allProducts});
            }
         });
    }else{
        //get all products from database
        Product.find({}, function(err, allproducts){
            if(err){
                console.log(err);
            }else{
                res.render("products/index", {products: allproducts});     
            }
        });
    }
});

router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res) {
    cloudinary.v2.uploader.upload(req.file.path, function(err,result) {
        if(err){
            req.flash('error', err.message);
            return res.redirect('back');
        }

        // add cloudinary url for the image to the product object under image property
        req.body.product.image = result.secure_url;
        // add image' public_id to product object
        req.body.product.imageId = result.public_id;

        // add author to product
        req.body.product.author = {
          id: req.user._id,
          username: req.user.username
        }
        Product.create(req.body.product, function(err, product) {
          if (err) {
            req.flash('error', err.message);
            return res.redirect('back');
          }
          res.redirect('/products/' + product.id);
        });
    });
});




//********* NEW - show form to create new product */
router.get("/new",middleware.isLoggedIn, function(req,res){
    res.render("products/new");
});

//*********SHOW - show detail of single product */
router.get("/:id", function(req, res){
    // *****************find the product with provided id
    Product.findById(req.params.id).populate("comments").populate({
        path: "reviews",
        options: {sort: {createdAt: -1}}
    }).exec(function(err, foundProduct){
        if(err || !foundProduct){
            // console.log(err);
            req.flash("error", "Product not found");
            res.redirect("back");
        }else{
             res.render("products/show", {product: foundProduct});
        }
    });
});

//***********EDIT PRODUCT ROUTE */
router.get("/:id/edit", middleware.checkProductOwnership, function(req, res){
    Product.findById(req.params.id, function(err, foundProduct){
        res.render("products/edit", {product: foundProduct});
    });
});


router.put("/:id", middleware.checkProductOwnership, upload.single('image'), function(req, res){

    //----as the rating is updated based on rating by users , hence i dont want while updating product , rating gets updated
    delete req.body.product.rating;

    Product.findById(req.params.id, async function(err, product){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        }else{
            //---------------------if someone has uploaded a file, else req.file will be undefined
            if(req.file){
                try{
                    //--------bcoz we want to update a new file , first delete existing file from cloudinary
                    await cloudinary.v2.uploader.destroy(product.imageId);
                    // further code execution waits till above is completed.

                    //-------then we are gonna take path(req.file.path) and upload on cloudinary
                    var result = await cloudinary.v2.uploader.upload(req.file.path);

                    product.imageId = result.public_id;
                    product.image   = result.secure_url;
                } catch(err){
                    req.flash("error", err.message);
                    return res.redirect("back");
                }
            }
            product.name = req.body.product.name;
            product.price = req.body.product.price;
            product.description = req.body.product.description;
            product.save();
            req.flash("success", "Successfully Updated");
            res.redirect("/products/"+product._id);
        }
    });
});


//*****destroy product route with pre hook to delete comments as well */
router.delete("/:id",middleware.checkProductOwnership, async(req, res)=>{
    try{
        let foundProduct = await Product.findById(req.params.id);
        await cloudinary.v2.uploader.destroy(foundProduct.imageId);
        await foundProduct.remove();
        req.flash("success", "Product deleted");
        res.redirect('/products');
    } catch(error){
        req.flash("error", err.message);
        return res.redirect('/products');
    }
});

//-----------------------function for fuzzy search
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;