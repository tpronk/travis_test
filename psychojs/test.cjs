'use strict'

const { exec } = require('child_process')
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const util = require('util')
const { minify } = require('terser')

const readFile = util.promisify(fs.readFile)
const minifyOptions = { format: { comments: false } }

// Go through each build step and compare with existing results
exec('rollup -c', (error) => {
  // Exit silently if OK
  assert.ifError(error)

  // List 'dist' directory files with a few exceptions
  const next = fs.readdirSync('./dist')
    // Skip hidden
    .filter(item => !item.startsWith('.'))
    // The 'lib' one is no rollup iife, but the components concatenated
    .filter(item => !item.includes('psychojs'))

  // Select files from the 'lib' directory
  const prev = fs.readdirSync('./../lib')
    // Keep if 'dist' mirror
    .filter(item => next.includes(item))
    // Fill in path
    .map(item => path.join('./../lib', item))

  next.forEach(async (nextFile, i) => {
    const nextFilePath = path.join('./dist', nextFile)
    const nextInput = await readFile(nextFilePath, 'utf8')
    const nextInputMinified = await minify(nextInput, minifyOptions)

    const prevFilePath = prev.find(item => item.includes(nextFile))
    const prevInput = await readFile(prevFilePath, 'utf8')
    const prevInputMinified = await minify(prevInput, minifyOptions)
    
    assert.equal(prevInputMinified.code, nextInputMinified.code)
  })
})
