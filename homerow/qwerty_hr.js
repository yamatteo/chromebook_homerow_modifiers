var contextID = 0;

const remap = {
  "Tab":           ["Tab",       "Tab",      "",    ""],
  "KeyQ":          ["q",         "Q",        "",    ""],
  "KeyW":          ["w",         "W",        "",    ""],
  "KeyE":          ["f",         "F",        "",    ""],
  "KeyR":          ["p",         "P",        "",    ""],
  "KeyT":          ["g",         "G",        "",    ""],
  "KeyY":          ["j",         "J",        "",    ""],
  "KeyU":          ["l",         "L",        "",    ""],
  "KeyI":          ["u",         "U",        "",    ""],
  "KeyO":          ["y",         "Y",        "",    ""],
  "KeyP":          [";",         ":",        "",    ""],

  "Backspace":     ["Backspace", "Backspace","",    ""],
  "KeyA":          ["a",         "A",        "",    ""],
  "KeyS":          ["r",         "R",        "",    ""],
  "KeyD":          ["s",         "S",        "",    ""],
  "KeyF":          ["t",         "T",        "",    ""],
  "KeyG":          ["d",         "D",        "",    ""],
  "KeyH":          ["h",         "H",        "",    ""],
  "KeyJ":          ["n",         "N",        "",    ""],
  "KeyK":          ["e",         "E",        "",    ""],
  "KeyL":          ["i",         "I",        "",    ""],
  "Semicolon":     ["o",         "O",        "",    ""],
  
  "ShiftLeft":     ["Shift",     "Shift",    "",    ""],
  "IntlBackslash": ["",          "",         "",    ""],
  "KeyZ":          ["z",         "Z",        "",    ""],
  "KeyX":          ["x",         "X",        "",    ""],
  "KeyC":          ["c",         "C",        "",    ""],
  "KeyV":          ["v",         "V",        "",    ""],
  "KeyB":          ["b",         "B",        "",    ""],
  "KeyN":          ["k",         "K",        "",    ""],
  "KeyM":          ["m",         "M",        "",    ""],
  "Comma":         [",",         "<",        "",    ""],
  "Period":        [".",         ">",        "",    ""],
  "Slash":         ["/",         "?",        "",    ""]
};

// State tracking for keys
var keyStates = {};

function modkey(keyData, states) {
  shifted = ((states["KeyD"] === "hold") || (states["KeyK"] === "hold"));
  control = ((states["KeyF"] === "hold") || (states["KeyJ"] === "hold"));
  altered = ((states["KeyS"] === "hold") || (states["KeyL"] === "hold"));
  keyData.extensionId = "homerow";
  keyData.shiftKey = (shifted || keyData.shiftKey);
  keyData.ctrlKey = (control || keyData.ctrlKey);
  keyData.altKey = (altered || keyData.altKey);
  if (remap[keyData.code]) {
    keyData.key = remap[keyData.code][(keyData.shiftKey != keyData.capsLock) ? 1 : 0]
  }
  keyData.type = "keydown";
  return keyData;
}

chrome.input.ime.onFocus.addListener(
    function(context) {
      contextID = context.contextID;
    }
);

chrome.input.ime.onBlur.addListener(() => {
  contextID = 0;
});

chrome.input.ime.onKeyEvent.addListener(
    function(engineID, keyData) {
      let handled = false;
      if (keyData.extensionId) {
        // console.log("altext", keyData);
        return false;
      }

      if (keyData.type === "keydown") {
        if (!keyStates[keyData.code] && remap[keyData.code]) {
          keyStates[keyData.code] = "free";
        }

        if (keyStates[keyData.code] === "free") {
          keyStates[keyData.code] = "down";
          // console.log(keyData.code, "is down");
          for (let key in keyStates) {
            if (key !== keyData.code && keyStates[key] === "down") {
              keyStates[key] = "hold";
              // console.log(key, "is hold");
            }
          }
          handled = true;
        }
      } else if (keyData.type === "keyup") {
        handled = true;
        if (keyStates[keyData.code] === "down") {
          // Emit the text for a "tap"
          if (remap[keyData.code]) {
            let shifted = keyData.capsLock !== keyData.shiftKey;
            let emit = remap[keyData.code][shifted ? 1 : 0];
            if (emit != null && contextID !== 0) {
              chrome.input.ime.sendKeyEvents({"contextID": contextID, "keyData": [modkey(keyData, keyStates)]});
            }
          }
        }
        // Reset the key state
        if (remap[keyData.code]) {
          keyStates[keyData.code] = "free";
          // console.log(keyData.code, "is free");
        }
      }
      // console.log(keyData);
      return handled;
    }
);
