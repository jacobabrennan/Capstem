'use strict'

levels['end'] = Object.extend(level, {
    id: 'end',
    name: 'Dog Park',
    width: 100,
    height: 25,
    skyColor: '#59f',
    background1: 'level1#1',
    background2: 'level1#2',
    startX: TILE_SIZE*4,
    startY: 32,
    song: null,
    tileString:
        '                                                                                                    '+
        '                                                                                                    '+
        '     %%%%                                                                                           '+
        ' $$$ %%%%                                                                                           '+
        '      %%%          @@@@                                                                             '+
        ' #|,   %   %                                                                                        '+
        '  ##|,%%%./##                                                                                       '+
        '    #######                                                                                         '+
        '                                                                                                    '+
        '                                                                                      @@@@@@@  @@@  '+
        '            @@@                                                                           @@@@@@@@@@'+
        ' @@@@@    @@@@                                                                                      '+
        '   @@@@                                                                                             '+
        '                                                                                                    '+
        '                                       %% %                                                         '+
        '                                      %%%%%%                                                        '+
        '                                      %%%%%%%                                                   ./##'+
        '                                       %%%%%                                                  ./####'+
        '                                        %%%        %%%                                      ./######'+
        '  %%                                     %        %%%%                                  **./########'+
        ' %%%                                    %%%       %%%                                ./#############'+
        ' %%%                            ./##########|,     %                               ./###############'+
        '  %F %   %% > ./#|,   * * %%% ./##############|,  %%% % %%    **B*  *            ./#################'+
        '####################################################################################################'+
        '####################################################################################################',
    iterate: function (){
        var result = level.iterate.apply(this, arguments);
        var I = 0;
        if(this.time === (I+=16)){
            this.ball = Object.instantiate(this.ballModel);
            this.ball.center(this.frankie);
        } else if(this.time === (I+=64)){
            this.dialogue = {
                text: ['Well, we still owe', '$'+game.debt],
                align: LEFT,
                portrait: 'frankie'
            };
        } else if(this.time === (I+=64)){
            this.dialogue = null;
        } else if(this.time === (I+=48)){
            this.dialogue = {
                text: ['We could beat more', 'coins outta them.'],
                align: LEFT,
                portrait: "capn"
            };
        } else if(this.time === (I+=64)){
            this.dialogue = null;
        } else if(this.time === (I+=48)){
            this.dialogue = {
                text: ['Nah,', 'but that was fun.'],
                align: LEFT,
                portrait: 'frankie'
            };
        } else if(this.time === (I+=64)){
            this.dialogue = null;
            client.skin.touchScreen.addButton('donate', SECONDARY, DISPLAY_WIDTH-96, DISPLAY_HEIGHT-32, 96);
        }
        return result;
    },
    frankieModel: Object.extend(character, {
        graphic: 'frankie',
        direction: RIGHT,
        standHeight: 24,
        kneelHeight: 16,
        pickupDelay: 2,
        speed: 5,
        gravity: 1,
        jumpSpeed:  8,
        frictionRate: 2/3,
        sequence: function (sequenceName){
            if(sequenceName === 'stand'){ sequenceName = 'fetch';}
            return character.sequence.call(this, sequenceName);
        }
    }),
    ballModel: Object.extend(block, {
        graphic: 'ball',
        width: 16,
        height: 16,
        gravity: 1/2,
        invert: function (){
            game.level.cancelMover(this);
            var inversion = Object.instantiate(this.inverted, this);
            this.x = 0; this.y = 0;
            this.inversion = inversion;
            return inversion;
        },
        landEffect: function (lander){
            if(lander === game.level.frankie && lander.currentSequence.name !== 'pickup'){
                lander.sequence('pickup');
            }
        },
        inverted: Object.extend(blockInverted, {
            takeTurn: function (){
                if(this.collisionCheck(game.level.frankie)){
                    this.velX = 0;
                }
                return blockInverted.takeTurn.apply(this, arguments);
            },
            dispose: function (){
                game.level.ball.inversion = null;
                return block.dispose.apply(this, arguments);
            }
        })
    }),
});
level.tileTypes['F'] = Object.extend(tile, { dense: false, activate: function (posX, posY, activationId){
    var anItem = Object.instantiate(levels.end.frankieModel);
    anItem.x = posX * TILE_SIZE;
    anItem.y = posY * TILE_SIZE;
    game.level.frankie = anItem;
}});