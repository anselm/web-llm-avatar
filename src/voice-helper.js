
let allowed = true
let desired = false
let listening = false

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!SpeechRecognition) {
	alert("Speech Recognition API is not supported in this browser.")
}

const recognition = new SpeechRecognition()
recognition.lang = 'en-US'
recognition.interimResults = true
recognition.continuous = true

recognition.onstart = () => {
	// console.log("Voice recognition started...")
}

recognition.onerror = (event) => {
	// console.error("Voice Error occurred in recognition:", event.error)
}

recognition.configure = () => {
	if(!allowed || !desired) {
		if(listening === true) {
			console.log("... voice disabled")
			recognition.stop()
			listening = false
		}
	} else if(listening === false) {
		console.log("... voice enabled")
		recognition.start()
		listening = true
	}	
}

// recognition.continuous is broken - one of the many bugs in the built in speech recognition system
recognition.reset = () => {
	if(!allowed || !desired) return
	if(listening === true) {
		recognition.stop();
		listening = false;
	}
	setTimeout( () => {
		recognition.configure()
	},200)
}

recognition.onresult = (event) => {
	const timestamp = event.timeStamp
	// throw away everything except the first event because it is just too confusing otherwise
	for (let i = event.resultIndex; i < 1 && i < event.results.length; ++i) {
		const data = event.results[i]
		const text = data[0].transcript
		const final = data.isFinal
		const confidence = data[0].confidence
		const blob = {voice:{text, timestamp, confidence, final}}
		//console.log(text,timestamp,confidence,final,i)
		sys.resolve(blob)
		if(final) {
			recognition.reset()
		}
	}
}

const resolve = (blob) => {

	if(blob.status) {
		if(blob.status === 'speaking') {
			allowed = false
		}
		if(blob.status === 'ready') {
			allowed = true
		}
		recognition.configure()
	}


	if(!blob.voice || blob.voice.text) return
	if(blob.voice.hasOwnProperty('allowed')) {
		allowed = blob.voice.allowed
	}
	if(blob.voice.hasOwnProperty('desired')) {
		desired = blob.voice.desired
	}
	recognition.configure()
}

sys.resolve({resolve})
