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
    source: Id<Source>;
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

export {};
