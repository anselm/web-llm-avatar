
import sys from 'https://cdn.jsdelivr.net/npm/orbital-sys/+esm'

// manifests
await sys({
	anchor:import.meta.url,
	load:[

		// globally publish new {human} packets
		'./src/stt.js',
		'./src/stt-sys.js',

		// intercept {human} packets and paint to display
		// intercept {human} packets and mark up the packet with one of the llm ai participants as a target
		// intercept {breath} packets and paint to display
		'./src/ux.js',

		// intercept {human} packets and may publish global {breath} packets
		'./src/llm.js',

		// intercept {breath} packets and generate {speech} packets
		'./src/tts.js',

		// intercept {speech} packets and drive puppet rig
		// 'orbital/orbital-puppet/puppet.js',

		// pipe audio to speakers - catches {audio} packets
		// this audio system actually is slightly problematic; we want more granular completion events for puppet
		// also it should be spatialized and integrated with orbital-volume
		'./src/audio.js',
	]
})

sys({
	wire:[
//		'stt_manager','stt.human_out','ux_manager','ux.human_in'
//		'ux_manager', ''
	]
})

//
// test the 3d volume stuff - @todo replace with puppet
//

const volume = {
	anchor:import.meta.url,
	load: [
		'orbital/orbital-volume/volume.js',
		'orbital/orbital-puppet/puppet.js'
	]
}

const scene = {
	uuid:'/apps/myapp/volume001/scene',
	volume: {
		geometry: 'scene',
		div: 'volume001',
		near: 0.1,
		far: 100,
		cameraPosition:[0,1.5,1], // @todo move camera stuff elsewhere - see orbitcontrols
		cameraTarget:[0,1.5,0],
		cameraMin: 1,
		cameraMax: 100,
		background: 0x202020,
		alpha: false,
		axes: true,
		controls: false,
	}
}

const light001 = {
	volume: {
		pose:{
			position:[1,1,1]
		},
		geometry:'light',
		light:'directional',
		intensity: 1,
		color: 0xffeae0
	}
}

const light002 = {
	volume: {
		geometry:'light',
		light:'ambient',
		color: 0xffeae0,
		intensity: 1
	}
}

const puppet = {
	uuid:'/apps/myapp/volume001/puppet',
	volume: {
		geometry: 'gltf',
		url: import.meta.url + '/../assets/rpm-mixamo-t-posed.glb',
		pose: {
			position: [0,0,0]
		}
	},
	puppet: {
		// rules for puppet
	}
}

//await sys(volume,scene,light001,light002,puppet)



