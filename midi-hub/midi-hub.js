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
            maxApi.outlet("status", "input", "connected", normalized);
        } catch (err) {
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
            maxApi.outlet("status", "output", "connected", normalized);
        } catch (err) {
            maxApi.outlet("status", "error", "output", name, err.message);
        }
    }
}

function closeAllDevices() {
    for (const [, input] of inputs) {
        try { input.close(); } catch (err) {}
    }
    inputs.clear();

    for (const [, output] of outputs) {
        try { output.close(); } catch (err) {}
    }
    outputs.clear();

    nameMap.clear();
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
}

// ═══════════════════════════════════════════════════════════════════════════
// OUTPUT HANDLING
// ═══════════════════════════════════════════════════════════════════════════

function sendMidi(deviceName, type, channel, ...data) {
    const normalized = normalizeName(deviceName);
    const output = outputs.get(normalized);

    if (!output) {
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
        maxApi.outlet("status", "error", "send", deviceName, err.message);
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

refresh();
maxApi.outlet("status", "ready", inputs.size, outputs.size);

process.on("exit", closeAllDevices);
process.on("SIGINT", () => { closeAllDevices(); process.exit(); });
process.on("SIGTERM", () => { closeAllDevices(); process.exit(); });
