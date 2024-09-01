import { ScreepsError } from "./ScreepsError";

export function runRoleOnEach(roleName: RoleName, creeps: Creep[], fun: (creep: Creep) => void) {
  creeps.forEach(creep => {
    try {
      fun(creep);
    } catch (e) {
      console.log(`Error running ${roleName} on ${creep}.\n${e}`);
    }
  });
}

export function claimSource(creep: Creep): Source {
  if (Memory.harvesters === undefined) {
    Memory.harvesters = {};
  }

  const sources = creep.room.find(FIND_SOURCES);

  sources.forEach(source => {
    if (Memory.harvesters[source.id] === undefined) {
      Memory.harvesters[source.id] = [];
    }
  });

  const source = _.min(sources, source => Memory.harvesters[source.id].length);
  Memory.harvesters[source.id].push(creep.id);
  return source;
}

export function releaseSource(creep: Creep, source: Source): void {
  const idx = Memory.harvesters[source.id].findIndex(id => id === creep.id);
  if (idx >= 0) {
    Memory.harvesters[source.id].splice(idx, 1);
  }
}

/// Move to the specified source and harvest until the creep's store is full
/// Returns 'OK' if able to harvest or 'FULL' otherwise
export function harvestUntilFull(creep: Creep, source: Source): "OK" | "FULL" {
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
    return "OK";
  }
  return "FULL";
}

export function upgradeUntilEmpty(creep: Creep, controller: StructureController): "OK" | "EMPTY" {
  const result = creep.upgradeController(controller);
  switch (result) {
    case ERR_NOT_IN_RANGE:
      creep.moveTo(controller);
      // fallthrough
    case OK:
      return "OK";
    case ERR_NOT_ENOUGH_RESOURCES:
      return "EMPTY";
    default:
      throw new ScreepsError(result, "Could not upgrade controller");
  }
}

/// Move to the given spawn and deposit all carried resources there.
///
/// Returns:
/// 'OK' if able to transfer or moving to the spawn
/// 'EMPTY' if out of resources
/// 'FULL' if attempted to transfer but the spawn was full
export function depositUntilEmpty(creep: Creep, spawn: StructureSpawn): "OK" | "EMPTY" | "FULL" {
  const result = creep.transfer(spawn, RESOURCE_ENERGY);
  switch (result) {
    case ERR_NOT_IN_RANGE:
      creep.moveTo(spawn);
      return "OK"
    case OK:
      return "OK";
    case ERR_FULL:
      return "FULL";
    case ERR_NOT_ENOUGH_RESOURCES:
      return "EMPTY";
    default:
      throw new ScreepsError(result, "Could not transfer resources");
  }
}
