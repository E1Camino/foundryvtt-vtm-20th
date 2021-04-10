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
    // test button in 
    // Respond to character generation button clicks
    html.on("click", ".roll-button", event => {
      event.preventDefault();
      // data-button tells us what button was clicked
      const button = $(event.currentTarget);
      /*
      <div class="common-options">
      <div class="additional-settings">
      </div>
    </div>
    <div class="attack-options ">
      <div class="additional-settings">
      </div>
    </div>

    <div class="before-actions">
      <button>Roll</button><!-- Symbol: Dice (maybe with text "ROLL!") -->
      <button>Retarget</button><!-- Symbol: Aiming reticule -->
      <button title="show additional settings for this roll">AdditionalSettings</button><!-- Symbol: Gear -->
    </div>   
    */
      //const itemClickedKey = $(ev.currentTarget).parents(".item").attr("data-item-key");
      const chatMessage = button.parents(".chat-message");
      const dataNode = chatMessage.find(".hidden-data");
      const creatorID = dataNode.attr("data-creator-id");
      // dont allow changes if not owner
      //if (creatorID !== game.user.id) return; // TODO de-commentify
      
      const commonOptions = chatMessage.find(".common-options");
      const attackOptions = chatMessage.find(".attack-options");
      const additionalOptions = attackOptions.find(".additional-settings");
      const messageId = chatMessage.attr("data-message-id");
      const oldMessage = game.messages.get(messageId);
      
      switch (button.attr("data-button")) {
        case "setCommonMode":
          commonOptions.show();
          attackOptions.hide();
        break;
        case "setAttackMode":
          commonOptions.show();
          attackOptions.show();
        break;
        case "showHideAdditional":
          commonOptions.show();
          attackOptions.show();
        break;
        case "setAttackMode":
          commonOptions.show();
          attackOptions.show();
        break;
        case "setAttackMode":
          commonOptions.show();
          attackOptions.show();
        break;
      }

    });
    
    html.on("change", ".synchronize-radio-state input", event => {
      let target = $(event.currentTarget);
      console.log(target);
      target.attr("checked");
      console.log(target.attr("checked"));
      target.siblings().each(function () {
        const sibling = $(this);
        sibling.removeAttr("checked"); // setter
        console.log(sibling.attr("checked"));
      });
      target.attr("checked", "checked"); // setter
    });

    html.on("click", ".should-update-on-click", event => {
      setTimeout(() => this.updateMessage($(event.currentTarget)), 500) ;
    });
  }

  // updates message for all players to your current content.
  // requires one element from the message as origin (e.g. a button or any div)
  static updateMessage(subElement) {
    const messageId = subElement.parents(".chat-message").attr("data-message-id");
    const content = subElement.parents(".message-content")[0].outerHTML;
    const oldMessage = game.messages.get(messageId);
    oldMessage.update({ content });
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
    
    // Handle roll visibility. Blind doesn't work, you'll need a render hook to hide it.
    if (["gmroll", "blindroll"].includes(rollMode))
      chatData["whisper"] = ChatMessage.getWhisperRecipients("GM");
    if (rollMode === "selfroll") chatData["whisper"] = [game.user.id];
    if (rollMode === "blindroll") chatData["blind"] = true;

    roll.render().then((r) => {
      console.log(r);
      chatData.roll = JSON.stringify(r);

      //const templateData = this.getRenderData({ rolls: roll.dice[0].results });

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

  static prepareTest(testData = {}) {
    console.log({testData})
    DicePoolVTM20.rollTest(testData);
  }
}
