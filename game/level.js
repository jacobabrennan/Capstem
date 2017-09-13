'use strict';

var tile = {
    graphic: 'tiles',
    activate: function (posX, posY){}
};
var level = {
    time: undefined,
    paused: true,
    iterateInterval: undefined,
    tileGrid: undefined,
    autoJoinGrid: undefined,
    coins: undefined,
    movers: undefined,
    song: undefined,
    //
    width: 160,
    height: 24,
    skyColor: '#59f',
    background1: 'level1#1',
    background2: 'level1#2',
    startX: 32,
    startY: 32,
    backgroundScrollSpeed: 1/3,
    tileTypes: {
        ' ': Object.extend(tile, {dense: false}),
        '>': Object.extend(tile, {dense: false, activate: function (posX, posY, activationId){
            var anItem = Object.instantiate(checkPoint);
            anItem.activationId = activationId;
            //anItem.faction = 0;
            anItem.x = posX * TILE_SIZE;
            anItem.y = posY * TILE_SIZE
        }}),
        '=': Object.extend(tile, {dense: true}),
        '#': Object.extend(tile, {graphic: 'grassy', dense: true}),
        '.': Object.extend(tile, {graphic: 'grassy', graphicState: 'slope+1/2', dense: false, slope: {left:0, right:1/2}}),
        '/': Object.extend(tile, {graphic: 'grassy', graphicState: 'slope+2/2', dense: false, slope: {left:1/2, right:1}}),
        ',': Object.extend(tile, {graphic: 'grassy', graphicState: 'slope-1/2', dense: false, slope: {left:1/2, right:0}}),
        '|': Object.extend(tile, {graphic: 'grassy', graphicState: 'slope-2/2', dense: false, slope: {left:1, right:1/2}}),
        '@': Object.extend(tile, {graphic: 'cloud', dense: false, slope: {left:1/2, right:1/2}}),
        '%': Object.extend(tile, {graphic: 'bush', dense: false}),
        '^': Object.extend(tile, {graphic: 'cloud', dense: true}),
        ';': Object.extend(tile, {graphic: 'cloud', dense: false, slope: {left:  0, right:1/2}}),
        '!': Object.extend(tile, {graphic: 'cloud', dense: false, slope: {left:1/2, right:2/2}}),
        '*': Object.extend(tile, {dense: false, activate: function (posX, posY, activationId){
            //game.level.lockCamera();
            var anItem = Object.instantiate(mushy);
            anItem.activationId = activationId;
            //anItem.faction = 0;
            anItem.direction = LEFT;
            anItem.x = posX * TILE_SIZE;
            anItem.y = posY * TILE_SIZE
        }}),
        '$': Object.extend(tile, { dense: false, activate: function (posX, posY, activationId){
            var anItem = Object.instantiate(coin);
            anItem.activationId = activationId;
            //anItem.faction = 0;
            anItem.x = posX * TILE_SIZE;
            anItem.y = posY * TILE_SIZE
        }}),
        'x': Object.extend(tile, { dense: false, activate: function (posX, posY, activationId){
            var anItem = Object.instantiate(suit);
            anItem.activationId = activationId;
            //anItem.faction = 0;
            anItem.x = posX * TILE_SIZE;
            anItem.y = posY * TILE_SIZE
        }}),
        'X': Object.extend(tile, { dense: false, activate: function (posX, posY, activationId){
            var anItem = Object.instantiate(suit);
            anItem.graphicState = 'suit2';
            anItem.activationId = activationId;
            //anItem.faction = 0;
            anItem.x = posX * TILE_SIZE;
            anItem.y = posY * TILE_SIZE
        }}),
        'P': Object.extend(tile, { dense: false, activate: function (posX, posY, activationId){
            var anItem = Object.instantiate(post);
            anItem.activationId = activationId;
            anItem.x = posX * TILE_SIZE;
            anItem.y = posY * TILE_SIZE;
        }}),
        'B': Object.extend(tile, { dense: false, activate: function (posX, posY, activationId){
            var anItem = Object.instantiate(bouncer);
            anItem.activationId = activationId;
            //anItem.faction = 0;
            anItem.x = posX * TILE_SIZE;
            anItem.y = posY * TILE_SIZE
        }}),
        '&': Object.extend(tile, { dense: false, activate: function (posX, posY, activationId){
            var anItem = Object.instantiate(motorcycle);
            anItem.activationId = activationId;
            //anItem.faction = 0;
            anItem.x = posX * TILE_SIZE;
            anItem.y = posY * TILE_SIZE
        }}),
        'W': Object.extend(tile, { locking: true, dense: false, activate: function (posX, posY, activationId){
            game.level.lockCamera();
            game.winLevel();
        }})
    },
    //events: undefined,
    dispose: function (){
        this.tileGrid = null;
        clearInterval(this.iterateInterval);
        var moversCopy = this.movers.slice();
        for(var I = 0; I < moversCopy.length; I++){
            var indexedMover = moversCopy[I];
            indexedMover.dispose();
        }
        /*var eventsCopy = this.events.slice();
        for(var I = 0; I < eventsCopy.length; I++){
            var indexedEvent = eventsCopy[I];
            indexedEvent.dispose();
        }*/
    },
    _new: function (){
        this.time = 0;
        this.coins = 0;
        this.tileGrid = [];
        this.tileGrid.length = this.width*this.height;
        this.movers = [];
        //this.events = [];
        this.autoJoinGrid = [];
        var autoJoinGrid = this.autoJoinGrid;
        autoJoinGrid.length = this.width*this.height;
        for(var posY = 0; posY < this.height; posY++){
            for(var posX = 0; posX < this.width; posX++){
                var compoundIndex = posY*this.width + posX;
                autoJoinGrid[compoundIndex] = 0;
                var stringIndex = (this.height-(posY+1))*this.width + posX;
                var indexedCharacter = this.tileString.charAt(stringIndex);
                var tileType = this.tileTypes[indexedCharacter];
                this.tileGrid[compoundIndex] = tileType;
            }
        }
        this.activateGrid = [];
        autoJoinGrid[0                         ] = 0 | DOWN | LEFT ;
        autoJoinGrid[this.width-1              ] = 0 | DOWN | RIGHT;
        autoJoinGrid[(this.height-1)*this.width] = 0 | UP   | LEFT ;
        autoJoinGrid[this.width*this.height -1 ] = 0 | UP   | RIGHT;
        autoJoinGrid[compoundIndex] = 0 | DOWN;
        for(var posX = 1; posX < this.width-1; posX++){
            var compoundIndex = 0*this.width               + posX;
            autoJoinGrid[compoundIndex] = 0 | DOWN;
            compoundIndex = (this.height-1)*this.width + posX;
            autoJoinGrid[compoundIndex] = 0 | UP;
        }
        for(var posY = 1; posY < this.height-1; posY++){
            var compoundIndex = posY*this.width;
            autoJoinGrid[compoundIndex] = 0 | LEFT;
            compoundIndex = (posY+1)*this.width - 1;
            autoJoinGrid[compoundIndex] = 0 | RIGHT;
        }
        for(var posY = 0; posY < this.height; posY++){
            for(var posX = 0; posX < this.width; posX++){
                var compoundIndex = posY*this.width + posX;
                var tileCenter = this.getTile(posX, posY);
                var tileRight = this.getTile(posX+1, posY);
                var tileUp = this.getTile(posX, posY+1);
                if(tileRight && tileCenter.graphic === tileRight.graphic){
                    autoJoinGrid[compoundIndex           ] |= RIGHT;
                    autoJoinGrid[compoundIndex+1         ] |= LEFT ;
                }
                if(tileUp    && tileCenter.graphic === tileUp.graphic   ){
                    autoJoinGrid[compoundIndex           ] |= UP   ;
                    autoJoinGrid[compoundIndex+this.width] |= DOWN ;
                }
            }
        }
    },
    registerMover: function (theMover, faction){
        if(this.movers.indexOf(theMover) === -1){
            this.movers.push(theMover);
        }
    },
    cancelMover: function (theMover){
        var moverIndex = this.movers.indexOf(theMover);
        if(moverIndex >= 0){
            this.movers.splice(this.movers.indexOf(theMover), 1);
        }
    },
    /*event: function (eventName, options){
        
    },*/
    getTile: function (x, y){
        if(this.infinite && x >= this.width){
            x = this.width-1;
        }
        else if(x < 0 || x >= this.width){ return null;}
        if(y < 0 || y >= this.height){ return null;}
        var compoundIndex = y*this.width + x;
        return this.tileGrid[compoundIndex];
    },
    tileAt: function (x, y){
        // Used to find the tile at a mover's coordinates, which are measured
        // more finely (by "pixels").
        var tileX = Math.floor(x/TILE_SIZE);
        var tileY = Math.floor(y/TILE_SIZE);
        return this.getTile(tileX, tileY);
    },
    getAutoJoin: function (x, y){
        if(this.infinite && x >= this.width){
            x = this.width-1;
        }
        else if(x < 0 || x >= this.width){ return null;}
        if(y < 0 || y >= this.height){ return null;}
        var compoundIndex = y*this.width + x;
        return this.autoJoinGrid[compoundIndex];
    },
    autoJoinAt: function (x, y){
        // Used to find the tile at a mover's coordinates, which are measured
        // more finely (by "pixels").
        var tileX = Math.floor(x/TILE_SIZE);
        var tileY = Math.floor(y/TILE_SIZE);
        return this.getAutoJoin(tileX, tileY);
    },
    start: function (){
        this.paused = false;
        // Place Character at Checkpoint
        if(this.checkPoint){
            game.hero.x = this.checkPoint.x;
            game.hero.y = this.checkPoint.y;
        } else{
            game.hero.x = this.startX;
            game.hero.y = this.startY;
        }
        // Reposition Camera
        game.camera.reset(NaN, NaN);
        this.advanceCamera();
        // Activate starting area
        var tileLeft  = Math.floor(game.camera.borderLeft()/TILE_SIZE);
        var tileRight = Math.floor(game.camera.borderRight()/TILE_SIZE);;
        for(var tileY = 0; tileY < this.height; tileY++){
            for(var tileX = tileLeft; tileX <= tileRight; tileX++){
                var compoundIndex = tileY*this.width + tileX;
                if(!this.activateGrid[compoundIndex]){
                    this.tileGrid[compoundIndex].activate(tileX, tileY, compoundIndex);
                    this.activateGrid[compoundIndex] = true;
                }
            }
        }
    },
    lockCamera: function (){
        this.cameraLock = true;
    },
    advanceCamera: function (){
        if(this.cameraLock){
            game.camera.focus();
        } else{
            var focusX = 0;
            var focusY = game.hero.y-DISPLAY_HEIGHT/2;
            if(this.infinite){
                focusX = game.hero.x+2*TILE_SIZE - 4*TILE_SIZE;
                focusX = bound(0, focusX, Infinity);
            } else{
                focusX = game.hero.x+2*TILE_SIZE-DISPLAY_WIDTH/2;
                focusX = bound(0, focusX, this.width*TILE_SIZE-DISPLAY_WIDTH);
            }
            focusY = bound(0, focusY, this.height*TILE_SIZE-DISPLAY_HEIGHT);
            game.camera.focus(focusX, focusY);
        };
    },
    iterate: function (){
        if(this.paused){ return;}
        this.time++;
        var releaseCameraLock = true;
        var moversCopy = this.movers.slice();
        for(var I = 0; I < moversCopy.length; I++){
            var indexedMover = moversCopy[I];
            indexedMover.takeTurn();
            if(releaseCameraLock && !(indexedMover.faction&(FACTION_PLAYER|FACTION_ENVIRONMENT))){
                releaseCameraLock = false;
            }
        }
        if(releaseCameraLock){
            this.cameraLock = false;
        }
        var oldBorderLeft = game.camera.borderLeft();
        var oldBorderRight = game.camera.borderRight();
        // Advance Camera
        this.advanceCamera();
        // Activate & Deactivate revealed landscape
        var newBorderLeft = game.camera.borderLeft();
        var newBorderRight = game.camera.borderRight();
        if(newBorderRight < this.width*TILE_SIZE && newBorderRight > oldBorderRight){
            var oldTileRight = tileCoord(oldBorderRight)//+1;
            var newTileRight = tileCoord(newBorderRight)//+1; // Activate ahead of player view
            if(newTileRight > oldTileRight && newTileRight < this.width){
                for(var newTileY = 0; newTileY < this.height; newTileY++){
                    var compoundIndex = newTileY*this.width + newTileRight;
                    if(!this.activateGrid[compoundIndex]){
                        this.tileGrid[compoundIndex].activate(newTileRight, newTileY, compoundIndex);
                        this.activateGrid[compoundIndex] = true;
                    }
                }
            }
        } else if(newBorderLeft < this.width*TILE_SIZE && newBorderLeft < oldBorderLeft){
            var oldTileLeft = tileCoord(oldBorderLeft)//+1;
            var newTileLeft = tileCoord(newBorderLeft)//+1; // Activate ahead of player view
            if(newTileLeft < oldTileLeft && newTileLeft >= 0){
                for(var newTileY = 0; newTileY < this.height; newTileY++){
                    var compoundIndex = newTileY*this.width + newTileLeft;
                    if(!this.activateGrid[compoundIndex]){
                        this.tileGrid[compoundIndex].activate(newTileLeft, newTileY, compoundIndex);
                        this.activateGrid[compoundIndex] = true;
                    }
                }
            }
        }
        if(this.ended){
            this.dispose();
            this.paused = true;
        }
    },
};
var levels = {
    'unused': Object.extend(level, {
        id: 'level1',
        nextLevel: 'level1',
        name: 'Level 2',
        width: 160,
        height: 24,
        infinite: true,
        startX: 3*TILE_SIZE,
        startY: 2*TILE_SIZE,
        skyColor: 'black',
        background1: 'level2#2',
        background2: 'level2#1',
        tileString:
            '                                                                                                                                                                '+
            '                                                                                                                                                                '+
            '      @@@                                                                                                                                                       '+
            '       @@@@  @@@@                                                                                                                                               '+
            '         @@@@@@@                $$$$$                 @@@@@                                                                                                     '+
            '                                $$$$$               @@@@@                                                                                                       '+
            '                                                                                                                                                                '+
            '                               @@@@@@@                                                                                                                          '+
            '    @@@@                                                             @@@@@@@@@@@                                                                                '+
            '    @@@             $$$                                           @@@@@       @@@@@@@@@@@@                                                                      '+
            '                         @@@              @@@                  @@@@@@@  @@     @@@@@@@@                                                                         '+
            '           $$$            @@@              @@@                     @@    @   @@@@@@@@@@@                                                                        '+
            '                 @@@@@                                            @@@@@@   @@@@@@@@@@@@                                                                         '+
            '                @@@@@@@                                      @@@@@@@@@@ @@@@@@@@@@@@                                                                            '+
            ' @@@    @@@                                                    @@@@@@@@@@@@@@@@@         $                                                                      '+
            '  @@@    @@@                                                 @@@@@@@@@@@@@@^^^^^^^^^^^^^^^^^^^^                                                                 '+
            '                                                                     $##                  $    ^                                                                '+
            '                                                                      $##                       ^                                                               '+
            '                                                                    $##                          ^                                                              '+
            '                                                                      ##  %%                      ^                                                             '+
            '                              ./#|,                                   ## %%%%% %%     %% %     %%  ^                   @@@@@@@@@@                               '+
            '                   &        ./#####|,                    P            ##%%%%%%%%%%   %%%%%%   %%%%  ^                                                           '+
            '###########################################   #  ##########    #***##*###############################^              ;  $$$$$$$$$$                               '+
            '# #  #  #  #  #  #  #  #  #  ##########      # ############    #######################################^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^'
    }),
}
/*var event = {
    init: function (options){},
    takeTurn: function (options){}
};*/
