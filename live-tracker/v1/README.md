# ab-cdn Client SDK

A lightweight JavaScript SDK for tracking live user counts and managing comments/reviews.

## Installation

Include the SDK in your HTML:

```html
<script src="https://cdn.jsdelivr.net/gh/antandbuffalo/ab-cdn@v1.4.0/live-tracker/v1/client.js"></script>
```

## Features

- **Live User Tracking**: Real-time active user count with automatic polling
- **Unique User Tracking**: Track total unique visitors (fetched once at start)
- **Comment/Review System**: Post and fetch comments/reviews
- **User Block Check**: Detect if the current device is blocked
- **Pending Review Check**: Check if the current device has a comment pending moderation
- **Automatic Device ID Management**: Persistent device identification using localStorage

---

## API Reference

### Live Count Tracking

#### `ab.getLiveCount(options, callback)`

Track live users with automatic polling.

**Options:**
- `interval` - Polling interval in seconds (number, minimum 10, default 10). Pass `0` to disable polling.

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

#### `ab.stopLiveCount()`

Stop the active polling interval.

```javascript
ab.stopLiveCount();
```

---

### Comment/Review Methods

#### `ab.getComments(callback)`

Fetch all comments/reviews.

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

**Optional fields:**
- `rating` - Rating value (number 1-5, defaults to 5)

**Example: Post a comment**
```javascript
ab.postComment({
  rating: 5,
  comment: 'Great experience!',
  name: 'John Doe'
}, function(error, data) {
  if (error) console.error('Failed to post comment:', error);
  else console.log('Comment posted:', data);
});
```

**Example: Post without rating (defaults to 5)**
```javascript
ab.postComment({
  comment: 'Great service!',
  name: 'Jane Smith'
}, function(error, data) {
  if (error) console.error('Failed to post comment:', error);
  else console.log('Comment posted:', data);
});
```

---

### User Block Check

#### `ab.isUserBlocked(callback)`

Check if the current device is blocked. The callback receives a boolean.

```javascript
ab.isUserBlocked(function(error, isBlocked) {
  if (error) console.error(error);
  else if (isBlocked) console.log('User is blocked');
  else console.log('User is not blocked');
});
```

#### `ab.hasPendingReview(callback)`

Check if the current device has a comment pending moderation. The callback receives a boolean.

```javascript
ab.hasPendingReview(function(error, hasPending) {
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
- **Reviews**: `https://spd-election.onrender.com/election/reviews`
- **Blocked Users**: `https://spd-election.onrender.com/users/blocked`
- **Pending Review Status**: `https://spd-election.onrender.com/election/reviews/pending-status`

**Minimum polling interval**: 10 seconds

---

## Browser Support

- Modern browsers with ES5+ support
- Requires `fetch` API (or polyfill for older browsers)
- Uses `localStorage` for device ID persistence (falls back gracefully if unavailable)

---

## License

See the main repository for license information.
