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
        if (config.origin) {
            headers['x-origin'] = config.origin;
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
        if (config.origin) {
            headers['x-origin'] = config.origin;
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
        var origin = options.origin;

        var config = {
            deviceId: deviceId,
            origin: origin
        };

        // Clear any existing interval before starting a new one
        ab.stopLiveCount();

        // Make one-time call to users API
        makeUsersRequest(config)
            .then(function (data) {
                // Users count received, data.count available
                console.log('Users API called successfully');
            })
            .catch(function (err) {
                console.error('Users API error:', err);
            });

        // Handle interval parameter
        // - undefined: default to 10 seconds
        // - 0: single invocation only (no polling)
        // - > 0: use provided interval (minimum 10 seconds)
        if (interval === 0) {
            // Single invocation only, no polling
            makeRequest(config)
                .then(function (data) {
                    if (callback) callback(null, data);
                })
                .catch(function (err) {
                    if (callback) callback(err, null);
                });
            return;
        }

        var intervalSeconds;
        if (interval === undefined) {
            // Default to minimum interval if not specified
            intervalSeconds = CONFIG.minInterval;
        } else {
            // Use provided interval, enforce minimum
            intervalSeconds = Math.max(interval, CONFIG.minInterval);
            if (interval < CONFIG.minInterval) {
                console.warn('Interval clamped to minimum ' + CONFIG.minInterval + 's');
            }
        }

        // Recursive function that waits for each request to complete before scheduling the next
        function runWithInterval() {
            makeRequest(config)
                .then(function (data) {
                    if (callback) callback(null, data);
                })
                .catch(function (err) {
                    if (callback) callback(err, null);
                })
                .finally(function () {
                    // Schedule next request after current one completes (success or failure)
                    activeInterval = setTimeout(runWithInterval, intervalSeconds * 1000);
                });
        }

        // Start the polling cycle
        runWithInterval();
    };

    // Expose ab globally
    window.ab = ab;

})(window);

// Example usage:

// 1. Auto-repeat every 10 seconds (default behavior):
// ab.getLiveCount(function(error, data) {
//   if (error) console.error(error);
//   else console.log('Live count:', data.count);
// });

// 2. Single call only (interval = 0):
// ab.getLiveCount({ interval: 0 }, function(error, data) {
//   if (error) console.error(error);
//   else console.log('Live count:', data.count);
// });

// 3. Auto-repeat every 30 seconds with custom origin:
// ab.getLiveCount({ 
//   interval: 30,
//   origin: 'my-custom-origin'
// }, function(error, data) {
//   if (error) console.error(error);
//   else console.log('Live count:', data.count);
// });

// 4. Custom device ID and origin:
// ab.getLiveCount({
//   deviceId: 'my-custom-device-id',
//   origin: 'my-custom-origin'
// }, function(error, data) {
//   if (error) console.error(error);
//   else console.log('Live count:', data.count);
// });

// 5. Stop tracking:
// ab.stopLiveCount();
