
  // updates message for all players to your current content.
  // subElement: JQuery Element required. Needs to be child of the message (e.g. a button or any div)

function updateDiceCount(subElement){
  const rollData = getRollDataFromHtml(subElement);
  subElement.parents(".message-content").find(".dice-count-value").text(rollData.dicepool + rollData.diceModifier);
}
// extract actual roll data from html chat message element
function getRollDataFromHtml(subElement) {
  const chatMessage = subElement.parents(".chat-message");
  const hiddenData = chatMessage.find(".hidden-data");
  console.log({hiddenData});
  const rollData = {
    chatMessageId: chatMessage.attr("data-message-id"),
    actionType: chatMessage.find(".roll-mode input:checked").attr("value"),
    items: chatMessage.find('.attribute-dice-pool').map(function () {
      console.log(this);
      return { id: $(this).attr("data-item-id"), value: parseInt($(this).attr("data-item-value")) }
    }).get(),
    dicepool: null,
    actorId: hiddenData.attr("data-actor-id"),
    userId: hiddenData.attr("data-user-id"),
    diceModifier: parseInt(chatMessage.find(".input-dice-modifier .range-value").text()),
    difficulty: parseInt(chatMessage.find(".input-roll-difficulty .range-value").text()),
  }
  console.log(rollData.items);
  rollData.dicepool = rollData.items.map(item => item.value).reduce((p, c) => p + c, 0);

  console.log(rollData);
  return rollData;
}

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

  updateDiceCount(target);
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

  // Define default values for options, needed in template
  static getRenderData(customData) {
    const defaultData = {
      // vampire roll specific data
      title: "", // can be multiline, should be changable later on
      actionType: "", // possible options:  "common" "attack" "versus"
      items: [], // item-id's from attribute sheets
      difficulty: 6,
      diceModifier: 0,
      ignoreInjuries: false,
      useWillpower: false,
      targetId: "", // token-id of target, if applicable
      weaponUsed: null, // item-id from physical-item sheet
      damageType: "bashing", // "bashing" "deadly" "aggravated"
      strengthItemId: null, // strength Item id IF applicable, otherwise null
      baseDamageDice: 0, // defines bonus damage from weapons. If used weapon is not strength-based, this defines the base damage dice (usually ranged weapons).
      damageDiceModifier: 0, // optional bonus depending on used attack/aimbonuses

      // common chatmessage settings
      actorId: null,
      userId: game.user.id,// game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: customData.actorId }),//ChatMessage.getSpeaker({ actor }),
      rollMode: game.settings.get("core", "rollMode") || "roll",
    }

    return { ...defaultData, ...customData};
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

    // dont allow changes if not owner
    //if (creatorID !== game.user.id) return; // TODO de-commentify
      const chatMessage = target.parents(".chat-message");
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

    // prepare dice formula, roll the dice and show the result
    html.on("click", ".roll-dice-button", event => {
      const target = $(event.currentTarget);
      const chatMessage = target.parents(".chat-message");
      const hiddenData = chatMessage.find(".hidden-data");
      const alreadyRolled = hiddenData.attr("data-rolled");
    
      console.log("roll them dice");
      if (alreadyRolled == "true"){
        console.log("denied! already rolled demn dice!");
        return;
      }
      // read rolldata from html
      const rollData = getRollDataFromHtml(target);
      this.rollTest(rollData, target);
    });

    html.on("click", ".additional-settings-switch", event => {
      const target = $(event.currentTarget);
      const chatMessage = target.parents(".chat-message");
      const hiddenData = chatMessage.find(".hidden-data");
      const alreadyRolled = hiddenData.attr("data-rolled");
      const value = target.find("input")[0].checked;
      const dataNode = chatMessage.find(".hidden-data");
      
      if (alreadyRolled == "true"){
        // if already rolled, always show additional options
        dataNode.attr("data-show-additional", true);
      } else {
        dataNode.attr("data-show-additional", value);
      }
      // setting hider functionality after roll
      if (alreadyRolled == "true"){
        const settingsHider = chatMessage.find(".all-roll-settings");
        if (value){
          settingsHider.show();
        } else {
          settingsHider.hide();
        }
      }
    });

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
      updateDiceCount(target);
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
    // prevent onchange for sliders while scrolling
    html.on("wheel", ".synchronize-range", event => {
      event.stopPropagation();
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



  

  // Renders the chat message in the prepare stage where players can adjust settings, before the actual dice rolled
  static createRollMessage(rollData) {

    // Get default values for options, needed in template
    // example from sheet ( lastRollSettings:{actionType: "attack"})
    const renderData = this.getRenderData(rollData);
    console.log({rollData});
    console.log({renderData})
    

    const chatData = {
      user: renderData.user,
      speaker: renderData.speaker,
      rollMode: renderData.rollMode,
      content: "", // is being created by renderTemplate and filled later
    };
    
    const poolConfig = "Strength + Computers"; // ehemals: const poolConfig = onlyAttribute ? attributeLabel : `${attributeLabel} & ${abilityLabel}`
    const diceNumber = 5; // combined amount of dice
    const templateData = {
      // initial settings
      ...renderData,
      poolConfig, // ehemals: const poolConfig = onlyAttribute ? attributeLabel : `${attributeLabel} & ${abilityLabel}`
      diceNumber, // result
    };
    
    // Handle roll visibility. Blind doesn't work, you'll need a render hook to hide it.
    if (["gmroll", "blindroll"].includes(renderData.rollMode))
      chatData["whisper"] = ChatMessage.getWhisperRecipients("GM");
    if (renderData.rollMode === "selfroll") chatData["whisper"] = [game.user.id];
    if (renderData.rollMode === "blindroll") chatData["blind"] = true;

    console.log(templateData)

    renderTemplate('systems/foundryvtt-vtm-20th/templates/chat/roll.html', templateData).then(content => {
      chatData.content = content;
      ChatMessage.create(chatData);
    });
  }
  
  static rollTest(rollData, subElement) {
    const { actorId, actionType, diceModifier, difficulty, chatMessageId } = rollData;
    const actor = game.actors.get(actorId);
    
    // prepare formula
    const numberOfDice = rollData.dicepool;
    const finalDice = Math.max(numberOfDice + diceModifier, 0);
    const formula = `${finalDice}d10`;
    
    // roll dice
    const roll = new Roll(formula).roll();
    const dice = roll.dice[0].results;

    const critFails = dice.filter((d) => d.result === 1).length;
    const wins = dice.filter((d) => d.result >= difficulty).length;
    const isCritFail = wins === 0 && critFails > 0;
    const degrees = wins - critFails;

    // prepare nice messages
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

    const chatData = game.messages.get(chatMessageId).data;
    console.log(chatData);

    const chatMessage = subElement.parents(".chat-message");
    const resultSection = chatMessage.find(".results");
    // avoid more than one roll
    const hiddenData = chatMessage.find(".hidden-data");
    hiddenData.attr("data-rolled", "true");

    //prepare roll finish function
    const onRollReady = templateData => {
      console.log(templateData);
      renderTemplate('systems/foundryvtt-vtm-20th/templates/chat/roll-result.html', templateData).then(content => {
        console.log(content);
        resultSection.append($.parseHTML(content));
        resultSection.show();
        const settingsHider = chatMessage.find(".all-roll-settings");
        settingsHider.hide();
        setTimeout(() => this.updateMessage($(resultSection)), 0);
      });
    }

    // render the result
    console.log({dice});
    roll.render().then((r) => {
      //chatData.roll = JSON.stringify(r);
      
      // Hook into Dice So Nice!
      if (game.dice3d) {
        game.dice3d
          .showForRoll(roll, game.user, true, chatData.whisper, chatData.blind)
          .then((displayed) => {
            // update chat message in order to toggle result section
            onRollReady({dice: dice.map(d => d.result), degrees})
          });
        }
        // Roll normally, add a dice sound.
        else {
          // update chat message in order to toggle result section
          console.log(roll);
  //        this.updateMessage(subElement)        
        //chatData.sound = CONFIG.sounds.dice;
      }
    });
  }
}
