(function (window) {

  // let's start test
  fetch('http://localhost:3700/test')
    .then((res) => res.json())
    .then((res) => {
      var port = res.port;
      var questions = res.questions;
      var client = new BinaryClient('ws://localhost:' + port); // open connection to given port
      client.on('open', () => { // when connection was opened successfully

        // create promise chain -- sequntial proccessRecording for each question;
        questions.reduce((chain, current) => {
          return chain.then(() => {

            document.getElementById('current-question').innerHTML = "Current Question Id: " + current.id;

            return proccessRecording(client, current);
          })
        }, Promise.resolve())
          .then(() => {
            client.close();
          });
      })
    });


  function proccessRecording(client, question) {

    var Stream; 

    return new Promise ((resolve, reject) => {
        Stream = client.createStream({ question: question }); // create stream and pass meta.
        var endAudioInputCb; // cb to end audio record in browser

        if (!navigator.getUserMedia)
          navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia || navigator.msGetUserMedia;

        if (navigator.getUserMedia) {
          navigator.getUserMedia({ audio: true }, function (e) {            
            endAudioInputCb = startAudioRecord(e);            
          }, function (e) {
            alert('Error capturing audio.');
          });
        } else alert('getUserMedia not supported in this browser.');

        var recording = false;

        var startRecording = function () {
          recording = true;
        }

        var stopRecording = function () {
          recording = false;
          endAudioInputCb();
          Stream.end();
          resolve('end'); // resolve promise
        }

        document.getElementById('start').onclick = startRecording; // just buttons binding
        document.getElementById('end').onclick = stopRecording; // just buttons binding

        function startAudioRecord(e) {          
          audioContext = window.AudioContext || window.webkitAudioContext;
          context = new audioContext();

          audioInput = context.createMediaStreamSource(e);

          var bufferSize = 2048;
          recorder = context.createScriptProcessor(bufferSize, 1, 1);

          recorder.onaudioprocess = function (e) {            
            if (!recording) return;
            console.log('recording');
            var leftChannel = e.inputBuffer.getChannelData(0);
            Stream.write(convertoFloat32ToInt16(leftChannel));
          }

          audioInput.connect(recorder)
          recorder.connect(context.destination);

          function onEnd () {
            audioInput.disconnect(recorder);
            recorder.disconnect(context.destination);
          }
          return onEnd;
        }

        function convertoFloat32ToInt16(buffer) {
          var length = buffer.length;
          var buf = new Int16Array(length)

          while (length--) {
            buf[length] = buffer[length] * 0xFFFF;    //convert to 16 bit
          }
          return buf.buffer
        }
      });
  }

})(this);
