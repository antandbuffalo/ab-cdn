(function (window) {
    // Initialize 'ab' namespace if it doesn't exist yet
    var ab = window.ab || {};

    // Configuration
    var CONFIG = {
        baseUrl: 'https://spd-election.onrender.com',
        paths: {
            live: '/analytics/live',
            users: '/analytics/users',
            reviews: '/election/reviews',
            usersBlocked: '/users/blocked'
        },
        minInterval: 10
    };

    var activeInterval = null;
    var cachedUniqueUsers = null;
    var isStopped = false;
    var cachedDeviceId = null;

    function getOrGenerateDeviceId() {
        if (cachedDeviceId) return cachedDeviceId;

        var key = '_ab_device_id';
        try {
            var id = localStorage.getItem(key);
            if (!id) {
                // Use crypto.randomUUID() if available, fallback to random string
                if (typeof crypto !== 'undefined' && crypto.randomUUID) {
                    id = crypto.randomUUID();
                } else {
                    id = 'ab_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
                }
                localStorage.setItem(key, id);
            }
            cachedDeviceId = id;
            return id;
        } catch (e) {
            // Fallback if localStorage is disabled/inaccessible (e.g. private browsing)
            cachedDeviceId = 'ab_' + Date.now();
            return cachedDeviceId;
        }
    }

    function makeRequest(config) {
        return fetch(CONFIG.baseUrl + CONFIG.paths.live, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deviceId: config.deviceId })
        }).then(function (response) {
            if (!response.ok) throw new Error('HTTP ' + response.status);
            return response.json();
        });
    }

    function makeUsersRequest(config) {
        return fetch(CONFIG.baseUrl + CONFIG.paths.users, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deviceId: config.deviceId })
        }).then(function (response) {
            if (!response.ok) throw new Error('HTTP ' + response.status);
            return response.json();
        });
    }

    // Stop any active polling
    ab.stopLiveCount = function () {
        isStopped = true;
        if (activeInterval) {
            clearTimeout(activeInterval);
            activeInterval = null;
        }
    };

    ab.getLiveCount = function (options, callback) {
        // Handle optional options if first arg is callback
        if (typeof options === 'function') {
            callback = options;
            options = {};
        }
        options = options || {};

        var deviceId = getOrGenerateDeviceId();
        var interval = options.interval;
        if (interval !== undefined && typeof interval !== 'number') {
            interval = parseInt(interval, 10);
            if (isNaN(interval)) interval = undefined;
        }

        var config = { deviceId: deviceId };

        // Clear any existing interval before starting a new one
        ab.stopLiveCount();
        isStopped = false; // Reset flag for new session

        var intervalSeconds;
        if (interval === undefined) {
            intervalSeconds = CONFIG.minInterval;
        } else {
            intervalSeconds = Math.max(interval, CONFIG.minInterval);
            if (interval < CONFIG.minInterval) {
                console.warn('Interval clamped to minimum ' + CONFIG.minInterval + 's');
            }
        }

        function runWithInterval() {
            makeRequest(config)
                .then(function (data) {
                    if (callback) callback(null, Object.assign({}, data, { uniqueUsers: cachedUniqueUsers }));
                })
                .catch(function (err) {
                    if (callback) callback(err, null);
                })
                .finally(function () {
                    if (isStopped) return;
                    activeInterval = setTimeout(runWithInterval, intervalSeconds * 1000);
                });
        }

        // Fetch live count and unique users in parallel
        Promise.all([makeRequest(config), makeUsersRequest(config)])
            .then(function (results) {
                cachedUniqueUsers = results[1].count;
                if (callback) callback(null, Object.assign({}, results[0], { uniqueUsers: cachedUniqueUsers }));
            })
            .catch(function (err) {
                if (callback) callback(err, null);
            })
            .finally(function () {
                if (isStopped) return;
                if (interval !== 0) {
                    activeInterval = setTimeout(runWithInterval, intervalSeconds * 1000);
                }
            });
    };

    // Fetch all comments/reviews
    ab.getComments = function (callback) {
        fetch(CONFIG.baseUrl + CONFIG.paths.reviews, {
            method: 'GET'
        })
            .then(function (response) {
                if (!response.ok) throw new Error('HTTP ' + response.status);
                return response.json();
            })
            .then(function (data) {
                if (callback) callback(null, data);
            })
            .catch(function (err) {
                if (callback) callback(err, null);
            });
    };

    // Post a new comment/review
    ab.postComment = function (options, callback) {
        if (!options || typeof options !== 'object') {
            if (callback) callback(new Error('Options object is required'), null);
            return;
        }

        // Rating is optional, defaults to 5
        var rating = options.rating !== undefined ? options.rating : 5;
        if (typeof rating !== 'number' || rating < 1 || rating > 5) {
            if (callback) callback(new Error('rating must be a number between 1-5'), null);
            return;
        }

        if (!options.comment || typeof options.comment !== 'string' || !options.comment.trim()) {
            if (callback) callback(new Error('comment is required and must be a non-empty string'), null);
            return;
        }
        if (options.comment.length > 1000) {
            if (callback) callback(new Error('comment must not exceed 1000 characters'), null);
            return;
        }
        if (!options.name || typeof options.name !== 'string' || !options.name.trim()) {
            if (callback) callback(new Error('name is required and must be a non-empty string'), null);
            return;
        }
        if (options.name.length > 50) {
            if (callback) callback(new Error('name must not exceed 50 characters'), null);
            return;
        }

        var deviceId = getOrGenerateDeviceId();

        var body = {
            rating: rating,
            comment: options.comment.trim(),
            name: options.name.trim(),
            deviceId: deviceId
        };

        fetch(CONFIG.baseUrl + CONFIG.paths.reviews, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        })
            .then(function (response) {
                if (!response.ok) throw new Error('HTTP ' + response.status);
                return response.json();
            })
            .then(function (data) {
                if (callback) callback(null, data);
            })
            .catch(function (err) {
                if (callback) callback(err, null);
            });
    };

    // Check if a device is blocked
    ab.isUserBlocked = function (callback) {
        var deviceId = getOrGenerateDeviceId();

        fetch(CONFIG.baseUrl + CONFIG.paths.usersBlocked + '/' + encodeURIComponent(deviceId), {
            method: 'GET'
        })
            .then(function (response) {
                if (!response.ok) throw new Error('HTTP ' + response.status);
                return response.json();
            })
            .then(function (data) {
                if (callback) callback(null, data.data);
            })
            .catch(function (err) {
                if (callback) callback(err, null);
            });
    };

    // Expose ab globally
    window.ab = ab;

})(window);
