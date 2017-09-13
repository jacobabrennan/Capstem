'use strict';

// Dependant on client.js
(function (){
//== OPEN NAMESPACE ==========================================================//
var resourcePath = 'rsc'
var resource = {};
var graphicResource = Object.extend(resource, {
    url: null,
    width: undefined,
    height: undefined,
    effect: function (which, image, offsetX, offsetY, width, height){
        var drawEffect = this.effects[which];
        if(!drawEffect){ return image;}
        return drawEffect.call(this, image, offsetX, offsetY, width, height);
    },
    effects: {
        draw: function (image, offsetX, offsetY, width, height){
            client.skin.scrapBoard.drawImage(
                image,
                offsetX, offsetY, width, height,
                0, 0, width, height
            );
            return client.skin.scrapBoard;
        },
        flash: function (image, offsetX, offsetY, width, height){
            var scrapBoard = client.skin.scrapBoard;
            scrapBoard.clearRect(0, 0, width, height);
            scrapBoard.canvas.width = width;
            scrapBoard.canvas.height = height;
            // change width and height before saving, this seems to break the save/restore feature.
            scrapBoard.save();
            switch(Math.floor(Math.random()*4)){
                case 0: {scrapBoard.fillStyle = "rgb(255,   0,   0)"; break;}
                case 1: {scrapBoard.fillStyle = "rgb(  0,   0,   0)"; break;}
                case 2: {scrapBoard.fillStyle = "rgb(  0,   0, 255)"; break;}
                case 3: {scrapBoard.fillStyle = "rgb(255, 255, 255)"; break;}
            }
            scrapBoard.fillRect(0, 0, scrapBoard.canvas.width, scrapBoard.canvas.height);
            scrapBoard.globalCompositeOperation = "destination-in";
            scrapBoard.drawImage(
                image,
                offsetX, offsetY, width, height,
                0, 0, width, height
            );
            scrapBoard.restore();
            return scrapBoard.canvas;
        },
        invert: function (image, offsetX, offsetY, width, height){
            var scrapBoard = client.skin.scrapBoard;
            scrapBoard.canvas.width = width;
            scrapBoard.canvas.height = height;
            // change width and height before saving, this seems to break the save/restore feature.
            scrapBoard.save();
            scrapBoard.clearRect(0, 0, width, height);
            scrapBoard.scale(1,-1);
            scrapBoard.translate(0,-height)
            scrapBoard.drawImage(
                image,
                offsetX, offsetY, width, height,
                0, 0, width, height
            );
            scrapBoard.scale(1,-1);
            scrapBoard.translate(0, height)
            scrapBoard.restore();
            return scrapBoard.canvas;
        }
    }
});
var graphic = (function (){
    var drawFunction = function (x, y, options){
        client.skin.context.save()
        if(!options){ options = {};}
        var direction = (options.direction !== undefined)? options.direction : SOUTH;
        var offsetX = this.offsetX || 0;
        var offsetY = this.offsetY || 0;
        var width  = this.width  || this.image.width;
        var height = this.height || this.image.height;
        var adjustX = Math.round(x);
        var adjustY = Math.round((DISPLAY_HEIGHT)-(y+height));
        var frameDelay = options.frameDelay || this.frameDelay;
        if(this.nudgeX){ adjustX += this.nudgeX;}
        if(this.nudgeY){ adjustY -= this.nudgeY;}
        if(options.z){ adjustY -= options.z;}
        if(options.center){
            adjustX -= Math.floor(width/2);
            adjustY += Math.floor(height/2);
        }
        if(this.frames){
            var frame = 0;
            if(options.frame !== undefined){
                frame = Math.min(options.frame, this.frames-1);
            } else if(options.time){
                var delay = frameDelay || ANIMATION_FRAME_DELAY;
                frame = (Math.floor(options.time/delay) % this.frames);
            }
            offsetY += height*frame;
        }
        //
        if(this.directions === 2){
            if(direction === RIGHT){
                offsetX += width;
            }
        } else if(this.directions === 16){
            offsetX +=            direction%4  * width;
            offsetY += Math.floor(direction/4) * height;
        }
        //
        var drawImage = client.resourceLibrary.images[this.url];
        if(options.effects){
            for(var effectIndex = 0; effectIndex < options.effects.length; effectIndex++){
                var indexedEffect = options.effects[effectIndex];
                drawImage = this.effect(indexedEffect, drawImage, offsetX, offsetY, width, height);
                offsetX = 0;
                offsetY = 0;
            }
        }
        client.skin.context.drawImage(
            drawImage,
            offsetX, offsetY, width, height,
            adjustX, adjustY, width, height
        );
        client.skin.context.restore();
        return {
            x: x,
            y: y,
            width: width,
            height: height
        };
    };
    return function (url, width, height, offsetX, offsetY, options){
        if(!options){ options = {};}
        options.draw = drawFunction;
        if(url    ){ options.url     = url    ;}
        if(width  ){ options.width   = width  ;}
        if(height ){ options.height  = height ;}
        if(offsetX){ options.offsetX = offsetX;}
        if(offsetY){ options.offsetY = offsetY;}
        return Object.extend(graphicResource, options);
    };
})();
var spriteSheet = (function (){
    var drawFunction = function (x, y, options){
        if(!options){ options = {};}
        var state = options.state || 'default';
        var graphicState = this.states[state];
        if(!graphicState){ graphicState = this.states['default'];}
        if(!graphicState){ return false;}
        return graphicState.draw(x, y, options);
    };
    var result = function (url, mapping, options){
        if(!options){ options = {};}
        if(!mapping){ mapping = {};}
        var width  = options.width  || TILE_SIZE;
        var height = options.height || TILE_SIZE;
        var sheet = Object.extend(graphicResource, {
            url: url,
            anchorX: options.anchorX || 0,
            anchorY: options.anchorY || 0,
            draw: drawFunction
        });
        if(options.directions){ sheet.directions = options.directions;}
        if(options.frames){ sheet.frames = options.frames;}
        if(options.frameDelay){ sheet.frameDelay = options.frameDelay;}
        sheet.states = {};
        if(!mapping['default']){
            mapping['default'] = {}
        }
        for(var key in mapping){
            if(!mapping.hasOwnProperty(key)){
                continue;
            }
            var stateMap = mapping[key];
            var fullOffsetX = (stateMap.offsetX || 0) + sheet.anchorX;
            var fullOffsetY = (stateMap.offsetY || 0) + sheet.anchorY;
            var state = graphic(
                url,
                (stateMap.width  || width),
                (stateMap.height || height),
                fullOffsetX,
                fullOffsetY,
                stateMap
            );
            state.directions = stateMap.directions || sheet.directions;
            state.frames = stateMap.frames || sheet.frames;
            state.frameDelay = stateMap.frameDelay || sheet.frameDelay;
            sheet.states[key] = state;
        }
        return sheet;
    };
    result.drawFunction = drawFunction;
    // I appologize to whoever is reading this terrible workaround.
    return result;
})();
var event = (function (){
    var eventResource = {
        finished: false,
        timeLimit: null,
        width: 0,
        height: 0,
        setup: function (){},
        iterate: function (){
            this.time++;
            if(this.timeLimit && this.time >= this.timeLimit){
                this.finish();
            }
            return this.finished;
        },
        _new: function (options){
            this.time = -1; // Iterate is called before draw,
            // Time when drawing first frame should be 0.
            this.options = options;
            this.setup();
            return this;
        },
        draw: function (){},
        finish: function (){
            this.finished = true;
        },
        // Helpful functions:
        center: function (movableId, offsetDirection){
            var centerMover = client.gameplay.memory.getContainable(movableId);
            if(!centerMover){ return null;}
            var centerX = centerMover.x+(centerMover.width -this.width )/2;
            var centerY = centerMover.y+(centerMover.height-this.height)/2;
            if(offsetDirection){
                switch(offsetDirection){
                    case NORTH: centerY = centerMover.y+centerMover.height; break;
                    case SOUTH: centerY = centerMover.y-       this.height; break;
                    case EAST : centerX = centerMover.x+centerMover.width ; break;
                    case WEST : centerX = centerMover.x-       this.width ; break;
                }
            }
            return {x: centerX, y: centerY};
        }
    };
    return function (options){
        var configureObject = {};
        for(var key in options){
            if(options.hasOwnProperty(key)){
                configureObject[key] = {value: options[key], writable: true};
            }
        }
        var newEvent = Object.extend(eventResource, configureObject);
        return newEvent;
    };
})();
client.resource = function (category, identifier){
	return this.resourceLibrary.resource(category, identifier);
}
client.resourceLibrary = {
	resourceLoadReady: false,
	resourceLoadingIds: [],
	resource: function (category, identifier, fragment){
		if(this.library[category]){
            var resource = this.library[category][identifier];
            if(fragment && fragment.states){
                resource = fragment.states[resource];
            }
            return resource;
		}
        return null;
	},
    /*
        Animations
            Variable Number of Frames
            Variable Frame Rate
            Looping or One Time
    */
	images: {},
	library: {
		graphic: {
            // I - Graphics
			// I.a - Client Interface
            controller: spriteSheet('img/sprites.png', {
                'left': {offsetY: 64},
                'right': {offsetX: 32, offsetY: 64},
                'up': {offsetX: 64, offsetY: 64},
                'primary': {offsetX: 96, offsetY: 64},
                'primaryActive': {offsetX: 128, offsetY: 64},
                'leftDown': {offsetY: 96},
                'rightDown': {offsetX: 32, offsetY: 96},
                'upDown': {offsetX: 64, offsetY: 96},
                'primaryDown': {offsetX: 96, offsetY: 96},
                'primaryActiveDown': {offsetX: 128, offsetY: 96},
                'start': {offsetX: 0, offsetY: 0, width: 64},
                'startDown': {offsetX: 0, offsetY: 32, width: 64},
                'donate': {offsetX: 64, offsetY: 0, width: 96},
                'donateDown': {offsetX: 64, offsetY: 32, width: 96},
            }, {anchorX: 512, anchorY: 590, width: 32, height: 32}),
            clientScreens: spriteSheet('img/sprites.png', {
                'characterSelect': {offsetY: 574},
                'start': {offsetX: 256, offsetY: 574}
            }, {width: 256, height:144}),
            selectCursor: graphic('img/sprites.png', 16, 16, 464, 484),
            frankie: spriteSheet('img/sprites.png', {
                'stand': {},
                'run': {frames: 2},
                'jump': {offsetY: 52},
                'fall': {offsetY: 26},
                'kneel': {offsetY: 78},
                'standBlock': {offsetX: 32},
                'runBlock': {offsetX: 32, frames: 2},
                'jumpBlock': {offsetX: 32, offsetY: 26},
                'fallBlock': {offsetX: 32, offsetY: 26},
                'kneelBlock': {offsetX: 32, offsetY: 78},
                'pickup': {offsetX: 64},
                'throw': {offsetX: 64, offsetY: 26},
                'dead': {offsetX: 64, offsetY: 52, directions: 1},
                'characterSelect1': {offsetX: 64, offsetY: 78, directions: 1},
                'characterSelect2': {offsetX: 80, offsetY: 78, directions: 1},
                'ride': {offsetX: 80, offsetY: 52, directions: 1}
            }, {anchorX: 352, anchorY: 244, width: 16, height: 26, directions: 2}),
            capn: spriteSheet('img/sprites.png', {
                'stand': {},
                'run': {frames: 2},
                'jump': {offsetY: 64},
                'fall': {offsetY: 32},
                'kneel': {offsetY: 96},
                'standBlock': {offsetX: 36},
                'runBlock': {offsetX: 36, frames: 2},
                'jumpBlock': {offsetX: 36, offsetY: 32},
                'fallBlock': {offsetX: 36, offsetY: 32},
                'kneelBlock': {offsetX: 36, offsetY: 96},
                'pickup': {offsetX: 72},
                'throw': {offsetX: 72, offsetY: 32},
                'dead': {offsetX: 72, offsetY: 64, directions: 1},
                'characterSelect1': {offsetX: 72, offsetY: 96, directions: 1},
                'characterSelect2': {offsetX: 90, offsetY: 96, directions: 1},
                'ride': {offsetX: 90, offsetY: 64, directions: 1}
            }, {anchorX: 448, anchorY: 240, width: 18, height: 32, directions: 2, nudgeX: -1}),
            edna: spriteSheet('img/sprites.png', {
                'stand': {frames: 4},
                'run': {offsetX: 56, frames: 4},
                'jump': {offsetX: 56, offsetY: 44},
                'fall': {offsetX: 56, offsetY: 66},
                'kneel': {height: 28, offsetX: 112, offsetY: 26},
                'standBlock': {frames: 4},
                'runBlock': {offsetX: 56, frames: 4},
                'jumpBlock': {offsetX: 56, offsetY: 44},
                'fallBlock': {offsetX: 56, offsetY: 66},
                'kneelBlock': {height: 28, offsetX: 112, offsetY: 26},
                'pickup': {offsetX: 112, height: 22+4, nudgeY: -4},
                'throw': {offsetX: 56, offsetY: 66},
                'dead': {offsetX: 112, offsetY: 60, width: 20, height: 28, directions: 1},
                'characterSelect1': {offsetX: 0, offsetY: 0, directions: 1},
                'characterSelect2': {directions: 1, frames: 4},
                'ride': {height: 34, offsetX: 140, offsetY: 54, directions: 1, nudgeY: 6}
                // pickup throw dead select1+2
            }, {anchorX: 352, anchorY: 368, width: 28, height: 22, directions: 2}),
            motorcycle: spriteSheet('img/sprites.png', {
                'full': {},
                'running': {frames: 2},
                'body1': {offsetX: 42},
                'body2': {offsetX: 42, offsetY: 22},
                'wheels': {offsetX: 84, frames: 2, frameDelay: 1}
            }, {anchorX: 520, anchorY:368, width: 42, height: 22}),
            may: spriteSheet('img/sprites.png', {
                'stand': {},
                'run': {frames: 2},
                'jump': {offsetY: 32},
                'fall': {offsetY: 32},
                'standBlock': {offsetX: 48},
                'runBlock': {offsetX: 48, frames: 2},
                'jumpBlock': {offsetX: 48, offsetY: 32},
                'fallBlock': {offsetX: 48, offsetY: 32},
                'kneelBlock': {offsetY: 64},
                'pickup': {offsetY: 96},
            }, {anchorX: 256, anchorY: 340, width: 24, height: 32, directions: 2}),
            sally: spriteSheet('img/sprites.png', {
                'stand': {},
                'pickup': {offsetX: 48},
                'kneelBlock': {offsetX: 48, offsetY: 36},
                'standBlock': {offsetY: 36},
                'cloud': {offsetY: 72, width: 54, height: 24, directions: 1}
            }, {anchorX: 256, anchorY: 244, width: 24, height: 36, directions: 2}),
            humvee: spriteSheet('img/sprites.png', {
                'body': {offsetX: 28, offsetY: 28, width: 96, height: 48},
                'turretCenter': {width: 48, height: 28, nudgeX: -20},
                'turretUp': {offsetX: 48, width: 48, height: 28, nudgeX: -20},
                'turretDown': {offsetX: 96, width: 48, height: 28, nudgeX: -20},
                'hatchClosed': {offsetY: 28, width: 28, height: 28},
                'hatchOpen': {offsetY: 56, width: 28, height: 28},
                'bulletDown': {offsetX: 124, offsetY: 28, width: 12, height: 9},
                'bulletUp': {offsetX: 124, offsetY: 37, width: 12, height: 9},
                'bulletCenter': {offsetX: 124, offsetY: 46, width: 12, height: 7},
                'bombUp': {offsetX: 124, offsetY: 53, width: 15, height: 15},
                'bombDown': {offsetX: 124, offsetY: 68, width: 15, height: 15},
            }, {anchorX: 256, anchorY: 160}),
            background: spriteSheet('img/sprites.png', {
                'level1#1': {offsetY: 0, width: 1, height: 1},
                'level1#2': {offsetY: 144},
                'level2#1': {offsetY: 288},
                'level2#2': {offsetY: 432}
            }, {width: 256, height:144}),
            bush: graphic('img/sprites.png', 16, 16, 464, 160, {directions: 16}),
            grassy: spriteSheet('img/sprites.png', {
                'default'  : {directions: 16},
                'slope+1/2': {offsetX: 0, offsetY: 64},
                'slope+2/2': {offsetX:16, offsetY: 64},
                'slope-2/2': {offsetX:32, offsetY: 64},
                'slope-1/2': {offsetX:48, offsetY: 64}
            }, {anchorX: 400, anchorY: 160}),
            cloud: graphic('img/sprites.png', 16, 16, 528, 160, {directions: 16}),
            coin: graphic('img/sprites.png', 13, 13, 656, 160, {frames: 4}),
            suit: spriteSheet('img/sprites.png', {
                suit1: {offsetX:  0},
                suit2: {offsetX: 32}
            }, {anchorX: 592, anchorY: 160, frames: 4, directions: 2}),
            tinyBike: graphic('img/sprites.png', 26, 26, 484, 304),
            post: spriteSheet('img/sprites.png', {
                'default': {frames: 2},
                'jump': {offsetY: 16},
                'throw': {offsetY: 32},
                'bill': {offsetY: 48, height: 12, directions: 1},
                'billOverdue': {offsetX: 16, offsetY: 48, height: 12, directions: 1}
            }, {frameDelay: 8, directions: 2}),
            blocks: spriteSheet('img/sprites.png', {
                'mushroom': {},
                'cash': {offsetX: 48},
                'cashHang': {offsetX: 48, offsetY: 16}
            }, {anchorX: 464, anchorY: 468}),
            mushrooms: spriteSheet('img/sprites.png', {
                'bouncer': {offsetY: 32, height: 32},
                'bouncerCompress': {offsetX: 16, offsetY: 32, height: 30},
                'bouncerExtend': {offsetX: 32, offsetY: 24, height: 40}
            }, {anchorX: 464, anchorY: 468}),
            checkPoint: spriteSheet('img/sprites.png', {
                'passed': {offsetX: 16},
            }, {anchorX: 637, anchorY: 226, height: 48}),
            sparkles: graphic('img/sprites.png', 32, 32, 580, 224, {frames: 4}),
            lightning: spriteSheet('img/sprites.png', {
                '5': {}, '4': {offsetX: 32}, '3': {offsetX: 64}, '2': {offsetX: 96}, '1': {offsetX: 128}
            }, {anchorX: 512, width: 32, height: 160}),
            bolt: spriteSheet('img/sprites.png', {
                '5': {}, '4': {offsetY: 32}, '3': {offsetY: 64}, '2': {offsetY: 96}, '1': {offsetY: 128}
            }, {width: 256, height: 32, anchorX: 256}),
            explosion: graphic('img/sprites.png', 24, 24, 556, 224, {frames: 5}),
            dialogueBox: graphic('img/sprites.png', 208, 48, 256, 468, {}),
            portraits: spriteSheet('img/sprites.png', {
                'frankie': {},
                'capn': {offsetX: 48},
                'sally': {offsetX: 96},
                'may': {offsetX: 144}
            }, {width: 48, height: 48, anchorX: 256, anchorY: 516}),
            ball: graphic('img/sprites.png', 16, 16, 384, 296),
			/*"titleIcon": graphic('img/title_icon.png'),
            "hud": spriteSheet('img/hud.png', {
                'heartFull' : {offsetX: 0, offsetY: 0},
                'heartEmpty': {offsetX: 8, offsetY: 0},
                'bottleFull' : {offsetX: 0, offsetY: 8},
                'bottleEmpty': {offsetX: 8, offsetY: 8},
                'crystal'    : {offsetX: 8, offsetY:16}
            }, {width: 8, height: 8}),*/
		},
		event: {
            'animate': event({
                setup: function (){
                    var options = this.options;
                    var graphicResource = client.resourceLibrary.resource('graphic', options.graphic);
                    if(graphicResource && options.graphicState){
                        graphicResource = graphicResource.states[options.graphicState];
                    }
                    if(!graphicResource){
                        this.finish();
                        return;
                    }
                    this.frames = graphicResource.frames || 1;
                    this.frameDelay = graphicResource.frameDelay || ANIMATION_FRAME_DELAY;
                    var repeat = options.repeat || 1;
                    this.width = graphicResource.width;
                    this.height = graphicResource.height;
                    this.timeLimit = options.timeLimit || this.frames * this.frameDelay * repeat;
                },
                draw: function (){
                    var fullX;
                    var fullY;
                    if(this.options.attachId){
                        var center = this.center(this.options.attachId, this.options.offsetDirection);
                        if(!center){ this.finish(); return;}
                        fullX = center.x;
                        fullY = center.y;
                    } else{
                        fullX = this.options.x;
                        fullY = this.options.y;
                    }
                    var drawOptions = {
                        frame: Math.floor(this.time/this.frameDelay)%this.frames,
                        center: this.options.center
                    };
                    if(this.options.offsetDirection){
                        drawOptions.direction = this.options.offsetDirection;
                    }
                    client.skin.drawGraphic(
                        this.options.graphic, this.options.graphicState,
                        fullX, fullY,
                        drawOptions
                    );
                }
            })
		}
    },
	setup: function (callback){
		this.setupGraphics(callback);
	},
	setupGraphics: function (callback){
        var loadCaller = function (loopResource){
            return function (){
                var rIndex = client.resourceLibrary.resourceLoadingIds.indexOf(loopResource.url);
                client.resourceLibrary.resourceLoadingIds.splice(rIndex,1);
                if(client.resourceLibrary.resourceLoadReady){
                    if(!client.resourceLibrary.resourceLoadingIds.length){
                        callback();
                    }
                }
            }
        };
		for(var key in this.library.graphic){
			var resource = this.library.graphic[key];
			if(!(resource.url in this.images)){
				var newImage = new Image();
				this.resourceLoadingIds.push(resource.url);
				newImage.addEventListener("load", loadCaller(resource), false)
				newImage.src = resourcePath+'/'+resource.url;
				this.images[resource.url] = newImage;
			}
			resource.image = this.images[resource.url];
		}
		this.resourceLoadReady = true;
		if(!this.resourceLoadingIds.length){
			callback();
		}
	}
}
//== CLOSE NAMESPACE =========================================================//
})();
