# ab-cdn Client SDK

A lightweight JavaScript SDK for tracking live user counts and managing comments/reviews.

## Installation

Include the SDK in your HTML:

```html
<script src="https://cdn.jsdelivr.net/gh/antandbuffalo/ab-cdn@v1.5.0/live-tracker/v1/client.min.js"></script>
```

## Features

- **Live User Tracking**: Real-time active user count with automatic polling
- **Unique User Tracking**: Fetch total unique visitors once per `getLiveCount()` session and reuse it on subsequent polls
- **Comment/Review System**: Post and fetch comments/reviews
- **User Block Check**: Detect if the current device is blocked
- **Pending Comment Check**: Check if the current device has a comment pending moderation
- **Automatic Device ID Management**: Persistent device identification using `localStorage`, with an in-memory fallback

---

## API Reference

### Live Count Tracking

#### `ab.getLiveCount([options], callback)`

Track live users with automatic polling. The first call fetches live count and unique users in parallel, then subsequent polling requests refresh only the live count while reusing the cached `uniqueUsers` value.

**Options:**
- `interval` - Polling interval in seconds. Defaults to `10`.
  Values below `10` are clamped to `10` for polling.
  Pass `0` to make only the initial request and skip repeat polling.
  Numeric strings are accepted and parsed with `parseInt()`.

**Callback data:**
- `count` - Current live user count
- `uniqueUsers` - Total unique users fetched during the initial request

**Example 1: Auto-repeat every 10 seconds (default)**
```javascript
ab.getLiveCount(function(error, data) {
  if (error) console.error(error);
  else console.log('Live users:', data.count, '| Unique users:', data.uniqueUsers);
});
```

**Example 2: Single call only (interval = 0)**
```javascript
ab.getLiveCount({ interval: 0 }, function(error, data) {
  if (error) console.error(error);
  else console.log('Live users:', data.count, '| Unique users:', data.uniqueUsers);
});
```

**Example 3: Auto-repeat every 30 seconds**
```javascript
ab.getLiveCount({ interval: 30 }, function(error, data) {
  if (error) console.error(error);
  else console.log('Live users:', data.count, '| Unique users:', data.uniqueUsers);
});
```

> **Note:** `uniqueUsers` is fetched once at the start and cached for the lifetime of the polling session. Subsequent polling calls will return the same `uniqueUsers` value.

> **Note:** Calling `ab.getLiveCount()` stops any previous live-count polling session before starting a new one.

#### `ab.stopLiveCount()`

Stop the active polling interval.

```javascript
ab.stopLiveCount();
```

---

### Comment/Review Methods

#### `ab.getComments(callback)`

Fetch all comments/reviews with a `GET` request to the comments endpoint.

```javascript
ab.getComments(function(error, data) {
  if (error) console.error(error);
  else console.log('Reviews:', data);
});
```

#### `ab.postComment(options, callback)`

Post a new comment/review.

**Required fields:**
- `comment` - Review comment (string, max 1000 characters)
- `name` - Reviewer name (string, max 50 characters)

**Behavior:**
- `comment` and `name` are trimmed before submission
- `comment` and `name` are sanitized before being sent
- The current device ID is included automatically

**Example: Post a comment**
```javascript
ab.postComment({
  comment: 'Great experience!',
  name: 'John Doe'
}, function(error, data) {
  if (error) console.error('Failed to post comment:', error);
  else console.log('Comment posted:', data);
});
```

---

### User Block Check

#### `ab.isUserBlocked(callback)`

Check if the current device is blocked. The callback receives `data.isBlocked` as a boolean.

```javascript
ab.isUserBlocked(function(error, isBlocked) {
  if (error) console.error(error);
  else if (isBlocked) console.log('User is blocked');
  else console.log('User is not blocked');
});
```

#### `ab.hasPendingComment(callback)`

Check if the current device has a comment pending moderation. The callback receives `data.hasPending` as a boolean.

```javascript
ab.hasPendingComment(function(error, hasPending) {
  if (error) console.error(error);
  else if (hasPending) console.log('Review is pending moderation');
  else console.log('No pending review');
});
```

---

## Error Handling

All methods use Node.js-style callbacks with the signature `(error, data)`:

```javascript
function callback(error, data) {
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Success:', data);
  }
}
```

### Common Errors

- **Validation Errors**: Missing required fields, invalid values
- **Network Errors**: Connection failures, timeouts
- **HTTP Errors**: Server errors (4xx, 5xx status codes)

---

## Configuration

The SDK connects to the following backend endpoints:

- **Live Count**: `https://spd-election.onrender.com/analytics/live`
- **Unique Users**: `https://spd-election.onrender.com/analytics/users`
- **Comments**: `https://spd-election.onrender.com/comments`
- **Blocked Users**: `https://spd-election.onrender.com/users/blocked`
- **Pending Comment Status**: `https://spd-election.onrender.com/comments/pending-status`

**Minimum polling interval**: 10 seconds

---

## Browser Support

- Modern browsers with ES5+ support
- Requires `fetch` API (or polyfill for older browsers)
- Uses `localStorage` for device ID persistence when available
- Falls back to an in-memory generated device ID if `localStorage` is unavailable

---

## License

See the main repository for license information.
