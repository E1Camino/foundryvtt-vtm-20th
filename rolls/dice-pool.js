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
    const {
      attribute = "strength",
      ability = "athletics",
      actor = game.user.character,
      difficulty = 6,
      title
    } = testData;
    
   
    const modifier = 0;

    const nan = { value: 0 };
    const attributeDice = actor.getAttribute(attribute) || nan;
    const abilityDice = actor.getAbility(ability) || nan;
    const diceCount = onlyAttribute ?
      parseInt(attributeDice.value) + modifier :
      parseInt(attributeDice.value) + parseInt(abilityDice.value) + modifier;

    const formula = `${diceCount}d10`;
    const roll = new Roll(formula).roll();
    const dice = roll.dice[0].results;

    const fails = dice.filter((d) => d.result === 1).length;
    const wins = dice.filter((d) => d.result >= difficulty).length;
    const isCritFail = wins === 0 && fails > 0;
    const degrees = wins - fails;


    let message = `${actor.name} ${game.i18n.localize("DEGREES.GET")} `;
    let result;
    if (isCritFail) {
      message = `${actor.name} ${game.i18n.localize("DEGREES.GETBOTCH")}`;
      result = game.i18n.localize("DEGREES.BOTCH");
    } else if (degrees <= 0) {
      message = `${actor.name} ${game.i18n.localize("DEGREES.GETFAILURE")}`;
      result = game.i18n.localize("DEGREES.FAILURE");
    } else {
      const success = game.i18n.localize("DEGREES.SUCCESS");
      const localizeDegree = degrees > 5 ? 5 : degrees;
      const degreeLabel = game.i18n.localize(`DEGREES.${localizeDegree}`);
      result = `${degreeLabel} ${success}`;
    }

    // Render the roll for the results button that Foundry provides.
    let rollMode = game.settings.get("core", "rollMode") || "roll";
    const chatData = {
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor }),
      content: `<p>${message}</p>`,
      rollMode: rollMode,
      details: message,
      roll,
    };
    let template = 'systems/foundryvtt-vtm-20th/templates/chat/roll.html';
    const attributeLabel = game.i18n.localize(attributeDice.label);
    const abilityLabel = game.i18n.localize(abilityDice.label);
    const difficultyLabel = game.i18n.localize(`DIFFICULTY.${difficulty}`);
    const difficultyMessage = `${game.i18n.localize("DIFFICULTY.WAS")} ${difficultyLabel}`;

    const poolConfig = onlyAttribute ? attributeLabel : `${attributeLabel} & ${abilityLabel}`
    let templateData = {
      title: title ? title : poolConfig,
      message,
      rolls: roll.dice[0].results,
      formula,
      difficulty,
      difficultyMessage,
      result,
      degrees,
      poolConfig: title ? poolConfig : ""
    };
    
    // Handle roll visibility. Blind doesn't work, you'll need a render hook to hide it.
    if (["gmroll", "blindroll"].includes(rollMode))
      chatData["whisper"] = ChatMessage.getWhisperRecipients("GM");
    if (rollMode === "selfroll") chatData["whisper"] = [game.user.id];
    if (rollMode === "blindroll") chatData["blind"] = true;

    roll.render().then((r) => {
      templateData.roll = r;
      chatData.roll = JSON.stringify(r);

      // Render our roll chat card
      renderTemplate(template, templateData).then(content => {
        chatData.content = content;
        // Hook into Dice So Nice!
        if (game.dice3d) {
          game.dice3d
            .showForRoll(roll, game.user, true, chatData.whisper, chatData.blind)
            .then((displayed) => {
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
    console.log({testData})
    DicePoolVTM20.rollTest(testData, onlyAttribute);
  }
}
