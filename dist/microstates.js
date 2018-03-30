import { Applicative, Functor, Monoid, append, filter, foldl, map, pure, type } from 'funcadelic';
import lens from 'ramda/src/lens';
import view from 'ramda/src/view';
import set from 'ramda/src/set';
import lensPath from 'ramda/src/lensPath';
import lensIndex from 'ramda/src/lensIndex';
import compose from 'ramda/src/compose';
import getOwnPropertyDescriptors from 'object.getownpropertydescriptors';
import mergeDeepRight from 'ramda/src/mergeDeepRight';
import indexOf from 'ramda/src/indexOf';
import SymbolObservable from 'symbol-observable';

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function");
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return self;
}

function _possibleConstructorReturn(self, call) {
  if (call && (typeof call === "object" || typeof call === "function")) {
    return call;
  }

  if (self === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return self;
}

function _toArray(arr) {
  return Array.isArray(arr) ? arr : Array.from(arr);
}

function _toConsumableArray(arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  } else {
    return Array.from(arr);
  }
}

var Monad = type(function (_Applicative) {
  _inherits(Monad, _Applicative);

  function Monad() {
    _classCallCheck(this, Monad);

    return _possibleConstructorReturn(this, (Monad.__proto__ || Object.getPrototypeOf(Monad)).apply(this, arguments));
  }

  _createClass(Monad, [{
    key: "flatMap",
    value: function flatMap(fn, m) {
      return this(m).flatMap(fn, m);
    }
  }]);

  return Monad;
}(Applicative));
var flatMap = Monad.prototype.flatMap;

var Chain = function () {
  function Chain(_value) {
    _classCallCheck(this, Chain);

    Object.defineProperty(this, 'valueOf', {
      value: function value() {
        return _value;
      }
    });
  }

  _createClass(Chain, [{
    key: "map",
    value: function map$$1(fn) {
      return new Chain(map(fn, this.valueOf()));
    }
  }, {
    key: "flatMap",
    value: function flatMap$$1(fn) {
      return new Chain(flatMap(fn, this.valueOf()));
    }
  }, {
    key: "filter",
    value: function filter$$1(fn) {
      return new Chain(filter(fn, this.valueOf()));
    }
  }, {
    key: "append",
    value: function append$$1(thing) {
      return new Chain(append(this.valueOf(), thing));
    }
  }, {
    key: "tap",
    value: function tap(fn) {
      fn(this.valueOf());
      return this;
    }
  }]);

  return Chain;
}();

function chain(value) {
  return new Chain(value);
}

function thunk(fn) {
  var evaluated = false;
  var result = undefined;
  return function evaluate() {
    if (evaluated) {
      return result;
    } else {
      result = fn.call(this);
      evaluated = true;
      return result;
    }
  };
}

var Tree = function Tree() {
  var props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  _classCallCheck(this, Tree);

  var _props$data = props.data,
      data = _props$data === void 0 ? function () {
    return {};
  } : _props$data,
      _props$children = props.children,
      children = _props$children === void 0 ? function () {
    return {};
  } : _props$children;
  return Object.create(Tree.prototype, {
    data: {
      get: thunk(data),
      enumerable: true
    },
    children: {
      get: thunk(children),
      enumerable: true
    }
  });
};

function prune(tree) {
  var prefix = tree.data.path;
  return map(function (node) {
    return append(node, {
      path: node.path.slice(prefix.length)
    });
  }, tree);
}
function graft(path, tree) {
  if (path.length === 0) {
    return tree;
  } else {
    return map(function (node) {
      return append(node, {
        path: _toConsumableArray(path).concat(_toConsumableArray(node.path))
      });
    }, tree);
  }
}

function lensTree() {
  var path = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

  function get(tree) {
    return foldl(function (subtree, key) {
      return subtree.children[key];
    }, tree, path);
  }

  function set$$1(newTree, tree) {
    var current = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : path;

    if (current.length === 0) {
      return newTree;
    } else {
      return new Tree({
        data: function data() {
          return tree.data;
        },
        children: function children() {
          return map(function (child, childName) {
            var _current = _toArray(current),
                key = _current[0],
                rest = _current.slice(1);

            if (key === childName) {
              return set$$1(newTree, child, rest);
            } else {
              return child;
            }
          }, tree.children);
        }
      });
    }
  }

  return lens(get, set$$1);
}

