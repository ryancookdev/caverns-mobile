
var stateMenu = {
    preload: function () {
        game.load.image('menuBackground', 'assets/menu-bg.png');
    },

    create: function () {
        var menuBackground = game.add.sprite(0, 0, 'menuBackground');
        menuBackground.scale.x = 1.874;
        menuBackground.scale.y = 1.678;

        game.input.onTap.add(function () {
            if (!dev && !game.scale.isFullScreen) {
                game.scale.fullScreenScaleMode = Phaser.ScaleManager.EXACT_FIT;
                game.scale.startFullScreen(false);
            }
        }, this);

        game.input.onTap.add(function () {
            if (game.scale.isFullScreen) {
                game.state.start('levelSelect');
            }
        });
    }
};
