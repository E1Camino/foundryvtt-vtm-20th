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
      selectedItem: null,
      editMode: false,
    });
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    const data = super.getData();
    const item = this.getSelectedItem();
    if (item) {
      data.selectedItem = item;
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
    const selectedItemKey = this.getSelectedItemKey();
    // iterate through items, allocating containers
    for (const [id, item] of items.entries()) {
      const { _id, type, flags: { core: { sourceId } } } = item;
      const oid = sourceId.split(".").pop();
      const { description, tooltip } = game.items.get(oid).data;
      const value = actor.data.data.values[_id] || 1;
      const selected = _id === selectedItemKey;
      sheetData.data[type][_id] = { ...item, description, tooltip,  value, selected };
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
      this.unselectItems();
    }
    this.render();
  }


  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html.find('.item').find('input[type="radio"]').change(event => {
      const d = this._get
      this._onSubmit(event);
    });

    // // Delete Inventory Item
    html.find(".item-delete-button").click((ev) => {
      const id = $(ev.currentTarget).parents(".item").attr("data-item-key");
      this.actor.deleteOwnedItem(id);
    });

    // Skill Tests (right click to open skill sheet)
    html.find('.item-roll-button').mouseup(ev => {
      const itemClickedKey = $(ev.currentTarget).parents(".item").attr("data-item-key");
      const itemClicked = this.getItem(itemClickedKey);

      const itemSelected = this.getSelectedItem();
      
      DicePoolVTM20.prepareTest({
        actor: this.actor,
        items: [itemClicked, itemSelected].filter(i => i !== null)
      });
      this.unselectItems();
      this.render();
    });

    // click on attribute label -> toggle attribute
    html.find('.item-value').mouseup(ev => {
      if (this.options.editMode) return;
      const itemKey = $(ev.currentTarget).parents(".item").attr("data-item-key");
      if (itemKey === this.getSelectedItemKey()) {
        this.unselectItems();
      } else {
        this.selectItem(itemKey);
      }
      this.render();
    });
  }

  /* -------------------------------------------- */

  render() {
    super.render(...arguments);
  }

  /* -------------------------------------------- */

  /** @override */
  _updateObject(_event, formData) {
    // Update the Actor
    return this.object.update(formData);
  }


  // local state
  getItem(key) {
    if (key === null) return null;
    const data = super.getData();
    const item = Object.values(data.items).find(i => i._id === key);
    const value = data.data.data.values[item._id];
    return { ...item, value };
  }
  getSelectedItemKey() {
    return this.options.selectedItem;
  }
  getSelectedItem() {
    return this.getItem(this.options.selectedItem);
  }
  selectItem(itemKey) {
    this.options.selectedItem = itemKey;
  }
  unselectItems() {
    this.selectItem(null);
  }
}
