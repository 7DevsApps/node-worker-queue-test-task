/** payload.forceFailure: true = always fail, false = always succeed, undefined = 40% random */
export async function processJob(payload: Record<string, unknown>): Promise<number> {
  const durationMs = Math.random() * 2000 + 500;
  await new Promise((resolve) => setTimeout(resolve, durationMs));

  const shouldFail =
    payload.forceFailure === true ? true :
    payload.forceFailure === false ? false :
    Math.random() < 0.4;

  if (shouldFail) {
    throw new Error('Simulated processing failure');
  }

  return durationMs;
}
