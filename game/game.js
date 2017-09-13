'use strict';

var game = {
    lives: null,
    level: null,
    movers: [],
    hero: null,
    debt: null,
    camera: {
        y: 0,
        x: 0,
        targetX: 0,
        targetY: 0,
        lagMax: 10,
        reset: function (newX, newY){
            this.x = (newX !== undefined)? newX : 0;
            this.y = (newY !== undefined)? newY : 
            this.targetX = this.x;
            this.targetY = this.y;
        },
        focus: function (newX, newY){
            if(isNaN(this.x) || isNaN(this.y)){
                this.x = newX; this.y = newY;
                this.targetX = newX; this.targetY = newY;
            }
            if(newX !== undefined){
                this.targetX = newX;
            }
            var deltaX = this.targetX - this.x;
            if(deltaX >  this.lagMax){ deltaX = (this.targetX-this.x) - this.lagMax;}
            else if(deltaX < -this.lagMax){ deltaX = (this.targetX-this.x) + this.lagMax;}
            else { deltaX = Math.round(deltaX/10);}
            this.x += deltaX;
            if(newY !== undefined){
                this.targetY = newY;
            }
            var deltaY = this.targetY - this.y;
            if(deltaY){
                //deltaY = Math.floor(deltaY/10);
                this.y += deltaY;
            }
        },
        borderLeft: function (){
            return this.x;
        },
        borderRight: function (){
            return this.x + DISPLAY_WIDTH;
        },
        borderDown: function (){
            return this.y;
        },
        borderUp: function (){
            return this.y + DISPLAY_HEIGHT;
        }
    },
    iterate: function (){
        if(this.level){
            this.level.iterate();
        }
    },
    start: function (gameData){
        this.characterChoice = gameData.characterName;
        this.lives = DEFAULT_LIVES;
        this.debt = 50000;
        this.newLevel(FIRST_LEVEL);
    },
    newLevel: function (levelId, checkPoint){
        this.camera.reset();
        var levelModel = levels[levelId];
        this.level = Object.instantiate(levelModel);
        this.level.checkPoint = checkPoint;
        this.hero = Object.instantiate(heros[this.characterChoice]);
        client.gameplay.focus(client.gameplay.levelPreview);
    },
    die: function (){
        if(this.level.ended){ return;}
        var checkPoint = this.level.checkPoint;
        this.lives--;
        this.level.ended = true;
        if(this.lives >= 0){
            setTimeout(function (){
                game.newLevel(game.level.id, checkPoint);
            }, 1);
        } else{
            this.gameOver();
        }
    },
    gameOver: function (){
        client.gameplay.gameOver();
    },
    winLevel: function (){
        client.gameplay.focus(client.gameplay.levelClear);
    },
    // Audio Passthrough
    playEffect: function (effectId, options){
        client.audio.playEffect(effectId, options);
    },
    playSong: function (songId, options){
        client.audio.playSong(songId, options);
    },
};
