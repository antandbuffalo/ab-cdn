(function (window) {
    // Initialize 'ab' namespace if it doesn't exist yet
    var ab = window.ab || {};

    // Configuration
    var CONFIG = {
        liveUrl: 'https://spd-election.onrender.com/analytics/live',
        usersUrl: 'https://spd-election.onrender.com/analytics/users',
        reviewsUrl: 'https://spd-election.onrender.com/election/reviews',
        minInterval: 10
    };

    var activeInterval = null;
    var cachedUniqueUsers = null;
    var isStopped = false;

    function getOrGenerateDeviceId() {
        var key = '_ab_device_id';
        try {
            var id = localStorage.getItem(key);
            if (!id) {
                // Use crypto.randomUUID() if available, fallback to random string
                if (typeof crypto !== 'undefined' && crypto.randomUUID) {
                    id = crypto.randomUUID();
                } else {
                    id = 'dev_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
                }
                localStorage.setItem(key, id);
            }
            return id;
        } catch (e) {
            // Fallback if localStorage is disabled/inaccessible (e.g. private browsing)
            return 'dev_temp_' + Date.now();
        }
    }

    function makeRequest(config) {
        var headers = { 'Content-Type': 'application/json' };
        if (config.domain) {
            headers['x-domain'] = config.domain;
        }

        return fetch(CONFIG.liveUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ deviceId: config.deviceId })
        }).then(function (response) {
            if (!response.ok) throw new Error('HTTP ' + response.status);
            return response.json();
        });
    }

    function makeUsersRequest(config) {
        var headers = { 'Content-Type': 'application/json' };
        if (config.domain) {
            headers['x-domain'] = config.domain;
        }

        return fetch(CONFIG.usersUrl, {
            method: 'POST',
            headers: headers,
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

        var deviceId = (options.deviceId && options.deviceId.trim()) || getOrGenerateDeviceId();
        var interval = options.interval;
        var domain = options.domain;

        var config = {
            deviceId: deviceId,
            domain: domain
        };

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
                    activeInterval = setTimeout(runWithInterval, intervalSeconds * 1000);
                });
        }

        // Fetch unique users first, then start live polling once resolved
        makeUsersRequest(config)
            .then(function (data) {
                cachedUniqueUsers = data.count;
            })
            .catch(function (err) {
                console.error('Users API error:', err);
            })
            .finally(function () {
                if (isStopped) return;

                if (interval === 0) {
                    makeRequest(config)
                        .then(function (data) {
                            if (callback) callback(null, Object.assign({}, data, { uniqueUsers: cachedUniqueUsers }));
                        })
                        .catch(function (err) {
                            if (callback) callback(err, null);
                        });
                } else {
                    runWithInterval();
                }
            });
    };

    // Fetch all comments/reviews
    ab.getComments = function (options, callback) {
        // Handle optional options if first arg is callback
        if (typeof options === 'function') {
            callback = options;
            options = {};
        }
        options = options || {};

        var headers = { 'Content-Type': 'application/json' };
        if (options.domain) {
            headers['x-domain'] = options.domain;
        }

        fetch(CONFIG.reviewsUrl, {
            method: 'GET',
            headers: headers
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

        // Validate required fields
        if (!options.id || typeof options.id !== 'string' || !options.id.trim()) {
            if (callback) callback(new Error('id is required and must be a non-empty string'), null);
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
        if (options.name.length > 100) {
            if (callback) callback(new Error('name must not exceed 100 characters'), null);
            return;
        }

        var headers = { 'Content-Type': 'application/json' };
        if (options.domain) {
            headers['x-domain'] = options.domain;
        }

        var deviceId = (options.deviceId && options.deviceId.trim()) || getOrGenerateDeviceId();

        var body = {
            id: options.id.trim(),
            rating: rating,
            comment: options.comment.trim(),
            name: options.name.trim(),
            deviceId: deviceId
        };

        fetch(CONFIG.reviewsUrl, {
            method: 'POST',
            headers: headers,
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

    // Delete a comment/review (admin only)
    ab.deleteComment = function (options, callback) {
        if (!options || typeof options !== 'object') {
            if (callback) callback(new Error('Options object is required'), null);
            return;
        }

        // Validate required fields
        if (!options.id || typeof options.id !== 'string' || !options.id.trim()) {
            if (callback) callback(new Error('id is required and must be a non-empty string'), null);
            return;
        }
        if (!options.token || typeof options.token !== 'string' || !options.token.trim()) {
            if (callback) callback(new Error('token is required for authentication'), null);
            return;
        }

        var headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + options.token
        };
        if (options.domain) {
            headers['x-domain'] = options.domain;
        }

        var body = {
            id: options.id.trim()
        };

        fetch(CONFIG.reviewsUrl, {
            method: 'DELETE',
            headers: headers,
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

    // Expose ab globally
    window.ab = ab;

})(window);
