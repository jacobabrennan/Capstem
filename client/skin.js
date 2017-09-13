'use strict';


// TODO: Document.


client.skin = Object.extend(driver, {
    container: undefined,
    context: undefined,
    displayContext: undefined,
    scale: DEFAULT_DISPLAY_SCALE,
    rescale: function (newScale){
        this.scale = newScale;
        if(!this.displayContext){ return;}
        this.displayContext.canvas.width = this.context.canvas.width*scale;
        this.displayContext.canvas.height = this.context.canvas.height*scale;
    },
    setup: function (configuration){
        /**
            This function configures the map to display game data. It is called
            as soon as the client loads, in client.drivers.gameplay.setup It
            creates all the necessary DOM infrastructure needed by later calls
            to this.display.

            It should not be called more than once.

            It does not return anything.
        **/
        this.font = configuration.font || FONT_SIZE+'px '+FONT_FAMILY;
        this.width = configuration.width || DISPLAY_WIDTH;
        this.height = configuration.height || DISPLAY_HEIGHT;
        this.container = document.getElementById(configuration.containerId);
        this.container.tabIndex = 1;
        this.container.focus();
        this.scrapBoard = document.createElement('canvas').getContext('2d');
        var ownCanvas = document.createElement('canvas');
        ownCanvas.width = this.width;
        ownCanvas.height = this.height;
        this.context = ownCanvas.getContext('2d');
        this.context.font = this.font;
        //this.container.appendChild(ownCanvas);
        var displayCanvas = document.createElement('canvas');
        displayCanvas.width = this.width*this.scale;
        displayCanvas.height = this.height*this.scale;
        displayCanvas.addEventListener('click', this.clickHandler);
        this.displayContext = displayCanvas.getContext('2d');
        this.displayContext.imageSmoothingEnabled = false;
        this.displayContext.webkitImageSmoothingEnabled = false;
        this.displayContext.mozImageSmoothingEnabled = false;
        this.container.appendChild(displayCanvas);
        //
        window.addEventListener("resize", function (e){
            client.skin.resize();
        }, false);
        this.resize();
        //
        this.touchScreen.setup();
        //
        this.graphicsTimer.start();
        this.context.fillStyle = 'gray';
        this.context.fillRect(0, 0, this.width, this.height);
    },
    clickHandler: function (clickEvent){
        // Extract coordinates of click from DOM mouse event.
        var correctedX = clickEvent.pageX - clickEvent.target.offsetLeft;
        var correctedY = clickEvent.pageY - clickEvent.target.offsetTop;
        // Correct Y coordinate for difference of coordinate systems.
        correctedY = this.height-correctedY;
        //var x = correctedX/TILE_SIZE;
        //var y = correctedY/TILE_SIZE;
        client.handleClick(correctedX, correctedY);
    },
//-- Full Screen / Resizing ----------------------------------------------------
    viewportSize: function (){
        var e  = document.documentElement;
        var g  = document.getElementsByTagName('body')[0];
        var _x = window.innerWidth  || e.clientWidth  || g.clientWidth;
        var _y = window.innerHeight || e.clientHeight || g.clientHeight;
        return {width: _x, height: _y};
    },
    resize: function (){
        var size = this.viewportSize();
        var monitorAspectRatio = size.width / size.height;
        var gameAspectRatio = DISPLAY_WIDTH / DISPLAY_HEIGHT;
        var modifiedWidth;
        var modifiedHeight;
        if(monitorAspectRatio >= gameAspectRatio){
            // Center Horizontally
            modifiedHeight = size.height;
            modifiedWidth = gameAspectRatio * modifiedHeight;
            this.container.style.top = "0px";
            this.container.style.left = ""+Math.floor((size.width-modifiedWidth)/2)+"px";
        } else{
            // Center Vertically
            modifiedWidth = size.width;
            modifiedHeight = modifiedWidth / gameAspectRatio;
            this.container.style.top = ""+Math.floor((size.height-modifiedHeight)/2)+"px";
            this.container.style.left = "0px";
        }
        this.container.style.width  = modifiedWidth +"px";
        this.container.style.height = modifiedHeight+"px";
    },

//-- Draw Functions ------------------------------------------------------------
    fillRectScroll: function (x, y, width, height, color){
        this.context.save()
        this.context.fillStyle = color || '#000';
        y = (DISPLAY_HEIGHT) - y;
        y -= height;
        var offsetX = game.camera.x;
        var offsetY = game.camera.y;
        var levelWidth = game.level.width * TILE_SIZE;
        var levelHeight = game.level.height * TILE_SIZE;
        offsetX = bound(offsetX, 0, levelWidth-DISPLAY_WIDTH);
        offsetY = bound(offsetY, 0, levelHeight-DISPLAY_HEIGHT);
        var drawX = Math.floor(x-offsetX);
        var drawY = Math.floor(y+offsetY);
        this.context.fillRect(drawX, drawY, width, height);
        this.context.restore();
    },
    fillRect: function (x, y, width, height, color){
        this.context.save();
        y = (DISPLAY_HEIGHT) - y;
        y -= height;
        this.context.fillStyle = color || '#000';
        this.context.fillRect(x, y, width, height, color);
        this.context.restore();
    },
    drawGraphicScroll: function (resourceId, stateName, x, y, options){
        var levelWidth = game.level.width * TILE_SIZE;
        var levelHeight = game.level.height * TILE_SIZE;
        var offsetX = game.camera.x;
        var offsetY = game.camera.y;
        //offsetX = Math.floor(bound(offsetX, 0, levelWidth-DISPLAY_WIDTH));
        //offsetY = Math.floor(bound(offsetY, 0, levelHeight-DISPLAY_HEIGHT));
        this.drawGraphic(resourceId, stateName, x-offsetX, y-offsetY, options);
    },
    drawGraphic: function (resourceId, stateName, x, y, options){
            //options.cameraX = game.camera.x;

        var resource = client.resourceLibrary.resource('graphic', resourceId);
        if(!options){ options = {};}
        options.state = stateName;
        options.time = this.graphicsTimer.time;
        if(!resource){ return null;}
        return resource.draw(x, y, options);
    },
    drawCharacter: function (x, y, character, color, background, font){
        this.context.save();
        y = (DISPLAY_HEIGHT) - y;
        y -= 8; // Font Height, magic number
        // Display Background
        this.context.fillStyle = background || '#000';
        var fillY = y+1; // TODO: MAGIC NUMBERS!
            /* This is an off-by-one error positioning the font, which becomes
               off-by-two as the font is scaled to double height at 16px. */
        this.fillRectScroll(x, fillY, TILE_SIZE, TILE_SIZE, 'grey');
        this.fillRectScroll(32, 32, TILE_SIZE, TILE_SIZE, 'grey');
        // Display character
        if(font){ this.context.font = FONT_SIZE+'px '+font;}
        this.context.fillStyle = color || '#fff';
        this.context.fillText(character, x, y);
        this.context.restore();
    },
    drawString: function (x, y, newText, color, background, font){
        this.context.save();
        //this.fillRect(x, y, 48, 8, 'grey');
        // Reverse y (canvas origin problem):
        y = (DISPLAY_HEIGHT) - y;
        // Display Background
        /*this.context.fillStyle = background || '#000';
        var fillY = ((y-1)*TILE_SIZE)+2; // TODO: MAGIC NUMBERS!
            /* This is an off-by-one error positioning the font, which becomes
               off-by-two as the font is scaled to double height at 16px. * /
        var textWidth = newText.length;
        this.context.fillRectScroll(
            x*TILE_SIZE,
            fillY,
            TILE_SIZE*textWidth,
            TILE_SIZE
        );*/
        // Display character
        if(font){ this.context.font = FONT_SIZE+'px '+font;}
        this.context.fillStyle = background || '#204';
        var pixelNudge = 0;
        this.context.fillText(newText, (pixelNudge)+x+1, (pixelNudge)+y);
        this.context.fillStyle = color || '#fff';
        this.context.fillText(newText, (pixelNudge)+x, (pixelNudge)+y-1);
        this.context.restore();
    },

//-- Touchscreen Handling ------------------------------------------------------
    touchScreen: Object.extend(driver, {
        setup: function (){
            this.touchStart  = this.touchStart.bind( this);
            this.touchEnd    = this.touchEnd.bind(   this);
            this.touchCancel = this.touchCancel.bind(this);
            this.touchMove   = this.touchMove.bind(  this);
            this.click       = this.click.bind(      this);
            var displayCanvas = client.skin.displayContext.canvas;
            displayCanvas.addEventListener("touchstart", this.touchStart, false);
            displayCanvas.addEventListener("touchend", this.touchEnd, false);
            displayCanvas.addEventListener("touchcancel", this.touchCancel, false);
            displayCanvas.addEventListener("touchmove", this.touchMove, false);
            displayCanvas.addEventListener("contextmenu", this.eventCancel, false);
            displayCanvas.addEventListener('click', this.click, false);
        },
        touchCommands: 0,
        getCommands: function (){
            this.touchCommands = 0;
            for(var I = 0; I < this.touches.length; I++){
                var indexedTouch = this.touches[I];
                this.touchCommands |= indexedTouch.command;
            }
        },
        check: function (command){
            return this.touchCommands & command;
        },
        // Touch Handling
        touches: [],
        eventCancel: function (E){
            E.preventDefault();
        },
        click: function (E){
            E.preventDefault();
            // Determine Game-Pixel Location of touch
            var displayCanvas = client.skin.displayContext.canvas;
            var rectangle = displayCanvas.getBoundingClientRect();
            var displayScale = rectangle.width / DISPLAY_WIDTH;
            var canvasX = (E.clientX-rectangle.left)/displayScale;
            var canvasY = (E.clientY-rectangle.top )/displayScale;
            canvasY = DISPLAY_HEIGHT - canvasY;
            var command = this.findButton(canvasX, canvasY);
            console.log('click', command, canvasX, canvasY)
            if(command == SECONDARY){
                var result = window.open(DONATE_LINK);
                if(!result){
                    window.location = DONATE_LINK;
                }
            }
        },
        touchStart: function (E){
            E.preventDefault();
            var touches = E.changedTouches;
            for(var I = 0; I < touches.length; I++){
                this.touches.push(this.copyTouch(touches[I]));
            }
            this.getCommands();
        },
        touchEnd: function (E){
            E.preventDefault();
            var touches = E.changedTouches;
            for(var I = 0; I < touches.length; I++){
                var id = this.ongoingTouchIndexById(touches[I].identifier);
                if(id >= 0){
                    this.touches.splice(id, 1);
                } else {
                    console.log("Problem: can't figure out which touch to end");
                }
            }
            this.getCommands();
        },
        touchCancel: function (E){
            E.preventDefault();
            var touches = E.changedTouches;
            for(var I = 0; I < touches.length; I++){
                var id = this.ongoingTouchIndexById(touches[I].identifier);
                this.touches.splice(id, 1);
            }
            this.getCommands();
        },
        touchMove: function (E){
            E.preventDefault();
            var touches = E.changedTouches;
            for(var I = 0; I < touches.length; I++){
                var id = this.ongoingTouchIndexById(touches[I].identifier);
                if(id >= 0){
                    this.touches.splice(id, 1, this.copyTouch(touches[I]));
                } else{
                    console.log("Problem: can't figure out which touch to continue");
                }
            }
            this.getCommands();
        },
        // Convenience Functions
        copyTouch: function (touch){
            var newTouch = {identifier: touch.identifier, pageX: touch.pageX, pageY: touch.pageY};
            // Determine Game-Pixel Location of touch
            var displayCanvas = client.skin.displayContext.canvas;
            var rectangle = displayCanvas.getBoundingClientRect();
            var displayScale = rectangle.width / DISPLAY_WIDTH;
            var canvasX = (newTouch.pageX - rectangle.left)/displayScale;
            var canvasY = (newTouch.pageY - rectangle.top )/displayScale;
            canvasY = DISPLAY_HEIGHT - canvasY;
            newTouch.canvasX = canvasX;
            newTouch.canvasY = canvasY;
            newTouch.command = this.findButton(canvasX, canvasY);
            return newTouch;
        },
        ongoingTouchIndexById: function (idToFind){
            for(var I = 0; I < this.touches.length; I++){
                var id = this.touches[I].identifier;
                if(id == idToFind){ return I;}
            }
            return -1;
        },
        findButton: function (x, y){
            for(var I = 0; I < this.buttons.length; I++){
                var button = this.buttons[I];
                if(
                    (x >= button.x && x <= button.x+button.width) &&
                    (y >= button.y && y <= button.y+button.height)
                ){ return button.command;}
            }
            return 0;
        },
        // Drawing
        fudgeTime: 0,
        display: function (){
            var block = driver.display.apply(this, arguments);
            if(block){ return block;}
            for(var I = 0; I < this.buttons.length; I++){
                var button = this.buttons[I];
                button.draw();
            }
            return false;
        },
        buttons: [],
        touchArea: {
            width: 32,
            height: 32,
            _new: function (command, x, y, width, height){
                this.command = command;
                this.x = x;
                this.y = y;
                this.width = width;
                this.height = height;
                return this;
            },
            draw: function (){
                //client.skin.fillRect(this.x, this.y, this.width, this.height, "red");
            }
        },
        buttonModel: {
            width: 32,
            height: 32,
            _new: function (state, command, x, y, width){
                this.graphicState = state;
                this.command = command;
                this.x = x;
                this.y = y;
                if(width){ this.width = width;}
                return this;
            },
            draw: function (){
                var graphicState = this.graphicState;
                if(
                    client.keyCapture.check(this.command) ||
                    client.skin.touchScreen.check(this.command)
                ){ graphicState += 'Down';}
                client.skin.drawGraphic('controller', graphicState, this.x, this.y);
            }
        },
        clearButtons: function (){
            this.buttons = [];        
        },
        addTouchArea: function (command, x, y, width, height){
            var newArea = Object.instantiate(this.touchArea, command, x, y, width, height);
            this.buttons.push(newArea);
            return newArea;
        },
        addButton: function (state, command, x, y, width){
            var newButton = Object.instantiate(this.buttonModel, state, command, x, y, width);
            this.buttons.push(newButton);
            return newButton;
        },
        showStandardButtons: function (){
            this.clearButtons();
            this.addButton('left'   , LEFT   , 4, 0);
            this.addButton('right'  , RIGHT  , 32+8, 0);
            this.addButton('up'     , UP     , DISPLAY_WIDTH-64-8, 0);
            var primaryButton = this.addButton('primary', PRIMARY, DISPLAY_WIDTH-32-4, 0);
            primaryButton.fudgeTime = 0;
            primaryButton.draw = function (){
                if(
                    (game.hero.graphicState == 'ride') || // If on a motorcycle
                    (game.hero.currentSequence && game.hero.currentSequence.blockActive) || // Or standing on a block
                    game.hero.block // Or holding a block
                ){ this.fudgeTime = 2;}
                if(this.fudgeTime-- > 0){
                    this.graphicState = 'primaryActive';
                } else{
                    this.graphicState = 'primary';
                }
                return client.skin.touchScreen.buttonModel.draw.apply(this, arguments);
            };
        }
    }),

//-- Graphics Timer ------------------------------------------------------------
    graphicsTimer: {
        time: 0,
        speed: CLIENT_SPEED,
        interval: undefined,
        iterate: undefined,
        iterator: function (){
            this.time++;
            client.tick();
            client.display();
            // Write to display Canvas
            client.skin.displayContext.drawImage(
                client.skin.context.canvas,
                0, 0, client.skin.context.canvas.width, client.skin.context.canvas.height,
                0, 0, client.skin.displayContext.canvas.width, client.skin.displayContext.canvas.height
            );
        },
        start: function (){
            this.iterate = this.iterator.bind(this);
            this.interval = setInterval(this.iterate, this.speed);
        },
        stop: function (){
            clearInterval(this.interval);
            this.iterate = null;
            this.time = 0;
        }
    }
});
/* Tweet Measurer
12345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890

*/