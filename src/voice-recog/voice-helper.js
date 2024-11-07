let voice = null

function voiceSetup() {

    if ('webkitSpeechRecognition' in window) {
        const webkitSpeechRecognition = window['webkitSpeechRecognition'] as any;
        voice = new webkitSpeechRecognition() as any;
        voice.continuous = true;
        voice.interimResults = true;
        voice.onresult = (event:any) => {
            for (var i = event.resultIndex; i < event.results.length; ++i) {
                const text = event.results[i][0].transcript as string
                if (event.results[i].isFinal && text && text.length) {
                	dealWithUserPrompt(text)
                }
            }
        }
    } else {
        console.error('webkitSpeechRecognition is not supported in this browser.');
    }
}

let voicePermitted = false
let voiceDesiredState = false
let voiceState = false

function updateVoiceState() {

	if(!voice) return

	if(!voicePermitted) {
		voiceButton.innerHTML = "Voice is disabled"
	} else if(voiceDesiredState) {
		voiceButton.innerHTML = "Click to disable Voice Input"
	} else {
		voiceButton.innerHTML = "Click to enable Voice Input"
	}

	if(!voiceState && voiceDesiredState && voicePermitted) {
		voiceState = true
		voice.start()
	}

	else if(voiceState && (!voiceDesiredState || !voicePermitted)) {
		voiceState = false
		voice.stop()
	}
}

function setVoicePermitted(state=true) {
	voicePermitted = state
	updateVoiceState()
}

function setVoiceDesired() {
	// browser forces user interaction to start the voice service
	if(!voice) {
		voiceSetup()
	}
	// set desired state
	voiceDesiredState = voiceDesiredState ? false : true
	updateVoiceState()
}

voiceButton.onclick = setVoiceDesired




