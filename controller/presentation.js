var crypto = require('crypto');
var https = require("https");
var http = require("http");
var googleapis = require('googleapis');
var presentation = [];

function setHandler(socket) {

    socket.on('presentation:overview', function(data) {
        overviewPresentation(socket);
    });

    socket.on('presentation:slides', function(data) {
        overviewSlides(socket, data);
    });
    
    socket.on('presentation:subscripe', function(data) {
        subscripePresentation(socket, data);
    });
    
    socket.on('presentation:desubscripe', function(data) {
        deSubscripePresentation(socket, data);
    });
    
    socket.on('presentation:sendCommand', function(data) {
        sendCommand(socket, data);
    });
    socket.on('presentation:save', function(data) {
        saveSlides(socket, data);
    });
    
    socket.on('presentation:delete', function(data) {
        deletePresentation(socket, data);
    });

    socket.on('presentation:create', function(data) {
        createPresentation(socket, data);
    });
    socket.on('presentation:settingSave', function(data) {
        savePresentationSettings(socket, data);
    });
    
    socket.on('presentation:resolveToken', function(data) {
        resolveToken(socket, data);
    });


}

function overviewPresentation(socket) {
    console.log(socket.handshake);
    
    db.Presentation.findAll().success(function(presentations){
        for (i = 0; i <presentations.length; i++) {
            presentations[i].attributs = JSON.parse(presentations[i].attributs);
        }
        socket.emit('presentation:overview', presentations);
    });
    
}

function overviewSlides(socket, data) {
    console.log(data.idPresentation);
    db.Presentation.find({ where: {id: data.idPresentation}, include: [db.PresentationCSS, db.Section] }).success(function(presentationData){
        
        presentationData.attributs = JSON.parse(presentationData.attributs);
        for (i = 0; i <presentationData.sections.length; i++) {
            presentationData.sections[i].attributs = JSON.parse(presentationData.sections[i].attributs);
        }
        
        socket.emit('presentation:slides', presentationData);
    });

}

function subscripePresentation(socket, data){
    
    var roomname = "presentation_" + data.idPresentation;
    if(socket.room == undefined)
          socket.room = [];
      
    socket.room[roomname] = roomname;
    socket.join(roomname);
    socket.on('disconnect', function(){
        socket.leave(socket.room);
    });
    
}

function deSubscripePresentation(socket, data){
    
    var roomname = "presentation_" + data.idPresentation;
    if(socket.room[roomname] != undefined)
          socket.room[roomname] = undefined;
      
    socket.leave(roomname);
    
}
function sendCommand(socket, data){
    console.log(data);
    var roomname = "presentation_" + data.idPresentation;
    socket.broadcast.to(roomname).emit('presentation:recieveCommand', data);

}

function createPresentation(socket, data) {
    var name = data.name;
    token = 0;
    delete data.name;
    console.log(data);
    crypto.randomBytes(24, function(ex, buf) {
        token = buf.toString('hex');

        googleapis
                .discover('urlshortener', 'v1')
                .execute(function(err, client) {
                    client.urlshortener.url
                            .insert({longUrl: "http://mypresi.yousrv.de:8080/#/a/" + token})
                            .execute(function(err, result) {

                                console.log(result);
                                var presentation = db.Presentation.build({name: name, attributs: JSON.stringify(data), UserId: socket.handshake.user, token: token, shorturl: result.id});
                                presentation.save().success(function() {
                                    socket.emit('presentation:create', {});
                                });

                            });
                });
        
    });

}

function savePresentationSettings(socket, data) {
    
    console.log(data);
    var name = data.name;
    var id = data.id;
    delete data.name, data.id;
    db.Presentation.update({name: name, attributs: JSON.stringify(data)}, {id: id})
            .success(function(){
                socket.emit('presentation:settingSave', {});
            }).error(function(err){
                console.err(err);
            });
    
    
}

function saveSlides(socket, data) {

    db.PresentationCSS.find( {where : {PresentationId: data.idPresentation} }).success(function(presentationCSSdata){
        
        if(!presentationCSSdata){ //css not exist
            
            var presentationCSSCreate = db.PresentationCSS.build({PresentationId: data.idPresentation, css : data.css  });
            presentationCSSCreate.save().success(function(){
                insertSlidesintoDB(data, socket);
            }).error(function(err) {
                socket.emit('presentation:save', { error: err });
            });
            
        } else {
            db.PresentationCSS.update({css: data.css}, {PresentationId: data.idPresentation})
                .success(function() { 
                    insertSlidesintoDB(data, socket);
                })
                .error(function(err) {
                    socket.emit('presentation:save', { error: err });
                });
        }
        
    });

}

function insertSlidesintoDB(data, socket) {
    db.Section.destroy('PresentationId = ' + data.idPresentation).success(function() {
        var error = false;
        var length = data.html.length;
        for (i = 0; i < length; i++) {
            var slide = db.Section.build({text: data.html[i].replace('\n', ''), attributs: JSON.stringify(data.dataattr[i]), PresentationId: data.idPresentation});
            slide.save().error(function(err) {
                console.log(err);
                socket.emit('presentation:save', { error: err });
            }).success(function(){
               if(i==length-1) {
                   socket.emit('presentation:save', { error: false });
               }
            });
        }
        socket.emit('presentation:save', { error: false });
    });
}


function deletePresentation(socket, data) {
    db.Presentation.destroy('id = ' + data.id).success(function(){
        socket.emit('presentation:delete', {error: false});
    }).error(function(err){
        socket.emit('presentation:delete', {error: err});
    })
}

function resolveToken(socket, data) {
    console.log(data);
    db.Presentation.find({ where: {token: data.token}, include: [db.PresentationCSS, db.Section] }).success(function(presentations) {
        //console.log(presentations);
        if(presentations.length == 0) {
            socket.emit('presentation:resolveToken', {error: "No token found"});
            return;
        }

        for (i = 0; i < presentations.length; i++) {
            presentations[i].attributs = JSON.parse(presentations[i].attributs);
        }
        socket.emit('presentation:resolveToken', presentations);

    }).error(function(){
        socket.emit('presentation:resolveToken', {error: "No token found"});
    });
    
}

exports.overviewPresentation = overviewPresentation;
exports.overviewSlides = overviewSlides;
exports.setHandler = setHandler;
exports.saveSlides = saveSlides;