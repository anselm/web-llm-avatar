
const voicesys = {

	recognizer: null,
	allowed: true,
	desired: false,

	init: function() {

		if(this.recognizer) return

		this.recognizer = new (window.SpeechRecognition || window.webkitSpeechRecognition)()
		this.recognizer.lang = 'en-US'
		this.recognizer.continuous = true
		this.recognizer.interimResults = true

		this.recognizer.start2 = ()=>{
			if(this.recognizer.active) return
			try {
				this.recognizer.start()
				console.log("...voicesys: recognizer start")
			} catch(err) {
				console.log("...voicesys: recognizer started but with error")
			}
			this.recognizer.active = true
		}

		this.recognizer.stop2 = ()=>{
			if(!this.recognizer.active) return
			try {
				this.recognizer.abort()
				console.log("...voicesys: recognizer stopped")
			} catch(err) {
				console.log("...voicesys: recognizer stopped but with error")
			}
			this.recognizer.active = false
		}

		// stop listening on an error
		this.recognizer.onerror = (event) => {
			console.error('... voicesys: speech recognition error', event.error);
			this.setAllowed(false)
		}

		// collect a full sentence and stop listening when has a full sentence
		this.recognizer.onresult = (event) => {
			for (let i = event.resultIndex; i < 1 && i < event.results.length; ++i) {
				const data = event.results[i]
				const text = data[0].transcript
				const confidence = data[0].confidence
				const final = data.isFinal
				const blob = {voice:{text, timestamp: event.timeStamp, confidence, spoken:true, final }}
				console.log("...voicesys: got state",text,final,confidence)
				sys(blob)
				if(final) {
					this.setAllowed(false)
				}
			}
		}
	},

	updateListening: function() {
		if(!this.recognizer) return
		this.allowed && this.desired ? this.recognizer.start2() : this.recognizer.stop2()
	},

	setAllowed: function (state=true) {
		this.allowed = state
		this.updateListening()
	},

	setDesired: async function (state=true) {
		this.desired = state
		this.init()
		this.updateListening()
	},

}


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// watch pubsub
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function resolve(blob) {

	// if speakers are truly done then also listen
	if(blob.speakers_done && blob.speakers_done.final) {
		console.log("... voicesys - speaking is done so listen now",blob)
		voicesys.setAllowed(true)		
	}

	// if state is not voice related then return now
	if(!blob.voice) return

	// use barge in as an opportunity to listen
	if(blob.voice.bargein) {
		console.log(".... voicesys - barge in to listen - may lose a word")
		voicesys.setAllowed(true)		
	}

	// physically allow audio input?
	if(blob.voice.hasOwnProperty('allowed')) {
		voicesys.setAllowed(blob.voice.allowed)
	}

	// user would like to have audio input?
	if(blob.voice.hasOwnProperty('desired')) {
		voicesys.setDesired(blob.voice.desired)
	}

}

// listen to the pubsub backbone for work to do
sys({resolve})


