import $ from './utils/chain';
import { type, map, append, pure, flatMap } from 'funcadelic';
import { view, set, over, lensPath, lensTreeValue } from './lens';
import Tree, { prune, graft } from './utils/tree';
import transitionsFor from './utils/transitions-for';
import { reveal } from './utils/secret';
import types, { params, any, toType } from './types';
import isSimple  from './is-simple';
import desugar from './desugar';
import thunk from './thunk';
import Microstate from './microstate';
import { stateAt, childrenAt } from './typeclasses/location';

export default function analyze(Type, value) {
  let topValue = value != null ? value.valueOf() : value;
  let tree = pure(Tree, new Node({ Type, path: [], root: topValue}));

  return flatMap((node) => {
    let { Type, value: valueAt } = node;

    let uninitialized = new Tree({
      data: () => node,
      children() {
        let childTypes = childrenAt(Type, valueAt);
        return map((ChildType, path) => pure(Tree, node.createChild(ChildType, path, valueAt)), childTypes);
      }
    });

    if (Type.prototype.hasOwnProperty("initialize")) {
      let initialized = thunk(() => {
        let initialized = new Microstate(prune(uninitialized)).initialize(uninitialized.data.value);
        return graft(uninitialized.data.path, reveal(initialized));
      });
      return new Tree({
        data: () => initialized().data,
        children: () => initialized().children
      });
    } else {
      return uninitialized;
    }
  }, tree);
}

class Node {
  constructor({path, root, Type: InitialType }) {
    this.InitialType = InitialType;
    this.path = path;

    Object.defineProperty(this, 'value', {
      enumerable: true,
      get: thunk(() => view(lensPath(path.slice(-1)), root))
    });
  }

  get Type() {
    return toType(desugar(this.InitialType));
  }

  get isSimple() {
    return isSimple(this.Type);
  }

  get state() {
    let { Type } = this;
    let valueAt = this.value;
    let instance = new Type(valueAt).valueOf();
    if (isSimple(Type)) {
      return valueAt || instance;
    } else {
      return stateAt(Type, instance, valueAt);
    }
  }

  get transitions() {
    let { Type, path } = this;

    return $(transitionsFor(Type))
      .map(method => {
        return (tree, args) => {
          return over(lensTreeValue(path), (tree) => {
            return graft(path, reveal(method.apply(new Microstate(prune(tree)), args)));
          }, tree);
        };
      }).valueOf();
  }

  createChild(Type, name, rootValue) {
    return new Node({path: append(this.path, name), Type, root: rootValue });
  }

  replaceValue(key, childValue) {
    let { Type, value } = this;
    return append(this, {
      get value() {
        return set(lensPath(key), childValue, value);
      }
    });
  }
}
