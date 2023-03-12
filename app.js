const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const session = require('express-session');
//const passport = require("passport");
//const possportLocalMongoose = require("passport-local-mongoose");
const alert = require('alert');
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");

const middlewaer = require('./middleware');

const app = express();

//For chat
const http = require('http').createServer(app)
const PORT = process.env.PORT || 3003

app.set("view engine", "ejs");

mongoose.set('strictQuery', true);

app.use(express.static("public"));
app.use(express.static("images"));
app.use(bodyParser.urlencoded({extended: true}));

//Start using session
app.use(session({
    secret: "Our Little Secret.",
    resave: false,
    saveUninitialized: false
}));

// app.use(passport.initialize());       //start using passport
// app.use(passport.session());

//Database Connection
mongoose.connect("mongodb://localhost:27017/SocialNetwork");

//User Schema
const userSchema = new mongoose.Schema ({
    firstName: {type: String, required: true, trim: true},
    lastName: {type: String, required: true, trim: true},
    username: {type: String, required: true, trim: true, unique: true},
    email: {type: String, required: true, trim: true, unique: true},
    password: {type: String, required: true},
    profilePic: {type: String, default: "/images/profilePic.jpeg"},
}, {timestamps: true});

// userSchema.plugin(possportLocalMongoose);

const User = new mongoose.model("User", userSchema);

//start using cookie
// passport.use(User.createStrategy());

// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

//Upload Schema
const uploadSchema = new mongoose.Schema({
    id: String,
    profile: String,
    uname: String,
    imagename: String,
    message: String,
});

const uploadModel = mongoose.model("uploadModel", uploadSchema);
 
