
let rcounter = 0
let bcounter = 0

const audio = {

	context: null,
	audioqueue: [],

	start: function() {
		if(this.context) return
		this.context = new AudioContext({sampleRate:16000})
	},

	queue: function(blob=null) {

		// hmm
		if(!this.context) return

		// if raw data then push onto queue and return if queue is working
		if(blob) {
			this.audioqueue.push(blob)
			if(this.audioqueue.length !== 1) return
		}

		// return if nothing to do
		if(!this.audioqueue.length) {
			sys.resolve({audioqueue:'done'})
			return
		}

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
			if(this.sound) {
				this.sound.disconnect()
				this.sound = null
			}

			// clear last job
			this.audioqueue.shift()

			// revisit queue
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

	// an explicit optional stop to stop making audio sounds on speaker
	if(blob.stop) {
		audio.stop()
	}

	// push audio output to queue to play to speaker
	if(blob.voice && blob.voice.audio) {
		audio.queue(blob)
	}
}

sys({resolve})

