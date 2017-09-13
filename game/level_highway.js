'use strict'

var motorcycle = Object.extend(item, {
    width: 42,
    height: 22,
    graphic: 'motorcycle',
    effect: function (collider){
        var newBride = Object.instantiate(scrollCycle)//heros['theBride']);
        newBride.center(this);
        newBride.imprint(collider, this.activationId);
        this.activationId = null;
    },
    collide: function (collider){
        if(this.graphicState !== 'running' || game.level.time - this.timeStamp > TIME_COIN_SPILL/2){
            return item.collide.apply(this, arguments);
        }
        return null;
    },
    lightning: Object.extend(mover, {
        graphic: 'lightning',
        faction: 0,
        graphicState: '5',
        width: 32,
        lifetime: 10,
        _new: function (){
            game.playEffect('lightning');
            return mover._new.apply(this, arguments);
        },
        takeTurn: function (){
            game.level.backgroundScrollSpeed = 3;
            this.graphicState = Math.ceil(--this.lifetime/2);
            if(this.lifetime === 5){
                this.bride = Object.instantiate(motorcycle);
                this.bride.faction = 0;
                this.bride.center(this);
                this.bride.y = this.y;
                this.bride.hurting = 8;
                this.bride.graphicState = 'running';
            } else if(this.lifetime <= 0){
                this.bride.hurting = 0;
                this.bride = null;
                this.dispose();
                setTimeout(function (){
                    game.playEffect('idle');
                }, 1000);
            }
        }
    })
});
var scrollCycle = Object.extend(heros['theBride'], {
    gravity: 0.83,
    readyTime: 0,
    _new: function (){
        game.level.scrollVelocity = 4;
        game.playEffect('drive');
        client.audio.playTestSong('motorcycle');
        return heros['theBride']._new.apply(this, arguments);
    },
    takeTurn: function (){
        // Controls
        var directionX = 0;
        var controllable = (game.hero && !game.hero.dead)
        if(controllable){
            if(game.hero.order(RIGHT)){ directionX =  1;}
            if(game.hero.order(LEFT )){ directionX = -1;}
        }
        if(controllable){
            this.velX = game.level.scrollVelocity + directionX*4;
        } else{
            this.velX = 1;
        }
        if(controllable && this.rider && game.hero.order(PRIMARY)){
            this.shoot();
        } else if(!(game.time % 32)){
            this.readyTime--
        }
        if(controllable && !(this.velY) && game.hero.order(UP)){ this.velY += this.jumpSpeed;}
        this.velY -= this.gravity;
        this.translate(this.velX, this.velY);
        // Confine to visible area
        this.x = bound(game.camera.borderLeft(), this.x, game.camera.borderRight()-this.width);
        // Graphics
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
        // Position Rider
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
        //return result;
    },
    shoot: function (){
        if(!this.currentBolt && this.readyTime <= 0){
            this.readyTime = BOLT_DELAY;
            Object.instantiate(this.bolt, this);
        }
    },
    bolt: Object.extend(mover, {
        graphic: 'bolt',
        graphicState: '5',
        width: 256,
        height: 32,
        lifetime: 10,
        _new: function (aBride){
            game.playEffect('bolt');
            var result = mover._new.apply(this, arguments);
            this.bride = aBride;
            this.x = this.bride.x + this.bride.width - 14 + this.bride.velX;
            this.y = this.bride.y;
            var hurtLine = this.y+this.height/2;
            game.bolt = this;
            var moversCopy = game.level.movers.slice();
            for(var I = 0; I < moversCopy.length; I++){
                var indexedMover = moversCopy[I];
                if(this.collisionCheck(indexedMover) && indexedMover.shock){
                    indexedMover.shock();
                }
            }
        },
        takeTurn: function (){
            if(this.bride){
                this.x = this.bride.x + this.bride.width - 14/* + this.bride.velX*/;
            }
            this.graphicState = Math.ceil(--this.lifetime/2);
            if(this.lifetime <= 0){
                //this.bride.currentBolt = null;
                this.dispose();
            }
        }
    })
});
var tinyBike = Object.extend(enemy, {
    direction: RIGHT,
    graphic: 'tinyBike',
    width: 26,
    speed: 2,
    landEffect: function (lander){
        if(lander.currentSequence && lander.currentSequence.name === 'fall'){
            game.playEffect('squeak');
        }
        return enemy.landEffect.apply(this, arguments);
    },
    die: function (){
        game.playEffect('help');
        return enemy.die.apply(this, arguments);
    },
    shock: function (){
        game.playEffect('explosion');
        game.animate('explosion').center(this);
        for(var coinI = 0; coinI < 3; coinI++){
            var newCoin = Object.instantiate(coinSpill);
            newCoin.timeStamp = game.level.time - 10;
            newCoin.center(this);
            var theta = ((Math.PI*2)/5)*coinI - Math.PI/2;
            newCoin.velX = Math.cos(theta)*2;
            newCoin.velY = Math.sin(theta)*2;
        }
        this.dispose();
    }
});
var humvee = Object.extend(mover, {
    graphic: 'humvee',
    width: 96,
    height: 48,
    _new: function (){
        var result = mover._new.apply(this, arguments);
        game.level.boss = this;
        this.gunner = Object.instantiate(suit);
        this.gunner.graphic = 'suit';
        this.gunner.graphicState = 'suit1';
        this.gunner.takeTurn = this.takeTurnGunner;
        this.bomber = Object.instantiate(suit);
        this.bomber.graphic = 'suit';
        this.bomber.graphicState = 'suit2';
        this.bomber.takeTurn = this.takeTurnBomber;
        this.turret = Object.instantiate(this.part);
        this.turret.width = 28;
        this.turret.height = 16;
        this.turret.graphicState = 'turretCenter';
        this.turret.position = 0;
        this.hatch = Object.instantiate(this.part);
        this.hatch.width = 28;
        this.hatch.height = 16;
        this.hatch.hp /= 2;
        this.hatch.graphicState = 'hatchClosed';
        this.hatch.position = 'closed';
        this.body = Object.instantiate(this.part);
        this.body.width = this.width;
        this.body.height = this.height;
        this.body.hp = 6;
        this.graphic = null;
        this.color = null;
        return result;
    },
    takeTurnGunner: function (){
        // To be called in the context of the gunner, a suit enemy.
        if(!game.level.boss.turret){
            this.takeTurn = suit.takeTurn;
            this.takeTurn();
            this.direction = RIGHT;
            //this.invert();
            return;
        }
        this.x = game.level.boss.turret.x + 6;
        this.y = game.level.boss.turret.y + 6;
    },
    takeTurnBomber: function (){
        // To be called in the context of the gunner, a suit enemy.
        if(!game.level.boss.hatch){
            this.takeTurn = suit.takeTurn;
            this.takeTurn();
            this.direction = RIGHT;
            //this.invert();
            return;
        }
        this.x = game.level.boss.hatch.x + 30;
        this.y = game.level.boss.hatch.y - 6;
        if(game.level.boss.mode === 'bomb'){
            var time = 64-game.level.boss.timer;
            if(time < 18){
                this.x -= Math.min(time, 24);
            } else if(time === 18){
                this.x -= Math.min(time, 24);
                this.y += 2;
                game.level.boss.hatch.position = 'open';
                game.level.boss.hatch.graphicState = 'hatchOpen';
            } else if(time === 32){
                this.x -= 24;
                this.y += 4;
                game.level.boss.throwBomb();
            } else if(time < 40){
                this.x -= 24;
                this.y += 4;
            } else if(time < 46){
                this.x -= Math.min(game.level.boss.timer, 24);
                this.y += 4;
            } else if(time === 46){
                this.x -= Math.min(game.level.boss.timer, 24);
                game.level.boss.hatch.position = 'closed';
                game.level.boss.hatch.graphicState = 'hatchClosed';
            } else{
                this.x -= Math.min(game.level.boss.timer, 24);
            }
        }
    },
    takeTurn: function (){
        switch (this.mode){
            case 'panic':
                if(!this.body){
                    this.dispose();
                    setTimeout(function (){
                        game.characterChoice = 'Edna';
                        game.winLevel();
                    }, 2000)
                } else if(!(this.timer-- %12)){
                    var bomb = Object.instantiate(this.bomb);
                    bomb.center(this);
                    bomb.y += this.height/2;
                    bomb.velX += randomInterval(-1,3);
                    bomb.velY += randomInterval(-3,2);
                }
                break;
            case 'bomb':
                if(this.timer-- <= 0){
                    this.timer = 16;
                    if(this.turret){ this.mode = 'fire';}
                    else {this.mode = null;}
                }
                break;
            case 'fire':
                this.velX = game.level.scrollVelocity;
                if(!this.turret){
                    this.mode = 'coast';
                    break;
                }
                if(this.timer-- <= 0){
                    this.timer = 32;
                    this.mode = null;
                    this.turret.position = pick(-1,0,1);
                    if(     this.turret.position ===  0){ this.turret.graphicState = 'turretCenter';}
                    else if(this.turret.position === -1){ this.turret.graphicState = 'turretDown'  ;}
                    else if(this.turret.position ===  1){ this.turret.graphicState = 'turretUp'    ;}
                } else if(!(this.timer%4)){
                    this.shoot();
                }
                break;
            case 'coast':
                this.velX = game.level.scrollVelocity;
                if(this.timer-- <= 0){
                    var options = [];
                    if(this.turret){
                        options = ['fire', 'fire'];
                    }
                    if(this.hatch){
                        options.push('bomb');
                    }
                    var option = arrayPick(options);
                    if(option === 'fire'){
                        this.mode = 'fire';
                        this.timer = 16;
                    } else if(option === 'bomb'){
                        if(this.turret && this.turret.position === -1){
                            this.turret.position = 0;
                            this.turret.graphicState = 'turretCenter';
                        }
                        this.mode = 'bomb';
                        this.timer = 64;
                    } else{
                        this.mode = 'panic';
                    }
                }
                break;
            default:
                this.velX = game.level.scrollVelocity-1;
                if(this.x - game.camera.x <= 150){
                    if(!this.dialogued){
                        game.level.dialogue = {
                            text: ["You'll never defeat me", "in my big boy truck!"],
                            portrait: 'may',
                            align: RIGHT
                        };
                        setTimeout(function (){ game.level.dialogue = null;}, 3000);
                    }
                    this.dialogued = true;
                    this.mode = 'coast';
                    this.timer = 32;
                }
        }
        this.translate(this.velX, this.velY);
        // Reposition parts
        if(this.turret){
            this.turret.x = this.x + 26;
            this.turret.y = this.y + this.height;
            if(this.turret.hurting){ this.turret.x += this.turret.hurting-- %2;}
        }
        if(this.hatch){
            this.hatch.x = this.x;
            this.hatch.y = this.y + 31;
            if(this.hatch.hurting){ this.hatch.x += this.hatch.hurting-- %2;}
        }
        if(this.body){
            if(this.body.collisionCheck(game.hero)){
                game.hero.hurt();
            }
            this.body.x = this.x;
            this.body.y = this.y;
            if(this.body.hurting){ this.body.x += this.body.hurting-- %2;}
        }
    },
    shoot: function (){
        if(this.turret.position <= 0){
            Object.instantiate(this.bullet);
            game.playEffect('shoot');
            this.translate(2,0);
        } else{
            game.playEffect('shoot');
            this.shootMissile();
            this.timer = 0;
        }
    },
    shootMissile: function (){
        var bomb = Object.instantiate(this.bomb);
        bomb.center(game.level.boss.turret);
        bomb.x -= 22;
        bomb.y += 18;
        bomb.velX -= 3;
    },
    throwBomb: function (){
        this.translate(1,0);
        var s = Object.instantiate(tinyBike);
        s.center(this.bomber);
        s.direction = RIGHT;
        s.velY = 3;
        s.velX = game.level.scrollVelocity - 2;
        s.gravity = 1/2;
        s.faction = FACTION_ENEMY;
        game.playEffect('throw');
    },
    part: Object.extend(mover, {
        graphic: 'humvee',
        graphicState: 'body',
        dense: false,
        gravity: 0,
        hp: 2,
        dispose: function (){
            if(game.level.boss.body === this){
                game.level.boss.timer = 0;
                game.level.dialogue = null;
                game.level.boss.body = null;
            } else if(game.level.boss.hatch === this){
                game.level.boss.hatch = null;
                this.dispose();
            } else if(game.level.boss.turret === this){
                game.level.boss.turret = null;
            }
            game.level.boss.mode = 'coast';
            game.level.boss.timer = 0;
            return mover.dispose.apply(this, arguments);
        },
        shock: function (){
            if(this.hurting || this.dead){ return;}
            if(game.level.boss.body === this){
                if(game.level.boss.hatch || game.level.boss.turret){ return;}
            } else if(game.level.boss.hatch === this){
                if(this.position !== 'open'){ return;}
            }
            this.hurting = 8;
            if(--this.hp <= 0){
                this.dead = 5*10;
            }
        },
        takeTurn: function (){
            if(this.dead--){
                if(this === game.level.boss.body && !game.level.dialogue){
                    game.level.dialogue = {
                        text: ['Covfefe!!!'],
                        portrait: 'may',
                        align: RIGHT
                    };
                }
                if(!(this.dead%5)){
                    var explosion = game.animate('explosion');
                    explosion.center(this);
                    explosion.x += randomInterval(-this.width/2, this.width/2);
                    explosion.y += randomInterval(-this.height/2, this.height/2);
                    game.playEffect('explosion');
                }
                if(this.dead <= 0){
                    this.dispose();
                }
            }
            return mover.takeTurn.apply(this, arguments);
        }
    }),
    bullet: Object.extend(enemy, {
        graphic: 'humvee',
        graphicState: 'bulletCenter',
        dense: false,
        gravity: 0,
        width: 12,
        height: 8,
        _new: function (){
            var result = mover._new.apply(this, arguments);
            this.center(game.level.boss.turret);
            this.velX = game.level.scrollVelocity-5;
            switch(game.level.boss.turret.position){
                case 0:
                    this.x -= 20;
                    this.y += 7;
                    break;
                case 1:
                    this.x -= 22;
                    this.y += 18;
                    this.velY = 1;
                    this.graphicState = 'bulletUp';
                    break;
                case -1:
                    this.x -= 20;
                    this.y -= 6;
                    this.velY = -1;
                    this.graphicState = 'bulletDown';
                    break;
            }
            return result;
        },
        takeTurn: function (){
            if(this.x+this.width < game.camera.borderLeft || this.y+this.height < 0){
                this.dispose();
            }
            return enemy.takeTurn.apply(this, arguments);
        }
    }),
    bomb: Object.extend(enemy, {
        graphic: 'humvee',
        graphicState: 'bombUp',
        dense: false,
        width: 15,
        height: 15,
        gravity: 1/3,
        _new: function (){
            var result = mover._new.apply(this, arguments);
            this.center(game.level.boss.bomber);
            this.velX = game.level.scrollVelocity-1;
            this.velY = 3;
            return result;
        },
        takeTurn: function (){
            if(this.velY < 0){ this.graphicState = 'bombDown';}
            if(this.x+this.width < game.camera.borderLeft || this.y+this.height < 0){
                this.dispose();
                return null;
            }
            return enemy.takeTurn.apply(this, arguments);
        },
        land: function (){
            this.explode();
        },
        explode: function (){
            game.playEffect('explosion');
            game.animate('explosion').center(this);
            this.dispose();
        },
        shock: function (){
            for(var coinI = 0; coinI < 5; coinI++){
                var newCoin = Object.instantiate(coinSpill);
                newCoin.timeStamp = game.level.time - 10;
                newCoin.center(this);
                var theta = ((Math.PI*2)/5)*coinI - Math.PI/2;
                newCoin.velX = Math.cos(theta)*2;
                newCoin.velY = Math.sin(theta)*2;
                if(game.level.boss && newCoin.x > game.level.boss.x){
                    newCoin.dispose();
                }
            }
            this.explode();
        }
    })
});
levels['level2'] = Object.extend(level, {
    id: 'level2',
    nextLevel: 'end',
    name: 'Arizona',
    width: 192,
    height: 36,
    skyColor: '#59f',
    background1: 'level2#1',
    background2: 'level2#2',
    startX: 6*TILE_SIZE,
    startY: 14*TILE_SIZE,
    //infinite: true,
    tileString:
        '                                                 ^^^^^^^^^^^^^^^^^^^^^                                                                                                                          '+
        '                                                   ^^^^^^^^^^^^                                                                                                                                 '+
        '                                                    ^^^^^^^^^^^^^^^^                                                                                                                            '+
        '                                                     ^^^^^^^^^^^^^^^^^                                                                                                                          '+
        '                                                      ^^^^^^^^^^^^^^^^^^^                                                                                                                       '+
        '                        $$$                             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^                                                                                                  '+
        '            $$$                     $$$                ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^                                                                                                       '+
        '                                                       ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^                                                                                                           '+
        '                         >                              ^^^^^^^^^^^^^^^^^^^^^^^^^                                                                                                               '+
        '       ^^^^^^^^^      ^^^^^^^                            ^^^^^^^^^^^^^^^^^^^^^^                                                                                                                 '+
        '      ^^^^^^^^^^x       $$$       ;!^^^^^^^^^^^            ^^^^^^^^^^^^^^^^^^                                                                                                                   '+
        '       ^^^^^^^^^^^                 ^^^^^^^^^^^^^^^^         ^^^^^^^^^^^^^^^                                                                                                                     '+
        '          ^^^^^^^^^^x             ^^^^^^^^^^^^^^^          ^^^^^^^^^^^^^                                                                                                                        '+
        '$$$$     ^^^^^^^^^^^^^^^^^         ^^^^^^^^^^^           ^^^^^^^^^^^^^^                                                                                                                         '+
        '^^^^^^^      ^^       ^^^^^^        ^^^^^^^^^               ^^^^^^^^^^                                                                                                                          '+
        '                       $$$$        ^^^^^^^^^                   ^^^^^^                                                                                                                           '+
        '                               ^^^^^^^^^^^^^^^^^^^^^          ^^^^^^                                                                                                                            '+
        '                             x^^^^^^^^^^^^^^^^^             ^^^^^^^                                                                                                                             '+
        '                         ;!^^^^^^^^^^^^^^^^^^^^           ^^^^^^                                                                                                                                '+
        '                     ;!^^^^^^^^^^^^^^^^^^^^^^^             ^^^                                                                                                                                  '+
        '                ;!^^^^^^^^^^^^^^^^^^^^^^^^^^^^       ^^^^^^^^^^                                                                                                                                 '+
        '               ^^^^^^^^^^^^^^^^^^^^^^^^^^^^          ^^^^^^^^                                                                                                                                   '+
        '    ;!^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^      $     ^^^^^^                                                                                                                                   '+
        '^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^        $                                                                                                                                              '+
        '^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^         $                                                                                                                                              '+
        '^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^           $                                                                                                                                              '+
        '^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^               $                                                                                                                                              '+
        '^^^^^^^^^^^^^^^^^^^^^^^^^^^^^    ##              $                                                                                                                                              '+
        '^^^^^^^^^^^^^^^^^^^^^            ##                                                                                                                                                             '+
        '                                 ##             $$$                                                                                                                                             '+
        '                                 ##                                                                                                                                                             '+
        '                                 ##                                                                                                                                                             '+
        '                                 ##                                                                                                                                                             '+
        '                                 ##                                                                                                                                                             '+
        '                                 ##                                         L                     h          h           h             H                                                        '+
        '=================================##=============================================================================================================================================================',
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
    }
});
level.tileTypes['L'] = Object.extend(tile, { dense: false, activate: function (posX, posY, activationId){
    var anItem = Object.instantiate(motorcycle.lightning);
    client.audio.playTestSong('stop');
    game.level.infinite = true;
    game.level.lockCamera();
    anItem.activationId = activationId;
    anItem.x = (posX-8) * TILE_SIZE;
    anItem.y = posY * TILE_SIZE
}});
level.tileTypes['h'] = Object.extend(tile, { dense: false, activate: function (posX, posY, activationId){
    var anItem = Object.instantiate(tinyBike);
    anItem.x = posX * TILE_SIZE;
    anItem.y = posY * TILE_SIZE
}});
level.tileTypes['H'] = Object.extend(tile, { dense: false, activate: function (posX, posY, activationId){
    var anItem = Object.instantiate(humvee);
    anItem.x = (posX+6) * TILE_SIZE;
    anItem.y = posY * TILE_SIZE
}});
