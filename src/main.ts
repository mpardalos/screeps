import { ErrorMapper } from "utils/ErrorMapper";

declare global {
  /*
    Example types, expand on these or remove them and add your own.
    Note: Values, properties defined here do no fully *exist* by this type definiton alone.
          You must also give them an implemention if you would like to use them. (ex. actually setting a `role` property in a Creeps memory)

    Types added in this `global` block are in an ambient, global context. This is needed because `main.ts` is a module file (uses import or export).
    Interfaces matching on name from @types/screeps will be merged. This is how you can extend the 'built-in' interfaces from @types/screeps.
  */
  // Memory extension samples
  interface Memory {
    nextNameIdx: number;
  }

  type RoleName = "harvester" | "upgrader";

  interface HarvesterMemory {
    role: "harvester";
  }

  interface UpgraderMemory {
    role: "upgrader";
    state: "harvesting" | "upgrading";
  }

  interface CreepMemory {
    roleData: HarvesterMemory | UpgraderMemory;
  }

  interface Role {
    count: number;
    body: BodyPartConstant[];
    initMemory?: any;
    run: (creep: Creep) => void;
  }

  // Syntax for adding proprties to `global` (ex "global.log")
  namespace NodeJS {
    interface Global {
      log: any;
    }
  }
}

if (Memory.nextNameIdx === undefined) {
  Memory.nextNameIdx = 0;
}

function nextName(basename: string) {
  const val = `${basename}${Memory.nextNameIdx}`;
  Memory.nextNameIdx += 1;
  return val;
}

const primarySpawn = Game.spawns["Spawn1"];

const roles: { [name in RoleName]: Role } = {
  harvester: {
    count: 5,
    body: [WORK, MOVE, CARRY],
    run: function (creep: Creep) {
      if (creep.store.getFreeCapacity() > 0) {
        creep.say("harvesting");
        var sources = creep.room.find(FIND_SOURCES);
        if (creep.harvest(sources[0]) == ERR_NOT_IN_RANGE) {
          creep.moveTo(sources[0]);
        }
      } else {
        creep.say("depositing");
        if (creep.transfer(Game.spawns["Spawn1"], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
          creep.moveTo(Game.spawns["Spawn1"]);
        }
      }
    }
  },
  upgrader: {
    count: 5,
    body: [WORK, MOVE, CARRY],
    initMemory: { state: "harvesting" },
    run: function (creep) {
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
  }
};

class ScreepsError extends Error {
  errcode: ScreepsReturnCode;
  title: string;

  constructor(errcode: ScreepsReturnCode, message: string) {
    let title;
    switch (errcode) {
      case OK:
        title = "OK";
        break;
      case ERR_NOT_OWNER:
        title = "ERR_NOT_OWNER";
        break;
      case ERR_NAME_EXISTS:
        title = "ERR_NAME_EXISTS";
        break;
      case ERR_BUSY:
        title = "ERR_BUSY";
        break;
      case ERR_NOT_ENOUGH_ENERGY:
        title = "ERR_NOT_ENOUGH_ENERGY";
        break;
      case ERR_INVALID_ARGS:
        title = "ERR_INVALID_ARGS";
        break;
      case ERR_RCL_NOT_ENOUGH:
        title = "ERR_RCL_NOT_ENOUGH";
        break;
      case ERR_INVALID_TARGET:
        title = "ERR_INVALID_TARGET";
        break;
      case ERR_NOT_IN_RANGE:
        title = "ERR_NOT_IN_RANGE";
        break;
      default:
        title = `${errcode}`;
        break;
    }
    super(`${message} (${title})`);

    this.errcode = errcode;
    this.title = title;
  }
}

function is_errcode(e: any, errcode: ScreepsReturnCode): boolean {
  return (e instanceof ScreepsError && e.errcode === errcode)
}

function spawnRole(spawn: StructureSpawn, roleName: RoleName) {
  const role = roles[roleName];

  const canSpawn = spawn.spawnCreep(role.body, "__DOES_NOT_EXIST__", { dryRun: true });
  if (canSpawn !== OK) {
    throw new ScreepsError(canSpawn, "Could not spawn creep");
  }

  const name = nextName(roleName);
  console.log(`Spawning ${name}`);

  const result = spawn.spawnCreep(role.body, name, { memory: { roleData: { role: roleName, ...role.initMemory } } });
  if (result !== OK) {
    throw new ScreepsError(canSpawn, "Tried to spawn creep but failed");
  }
}

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
  const spawn = Game.spawns["Spawn1"];

  // Automatically delete memory of missing creeps
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      console.log(`${name} is gone. Cleaning up memory`);
      delete Memory.creeps[name];
    }
  }

  for (let roleNameString in roles) {
    const roleName = roleNameString as RoleName;
    const role = roles[roleName];

    const currentCount = _.filter(Game.creeps, c => c.memory.roleData.role === roleName).length;
    const shouldSpawn = currentCount < role.count;

    if (shouldSpawn) {
      try {
        spawnRole(spawn, roleName);
      } catch (e) {
        if (is_errcode(e, ERR_NOT_ENOUGH_ENERGY)) {
          // OK
        } else {
          console.log(`Error spawning ${roleName} from ${spawn}.\n${e}`);
        }
      }
    }
  }

  for (const name in Game.creeps) {
    const creep = Game.creeps[name];
    const roleName = Memory.creeps[name].roleData.role;

    if (creep.spawning) {
      // Do not try to act on creeps still being spawned.
      continue;
    }

    try {
      roles[roleName].run(creep);
    } catch (e) {
      console.log(`Error running ${roleName} on ${creep}.\n${e}`);
    }
  }
});
