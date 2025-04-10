const fs = require('fs')
const path = require('path')
const url = require('url')

const VALID_GIT_HOOKS = [
    'applypatch-msg',
    'pre-applypatch',
    'post-applypatch',
    'pre-commit',
    'pre-merge-commit',
    'prepare-commit-msg',
    'commit-msg',
    'post-commit',
    'pre-rebase',
    'post-checkout',
    'post-merge',
    'pre-push',
    'pre-receive',
    'update',
    'proc-receive',
    'post-receive',
    'post-update',
    'reference-transaction',
    'push-to-checkout',
    'pre-auto-gc',
    'post-rewrite',
    'sendemail-validate',
    'fsmonitor-watchman',
    'p4-changelist',
    'p4-prepare-changelist',
    'p4-post-changelist',
    'p4-pre-submit',
    'post-index-change',
]

const VALID_OPTIONS = ['preserveUnused']

const PREPEND_SCRIPT =
`#!/bin/sh

if [ "$SKIP_SIMPLE_GIT_HOOKS" = "1" ]; then
    echo "[INFO] SKIP_SIMPLE_GIT_HOOKS is set to 1, skipping hook."
    exit 0
fi

if [ -f "$SIMPLE_GIT_HOOKS_RC" ]; then
    . "$SIMPLE_GIT_HOOKS_RC"
fi

`

function getGitProjectRoot(directory=process.cwd()) {
    let start = directory
    if (typeof start === 'string') {
        if (start[start.length - 1] !== path.sep) {
            start += path.sep
        }
        start = path.normalize(start)
        start = start.split(path.sep)
    }
    if (!start.length) {
        return undefined
    }
    start.pop()

    let dir = start.join(path.sep)
    let fullPath = path.join(dir, '.git')

    if (fs.existsSync(fullPath)) {
        if(!fs.lstatSync(fullPath).isDirectory()) {
            let content = fs.readFileSync(fullPath, { encoding: 'utf-8' })
            let match = /^gitdir: (.*)\s*$/.exec(content)
            if (match) {
                let gitDir = match[1]
                let commonDir = path.join(gitDir, 'commondir');
                if (fs.existsSync(commonDir)) {
                    commonDir = fs.readFileSync(commonDir, 'utf8').trim();
                    return path.resolve(gitDir, commonDir)
                }
                return path.normalize(gitDir)
            }
        }
        return path.normalize(fullPath)
    } else {
        return getGitProjectRoot(start)
    }
}

function getProjectRootDirectoryFromNodeModules(projectPath) {
    function _arraysAreEqual(a1, a2) {
        return JSON.stringify(a1) === JSON.stringify(a2)
    }

    const projDir = projectPath.split(/[\\/]/) // <- would split both on '/' and '\'

    const indexOfPnpmDir = projDir.indexOf('.pnpm')
    if (indexOfPnpmDir > -1) {
        return projDir.slice(0, indexOfPnpmDir - 1).join('/');
    }

    const indexOfStoreDir = projDir.indexOf('.store')
    if (indexOfStoreDir > -1) {
        return projDir.slice(0, indexOfStoreDir - 1).join('/');
    }

    // A yarn2 STAB
    if (projDir.includes('.yarn') && projDir.includes('unplugged')) {
        return undefined
    }

    if (projDir.length > 2 &&
        _arraysAreEqual(projDir.slice(projDir.length - 2, projDir.length), [
            'node_modules',
            'simple-git-hooks'
        ])) {

        return projDir.slice(0, projDir.length - 2).join('/')
    }

    return undefined
}

function checkSimpleGitHooksInDependencies(projectRootPath) {
    if (typeof projectRootPath !== 'string') {
        throw TypeError("Package json path is not a string!")
    }

    const {packageJsonContent} = _getPackageJson(projectRootPath)

    // if simple-git-hooks in dependencies -> note user that he should remove move it to devDeps!
    if ('dependencies' in packageJsonContent && 'simple-git-hooks' in packageJsonContent.dependencies) {
        console.warn('[WARN] You should move simple-git-hooks to the devDependencies!')
        return true // We only check that we are in the correct package, e.g not in a dependency of a dependency
    }
    if (!('devDependencies' in packageJsonContent)) {
        return false
    }
    return 'simple-git-hooks' in packageJsonContent.devDependencies
}

async function setHooksFromConfig(projectRootPath=process.cwd(), argv=process.argv) {
    const customConfigPath = _getCustomConfigPath(argv)
    const config = await _getConfig(projectRootPath, customConfigPath)

    if (!config) {
        throw('[ERROR] Config was not found! Please add `.simple-git-hooks.cjs` or `.simple-git-hooks.js` or `.simple-git-hooks.mjs` or `simple-git-hooks.cjs` or `simple-git-hooks.js` or `simple-git-hooks.mjs` or `.simple-git-hooks.json` or `simple-git-hooks.json` or `simple-git-hooks` entry in package.json.\r\nCheck README for details')
    }

    const preserveUnused = Array.isArray(config.preserveUnused) ? config.preserveUnused : config.preserveUnused ? VALID_GIT_HOOKS: []

    for (let hook of VALID_GIT_HOOKS) {
        if (Object.prototype.hasOwnProperty.call(config, hook)) {
            _setHook(hook, config[hook], projectRootPath)
        } else if (!preserveUnused.includes(hook)) {
            _removeHook(hook, projectRootPath)
        }
    }
}

