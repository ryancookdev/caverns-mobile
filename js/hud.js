var HUD = function () {
    var hearts;

    this.registerEvents = function () {
        eventController.subscribe(updateHearts, 'UPDATE_HEARTS');
    };

    this.unregisterEvents = function () {
        eventController.unsubscribe(updateHearts);
    };

    this.build = function () {
        return;
        var heart1,
            heart2,
            heart3,
            levelText;

        hearts = [];

        heart1 = game.add.sprite(250, game.height - 32, 'heart');
        heart1.fixedToCamera = true;
        hearts.push(heart1);

        heart2 = game.add.sprite(290, game.height - 32, 'heart');
        heart2.fixedToCamera = true;
        hearts.push(heart2);

        heart3 = game.add.sprite(330, game.height - 32, 'heart');
        heart3.fixedToCamera = true;
        hearts.push(heart3);

        levelText = game.add.bitmapText(250, game.height - 50, 'carrier_command', 'ROOM ' + level, 10);
        levelText.fixedToCamera = true;
    };

    var updateHearts = function () {
        return;
        if (heartCount === 3) {
            return;
        }
        for (var i = 2; i >= heartCount; i--) {
            hearts[i].loadTexture('heartEmpty', 0);
        }
    };
};
