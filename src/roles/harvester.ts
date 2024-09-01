import { claimSource, depositUntilEmpty, harvestUntilFull, runRoleOnEach } from "utils/Roles";

export interface HarvesterMemory {
  role: "harvester";
  source: Id<Source>;
  spawn: Id<StructureSpawn>;
  state: "harvesting" | "depositing";
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

      if ((creep.memory.roleData as any).state === undefined) {
        creep.memory.roleData.state = 'harvesting';
      }

      if (creep.memory.roleData.source === undefined) {
        // Claim a source if we don't have one
        creep.memory.roleData.source = claimSource(creep).id
      }

      const source = Game.getObjectById(creep.memory.roleData.source);
      if (source === null) throw "wat";

      if (creep.memory.roleData.spawn === undefined) {
        // Claim a source if we don't have one
        creep.memory.roleData.spawn = Game.spawns['Spawn1'].id;
      }

      const spawn = Game.getObjectById(creep.memory.roleData.spawn);
      if (spawn === null) throw "wat";

      const state = creep.memory.roleData.state;
      creep.say(state);
      switch (state) {
        case "harvesting":
          if (harvestUntilFull(creep, source) === "FULL") {
            creep.memory.roleData.state = "depositing";
          }
          break;
        case "depositing":
          if (depositUntilEmpty(creep, spawn) == 'EMPTY') {
            creep.memory.roleData.state = "harvesting";
          }
          break;
      }
    });
  }
};
