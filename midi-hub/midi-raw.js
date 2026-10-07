/**
 * midi-raw.js
 * Node for Max Raw MIDI Hub
 *
 * Like midi-hub.js but outputs/accepts raw MIDI bytes instead of
 * parsed messages. Compatible with Max's [midiout] and [midiin].
 * Messages are prepended with the normalized device name.
 *
 * Output format: devicename byte1 byte2 [byte3...]
 * Input format:  devicename byte1 byte2 [byte3...]
 *   or:          send devicename byte1 byte2 [byte3...]
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
// INPUT HANDLING — raw bytes
// ═══════════════════════════════════════════════════════════════════════════

function attachInputListeners(input, deviceName) {
    // Tap the underlying @julusian/midi Input for raw bytes
    input._input.on("message", (deltaTime, bytes) => {
        maxApi.outlet(deviceName, ...bytes);
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// OUTPUT HANDLING — raw bytes
// ═══════════════════════════════════════════════════════════════════════════

function sendRawMidi(deviceName, ...bytes) {
    const normalized = normalizeName(deviceName);
    const output = outputs.get(normalized);

    if (!output) {
        maxApi.outlet("status", "error", "send", "unknown_device", deviceName);
        return;
    }

    if (bytes.length === 0) {
        maxApi.outlet("status", "error", "send", "no_data", deviceName);
        return;
    }

    try {
        // Send raw bytes via underlying @julusian/midi Output
        output._output.sendMessage(Buffer.from(bytes));
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

maxApi.addHandler("send", (deviceName, ...bytes) => {
    sendRawMidi(deviceName, ...bytes);
});

// Handle any message as potential device-targeted raw MIDI
maxApi.addHandler(maxApi.MESSAGE_TYPES.ALL, (handled, ...args) => {
    if (handled) return;
    const [deviceName, ...bytes] = args;
    if (deviceName && bytes.length > 0 && typeof bytes[0] === "number" && outputs.has(normalizeName(deviceName))) {
        sendRawMidi(deviceName, ...bytes);
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
