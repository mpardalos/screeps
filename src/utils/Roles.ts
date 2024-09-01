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
      Memory.harvesters[source.id] = []
    }
  })

  const source = _.min(sources, source => Memory.harvesters[source.id].length)
  Memory.harvesters[source.id].push(creep.id)
  return source
}

export function releaseSource(creep: Creep, source: Source): void {
  const idx = Memory.harvesters[source.id].findIndex(id => id === creep.id)
  if (idx >= 0) {
    Memory.harvesters[source.id].splice(idx, 1);
  }
}
