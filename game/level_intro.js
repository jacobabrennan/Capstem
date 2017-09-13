'use strict'

levels['intro'] = Object.extend(level, {
    id: 'level1', // This makes it 'start over' at level when when game.die() is called.
    //nextLevel: 'level1',
    //name: "The Home of Frankie & Cap'n",
    width: 40,
    height: 16,
    skyColor: '#59f',
    background1: 'level1#1',
    background2: 'level1#2',
    startX: TILE_SIZE*19,
    startY: 16,
    infinite: true,
    tileString:
        '                                        '+
        '                                        '+
        '                                        '+
        '                                        '+
        '                                        '+
        '                                        '+
        '                                        '+
        '                                        '+
        '                                        '+
        '                                        '+
        '                                        '+
        '                                        '+
        '                                        '+
        '                                        '+
        '                                        '+
        '########################################',
    scrollVelocity: 0,
    advanceCamera: function (){
        if(!this.scrollVelocity){
            level.advanceCamera.apply(this, arguments);
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
            if(!game.camera.x){ game.camera.x = 0}
            focusX = (game.camera.targetX) + this.scrollVelocity;
            focusY = bound(0, focusY, this.height*TILE_SIZE-DISPLAY_HEIGHT);
            game.camera.focus(focusX, focusY);
        };
    },
    setup: function (){
        // cannot be done in _new. level._new has to return before instantiating movers.
        var result = level._new.apply(this, arguments);
        this.erik = Object.instantiate(this.modelErik);
        this.erik.x = TILE_SIZE*19; this.erik.y = TILE_SIZE;
        this.may = Object.instantiate(this.modelMay);
        this.sally = Object.instantiate(this.modelSally);
        this.cash = Object.instantiate(this.modelCash);
        this.cash.x = TILE_SIZE*22; this.cash.y = TILE_SIZE;
        this.cloud = Object.instantiate(this.modelCloud);
        this.cloud.x = TILE_SIZE*26; this.cloud.y = TILE_SIZE*2;
        this.sally.x = this.cloud.x+22; this.sally.y = this.cloud.y+this.cloud.height;
        this.sally.direction = LEFT;
        this.may.x = this.cloud.x+4; this.may.y = this.cloud.y+this.cloud.height;
        this.may.direction = LEFT;
        game.hero = this.erik;
        this.setup = null;
    },
    iterate: function (){
        if(this.setup){ this.setup();}
        //
        var I = 0;
        if(this.time <= (I+=16)){
        } else if(this.time <= (I+=64)){
            if(!this.dialogue){
                this.dialogue = {
                    portrait: 'sally',
                    text: ['Go get the cash, May!'],
                    align: RIGHT
                };
            }
        } else if(this.time <= (I+=16)){
            this.may.commandStorage |= LEFT;
        } else if(this.time <= (I+=2)){
            this.may.commandStorage = UP;
            this.dialogue = null;
        } else if(this.time <= (I+=16)){
            this.may.commandStorage = 0;
            //this.may.commandStorage = UP;
        } else if(this.time <= (I+=2)){
            this.may.commandStorage = PRIMARY;
        } else if(this.time <= (I+=16)){
            this.may.commandStorage = 0;
        } else if(this.time <= (I+=16)){
            this.may.commandStorage = RIGHT;
        } else if(this.time <= (I+=4)){
            this.may.commandStorage = RIGHT|UP;
            if(!this.dialogue){
                this.dialogue = {
                    portrait: 'may',
                    text: ["Let's go, Sally!"],
                    align: RIGHT
                };
            }
        } else if(this.time <= (I+=4)){
            this.may.commandStorage = 0;
            this.may.direction = RIGHT;
        } else if(this.time <= (I+=2)){
            this.sally.direction = RIGHT;
        } else if(this.time <= (I+=16)){
            this.cloud.x += 1;
            this.may.x += 1;
            this.sally.x += 1;
        } else if(this.time <= (I+=16)){
            this.may.gravity = 0;
            this.sally.gravity = 0;
            this.cloud.x += 2;
            this.may.x += 2;
            this.sally.x += 2;
            this.cloud.velY += 1;
            this.may.velY += 1;
            this.sally.velY += 1;
        } else if(this.time <= (I+=1)){
            this.dialogue = null;
            this.may.dispose();
            this.cash.dispose();
            this.cloud.dispose();
            this.sally.dispose();
            this.may = null;
            this.cash = null;
            this.cloud = null;
            this.sally = null;
            this.frankie = Object.instantiate(this.modelFrankie);
            this.frankie.x = this.erik.x-TILE_SIZE*3; this.frankie.y = TILE_SIZE*2;
            this.frankie.commandStorage = RIGHT;
            this.frankie.jumpSpeed = 5;
        } else if(this.time <= (I+=32)){
            this.erik.commandStorage = DOWN;
            if(!this.dialogue){
                this.dialogue = {
                    portrait: 'capn',
                    text: [
                        "They took all the money!",
                        "What are we gonna do?"
                    ],
                    align: LEFT
                };
            }
        } else if(this.time <= (I+=56)){
            this.frankie.commandStorage = UP;
            this.frankie.block = {x:0,y:0,center: function(){}};
            //this.frankie.commandStorage  = Object.instantiate(heros["Frankie"]);
            //this.frankie.x = TILE_SIZE*-1; this.frankie.y = TILE_SIZE;
        } else if(this.time <= (I+=64)){
            this.dialogue = null;
            //this.frankie.block = null;
            this.frankie.commandStorage = 0;
        } else if(this.time <= (I+=32)){
            if(!this.dialogue){
                this.dialogue = {
                    portrait: 'frankie',
                    text: [
                        "We're gonna get it back,",
                        "that's what!"
                    ],
                    align: LEFT
                };
            }
            this.frankie.block = null;
        } else if(this.time <= (I+=32)){
            
        } else if(this.time === I+1){
            if(this.frankie && this.erik){
                this.frankie.dispose();
                this.frankie = null;
                this.erik.dispose();
                this.erik = null;
                game.lives++;
                game.die();
                return null;
            }
        }
        /*
        Erik with cash
        Sally+May come on scene
        Sally tells May to take the cash
        May says OK to Sally
        May walks forward
        May grabs cash
        May walks back to Sally
        Sally and May disappear
        Frankie comes on the scene
        Frankie asks what's going on
        Erik says that they took the cash, "what are we going to do?"
        Frankie says they'll go get it back
        Frankie and Erik exit right
        */
        //
        if(this.erik){
            game.camera.focus(this.erik.x, this.erik.y);
        }
        return level.iterate.apply(this, arguments);
    },
//==============================================================================
    modelFrankie: Object.extend(character, {
        graphic: 'frankie'
    }),
    modelErik: Object.extend(character, {
        graphic: 'capn'
    }),
    modelSally: Object.extend(character, {
        graphic: 'sally',
        width: 24,
        standHeight: 32
    }),
    modelMay: Object.extend(character, {
        graphic: 'may',
        width: 24,
        standHeight: 24
    }),
    modelCash: Object.extend(block, {
        graphic: 'blocks',
        graphicState: 'cash',
        invert: function (){
            var result = block.invert.apply(this, arguments);
            result.inverted = false;
            return result;
        }
    }),
    modelCloud: Object.extend(block, {
        graphic: 'sally',
        graphicState: 'cloud',
        height: 10,
        width: 54,
        gravity: 0
    })
});