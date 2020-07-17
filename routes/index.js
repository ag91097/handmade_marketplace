var express   = require("express");
var router    = express.Router();
var passport  = require("passport");
var User      = require("../models/user");
var Product = require("../models/product");
require('dotenv').config()

//---------------------------------------LANDING PAGE ROUTE
router.get("/",function(req,res){
    res.render("landing");
});


//========================AUTH ROUTES

//----------------------show register form
router.get('/register', function(rew, res){
    res.render("register");
});

//---------------------handle sign up logic
router.post('/register', function(req, res){
    var newUser = new User({
        username   : req.body.username,
        firstName  : req.body.firstName,
        lastName   : req.body.lastName,
        email      : req.body.email,
        avatar     : req.body.avatar
    });
    // User.register(new User({username: req.body.username}), req.body.password, )
    if(req.body.adminCode === process.env.ADMIN_ROLE_SECRET){
        newUser.isAdmin = true;
    }
    User.register(newUser, req.body.password, function(err, registeredUser){
        if(err){
            console.log(err);
            req.flash("error", err.message);
            return res.redirect("/register");
        }
        passport.authenticate("local")(req, res, function(){
            req.flash("success", "Welcome to Yelpcamp " + registeredUser.username);
            res.redirect("/products");
        });
    });
});

//-------------------------------------SHOW LOGIN FORM
router.get('/login', function(req, res){
    res.render("login");
});

//--------------------------------------USER LOGIN LOGIC
router.post('/login', function(req, res, next){
    passport.authenticate("local",
    {
        successRedirect: "/products",
        failureRedirect: "/login",
        failureFlash: true,
        successFlash: "Welcome back to yelpcamp, " + req.body.username + "!"
    })(req, res);
});


//-------------------------------------------LOGOUT ROUTE
router.get('/logout', function(req, res){
    req.logOut();
    req.flash("success", "Logged you out!");
    res.redirect('/products');
});

//-----------------------------------------------USER PROFILE ROUTE
router.get("/users/:id", function(req, res){
    User.findById(req.params.id, function(err, foundUser){
        if(err){
            req.flash('error', "Something went wrong");
            return res.redirect('/');
        }
        Product.find().where('author.id').equals(foundUser._id).exec(function(err, foundProducts){
            if(err){
                req.flash('error', "Something went wrong");
                return res.redirect('/');
            }
            res.render("users/show", {user: foundUser, products: foundProducts});
        });
    });
});


module.exports = router;