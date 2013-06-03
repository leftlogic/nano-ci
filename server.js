var http = require('http'),
    cicada = require('cicada'),
    ws = require('websocket.io'),
    stream = require('stream'),
    passStream = require('pass-stream');

/**
 * Setup output stream
 */
var output = passStream(),
    buffer = [];

output.on('data', function (data) {
  buffer.push(''+data);
});

output.log = function () {
  var args = [].slice.call(arguments);
  output.write(args.join(' ') + '\n');
};

output.pipe(process.stdout);

/**
 * Setup CI
 */
var ci = cicada('/tmp/nanoci');
ci.on('commit', function (commit) {

  // Run npm install
  output.log('installing...\n');
  var install = commit.spawn('npm install').on('exit', function (code) {
    output.log('done installing:', code);

    if (code !== 0) return output.log(commit.hash + ' FAILED');

    // Then npm test
    var test = commit.run('test').on('exit', function (code) {
      var status = code === 0 ? 'PASSED' : 'FAILED';
      output.log(commit.hash + ' ' + status);
      output.write('Done.\n\n\n\n');
    });
    test.stdout.pipe(output, { end: false });
    test.stderr.pipe(output, { end: false });

  });

  install.stdout.pipe(output, { end: false });
  install.stderr.pipe(output, { end: false });
});

// Star the CI server
var ciServer = http.createServer(ci.handle);
ciServer.listen(5255, function () {
  output.log('nano-ci ready and waiting...');
});

/**
 * Websockets
 * The output from the CI server is piped down the websocket
 */
var wsSever = ws.attach(ciServer);

wsSever.on('connection', function (socket) {
  socket.send(buffer.join(''));
  var send = function (data) {
    socket.send(data);
  };
  output.on('data', send);
  socket.on('close', function () {
    output.removeListener('data', send);
  });
});