(function (window) {
    // Initialize 'ab' namespace if it doesn't exist yet
    var ab = window.ab || {};

    // Configuration
    var CONFIG = {
        liveUrl: 'https://spd-election.onrender.com/analytics/live',
        usersUrl: 'https://spd-election.onrender.com/analytics/users',
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

    // Expose ab globally
    window.ab = ab;

})(window);

// Example usage:

// 1. Auto-repeat every 10 seconds (default behavior):
// ab.getLiveCount(function(error, data) {
//   if (error) console.error(error);
//   else console.log('Live users:', data.count, '| Unique users:', data.uniqueUsers);
// });

// 2. Single call only (interval = 0):
// ab.getLiveCount({ interval: 0 }, function(error, data) {
//   if (error) console.error(error);
//   else console.log('Live users:', data.count, '| Unique users:', data.uniqueUsers);
// });

// 3. Auto-repeat every 30 seconds with custom domain:
// ab.getLiveCount({ 
//   interval: 30,
//   domain: 'my-custom-domain'
// }, function(error, data) {
//   if (error) console.error(error);
//   else console.log('Live users:', data.count, '| Unique users:', data.uniqueUsers);
// });

// 4. Custom device ID and domain:
// ab.getLiveCount({
//   deviceId: 'my-custom-device-id',
//   domain: 'my-custom-domain'
// }, function(error, data) {
//   if (error) console.error(error);
//   else console.log('Live users:', data.count, '| Unique users:', data.uniqueUsers);
// });

// 5. Stop tracking:
// ab.stopLiveCount();
