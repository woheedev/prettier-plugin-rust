import {
  Attribute,
  AttributeOrDocComment,
  Comment,
  DocCommentAttribute,
  LocArray,
  MemberExpression,
  Node,
  SourceFile
} from 'jinx-rust';
import { PickProps } from 'jinx-rust/utils';
import type { Doc, ParserOptions, Printer } from 'prettier';
import doc from 'prettier/doc.js';
import { AssertTypesEq } from '../utils/common';

export type { Doc, ParserOptions, Plugin, Printer } from 'prettier';

declare module 'prettier/doc.js' {
  namespace utils {
    function canBreak(doc: Doc): boolean;
  }
}

export const {
  join,
  line,
  softline,
  hardline,
  literalline,
  group,
  conditionalGroup,
  fill,
  lineSuffix,
  lineSuffixBoundary,
  cursor,
  breakParent,
  ifBreak,
  trim,
  indent,
  indentIfBreak,
  align,
  addAlignmentToDoc,
  markAsRoot,
  dedentToRoot,
  dedent,
  hardlineWithoutBreakParent,
  literallineWithoutBreakParent,
  label
} = doc.builders;

export const {
  willBreak,
  traverseDoc,
  findInDoc,
  mapDoc,
  removeLines,
  stripTrailingHardline,
  canBreak
} = doc.utils;

// These functions don't exist in Prettier's public API, provide fallbacks
const utilsAny = doc.utils as any;

// isConcat: Check if a doc is a concat (array of docs)
export const isConcat: (doc: Doc) => boolean =
  utilsAny.isConcat || ((doc: Doc) => Array.isArray(doc) && doc.length > 0);

// getDocParts: Extract parts from a concat doc
export const getDocParts: (doc: Doc) => Doc[] =
  utilsAny.getDocParts ||
  ((doc: Doc) => {
    if (Array.isArray(doc)) return doc;
    if (doc && typeof doc === 'object' && 'parts' in doc) return (doc as any).parts;
    return [doc];
  });

// propagateBreaks: Propagate break information through doc
export const propagateBreaks: (doc: Doc) => void = utilsAny.propagateBreaks || (() => {});

// normalizeParts: Normalize an array of doc parts
export const normalizeParts: (parts: Doc[]) => Doc[] =
  utilsAny.normalizeParts || ((parts: Doc[]) => parts);

// normalizeDoc: Normalize a doc structure
export const normalizeDoc: (doc: Doc) => Doc = utilsAny.normalizeDoc || ((doc: Doc) => doc);

// cleanDoc: Clean/normalize a doc (identity function as fallback)
export const cleanDoc: (doc: Doc) => Doc = utilsAny.cleanDoc || ((doc: Doc) => doc);

export const Symbol_comments = Symbol.for('comments');

export interface CustomOptions extends ParserOptions<Node> {
  [Symbol_comments]: AnyComment[];
  rsParsedFile: SourceFile;
  commentSpans: Map<number, number>;
  printer: Printer<Node>;
  cursorNode: any;

  comments: Comment[];
  danglingAttributes: AttributeOrDocComment[];
  actuallyMethodNodes: WeakSet<MemberExpression>;
}

export type NodeWithComments<T extends Node> = T & { comments: AnyComment[] };
export interface MutatedComment extends Comment, PrettierCommentInfo {}
export interface MutatedAttribute extends Attribute, PrettierCommentInfo {}
export interface MutatedDocComment extends DocCommentAttribute, PrettierCommentInfo {}
export type AnyComment = MutatedComment | MutatedAttribute | MutatedDocComment;

type keyofDelimitedArrayProps<T> = T extends never
  ? never
  : keyof PickProps<T, LocArray<any, '()' | '[]' | '{}' | '<>'>>;

__DEV__: AssertTypesEq<keyof typeof DCM, keyofDelimitedArrayProps<Node>>();

export enum DCM {
  'arguments' = 'arguments',
  'parameters' = 'parameters',
  'items' = 'items',
  'properties' = 'properties',
  'members' = 'members',
  'body' = 'body',
  'cases' = 'cases',
  'typeArguments' = 'typeArguments',
  'ltParameters' = 'ltParameters',
  'generics' = 'generics',
  'specifiers' = 'specifiers',
  'rules' = 'rules',
  'match' = 'match',
  'transform' = 'transform',
  'segments' = 'segments'
}

export interface PrettierCommentInfo {
  trailing: boolean;
  leading: boolean;
  unignore: boolean;
  printed: boolean;
  placement: 'ownLine' | 'endOfLine' | 'remaining';
  // nodeDescription?: any;
  marker?: DCM;
}

export interface AstPath<T = Node> {
  stack: (Node | string | number)[];
  callParent<R>(callback: (path: this) => R, count?: number): R;
  getName(): PropertyKey | null;
  getValue(): T;
  getNode(count?: number): T | null;
  getParentNode(count?: number): T | null;

  match(
    ...predicates: ((node: Node, name: string | null, number: number | null) => boolean)[]
  ): boolean;

  call<R>(
    callback: (path: AstPath, index: number, value: any) => R,
    ...props: (string | number)[]
  ): R;
  each(
    callback: (path: AstPath, index: number, value: any) => void,
    ...props: (string | number)[]
  ): void;
  map<R>(
    callback: (path: AstPath, index: number, value: any) => R,
    ...props: (string | number)[]
  ): R[];
}
