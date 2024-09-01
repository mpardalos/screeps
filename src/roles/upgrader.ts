import { ScreepsError } from "utils/ScreepsError";

export interface UpgraderMemory {
  role: "upgrader";
  state: "harvesting" | "upgrading";
}

export const upgrader: Role = {
  count: 5,
  body: [WORK, MOVE, CARRY],
  initMemory: { state: "harvesting" },
  run(creep) {
    if (creep.memory.roleData.role !== "upgrader") {
      // This is checked before calling this function, but we add this for
      // typescript
      return;
    }

    if (creep.room.controller === undefined) {
      // Should never happen. Just silently do nothing.
      return;
    }

    const state = creep.memory.roleData.state;
    creep.say(state);
    switch (state) {
      case "harvesting":
        if (creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
          const harvestSource = creep.room.find(FIND_SOURCES)[0];
          const result = creep.harvest(harvestSource);
          switch (result) {
            case OK:
              break;
            case ERR_NOT_IN_RANGE:
              creep.moveTo(harvestSource);
              break;
            default:
              throw new ScreepsError(result, "Could not harvest for upgrading");
          }
        } else {
          creep.memory.roleData.state = "upgrading";
        }
        break;
      case "upgrading":
        const result = creep.upgradeController(creep.room.controller);
        switch (result) {
          case OK:
            break;
          case ERR_NOT_IN_RANGE:
            creep.moveTo(creep.room.controller);
            break;
          case ERR_NOT_ENOUGH_RESOURCES:
            creep.memory.roleData.state = "harvesting";
            break;
          default:
            throw new ScreepsError(result, "Could not upgrade controller");
        }
    }
  }
};
