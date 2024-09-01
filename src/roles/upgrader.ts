import { claimSource, harvestUntilFull, runRoleOnEach, upgradeUntilEmpty } from "utils/Roles";
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
          if (harvestUntilFull(creep, source) === "FULL") {
            creep.memory.roleData.state = "upgrading";
          }
          break;
        case "upgrading":
          if (upgradeUntilEmpty(creep, creep.room.controller) == 'EMPTY') {
            creep.memory.roleData.state = "harvesting";
          }
          break;
      }
    });
  }
};
