# Web-LLM-Avatar

Exercising browser based web llm chat with 3d agents. Also exercising a pubsub architecture.

See example at https://anselm.github.io/web-llm-avatar

Note does not run on mobile due to llm crashing the webgpu.

# Running

```
npm i
npm run dev
npm run deploy
```

# Todo

- hook up body animations
- hook up gaze
- find a smaller llm for no strings mobile

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

## Revision 3: Voice Input (done)

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
- https://www.reddit.com/r/LocalLLaMA/comments/1fvb83n/open_ais_new_whisper_turbo_model_runs_54_times/ 


## Revision 4: Animated Pupppet (done) 

The primary challenge of an animated puppet face is to map audio to facial performances. I used the first approach below for now. These are a few approaches:

1) Mika's work here is excellent - he exercises a few approaches and this is what I dropped into this project: https://github.com/met4citizen/TalkingHead . Whisper is used to get word timings and then phonemes are mapped to visemes and overall the effect is quite good. It still however tends to focus on just mouth related performance rather than an 'emotional' full face performance. Note also that running whisper after tts is silly - but the tts is not returning exact word timings. Ideally the original TTS generator (VITS at the moment) could do this - but it is not exposed in off the shelf builds. For now Xenova Whisper seems to do a good job of recovering word timing - see: https://huggingface.co/spaces/Xenova/whisper-web ).

2) STT without whisper. A similar approach not using whisper is to just take all the phonemes and 'smear them out' over the duration of the sound sample, and to then map those phonemes to visemes at that time.

3) Neural net approach. Other options here are to manufacture our own neural network that maps spectographic analysis of audio to visemes directly. There are several examples of this in the wild. NVIDIA of course has a well known audio to face model. Oculus had one also - these are both kind of opaque - with unclear licensing. There are several open source solutions, and today it would not be hard to train a model given the tools available (such as face tracking tools that already use oculus visemes):

- https://github.com/liukuangxiangzi/audio2viseme
- https://github.com/yzhou359/VisemeNet_tensorflow
- https://github.com/MicrosoftDocs/azure-ai-docs/blob/main/articles/ai-services/speech-service/how-to-speech-synthesis-viseme.md
- https://linchaobao.github.io/viseme2023/
- https://github.com/fire/mfcc-viseme-gan
- https://github.com/marty1885/OpenViseme
- https://stackoverflow.com/questions/73806104/make-a-realtime-realistic-3d-avatar-with-text-to-speech-viseme-lip-sync-and-em
- https://github.com/ggerganov/whisper.cpp/discussions/167
- https://build.nvidia.com/nvidia/audio2face-3d

#  Understanding Avatars, rigging, art pipelines, tools and resources

## Avatars in general:

  * Ready Player Me (RPM) is an excellent source for custom avatars with permissive licensing
  * RPM supports exactly what we want for face animation - RPM GLB assets work "as is" with no changes at all; don"t even have to use blender.
  * Character Creator 4 (CC4) can also be used although licensing can be problematic depending on how you use it; use blender to convert to FBX to GLB
  * Reallusion and CC4 also provides avatars although licensing is problematic in some cases depending on your raw sources
  * Metahuman has licensing issues that preclude its use
  * There"s an emerging set of machine learning driven avatar solutions that may help soon for creating unencumbered avatar assets
  * Different avatar sources use different naming for bones and shapes often in arbitrary and annoying ways that require renaming prior to use
  * See https://www.youtube.com/watch?v=vjL4g8oYj7k for an example of where the industry is going for machine learning based solutions circa 2024

## Rigs, Shape Keys, Visemes

  * We are mostly focused on articulating the face/head with shape keys / blend shapes / morph targets (different tools use different words).
  * Internally we _only_ support Oculus and ARKit facial morph targets.
  * See: https://docs.readyplayer.me/ready-player-me/api-reference/avatars/morph-targets/oculus-ovr-libsync
  * See: https://docs.readyplayer.me/ready-player-me/api-reference/avatars/morph-targets/apple-arkit

  * You can use Ready Player Me to create avatars - be certain to download ARKit and Oculus Viseme targets:

  * See: https://docs.readyplayer.me/ready-player-me/api-reference/rest-api/avatars/get-3d-avatars
  * Example: https://models.readyplayer.me/664956c743dbd726eefeb99b.glb?morphTargets=ARKit,Oculus+Visemes,mouthOpen,mouthSmile,eyesClosed,eyesLookUp,eyesLookDown&textureSizeLimit=1024&textureFormat=png

