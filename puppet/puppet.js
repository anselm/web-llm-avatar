
const uuid = 'puppet-system'
import { PuppetClass } from './puppet-class.js'

function resolve(blob) {

	// update puppets
	if(blob.tick) {
		Object.values(this._puppets).forEach(puppet => puppet.update() )
		return
	}

	// bind new puppets
	if(blob.puppet && blob.volume && blob.uuid) {
		const uuid = blob.uuid
		let puppet = this._puppets[uuid]
		if(blob.obliterate) {
			if(puppet) {
				puppet.obliterate()
				delete this._puppets[uuid]
			}
		} else {
			if(!puppet) {
				puppet = this._puppets[uuid] = new PuppetClass()
			}
			puppet.configure(blob.volume)
		}
	}

	// stop all puppets for now on interruption
	if(blob.human) {
		Object.values(this._puppets).forEach(puppet => puppet.stop() )
	}

	// observe puppet directed performances - use first puppet for now
	if(blob.audio && blob.audio.whisper) {
		const puppets = Object.values(this._puppets)
		const puppet = puppets.length ? puppets[0] : null
		if(puppet) {
			puppet.perform({
				whisper:blob.audio.whisper,
				audio:blob.audio.data,
				final:blob.audio.final
			})
		}
	}

}

export const puppet_system = {
	uuid,
	resolve,
	_puppets:{},
}
