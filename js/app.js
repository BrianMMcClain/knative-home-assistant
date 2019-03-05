var encodeAfterRecord = true;

var recordButton = document.getElementById('record');
var stopButton = document.getElementById('stop');

recordButton.addEventListener("click", startRecording); 
stopButton.addEventListener("click", stopRecording);

//var AudioContext = window.AudioContext || window.webkitAudioContext;

function startRecording() {
    console.log("starting recording");
    var constraints = {
        audio: true,
        video: false
    }
    /* We're using the standard promise based getUserMedia() https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia */
    navigator.mediaDevices.getUserMedia(constraints).then(
        function(stream) {
            console.log("getUserMedia() success, stream created, initializing WebAudioRecorder...");
            audioContext = new AudioContext({
                latencyHint: "playback",
                sampleRate: 48000
              });
            console.log(audioContext.sampleRate);
            //assign to gumStream for later use 
            gumStream = stream;
            /* use the stream */
            input = audioContext.createMediaStreamSource(stream);
            //get the encoding 
            encodingType = "wav";
            recorder = new WebAudioRecorder(input, {
                workerDir: "js/",
                encoding: encodingType,
                numChannels: 1,
                onEncoderLoading: function(recorder, encoding) {
                    // show "loading encoder..." display 
                    console.log("Loading " + encoding + " encoder...");
                },
                onEncoderLoaded: function(recorder, encoding) {
                    // hide "loading encoder..." display 
                    console.log(encoding + " encoder loaded");
                }
            });
            console.log("Created recorder");
            recorder.onComplete = function(recorder, blob) {
                console.log("Encoding complete");
                // Call upload function
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
            //start the recording process 
            console.log("Starting recorder");
            recorder.startRecording();
            console.log("Recording started");
        }).catch(function(err) { //enable the record button if getUSerMedia() fails 
            console.log(err)
        recordButton.disabled = false;
        stopButton.disabled = true;
    }); 
    //disable the record button 
    recordButton.disabled = true;
    stopButton.disabled = false;
}

function stopRecording() {
    console.log("stopRecording() called");
    //stop microphone access 
    gumStream.getAudioTracks()[0].stop();
    //disable the stop button 
    stopButton.disabled = true;
    recordButton.disabled = false;
    //tell the recorder to finish the recording (stop recording + encode the recorded audio) 
    recorder.finishRecording();
    console.log('Recording stopped');
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