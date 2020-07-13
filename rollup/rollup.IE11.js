/**********************************************************************
 * Rollup all PsychoJS namespaces into transpiled libraries, for IE11 *
 **********************************************************************
 
 note: (a) a full description of rollup.js options can be found here:
 https://rollupjs.org/guide/en#big-list-of-options
       (b) the individual iife's have to be concatenated, and runtime.js has to be added

 */

import * as path from 'path';
import babel from 'rollup-plugin-babel';
import multiEntry from 'rollup-plugin-multi-entry';
import cleanup from 'rollup-plugin-cleanup';
import { glob } from 'glob';


///////////////////////////////////////////////////////////////////////////////
// export to a single bundle:

// let configs = [];
// let config = {
// 	input: 'psychojs/js/*/*.js',
// 	output: {
// 		file: '/tmp/rollup-' + process.env.VERSION + '/all.js',
// 		name: 'psychojs',
// 		format: 'iife',
// 		sourceMap: true
// 	},
// 	plugins: [
// 		multiEntry(),
// 		babel({
// 			exclude: 'node_modules/**',
// 		}),
// 		cleanup()
// 	]
// };
// configs.push(config);
//
//
// export default configs;



///////////////////////////////////////////////////////////////////////////////
// export to individual namespaces:


// get the namespaces:
const namespaces = glob.sync('./psychojs/js/*').map(p => p.substring(14));
console.log('rolling up and transpiling the namespaces: ', namespaces);

// build externals dict of arrays:
let externals = {};
for (const namespace of namespaces)
	externals[namespace] = glob.sync(path.resolve('./psychojs/js/' + namespace) + '/*.js');
//console.log(externals);

let configs = [];
for (const namespace of namespaces)
{
  // externals and globals for this namespace:
  let ext = [];
  let gbl = {};
	for (const n of namespaces)
		if (n !== namespace) {
      ext = [...ext, ...externals[n]];
      for (const file of externals[n])
      	gbl[file] = n
    }

	// config for this namespace:
	let config = {
		input: 'psychojs/js/' + namespace + '/*.js',
		output: {
			file: '/tmp/rollup-' + process.env.VERSION + '/' + namespace + '.js',
			name: namespace,
			format: 'iife',
      sourceMap: true,
      globals: gbl,

			//compact: true
		},
		external: ext,
		plugins: [
			multiEntry(),
      babel({
        exclude: 'node_modules/**',
        // plugins: ['babel-plugin-transform-for-of-as-array']
      }),
			cleanup()
		]
	};
	configs.push(config);
}

export default configs;

