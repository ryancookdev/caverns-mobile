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
            // Constants
            SPEED = 160,
            JUMP_SPEED = 340,
            GRAPPLE_JUMP_SPEED = 340,
            FALLING_GRAVITY = 1000,
            DESCENDING_GRAVITY = 300,
            // TODO: move this out of here
            grappleAimAngle = 0,
            grappleAimAngleDirection = 1;

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
            eventController.subscribe(handleGrappleOffScreen, 'GRAPPLE_OFF_SCREEN');
            eventController.subscribe(handleGrappleCancel, 'GRAPPLE_CANCEL');
            eventController.subscribe(handleGrappleShoot, 'GRAPPLE_SHOOT');
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
            eventController.unsubscribe(handleGrappleOffScreen);
            eventController.unsubscribe(handleGrappleCancel);
            eventController.unsubscribe(handleGrappleShoot);
            eventController.unsubscribe(handleGrappleAim);
            eventController.unsubscribe(handleBeatRoom);
        };

        player.setGraphics = function (sharedGraphics) {
            graphics = sharedGraphics;
        };

        player.setGrapple = function (grapple) {
            player.grapple = grapple;
        };

        player.kill = function () {
            if (!isAlive()) {
                return;
            }
            player.animations.stop();
            player.body.setSize(10, 10, 5, 2); // collision box
        };

        /**
         * Actions
         * Note: Do not change state here. State should be changed by event handlers only.
         */

        var jump = function () {
            var orientation = (isFacingLeft() ? 'left' : 'right');

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
            player.frameName = (isFacingRight()) ? 'player/stand/right' : 'player/stand/left';
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
            var motion = (isJumping() ? 'jump' : 'fall'),
                orientation = (isFacingLeft() ? 'left' : 'right');

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

        /**
         * State checkers
         */

        var isAlive = function () {
            return (stateHealth === healthEnum.ALIVE);
        };

        var isFacingLeft = function () {
            return (stateOrientation === orientationEnum.LEFT);
        };

        var isFacingRight = function () {
            return (stateOrientation === orientationEnum.RIGHT);
        };

        var isStanding = function () {
            return (stateMotion === motionEnum.STANDING);
        };

        var isRunning = function () {
            return (stateMotion === motionEnum.RUNNING);
        };

        var isFalling = function () {
            return (stateMotion === motionEnum.FALLING);
        };

        var isDescending = function () {
            return (stateMotion === motionEnum.DESCENDING);
        };

        var isJumping = function () {
            return (stateMotion === motionEnum.JUMPING);
        };

        /**
         * Grapple logic
         * TODO: Move this out of here
         */

        var aimGrapple = function () {
            if (isFacingLeft()) {
                player.frameName = 'player/aim/left/angle2';
            } else if (isFacingRight()) {
                player.frameName = 'player/aim/right/angle2';
            }

            graphics.lineStyle(1, 0xffffff);
            var radius = 50,
                startAngle = 4.77,
                endAngle = 6.22;
            if (isFacingLeft()) {
                startAngle = 3.32;
                endAngle = 4.77;
            }
            graphics.arc(player.x, player.y, radius, startAngle, endAngle);

            // Aim marker
            if (grappleAimAngle === 0) {
                if (isFacingRight()) {
                    grappleAimAngle = 5.84;
                    grappleAimAngleDirection = -1;
                } else {
                    grappleAimAngle = 3.58;
                    grappleAimAngleDirection = 1;
                }
            }

            var aimStartAngle = grappleAimAngle - 0.2;
            var aimEndAngle = aimStartAngle + 0.4;

            graphics.lineStyle(2, 0xff0000);
            graphics.arc(player.x, player.y, radius, aimStartAngle, aimEndAngle);

            grappleAimAngle += (grappleAimAngleDirection * 0.03);

            if (grappleAimAngleDirection === 1 && grappleAimAngle > endAngle) {
                grappleAimAngleDirection = -1;
            } else if (grappleAimAngleDirection === -1 && grappleAimAngle < startAngle) {
                grappleAimAngleDirection = 1;
            }
        };

        var resetGrapple = function () {
            player.grapple.resetPosition(player.x, player.y);
        };

        var grappleJump = function () {
            stateMotion = motionEnum.JUMPING;
            player.body.velocity.y = -GRAPPLE_JUMP_SPEED;
        };

        var shootGrapple = function () {
            player.grapple.resetPosition(player.x, player.y);
            player.grapple.isShooting = true;

            player.grapple.body.velocity.x = player.grapple.getAngleX(grappleAimAngle);
            player.grapple.body.velocity.y = -player.grapple.getAngleY(grappleAimAngle);

            grappleAimAngle = 0;
        };

        var drawHandline = function () {
            graphics.lineStyle(1, 0xffffff);
            graphics.moveTo(player.x - 7, 0);
            graphics.lineTo(player.x - 7, player.y);
        };

        /**
         * Event handlers
         * Note: This is where state should be changed.
         */

        var handleButtonLeft = function () {
            if (!isAlive()) {
                return;
            }
            if (isDescending()) {
                return;
            }
            stateOrientation = orientationEnum.LEFT;
            moveLeft();
        };

        var handleButtonRight = function () {
            if (!isAlive()) {
                return;
            }
            if (isDescending()) {
                return;
            }
            stateOrientation = orientationEnum.RIGHT;
            moveRight();
        };

        var handleButtonJump = function () {
            if (!isAlive()) {
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
            if (!isAlive()) {
                return;
            }
            stateMotion = motionEnum.STANDING;
            touchDown();
        };

        var handlePlayerNotTouchingDown = function () {
            if (isDescending()) {
                stateMotion = motionEnum.DESCENDING;
                descend();
                return;
            }

            if (!isJumping()) {
                stateMotion = motionEnum.FALLING;
                fall();
            }
        };

        var handleGrappleFullyRetracted = function () {
            if (!isAlive()) {
                return;
            }
            stopMoving();
            grappleJump();
            resetGrapple();
        };

        var handleGrappleOffScreen = function () {
            resetGrapple();
        };

        var handleGrappleCancel = function () {
            resetGrapple();
        };

        var handleGrappleShoot = function () {
            shootGrapple();
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
