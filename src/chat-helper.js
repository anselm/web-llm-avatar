
const configuration = 'You are an oceanic manta ray living near a pristine coral reef concerned not with mortal desires but only with the sea.'

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

const div = document.createElement('div')
div.innerHTML = content
document.body.appendChild(div)

// @todo at least use querySelector
const messagesContainer = document.getElementById('messages');
const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const systemContentInput = document.getElementById('system-content-input');
const statusBox = document.getElementById('status-box');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const voiceButton = document.getElementById('voice-button');

let status = 'loading'

function setStatus(status,code=null) { // ready, speaking, thinking, loading
	if(!code) code = status || "ready"
	statusBox.className = `status-${code}`;
	statusBox.textContent = status.charAt(0).toUpperCase() + status.slice(1);
}

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

function addMessageToDisplay(sender, text) {
	const messageElement = document.createElement('div');
	messageElement.textContent = `${sender}: ${text}`;
	messagesContainer?.appendChild(messageElement);
	if (messagesContainer) {
		messagesContainer.scrollTop = messagesContainer.scrollHeight;
	}
}

// As a convenience for users please focus the message input when the page loads
window.addEventListener('load', () => {
	messageInput.focus()
})

// A user can change preprompt, if so then write it back into the prompt

const configure = () => {
	const configuration = systemContentInput.value
	sys.resolve({llm:{configuration}})
}
systemContentInput.addEventListener('input',configure)
configure()

let rcounter = 10000
let bcounter = 1

// Pass user requests to llm
chatForm.addEventListener('submit', async (e) => {
	e.preventDefault()
	rcounter += 10000
	bcounter = 1
	sys.resolve({
		rcounter, bcounter,
		stop:true
	})
	const content = messageInput.value.trim()
	if(content.length) {
		bcounter++
		addMessageToDisplay('You', content)
		sys.resolve({
			rcounter,bcounter,
			llm:{content}
		})
		setStatus('thinking')
	}
	messageInput.value = ''
})

// Watch traffic
const resolve = (blob) => {

	if(blob.status) {
		setStatus(blob.status)
	}

	if(!blob.llm) return

	// status messages for the act of loading the llm since it is very slow
	if(blob.llm.status) {
		if(blob.llm.status.text) {
			const text = blob.llm.status.text
			if(blob.llm.status.progress >= 1.0 ) {
				setStatus('ready')
				return
			}
			setStatus(text,'loading')
			//const match = text.match(/Loading model from cache\[(\d+)\/(\d+)\]/);
			//if (match) {
			//	const [current, total] = match.slice(1).map(Number);
			//	//updateProgressOnDisplay(current, total);
			//}
		}
		return
	}

	// llm has finished an breaths worth of talking
	if(blob.llm.breath) {
		addMessageToDisplay('system',blob.llm.breath)
	}

	// llm has finished all talking for this round
	if(blob.llm.final) {
	}

}

sys.resolve({resolve})

