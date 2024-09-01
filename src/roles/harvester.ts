import { claimSource, runRoleOnEach } from "utils/Roles";

export interface HarvesterMemory {
  role: "harvester";
  source: Id<Source>;
}

export const harvester: Role = {
  count: 5,

  body: [WORK, MOVE, CARRY],

  run(creeps: Creep[]) {
    runRoleOnEach("harvester", creeps, creep => {
      if (creep.memory.roleData.role !== "harvester") {
        return;
      }

      if (creep.spawning) {
        // Do not try to act on creeps still being spawned.
        return;
      }

      if (creep.memory.roleData.source === undefined) {
        // Claim a source if we don't have one
        creep.memory.roleData.source = claimSource(creep).id
      }

      const source = Game.getObjectById(creep.memory.roleData.source);
      if (source === null) {
        throw "wat";
      }

      if (creep.store.getFreeCapacity() > 0) {
        creep.say("harvesting");
        if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
          creep.moveTo(source);
        }
      } else {
        creep.say("depositing");
        if (creep.transfer(Game.spawns["Spawn1"], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
          creep.moveTo(Game.spawns["Spawn1"]);
        }
      }
    });
  }
};
