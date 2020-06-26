#!/usr/bin/env node
"use strict"

//
// jam basic interpreter shell
//
const fs = require('fs')
const process = require('process')

const lexFromSource = require('./js/arch/lex.js')
const parse = require('./js/arch/parser.js')
const vmFactory = require('./js/arch/vm.js')
const core = require('./js/lib/core.js')
const math = require('./js/lib/math.js')
const str = require('./js/lib/str.js')
const io = require('./js/env/io.js')

// process args
const args = process.argv;

const opt = {}
const scripts = []

let cmd = 'repl'
let lastOption
let parsedOption = false
for (let i = 2; i < args.length; i++) {
    let arg = args[i]

    if (arg === '--help' || arg === '-h'
            || arg === 'help' || arg === 'h') {
        parsedOption = false
        cmd = 'help'
    } else {
        // expect script name
        if (arg.startsWith('-')) {
            throw `Unknown option [${arg}]`
        }
        scripts.push(arg)
        cmd = 'run'
    }
}

function help() {
    console.log('Usage: reba [script]...')
}

function setupVM() {
    const vm = vmFactory()
    vm.lexFromSource = lexFromSource
    vm.parse = parse

    for (let n in core) vm.defineCmd(n, core[n])
    for (let n in io) vm.defineCmd(n, io[n])
    for (let n in math.fn) vm.defineFun(n, math.fn[n])
    for (let n in math.scope) vm.assign(n, math.scope[n])
    for (let n in str) vm.defineFun(n, str[n])

    // specific hooks to handle stdin/out
    vm.command.open() // open IO with io-specific procedure
    vm.command.input(vm.inputHandler)

    return vm
}

function run() {
    const vm = setupVM()

    scripts.forEach(origin => {
        const src = fs.readFileSync(origin, 'utf8')
        const lex = lexFromSource(src, vm.command.print)
        const code = parse(vm, lex)
        vm.run(code, 0)
    })
}

function repl() {
    const vm = setupVM()
    vm.repl()
}

switch(cmd) {
    case 'run': run(); break;
    case 'repl': repl(); break;
    case 'help': help(); break;
}