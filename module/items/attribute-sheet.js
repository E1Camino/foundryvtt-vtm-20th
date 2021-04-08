import { systemHandle, systemName } from "../utils.js";
/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */

const attributeTypes = Object.freeze({ 'physical': 1, 'social': 2, 'mental': 3 });

export class VampireAttributeSheet extends ItemSheet {

    /** @override */
    static get defaultOptions() {
      return mergeObject(super.defaultOptions, {
        classes: [systemHandle, "sheet", "item"],
        width: 520,
        height: 480,
        data: {
          description: "",
          tooltip: "",
          scale: {
            0: "",
            1: "",
            2: "",
            3: "",
            4: "",
            5: ""
          },
          type: attributeTypes.physical
        }
      });
    }
  
    /** @override */
    get template() {
      const path = `systems/${systemName}/templates/items`;
      const template = `${path}/item-attribute-sheet.html`;
      return template;
    }
  
    /* -------------------------------------------- */
  
    /** @override */
    getData() {
      const data = super.getData();
      return data;
    }
  
    /* -------------------------------------------- */
  
    /** @override */
    setPosition(options = {}) {
      const position = super.setPosition(options);
      const sheetBody = this.element.find(".sheet-body");
      const bodyHeight = position.height - 192;
      sheetBody.css("height", bodyHeight);
      return position;
    }
  
    /* -------------------------------------------- */
  
    /** @override */
    activateListeners(html) {
      super.activateListeners(html);
  
      // Everything below here is only needed if the sheet is editable
      if (!this.options.editable) return;
  
      // Roll handlers, click handlers, etc. would go here.
    }
  }
  