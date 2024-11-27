# Web-LLM-Avatar

Exercising browser based web llm chat with 3d agents. Also exercising a pubsub architecture.

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

The completed goals for the first pass were:

1) Cleary handle user input using text chat window
2) Clearly indicate status of llm: loading, thinking, speaking ready
3) Allow forced stopping of the bot at any time
4) Use a 'breath' segmentation approach to break response into fragments

Notes:

* orbital-sys -> I use another project of mine https://github.com/orbitalfoundation/orbital-sys as a pubsub module to decouple components. This is experimental.

* Vite -> Stopped using vite as a compiler - there seems to be some issue with dynamic imports and service workers.

* Mobile -> There is still an issue with mobile being crushed by the weight of the llm model and the requirement for WebGPU. I feel like this will be generally improved by the industry over the next few months, but you can try other models. On iOS you have to enable webgpu. However even then it may still crash on mobile since the default model is so large.

* Service Workers -> For some reason service workers seem starved of gpu/cpu - disabled.

## Revision 2: Voice Output (done)

In the second pass I added voice output using wasm based blobs (as opposed to built in speech generation).

Goals that were accomplished here:

1) Avoid built in speech output support due to lack of viseme support for word timing and inability to intercept audio data at all, or accurate time estimation, and also due to low quality voices.

2) Evaluate WASM based TTS. Try different background worker solutions for lowest possible latency in TTS generation. This is the choice I ended up with: https://www.npmjs.com/package/@diffusionstudio/vits-web - https://huggingface.co/docs/transformers/en/model_doc/vits . 

3) Speak in breath fragments. Send each fragment for audio processing right away. It may also make sense to introduce 100 or 200 millisecond gaps between breath fragments to listen for human interruption (a later feature).

## Revision 3: Voice Input (doneish)

Goals: The human participant should be able to speak naturally and have the llm capture complete sentences which it should then translate to text locally, and then be able to respond intelligently. As a critical feature the human should be able to interrupt the llm (this is referred to as 'barge in' and requires a 'vad' - voice activity detector).

Notes:

* This is an excellent VAD that runs on mobile without requiring webgpu: https://github.com/ricky0123/vad

* The built in voice support does not participate in audio echo cancelation - so the browser will hear itself talking and think that is human input. Also, even starting or stopping the built-in voice support seems to somehow disable AEC - overally built in voice support is poorly written, and doesn't play well with others.

Approaches and workarounds:

- [YES] Hook up a barge-in detector while using built in STT. Not great results, built in STT is pretty buggy.
- [YES] Use a voice activity detector in general and use a web based whisper module. Works, is a bit sluggish.
- [YES] Provide more visual feedback cues on VAD (would help)
- [NO] Turning off the microphone during speaking - tested - works "ok" but the lack of barge-in can be annoying.
- [NO] Try built in speech to text. Tested and it is terrible.
- [NO] Have a 'stop talking' button? (not hands free)
- [NO] Have a 'press to speak' button? (not hands free)
- [NO] Pause briefly in sentences to listen for barge in (not so strong as an idea)
- [NO] Semantic level analysis of voice to detect self-vocalizations (hmmm probably too much latency; VAD is better)
- [NO] Try just turning down the browser volume? (Tested and actually it works "ok")
- [NO] Fallback to server side Voice Recognition? (I'd prefer not to do this because I want a no strings client)

Other resources:

- https://github.com/ricky0123/vad
- https://picovoice.ai/blog/javascript-voice-activity-detection/ 
- https://github.com/kdavis-mozilla/vad.js/

- https://webrtc.googlesource.com/src/+/refs/heads/main/modules/audio_processing/aec3/
- https://www.mathworks.com/help/audio/ug/acoustic-echo-cancellation-aec.html#
- https://news.ycombinator.com/item?id=40918152
- https://dev.to/fosteman/how-to-prevent-speaker-feedback-in-speech-transcription-using-web-audio-api-2da4

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


## Revision 4: Animated Pupppet (TBD)

The primary challenge of an animated puppet face is to map audio to facial performances. 

1) Test STT with word timings. One way to animate a facial performance is to know the exact word timings. Given word timings it is possible to know what phonemes are being mouthed at a specific time, and to then map those phonemes to visemes at that time. Ideally the original TTS generator (VITS at the moment) could do this - but it is not exposed in off the shelf builds. For now Xenova Whisper seems to do a good job of recovering word timing - see: https://huggingface.co/spaces/Xenova/whisper-web ).

2) Other options here are to manufacture our own neural network that maps spectographic analysis of audio to visemes directly.
