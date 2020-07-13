/**********************************************************
 * Rollup all PsychoJS namespaces into distinct libraries *
 **********************************************************
 
 note: a full description of rollup.js options can be found here:
 https://rollupjs.org/guide/en#big-list-of-options

 */

import * as path from 'path';
import multiEntry from 'rollup-plugin-multi-entry';
import cleanup from 'rollup-plugin-cleanup';
import { glob } from 'glob';


// get the library names:
const libs = glob.sync('./psychojs/js/*').map(p => p.substring(14));
console.log('rolling up the libraries: ', libs);


// build externals dict of arrays:
let externals = {};
for (const lib of libs)
	externals[lib] = glob.sync(path.resolve('./psychojs/js/' + lib) + '/*.js');
//console.log(externals);


// get the rolled-up library associated to the given module
const pathsFn = (id) => {
	for (const lib of libs)
		if (id.indexOf('js/' + lib) >= 0)
			return './' + lib + '-' + process.env.VERSION + '.js';

	console.log(id, ': unknown module!');
	return '[UNKNOWN]';
};


// export the libraries as distinct modules:
let configs = [];
for (const lib of libs) {
	// externals for this lib:
	let ext = [];
	for (const l of libs)
		if (l !== lib)
			ext = [...ext, ...externals[l]];

	// config for this lib:
	let config = {
		input: 'psychojs/js/' + lib + '/*.js',
		output: {
			file: 'lib/' + lib + '-' + process.env.VERSION + '.js',
			name: lib,
			format: 'esm',
			paths: pathsFn,
			sourceMap: true
		},
		external: ext,
		plugins: [
			multiEntry(),
			cleanup()
		]
	};
	configs.push(config);
}
export default configs;
