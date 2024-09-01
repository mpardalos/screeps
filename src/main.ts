import { ErrorMapper } from "utils/ErrorMapper";
import { ScreepsError, is_errcode } from "utils/ScreepsError";
import { harvester } from "roles/harvester";
import { upgrader } from "roles/upgrader";

if (Memory.nextNameIdx === undefined) {
  Memory.nextNameIdx = 0;
}

function nextName(basename: string) {
  const val = `${basename}${Memory.nextNameIdx}`;
  Memory.nextNameIdx += 1;
  return val;
}

const roles: { [name in RoleName]: Role } = { harvester, upgrader };

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
        } else if (is_errcode(e, ERR_BUSY)) {
          // OK
        } else {
          console.log(`Error spawning ${roleName} from ${spawn}.\n${e}`);
        }
      }
      break;
    }
  }

  for (let roleNameString in roles) {
    const roleName = roleNameString as RoleName;

    const creeps = _.filter(Game.creeps, creep => creep.memory.roleData.role === roleName);

    try {
      roles[roleName].run(creeps);
    } catch (e) {
      console.log(`Error running ${roleName}.\n${e}`);
    }
  }
});
