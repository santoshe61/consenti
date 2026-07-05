type AnyFunction = (this: any, ...args: any[]) => any;

/**
 * Creates a throttled version of a function.
 *
 * A throttled function executes immediately and then ignores subsequent calls
 * until the specified delay has passed.
 *
 * This is useful for events that fire continuously, such as:
 * - Scroll
 * - Mouse move
 * - Window resize
 * - Drag events
 *
 * @template T - Type of the function being throttled.
 *
 * @param fn - The function to throttle.
 * @param delay - Minimum time in milliseconds between executions.
 *
 * @returns A throttled function with the same parameter types as the original.
 *
 * @example
 * ```ts
 * const onScroll = throttle(() => {
 *   console.log("Scrolled");
 * }, 200);
 *
 * window.addEventListener("scroll", onScroll);
 * ```
 */
export function throttle<T extends AnyFunction>(
    fn: T,
    delay: number
) {
    let lastCall = 0;

    return function (
        this: ThisParameterType<T>,
        ...args: Parameters<T>
    ): void {
        const now = Date.now();

        if (now - lastCall >= delay) {
            lastCall = now;
            fn.apply(this, args);
        }
    };
}