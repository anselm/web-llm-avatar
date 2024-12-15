
const uuid = 'llm_system'

// feels easiest to just fetch these from the web
import * as webllm from "https://esm.run/@mlc-ai/web-llm"

// this is the only model that behaves well

const selectedModel = "Llama-3.1-8B-Instruct-q4f32_1-MLC"

// these models just seem to behave badly in a variety of different ways
//const selectedModel = "TinyLlama-1.1B-Chat-v0.4-q4f16_1-MLC"
//const selectedModel = 'snowflake-arctic-embed-s-q0f32-MLC-b4'
//const selectedModel = "Llama-3.2-3B-Instruct-q4f16_1-MLC"
// Llama-3.2-1B-Instruct-q4f16_1-MLC
// const selectedModel = "SmolLM2-360M-Instruct-q4f16_1-MLC" // this works and is extremely stupid

// length of an utterance till it is considered 'a full breaths worth'
const MIN_BREATH_LENGTH = 20

// local flags for background loaded llm
let engine = null
let loading = false
let ready = false

// worker - as a string because dynamic imports are a hassle with rollup/vite
const workerString = `
import * as webllm from 'https://esm.run/@mlc-ai/web-llm';
const handler = new webllm.WebWorkerMLCEngineHandler();
self.onmessage = (msg) => { handler.onmessage(msg); };
`

async function load() {
	if(loading) return
	loading = true

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

async function llm_resolve(agent,blob) {

	// stop this llm
	if(agent.thinking) {
		// if local then stop
		if(agent.engine && agent.engine.interruptGenerate) {
			agent.engine.interruptGenerate()
			agent.thinking = false
		}
		// @todo stop remote
	}

	// if utterance is incomplete (such as merely a barge in) then done
	if(!blob.human || !blob.human.final) return

	// get text if any
	const text = blob.human.text

	const llm = agent.llm

	// set llm pre-prompt configuration
	if(blob.human.systemContent) {
		llm.messages[0].content = blob.human.systemContent
	}

	// stuff new human utterance onto the llm reasoning context
	llm.messages.push( { role: "user", content:text } )

	// when was most recent bargein detected?
	if(blob.human && blob.human.interrupt) agent._bargein = blob.human.interrupt

	// this is the highest counter that the callbacks will know about
	const rcounter = blob.human.rcounter || 1
	let bcounter = blob.human.bcounter || 1
	const interrupt = blob.human.interrupt || 0

/*
//// TEST a flowise flow

try {

    const response = await fetch(
        "http://localhost:3020/api/v1/prediction/8057ad20-37f4-4cd7-8688-5dc135f5cecb",
        {
            method: "POST",
            headers: {
                Authorization: "Bearer OS-ncOA5-h6CqaNLwmfe-jkBMTW9ThMxNkKr-d00etc",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({"question":"what is up?"})
        }
    );

    const result = await response.json();

if(!result.text) {
	console.error("*********** no text",result)
	return
}


const sentences = result.text.split(/[.!?]|,/);

sentences.forEach(breath => {

sys({breath:{breath,ready:true,final:true,rcounter,bcounter,interrupt}})

})


} catch(err) {
	console.error(err)
}

return


//////////////////////////
*/
	//
	// remote support
	//

	// @tbd
	if(!agent.llm_local) {
		sys({breath:{breath:'you will need to supply an openai key and url - or set local above',ready:false,final:true}})
		return
	}

	//
	// local support
	//

	// if got something to say but not ready and is local then try load and just report not ready
	if(!ready) {
		load()
		sys({breath:{breath:'...still loading',ready:false,final:true}})
		return
	}

	// start reasoning
	blob.thinking = true

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
			if(blob._bargein > interrupt) return
			breath_helper(content,finished === 'stop')
		}

		// stuff the final message onto the llm history
		const paragraph = await engine.getMessage()
		llm.messages.push( { role: "assistant", content:paragraph } )

		// is our work out of date? @todo call engine.interruptGenerate()?
		if(blob._bargein > interrupt) return
		sys({breath:{paragraph,breath:'',ready,final:true,rcounter,bcounter,interrupt}})
	}

	// begin streaming support of llm text responses as breath chunks
	engine.chat.completions.create(llm).then(helper)
}



////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// llm-helper resolve
///
/// listens for things like {human:{text:"how are you?"}}
///
/// publishes {llm:{breath:"llm response fragment",final:true|false}}
///
////////////////////////////////////////////////////////////////////////////////////////////////////

async function resolve(blob,sys) {

	// right now i am tracking the llm entities and then sending traffic onwards to handlers for them
	// @todo perhaps this can be generalized or improved

	// ignore
	if(blob.tick || blob.time) return

	// store llm if any
	if(blob.llm && blob.uuid) {
		this._llms[blob.uuid] = blob
	}

	// if traffic from a human then direct to an llm
	if(blob.human) {
		let llms = Object.values(this._llms)
		if(!llms.length) return
		let agent = this._llms[blob.human.target||'default'] || llms[0]
		if(agent) {
			await llm_resolve(agent,blob)
		}
	}

	// configuration hack - local or remote?
	if(blob.llm_configure) {
		let llms = Object.values(this._llms)
		if(!llms.length) return
		let agent = llms[0]
		agent.llm_local = blob.llm_configure.local
		agent.llm_url = blob.llm_configure.url
		if(agent.llm_local) load()
	}
}

export const llm_system = {
	uuid,
	resolve,
	_bargein:0,
	_llms: {}
	//singleton: true // an idea to distinguish systems from things that get multiply instanced @todo
}
