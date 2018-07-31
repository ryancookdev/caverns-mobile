var InputController = function () {
    this.build = function () {
        var buttonLeft,
            buttonRight,
            buttonJump,
            buttonGrapple,
            buttonPause;

        game.input.onTap.add(function () {
            if (!game.scale.isFullScreen) {
                game.scale.fullScreenScaleMode = Phaser.ScaleManager.EXACT_FIT;
                game.scale.startFullScreen(false);
            }
        }, this);

        buttonPause = game.add.tileSprite(0, 0, game.width, 120, 'buttonPause');
        buttonPause.inputEnabled = true;
        buttonPause.fixedToCamera = true;
        buttonPause.events.onInputUp.add(togglePause);

        buttonLeft = game.add.sprite(46, game.height - 35, 'buttonLeft');
        buttonLeft.fixedToCamera = true;

        buttonRight = game.add.sprite(158, game.height - 35, 'buttonRight');
        buttonRight.fixedToCamera = true;

        buttonJump = game.add.sprite(game.width - 66, game.height - 35, 'buttonJump');
        buttonJump.fixedToCamera = true;

        buttonGrapple = game.add.sprite(game.width - 168, game.height - 35, 'buttonGrapple');
        buttonGrapple.fixedToCamera = true;
    };

    this.isTouchingButtonLeft = function () {
        return (checkPointers(0, 112) || game.input.keyboard.isDown(Phaser.Keyboard.D));
    };

    this.isTouchingButtonRight = function () {
        return (checkPointers(112, 224) || game.input.keyboard.isDown(Phaser.Keyboard.F));
    };

    this.isTouchingButtonGrapple = function () {
        return (checkPointers(356, 488) || game.input.keyboard.isDown(Phaser.Keyboard.J));
    };

    this.isTouchingButtonJump = function () {
        return (checkPointers(488, 999) || game.input.keyboard.isDown(Phaser.Keyboard.K));
    };

    var checkPointers = function (x1, x2) {
        var button = false;

        game.input.pointers.forEach(function (pointer) {
            if (!pointer.active) {
                return;
            }
            if (pointer.y < 120) { // pause region
                return;
            }
            if (pointer.x >= x1 && pointer.x < x2) {
                button = true;
            }
        });

        return button;
    };

    var togglePause = function () {
        if (!game.physics.arcade.isPaused) {
            game.physics.arcade.isPaused = true;
            return;
        }
        if (game.scale.isFullScreen) {
            game.physics.arcade.isPaused = false;
        }
    };
};
