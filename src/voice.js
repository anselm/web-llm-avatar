
let rcounter = 0
let bcounter = 0

const audio = {

	context: null,
	microphone: null,
	recognizer: null,

	allowed:true,
	enabled:false,
	listening:false,

	constraints: {
		audio: {
			echoCancellation: true,
			noiseSuppression: true,
			autoGainControl: true
		}
	},

	start: function() {

		if(this.context) return

		//
		// build an audio context for all audio, input and output
		//

		this.context = new AudioContext()

		//
		// open access to the microphone using webrtc echo cancellation
		//
		// https://dev.to/fosteman/how-to-prevent-speaker-feedback-in-speech-transcription-using-web-audio-api-2da4
		//
	},

	startMicrophone: async function() {

		if(this.recognizer) return

		try {
			this.microphone = await navigator.mediaDevices.getUserMedia(this.constraints)
		} catch (err) {
			console.error('voice: error accessing the microphone', err)
			return null;
		}

		//
		// audio output
		//

		const source = this.context.createMediaStreamSource(this.microphone)
		const compressor = this.context.createDynamicsCompressor()
		//compressor.threshold.setValueAtTime(-50, audioContext.currentTime)
		//compressor.knee.setValueAtTime(40, audioContext.currentTime)
		//compressor.ratio.setValueAtTime(12, audioContext.currentTime)
		//compressor.attack.setValueAtTime(0, audioContext.currentTime)
		//compressor.release.setValueAtTime(0.25, audioContext.currentTime)
		source.connect(compressor)
	    compressor.connect(this.context.destination)

	    //
	    // start speech recognition
	    //

		this.recognizer = new (window.SpeechRecognition || window.webkitSpeechRecognition)()
		this.recognizer.lang = 'en-US'
		this.recognizer.continuous = true
		this.recognizer.interimResults = true

		this.recognizer.onerror = (event) => {
			console.error('Speech recognition error', event.error);
			this.reset()
		}

		this.recognizer.onresult = (event) => {

// - if i am recognizing audio then i should stop all playback as a test
console.log("... audio test hearing voice - is player? stop talking",event)
rcounter++
this.stop()
sys.resolve({rcounter,bcounter,stop:true})

			const timestamp = event.timeStamp
			// throw away everything except the first event because it is just too confusing otherwise
			for (let i = event.resultIndex; i < 1 && i < event.results.length; ++i) {
				const data = event.results[i]
				const input = data[0].transcript
				const final = data.isFinal
				const confidence = data[0].confidence
				const blob = {voice:{input, timestamp, confidence, final}}
				sys.resolve(blob)
				if(final) {
					this.reset()
				}
			}
		}
	},

	configure: function() {

		if(!this.recognizer) return

		if (this.context.state === 'suspended') {
			this.context.resume()
		}

		if(!this.allowed || !this.enabled) {
			if(this.listening === true) {
				console.log("... voice recognition disabled")
				this.recognizer.stop()
				this.listening = false
			}
			return
		}

		if(this.listening === false) {
			console.log("... voice recognition enabled")
			this.recognizer.start()
			this.listening = true
		}	
	},

	allow: function (state) {
		this.allow = state
		this.configure()
	},

	enable: async function (state) {
		console.log(this)
		this.enabled = state
		if(state) {
			await this.start()
			await this.startMicrophone()
		}
		this.configure()
	},

	reset: function () {
		if(!this.allowed || !this.enabled) return
		if(this.listening === true) {
			console.log("... kicking the audio system to restart recognizer")
			this.recognizer.stop();
			this.listening = false;
		}
		setTimeout( () => {
			this.configure()
		},200)
	},

	audioqueue: [],

	queue: function(blob=null) {

		// hmm
		if(!this.context) return

		// if raw data then push onto queue and return if queue is working
		if(blob) {
			this.audioqueue.push(blob)
			if(this.audioqueue.length !== 1) return
		}

		// return if nothing to do
		if(!this.audioqueue.length) return

		// get next job
		blob = this.audioqueue[0]
		if(blob.rcounter && blob.rcounter < rcounter) {
			console.warn("... audio noticed an old request... abandoning")
			return
		}

		const ended = (results) => {

			// sanity check
			if(!results || !results.target) {
				console.error("... voice issue with sound end")
				return
			}

			// stop the sound - remove it
			//this.target.stop()
			if(this.sound) {
				this.sound.disconnect()
				this.sound = null
			}

			// clear last job
			this.audioqueue.shift()

			// go ahead and kick the queue again
			this.queue()
		}

		this.context.decodeAudioData(blob.voice.audio, (audioBuffer) => {
			const sound = this.sound = this.context.createBufferSource()
			sound.buffer = audioBuffer
			sound.connect(this.context.destination)
			sound.addEventListener('ended', ended)
			sound.start()
		})
	},

	stop: function () {
		this.audioqueue = []
		if(this.sound) {
			this.sound.disconnect()
			this.sound = null
		}
	}
}

audio.start()

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

	// an explicit optional stop
	if(blob.stop) {
		audio.stop()
	}

	// observe status and may force disable voice
	if(blob.status) {
		// recognition.allow( blob.status === 'speaking' ? false : true )
	}

	// only deal with voice blobs after this
	if(!blob.voice) return

	// physically allow voice?
	if(blob.voice.hasOwnProperty('allowed')) {
		// recognition.allow(blob.voice.allowed)
	}

	// user would like to have voice?
	if(blob.voice.hasOwnProperty('desired')) {
		audio.enable(blob.voice.desired)
	}

	// push audio to queue
	if(blob.voice.audio) {
		audio.queue(blob)
	}
}

// listen to the pubsub backbone for work to do
sys.resolve({resolve})


