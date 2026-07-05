export type NonEmptyArray<T> = [T, ...T[]]

export type DeepPartial<T> = T extends Function
    ? T
    : T extends Array<infer InferredArrayType>
    ? Array<DeepPartial<InferredArrayType>>
    : T extends ReadonlyArray<infer InferredReadonlyArrayType>
    ? ReadonlyArray<DeepPartial<InferredReadonlyArrayType>>
    : T extends object
    ? { [Key in keyof T]?: DeepPartial<T[Key]> }
    : T;

export type DeepPartialF<T> =
    T extends Function
    ? T
    : T extends readonly (infer U)[]
    ? readonly DeepPartial<U>[]
    : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;
