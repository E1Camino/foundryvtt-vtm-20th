/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */

const attributeGroups = ['physical', 'social', 'mental'];
const abilityGroups = ['skill', 'talent', 'knowledge'];
const advantageGroups = ['discipline', 'background', 'virtue'];

export class VampireActor extends Actor {
  // Takes a property item and creates proper actor data
  setNewProperty(item, value) {
    const { type, id } = item.data;
    const data = this.getRollData();
    // give all properties 1 as default, except abilities which often can be 0 from the beginning
    const startValue = abilityGroups.includes(type) ? value | 0 : value | 1;

    if (data[type] === undefined) {
      data[type] = {};
    }
    data[type][id] = startValue;
    this.update(data);
  }
  // ATTRIBUTES
  getAttribute(key) {
    if (key === null) return;

    let attr = null;
    const data = super.getRollData();
    console.log(data);

    for (const group of attributeGroups) {
      const attribute = data[group][key];
      if (!attribute) continue;

      attr = attribute;
      attr.attribute_key = key;
      break;
    }
    return attr;
  }
  setAttribute(key, value, type) {
    if (!attributeGroups.includes(type)) {
      throw new Error(`Can not add attribute with type ${type}. Type has to be either ${attributesGroups.map(g => g + ",")}`);
    }
    const data = super.getRollData();
    data.attributes[type][key] = value;
    this.update(data);
  }
  getAllAttributes() {
    const attributeList = [];
    const { attributes } = super.getRollData();
    for (let [groupKey, group] of Object.entries(attributes)) {
      for (let [_key, attribute] of Object.entries(group)) {
        const attr = attribute;
        attr.attribut_type = groupKey;
        attributeList.push(attribute);
      }
    }
    return attributeList;
  }

  // ABILITIES
  getAbility(key) {
    if (key === null) return;

    let ab = null;
    const data = super.getRollData();
    for (const group of attributeGroups) {
      const ability = data[group][key];
      if (!ability) continue;

      ab = ability;
      ab.ability_key = key;
      break;
    }
    return ab; 
  }
  setAbility(key, value, type) {
    if (!abilityGroups.includes(type)) {
      throw new Error(`Can not add ability with type ${type}. Type has to be either ${abilityGroups.map(g => g + ",")}`);
    }
    const data = super.getRollData();
    data.attributes[type][key] = value;
    this.update(data);
  }
  getAllAbilities() {
    const abilityList = [];
    const { abilities } = super.getRollData();
    for (let [_, group] of Object.entries(abilities)) {
      for (let [_key, ability] of Object.entries(group)) {
        abilityList.push(ability);
      }
    }
    return abilityList;
  }

  // ADVANTAGES
  getAdvantage(key) {
    let a = null;
    const data = super.getRollData();
    for (const group of attributeGroups) {
      const advantage = data[group][key];
      if (!advantage) continue;

      a = advantage;
      a.groupKey = groupKey;
      a.advantage_key = key;
      break;
    }
    return a; 
  }
  setAdvantage(key, value, type) {
    if (!advantageGroups.includes(type)) {
      throw new Error(`Can not add advantage with type ${type}. Type has to be either ${advantageGroups.map(g => g + ",")}`);
    }
    const data = super.getRollData();
    data.advantages[type][key] = value;
    this.update(data);
  }
  getAdvantage() {
    const list = [];
    const { advantages } = super.getRollData();
    for (let [_groupKey, group] of Object.entries(advantages)) {
      for (let [_key, advantage] of Object.entries(group)) {
        list.push(advantage);
      }
    }
    return list;
  }
}
