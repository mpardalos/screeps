if (Memory['nextNameIdx'] !== undefined) {
    Memory.nextName_idx = 0;
}

function nextName(basename) {
    const val = `${basename}${Memory.nextNameIdx}`;
    Memory.nextNameIdx += 1;
    return val;
}

const primarySpawn = Game.spawns['Spawn1'];

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
    },
    upgrader: {
        count: 5,
        body: [WORK, MOVE, CARRY],
        initMemory: { state: 'harvesting' },
        run: function (creep) {
            const state = creep.memory.state;
            creep.say(state);
            switch (state) {
                case 'harvesting':
                    if (creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                        const harvestSource = creep.room.find(FIND_SOURCES)[0];
                        const result = creep.harvest(harvestSource);
                        switch (result) {
                            case OK: break;
                            case ERR_NOT_IN_RANGE:
                                creep.moveTo(harvestSource);
                                break;
                            default:
                                throw new ScreepsError(result, 'Could not harvest for upgrading');
                        }
                    } else {
                        creep.memory.state = 'upgrading'
                    }
                    break;
                case 'upgrading':
                    const result = creep.upgradeController(creep.room.controller);
                    switch (result) {
                        case OK: break;
                        case ERR_NOT_IN_RANGE:
                            creep.moveTo(creep.room.controller);
                            break;
                        case ERR_NOT_ENOUGH_RESOURCES:
                            creep.memory.state = 'harvesting';
                            break;
                        default:
                            throw new ScreepsError(result, 'Could not upgrade controller');
                            break;
                    }
            }
        }
    }
}

class ScreepsError extends Error {
    constructor(errcode, message) {
        let title;
        switch (errcode) {
            case OK: title = 'OK'; break;
            case ERR_NOT_OWNER: title = 'ERR_NOT_OWNER'; break;
            case ERR_NAME_EXISTS: title = 'ERR_NAME_EXISTS'; break;
            case ERR_BUSY: title = 'ERR_BUSY'; break;
            case ERR_NOT_ENOUGH_ENERGY: title = 'ERR_NOT_ENOUGH_ENERGY'; break;
            case ERR_INVALID_ARGS: title = 'ERR_INVALID_ARGS'; break;
            case ERR_RCL_NOT_ENOUGH: title = 'ERR_RCL_NOT_ENOUGH'; break;
            case ERR_INVALID_TARGET: title = 'ERR_INVALID_TARGET'; break;
            case ERR_NOT_IN_RANGE: title = 'ERR_NOT_IN_RANGE'; break;
            default: title = `${errcode}`; break;
        }
        super(`${message} (${title})`)

        this.errcode = errcode;
        this.title = title;
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

    const result = spawn.spawnCreep(role.body, name, { memory: { role: roleName, ...role.initMemory } });
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
                switch (e.errcode) {
                    case ERR_NOT_ENOUGH_ENERGY: break;
                    default:
                        console.log(`Error spawning ${roleName} from ${spawn}.\n${e}`)
                        break;
                }
            }
        }
    }

    for (const name in Game.creeps) {
        const creep = Game.creeps[name];
        const roleName = Memory.creeps[name].role;
        try {
            roles[roleName].run(creep);
        } catch (e) {
            console.log(`Error running ${roleName} on ${creep}.\n${e}`)
        }
    }
}