function _setHook(hook, command, projectRoot=process.cwd()) {
    const gitRoot = getGitProjectRoot(projectRoot)

    if (!gitRoot) {
        console.info('[INFO] No `.git` root folder found, skipping')
        return
    }

    const hookCommand = PREPEND_SCRIPT + command
    const hookDirectory = gitRoot + '/hooks/'
    const hookPath = path.normalize(hookDirectory + hook)

    const normalizedHookDirectory = path.normalize(hookDirectory)
    if (!fs.existsSync(normalizedHookDirectory)) {
        fs.mkdirSync(normalizedHookDirectory)
    }

    fs.writeFileSync(hookPath, hookCommand)
    fs.chmodSync(hookPath, 0o0755)

    console.info(`[INFO] Successfully set the ${hook} with command: ${command}`)
}

function removeHooks(projectRoot=process.cwd()) {
    for (let configEntry of VALID_GIT_HOOKS) {
        _removeHook(configEntry, projectRoot)
    }
}

function _removeHook(hook, projectRoot=process.cwd()) {
    const gitRoot = getGitProjectRoot(projectRoot)
    const hookPath = path.normalize(gitRoot + '/hooks/' + hook)

    if (fs.existsSync(hookPath)) {
        fs.unlinkSync(hookPath)
    }
}

function _getPackageJson(projectPath = process.cwd()) {
    if (typeof projectPath !== "string") {
        throw TypeError("projectPath is not a string")
    }

    const targetPackageJson = path.normalize(projectPath + '/package.json')

    if (!fs.statSync(targetPackageJson).isFile()) {
        throw Error("Package.json doesn't exist")
    }

    const packageJsonDataRaw = fs.readFileSync(targetPackageJson)
    return { packageJsonContent: JSON.parse(packageJsonDataRaw), packageJsonPath: targetPackageJson }
}

function _getCustomConfigPath(argv=[]) {
    // We'll run as one of the following:
    // npx simple-git-hooks ./config.js
    // node path/to/simple-git-hooks/cli.js ./config.js
    return argv[2] || ''
}

async function _getConfig(projectRootPath, configFileName='') {
    if (typeof projectRootPath !== 'string') {
        throw TypeError("Check project root path! Expected a string, but got " + typeof projectRootPath)
    }

    // every function here should accept projectRootPath as first argument and return object
    const sources = [
        () => _getConfigFromFile(projectRootPath, '.simple-git-hooks.cjs'),
        () => _getConfigFromFile(projectRootPath, '.simple-git-hooks.js'),
        () => _getConfigFromFile(projectRootPath, '.simple-git-hooks.mjs'),
        () => _getConfigFromFile(projectRootPath, 'simple-git-hooks.cjs'),
        () => _getConfigFromFile(projectRootPath, 'simple-git-hooks.js'),
        () => _getConfigFromFile(projectRootPath, 'simple-git-hooks.mjs'),
        () => _getConfigFromFile(projectRootPath, '.simple-git-hooks.json'),
        () => _getConfigFromFile(projectRootPath, 'simple-git-hooks.json'),
        () => _getConfigFromPackageJson(projectRootPath),
    ]

    // if user pass his-own config path prepend custom path before the default ones
    if (configFileName) {
        sources.unshift(() => _getConfigFromFile(projectRootPath, configFileName))
    }

    for (let executeSource of sources) {
        let config = await executeSource()
        if (config) {
            if (_validateHooks(config)) {
                return config
            }

            throw('[ERROR] Config was not in correct format. Please check git hooks or options name')
        }
    }

    return undefined
}

function _getConfigFromPackageJson(projectRootPath = process.cwd()) {
    const {packageJsonContent} = _getPackageJson(projectRootPath)
    const config = packageJsonContent['simple-git-hooks'];
    return typeof config === 'string' ? _getConfig(config) : config
}

async function _getConfigFromFile(projectRootPath, fileName) {
    if (typeof projectRootPath !== "string") {
        throw TypeError("projectRootPath is not a string")
    }

    if (typeof fileName !== "string") {
        throw TypeError("fileName is not a string")
    }

    try {
        const filePath = path.isAbsolute(fileName)
            ? fileName
            : path.normalize(projectRootPath + '/' + fileName)
        if (filePath === __filename) {
            return undefined
        }
        // handle `.json` with `require`, `import()` requires `with:{type:'json'}` which does not work for all engines
        if (filePath.endsWith('.json')) {
            return require(filePath)
        }
        const result =  await import(url.pathToFileURL(filePath)) // handle `.cjs`, `.js`, `.mjs`
        return result.default || result
    } catch (err) {
        return undefined
    }
}

function _validateHooks(config) {

    for (let hookOrOption in config) {
        if (!VALID_GIT_HOOKS.includes(hookOrOption) && !VALID_OPTIONS.includes(hookOrOption)) {
            return false
        }
    }

    return true
}

module.exports = {
    checkSimpleGitHooksInDependencies,
    setHooksFromConfig,
    getProjectRootDirectoryFromNodeModules,
    getGitProjectRoot,
    removeHooks,
    PREPEND_SCRIPT
}
