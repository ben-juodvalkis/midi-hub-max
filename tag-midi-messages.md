# Comprehensive Implementation Plan: MIDI Hub for Max

## Overview

A Node for Max solution that provides automatic MIDI device discovery, message tagging by device name, and bidirectional routing - all through a single `node.script` object.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              YOUR MAX PATCH                                  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        node.script midi-hub.js                       │   │
│  │                                                                      │   │
│  │   ┌──────────────────────────────────────────────────────────────┐  │   │
│  │   │                     Node.js Process                          │  │   │
│  │   │                                                              │  │   │
│  │   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │  │   │
│  │   │  │   easymidi  │  │   easymidi  │  │   easymidi  │   ...    │  │   │
│  │   │  │   Input A   │  │   Input B   │  │   Input C   │          │  │   │
│  │   │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘          │  │   │
│  │   │         │                │                │                  │  │   │
│  │   │         └────────────────┼────────────────┘                  │  │   │
│  │   │                          ▼                                   │  │   │
│  │   │              ┌───────────────────────┐                       │  │   │
│  │   │              │   Message Processor   │                       │  │   │
│  │   │              │   - Parse MIDI        │                       │  │   │
│  │   │              │   - Tag with device   │                       │  │   │
│  │   │              │   - Format for Max    │                       │  │   │
│  │   │              └───────────┬───────────┘                       │  │   │
│  │   │                          │                                   │  │   │
│  │   │                          ▼                                   │  │   │
│  │   │                   maxApi.outlet()                            │  │   │
│  │   │                                                              │  │   │
│  │   └──────────────────────────────────────────────────────────────┘  │   │
│  │                              │                                       │   │
│  └──────────────────────────────┼───────────────────────────────────────┘   │
│                                 │                                           │
│                                 ▼                                           │
│            ┌─────────────────────────────────────────┐                     │
│            │  devicename type channel data...        │                     │
│            │  launchpad_pro noteon 1 60 100          │                     │
│            └─────────────────────────────────────────┘                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
midi-hub/
├── midi-hub.js        # Main Node script (the brain)
├── package.json       # npm dependencies
├── midi-hub.maxpat    # Example Max patch
├── README.md          # Documentation
└── node_modules/      # Created after npm install
    └── easymidi/
```

---

## Phase 1: Setup

### Step 1.1: Create Project Folder

Create a folder called `midi-hub` in one of these locations:
- Your Max project folder
- `~/Documents/Max 9/Library/` (for global access)
- Any folder in Max's search path

### Step 1.2: Create `package.json`

```json
{
  "name": "midi-hub",
  "version": "1.0.0",
  "description": "MIDI Hub for Max - routes and tags all MIDI messages by device name",
  "main": "midi-hub.js",
  "dependencies": {
    "easymidi": "^3.0.0"
  }
}
```

### Step 1.3: Create `midi-hub.js`

```javascript
/**
 * midi-hub.js
 * Node for Max MIDI Hub
 * 
 * Automatically connects to all MIDI devices, tags incoming messages
 * with device name, and routes outgoing messages by device name.
 */

const maxApi = require("max-api");
const easymidi = require("easymidi");

// ═══════════════════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════════════════

const inputs = new Map();   // normalizedName -> easymidi.Input
const outputs = new Map();  // normalizedName -> easymidi.Output
const nameMap = new Map();  // normalizedName -> originalName

// ═══════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

function normalizeName(name) {
    return String(name)
        .trim()
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9_-]/g, '')
        .toLowerCase()
        .substring(0, 32) || 'device';
}

// ═══════════════════════════════════════════════════════════════════════════
// DEVICE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

function openAllInputs() {
    const inputNames = easymidi.getInputs();
    
    for (const name of inputNames) {
        const normalized = normalizeName(name);
        
        if (inputs.has(normalized)) continue;
        
        try {
            const input = new easymidi.Input(name);
            inputs.set(normalized, input);
            nameMap.set(normalized, name);
            
            attachInputListeners(input, normalized);
            
            maxApi.post(`Opened input: ${normalized} (${name})`);
            maxApi.outlet("status", "input", "connected", normalized, name);
            
        } catch (err) {
            maxApi.post(`Error opening input ${name}: ${err.message}`);
            maxApi.outlet("status", "error", "input", name, err.message);
        }
    }
}

