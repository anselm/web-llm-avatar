
const uuid = 'ux_entity'

/////////////////////////////////////////////////////////////////////////////////////
// ux will bind directly to the index.html layout - good enough for this project
/////////////////////////////////////////////////////////////////////////////////////

const chatdiv = document.body // createElement('div')
// document.body.appendChild(chatdiv)
//chatdiv.innerHTML = content

const messagesContainer = chatdiv.querySelector('#messages')
const chatForm = chatdiv.querySelector('#chat-form')
const messageInput = chatdiv.querySelector('#message-input')
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
// focus the input handler for convenience
//

messageInput.focus()

//
// utility to fire an event to enable the built in speech recognizer (as opposed to whisper which is on by default)
//

let desired = true

voiceButton.onclick = () => {
	desired = desired ? false : true
	voiceButton.innerHTML = desired ? "Using Built In STT" : "Using Whisper STT"
	sys({stt:{desired}})
}
voiceButton.onclick()

//
// utility to fire a human text event on the user hitting return on the input dialog
//

let rcounter = 1

chatForm.addEventListener('submit', async (e) => {
	e.preventDefault()
	sys({
		human:{
			text:messageInput.value,
			confidence:1,
			spoken:false,
			final:true,
			interrupt:performance.now(),
			rcounter,
			bcounter:1,
			bargein:true
		}
	})
	rcounter++
})

/////////////////////////////////////////////////////////////////////////////////////
// ux helper singleton - watches pub sub events
/////////////////////////////////////////////////////////////////////////////////////

function resolve(blob,sys) {

	//
	// paint 'ready' when actually done talking - @todo this feels a bit sloppy
	//

	if(blob.audio_done && blob.audio_done.final) {
		setStatus('Ready')
	}

	//
	// paint general status messages
	//

	if(blob.status) {
		setStatus(blob.status.text,blob.status.color || 'loading')
		//blob.status.progress >= 1.0 ? setStatus(null,'ready') : setStatus(text,'loading')
		//const match = text.match(/Loading model from cache\[(\d+)\/(\d+)\]/);
		//if (match) {
		//	const [current, total] = match.slice(1).map(Number);
		//	//updateProgressOnDisplay(current, total);
		//}
	}

	//
	// indicate status based on llm breath traffic
	//

	if(blob.breath) {
		if(blob.breath.breath) {
			addTextToChatWindow('system',blob.breath.breath)
		}
		if(blob.breath.final) {
			setStatus('Done Thinking','thinking')
		}
	}

	//
	// human bargein / input - append a few details to the packet
	//

	if(!blob.human) return

	const human = blob.human

	// get text if any and sanitize a bit
	const text = human.text ? human.text.trim() : ""

	// hack: the vad will misfire sometimes and never finish - so use a timeout for that case only
	if(human.spoken) {
		if(this._vad_timeout) clearTimeout(this._vad_timeout)
		this._vad_timeout = 0
		if(!human.final) {
			this._vad_timeout = setTimeout( ()=> {
				console.log('...resetting to ready')
				setStatus('Ready')
			},5000)
		}
	}

	// not final? no actual text? just provide some useful feedback, show voice input and return
	if(!human.final || !text.length) {
		if(human.spoken) {
			messageInput.value = text
		}
		setStatus(human.comment ? human.comment : 'Pondering','thinking')
		return
	}

	// debugging - bypass llm if text starts with 'say'
	if(text.startsWith('say') && text.length > 5) {
		const breath = content.substring(4)
		const interrupt = performance.now()
		sys({breath:{breath,interrupt,ready:true,final:true}})
		return
	}

	// debugging - if user says 'stop' then stop; leveraging barge in detector implicitly
	if(text.startsWith("stop")) {
		messageInput.value = text
		human.text = ''
		setStatus('Stopped!','ready')
		return
	}

	// clear human text from chat input box now - since it may be set by voice
	messageInput.value = ''

	// paint human text to chat history box
	addTextToChatWindow('You', text)

	// find a target entity to talk to and then use its llm context - for future multi agent scenarios
	const name = human.target = 'default'
	let llm = blob.human.llm = this.ux.targets[name]
	if(!llm) {
		llm = blob.human.llm = this.ux.targets[name] = {
			stream: true,
			messages: [
				{
					role: "system",
					content: systemContentInput.value
				}
			],
			temperature: 0.3,
			max_tokens: 256,
			breath: ''
		}
	}

	// set llm pre-prompt configuration
	llm.messages[0].content = systemContentInput.value

	// stuff new human utterance onto the llm reasoning context
	llm.messages.push( { role: "user", content:text } )

	// try provide some reasonable feedback at this time
	setStatus('Thinking','thinking')
}

export const ux_entity = {
	uuid,
	ux:{ targets:{} },
	resolve,
}
