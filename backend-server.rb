require 'sinatra'
require "google/cloud/speech"

post '/' do
    c = request.body.read
    File.open('output.webm', 'wb') {|f| f.write(c)}

    `rm output.ogg`
    `ffmpeg -i ./output.webm -vn -acodec copy ./output.ogg`

    speech_client = Google::Cloud::Speech.new
    language_code = "en-US"
    sample_rate_hertz = 48000
    encoding = "OGG_OPUS"
    config = {
    language_code: language_code,
    sample_rate_hertz: sample_rate_hertz,
    encoding: encoding
    }

    audio_file = File.binread "./output.ogg"
    audio  = { content: c }

    response = speech_client.recognize(config, audio)
    results = response.results

    alternatives = results.first.alternatives
    alternatives.each do |alternative|
    puts "#{alternative.transcript}"
    end
end

options '*' do
    response.headers["Allow"] = "GET, PUT, POST, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type, Accept, X-User-Email, X-Auth-Token"
    response.headers["Access-Control-Allow-Origin"] = "*"
    200
end