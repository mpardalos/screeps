export interface HarvesterMemory {
  role: "harvester";
  source: Id<Source>;
}

export const harvester: Role = {
  count: 5,

  body: [WORK, MOVE, CARRY],

  run(creep: Creep) {
    if (creep.memory.roleData.role !== "harvester") {
      return;
    }

    if (creep.memory.roleData.source === undefined) {
      const sources = creep.room.find(FIND_SOURCES);
      creep.memory.roleData.source = sources[0].id;
    } else if ((creep.memory.roleData.source as any).id !== undefined) {
      creep.memory.roleData.source = (creep.memory.roleData.source as any).id;
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
  }
};
