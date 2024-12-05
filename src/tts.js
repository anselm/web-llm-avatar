
const uuid = 'tts-entity'

const voiceId = 'en_US-hfc_female-medium'

//
// import tts worker right now
// declare worker as a string and fetch wasm from cdn due to vites import map failing on dynamic imports
//

const ttsString = `
import * as tts from 'https://cdn.jsdelivr.net/npm/@diffusionstudio/vits-web@1.0.3/+esm'
self.addEventListener('message', (e) => {
	tts.predict({text:e.data,voiceId: 'en_US-hfc_female-medium'}).then(audio => {
		new Promise((resolve, reject) => {
			const reader = new FileReader()
			reader.onload = () => resolve(reader.result)
			reader.onerror = () => reject(reader.error)
			reader.readAsArrayBuffer(audio)
		}).then(audio => {
			self.postMessage(audio)
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

function chew(text) {
	if(!text || !text.length) return null
	return new Promise((happy,sad)=>{
		worker_tts.onmessage = async (event) => { happy(event) }
		worker_tts.postMessage(text)
	})
}

async function _resolve_queue() {
	while(true) {
		if(!this._queue.length) return
		const blob = this._queue[0]
		const text = fixDollars(blob.breath.breath).replace(/[*<>#%-]/g, "")
		const final = blob.breath.final ? true : false
		const interrupt = blob.breath.interrupt
		const results = await chew(text)
		if(results && results.data) {
			if(this._bargein > interrupt) {
				//console.warn(uuid,"tts throwing away old data",blob)
				this._queue = []
				return
			} else {
				//console.log(uuid,"tts got valid results",blob,results)
				sys({audio:{data:results.data,interrupt,final}})
			}
		}
		this._queue.shift()
	}
}

//
// resolve - must not be async else will stall rest of pipeline
//

function resolve(blob,sys) {

	// when was most recent bargein detected?
	if(blob.human && blob.human.interrupt) this._bargein = blob.human.interrupt

	// barge in? - @todo in a scenario with multiple llms it may not make sense to stop all of them on any interruption
	if(blob.human) {
		this._queue = []
	}

	// queue breath segments
	if(!blob.breath || !blob.breath.breath) return
	this._queue.push(blob)
	if(this._queue.length !== 1) return
	this._resolve_queue()
}

export const tts_entity = {
	uuid,
	resolve,
	_queue:[],
	_resolve_queue,
	_bargein: 0
}
