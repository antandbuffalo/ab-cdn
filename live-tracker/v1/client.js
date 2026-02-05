(function(window) {
    // Initialize 'ab' namespace if it doesn't exist yet
    var ab = window.ab || {};
    
    // Configuration
    var CONFIG = {
        url: 'https://spd-election.onrender.com/analytics/live',
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

    function makeRequest(deviceId) {
        return fetch(CONFIG.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deviceId: deviceId })
        }).then(function(response) {
            if (!response.ok) throw new Error('HTTP ' + response.status);
            return response.json();
        });
    }

    // Stop any active polling
    ab.stopLiveCount = function() {
        if (activeInterval) {
            clearInterval(activeInterval);
            activeInterval = null;
        }
    };

    ab.getLiveCount = function(arg1, arg2, arg3) {
        // Normalize arguments
        var deviceId, callback, interval;

        // Handle polymorphic arguments
        if (typeof arg1 === 'function') {
            // usage: getLiveCount(callback, interval)
            callback = arg1;
            interval = arg2;
            deviceId = getOrGenerateDeviceId();
        } else {
            // usage: getLiveCount(deviceId, callback, interval)
            deviceId = arg1 || getOrGenerateDeviceId();
            callback = arg2;
            interval = arg3;
        }

        // Clear any existing interval before starting a new one
        ab.stopLiveCount();

        // Helper to run request and handle callback
        function run() {
            makeRequest(deviceId)
                .then(function(data) {
                    if (callback) callback(null, data);
                })
                .catch(function(err) {
                    if (callback) callback(err, null);
                });
        }

        // Execute immediately
        run();

        // Handle interval parameter
        // - undefined: default to 10 seconds
        // - 0: single invocation only (no polling)
        // - > 0: use provided interval (minimum 10 seconds)
        if (interval === 0) {
            // Single invocation only, no polling
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

        activeInterval = setInterval(run, intervalSeconds * 1000);
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
// ab.getLiveCount(function(error, data) {
//   if (error) console.error(error);
//   else console.log('Live count:', data.count);
// }, 0);

// 3. Auto-repeat every 30 seconds:
// ab.getLiveCount(function(error, data) {
//   if (error) console.error(error);
//   else console.log('Live count:', data.count);
// }, 30);

// 4. Auto-repeat every 30 seconds with custom device ID:
// ab.getLiveCount('my-custom-device-id', function(error, data) {
//   if (error) console.error(error);
//   else console.log('Live count:', data.count);
// }, 30);

// 5. Stop tracking:
// ab.stopLiveCount();
