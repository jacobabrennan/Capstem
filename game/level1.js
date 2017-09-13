'use strict'

levels['level1'] = Object.extend(level, {
    id: 'level1',
    nextLevel: 'level2',
    name: '   Maine',
    width: 160,
    height: 24,
    skyColor: '#59f',
    background1: 'level1#1',
    background2: 'level1#2',
    startX: TILE_SIZE*2, //90*TILE_SIZE,//48,
    startY: 32,
    song: null,
    tileString:
        '                                                                                                                                                                '+
        '     %%%%                                           $$$$$$$                                                                                                     '+
        ' $$$ %%%%                                           $$$$$$$                                                                                                     '+
        '      %%%                                                         @@@@@       @@@@@@@@@@@@@@@@@                                                                 '+
        ' #|,   %   %                    $$$$$                 @@@@@         @@@   @@                                                                                    '+
        '  ##|,%%%./##                                       @@@@@                              @@@                                                                      '+
        '    #######               $$$   @@@@@                                                @@@@@@@                                                                    '+
        '                               @@@@@@@                                                                                                                          '+
        '    @@@@            $$$                                                       @@@@@  @@@@@@@@@                                                                  '+
        '     @@                                                                     @@@@@   @@@@  @@@                                                                   '+
        '                         @@@              @@@                                                   $$$$$$                                                          '+
        '                          @@@@             @@@                                      @@@@        $$$$$$                                                          '+
        '                                                                     $                                                $                                         '+
        '                @@@@@@@          @@@@@@                              $                                                $                                         '+
        '                                  @@@@@@                             $                   @@@@@@@@@@@                  $ >                                      C'+
        '                                                                     $#######|,           @@@                         $##|,                                     '+
        '                                    $$$$                             $#########|,                                     $####|,                                   '+
        '           $$$                                     %%% $$$           $###########|,                                   $######|,                                 '+
        '  %%             $$$                              %%%%               $#############|,                                 $########|,                               '+
        ' %%%                                              %%%                 ###############|,                                ##########|,                             '+
        ' %%%                            ##                 %               ./*#################|,     %%                       ############|,                           '+
        '  %  %   %% > ./#   X     %%%   ##********        %%% %x%%x     >./## ###################|,  %%%./#         %x         ##############|,                         '+
        '#################   ###########################  ##########    ######B#############################     #######****###*#########################################'+
        '###############################################  ##########    ####################################     ########################################################',
    stileString:
        '                                                                                                                                                                '+
        '     %%%%                                           $$$$$$$                   @@@@@@@                                                                           '+
        ' $$$ %%%%                                           $$$$$$$                  @@@@@@@@@@@@   @@@@@                                                               '+
        '      %%%                                                         @@@@@       @@@@@@@@@@@@@@@@@                                                                 '+
        ' #|,   %   %                    $$$$$                 @@@@@         @@@    @    @@@@  @@@                                                                       '+
        '  ##|,%%%./##                                       @@@@@                              @@@                                                                      '+
        '    #######               $$$   @@@@@                                                @@@@@@@                                                                    '+
        '                               @@@@@@@                                           @@@@@@@@@@@@@                                                                 W'+
        '    @@@@            $$$                                                       @@@@@@@@@@@@@@@@@@                                                                '+
        '     @@                                                                     @@@@@   @@@@  @@@                                                                   '+
        '                         @@@              @@@                                                                                                                   '+
        '                          @@@@             @@@                                 $$$   $$$                                                                        '+
        '                                  $                                  $                                                                                          '+
        '                @@@@@@@           $                                  $                                      C                                                   '+
        '                                  $ >                                $ >                 $                                                                      '+
        '                                  $##             @@@                $##     #     #      $                                                                     '+
        '                                  $##                                $##                  $                                                                     '+
        '           $$$                    $##                %%%%            $##                                                                                        '+
        '  %%             $$$              $##$ #             %%%%%           $##                                                                                        '+
        ' %%%                               ##$           %%%  %%%             ##  %%                                                                                    '+
        ' %%%                 xx        #./*##$           %%%   %              ## %%%%% %%     %% %     %%                                                               '+
        '  %  %   %% > ./#   #|,X  %%% ./## ##  x   %%    #%  x%%%x            ##%%%%%%%%%%   %%%%%%   %%%%          %                                                   '+
        '#################   ##############B############  ##########    #***##*##########################################################################################'+
        '###############################################  ##########    #################################################################################################'
});
level.tileTypes['C'] = Object.extend(tile, { dense: false, activate: function (posX, posY, activationId){
    var anItem = Object.instantiate(cloudRide);
    anItem.activationId = activationId;
    anItem.x = (posX-4) * TILE_SIZE;
    anItem.y = posY * TILE_SIZE;
    game.level.lockCamera();
}});
var cloudRide = Object.extend(mover, {
    faction: FACTION_ENEMY,
    width: 40,
    height: 16,
    graphic: 'sally',
    graphicState: 'cloud',
    gravity: 0,
    //
    timer: 0,
    baseLine: TILE_SIZE*5,
    mode: 'fall',
    //
    _new: function (){
        this.sally = Object.instantiate(this.modelSally);
        game.level.boss = this;
        return mover._new.apply(this, arguments);
    },
    dispose: function (){
        this.sally.dispose();
        this.sally = null;
        return mover.dispose.apply(this, arguments);
    },
    takeTurn: function (){
        switch(this.mode){
            case 'throw':
                if(this.timer++ === 8){
                    var suiter = Object.instantiate(suit);
                    suiter.direction = this.sally.direction;
                    suiter.center(this.sally);
                    suiter.y = this.sally.y-suiter.height;
                    this.sally.sequence('pickup');
                    suiter.y = this.sally.y+suiter.height;
                } else if(this.timer === 20){
                    this.sally.sequence('throw');
                } else if(this.timer >= 32){
                    this.timer = 0;
                    this.mode = 'swing';//pick('throw', 'throw', 'throw', 'swing');
                }
                break;
            case 'swing':
                var I = 0;
                if(this.timer++ < (I+=32)){
                    this.bob();
                } else if(this.timer < (I+=32)){
                } else if(this.timer < (I+=64)){
                    var dirPol = (this.direction === RIGHT)? -1 : 1;
                    var T = (this.timer-64);
                    var theta = (Math.PI)/64 * T;
                    var radius = (DISPLAY_WIDTH/2)-48;
                    var center = game.camera.borderLeft() + DISPLAY_WIDTH/2 + radius*Math.cos(theta)*dirPol;
                    this.y = this.baseLine - Math.sin(theta)*32;
                    this.x = center-this.width/2;
                } else if(this.timer < (I+=1)){
                    this.direction = (this.direction === RIGHT)? LEFT : RIGHT;
                } else{
                    this.timer = 32;
                    this.mode = null;
                }
                break;
            case 'fall':
                if(this.y > this.baseLine){
                    var radius = (DISPLAY_WIDTH/2)-48;
                    var center = game.camera.borderLeft() + DISPLAY_WIDTH/2 + radius;
                    this.x = center-this.width/2;
                    this.y--;
                } else{
                    this.mode = null;
                    this.timer = 0;
                }
                break;
            case 'death':
                if(!(this.timer++ %5) && this.timer < 64){
                    var explosion = game.animate('explosion');
                    explosion.center(this);
                    explosion.x += randomInterval(-this.width/2, this.width/2);
                    explosion.y += randomInterval(-this.height/2, this.height/2);
                    game.playEffect('explosion');
                }
                if(this.timer === 64){
                    this.y = 256; // get this out of sight, but don't dispose (don't unlock camera)
                    game.level.dialogue = {
                        align: RIGHT,
                        portrait: 'may',
                        text: ["Don't worry Sally,", "I'll show'em who's boss!"]
                    }
                }
                if(this.timer == 128){
                    game.level.dialogue = null;
                    this.dispose();
                    setTimeout(function (){
                        game.winLevel();
                    }, 100);
                    //me.winLevel();
                    return;
                }
                break;
            default:
                if(this.timer++ >= 64){
                    this.timer = 0;
                    this.mode = 'throw';
                }
                this.bob();
        }
        this.sally.direction = this.direction;
        this.sally.center(this);
        this.sally.y = this.y+this.height;
        if(this.hurting){
            this.hurting--;
        }
    },
    bob: function (){
        var T = 64;
        var theta = ((Math.PI*2)/T)*(this.timer%T);
        var offsetY = Math.sin(theta)*8;
        this.y = this.baseLine - offsetY;
    },
    modelSally: Object.extend(character, {
        direction: LEFT,
        graphic: 'sally',
        width: 16,
        height: 28,
        faction: FACTION_ENEMY,
        hp: 3,
        takeTurn: function (){
            if(this.collisionCheck(game.hero)){
                game.hero.hurt(this);
            }
            return character.takeTurn.apply(this, arguments);
        },
        hurt: function (attacker){ // Should be 'hurt', but too late to refactor on this time constraint.
            if(--this.hp <= 0 && game.level.boss.mode !== 'death'){
                game.level.boss.mode = 'death';
                game.level.boss.timer = 0;
                game.level.dialogue = {
                    align: RIGHT,
                    portrait: 'sally',
                    text: ['They got me, May!']
                };
            }
            this.hurting = 16;
            game.level.boss.hurting = 8;
        }
    })
});