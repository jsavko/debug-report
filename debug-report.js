/**
 * Registers the report on chatmessage
 */
Hooks.once('init', () => {
  console.log("Debug Report Loaded: Use /debug in chat window to create a report");
});


Hooks.on('chatMessage', (chatLog, message) => {
  if (message == "/debug") {
    //do debug
    setTimeout(() => {
      GenerateReport();  //Hacky fix to the window auto closing =[
    }, 200);
    return false;

  }
});


Hooks.once('ready', () => {
  //Send a message to the chat log about using /debug to generate a report.
  $(document).on("click", ".debug-report", (ev) => {
    ev.preventDefault();
    GenerateReport();
  });

  if (!game.user.getFlag("debug-report", "welcomeMessageShown")) {

    let options = {
      whisper: [game.user.id],
      content: '<p>Debug Report Generator has been installed.</p> <p>Type `/debug` in the chat window or click the button below to create a report.</p>     <p><button class="debug-report" data-key="debug-report">Generate Report</button></p>'
    };
    ChatMessage.create(options);
    game.user.setFlag("debug-report", "welcomeMessageShown", true);
  }

});

Hooks.once("renderSettings", (app, html) => {
  const newHead = document.querySelector("#settings-documentation").appendChild(document.createElement("h2"))
  const newHeadText = document.createTextNode("Debug");
  newHead.appendChild(newHeadText);

  const debugDiv = document.querySelector("#settings-documentation").appendChild(document.createElement("div"))
  debugDiv.setAttribute('id', 'settings-debug')

  const debugButton = document.querySelector("#settings-debug").appendChild(document.createElement("button"))
  debugButton.setAttribute('class', 'debug-report')
  debugButton.setAttribute('data-key', 'debug-report')
  const debugButtonText = document.createTextNode("Generate Report");
  debugButton.appendChild(debugButtonText);

});


function occurrences(string, subString, allowOverlapping) {

  string += "";
  subString += "";
  if (subString.length <= 0) return (string.length + 1);

  var n = 0,
    pos = 0,
    step = allowOverlapping ? 1 : subString.length;

  while (true) {
    pos = string.indexOf(subString, pos);
    if (pos >= 0) {
      ++n;
      pos += step;
    } else break;
  }
  return n;
}

function checkBase64_string(string) {

  let count = occurrences(JSON.stringify(string), ";base64,");

  if (count > 0) {
    return " (" + count + " Base64 Detected)";
  }
  return '';
}

function checkBase64(str) {

  const regex = /data:[a-zA-z0-9\/]*;base64,/g;
  str = JSON.stringify(str);
  let count = (String(str).match(regex) || []).length;

  if (count > 0) {
    return " (" + count + " Base64 Detected)";
  }
  return '';
}

