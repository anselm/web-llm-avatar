
//
// config - @todo may expose to outside world
//

const voiceId = 'en_US-hfc_female-medium'

//
// import tts worker right now
//
// declare worker as a string and fetch wasm from cdn due to vites import map failing on dynamic imports
//

const ttsString = `
import * as tts from 'https://cdn.jsdelivr.net/npm/@diffusionstudio/vits-web@1.0.3/+esm'
self.addEventListener('message', (e) => {
	if(!e || !e.data || !e.data.speakers || !e.data.speakers.text) return
	tts.predict({text:e.data.speakers.text,voiceId: 'en_US-hfc_female-medium'}).then(audio => {
		console.log("tts got audio",audio)
		new Promise((resolve, reject) => {
			const reader = new FileReader()
			reader.onload = () => resolve(reader.result)
			reader.onerror = () => reject(reader.error)
			reader.readAsArrayBuffer(audio)
		}).then(audio => {
			console.log("tts got audio 2",audio)
			e.data.speakers.audio = audio
			self.postMessage(e.data)			
		})
	})
})
`

const worker_tts = new Worker(URL.createObjectURL(new Blob([ttsString],{type:'text/javascript'})),{type:'module'})

//
// utility to correct pronounciation of dollars
//

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

let ttsqueue = []
let rcounter = 0
let bcounter = 0

//
// tts queue; process only one tts request at a time
//

const ttsqueue_helper = async (blob=null) => {

	// explicit request to convert text to audio - push onto queue and return if queue is not empty
	if(blob) {
		ttsqueue.push(blob)
		if(ttsqueue.length !== 1) return
	}

	// implicit loop - check queue and return if empty
	if(!ttsqueue.length) return

	// peel off of queue and sanity check age
	blob = ttsqueue[0]

	// ignore old requests
	if(blob.rcounter && blob.rcounter < rcounter) {
		console.warn("... tts noticed an old request... abandoning",blob)
		ttsqueue.shift()
		ttsqueue_helper()
		return
	}

	// sanitize text for tts and stuff it back into the blob for scope
	let text = fixDollars(blob.llm.breath)
	text = text.replace(/[*<>#%-]/g, "")
	if(!text.length) {
		ttsqueue.shift()
		ttsqueue_helper()
		return
	}

	const final = blob.llm.final

	worker_tts.onmessage = async (event) => {
		if(!event.data.speakers.audio || event.data.rcounter < rcounter) {
			console.log("... tts noticed an old request... abandoning",event.data)
			return
		}
		sys(event.data)
		ttsqueue.shift()
		ttsqueue_helper()
	}

	const data = {
		rcounter: blob.rcounter,
		bcounter: blob.bcounter,
		speakers: {
			text,
			final
		}
	}

	worker_tts.postMessage(data)
}

// watch requests flying past on the pubsub backbone
function resolve(blob) {

	// request counter will flush previous requests
	if(blob.rcounter) {
		if(blob.rcounter < rcounter) return
		rcounter = blob.rcounter
		bcounter = blob.bcounter
	}

	// an explicit optional stop
	if(blob.stop) {
		ttsqueue = []
	}

	// handle breath fragments
	if(blob.llm && blob.llm.breath) {
		ttsqueue_helper(blob)
	}
}

// listen to the pubsub backbone for work to do
sys({resolve})

