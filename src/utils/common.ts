import { createCustomError } from './debug';

declare global {
  var console: { log(...args: any[]): void; error(...args: any[]): void };
  interface ErrorConstructor {
    captureStackTrace(targetObject: object, constructorOpt?: Function): void;
    prepareStackTrace?: ((err: Error, stackTraces: any[]) => any) | undefined;
    stackTraceLimit: number;
  }
  interface ImportMeta {
    url: string;
  }
}

export function Narrow<T extends R, R = unknown>(value: R): asserts value is T {}
export function AssertTypesEq<A extends B, B>(
  ...args: [B] extends [A] ? [] : [RIGHT_TYPES_NOT_ASSIGNABLE_TO_LEFT: Exclude<B, A>]
) {}

// prettier-ignore
type indexof<A> = A extends readonly any[] ? A extends 0 ? any : keyof A & number : A extends Set<unknown> ? never : A extends Map<infer U, unknown> ? U 
	: A extends Iterable<unknown> ? never : A extends object ? keyof A & (number | string) : never;
// prettier-ignore
type valueof<A> = A extends ReadonlyArray<infer U> ? A extends 0 ? any : U : A extends Set<infer U> ? U : A extends Map<unknown, infer U> ? U 
	: A extends Iterable<infer U> ? U : A extends object ? A[keyof A & (number | string)] : never;
// prettier-ignore
type vObject<V extends unknown = unknown, K extends unknown = unknown> = | object | readonly V[] | { [key: string]: V } | anySet<V> | anyMap<K, V>;
export type itfn<A, R> = (value: valueof<A>, key: indexof<A>) => R;
type anySet<V extends unknown = unknown> = Set<V>;
type anyMap<K extends unknown = unknown, V extends unknown = unknown> = Map<K, V>;
type anyfunction<A extends any[] = unknown[], R = unknown> = (...args: A) => R;
type objlike = object | anyfunction;
type anymap<K extends unknown = unknown, V extends unknown = unknown> = K extends objlike
  ? Map<K, V> | WeakMap<K, V>
  : Map<K, V>;

export function exit(message: string, ...ctx: any[]): never {
  if (ctx.length > 0) console.log('Error context:', { ...ctx });
  throw createCustomError({ message });
}
exit.never = function never(...ctx: any[]): never {
  exit('Reached unreachable code', ...ctx);
};
export function assert(predicate: boolean, err?: string, ...ctx: any[]): asserts predicate {
  __DEV__: if (typeof predicate !== 'boolean') exit('Expected boolean', predicate);
  if (false === predicate) exit(err ?? 'Assertion failed', ...ctx);
}
export function Identity<T>(v: T): T {
  return v;
}

// Optimize: Inline length check to avoid function call overhead
export function last_of<T extends ArrayLike<any>>(
  arr: T
): T extends readonly [...infer A, infer U] ? U : T[number] {
  __DEV__: {
    if (!isArrayLike(arr)) exit('Expected Array');
    if (arr.length === 0) exit('Attempted to retrieve last item of an empty array', arr);
  }
  return arr[arr.length - 1];
}

export function maybe_last_of<T extends readonly any[] | undefined>(
  arr: T
): T extends any[] ? (T extends readonly [...infer A, infer U] ? U : T[number]) : undefined {
  return (arr && arr.length > 0 ? arr[arr.length - 1] : undefined) as any;
}

