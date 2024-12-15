
// @note the a_ prefix is to force load order because dynamic imports fail to preserve import order
// maybe the loader could load the file twice and then extract order by looking at the actual file?

export const aaab_scene001 = {
	// @note loader could fix the order issue itself?
	unused_idea_load: {
		after: 'resources'
	},
	volume: {
		geometry: 'scene',
		div: 'volume001',
		near: 0.1,
		far: 100,
		cameraPosition:[0,1.5,1], // @todo move this behavior to camera
		cameraTarget:[0,1.5,0],
		cameraMin: 1,
		cameraMax: 100,
		background: 0x202020,
		alpha: false,
		axes: true,
		controls: false,
	}
}

export const aaac_camera001 = {
	volume: {
		geometry: 'camera',
		pose:{
			position:[0,1,4],
			love:[0,1.5,0]
		}
	}
}

export const light001 = {
	volume: {
		geometry:'light',
		light:'directional',
		intensity: 1,
		color: 0xffeae0,
		pose:{
			position:[1,1,1]
		},
	}
}

export const light002 = {
	volume: {
		geometry:'light',
		light:'ambient',
		color: 0xffeae0,
		intensity: 1
	}
}

const store001 = {
	volume: {
		geometry:'file',
		url:'assets/venues/virtual_store_cute_pastelle.glb',
		metadata: {
			provenance: 'https://sketchfab.com/3d-models/virtual-store-cute-pastelle-953f0f8517eb4af1b1ba5bf85601f7dd',
			creator: 'https://sketchfab.com/mshayan02',
			license: "CC Attribution-NonCommercial",
		},
		transform:{
			whd:[1,1,1],
			xyz:[0,0,1.5],
			ypr:[0,3,0],
		},
	}
}

const quaxel = {
	uuid: 'quaxel',
	volume: {
		geometry:'assets/avatars/stone/stone-sphere-artifact.glb',
		headname : 'Object_2',
		animations: {
			default: { path:'assets/stone/stone-anim-default.glb', start:0, end:20 },
			talk: 'assets/avatars/stone/stone-anim-default.glb',
			// happy: 'assets/stone/stone-anim-default.glb',
			// pulse: 'assets/stone/stone-anim-default.glb',
			// glow: 'assets/stone/stone-anim-default.glb',
			// sad: 'assets/stone/stone-anim-default.glb'
		},
		metadata: {
			source: "https://sketchfab.com/3d-models/stone-sphere-artifact-5cf94d68e78a46a89e11adf0ac97919e",
			license: "CC Attribution-NonCommercial",
			sponsor: "ChickenHatMan",
		},
		animation: 'default',
		pose:{
			scale:[0.2,0.2,0.2],
			position:[-1,1.5,0],
			rotation:[0,0,0],
		},
	},
}

// do not export
const animations = {

	default: "assets/animations/unarmed-idle.glb",

	idle2: "assets/animations/idle.glb",
	idle4: "assets/animations/basic-idle.glb",

	talk: "assets/animations/Talking.glb",

	hands: "assets/animations/Hands-Forward-Gesture.glb",

	head1: "assets/animations/Head-Gesture.glb",

	think:'assets/animations/think.glb',

	spin:'assets/animations/spin.glb',
	spin2: "assets/animations/Spin-In-Place.glb",

	dance:'assets/animations/dance-action.glb',
	dance2:'assets/animations/dance.glb',
	dance3: "assets/animations/dance.glb",


	agree: "assets/animations/Agreeing.glb",

	clap: "assets/animations/Clapping.glb",
	clap2: "assets/animations/Clapping.glb",

	cocky: "assets/animations/Cocky-Head-Turn.glb",
	crazy: "assets/animations/Crazy-Gesture.glb",

	look: "assets/animations/Looking-1.glb",
	look2: "assets/animations/Looking-Behind.glb",
	look3: "assets/animations/Looking.glb",

	point: "assets/animations/Pointing-Forward.glb",

	pray: "assets/animations/Praying.glb",
	react: "assets/animations/Reacting.glb",
	salute: "assets/animations/Salute.glb",

	shake: "assets/animations/Shaking-It-Off.glb",

	rub: "assets/animations/Shoulder-Rubbing.glb",
	surprise: "assets/animations/Surprised.glb",

	secret: "assets/animations/Telling-A-Secret.glb",

	warrior1:'assets/animations/warrior-idle.glb',

	wave: "assets/animations/Waving.glb",

	whatever: "assets/animations/Whatever-Gesture.glb",

	bow: "assets/animations/bow.glb",
	throw: "assets/animations/throw.glb",

}

export const alexandria = {
	uuid: 'alexandria',
	volume: {
		geometry: 'file',
		url: 'assets/avatars/rpm-mixamo-t-posed.glb',
		pose: {
			position: [0,0,0]
		},
		animations,
	},
	puppet: {}
}

// @note exports are not exported in order - and sadly this file is order dependent - so patch it up here
// const scratch = {resources, scene001, camera001, light001, light002, alexandria }
// const manifest = Object.entries(scratch).map(([k,v]) => { v.uuid = `world001/${k}`; return v })
// export { manifest }





