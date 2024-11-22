
let rcounter = 0
let bcounter = 0

const built_in_voice_recognition = {

	context: null,
	recognizer: null,
	microphone: null,

	allowed:true,
	desired:false,

	start: function() {
		if(this.context) return
		this.context = new AudioContext({sampleRate:16000})
	},

	//
	// open access to the microphone using webrtc echo cancellation
	//
	// https://dev.to/fosteman/how-to-prevent-speaker-feedback-in-speech-transcription-using-web-audio-api-2da4
	//

	startMicrophone: async function() {

		if(!USE_BUILTIN_VOICE_RECOGNITION) return

		if(this.recognizer) return

		const constraints = {
			audio: {
				echoCancellation: true,
				noiseSuppression: true,
				autoGainControl: true
			}
		}

		try {
			this.microphone = await navigator.mediaDevices.getUserMedia(constraints)
		} catch (err) {
			console.error('voice: error accessing the microphone', err)
			return null;
		}

		//
		// audio output
		//

		const source = this.context.createMediaStreamSource(this.microphone)
		//const compressor = this.context.createDynamicsCompressor()
		//compressor.threshold.setValueAtTime(-50, audioContext.currentTime)
		//compressor.knee.setValueAtTime(40, audioContext.currentTime)
		//compressor.ratio.setValueAtTime(12, audioContext.currentTime)
		//compressor.attack.setValueAtTime(0, audioContext.currentTime)
		//compressor.release.setValueAtTime(0.25, audioContext.currentTime)
		//source.connect(compressor)
	    //compressor.connect(this.context.destination)

	    //
	    // start speech recognition
	    //

		this.recognizer = new (window.SpeechRecognition || window.webkitSpeechRecognition)()
		this.recognizer.lang = 'en-US'
		this.recognizer.continuous = true
		this.recognizer.interimResults = true

		this.recognizer.onerror = (event) => {
			console.error('Speech recognition error', event.error);
			this.kick()
		}

		this.recognizer.onresult = (event) => {

// TEST - this confirms that the builtin voice recognition does not participate in echo cancellation :(
if(event.results && event.results.length) {
for (let i = event.resultIndex; i < event.results.length; ++i) {
const data = event.results[i]
const input = data[0].transcript
const confidence = data[0].confidence
const final = data.isFinal

if(confidence > 0.8) {
// as a test of echo cancellation
// if voice recognition detects any voice at all - force stop all other systems
console.log("... INTERRUPTION DETECTED: ",input,confidence,final)
rcounter++
this.stop()
sys({rcounter,bcounter,stop:true})
}
}
}

			const timestamp = event.timeStamp
			// throw away everything except the first event because it is just too confusing otherwise
			for (let i = event.resultIndex; i < 1 && i < event.results.length; ++i) {
				const data = event.results[i]
				const text = data[0].transcript
				const confidence = data[0].confidence
				const final = data.isFinal
				const blob = {voice:{text, timestamp, confidence, final}}
				sys(blob)
				if(final) {
					this.kick()
				}
			}
		}
	},

	setMicrophoneOnOff: async function() {
		if (this.context.state === 'suspended') {
			this.context.resume()
		}
		// only start if user actively selects that they would like microphone on
		if(this.desired) {
			await this.start()
			await this.startMicrophone()
		}
		if(!this.recognizer) {
			return
		}
		if(this.allowed && this.desired) {
			if(!this.listening) {
				this.listening = true
				this.recognizer.start()
			}
		} else {
			if(this.listening) {
				this.listening = false
				this.recognizer.stop()
			}
		}
	},

	setAllowed: function (state) {
		this.allowed = state
		this.setMicrophoneOnOff()
	},

	setDesired: async function (state) {
		this.desired = state
		this.setMicrophoneOnOff()
	},

	kick: function () {
		if(!this.allowed || !this.desired || !this.listening || !this.recognizer) return
		this.listening = false
		this.recognizer.stop()
		setTimeout( () => {
			this.setMicrophoneOnOff()
		},200)
	},

}

built_in_voice_recognition.start()

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// watch pubsub
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function resolve(blob) {

	// request counter will flush previous requests
	if(blob.rcounter) {
		if(blob.rcounter < rcounter) return
		rcounter = blob.rcounter
		bcounter = blob.bcounter
	}

	// if state is not voice related then return now
	if(!blob.voice) return

	// physically allow audio input?
	if(blob.voice.hasOwnProperty('allowed')) {
		built_in_voice_recognition.setAllowed(blob.voice.allowed)
	}

	// user would like to have audio input?
	if(blob.voice.hasOwnProperty('desired')) {
		built_in_voice_recognition.setDesired(blob.voice.desired)
	}

}

// listen to the pubsub backbone for work to do
sys({resolve})

