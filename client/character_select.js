'use strict';


/*===========================================================================
 *
 *  !!!!!!!!!!!! Incorrect (copy/pasted) documentation) !!!!!!!!!!!!!!!!!!!!!
 *  TODO: Document.
 *  The gameplay driver is single point of contact between the game and
 *      the player once the game is running. It collects all input from the
 *      player, via keyboard, touch, and mouse, and displays the game state
 *      via a map and a menuing system.
 *  It is not a prototype, and should not be instanced.
 *      
  ===========================================================================*/

client.character_select = Object.extend(driver, {
    selected: false,
    setup: function (configuration){
        /**
            This function is called by client.setup as soon as the page loads.
            It configures the client to be able to display the menu.
            It does not return anything.
         **/
    },
    command: function (command, options){
        // TODO: Document.
        var block = driver.command.call(this, command, options);
        if(block){
            return block;
        }
        if(this.selected){ return block;}
        switch(command){
            case PRIMARY:
                this.selected = true;
                this.timeStamp = client.skin.graphicsTimer.time;
                break;
            case LEFT:
                this.cursorPosition = bound(this.cursorPosition-1, 0, this.characterNames.length-1);
                break;
            case RIGHT:
                this.cursorPosition = bound(this.cursorPosition+1, 0, this.characterNames.length-1);
                break;
        }
        return false;
    },
    focused: function (){
        this.timeStamp = client.skin.graphicsTimer.time;
        client.skin.touchScreen.clearButtons();
        var middle = DISPLAY_WIDTH/2;
        var baseline = 40;
        client.skin.touchScreen.addTouchArea(LEFT , middle-32, baseline, 16, 26);
        client.skin.touchScreen.addTouchArea(DOWN , middle- 8, baseline, 18, 32);
        client.skin.touchScreen.addTouchArea(RIGHT, middle+16, baseline, 28, 22);
    },
    blurred: function (){
        this.focus(null);
    },
    newGame: function (){
        // TODO: Document.
        /**
         *  This function spawns a new hero when the game begins. It directs
         *      the memory to blank out and prep for new data, places the hero,
         *      and sets the game in motion.
         *  It does not return anything.
         **/
        /*clearInterval(this.drawInterval);
        var gameDriver = client.drivers.gameplay;
        gameDriver.memory.blank();
        client.networking.sendMessage(COMMAND_NEWGAME, {});
        client.focus(gameDriver);*/
    },
    tick: function (){
        var lifespan = client.skin.graphicsTimer.time - this.timeStamp;
        if(lifespan < 16){ return;}
        if(this.selected && lifespan > SCREEN_TIME_CHARACTER_SELECT){
            var gameData = {
                characterName: this.characterNames[this.cursorPosition]
            };
            this.selected = null;
            this.cursorPosition = 0;
            client.gameplay.newGame(gameData);
        } else if(this.selected){
        } else if(client.skin.touchScreen.check(LEFT)){
            this.selected = true;
            this.timeStamp = client.skin.graphicsTimer.time;
            this.cursorPosition = 0;
        } else if(client.skin.touchScreen.check(DOWN)){
            this.selected = true;
            this.timeStamp = client.skin.graphicsTimer.time;
            this.cursorPosition = 1;
        } else if(client.skin.touchScreen.check(RIGHT)){
            this.selected = true;
            this.timeStamp = client.skin.graphicsTimer.time;
            this.cursorPosition = 2;
        }
    },
    cursorPosition: 0,
    characterNames: ['Frankie', 'Cap\'n', 'Edna'],
    display: function (options){
        // TODO: Document.
        var block = driver.display.apply(this, arguments);
        if(block){ return block;}
        var middle = DISPLAY_WIDTH/2;
        //client.skin.fillRect(0,0,DISPLAY_WIDTH, DISPLAY_HEIGHT, '#333');
        client.skin.drawGraphic('clientScreens', 'characterSelect', 0,0);
        var characterName = this.characterNames[this.cursorPosition];
        var heroTemplate = heros[characterName];
        client.skin.drawString(middle-characterName.length*4, DISPLAY_HEIGHT*3/4-16,characterName)
        var baseline = 40;
        client.skin.drawString(middle-18*4, baseline-20,'Select a Character')
        if(this.selected && this.cursorPosition === 0){
                client.skin.drawGraphic('frankie', 'characterSelect2', middle-32, baseline);
        } else{ client.skin.drawGraphic('frankie', 'characterSelect1', middle-32, baseline);}
        if(this.selected && this.cursorPosition === 1){
                client.skin.drawGraphic('capn', 'characterSelect2', middle- 8, baseline);
        } else{ client.skin.drawGraphic('capn', 'characterSelect1', middle- 8, baseline);}
        if(this.selected && this.cursorPosition === 2){
                client.skin.drawGraphic('edna', 'characterSelect2', middle+16, baseline);
        } else{ client.skin.drawGraphic('edna', 'characterSelect1', middle+16, baseline);}
        client.skin.drawGraphic('selectCursor', null, middle+(-2+this.cursorPosition)*24+16, baseline+32-5);
        client.skin.touchScreen.display();
        return false;
    }
});