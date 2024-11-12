# Web-LLM-Avatar

Exercising browser based web llm chat with 3d agents.

See example at https://anselm.github.io/web-llm-avatar

# Running

```
npm i
npm run dev
npm run deploy
```

# Revisions

## Revision 1: Text (done)

In the first pass I threw together a text based interface to client side llm - basically just a shim around this client side llm module:

  https://github.com/mlc-ai/web-llm

Goals for the first pass were:

1) Cleary handle user input using text chat window
2) Clearly indicate status of llm: loading, thinking, speaking ready
3) Allow forced stopping of the bot at any time
4) Use a 'breath' segmentation approach to break response into fragments

Note: At the moment Vite is used to compile the source but it needs help to be able to pack background thread workers. Esbuild or Rollup could also be used instead. Or another option would be to use no compilation packaging system at all. For now I did decide to import worker logic from the internet on the fly. Also I use orbital-sys as a pubsub module.

## Revision 2: Voice Output (done)

In the second pass I added voice output using wasm based blobs (as opposed to built in speech generation).

Goals that were accomplished here:

1) Avoid built in speech output support due to lack of viseme support for word timing and inability to intercept audio data at all, or accurate time estimation, and also due to low quality voices.

2) Evaluate WASM based TTS. Try different background worker solutions for lowest possible latency in TTS generation. This is the choice I ended up with: https://www.npmjs.com/package/@diffusionstudio/vits-web - https://huggingface.co/docs/transformers/en/model_doc/vits . 

3) Speak in breath fragments. Send each fragment for audio processing right away. It may also make sense to introduce 100 or 200 millisecond gaps between breath fragments to listen for human interruption (a later feature).

## Revision 3: Voice Input (ongoing)

Voice based interaction. The human participant should be able to speak naturally and have the llm capture complete sentences which it should then translate to text locally, and then be able to respond intelligently. Specifically the human should be able to interrupt the llm.

Performing audio based interruption is hard because by default modern browsers hear themselves - if the browser is vocalizing through the speakers - it also hears that vocalization. We can ignore microphone input while the browser is speaking - but then we also fail to hear the participant interrupting.

Approaches and workarounds:

1) Try a variety of trivial interruption semantics - multiple may be used:

- A "talk to speak" button - as a way to distinguish player voice from locally produced voice.
- A 'stop talking' button - as a way to force the puppet from producing voice for a while.
- Have small audio pauses while producing voice to listen for player voice.
- Do a semantic level analysis of recognized voice to make sure it differs from self produced voice.
- Note that the built-in speech to text support can be used for these approaches.

2) Try brute force loopback detection. Leave the microphone on all the time and subtract the self-generated audio (software loopback cancellation). Webrtc which has built in loopback cancellation and it may be available in this context. The built-in speech to text CANNOT be used here because there are no audio streams provided as far as I can tell (it bypasses the audio system?).

3) Overall try a variety of WASM based voice recognition solutions. There are several options here but it looks like modern browsers are not quite yet ready to deliver on this capability. For example ggerganov's whisper.cpp module won't run on mobile due to a WASM SIMD issue.

- https://github.com/huggingface/transformers.js/tree/v3/examples/webgpu-whisper (works well)
- https://huggingface.co/distil-whisper/distil-small.en
- https://github.com/pluja/whishper -> https://github.com/m-bain/whisperX (not standalone)
- https://github.com/Vaibhavs10/insanely-fast-whisper (not standalone)
- https://github.com/ggerganov/whisper.cpp (unfortunately does not work on mobile SIMD WASM issue)
- https://github.com/homebrewltd/ichigo (interesting but not exactly what we want)
- https://github.com/FL33TW00D/whisper-turbo (webgpu)
- https://huggingface.co/spaces/Xenova/distil-whisper-web (seems slow?)
- https://huggingface.co/spaces/Xenova/whisper-web
- https://huggingface.co/spaces/Xenova/whisper-word-level-timestamps
- https://www.reddit.com/r/LocalLLaMA/comments/1fvb83n/open_ais_new_whisper_turbo_model_runs_54_times/ ?

4) Server side Voice Recognition?

This unfortunately ties an application to a server, which I find limiting. However the server can bring significant powers to bear on the problem, including improved audio filtering capabilities. Also browser loopback detection such as supported in browser using webrtc become available - and can be performed prior to sending audio to server.

## Revision 4: Animated Pupppet

The primary challenge of an animated puppet face is to map audio to facial performances. 

1) Test STT with word timings. One way to animate a facial performance is to know the exact word timings. Given word timings it is possible to know what phonemes are being mouthed at a specific time, and to then map those phonemes to visemes at that time. Ideally the original TTS generator (VITS at the moment) could do this - but it is not exposed in off the shelf builds. For now Xenova Whisper seems to do a good job of recovering word timing - see: https://huggingface.co/spaces/Xenova/whisper-web ).

2) Other options here are to manufacture our own neural network that maps spectographic analysis of audio to visemes directly.

## Issues

- an actual stop button might be nice
- when you stop (by typing nothing and hitting return) it doesn't paint the right status or button state
- stop should probably also stop voice recog accumulation and reset it