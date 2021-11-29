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
    return data;
  }

  _prepareCharacterData(sheetData) {
    const { actor, items } = sheetData;
    // console.log("hello");
    // console.log({ sheetData });
    // console.log(sheetData.data.data);
    const types = ['discipline', 'virtue', 'background', 'skill', 'talent', 'knowledge', 'physical', 'social', 'mental', 'clan', 'nature'];
    types.forEach(type => sheetData.data[type] = []);
    const selectedItemKey = this.getSelectedItemKey();

    // fix some character stats that might be broken because of changing 
    // character template and incomplete migration process

    if (typeof sheetData.data.data.health === "string") {
      sheetData.data.data.health = [0, 0, 0, 0, 0, 0, 0];
    }
    sheetData.data.data.health = sheetData.data.data.health.sort((a, b) => b -a) 

    // iterate through items, allocating containers
    for (const [_id, item] of items.entries()) {
      const { _id, type, flags: { core: { sourceId } } } = item;
      const oid = sourceId.split(".").pop();
      const gameItem = game.items.get(oid);
      if (gameItem !== undefined) {        
        const { data: { description, tooltip }, name } = gameItem.data;
        const value = actor.data.data.values[_id] || 1;
        const selected = _id === selectedItemKey ? 1 : 0;
        console.log(selected);
        item.data.selected = selected;
        sheetData.data[type].push({
          ...item,
          description,
          tooltip,
          name,
          value,
          selected,
        });
      }
    }
    console.log(sheetData);

    types.forEach(type => {
      sheetData.data[type] = sheetData.data[type].sort((a, b) => {
        if (a.name < b.name) { return -1; }
        if (a.name > b.name) { return 1; }
        return 0;
      });
    });

  }

  /* -------------------------------------------- */

  /** @override */
  render() {
    super.render(arguments);
  }
  /* -------------------------------------------- */

/** @override */
  _handleDropData(event, data) {
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

    // show tooltips
    html.find('item-value')
      .hover(
        // Hover event
        (e) => {
          $(this).data('tiptext', titleText).removeAttr('title');
          $('<p class="tooltip"></p>').text(titleText).appendTo('body').css('top', (e.pageY - 10) + 'px').css('left', (e.pageX + 20) + 'px').fadeIn('slow');
        },
        // Hover off event
        () => {
          $(this).attr('title', $(this).data('tiptext'));
          $('.tooltip').remove();
        }
      )
      .mousemove((e) => { // Mouse move event
        $('.tooltip').css('top', (e.pageY - 10) + 'px').css('left', (e.pageX + 20) + 'px');
      }
    );

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

      // get relevant "last Roll" settings
      const { actionType = "common" } = this.getRollSettings();
      DicePoolVTM20.createRollMessage({
        actorId: this.actor.data._id,
        items: [itemClicked, itemSelected].filter(i => i !== null),
        actionType,
        onRollCallback: (rollSettings) => {
          this.setRollSettings(rollSettings);
        },
        bloodDice: this.actor.data.data.bloodDice
      });
      this.unselectItems();
      this.render();
    });

    // click on blood dice radio buttons
    html.find(".input-blood-dice input").mouseup(ev => {
      if (!this.options.editMode) return;
      this.actor.update({ data: { bloodDice: ev.currentTarget.value } })
    })

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


    // damage and health buttons
    const replaceNextZero = (i) => {
      let { health } = this.actor.data.data;
      if (typeof health ==="string") {
        health = [0,0,0,0,0,0,0];
      }
      const idx = health.indexOf(0)
      if (idx !== -1) {
        health[idx] = i;
      }
      health = health.sort((a, b) => b - a);
      this.actor.update({ data: { health } });
    }
    const reset = (i) => {
      let { health } = this.actor.data.data;
      if (typeof health ==="string") {
        health = [0,0,0,0,0,0,0];
      }
      health[i] = 0;
      health = health.sort((a, b) => b - a);
      this.actor.update({ data: { health } });
    }
    html.find('.add-bashing-damage').click(() => replaceNextZero(1));
    html.find('.add-lethal-damage').click(() => replaceNextZero(2));
    html.find('.add-aggravated-damage').click(() => replaceNextZero(3));
    html.find('.health-0 .reset').click(() => reset(0));
    html.find('.health-1 .reset').click(() => reset(1));
    html.find('.health-2 .reset').click(() => reset(2));
    html.find('.health-3 .reset').click(() => reset(3));
    html.find('.health-4 .reset').click(() => reset(4));
    html.find('.health-5 .reset').click(() => reset(5));
    html.find('.health-6 .reset').click(() => reset(6));
  }

  setRollSettings(settings) {
    this.options.lastRollSettings = settings;
  }
  getRollSettings() {
    return this.options.lastRollSettings || {};
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
    console.log(itemKey);
    this.options.selectedItem = itemKey;
  }
  unselectItems() {
    this.selectItem(null);
  }
}
