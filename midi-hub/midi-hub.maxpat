{
    "patcher": {
        "fileversion": 1,
        "appversion": {
            "major": 9,
            "minor": 1,
            "revision": 2,
            "architecture": "x64",
            "modernui": 1
        },
        "classnamespace": "box",
        "rect": [ 100.0, 100.0, 900.0, 520.0 ],
        "boxes": [
            {
                "box": {
                    "id": "obj-1",
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [ 30.0, 20.0, 400.0, 20.0 ],
                    "text": "MIDI Hub - Auto-discovers devices, tags messages by device name"
                }
            },
            {
                "box": {
                    "id": "obj-midiinfo",
                    "maxclass": "newobj",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "patching_rect": [ 350.0, 53.0, 145.0, 22.0 ],
                    "text": "midiinfo @autopollinput 1"
                }
            },
            {
                "box": {
                    "id": "obj-change",
                    "maxclass": "newobj",
                    "numinlets": 2,
                    "numoutlets": 2,
                    "outlettype": [ "bang", "" ],
                    "patching_rect": [ 350.0, 87.0, 53.0, 22.0 ],
                    "text": "sel clear"
                }
            },
            {
                "box": {
                    "id": "obj-refresh-msg",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "patching_rect": [ 350.0, 117.0, 47.0, 22.0 ],
                    "text": "refresh"
                }
            },
            {
                "box": {
                    "id": "obj-7",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "patching_rect": [ 50.0, 102.0, 100.0, 22.0 ],
                    "text": "script npm install"
                }
            },
            {
                "box": {
                    "id": "obj-8",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "patching_rect": [ 170.0, 102.0, 47.0, 22.0 ],
                    "text": "refresh"
                }
            },
            {
                "box": {
                    "id": "obj-9",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "patching_rect": [ 230.0, 102.0, 28.0, 22.0 ],
                    "text": "list"
                }
            },
            {
                "box": {
                    "id": "obj-10",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "patching_rect": [ 270.0, 102.0, 64.0, 22.0 ],
                    "text": "script stop"
                }
            },
            {
                "box": {
                    "id": "obj-11",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 2,
                    "outlettype": [ "", "" ],
                    "patching_rect": [ 50.0, 160.0, 180.0, 22.0 ],
                    "saved_object_attributes": {
                        "autostart": 1,
                        "defer": 0,
                        "node_bin_path": "",
                        "npm_bin_path": "",
                        "watch": 1
                    },
                    "text": "node.script midi-hub.js",
                    "textfile": {
                        "filename": "midi-hub.js",
                        "flags": 0,
                        "embed": 0,
                        "autowatch": 1
                    }
                }
            },
            {
                "box": {
                    "id": "obj-12",
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [ 250.0, 160.0, 300.0, 20.0 ],
                    "text": "<-- auto-starts"
                }
            },
            {
                "box": {
                    "id": "obj-13",
                    "maxclass": "newobj",
                    "numinlets": 4,
                    "numoutlets": 4,
                    "outlettype": [ "", "", "", "" ],
                    "patching_rect": [ 50.0, 198.0, 250.0, 22.0 ],
                    "text": "route devices status deviceinfo"
                }
            },
            {
                "box": {
                    "id": "obj-14",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [ 70.0, 243.0, 79.0, 22.0 ],
                    "text": "print devices"
                }
            },
            {
                "box": {
                    "id": "obj-15",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [ 160.0, 243.0, 68.0, 22.0 ],
                    "text": "print status"
                }
            },
            {
                "box": {
                    "id": "obj-16",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [ 240.0, 243.0, 89.0, 22.0 ],
                    "text": "print deviceinfo"
                }
            },
            {
                "box": {
                    "id": "obj-18",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [ 340.0, 243.0, 57.0, 22.0 ],
                    "text": "print midi"
                }
            },
            {
                "box": {
                    "id": "obj-raw-label",
                    "maxclass": "comment",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [ 30.0, 300.0, 400.0, 20.0 ],
                    "text": "Raw MIDI Hub - Same devices, raw bytes (compatible with midiout)"
                }
            },
            {
                "box": {
                    "id": "obj-raw-refresh",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "patching_rect": [ 170.0, 332.0, 47.0, 22.0 ],
                    "text": "refresh"
                }
            },
            {
                "box": {
                    "id": "obj-raw-list",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "patching_rect": [ 230.0, 332.0, 28.0, 22.0 ],
                    "text": "list"
                }
            },
            {
                "box": {
                    "id": "obj-raw-stop",
                    "maxclass": "message",
                    "numinlets": 2,
                    "numoutlets": 1,
                    "outlettype": [ "" ],
                    "patching_rect": [ 270.0, 332.0, 64.0, 22.0 ],
                    "text": "script stop"
                }
            },
            {
                "box": {
                    "id": "obj-raw-script",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 2,
                    "outlettype": [ "", "" ],
                    "patching_rect": [ 50.0, 370.0, 180.0, 22.0 ],
                    "saved_object_attributes": {
                        "autostart": 1,
                        "defer": 0,
                        "node_bin_path": "",
                        "npm_bin_path": "",
                        "watch": 1
                    },
                    "text": "node.script midi-raw.js",
                    "textfile": {
                        "filename": "midi-raw.js",
                        "flags": 0,
                        "embed": 0,
                        "autowatch": 1
                    }
                }
            },
            {
                "box": {
                    "id": "obj-raw-route",
                    "maxclass": "newobj",
                    "numinlets": 4,
                    "numoutlets": 4,
                    "outlettype": [ "", "", "", "" ],
                    "patching_rect": [ 50.0, 408.0, 250.0, 22.0 ],
                    "text": "route devices status deviceinfo"
                }
            },
            {
                "box": {
                    "id": "obj-raw-print-devices",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [ 70.0, 450.0, 109.0, 22.0 ],
                    "text": "print raw-devices"
                }
            },
            {
                "box": {
                    "id": "obj-raw-print-status",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [ 160.0, 450.0, 98.0, 22.0 ],
                    "text": "print raw-status"
                }
            },
            {
                "box": {
                    "id": "obj-raw-print-info",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [ 240.0, 450.0, 119.0, 22.0 ],
                    "text": "print raw-deviceinfo"
                }
            },
            {
                "box": {
                    "id": "obj-raw-print-midi",
                    "maxclass": "newobj",
                    "numinlets": 1,
                    "numoutlets": 0,
                    "patching_rect": [ 340.0, 450.0, 87.0, 22.0 ],
                    "text": "print raw-midi"
                }
            }
        ],
        "lines": [
            {
                "patchline": {
                    "destination": [ "obj-11", 0 ],
                    "source": [ "obj-10", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-13", 0 ],
                    "source": [ "obj-11", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-14", 0 ],
                    "source": [ "obj-13", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-15", 0 ],
                    "source": [ "obj-13", 1 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-16", 0 ],
                    "source": [ "obj-13", 2 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-18", 0 ],
                    "source": [ "obj-13", 3 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-11", 0 ],
                    "source": [ "obj-7", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-11", 0 ],
                    "source": [ "obj-8", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-11", 0 ],
                    "source": [ "obj-9", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-refresh-msg", 0 ],
                    "source": [ "obj-change", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-change", 0 ],
                    "source": [ "obj-midiinfo", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-11", 0 ],
                    "source": [ "obj-refresh-msg", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-raw-script", 0 ],
                    "source": [ "obj-refresh-msg", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-raw-script", 0 ],
                    "source": [ "obj-raw-refresh", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-raw-script", 0 ],
                    "source": [ "obj-raw-list", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-raw-script", 0 ],
                    "source": [ "obj-raw-stop", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-raw-route", 0 ],
                    "source": [ "obj-raw-script", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-raw-print-devices", 0 ],
                    "source": [ "obj-raw-route", 0 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-raw-print-status", 0 ],
                    "source": [ "obj-raw-route", 1 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-raw-print-info", 0 ],
                    "source": [ "obj-raw-route", 2 ]
                }
            },
            {
                "patchline": {
                    "destination": [ "obj-raw-print-midi", 0 ],
                    "source": [ "obj-raw-route", 3 ]
                }
            }
        ],
        "autosave": 0
    }
}