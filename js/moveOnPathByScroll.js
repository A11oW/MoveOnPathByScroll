/*---------
 pathScrollMove v.1.0
 (c) 2013 A11oW familyagency.ru

 MIT-style license.
 ----------*/

function PathScrollMove(options){
    if( options ) {
        $.extend(this.settings, options);
    }

    this.timer = null;

    /* Cache container as jQuery as object. */
    this.settings.wrap = (this.settings.wrap === undefined ||
        this.settings.wrap === 'window') ? $(window) : $(this.settings.wrap);

    this.settings.container = (this.settings.container === undefined ||
        this.settings.container === 'window') ? $(window) : $(this.settings.container);

    this.window = $(window);

    if(this.settings.path)
        this.updatePath(this.settings.path);
    else
        return false;
}

if ( !window.requestAnimationFrame ) {
    window.requestAnimationFrame = ( function() {
        return window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function( /* function FrameRequestCallback */ callback, /* DOMElement Element */ element ) {
                return window.setTimeout( callback, 1 );
            };
    })();
}

if ( !window.cancelRequestAnimFrame ) {
    window.cancelRequestAnimFrame = ( function() {
        return window.cancelAnimationFrame            ||
            window.webkitCancelRequestAnimationFrame    ||
            window.mozCancelRequestAnimationFrame         ||
            window.oCancelRequestAnimationFrame        ||
            window.msCancelRequestAnimationFrame        ||
            clearTimeout
    })();
}

PathScrollMove.prototype = {

    settings : {
        'path' : null,
        'wrap' : 'window',
        'container' : 'window',
        'objToAnimate' : '',
        'duration' : '1',
        'reverse' : false,
        'offset' : {
            'top' : 0,
            'bottom' : 0
        },
        'callup' : function(){},
        'callback' : function() {}
    },

    init : function() {

        if( this.settings.duration == 0 ) return false;
        this.percent = 0;
        this.run = false;

        var $self = this;

        //setTimeout(, 1000);
        $self.animateUpdate();

        this.scrollEvent = this.settings.wrap.on( 'scroll', function(){

            $self.animateUpdate();
        });
    },

    getScrollPercentage : function(){
        var wintop = this.settings.wrap.scrollTop() - this.settings.container.offset().top + this.settings.offset.top,
            docheight = this.settings.container.height() + this.settings.offset.bottom,
            winheight = $(window).height();

        /*
        console.log('___________');
        console.log('wintop='+wintop);
        console.log('docheight='+docheight);
        console.log('winheight='+winheight);
        console.log(wintop+'=='+(winheight-docheight));
        console.log(wintop==(docheight-winheight));
        */

        /*
         var wintop = $(window).scrollTop(),
         docheight = $(document).height(),
         winheight = $(window).height();
         */

        // calculate the percentage the user has scrolled down the page
        var scrollHeight = docheight < winheight ? docheight : docheight-winheight;
        var percent = ((wintop/(scrollHeight))*100);

        /*
        console.log('scrollHeight=' + scrollHeight);
        console.log('%scrolled='+percent);
        */

        return percent;
    },

    animateUpdate : function($self){
        var $self = this,
            delay = 1000/150;

        var percent = $self.getScrollPercentage();

        if( $self.settings.reverse )
            percent = 100 - percent;

        percent = percent > 100 ? 100 : percent;
        percent = percent < 0 ? 0 : percent;

        /* Если произошел рывок, проигрываем анимацию все равно плавно*/
        $self.direction = $self.percent > percent ? 'back' : 'forward';

        $self.stop();
        $self.moving = true;

        var index = $self.percent;

        if (percent - index === 1 || index - percent === 1) {
            calc();
        } else {
            animate();
            //$self.timer = setInterval(calc, delay);
        }

        function animate() {
            $self.timer = requestAnimationFrame( animate );
            calc();
        }

        function calc(){
            if( index > 1 && index < 100 && !$self.run ){
                $self.run = true;
                return $self.settings.callup.call( $self.context );
            }

            if( index >= 1 && index <= 100)
                $self.stepCalc(index);

            if($self.direction === 'forward') {
                if(index >= percent) {
                    $self.stop();
                }
                index++;
            }
            if($self.direction === 'back') {
                if(index <= percent) {
                    $self.stop();
                }
                index--;
            }

            if( index >= 100 && $self.run) {
                $self.stop();
                $self.run = false;
                $self.settings.wrap.off();
                return $self.settings.callback.call( $self.context );
            }

            /* save the current completed percentage value */
            $self.percent = index;
        }
    },

    stepCalc : function(percent) {
        var p = [], angle;

        /*==== angle calculations ====*/
        p[0] = this.pointAt( percent - 1 );
        p[1] = this.pointAt( percent + 1 );
        angle = Math.atan2(p[1].y-p[0].y,p[1].x-p[0].x)*180 / Math.PI;

        /* do one step ("frame") */
        //step.call( this.context, this.pointAt(percent), angle );

        this.step(this.pointAt(percent, angle));
        // advance to the next point on the path
    },
    step : function(point, angle) {
        /* do something every "frame" with: point.x, point.y & angle */
        //$(this.settings.objToAnimate).stop().animate({'top' : point.y, 'left' : point.x});
        if (Modernizr.transform) {
        this.settings.objToAnimate.style.cssText = "top: 0px;" +
            "left: 0px;" +
            "transform:translate(" + point.x + "px, " + point.y + "px);" +
            "-webkit-transform:translate(" + point.x + "px, " + point.y + "px);";
        } else {
            this.settings.objToAnimate.style.cssText = "top: " + point.y + "px; left: " + point.x + "px;";
        }

    },

    stop : function(){
        cancelRequestAnimFrame( this.timer );
        this.timer = null;
        this.running = false;
    },

    pointAt : function(percent) {
        return this.path.getPointAtLength( this.len * percent/100 );
    },

    updatePath : function(path) {

        var elementPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');

        if(Modernizr.svg) {
            this.path = elementPath
            this.path.setAttribute('d', path);
        } else {
            var paper = Raphael(elementPath, 1000, 1000);
            this.path = paper.path(path);
        }
        this.len = this.path.getTotalLength();
    },

    requestAnimFrame : (function(){
        return  window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function(/* function FrameRequestCallback */ callback, /* DOMElement Element */ element){
                this.setTimeout(callback, 1000 / 60);
            };
    })()

};

/**
 * ie createElementNS patch
 */
if (!document.createElementNS) document.createElementNS = function(uri, name) {
    return document.createElement(name);
};
