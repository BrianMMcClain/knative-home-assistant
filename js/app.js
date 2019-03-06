var recordButton = document.getElementById('record');
var stopButton = document.getElementById('stop');

recordButton.addEventListener("click", startRecording); 
stopButton.addEventListener("click", stopRecording);

function startRecording() {
    
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
        var audio = new Audio("data:audio/mp3;base64," + response.audio);
        audio.play();
    }

    request.open("POST", "/", false);
    request.send(blob);
}