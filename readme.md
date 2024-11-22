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

Voice based interaction. The human participant should be able to speak naturally and have the llm capture complete sentences which it should then translate to text locally, and then be able to respond intelligently. Specifically the human should be able to interrupt the llm (this is referred to as 'barge in' and requires a 'vad' - voice activity detector).

The built in voice support does not participate in audio echo cancelation - so the browser will hear itself talking and think that is human input.

Approaches and workarounds:

1) [TESTED] Turning off the microphone during speaking - tested - works "ok" but the lack of barge-in can be annoying.

2) Hook up a barge-in detector while retaining the built in microphone (this may work well)

3) [TESTED] Use a voice activity detector in general and use a web based whisper module - tested - is a bit slow.

4) Have a 'stop talking' button? (not hands free)

5) Have a 'press to speak' button? (not hands free)

6) Pause briefly in sentences to listen for barge in (not so strong as an idea)

7) Semantic level analysis of voice to detect self-vocalizations (hmmm)

8) Try just turning down the browser volume? (Tested and actually it works "ok")

9) Falback to server side Voice Recognition? (I'd prefer not to do this because I want a no strings client)

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


## Revision 4: Animated Pupppet

The primary challenge of an animated puppet face is to map audio to facial performances. 

1) Test STT with word timings. One way to animate a facial performance is to know the exact word timings. Given word timings it is possible to know what phonemes are being mouthed at a specific time, and to then map those phonemes to visemes at that time. Ideally the original TTS generator (VITS at the moment) could do this - but it is not exposed in off the shelf builds. For now Xenova Whisper seems to do a good job of recovering word timing - see: https://huggingface.co/spaces/Xenova/whisper-web ).

2) Other options here are to manufacture our own neural network that maps spectographic analysis of audio to visemes directly.

# Pub Sub

I'm exploring using a pubsub architecture to decouple components. These are the events:

1) UX publishes "voice recognition enabled" or "voice recognition disabled" events ... observed by voice recognition.

2) UX publishes input text from the user ... observed by LLM.

3) UX publishes a 'stop!' event ... observed by LLM and TTS.

4) LLM publishes a general status string ... observed by UX.

5) LLM publishes breath segments ... observed by UX and TTS.

6) TTS publishes if using audio speaker or not ... observed by the voice recognition.

7) Voice recognition publishes input voice ... observed by the ux who forwards to llm.

Can this pubsub pattern be made more visible or clear?

One way would be to require services to have exposed handles, and then to wire handles up explicitly in one place. This is a form of pseudo function late binding which while decoupling static imports from each other, still couples them at runtime in a way that may not be a huge win?

const wires = [
  [ "/ux/input", "llm/input" ],
  [ "/ux/enabled", "voice/enabled" ],
  [ "/ux/disabled", "voice/disabled" ],
  [ "/ux/stop", "llm/stop" ],
  [ "/llm/status", "ux/status" ],
  [ "/llm/breath", "ux/conversation" ],
  [ "/llm/breath", "tts/input"],
  [ "/tts/speaking", "recog/disabled"],
  [ "recog/text", "ux/input" ]
]

Another way may be to turn on pre-filtering so that we know who emitters and consumers are more clearly, and then a debug display of extant wires can be produced at runtime. This could help with introspection; basically creating a kind of debugging layer for pubsub - and it would produce a display similar to the above.

## Issues

- an actual stop button might be nice
- when you stop (by typing nothing and hitting return) it doesn't paint the right status or button state

Does the microphone stream participate in the echo cancellation?

1) start playing some voices
2) also record 10 seconds of microphone input at the same time
3) play that back and just listen to it - does it sound cancelled?





