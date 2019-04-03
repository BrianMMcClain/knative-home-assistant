require 'sinatra'
require "google/cloud/speech"
require "google/cloud/text_to_speech"
require "google/cloud/dialogflow"
require 'json'
require 'base64'

def textToSpeech(inputString)

    client = Google::Cloud::TextToSpeech.new credentials: GOOGLEML_CREDS
    synthesis_input = { text: inputString }
    voice = {
        language_code: "en-US",
        ssml_gender:   "NEUTRAL"
    }
    audio_config = { audio_encoding: "MP3" }
    response = client.synthesize_speech synthesis_input, voice, audio_config

    return Base64.encode64(response.audio_content)

end

configure do

    if ENV.has_key? "VCAP_SERVICES"
        services = JSON.parse(ENV['VCAP_SERVICES'])
        
        googleml_key = services.keys.select { |svc| svc =~ /google-ml-apis/i }.first
        googleml = services[googleml_key].first['credentials']
        GOOGLEML_CREDS = JSON.parse Base64.decode64(googleml['PrivateKeyData'])
        GOOGLEML_PROJECT = googleml['ProjectId']

        dialogflow_key = services.keys.select { |svc| svc =~ /google-dialogflow/i }.first
        dialogflow = services[dialogflow_key].first['credentials']
        DIALOGFLOW_CREDS = JSON.parse Base64.decode64(dialogflow['PrivateKeyData'])
        DIALOGFLOW_PROJECT = dialogflow['ProjectId']
    end

end

post '/' do

    c = request.body.read

    speech_client = Google::Cloud::Speech.new credentials: GOOGLEML_CREDS
    language_code = "en-US"
    encoding = "LINEAR16"
    config = {
        language_code: language_code,
        encoding: encoding
    }

    audio  = { content: c }

    response = speech_client.recognize(config, audio)
    results = response.results

    text = "fallback"
    if results.length > 0
        alternatives = results.first.alternatives
        alternatives.each do |alternative|
            puts "#{alternative.transcript}"
            text = alternative.transcript
        end
    end

    query_result = submitDialogflow(text, language_code)

    puts "Query text:        #{query_result.query_text}"
    puts "Intent detected:   #{query_result.intent.display_name}"
    puts "Intent confidence: #{query_result.intent_detection_confidence}"
    puts "Fulfillment text:  #{query_result.fulfillment_text}\n"

    audioData = textToSpeech(query_result.fulfillment_text)
    returnData = { "audio": audioData, "text": query_result.fulfillment_text }

    return JSON.dump(returnData)
end

post '/text' do
    text = request.body.read
    language_code = "en-US"

    query_result = submitDialogflow(text, language_code)

    puts "Query text:        #{query_result.query_text}"
    puts "Intent detected:   #{query_result.intent.display_name}"
    puts "Intent confidence: #{query_result.intent_detection_confidence}"
    puts "Fulfillment text:  #{query_result.fulfillment_text}\n"

    audioData = textToSpeech(query_result.fulfillment_text)
    returnData = { "audio": audioData, "text": query_result.fulfillment_text }

    return JSON.dump(returnData)
end

def submitDialogflow(text, language_code)
    puts "Getting intent for #{text}"

    session_id = "dialogflow-s2t-demo"
    session_client = Google::Cloud::Dialogflow::Sessions.new credentials: DIALOGFLOW_CREDS
    session = session_client.class.session_path DIALOGFLOW_PROJECT, session_id
    
    query_input = { text: { text: text, language_code: language_code } }
    response = session_client.detect_intent session, query_input
    query_result = response.query_result

    return query_result
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

get '/js/:jsfile' do
    headers['Content-Type'] = "application/javascript"
    return File.read("js/#{params['jsfile']}")
end