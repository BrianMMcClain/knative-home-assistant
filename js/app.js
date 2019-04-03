var recordButton = document.getElementById('record');
var stopButton = document.getElementById('stop');
var pauseButton = document.getElementById('pause');
var textButton = document.getElementById('textButton');
var textInput = document.getElementById('queryText');

// Submit query on <ENTER>
textInput.addEventListener("keyup", function(event) {
  if (event.keyCode === 13) {
    event.preventDefault();
    document.getElementById("textButton").click();
  }
});


var audio = new Audio();

recordButton.addEventListener("click", startRecording); 
stopButton.addEventListener("click", stopRecording);
pauseButton.addEventListener("click", pauseAudio);
textButton.addEventListener("click", submitText);

function pauseAudio() {
    pauseButton.disabled = true;
    audio.pause();
}

function disablePause() {
    pauseButton.disabled = true;
}

function startRecording() {
    
    pauseAudio();

    var constraints = {
        audio: true,
        video: false
    }
    
    navigator.mediaDevices.getUserMedia(constraints).then(
        function(stream) {
            audioContext = new AudioContext({
                latencyHint: "playback",
                sampleRate: 48000
              });

            gumStream = stream;
            input = audioContext.createMediaStreamSource(stream);

            encodingType = "wav";
            recorder = new WebAudioRecorder(input, {
                workerDir: "js/",
                encoding: encodingType,
                numChannels: 1,
            });
            recorder.onComplete = function(recorder, blob) {
                uploadRecording(blob);
            }
            recorder.setOptions({
                timeLimit: 120,
                encodeAfterRecord: true,
                ogg: { quality: 0.5 }
            });
            recorder.startRecording();
        }).catch(function(err) { 
            console.log(err);
        recordButton.disabled = false;
        stopButton.disabled = true;
    }); 

    recordButton.disabled = true;
    stopButton.disabled = false;
}

function stopRecording() {
    gumStream.getAudioTracks()[0].stop();
    stopButton.disabled = true;
    recordButton.disabled = false;
    recorder.finishRecording();
}

function uploadRecording(blob) {
    var request = new XMLHttpRequest();

    request.onload = function() {
        //console.log(request);
        var response = JSON.parse(request.response);
        document.getElementById('responseObj').innerHTML = response.text;
        audio = new Audio("data:audio/mp3;base64," + response.audio);
        audio.addEventListener("ended", disablePause);
        pauseButton.disabled = false;
        audio.play();
    }

    request.open("POST", "/", false);
    request.send(blob);
}

function submitText() {
    var request = new XMLHttpRequest();

    request.onload = function() {
        var response = JSON.parse(request.response);
        document.getElementById('responseObj').innerHTML = response.text;
        audio = new Audio("data:audio/mp3;base64," + response.audio);
        audio.addEventListener("ended", disablePause);
        pauseButton.disabled = false;
        audio.play();
    }

    request.open("POST", "/text", true);
    request.send(textInput.value)
}