/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
import { systemHandle, systemName } from "./utils.js";

export class VampireActor extends Actor {
  selectAttribute(value) {
    console.log("select attribute ", value);
    return super.setFlag(systemName, "selectedAttribute", value);
  }
  unselectAttributes() {
    return this.selectAttribute(null);
  }

  getSelectedAttribute() {
    return super.getFlag(systemName, "selectedAttribute");
  }

  getAttribute(key) {
    console.log("get attribute: ", key);
    let attr = null;
    const { attributes } = super.getRollData();
    for (let [groupKey, group] of Object.entries(attributes)) {
      const attribute = group[key]
      if (!attribute) continue;

      attr = attribute;
      attr.attribute_type = groupKey;
      attr.attribute_key = key;
      break;
    }
    console.log({attr});
    return attr;
  }
  getAllAttributes() {
    const attributeList = [];
    const { attributes } = super.getRollData();
    for (let [groupKey, group] of Object.entries(attributes)) {
      for (let [key, attribute] of Object.entries(group)) {
        const attr = attribute;
        attr.attribut_type = groupKey;
        attr.
        attributeList.push(attribute);
      }
    }
    console.log({attributeList});
    return attributeList;
  }

  getAbility(key) {
    console.log("get ability: ", key);
    let ab = null;
    const { abilities } = super.getRollData();
    for (let [groupKey, group] of Object.entries(abilities)) {
      const ability = group[key];
      if (!ability) continue;

      ab = ability;
      ab.ability_type = groupKey;
      ab.ability_key = key;
      break;
    }
    console.log({ab});
    return ab; 
  }
  getAllAbilities() {
    const abilityList = [];
    const { abilities } = super.getRollData();
    for (let [groupKey, group] of Object.entries(abilities)) {
      for (let [key, ability] of Object.entries(group)) {
        abilityList.push(ability);
      }
    }
    console.log({abilityList});
    return abilityList;
  }
  selectAbility(value) {
    super.setFlag(systemName, 'selectedAbility', value);
  }

  unselectAbility() {
    super.setFlag(systemName, 'selectedAbility', null);
  }

  getSelectedAbility() {
    return super.getFlag(systemName, 'selectedAbility');
  }

  setRollStatus(value) {
    super.setFlag(systemName, 'rollStatus', value);
  }

  getRollStatus() {
    return super.getFlag(systemName, 'rollStatus');
  }

  setRollDifficulty(value) {
    super.setFlag(systemName, 'rollDifficulty', value);
  }

  getRollDifficulty() {
    return super.getFlag(systemName, 'rollDifficulty');
  }



}
