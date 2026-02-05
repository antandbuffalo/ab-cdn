// Initialize 'ab' namespace if it doesn't exist yet .
var ab = window.ab || {};

ab.getLiveCount = (function () {
    // Update this to your real server URL
    var LIVE_API_URL = 'https://spd-election.onrender.com/analytics/live';

    function getOrGenerateDeviceId() {
        var key = '_ab_device_id';
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
    }

    return function (deviceId, callback) {
        // Handle polymorphic arguments
        if (typeof deviceId === 'function') {
            callback = deviceId;
            deviceId = getOrGenerateDeviceId();
        } else if (!deviceId) {
            deviceId = getOrGenerateDeviceId();
        }

        // Using Fetch (cleaner, supported in all modern browsers)
        fetch(LIVE_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deviceId: deviceId })
        })
            .then(function (response) {
                if (!response.ok) throw new Error('HTTP ' + response.status);
                return response.json();
            })
            .then(function (data) {
                callback(null, data);
            })
            .catch(function (error) {
                callback(error, null);
            });
    };
})();

// Expose ab globally
window.ab = ab;

// Example usage:
// ab.getLiveCount('my-device-id', function(error, data) {
//   if (error) {
//     console.error('Error:', error);
//   } else {
//     console.log('Live count:', data.count);
//   }
// });

// Or with auto-generated device ID:
// ab.getLiveCount(function(error, data) {
//   if (error) {
//     console.error('Error:', error);
//   } else {
//     console.log('Live count:', data.count);
//   }
// });
