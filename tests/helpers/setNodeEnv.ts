/**
 * Assign `process.env.NODE_ENV` under Next's readonly ProcessEnv typing.
 * Prefer this over direct assignment in tests (TS2540).
 */
export function setNodeEnv(
  value: NodeJS.ProcessEnv["NODE_ENV"] | undefined,
): void {
  Object.defineProperty(process.env, "NODE_ENV", {
    value,
    writable: true,
    configurable: true,
    enumerable: true,
  });
}