## GLB, FBX, Quirks

  * GLTF/GLB the preferred format that avatars can be specified in (Graphics Library Transmission Format); Blender supports it.
  * Note there"s an annoying industry split between T pose avatars and A pose avatars - you may have issues if your avatar is in A pose.
  * Mixamo can magically auto-rig avatars into a t-pose if you send an FBX and then apply a t-pose and then export again.
  * Blender is useful but there are a ton of small quirks to be aware of:
    - Sometimes textures are not opaque and this looks weird - you have to select the meshes then the materials and mark them as opaque / no alpha.
    - Weirdly Mixamo FBX animations don't play well in 3js - I tend to re-export them as glb animations with no skin via blender.
    - Sometimes Mixamo cannot understand texture paths; if you export from Mixamo with a skin you should be able to see the skin in Blender.

## VRMS specifically

  * Some developers like VRM for performance reasons for scenarios with many avatars.
  * This engine detects and supports VRM models that have the correct facial targets.
  * In this folder you should see a file called 'blender-puppet-rpm-to-vrm.py' which can be used to decorate VRM rigs with the RPM facial targets. This can be pasted into the blender scripting interface and run as is on a loaded VRM puppet if that VRM puppet arrives from a CC4 or Reallusion pipeline. - Otherwise you'll have to figure out some way to define the correct facial targets yourself (possibly by modifying this script or painfully remapping each desired shape key by hand in Blender - which may take hours).

  * For more commentary on VRM in general see:

  https://hackmd.io/@XR/avatars
  https://vrm-addon-for-blender.info/en/
  https://vrm.dev/en/univrm/blendshape/univrm_blendshape/
  https://vrm-addon-for-blender.info/en/scripting-api/
  https://github.com/vrm-c/vrm-specification/blob/master/specification/VRMC_vrm-1.0/expressions.md

* body performances - other resources

  * https://openhuman-ai.github.io/awesome-gesture_generation/
  * https://medium.com/human-centered-ai/chi24-preprint-collection-hci-ai-0caac4b0b798
  * https://www.youtube.com/watch?v=LNidsMesxSE ... a detailed video on the state of the art in video-game animation blending
  * https://cascadeur.com ... a commercial animation blending system
  * https://assetstore.unity.com/packages/tools/animation/animation-designer-210513 ... an embeddable animation blending system

# A few notes on higher level goals

Why have embodied puppets?

* Many people don't really like or use 2d button clicky interfaces; they don't really 'get' them. We tend to think these are common but actually there are billions of people who don't have access to them and or who don't like them.

* As humans we have wetware that processes human faces and gestures. It can be a more powerful learning mechanism or communication mechanism - there may be some papers on this.

* Syncing mouth movement provides a sense of presence and aliveness - the avatar is more engaging.

* Presence as a whole is conveyed by accurate emotions, breath pauses and breathing, body guestures matching conversation, body language in general, blinking, facial ticks, and gaze as well.

* Uncanny Valley. Avatars do not need to look real. RPM models are actually pretty much perfect.

* Latency. Right now with a no strings attached puppet this is slow and crashes on mobile. But by next year I expect the third party libraries to be hugely improved.

* Privacy. Feels like the client side only solution will dominate within a year due to this concern. Also puppets that act on your behalf is very different from puppets that represent a third party - so there will likely be on device or operating system level puppet systems within a year.

* Interruption. This also felt critical - luckily it feels solved.

# Other interesting resources

## Other web based engines for face performances

  https://github.com/met4citizen/TalkingHead <- used extensively in this project
  https://github.com/bornfree/talking_avatar
  https://discourse.threejs.org/t/add-lip-sync-to-existing-3d-model-of-head/49943
  https://threejs.org/examples/webgl_morphtargets_face
  https://github.com/exokitxr/avatars/blob/master/README.md

## Other random interesting references

  https://threejs.org/examples/webgl_morphtargets_face.html
  https://hiukim.github.io/mind-ar-js-doc/more-examples/threejs-face-blendshapes/
  https://docs.aws.amazon.com/polly/latest/dg/ph-table-english-us.html
  http://www.visagetechnologies.com/uploads/2012/08/MPEG-4FBAOverview.pdf
  https://www.youtube.com/watch?v=4JGxN8q0BIw ... a demonstration of the unsupported obsolete non-source code but not terrible oculus to viseme tool
  https://crazyminnowstudio.com/posts/salsa-lipsync-in-webgl-with-amplitude/ 
  https://x.com/trydaily/status/1815530613434417241 ... very nice circa summer 2024 responsive text chat with interruption detection










