#!/bin/bash

cf push --no-start

cf create-service google-dialogflow default cfsummit-demo-dialogflow -c "{}"
cf bind-service home-assistant cfsummit-demo-dialogflow -c "{}"

cf create-service google-ml-apis default cfsummit-demo-googleml -c "{}"
cf bind-service home-assistant cfsummit-demo-googleml -c '{"role":"ml.developer"}'

cf start home-assistant