//Routes
app.get("/", middlewaer.requireLogin, (req, res, next) => {
    var uploadData = uploadModel.find({});
    uploadData.exec((err, data)=>{
        if(err){
            console.log(err);
        }
        res.render("home", {records: data});
    });

    //res.render("home");
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.get("/chat", middlewaer.requireLogin, (req, res) => {
    res.sendFile(__dirname + '/index.html')
});

app.get("/logout", (req, res) => {
    if(req.session){
        req.session.destroy(() => {
            res.redirect("/login");
        })
    }
});

app.get("/post", middlewaer.requireLogin, (req, res, next) => {
    res.render("post");
});

app.get("/profile", middlewaer.requireLogin, (req, res, next) => {
    User.findById(req.session.user._id, (err, foundPerson) =>{
        if(err){
            console.log(err);
        }
        else{
            if(foundPerson){
                uploadModel.find({"id":req.session.user._id}, (err, foundUser)=>{
                    if(err){
                        console.log(err);
                    }
                    else{
                        if(foundUser){
                            var time = req.session.user.createdAt;
                            res.render("profile",{data: foundUser, uname: foundPerson.username, pic: foundPerson.profilePic, time: time});
                        }
                    }
                });
            }
        }
    });
});

app.post("/register", async (req, res, next) => {
    // var firstName = req.body.firstName.trim();
    // var lastName = req.body.lastName.trim();
    // var username = req.body.username.trim();
    // var email = req.body.email.trim();
    // var password = req.body.password;

    // //var payload = req.body;

    // if(firstName && lastName && username && email && password){
    //     var user = await User.findOne({
    //         $or: [
    //             {username: username},
    //             {email: email}
    //         ]
    //     })
    //     .catch((error) => {
    //         console.log(error);
    //         //payload = "Something went wrong.";
    //         alert("Something went wrong.");
    //         res.status(200).render("register");
    //     });

    //     if(user == null){
    //         //no user found

    //         User.register({                 // .register method comes from passort
    //             firstName: req.body.firstName.trim(),
    //             lastName: req.body.lastName.trim(),
    //             username: req.body.username.trim(),
    //             email: req.body.email.trim()
    //         }, req.body.password, (err, user) => {
    //             if(err){
    //                 console.log(err);
    //                 res.redirect("/register");
    //             }
    //             else{
    //                 passport.authenticate("local")(req, res, () => {
    //                     res.redirect("/");
    //                 });
    //             }
    //         })
    //     }
    //     else{
    //          //User found
    //         if(email == user.email){
    //             //payload = "Email already in use.";
    //             alert("Email already in use."); 
    //             res.status(200).render("register");
    //         }
    //         else{
    //             //payload = "Username already in use.";
    //             alert("Username already in use."); 
    //             res.status(200).render("register"); 
    //         }
    //     }
    // }
    // else{
    //     //payload = "Make sure each field has a valid value.";
    //     alert("Make sure each field has a valid value."); 
    //     res.status(200).render("register");
    // }

    var firstName = req.body.firstName.trim();
    var lastName = req.body.lastName.trim();
    var username = req.body.username.trim();
    var email = req.body.email.trim();
    var password = req.body.password;

    if(firstName && lastName && username && email && password){
        var user = await User.findOne({
            $or: [
                {username: username},
                {email, email}
            ]
        })
        .catch((error) => {
            console.log(error);
            //payload.errorMessage = "Something went wrong.";
            alert("Something went wrong."); 
            res.status(200).render("register");
        });

        if(user == null){
           //No user found 

           var data = req.body;

           data.password = await bcrypt.hash(password, 10);

           User.create(data)
           .then((user) => {
               req.session.user = user;
               return res.redirect("/"); 
           })
        }
        else{
            //User found
            if(email == user.email){
                //payload.errorMessage = "Email already in use.";
                alert("Email already in use.");
            }
            else{
                //payload.errorMessage = "Username already in use.";
                alert("Username already in use.");
            }
            res.status(200).render("register");
        }
    }
    else{
        //payload.errorMessage = "Make sure each field has a valid value.";
        alert("Make sure each field has a valid value.");
        res.status(200).render("register");
    }
});

app.post("/login", async (req, res, next) => {

    if(req.body.logUsername && req.body.logPassword){
        var user = await User.findOne({
            $or: [
                {username: req.body.logUsername},
                {email: req.body.logUsername}
            ]
        })
        .catch((error) => {
            console.log(error);
            //payload.errorMessage = "Something went wrong.";
            alert("Something went wrong.");
            res.status(200).render("login");
        });

        if(user != null){
            var result = await bcrypt.compare(req.body.logPassword, user.password);
            
            if(result === true){
                req.session.user = user;
                return res.redirect("/");
            }
        }

        //payload.errorMessage = "Login credentials incorrect.";
        alert("Login credentials incorrect.");
        return res.status(200).render("login"); 
    }

    //payload.errorMessage = "Make sure each field has a valid value."; 
    alert("Make sure each field has a valid value.");
    res.status(200).render("login");
}); 

//Image upload code

var Storage = multer.diskStorage({
    destination:"./public/uploads/",
    filename:(req,file,cb)=>{
        cb(null,file.fieldname+"_"+Date.now()+path.extname(file.originalname));
    }
});

var upload = multer({
    storage:Storage
}).single("file");

app.post("/post", upload, (req, res) => {
    // console.log(req.session.user.username);
    // console.log(req.session.user.profilePic);
    // console.log(req.session.user.createdAt);
    //console.log(req.session.user._id);
    var id = req.session.user._id;
    var profilePic = req.session.user.profilePic;
    var uname = req.session.user.username;
    var message = req.body.message;
    var imageFile = req.file.filename;

    var uploadDetails = new uploadModel({
        id: id,
        profile: profilePic,
        uname: uname,
        imagename: imageFile,
        message: message
    });

    uploadDetails.save();

    res.redirect("/");
});

app.post("/delete", (req, res, next) => {
    uploadModel.findByIdAndRemove(req.body.checkbox, (err)=>{
        if(!err){
            res.redirect("profile");
        }
    });
});

//Server
// app.listen(3003, () => {
//     console.log("server is running on port 3003");
// });

http.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`)
});

// Socket For Chat
const io = require('socket.io')(http)

io.on('connection', (socket) => {
    console.log('Connected...')
    socket.on('message', (msg) => {
        socket.broadcast.emit('message', msg)
    });

});