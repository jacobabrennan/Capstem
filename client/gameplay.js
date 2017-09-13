'use strict';

/*==============================================================================

    The gameplay driver is single point of contact between the game and the
    player once the game is running. It collects all input from the player, via
    keyboard, touch, and mouse, and displays the game state via a map and a
    menuing system.

    It is not a prototype, and should not be instanced.

==============================================================================*/

client.gameplay = Object.extend(driver, {
    setup: function (configuration){},
    focused: function (options){},
    newGame: function (gameData){
        game.start(gameData);
        client.focus(client.gameplay);
    },
    startLevel: function (){
        game.level.start();
        this.focus();
    },
    gameOver: function (deathData){
        this.focus(this.gameOverScreen);
    },
    handleClick: function (x, y, options){
        var block = driver.handleClick.apply(this, arguments);
        if(block){
            return block;
        }
        if(this.dead){
            return true;
        }
        return false;
    },
    /*command: {value: function (command, options){
        // TODO: Document.
        var block = driver.command.call(this, command, options);
        if(block){
            return block;
        }
        if(command == SECONDARY){
            var result = window.open(DONATE_LINK);
            if(!result){
                window.location = DONATE_LINK;
            }
        }
        return false;
    }},*/
    display: function (options){
        // TODO: Document.
        var block = driver.display.apply(this, arguments);
        if(block){ return block;}
        if(game.level.ended){ return block;}
        //client.skin.context.fillStyle = 'rgba(0,0,0,0.25)'//'#000';
        //client.skin.fillRectScroll(0,0,DISPLAY_WIDTH, DISPLAY_HEIGHT);
        // Draw Background
        client.skin.fillRect(0,0,DISPLAY_WIDTH, DISPLAY_HEIGHT, game.level.skyColor);
        var scrollPosX = DISPLAY_WIDTH - ((game.camera.borderLeft()/6)%DISPLAY_WIDTH);
        var scrollPosY = DISPLAY_HEIGHT - ((game.camera.borderDown()/6)%DISPLAY_HEIGHT);
        client.skin.drawGraphic('background', game.level.background2, scrollPosX, scrollPosY-DISPLAY_HEIGHT);
        client.skin.drawGraphic('background', game.level.background2, scrollPosX-DISPLAY_WIDTH, scrollPosY-DISPLAY_HEIGHT);
        scrollPosX = DISPLAY_WIDTH - ((game.camera.borderLeft()*game.level.backgroundScrollSpeed)%DISPLAY_WIDTH);
        scrollPosY = DISPLAY_HEIGHT - ((game.camera.borderDown()/3)%DISPLAY_HEIGHT);
        client.skin.drawGraphic('background', game.level.background1, scrollPosX, scrollPosY-DISPLAY_HEIGHT);
        client.skin.drawGraphic('background', game.level.background1, scrollPosX-DISPLAY_WIDTH, scrollPosY-DISPLAY_HEIGHT);
        // Draw Tiles
        var borderLeft  = Math.floor(game.camera.borderLeft() /TILE_SIZE);
        var borderRight = Math.ceil( game.camera.borderRight()/TILE_SIZE);
        var borderDown  = Math.floor(game.camera.borderDown() /TILE_SIZE);
        var borderUp    = Math.ceil( game.camera.borderUp()   /TILE_SIZE);
        for(var posX = borderLeft; posX < borderRight; posX++){
            for(var posY = borderDown; posY < borderUp; posY++){
                var tile = game.level.getTile(posX, posY);
                if(tile.color){
                    client.skin.fillRectScroll(
                        posX*TILE_SIZE, posY*TILE_SIZE, TILE_SIZE, TILE_SIZE, tile.color);
                }
                if(tile.graphic){
                    var graphicState = tile.graphicState || 'default';
                    var tileDirection = game.level.getAutoJoin(posX, posY);
                    client.skin.drawGraphicScroll(
                        tile.graphic, graphicState,
                        posX*TILE_SIZE, posY*TILE_SIZE,
                        {
                            direction: tileDirection
                        }
                    );
                }
            }
        }
        // Draw Camera Position
        // Draw Movers
        game.level.movers.forEach(function (theMover){
            var displayY = theMover.y;
            var options = {
                direction: theMover.direction,
                frame: theMover.frame
            };
            if(theMover.inverted){
                options.frameDelay = 2;
                options.effects = ['invert'];
            } else if(theMover.hurting){
                options.effects = ['flash'];
            }
            if(theMover.graphic){
                client.skin.drawGraphicScroll(theMover.graphic, theMover.graphicState, theMover.x, displayY, options);
            }
        }, this);
        // Temp HUD
        client.skin.drawString(0+1, client.skin.context.canvas.height-8-1, 'Debt$: '+game.debt, 'white', 'black');
        client.skin.drawString(DISPLAY_WIDTH-9*8, client.skin.context.canvas.height-8-1, 'Lives: '+game.lives, 'white', 'black');
        client.skin.drawString(0+1, client.skin.context.canvas.height-16-1, 'Coins: '+game.level.coins, 'white', 'black');
        if(game.level.dialogue){
            var textOffset = (game.level.dialogue.align === LEFT)? 48 : 0;
            var portraitOffset = (game.level.dialogue.align === LEFT)? 0 : DISPLAY_WIDTH-48;
            client.skin.drawGraphic('dialogueBox', null, textOffset, DISPLAY_HEIGHT-48);
            for(var lineIndex = 0; lineIndex < game.level.dialogue.text.length; lineIndex++){
                var indexedLine = game.level.dialogue.text[lineIndex];
                client.skin.drawString(textOffset+8, DISPLAY_HEIGHT-(16+lineIndex*16), indexedLine);
            }
            client.skin.drawGraphic('portraits', game.level.dialogue.portrait, portraitOffset, DISPLAY_HEIGHT-48);
        }
        // Phone Controller
        if(true){ // TODO: check for phone or keyboard
            client.skin.touchScreen.display();
        }
        return false;
    }
});
client.gameplay.levelClear = Object.extend(driver, {
    focused: function (options){
        this.timeStamp = client.skin.graphicsTimer.time;
        if(game.level.name === undefined){ //Intro level
            this.timeStamp = -1000;
        }
        game.level.paused = true;
        game.level.dialogue = null;
        client.audio.playTestSong('stop');
    },
    tick: function (){
        if(game.level.coins){
            var coinLapse = (game.level.coins > 5)? 2 : 8;
            if(!((client.skin.graphicsTimer.time - this.timeStamp)%coinLapse)){
                game.level.coins--;
                game.debt -= 10;
                game.playEffect('coinGet');
            }
        } else if(client.skin.graphicsTimer.time - this.timeStamp > SCREEN_TIME_LEVEL){
            if(game.level.ended){ return;}
            game.level.ended = true;
            var nextLevel = game.level.nextLevel;
            setTimeout(function (){
                game.newLevel(nextLevel);
            }, 1);
        }
    },
    display: function (){
        // TODO: Document.
        var block = driver.display.apply(this, arguments);
        if(block){ return block;}
        client.skin.drawString(
            client.skin.context.canvas.width/2 - (6/2)*TILE_SIZE,
            client.skin.context.canvas.height/2,
            "Stage Clear!"
        );
        return false;
    }
});
client.gameplay.levelPreview = Object.extend(driver, {
    focused: function (options){
        this.timeStamp = client.skin.graphicsTimer.time;
        client.audio.playSong(game.level.song);
        if(!game.level.name){
            client.gameplay.startLevel();
        } else if(game.level.name === levels.end.name){
            client.audio.playTestSong('stop');
        } else{
            client.audio.playTestSong('outside');
        }
    },
    tick: function (){
        if(client.skin.graphicsTimer.time - this.timeStamp > SCREEN_TIME_LEVEL){
            client.skin.touchScreen.showStandardButtons();
            client.gameplay.startLevel();
        }
    },
    display: function (){
        // TODO: Document.
        var block = driver.display.apply(this, arguments);
        if(block){ return block;}
        client.skin.fillRect(0,0,DISPLAY_WIDTH, DISPLAY_HEIGHT, game.level.skyColor);
        client.skin.drawGraphic('background', game.level.background2, 0, 0);
        client.skin.drawGraphic('background', game.level.background1, 0, 0);
        client.skin.drawString(
            client.skin.context.canvas.width/2 - 3*TILE_SIZE,
            client.skin.context.canvas.height/2 +4,
            "Entering"
        );
        client.skin.drawString(
            client.skin.context.canvas.width/2 - 1*TILE_SIZE,
            client.skin.context.canvas.height/2 -8,
            game.level.name
        );
        return true;
    }
});
client.gameplay.gameOverScreen = Object.extend(driver, {
    focused: function (options){
        this.timeStamp = client.skin.graphicsTimer.time;
        client.audio.playTestSong();
    },
    tick: function (){
        if(client.skin.graphicsTimer.time - this.timeStamp > SCREEN_TIME_GAME_OVER){
            client.focus(client.title);
        }
    },
    display: function (){
        // TODO: Document.
        var block = driver.display.apply(this, arguments);
        if(block){ return block;}
        client.skin.context.fillStyle = 'rgba(0,0,0,0.25)';
        client.skin.fillRect(0,0, DISPLAY_WIDTH, DISPLAY_HEIGHT);
        client.skin.drawString(
            client.skin.context.canvas.width/2 - 4.5*8,
            client.skin.context.canvas.height/2,
            'Game Over'
        );
        return true;
    }
});