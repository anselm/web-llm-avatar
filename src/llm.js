
const uuid = 'llm_system'

// feels easiest to just fetch these from the web
import * as webllm from "https://esm.run/@mlc-ai/web-llm"

// this is the only model that behaves well
const selectedModel = "Llama-3.1-8B-Instruct-q4f32_1-MLC"

// these models just seem to behave badly in a variety of different ways
//const selectedModel = "TinyLlama-1.1B-Chat-v0.4-q4f16_1-MLC"
//const selectedModel = 'snowflake-arctic-embed-s-q0f32-MLC-b4'
//const selectedModel = "Llama-3.2-3B-Instruct-q4f16_1-MLC"

// length of an utterance till it is considered 'a full breaths worth'
const MIN_BREATH_LENGTH = 20

// local flags for background loaded llm
let engine = null
let ready = false

// worker - as a string because dynamic imports are a hassle with rollup/vite
const workerString = `
import * as webllm from 'https://esm.run/@mlc-ai/web-llm';
const handler = new webllm.WebWorkerMLCEngineHandler();
self.onmessage = (msg) => { handler.onmessage(msg); };
`

async function load() {

	try {

		const initProgressCallback = (status) => {
			sys({status:{color:(ready?'ready':'loading'),text:status.text}})
		}

		const completed = (_engine) => {
			engine = _engine
			ready = true
			sys({status:{color:(ready?'ready':'loading'),text:'Ready'}})
		}

		// service workers seem to be starved of cpu/gpu
		const USE_SERVICE_WORKER = false

		if(USE_SERVICE_WORKER) {
			navigator.serviceWorker.register("/sw.js",{type:'module'}).then( registration => {
				console.log('llm - service worker message',registration)
			})
			webllm.CreateServiceWorkerMLCEngine(selectedModel,{initProgressCallback}).then(completed)
		} else {
			const worker = new Worker(URL.createObjectURL(new Blob([workerString],{type:'text/javascript'})),{type:'module'})
			webllm.CreateWebWorkerMLCEngine(worker,selectedModel,{initProgressCallback}).then(completed)
		}

	} catch(err) {
		console.error("llm - worker fetch error",err)
	}
}

// start fetching the llm right away
load()

////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// llm-helper resolve
///
/// listens for things like {human:{text:"how are you?"}}
///
/// publishes {llm:{breath:"llm response fragment",final:true|false}}
///
////////////////////////////////////////////////////////////////////////////////////////////////////

let thinking = false

function resolve(blob,sys) {

	if(!blob.human) return

	// when was most recent bargein detected?
	if(blob.human && blob.human.interrupt) this._bargein = blob.human.interrupt

	// if not ready then just report that
	if(!engine || !ready) {
		sys({breath:{breath:'...still loading',ready,final:true}})
		return
	}

	// barge in? - @todo in a scenario with multiple llms it may not make sense to stop all of them on any interruption
	if(thinking) {
		if(!engine || !engine.interruptGenerate) return
		engine.interruptGenerate()
		thinking = false		
	}

	// if request is incomplete (such as merely a barge in) then get out now
	const request = blob.human.llm
	if(!request) {
		return
	}

	// start reasoning
	thinking = true

	// this is the highest counter that the callbacks will know about
	const rcounter = blob.human.rcounter || 1
	let bcounter = blob.human.bcounter || 1
	const interrupt = blob.human.interrupt || 0

	// helper: publish each breath fragment as it becomes large enough
	let breath = ''
	const breath_helper = (fragment=null,finished=false) => {
		if(!fragment || !fragment.length || finished) {
			if(breath.length) {
				bcounter++
				sys({breath:{breath,ready,final:true,rcounter,bcounter,interrupt}})
				breath = ''
			}
			return
		}
		const match = fragment.match(/.*?[.,!?]/);
		if(breath.length < MIN_BREATH_LENGTH || !match) {
			breath += fragment
		} else {
			const i = match[0].length
			breath += fragment.slice(0,i)
			bcounter++
			sys({breath:{breath,ready,final:false,rcounter,bcounter,interrupt}})
			breath = fragment.slice(i)
		}
	}

	// helper: a callback per chunk
	const helper = async (asyncChunkGenerator) => {

		// iterate over async iterables ... @todo can we abort this if we wish?
		for await (const chunk of asyncChunkGenerator) {
			if(!chunk.choices || !chunk.choices.length || !chunk.choices[0].delta) continue
			const content = chunk.choices[0].delta.content
			const finished = chunk.choices[0].finish_reason
			// is our work out of date? @todo call engine.interruptGenerate()?
			if(this._bargein > interrupt) return
			breath_helper(content,finished === 'stop')
		}

		// stuff the final message onto the llm history
		const paragraph = await engine.getMessage()
		request.messages.push( { role: "assistant", content:paragraph } )

		// is our work out of date? @todo call engine.interruptGenerate()?
		if(this._bargein > interrupt) return
		sys({breath:{paragraph,breath:'',ready,final:true,rcounter,bcounter,interrupt}})
	}

	// begin streaming support of llm text responses as breath chunks
	engine.chat.completions.create(request).then(helper)

}

export const llm_system = {
	uuid,
	resolve,
	_bargein:0,
	//singleton: true // an idea to distinguish systems from things that get multiply instanced @todo
}
