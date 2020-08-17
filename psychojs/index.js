export * as util from './js/util/index.js';
export * as core from './js/core/index.js';
export * as data from './js/data/index.js';
export * as visual from './js/visual/index.js';
export * as sound from './js/sound/index.js';

// TODO: Any chance using rollup's 'output.footer' can be 
// avoided for setting global shorthands?
// window.util = util;
// window.core = core;
// export {PsychoJS} from './js/core/index.js'
// export const {Scheduler} = util
// export {TrialHandler} from './js/data/index.js'
