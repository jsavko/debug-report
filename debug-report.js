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
  const newHead = document.querySelector("#settings").appendChild(document.createElement("h2"))
  const newHeadText = document.createTextNode("Debug");
  newHead.appendChild(newHeadText);
  
  const debugDiv = document.querySelector("#settings").appendChild(document.createElement("div"))
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

function checkBase64(string) { 

var count = occurrences(JSON.stringify(string) , "base64");

  if (count  > 0) {
    return " (" + count + " Base64 Detected)";
  }
  return '';
}

function GenerateReport() { 
    let report = {};
    let output = '<textarea id="foundryDebugResults" rows="10" readonly>';
    function formatBytes(a,b=2){if(0===a)return"0 Bytes";const c=0>b?0:b,d=Math.floor(Math.log(a)/Math.log(1024));return parseFloat((a/Math.pow(1024,d)).toFixed(c))+" "+["Bytes","KB","MB","GB","TB","PB","EB","ZB","YB"][d]}
    
    // Foundry Details
    report.Versions = {
      Foundry: game.data.version,
      System: `${game.system.id} version ${game.system.data.version}`,
    };
    
    report.User = {
      Role: Object.keys(CONST.USER_ROLES)[game.user.role],
    }
    
    report.Settings = {
      Disable_Canvas: game.settings.get("core", "noCanvas") ? 'Enabled' : 'Disabled',
      Max_FPS: game.settings.get("core", "maxFPS"),
      Token_Drag_Vision: game.settings.get("core", "tokenDragPreview") ? 'Enabled' : 'Disabled',
      Soft_Shadows: game.settings.get("core", "softShadows") ? 'Enabled' : 'Disabled',
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
      let debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
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
     Items: formatBytes(JSON.stringify(game.items).length) + checkBase64(game.items) ,
     Scenes: formatBytes(JSON.stringify(game.scenes).length) +  checkBase64(game.scenes),
     Journals: formatBytes(JSON.stringify(game.journal).length) + checkBase64(game.journal),
     Tables: formatBytes(JSON.stringify(game.tables).length) + checkBase64(game.tables),
     Chat: formatBytes(JSON.stringify(game.messages).length) +  checkBase64(game.messages),
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
        options: {"width":600},
        position: {"width":600}, 
        default: "close",
        close: () => {} 
    });
    d.options.height = 600; d.options.width = 600; d.position.width = 600; d.render(true);

}