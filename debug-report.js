/**
 * Registers the report on chatmessage
 */
Hooks.once('init', () => {
    console.log("Debug Report Loaded");
});


Hooks.once('ready', () => {
    //Send a message to the chat log about using /debug to generate a report.
    let support_button = $("button[data-action=support]")[0];
    support_button.setAttribute('data-action', 'debug_report')
    $("button[data-action=debug_report]").click( (e)=> { 
      e.preventDefault();
      new DebugDetails().render(true)
    });
    
});

class DebugDetails extends SupportDetails {

  /** @inheritdoc */
 static get defaultOptions() {
   const options = super.defaultOptions;
   options.title = "SUPPORT.Title";
   options.id = "support-details";
   options.template = "modules/debug-report/support-details.html";
   options.width = 620;
   options.height = "auto";
   return options;
 }


  async ImageLoad(str) {
    const img = new Image();
    let img_data = {}
    img.onload =  function() {
      img_data.x_dim = String(this.width);
      img_data.y_dim  = this.height
    }
    img.src = str;
    return img_data;
  }

  static async loadImage (src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    })  ;
  };

  async getData(options = {}) {
    let data = super.getData(options);

    // Build report data
    data.debugreport = await DebugDetails.generateDebugReport();
    return data;
  }

  static async generateDebugReport() {
    let report = {};
    function formatBytes(a,b=2){if(0===a)return"0 Bytes";const c=0>b?0:b,d=Math.floor(Math.log(a)/Math.log(1024));return parseFloat((a/Math.pow(1024,d)).toFixed(c))+" "+["Bytes","KB","MB","GB","TB","PB","EB","ZB","YB"][d]}
    let output = '';
    // Foundry Details   
    
    //Data Sizes
    report.Data_Sizes = {
    Actors: formatBytes(JSON.stringify(game.actors).length),
    Items: formatBytes(JSON.stringify(game.items).length) ,
    Scenes: formatBytes(JSON.stringify(game.scenes).length) ,
    Journals: formatBytes(JSON.stringify(game.journal).length),
    Tables: formatBytes(JSON.stringify(game.tables).length),
    Chat: formatBytes(JSON.stringify(game.messages).length),
    Macros: formatBytes(JSON.stringify(game.macros).length),
    };

    
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
        report.Active_Modules[m.id] = `${m.title} v${m.version}`;
      } 
    });
    

    // Compendium Document Count 
    let cd_count = 0;
    for (let pack of game.packs) {
      let c = pack.index.size;
      cd_count += c;
    }
    report.compendiaCount = cd_count;

    //background image size
    function getImageSizeInBytes(imgURL) {
      var request = new XMLHttpRequest();
      request.open("HEAD", imgURL, false);
      request.send(null);
      var headerText = request.getAllResponseHeaders();
      var re = /Content\-Length\s*:\s*(\d+)/i;
      re.exec(headerText);
      return parseInt(RegExp.$1);
    }

    report.background = {};


    const imgSrc = game.scenes.active.background.src;
    report.background.x_dim = 0;
    report.background.y_dim = 0;
    report.background.size = 0
    if (imgSrc) {
      const imgUrl = imgSrc.startsWith('http') ? imgSrc : `/${imgSrc}`;
      let imgdata = await DebugDetails.loadImage(imgUrl);
      report.background.x_dim = imgdata.width;
      report.background.y_dim  = imgdata.height;
      report.background.size = formatBytes(getImageSizeInBytes(imgUrl));
    }

    //let imgdata = await DebugDetails.loadImage('/' + game.scenes.active.background.src)

    // Compression Data by M.A.  https://gitlab.com/mkahvi/foundry-macros/-/blob/master/Agnostic/info/Compendium%20Savings.js
    const countTrueSize = (arr, { skipPlayerOwned, skipPlayerVisible } = {}) => arr
      .reduce((t, doc) => t + JSON.stringify(doc.toObject()).length, 0);

    const countIndexSize = (arr) => arr.reduce((t, doc) => {
      const { _id, name, type, img } = doc.toObject();
      return t + JSON.stringify({ _id, name, type, img }).length;
    }, 0);

    const maxPrecision = (num, decimalPlaces = 0, type = 'round') => {
      const p = Math.pow(10, decimalPlaces || 0),
        n = num * p * (1 + Number.EPSILON);
      return Math[type](n) / p;
    }

    const makeCategory = (list) => {
      const count = Array.from(list).length;
      return {
        count,
        unpacked: maxPrecision(countTrueSize(list) / 1000, 2),
        packed: maxPrecision(countIndexSize(list) / 1000, 2),
        get ratio() {
          return this.packed / this.unpacked;
        },
        get savings() {
          return maxPrecision(1 - this.ratio, 3) * 100;
        }
      };
    }

    report.compressData = {
      items: makeCategory(game.items),
      actors: makeCategory(game.actors),
      tables: makeCategory(game.tables),
      macros: makeCategory(game.macros),
    };

    
    return report;

  }


}