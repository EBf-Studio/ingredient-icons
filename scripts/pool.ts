/** Runs `run` on every item, at most `size` at a time. */
export async function pool<T>(items: readonly T[], size: number, run: (item: T) => Promise<void>) {
  const queue = [...items]
  await Promise.all(
    Array.from({ length: Math.min(size, queue.length) }, async () => {
      for (let item = queue.shift(); item !== undefined; item = queue.shift()) await run(item)
    }),
  )
}
