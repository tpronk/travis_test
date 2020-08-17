#!/bin/sh

VERSION="2020.2"
COPYRIGHT_YEAR=`date +%Y`
echo "\npackaging version ${VERSION}, year ${COPYRIGHT_YEAR}"

# base directory:
DIR=$PWD


# (*) jshint the library
echo "\n(*) jshint the library..."
npm run jshint -- ${DIR}/psychojs/js


# (*) roll up the ES6+ library
echo "\n(*) rolling up the library..."
npm run rollup -- --environment VERSION:${VERSION} --config ${DIR}/rollup/rollup.config.js
npmResult=$?
if [ $npmResult != 0 ]
then
	exit
fi


# (*) roll up the transpiled library (for IE11)
echo "\n(*) rolling up the transpiled library..."
RDIR=/tmp/rollup-${VERSION}
rm -rf ${RDIR}
mkdir ${RDIR}
npm run rollup -- --environment VERSION:${VERSION} --config ${DIR}/rollup/rollup.IE11.js
npmResult=$?
if [ $npmResult != 0 ]
then
	exit
fi

echo "\n\t- concatenating the namespaces and adding runtime.js..."
# note: the concatenation order is VERY IMPORTANT since we must respect the dependency tree
cat ${RDIR}/util.js ${RDIR}/data.js ${RDIR}/core.js ${RDIR}/visual.js ${RDIR}/sound.js > ${RDIR}/psychojs-${VERSION}.js

echo "\n\t- adding the top level variables..."
#cat ${DIR}/rollup/polyfill.js ${RDIR}/psychojs-${VERSION}.js ${DIR}/rollup/toplevel.js > ${DIR}/lib/psychojs-${VERSION}.js
cat ${RDIR}/psychojs-${VERSION}.js ${DIR}/rollup/toplevel.js > ${DIR}/lib/psychojs-${VERSION}.js


# (*) CSS style sheet
echo "\n(*) preparing the PsychoJS style sheet..."
cp ${DIR}/psychojs/css/psychojs.css ${DIR}/lib/psychojs-${VERSION}.css
cp ${DIR}/psychojs/css/psychojs.css ${DIR}/lib/psychojs.css


# (*) jsPsych plugin
echo "\n(*) preparing the jsPsych plugin..."
cp ${DIR}/jsPsych/jspsych-pavlovia.js ${DIR}/lib/jspsych-pavlovia-${VERSION}.js


# (*) lab.js plugin
echo "\n(*) preparing the lab.js plugin..."
cp ${DIR}/labjs/labjs-pavlovia.js ${DIR}/lib/labjs-pavlovia-${VERSION}.js
