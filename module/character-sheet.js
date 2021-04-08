/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
import { systemHandle, systemName } from "./utils.js";

export class VampireActorSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: [systemHandle, "sheet", "actor"],
      template: `systems/${systemName}/templates/character.html`,
      width: 740,
      height: 600,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "attributes",
        },
      ],
      dragDrop: [{
        dragSelector: ".item-list .item",
        dropSelector: null,
        permissions: {
          dragstart: ()=> {console.log("drag start")},
          drop: ()=> {console.log("drop start")},
        }
      }],
      rollDifficulty: 6,
      rollStatus: 0,
      selectedAttribute: null,
      selectedAbility: null,
      editMode: false,
    });
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    const data = super.getData();
    // data.dtypes = ["String", "Number", "Boolean"];
    // for (let attr of Object.values(data.data.attributes)) {
    //   attr.isCheckbox = attr.dtype === "Boolean";
    // }
    const { selectedAbility, selectedAttribute } = this.options;

    // get localized strings of selected attribute and ability (if set)
    const attribute = this.actor.getAttribute(selectedAttribute);
    if (attribute) {
      data.selectedAttribute = selectedAttribute;
      data.selectedAttributeLabel = game.i18n.localize(attribute.label);
    }

    const ability = this.actor.getAbility(selectedAbility);
    if (ability) {
      data.selectedAbilityLabel = game.i18n.localize(ability.label);
    }

    this._prepareCharacterData(data);
    
    console.log(data);
    return data;
  }

  _prepareCharacterData(sheetData) {
    const { actor, items } = sheetData;
    console.log(actor);
    sheetData.data.discipline = {};
    sheetData.data.virtue = {};
    sheetData.data.background = {};
    sheetData.data.skill = {};
    sheetData.data.talent = {};
    sheetData.data.knowledge = {};
    sheetData.data.physical = {};
    sheetData.data.social = {};
    sheetData.data.mental = {};
    sheetData.data.clan = {};
    sheetData.data.nature = {};

    // iterate through items, allocating containers
    for (const [id, item] of items.entries()) {
      const { _id, type, flags: { core: { sourceId } } } = item;
      const oid = sourceId.split(".").pop();
      const { description, tooltip } = game.items.get(oid).data;
      const value = actor.data.data.values[_id] || 1;
      sheetData.data[type][_id] = { ...item, description, tooltip,  value };
    }
  }

  /* -------------------------------------------- */

  /** @override */
  render() {
    super.render(arguments);
  }
  /* -------------------------------------------- */

