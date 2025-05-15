const { SlippiGame } = require("@slippi/slippi-js");
const CharacterEnum = require('./CharacterEnum');
const StageEnum = require('./StageEnum');

module.exports = function(file, playerCode) {
    //console.log(file);
    const ret = [];
    const game = new SlippiGame(file.path);
    const settings = game.getSettings();
    const metadata = game.getMetadata();
    const stats = game.getStats();
    const winners = game.getWinners();
    //const playerCode = playerCode;

    if (invalidMetadata(metadata)/* || invalidStats(stats)*/){return;}

    const {port, oPort} = getPort(metadata.players, playerCode);

    ret.push(metadata.startAt);//DATETIME
    ret.push(metadata.players[oPort].names.netplay, metadata.players[oPort].names.code);//OPP_NAME AND OPP_TAG
    ret.push(CharacterEnum[settings.players[port].characterId], CharacterEnum[settings.players[oPort].characterId]);//CHARACTER AND OPP_CHARACTER
    ret.push(StageEnum[settings.stageId]);//STAGE
    totalSeconds = stats.playableFrameCount / 60;
    minutes = Math.floor(totalSeconds / 60);
    seconds = Math.floor(totalSeconds % 60);
    hundredths = Math.round((totalSeconds % 1) * 100);
    ret.push(`${minutes}:${seconds.toString().padStart(2, '0')}.${hundredths.toString().padStart(2, '0')}`)//GAME_DURATION
    ret.push(getResult(winners,port))//RESULT
    return ret;
}

function getPort(players, playerCode){
    if(players[0].names.code == playerCode){
        return {port: 0, oPort: 1};
    }else if(players[1].names.code == playerCode){
        return {port: 1, oPort: 0};
    }
    else{return {port: null, oPort: null};}
}

function getResult(winners,port){
    if(winners[0].playerIndex==port){return "WIN";}
    else{return "LOSS";}
}

const invalidMetadata = metadata => {
    if (!metadata || !metadata.lastFrame) return true;
    if (metadata.lastFrame < 60*40) return true;
    if (Object.keys(metadata.players).length !== 2) return true;
    if (!metadata.players[0]?.names?.netplay) return true;
    if (!metadata.players[0]?.names?.code)    return true;
    if (!metadata.players[1]?.names?.netplay) return true;
    if (!metadata.players[1]?.names?.code)    return true;
    const char_p0 = Object.keys(metadata.players[0].characters)[0];
    if (char_p0 > 26) return true;
    const char_p1 = Object.keys(metadata.players[1].characters)[0];
    if (char_p1 > 26) return true;
    return false;
};

/*const invalidStats = ({settings, stocks, inputs}) => {
    const VALID_STAGE_IDs = [2, 3, 8, 28, 31, 32];
    const settings = stats.getSettings();
  if (settings.is_teams) return true;
  if (!VALID_STAGE_IDs.includes(settings.stageId)) return true;
  if (![2, 8].includes(settings.gameMode)) return true;

  // Check if both players had 2+ stocks at the end
  const p0_deaths = stocks.filter(s => s.playerIndex === 0 && s.endFrame).length;
  const p1_deaths = stocks.filter(s => s.playerIndex === 1 && s.endFrame).length;
  if (p0_deaths <= 2 && p1_deaths <= 2) return true;

  // Check if when quitting out, both players where grounded
  const player_0_airborne = inputs[0].airborne;
  const player_1_airborne = inputs[1].airborne;
  if (!player_0_airborne && !player_1_airborne) return true;

  return false;
};*/