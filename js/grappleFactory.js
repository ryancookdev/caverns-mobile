var GrappleFactory = {

    create: function (x, y) {
        var grapple = game.add.sprite(x, y, 'grapple'),
            graphics,
            player,
            aiming = false,
            aimAngle = 0,
            aimAngleDirection = 1;

        game.physics.arcade.enable(grapple);
        grapple.anchor.set(0.5);

        /**
         * Public functions
         */

        grapple.registerEvents = function () {
            eventController.subscribe(handleUpdate, 'UPDATE');
            eventController.subscribe(handleGrappleAim, 'GRAPPLE_AIM');
            eventController.subscribe(handleGrappleShoot, 'GRAPPLE_SHOOT');
            eventController.subscribe(handleGrappleCancel, 'GRAPPLE_CANCEL');
            eventController.subscribe(handleGrappleHitPlatform, 'GRAPPLE_HIT_PLATFORM');
        };

        grapple.unregisterEvents = function () {
            eventController.unsubscribe(handleUpdate);
            eventController.unsubscribe(handleGrappleAim);
            eventController.unsubscribe(handleGrappleShoot);
            eventController.unsubscribe(handleGrappleCancel);
            eventController.unsubscribe(handleGrappleHitPlatform);
        };

        grapple.setGraphics = function (sharedGraphics) {
            graphics = sharedGraphics;
        };

        grapple.setPlayer = function (sharedPlayer) {
            player = sharedPlayer;
        };

        grapple.getAngleX = function (angle) {
            return Math.cos(angle) * 600;
        };

        grapple.getAngleY = function (angle) {
            return Math.sin(angle) * -600;
        };

        grapple.isAiming = function () {
            return aiming;
        };

        grapple.isFullyExtended = function () {
            if (Math.abs(player.y - this.y) > 500) {
                return true;
            }
            if (Math.abs(player.x - this.x) > 500) {
                return true;
            }
            return false;
        };

        grapple.isOffScreen = function () {
            return (this.y < 0 || this.x < 0 || this.x > 2400);
        };

        /**
         * Actions
         * Note: Do not change state here. State should be changed by event handlers only.
         */

        var aim = function () {
            aiming = true;

            graphics.lineStyle(1, 0xffffff, 1);
            var radius = 50,
                startAngle = 4.77,
                endAngle = 6.22;
            if (player.isFacingLeft()) {
                startAngle = 3.32;
                endAngle = 4.77;
            }
            graphics.arc(player.x, player.y, radius, startAngle, endAngle);

            // Aim marker
            if (aimAngle === 0) {
                if (player.isFacingRight()) {
                    aimAngle = 5.84;
                    aimAngleDirection = -1;
                } else {
                    aimAngle = 3.58;
                    aimAngleDirection = 1;
                }
            }

            var aimStartAngle = aimAngle - 0.2;
            var aimEndAngle = aimStartAngle + 0.4;

            graphics.lineStyle(2, 0xff0000, 1);
            graphics.arc(player.x, player.y, radius, aimStartAngle, aimEndAngle);

            aimAngle += (aimAngleDirection * 0.03);

            if (aimAngleDirection === 1 && aimAngle > endAngle) {
                aimAngleDirection = -1;
            } else if (aimAngleDirection === -1 && aimAngle < startAngle) {
                aimAngleDirection = 1;
            }
        };

        var stopAiming = function () {
            aiming = false;
        };

        var shoot = function () {
            stopAiming();
            reset();
            grapple.isShooting = true;

            grapple.body.velocity.x = grapple.getAngleX(aimAngle);
            grapple.body.velocity.y = -grapple.getAngleY(aimAngle);

            aimAngle = 0;
        };

        var draw = function () {
            graphics.lineStyle(1, 0xffffff, 1);
            graphics.moveTo(player.x, player.y);
            graphics.lineTo(grapple.x, grapple.y);
        };

        var retract = function () {
            grapple.body.velocity.x = 0;
            grapple.body.velocity.y = 0;
            grapple.isShooting = false;
            grapple.isRetracting = true;
        };

        var reset = function () {
            grapple.isShooting = false;
            grapple.isRetracting = false;
            grapple.body.velocity.x = 0;
            grapple.body.velocity.y = 0;
            grapple.x = player.x;
            grapple.y = player.y;
        };

        var movePlayerToGrapple = function () {
            game.physics.arcade.moveToXY(player, grapple.x, grapple.y + 20, 300);
        };

        /**
         * Event handlers
         * Note: This is where state should be changed.
         */

        var handleUpdate = function () {
            if (grapple.isShooting && grapple.isOffScreen()) {
                reset();
            }
            if (grapple.isShooting && grapple.isFullyExtended()) {
                reset();
            }
            if (grapple.isShooting || grapple.isRetracting) {
                draw();
            }
            if (grapple.isRetracting) {
                movePlayerToGrapple();
            }
            if (grapple.isRetracting
                && player.x > grapple.x - 3
                && player.x < grapple.x + 3
                && player.y < grapple.y + 20
            ) {
                eventController.trigger('GRAPPLE_FULLY_RETRACTED');
                reset();
            }

        };

        var handleGrappleAim = function () {
            aim();
        };

        var handleGrappleShoot = function () {
            shoot();
        };

        var handleGrappleCancel = function () {
           reset();
        };

        var handleGrappleHitPlatform = function () {
            if (grapple.isShooting) {
                retract();
            }
        };

        return grapple;
    }
};
