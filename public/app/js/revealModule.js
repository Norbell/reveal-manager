var revealModule = angular.module('revealModule', ['socketioModule']);
revealModule.directive('onFinishRender', function ($timeout) {
    return {
        restrict: 'A',
        link: function (scope, element, attr) {
            if (scope.$last === true) {
                $timeout(function () {
                    scope.$emit('ngRepeatFinished');
                });
            }
        }
    }
});

tokenalreadySendet = false;

//This Viewport gets displayed on the devices of the audiance
revealModule.controller('RevealAudienceViewportCtrl', ['$scope', 'socket', '$routeParams', function($scope, socket, $routeParams) {
    var revealIni;
    var revealDeck;

        if (!tokenalreadySendet) {
            socket.on('presentation:resolveToken', function(data) {
                console.log(data);
                tokenalreadySendet = false;
                if (data.error) {
                    console.log("error resolve Token");
                } else {
                    //revealIni = data[0];
                    revealDeck = data['sections'];
                    $scope.slides = revealDeck;
                    //Subscribe to the new started presentation


                    $scope.$on('ngRepeatFinished', function(ngRepeatFinishedEvent) {
                        //var ini = revealService.getRevealIni();
                        Reveal.initialize({
                            controls: false,
                            progress: true,
                            slideNumber: true,
                            history: false,
                            keyboard: false,
                            overview: false,
                            center: true,
                            touch: false,
                            loop: false,
                            rtl: false,
                            fragments: true,
                            embedded: true,
                            autoSlide: false,
                            autoSlideStoppable: false,
                            mouseWheel: false,
                            hideAddressBar: false,
                            previewLinks: false,
                            transition: true
                                    //transitionSpeed: ini['transitionSpeed'],
                                    //backgroundTransition: ini['backgroundTransition'],
                                    //viewDistance: ini['viewDistance'],
                                    //parallaxBackgroundImage: ini['parallaxBackgroundImage'],
                                    //parallaxBackgroundSize: ini['parallaxBackgroundSize']
                        });
                    });

                    socket.on('presentation:recieveCommand', function(data) {
                        console.log("getCommand");
                        Reveal.slide(data.indexh, data.indexv, data.indexf);
                    });
                    socket.emit('presentation:subscripe', {'idPresentation': data.id});

                }
            });
            tokenalreadySendet = true;
            console.debug("Sende resolve token")
            socket.emit('presentation:resolveToken', {'token': $routeParams.resolveToken});
            
        }
}]);

//This Viewport shows the current slide controlled by the moderator
revealModule.controller('RevealPresentationScreenViewportCtrl', ['$scope', 'socket', '$routeParams', function($scope, socket, $routeParams) {
    var revealDeck;

    socket.on('presentation:slides', function(data) {
        revealDeck = data['sections'];
        $scope.slides = revealDeck;
        console.log(data);

        //Subscribe to the new started presentation
        socket.emit('presentation:subscripe', {'idPresentation': $routeParams.idPresentation});
    });

    //Tells the server which presentation has to get send to the client
    socket.emit('presentation:slides', {'idPresentation': $routeParams.idPresentation});

    //Initialize presentation preview
    $scope.$on('ngRepeatFinished', function(ngRepeatFinishedEvent) {
            //var ini = revealService.getRevealIni();
            Reveal.initialize({
                controls: true,
                progress: true,
                slideNumber: false,
                history: false,
                keyboard: true,
                overview: false,
                center: true,
                touch: true,
                loop: false,
                rtl: false,
                fragments: true,
                embedded: true,
                autoSlide: false,
                autoSlideStoppable: false,
                mouseWheel: false,
                hideAddressBar: false,
                previewLinks: true,
                transition: true,
                //transitionSpeed: ini['transitionSpeed'],
                backgroundTransition: zoom,
                viewDistance: 3
                //parallaxBackgroundImage: ini['parallaxBackgroundImage'],
                //parallaxBackgroundSize: ini['parallaxBackgroundSize']
            });
        });

     socket.on('presentation:recieveCommand', function(data) {
         console.log("getCommand", data);
            Reveal.slide( data.indexh, data.indexv, data.indexf);
     });
}]);

