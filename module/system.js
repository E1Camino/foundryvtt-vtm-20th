/**
 * A simple and flexible system for world-building using an arbitrary collection of character and item attributes
 * Author: Atropos
 * Software License: GNU GPLv3
 */

import { systemHandle }from "./utils.js";

// Import Modules
import { VampireActor } from "./character.js";
import { VampireDicePoolSheet } from "./items/dice-pool-sheet.js";
import { VampireAdvantageSheet } from "./items/advantage-sheet.js";
import { DicePoolItem } from "./items/dice-pool-item.js";
import { AdvantageItem } from "./items/advantage-item.js";
import { VampireActorSheet } from "./character-sheet.js";

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

Hooks.once("init", async function() {
  console.log(`Initializing Vampire the Masquerade 20th System`);

  game[systemHandle] = {
    VampireActor,
    DicePoolItem,
    AdvantageItem,
    rollItemMacro
  }
	/**
	 * Set an initiative formula for the system
	 * @type {String}
	 */
	CONFIG.Combat.initiative = {
	  formula: "1d20",
    decimals: 2
  };

	// Define custom Entity classes
  CONFIG.Actor.entityClass = VampireActor;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet(systemHandle, VampireActorSheet, { makeDefault: true });
  //Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet(systemHandle, VampireDicePoolSheet, { });
  Items.registerSheet(systemHandle, VampireAdvantageSheet, { });

  // Register system settings
  game.settings.register(systemHandle, "macroShorthand", {
    name: "Shortened Macro Syntax",
    hint: "Enable a shortened macro syntax which allows referencing attributes directly, for example @str instead of @attributes.str.value. Disable this setting if you need the ability to reference the full attribute model, for example @attributes.str.label.",
    scope: "world",
    type: Boolean,
    default: true,
    config: true
  });
  // Pre-load templates
  loadTemplates([
    "systems/foundryvtt-vtm-20th/templates/attribute-input.html",
    "systems/foundryvtt-vtm-20th/templates/chat/select.html",
    "systems/foundryvtt-vtm-20th/templates/chat/roll.html",
  ]);


  Handlebars.registerHelper('times', function(n, block) {
    var accum = '';
    // this will iterate from 0 to n -> so it will do it n+1 times
    for (var i = 0; i <= n; ++i) {
      block.data.index = i;
      block.data.first = i === 0;
      block.data.last = i === (n - 1);
      accum += block.fn(i);
    }
    return accum;
  });
  Handlebars.registerHelper("calc", function (value, operator, value2) {
    var v1 = parseInt(value);
    var v2 = parseInt(value2);
    switch (operator) {
      case "+":
        return v1 + v2; 
      case "-":
        return v1 - v2
      default:
        return v1;
    }
  });
  // Allows {if X = Y} type syntax in html using handlebars
  Handlebars.registerHelper("iff", function (a, operator, b, opts) {
    var bool = false;
    switch (operator) {
      case "==":
        bool = a == b;
        break;
      case ">":
        bool = a > b;
        break;
      case "<":
        bool = a < b;
        break;
      case ">=":
        bool = a >= b;
        break;
      case "<=":
        bool = a <= b;
        break;
      case "!=":
        bool = a != b;
        break;
      default:
        throw "Unknown operator " + operator;
    }
    if (bool) {
      return opts.fn(this);
    } else {
      return opts.inverse(this);
    }
  });
});

Hooks.once("ready", async function() {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => createBoilerplateMacro(data, slot));
});
/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createBoilerplateMacro(data, slot) {
  console.log(data, slot);
  if (data.type !== "Item") return;
  
  if (!("data" in data) && !("id" in data)) return ui.notifications.warn("You can only create macro buttons for owned Items");
  const item = data.data || game.items.get(data.id);
  console.log(item);
  // Create the macro command
  const command = `game.${systemHandle}.rollItemMacro("${item.name}");`;
  let macro = game.macros.entities.find(m => (m.name === item.name) && (m.command === command));
  if (!macro) {
    const flags = {};
    flags[`${systemHandle}.itemMacro`] = true;
    macro = await Macro.create({
      name: item.name,
      type: "script",
      img: item.img,
      command: command,
      flags: flags
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemName
 * @return {Promise}
 */
function rollItemMacro(itemName) {
  const speaker = ChatMessage.getSpeaker();
  let actor;
  if (speaker.token) actor = game.actors.tokens[speaker.token];
  if (!actor) actor = game.actors.get(speaker.actor);
  const sameName = (i => i.name === itemName);
  const item = game.items.entities.find(sameName);

  DicePoolVTM20.prepareTest({
    actor,
    title: item.data.name,
    attribute: item.data.data.attribute,
    ability: item.data.data.ability
  });

  // Trigger the item roll
  return item.roll();
}