function openAllOutputs() {
    const outputNames = easymidi.getOutputs();
    
    for (const name of outputNames) {
        const normalized = normalizeName(name);
        
        if (outputs.has(normalized)) continue;
        
        try {
            const output = new easymidi.Output(name);
            outputs.set(normalized, output);
            nameMap.set(normalized, name);
            
            maxApi.post(`Opened output: ${normalized} (${name})`);
            maxApi.outlet("status", "output", "connected", normalized, name);
            
        } catch (err) {
            maxApi.post(`Error opening output ${name}: ${err.message}`);
            maxApi.outlet("status", "error", "output", name, err.message);
        }
    }
}

function closeAllDevices() {
    for (const [name, input] of inputs) {
        try { input.close(); } catch (err) {}
    }
    inputs.clear();
    
    for (const [name, output] of outputs) {
        try { output.close(); } catch (err) {}
    }
    outputs.clear();
    
    nameMap.clear();
    maxApi.post("All devices closed");
}

function refresh() {
    closeAllDevices();
    openAllInputs();
    openAllOutputs();
    listDevices();
}

function listDevices() {
    const inputList = Array.from(inputs.keys());
    const outputList = Array.from(outputs.keys());
    
    maxApi.outlet("devices", "inputs", ...inputList);
    maxApi.outlet("devices", "outputs", ...outputList);
    maxApi.outlet("devices", "count", inputList.length, outputList.length);
    
    for (const [norm, orig] of nameMap) {
        maxApi.outlet("deviceinfo", norm, orig);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// INPUT HANDLING
// ═══════════════════════════════════════════════════════════════════════════

function attachInputListeners(input, deviceName) {
    
    input.on("noteon", (msg) => {
        maxApi.outlet(deviceName, "noteon", msg.channel + 1, msg.note, msg.velocity);
    });
    
    input.on("noteoff", (msg) => {
        maxApi.outlet(deviceName, "noteoff", msg.channel + 1, msg.note, msg.velocity);
    });
    
    input.on("cc", (msg) => {
        maxApi.outlet(deviceName, "cc", msg.channel + 1, msg.controller, msg.value);
    });
    
    input.on("program", (msg) => {
        maxApi.outlet(deviceName, "program", msg.channel + 1, msg.number);
    });
    
    input.on("pitch", (msg) => {
        maxApi.outlet(deviceName, "bend", msg.channel + 1, msg.value);
    });
    
    input.on("channel aftertouch", (msg) => {
        maxApi.outlet(deviceName, "touch", msg.channel + 1, msg.pressure);
    });
    
    input.on("poly aftertouch", (msg) => {
        maxApi.outlet(deviceName, "polytouch", msg.channel + 1, msg.note, msg.pressure);
    });
    
    input.on("clock", () => {
        maxApi.outlet(deviceName, "clock", 0);
    });
    
    input.on("start", () => {
        maxApi.outlet(deviceName, "start", 0);
    });
    
    input.on("continue", () => {
        maxApi.outlet(deviceName, "continue", 0);
    });
    
    input.on("stop", () => {
        maxApi.outlet(deviceName, "stop", 0);
    });
    
    input.on("position", (msg) => {
        maxApi.outlet(deviceName, "songpos", 0, msg.value);
    });
    
    input.on("select", (msg) => {
        maxApi.outlet(deviceName, "songsel", 0, msg.song);
    });
    
    input.on("sysex", (msg) => {
        maxApi.outlet(deviceName, "sysex", 0, ...msg.bytes);
    });
    
    input.on("reset", () => {
        maxApi.outlet(deviceName, "reset", 0);
    });
    
    // Active sensing filtered by default (too noisy)
}

// ═══════════════════════════════════════════════════════════════════════════
// OUTPUT HANDLING
// ═══════════════════════════════════════════════════════════════════════════

function sendMidi(deviceName, type, channel, ...data) {
    const normalized = normalizeName(deviceName);
    const output = outputs.get(normalized);
    
    if (!output) {
        maxApi.post(`Unknown output device: ${deviceName}`);
        maxApi.outlet("status", "error", "send", "unknown_device", deviceName);
        return;
    }
    
    const ch = Math.max(0, Math.min(15, (channel || 1) - 1));
    
    try {
        switch (type) {
            case "noteon":
            case "note":
                output.send("noteon", { note: data[0], velocity: data[1] ?? 100, channel: ch });
                break;
            case "noteoff":
                output.send("noteoff", { note: data[0], velocity: data[1] ?? 0, channel: ch });
                break;
            case "cc":
                output.send("cc", { controller: data[0], value: data[1], channel: ch });
                break;
            case "program":
                output.send("program", { number: data[0], channel: ch });
                break;
            case "bend":
                output.send("pitch", { value: data[0], channel: ch });
                break;
            case "touch":
                output.send("channel aftertouch", { pressure: data[0], channel: ch });
                break;
            case "polytouch":
                output.send("poly aftertouch", { note: data[0], pressure: data[1], channel: ch });
                break;
            case "clock":
                output.send("clock");
                break;
            case "start":
                output.send("start");
                break;
            case "continue":
                output.send("continue");
                break;
            case "stop":
                output.send("stop");
                break;
            case "sysex":
                output.send("sysex", data);
                break;
        }
    } catch (err) {
        maxApi.post(`Error sending to ${deviceName}: ${err.message}`);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAX MESSAGE HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

maxApi.addHandler("refresh", refresh);
maxApi.addHandler("list", listDevices);
maxApi.addHandler("stop", closeAllDevices);

maxApi.addHandler("send", (deviceName, type, channel, ...data) => {
    sendMidi(deviceName, type, channel, ...data);
});

// Handle any message as potential device-targeted MIDI
maxApi.addHandler(maxApi.MESSAGE_TYPES.ALL, (handled, ...args) => {
    if (handled) return;
    const [deviceName, type, channel, ...data] = args;
    if (deviceName && type && outputs.has(normalizeName(deviceName))) {
        sendMidi(deviceName, type, channel, ...data);
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

maxApi.post("════════════════════════════════════════════════════════");
maxApi.post("  MIDI Hub for Max");
maxApi.post("  Send 'refresh' to reconnect devices");
maxApi.post("════════════════════════════════════════════════════════");

refresh();

process.on("exit", closeAllDevices);
process.on("SIGINT", () => { closeAllDevices(); process.exit(); });
process.on("SIGTERM", () => { closeAllDevices(); process.exit(); });
```

---

## Phase 2: Installation in Max

### Step 2.1: Create Basic Patch

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   [loadbang]                                                    │
│       │                                                         │
│   [delay 500]                                                   │
│       │                                                         │
│   [message: script start]                                       │
│       │                                                         │
│       └────────────────────────────────┐                        │
│                                        │                        │
│   [message: script npm install]        │    [message: refresh]  │
│       │                                │         │              │
│       └────────────────────────────────┼─────────┘              │
│                                        │                        │
│                                        ▼                        │
│                    ┌───────────────────────────────┐            │
│                    │   [node.script midi-hub.js]   │            │
│                    └───────────────┬───────────────┘            │
│                                    │                            │
│                                    ▼                            │
│                             [first outlet]                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Step 2.2: Install Dependencies

1. Open your patch in Max
2. Click the `[script npm install]` message box **once**
3. Wait for installation to complete (check Max console)
4. You only need to do this once per machine

### Step 2.3: Verify Installation

After installation, the `node_modules` folder should appear:

```
midi-hub/
├── midi-hub.js
├── package.json
├── midi-hub.maxpat
└── node_modules/
    ├── easymidi/
    ├── midi/
    └── ...
```

---

## Phase 3: Message Format Reference

### Incoming Messages (from node.script outlet)

| Message Type | Format | Example |
|-------------|--------|---------|
| Note On | `device noteon channel note velocity` | `launchpad_pro noteon 1 60 100` |
| Note Off | `device noteoff channel note velocity` | `launchpad_pro noteoff 1 60 0` |
| Control Change | `device cc channel controller value` | `keystep_37 cc 1 74 64` |
| Program Change | `device program channel number` | `moog_muse program 1 5` |
| Pitch Bend | `device bend channel value` | `keystep_37 bend 1 8192` |
| Aftertouch | `device touch channel pressure` | `keystep_37 touch 1 100` |
| Poly Aftertouch | `device polytouch channel note pressure` | `keystep_37 polytouch 1 60 80` |
| Clock | `device clock 0` | `moog_muse clock 0` |
| Start | `device start 0` | `moog_muse start 0` |
| Continue | `device continue 0` | `moog_muse continue 0` |
| Stop | `device stop 0` | `moog_muse stop 0` |
| Song Position | `device songpos 0 value` | `sequencer songpos 0 1234` |
| SysEx | `device sysex 0 byte1 byte2 ...` | `synth sysex 0 240 67 ... 247` |

### Outgoing Messages (to node.script inlet)

Same format as incoming:

```
devicename type channel data...
```

Or with explicit `send` prefix:

```
send devicename type channel data...
```

### Control Messages

| Message | Description |
|---------|-------------|
| `refresh` | Rescan and reconnect all MIDI devices |
| `list` | Output current device lists |
| `script stop` | Stop the Node process |
| `script start` | Start the Node process |

### Status Messages (from outlet)

```
devices inputs device1 device2 device3 ...
devices outputs device1 device2 device3 ...
devices count 3 4

status input connected devicename "Original Name"
status output connected devicename "Original Name"
status error send unknown_device devicename

deviceinfo normalized_name "Original Device Name"
```

---

## Phase 4: Routing Patterns

### Pattern A: Route by Device

```
[node.script midi-hub.js]
          │
          ▼
[route launchpad_pro keystep_37 moog_muse]
    │           │           │        │
    ▼           ▼           ▼        ▼
 [pad]      [keys]      [moog]   [other]
processing  processing  processing
```

### Pattern B: Route by Message Type

```
[node.script midi-hub.js]
          │
          ▼
[route devices status deviceinfo]  ◄── filter control messages
    │       │        │       │
    ▼       ▼        ▼       ▼
 [print] [print]  [print]  [MIDI messages]
                              │
                              ▼
                    [route noteon noteoff cc]
                        │       │      │
                        ▼       ▼      ▼
```

### Pattern C: Device + Type Filtering

```
[node.script midi-hub.js]
          │
          ▼
[route launchpad_pro]
          │
          ▼
[route noteon noteoff cc]
    │       │       │
    ▼       ▼       ▼
 [notes]  [notes] [ccs]
```

### Pattern D: MIDI Thru with Processing

```
[node.script midi-hub.js]
          │
          ▼
[route keystep_37]         ◄── input from KeyStep
          │
          ▼
[your-processing]          ◄── transpose, filter, etc.
          │
          ▼
[prepend prophet_6]        ◄── route to Prophet
          │
          ▼
[node.script midi-hub.js]
```

### Pattern E: Merge Multiple Inputs to One Output

```
[node.script midi-hub.js]
          │
          ▼
[route launchpad_pro keystep_37]
          │           │
          └─────┬─────┘
                │
                ▼
        [prepend moog_muse]
                │
                ▼
        [node.script midi-hub.js]
```

### Pattern F: Split One Input to Multiple Outputs

```
[node.script midi-hub.js]
          │
          ▼
[route keystep_37]
          │
          ▼
      [t l l l]
       │  │  │
       ▼  ▼  ▼
[prepend] [prepend] [prepend]
 synth_a   synth_b   daw
       │  │  │
       └──┴──┘
          │
          ▼
[node.script midi-hub.js]
```

---

## Phase 5: Common Use Cases

### Use Case 1: Simple MIDI Monitor

```
[node.script midi-hub.js]
          │
          ▼
[route devices status deviceinfo]
    │       │        │       │
    ▼       ▼        ▼       ▼
    │       │        │   [print midi]
    │       │        │
[print] [print]  [print]
```

### Use Case 2: Keyboard → Synth Router

```
[loadbang]
     │
[delay 500]
     │
[script start]
     │
     ▼
[node.script midi-hub.js]
     │
     ▼
[route keystep_37]                    ◄── receive from keyboard
     │
     ▼
[route noteon noteoff cc bend]        ◄── filter message types
  │     │      │    │
  └──┬──┴──────┴────┘
     │
     ▼
[prepend prophet_6]                   ◄── send to synth
     │
     ▼
[node.script midi-hub.js]
```

### Use Case 3: Controller → DAW with Visual Feedback

```
[node.script midi-hub.js]
          │
          ▼
[route launchpad_pro]
          │
          ▼
[route noteon cc]
    │      │
    ▼      ▼
[multislider] [prepend daw_port]     ◄── visual feedback + forward
    │              │
    │              ▼
    │      [node.script midi-hub.js]
    │
[pak 0 0 0]
    │
    ▼
[prepend launchpad_pro noteon 1]     ◄── LED feedback
    │
    ▼
[node.script midi-hub.js]
```

### Use Case 4: Clock Distribution

```
[node.script midi-hub.js]
          │
          ▼
[route master_clock]
          │
          ▼
[route clock start stop continue]
    │     │     │        │
    └─────┴─────┴────────┘
              │
              ▼
          [t l l l]
           │  │  │
           ▼  ▼  ▼
    [prepend] [prepend] [prepend]
     synth_a   synth_b   drum_machine
           │  │  │
           └──┴──┘
              │
              ▼
    [node.script midi-hub.js]
```

---

## Phase 6: Advanced Configuration

### Filtering Clock Messages (High Traffic)

Clock messages fire 24 times per beat. Filter them if not needed:

```
[node.script midi-hub.js]
          │
          ▼
[route clock]
    │     │
    │     └──────────────────┐
    ▼                        ▼
[gate 0]              [rest of messages]
    │                        │
    ▼                        ▼
[clock-specific]      [normal processing]
[processing if needed]
```

### Device Hot-Plugging

```
[key]                         ◄── press 'r' to refresh
  │
[sel 114]
  │
[message: refresh]
  │
  ▼
[node.script midi-hub.js]
```

Or with a metro for auto-refresh:

```
[metro 5000]                  ◄── check every 5 seconds
     │
     ▼
[message: refresh]
     │
     ▼
[node.script midi-hub.js]
```

### Debugging

```
[node.script midi-hub.js]
          │              │
          │              └───────────────┐
          ▼                              ▼
[route devices status]           [node.debug]
          │                              │
          ▼                              ▼
      [print]                     [Max Console]
```

---

## Phase 7: Troubleshooting

### Problem: "Cannot find module 'easymidi'"

**Solution:** Send `script npm install` to the node.script object.

### Problem: Device not appearing

**Checklist:**
1. Device recognized by OS? (Check Audio MIDI Setup on Mac, Device Manager on Windows)
2. Send `refresh` to rescan
3. Send `list` to see connected devices
4. Check Max console for error messages

### Problem: MIDI not sending

**Checklist:**
1. Verify exact device name with `list` command
2. Channel should be 1-16 (not 0-15)
3. Check for error messages in outlet
4. Verify output device is not in use by another app

### Problem: High CPU usage

**Solutions:**
1. Filter clock messages (24 per beat = high traffic)
2. Active sensing is filtered by default
3. Use `[speedlim]` on high-traffic outputs

### Problem: Latency

**Note:** Node for Max adds ~1-2ms latency compared to native Max MIDI objects. For most applications this is imperceptible. If you need absolute minimum latency for performance, consider using native `midiin`/`midiout` for critical paths.

---

## Phase 8: Performance Considerations

| Factor | Impact | Mitigation |
|--------|--------|------------|
| Number of devices | Low | Scales well to 10+ devices |
| Clock messages | Medium | Filter if not needed |
| SysEx | Low | Handled efficiently |
| Note density | Low | No practical limit |
| Node.js overhead | ~1-2ms | Acceptable for most uses |

---

## Phase 9: Quick Start Checklist

- [ ] Create `midi-hub` folder
- [ ] Add `midi-hub.js` to folder
- [ ] Add `package.json` to folder
- [ ] Create Max patch with `[node.script midi-hub.js]`
- [ ] Send `script npm install` once
- [ ] Send `script start` to begin
- [ ] Send `list` to see devices
- [ ] Use `[route devicename]` to filter by device
- [ ] Send `devicename type channel data...` to output

---

## Summary

This implementation provides:

- ✅ **Zero-config device discovery** - automatically finds all MIDI devices
- ✅ **Unified message format** - consistent `device type channel data` format
- ✅ **Bidirectional routing** - send and receive through same interface
- ✅ **Hot-plugging support** - `refresh` command rescans devices
- ✅ **Minimal Max patching** - one `node.script` object does everything
- ✅ **All MIDI message types** - notes, CC, program, bend, clock, sysex, etc.
- ✅ **Clean device names** - normalized for easy routing in Max

The entire system is contained in a single JavaScript file (~200 lines) with one npm dependency (`easymidi`), making it easy to include in any Max project.