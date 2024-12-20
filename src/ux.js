
const uuid = 'ux_system'

/////////////////////////////////////////////////////////////////////////////////////
// ux will bind directly to the index.html layout - good enough for this project
/////////////////////////////////////////////////////////////////////////////////////

const chatdiv = document.body // createElement('div')
// document.body.appendChild(chatdiv)
//chatdiv.innerHTML = content

const messagesContainer = chatdiv.querySelector('#messages')
const messageInput = chatdiv.querySelector('#message-input')
const chatForm = chatdiv.querySelector('#chat-form')
const systemContentInput = chatdiv.querySelector('#system-content-input')
const statusBox = chatdiv.querySelector('#status-box')
const progressBar = chatdiv.querySelector('#progress-bar')
const progressText = chatdiv.querySelector('#progress-text')
const voiceButton = chatdiv.querySelector('#voice-button')

//
// utility to paint status to display
//

let status = 'loading' // ready, pausing, speaking, thinking, loading

function setStatus(text='Ready',style='ready') { 
	if(!style) style = 'ready'
	if(!text || typeof text !== 'string') text = style
	statusBox.className = `status-${style}`
	statusBox.textContent = text.charAt(0).toUpperCase() + text.slice(1);
}

//
// utility to paint update progress to display
//

function updateProgress(current, total) {

	if(!current && !total) {
		progressBar.style.display = 'none'
		progressText.style.display = 'none'
		return
	}
	progressBar.style.display = 'block'
	progressText.style.display = 'block'

	const percentage = (current / total) * 100
	if (progressBar && progressText) {
		progressBar.value = percentage
		progressText.textContent = `${current}/${total} (${percentage.toFixed(1)}%)`
	}
}

//
// utility to add a new line of text to display
//

function addTextToChatWindow(sender, text) {
	if(!text || !text.length) return
	const messageElement = document.createElement('div');
	messageElement.textContent = `${sender}: ${text}`;
	messagesContainer?.appendChild(messageElement);
	if (messagesContainer) {
		messagesContainer.scrollTop = messagesContainer.scrollHeight;
	}
}

//
// message input support
// rcounter tracks total messages
//

let rcounter = 1
let typing = 0

const handle_user_text_input = (event) => {
	typing++
	if (event.type === 'submit' || (event.type === 'keydown' && event.key === 'Enter')) {
		event.preventDefault()
		typing = 0
		const text = messageInput.value.trim()
		const interrupt = performance.now()
		sys({
			human:{
				text,
				confidence:1,
				spoken:false,
				final:true,
				interrupt,
				rcounter,
				bcounter:1,
				bargein:true
			}
		})
		rcounter++
	}
}

messageInput.focus()
messageInput.addEventListener('keydown', handle_user_text_input )
chatForm.addEventListener('submit', handle_user_text_input )

//
// handle buttons
//

let allow_localllm = false
let allow_bargein = false
let allow_microphone = false
let allow_autosubmit = false
let llm_url = "https://api.openai.com/v1/chat/completions"
let llm_auth = ""

// voice on/off enabled versus desired - @todo revisit
let desired = true

function handleSwitch(switchId, state=false) {
	switch (switchId) {
		case 'local-llm':
			console.log("...local",state)
			allow_localllm = state
			// turn local on or off
			// @todo add local url support
			sys({llm_configure:{local:allow_localllm,url:llm_url,auth:llm_auth}})
			break;
		case 'microphone':
			allow_microphone = state
			// turn microphone off or on @todo
			break;
		case 'barge-in':
			allow_bargein = state
			break;
		case 'auto-submit':
			allow_autosubmit = state
			break;
		default:
	}
}


//
// utility to fire an event to enable the built in speech recognizer (as opposed to whisper which is on by default)
//

voiceButton.onclick = () => {
	desired = desired ? false : true
	voiceButton.innerHTML = desired ? "Using Built In STT" : "Using Whisper STT"
	sys({stt:{desired}})
}
voiceButton.onclick()


// hack for now exposed @todo
globalThis.handleSwitch = handleSwitch

/////////////////////////////////////////////////////////////////////////////////////
// ux helper singleton - watches pub sub events
/////////////////////////////////////////////////////////////////////////////////////

