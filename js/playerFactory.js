var PlayerFactory = {

    create: function (x, y) {
        var player,
            graphics,
            speed = 180,
            jumpSpeed = 310,
            grappleJumpSpeed = 310,
            grappleAimAngle = 0,
            grappleAimAngleDirection = 1,
            fallingGravity = 820,
            descendingGravity = 300,
            descending = true, // player is entering the cave room
            isJumping = false;

        player = game.add.sprite(x, y, 'player');
        game.physics.arcade.enable(player);
        player.animations.add('right', Phaser.Animation.generateFrameNames('player/run/right/', 1, 6, '', 1), 10, true, false);
        player.animations.add('left', Phaser.Animation.generateFrameNames('player/run/left/', 1, 6, '', 1), 10, true, false);
        player.anchor.set(0.5);
        player.body.gravity.y = descendingGravity;
        player.body.collideWorldBounds = true;
        player.body.setSize(20, 44, 17, 2); // collision box
        game.camera.follow(player, Phaser.Camera.FOLLOW_TOPDOWN);

        player.registerEvents = function () {
            eventController.subscribe(handleButtonLeft, 'BUTTON_LEFT');
            eventController.subscribe(handleButtonRight, 'BUTTON_RIGHT');
            eventController.subscribe(handleButtonJump, 'BUTTON_JUMP');
            eventController.subscribe(handleRequestPlayerStopMoving, 'REQUEST_PLAYER_STOP_MOVING');
            eventController.subscribe(handlePlayerTouchingDown, 'PLAYER_TOUCHING_DOWN');
            eventController.subscribe(handlePlayerFalling, 'PLAYER_FALLING');
            eventController.subscribe(handleGrappleFullyRetracted, 'GRAPPLE_FULLY_RETRACTED');
            eventController.subscribe(handleGrappleOffScreen, 'GRAPPLE_OFF_SCREEN');
            eventController.subscribe(handleGrappleCancel, 'GRAPPLE_CANCEL');
            eventController.subscribe(handleGrappleShoot, 'GRAPPLE_SHOOT');
            eventController.subscribe(handleGrappleAim, 'GRAPPLE_AIM');
        };

        player.unregisterEvents = function () {
            eventController.unsubscribe(handleButtonLeft);
            eventController.unsubscribe(handleButtonRight);
            eventController.unsubscribe(handleButtonJump);
            eventController.unsubscribe(handleRequestPlayerStopMoving);
            eventController.unsubscribe(handlePlayerTouchingDown);
            eventController.unsubscribe(handlePlayerFalling);
            eventController.unsubscribe(handleGrappleFullyRetracted);
            eventController.unsubscribe(handleGrappleOffScreen);
            eventController.unsubscribe(handleGrappleCancel);
            eventController.unsubscribe(handleGrappleShoot);
            eventController.unsubscribe(handleGrappleAim);
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

        var jump = function () {
            isJumping = true;
            player.body.velocity.y = -jumpSpeed;
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
            player.body.velocity.x = -speed;
            player.animations.play('left');
        };

        var moveRight = function () {
            player.body.velocity.x = speed;
            player.animations.play('right');
        };

        var faceRight = function () {
            player.frameName = 'player/jump/right';
        };

        var faceLeft = function () {
            player.frameName = 'player/jump/left';
        };

        var isFacingRight = function () {
            if (player.frameName === 'player/handline') {
                return true;
            }
            return (player.frameName.includes('/right'));
        };

        var isFacingLeft = function () {
            return (player.frameName.includes('/left'));
        };

        var isAlive = function () {
            // TODO: fix this (not based on animation frame anymore)
            return true;
        };

        var fall = function () {
            player.frameName = 'player/' + (isJumping ? 'jump' : 'fall') + '/' + (isFacingLeft() ? 'left' : 'right');
            player.animations.stop();
        };

        var descend = function () {
            player.frameName = 'player/handline';
            drawHandline();
        };

        var touchDown = function () {
            descending = false;
            isJumping = false;
            player.body.gravity.y = fallingGravity;
        };

        var drawHandline = function () {
            graphics.lineStyle(1, 0xffffff);
            graphics.moveTo(player.x - 7, 0);
            graphics.lineTo(player.x - 7, player.y);
        };

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
            isJumping = true;
            player.body.velocity.y = -grappleJumpSpeed;
        };

        var shootGrapple = function () {
            player.grapple.resetPosition(player.x, player.y);
            player.grapple.isShooting = true;

            player.grapple.body.velocity.x = player.grapple.getAngleX(grappleAimAngle);
            player.grapple.body.velocity.y = -player.grapple.getAngleY(grappleAimAngle);

            grappleAimAngle = 0;
        };

        /**
         * Event handlers
         */

        var handleButtonLeft = function () {
            if (!isAlive()) {
                return;
            }
            if (descending) {
                return;
            }
            if (!player.body.touching.down) {
                faceLeft();
                return;
            }
            moveLeft();
        };

        var handleButtonRight = function () {
            if (!isAlive()) {
                return;
            }
            if (descending) {
                return;
            }
            if (!player.body.touching.down) {
                faceRight();
                return;
            }
            moveRight();
        };

        var handleButtonJump = function () {
            if (!isAlive()) {
                return;
            }
            if (!player.body.touching.down) {
                return;
            }
            jump();
        };

        var handleRequestPlayerStopMoving = function () {
            if (!isAlive()) {
                return;
            }
            stopMoving();
        };

        var handlePlayerTouchingDown = function () {
            if (!isAlive()) {
                return;
            }
            touchDown();
        };

        var handlePlayerFalling = function () {
            if (descending) {
                descend();
            } else {
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

        return player;
    }
};
