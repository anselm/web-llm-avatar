# Web-LLM-Avatar

Exercising browser based web llm chat with 3d agents.

See example at https://anselm.github.io/web-llm-avatar

# Running

```
npm i
npm run dev
```

# Versions

## Version 1: A text based interface to client side llm:

LLM Choices:

- https://github.com/mlc-ai/web-llm/

Goals:

1) Handle user input using text chat window
2) Clearly indicate status of llm: loading, thinking, speaking ready
3) Allow forced stopping of the bot at any time
4) Use a 'breath' segmentation approach to break response into fragments
5) Look at using service workers for longer persistence of wasm blobs

Currently using  - also see xenova transformerjs.

## Version 2: Voice Output and viseme generation.

TTS Choices:

- https://huggingface.co/spaces/Xenova/whisper-web
- https://www.npmjs.com/package/@diffusionstudio/vits-web

Goals:

1) Avoid built in speech output support due to lack of viseme support for word timing and inability to intercept audio data at all, or accurate time estimation, and also due to low quality voices.

2) Evaluate WASM based stt and tts such as xenova transformerjs based solutions. Try different background worker solutions for lowest possible latency in tts generation. Also segment speech into breath chunks to lower latency.

3) As a fallback evaluate server side speech or cloud based solutions for voice generation. Basically looking for the lowest latency, most stable, least strings attached solution.

4) Evaluate interruption semantics. A "talk to speak" button may eventually be needed once there is contention between the player voice and the puppet voice. We should also detect keyboard activity, and later human voice activity interruptions - and stop any performance completely on any interruption (stop reasoning, speech, animations, stop everything).

5) Micro-state boundaries. The microphone should be turned off while the puppet is actively speaking to prevent self-hearing - and turned on when the puppet is not actually speaking (Arguably this should be done even if we have audio feedback loop removal).

6) Speak in breath fragments. Send each fragment for audio processing right away. It may also make sense to introduce 100 or 200 millisecond gaps between breath fragments to listen for human interruption (a later feature).

7) Also perform stt to extract word timings. Do this client side if possible.

Todo here

	- introduce gaps at sentence end to listen
	- introduce stt for viseme timing
	- make sure that stop stops everything - including all audio; flushing all state

## Version 3: Voice Input support

Voice based interaction. The human participant should be able to speak naturally and have the llm capture complete sentences which it should then translate to text locally, and then be able to respond intelligently. Interruption support is important and this may mean noise reduction strategies especially loopback noise prevention such as webrtc supports. This may mean that the built in speech to text support of most browsers cannot be used because they do not participate in the audio processing pipeline.

1) Approach #1: Built in Browser Voice Recognition:

Works well for english. Unfortunately cannot squelch the loopback from the robot talking, so the voice recognition hears itself. Cannot leverage webrtc or other noise cancellation techniques because the voice cannot be re-routed or processed prior to recognition. This *may* still be a useful option since voice recognition is expensive - but it interferes with other requirements.

2) Approach #2: WASM based browser voice recognition:

There are several options here but it looks like modern browsers are not quite yet ready to deliver on this capability. For example ggerganov's whisper.cpp module won't run on mobile due to a WASM SIMD issue. And while other models do run well, they seem to require webgpu - which not all devices have, or have enabled. If the use case was a "must have" then people would buy the right hardware, but for applications where the audio is more of an add-on or gimmick then the industry is not quite ready. There are several options here however:

- https://github.com/huggingface/transformers.js/tree/v3/examples/webgpu-whisper (works well)
- https://huggingface.co/distil-whisper/distil-small.en
- https://github.com/pluja/whishper -> https://github.com/m-bain/whisperX (not standalone)
- https://github.com/Vaibhavs10/insanely-fast-whisper (not standalone)
- https://github.com/ggerganov/whisper.cpp (unfortunately does not work on mobile SIMD WASM issue)
		see also https://whisper.ggerganov.com/
- https://github.com/homebrewltd/ichigo (interesting but not exactly what we want)
- https://github.com/FL33TW00D/whisper-turbo (webgpu)
- https://huggingface.co/spaces/Xenova/distil-whisper-web (seems slow?)
- https://huggingface.co/spaces/Xenova/whisper-web
- https://huggingface.co/spaces/Xenova/whisper-word-level-timestamps
- https://www.reddit.com/r/LocalLLaMA/comments/1fvb83n/open_ais_new_whisper_turbo_model_runs_54_times/ ?

3) Approach #3: Server side Voice Recognition?

This unfortunately ties an application to a server, which I find limiting. However the server can bring significant powers to bear on the problem, including improved audio filtering capabilities. Also browser loopback detection such as supported in browser using webrtc become available - and can be performed prior to sending audio to server.

## Version 4: Rigged and animated 3d puppet

TBD. Hook up to facial and body performances for animated 3d behavior using Ready Player Me models that are already rigged for facial performances.

