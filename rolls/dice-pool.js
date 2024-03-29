
  // updates message for all players to your current content.
  // subElement: JQuery Element required. Needs to be child of the message (e.g. a button or any div)

function updateDiceCount(subElement){
  const rollData = getRollDataFromHtml(subElement);
  console.log(rollData);
  
  // blood dice can only bas as many as the dice pool allows - any dice leftover in the pool are normal dice
  var fullDicePool = rollData.dicepool + rollData.diceModifier;
  fullDicePool = Math.max(fullDicePool, 0);
  let bloodDice = rollData.bloodDice;
  bloodDice = Math.max(bloodDice, 0);
  bloodDice = Math.min(bloodDice, fullDicePool);
  let commonDice = fullDicePool;
  commonDice -= rollData.bloodDice;

  // clear old list
  const message = subElement.parents(".message-content").find(".dice-count-value");
  message.children().remove();
  console.log(bloodDice, commonDice);
  // create red dice for hunger
  for (i = 0; i < bloodDice; i++) {
    message.append('<i class="fa fa-dice-d20 active-blood-dice"></i>');
  }
  
  // create normal dice for the remaining ones
  for (i = 0; i < commonDice; i++) {
    message.append('<i class="fa fa-dice-d20 common-dice"></i>');
  }
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
      return { id: $(this).attr("data-item-id"), value: parseInt($(this).attr("data-item-value")) }
    }).get(),
    dicepool: null,
    actorId: hiddenData.attr("data-actor-id"),
    userId: hiddenData.attr("data-user-id"),
    diceModifier: parseInt(chatMessage.find(".input-dice-modifier .range-value").text()),
    difficulty: parseInt(chatMessage.find(".input-roll-difficulty .range-value").text()),
    bloodDice: parseInt(hiddenData.attr("data-blood-dice")),
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
  target4.text("3");

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
      difficulty: 3,
      diceModifier: 0,
      ignoreInjuries: false,
      useWillpower: false,
      targetId: "", // token-id of target, if applicable
      weaponUsed: null, // item-id from physical-item sheet
      damageType: "bashing", // "bashing" "deadly" "aggravated"
      strengthItemId: null, // strength Item id IF applicable, otherwise null
      baseDamageDice: 0, // defines bonus damage from weapons. If used weapon is not strength-based, this defines the base damage dice (usually ranged weapons).
      damageDiceModifier: 0, // optional bonus depending on used attack/aimbonuses
      bloodDice: customData.bloodDice, // amount of dice that are replaced with blood-dice

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

    renderTemplate('systems/foundryvtt-vtm-20th/templates/chat/roll.html', templateData).then(content => {
      chatData.content = content;
      ChatMessage.create(chatData);
    });
  }
  
  static rollTest(rollData, subElement) {
    const { actorId, diceModifier, difficulty, chatMessageId } = rollData;
    const actor = game.actors.get(actorId);

    // prepare formula

    // blood dice can only bas as many as the dice pool allows - any dice leftover in the pool are normal dice
    var fullDicePool = rollData.dicepool + diceModifier;
    fullDicePool = Math.max(fullDicePool, 0);
    var bloodDice = rollData.bloodDice;
    bloodDice = Math.max(bloodDice, 0);
    bloodDice = Math.min(bloodDice, fullDicePool);
    var commonDice = fullDicePool;
    commonDice -= rollData.bloodDice;

    //const finalCommonDice = 
    const successValue = 6;
    const formulaBlood = `${bloodDice}dh10>${successValue}`;
    const formulaCommon = `${commonDice}dn10>${successValue}`;
    
    // roll dice
    const rollBlood = new Roll(formulaBlood).roll();
    const rollCommon = new Roll(formulaCommon).roll();
    // also sort so we have all successes at first and failures at last
    const diceBlood = rollBlood.dice[0].results.sort((a, b) => b.result - a.result);
    const diceCommon = rollCommon.dice[0].results.sort((a, b) => b.result - a.result);

    let diceBloodCrits = diceBlood.filter((d) => d.result == 10);
    let diceNormCrits = diceCommon.filter((d) => d.result == 10);
    let diceBloodSuccesses = diceBlood.filter((d) => d.result >= successValue && d.result != 10);
    let diceNormSuccesses = diceCommon.filter((d) => d.result >= successValue && d.result != 10);
    let diceBloodFails = diceBlood.filter((d) => d.result < successValue && d.result != 1);
    let diceNormFails = diceCommon.filter((d) => d.result < successValue && d.result);
    let diceBloodCritfails = diceBlood.filter((d) => d.result == 1);

    //diceBloodCrits = [1,1,1];
    //diceNormCrits = [1,1,1];
    //diceBloodSuccesses = [1];
    //diceNormSuccesses = [1];
    //diceBloodFails = [1];
    //diceNormFails = [1];
    //diceBloodCritfails = [1];


    
    const critBonus = Math.floor((diceBloodCrits.length + diceNormCrits.length) / 2.0);
    const critStacks = Math.ceil((diceBloodCrits.length + diceNormCrits.length) / 2.0);
    const successes = diceBloodCrits.length + diceNormCrits.length + diceBloodSuccesses.length + diceNormSuccesses.length + 2 * critBonus;
    const degreesOfSuccess = successes - difficulty; // degreesOfSuccess >= 0  ==> geschafft
    const isSuccess = degreesOfSuccess >= 0;
    const isCommonCrit = isSuccess && critBonus > 0;
    const isDirtyCrit = isCommonCrit && diceBloodCrits.length > 0;
    const isBestialFail = !isSuccess && diceBloodCritfails.length > 0;
    const isTotalFail = (successes === 0);

    

    // we need:
    // absolute number of degrees of success (common or hunger / complete pairs of 10 the same count as 4)

    // result (degrees of success - difficulty)
    // 0 or higher == success
    // -1 or lower == fail


    // -> schmutziger erfolg
    // at least one 10 pair
    // at least one hunger 10
    // (if throw is successful)

    // number of hunger failures

    // -> bestialischer Fehlschlag
    // at least one hunger failure (1)
    // (if throw is failure)
    // -> Button anzeigen zum 1d10 Zwang auswürfeln S.208

    // 0 degrees of success (not a single die on 6 or higher)
    // -> totaler Fehlschlag

    // show dicepool: All hunger crits, All common crits, red successes, grey successes, hunger fails, grey fails, diceBloodCritfails
    // addendum: crits get grouped into doubles, shown above eachother


/*     if (isCritFail) {
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
    } */

    let resultText = "";
    if (isTotalFail && isBestialFail)
      resultText = "Totaler Bestialischer Fehlschlag!";
    else if (isTotalFail)
      resultText = "Totaler Fehlschlag!";
    else if (isBestialFail)
      resultText = "Bestialischer Fehlschlag!";
    else if (!isSuccess)
      resultText = "Gescheitert";
    else if (isDirtyCrit)
      resultText = "Schmutziger Triumph!";
    else if (isSuccess)
      resultText = "Erfolg";
    else if (isCommonCrit)
      resultText = "Kritischer Triumph!";
    
    
    const chatData = game.messages.get(chatMessageId).data;
    const chatMessage = subElement.parents(".chat-message");
    const resultSection = chatMessage.find(".results");
    // avoid more than one roll
    const hiddenData = chatMessage.find(".hidden-data");
    hiddenData.attr("data-rolled", "true");

    /*

    Bozena Kacinzkova 
    möp: 4, nerd: 1
    ------------------
    Bozena Kacinzkova (-2)
    Schwierigkeit 4
    
    Kritischer Triumph! ?
    Erfolgsgrad 0 = (x - 4)

    0000000001111030320130
    */

    const modifierSign = (diceModifier >= 0? "+" : "");
    const templateData = {
      actor: actor.name,
      modifierSign,
      difficulty,
      degreesOfSuccess, // degrees of success
      diceModifier,
      diceBloodCrits,
      diceNormCrits,
      diceBloodSuccesses,
      diceNormSuccesses,
      diceBloodFails,
      diceNormFails,
      diceBloodCritfails,
      resultText,
      successes,
      critStacks
    }

    //prepare roll finish function
    const renderAsMessage = () => {
      renderTemplate('systems/foundryvtt-vtm-20th/templates/chat/roll-result.html', templateData).then(content => {
        resultSection.append($.parseHTML(content));
        resultSection.show();
        chatMessage.find(".all-roll-settings").hide();
        chatMessage.find(".additional-settings-switch").hide();
        setTimeout(() => this.updateMessage($(resultSection)), 0);
      });
    }

    // render the result
    
    // Hook into Dice So Nice!
    if (game.dice3d) {
      game.dice3d.showForRoll(rollBlood, game.user, true, chatData.whisper, chatData.blind);
      game.dice3d.showForRoll(rollCommon, game.user, true, chatData.whisper, chatData.blind)
      .then((_commonDisplayed) => {
        // update chat message in order to toggle result section
        renderAsMessage();
    })
    }
    // Roll normally, add a dice sound.
    else {
      // update chat message in order to toggle result section
      //this.updateMessage(subElement)        
      //chatData.sound = CONFIG.sounds.dice;
    }
  }
}
