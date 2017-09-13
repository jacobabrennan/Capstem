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

client.title = Object.extend(driver, {
    drivers: {},
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
        return false;
    },
    focused: function (){
        //this.display();
        //this.focus(client.drivers.gameplay.drivers.menu);
        client.skin.touchScreen.clearButtons();
        client.skin.touchScreen.addButton('start', PRIMARY, DISPLAY_WIDTH/2 - 32, 16, 64);
    },
    blurred: function (){
        this.startLag = undefined;
        this.focus(null);
    },
    tick: function (){
        if(client.keyCapture.check(PRIMARY) || client.skin.touchScreen.check(PRIMARY)){
            this.startLag = 4;
            //client.gameplay.newGame();
        }
        if(this.startLag !== undefined && this.startLag-- <= 0){
            client.focus(client.character_select);
        }
    },
    display: function (options){
        // TODO: Document.
        var block = driver.display.apply(this, arguments);
        if(block){ return block;}
        client.skin.context.fillStyle = 'rgba(0,0,0,0.25)'//'#000';
        client.skin.drawGraphic('clientScreens', 'start', 0, 0);
        var cI = Math.floor(client.skin.graphicsTimer.time/3)%3;
        client.skin.drawString(92,DISPLAY_HEIGHT-67,'Adventure', (['#f00','#0f0','#00f'])[cI], '#000');
        client.skin.touchScreen.display();
        return false;
    }
});