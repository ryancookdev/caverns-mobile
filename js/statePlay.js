/**
 * This is essentially a Level class, which delegates logic to each game object where possible
 */
var statePlay = function () {
    var self = this,
        playerStartX = 15,
        playerStartY = -10,
        paintColor,
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
        stonePlatforms,
        signposts,
        ginkians,
        paint,
        hud;

    self.preload = function () {
        game.load.image('platform', 'assets/platform.png');
        game.load.image('stonePlatform', 'assets/stone-platform.png');
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
        game.load.image('ginkian', 'assets/ginkian.png');
    };

    self.create = function () {
        var levelWidth,
            levelXml;

        eventController = new EventController();
        inputController = new InputController();
        inputController.build();

        levelXml = loadLevel();
        levelWidth = levelXml.getElementsByTagName('width')[0].innerHTML;

        game.world.setBounds(0, 0, parseInt(levelWidth), 336);
        game.physics.arcade.checkCollision.up = false; // or you'll hit your head on the cave ceiling
        game.stage.backgroundColor = '#000000';

        paintColor = 0xc58917;

        // For grapple and paint
        graphicsLayer = game.add.group();
        graphicsLayer.z = 1;
        graphics = game.add.graphics(0, 0);
        graphicsLayer.add(graphics);

        playerGroup = game.add.group();
        playerGroup.enableBody = true;

        // Level
        paint = new Paint();
        paint.setGraphics(graphics);

        buildLevel(levelXml);
        //buildRandomLevel(levelWidth, 5);
        //exportLevelToXml();

        game.world.bringToTop(graphicsLayer);
        game.world.bringToTop(playerGroup);

        // Player
        player = PlayerFactory.create(playerStartX, playerStartY);
        player.registerEvents();
        player.setGraphics(graphics);

        grapple = GrappleFactory.create(player.x, player.y);
        grapple.registerEvents();
        grapple.setGraphics(graphics);

        // Let the player and grapple know about each other
        player.setGrapple(grapple);
        grapple.setPlayer(player);

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

        // All drawing to the graphics object (by other game objects) must happen after redrawScreen
        eventController.trigger('UPDATE');

        checkCollisions();

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
            eventController.trigger('PLAYER_NOT_TOUCHING_DOWN');
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
            eventController.trigger('BUTTON_LEFT_RIGHT_NOT_PRESSED');
        }

        // Shoot grapple
        if (!isTouchingButtonGrapple && grapple.isAiming()) {
            eventController.trigger('GRAPPLE_SHOOT');
            // Restore time
            game.time.advancedTiming = false;
            game.time.desiredFps = 60;
        }

        if (paint.totalMarks() === pixelCount) {
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
            allPlatformsElem,
            allStonePlatformsElem,
            allSignpostsElem,
            allGinkiansElem,
            messageText,
            messagePosition,
            textPositionX,
            textPositionY;

        // Platforms
        platforms = game.add.group();
        platforms.enableBody = true;
        stonePlatforms = game.add.group();
        stonePlatforms.enableBody = true;

        pixelCount = 0;
        allPlatformsElem = levelXml.getElementsByTagName('platform');
        for (i = 0; i < allPlatformsElem.length; i += 1) {
            var platform = allPlatformsElem[i].childNodes[0].nodeValue;
            var row = parseInt(platform.split(' ')[0]);
            var x = parseInt(platform.split(' ')[1]);
            var length = parseInt(platform.split(' ')[2]);
            createPlatform(x, platformVerticalSpacing * row, length, platformHeight);
            pixelCount += length;
        }

        platforms.forEach(function (platform) {
            platform.body.immovable = true;
            platform.body.checkCollision.left = false;
            platform.body.checkCollision.right = false;
        }, self);

        // Stone platforms
        allStonePlatformsElem = levelXml.getElementsByTagName('stone-platform');
        for (i = 0; i < allStonePlatformsElem.length; i += 1) {
            var platform = allStonePlatformsElem[i].childNodes[0].nodeValue;
            var row = parseInt(platform.split(' ')[0]);
            var x = parseInt(platform.split(' ')[1]);
            var length = parseInt(platform.split(' ')[2]);
            createStonePlatform(x, platformVerticalSpacing * row, length, platformHeight);
        }

        platforms.forEach(function (platform) {
            platform.body.immovable = true;
            platform.body.checkCollision.left = false;
            platform.body.checkCollision.right = false;
        }, self);

        stonePlatforms.forEach(function (stonePlatform) {
            stonePlatform.body.immovable = true;
            stonePlatform.body.checkCollision.left = false;
            stonePlatform.body.checkCollision.right = false;
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

        // Ginkians
        ginkians = game.add.group();
        ginkians.enableBody = true;

        allGinkiansElem = levelXml.getElementsByTagName('ginkian');
        for (i = 0; i < allGinkiansElem.length; i += 1) {
            var ginkian = allGinkiansElem[i].childNodes[0].nodeValue;
            var row = parseInt(ginkian.split(' ')[0]);
            var x = parseInt(ginkian.split(' ')[1]);
            createGinkian(x, platformVerticalSpacing * row);
        }
    };

    var buildRandomLevel = function (width, rows) {
        var i;
        pixelCount = 0;

        platforms = game.add.group();
        platforms.enableBody = true;

        // ground
        createPlatform(5, platformVerticalSpacing * rows, width - 5, platformHeight);
        pixelCount = width - 5;

        // platforms
        for (i = 1; i < rows; i++) {
            createRow(i, width);
        }

        platforms.forEach(function (platform) {
            platform.body.immovable = true;
            platform.body.checkCollision.left = false;
            platform.body.checkCollision.right = false;
        }, self);
    };

    // TODO: Create a platform class
    var createRow = function (rowNumber, maxRightEdge) {
        var minWidth = 15,
            platformX = randomInRange(1, Math.floor(maxRightEdge / minWidth) / 4) * minWidth,
            newMaxX = 0,
            platformWidth = 0,
            rowCount = 0;

        while (platformX < maxRightEdge) {
            newMaxX = platformX + randomInRange(3, 10) * minWidth;
            if (newMaxX > maxRightEdge) {
                break;
            }

            platformWidth = newMaxX - platformX;
            createPlatform(platformX, platformVerticalSpacing * rowNumber, platformWidth, platformHeight);
            rowCount += (newMaxX - platformX);

            // Create a gap
            newMaxX += randomInRange(5, 15) * minWidth;
            platformX = newMaxX;
        }
        pixelCount += rowCount;
    };

    // TODO: Create a platform class
    var createPlatform = function (x, y, width, height) {
        var platform = game.add.tileSprite(x, y, width, height, 'platform');
        platforms.add(platform);
        return platform;
    };

    // TODO: Create a platform class
    var createStonePlatform = function (x, y, width, height) {
        var stonePlatform = game.add.tileSprite(x, y, width, height, 'stonePlatform');
        stonePlatforms.add(stonePlatform);
        return stonePlatform;
    };

    var exportLevelToXml = function () {
        platforms.forEach(function (platform) {
            var platformXml,
                row,
                x,
                width;

            row = Math.floor((platform.y + 5) / platformVerticalSpacing);
            x = platform.body.x;
            width = platform.body.width;

            platformXml = '<platform>' + row + ' ' + x + ' ' + width + '</platform>';
            console.log(platformXml);
        }, self);
    };

    // TODO: Create a signpost class
    var createSignpost = function (x, y) {
        var signpost = game.add.sprite(x, y + 1, 'signpost');
        signposts.add(signpost);
        signpost.anchor.set(.5, 1);
        signpost.body.setSize(25, 2, 8, 34); // collision box
        signpost.body.immovable = true;
    };

    // TODO: Create a ginkian class
    var createGinkian = function (x, y) {
        var ginkian = game.add.sprite(x, y + 2, 'ginkian');
        ginkians.add(ginkian);
        ginkian.anchor.set(.5, 1);
    };

    var beatRoom = function () {
        redrawScreen(); // Make sure the last paint is displayed

        eventController.trigger('BEAT_ROOM');
        animationScene = true;
        roomComplete = true;

        animateBeatRoom(30, function () {
            nextRoom();
            game.state.start(game.state.current);
        });

        function animateBeatRoom (i, callback) {
            if (i < 0) {
                paintColor = 0xc58917;
                callback();
                return;
            }

            if (i === 0 || i % 4 === 0) {
                paintColor = 0x55ffff;
            } else if (i === 1 || i % 4 === 1) {
                paintColor = 0x00aa00;
            } else if (i === 2 || i % 4 === 2) {
                paintColor = 0xffffff;
            } else if (i === 3 || i % 4 === 3) {
                paintColor = 0xaa0000;
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

    var redrawScreen= function () {
        graphics.clear();
        // TODO: Trigger an event instead
        paint.draw(platformHeight, paintColor, platformVerticalSpacing);
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
                paint.newPaint(platform, player, platformVerticalSpacing);
                return true;
            }
        }
        return false;
    };

    var collidePlayerStonePlatform = function (player, stonePlatform) {
        // Allow player to jump up through the platform
        if (player.body.velocity.y >= 0) {
            return true;
        }
        return false;
    };

    var collidePlayerSignpost = function (player, signpost) {
        return true;
    };

    var collideGrapplePlatform = function (grapple, platform) {
        eventController.trigger('GRAPPLE_HIT_PLATFORM');
    };

    var checkCollisions = function () {
        // Collisions
        game.physics.arcade.collide(player, platforms, null, collidePlayerPlatform);
        game.physics.arcade.collide(player, stonePlatforms, null, collidePlayerStonePlatform);
        game.physics.arcade.collide(player, signposts, null, collidePlayerSignpost);
        game.physics.arcade.collide(grapple, platforms, null, collideGrapplePlatform);
    };
};