var getPrototypeOf = Object.getPrototypeOf;
function getPrototypeDescriptors(Class) {
  var prototype = getPrototypeOf(Class);

  if (prototype && prototype !== getPrototypeOf(Object)) {
    return append(getPrototypeDescriptors(prototype), getOwnPropertyDescriptors(Class.prototype));
  } else {
    return getOwnPropertyDescriptors(Class.prototype);
  }
}

var StringType = function () {
  function StringType() {
    var value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

    _classCallCheck(this, StringType);

    return new String(value);
  }

  _createClass(StringType, [{
    key: "concat",
    value: function concat() {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return String.prototype.concat.apply(this.state, args);
    }
  }]);

  return StringType;
}();

var NumberType = function () {
  function NumberType() {
    var value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

    _classCallCheck(this, NumberType);

    return new Number(value);
  }

  _createClass(NumberType, [{
    key: "sum",
    value: function sum() {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return args.reduce(function (accumulator, value) {
        return accumulator + value;
      }, this.state);
    }
  }, {
    key: "subtract",
    value: function subtract() {
      for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      return args.reduce(function (accumulator, value) {
        return accumulator - value;
      }, this.state);
    }
  }, {
    key: "increment",
    value: function increment() {
      var step = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
      return this.state + step;
    }
  }, {
    key: "decrement",
    value: function decrement() {
      var step = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
      return this.state - step;
    }
  }]);

  return NumberType;
}();

var BooleanType = function () {
  function BooleanType() {
    var value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

    _classCallCheck(this, BooleanType);

    return new Boolean(value);
  }

  _createClass(BooleanType, [{
    key: "toggle",
    value: function toggle() {
      return !this.state;
    }
  }]);

  return BooleanType;
}();

var symbol = Symbol('🙈');
var getOwnPropertySymbols = Object.getOwnPropertySymbols;
function keep(object, value) {
  return Object.defineProperty(object, symbol, {
    value: value,
    enumerable: false
  });
}
function reveal(object) {
  if (object && getOwnPropertySymbols(object).includes(symbol)) {
    return object[symbol];
  }
}

var TYPE_PARAMETERS = Symbol('Type Parameters');
function parameterized(Type) {
  var defaults = params(Type);
  var keys = Object.keys(defaults);

  for (var _len = arguments.length, substitutions = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    substitutions[_key - 1] = arguments[_key];
  }

  var parameters = foldl(function (parameters, param, index) {
    if (typeof param === 'function') {
      var key = keys[index];

      if (key) {
        return append(parameters, _defineProperty({}, key, param));
      } else {
        return parameters;
      }
    } else {
      return append(parameters, param);
    }
  }, defaults, substitutions);
  return function (_Type) {
    _inherits(Parameterized, _Type);

    function Parameterized() {
      _classCallCheck(this, Parameterized);

      return _possibleConstructorReturn(this, (Parameterized.__proto__ || Object.getPrototypeOf(Parameterized)).apply(this, arguments));
    }

    _createClass(Parameterized, null, [{
      key: "name",
      get: function get() {
        return Type.name;
      }
    }, {
      key: "toString",
      get: function get() {
        var names = Object.keys(parameters).map(function (k) {
          var parameter = parameters[k];

          if (Object.keys(params(parameter)).length) {
            return parameter.toString();
          }

          if (parameter.name != null) {
            return parameter.name;
          } else {
            return parameter.toString();
          }
        });
        return function () {
          return "".concat(Type.name, "<").concat(names.join(','), ">");
        };
      }
    }, {
      key: TYPE_PARAMETERS,
      get: function get() {
        return parameters;
      }
    }]);

    return Parameterized;
  }(Type);
}
function params(Constructor) {
  return Constructor[TYPE_PARAMETERS] || {};
}
var any = 'any';

