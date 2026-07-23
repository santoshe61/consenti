export type NonEmptyArray<T> = [T, ...T[]]

/**
 * Deep-partial with JSON Merge Patch (RFC 7396) delete semantics: any key may be
 * set to `null` instead of its usual type to signal "delete this key" when the
 * partial is applied with `deepMerge()` — `undefined`/omitted keeps the base
 * value, `null` removes it. Only meaningful for object/map keys (e.g. removing
 * a `CategoryMap`/`CookieMap` entry via `profileOverride`); array elements are
 * merged positionally and don't support deletion this way.
 */
export type DeepPartial<T> = T extends Function
    ? T
    : T extends Array<infer InferredArrayType>
    ? Array<DeepPartial<InferredArrayType>>
    : T extends ReadonlyArray<infer InferredReadonlyArrayType>
    ? ReadonlyArray<DeepPartial<InferredReadonlyArrayType>>
    : T extends object
    ? { [Key in keyof T]?: DeepPartial<T[Key]> | null }
    : T;

export type DeepPartialF<T> =
    T extends Function
    ? T
    : T extends readonly (infer U)[]
    ? readonly DeepPartial<U>[]
    : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;
