
let rcounter = 0
let bcounter = 0

const speakers = {

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
			return
		}

		// get next job
		blob = this.audioqueue[0]
		if(blob.rcounter && blob.rcounter < rcounter) {
			console.warn("... audio noticed an old request... abandoning")
			return
		}

		// play one sound at a time
		this.context.decodeAudioData(blob.speakers.audio, (audioBuffer) => {
			const sound = this.sound = this.context.createBufferSource()
			sound.buffer = audioBuffer
			sound.connect(this.context.destination)
			sound.addEventListener('ended', (results) => {

				// stop the sound - remove it
				if(this.sound) {
					this.sound.disconnect()
					this.sound = null
				}

				// publish that this is done - other observers want to know when truly done talking
				sys({
					rcounter: blob.rcounter,
					bcounter: blob.bcounter,
					speakers_done: {
						performed: true,
						final: blob.speakers.final
					}
				})

				// clear prev job
				this.audioqueue.shift()

				// revisit queue
				this.queue()
			})

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

speakers.start()

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
		speakers.stop()
	}

	// push audio output to queue to play to speaker
	if(blob.speakers && blob.speakers.audio) {
		speakers.queue(blob)
	}
}

sys({resolve})

