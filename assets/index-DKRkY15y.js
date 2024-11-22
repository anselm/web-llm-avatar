import"https://cdn.jsdelivr.net/npm/orbital-sys@1.0.3/sys.js/+esm";import*as O from"https://esm.run/@mlc-ai/web-llm";(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))s(n);new MutationObserver(n=>{for(const i of n)if(i.type==="childList")for(const r of i.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&s(r)}).observe(document,{childList:!0,subtree:!0});function o(n){const i={};return n.integrity&&(i.integrity=n.integrity),n.referrerPolicy&&(i.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?i.credentials="include":n.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function s(n){if(n.ep)return;n.ep=!0;const i=o(n);fetch(n.href,i)}})();const j="Llama-3.1-8B-Instruct-q4f32_1-MLC",C=20,g={stream:!0,messages:[{role:"system",content:"You are a helpful digital agent"}],temperature:.3,max_tokens:256,breath:""};let u=null,l=!1;const N=`
import * as webllm from 'https://esm.run/@mlc-ai/web-llm';
const handler = new webllm.WebWorkerMLCEngineHandler();
self.onmessage = (msg) => { handler.onmessage(msg); };
`;async function P(){const e=new Worker(URL.createObjectURL(new Blob([N],{type:"text/javascript"})),{type:"module"});u=await O.CreateWebWorkerMLCEngine(e,j,{initProgressCallback:t=>{sys({llm:{ready:l,status:t}})}}),l=!0,sys({llm:{ready:l}})}P();let k=0,p=0;function R(e){if(e.rcounter){if(e.rcounter<=k){console.warn("llm ignoring old traffic",e);return}k=e.rcounter,p=e.bcounter}if(e.stop){if(!u||!u.interruptGenerate)return;u.interruptGenerate();return}if(!e.llm)return;if(e.llm&&e.llm.configuration){g.messages[0].content=e.llm.configuration;return}if(!e.llm.hasOwnProperty("content"))return;const t=e.llm.content;if(!t||!t.length)return;if(!u||!l){sys({llm:{breath:"...still loading",ready:l,final:!0}});return}g.messages.push({role:"user",content:t});let o="";const s=(n=null,i=!1)=>{if(!n||!n.length||i){o.length&&(p++,sys({rcounter:k,bcounter:p,llm:{breath:o,ready:l,final:!0}}),o="");return}const r=n.match(/.*?[.,!?]/);if(o.length<C||!r)o+=n;else{const h=r[0].length;o+=n.slice(0,h),p++,sys({rcounter:k,bcounter:p,llm:{breath:o,ready:l,final:!1}}),o=n.slice(h)}};u.chat.completions.create(g).then(async n=>{for await(const r of n){if(!r.choices||!r.choices.length||!r.choices[0].delta)continue;const h=r.choices[0].delta.content,I=r.choices[0].finish_reason;s(h,I==="stop")}const i=await u.getMessage();g.messages.push({role:"assistant",content:i}),sys({llm:{ready:l,final:i}})})}sys({resolve:R});const W=`
import * as tts from 'https://cdn.jsdelivr.net/npm/@diffusionstudio/vits-web@1.0.3/+esm'
self.addEventListener('message', (e) => {
	if(!e || !e.data || !e.data.voice || !e.data.voice.text) return
	tts.predict({text:e.data.voice.text,voiceId: 'en_US-hfc_female-medium'}).then(audio => {
		console.log("tts got audio",audio)
		new Promise((resolve, reject) => {
			const reader = new FileReader()
			reader.onload = () => resolve(reader.result)
			reader.onerror = () => reject(reader.error)
			reader.readAsArrayBuffer(audio)
		}).then(audio => {
			console.log("tts got audio 2",audio)
			e.data.voice.audio = audio
			self.postMessage(e.data)			
		})
	})
})
`,S=new Worker(URL.createObjectURL(new Blob([W],{type:"text/javascript"})),{type:"module"});function T(e){const t=["","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen"],o=["","","twenty","thirty","forty","fifty","sixty","seventy","eighty","ninety"],s=n=>n<20?t[n]:n<100?o[Math.floor(n/10)]+(n%10?"-"+t[n%10]:""):n<1e3?t[Math.floor(n/100)]+" hundred"+(n%100?" and "+s(n%100):""):s(Math.floor(n/1e3))+" thousand"+(n%1e3?" "+s(n%1e3):"");return s(e)}function $(e){const[t,o]=e.toFixed(2).split("."),s=T(parseInt(t)),n=T(parseInt(o));return`${s} dollars${o>0?" and "+n+" cents":""}`}function B(e){return e.replace(/\$\d+(\.\d{1,2})?/g,t=>{const o=parseFloat(t.replace("$",""));return $(o)})}let c=[],_=0;const x=async(e=null)=>{if(e&&(c.push(e),c.length!==1)||!c.length)return;if(e=c[0],e.rcounter&&e.rcounter<_){console.warn("... tts noticed an old request... abandoning",e),c.shift(),x();return}let t=B(e.llm.breath);if(t=t.replace(/[*<>#%-]/g,""),!t.length){c.shift(),x();return}S.onmessage=async s=>{if(!s.data.voice.audio||s.data.rcounter<_){console.log("... tts noticed an old request... abandoning",s.data);return}sys.resolve(s.data),c.shift(),x()};const o={rcounter:e.rcounter,bcounter:e.bcounter,voice:{text:t}};S.postMessage(o)};function G(e){if(e.rcounter){if(e.rcounter<_)return;_=e.rcounter,e.bcounter}e.stop&&(c=[]),e.llm&&e.llm.breath&&x(e)}sys.resolve({resolve:G});let L=0;const q={context:null,audioqueue:[],start:function(){this.context||(this.context=new AudioContext({sampleRate:16e3}))},queue:function(e=null){if(!this.context||e&&(this.audioqueue.push(e),this.audioqueue.length!==1))return;if(!this.audioqueue.length){sys.resolve({audioqueue:"done"});return}if(e=this.audioqueue[0],e.rcounter&&e.rcounter<L){console.warn("... audio noticed an old request... abandoning");return}const t=o=>{if(!o||!o.target){console.error("... voice issue with sound end");return}this.sound&&(this.sound.disconnect(),this.sound=null),this.audioqueue.shift(),this.queue()};this.context.decodeAudioData(e.voice.audio,o=>{const s=this.sound=this.context.createBufferSource();s.buffer=o,s.connect(this.context.destination),s.addEventListener("ended",t),s.start()})},stop:function(){this.audioqueue=[],this.sound&&(this.sound.disconnect(),this.sound=null)}};q.start();function H(e){if(e.rcounter){if(e.rcounter<L)return;L=e.rcounter,e.bcounter}e.stop&&q.stop(),e.voice&&e.voice.audio&&q.queue(e)}sys({resolve:H});function K(){let e=!1;return function(t){(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(t)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(t.substr(0,4)))&&(e=!0)}(navigator.userAgent||navigator.vendor||("opera"in window&&typeof window.opera=="string"?window.opera:"")),e}K();const f={SAMPLING_RATE:16e3,DEFAULT_AUDIO_URL:"https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/jfk.wav",DEFAULT_MODEL:"Xenova/whisper-tiny",DEFAULT_SUBTASK:null,DEFAULT_LANGUAGE:null,DEFAULT_QUANTIZED:!0,DEFAULT_MULTILINGUAL:!1},V=`
import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';

console.log(pipeline)

// Disable local models
env.allowLocalModels = false;

// Define model factories
// Ensures only one model is created of each type
class PipelineFactory {
    static task = null;
    static model = null;
    static quantized = null;
    static instance = null;

    constructor(tokenizer, model, quantized) {
        this.tokenizer = tokenizer;
        this.model = model;
        this.quantized = quantized;
    }

    static async getInstance(progress_callback = null) {
        if (this.instance === null) {
            this.instance = pipeline(this.task, this.model, {
                quantized: this.quantized,
                progress_callback,

                // For medium models, we need to load the no_attentions revision to avoid running out of memory
                revision: this.model.includes("/whisper-medium") ? "no_attentions" : "main"
            });
        }

        return this.instance;
    }
}

self.addEventListener("message", async (event) => {
    const message = event.data;

    // Do some work...
    // TODO use message data
    let transcript = await transcribe(
        message.audio,
        message.model,
        message.multilingual,
        message.quantized,
        message.subtask,
        message.language,
    );
    if (transcript === null) return;

    // Send the result back to the main thread
    self.postMessage({
        status: "complete",
        task: "automatic-speech-recognition",
        data: transcript,
    });
});

class AutomaticSpeechRecognitionPipelineFactory extends PipelineFactory {
    static task = "automatic-speech-recognition";
    static model = null;
    static quantized = null;
}

const transcribe = async (
    audio,
    model,
    multilingual,
    quantized,
    subtask,
    language,
) => {

    const isDistilWhisper = model.startsWith("distil-whisper/");

    let modelName = model;
    if (!isDistilWhisper && !multilingual) {
        modelName += ".en"
    }

    const p = AutomaticSpeechRecognitionPipelineFactory;
    if (p.model !== modelName || p.quantized !== quantized) {
        // Invalidate model if different
        p.model = modelName;
        p.quantized = quantized;

        if (p.instance !== null) {
            (await p.getInstance()).dispose();
            p.instance = null;
        }
    }

    // Load transcriber model
    let transcriber = await p.getInstance((data) => {
        self.postMessage(data);
    });

    const time_precision =
        transcriber.processor.feature_extractor.config.chunk_length /
        transcriber.model.config.max_source_positions;

    // Storage for chunks to be processed. Initialise with an empty chunk.
    let chunks_to_process = [
        {
            tokens: [],
            finalised: false,
        },
    ];

    // TODO: Storage for fully-processed and merged chunks
    // let decoded_chunks = [];

    function chunk_callback(chunk) {
        let last = chunks_to_process[chunks_to_process.length - 1];

        // Overwrite last chunk with new info
        Object.assign(last, chunk);
        last.finalised = true;

        // Create an empty chunk after, if it not the last chunk
        if (!chunk.is_last) {
            chunks_to_process.push({
                tokens: [],
                finalised: false,
            });
        }
    }

    // Inject custom callback function to handle merging of chunks
    function callback_function(item) {
        let last = chunks_to_process[chunks_to_process.length - 1];

        // Update tokens of last chunk
        last.tokens = [...item[0].output_token_ids];

        // Merge text chunks
        // TODO optimise so we don't have to decode all chunks every time
        let data = transcriber.tokenizer._decode_asr(chunks_to_process, {
            time_precision: time_precision,
            return_timestamps: true,
            force_full_sequences: false,
        });

        self.postMessage({
            status: "update",
            task: "automatic-speech-recognition",
            data: data,
        });
    }

    // Actually run transcription
    let output = await transcriber(audio, {
        // Greedy
        top_k: 0,
        do_sample: false,

        // Sliding window
        chunk_length_s: isDistilWhisper ? 20 : 30,
        stride_length_s: isDistilWhisper ? 3 : 5,

        // Language and task
        language: language,
        task: subtask,

        // Return timestamps
        return_timestamps: true,
        force_full_sequences: false,

        // Callback functions
        callback_function: callback_function, // after each generation step
        chunk_callback: chunk_callback, // after each chunk is processed
    }).catch((error) => {
        self.postMessage({
            status: "error",
            task: "automatic-speech-recognition",
            data: error,
        });
        return null;
    });

    return output;
};
`,U=new Worker(URL.createObjectURL(new Blob([V],{type:"text/javascript"})),{type:"module"});U.addEventListener("message",e=>{if(!e.data)return;if(!e.data.status!=="update"&&e.data.status!=="complete"){sys({voice:{text:"",timestamp:peformance.now(),confidence:1,spoken:!0,final:!1,comment:JSON.toString(e.data)}});return}const t=e.data.status==="complete",o=t?e.data.data.text:e.data.data[0];sys({voice:{text:o,timestamp:0,confidence:1,spoken:!0,final:t,comment:t?"User voice input final":"User voice input processing"}})});async function Q(e){U.postMessage({audio:e,model:f.DEFAULT_MODEL,multilingual:f.DEFAULT_MULTILINGUAL,quantized:f.DEFAULT_QUANTIZED,subtask:f.DEFAULT_SUBTASK,language:f.DEFAULT_LANGUAGE})}async function X(){try{const e=await vad.MicVAD.new({positiveSpeechThreshold:.8,minSpeechFrames:5,preSpeechPadFrames:10,onFrameProcessed:t=>{t.isSpeech<.5||sys({voice:{text:"",timestamp:0,confidence:t.isSpeech,final:!1,bargein:!0,spoken:!0,comment:"User vocalizations heard"}})},onSpeechEnd:t=>{sys({voice:{text:"",timestamp:0,confidence:1,final:!0,bargein:!0,spoken:!0,comment:"Transcribing user voice input"}}),Q(t)}});window.myvad=e,e.start()}catch(e){console.errror(e)}}X();const Y="Haiku master manta ray, talks only in Haiku, what depths find you?",Z=`
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
	<textarea id="system-content-input" rows="4" placeholder="Describe how the llm should behave...">${Y}</textarea>
</div>

<div id="chat-container">
	<div id="messages"></div>
	<form id="chat-form">
		<input type="text" id="message-input" placeholder="Type your message..." autofocus>
		<button type="submit">Send</button>
	</form>
	<button id='voice-button'>Click to enable Voice Input</button>
</div>
`,a=document.createElement("div");document.body.appendChild(a);a.innerHTML=Z;const m=a.querySelector("#messages"),J=a.querySelector("#chat-form"),b=a.querySelector("#message-input"),D=a.querySelector("#system-content-input"),E=a.querySelector("#status-box");a.querySelector("#progress-bar");a.querySelector("#progress-text");const A=a.querySelector("#voice-button");function d(e=null,t="ready"){t||(t="ready"),e||(e=t),E.className=`status-${t}`,E.textContent=e.charAt(0).toUpperCase()+e.slice(1)}function z(e,t){const o=document.createElement("div");o.textContent=`${e}: ${t}`,m==null||m.appendChild(o),m&&(m.scrollTop=m.scrollHeight)}window.addEventListener("load",()=>{b.focus()});const M=()=>{const e=D.value;sys.resolve({llm:{configuration:e}})};D.addEventListener("input",M);M();let y=!0;A.onclick=()=>{y=!y,A.innerHTML=y?"Click to disable voice":"Click to enable voice",sys.resolve({voice:{desired:y}})};A.onclick();let v=1e3,w=1;function F(e){const t=e.text?e.text.trim():"";if(e.final?b.value="":e.spoken&&(b.value=t),e.bargein&&(v+=1e3,w=1,sys({rcounter:v,bcounter:w,stop:!0})),!e.final||!t||!t.length){d(e.comment?e.comment:"Responding","thinking");return}if(t.includes("stop")){d("Stopped!","loading");return}z("You",t),v+=1e3,w=1,sys({rcounter:v,bcounter:w,llm:{content:t}}),d("Thinking","thinking")}J.addEventListener("submit",async e=>{e.preventDefault(),F({text:b.value,confidence:1,spoken:!1,final:!0})});const ee=e=>{if(e.voice&&F(e.voice),e.audioqueue&&e.audioqueue==="done"){d("Ready");return}if(e.llm){if(e.llm.status){if(e.llm.status.text){const t=e.llm.status.text;e.llm.status.progress>=1?d(null,"ready"):d(t,"loading")}return}e.llm.breath&&z("system",e.llm.breath),e.llm.final&&d("Ready")}};sys({resolve:ee});
