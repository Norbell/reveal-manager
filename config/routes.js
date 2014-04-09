function setRoutes(app, passport) {

    //http routes
    app.get('/',
            function(req, res) {
                res.sendfile(basepath + '/public/index.html');
            }
    );


    app.get('/logout', function(req, res) {
        //console.log(req.user);
        io.sockets.disconnectUser(req.user);
        req.logout();
        res.redirect('/');
    });

    app.get('/auth/loggedin', function(req, res) {

        if (req.isAuthenticated())
            res.json({"auth": true});
        else
            res.json(401, {"auth": false});

    });


    /* Auth routes */
    app.get('/auth/google', passport.authenticate('google', {scope: ['https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email']}));
    app.get('/auth/google/callback',
            passport.authenticate('google', {successRedirect: '/',
                failureRedirect: '/login'}));

    app.get('/auth/facebook', passport.authenticate('facebook'));
    app.get('/auth/facebook/callback',
            passport.authenticate('facebook', {successRedirect: '/',
                failureRedirect: '/login'}));

}

function isLoggedIn(req, res, next) {
    
	// if user is authenticated in the session, carry on
	if (req.isAuthenticated())
		return next();

	// if they aren't redirect them to the home page
	res.redirect('/#/login');
}

exports.isLoggedIn = isLoggedIn;
exports.setRoutes = setRoutes;