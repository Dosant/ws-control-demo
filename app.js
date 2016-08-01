var express = require('express');
var BinaryServer = require('binaryjs').BinaryServer;
var fs = require('fs');
var wav = require('wav');

var port = 3700;
var outFile = 'demo.wav';
var app = express();

app.set('views', __dirname + '/tpl');
app.set('view engine', 'jade');
app.engine('jade', require('jade').__express);
app.use(express.static(__dirname + '/public'))

app.get('/', function(req, res){
  res.render('index');
});

app.listen(port);
console.log('server listens port ' + port);

function randomPort() {
  return +((Math.random() / 2) * 100000 + 8000).toFixed();
}

app.get('/test', function(req, res) {
  // start server for request;   
  var port = randomPort();
  binaryServer = BinaryServer({port: port});

  // return questions and port for sending audio
  res.json({
    port: port,
    questions: [
      {id: 1},
      {id: 2},
      {id: 3}
    ]
  });
  binaryServer.on('connection', function(client) {
  console.log('new connection opened on port: ' + port);

  // connection open: send response;
  client.on('stream', function(stream, meta) {        
    
    console.log('new stream started for id: ' + meta.question.id);
    
    var fileWriter = new wav.FileWriter(meta.question.id + '-' + outFile, {
      channels: 1,
      sampleRate: 48000,
      bitDepth: 16
    });
    

    // wring stream  
    stream.pipe(fileWriter);

    stream.on('end', function() {
      fileWriter.end();
      console.log('wrote to file ' + outFile);
    });
  });

  client.on('close', function() {      
      console.log('closing client and server');
      try {
        binaryServer.close();
      } catch (err) {
        // nothing to close
      }    
  })

});
});



