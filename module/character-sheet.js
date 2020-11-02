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
      // dragDrop: [{ dragSelector: ".item-list .item", dropSelector: null }],
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
    console.log("data", { data });
    return data;
  }

  /* -------------------------------------------- */

  /** @override */
  render() {
    super.render(arguments);
    console.log(arguments);
  }
  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html.find('.item').find('input[type="radio"]').change(event => {
      console.log(event);
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
    // html.find(".item-delete").click((ev) => {
    //   const li = $(ev.currentTarget).parents(".item");
    //   this.actor.deleteOwnedItem(li.data("itemId"));
    //   li.slideUp(200, () => this.render(false));
    // });

    // // Add or Remove Attribute
    // html
    //   .find(".attributes")
    //   .on(
    //     "click",
    //     ".attribute-control",
    //     this._onClickAttributeControl.bind(this)
    //   );
      
    // Skill Tests (right click to open skill sheet)
    html.find('.attribute-roll-button').mouseup(ev => {
      const label = $(ev.currentTarget).parents(".item").attr("data-item-label");
      const attribute = this.actor.getAttribute(label);
      DicePoolVTM20.prepareTest({
        actor: this.actor,
        attribute: game.i18n.localize(attribute.label)
      }, true);
      this.actor.unselectAttributes();
      this.actor.setRollStatus(0);
    });

    html.find('.ability-roll-button').mouseup(ev => {
      // skip if wrong roll status
      if (this.actor.getRollStatus() !== 1) {
        return;
      }
      const label = $(ev.currentTarget).parents(".item").attr("data-item-label");
      const ability = this.actor.getAbility(label);
      const attribute = this.actor.getSelectedAttribute();
      DicePoolVTM20.prepareTest({
        actor: this.actor,
        attribute,
        ability: game.i18n.localize(ability.label)
      });
      this.actor.unselectAttributes();
      this.actor.setRollStatus(0);
    });

    // click on attribute label -> toggle attribute
    html.find('.attribute-label').mouseup(ev => {
      const label = $(ev.currentTarget).parents(".item").attr("data-item-label");
      if (label === this.actor.getSelectedAttribute()) {
        this.actor.unselectAttributes();
        this.actor.setRollStatus(0);
      } else {
        this.actor.selectAttribute(label);
        this.actor.setRollStatus(1);
      }
    });

    // click on ability label -> open difficulty dialog
    html.find('.ability-label').mouseup(ev => {
      // skip if wrong roll status
      if (this.actor.getRollStatus() !== 1) {
        return;
      }
      const label = $(ev.currentTarget).parents(".item").attr("data-item-label");
      this.actor.selectAbility(label);
      if (!this.actor.getRollDifficulty()) {
        this.actor.setRollDifficulty(6);
      }
      this.actor.setRollStatus(2);
    });

    // submit difficulty dialog
    html.find('#btn-roll-submit').click(() => {
      const difficulty = parseInt(html.find('#input-roll-difficulty').find('input').val());
      this.actor.setRollDifficulty(difficulty);
      DicePoolVTM20.prepareTest({
        actor: this.actor,
        attribute: this.actor.getSelectedAttribute(),
        ability: this.actor.getSelectedAbility(),
        difficulty
      });
      this.actor.unselectAbility();
      this.actor.unselectAttributes();
      this.actor.setRollStatus(0);
    });

    // close difficulty dialog
    html.find('#btn-roll-cancel').click(() => {
      this.actor.unselectAbility();
      this.actor.setRollStatus(1);
    });

    // listen to slider changes
    html.find('#input-roll-difficulty').find('input').on('input', ev => {
      const value = $(ev.currentTarget).val();
      html.find('#input-roll-difficulty').find('h2').text(value);
    });
    html.find('#input-roll-difficulty').find('input').on('change', ev => {
      const value = parseInt($(ev.currentTarget).val());
      this.actor.setRollDifficulty(value);
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
    console.log("render it now")
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
    const formAttrs = expandObject(formData).data.attributes || {};
    // const attributes = Object.values(formAttrs).reduce((obj, v) => {
    //   let k = v["key"].trim();
    //   if (/[\s\.]/.test(k))
    //     return ui.notifications.error(
    //       "Attribute keys may not contain spaces or periods"
    //     );
    //   delete v["key"];
    //   obj[k] = v;
    //   return obj;
    // }, {});

    // Remove attributes which are no longer used
    for (let k of Object.keys(this.object.data.data.attributes)) {
      if (!formAttrs.hasOwnProperty(k)) formAttrs[`-=${k}`] = null;
    }

    // Re-combine formData
    formData = Object.entries(formData)
      .filter((e) => !e[0].startsWith("data.attributes"))
      .reduce(
        (obj, e) => {
          obj[e[0]] = e[1];
          return obj;
        },
        { _id: this.object._id, "data.attributes": formAttrs }
      );

    // Update the Actor
    return this.object.update(formData);
  }
}
