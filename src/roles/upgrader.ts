import { claimSource, runRoleOnEach } from "utils/Roles";
import { ScreepsError } from "utils/ScreepsError";

export interface UpgraderMemory {
  role: "upgrader";
  state: "harvesting" | "upgrading";
  source: Id<Source>;
}

export const upgrader: Role = {
  count: 5,
  body: [WORK, MOVE, CARRY],
  initMemory: { state: "harvesting" },

  run(creeps: Creep[]) {
    runRoleOnEach("upgrader", creeps, creep => {
      if (creep.memory.roleData.role !== "upgrader") {
        // This is checked before calling this function, but we add this for
        // typescript
        return;
      }

      if (creep.room.controller === undefined) {
        // Should never happen. Just silently do nothing.
        return;
      }

      if (creep.spawning) {
        // Do not try to act on creeps still being spawned.
        return;
      }

      if (creep.memory.roleData.source === undefined) {
        // Claim a source if we don't have one
        creep.memory.roleData.source = claimSource(creep).id;
      }

      const source = Game.getObjectById(creep.memory.roleData.source);
      if (source === null) {
        throw "wat";
      }

      const state = creep.memory.roleData.state;
      creep.say(state);
      switch (state) {
        case "harvesting":
          if (creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
            const result = creep.harvest(source);
            switch (result) {
              case OK:
                break;
              case ERR_NOT_IN_RANGE:
                creep.moveTo(source);
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
    });
  }
};
