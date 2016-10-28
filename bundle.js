(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var tilemap = require('./tilemap.js');
var tilemapData = require('../tilemaps/example_tilemap.json');

// Wait for the window to load completely
window.onload = function() {

  // Set up the screen canvas
  var screen = document.createElement("canvas");
  screen.width = 640;
  screen.height = 640;
  screenCtx = screen.getContext("2d");
  document.getElementById("game-screen-container").appendChild(screen);

  // Load the tilemap
  tilemap.load(tilemapData, {
    onload: function() {
      tilemap.render(screenCtx);
      renderPlayer();
    }
  });

  // Create the player
  var player = {x: 1, y: 2}

  // helper function to draw player
  function renderPlayer() {
    screenCtx.beginPath();
    screenCtx.arc(player.x * 64 + 32, player.y * 64 + 32, 30, 0, Math.PI * 2);
    screenCtx.fill();
  }

  // Helper function to check for non-existent or solid tiles
  function isPassible(x, y) {
    var data = tilemap.tileAt(x, y, 0);
    // if the tile is out-of-bounds for the tilemap, then
    // data will be undefined, a "falsy" value, and the
    // && operator will shortcut to false.
    // Otherwise, it is truthy, so the solid property
    // of the tile will determine the result
    return data && !data.solid
  }

  // Event handler for key events
  window.onkeydown = function(event) {
    switch(event.keyCode) {
      case 37: // left
        if(isPassible(player.x - 1, player.y))
          player.x -= 1;
        event.preventDefault();
        break;
      case 38: // up
        if(isPassible(player.x, player.y - 1))
          player.y -= 1;
        event.preventDefault();
        break;
      case 39: // right
        if(isPassible(player.x + 1, player.y))
          player.x += 1;
        event.preventDefault();
        break;
      case 40: // down
        if(isPassible(player.x, player.y + 1))
          player.y += 1;
        event.preventDefault();
        break;
    }
    // Redraw the map & player
    tilemap.render(screenCtx);
    screenCtx.beginPath();
    screenCtx.arc(player.x * 64 + 32, player.y * 64 + 32, 30, 0, Math.PI * 2);
    screenCtx.fill();
  }

};

},{"../tilemaps/example_tilemap.json":3,"./tilemap.js":2}],2:[function(require,module,exports){
// Tilemap engine defined using the Module pattern
module.exports = (function (){
  var tiles = [],
      tilesets = [],
      layers = [],
      tileWidth = 0,
      tileHeight = 0,
      mapWidth = 0,
      mapHeight = 0;
      
  var load = function(mapData, options) {
      
    var loading = 0;
    
    // Release old tiles & tilesets
    tiles = [];
    tilesets = [];
    
    // Resize the map
    tileWidth = mapData.tilewidth;
    tileHeight = mapData.tileheight;
    mapWidth = mapData.width;
    mapHeight = mapData.height;
    
    // Load the tileset(s)
    mapData.tilesets.forEach( function(tilesetmapData, index) {
      // Load the tileset image
      var tileset = new Image();
      loading++;
      tileset.onload = function() {
        loading--;
        if(loading == 0 && options.onload) options.onload();
      }
      tileset.src = tilesetmapData.image;
      tilesets.push(tileset);
      
      // Create the tileset's tiles
      var colCount = Math.floor(tilesetmapData.imagewidth / tileWidth),
          rowCount = Math.floor(tilesetmapData.imageheight / tileHeight),
          tileCount = colCount * rowCount;
      
      for(i = 0; i < tileCount; i++) {
        var tile = {
          // Reference to the image, shared amongst all tiles in the tileset
          image: tileset,
          // Source x position.  i % colCount == col number (as we remove full rows)
          sx: (i % colCount) * tileWidth,
          // Source y position. i / colWidth (integer division) == row number 
          sy: Math.floor(i / rowCount) * tileHeight,
          // Indicates a solid tile (i.e. solid property is true).  As properties
          // can be left blank, we need to make sure the property exists. 
          // We'll assume any tiles missing the solid property are *not* solid
          solid: (tilesetmapData.tileproperties[i] && tilesetmapData.tileproperties[i].solid == "true") ? true : false
        }
        tiles.push(tile);
      }
    });
    
    // Parse the layers in the map
    mapData.layers.forEach( function(layerData) {
      
      // Tile layers need to be stored in the engine for later
      // rendering
      if(layerData.type == "tilelayer") {
        // Create a layer object to represent this tile layer
        var layer = {
          name: layerData.name,
          width: layerData.width,
          height: layerData.height,
          visible: layerData.visible
        }
      
        // Set up the layer's data array.  We'll try to optimize
        // by keeping the index data type as small as possible
        if(tiles.length < Math.pow(2,8))
          layer.data = new Uint8Array(layerData.data);
        else if (tiles.length < Math.Pow(2, 16))
          layer.data = new Uint16Array(layerData.data);
        else 
          layer.data = new Uint32Array(layerData.data);
      
        // save the tile layer
        layers.push(layer);
      }
    });
  }

  var render = function(screenCtx) {
    // Render tilemap layers - note this assumes
    // layers are sorted back-to-front so foreground
    // layers obscure background ones.
    // see http://en.wikipedia.org/wiki/Painter%27s_algorithm
    layers.forEach(function(layer){
      
      // Only draw layers that are currently visible
      if(layer.visible) { 
        for(y = 0; y < layer.height; y++) {
          for(x = 0; x < layer.width; x++) {
            var tileId = layer.data[x + layer.width * y];
            
            // tiles with an id of 0 don't exist
            if(tileId != 0) {
              var tile = tiles[tileId - 1];
              if(tile.image) { // Make sure the image has loaded
                screenCtx.drawImage(
                  tile.image,     // The image to draw 
                  tile.sx, tile.sy, tileWidth, tileHeight, // The portion of image to draw
                  x*tileWidth, y*tileHeight, tileWidth, tileHeight // Where to draw the image on-screen
                );
              }
            }
            
          }
        }
      }
      
    });
  }
  
  var tileAt = function(x, y, layer) {
    // sanity check
    if(layer < 0 || x < 0 || y < 0 || layer >= layers.length || x > mapWidth || y > mapHeight) 
      return undefined;  
    return tiles[layers[layer].data[x + y*mapWidth] - 1];
  }
  
  // Expose the module's public API
  return {
    load: load,
    render: render,
    tileAt: tileAt
  }
  
  
})();
},{}],3:[function(require,module,exports){
module.exports={ "height":10,
 "layers":[
        {
         "data":[3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 2, 2, 2, 2, 2, 2, 3, 3, 2, 4, 4, 1, 4, 2, 2, 2, 3, 3, 2, 2, 2, 2, 4, 4, 4, 2, 3, 3, 2, 2, 2, 2, 2, 2, 1, 2, 3, 3, 3, 1, 3, 2, 2, 2, 4, 4, 3, 3, 2, 2, 3, 2, 3, 2, 2, 4, 4, 3, 2, 2, 3, 2, 3, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
         "height":10,
         "name":"Tile Layer 1",
         "opacity":1,
         "type":"tilelayer",
         "visible":true,
         "width":10,
         "x":0,
         "y":0
        }],
 "orientation":"orthogonal",
 "properties":
    {

    },
 "renderorder":"right-down",
 "tileheight":64,
 "tilesets":[
        {
         "firstgid":1,
         "image":".\/tilesets\/example.png",
         "imageheight":130,
         "imagewidth":128,
         "margin":0,
         "name":"example",
         "properties":
            {

            },
         "spacing":0,
         "tileheight":64,
         "tileproperties":
            {
             "2":
                {
                 "solid":"true"
                }
            },
         "tilewidth":64
        }],
 "tilewidth":64,
 "version":1,
 "width":10
}

},{}]},{},[1]);
