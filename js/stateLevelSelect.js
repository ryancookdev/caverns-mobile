
var stateLevelSelect = {
    preload: function () {
    },

    create: function () {

        game.input.onTap.add(function () {
            if (!dev && !game.scale.isFullScreen) {
                game.scale.fullScreenScaleMode = Phaser.ScaleManager.EXACT_FIT;
                game.scale.startFullScreen(false);
            }
        }, this);

        var level1 = game.add.bitmapText(170, 80, 'carrier_command', 'LEVEL 1', 25);
        level1.inputEnabled = true;
        level1.events.onInputUp.add(function () {
            if (game.scale.isFullScreen) {
                level = 1;
                game.state.start('play');
            }
        });

        /*var level2 = game.add.bitmapText(170, 180, 'carrier_command', 'LEVEL 2', 25);
        level2.inputEnabled = true;
        level2.events.onInputUp.add(function () {
            if (game.scale.isFullScreen) {
                level = 5;
                game.state.start('play');
            }
        });*/
    }
};
