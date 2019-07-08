export const PIPE_NAME_STDIN = 'stdin';
export const PIPE_NAME_STDOUT = 'stdout';
export const PIPE_NAME_STDERR = 'stderr';
export const PIPE_NAME_CTRL = 'io-ctrl';
export const PIPE_NAMES = [
  PIPE_NAME_STDIN,
  PIPE_NAME_STDOUT,
  PIPE_NAME_STDERR,
  PIPE_NAME_CTRL
];

export const EVT_PIPE_DATA = 'data';

export const EVT_READY = 'ready';
export const EVT_TICK = 'tick';

export const EVT_BEFORE_EXIT = 'beforeExit';
export const EVT_EXIT = 'exit';

// Typically used for IPC w/ native Web Workers
export const EVT_MESSAGE = 'message';

export const THREAD_TYPE_MAIN = 'main';
export const THREAD_TYPE_WORKER = 'worker';
export const THREAD_TYPES = [
  THREAD_TYPE_MAIN,
  THREAD_TYPE_WORKER
];