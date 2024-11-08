
////////////////////////////////////////////////////////////////////////////////
//
// tts service
//
////////////////////////////////////////////////////////////////////////////////

// import * as tts from 'https://cdn.jsdelivr.net/npm/@diffusionstudio/vits-web@1.0.3/+esm'
// import * as tts from '@diffusionstudio/vits-web'

const ttsString = `
import * as tts from 'https://cdn.jsdelivr.net/npm/@diffusionstudio/vits-web@1.0.3/+esm'
self.addEventListener('message', async (e) => {
	if(e.data.text) {
		const text = e.data.text
		const wav = await tts.predict({text,voiceId: 'en_US-hfc_female-medium'})
		self.postMessage({wav})
		//const buffer = await new Promise((resolve, reject) => {
		//	const reader = new FileReader();
		//	reader.onload = () => resolve(reader.result);
		//	reader.onerror = () => reject(reader.error);
		//	reader.readAsArrayBuffer(wav);
		//});
	    //self.postMessage({buffer})
	}
})
`

const worker_tts = new Worker(URL.createObjectURL(new Blob([ttsString],{type:'text/javascript'})),{type:'module'})

////////////////////////////////////////////////////////////////////////////////
//
// hack code to fix up how dollar amounts are said
//
////////////////////////////////////////////////////////////////////////////////

function numberToWords(num) {
	const a = [
			'', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
			'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'
	];
	const b = [
			'', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'
	];

	const numToWords = (n) => {
			if (n < 20) return a[n];
			if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? '-' + a[n % 10] : '');
			if (n < 1000) return a[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' and ' + numToWords(n % 100) : '');
			return numToWords(Math.floor(n / 1000)) + ' thousand' + (n % 1000 ? ' ' + numToWords(n % 1000) : '');
	};

	return numToWords(num);
}

function convertAmountToWords(amount) {
	const [dollars, cents] = amount.toFixed(2).split('.')
	const dollarPart = numberToWords(parseInt(dollars))
	const centPart = numberToWords(parseInt(cents))
	return `${dollarPart} dollars${cents > 0 ? ' and ' + centPart + ' cents' : ''}`
}

function fixDollars(sentence) {
	return sentence.replace(/\$\d+(\.\d{1,2})?/g, (match) => {
			const amount = parseFloat(match.replace('$', ''))
			return convertAmountToWords(amount)
	});
}

////////////////////////////////////////////////////////////////////////////////
//
// utilities
//
////////////////////////////////////////////////////////////////////////////////

const isServer = typeof window === 'undefined'

const buffer_to_bytes = (buffer) => {
	if(isServer) {
		const binary = Buffer.from(buffer).toString('binary');
		return Buffer.from(binary, 'binary').toString('base64');
	} else {
		const uint8buf = new Uint8Array(buffer)
		const arrayu8 = Array.from(uint8buf)
		let binaryu8 = ''; arrayu8.forEach(elem => { binaryu8+= String.fromCharCode(elem) })
		//const binaryu8 = String.fromCharCode.apply(null,arrayu8) // this is blowing the stack
		// don't bother packaging this up as a playable file but rather let the client do that if desired
		// blob.audio = "data:audio/mp3;base64," + window.btoa( binary )
		return window.btoa(binaryu8)
	}
}

////////////////////////////////////////////////////////////////////////////////
//
// tts observer
//
////////////////////////////////////////////////////////////////////////////////

let current_audio = null
let audioqueue = []
let ttsqueue = []

function log() {
	//console.log(...arguments)
}

let rcounter = 0
let bcounter = 0

const audioqueue_helper = async (blob) => {
	if(blob) {
		audioqueue.push(blob)
		if(audioqueue.length !== 1) return
	}
	if(!audioqueue.length) return
	blob = audioqueue[0]
	if(blob.rcounter && blob.rcounter < rcounter) {
		console.warn("... audio noticed an old request... abandoning")
		return
	}
	const start = performance.now()
	log("... audio frag playing...............",start,audioqueue.length)
	await new Promise( (resolve,reject) => {
		const audio = new Audio()
		audio.preload = "auto"
		audio.autoplay = true
		audio.onerror = reject
		audio.onended = resolve
		audio.src = URL.createObjectURL(blob.wav)
		sys.resolve({status:'speaking'})
		audio.play()
		current_audio = audio
	})
	current_audio = null
	const finish = performance.now()
	audioqueue.shift()
	log("... audio frag done...............",finish-start,finish,audioqueue.length,ttsqueue.length)
	sys.resolve({status: audioqueue.length || ttsqueue.length ? 'pausing' : 'ready' })
	audioqueue_helper()
}

const ttsqueue_helper = async (blob=null) => {

	// explicit request - push onto queue and return if queue is not empty
	if(blob) {
		ttsqueue.push(blob)
		if(ttsqueue.length !== 1) return
	}

	// implicit loop - check queue and return if empty
	if(!ttsqueue.length) return

	// peel off of queue and sanity check age
	blob = ttsqueue[0]

	if(blob.rcounter && blob.rcounter < rcounter) {
		console.warn("... tts noticed an old request... abandoning")
		ttsqueue.shift()
		ttsqueue_helper()
		return
	}

	// sanity check text
	let text = blob.llm.breath
	text = fixDollars(text)
	text = text.replace(/[*<>#%-]/g, "")
	if(!text.length) {
		console.warn("... tts empty text")
		ttsqueue.shift()
		ttsqueue_helper()
		return
	}

	// process audio
	const voiceId = 'en_US-hfc_female-medium'
	const start = performance.now()
	log("....tts starting",start,blob,text)

	worker_tts.onmessage = async (event) => {
		const wav = event && event.data ? event.data.wav : null
		if(!wav || (blob.rcounter && blob.rcounter < rcounter)) {
			log("... tts noticed an old request... abandoning",blob)
		} else {
			audioqueue_helper({wav,text})
		}

		const finish = performance.now()
		log("...tts done",(finish-start),finish)

		ttsqueue.shift()
		ttsqueue_helper()
	}

	worker_tts.postMessage({text})

}

function resolve(blob) {

	// stop everything asap
	if(blob.stop) {
		if(blob.rcounter) rcounter = blob.rcounter
		if(blob.bcounter) bcounter = blob.bcounter
		if(current_audio) {
			current_audio.pause();
			current_audio.currentTime = 0;
			current_audio = null
		}
		audioqueue = []
		ttsqueue = []
		return
	}

	// handle only these
	if(!blob.llm || !blob.llm.breath) return

	// advance rcounter but ignore older
	if(blob.rcounter) {
		if(blob.rcounter < rcounter) return
		rcounter = blob.rcounter
		bcounter = blob.bcounter
	}

	ttsqueue_helper(blob)
}

sys.resolve({resolve})

