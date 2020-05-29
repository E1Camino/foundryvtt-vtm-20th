// Build the formula.
let formula = '2d6+3';

// Render the roll.
let template = 'systems/dungeonworld/templates/chat/chat-move.html';
let templateData = {
  title: 'My roll title',
  flavor: 'My flavor text'
};

// GM rolls.
let chatData = {
  user: game.user._id,
  speaker: ChatMessage.getSpeaker({ actor: this.actor })
};

// Handle roll visibility. Blind doesn't work, you'll need a render hook to hide it.
let rollMode = game.settings.get("core", "rollMode");
if (["gmroll", "blindroll"].includes(rollMode)) chatData["whisper"] = ChatMessage.getWhisperRecipients("GM");
if (rollMode === "selfroll") chatData["whisper"] = [game.user._id];
if (rollMode === "blindroll") chatData["blind"] = true;

// Do the roll.
let roll = new Roll(formula);
roll.roll();

// Render the roll for the results button that Foundry provides.
roll.render().then(r => {

  // Add the dice roll to our template.
  templateData.roll = r;
  chatData.roll = JSON.stringify(r);

  // Render our chat-move template.
  renderTemplate(template, templateData).then(content => {

    // Update the message content.
    chatData.content = content;

    // Hook into Dice So Nice!
    if (game.dice3d) {
      game.dice3d.showForRoll(roll, chatData.whisper, chatData.blind).then(displayed => {
        ChatMessage.create(chatData)
      });
    }
    // Roll normally, add a dice sound.
    else {
      chatData.sound = CONFIG.sounds.dice;
      ChatMessage.create(chatData);
    }
  });
});