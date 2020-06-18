/**
 * This class is the center for generating dice pools either by manually combining
 * attributes and abilities, by reusing already rolled tests or by creating a macro out
 * of an existing dice pool
 */

class DicePoolVTM20 {
  // static selectCombination() {
  //     renderTemplate("systems/foundryvtt-vtm-20th/templates/chat/select.html", {}).then(content => {
  //         // let chatData = WFRP_Utility.chatDataSetup(html)
  //         ChatMessage.create({
  //             user: ChatMessage.getSpeaker(),
  //             content: content,
  //             rollMode: "selfroll"
  //         });
  //     });
  // }
  static rollTest(testData = {}, onlyAttribute = false) {
    const { attribute = game.i18n.localize("CHAR.STRENGTH") } = testData;
    const { ability = game.i18n.localize("TALENTS.ATHLETICS") } = testData;
    const { actor = game.user.character } = testData;
    const difficulty = 6;
    const modifier = 0;

    const nan = { value: 0 };
    const attributeDice = actor.getAttribute(attribute) || nan;
    const abilityDice = actor.getAbility(ability) || nan;

    const diceCount = onlyAttribute ?
      parseInt(attributeDice.value) + modifier :
      parseInt(attributeDice.value) + parseInt(abilityDice.value) + modifier;

    const formula = `${diceCount}d10`;
    const roll = new Roll(formula).roll();
    const dice = roll.parts[0].rolls;

    const fails = dice.filter((d) => d.roll === 1).length;
    const wins = dice.filter((d) => d.roll >= difficulty).length;
    const isCritFail = wins === 0 && fails > 0;
    const degrees = wins - fails;

    let message = `${actor.name} erzielt einen`;
    let result;
    if (isCritFail) {
      message = `${actor.name} legt einen <b>sauberen Patzer</b> hin!`;
      result = "Sauberer Patzer";
    } else if (degrees <= 0) {
      message = `${actor.name} <b>scheitert</b> bei dem Versuch`;
      result = "Gescheitert";
    } else {
      switch (degrees) {
        case 1:
          result = "knappen Erfolg";
          break;
        case 2:
          result = "bescheidenen Erfolg";
          break;
        case 3:
          result = "vollen Erfolg";
          break;
        case 4:
          result = "außergewöhnlichen Erfolg";
          break;
        default:
          result = "phänomenalen Erfolg";
          break;
      }
    }

    // Render the roll for the results button that Foundry provides.
    const chatData = {
      user: game.user._id,
      speaker: ChatMessage.getSpeaker({ actor }),
      content: `<p>${message}</p>`,
      rollMode: "selfroll",
      details: message,
      roll,
    };
    let template = 'systems/foundryvtt-vtm-20th/templates/chat/roll.html';
    let templateData = {
      title: onlyAttribute ? attribute : `${attribute} & ${ability}`,
      message,
      rolls: roll.parts[0].rolls,
      formula,
      difficulty,
      result,
      degrees
    };
    
    // Handle roll visibility. Blind doesn't work, you'll need a render hook to hide it.
    let rollMode = game.settings.get("core", "rollMode");
    if (["gmroll", "blindroll"].includes(rollMode))
      chatData["whisper"] = ChatMessage.getWhisperRecipients("GM");
    if (rollMode === "selfroll") chatData["whisper"] = [game.user._id];
    if (rollMode === "blindroll") chatData["blind"] = true;
    console.log(roll);
    roll.render().then((r) => {
      templateData.roll = r;
      chatData.roll = JSON.stringify(r);

      // Render our roll chat card
      renderTemplate(template, templateData).then(content => {
        chatData.content = content;
        // Hook into Dice So Nice!
        if (game.dice3d) {
          game.dice3d
            .showForRoll(roll, chatData.whisper, chatData.blind)
            .then((displayed) => {
              console.log(chatData);
              ChatMessage.create(chatData);
            });
        }
        // Roll normally, add a dice sound.
        else {
          chatData.sound = CONFIG.sounds.dice;
          ChatMessage.create(chatData);
        }
      });
    });
  }

  static prepareTest(testData = {}, onlyAttribute = false) {
    DicePoolVTM20.rollTest(testData, onlyAttribute);
  }
}
