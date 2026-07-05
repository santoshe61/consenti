type AnyFunction = (this: any, ...args: any[]) => any;

/**
 * Creates a debounced version of a function.
 *
 * A debounced function delays execution until after the specified delay has
 * elapsed since the last invocation. Each new call resets the timer.
 *
 * This is useful for events that fire frequently, such as:
 * - Search input
 * - Window resize
 * - Auto-save
 * - API requests
 *
 * @template T - Type of the function being debounced.
 *
 * @param fn - The function to debounce.
 * @param delay - Delay in milliseconds to wait after the last invocation.
 *
 * @returns A debounced function with the same parameter types as the original.
 *
 * @example
 * ```ts
 * const search = debounce((query: string) => {
 *   console.log(query);
 * }, 300);
 *
 * search("r");
 * search("re");
 * search("react");
 * // Only "react" is logged after 300ms.
 * ```
 */
export function debounce<T extends AnyFunction>(
    fn: T,
    delay: number
) {
    let timer: ReturnType<typeof setTimeout> | undefined;

    return function (
        this: ThisParameterType<T>,
        ...args: Parameters<T>
    ): void {
        if (timer !== undefined) {
            clearTimeout(timer);
        }

        timer = setTimeout(() => {
            fn.apply(this, args);
        }, delay);
    };
}