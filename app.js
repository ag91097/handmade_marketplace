var express        = require("express");
var app            = express();
var bodyParser     = require("body-parser");
var mongoose       = require("mongoose");
var flash          = require("connect-flash");
var passport       = require("passport");
var LocalStrategy  = require("passport-local");
var methodOverride = require("method-override");
var Product     = require("./models/product");
var Comment        = require("./models/comment");
var User           = require("./models/user");
var Review         = require("./models/review");
var moment = require('moment');
const port         = 3000;

var productRoutes  = require("./routes/products");
var commentRoutes     = require("./routes/comments");
var indexRoutes       = require("./routes/index");
var reviewRoutes      = require("./routes/reviews");

mongoose.connect("mongodb://localhost:27017/handmade_marketplace",{ useNewUrlParser: true ,useUnifiedTopology: true, useFindAndModify:false});

//requiring and configuring dotenv to load anything in .env file as environment variables
require('dotenv').config()

//tell express to use bodyParser
app.use(bodyParser.urlencoded({extended: true}));


app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));   
                    
app.use(methodOverride("_method"));

app.use(flash());
app.locals.moment = moment;

//**********************************************PASSPORT CONFIGURATION */
app.use(require("express-session")({
    secret: "the secret could be anything",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    res.locals.error       = req.flash("error");
    res.locals.success     = req.flash("success");
    next();
});

app.use(indexRoutes);
app.use("/products", productRoutes);
app.use("/products/:id/comments", commentRoutes);
app.use("/products/:id/reviews", reviewRoutes);

app.listen(process.env.PORT || port, process.env.IP, function(){
    console.log("server started on port 3000");
});