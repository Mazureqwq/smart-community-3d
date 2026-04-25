import {
  VueTypeValidableDef,
  VueTypesInterface,
  createTypes,
  toValidableType,
} from "vue-types";
import { CSSProperties } from "vue";

type PropTypes = VueTypesInterface & {
  readonly style: VueTypeValidableDef<CSSProperties>;
};
const newPropTypes = createTypes({
  func: undefined,
  bool: undefined,
  string: undefined,
  number: undefined,
  object: undefined,
  integer: undefined,
}) as PropTypes;

class propTypes extends newPropTypes {
  static get style() {
    return toValidableType("style", {
      type: [String, Object],
    });
  }
}

export { propTypes };

export type Nullable<T> = T | null;

export type ElRef<T extends HTMLElement = HTMLDivElement> = Nullable<T>;

export const is = (val: unknown, type: string) => {
  return toString.call(val) === `[object ${type}]`;
};
export const isString = (val: unknown): val is string => {
  return is(val, "String");
};