async function resolve(blob,sys) {

	// paint 'ready' when actually done talking - @todo this feels a bit sloppy
	if(blob.audio_done && blob.audio_done.final) {
		setStatus('Ready')
	}

	// paint general status messages
	if(blob.status) {
		setStatus(blob.status.text,blob.status.color || 'loading')
		//blob.status.progress >= 1.0 ? setStatus(null,'ready') : setStatus(text,'loading')
		//const match = text.match(/Loading model from cache\[(\d+)\/(\d+)\]/);
		//if (match) {
		//	const [current, total] = match.slice(1).map(Number);
		//	//updateProgressOnDisplay(current, total);
		//}
	}

	// visually indicate status based on llm breath traffic
	if(blob.breath) {
		if(blob.breath.breath) {
			addTextToChatWindow('system',blob.breath.breath)
		}
		if(blob.breath.final) {
			setStatus('Done Thinking','thinking')
		}
	}

	// human bargein / input - the goal here is to enhance the packet and pass it onwards
	if(!blob.human) return
	const human = blob.human
	const text = human.text

	// workaround - sometimes barge-ins will occur without any closure - and ux will be hung
	if(human.spoken) {
		if(this._vad_timeout) clearTimeout(this._vad_timeout)
		this._vad_timeout = 0
		if(!human.final) {
			this._vad_timeout = setTimeout( ()=> {
				console.log(uuid,'...resetting to ready')
				// disabled for now - annoying to flush text
				//messageInput.value = ''
				setStatus('Ready')
			},5000)
		}
	}

	// not final? no actual text? just provide some useful feedback, show voice input and return
	if(!human.final || !text.length) {
		if(human.spoken) {
			// disabled because the stt wasm blob never reports partials and it is annoying to flush text
			//messageInput.value = text // dump partial spoken into chat input
		}
		setStatus(human.comment ? human.comment : 'Pondering','thinking')

		// a rare example of forcing the underlying pub sub system to abort the pub-sub flow
		if(!allow_bargein) {
			delete blob.human
			return { force_abort_sys: true }
		}

		return
	}

	// stuff the system content in
	human.systemContent = systemContentInput.value

	// on spoken input while typing - ignore
	if(typing && human.spoken) {
		addTextToChatWindow('Support',`Ignoring spoken text while typing: ${human.text}`)
		return { force_abort_sys: true }
	}

	// hack: block auto-voice submit by wrecking the packet - and push it to the text window only
	if(human.spoken && !allow_autosubmit) {
		messageInput.value = text
		delete blob.human
		setStatus('Heard full sentence','ready')
		return
	}

	// debugging - bypass llm if text starts with 'say'
	if(text.startsWith('say') && text.length > 5) {
		messageInput.value = ''
		const breath = text.substring(4)
		const interrupt = performance.now()
		sys({breath:{breath,interrupt,ready:true,final:true}})
		return { force_abort_sys: true }
	}

	// debugging - auth, url
	if(text.startsWith('auth') && text.length > 5) {
		messageInput.value = ''
		llm_auth = text.substring(5).trim()
		const interrupt = performance.now()
		sys({llm_configure:{local:allow_localllm,url:llm_url,auth:llm_auth}})
		addTextToChatWindow('Support','Set Remote Auth')
		return { force_abort_sys: true }
	}

	// debugging - auth, url
	if(text.startsWith('url') && text.length > 5) {
		messageInput.value = ''
		llm_url = text.substring(4).trim()
		const interrupt = performance.now()
		sys({llm_configure:{local:allow_localllm,url:llm_url,auth:llm_auth}})
		addTextToChatWindow('Support','Set Remote URL')
		return { force_abort_sys: true }
	}

	// debugging - if user says 'stop' then stop; leveraging barge in detector implicitly
	if(text === "stop" || text === "please stop" || text === "ok stop") {
		messageInput.value = ''
		human.text = ''
		addTextToChatWindow('Support','Stopped everything')
		setStatus('Stopped!','ready')
		return // actually let empty packet flow thru - do not do { force_abort_sys: true }
	}

	// clear human text from chat input box now - since it may be set by voice
	messageInput.value = ''

	// paint human text to chat history box
	addTextToChatWindow('You', text)

	// pretend we are in a multi agent scenario; there can be multiple llms and multiple puppets
	// decide on one to associate the traffic with as a target
	// as the packet continues to flow through all observers the llm-system will use this fact

	human.target = 'default'

	// try provide some reasonable feedback at this time
	setStatus('Thinking','thinking')
}

export const ux_system = {
	uuid,
	ux:{ targets:{} },
	resolve,
	//singleton: true // an idea to distinguish systems from things that get multiply instanced @todo
}
