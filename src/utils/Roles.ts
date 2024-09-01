export function runRoleOnEach(roleName: RoleName, creeps: Creep[], fun: (creep: Creep) => void) {
  creeps.forEach(creep => {
    try {
      fun(creep);
    } catch (e) {
      console.log(`Error running ${roleName} on ${creep}.\n${e}`);
    }
  });
}