/** @override */
  _handleDropData(event, data) {
    console.log(data);
    super._handleDropData(event, data)
  }
      
  /** @override */
  _getHeaderButtons() {
    let buttons = super._getHeaderButtons();

    // Edit mode button to toggle which interactive elements are visible on the sheet.
    const canConfigure = game.user.isGM || this.actor.owner;
    if (this.options.editable && canConfigure) {
      buttons = [
        {
          label: game.i18n.localize("SHEET.EDITMODE"),
          class: "toggle-edit-mode",
          icon: "fas fa-edit",
          onclick: (ev) => this._onToggleEditMode(ev),
        },
      ].concat(buttons);
    }

    return buttons;
  }
  /**
   * OnClick handler for the previously declaried "Edit mode" button.
   * Toggles the 'helper--enable-editMode' class for the sheet container.
   */
  _onToggleEditMode(e) {
    e.preventDefault();

    const target = $(e.currentTarget);
    const app = target.parents(".app");
    const html = app.find(".window-content");

    html.toggleClass("helper--enable-editMode");
    this.options.editMode = !this.options.editMode || false;
    if (this.options.editMode) {
      this.setRollStatus(0);
      this.unselectAbility();
      this.unselectAttributes();
    }
    this.render();
  }


  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html.find('.item').find('input[type="radio"]').change(event => {
      console.log(event);
      const d = this._get
      console.log(this._getSubmitData())
      this._onSubmit(event);
    });
    // // Everything below here is only needed if the sheet is editable
    // if (!this.options.editable) return;

    // // Update Inventory Item
    // html.find(".item-edit").click((ev) => {
    //   const li = $(ev.currentTarget).parents(".item");
    //   const item = this.actor.getOwnedItem(li.data("itemId"));
    //   item.sheet.render(true);
    // });

    // // Delete Inventory Item
    html.find(".item-delete-button").click((ev) => {
      const id = $(ev.currentTarget).parents(".item").attr("data-item-key");
      console.log(id);
      this.actor.deleteOwnedItem(id);
    });

    // Skill Tests (right click to open skill sheet)
    html.find('.attribute-roll-button').mouseup(ev => {
      const attribute = $(ev.currentTarget).parents(".item").attr("data-item-key");
      DicePoolVTM20.prepareTest({
        actor: this.actor,
        attribute
      }, true);
      this.unselectAttributes();
      this.setRollStatus(0);
    });

    html.find('.ability-roll-button').mouseup(ev => {
      // skip if wrong roll status
      if (this.getRollStatus() !== 1) {
        return;
      }
      const ability = $(ev.currentTarget).parents(".item").attr("data-item-key");

      const attribute = this.getSelectedAttribute();
      DicePoolVTM20.prepareTest({
        actor: this.actor,
        attribute,
        ability
      });
      this.unselectAttributes();
      this.setRollStatus(0);
    });

    // click on attribute label -> toggle attribute
    html.find('.attribute-value').mouseup(ev => {
      if (this.options.editMode) return;
      const attribute = $(ev.currentTarget).parents(".item").attr("data-item-key");
      if (attribute === this.getSelectedAttribute()) {
        this.unselectAttributes();
        this.setRollStatus(0);
      } else {
        this.selectAttribute(attribute);
        this.setRollStatus(1);
        this.render();
      }
    });

    // click on ability label -> open difficulty dialog
    html.find('.ability-value').mouseup(ev => {
      // skip if wrong roll status
      if (this.getRollStatus() !== 1) {
        return;
      }
      if (this.options.editMode) return;
      const ability = $(ev.currentTarget).parents(".item").attr("data-item-key");
      this.selectAbility(ability);
      if (!this.getRollDifficulty()) {
        this.setRollDifficulty(6);
      }
      this.setRollStatus(2);
      this.render();
    });

    // submit difficulty dialog
    html.find('#btn-roll-submit').click(() => {
      const difficulty = parseInt(html.find('#input-roll-difficulty').find('input').val());
      this.setRollDifficulty(difficulty);
      DicePoolVTM20.prepareTest({
        actor: this.actor,
        attribute: this.getSelectedAttribute(),
        ability: this.getSelectedAbility(),
        difficulty
      });
      this.setRollStatus(0);
      this.unselectAbility();
      this.unselectAttributes();
      this.render();
    });

    html.find('#btn-roll-save').click(() => {
      const attributeKey = this.getSelectedAttribute();
      const abilityKey = this.getSelectedAbility();
      const attribute = this.actor.getAttribute(attributeKey);
      const ability = this.actor.getAbility(abilityKey);
      
      const name = `${game.i18n.localize(attribute.label)} & ${game.i18n.localize(ability.label)}`;
      let item = game.items.entities.find(e => e.name === name);
      if (!item) {
        item = Item.create({
          actor: this.actor,
          attribute,
          ability,
          name,
          type: "macro",
        }, { renderSheet: true })
      }
      this.render();

      // add the item to the macro bar
    });

    // close difficulty dialog
    html.find('#btn-roll-cancel').click(() => {
      this.setRollStatus(1);
      this.unselectAbility();
      this.render();
    });

    // listen to slider changes
    html.find('#input-roll-difficulty').find('input').on('input', ev => {
      const value = $(ev.currentTarget).val();
      html.find('#input-roll-difficulty').find('h2').text(value);
    });
    html.find('#input-roll-difficulty').find('input').on('change', ev => {
      const value = parseInt($(ev.currentTarget).val());
      this.setRollDifficulty(value);
      this.render();
    });

  }

  /* -------------------------------------------- */

  /** @override */
  // setPosition(options = {}) {
  //   const position = super.setPosition(options);
  //   const sheetBody = this.element.find(".sheet-body");
  //   const bodyHeight = position.height - 192;
  //   sheetBody.css("height", bodyHeight);
  //   return position;
  // }

  /* -------------------------------------------- */

  render() {
    super.render(...arguments);
  }

  /**
   * Listen for click events on an attribute control to modify the composition of attributes in the sheet
   * @param {MouseEvent} event    The originating left click event
   * @private
   */
  async _onClickAttributeControl(event) {
    event.preventDefault();
    const a = event.currentTarget;
    const action = a.dataset.action;
    const attrs = this.object.data.data.attributes;
    const form = this.form;

    // Add new attribute
    if (action === "create") {
      const nk = Object.keys(attrs).length + 1;
      let newKey = document.createElement("div");
      newKey.innerHTML = `<input type="text" name="data.attributes.attr${nk}.key" value="attr${nk}"/>`;
      newKey = newKey.children[0];
      form.appendChild(newKey);
      await this._onSubmit(event);
    }

    // Remove existing attribute
    else if (action === "delete") {
      const li = a.closest(".attribute");
      li.parentElement.removeChild(li);
      await this._onSubmit(event);
    }
  }

  /* -------------------------------------------- */

  /** @override */
  _updateObject(event, formData) {
    // // Handle the free-form attributes list
/*     const formAttrs = expandObject(formData).data.advantages || {};
    const attributes = Object.values(formAttrs).reduce((obj, v) => {
      let k = v["key"].trim();
      if (/[\s\.]/.test(k))
        return ui.notifications.error(
          "Attribute keys may not contain spaces or periods"
        );
      delete v["key"];
      obj[k] = v;
      return obj;
    }, {});

    // Remove attributes which are no longer used
    for (let k of Object.keys(this.object.data.data.advantages)) {
      if (!formAttrs.hasOwnProperty(k)) formAttrs[`-=${k}`] = null;
    }

    // Re-combine formData
    formData = Object.entries(formData)
      .filter((e) => !e[0].startsWith("data.advantages"))
      .reduce(
        (obj, e) => {
          obj[e[0]] = e[1];
          return obj;
        },
        { id: this.object.id, "data.advantages": formAttrs }
      );
 */
    // Update the Actor
    return this.object.update(formData);
  }


  // local state
  selectAbility(value) {
    this.options.selectedAbility = value;
  }
  unselectAbility() {
    this.options.selectedAbility = null;
  }
  getSelectedAbility() {
    return this.options.selectedAbility;
  }
  
  getSelectedAttribute() {
    return this.options.selectedAttribute;
  }
  selectAttribute(value) {
    this.options.selectedAttribute = value;
  }
  unselectAttributes() {
    this.options.selectedAttribute = null;
  }

  setRollStatus(value) {
    this.options.rollStatus = value;
  }

  getRollStatus() {
    return this.options.rollStatus;
  }

  setRollDifficulty(value) {
    this.options.rollDifficulty = value;
    this._render();
  }

  getRollDifficulty() {
    return this.options.rollDifficulty ;
  }
}
