/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */

export class VampireActor extends Actor {
  // yaay i exist
  getInjuryModificator() {
    const data = super.getData();
    console.log({ data });
    // TODO check current health level and return proper modificator
    return 0;
  }
}
