# tiny-ci

A really small integration test server with Websocket streaming.

1. Push your repo to it
2. It runs `npm install`
3. Then runs `npm test`

The output of these is streamed to any connected Websockets.

```javascript
var socket = new WebSocket("ws://localhost:5255/");

socket.onopen = function() {
  console.log('connected');
};

socket.onmessage = function(message) {
  console.log(message);
};

socket.onclose = function() {
  console.log('disconnected');
};
```

## License

MIT