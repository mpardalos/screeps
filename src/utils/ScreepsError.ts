export class ScreepsError extends Error {
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
      case ERR_FULL:
        title = "ERR_FULL";
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

export function is_errcode(e: any, errcode: ScreepsReturnCode): boolean {
  return (e instanceof ScreepsError && e.errcode === errcode)
}
