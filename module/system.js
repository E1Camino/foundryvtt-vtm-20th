/**
 * A simple and flexible system for world-building using an arbitrary collection of character and item attributes
 * Author: Atropos
 * Software License: GNU GPLv3
 */

import { systemHandle }from "./utils.js";

// Import Modules
import { VampireActor } from "./character.js";
// import { SimpleItemSheet } from "./item-sheet.js";
import { VampireActorSheet } from "./character-sheet.js";

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

Hooks.once("init", async function() {
  console.log(`Initializing Vampire the Masquerade 20th System`);

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
//   Items.unregisterSheet("core", ItemSheet);
//   Items.registerSheet(systemHandle, SimpleItemSheet, {makeDefault: true});

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
    "systems/foundryvtt-vtm-20th/templates/attribute-input.html"
  ]);
});
