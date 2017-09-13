'use strict';

/*==============================================================================
    Constants
==============================================================================*/

    // Misc. Configuration:
var debug = false;
var VERSION = 'Public Beta';
var ANIMATION_FRAME_DELAY = 4;
var DONATE_LINK = 'https://www.youcaring.com/frankielomen-881707/update/705603?fb_action_ids=10100407892861274&fb_action_types=youcaringcom%3Apost';
//
var FONT_FAMILY = 'press_start_kregular';
var FONT_SIZE = 8;
//
var DISPLAY_WIDTH = 16*16;
var DISPLAY_HEIGHT = 16*9;
var CLIENT_SPEED = 1000/30;
var DEFAULT_DISPLAY_SCALE = 2;
//
var TILE_SIZE = 16;
var DEFAULT_LIVES = 3;
//
var SCREEN_TIME_LEVEL = 64;
var SCREEN_TIME_GAME_OVER = SCREEN_TIME_LEVEL;
var SCREEN_TIME_CHARACTER_SELECT = 32;
//
var FIRST_LEVEL = 'intro';
var TIME_DEATH = 96;
var TIME_HURT = 48;
var TIME_COIN_SPILL = 96
var BOLT_DELAY = 4;

    // Directions:
var UP        = 1;
var DOWN      = 2;
var RIGHT     = 4;
var LEFT      = 8;
var UPRIGHT   = 5;
var UPLEFT    = 9;
var DOWNRIGHT = 6;
var DOWNLEFT  = 10;
var NORTH     = 1;
var SOUTH     = 2;
var EAST      = 4;
var WEST      = 8;
var NORTHEAST = 5;
var NORTHWEST = 9;
var SOUTHEAST = 6;
var SOUTHWEST = 10;
var KEY_UP    = 256;
    // Action Commands:
var PRIMARY     = 64;
var SECONDARY   = 128;
var TERTIARY    = 256;
var QUATERNARY  = 512;
    // Factions:
var FACTION_PLAYER = 1;
var FACTION_ENEMY  = 2;
var FACTION_ENVIRONMENT = 4;


/*==============================================================================
    Default Object Extentions
==============================================================================*/

if(Object.instantiate){
    console.log('Cannot attach method "instantiate" to Object.');
} else{
    Object.instantiate = function (aPrototype){
        if(!aPrototype){ return null;}
        if(aPrototype._new){
            // Create arguments, minus prototype, to pass to _new.
            var cleanArguments = [];
            for(var argI = 1; argI < arguments.length; argI++){
                cleanArguments.push(arguments[argI]);
            }
            // Call _new, return new object.
            var newObject = Object.create(aPrototype);
            aPrototype._new.apply(
                newObject,
                cleanArguments
            );
            return newObject;
        }
        return Object.create(aPrototype);
    };
}
if(Object.extend){
    console.log('Cannot attach method "extend" to Object.');
} else{
    Object.extend = function (aPrototype, extention){
        var valueConfiguration = {};
        for(var key in extention){
            if(!extention.hasOwnProperty(key)){ continue;}
            var keyValue = extention[key];
            if(keyValue && keyValue.value){
                valueConfiguration[key] = keyValue;
                continue;
            }
            valueConfiguration[key] = {
                value: extention[key],
                configurable: true,
                enumerable: true,
                writable: true
            }
        }
        return Object.create(aPrototype, valueConfiguration);
    };
};

/*==============================================================================
    Useful functions.
==============================================================================*/


var tileCoord = function (fullCoord){
    return Math.floor(fullCoord/TILE_SIZE);
};
/*=== Common tasks when dealing with arrays. =================================*/

var pick = function (){
    return arrayPick(arguments);
};
var arrayPick = function (sourceArray){
    // Returns a randomly chosen element from the source array.
    var randomIndex = Math.floor(Math.random()*sourceArray.length);
    var randomElement = sourceArray[randomIndex];
    /*if(!randomElement){
        console.log("Problem: "+randomIndex+'/'+sourceArray.length);
    }*/
    return randomElement;
};
var arrayRemove = function (sourceArray, element){
    // Removes element from sourceArray, if present. Returns undefined.
    var elementIndex = sourceArray.indexOf(element);
    if(elementIndex != -1){
        sourceArray.splice(elementIndex, 1);
    }
};

/*=== Math. ==================================================================*/

var bound = function (value, min, max){
    return Math.min(max, Math.max(min, value));
};
var randomInterval = function (min, max){
    // Returns a randomly select integer between min and max, inclusive.
    if(!min){ min = 0;}
    if(!max){ max = min; min = 0;}
    var range = max-min;
    return min + Math.floor(Math.random()*(range+1));
};
var gaussRandom = function (mean, standardDeviation){
    /**
     *  Generates random integers with a gaussian (normal) distribution about
     *      the specified mean, with the specified standard deviation.
     *  Returns an integer.
     **/
    var leg1;
    var leg2;
    do{
        leg1 = Math.random();
        leg2 = Math.random();
    } while(!(leg1 && leg2));
    var normal = Math.cos(2*Math.PI*leg2) * Math.sqrt(-(2*Math.log(leg1)));
    var gaussian = mean + normal*standardDeviation;
    return Math.round(gaussian);
};
var distance = function (startX, startY, endX, endY){
    var deltaX = Math.abs(endX-startX);
    var deltaY = Math.abs(endY-startY);
    return Math.max(deltaX, deltaY);
};
var getStepCoords = function (startX, startY, direction){
    if(direction & NORTH){ startY++;}
    if(direction & SOUTH){ startY--;}
    if(direction & EAST ){ startX++;}
    if(direction & WEST ){ startX--;}
    return {x: startX, y: startY};
};
var directionTo = function (startX, startY, endX, endY){
    var deltaX = endX-startX;
    var deltaY = endY-startY;
    if(!deltaX && !deltaY){
        return 0;
    }
    var direction = 0;
    var angle = Math.atan2(deltaY, deltaX); // Reversed, don't know why.
    angle /= Math.PI;
    angle /= 2; // Convert to Tau.
    angle += 1/16;
    if(angle < 0){
        angle += 1;
    } else if(angle > 1){
        angle -= 1;
    }
    if     (angle >=   0 && angle < 1/8){ direction = EAST     ;}
    else if(angle >= 1/8 && angle < 2/8){ direction = NORTHEAST;}
    else if(angle >= 2/8 && angle < 3/8){ direction = NORTH    ;}
    else if(angle >= 3/8 && angle < 4/8){ direction = NORTHWEST;}
    else if(angle >= 4/8 && angle < 5/8){ direction = WEST     ;}
    else if(angle >= 5/8 && angle < 6/8){ direction = SOUTHWEST;}
    else if(angle >= 6/8 && angle < 7/8){ direction = SOUTH    ;}
    else if(angle >= 7/8 && angle < 8/8){ direction = SOUTHEAST;}
    return direction;
};
