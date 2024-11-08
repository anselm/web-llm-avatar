import*as W from"https://esm.run/@mlc-ai/web-llm";(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))o(r);new MutationObserver(r=>{for(const s of r)if(s.type==="childList")for(const i of s.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&o(i)}).observe(document,{childList:!0,subtree:!0});function n(r){const s={};return r.integrity&&(s.integrity=r.integrity),r.referrerPolicy&&(s.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?s.credentials="include":r.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function o(r){if(r.ep)return;r.ep=!0;const s=n(r);fetch(r.href,s)}})();const d=[],j=e=>{if(e.resolve){for(let t=0;t<d.length;t++){const n=d[t];if(e===n||e.resolve===n.resolve||e.id&&e.id===n.id){e.obliterate&&d.splice(t,1);return}}d.push(e),console.log("sys resolve - adding resolver",e)}};d.push({id:"sys/resolver_resolver",resolve:j});const A=e=>{e.obliterate&&e.parent&&e.parent.children?e.parent.children=e.parent.children.filter(t=>t.id!==e.id):e.parent&&(e.parent.children||(e.parent.children=[]),e.parent.children.find(n=>n===e)||e.parent.children.push(e))};d.push({id:"sys/family_resolver",resolve:A});const g=[],R=async e=>{if(g.push(e),g.length>1)return null;for(;g.length;){e=g[0],console.log("sys traffic:",e.id,e);for(const t of d)await t.resolve(e);g.shift()}return e};globalThis.sys={id:"sys/resolver",resolve:R};const U="Llama-3.1-8B-Instruct-q4f32_1-MLC",N=20,v={stream:!0,messages:[{role:"system",content:"You are a helpful digital agent"}],temperature:.3,max_tokens:256,breath:""};let u=null,l=!1;const S=`
import * as webllm from 'https://esm.run/@mlc-ai/web-llm';
const handler = new webllm.WebWorkerMLCEngineHandler();
self.onmessage = (msg) => { handler.onmessage(msg); };
`;async function F(){const e=new Worker(URL.createObjectURL(new Blob([S],{type:"text/javascript"})),{type:"module"});u=await W.CreateWebWorkerMLCEngine(e,U,{initProgressCallback:t=>{sys.resolve({llm:{ready:l,status:t}})}}),l=!0,sys.resolve({llm:{ready:l}})}F();let x=0,h=0;function H(e){if(e.stop){if(!u||!u.interruptGenerate)return;u.interruptGenerate();return}if(!e.llm)return;if(e.llm&&e.llm.configuration){v.messages[0].content=e.llm.configuration;return}if(!e.llm.hasOwnProperty("content"))return;const t=e.llm.content;if(!u||!l){t&&t.length&&sys.resolve({llm:{breath:"...still loading",ready:l,final:!0}});return}if(e.rcounter){if(e.rcounter<=x){console.warn("llm ignoring old traffic",e);return}x=e.rcounter,h=e.bcounter}if(!t||!t.length)return;v.messages.push({role:"user",content:t});let n="";const o=(r=null,s=!1)=>{if(!r||!r.length||s){n.length&&(h++,sys.resolve({rcounter:x,bcounter:h,llm:{breath:n,ready:l,final:!0}}),n="");return}const i=r.match(/.*?[.,!?]/);if(n.length<N||!i)n+=r;else{const y=i[0].length;n+=r.slice(0,y),h++,sys.resolve({rcounter:x,bcounter:h,llm:{breath:n,ready:l,final:!1}}),n=r.slice(y)}};u.chat.completions.create(v).then(async r=>{for await(const i of r){if(!i.choices||!i.choices.length||!i.choices[0].delta)continue;const y=i.choices[0].delta.content,O=i.choices[0].finish_reason;o(y,O==="stop")}const s=await u.getMessage();v.messages.push({role:"assistant",content:s}),sys.resolve({llm:{ready:l,final:s}})})}sys.resolve({resolve:H});const D="You are an oceanic manta ray living near a pristine coral reef concerned not with mortal desires but only with the sea.",G=`
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
	<textarea id="system-content-input" rows="4" placeholder="Describe how the llm should behave...">${D}</textarea>
</div>

<div id="chat-container">
	<div id="messages"></div>
	<form id="chat-form">
		<input type="text" id="message-input" placeholder="Type your message..." autofocus>
		<button type="submit">Send</button>
	</form>
	<button id='voice-button'>Click to enable Voice Input</button>
</div>
`,$=document.createElement("div");$.innerHTML=G;document.body.appendChild($);const f=document.getElementById("messages"),Y=document.getElementById("chat-form"),I=document.getElementById("message-input"),C=document.getElementById("system-content-input"),M=document.getElementById("status-box");document.getElementById("progress-bar");document.getElementById("progress-text");document.getElementById("voice-button");function L(e,t=null){t||(t=e||"ready"),M.className=`status-${t}`,M.textContent=e.charAt(0).toUpperCase()+e.slice(1)}function P(e,t){const n=document.createElement("div");n.textContent=`${e}: ${t}`,f==null||f.appendChild(n),f&&(f.scrollTop=f.scrollHeight)}window.addEventListener("load",()=>{I.focus()});const T=()=>{const e=C.value;sys.resolve({llm:{configuration:e}})};C.addEventListener("input",T);T();let E=1e4,w=1;Y.addEventListener("submit",async e=>{e.preventDefault(),E+=1e4,w=1,sys.resolve({rcounter:E,bcounter:w,stop:!0});const t=I.value.trim();t.length&&(w++,P("You",t),sys.resolve({rcounter:E,bcounter:w,llm:{content:t}}),L("thinking")),I.value=""});const z=e=>{if(e.status&&L(e.status),!!e.llm){if(e.llm.status){if(e.llm.status.text){const t=e.llm.status.text;if(e.llm.status.progress>=1){L("ready");return}L(t,"loading")}return}e.llm.breath&&P("system",e.llm.breath),e.llm.final}};sys.resolve({resolve:z});const K=`
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
`,_=new Worker(URL.createObjectURL(new Blob([K],{type:"text/javascript"})),{type:"module"});function B(e){const t=["","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen"],n=["","","twenty","thirty","forty","fifty","sixty","seventy","eighty","ninety"],o=r=>r<20?t[r]:r<100?n[Math.floor(r/10)]+(r%10?"-"+t[r%10]:""):r<1e3?t[Math.floor(r/100)]+" hundred"+(r%100?" and "+o(r%100):""):o(Math.floor(r/1e3))+" thousand"+(r%1e3?" "+o(r%1e3):"");return o(e)}function V(e){const[t,n]=e.toFixed(2).split("."),o=B(parseInt(t)),r=B(parseInt(n));return`${o} dollars${n>0?" and "+r+" cents":""}`}function J(e){return e.replace(/\$\d+(\.\d{1,2})?/g,t=>{const n=parseFloat(t.replace("$",""));return V(n)})}let m=null,c=[],a=[];let p=0;const q=async e=>{if(e&&(c.push(e),c.length!==1)||!c.length)return;if(e=c[0],e.rcounter&&e.rcounter<p){console.warn("... audio noticed an old request... abandoning");return}const t=performance.now();c.length,await new Promise((o,r)=>{const s=new Audio;s.preload="auto",s.autoplay=!0,s.onerror=r,s.onended=o,s.src=URL.createObjectURL(e.wav),sys.resolve({status:"speaking"}),s.play(),m=s}),m=null;const n=performance.now();c.shift(),n-t,c.length,a.length,sys.resolve({status:c.length||a.length?"pausing":"ready"}),q()},k=async(e=null)=>{if(e&&(a.push(e),a.length!==1)||!a.length)return;if(e=a[0],e.rcounter&&e.rcounter<p){console.warn("... tts noticed an old request... abandoning"),a.shift(),k();return}let t=e.llm.breath;if(t=J(t),t=t.replace(/[*<>#%-]/g,""),!t.length){console.warn("... tts empty text"),a.shift(),k();return}performance.now(),_.onmessage=async n=>{const o=n&&n.data?n.data.wav:null;!o||e.rcounter&&e.rcounter<p||q({wav:o,text:t}),performance.now(),a.shift(),k()},_.postMessage({text:t})};function Q(e){if(e.stop){e.rcounter&&(p=e.rcounter),e.bcounter&&e.bcounter,m&&(m.pause(),m.currentTime=0,m=null),c=[],a=[];return}if(!(!e.llm||!e.llm.breath)){if(e.rcounter){if(e.rcounter<p)return;p=e.rcounter,e.bcounter}k(e)}}sys.resolve({resolve:Q});
