if (Memory['nextNameIdx'] !== undefined) {
    Memory.nextName_idx = 0;
}

function nextName(basename) {
    const val = `${basename}${Memory.nextNameIdx}`;
    Memory.nextNameIdx += 1;
    return val;
}

const roles = {
    harvester: {
        count: 5,
        body: [WORK, MOVE, CARRY],
        run: function (creep) {
            if (creep.store.getFreeCapacity() > 0) {
                creep.say('Harvesting');
                var sources = creep.room.find(FIND_SOURCES);
                if (creep.harvest(sources[0]) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(sources[0]);
                }
            }
            else {
                creep.say('Depositing');
                if (creep.transfer(Game.spawns['Spawn1'], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(Game.spawns['Spawn1']);
                }
            }
        }
    }
}

class ScreepsError extends Error {
    constructor(errcode, message) {
        let title, details;
        switch (errcode) {
            case 0:
                title = 'OK';
                details = 'The operation has been scheduled successfully.';
                break;
            case ERR_NOT_OWNER:
                title = 'ERR_NOT_OWNER';
                details = 'You are not the owner of this spawn.';
                break;
            case ERR_NAME_EXISTS:
                title = 'ERR_NAME_EXISTS';
                details = 'There is a creep with the same name already.';
                break;
            case ERR_BUSY:
                title = 'ERR_BUSY';
                details = 'The spawn is already in process of spawning another creep.';
                break;
            case ERR_NOT_ENOUGH_ENERGY:
                title = 'ERR_NOT_ENOUGH_ENERGY';
                details = 'The spawn and its extensions contain not enough energy to create a creep with the given body.';
                break;
            case ERR_INVALID_ARGS:
                title = 'ERR_INVALID_ARGS';
                details = 'Body is not properly described or name was not provided.';
                break;
            case ERR_RCL_NOT_ENOUGH:
                title = 'ERR_RCL_NOT_ENOUGH';
                details = 'Your Room Controller level is insufficient to use this spawn.';
                break;
            default:
                title = `${errcode}`;
                details = "Unknown error code";
                break;
        }
        super(`${message} (${title}: ${details})`)

        this.errcode = errcode;
        this.title = title;
        this.details = details;
    }
}

function spawnRole(spawn, roleName) {
    const role = roles[roleName];

    const canSpawn = spawn.spawnCreep(role.body, '__DOES_NOT_EXIST__', { dryRun: true });
    if (canSpawn !== OK) {
        throw new ScreepsError(canSpawn, 'Could not spawn creep');
    }

    const name = nextName(roleName);
    console.log(`Spawning ${name}`);

    const result = spawn.spawnCreep(role.body, name, { memory: { role: roleName } });
    if (result !== OK) {
        throw new ScreepsError(canSpawn, 'Tried to spawn creep but failed');
    }
}

module.exports.loop = function () {
    const spawn = Game.spawns['Spawn1'];

    for (const [roleName, role] of Object.entries(roles)) {
        const currentCount = _.filter(Game.creeps, c => c.memory.role === roleName).length;
        const shouldSpawn = currentCount < role.count;

        if (shouldSpawn) {
            try {
                spawnRole(spawn, roleName);
            } catch (e) {
                if (e instanceof ScreepsError && e.title === 'ERR_NOT_ENOUGH_ENERGY') {
                    // OK
                } else {
                    throw e;
                }

            }
        }
    }

    for (const name in Game.creeps) {
        const creep = Game.creeps[name];
        const roleName = Memory.creeps[name].role;
        roles[roleName].run(creep);
    }
}