var ArrayType = function () {
  function ArrayType() {
    var value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

    _classCallCheck(this, ArrayType);

    return value instanceof Array ? value : [value];
  }

  _createClass(ArrayType, [{
    key: "push",
    value: function push(item) {
      return this.splice(this.state.length, 0, [item]);
    }
  }, {
    key: "pop",
    value: function pop() {
      return this.splice(this.state.length - 1, 1, []);
    }
  }, {
    key: "shift",
    value: function shift() {
      return this.splice(0, 1, []);
    }
  }, {
    key: "unshift",
    value: function unshift(item) {
      return this.splice(0, 0, [item]);
    }
  }, {
    key: "filter",
    value: function filter$$1(fn) {
      return foldl(function (_ref, state, i) {
        var array = _ref.array,
            removed = _ref.removed;

        if (fn(state)) {
          return {
            array: array,
            removed: removed
          };
        } else {
          return {
            array: array.splice(i - removed, 1, []),
            removed: removed + 1
          };
        }
      }, {
        array: this,
        removed: 0
      }, this.state).array;
    }
  }, {
    key: "map",
    value: function map$$1(callback) {
      return Array.prototype.map.call(this.state, callback);
    }
  }, {
    key: "splice",
    value: function splice(startIndex, length, values) {
      var Microstate = this.constructor;
      var create = Microstate.create;

      var _reveal = reveal(this),
          tree = _reveal.tree;

      var value = (this.valueOf() || []).slice();
      value.splice.apply(value, [startIndex, length].concat(_toConsumableArray(values)));

      var _params = params(tree.data.Type),
          T = _params.T;

      if (T === any) {
        return value;
      }

      var unchanged = tree.children.slice(0, startIndex);
      var added = chain(values).map(function (value) {
        return create(T, value);
      }).map(reveal).map(function (_ref2) {
        var tree = _ref2.tree;
        return tree;
      }).valueOf();
      var moved = map(prune, tree.children.slice(startIndex + length));

      function attach(index, tree) {
        return graft(append(tree.data.path, index), tree);
      }

      var _children = chain(unchanged).append(map(function (child, i) {
        return attach(i + unchanged.length, child);
      }, added)).append(map(function (child, i) {
        return attach(i + unchanged.length + added.length, child);
      }, moved)).valueOf();

      var structure = new Tree({
        data: function data() {
          return tree.data;
        },
        children: function children() {
          return _children;
        }
      });
      return new Microstate(structure, value);
    }
  }, {
    key: "replace",
    value: function replace(item, replacement) {
      var index = indexOf(item, this.state);

      if (index === -1) {
        return this.state;
      } else {
        return set(lensPath([index]), replacement, this.state);
      }
    }
  }]);

  return ArrayType;
}();

var ArrayType$1 = parameterized(ArrayType, {
  T: any
});

var ObjectType = function () {
  function ObjectType() {
    var value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, ObjectType);

    return new Object(value);
  }

  _createClass(ObjectType, [{
    key: "assign",
    value: function assign(props) {
      return Object.assign({}, this.state, props);
    }
  }]);

  return ObjectType;
}();

var ObjectType$1 = parameterized(ObjectType, {
  T: any
});

function parameterized$1(Constructor) {
  for (var _len = arguments.length, rest = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    rest[_key - 1] = arguments[_key];
  }

  var Type = toType.apply(void 0, [Constructor].concat(rest));
  return parameterized.apply(void 0, [Type].concat(_toConsumableArray(map(function (item) {
    return typeof item === 'function' ? toType(item) : map(toType, item);
  }, rest))));
}
function params$1(Constructor) {
  return params(toType(Constructor));
}

var types = {
  String: StringType,
  Number: NumberType,
  Boolean: BooleanType,
  Array: ArrayType$1,
  Object: ObjectType$1
};
function toType(Constructor) {
  switch (Constructor) {
    case Array:
      return ArrayType$1;

    case Object:
      return ObjectType$1;

    case Number:
      return NumberType;

    case String:
      return StringType;

    case Boolean:
      return BooleanType;

    default:
      return Constructor;
  }
}

var keys$2 = Object.keys;
function isPrimitive(Type) {
  return keys$2(new Type()).length === 0;
}

function setTransition(value) {
  return value;
}



function mergeTransition() {
  for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  return mergeDeepRight.apply(void 0, [this.state].concat(args));
}


