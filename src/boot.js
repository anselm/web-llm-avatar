
import 'https://cdn.jsdelivr.net/npm/orbital-sys@1.0.3/sys.js/+esm'

import './llm.js'
import './tts.js'
import './voiceout.js'
import './voicevad.js'
import './ux.js'

// @todo the ux fires a config event (for llm preprompt) that goes to the llm - need to think about order independence