function formatBytes(a, b = 2) { if (0 === a) return "0 Bytes"; const c = 0 > b ? 0 : b, d = Math.floor(Math.log(a) / Math.log(1024)); return parseFloat((a / Math.pow(1024, d)).toFixed(c)) + " " + ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"][d] }

function getImageFileSize(imgPath) {
  if (!imgPath || imgPath.length === 0) { return 0; }
  let http = new XMLHttpRequest();
  http.open('HEAD', imgPath, false); http.send(null);
  let length = 0;
  if (http.status === 200) {
    length = http.getResponseHeader('content-length');
   }

  return parseInt(length);
}

function getJSONSize(anObject) {
  return JSON.stringify(anObject).length;
}

function getSceneWeight() {
  let currentScene = canvas.scene;
  let sceneWeight = {
    totalSize: { value: 0, formatted: "" },
    totalImages: { value: 0, formatted: "" },
    totalTiles: { value: 0, formatted: "" },
    totalTokens: { value: 0, formatted: "" },
    totalLights: { value: 0, formatted: "" },
    totalNotes: { value: 0, formatted: "" },
    totalAmbiance: { value: 0, formatted: "" },
    totalTemplates: { value: 0, formatted: "" },
    totalDrawings: { value: 0, formatted: "" },
    totalWalls: { value: 0, formatted: "" },
    totalJSON: { value: 0, formatted: "" }
  };

  sceneWeight.totalJSON.value += getJSONSize(currentScene); //RAW JSON weight of scene
  sceneWeight.totalImages.value += getImageFileSize(currentScene.data.img); //Background Image
  sceneWeight.totalImages.value += getImageFileSize(currentScene.data.foreground); //Foreground Image
  sceneWeight.totalImages.value += getImageFileSize(currentScene.data.thumb); //The thumbnail counts!

  //Tokens
  for (let token of currentScene.tokens) {
    sceneWeight.totalImages.value += getImageFileSize(token.data.img);
    sceneWeight.totalTokens.value += getJSONSize(token);
  }

  //Tiles
  for (let tile of currentScene.tiles) {
    sceneWeight.totalImages.value += getImageFileSize(tile.data.img);
    sceneWeight.totalTiles.value += getJSONSize(tile);
  }

  //Lights
  for (let light of currentScene.lights) {
    sceneWeight.totalLights.value += getJSONSize(light);
  }

  //Notes
  for (let note of currentScene.notes) {
    sceneWeight.totalImages.value += getImageFileSize(note.data.icon);
    sceneWeight.totalNotes.value += getJSONSize(note);
  }

  //Ambiance effects - sound file is included in this!
  for (let sound of currentScene.sounds) {
    sceneWeight.totalAmbiance.value += getImageFileSize(sound.data.path);
    sceneWeight.totalAmbiance.value += getJSONSize(sound);
  }

  //Templates 
  for (let template of currentScene.templates) {
    sceneWeight.totalTemplates.value += getJSONSize(template);
  }

  //Drawings 
  for (let drawing of currentScene.drawings) {
    sceneWeight.totalDrawings.value += getJSONSize(drawing);
  }

  //Walls
  for (let wall of currentScene.walls) {
    sceneWeight.totalWalls.value += getJSONSize(wall);
  }

  sceneWeight.totalSize.value = sceneWeight.totalJSON.value + sceneWeight.totalImages.value + sceneWeight.totalTokens.value + sceneWeight.totalTiles.value + sceneWeight.totalLights.value + sceneWeight.totalNotes.value + sceneWeight.totalAmbiance.value + sceneWeight.totalTemplates.value + sceneWeight.totalDrawings.value + sceneWeight.totalWalls.value;
  sceneWeight.totalSize.formatted = formatBytes(sceneWeight.totalSize.value);
  sceneWeight.totalTokens.formatted = formatBytes(sceneWeight.totalTokens.value);
  sceneWeight.totalJSON.formatted = formatBytes(sceneWeight.totalJSON.value);
  sceneWeight.totalImages.formatted = formatBytes(sceneWeight.totalImages.value);
  sceneWeight.totalTiles.formatted = formatBytes(sceneWeight.totalTiles.value);
  sceneWeight.totalLights.formatted = formatBytes(sceneWeight.totalLights.value);
  sceneWeight.totalNotes.formatted = formatBytes(sceneWeight.totalNotes.value);
  sceneWeight.totalAmbiance.formatted = formatBytes(sceneWeight.totalAmbiance.value);
  sceneWeight.totalTemplates.formatted = formatBytes(sceneWeight.totalTemplates.value);
  sceneWeight.totalDrawings.formatted = formatBytes(sceneWeight.totalDrawings.value);
  sceneWeight.totalWalls.formatted = formatBytes(sceneWeight.totalWalls.value);

  console.log(`DEBUG REPORT MODULE | Current Scene Weight Breakdown:\nTotal Size: ${sceneWeight.totalSize.formatted}\nTotal Assets: ${sceneWeight.totalImages.formatted}\nTotal JSON: ${sceneWeight.totalJSON.formatted}\nTotal Tokens: ${sceneWeight.totalTokens.formatted}\nTotal Tiles: ${sceneWeight.totalTiles.formatted}\nTotal Lights: ${sceneWeight.totalLights.formatted}\nTotal Notes: ${sceneWeight.totalNotes.formatted}\nTotal Sounds: ${sceneWeight.totalAmbiance.formatted}\nTotal Templates: ${sceneWeight.totalTemplates.formatted}\nTotal Drawings: ${sceneWeight.totalDrawings.formatted}\nTotal Walls: ${sceneWeight.totalWalls.formatted}`);

  return sceneWeight;
}

function GenerateReport() {
  let report = {};
  let output = '<textarea id="foundryDebugResults" rows="10" readonly>';

  // Foundry Details
  report.Versions = {
    Foundry: game.version,
    System: `${game.system.id} version ${game.system.data.version}`,
  };

  report.User = {
    Role: Object.keys(CONST.USER_ROLES)[game.user.role],
  }

  report.Settings = {
    Disable_Canvas: game.settings.get("core", "noCanvas") ? 'Enabled' : 'Disabled',
    Max_FPS: game.settings.get("core", "maxFPS"),
    Token_Drag_Vision: game.settings.get("core", "tokenDragPreview") ? 'Enabled' : 'Disabled',
    Performance_Mode: game.settings.get("core", "performanceMode"),
    Token_Vision_Animation: game.settings.get("core", "visionAnimation") ? 'Enabled' : 'Disabled',
    Light_Source_Animation: game.settings.get("core", "lightAnimation") ? 'Enabled' : 'Disabled',
    Zoomed_Texture_Antialiasing: game.settings.get("core", "mipmap") ? 'Enabled' : 'Disabled',
    Animate_Roll_Tables: game.settings.get("core", "animateRollTable") ? 'Enabled' : 'Disabled',
  }

  if (!game.settings.get("core", "noCanvas")) {
    report.Scene = {
      Walls: canvas.walls?.placeables.length,
      Lights: canvas.lighting?.placeables.length,
      Tokens: canvas.tokens?.placeables.length,
      Tiles: canvas.foreground?.placeables.length,
      Sounds: canvas.sounds?.placeables.length,
      Drawings: canvas.drawings?.placeables.length,
      Notes: canvas.notes?.placeables.length,
      Dimensions: `${canvas.dimensions?.width} x ${canvas.dimensions?.height}`,
      Background: `${canvas.background?.width} x ${canvas.background?.height}`,
      Foreground: `${canvas.foreground?.width} x ${canvas.foreground?.height}`,
    }

    // WebGL Details
    let gl = canvas.app?.renderer.gl;
    if (gl) {
      //Firefox uses different render agent now.
      let debugInfo;
      if (String(navigator.userAgent).includes("Firefox")) {
        debugInfo = gl.getExtension('RENDERER');
      } else {
        debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      }
      report.WebGL = {
        Context: gl.constructor.name,
        GL_Vendor: gl.getParameter(gl.VENDOR),
        Renderer: gl.getParameter(gl.RENDERER),
        Unmasked_Renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown',
        WebGL_Version: gl.getParameter(gl.VERSION),
        MAX_TEXTURE_SIZE: gl.getParameter(gl.MAX_TEXTURE_SIZE),
        MAX_RENDERBUFFER: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
      }
    } else {
      report.WebGL = {
        Context: 'FAILED TO GET WEBGL CONTEXT'
      }
    }
  }

  report.Database = {
    Actors: game.actors.size,
    Items: game.items.size,
    Scenes: game.scenes.size,
    Journals: game.journal.size,
    Tables: game.tables.size,
    Chat: game.messages.size,
    Macros: game.macros.size,
  }

  //Data Sizes
  report.Data_Sizes = {
    Actors: formatBytes(JSON.stringify(game.actors).length) + checkBase64(game.actors),
    Items: formatBytes(JSON.stringify(game.items).length) + checkBase64(game.items),
    Scenes: formatBytes(JSON.stringify(game.scenes).length) + checkBase64(game.scenes),
    Journals: formatBytes(JSON.stringify(game.journal).length) + checkBase64(game.journal),
    Tables: formatBytes(JSON.stringify(game.tables).length) + checkBase64(game.tables),
    Chat: formatBytes(JSON.stringify(game.messages).length) + checkBase64(game.messages),
    Macros: formatBytes(JSON.stringify(game.macros).length) + checkBase64(game.macros),
  };

  // Browser Details
  report.Browser = {
    Platform: navigator.platform,
    Vendor: navigator.vendor,
    Agent: navigator.userAgent,
  }

  // If chromium browser we can check memory stats
  if (performance?.memory) {
    report.Memory = {
      Heap_Limit: formatBytes(performance?.memory.jsHeapSizeLimit),
      Heap_Total: formatBytes(performance?.memory.totalJSHeapSize),
      Heap_Used: formatBytes(performance?.memory.usedJSHeapSize),
    }
  }


  let sceneWeight = getSceneWeight();
  report.Load = {
    World_Size: formatBytes(getJSONSize(game.actors) + getJSONSize(game.items) + getJSONSize(game.scenes) + getJSONSize(game.journal) + getJSONSize(game.tables) + getJSONSize(game.messages) + getJSONSize(game.macros)),
    Scene_Size: sceneWeight.totalSize.formatted
  }

  // Module details
  report.Modules = {
    Total: game.modules.size,
    Enabled: 0,
  }

  report.Active_Modules = {}
  let ct = 0;
  game.modules.forEach(m => {
    if (m.active) {
      report.Modules.Enabled++;
      report.Active_Modules[m.data.name] = `${m.data.title} v${m.data.version}`;
    }
  });

  for (const [k1, v1] of Object.entries(report)) {
    output += `${k1}:\n`;
    for (const [k2, v2] of Object.entries(v1)) {
      output += `  ${k2}: ${v2}\n`;
    }
  }

  output += "</textarea>"

  let d = new Dialog({
    title: `Debug Output`,
    content: `${output}`,
    buttons: {
      copy: {
        label: `Copy to clipboard`,
        callback: () => { $("#foundryDebugResults").val("```" + $("#foundryDebugResults").val() + "```"); $("#foundryDebugResults").select(); document.execCommand('copy'); }
      },
      close: {
        icon: "",
        label: `Close`
      }
    },
    options: { "width": 600 },
    position: { "width": 600 },
    default: "close",
    close: () => { }
  });
  d.options.height = 600; d.options.width = 600; d.position.width = 600; d.render(true);

}