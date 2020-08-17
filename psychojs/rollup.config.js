// ES native imports courtesy of using type module in 'package.json'
import { readdirSync } from 'fs'

// Manually set default version here for easier 
// diffing when comparing to original build script output
const { VERSION: version = '2020.2' } = process.env

const globals = {
	performance: 'performance'
};

// Enabled in the original, even though 
// source maps missing for sample provided
const sourcemap = false;

// Might be 'build' or similar
const destination = './dist';
// Could be 'src' or 'lib'
const source = './js';

// List source directory contents
const components = readdirSync(source)
	// Drop hidden elements
	.filter(item => !item.startsWith('.'))
	// Prepare an output object for each component module
	.map((component, _, contents) => ({
			// So I don't have to specify full paths
			external: (id) => {
				// Decompose current component path
				const segments = id.split('/');

				// Mark as external if contents within source
				// directory tree, excluding the current component
				return contents
					.filter(item => item !== component)
					.some(item => segments.includes(item))
			},
			input: `${source}/${component}/index.js`,
			// Uncomment the following line to disable circular dependency warnings
			// onwarn,
			output: [
				{
					file: `${destination}/${component}-${version}.js`,
					format: 'module',
					globals,
					// Find which module the import points to 
					// and fix path in place 
					paths: (id) => {
						const name = id.split('/').find(item => contents.includes(item));

						return `./${name}-${version}.js`;
					},
					sourcemap,
				}
			],
		})
	);

// Array of output files could be set as part of directory traversal routine
export default [
	{
		input: 'index.js',
		output: {
			file: `${destination}/psychojs-${version}.js`,
			footer: `
// Add a few top level variables for convenience, this makes it 
// possible to eg. use "return Scheduler.Event.NEXT;" instead of "util.Scheduler.Event.NEXT;"
window.PsychoJS = core.PsychoJS;
window.TrialHandler = data.TrialHandler;
window.Scheduler = util.Scheduler;`,
			// IIFE in the original?
			// format: 'iife',
			// But UMD offers more support at no real cost
			format: 'iife',
			// For why this 'hack', see 
			// https://github.com/rollup/rollup/issues/494
			name: 'psychojs'
		}
	},
	...components
];

// https://rollupjs.org/guide/en/#onwarn
function onwarn(message) {
	// Skip circular dependecy warnings
	if (message.code !== 'CIRCULAR_DEPENDENCY') {
		console.warn('(!)', message.toString());
	}
}
