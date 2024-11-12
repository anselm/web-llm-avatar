
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

// llm state containing configuration and history to extend
const request = {
	stream: true,
	messages: [
		{
			role: "system",
			content: "You are a helpful digital agent"
		}
	],
	temperature: 0.3,
	max_tokens: 256,
	breath: ''
}

// local flags for background loaded llm
let engine = null
let ready = false

// worker - as a string because vite struggles to deal with dynamically resolved imports
const workerString = `
import * as webllm from 'https://esm.run/@mlc-ai/web-llm';
const handler = new webllm.WebWorkerMLCEngineHandler();
self.onmessage = (msg) => { handler.onmessage(msg); };
`

// fetch the llm once
async function load() {
	const worker = new Worker(URL.createObjectURL(new Blob([workerString],{type:'text/javascript'})),{type:'module'})
	engine = await webllm.CreateWebWorkerMLCEngine(
		worker,
		selectedModel,
		{ initProgressCallback: (status) => {
			sys.resolve({llm:{ready,status}})
		}},
	)
	ready = true
	sys.resolve({llm:{ready}})
}

load()


// rcounter = request counter, increments once per player request to the llm
// bcounter = breath counter, increments per breath fragment of a response

let rcounter = 0
let bcounter = 0

///
/// llm-helper resolve
///
/// listens for {llm:{message:"user queries"}}
///
/// publishes {llm:{breath:"llm response fragment",final:true|false}}
///

function resolve(blob) {

	// stop everything?
	if(blob.stop) {
		if(!engine || !engine.interruptGenerate) return
		engine.interruptGenerate()
		return
	}

	// ignore non llm traffic
	if(!blob.llm) return

	// configuration
	if(blob.llm && blob.llm.configuration) {
		request.messages[0].content = blob.llm.configuration
		console.log(request)
		return
	}

	// otherwise ignore traffic that is not specifically a request to handle new content
	if(!blob.llm.hasOwnProperty('content')) return

	const content = blob.llm.content

	// if the caller is asking to process a message but not ready then reply as such
	if(!engine || !ready) {
		if(content && content.length) {
			sys.resolve({
				llm:{breath:'...still loading',ready,final:true}
			})
		}
		return
	}

	// ignore old traffic at least at the sentence level
	if(blob.rcounter) {
		if(blob.rcounter <= rcounter) {
			console.warn("llm ignoring old traffic",blob)
			return
		}
		rcounter = blob.rcounter
		bcounter = blob.bcounter
	}

	// arguably could publish the fact that we are stopped... but it can be inferred
	// sys.resolve({llm:{stop:true}})

	// ignore null messages; these can be passed on purpose to force stop llm
	if(!content || !content.length) {
		return
	}

	// accumulate user utterances onto the overall request context for the llm
	request.messages.push( { role: "user", content } )

	// collect llm results until there is a whole 'breath' and then publish
	let breath = ''
	const breath_composer = (fragment=null,finished=false) => {
		if(!fragment || !fragment.length || finished) {
			if(breath.length) {
				bcounter++
				sys.resolve({
					rcounter,bcounter,
					llm:{breath,ready,final:true}
				})
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
			sys.resolve({
				rcounter,bcounter,
				llm:{breath,ready,final:false}
			})
			breath = fragment.slice(i)
		}
	}

	// begin streaming support
	engine.chat.completions.create(request).then(async (asyncChunkGenerator) => {

		for await (const chunk of asyncChunkGenerator) {
			if(!chunk.choices || !chunk.choices.length || !chunk.choices[0].delta) continue
			const content = chunk.choices[0].delta.content
			const finished = chunk.choices[0].finish_reason
			breath_composer(content,finished === 'stop')
		}

		const final = await engine.getMessage()
		request.messages.push( { role: "assistant", content:final } )
		sys.resolve({llm:{ready,final}})

	})

}

// register this listener with the pubsub backbone
sys.resolve({resolve})
