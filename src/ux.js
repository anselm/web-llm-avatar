
/////////////////////////////////////////////////////////////////////////////////////

const configuration = 'Haiku master manta ray, talks only in Haiku, what depths find you?'

/////////////////////////////////////////////////////////////////////////////////////

const content =
`
<style>

body {
	font-family: Arial, sans-serif;
	line-height: 1.6;
	color: #333;
	max-width: 800px;
	margin: 0 auto;
	padding: 20px;
	background-color: #f4f4f4;
}
h1 {
	color: #2c3e50;
	text-align: center;
}


#status-box {
	text-align: center;
	padding: 10px;
	margin-bottom: 20px;
	border-radius: 4px;
	font-weight: bold;
}
.status-ready {
	background-color: #2ecc71;
	color: #fff;
}
.status-thinking {
	background-color: #f1c40f;
	color: #333;
}
.status-pausing {
	background-color: #e7ec3c;
	color: #fff;
}
.status-speaking {
	background-color: #e74c3c;
	color: #fff;
}
.status-loading {
	background-color: #c0392b;
	color: #fff;
}


#system-content-container, #chat-container {
	background-color: #fff;
	border-radius: 8px;
	padding: 20px;
	margin-bottom: 20px;
	box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
label {
	display: block;
	margin-bottom: 5px;
	font-weight: bold;
}
textarea, input[type="text"] {
	width: 100%;
	padding: 10px;
	margin-bottom: 10px;
	border: 1px solid #ddd;
	border-radius: 4px;
	box-sizing: border-box;
}
button {
	background-color: #3498db;
	color: #fff;
	border: none;
	padding: 10px 15px;
	border-radius: 4px;
	cursor: pointer;
	transition: background-color 0.3s;
}
button:hover {
	background-color: #2980b9;
}
#messages {
	height: 300px;
	overflow-y: scroll;
	border: 1px solid #ddd;
	padding: 10px;
	margin-bottom: 10px;
	background-color: #fff;
	border-radius: 4px;
}
#chat-form {
	display: flex;
}
#message-input {
	flex-grow: 1;
	margin-right: 10px;
}
</style>

<div id="status-box" class="status-loading">Loading...</div>

<div id="system-content-container">
	<label for="system-content-input">LLM Configuration Prompt:</label>
	<textarea id="system-content-input" rows="4" placeholder="Describe how the llm should behave...">${configuration}</textarea>
</div>

<div id="chat-container">
	<div id="messages"></div>
	<form id="chat-form">
		<input type="text" id="message-input" placeholder="Type your message..." autofocus>
		<button type="submit">Send</button>
	</form>
	<button id='voice-button'>Click to enable Voice Input</button>
</div>
`

const chatdiv = document.createElement('div')
document.body.appendChild(chatdiv)
chatdiv.innerHTML = content

const messagesContainer = chatdiv.querySelector('#messages')
const chatForm = chatdiv.querySelector('#chat-form')
const messageInput = chatdiv.querySelector('#message-input')
const systemContentInput = chatdiv.querySelector('#system-content-input')
const statusBox = chatdiv.querySelector('#status-box')
const progressBar = chatdiv.querySelector('#progress-bar')
const progressText = chatdiv.querySelector('#progress-text')
const voiceButton = chatdiv.querySelector('#voice-button')

/////////////////////////////////////////////////////////////////////////////////////

let status = 'loading' // ready, pausing, speaking, thinking, loading

function setStatus(text=null,style='ready') { 
	if(!style) style = 'ready'
	if(!text) text = style
	statusBox.className = `status-${style}`;
	statusBox.textContent = text.charAt(0).toUpperCase() + text.slice(1);
}

/////////////////////////////////////////////////////////////////////////////////////

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

/////////////////////////////////////////////////////////////////////////////////////

function addTextToChatWindow(sender, text) {
	const messageElement = document.createElement('div');
	messageElement.textContent = `${sender}: ${text}`;
	messagesContainer?.appendChild(messageElement);
	if (messagesContainer) {
		messagesContainer.scrollTop = messagesContainer.scrollHeight;
	}
}

window.addEventListener('load', () => {
	messageInput.focus()
})

/////////////////////////////////////////////////////////////////////////////////////

const setSystemPrompt = () => {
	const configuration = systemContentInput.value
	sys.resolve({llm:{configuration}})
}
systemContentInput.addEventListener('input',setSystemPrompt)
setSystemPrompt()

/////////////////////////////////////////////////////////////////////////////////////

let desired = true

voiceButton.onclick = () => {
	desired = desired ? false : true
	voiceButton.innerHTML = desired ? "Click to disable voice" : "Click to enable voice"
	sys.resolve({voice:{desired}})
}
voiceButton.onclick()

/////////////////////////////////////////////////////////////////////////////////////

// a request counter that is incremented once per fresh user sentence submission
let rcounter = 1000

// a breath counter that typically is 1 - signifying a reset of the response breath fragments
let bcounter = 1

function textInputResolve(text,think) {
	// advance the entire system request counter
	rcounter += 1000
	bcounter = 1
	// explicitly abort any previous ongoing activity
	sys.resolve({
		rcounter, bcounter,
		stop:true
	})
	// if final then pass the human input to the llm to chew on
	if(think && text && text.length) {
		addTextToChatWindow('You', text)
		rcounter += 1000
		bcounter = 1
		sys.resolve({
			rcounter,bcounter,
			llm:{content:text}
		})
		setStatus(null,'thinking')
	} else {
		setStatus(null,'ready')		
	}
}

// Pass user requests to llm
chatForm.addEventListener('submit', async (e) => {
	e.preventDefault()
	textInputResolve(messageInput.value.trim(),true)
	messageInput.value = ''
})

/////////////////////////////////////////////////////////////////////////////////////

// Watch traffic
const resolve = (blob) => {

	// voice recognition has performed stt on human vocalizations; display as text
	if(blob.voice && blob.voice.input) {
		messageInput.value = blob.voice.input
		if(blob.voice.final) {
			// for now don't actually send the request
			textInputResolve(blob.voice.input,false)
		}
		return
	}

	// set visible display of llm readiness as requested
	if(blob.status) {
		setStatus(null,blob.status)
		return
	}

	// ignore traffic not from llm after this line
	if(!blob.llm) return

	// display status messages for the act of loading the llm since it is very slow
	if(blob.llm.status) {
		if(blob.llm.status.text) {
			const text = blob.llm.status.text
			blob.llm.status.progress >= 1.0 ? setStatus(null,'ready') : setStatus(text,'loading')
			//const match = text.match(/Loading model from cache\[(\d+)\/(\d+)\]/);
			//if (match) {
			//	const [current, total] = match.slice(1).map(Number);
			//	//updateProgressOnDisplay(current, total);
			//}
		}
		return
	}

	// llm has finished an breaths worth of talking; publish to display
	if(blob.llm.breath) {
		addTextToChatWindow('system',blob.llm.breath)
	}

	// llm has finished all talking for this round
	if(blob.llm.final) {
		setStatus(null,'ready')
	}

}

sys.resolve({resolve})