function transitionsFor(Type) {
  var descriptors = getPrototypeDescriptors(toType(Type));
  var transitionFns = chain(descriptors).filter(function (_ref) {
    var value = _ref.value;
    return isFunctionDescriptor(value);
  }).map(function (_ref2) {
    var value = _ref2.value;
    return value;
  }).filter(function (_ref3) {
    var key = _ref3.key;
    return key !== 'constructor';
  }).valueOf();
  var common = isPrimitive(Type) ? {
    set: setTransition
  } : {
    set: setTransition,
    merge: mergeTransition
  };
  return append(common, transitionFns);
}

function isFunctionDescriptor(descriptor) {
  return typeof descriptor.value === 'function';
}

function isSimple(Constructor) {
  var Type = toType(Constructor);

  if (Type === BooleanType) {
    return true;
  }

  if (Type === NumberType) {
    return true;
  }

  if (Type === StringType) {
    return true;
  }

  if (Type === ArrayType$1 || Type.prototype instanceof ArrayType$1) {
    var _params = params$1(Type),
        T = _params.T;

    return isSimple(T);
  }

  if (Type === ObjectType$1 || Type.prototype instanceof ObjectType$1) {
    var _params2 = params$1(Type),
        _T = _params2.T;

    if (_T === any) {
      return true;
    } else {
      return isSimple(_T);
    }
  }

  if (Type === any) {
    return true;
  }

  return false;
}

var keys$3 = Object.keys;
var Values = type(function () {
  function Values() {
    _classCallCheck(this, Values);
  }

  _createClass(Values, [{
    key: "values",
    value: function values(holder) {
      return this(holder).values(holder);
    }
  }]);

  return Values;
}());
Values.instance(Array, {
  values: function values(array) {
    return array;
  }
});
Values.instance(Object, {
  values: function values(object) {
    return map(function (key) {
      return object[key];
    }, keys$3(object));
  }
});
var values = Values.prototype.values;

var ContainsTypes = Monoid.create(function () {
  function ContainsTypes() {
    _classCallCheck(this, ContainsTypes);
  }

  _createClass(ContainsTypes, [{
    key: "empty",
    value: function empty() {
      return true;
    }
  }, {
    key: "append",
    value: function append$$1(a, b) {
      return a && (b instanceof Function || isSugar(b));
    }
  }]);

  return ContainsTypes;
}());
function isPossibleSugar(Type) {
  return Type && (Type.constructor === Array || Type.constructor === Object);
}
function isSugar(Type) {
  return isPossibleSugar(Type) && ContainsTypes.reduce(values(Type));
}
function desugar(Type) {
  if (isSugar(Type)) {
    var c = Type.constructor;

    if (c === Array) {
      return parameterized$1.apply(void 0, [Array].concat(_toConsumableArray(map(desugar, values(Type)))));
    }

    if (c === Object) {
      return parameterized$1.apply(void 0, [Object].concat(_toConsumableArray(map(desugar, values(Type)))));
    }
  }

  return Type;
}

var Collapse = type(function () {
  function Collapse() {
    _classCallCheck(this, Collapse);
  }

  _createClass(Collapse, [{
    key: "collapse",
    value: function collapse(holder) {
      return this(holder).collapse(holder);
    }
  }]);

  return Collapse;
}());
var collapse = Collapse.prototype.collapse;

var assign = Object.assign;
function analyze(Type, value) {
  return flatMap(analyzeType(value), pure(Tree, new Node(Type, [])));
}
function collapseState(tree, value) {
  var truncated = truncate(function (node) {
    return node.isSimple;
  }, tree);
  return collapse(map(function (node) {
    return node.stateAt(value);
  }, truncated));
}

function analyzeType(value) {
  return function (node) {
    var InitialType = desugar(node.Type);
    var valueAt = node.valueAt(value);
    var Type = toType(InitialType);
    var instance = Type.hasOwnProperty('create') ? Type.create(valueAt) : undefined;

    if (instance instanceof Microstate$1) {
      var _reveal = reveal(instance),
          tree = _reveal.tree,
          _value = _reveal.value;

      var shift = new ShiftNode(tree.data, _value);
      return graft(node.path, new Tree({
        data: function data() {
          return shift;
        },
        children: function children() {
          return tree.children;
        }
      }));
    }

    return new Tree({
      data: function data() {
        return Type === node.Type ? node : append(node, {
          Type: Type
        });
      },
      children: function children() {
        var childTypes = childrenAt(Type, node.valueAt(value));
        return map(function (ChildType, path) {
          return pure(Tree, new Node(ChildType, append(node.path, path)));
        }, childTypes);
      }
    });
  };
}

