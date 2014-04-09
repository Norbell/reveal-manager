// load all the things we need
var LocalStrategy    = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy  = require('passport-twitter').Strategy;
var GoogleStrategy   = require('passport-google-oauth').OAuth2Strategy;


// load the auth variables
var configAuth = require('../config/auth');

module.exports = function(passport) {

    passport.serializeUser(function(user, done) {
        console.log(user);
      done(null, user.id);
    });

    passport.deserializeUser(function(obj, done) {
      done(null, obj);
    });



    passport.use(new GoogleStrategy({

        clientID        : configAuth.googleAuth.clientID,
        clientSecret    : configAuth.googleAuth.clientSecret,
        callbackURL     : configAuth.googleAuth.callbackURL,

    },
    function(token,refreshToken,profile, done) {

        // make the code asynchronous
        // User.findOne won't fire until we have all our data back from Google
        process.nextTick(function() {
            
            // try to find the user based on their google id
            db.User.find({where: { 'googleid' : profile.id }}).complete(function(err, user) {
                
                if (err) {
                    console.log(err);
                    return done(err);
                }

                if (user) {
                    
                    // if a user is found, log them in
                    return done(null, user.dataValues);
                } else {
                    console.log("new user");
                    // if the user isnt in our database, create a new user
                    var newUserData = {
                        googleid:    profile.id,
                        googletoken: token,
                        displayname: profile.displayName,
                        email:       profile.emails[0].value
                    };
                    
                    var newUser = db.User.build(newUserData);

                    // save the user
                    var test = newUser.save().success(function(o) {
                         return done(null, {message: "Erfolgreich eingeloggt"});
                    });
                }
            });
        });

    }));
    
    passport.use(new FacebookStrategy({

        clientID        : configAuth.facebookAuth.clientID,
        clientSecret    : configAuth.facebookAuth.clientSecret,
        callbackURL     : configAuth.facebookAuth.callbackURL,

    },
    function(token,refreshToken,profile, done) {

        process.nextTick(function() {
            
            // try to find the user based on their google id
            db.User.find({where: { 'facebookid' : profile.id }}).complete(function(err, user) {
                
                if (err) {    
                    return done(err);
                }

                if (user) {
                    return done(null, user.dataValues);
                } else {
                    console.log("new user", profile);
                    // if the user isnt in our database, create a new user
                    var newUserData = {
                        facebookid:    profile.id,
                        facebooktoken: token,
                        displayname: profile.displayName,
                        //email:       profile.emails[0].value
                    };
                    
                    var newUser = db.User.build(newUserData);

                    // save the user
                    newUser.save().success(function(info) {
                         return done(null, {id: info.id, message: "Erfolgreich eingeloggt"});
                    });
                }
            });
        });

    }));

};
