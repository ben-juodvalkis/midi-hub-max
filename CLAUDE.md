# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MIDI Hub for Max — a Node for Max module that auto-discovers MIDI devices, tags messages with device names, and provides bidirectional routing. The entire implementation lives in a single file: `midi-hub/midi-hub.js` (265 lines).

## Development Commands

There is no build system, linter, or automated test suite. The project uses a zero-install approach with `node_modules` committed to the repo.

```bash
# Install dependencies (only needed if node_modules is missing)
cd midi-hub && npm install

# Test: open midi-hub/test.maxpat or midi-hub/midi-hub.maxpat in Max 8/9
# There is no CLI test runner — testing is done manually through Max patches
```

## Architecture

**Runtime:** Node for Max (`[node.script]` object) spawns a Node.js subprocess that communicates with Max via IPC through the `max-api` module.

**Message flow:**
```
Input:  Hardware → easymidi.Input → JS event handler → maxApi.outlet() → Max patch
Output: Max patch → maxApi.addHandler() → sendMidi() → easymidi.Output → Hardware
```

**State:** Three Maps in `midi-hub.js` track everything:
- `inputs` — normalized device name → easymidi.Input
- `outputs` — normalized device name → easymidi.Output
- `nameMap` — normalized name → original OS device name

**Message format:** `devicename type channel data...`
- Device names are normalized: lowercase, spaces→underscores, alphanumeric only, max 32 chars
- Channels are 1-indexed in Max messages (converted to/from 0-indexed internally)
- Example: `launchpad_pro noteon 1 60 100`

**Output routing** accepts two syntaxes:
- Explicit: `send devicename type channel data...`
- Auto-routed: `devicename type channel data...` (matched against known output devices)

## Key Conventions

- 4-space indentation, semicolons always used
- Section headers use `═` box-drawing characters
- All MIDI type names are lowercase: `noteon`, `noteoff`, `cc`, `bend`, `touch`, `polytouch`, `clock`, `sysex`
- Error/status messages go through `maxApi.outlet("status", ...)` — never thrown
- Resource cleanup is registered on `exit`, `SIGINT`, `SIGTERM`

## Dependencies

Single runtime dependency: `easymidi` v3.0.0 (wraps `@julusian/midi` native bindings for CoreMIDI/ALSA/WinMM). The `max-api` module is provided by the Max runtime.

## Reference Documentation

- [tag-midi-messages.md](tag-midi-messages.md) — detailed implementation plan with architecture diagrams, routing patterns, use cases, and troubleshooting
- [README.md](README.md) — user-facing docs with message format reference and routing examples
