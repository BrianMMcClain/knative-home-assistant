var encodeAfterRecord = true;

var recordButton = document.getElementById('record');
var stopButton = document.getElementById('stop');

recordButton.addEventListener("click", startRecording); 
stopButton.addEventListener("click", stopRecording);

function startRecording() {
    //console.log("starting recording");
    var constraints = {
        audio: true,
        video: false
    }
    
    navigator.mediaDevices.getUserMedia(constraints).then(
        function(stream) {
            //console.log("getUserMedia() success, stream created, initializing WebAudioRecorder...");
            audioContext = new AudioContext({
                latencyHint: "playback",
                sampleRate: 48000
              });
            //console.log(audioContext.sampleRate);

            gumStream = stream;
            input = audioContext.createMediaStreamSource(stream);

            encodingType = "wav";
            recorder = new WebAudioRecorder(input, {
                workerDir: "js/",
                encoding: encodingType,
                numChannels: 1,
            });
            //console.log("Created recorder");
            recorder.onComplete = function(recorder, blob) {
                //console.log("Encoding complete");
                uploadRecording(blob);
            }
            recorder.setOptions({
                timeLimit: 120,
                encodeAfterRecord: encodeAfterRecord,
                ogg: {
                    quality: 0.5
                },
                mp3: {
                    bitRate: 160
                }
            });
            //console.log("Starting recorder");
            recorder.startRecording();
            //console.log("Recording started");
        }).catch(function(err) { 
            console.log(err)
        recordButton.disabled = false;
        stopButton.disabled = true;
    }); 

    recordButton.disabled = true;
    stopButton.disabled = false;
}

function stopRecording() {
    //console.log("stopRecording() called");

    gumStream.getAudioTracks()[0].stop();
    stopButton.disabled = true;
    recordButton.disabled = false;
    recorder.finishRecording();

    //console.log('Recording stopped');
}

function uploadRecording(blob) {
    console.log("Uploading recording");
    var request = new XMLHttpRequest();

    request.onload = function() {
        console.log(request);
        document.getElementById('responseObj').innerHTML = request.responseText;
        var audio = new Audio('./output.mp3');
        audio.play();
    }

    request.open("POST", "/", false);
    request.send(blob);
}