/*const { SlippiGame } = require("@slippi/slippi-js");

module.exports = function(files) {
  const tagCounts = {};

  for (const file of files) {
    const game = new SlippiGame(file.path); // Important: use file.path
    const metadata = game.getMetadata();

    if (!metadata || !metadata.players) continue;

    const players = Object.values(metadata.players);

    for (const player of players) {
      const tag = player.names?.code;
      if (tag) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }
  }

  // Find the most common tag
  let mostCommonTag = null;
  let maxCount = 0;

  for (const tag in tagCounts) {
    if (tagCounts[tag] > maxCount) {
      mostCommonTag = tag;
      maxCount = tagCounts[tag];
    }
  }

  return mostCommonTag;
};*/

const { SlippiGame } = require("@slippi/slippi-js");

module.exports = function(files) {
  const tagCounts = {};
  let mostCommonTag = null;
  let maxCount = 0;

  for (let i = 0; i < files.length; i++) {
    const game = new SlippiGame(files[i].path);
    const metadata = game.getMetadata();

    if (!metadata || !metadata.players) continue;

    const players = Object.values(metadata.players);

    for (const player of players) {
      const tag = player.names?.code;
      if (!tag) continue;

      tagCounts[tag] = (tagCounts[tag] || 0) + 1;

      if (tagCounts[tag] > maxCount) {
        mostCommonTag = tag;
        maxCount = tagCounts[tag];
      }
    }

    // Optimization: if the top tag has more than half of total seen so far, it's unbeatable
    const totalCounts = Object.values(tagCounts).reduce((a, b) => a + b, 0);
    if (maxCount > totalCounts / 2) {
      break;
    }
  }

  return mostCommonTag;
};
