
// @todo for some reason /+esm does something very strange with import maps - they stop working!
import sys from 'https://cdn.jsdelivr.net/npm/orbital-sys@latest/src/sys.js'

//
// a basic pipeline for stt -> llm -> tts -> audio out
//

sys({
	load:[

		// publishes new {human} packet including {human.bargein}
		// arguably could publish a dedicated {stop} or naked {bargein} for clarity @todo
		'here/src/stt.js',
		'here/src/stt-sys.js',

		// observes {human} packets and paint to display
		// observes {human} packets and mark up the packet with one of the llm ai participants as a target
		// observes {breath} packets and paint to display
		'here/src/ux.js',

		// observes {human} packets and may publish global {breath} packets
		// observes {human.bargein} packets for barge in detection
		'here/src/llm.js',

		// observes {breath} packets and generate {speech} packets
		// observes {human.bargein} packets only for barge in detection
		'here/src/tts.js',

		// observes {audio} packets
		// observes {human.bargein} packets only for barge in detection
		// disabled for now since puppet below has to orchestrate more tightly
		// 'here/src/audio.js',

		// llms
		'here/manifests/llms001.js',

		// 3d scene support
		'https://cdn.jsdelivr.net/npm/orbital-volume@latest/volume.js',

		// observes {audio} packets
		// observes {puppet} packets
		'https://cdn.jsdelivr.net/npm/orbital-puppet@1.1.1/puppet.js',

		// generates {puppet} packets
		'here/manifests/geometry001.js',
	],
})

//
// @todo - switch away from general broadcast packets to late binding wires
//
//	- modify entities to declare explicit input methods as well as explicit output methods
//  - define these wires on sys.wires
//
//	- stt.text_out -> ux.text_in
//	- ux.text_out -> llm.text_in
//	- llm.text_out -> tts.text_in
//	- tts.audio_out -> audio.audio_in
//	- tts.audio_out -> puppet.audio_in
//
//	- audio.audio_done_out -> ux.audio_done_in
//	- 
//
// sys({
//	wires:[
//		"stt.text_out -> ux.text_in"
//		'stt','text_out','ux','human_in'
//	]
//})
//
