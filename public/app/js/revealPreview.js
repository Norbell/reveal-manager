Reveal.initialize({
    // Display controls in the bottom right corner
    controls: false,
    progress: false,
    slideNumber: true,
    history: false,
    keyboard: false,
    overview: false,
    center: true,
    touch: false,
    // Loop the presentation
    loop: false,
    // Change the presentation direction to be RTL
    rtl: false,
    // Turns fragments on and off globally
    fragments: true,
    // Flags if the presentation is running in an embedded mode,
    // i.e. contained within a limited portion of the screen
    embedded: true,
    // Opens links in an iframe preview overlay
    previewLinks: false,
    // Transition style
    transition: 'zoom', // default/cube/page/concave/zoom/linear/fade/none

    // Transition speed
    transitionSpeed: 'default', // default/fast/slow

    // Transition style for full page slide backgrounds
    backgroundTransition: 'default', // default/none/slide/concave/convex/zoom

    // Number of slides away from the current that are visible
    viewDistance: 3
});

//Setup the PreviewViewport for displaying the next upcoming slide
Reveal.addEventListener( 'ready', function( event ) {
    Reveal.next();
});

window.changeSlide = function(islast, isfirst, curIndex, event){
    if(islast){
        console.log('Already last slide. Nothing to do!');
        return 0;
    } else if(event.indexh > curIndex.h || event.indexv > curIndex.v){
        Reveal.next();
    } else if(event.indexh < curIndex.h || event.indexv < curIndex.v){
        Reveal.prev();
    }
};