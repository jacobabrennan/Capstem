'use strict';

var mover = {
    x: 0,
    y: 0,
    velX: 0,
    velY: 0,
    width:  TILE_SIZE,
    height: TILE_SIZE,
    color: 'grey',
    gravity: 0,
    direction: LEFT,
    faction: FACTION_ENVIRONMENT,
    blockStanding: false,
    _new: function (){
        game.level.registerMover(this, this.faction);
    },
    reactivating: true,
    dispose: function (){
        game.level.cancelMover(this);
        if(this.reactivating && this.activationId){
            game.level.activateGrid[this.activationId] = false;
        }
    },
    takeTurn: function (){
        if(this.gravity){
            this.velY = bound(this.velY-this.gravity, -(TILE_SIZE-1), (TILE_SIZE-1));
        }
        this.translate(this.velX, this.velY);
    },
    collisionCheck: function (m2){
        if(    Math.abs(this.x+this.width /2 - (m2.x+m2.width /2)) < (this.width +m2.width )/2){
            if(Math.abs(this.y+this.height/2 - (m2.y+m2.height/2)) < (this.height+m2.height)/2){
                return true;
            }
        }
        return false;
    },
    containsPoint: function (x, y){
        if(this.x <= x && this.x+this.width >= x && this.y <= y && this.y+this.height >= y){
            return true;
        }
        return false;
    },
    land: function (){},
    stopHorizontal: function (){},
    translate: function(deltaX, deltaY){
        var originalX = this.x;
        var originalY = this.y;
        //var success = false;
        // Determine if movement will cause the object's edge to cross a border between turfs.
        var checkX = false;
        var checkY = false;
        var poleX;
        var poleY;
        var landed = false;
        var blockStand = null;
        if(!deltaX){ poleX = 0;}
        else if(deltaX > 0){ poleX = 1;}
        else{ poleX = -1;}
        if(!deltaY){ poleY = 0;}
        else if(deltaY > 0){ poleY = 1;}
        else{ poleY = -1;}
        var baseY = Math.floor((this.y)/TILE_SIZE)*TILE_SIZE;
        if(deltaY < 0 && this.blockStanding){
            for(var blockI = 0; blockI < game.level.movers.length; blockI++){
                var m2 = game.level.movers[blockI];
                if(!m2.dense || m2 === this){ continue;}
                if(Math.abs(this.x+this.width /2 - (m2.x+m2.width /2)) >= (this.width +m2.width )/2){ continue;}
                var baseVector = (m2.y+m2.height)-this.y;
                if(baseVector < deltaY || baseVector > 0){ continue;}
                deltaY = baseVector;
                blockStand = m2;
            }
        }
        if(blockStand){
            this.velY = 0;
            landed = true;
            checkY = false;
        }
        if(poleX == 1){
            if(((this.x+this.width)-1)%TILE_SIZE + deltaX >= TILE_SIZE){
                // -1 because the Nth position pixel is at index N-1.
                checkX = true;
                var limitX = TILE_SIZE - (((this.x+this.width)-1)%TILE_SIZE);
                this.x += limitX-1;
                deltaX -= limitX-1;
            }
        }
        else if(poleX == -1){
            if((this.x%TILE_SIZE) + deltaX < 0){
                checkX = true;
                this.x = this.x - (this.x%TILE_SIZE);
                deltaX = deltaX + this.x%TILE_SIZE;
            }
        }
        if(poleY == 1){
            if(((this.y+this.height)-1)%TILE_SIZE + deltaY >= TILE_SIZE){
                // -1 because the Nth position pixel is at index N-1.
                checkY = true;
                var limitY = TILE_SIZE - (((this.y+this.height)-1)%TILE_SIZE);
                this.y += limitY-1;
                deltaY -= limitY-1;
            }
        }
        else if(poleY == -1){
            if((this.y%TILE_SIZE) + deltaY < 0){
                checkY = true;
                this.y = this.y - Math.abs(this.y%TILE_SIZE);
                deltaY = deltaY + this.y%TILE_SIZE;
            }
        }
        // Determine size of border crossed, in tiles
            // If the object is centered in a turf and is less than or equal to game.TILE_SIZE, this number will be 1
            // If the object is 3x game.TILE_SIZE, then this number could be as much as 4.
        var sideHeight = Math.ceil(((this.y%TILE_SIZE)+this.height)/TILE_SIZE);
        var centerX;
        var destination;
        var destination2;
        var I;
        if(checkX){
            centerX = this.x + this.width/2;
            var currentBase = game.level.tileAt(centerX, this.y);
            if(poleX == 1){
                for(I = 0; I < sideHeight; I++){
                    destination = game.level.tileAt(((this.x+this.width)-1)+deltaX, this.y+(I*TILE_SIZE));
                    if(currentBase && currentBase.slope && I == 0){
                        // MAGIC NUMBERS!
                    } else if(!destination || destination.dense){
                        deltaX = 0;
                        //this.handle_event(this, {type: DM.EVENT_STOP, direction: DM.EAST});
                        this.stopHorizontal();
                        this.x += (TILE_SIZE - (((this.x+this.width)-1)%TILE_SIZE)) -1;
                        break;
                    }
                }
            }
            else if(poleX == -1){
                for(I = 0; I < sideHeight; I++){
                    destination = game.level.tileAt(this.x+deltaX, this.y+(I*TILE_SIZE));
                    if(currentBase && currentBase.slope && I == 0){
                        // MAGIC NUMBERS!
                    } else if(!destination || destination.dense){
                        deltaX = 0;
                        //this.handle_event(this, {type: DM.EVENT_STOP, direction: DM.WEST});
                        this.stopHorizontal();
                        this.x = this.x - this.x%TILE_SIZE;
                        break;
                    }
                }
            }
        }
        this.x += deltaX;
        var baseWidth  = Math.ceil(((this.x%TILE_SIZE)+this.width )/TILE_SIZE);
        if(poleY == -1){
            destination = game.level.tileAt(this.x+this.width/2, this.y+deltaY);
            destination2 = game.level.tileAt(this.x+this.width/2, this.y);
            if(destination && destination.slope){
                centerX = ((this.x + this.width/2)%TILE_SIZE)/TILE_SIZE;
                var left  = destination.slope.left ;
                var right = destination.slope.right;
                var baseElevation = (right-left)*centerX+left; // y = mx+b
                baseElevation *= TILE_SIZE;
                baseElevation += 1;
                baseElevation += Math.floor((this.y+deltaY)/TILE_SIZE)*TILE_SIZE;
                this.y = Math.max((this.y+deltaY), baseElevation);
                deltaY = 0;
                checkY = false;
                this.velY = 0;
                landed = true;
            } else if(destination && destination2.slope){
                centerX = ((this.x + this.width/2)%TILE_SIZE)/TILE_SIZE;
                var left  = destination2.slope.left ;
                var right = destination2.slope.right;
                var baseElevation = (right-left)*centerX+left; // y = mx+b
                baseElevation *= TILE_SIZE;
                baseElevation += 1;
                baseElevation += Math.floor((this.y)/TILE_SIZE)*TILE_SIZE;
                this.y = Math.max((this.y+deltaY), baseElevation);
                deltaY = 0;
                checkY = false;
                this.velY = 0;
                landed = true;
            } else if(destination && destination.dense){
                var destinationElevation = baseY + TILE_SIZE;
                if(Math.abs(destinationElevation - this.y) < TILE_SIZE/4){
                    // MAGIC NUMBERS!
                    this.y = destinationElevation;
                    deltaY = 0;
                    checkY = false;
                    this.velY = 0;
                    landed = true;
                }
            }
        }
        if(checkY){
            if(poleY == 1){
                for(I = 0; I < baseWidth; I++){
                    destination = game.level.tileAt(this.x+(I*TILE_SIZE), ((this.y+this.height)-1)+deltaY);
                    if(!destination || destination.dense){
                        deltaY = 0;
                        //this.handle_event(this, {type: DM.EVENT_STOP, direction: DM.SOUTH});
                        this.y += (TILE_SIZE - (((this.y+this.height)-1)%TILE_SIZE)) -1;
                        this.velY = 0;
                        break;
                    }
                }
            }
            else if(poleY == -1){
                for(I = 0; I < baseWidth; I++){
                    destination = game.level.tileAt(this.x+(I*TILE_SIZE), this.y+deltaY);
                    if(destination && destination.dense){
                        deltaY = 0;
                        this.velY = 0;
                        //this.handle_event(this, {type: DM.EVENT_STOP, direction: DM.NORTH});
                        this.y = this.y - this.y%TILE_SIZE;
                        landed = true;
                        break;
                    }
                }
            }
        }
        this.y += deltaY;
        this.y = Math.floor(this.y);
        this.x = Math.floor(this.x);
        if(landed){ this.land(blockStand);}
        if(this.y+this.height < 0){ this.dispose();}
    },
    center: function (centerMover){
        this.x = centerMover.x+(centerMover.width -this.width )/2;
        this.y = centerMover.y+(centerMover.height-this.height)/2;
    }
};
var item = Object.extend(mover, {
    disposable: true,
    faction: FACTION_PLAYER,
    _new: function (){
        this.timeStamp = game.level.time;
        return mover._new.apply(this, arguments);
    },
    takeTurn: function (){
        if(this.collisionCheck(game.hero)){
            this.collide(game.hero);
        }
        if(game.level.scrollVelocity){
            this.translate(game.level.scrollVelocity, 0);
        }
        return mover.takeTurn.apply(this, arguments);
    },
    collide: function (collider){
        if(collider != game.hero){ return;}
        this.effect(collider);
        if(this.disposable){
            this.dispose();
        }
    },
    effect: function (){}
});
var checkPoint = Object.extend(item, {
    graphic: 'checkPoint',
    height: 48,
    width: 16,
    activated: false,
    disposable: false,
    _new: function (){
        setTimeout(function (){ // x is set after _new has returned.
            if(game.level.checkPoint && game.level.checkPoint.x > this.x){
                console.log(game.level.checkPoint.x, this.x)
                this.graphicState = 'passed',
                this.activated = true;
            }
        }.bind(this));
        return item._new.apply(this, arguments);
    },
    effect: function (){
        if(this.activated){ return;}
        game.level.checkPoint = {x: this.x, y: this.y};
        this.graphicState = 'passed';
        this.activated = true;
    }
})
var coin = Object.extend(item, {
    width: 13,
    height: 13,
    graphic: 'coin',
    reactivating: false,
    effect: function (collider){
        game.level.coins++;
        var sparkles = Object.instantiate(this.sparkle);
        sparkles.center(this);
        game.playEffect('coinGet');
    },
    sparkle: Object.extend(mover, {
        gravity: 0,
        width: 32,
        height: 32,
        graphic: 'sparkles',
        _new: function (){
            this.timeStamp = game.level.time;
            return mover._new.apply(this, arguments);
        },
        takeTurn: function (){
            if(game.level.time - this.timeStamp > 8){
                this.dispose();
            }
            return mover.takeTurn.apply(this, arguments);
        }
    })
});
var coinSpill = Object.extend(coin, {
    gravity: 1/2,
    takeTurn: function (){
        var lifeTime = game.level.time - this.timeStamp;
        if(lifeTime > 16){
            if(this.velX){
                if(Math.abs(this.velX) < 1/5){ this.velX = 0;}
                else{ this.velX -= (this.velX/Math.abs(this.velX))/4;}
            }
            for(var moverI = 0; moverI < game.level.movers.length; moverI++){
                var theMover = game.level.movers[moverI];
                if(theMover.coinCollecting && this.collisionCheck(theMover)){
                    var sparkles = Object.instantiate(this.sparkle);
                    sparkles.center(this);
                    this.dispose();
                    return null;
                }
            }
        }
        if(lifeTime > TIME_COIN_SPILL){
            this.dispose();
            return null;
        }
        return coin.takeTurn.apply(this, arguments);
    },
    collide: function (collider){
        if(game.level.time - this.timeStamp < 16){ return undefined} // MAGIC NUMBER!
        return coin.collide.apply(this, arguments);
    }
});
var block = Object.extend(mover, {
    dense: true,
    color: 'white',
    blockStanding: true,
    gravity: 1,
    dispose: function (){
        if(this.activationId){
            game.level.activateGrid[this.activationId] = false;
        }
        return mover.dispose.apply(this, arguments);
    },
    invert: function (){
        game.level.cancelMover(this);
        var inversion = Object.instantiate(blockInverted, this);
        return inversion;
    },
    alternateTranslate: function (deltaX, deltaY){
        this.x += deltaX;
        this.y += deltaY;
        if(this.y < 0){
            this.dispose();
        }
    },
    landEffect: function (){}
});
var blockInverted = Object.extend(mover, {
    color: 'orange',
    blockStanding: false,
    faction: FACTION_PLAYER,
    inverted: true,
    throwReady: false,
    _new: function (model){
        var result = mover._new.apply(this, arguments);
        this.model = model;
        this.graphic = model.graphic;
        this.graphicState = model.graphicState;
        this.width = model.width;
        this.height = model.height;
        this.x = model.x;
        this.y = model.y;
        this.direction = model.direction;
        this.blockStanding = model.blockStanding;
        return result;
    },
    dispose: function (){
        if(this.model){
            this.model.dispose();
        }
        return mover.dispose.apply(this, arguments);
    },
    stopHorizontal: function (){
        this.velX = 0;
    },
    land: function (landingBlock){
        if(landingBlock && landingBlock.die){
            this.collide(landingBlock);
            return;
        }
        game.playEffect('land');
        this.model.velY = 4;
        this.model.center(this);
        this.model.direction = this.direction;
        game.level.registerMover(this.model);
        game.level.cancelMover(this);
        this.model = null;
        this.dispose();
    },
    takeTurn: function (){
        if(!game.hero.order(PRIMARY)){ this.throwReady = true;}
        var moversCopy = game.level.movers.slice();
        for(var I = 0; I < moversCopy.length; I++){
            var indexedMover = moversCopy[I];
            if(!(indexedMover.faction&this.faction) && this.collisionCheck(indexedMover)){
                this.collide(indexedMover);
            }
        }
        return mover.takeTurn.apply(this, arguments);
    },
    collide: function (collider){
        if(game.hero.block === this){ return;} // Not potent while being held.
        if(collider.die && !(this.faction&collider.faction) && !collider.hurting){
            var direction = (this.velX > 0)? 1 : 0;
            if(collider.hurt){
                collider.hurt(this);
            } else{
                collider.die(direction);
            }
            if(this.model.die){
                this.velX /= 2;
                this.velY = 3;
                this.gravity = 0.5;
                this.translate = this.deathMovement;
            }
        }
    },
    deathMovement: function (deltaX, deltaY){
        this.x += deltaX;
        this.y += deltaY;
        if(this.y+this.height < 0){ this.dispose()}
    }
});
var enemy = Object.extend(block, {
    graphic: 'suit',
    faction: FACTION_ENEMY,
    speed: 1,
    blockStanding: false,
    coinCollecting: true,
    inversionDeath: false,
    takeTurn: function (){
        this.behavior();
        if(this.collisionCheck(game.hero)){
            this.collide(game.hero);
        }
        return mover.takeTurn.apply(this, arguments);
    },
    behavior: function (){
        var vector = (this.direction === LEFT)? -1 : 1;
        this.velX = vector * this.speed;
        if(this.x            > game.camera.borderRight()+TILE_SIZE*2){ this.dispose();}
        if(this.x+this.width < game.camera.borderLeft( )-TILE_SIZE*2){ this.dispose();}
    },
    collide: function (collider){
        if(collider === game.hero){
            var deltaY = (this.y+this.height) - collider.y; // Always Positive
            var travelY = -collider.velY; // Negative if falling
            if(deltaY <= travelY || deltaY < 3){
                collider.land(this);
                collider.y = this.y+this.height;
                collider.velY = Math.max(collider.velY, collider.gravity);
                return;
            }
            collider.hurt(this, true);
        }
    },
    stopHorizontal: function (){
        this.direction = (this.direction === RIGHT)? LEFT : RIGHT;
        this.velX = 0;
    },
    die: function (direction){
        //direction = direction || this.direction;
        var inversion = this.invert();
        inversion.translate = inversion.deathMovement;
        inversion.velX = direction*2;
        inversion.velY = 1;
        inversion.gravity = 0.5;
    }
});
var suit = Object.extend(enemy, {
    _new: function (){
        this.graphicState = pick('suit1', 'suit2');
        return block._new.apply(this, arguments);
    },
    landEffect: function (lander){
        if(lander.currentSequence && lander.currentSequence.name === 'fall'){
            game.playEffect('squeak');
        }
        return enemy.landEffect.apply(this, arguments);
    },
    die: function (){
        game.playEffect('help');
        return enemy.die.apply(this, arguments);
    }
});
var post = Object.extend(enemy, {
    // Bug:  Postmen don't disappear when off screen
    graphic: 'post',
    graphicState: null,
    gravity: 1/2,
    jumpTime: 32,
    behavior: function (){
        if(!this.jumping){
            if(game.hero.x+game.hero.width/2 > this.x+this.width/2){ this.direction = RIGHT;}
            else{ this.direction = LEFT;}
        }
        if(!this.jumpTime){
            this.jumpTime = 64;
            this.velY = 7;
            this.graphicState = 'jump';
            if(Math.abs(game.hero.y - (this.y+this.height)) < 5){
                if(Math.abs(this.x+this.width /2 - (game.hero.x+game.hero.width /2)) <= (this.width +game.hero.width )/2){
                    game.hero.velY = this.velY;
                }
            }else{
                Math.abs(game.hero.y - (this.y+this.height/2))
            }
        } else{
            this.velY -= this.gravity;
            this.jumpTime--
        }
        if(this.graphicState === 'jump' && this.velY < 1){
            var bill = Object.instantiate(this.bill);
            bill.center(this);
            bill.direction = this.direction;
            this.graphicState = 'throw';
        }
    },
    land: function (){
        this.graphicState = null;
        return enemy.land.apply(this, arguments);
    },
    bill: Object.extend(enemy, {
        gravity: 0,
        speed: 3,
        height: 12,
        graphic: 'post',
        graphicState: 'bill',
        inversionDeath: true,
        stopHorizontal: function (){
            this.graphicState = 'billOverdue'
            return enemy.stopHorizontal.apply(this, arguments);
        },
        land: function (){
            this.die();
        },
        invert: function (){
            var inversion = enemy.invert.apply(this, arguments);
            inversion.translate = block.alternateTranslate;
            return inversion;
        }
    })
});
var mushy = Object.extend(block, {
    name: 'mushy',
    graphic: 'blocks',
    graphicState: 'mushroom',
    land: function (baseBlock){
        if(!(baseBlock && baseBlock.name === 'mushy')){ return;}
        game.playEffect('grow');
        var newBlock = Object.instantiate(bouncer);
        newBlock.center(baseBlock);
        newBlock.y = this.y;
        baseBlock.dispose();
        this.dispose();
    }
});
var bouncer = Object.extend(block, {
    color: 'magenta',
    graphic: 'mushrooms',
    graphicState: 'bouncer',
    height: 32,
    landEffect: function (lander){
        //lander.velY = 30*lander.gravity;
        game.playEffect('bounce');
        this.graphicState = 'bouncerCompress'
        this.dense = false;
        this.height = 30;
        this.compressTime = 8;
        lander.sequence('bounce');
        return true;
    },
    takeTurn: function (){
        if(this.compressTime--){
            switch(this.compressTime){
                case 4:
                    this.height = 32;
                    game.hero.velY = 30*game.hero.gravity;
                    break;
                case 3: case 2:
                    this.graphicState = 'bouncerExtend';
                    break;
                case 1:
                    this.dense = true;
                    this.graphicState = 'bouncer';
                    break;
            }
        }
        return block.takeTurn.apply(this, arguments);
    }
});
game.animate = (function (){
    var animation = Object.extend(mover, {
        _new: function (options){
            this.graphic = options.graphic;
            this.graphicState = options.graphicState || 'default';
            // Determine number of frames
            var graphic = client.resource('graphic', this.graphic);
            if(!graphic){ return null;}
            if(this.graphicState && graphic.states && graphic.states[this.graphicState]){
                graphic = graphic.states[this.graphicState];
            }
            this.frames = graphic.frames || 1;
            this.frameRate = graphic.frameRate || 2;
            this.width = graphic.width || 16;
            this.height = graphic.height || 16;
            this.time = 0;
            return mover._new.apply(this, arguments);
        },
        takeTurn: function (){
            this.frame = Math.floor(this.time/this.frameRate);
            if(this.frame >= this.frames){ this.dispose(); return;}
            this.time++;
        }
    });
    return function (graphic, options){
        if(!options){ options = {};}
        options.graphic = graphic;
        var newAnimation = Object.instantiate(animation, options);
        return newAnimation;
    }
})();