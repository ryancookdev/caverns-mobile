var statePlay = function () {
    var self = this,
        playerStartX = 15,
        playerStartY = -10,
        floorMarkColor,
        platformVerticalSpacing = 56,
        platformHeight = 10,

        // State info
        pixelCount = 0,
        animationScene = false,
        roomComplete = false,

        // Game objects
        player,
        playerGroup,
        graphicsLayer,
        graphics,
        grapple,
        platforms,
        signposts,
        floorPlatform,
        floorMarks,
        hud;

    self.preload = function () {
        game.load.image('ground', 'assets/platform.png');
        game.load.atlasJSONHash('player', 'assets/player.png', 'assets/player.json');
        game.load.spritesheet('grapple', 'assets/grapple.png', 5, 5);
        game.load.image('buttonPause', 'assets/blank.png');
        game.load.image('buttonLeft', 'assets/button-left.png');
        game.load.image('buttonRight', 'assets/button-right.png');
        game.load.image('buttonJump', 'assets/button-jump.png');
        game.load.image('buttonGrapple', 'assets/button-grapple.png');
        game.load.image('heart', 'assets/heart.png');
        game.load.image('heartEmpty', 'assets/heart-empty.png');
        game.load.image('signpost', 'assets/signpost.png');
    };

    self.create = function () {
        var levelWidth;

        eventController = new EventController();
        inputController = new InputController();
        inputController.build();

        var levelXml = loadLevel();

        levelWidth = levelXml.getElementsByTagName('width')[0].innerHTML;

        game.world.setBounds(0, 0, parseInt(levelWidth), 900);
        game.physics.arcade.checkCollision.up = false;
        game.stage.backgroundColor = '#000000';

        // For grapple and floor marks
        floorMarkColor = 0xc58917;
        graphicsLayer = game.add.group();
        graphicsLayer.z = 1;
        graphics = game.add.graphics(0, 0);
        graphicsLayer.add(graphics);

        playerGroup = game.add.group();
        playerGroup.enableBody = true;

        // Level
        floorMarks = new FloorMarks();
        floorMarks.setGraphics(graphics);
        if (level === 1) {
            buildLevel(levelXml);
        } else {
            buildRandomLevel(levelWidth);
        }

        game.world.bringToTop(graphicsLayer);
        game.world.bringToTop(playerGroup);

        // Player
        player = PlayerFactory.create(playerStartX, playerStartY);
        player.registerEvents();
        player.setGraphics(graphics);

        grapple = GrappleFactory.create(player.x, player.y);
        grapple.registerEvents();

        player.setGrapple(grapple);

        playerGroup.add(player);
        playerGroup.add(grapple);

        hud = new HUD();
        hud.registerEvents();
        hud.build();

        eventController.trigger('UPDATE_HEARTS');
    };

    // Game loop
    self.update = function () {
        var isTouchingButtonLeft = false,
            isTouchingButtonRight = false,
            isTouchingButtonGrapple = false,
            isTouchingButtonJump = false;

        if (!dev && !game.scale.isFullScreen) {
            game.physics.arcade.isPaused = true;
        }

        redrawScreen();
        checkCollisions();

        // Grapple logic
        if (grapple.isShooting && grapple.isOffScreen()) {
            eventController.trigger('GRAPPLE_OFF_SCREEN');
        }
        if (grapple.isShooting && grapple.isFullyExtended(player)) {
            eventController.trigger('GRAPPLE_OFF_SCREEN');
        }
        if (grapple.isShooting || grapple.isRetracting) {
            drawGrapple();
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
        }

        if (animationScene) {
            return;
        }

        if (player.body.touching.down) {
            eventController.trigger('PLAYER_TOUCHING_DOWN');
            if (isTouchingButtonLeft) {
                eventController.trigger('BUTTON_LEFT');
            } else if (isTouchingButtonRight) {
                eventController.trigger('BUTTON_RIGHT');
            }
        } else {
            eventController.trigger('PLAYER_FALLING');
        }

        // Check touch movement
        if (!game.physics.arcade.isPaused) {
            isTouchingButtonLeft = inputController.isTouchingButtonLeft();
            isTouchingButtonRight = inputController.isTouchingButtonRight();
            isTouchingButtonGrapple = inputController.isTouchingButtonGrapple();
            isTouchingButtonJump = inputController.isTouchingButtonJump();
        }

        if (isTouchingButtonLeft) {
            if (isTouchingButtonGrapple) {
                eventController.trigger('GRAPPLE_ANGLE_LEFT');
                isTouchingButtonLeft = false;
            } else {
                isTouchingButtonLeft = true;
                eventController.trigger('BUTTON_LEFT');
            }
        }
        if (isTouchingButtonRight) {
            if (isTouchingButtonGrapple) {
                eventController.trigger('GRAPPLE_ANGLE_RIGHT');
                isTouchingButtonRight = false;
            } else {
                isTouchingButtonRight = true;
                eventController.trigger('BUTTON_RIGHT');
            }
        }
        if (isTouchingButtonJump) {
            eventController.trigger('BUTTON_JUMP');
            eventController.trigger('GRAPPLE_CANCEL');
        }
        if (isTouchingButtonGrapple) {
            eventController.trigger('GRAPPLE_CANCEL');
            eventController.trigger('GRAPPLE_AIM');
            isTouchingButtonGrapple = true;
            isTouchingButtonLeft = false;
            isTouchingButtonRight = false;
            // Slow time while aiming
            game.time.advancedTiming = true;
            game.time.desiredFps = 1200;
        }

        if (!isTouchingButtonLeft && !isTouchingButtonRight) {
            if (player.body.touching.down) {
                eventController.trigger('REQUEST_PLAYER_STOP_MOVING');
            }
        }

        // Shoot grapple
        if (!isTouchingButtonGrapple && grapple.isAiming()) {
            grapple.stopAiming();
            eventController.trigger('GRAPPLE_SHOOT');
            // Restore time
            game.time.advancedTiming = false;
            game.time.desiredFps = 60;
        }

        if (floorMarks.totalMarks() === pixelCount) {
            pixelCount = 0;
            beatRoom();
        }
    };

    var loadLevel = function () {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open('GET', 'levels/level' + level + '.xml', false);
        xmlhttp.send();
        return xmlhttp.responseXML;
    };

    var buildLevel = function (levelXml) {
        var i,
            allFloorsElem,
            allSignpostsElem,
            messageText,
            messagePosition,
            textPositionX,
            textPositionY;

        // Platforms
        platforms = game.add.group();
        platforms.enableBody = true;

        pixelCount = 0;
        allFloorsElem = levelXml.getElementsByTagName('floor');
        for (i = 0; i < allFloorsElem.length; i += 1) {
            var floor = allFloorsElem[i].childNodes[0].nodeValue;
            var row = parseInt(floor.split(' ')[0]);
            var x = parseInt(floor.split(' ')[1]);
            var length = parseInt(floor.split(' ')[2]);

            createPlatform(x, platformVerticalSpacing * row, length, platformHeight);
            pixelCount += length;
        }

        platforms.forEach(function (item) {
            item.body.immovable = true;
            item.body.checkCollision.left = false;
            item.body.checkCollision.right = false;
        }, self);

        // Level text
        if (levelXml.getElementsByTagName('message_text').length > 0) {
            messageText = levelXml.getElementsByTagName('message_text')[0].innerHTML;
            messagePosition = levelXml.getElementsByTagName('message_position')[0].innerHTML;
            textPositionY = 30 * parseInt(messagePosition.split(' ')[0]) - 5;
            textPositionX = parseInt(messagePosition.split(' ')[1]);
            game.add.bitmapText(textPositionX, textPositionY, 'carrier_command', messageText, 10);
        }

        // Sign posts
        signposts = game.add.group();
        signposts.enableBody = true;

        allSignpostsElem = levelXml.getElementsByTagName('signpost');
        for (i = 0; i < allSignpostsElem.length; i += 1) {
            var signpost = allSignpostsElem[i].childNodes[0].nodeValue;
            var row = parseInt(signpost.split(' ')[0]);
            var x = parseInt(signpost.split(' ')[1]);
            createSignpost(x, platformVerticalSpacing * row);
        }
    };

    var buildRandomLevel = function (width) {
        var i;

        pixelCount = 0;

        platforms = game.add.group();
        platforms.enableBody = true;

        // ground
        floorPlatform = createPlatform(5, platformVerticalSpacing * 15, width - 5, platformHeight);
        pixelCount = width - 5;

        // platforms
        for (i = 2; i < 15; i++) {
            createRow(i);
        }

        // starting platform
        createPlatform(5, platformVerticalSpacing, 60, platformHeight);
        pixelCount += 60;

        platforms.forEach(function (item) {
            item.body.immovable = true;
            item.body.checkCollision.left = false;
            item.body.checkCollision.right = false;
        }, self);
    };

    var createRow = function (rowNumber) {
        // Create initial gap
        var maxX = randomInRange(5, 20) * 15, // The x position of the right pixel of the rightmost platform
            newMaxX = 0,
            rowCount = 0,
            maxRightEdge = 2150;

        // Create some space for the initial platform
        if (rowNumber === 2) {
            maxX += 70;
            maxRightEdge -= 70;
        }

        while (maxX < maxRightEdge) { // Don't go to the right edge
            newMaxX = maxX + randomInRange(3, 10) * 15;
            createPlatform(maxX, platformVerticalSpacing * rowNumber, newMaxX - maxX, platformHeight);
            rowCount += (newMaxX - maxX) + 1;
            // Create a gap
            newMaxX += randomInRange(5, 40) * 15;
            maxX = newMaxX;
        }
        pixelCount += rowCount;
    };

    var createPlatform = function (x, y, width, height) {
        var platform = game.add.tileSprite(x, y, width, height, 'ground');
        platforms.add(platform);
        return platform;
    };

    var createSignpost = function (x, y) {
        var signpost = game.add.sprite(x, y + 1, 'signpost'); // +1 to ensure collision with platform
        signposts.add(signpost);
        signpost.anchor.set(.5, 1);
        signpost.body.setSize(25, 2, 8, 34); // collision box
        signpost.body.immovable = true;
    };

    var beatRoom = function () {
        redrawScreen(); // Make sure the last floor mark is displayed

        eventController.trigger('REQUEST_PLAYER_STOP_MOVING');
        animationScene = true;
        roomComplete = true;

        animateBeatRoom(30, function () {
            nextRoom();
            game.state.start(game.state.current);
        });

        function animateBeatRoom (i, callback) {
            if (i < 0) {
                floorMarkColor = 0xc58917;
                callback();
                return;
            }

            // Floor
            if (i === 0 || i % 4 === 0) {
                floorMarkColor = 0x55ffff;
            } else if (i === 1 || i % 4 === 1) {
                floorMarkColor = 0x00aa00;
            } else if (i === 2 || i % 4 === 2) {
                floorMarkColor = 0xffffff;
            } else if (i === 3 || i % 4 === 3) {
                floorMarkColor = 0xaa0000;
            }

            game.time.events.add(50, function () {
                animateBeatRoom(i - 1, callback);
            }, self).autoDestroy = true;
        }
    };

    var killPlayer = function () {
        var rotateDirection = 1;

        player.kill();
        game.camera.target = null;

        rotatePlayer();

        function rotatePlayer() {
            // Stop condition
            if ((rotateDirection === -1 && player.angle <= -90) || (rotateDirection === 1 && player.angle >= 90)) {
                game.time.events.add(Phaser.Timer.SECOND, panCameraToEdge, self).autoDestroy = true;
                return;
            }

            // Animation
            player.angle = player.angle + (5 * rotateDirection);
            game.time.events.add(10, rotatePlayer, self).autoDestroy = true;

        }

        function panCameraToEdge() {
            var panDirection = -1

            // Stop condition
            if (game.camera.x <= 0) {
                game.camera.x = 0;

                if (player) {
                    player.unregisterEvents()
                    player.body.velocity.x = 0;
                    player.kill();
                    player.visible = false;
                    player = null;
                }

                player = PlayerFactory.create(playerStartX, playerStartY);

                player.registerEvents()

                animationScene = false;
                return;
            }

            // Animation
            game.camera.x = game.camera.x + (15 * panDirection);
            game.time.events.add(10, panCameraToEdge, self).autoDestroy = true;

        }
    };

    var retractGrapple = function () {
        grapple.body.velocity.x = 0;
        grapple.body.velocity.y = 0;
        grapple.isShooting = false;
        grapple.isRetracting = true;
    };

    var movePlayerToGrapple = function () {
        game.physics.arcade.moveToXY(player, grapple.x, grapple.y + 20, 300);
    };

    var drawGrapple = function () {
        graphics.lineStyle(1, 0xffffff);
        graphics.moveTo(player.x, player.y);
        graphics.lineTo(grapple.x, grapple.y);
    };

    var redrawScreen= function () {
        graphics.clear();
        floorMarks.draw(platformHeight, floorMarkColor, platformVerticalSpacing);
    };

    var nextRoom = function () {
        roomComplete = false;
        animationScene = false;
        if (level % 4 === 0) {
            heartCount = 3;
        }
        level++;
    };

    var collidePlayerPlatform = function (player, platform) {
        // Allow player to jump up through the platform
        if (player.body.velocity.y >= 0) {
            // Only mark the platform if the player is standing on it
            if ((player.y + player.height / 2 - 4) < platform.y) {
                floorMarks.newFloorMark(platform, player, platformVerticalSpacing);
            }
            return true;
        }
        return false;
    };

    var collidePlayerSignpost = function (player, signpost) {
        return true;
    };

    var collideGrapplePlatform = function (grapple, platform) {
        if (grapple.isShooting) {
            retractGrapple();
        }
    };

    var collideSignpostPlatform = function (signpost, platform) {
        floorMarks.newFloorMark(platform, signpost, platformVerticalSpacing);
        return true;
    };

    var checkCollisions = function () {
        // Collisions
        game.physics.arcade.collide(player, platforms, null, collidePlayerPlatform);
        game.physics.arcade.collide(player, signposts, null, collidePlayerSignpost);
        game.physics.arcade.collide(signposts, platforms, null, collideSignpostPlatform);
        game.physics.arcade.collide(grapple, platforms, null, collideGrapplePlatform);
    };
};
