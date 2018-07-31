var GrappleFactory = {

    create: function (x, y) {
        var grapple = game.add.sprite(x, y, 'grapple'),
            aiming = false;

        grapple.isFullyExtended = function (player) {
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

        grapple.resetPosition = function (x, y) {
            this.isShooting = false;
            this.isRetracting = false;
            this.body.velocity.x = 0;
            this.body.velocity.y = 0;
            this.x = x;
            this.y = y;
        };

        grapple.getAngleX = function (angle) {
            return Math.cos(angle) * 600;
        };

        grapple.getAngleY = function (angle) {
            return Math.sin(angle) * -600;
        };

        grapple.aim = function () {
            aiming = true;
        };

        grapple.stopAiming = function () {
            aiming = false;
        }

        grapple.isAiming = function () {
            return aiming;
        };

        grapple.registerEvents = function () {
            eventController.subscribe(grapple.aim, 'GRAPPLE_AIM');
        };

        grapple.unregisterEvents = function () {
            eventController.unsubscribe(grapple.aim);
        };

        game.physics.arcade.enable(grapple);
        grapple.anchor.set(0.5);

        return grapple;
    }
};
