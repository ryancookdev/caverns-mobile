var stateLoad = {
    preload: function () {
        game.load.bitmapFont('carrier_command', 'assets/fonts/carrier_command.png', 'assets/fonts/carrier_command.xml');
    },

    create: function () {
        if (dev) {
            game.state.start('play');
        } else {
            game.state.start('menu');
        }
    }
};

