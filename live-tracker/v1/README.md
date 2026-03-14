# ab-cdn Client SDK

A lightweight JavaScript SDK for tracking live user counts and managing comments/reviews.

## Installation

Include the SDK in your HTML:

```html
<script src="https://your-cdn-url/live-tracker/v1/client.js"></script>
```

## Features

- **Live User Tracking**: Real-time active user count with automatic polling
- **Unique User Tracking**: Track total unique visitors
- **Comment/Review System**: Full CRUD operations for comments and reviews
- **Multi-domain Support**: Isolate data by custom domains
- **Automatic Device ID Management**: Persistent device identification using localStorage

## API Reference

### Live Count Tracking

#### `ab.getLiveCount(options, callback)`

Track live users with automatic polling.

**Example 1: Auto-repeat every 10 seconds (default behavior)**
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

**Example 3: Auto-repeat every 30 seconds with custom domain**
```javascript
ab.getLiveCount({
  interval: 30,
  domain: 'my-custom-domain'
}, function(error, data) {
  if (error) console.error(error);
  else console.log('Live users:', data.count, '| Unique users:', data.uniqueUsers);
});
```

**Example 4: Custom device ID and domain**
```javascript
ab.getLiveCount({
  deviceId: 'my-custom-device-id',
  domain: 'my-custom-domain'
}, function(error, data) {
  if (error) console.error(error);
  else console.log('Live users:', data.count, '| Unique users:', data.uniqueUsers);
});
```

#### `ab.stopLiveCount()`

Stop the active polling interval.

**Example 5: Stop tracking**
```javascript
ab.stopLiveCount();
```

---

### Comment/Review Methods

#### `ab.getComments(options, callback)`

Fetch all comments/reviews.

**Example 6: Fetch all comments**
```javascript
ab.getComments(function(error, data) {
  if (error) console.error(error);
  else console.log('Reviews:', data);
});
```

**Example 7: Fetch comments with custom domain**
```javascript
ab.getComments({ domain: 'my-custom-domain' }, function(error, data) {
  if (error) console.error(error);
  else console.log('Reviews:', data);
});
```

#### `ab.postComment(options, callback)`

Post a new comment/review.

**Required fields:**
- `id` - User/review identifier (string)
- `comment` - Review comment (string, max 1000 characters)
- `name` - Reviewer name (string, max 100 characters)

**Optional fields:**
- `rating` - Rating value (number 1-5, defaults to 5)
- `domain` - Custom domain identifier (string)

**Example 8: Post a new comment**
```javascript
ab.postComment({
  id: 'user123',
  rating: 5,
  comment: 'Great experience!',
  name: 'John Doe'
}, function(error, data) {
  if (error) console.error('Failed to post comment:', error);
  else console.log('Comment posted:', data);
});
```

**Example 9: Post a comment with custom domain**
```javascript
ab.postComment({
  id: 'user123',
  rating: 4,
  comment: 'Very good service',
  name: 'Jane Smith',
  domain: 'my-custom-domain'
}, function(error, data) {
  if (error) console.error('Failed to post comment:', error);
  else console.log('Comment posted:', data);
});
```

**Example 10: Post a comment without rating (defaults to 5)**
```javascript
ab.postComment({
  id: 'user123',
  comment: 'Great service!',
  name: 'Jane Smith'
}, function(error, data) {
  if (error) console.error('Failed to post comment:', error);
  else console.log('Comment posted:', data);
});
```

#### `ab.deleteComment(options, callback)`

Delete a comment/review by ID. **Requires admin authentication token.**

**Required fields:**
- `id` - Review ID to delete (string)
- `token` - Admin authentication token (string)

**Optional fields:**
- `domain` - Custom domain identifier (string)

**Example 11: Delete a comment (admin only)**
```javascript
ab.deleteComment({
  id: 'review-id-123',
  token: 'your-admin-token-here'
}, function(error, data) {
  if (error) console.error('Failed to delete comment:', error);
  else console.log('Comment deleted:', data);
});
```

**Example 12: Delete a comment with custom domain (admin only)**
```javascript
ab.deleteComment({
  id: 'review-id-123',
  token: 'your-admin-token-here',
  domain: 'my-custom-domain'
}, function(error, data) {
  if (error) console.error('Failed to delete comment:', error);
  else console.log('Comment deleted:', data);
});
```

---

## Error Handling

All methods use Node.js-style callbacks with the signature `(error, data)`:

```javascript
function callback(error, data) {
  if (error) {
    // Handle error
    console.error('Error:', error.message);
  } else {
    // Handle success
    console.log('Success:', data);
  }
}
```

### Common Errors

- **Validation Errors**: Missing required fields, invalid values
- **Network Errors**: Connection failures, timeouts
- **Authentication Errors**: Invalid or missing admin token (deleteComment only)
- **HTTP Errors**: Server errors (4xx, 5xx status codes)

---

## Multi-Domain Support

All methods support the optional `domain` parameter to isolate data across different domains or applications:

```javascript
// Track live users for 'app1'
ab.getLiveCount({ domain: 'app1' }, callback);

// Get comments for 'app2'
ab.getComments({ domain: 'app2' }, callback);

// Post comment to 'app3'
ab.postComment({
  id: 'user123',
  comment: 'Great!',
  name: 'John',
  domain: 'app3'
}, callback);
```

---

## Configuration

The SDK connects to the following backend endpoints:

- **Live Count**: `https://spd-election.onrender.com/analytics/live`
- **Unique Users**: `https://spd-election.onrender.com/analytics/users`
- **Reviews**: `https://spd-election.onrender.com/election/reviews`

**Minimum polling interval**: 10 seconds

---

## Browser Support

- Modern browsers with ES5+ support
- Requires `fetch` API (or polyfill for older browsers)
- Uses `localStorage` for device ID persistence (falls back gracefully if unavailable)

---

## License

See the main repository for license information.
