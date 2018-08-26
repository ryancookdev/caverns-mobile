var PlayerFactory = {
    create: function (x, y) {
        var player,
            stateHealth,
            stateOrientation,
            stateMotion,
            healthEnum = {'ALIVE': 1, 'DEAD': 2},
            orientationEnum = {'LEFT': 1, 'RIGHT': 2},
            motionEnum = {'STANDING': 1, 'RUNNING': 2, 'JUMPING': 3, 'FALLING': 4, 'DESCENDING': 5},
            graphics,
            grapple,
            // Constants
            SPEED = 160,
            JUMP_SPEED = 340,
            GRAPPLE_JUMP_SPEED = 340,
            FALLING_GRAVITY = 1000,
            DESCENDING_GRAVITY = 300;

        player = game.add.sprite(x, y, 'player');
        game.physics.arcade.enable(player);
        player.animations.add('right', Phaser.Animation.generateFrameNames('player/run/right/', 1, 6, '', 1), 12, true, false);
        player.animations.add('left', Phaser.Animation.generateFrameNames('player/run/left/', 1, 6, '', 1), 12, true, false);
        player.anchor.set(0.5);
        player.body.gravity.y = DESCENDING_GRAVITY;
        player.body.collideWorldBounds = true;
        player.body.setSize(20, 44, 17, 2); // collision box
        game.camera.follow(player, Phaser.Camera.FOLLOW_TOPDOWN);

        // Initial player state
        stateHealth = healthEnum.ALIVE;
        stateOrientation = orientationEnum.RIGHT;
        stateMotion = motionEnum.DESCENDING;

        /**
         * Public functions
         */

        player.registerEvents = function () {
            eventController.subscribe(handleButtonLeft, 'BUTTON_LEFT');
            eventController.subscribe(handleButtonRight, 'BUTTON_RIGHT');
            eventController.subscribe(handleButtonJump, 'BUTTON_JUMP');
            eventController.subscribe(handleButtonLeftRightNotPressed, 'BUTTON_LEFT_RIGHT_NOT_PRESSED');
            eventController.subscribe(handlePlayerTouchingDown, 'PLAYER_TOUCHING_DOWN');
            eventController.subscribe(handlePlayerNotTouchingDown, 'PLAYER_NOT_TOUCHING_DOWN');
            eventController.subscribe(handleGrappleFullyRetracted, 'GRAPPLE_FULLY_RETRACTED');
            eventController.subscribe(handleGrappleAim, 'GRAPPLE_AIM');
            eventController.subscribe(handleBeatRoom, 'BEAT_ROOM');
        };

        player.unregisterEvents = function () {
            eventController.unsubscribe(handleButtonLeft);
            eventController.unsubscribe(handleButtonRight);
            eventController.unsubscribe(handleButtonJump);
            eventController.unsubscribe(handleButtonLeftRightNotPressed);
            eventController.unsubscribe(handlePlayerTouchingDown);
            eventController.unsubscribe(handlePlayerNotTouchingDown);
            eventController.unsubscribe(handleGrappleFullyRetracted);
            eventController.unsubscribe(handleGrappleAim);
            eventController.unsubscribe(handleBeatRoom);
        };

        player.setGraphics = function (sharedGraphics) {
            graphics = sharedGraphics;
        };

        player.setGrapple = function (sharedGrapple) {
            grapple = sharedGrapple;
        };

        player.kill = function () {
            if (!player.isAlive()) {
                return;
            }
            player.animations.stop();
            player.body.setSize(10, 10, 5, 2); // collision box
        };

        player.isAlive = function () {
            return (stateHealth === healthEnum.ALIVE);
        };

        player.isFacingLeft = function () {
            return (stateOrientation === orientationEnum.LEFT);
        };

        player.isFacingRight = function () {
            return (stateOrientation === orientationEnum.RIGHT);
        };

        player.isStanding = function () {
            return (stateMotion === motionEnum.STANDING);
        };

        player.isRunning = function () {
            return (stateMotion === motionEnum.RUNNING);
        };

        player.isFalling = function () {
            return (stateMotion === motionEnum.FALLING);
        };

        player.isDescending = function () {
            return (stateMotion === motionEnum.DESCENDING);
        };

        player.isJumping = function () {
            return (stateMotion === motionEnum.JUMPING);
        };

        /**
         * Actions
         * Note: Do not change state here. State should be changed by event handlers only.
         */

        var jump = function () {
            var orientation = (player.isFacingLeft() ? 'left' : 'right');

            player.body.velocity.y = -JUMP_SPEED;
            player.frameName = 'player/jump/' + orientation;
        };

        var stopMoving = function () {
            // It's okay to continue aiming
            if (player.frameName.includes('/aim/')) {
                return;
            }

            player.body.velocity.x = 0;
            player.animations.stop();
            player.frameName = (player.isFacingRight()) ? 'player/stand/right' : 'player/stand/left';
        };

        var moveLeft = function () {
            player.body.velocity.x = -SPEED;
            if (player.body.touching.down) {
                player.animations.play('left');
            } else {
                player.animations.stop();
                player.frameName = 'player/jump/left';
            }
        };

        var moveRight = function () {
            player.body.velocity.x = SPEED;
            if (player.body.touching.down) {
                player.animations.play('right');
            } else {
                player.animations.stop();
                player.frameName = 'player/jump/right';
            }
        };

        var fall = function () {
            var motion = (player.isJumping() ? 'jump' : 'fall'),
                orientation = (player.isFacingLeft() ? 'left' : 'right');

            // Player may be falling even as the grapple retracts
            // TODO: Handle this state conflict better
            if (player.body.velocity.y > 0) {
                player.body.velocity.x = 0;
            }

            player.frameName = 'player/' + motion + '/' + orientation;
            player.animations.stop();
        };

        var descend = function () {
            player.frameName = 'player/handline';
            drawHandline();
        };

        var touchDown = function () {
            player.body.gravity.y = FALLING_GRAVITY;
        };

        var grappleJump = function () {
            player.body.velocity.y = -GRAPPLE_JUMP_SPEED;
        };

        var aimGrapple = function () {
            if (player.isFacingLeft()) {
                player.frameName = 'player/aim/left/angle2';
            } else if (player.isFacingRight()) {
                player.frameName = 'player/aim/right/angle2';
            }
        };

        var drawHandline = function () {
            graphics.lineStyle(1, 0xffffff, 1);
            graphics.moveTo(player.x - 7, 0);
            graphics.lineTo(player.x - 7, player.y);
        };

        /**
         * Event handlers
         * Note: This is where state should be changed.
         */

        var handleButtonLeft = function () {
            if (!player.isAlive()) {
                return;
            }
            if (player.isDescending()) {
                return;
            }
            stateOrientation = orientationEnum.LEFT;
            moveLeft();
        };

        var handleButtonRight = function () {
            if (!player.isAlive()) {
                return;
            }
            if (player.isDescending()) {
                return;
            }
            stateOrientation = orientationEnum.RIGHT;
            moveRight();
        };

        var handleButtonJump = function () {
            if (!player.isAlive()) {
                return;
            }
            if (!player.body.touching.down) {
                return;
            }
            stateMotion = motionEnum.JUMPING;
            jump();
        };

        var handleButtonLeftRightNotPressed = function () {
            if (player.body.touching.down) {
                if (stateMotion !== motionEnum.JUMPING) {
                    stopMoving();
                }
            }
        };

        var handlePlayerTouchingDown = function () {
            if (!player.isAlive()) {
                return;
            }
            stateMotion = motionEnum.STANDING;
            touchDown();
        };

        var handlePlayerNotTouchingDown = function () {
            if (player.isDescending()) {
                stateMotion = motionEnum.DESCENDING;
                descend();
                return;
            }

            if (!player.isJumping()) {
                stateMotion = motionEnum.FALLING;
                fall();
            }
        };

        var handleGrappleFullyRetracted = function () {
            stopMoving();
            stateMotion = motionEnum.JUMPING;
            grappleJump();
        };

        var handleGrappleAim = function () {
            aimGrapple();
        };

        var handleBeatRoom = function () {
            stopMoving();
        };

        return player;
    }
};
