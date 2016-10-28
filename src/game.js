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