var Location = type(function () {
  function Location() {
    _classCallCheck(this, Location);
  }

  _createClass(Location, [{
    key: "stateAt",
    value: function stateAt(Type, instance, value) {
      return this(Type.prototype).stateAt(instance, value);
    }
  }, {
    key: "childrenAt",
    value: function childrenAt(Type, value) {
      return this(Type.prototype).childrenAt(Type, value);
    }
  }]);

  return Location;
}());
var _Location$prototype = Location.prototype;
var _stateAt = _Location$prototype.stateAt;
var childrenAt = _Location$prototype.childrenAt;
Location.instance(Object, {
  stateAt: function stateAt(instance, value) {
    if (value) {
      return append(instance, value);
    } else {
      return instance;
    }
  },
  childrenAt: function childrenAt(Type, value) {
    return chain(new Type()).map(desugar).filter(function (_ref) {
      var value = _ref.value;
      return !!value && value.call;
    }).valueOf();
  }
});
Location.instance(types.Object, {
  stateAt: function stateAt(_) {},
  childrenAt: function childrenAt(Type, value) {
    var _params = params$1(Type),
        T = _params.T;

    if (T !== any) {
      return map(function (_) {
        return T;
      }, value);
    } else {
      return Location.for(Object).childrenAt(Type, value);
    }
  }
});
Location.instance(types.Array, {
  stateAt: function stateAt(_) {
    return [];
  },
  childrenAt: function childrenAt() {
    var _Location$for;

    return (_Location$for = Location.for(types.Object.prototype)).childrenAt.apply(_Location$for, arguments);
  }
});

function truncate(fn, tree) {
  return flatMap(function (node) {
    var subtree = view(lensTree(node.path), tree);

    if (fn(subtree.data)) {
      return append(subtree, {
        children: []
      });
    } else {
      return subtree;
    }
  }, tree);
}

function cachedGetters(Type) {
  var descriptors = chain(getPrototypeDescriptors(Type)).filter(function (_ref2) {
    var value = _ref2.value;
    return !!value.get;
  }).map(function (descriptor) {
    return append(descriptor, {
      get: thunk(descriptor.get)
    });
  }).valueOf();
  return Object.create(Type.prototype, descriptors);
}

var Node = function () {
  function Node(Type, path) {
    _classCallCheck(this, Node);

    assign(this, {
      Type: Type,
      path: path
    });
  }

  _createClass(Node, [{
    key: "valueAt",
    value: function valueAt(total) {
      return view(lensPath(this.path), total);
    }
  }, {
    key: "stateAt",
    value: function stateAt(value) {
      var Type = this.Type;
      var valueAt = this.valueAt(value);
      var instance = new Type(valueAt).valueOf();

      if (isSimple(Type)) {
        return valueAt || instance;
      } else {
        return _stateAt(Type, append(instance, cachedGetters(Type)), valueAt);
      }
    }
  }, {
    key: "transitionsAt",
    value: function transitionsAt(value, tree, invoke) {
      var _this = this;

      var Type = this.Type,
          path = this.path;
      return map(function (method) {
        return function () {
          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }

          var localValue = _this.valueAt(value);

          var localTree = view(lensTree(path), tree);
          var transition = {
            method: method,
            args: args,
            value: localValue,
            tree: prune(localTree)
          };

          var _invoke = invoke(transition),
              nextLocalValue = _invoke.value,
              nextLocalTree = _invoke.tree;

          var nextTree = set(lensTree(path), graft(path, nextLocalTree), tree);
          var nextValue = set(lensPath(path), nextLocalValue, value);
          return {
            tree: nextTree,
            value: nextValue
          };
        };
      }, transitionsFor(Type));
    }
  }, {
    key: "isSimple",
    get: function get() {
      return isSimple(this.Type);
    }
  }]);

  return Node;
}();

