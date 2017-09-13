'use strict';

var sequence = {
    /*_new: function (owner){
        this.id = 1000+Math.floor(Math.random()*8999);
    },*/
    init: function (owner){},
    takeTurn: function (owner){},
    land: function (owner, baseBlock){},
    interrupt: function (owner, newSequence){
        return true;
    }
};
var sequences = {
    'stand': Object.extend(sequence, {
        init: function (owner){
            if(owner.order(DOWN)){
                owner.sequence('kneel');
                return;
            }
            owner.height = owner.standHeight;
        },
        takeTurn: function (owner){
            var directionX = 0;
            var directionY = 0;
            if(owner.order(RIGHT)){ directionX = RIGHT;}
            if(owner.order(LEFT )){ directionX = LEFT ;}
            if(!directionX){ owner.graphicState = 'stand';}
            else{
                owner.graphicState = 'run';
                owner.walk(directionX);
            }
            if(owner.block){ owner.graphicState += 'Block'}
            if(owner.velY < -owner.gravity){
                owner.sequence('fall');
            } else if(owner.order(UP)){
                owner.sequence('jump');
            } else if(owner.order(DOWN)){
                owner.sequence('kneel');
            } else if(owner.order(PRIMARY)){
                if(!owner.block){ // Grab a Block
                    owner.sequence('pickup');
                } else{ // Throw a block
                    owner.sequence('throw');
                }
            }
        }
    }),
    'kneel': Object.extend(sequence, {
        init: function (owner){
            owner.height = owner.kneelHeight
        },
        takeTurn: function (owner){
            owner.graphicState = 'kneel';
            if(owner.block){ owner.graphicState += 'Block'}
            if(!owner.order(DOWN)){
                owner.sequence('stand');
            }
            
            if(owner.order(PRIMARY)){
                if(!owner.block){
                    owner.sequence('pickup');
                } else{
                    owner.sequence('throw');
                }
            }
        }
    }),
    'pickup': Object.extend(sequence, {
        name: 'pickup',
        init: function (owner){
            this.timeStamp = game.level.time;
            var grabBlock = null;
            for(var blockI = 0; blockI < game.level.movers.length; blockI++){
                var m2 = game.level.movers[blockI];
                if(!m2.dense || m2 === this){ continue;}
                if(Math.abs(owner.x+owner.width /2 - (m2.x+m2.width /2)) >= (owner.width +m2.width )/2){ continue;}
                var baseVector = (m2.y+m2.height)-owner.y;
                if(baseVector < -5 || baseVector > 3){ continue;}
                grabBlock = m2;
            }
            if(!grabBlock){
                owner.sequence('stand');
                return;
            }
            game.playEffect('pickup');
            this.block = grabBlock;
            this.block.velX = 0;
            this.block.velY = 0;
        },
        takeTurn: function (owner){
            owner.graphicState = 'pickup';
            var timeLapsed = game.level.time - this.timeStamp;
            this.block.velX = 0;
            this.block.velY = 0;
            this.block.x = owner.x+(owner.width-this.block.width)/2;
            if(timeLapsed > owner.pickupDelay){
                if(!this.inverted){
                    this.inverted = true;
                    this.block = this.block.invert();
                    this.block.center(owner);
                    this.block.faction = owner.faction;
                }
                var moveDelay = 5;
                if(timeLapsed > owner.pickupDelay+moveDelay){
                    owner.block = this.block;
                    this.block = null;
                    owner.sequence('stand');
                }
                if(this.block){
                    this.block.y = owner.y + (timeLapsed-owner.pickupDelay)*owner.height/moveDelay;
                }
                owner.graphicState = 'kneelBlock';
            }
        },
        interrupt: function (owner){
            if(!this.inverted || !this.block){ return;}
            owner.block = this.block;
            this.block = null;
        }
    }),
    'throw': Object.extend(sequence, {
        init: function (owner){
            if(!owner.block || !owner.block.throwReady){
                if(owner.velY){ owner.sequence('fall');}
                else{ owner.sequence('stand');}
                return;
            }
            game.playEffect('throw');
            this.timeStamp = game.level.time;
            owner.graphicState = 'throw';
            var throwVector = (owner.direction === RIGHT)? 1 : -1;
            owner.block.velY = /*owner.velY + */3;
            owner.block.velX = owner.velX + throwVector*4;
            owner.block.gravity = 1/2;
            owner.block.faction = owner.faction;
            owner.block = null;
        },
        takeTurn: function (owner){
            var directionX = 0;
            if(owner.order(RIGHT)){ directionX = RIGHT;}
            if(owner.order(LEFT )){ directionX = LEFT ;}
            if(directionX){
                owner.walk(directionX);
            }
            if(game.level.time - this.timeStamp < 3){
                owner.graphicState = 'throw';
            } else{
                if(owner.velY){ owner.sequence('fall');}
                else{ owner.sequence('stand');}
            }
        }
    }),
    'jump': Object.extend(sequence, {
        init: function (owner){
            game.playEffect('jump');
            this.time = 0;
            owner.graphicState = 'jump';
            if(owner.block){ owner.graphicState += 'Block'}
            owner.velY = owner.jumpSpeed;
        },
        takeTurn: function (owner){
            owner.graphicState = 'jump';
            if(owner.block){ owner.graphicState += 'Block'}
            if(owner.velY < 0){
                owner.sequence('fall');
            } else if(++this.time < 7 && !this.released){
                if(owner.order(UP)){ owner.velY = Math.max(owner.jumpSpeed, owner.velY);}
                else{ this.released = true;}
            }
            var directionX = 0;
            if(owner.order(RIGHT)){ directionX = RIGHT;}
            if(owner.order(LEFT )){ directionX = LEFT ;}
            owner.walk(directionX);
            if(owner.order(PRIMARY)){
                if(owner.block){
                    owner.sequence('throw');
                }
            }
        }
    }),
    'bounce': Object.extend(sequence, {
        init: function (owner){
            this.time = 0;
            owner.graphicState = 'jump';
            if(owner.block){ owner.graphicState += 'Block'}
        },
        takeTurn: function (owner){
            owner.graphicState = 'jump';
            if(owner.block){ owner.graphicState += 'Block'}
            if(owner.velY < 0){
                owner.sequence('fall');
            }
            var directionX = 0;
            if(owner.order(RIGHT)){ directionX = RIGHT;}
            if(owner.order(LEFT )){ directionX = LEFT ;}
            owner.walk(directionX);
            if(owner.order(PRIMARY)){
                if(owner.block){
                    owner.sequence('throw');
                }
            }
        }
    }),
    'fall': Object.extend(sequence, {
        init: function (owner){
            owner.graphicState = 'fall';
            if(owner.block){ owner.graphicState += 'Block'}
        },
        takeTurn: function (owner){
            var directionX = 0;
            if(owner.order(RIGHT)){ directionX = RIGHT;}
            if(owner.order(LEFT )){ directionX = LEFT ;}
            owner.walk(directionX);
            if(owner.order(PRIMARY)){
                if(owner.block){
                    owner.sequence('throw');
                }
            }
            //if(owner.velY > 0){ owner.sequence('stand');}
        },
        land: function (owner){
            //console.log('landed')
            owner.sequence('stand')
        }
    }),
    'ride': Object.extend(sequence,{
        init: function (owner){
            var originalSequence = owner.sequence;
            owner.sequence = function (newSequence){
                if(newSequence === 'dismount'){
                    this.sequence = originalSequence;
                    this.sequence('fall');
                }
            };
        },
        takeTurn: function (owner){
            owner.velY = -owner.gravity;
        }
    }),
    'fetch': Object.extend(sequence, {
        init: function (owner){
            owner.height = owner.standHeight;
            this.charge = 0;
        },
        takeTurn: function (owner){
            owner.graphicState = 'stand';
            if(owner.block){ owner.graphicState += 'Block'}
            if(owner.velY < -owner.gravity){
                owner.sequence('fall');
            } else{
                if(owner.block && this.charge++ > randomInterval(50,320)){
                    owner.sequence('throw');
                    game.level.ball.inversion.velX = this.charge/5;
                    game.level.ball.inversion.velY = randomInterval(6, this.charge/5);
                } else if(game.level.ball && owner.collisionCheck(game.level.ball)){
                    owner.sequence('jump');
                    game.level.ball.velX = 0;
                }
            }
        }
    }),
};
var character = Object.extend(mover, {
    x: 0,
    y: 0,
    height: undefined,
    faction: FACTION_PLAYER,
    hurting: 0,
    blockStanding: true,
    //
    name: 'character',
    color: 'black',
    //graphic: 'test',
    standHeight: 32,
    kneelHeight: 16,
    speed: 4,
    gravity: 1,
    jumpSpeed: 8,
    frictionRate: 1/2,
    pickupDelay: 4,
    //
    direction: RIGHT,
    dead: false,
    commandStorage: 0,
    order: function (command){
        return this.commandStorage & command;
    },
    die: function (){
        this.currentSequence.interrupt(this);
        if(this.dead){ return;}
        if(this.block){
            this.block.velY = 3;
            this.block.velX = 0;
            this.block.gravity = 1/2;
            this.block.faction = this.faction;
            this.block = null;
        }
        this.dead = true;
        Object.instantiate(this.deathDummy);
        this.dispose();
    },
    takeTurn: function (){
        if(this.hurting){ this.hurting--;}
        mover.takeTurn.apply(this, arguments);
        if(!this.dead && this.y <= -this.height){ this.die(); return;}
        if(!this.currentSequence){
            this.sequence('stand');
        }
        this.currentSequence.takeTurn(this);
        if(this.dead){ return;}
        if(this.block){
            this.block.center(this);
            this.block.y = this.y + this.height;
        }
        this.friction();
    },
    sequence: function (sequenceName){
        //console.log(sequenceName)
        var sequenceModel = sequences[sequenceName]
        if(!sequenceModel){ return;}
        if(this.currentSequence){
            this.currentSequence.interrupt(this, sequenceName);
        }
        this.currentSequence = Object.instantiate(sequenceModel);
        this.currentSequence.name = sequenceName
        this.currentSequence.init(this);
    },
    walk: function (direction){
        var deltaX = 0;
        if(direction){
            var vector = (direction === RIGHT)? 1 : ((direction === LEFT)? -1 : 0)
            this.velX += vector;
            this.velX = bound(this.velX, -this.speed, this.speed);
            this.direction = direction
            /*deltaX = vector * this.speed;
            if(this.direction === LEFT){ this.graphic = 'testLeft';}
            else{ this.graphic = 'test';}*/
            if(this.velX > 0){
                var borderRight = game.camera.borderRight();
                if(this.x+this.width+this.velX > borderRight){
                    this.velX = borderRight-(this.x+this.width);
                }
            } else if(this.velX < 0){
                var borderLeft = game.camera.borderLeft();
                if(this.x+this.velX < borderLeft){
                    this.velX = -(this.x - borderLeft);
                }
            }
        }
        /*if(deltaX){
            this.translate(deltaX, 0);
            var frame = Math.floor((client.skin.graphicsTimer.time%24)/6)+1;
            if(frame === 4){ frame = 2;}
            this.graphicState = 'walk'+frame;
        }*/
    },
    friction: function (frictionRate){
        if(frictionRate === undefined){ frictionRate = this.frictionRate;}
        if(this.velX > 0){
            frictionRate = Math.min(frictionRate, this.velX);
        } else{
            frictionRate *= -1;
            frictionRate = Math.max(frictionRate, this.velX);
        }
        this.velX -= frictionRate;
    },
    land: function (landingBlock){
        if(this.currentSequence){
            // Showing yellow star button state on client, only when standing on a block.
            if(landingBlock){ this.currentSequence.blockActive = true;}
            else{ this.currentSequence.blockActive = false;}
        }
        if(!(landingBlock && landingBlock.landEffect(this))){
            if(this.currentSequence){
                this.currentSequence.land(this);
            }
        }
    },
    base: function (){
        
    },
    hurt: function (attacker, tripping){
        if(this.hurting){ return;}
        var damaged = false;
        /*if(tripping){
            damaged = this.currentSequence.interrupt(this, 'trip');
        } else{
            damaged = this.currentSequence.interrupt(this);
        }*/
    },
    invincible: function (amount){
        this.hurting = Math.max(this.hurting, amount);
    }
});
var hero = Object.extend(character, {
    faction: FACTION_PLAYER,
    order: function (command){
        return client.keyCapture.check(command) || client.skin.touchScreen.check(command);
    },
    stopHorizontal: function (){
        //this.velX = 0;
        return character.stopHorizontal.apply(this, arguments);
    },
    hurt: function (attacker){
        if(this.hurting){ return;}
        if(game.level.coins){
            game.playEffect('coinSpill');
            var newCoin;
            var lostCoins = Math.min(game.level.coins, 10);
            for(var coinIndex = 0; coinIndex < lostCoins; coinIndex++){
                newCoin = Object.instantiate(coinSpill);
                newCoin.center(this);
                var theta = (Math.PI/2)/(Math.max(1, lostCoins-1)) * coinIndex + Math.PI/4;
                newCoin.velX = Math.cos(theta)*7;
                newCoin.velY = Math.sin(theta)*7;
            }
            game.level.coins -= lostCoins;
            this.invincible(TIME_HURT);
        } else{
            this.die();
        }
        //return character.hurt.apply(this, arguments);
    }
});
hero.deathDummy = Object.extend(mover, {
    gravity: 1,
    _new: function (){
        this.timeStamp = game.level.time;
        var H = game.hero;
        this.graphic = H.graphic;
        this.graphicState = 'dead';
        this.width = H.width;
        this.height = H.height;
        this.center(H);
        if(this.y > 0){
            this.velY = 12;
        }
        return mover._new.apply(this, arguments);
    },
    translate: function (deltaX, deltaY){
        this.x += deltaX;
        this.y += deltaY;
    },
    takeTurn: function (){
        var result = mover.takeTurn.apply(this, arguments);
        if(game.level.time - this.timeStamp > TIME_DEATH){
            game.die();
        }
        return result;
    }
});
var heros = {
    'Frankie': Object.extend(hero,{
        name: 'Frankie',
        graphic: 'frankie',
        standHeight: 26,
        kneelHeight: 16,
        pickupDelay: 2,
        speed: 5,
        gravity: 1,
        jumpSpeed: 7,
        frictionRate: 2/3,
        //
    }),
    "Cap'n": Object.extend(hero,{
        name: "Cap'n",
        graphic: 'capn',
        standHeight: 30,
        kneelHeight: 16,
        pickupDelay: 8,
        speed: 4,
        gravity: 1,
        jumpSpeed: 8,
        frictionRate: 1/2,
        //
    }),
    'Edna': Object.extend(hero,{
        name: 'Edna',
        graphic: 'edna',
        standHeight: 16,
        kneelHeight: 16,
        pickupDelay: 5,
        width: 28,
        speed: 6,
        gravity: 0.34,
        jumpSpeed: 5,
        frictionRate: 2/3,
        //
        takeTurn: function (){
            hero.takeTurn.apply(this, arguments);
            if(this.block){
                this.block.center(this);
                var directionX = (this.direction === LEFT)? -1 : 1;
                this.block.x += this.width/2 * directionX;
                this.block.y += 3
            }
        },
        sequence: function (sequenceName){
            if(sequenceName === 'kneel'){ return null;}
            return hero.sequence.apply(this, arguments);
        }
    }),
    'theBride': Object.extend(hero, {
        name: 'the Bride',
        graphic: 'motorcycle',
        width: 42,
        height: 22,
        speed: 8,
        gravity: 0.34,
        velX: 0,
        jumpSpeed: 10,
        rider: null,
        imprint: function (rider, activationId){
            this.activationId = activationId;
            this.rideStamp = game.level.time;
            //game.hero = this;
            this.rider = rider;
            this.rider.graphicState = 'ride';;
            this.rider.sequence('ride');
            this.body = Object.instantiate(mover);
            this.body.graphic = this.graphic;
            this.body.width = this.width;
            this.body.height = this.height;
            this.body.graphicState = 'body1';
            arrayRemove(game.level.movers, this.body);
            arrayRemove(game.level.movers, this);
            var heroIndex = game.level.movers.indexOf(game.hero);
            if(heroIndex !== -1){
                game.level.movers.splice(heroIndex, 0, this.body);
                game.level.movers.splice(heroIndex, 0, this);
            }
            //this.body.takeTurn = function (){};
            //rider.dispose();
            this.takeTurn();
        },
        translate: function (){
            var oldY = this.y;
            var result = hero.translate.apply(this, arguments);
            var deltaY = this.y - oldY;
            if(deltaY > this.velY){
                this.velY += Math.abs(this.velX);
            }
            return result;
        },
        dispose: function (){
            this.rider = null;
            this.body.dispose();
            this.body = null;
            return hero.dispose.apply(this, arguments);
        },
        dismount: function (){
            this.rider.sequence('dismount');
            this.rider = null;
            var newCycle = Object.instantiate(motorcycle);
            newCycle.activationId = this.activationId;
            this.activationId = null;
            newCycle.center(this);
            //newCycle.x += this.width;
            newCycle.graphicState = 'running';
            newCycle.gravity = this.gravity;
            this.dispose();
            return null;
        },
        takeTurn: function (){
            /*if(game.hero.order(LEFT)){
                this.velX--;
            }
            if(game.hero.order(RIGHT)){
                this.velX++;
            }*/
            if(this.rider && game.hero.order(PRIMARY)/* && game.level.time - this.rideStamp > 16*/){
                this.dismount();
            }
            var result = hero.takeTurn.apply(this, arguments);
            this.body.center(this);
            this.body.y = this.y;
            var vibrato = 8;
            if(this.velX > 7){ vibrato = 2}
            else if(this.velX > 3){ vibrato = 4}
            if(game.level.time%vibrato < vibrato/2){
                this.body.graphicState = 'body1';
            } else{
                this.body.graphicState = 'body2';
            }
            if(this.rider){
                if(this.velX < this.speed){
                    this.velX += 1/2;
                }
                this.rider.x = this.x+8;
                this.rider.y = this.y+8;
            } else{
                if(this.x            > game.camera.borderRight()+TILE_SIZE*2){ this.dispose();}
                if(this.x+this.width < game.camera.borderLeft( )-TILE_SIZE*2){ this.dispose();}
            }
            this.graphicState = 'wheels';
            return result;
        }
    }),
};