/**
 * Main file that kicks off everything else.
 */

// Set up game globals
var dev = true,
    level = 1,
    heartCount = 3,
    eventController,
    inputController,
    game = new Phaser.Game(600, 336, Phaser.CANVAS, '');

// Create the various states
game.state.add('boot', stateBoot);
game.state.add('load', stateLoad);
game.state.add('menu', stateMenu);
game.state.add('levelSelect', stateLevelSelect);
game.state.add('play', statePlay);

// Kick it off!
game.state.start('boot');
