var EventController = function () {
    var subscribers = [],
        eventTypes = [
            /**
             * Movement events
             */
            'BUTTON_LEFT',
            'BUTTON_RIGHT',
            'BUTTON_JUMP',

            /**
             * Player events
             */
            'PLAYER_FALLING',
            'PLAYER_TOUCHING_DOWN',
            'REQUEST_PLAYER_STOP_MOVING',

            /**
             * Grapple events
             */
            'GRAPPLE_AIM',
            'GRAPPLE_SHOOT',
            'GRAPPLE_CANCEL',
            'GRAPPLE_OFF_SCREEN',
            'GRAPPLE_FULLY_RETRACTED',
            'GRAPPLE_ANGLE_LEFT',
            'GRAPPLE_ANGLE_RIGHT',

            /**
             * HUD events
             */
            'UPDATE_HEARTS'
        ];

    var checkEventType = function (event) {
        if (!eventTypes.includes(event)) {
            throw 'Invalid event type: ' + event;
        }
    };

    this.subscribe = function (callback, event) {
        var subscription;

        checkEventType(event);

        subscription = {
            subscriber: callback,
            eventType: event
        };
        subscribers.push(subscription);
    };

    this.unsubscribe = function (callback) {
        var i;
        for (i = 0; i < subscribers.length; i++) {
            if (subscribers[i].subscriber === callback) {
                subscribers.splice(i, 1);
            }
        }
    };

    this.trigger = function (event, data) {
        var i;

        checkEventType(event);

        for (i = 0; i < subscribers.length; i++) {
            if (subscribers[i].eventType === event) {
                subscribers[i].subscriber(event, data);
            }
        }
        
    };
};
