require 'sinatra'
require "google/cloud/speech"
require "google/cloud/text_to_speech"
require "google/cloud/dialogflow"

def textToSpeech(inputString)
    client = Google::Cloud::TextToSpeech.new
    synthesis_input = { text: inputString }
    voice = {
        language_code: "en-US",
        ssml_gender:   "NEUTRAL"
    }
    audio_config = { audio_encoding: "MP3" }
    response = client.synthesize_speech synthesis_input, voice, audio_config
    File.open("output.mp3", "wb") do |file|
        # Write the response to the output file.
        file.write(response.audio_content)
    end  
end

post '/' do
    c = request.body.read
    File.open('output.ogg', 'wb') {|f| f.write(c)}

    # `rm output.ogg`
    # `ffmpeg -i ./output.webm -vn -acodec copy ./output.ogg`

    speech_client = Google::Cloud::Speech.new
    language_code = "en-US"
    sample_rate_hertz = 24000
    encoding = "LINEAR16"
    config = {
        language_code: language_code,
        # sample_rate_hertz: sample_rate_hertz,
        encoding: encoding
    }

    # audio_file = File.binread "./output.webm"
    audio  = { content: c }

    response = speech_client.recognize(config, audio)
    puts "RESPONSE"
    puts response
    results = response.results
    puts "RESULTS"
    puts results.class
    puts results.length

    text = ""

    alternatives = results.first.alternatives
    alternatives.each do |alternative|
        puts "#{alternative.transcript}"
        text = alternative.transcript
    end

    puts "Getting intent for #{text}"

    project_id = "pgtm-bmcclain"
    session_id = "dialogflow-s2t-demo"
    language_code = "en-US"

    session_client = Google::Cloud::Dialogflow::Sessions.new
    session = session_client.class.session_path project_id, session_id
    puts "Session path: #{session}"
    
    query_input = { text: { text: text, language_code: language_code } }
    response = session_client.detect_intent session, query_input
    query_result = response.query_result

    puts "Query text:        #{query_result.query_text}"
    puts "Intent detected:   #{query_result.intent.display_name}"
    puts "Intent confidence: #{query_result.intent_detection_confidence}"
    puts "Fulfillment text:  #{query_result.fulfillment_text}\n"

    textToSpeech(query_result.fulfillment_text)

    return query_result.fulfillment_text
end

options '*' do
    response.headers["Allow"] = "GET, PUT, POST, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type, Accept, X-User-Email, X-Auth-Token"
    response.headers["Access-Control-Allow-Origin"] = "*"
    200
end

get '/' do
    return File.read("index.html")
end

get '/output.mp3' do
    return File.read("output.mp3")
end

get '/js/:jsfile' do
    headers['Content-Type'] = "application/javascript"
    return File.read("js/#{params['jsfile']}")
end