var ShiftNode = function (_Node) {
  _inherits(ShiftNode, _Node);

  function ShiftNode(_ref3, value) {
    var _this2;

    var Type = _ref3.Type,
        path = _ref3.path;

    _classCallCheck(this, ShiftNode);

    _this2 = _possibleConstructorReturn(this, (ShiftNode.__proto__ || Object.getPrototypeOf(ShiftNode)).call(this, Type, path));
    assign(_assertThisInitialized(_this2), {
      value: value
    });
    return _this2;
  }

  _createClass(ShiftNode, [{
    key: "valueAt",
    value: function valueAt() {
      return this.value;
    }
  }]);

  return ShiftNode;
}(Node);

var Microstate$1 = function () {
  function Microstate(tree, value) {
    _classCallCheck(this, Microstate);

    keep(this, {
      tree: tree,
      value: value
    });
    return append(map(function (transition) {
      return transition;
    }, this), {
      get state() {
        return collapseState(tree, value);
      }

    });
  }

  _createClass(Microstate, [{
    key: "valueOf",
    value: function valueOf() {
      var _reveal = reveal(this),
          value = _reveal.value;

      return value;
    }
  }, {
    key: SymbolObservable,
    value: function value() {
      var microstate = this;
      return _defineProperty({
        subscribe: function subscribe(observer) {
          var next = observer.call ? observer : observer.next.bind(observer);

          function nextOnTransition(transition) {
            return function invoke() {
              var nextable = map(nextOnTransition, transition.apply(void 0, arguments));
              next(nextable);
              return nextable;
            };
          }

          next(map(nextOnTransition, microstate));
        }
      }, SymbolObservable, function () {
        return this;
      });
    }
  }], [{
    key: "create",
    value: function create(Type, value) {
      value = value != null ? value.valueOf() : value;
      var tree = analyze(Type, value);
      return new Microstate(tree, value);
    }
  }]);

  return Microstate;
}();

var keys = Object.keys;

function invoke(_ref) {
  var method = _ref.method,
      args = _ref.args,
      value = _ref.value,
      tree = _ref.tree;
  var nextValue = method.apply(new Microstate$1(tree, value), args);

  if (nextValue instanceof Microstate$1) {
    return reveal(nextValue);
  } else {
    return {
      tree: tree,
      value: nextValue
    };
  }
}

Functor.instance(Microstate$1, {
  map: function map$$1(fn, microstate) {
    var _reveal = reveal(microstate),
        tree = _reveal.tree,
        value = _reveal.value;

    var next = map(function (node) {
      var transitions = node.transitionsAt(value, tree, invoke);
      return map(function (transition) {
        return function () {
          var _transition = transition.apply(void 0, arguments),
              tree = _transition.tree,
              value = _transition.value;

          return new Microstate$1(tree, value);
        };
      }, transitions);
    }, tree);

    var mapped = map(function (transitions) {
      return map(fn, transitions);
    }, next);

    return append(microstate, collapse(mapped));
  }
});
Collapse.instance(Tree, {
  collapse: function collapse$$1(tree) {
    var hasChildren = !!keys(tree.children).length;

    if (hasChildren) {
      return append(tree.data, map(function (child) {
        return collapse(child);
      }, tree.children));
    } else {
      return tree.data;
    }
  }
});
Functor.instance(Tree, {
  map: function map$$1(fn, tree) {
    return new Tree({
      data: function data() {
        return fn(tree.data);
      },
      children: function children() {
        return map(function (child) {
          return map(fn, child);
        }, tree.children);
      }
    });
  }
});
Applicative.instance(Tree, {
  pure: function pure$$1(value) {
    return new Tree({
      data: function data() {
        return value;
      }
    });
  }
});
Monad.instance(Tree, {
  flatMap: function flatMap$$1(fn, tree) {
    var next = thunk(function () {
      return fn(tree.data);
    });
    return new Tree({
      data: function data() {
        return next().data;
      },
      children: function children() {
        return map(function (child) {
          return flatMap(fn, child);
        }, next().children);
      }
    });
  }
});

var create = Microstate$1.create;

export { create, reveal, Microstate$1 as Microstate, Tree, analyze, parameterized$1 as parameterized };
export default Microstate$1;
//# sourceMappingURL=microstates.js.map
