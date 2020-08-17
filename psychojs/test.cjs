'use strict'

const { exec } = require('child_process')
const assert = require('assert')

// Go through each build step and compare with existing results
exec('rollup -c', (error) => {
  // Exit silently if OK
  assert.ifError(error)
})
