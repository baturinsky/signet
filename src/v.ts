export type Vec2 = [number, number];
export type Vec3 = [number, number, number];
export type Vec4 = [number, number, number, number];
export type Vec = number[];

export const vec4 = (v: Vec, w = 1) => [v[0], v[1], v[2], v.length > 3 ? v[3] : w] as Vec4;
export const vec3 = (v: Vec) => v.length == 3 ? [v[0], v[1], v[2]] : [v[0] / v[3], v[1] / v[3], v[2] / v[3]] as Vec3;

/** Vector's length */
export const len = (v: Vec) => mul(v, v) ** 0.5;
/** Distance between two vectors */
export const dist = <T extends Vec>(v: T, w: T) => len(sub(v, w));
/** Multiply vector by scalar */
export const scale = <T extends Vec>(v: T, n: number) => v.map(x => x * n) as T;
/** Normalise the vector (set it's length to 1)*/
export const norm = <T extends Vec>(v: T, l = 1) => scale(v, l / len(v)) as T;
/** Scalar vector multiplication */
export const mul = (v: Vec, w: Vec) => v.reduce((s, x, i) => s + x * w[i], 0);
/** Multiply respective corrdinates*/
export const mulEach = <T extends Vec>(v: Vec, w: Vec) => v.map((x, i) => x * w[i]) as T;
/** Sum of vectors */
export const sum = <T extends Vec>(v: T, w: T) => v.map((x, i) => x + w[i]) as T;
/** v + w*n */
export const sum2 = <T extends Vec>(v: T, w: T, n: number) => v.map((x, i) => x + w[i] * n) as T;
/** Subtract vector */
export const sub = <T extends Vec>(v: T, w: T) => v.map((x, i) => x - w[i]) as T;
/** Add n to each coordinate */
export const sumn = (v: Vec, n: number) => v.map(x => x + n);
/**Vector [1,0] rotate a radians counter-clockwise */
export const angle2d = (a: number) => [Math.cos(a), Math.sin(a)] as Vec2;
/**Vectors are same */
export const same = <T extends Vec>(v: T, w: T) => v.every((x, i) => x == w[i]);
/** v*(1-n) + w*n */
export const lerp = (v: Vec, w: Vec, n: number) => v.map((x, i) => x * (1 - n) + w[i] * n);
