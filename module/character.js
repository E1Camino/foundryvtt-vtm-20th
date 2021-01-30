/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
import { systemHandle, systemName } from "./utils.js";

export class VampireActor extends Actor {
  getAttribute(key) {
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
    return attributeList;
  }

  getAbility(key) {
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
    return abilityList;
  }
}