//This Viewport is part of the SpeakerView and configures the Viewport for the current slide
revealModule.controller('RevealSpeakerViewportCtrl', ['$scope', 'socket','$routeParams' , '$http', '$location', function($scope, socket, $routeParams, $http, $location) {
    var revealDeck;
    var iframe;
    var currentIndex;

    function generateHTMLPresentation(data){
        var html = "";
        $.each(data, function(index, item){
            var attr = "";
            $.each(this.attributs, function(key, value){
                attr += "data-" + key + "='" + value + "' ";
            });

            html += "<section "+attr+">\n"+this.text+"\n</section>\n";
        });
        return html;
    }
    
    function setHTMLtoIframe(data) {
        var url = $location.protocol() + "://" + $location.host() + ":" + $location.port();
        var style = '<meta charset="UTF-8">\
                    <link rel="stylesheet" href="'+url+'/app/lib/reveal/css/reveal.min.css">\n\
                    <link rel="stylesheet" href="'+url+'/app/lib/reveal/css/theme/default.css" id="theme">\n\
                    <script src="'+url+'/app/lib/reveal/reveal.min.js"></script>';
        
        document.getElementById('previewIframe').src = "data:text/html;charset=utf-8," +  encodeURI(style + "<div class='reveal'><div class='slides'>" + generateHTMLPresentation(data.sections) + '</div></div><script src="'+url+'/app/js/revealPreview.js"></script>');
    }

    socket.on('presentation:slides', function(data) {
        revealDeck = data['sections'];
        $scope.slides = revealDeck;
        
        //generate Content for iframe
        setHTMLtoIframe(data);
        
        //Subscribe to the new started presentation
        socket.emit('presentation:subscripe', {'idPresentation': $routeParams.idPresentation});
        
        $scope.$on('ngRepeatFinished', function(ngRepeatFinishedEvent) {
            //var ini = revealService.getRevealIni();
            Reveal.initialize({
                controls: true,
                progress: false,
                slideNumber: false,
                history: false,
                keyboard: true,
                overview: false,
                center: true,
                touch: false,
                loop: false,
                rtl: false,
                fragments: true,
                embedded: true,
                autoSlide: false,
                autoSlideStoppable: false,
                mouseWheel: false,
                hideAddressBar: false,
                previewLinks: false,
                transition: true
                //transitionSpeed: ini['transitionSpeed'],
                //backgroundTransition: ini['backgroundTransition'],
                //viewDistance: ini['viewDistance'],
                //parallaxBackgroundImage: ini['parallaxBackgroundImage'],
                //parallaxBackgroundSize: ini['parallaxBackgroundSize']
            });

            iframe = document.getElementById('previewIframe');
            currentIndex = Reveal.getIndices();
        });
    });

    socket.on('presentation:recieveCommand', function(data) {
        console.log("getCommand");
        Reveal.slide(data.indexh, data.indexv, data.indexf);
    });

    var lastSlideStatus = false;
    var firstSlideStatus = true;


    Reveal.addEventListener('slidechanged', eventReveal);
    Reveal.addEventListener('fragmentshown', eventReveal);
    Reveal.addEventListener('fragmenthidden', eventReveal);
    
    currentSlidePos = [];
    
    function eventReveal(event) {
        iframe.contentWindow.changeSlide(lastSlideStatus, firstSlideStatus, currentIndex, event);

        /*for( vir in Reveal.getCurrentSlide()){
            console.log(vir);
        }*/
        console.log(Reveal.getCurrentSlide().getElementsByClassName('notes'));
        //console.log(Reveal.getCurrentSlide().getElementsByTagName('aside')[0]['firstChild']['data']);
        //console.log('test: '+test.getElementsByTagName('aside'));

        console.log('current slide: ',event.indexh,event, event.fragment, $(event.fragment).data('fragment-index'));
        
        if(event.indexh != undefined){
            currentSlidePos = event;
        } else {
            event.indexv = currentSlidePos.indexv;
            event.indexh = currentSlidePos.indexh;
            event.indexf = currentSlidePos.indexf;
        }
        
        if($(event.fragment).data('fragment-index') != undefined) {
            event.indexf = $(event.fragment).data('fragment-index');
        }
        

        console.log('CurBefore: '+currentIndex.h+' : '+currentIndex.v);
        currentIndex = Reveal.getIndices();
        lastSlideStatus = Reveal.isLastSlide();
        firstSlideStatus = Reveal.isFirstSlide();
        console.log('CurAfter: '+currentIndex.h+' : '+currentIndex.v);

        socket.emit('presentation:sendCommand', {
            'idPresentation': $routeParams.idPresentation,
            'indexh': event.indexh,
            'indexv': event.indexv,
            'indexf': event.indexf
        });
    }

    //Tells the server which presentation has to get send to the client
    socket.emit('presentation:slides', {'idPresentation': $routeParams.idPresentation});
}]);



//This Viewport is used to display the next upcoming slide in the iframe of the SpeakerView
revealModule.controller('RevealPreviewViewPortCtrl', ['$scope', '$routeParams','socket', function($scope, $routeParams, socket) {
    var revealIni;
    var revealDeck;

    socket.on('presentation:slides', function(data) {
        //revealIni = data[0];
        revealDeck = data['sections'];
        $scope.slides = revealDeck;
        console.log(data);
        //Subscribe to the new started presentation
        socket.emit('presentation:subscripe', {'idPresentation': $routeParams.idPresentation});
        //$rootScope.bodyClass = "presentation";
    });

    //Tells the server which presentation has to get send to the client
    socket.emit('presentation:slides', {'idPresentation': $routeParams.idPresentation});

    //Tells the server which presentation has to get send to the client
    socket.emit('presentation:slides', {'idPresentation': $routeParams.idPresentation});

    //Initialize presentation preview
    $scope.$on('ngRepeatFinished', function(ngRepeatFinishedEvent) {
        // var ini = revealService.getRevealIni();
        Reveal.initialize({
            controls: false,
            progress: false,
            slideNumber: false,
            history: false,
            keyboard: false,
            overview: false,
            center: true,
            touch: false,
            loop: false,
            rtl: false,
            fragments: true,
            embedded: true,
            autoSlide: false,
            autoSlideStoppable: false,
            mouseWheel: false,
            hideAddressBar: false,
            previewLinks: false,
            transition: true
            //transitionSpeed: ini['transitionSpeed'],
            //backgroundTransition: ini['backgroundTransition'],
            //viewDistance: ini['viewDistance'],
            //parallaxBackgroundImage: ini['parallaxBackgroundImage'],
            //parallaxBackgroundSize: ini['parallaxBackgroundSize']
        });
    });
/*
    socket.on('presentation:recieveCommand', function(data) {
        console.log("getCommand");
        Reveal.slide(data.indexh, data.indexv);
    });*/
}]);

