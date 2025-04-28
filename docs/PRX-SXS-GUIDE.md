# Project RED X Development with SxS CLI

This guide provides a quick reference for using the SxS CLI to develop Project RED X.

## Getting Started

Set up your development environment:

```bash
sxs prx:setup
```

This command:

- Sets up the Emscripten SDK
- Installs all required dependencies

## Common Development Commands

### Start Development Mode

```bash
sxs dev
```

Launches Project RED X in development mode with hot reloading.

### Build Web Version

```bash
sxs web
```

Builds the web version and starts the server.

### Build Native Version

```bash
sxs native
```

Builds the native version of Project RED X.

### Run Tests

```bash
sxs test
```

Builds the web version and runs the test suite.

## PRX-Specific Commands

### Check Project Status

```bash
sxs prx:status
```

Shows:

- Whether the server is running
- Currently active processes
- Project statistics

### See Recent Git Changes

```bash
sxs prx:changes
```

Shows the 10 most recent changes to the codebase.

### Watch Mode

```bash
sxs prx:watch
```

Watches for file changes and automatically rebuilds the project.

### Run Specific Tasks

```bash
sxs prx:run <task-name>
```

Run a specific VS Code task with monitoring, e.g.:

- `sxs prx:run make_web`
- `sxs prx:run start_server`

### Stop Running Tasks

```bash
sxs prx:stop <task-name>
```

Stops a currently running task.

## Branch Management

Switch to main branch:

```bash
sxs branch:main
```

Switch to docs branch:

```bash
sxs branch:docs
```

Show branch information:

```bash
sxs branch:info
```

Sync all branches:

```bash
sxs branch:sync
```

## Documentation

Generate project documentation:

```bash
sxs docs
```

## Deployment

Deploy to GitHub Pages:

```bash
sxs deploy
```

## Performance Monitoring

View build and runtime performance metrics:

```bash
sxs perf
```

Clear performance metrics:

```bash
sxs perf-clear
```

## Help and Information

Show all available commands:

```bash
sxs help
```

List installed plugins:

```bash
sxs plugins
```

Show SxS CLI version:

```bash
sxs version
```
