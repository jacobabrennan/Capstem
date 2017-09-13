'use strict';

client.audio = {
    effects: {
        /* to be populated from the below configuration data.
        Example:
        'soundId': {context: howlObject}
        */
    },
    testSongs: {
        outside: new Howl({
            src: ['rsc/audio/music/here_in_the_dark_by_ttench.mp3'],
            autoplay: false,
            loop: true,
            volume: 0.5
        }),
        motorcycle: new Howl({
            src: ['rsc/audio/music/part_robot_by_ttench.mp3'],
            autoplay: false,
            loop: true,
            volume: 0.5
        })
    },
    playTestSong: function (songId){
        if(this.currentTestSong){
            this.currentTestSong.stop();
        }
        var song = this.testSongs[songId];
        if(!song){ return;}
        this.currentTestSong = song;
        this.currentTestSong.play();
    },
    effectConfiguration: {
        'compound': {urls: ['rsc/audio/compound.wav'], sprites:{
            'bolt': [0, 920],
            'checkpoint': [921, 1167],
            'coinGet': [1167, 1342],
            'coinSpill': [1343, 1750],
            'drive': [1750, 4244],
            'idle': [4245, 11027],
            'explosion': [11028, 11297],
            'help': [11297, 11650],
            'jump': [11654, 11910],
            'land': [11912, 12069],
            'lightning': [12070, 14135],
            'bounce': [14140, 14505],
            'grow': [14507, 15030],
            'pickup': [15058, 15373],
            'shoot': [15414, 15540],
            'squeak': [15550, 15585],
            'throw': [15588, 15880]
        }},
    },
    playEffect: function (effectId, options){
        //return
        var effect = this.effects[effectId];
        if(!effect){ return null;}
        var instanceId = effect.context.play(effectId);
        return instanceId;
    },
    playSong: function (songId, options){
        return
//        var song = this.songs[songId];
//        if(!song){ return null;}
//        return this.chiptune2.play(song.buffer);
    },
    stopSong: function (){
        //this.chiptune2.stop();
    },
//============================================================================//
    setup: function (configuration, callback){
        // Setup mod music player with chiptune2 library.
        /*if(this.chiptune2 === undefined){
            this.chiptune2 = new ChiptuneJsPlayer(new ChiptuneJsConfig(-1));
        }
        for(var songName in this.songs){
            if(!this.songs.hasOwnProperty(songName)){ continue;}
            var song = this.songs[songName];
            this.chiptune2.load(song.url, function(buffer) {
                this.buffer = buffer;
            }.bind(song));
        }*/
        // Setup sound effect player with howler library.
        for(var configurationName in this.effectConfiguration){
            if(!this.effectConfiguration.hasOwnProperty(configurationName)){ continue;}
            var soundConfiguration = this.effectConfiguration[configurationName];
            for(var key in soundConfiguration.sprites){
                var sprite = soundConfiguration.sprites[key];
                var start = sprite[0];
                var end = sprite[1];
                var duration = end-start;
                sprite[1] = duration;
            }
            var howlObject = new Howl({
                src: soundConfiguration.urls,
                sprite: soundConfiguration.sprites
            });
            for(var spriteId in soundConfiguration.sprites){
                if(!soundConfiguration.sprites.hasOwnProperty(spriteId)){ continue}
                this.effects[spriteId] = {
                    context: howlObject
                }
            }
        }
        /*var audioResource = {
            _new: function (id, parentHowl){
                this.id = id;
                this.parent = parentHowl;
                client.audio.sounds[id] = this;
                return this;
            },
            play: function (){
                var soundId// = this.parent.play('test');
                return soundId;
            }
        };
        var resourcePath = 'rsc';
        spriteData.forEach(function (howlData){
            var newHowl = new Howl({
                src: [resourcePath+'/'+howlData.url],
                sprite: howlData.sprite
            });
            this.test = newHowl;
            for(var key in howlData.sprite){
                if(!howlData.sprite.hasOwnProperty(key)){ continue;}
                Object.instantiate(audioResource, key, newHowl);
            }
        }, this);*/
    }
}
