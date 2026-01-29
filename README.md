# MIDI Hub for Max

A Node for Max solution that provides automatic MIDI device discovery, message tagging by device name, and bidirectional routing.

## Features

- **Auto-discovery** - Automatically finds and connects to all MIDI devices
- **Device tagging** - Every MIDI message is prefixed with the device name
- **Bidirectional** - Send and receive through the same interface
- **Hot-plugging** - Devices are detected when plugged in/out (via `midiinfo`)
- **Normalized names** - Device names are cleaned for easy Max routing (e.g., `launchpad_pro`)

## Installation

1. Copy the `midi-hub` folder to your Max project or `~/Documents/Max 9/Library/`
2. Open `midi-hub.maxpat`
3. Click `script npm install` once to install dependencies
4. The script auto-starts on patch load

## Message Format

### Incoming (from node.script outlet)

```
devicename type channel data...
```

Examples:
```
launchpad_pro noteon 1 60 100
keystep_37 cc 1 74 64
moog_muse bend 1 8192
```

### Outgoing (to node.script inlet)

Same format:
```
devicename type channel data...
```

### Supported Message Types

| Type | Format | Example |
|------|--------|---------|
| `noteon` | device noteon channel note velocity | `synth noteon 1 60 100` |
| `noteoff` | device noteoff channel note velocity | `synth noteoff 1 60 0` |
| `cc` | device cc channel controller value | `synth cc 1 74 64` |
| `program` | device program channel number | `synth program 1 5` |
| `bend` | device bend channel value | `synth bend 1 8192` |
| `touch` | device touch channel pressure | `synth touch 1 100` |
| `polytouch` | device polytouch channel note pressure | `synth polytouch 1 60 80` |
| `clock` | device clock 0 | `master clock 0` |
| `start` | device start 0 | `master start 0` |
| `stop` | device stop 0 | `master stop 0` |
| `continue` | device continue 0 | `master continue 0` |
| `sysex` | device sysex 0 byte1 byte2 ... | `synth sysex 0 240 67 ... 247` |

## Commands

| Message | Description |
|---------|-------------|
| `refresh` | Rescan and reconnect all MIDI devices |
| `list` | Output current device lists |
| `script stop` | Stop the Node process |
| `script start` | Start the Node process |

## Routing Examples

### Route by device
```
[node.script midi-hub.js]
        │
        ▼
[route launchpad_pro keystep_37]
    │           │         │
    ▼           ▼         ▼
  [pad]      [keys]    [other]
```

### Route by message type
```
[node.script midi-hub.js]
        │
        ▼
[route devices status deviceinfo]
                            │
                            ▼
                  [route noteon noteoff cc]
```

### Send to a device
```
[message: my_synth noteon 1 60 100]
        │
        ▼
[node.script midi-hub.js]
```

## Output Messages

### Device Lists
```
devices inputs device1 device2 ...
devices outputs device1 device2 ...
devices count 3 4
```

### Status
```
status ready 3 4
status input connected devicename
status output connected devicename
status error send unknown_device devicename
```

### Device Info
```
deviceinfo normalized_name "Original Device Name"
```

## Requirements

- Max 8 or 9
- Node for Max (included with Max)

## License

MIT