export function normPath(filepath: string) {
  return filepath.replace(/^file:\/\/\//, '').replace(/\\\\?/g, '/');
}

export function print_string(str: string) {
  return /[\u0000-\u0020]/.test(str)
    ? str
        .replace(/ /g, '•')
        .replace(/\n/g, '↲')
        .replace(/\t/g, '╚')
        .replace(/[\u0000-\u0020]/g, '□')
    : str;
}

function isArrayLike(value: any): value is ArrayLike<unknown> {
  return is_object(value) && oisArrayLike(value);
}

function oisArrayLike(value: {}): value is ArrayLike<unknown> {
  return 'length' in value && (0 === (value as any).length || '0' in value);
}

export function binarySearchIn<T extends {}>(
  array: ArrayLike<T>,
  target: number,
  toValue: (item: T) => number
) {
  if (isEmpty(array)) return -1;
  let i = 0;
  let low = 0;
  let high = array.length - 1;
  let value = toValue(array[high]);
  if (target >= value) return high;
  else high--;
  while (low <= high) {
    i = low + ((high - low) >> 1);
    value = toValue(array[i]);
    if (target === value) return i;
    if (target > value) low = i + 1;
    else high = i - 1;
  }
  return low - 1;
}

export function getTerminalWidth(fallbackWidth = 200) {
  return globalThis?.process?.stdout?.columns ?? fallbackWidth;
}

// @ts-ignore
const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';
export const color = ((cfn, mfn) => ({
  black: cfn(30),
  red: cfn(31),
  green: cfn(32),
  yellow: cfn(33),
  blue: cfn(34),
  magenta: cfn(35),
  cyan: cfn(36),
  white: cfn(37),
  grey: cfn(90),
  bold: mfn(1, 22),
  italic: mfn(3, 23),
  underline: mfn(4, 24),
  hidden: mfn(8, 28),
  hiddenCursor: (str: string) => `\x1B[?25l${str}\x1B[?25h`,
  unstyle: (str: string) => str.replace(/\x1B\[[0-9][0-9]?m/g, ''),
  unstyledLength: (str: string) => str.replace(/\x1B\[[0-9][0-9]?m/g, '').length,
  link: (str: string) => color.underline(color.blue(str))
}))(
  (c1: number) =>
    isBrowser
      ? Identity
      : (str: string) => `\x1B[${c1}m${str.replace(/\x1B\[39m/g, `\x1B[${c1}m`)}\x1B[39m`,
  (c1: number, c2: number) =>
    isBrowser ? Identity : (str: string) => `\x1B[${c1}m${str}\x1B[${c2}m`
);
export function Map_get<K extends object, V>(map: WeakMap<K, V>, key: K, init: (key: K) => V): V;
export function Map_get<K, V>(map: Map<K, V>, key: K, init: (key: K) => V): V;
export function Map_get<K, V>(map: anymap<K, V>, key: K, init: (key: K) => V): V {
  if (!map.has(key)) map.set(key, init(key));
  return map.get(key)!;
}
export function isEmpty(array: ArrayLike<any>): boolean {
  __DEV__: assert(isArrayLike(array));
  return 0 === array.length;
}
export function Array_splice<T extends any[]>(
  array: T,
  target: T[number],
  index: number = array.indexOf(target)
) {
  __DEV__: {
    const i = arguments.length === 2 ? array.indexOf(target) : index;
    assert(i === index && i !== -1 && i === array.lastIndexOf(target), '', {
      array,
      target,
      index,
      i
    });
  }
  array.splice(index, 1);
}
export function Array_replace<T extends any[]>(
  array: T,
  target: T[number],
  ...replacements: T[number][]
) {
  const i = array.indexOf(target);
  __DEV__: if (i === -1 || i !== array.lastIndexOf(target))
    exit('Array_replace', {
      index: i,
      lastIndex: array.lastIndexOf(target),
      array,
      target,
      replacements
    });
  array.splice(array.indexOf(target), 1, ...replacements);
}
export function has_key_defined<T extends object, K extends T extends never ? never : keyof T>(
  o: T,
  k: K
): o is K extends never
  ? never
  : T extends { [k in K]: any }
    ? T & { [k in K]: {} }
    : T extends { [k in K]?: any }
      ? T & { [k in K]: {} }
      : never {
  return k in o && undefined !== o[k];
}

export function is_object(
  data: unknown
): data is object | ({ [key: string]: unknown } | unknown[]) {
  return 'object' === typeof data && null !== data;
}

export function is_array(data: unknown): data is any[] {
  return Array.isArray(data);
}

function ois_vobject(data: any) {
  __DEV__: assert(is_object(data));
  switch (data.constructor) {
    case Array:
    case Object:
    case Set:
    case Map:
      return true;
    default:
      return false;
  }
}

// Optimize: Use for-of instead of indexed access for arrays
export function each<A extends vObject>(data: A, callback: itfn<A, void>): void;
export function each(data: any, callback: (value: any, index: any) => void): void {
  __DEV__: assert(ois_vobject(data));
  // prettier-ignore
  switch (data.constructor) {
		case Array: {
			const len = data.length;
			for (let i = 0; i < len; i++) callback(data[i], i);
			return;
		}
		case Object: {
			for (const k in data) {
				if (Object.prototype.hasOwnProperty.call(data, k)) {
					callback(data[k], k);
				}
			}
			return;
		}
		case Set: { for (const d of data) callback(d, undefined!); return; }
		case Map: { for (const [k, v] of data) callback(v, k); return; }
		default:  { for (const x of data) callback(x, undefined!); return; }
	}
}

export function iLast(index: number, array: any[]) {
  return 1 + index === array.length;
}

export function find_last<T>(arr: T[], test: itfn<T[], boolean>): T | undefined {
  for (var i = arr.length; --i !== -1; ) if (test(arr[i], i)) return arr[i];
}

export function try_eval<T>(fn: () => T): T | undefined {
  try {
    return fn();
  } catch (e) {
    return undefined;
  }
}

export function clamp(min: number, max: number, value: number) {
  return value > min ? (value < max ? value : max) : min;
}

export type MaybeFlatten<T> = T extends ReadonlyArray<infer U> ? MaybeFlatten<Exclude<U, T>> : T;
export type FlatArray<T> = MaybeFlatten<T>[];
// Optimize: Use iterative flattening to avoid recursion overhead
export function flat<T extends readonly any[]>(arr: T): FlatArray<T> {
  const result: any[] = [];
  const stack: any[] = [arr];

  while (stack.length > 0) {
    const current = stack.pop()!;
    for (let i = current.length - 1; i >= 0; i--) {
      const item = current[i];
      if (Array.isArray(item)) {
        stack.push(item);
      } else {
        result.unshift(item);
      }
    }
  }

  return result as FlatArray<T>;
}

export function flatMap<T extends readonly any[], R>(
  arr: T,
  mapFn: (item: T[number], index: number, array: T) => R
): FlatArray<R> {
  const result: any[] = [];
  for (let i = 0; i < arr.length; i++) {
    const mapped = mapFn(arr[i], i, arr);
    if (Array.isArray(mapped)) {
      result.push(...mapped);
    } else {
      result.push(mapped);
    }
  }
  return result as FlatArray<R>;
}

export function joinln(...arr: string[]): string {
  return arr.join('\n');
}

export function join_lines(fn: () => Generator<string, void, void>): string {
  return [...fn()].join('\n');
}

export function reduce_tagged_template<T>(
  args: [strings: TemplateStringsArray, ...values: T[]],
  map: (value: T) => string
) {
  for (var str = '' + args[0][0], i = 1; i < args.length; i++)
    str += map(args[i] as T) + args[0][i];
  return str;
}

export function map_tagged_template<T, R>(
  args: [strings: TemplateStringsArray, ...values: T[]],
  map: (value: T) => R
) {
  const arr: (R | string)[] = [args[0][0]];
  for (var i = 1; i < args.length; i++) arr.push(map(args[i] as T), args[0][i]);
  return arr;
}

export function spliceAll<T extends any[]>(array: T): [...T] {
  const r: [...T] = [...array];
  array.length = 0;
  return r;
}

export function spread<R>(fn: () => Iterable<R>): R[] {
  return [...fn()];
}
