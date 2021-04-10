
  // updates message for all players to your current content.
  // subElement: JQuery Element required. Needs to be child of the message (e.g. a button or any div)

function initializeMessage(html, messageId) {

  const radioTargets = $(html).find('.radio');

  for (const radio of radioTargets.toArray()) {
    const radioTarget = $(radio);
    const targetLabel = radioTarget.parent().find(`label[for=${radioTarget.attr("id")}]`);
    const newRadioId = `${messageId}_${radioTarget.attr("id")}`;
    radioTarget.attr("id", newRadioId);
    targetLabel.attr("for", newRadioId);
    const newRadioName = `${messageId}_${radioTarget.attr("name")}`;
    radioTarget.attr("name", newRadioName);
  }

  const target = $(html).find(".input-dice-modifier .range-bar");
  target.attr("value", "0");
  const target2 = $(html).find(".input-dice-modifier .range-value");
  target2.text("0");

  // difficulty range
  const target3 = $(html).find(".input-roll-difficulty .range-bar");
  target3.attr("value", "11");
  const target4 = $(html).find(".input-roll-difficulty .range-value");
  target4.text("6");

  // toggle parts
  const attack = html.find(".attack-options");
  attack.hide();
  const versus = html.find(".versus-options");
  versus.hide();


}

Hooks.on('renderChatMessage', (message, messageParent, data) => {
  console.log("render chat message")

  const hiddenDataNode = $(messageParent).find(".hidden-data");
  const initialized = hiddenDataNode.attr("data-initialized");
  
  if (initialized !== "true") {
    initializeMessage(messageParent, message.data._id);
    
    hiddenDataNode.attr("data-initialized", true);
//    const newData = { ...message.data, initialized: true };
    //setTimeout(() => ChatMessage.update([{ _id: message.data._id, initialized: true }]), 0);
  }
  // difficulty range

  const target = $(messageParent).find(".input-dice-modifier");
  const rangeLabel = target.find("p");
  const rangeInput = target.find("input");
  rangeInput.attr("min", "0");
  rangeInput.attr("max", "10");
  // fix value because min was reset to 0 during templating and possible negative values
  const value = parseInt(rangeLabel.text()) + 5;
  rangeInput.attr("value", value);

  
  const target2 = $(messageParent).find(".input-roll-difficulty");
  const rangeLabel2 = target2.find("p");
  const rangeInput2 = target2.find("input");
  rangeInput2.attr("min", "5");
  rangeInput2.attr("max", "15");
  // fix value because min was reset to 0 during templating and possible negative values
  const value2 = parseInt(rangeLabel2.text()) + 5;
  rangeInput2.attr("value", value2);

  const rolled = hiddenDataNode.attr("data-rolled");
  if (rolled !== "true") {
    const results = $(messageParent).find(".results");
    results.hide();
  }

  const show = hiddenDataNode.attr("data-show-additional");
  const additionalOptions = $(messageParent).find(".additional-settings");
  show === "true" ? additionalOptions.show() : additionalOptions.hide();

  return messageParent;

});

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

  // Define default values for options, needed in template
  static getRenderData(customData) {
    const defaultData = {
      // vampire roll specific data
      title: "",
      actor: null,
      showAttackOptions: false,
      showCommonOptions: true,
      showAdditionalOptions: false,
      message: "",
      roll: null,
      result: null,
      // common chatmessage settings
      user: game.user.id,// game.user.id,
      speaker: ChatMessage.getSpeaker({ actor }),//ChatMessage.getSpeaker({ actor }),
      rollMode: game.settings.get("core", "rollMode") || "roll",
      content: `<p>${message}</p>`,
    }

    return { ...defaultData, ...customData };
  }


  /**
   * Activate event listeners using the chat log html.
   * @param html {HTML}  Chat log html
   */
  static async chatListeners(html) {

    // toggle parts of the message dependend on the chosen roll mode ("common" || "attack" || "targeted")
    html.on("change", ".roll-mode input", event => {
      const target = $(event.currentTarget);
      const mode = target.attr("value");
      console.log(mode);

      const chatMessage = target.parents(".chat-message");
      const dataNode = chatMessage.find(".hidden-data");
      const creatorID = dataNode.attr("data-creator-id");
      // dont allow changes if not owner
      //if (creatorID !== game.user.id) return; // TODO de-commentify
      
      const common = chatMessage.find(".common-options");
      const attack = chatMessage.find(".attack-options");
      const versus = chatMessage.find(".versus-options");

      switch (mode) {
        case "common":
          common.show();
          attack.hide();
          versus.hide();
          break;
        case "attack":
          common.show();
          attack.show();
          versus.hide();
          break;
        case "versus":
          common.show();
          attack.hide();
          versus.show();
          break;
        default:
          break;
      }
    });
    html.on("click", ".additional-settings-switch", event => {
      const target = $(event.currentTarget);
      const message = target.parents(".chat-message");
      const value = target.find("input")[0].checked;
      const dataNode = message.find(".hidden-data");
      dataNode.attr("data-show-additional", value);
      
    })


    // general update methods
    
    html.on("change", ".synchronize-radio-state input", event => {
      const target = $(event.currentTarget);
      target.siblings().each(function () {
        $(this).removeAttr("checked");
      });
      target.attr("checked", "checked");
    });
    
    // default checkbox data synchronization
    html.on("change", ".synchronize-checkbox-state", event => {
      const value = event.currentTarget.checked;
      const target = $(event.currentTarget);
      target.attr("checked", value); // setter
    });
    // custom switch data synchronization
    html.on("change", ".synchronize-switch-state", event => {
      const target = $(event.currentTarget).find("input:checkbox");
      const value = target[0].checked;
      target.attr("checked", value);
    });



    html.on("input", ".synchronize-range", event => {
      const target = $(event.currentTarget);
      const rangeLabel = target.find("p");
      const rangeInput = target.find("input");
      const value = rangeInput[0].value - 5;
      rangeInput.attr("value", value);
      rangeLabel.text(value);
    });
    html.on("change", ".synchronize-range", event => {
      setTimeout(() => this.updateMessage($(event.currentTarget)), 0);
    });

    html.on("click", ".should-update-on-click", event => {
      setTimeout(() => this.updateMessage($(event.currentTarget)), 0);
    });
    html.on("change", ".should-update-on-change", event => {
      setTimeout(() => this.updateMessage($(event.currentTarget)), 0);
    });
  }


  static updateMessage(subElement) {
    console.warn("updateMessage");
    const messageMainElement = subElement.parents(".chat-message");
    const messageId = messageMainElement.attr("data-message-id");
    const content = messageMainElement.find(".message-content").children()[0].outerHTML;
    const oldMessage = game.messages.get(messageId);
    oldMessage.update({ content });
    return messageMainElement;
  }

  static renderTest(testData = {}) {

    // Define default values for options, needed in template
    //const chatData = getRenderData();
    const {
      message,
      roll,
      result,
      actor,
    } = testData;
    const template = 'systems/foundryvtt-vtm-20th/templates/chat/roll.html';
    const rollMode = game.settings.get("core", "rollMode") || "roll";

    const chatData = {
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor }),
      content: `<p>${message}</p>`,
      rollMode: rollMode,
      details: message,
      roll,
      result,
    };
    // const attributeLabel = game.i18n.localize(attributeDice.label);
    // const abilityLabel = game.i18n.localize(abilityDice.label);
    // const difficultyLabel = game.i18n.localize(`DIFFICULTY.${difficulty}`);
    // const difficultyMessage = `${game.i18n.localize("DIFFICULTY.WAS")} ${difficultyLabel}`;

    // const poolConfig = onlyAttribute ? attributeLabel : `${attributeLabel} & ${abilityLabel}`
    const templateData = chatData;
    templateData.rolls = roll.dice[0].results;
    console.log(roll);
    
    // Handle roll visibility. Blind doesn't work, you'll need a render hook to hide it.
    if (["gmroll", "blindroll"].includes(rollMode))
      chatData["whisper"] = ChatMessage.getWhisperRecipients("GM");
    if (rollMode === "selfroll") chatData["whisper"] = [game.user.id];
    if (rollMode === "blindroll") chatData["blind"] = true;

    roll.render().then((r) => {
      console.log(roll);
      chatData.roll = JSON.stringify(r);

      //const templateData = this.getRenderData({ rolls: roll.dice[0].results });

      // Render our roll chat card
      templateData.messageID = randomID(32);
      renderTemplate(template, templateData).then(content => {
        chatData.content = content;
        // Hook into Dice So Nice!
        if (game.dice3d) {
          game.dice3d
            .showForRoll(roll, game.user, true, chatData.whisper, chatData.blind)
            .then((displayed) => {
              ChatMessage.create(chatData).then((message));
            });
        }
        // Roll normally, add a dice sound.
        else {
          //chatData.sound = CONFIG.sounds.dice;
          ChatMessage.create(chatData).then((message));
        }

      });
    });
  }

  // take prepared dice and roll them
  static rollTest(testData = {}) {
    const {
      items = [],
      actor = game.user.character,
      difficulty = 6,
      title = "",
      modifier = 0,
    } = testData;
    
   
    const numberOfDice = items.map(item => item.value).reduce((p, c) => p+c, 0);
    const finalDice = Math.max(numberOfDice + modifier, 0);
    const formula = `${finalDice}d10`;
    const roll = new Roll(formula).roll();
    const dice = roll.dice[0].results;

    const critFails = dice.filter((d) => d.result === 1).length;
    const wins = dice.filter((d) => d.result >= difficulty).length;
    const isCritFail = wins === 0 && critFails > 0;
    const degrees = wins - critFails;
    

    let message = `${actor.name} ${game.i18n.localize("DEGREES.GET")} `;
    let result;
    if (isCritFail) {
      message = `${actor.name} ${game.i18n.localize("DEGREES.GETBOTCH")}`;
      result = game.i18n.localize("DEGREES.BOTCH");
    } else if (degrees <= 0) {
      message = `${actor.name} ${game.i18n.localize("DEGREES.GETFAILURE")}`;
      result = game.i18n.localize("DEGREES.FAILURE");
    } else {
      const successes = game.i18n.localize("DEGREES.SUCCESS");
      const localizeDegree = degrees > 5 ? 5 : degrees;
      const degreeLabel = game.i18n.localize(`DEGREES.${localizeDegree}`);
      result = `${localizeDegree} ${successes}`;
    }

    // Render the roll for the results button that Foundry provides.
    this.renderTest({ ...testData, message, result, degrees, roll });
  }


  static prepareTest(testData = { title: "let roll some dice"}) {
    console.log({testData})
    DicePoolVTM20.rollTest(testData);
  }
}
