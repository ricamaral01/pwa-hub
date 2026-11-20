var Mi = { exports: {} }, Er = {}, Ri = { exports: {} }, V = {};
/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Ra;
function Vf() {
  if (Ra) return V;
  Ra = 1;
  var h = Symbol.for("react.element"), O = Symbol.for("react.portal"), m = Symbol.for("react.fragment"), J = Symbol.for("react.strict_mode"), te = Symbol.for("react.profiler"), K = Symbol.for("react.provider"), A = Symbol.for("react.context"), I = Symbol.for("react.forward_ref"), F = Symbol.for("react.suspense"), C = Symbol.for("react.memo"), G = Symbol.for("react.lazy"), X = Symbol.iterator;
  function T(c) {
    return c === null || typeof c != "object" ? null : (c = X && c[X] || c["@@iterator"], typeof c == "function" ? c : null);
  }
  var Y = { isMounted: function() {
    return !1;
  }, enqueueForceUpdate: function() {
  }, enqueueReplaceState: function() {
  }, enqueueSetState: function() {
  } }, he = Object.assign, b = {};
  function ee(c, y, U) {
    this.props = c, this.context = y, this.refs = b, this.updater = U || Y;
  }
  ee.prototype.isReactComponent = {}, ee.prototype.setState = function(c, y) {
    if (typeof c != "object" && typeof c != "function" && c != null) throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
    this.updater.enqueueSetState(this, c, y, "setState");
  }, ee.prototype.forceUpdate = function(c) {
    this.updater.enqueueForceUpdate(this, c, "forceUpdate");
  };
  function wt() {
  }
  wt.prototype = ee.prototype;
  function ct(c, y, U) {
    this.props = c, this.context = y, this.refs = b, this.updater = U || Y;
  }
  var et = ct.prototype = new wt();
  et.constructor = ct, he(et, ee.prototype), et.isPureReactComponent = !0;
  var _e = Array.isArray, tt = Object.prototype.hasOwnProperty, Te = { current: null }, Oe = { key: !0, ref: !0, __self: !0, __source: !0 };
  function Ge(c, y, U) {
    var B, W = {}, $ = null, ne = null;
    if (y != null) for (B in y.ref !== void 0 && (ne = y.ref), y.key !== void 0 && ($ = "" + y.key), y) tt.call(y, B) && !Oe.hasOwnProperty(B) && (W[B] = y[B]);
    var q = arguments.length - 2;
    if (q === 1) W.children = U;
    else if (1 < q) {
      for (var ie = Array(q), He = 0; He < q; He++) ie[He] = arguments[He + 2];
      W.children = ie;
    }
    if (c && c.defaultProps) for (B in q = c.defaultProps, q) W[B] === void 0 && (W[B] = q[B]);
    return { $$typeof: h, type: c, key: $, ref: ne, props: W, _owner: Te.current };
  }
  function Rt(c, y) {
    return { $$typeof: h, type: c.type, key: y, ref: c.ref, props: c.props, _owner: c._owner };
  }
  function St(c) {
    return typeof c == "object" && c !== null && c.$$typeof === h;
  }
  function Xt(c) {
    var y = { "=": "=0", ":": "=2" };
    return "$" + c.replace(/[=:]/g, function(U) {
      return y[U];
    });
  }
  var ft = /\/+/g;
  function Be(c, y) {
    return typeof c == "object" && c !== null && c.key != null ? Xt("" + c.key) : y.toString(36);
  }
  function nt(c, y, U, B, W) {
    var $ = typeof c;
    ($ === "undefined" || $ === "boolean") && (c = null);
    var ne = !1;
    if (c === null) ne = !0;
    else switch ($) {
      case "string":
      case "number":
        ne = !0;
        break;
      case "object":
        switch (c.$$typeof) {
          case h:
          case O:
            ne = !0;
        }
    }
    if (ne) return ne = c, W = W(ne), c = B === "" ? "." + Be(ne, 0) : B, _e(W) ? (U = "", c != null && (U = c.replace(ft, "$&/") + "/"), nt(W, y, U, "", function(He) {
      return He;
    })) : W != null && (St(W) && (W = Rt(W, U + (!W.key || ne && ne.key === W.key ? "" : ("" + W.key).replace(ft, "$&/") + "/") + c)), y.push(W)), 1;
    if (ne = 0, B = B === "" ? "." : B + ":", _e(c)) for (var q = 0; q < c.length; q++) {
      $ = c[q];
      var ie = B + Be($, q);
      ne += nt($, y, U, ie, W);
    }
    else if (ie = T(c), typeof ie == "function") for (c = ie.call(c), q = 0; !($ = c.next()).done; ) $ = $.value, ie = B + Be($, q++), ne += nt($, y, U, ie, W);
    else if ($ === "object") throw y = String(c), Error("Objects are not valid as a React child (found: " + (y === "[object Object]" ? "object with keys {" + Object.keys(c).join(", ") + "}" : y) + "). If you meant to render a collection of children, use an array instead.");
    return ne;
  }
  function dt(c, y, U) {
    if (c == null) return c;
    var B = [], W = 0;
    return nt(c, B, "", "", function($) {
      return y.call(U, $, W++);
    }), B;
  }
  function je(c) {
    if (c._status === -1) {
      var y = c._result;
      y = y(), y.then(function(U) {
        (c._status === 0 || c._status === -1) && (c._status = 1, c._result = U);
      }, function(U) {
        (c._status === 0 || c._status === -1) && (c._status = 2, c._result = U);
      }), c._status === -1 && (c._status = 0, c._result = y);
    }
    if (c._status === 1) return c._result.default;
    throw c._result;
  }
  var ce = { current: null }, E = { transition: null }, j = { ReactCurrentDispatcher: ce, ReactCurrentBatchConfig: E, ReactCurrentOwner: Te };
  function N() {
    throw Error("act(...) is not supported in production builds of React.");
  }
  return V.Children = { map: dt, forEach: function(c, y, U) {
    dt(c, function() {
      y.apply(this, arguments);
    }, U);
  }, count: function(c) {
    var y = 0;
    return dt(c, function() {
      y++;
    }), y;
  }, toArray: function(c) {
    return dt(c, function(y) {
      return y;
    }) || [];
  }, only: function(c) {
    if (!St(c)) throw Error("React.Children.only expected to receive a single React element child.");
    return c;
  } }, V.Component = ee, V.Fragment = m, V.Profiler = te, V.PureComponent = ct, V.StrictMode = J, V.Suspense = F, V.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = j, V.act = N, V.cloneElement = function(c, y, U) {
    if (c == null) throw Error("React.cloneElement(...): The argument must be a React element, but you passed " + c + ".");
    var B = he({}, c.props), W = c.key, $ = c.ref, ne = c._owner;
    if (y != null) {
      if (y.ref !== void 0 && ($ = y.ref, ne = Te.current), y.key !== void 0 && (W = "" + y.key), c.type && c.type.defaultProps) var q = c.type.defaultProps;
      for (ie in y) tt.call(y, ie) && !Oe.hasOwnProperty(ie) && (B[ie] = y[ie] === void 0 && q !== void 0 ? q[ie] : y[ie]);
    }
    var ie = arguments.length - 2;
    if (ie === 1) B.children = U;
    else if (1 < ie) {
      q = Array(ie);
      for (var He = 0; He < ie; He++) q[He] = arguments[He + 2];
      B.children = q;
    }
    return { $$typeof: h, type: c.type, key: W, ref: $, props: B, _owner: ne };
  }, V.createContext = function(c) {
    return c = { $$typeof: A, _currentValue: c, _currentValue2: c, _threadCount: 0, Provider: null, Consumer: null, _defaultValue: null, _globalName: null }, c.Provider = { $$typeof: K, _context: c }, c.Consumer = c;
  }, V.createElement = Ge, V.createFactory = function(c) {
    var y = Ge.bind(null, c);
    return y.type = c, y;
  }, V.createRef = function() {
    return { current: null };
  }, V.forwardRef = function(c) {
    return { $$typeof: I, render: c };
  }, V.isValidElement = St, V.lazy = function(c) {
    return { $$typeof: G, _payload: { _status: -1, _result: c }, _init: je };
  }, V.memo = function(c, y) {
    return { $$typeof: C, type: c, compare: y === void 0 ? null : y };
  }, V.startTransition = function(c) {
    var y = E.transition;
    E.transition = {};
    try {
      c();
    } finally {
      E.transition = y;
    }
  }, V.unstable_act = N, V.useCallback = function(c, y) {
    return ce.current.useCallback(c, y);
  }, V.useContext = function(c) {
    return ce.current.useContext(c);
  }, V.useDebugValue = function() {
  }, V.useDeferredValue = function(c) {
    return ce.current.useDeferredValue(c);
  }, V.useEffect = function(c, y) {
    return ce.current.useEffect(c, y);
  }, V.useId = function() {
    return ce.current.useId();
  }, V.useImperativeHandle = function(c, y, U) {
    return ce.current.useImperativeHandle(c, y, U);
  }, V.useInsertionEffect = function(c, y) {
    return ce.current.useInsertionEffect(c, y);
  }, V.useLayoutEffect = function(c, y) {
    return ce.current.useLayoutEffect(c, y);
  }, V.useMemo = function(c, y) {
    return ce.current.useMemo(c, y);
  }, V.useReducer = function(c, y, U) {
    return ce.current.useReducer(c, y, U);
  }, V.useRef = function(c) {
    return ce.current.useRef(c);
  }, V.useState = function(c) {
    return ce.current.useState(c);
  }, V.useSyncExternalStore = function(c, y, U) {
    return ce.current.useSyncExternalStore(c, y, U);
  }, V.useTransition = function() {
    return ce.current.useTransition();
  }, V.version = "18.3.1", V;
}
var Ta;
function ji() {
  return Ta || (Ta = 1, Ri.exports = Vf()), Ri.exports;
}
/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var La;
function Bf() {
  if (La) return Er;
  La = 1;
  var h = ji(), O = Symbol.for("react.element"), m = Symbol.for("react.fragment"), J = Object.prototype.hasOwnProperty, te = h.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner, K = { key: !0, ref: !0, __self: !0, __source: !0 };
  function A(I, F, C) {
    var G, X = {}, T = null, Y = null;
    C !== void 0 && (T = "" + C), F.key !== void 0 && (T = "" + F.key), F.ref !== void 0 && (Y = F.ref);
    for (G in F) J.call(F, G) && !K.hasOwnProperty(G) && (X[G] = F[G]);
    if (I && I.defaultProps) for (G in F = I.defaultProps, F) X[G] === void 0 && (X[G] = F[G]);
    return { $$typeof: O, type: I, key: T, ref: Y, props: X, _owner: te.current };
  }
  return Er.Fragment = m, Er.jsx = A, Er.jsxs = A, Er;
}
var za;
function Hf() {
  return za || (za = 1, Mi.exports = Bf()), Mi.exports;
}
var g = Hf(), yt = ji(), Ol = {}, Ti = { exports: {} }, Ve = {}, Li = { exports: {} }, zi = {};
/**
 * @license React
 * scheduler.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Oa;
function Wf() {
  return Oa || (Oa = 1, (function(h) {
    function O(E, j) {
      var N = E.length;
      E.push(j);
      e: for (; 0 < N; ) {
        var c = N - 1 >>> 1, y = E[c];
        if (0 < te(y, j)) E[c] = j, E[N] = y, N = c;
        else break e;
      }
    }
    function m(E) {
      return E.length === 0 ? null : E[0];
    }
    function J(E) {
      if (E.length === 0) return null;
      var j = E[0], N = E.pop();
      if (N !== j) {
        E[0] = N;
        e: for (var c = 0, y = E.length, U = y >>> 1; c < U; ) {
          var B = 2 * (c + 1) - 1, W = E[B], $ = B + 1, ne = E[$];
          if (0 > te(W, N)) $ < y && 0 > te(ne, W) ? (E[c] = ne, E[$] = N, c = $) : (E[c] = W, E[B] = N, c = B);
          else if ($ < y && 0 > te(ne, N)) E[c] = ne, E[$] = N, c = $;
          else break e;
        }
      }
      return j;
    }
    function te(E, j) {
      var N = E.sortIndex - j.sortIndex;
      return N !== 0 ? N : E.id - j.id;
    }
    if (typeof performance == "object" && typeof performance.now == "function") {
      var K = performance;
      h.unstable_now = function() {
        return K.now();
      };
    } else {
      var A = Date, I = A.now();
      h.unstable_now = function() {
        return A.now() - I;
      };
    }
    var F = [], C = [], G = 1, X = null, T = 3, Y = !1, he = !1, b = !1, ee = typeof setTimeout == "function" ? setTimeout : null, wt = typeof clearTimeout == "function" ? clearTimeout : null, ct = typeof setImmediate < "u" ? setImmediate : null;
    typeof navigator < "u" && navigator.scheduling !== void 0 && navigator.scheduling.isInputPending !== void 0 && navigator.scheduling.isInputPending.bind(navigator.scheduling);
    function et(E) {
      for (var j = m(C); j !== null; ) {
        if (j.callback === null) J(C);
        else if (j.startTime <= E) J(C), j.sortIndex = j.expirationTime, O(F, j);
        else break;
        j = m(C);
      }
    }
    function _e(E) {
      if (b = !1, et(E), !he) if (m(F) !== null) he = !0, je(tt);
      else {
        var j = m(C);
        j !== null && ce(_e, j.startTime - E);
      }
    }
    function tt(E, j) {
      he = !1, b && (b = !1, wt(Ge), Ge = -1), Y = !0;
      var N = T;
      try {
        for (et(j), X = m(F); X !== null && (!(X.expirationTime > j) || E && !Xt()); ) {
          var c = X.callback;
          if (typeof c == "function") {
            X.callback = null, T = X.priorityLevel;
            var y = c(X.expirationTime <= j);
            j = h.unstable_now(), typeof y == "function" ? X.callback = y : X === m(F) && J(F), et(j);
          } else J(F);
          X = m(F);
        }
        if (X !== null) var U = !0;
        else {
          var B = m(C);
          B !== null && ce(_e, B.startTime - j), U = !1;
        }
        return U;
      } finally {
        X = null, T = N, Y = !1;
      }
    }
    var Te = !1, Oe = null, Ge = -1, Rt = 5, St = -1;
    function Xt() {
      return !(h.unstable_now() - St < Rt);
    }
    function ft() {
      if (Oe !== null) {
        var E = h.unstable_now();
        St = E;
        var j = !0;
        try {
          j = Oe(!0, E);
        } finally {
          j ? Be() : (Te = !1, Oe = null);
        }
      } else Te = !1;
    }
    var Be;
    if (typeof ct == "function") Be = function() {
      ct(ft);
    };
    else if (typeof MessageChannel < "u") {
      var nt = new MessageChannel(), dt = nt.port2;
      nt.port1.onmessage = ft, Be = function() {
        dt.postMessage(null);
      };
    } else Be = function() {
      ee(ft, 0);
    };
    function je(E) {
      Oe = E, Te || (Te = !0, Be());
    }
    function ce(E, j) {
      Ge = ee(function() {
        E(h.unstable_now());
      }, j);
    }
    h.unstable_IdlePriority = 5, h.unstable_ImmediatePriority = 1, h.unstable_LowPriority = 4, h.unstable_NormalPriority = 3, h.unstable_Profiling = null, h.unstable_UserBlockingPriority = 2, h.unstable_cancelCallback = function(E) {
      E.callback = null;
    }, h.unstable_continueExecution = function() {
      he || Y || (he = !0, je(tt));
    }, h.unstable_forceFrameRate = function(E) {
      0 > E || 125 < E ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : Rt = 0 < E ? Math.floor(1e3 / E) : 5;
    }, h.unstable_getCurrentPriorityLevel = function() {
      return T;
    }, h.unstable_getFirstCallbackNode = function() {
      return m(F);
    }, h.unstable_next = function(E) {
      switch (T) {
        case 1:
        case 2:
        case 3:
          var j = 3;
          break;
        default:
          j = T;
      }
      var N = T;
      T = j;
      try {
        return E();
      } finally {
        T = N;
      }
    }, h.unstable_pauseExecution = function() {
    }, h.unstable_requestPaint = function() {
    }, h.unstable_runWithPriority = function(E, j) {
      switch (E) {
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
          break;
        default:
          E = 3;
      }
      var N = T;
      T = E;
      try {
        return j();
      } finally {
        T = N;
      }
    }, h.unstable_scheduleCallback = function(E, j, N) {
      var c = h.unstable_now();
      switch (typeof N == "object" && N !== null ? (N = N.delay, N = typeof N == "number" && 0 < N ? c + N : c) : N = c, E) {
        case 1:
          var y = -1;
          break;
        case 2:
          y = 250;
          break;
        case 5:
          y = 1073741823;
          break;
        case 4:
          y = 1e4;
          break;
        default:
          y = 5e3;
      }
      return y = N + y, E = { id: G++, callback: j, priorityLevel: E, startTime: N, expirationTime: y, sortIndex: -1 }, N > c ? (E.sortIndex = N, O(C, E), m(F) === null && E === m(C) && (b ? (wt(Ge), Ge = -1) : b = !0, ce(_e, N - c))) : (E.sortIndex = y, O(F, E), he || Y || (he = !0, je(tt))), E;
    }, h.unstable_shouldYield = Xt, h.unstable_wrapCallback = function(E) {
      var j = T;
      return function() {
        var N = T;
        T = j;
        try {
          return E.apply(this, arguments);
        } finally {
          T = N;
        }
      };
    };
  })(zi)), zi;
}
var ja;
function $f() {
  return ja || (ja = 1, Li.exports = Wf()), Li.exports;
}
/**
 * @license React
 * react-dom.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Da;
function Qf() {
  if (Da) return Ve;
  Da = 1;
  var h = ji(), O = $f();
  function m(e) {
    for (var t = "https://reactjs.org/docs/error-decoder.html?invariant=" + e, n = 1; n < arguments.length; n++) t += "&args[]=" + encodeURIComponent(arguments[n]);
    return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
  }
  var J = /* @__PURE__ */ new Set(), te = {};
  function K(e, t) {
    A(e, t), A(e + "Capture", t);
  }
  function A(e, t) {
    for (te[e] = t, e = 0; e < t.length; e++) J.add(t[e]);
  }
  var I = !(typeof window > "u" || typeof window.document > "u" || typeof window.document.createElement > "u"), F = Object.prototype.hasOwnProperty, C = /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/, G = {}, X = {};
  function T(e) {
    return F.call(X, e) ? !0 : F.call(G, e) ? !1 : C.test(e) ? X[e] = !0 : (G[e] = !0, !1);
  }
  function Y(e, t, n, r) {
    if (n !== null && n.type === 0) return !1;
    switch (typeof t) {
      case "function":
      case "symbol":
        return !0;
      case "boolean":
        return r ? !1 : n !== null ? !n.acceptsBooleans : (e = e.toLowerCase().slice(0, 5), e !== "data-" && e !== "aria-");
      default:
        return !1;
    }
  }
  function he(e, t, n, r) {
    if (t === null || typeof t > "u" || Y(e, t, n, r)) return !0;
    if (r) return !1;
    if (n !== null) switch (n.type) {
      case 3:
        return !t;
      case 4:
        return t === !1;
      case 5:
        return isNaN(t);
      case 6:
        return isNaN(t) || 1 > t;
    }
    return !1;
  }
  function b(e, t, n, r, l, o, i) {
    this.acceptsBooleans = t === 2 || t === 3 || t === 4, this.attributeName = r, this.attributeNamespace = l, this.mustUseProperty = n, this.propertyName = e, this.type = t, this.sanitizeURL = o, this.removeEmptyString = i;
  }
  var ee = {};
  "children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(e) {
    ee[e] = new b(e, 0, !1, e, null, !1, !1);
  }), [["acceptCharset", "accept-charset"], ["className", "class"], ["htmlFor", "for"], ["httpEquiv", "http-equiv"]].forEach(function(e) {
    var t = e[0];
    ee[t] = new b(t, 1, !1, e[1], null, !1, !1);
  }), ["contentEditable", "draggable", "spellCheck", "value"].forEach(function(e) {
    ee[e] = new b(e, 2, !1, e.toLowerCase(), null, !1, !1);
  }), ["autoReverse", "externalResourcesRequired", "focusable", "preserveAlpha"].forEach(function(e) {
    ee[e] = new b(e, 2, !1, e, null, !1, !1);
  }), "allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(e) {
    ee[e] = new b(e, 3, !1, e.toLowerCase(), null, !1, !1);
  }), ["checked", "multiple", "muted", "selected"].forEach(function(e) {
    ee[e] = new b(e, 3, !0, e, null, !1, !1);
  }), ["capture", "download"].forEach(function(e) {
    ee[e] = new b(e, 4, !1, e, null, !1, !1);
  }), ["cols", "rows", "size", "span"].forEach(function(e) {
    ee[e] = new b(e, 6, !1, e, null, !1, !1);
  }), ["rowSpan", "start"].forEach(function(e) {
    ee[e] = new b(e, 5, !1, e.toLowerCase(), null, !1, !1);
  });
  var wt = /[\-:]([a-z])/g;
  function ct(e) {
    return e[1].toUpperCase();
  }
  "accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(e) {
    var t = e.replace(
      wt,
      ct
    );
    ee[t] = new b(t, 1, !1, e, null, !1, !1);
  }), "xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(e) {
    var t = e.replace(wt, ct);
    ee[t] = new b(t, 1, !1, e, "http://www.w3.org/1999/xlink", !1, !1);
  }), ["xml:base", "xml:lang", "xml:space"].forEach(function(e) {
    var t = e.replace(wt, ct);
    ee[t] = new b(t, 1, !1, e, "http://www.w3.org/XML/1998/namespace", !1, !1);
  }), ["tabIndex", "crossOrigin"].forEach(function(e) {
    ee[e] = new b(e, 1, !1, e.toLowerCase(), null, !1, !1);
  }), ee.xlinkHref = new b("xlinkHref", 1, !1, "xlink:href", "http://www.w3.org/1999/xlink", !0, !1), ["src", "href", "action", "formAction"].forEach(function(e) {
    ee[e] = new b(e, 1, !1, e.toLowerCase(), null, !0, !0);
  });
  function et(e, t, n, r) {
    var l = ee.hasOwnProperty(t) ? ee[t] : null;
    (l !== null ? l.type !== 0 : r || !(2 < t.length) || t[0] !== "o" && t[0] !== "O" || t[1] !== "n" && t[1] !== "N") && (he(t, n, l, r) && (n = null), r || l === null ? T(t) && (n === null ? e.removeAttribute(t) : e.setAttribute(t, "" + n)) : l.mustUseProperty ? e[l.propertyName] = n === null ? l.type === 3 ? !1 : "" : n : (t = l.attributeName, r = l.attributeNamespace, n === null ? e.removeAttribute(t) : (l = l.type, n = l === 3 || l === 4 && n === !0 ? "" : "" + n, r ? e.setAttributeNS(r, t, n) : e.setAttribute(t, n))));
  }
  var _e = h.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED, tt = Symbol.for("react.element"), Te = Symbol.for("react.portal"), Oe = Symbol.for("react.fragment"), Ge = Symbol.for("react.strict_mode"), Rt = Symbol.for("react.profiler"), St = Symbol.for("react.provider"), Xt = Symbol.for("react.context"), ft = Symbol.for("react.forward_ref"), Be = Symbol.for("react.suspense"), nt = Symbol.for("react.suspense_list"), dt = Symbol.for("react.memo"), je = Symbol.for("react.lazy"), ce = Symbol.for("react.offscreen"), E = Symbol.iterator;
  function j(e) {
    return e === null || typeof e != "object" ? null : (e = E && e[E] || e["@@iterator"], typeof e == "function" ? e : null);
  }
  var N = Object.assign, c;
  function y(e) {
    if (c === void 0) try {
      throw Error();
    } catch (n) {
      var t = n.stack.trim().match(/\n( *(at )?)/);
      c = t && t[1] || "";
    }
    return `
` + c + e;
  }
  var U = !1;
  function B(e, t) {
    if (!e || U) return "";
    U = !0;
    var n = Error.prepareStackTrace;
    Error.prepareStackTrace = void 0;
    try {
      if (t) if (t = function() {
        throw Error();
      }, Object.defineProperty(t.prototype, "props", { set: function() {
        throw Error();
      } }), typeof Reflect == "object" && Reflect.construct) {
        try {
          Reflect.construct(t, []);
        } catch (p) {
          var r = p;
        }
        Reflect.construct(e, [], t);
      } else {
        try {
          t.call();
        } catch (p) {
          r = p;
        }
        e.call(t.prototype);
      }
      else {
        try {
          throw Error();
        } catch (p) {
          r = p;
        }
        e();
      }
    } catch (p) {
      if (p && r && typeof p.stack == "string") {
        for (var l = p.stack.split(`
`), o = r.stack.split(`
`), i = l.length - 1, u = o.length - 1; 1 <= i && 0 <= u && l[i] !== o[u]; ) u--;
        for (; 1 <= i && 0 <= u; i--, u--) if (l[i] !== o[u]) {
          if (i !== 1 || u !== 1)
            do
              if (i--, u--, 0 > u || l[i] !== o[u]) {
                var s = `
` + l[i].replace(" at new ", " at ");
                return e.displayName && s.includes("<anonymous>") && (s = s.replace("<anonymous>", e.displayName)), s;
              }
            while (1 <= i && 0 <= u);
          break;
        }
      }
    } finally {
      U = !1, Error.prepareStackTrace = n;
    }
    return (e = e ? e.displayName || e.name : "") ? y(e) : "";
  }
  function W(e) {
    switch (e.tag) {
      case 5:
        return y(e.type);
      case 16:
        return y("Lazy");
      case 13:
        return y("Suspense");
      case 19:
        return y("SuspenseList");
      case 0:
      case 2:
      case 15:
        return e = B(e.type, !1), e;
      case 11:
        return e = B(e.type.render, !1), e;
      case 1:
        return e = B(e.type, !0), e;
      default:
        return "";
    }
  }
  function $(e) {
    if (e == null) return null;
    if (typeof e == "function") return e.displayName || e.name || null;
    if (typeof e == "string") return e;
    switch (e) {
      case Oe:
        return "Fragment";
      case Te:
        return "Portal";
      case Rt:
        return "Profiler";
      case Ge:
        return "StrictMode";
      case Be:
        return "Suspense";
      case nt:
        return "SuspenseList";
    }
    if (typeof e == "object") switch (e.$$typeof) {
      case Xt:
        return (e.displayName || "Context") + ".Consumer";
      case St:
        return (e._context.displayName || "Context") + ".Provider";
      case ft:
        var t = e.render;
        return e = e.displayName, e || (e = t.displayName || t.name || "", e = e !== "" ? "ForwardRef(" + e + ")" : "ForwardRef"), e;
      case dt:
        return t = e.displayName || null, t !== null ? t : $(e.type) || "Memo";
      case je:
        t = e._payload, e = e._init;
        try {
          return $(e(t));
        } catch {
        }
    }
    return null;
  }
  function ne(e) {
    var t = e.type;
    switch (e.tag) {
      case 24:
        return "Cache";
      case 9:
        return (t.displayName || "Context") + ".Consumer";
      case 10:
        return (t._context.displayName || "Context") + ".Provider";
      case 18:
        return "DehydratedFragment";
      case 11:
        return e = t.render, e = e.displayName || e.name || "", t.displayName || (e !== "" ? "ForwardRef(" + e + ")" : "ForwardRef");
      case 7:
        return "Fragment";
      case 5:
        return t;
      case 4:
        return "Portal";
      case 3:
        return "Root";
      case 6:
        return "Text";
      case 16:
        return $(t);
      case 8:
        return t === Ge ? "StrictMode" : "Mode";
      case 22:
        return "Offscreen";
      case 12:
        return "Profiler";
      case 21:
        return "Scope";
      case 13:
        return "Suspense";
      case 19:
        return "SuspenseList";
      case 25:
        return "TracingMarker";
      case 1:
      case 0:
      case 17:
      case 2:
      case 14:
      case 15:
        if (typeof t == "function") return t.displayName || t.name || null;
        if (typeof t == "string") return t;
    }
    return null;
  }
  function q(e) {
    switch (typeof e) {
      case "boolean":
      case "number":
      case "string":
      case "undefined":
        return e;
      case "object":
        return e;
      default:
        return "";
    }
  }
  function ie(e) {
    var t = e.type;
    return (e = e.nodeName) && e.toLowerCase() === "input" && (t === "checkbox" || t === "radio");
  }
  function He(e) {
    var t = ie(e) ? "checked" : "value", n = Object.getOwnPropertyDescriptor(e.constructor.prototype, t), r = "" + e[t];
    if (!e.hasOwnProperty(t) && typeof n < "u" && typeof n.get == "function" && typeof n.set == "function") {
      var l = n.get, o = n.set;
      return Object.defineProperty(e, t, { configurable: !0, get: function() {
        return l.call(this);
      }, set: function(i) {
        r = "" + i, o.call(this, i);
      } }), Object.defineProperty(e, t, { enumerable: n.enumerable }), { getValue: function() {
        return r;
      }, setValue: function(i) {
        r = "" + i;
      }, stopTracking: function() {
        e._valueTracker = null, delete e[t];
      } };
    }
  }
  function xr(e) {
    e._valueTracker || (e._valueTracker = He(e));
  }
  function Di(e) {
    if (!e) return !1;
    var t = e._valueTracker;
    if (!t) return !0;
    var n = t.getValue(), r = "";
    return e && (r = ie(e) ? e.checked ? "true" : "false" : e.value), e = r, e !== n ? (t.setValue(e), !0) : !1;
  }
  function Cr(e) {
    if (e = e || (typeof document < "u" ? document : void 0), typeof e > "u") return null;
    try {
      return e.activeElement || e.body;
    } catch {
      return e.body;
    }
  }
  function jl(e, t) {
    var n = t.checked;
    return N({}, t, { defaultChecked: void 0, defaultValue: void 0, value: void 0, checked: n ?? e._wrapperState.initialChecked });
  }
  function Ii(e, t) {
    var n = t.defaultValue == null ? "" : t.defaultValue, r = t.checked != null ? t.checked : t.defaultChecked;
    n = q(t.value != null ? t.value : n), e._wrapperState = { initialChecked: r, initialValue: n, controlled: t.type === "checkbox" || t.type === "radio" ? t.checked != null : t.value != null };
  }
  function Ai(e, t) {
    t = t.checked, t != null && et(e, "checked", t, !1);
  }
  function Dl(e, t) {
    Ai(e, t);
    var n = q(t.value), r = t.type;
    if (n != null) r === "number" ? (n === 0 && e.value === "" || e.value != n) && (e.value = "" + n) : e.value !== "" + n && (e.value = "" + n);
    else if (r === "submit" || r === "reset") {
      e.removeAttribute("value");
      return;
    }
    t.hasOwnProperty("value") ? Il(e, t.type, n) : t.hasOwnProperty("defaultValue") && Il(e, t.type, q(t.defaultValue)), t.checked == null && t.defaultChecked != null && (e.defaultChecked = !!t.defaultChecked);
  }
  function Fi(e, t, n) {
    if (t.hasOwnProperty("value") || t.hasOwnProperty("defaultValue")) {
      var r = t.type;
      if (!(r !== "submit" && r !== "reset" || t.value !== void 0 && t.value !== null)) return;
      t = "" + e._wrapperState.initialValue, n || t === e.value || (e.value = t), e.defaultValue = t;
    }
    n = e.name, n !== "" && (e.name = ""), e.defaultChecked = !!e._wrapperState.initialChecked, n !== "" && (e.name = n);
  }
  function Il(e, t, n) {
    (t !== "number" || Cr(e.ownerDocument) !== e) && (n == null ? e.defaultValue = "" + e._wrapperState.initialValue : e.defaultValue !== "" + n && (e.defaultValue = "" + n));
  }
  var An = Array.isArray;
  function dn(e, t, n, r) {
    if (e = e.options, t) {
      t = {};
      for (var l = 0; l < n.length; l++) t["$" + n[l]] = !0;
      for (n = 0; n < e.length; n++) l = t.hasOwnProperty("$" + e[n].value), e[n].selected !== l && (e[n].selected = l), l && r && (e[n].defaultSelected = !0);
    } else {
      for (n = "" + q(n), t = null, l = 0; l < e.length; l++) {
        if (e[l].value === n) {
          e[l].selected = !0, r && (e[l].defaultSelected = !0);
          return;
        }
        t !== null || e[l].disabled || (t = e[l]);
      }
      t !== null && (t.selected = !0);
    }
  }
  function Al(e, t) {
    if (t.dangerouslySetInnerHTML != null) throw Error(m(91));
    return N({}, t, { value: void 0, defaultValue: void 0, children: "" + e._wrapperState.initialValue });
  }
  function Ui(e, t) {
    var n = t.value;
    if (n == null) {
      if (n = t.children, t = t.defaultValue, n != null) {
        if (t != null) throw Error(m(92));
        if (An(n)) {
          if (1 < n.length) throw Error(m(93));
          n = n[0];
        }
        t = n;
      }
      t == null && (t = ""), n = t;
    }
    e._wrapperState = { initialValue: q(n) };
  }
  function Vi(e, t) {
    var n = q(t.value), r = q(t.defaultValue);
    n != null && (n = "" + n, n !== e.value && (e.value = n), t.defaultValue == null && e.defaultValue !== n && (e.defaultValue = n)), r != null && (e.defaultValue = "" + r);
  }
  function Bi(e) {
    var t = e.textContent;
    t === e._wrapperState.initialValue && t !== "" && t !== null && (e.value = t);
  }
  function Hi(e) {
    switch (e) {
      case "svg":
        return "http://www.w3.org/2000/svg";
      case "math":
        return "http://www.w3.org/1998/Math/MathML";
      default:
        return "http://www.w3.org/1999/xhtml";
    }
  }
  function Fl(e, t) {
    return e == null || e === "http://www.w3.org/1999/xhtml" ? Hi(t) : e === "http://www.w3.org/2000/svg" && t === "foreignObject" ? "http://www.w3.org/1999/xhtml" : e;
  }
  var _r, Wi = (function(e) {
    return typeof MSApp < "u" && MSApp.execUnsafeLocalFunction ? function(t, n, r, l) {
      MSApp.execUnsafeLocalFunction(function() {
        return e(t, n, r, l);
      });
    } : e;
  })(function(e, t) {
    if (e.namespaceURI !== "http://www.w3.org/2000/svg" || "innerHTML" in e) e.innerHTML = t;
    else {
      for (_r = _r || document.createElement("div"), _r.innerHTML = "<svg>" + t.valueOf().toString() + "</svg>", t = _r.firstChild; e.firstChild; ) e.removeChild(e.firstChild);
      for (; t.firstChild; ) e.appendChild(t.firstChild);
    }
  });
  function Fn(e, t) {
    if (t) {
      var n = e.firstChild;
      if (n && n === e.lastChild && n.nodeType === 3) {
        n.nodeValue = t;
        return;
      }
    }
    e.textContent = t;
  }
  var Un = {
    animationIterationCount: !0,
    aspectRatio: !0,
    borderImageOutset: !0,
    borderImageSlice: !0,
    borderImageWidth: !0,
    boxFlex: !0,
    boxFlexGroup: !0,
    boxOrdinalGroup: !0,
    columnCount: !0,
    columns: !0,
    flex: !0,
    flexGrow: !0,
    flexPositive: !0,
    flexShrink: !0,
    flexNegative: !0,
    flexOrder: !0,
    gridArea: !0,
    gridRow: !0,
    gridRowEnd: !0,
    gridRowSpan: !0,
    gridRowStart: !0,
    gridColumn: !0,
    gridColumnEnd: !0,
    gridColumnSpan: !0,
    gridColumnStart: !0,
    fontWeight: !0,
    lineClamp: !0,
    lineHeight: !0,
    opacity: !0,
    order: !0,
    orphans: !0,
    tabSize: !0,
    widows: !0,
    zIndex: !0,
    zoom: !0,
    fillOpacity: !0,
    floodOpacity: !0,
    stopOpacity: !0,
    strokeDasharray: !0,
    strokeDashoffset: !0,
    strokeMiterlimit: !0,
    strokeOpacity: !0,
    strokeWidth: !0
  }, Wa = ["Webkit", "ms", "Moz", "O"];
  Object.keys(Un).forEach(function(e) {
    Wa.forEach(function(t) {
      t = t + e.charAt(0).toUpperCase() + e.substring(1), Un[t] = Un[e];
    });
  });
  function $i(e, t, n) {
    return t == null || typeof t == "boolean" || t === "" ? "" : n || typeof t != "number" || t === 0 || Un.hasOwnProperty(e) && Un[e] ? ("" + t).trim() : t + "px";
  }
  function Qi(e, t) {
    e = e.style;
    for (var n in t) if (t.hasOwnProperty(n)) {
      var r = n.indexOf("--") === 0, l = $i(n, t[n], r);
      n === "float" && (n = "cssFloat"), r ? e.setProperty(n, l) : e[n] = l;
    }
  }
  var $a = N({ menuitem: !0 }, { area: !0, base: !0, br: !0, col: !0, embed: !0, hr: !0, img: !0, input: !0, keygen: !0, link: !0, meta: !0, param: !0, source: !0, track: !0, wbr: !0 });
  function Ul(e, t) {
    if (t) {
      if ($a[e] && (t.children != null || t.dangerouslySetInnerHTML != null)) throw Error(m(137, e));
      if (t.dangerouslySetInnerHTML != null) {
        if (t.children != null) throw Error(m(60));
        if (typeof t.dangerouslySetInnerHTML != "object" || !("__html" in t.dangerouslySetInnerHTML)) throw Error(m(61));
      }
      if (t.style != null && typeof t.style != "object") throw Error(m(62));
    }
  }
  function Vl(e, t) {
    if (e.indexOf("-") === -1) return typeof t.is == "string";
    switch (e) {
      case "annotation-xml":
      case "color-profile":
      case "font-face":
      case "font-face-src":
      case "font-face-uri":
      case "font-face-format":
      case "font-face-name":
      case "missing-glyph":
        return !1;
      default:
        return !0;
    }
  }
  var Bl = null;
  function Hl(e) {
    return e = e.target || e.srcElement || window, e.correspondingUseElement && (e = e.correspondingUseElement), e.nodeType === 3 ? e.parentNode : e;
  }
  var Wl = null, pn = null, mn = null;
  function Ki(e) {
    if (e = ur(e)) {
      if (typeof Wl != "function") throw Error(m(280));
      var t = e.stateNode;
      t && (t = Yr(t), Wl(e.stateNode, e.type, t));
    }
  }
  function Gi(e) {
    pn ? mn ? mn.push(e) : mn = [e] : pn = e;
  }
  function Yi() {
    if (pn) {
      var e = pn, t = mn;
      if (mn = pn = null, Ki(e), t) for (e = 0; e < t.length; e++) Ki(t[e]);
    }
  }
  function Xi(e, t) {
    return e(t);
  }
  function qi() {
  }
  var $l = !1;
  function Zi(e, t, n) {
    if ($l) return e(t, n);
    $l = !0;
    try {
      return Xi(e, t, n);
    } finally {
      $l = !1, (pn !== null || mn !== null) && (qi(), Yi());
    }
  }
  function Vn(e, t) {
    var n = e.stateNode;
    if (n === null) return null;
    var r = Yr(n);
    if (r === null) return null;
    n = r[t];
    e: switch (t) {
      case "onClick":
      case "onClickCapture":
      case "onDoubleClick":
      case "onDoubleClickCapture":
      case "onMouseDown":
      case "onMouseDownCapture":
      case "onMouseMove":
      case "onMouseMoveCapture":
      case "onMouseUp":
      case "onMouseUpCapture":
      case "onMouseEnter":
        (r = !r.disabled) || (e = e.type, r = !(e === "button" || e === "input" || e === "select" || e === "textarea")), e = !r;
        break e;
      default:
        e = !1;
    }
    if (e) return null;
    if (n && typeof n != "function") throw Error(m(231, t, typeof n));
    return n;
  }
  var Ql = !1;
  if (I) try {
    var Bn = {};
    Object.defineProperty(Bn, "passive", { get: function() {
      Ql = !0;
    } }), window.addEventListener("test", Bn, Bn), window.removeEventListener("test", Bn, Bn);
  } catch {
    Ql = !1;
  }
  function Qa(e, t, n, r, l, o, i, u, s) {
    var p = Array.prototype.slice.call(arguments, 3);
    try {
      t.apply(n, p);
    } catch (w) {
      this.onError(w);
    }
  }
  var Hn = !1, Nr = null, Pr = !1, Kl = null, Ka = { onError: function(e) {
    Hn = !0, Nr = e;
  } };
  function Ga(e, t, n, r, l, o, i, u, s) {
    Hn = !1, Nr = null, Qa.apply(Ka, arguments);
  }
  function Ya(e, t, n, r, l, o, i, u, s) {
    if (Ga.apply(this, arguments), Hn) {
      if (Hn) {
        var p = Nr;
        Hn = !1, Nr = null;
      } else throw Error(m(198));
      Pr || (Pr = !0, Kl = p);
    }
  }
  function qt(e) {
    var t = e, n = e;
    if (e.alternate) for (; t.return; ) t = t.return;
    else {
      e = t;
      do
        t = e, (t.flags & 4098) !== 0 && (n = t.return), e = t.return;
      while (e);
    }
    return t.tag === 3 ? n : null;
  }
  function Ji(e) {
    if (e.tag === 13) {
      var t = e.memoizedState;
      if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null) return t.dehydrated;
    }
    return null;
  }
  function bi(e) {
    if (qt(e) !== e) throw Error(m(188));
  }
  function Xa(e) {
    var t = e.alternate;
    if (!t) {
      if (t = qt(e), t === null) throw Error(m(188));
      return t !== e ? null : e;
    }
    for (var n = e, r = t; ; ) {
      var l = n.return;
      if (l === null) break;
      var o = l.alternate;
      if (o === null) {
        if (r = l.return, r !== null) {
          n = r;
          continue;
        }
        break;
      }
      if (l.child === o.child) {
        for (o = l.child; o; ) {
          if (o === n) return bi(l), e;
          if (o === r) return bi(l), t;
          o = o.sibling;
        }
        throw Error(m(188));
      }
      if (n.return !== r.return) n = l, r = o;
      else {
        for (var i = !1, u = l.child; u; ) {
          if (u === n) {
            i = !0, n = l, r = o;
            break;
          }
          if (u === r) {
            i = !0, r = l, n = o;
            break;
          }
          u = u.sibling;
        }
        if (!i) {
          for (u = o.child; u; ) {
            if (u === n) {
              i = !0, n = o, r = l;
              break;
            }
            if (u === r) {
              i = !0, r = o, n = l;
              break;
            }
            u = u.sibling;
          }
          if (!i) throw Error(m(189));
        }
      }
      if (n.alternate !== r) throw Error(m(190));
    }
    if (n.tag !== 3) throw Error(m(188));
    return n.stateNode.current === n ? e : t;
  }
  function eu(e) {
    return e = Xa(e), e !== null ? tu(e) : null;
  }
  function tu(e) {
    if (e.tag === 5 || e.tag === 6) return e;
    for (e = e.child; e !== null; ) {
      var t = tu(e);
      if (t !== null) return t;
      e = e.sibling;
    }
    return null;
  }
  var nu = O.unstable_scheduleCallback, ru = O.unstable_cancelCallback, qa = O.unstable_shouldYield, Za = O.unstable_requestPaint, pe = O.unstable_now, Ja = O.unstable_getCurrentPriorityLevel, Gl = O.unstable_ImmediatePriority, lu = O.unstable_UserBlockingPriority, Mr = O.unstable_NormalPriority, ba = O.unstable_LowPriority, ou = O.unstable_IdlePriority, Rr = null, pt = null;
  function ec(e) {
    if (pt && typeof pt.onCommitFiberRoot == "function") try {
      pt.onCommitFiberRoot(Rr, e, void 0, (e.current.flags & 128) === 128);
    } catch {
    }
  }
  var rt = Math.clz32 ? Math.clz32 : rc, tc = Math.log, nc = Math.LN2;
  function rc(e) {
    return e >>>= 0, e === 0 ? 32 : 31 - (tc(e) / nc | 0) | 0;
  }
  var Tr = 64, Lr = 4194304;
  function Wn(e) {
    switch (e & -e) {
      case 1:
        return 1;
      case 2:
        return 2;
      case 4:
        return 4;
      case 8:
        return 8;
      case 16:
        return 16;
      case 32:
        return 32;
      case 64:
      case 128:
      case 256:
      case 512:
      case 1024:
      case 2048:
      case 4096:
      case 8192:
      case 16384:
      case 32768:
      case 65536:
      case 131072:
      case 262144:
      case 524288:
      case 1048576:
      case 2097152:
        return e & 4194240;
      case 4194304:
      case 8388608:
      case 16777216:
      case 33554432:
      case 67108864:
        return e & 130023424;
      case 134217728:
        return 134217728;
      case 268435456:
        return 268435456;
      case 536870912:
        return 536870912;
      case 1073741824:
        return 1073741824;
      default:
        return e;
    }
  }
  function zr(e, t) {
    var n = e.pendingLanes;
    if (n === 0) return 0;
    var r = 0, l = e.suspendedLanes, o = e.pingedLanes, i = n & 268435455;
    if (i !== 0) {
      var u = i & ~l;
      u !== 0 ? r = Wn(u) : (o &= i, o !== 0 && (r = Wn(o)));
    } else i = n & ~l, i !== 0 ? r = Wn(i) : o !== 0 && (r = Wn(o));
    if (r === 0) return 0;
    if (t !== 0 && t !== r && (t & l) === 0 && (l = r & -r, o = t & -t, l >= o || l === 16 && (o & 4194240) !== 0)) return t;
    if ((r & 4) !== 0 && (r |= n & 16), t = e.entangledLanes, t !== 0) for (e = e.entanglements, t &= r; 0 < t; ) n = 31 - rt(t), l = 1 << n, r |= e[n], t &= ~l;
    return r;
  }
  function lc(e, t) {
    switch (e) {
      case 1:
      case 2:
      case 4:
        return t + 250;
      case 8:
      case 16:
      case 32:
      case 64:
      case 128:
      case 256:
      case 512:
      case 1024:
      case 2048:
      case 4096:
      case 8192:
      case 16384:
      case 32768:
      case 65536:
      case 131072:
      case 262144:
      case 524288:
      case 1048576:
      case 2097152:
        return t + 5e3;
      case 4194304:
      case 8388608:
      case 16777216:
      case 33554432:
      case 67108864:
        return -1;
      case 134217728:
      case 268435456:
      case 536870912:
      case 1073741824:
        return -1;
      default:
        return -1;
    }
  }
  function oc(e, t) {
    for (var n = e.suspendedLanes, r = e.pingedLanes, l = e.expirationTimes, o = e.pendingLanes; 0 < o; ) {
      var i = 31 - rt(o), u = 1 << i, s = l[i];
      s === -1 ? ((u & n) === 0 || (u & r) !== 0) && (l[i] = lc(u, t)) : s <= t && (e.expiredLanes |= u), o &= ~u;
    }
  }
  function Yl(e) {
    return e = e.pendingLanes & -1073741825, e !== 0 ? e : e & 1073741824 ? 1073741824 : 0;
  }
  function iu() {
    var e = Tr;
    return Tr <<= 1, (Tr & 4194240) === 0 && (Tr = 64), e;
  }
  function Xl(e) {
    for (var t = [], n = 0; 31 > n; n++) t.push(e);
    return t;
  }
  function $n(e, t, n) {
    e.pendingLanes |= t, t !== 536870912 && (e.suspendedLanes = 0, e.pingedLanes = 0), e = e.eventTimes, t = 31 - rt(t), e[t] = n;
  }
  function ic(e, t) {
    var n = e.pendingLanes & ~t;
    e.pendingLanes = t, e.suspendedLanes = 0, e.pingedLanes = 0, e.expiredLanes &= t, e.mutableReadLanes &= t, e.entangledLanes &= t, t = e.entanglements;
    var r = e.eventTimes;
    for (e = e.expirationTimes; 0 < n; ) {
      var l = 31 - rt(n), o = 1 << l;
      t[l] = 0, r[l] = -1, e[l] = -1, n &= ~o;
    }
  }
  function ql(e, t) {
    var n = e.entangledLanes |= t;
    for (e = e.entanglements; n; ) {
      var r = 31 - rt(n), l = 1 << r;
      l & t | e[r] & t && (e[r] |= t), n &= ~l;
    }
  }
  var Z = 0;
  function uu(e) {
    return e &= -e, 1 < e ? 4 < e ? (e & 268435455) !== 0 ? 16 : 536870912 : 4 : 1;
  }
  var su, Zl, au, cu, fu, Jl = !1, Or = [], Tt = null, Lt = null, zt = null, Qn = /* @__PURE__ */ new Map(), Kn = /* @__PURE__ */ new Map(), Ot = [], uc = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(" ");
  function du(e, t) {
    switch (e) {
      case "focusin":
      case "focusout":
        Tt = null;
        break;
      case "dragenter":
      case "dragleave":
        Lt = null;
        break;
      case "mouseover":
      case "mouseout":
        zt = null;
        break;
      case "pointerover":
      case "pointerout":
        Qn.delete(t.pointerId);
        break;
      case "gotpointercapture":
      case "lostpointercapture":
        Kn.delete(t.pointerId);
    }
  }
  function Gn(e, t, n, r, l, o) {
    return e === null || e.nativeEvent !== o ? (e = { blockedOn: t, domEventName: n, eventSystemFlags: r, nativeEvent: o, targetContainers: [l] }, t !== null && (t = ur(t), t !== null && Zl(t)), e) : (e.eventSystemFlags |= r, t = e.targetContainers, l !== null && t.indexOf(l) === -1 && t.push(l), e);
  }
  function sc(e, t, n, r, l) {
    switch (t) {
      case "focusin":
        return Tt = Gn(Tt, e, t, n, r, l), !0;
      case "dragenter":
        return Lt = Gn(Lt, e, t, n, r, l), !0;
      case "mouseover":
        return zt = Gn(zt, e, t, n, r, l), !0;
      case "pointerover":
        var o = l.pointerId;
        return Qn.set(o, Gn(Qn.get(o) || null, e, t, n, r, l)), !0;
      case "gotpointercapture":
        return o = l.pointerId, Kn.set(o, Gn(Kn.get(o) || null, e, t, n, r, l)), !0;
    }
    return !1;
  }
  function pu(e) {
    var t = Zt(e.target);
    if (t !== null) {
      var n = qt(t);
      if (n !== null) {
        if (t = n.tag, t === 13) {
          if (t = Ji(n), t !== null) {
            e.blockedOn = t, fu(e.priority, function() {
              au(n);
            });
            return;
          }
        } else if (t === 3 && n.stateNode.current.memoizedState.isDehydrated) {
          e.blockedOn = n.tag === 3 ? n.stateNode.containerInfo : null;
          return;
        }
      }
    }
    e.blockedOn = null;
  }
  function jr(e) {
    if (e.blockedOn !== null) return !1;
    for (var t = e.targetContainers; 0 < t.length; ) {
      var n = eo(e.domEventName, e.eventSystemFlags, t[0], e.nativeEvent);
      if (n === null) {
        n = e.nativeEvent;
        var r = new n.constructor(n.type, n);
        Bl = r, n.target.dispatchEvent(r), Bl = null;
      } else return t = ur(n), t !== null && Zl(t), e.blockedOn = n, !1;
      t.shift();
    }
    return !0;
  }
  function mu(e, t, n) {
    jr(e) && n.delete(t);
  }
  function ac() {
    Jl = !1, Tt !== null && jr(Tt) && (Tt = null), Lt !== null && jr(Lt) && (Lt = null), zt !== null && jr(zt) && (zt = null), Qn.forEach(mu), Kn.forEach(mu);
  }
  function Yn(e, t) {
    e.blockedOn === t && (e.blockedOn = null, Jl || (Jl = !0, O.unstable_scheduleCallback(O.unstable_NormalPriority, ac)));
  }
  function Xn(e) {
    function t(l) {
      return Yn(l, e);
    }
    if (0 < Or.length) {
      Yn(Or[0], e);
      for (var n = 1; n < Or.length; n++) {
        var r = Or[n];
        r.blockedOn === e && (r.blockedOn = null);
      }
    }
    for (Tt !== null && Yn(Tt, e), Lt !== null && Yn(Lt, e), zt !== null && Yn(zt, e), Qn.forEach(t), Kn.forEach(t), n = 0; n < Ot.length; n++) r = Ot[n], r.blockedOn === e && (r.blockedOn = null);
    for (; 0 < Ot.length && (n = Ot[0], n.blockedOn === null); ) pu(n), n.blockedOn === null && Ot.shift();
  }
  var hn = _e.ReactCurrentBatchConfig, Dr = !0;
  function cc(e, t, n, r) {
    var l = Z, o = hn.transition;
    hn.transition = null;
    try {
      Z = 1, bl(e, t, n, r);
    } finally {
      Z = l, hn.transition = o;
    }
  }
  function fc(e, t, n, r) {
    var l = Z, o = hn.transition;
    hn.transition = null;
    try {
      Z = 4, bl(e, t, n, r);
    } finally {
      Z = l, hn.transition = o;
    }
  }
  function bl(e, t, n, r) {
    if (Dr) {
      var l = eo(e, t, n, r);
      if (l === null) yo(e, t, r, Ir, n), du(e, r);
      else if (sc(l, e, t, n, r)) r.stopPropagation();
      else if (du(e, r), t & 4 && -1 < uc.indexOf(e)) {
        for (; l !== null; ) {
          var o = ur(l);
          if (o !== null && su(o), o = eo(e, t, n, r), o === null && yo(e, t, r, Ir, n), o === l) break;
          l = o;
        }
        l !== null && r.stopPropagation();
      } else yo(e, t, r, null, n);
    }
  }
  var Ir = null;
  function eo(e, t, n, r) {
    if (Ir = null, e = Hl(r), e = Zt(e), e !== null) if (t = qt(e), t === null) e = null;
    else if (n = t.tag, n === 13) {
      if (e = Ji(t), e !== null) return e;
      e = null;
    } else if (n === 3) {
      if (t.stateNode.current.memoizedState.isDehydrated) return t.tag === 3 ? t.stateNode.containerInfo : null;
      e = null;
    } else t !== e && (e = null);
    return Ir = e, null;
  }
  function hu(e) {
    switch (e) {
      case "cancel":
      case "click":
      case "close":
      case "contextmenu":
      case "copy":
      case "cut":
      case "auxclick":
      case "dblclick":
      case "dragend":
      case "dragstart":
      case "drop":
      case "focusin":
      case "focusout":
      case "input":
      case "invalid":
      case "keydown":
      case "keypress":
      case "keyup":
      case "mousedown":
      case "mouseup":
      case "paste":
      case "pause":
      case "play":
      case "pointercancel":
      case "pointerdown":
      case "pointerup":
      case "ratechange":
      case "reset":
      case "resize":
      case "seeked":
      case "submit":
      case "touchcancel":
      case "touchend":
      case "touchstart":
      case "volumechange":
      case "change":
      case "selectionchange":
      case "textInput":
      case "compositionstart":
      case "compositionend":
      case "compositionupdate":
      case "beforeblur":
      case "afterblur":
      case "beforeinput":
      case "blur":
      case "fullscreenchange":
      case "focus":
      case "hashchange":
      case "popstate":
      case "select":
      case "selectstart":
        return 1;
      case "drag":
      case "dragenter":
      case "dragexit":
      case "dragleave":
      case "dragover":
      case "mousemove":
      case "mouseout":
      case "mouseover":
      case "pointermove":
      case "pointerout":
      case "pointerover":
      case "scroll":
      case "toggle":
      case "touchmove":
      case "wheel":
      case "mouseenter":
      case "mouseleave":
      case "pointerenter":
      case "pointerleave":
        return 4;
      case "message":
        switch (Ja()) {
          case Gl:
            return 1;
          case lu:
            return 4;
          case Mr:
          case ba:
            return 16;
          case ou:
            return 536870912;
          default:
            return 16;
        }
      default:
        return 16;
    }
  }
  var jt = null, to = null, Ar = null;
  function vu() {
    if (Ar) return Ar;
    var e, t = to, n = t.length, r, l = "value" in jt ? jt.value : jt.textContent, o = l.length;
    for (e = 0; e < n && t[e] === l[e]; e++) ;
    var i = n - e;
    for (r = 1; r <= i && t[n - r] === l[o - r]; r++) ;
    return Ar = l.slice(e, 1 < r ? 1 - r : void 0);
  }
  function Fr(e) {
    var t = e.keyCode;
    return "charCode" in e ? (e = e.charCode, e === 0 && t === 13 && (e = 13)) : e = t, e === 10 && (e = 13), 32 <= e || e === 13 ? e : 0;
  }
  function Ur() {
    return !0;
  }
  function gu() {
    return !1;
  }
  function We(e) {
    function t(n, r, l, o, i) {
      this._reactName = n, this._targetInst = l, this.type = r, this.nativeEvent = o, this.target = i, this.currentTarget = null;
      for (var u in e) e.hasOwnProperty(u) && (n = e[u], this[u] = n ? n(o) : o[u]);
      return this.isDefaultPrevented = (o.defaultPrevented != null ? o.defaultPrevented : o.returnValue === !1) ? Ur : gu, this.isPropagationStopped = gu, this;
    }
    return N(t.prototype, { preventDefault: function() {
      this.defaultPrevented = !0;
      var n = this.nativeEvent;
      n && (n.preventDefault ? n.preventDefault() : typeof n.returnValue != "unknown" && (n.returnValue = !1), this.isDefaultPrevented = Ur);
    }, stopPropagation: function() {
      var n = this.nativeEvent;
      n && (n.stopPropagation ? n.stopPropagation() : typeof n.cancelBubble != "unknown" && (n.cancelBubble = !0), this.isPropagationStopped = Ur);
    }, persist: function() {
    }, isPersistent: Ur }), t;
  }
  var vn = { eventPhase: 0, bubbles: 0, cancelable: 0, timeStamp: function(e) {
    return e.timeStamp || Date.now();
  }, defaultPrevented: 0, isTrusted: 0 }, no = We(vn), qn = N({}, vn, { view: 0, detail: 0 }), dc = We(qn), ro, lo, Zn, Vr = N({}, qn, { screenX: 0, screenY: 0, clientX: 0, clientY: 0, pageX: 0, pageY: 0, ctrlKey: 0, shiftKey: 0, altKey: 0, metaKey: 0, getModifierState: io, button: 0, buttons: 0, relatedTarget: function(e) {
    return e.relatedTarget === void 0 ? e.fromElement === e.srcElement ? e.toElement : e.fromElement : e.relatedTarget;
  }, movementX: function(e) {
    return "movementX" in e ? e.movementX : (e !== Zn && (Zn && e.type === "mousemove" ? (ro = e.screenX - Zn.screenX, lo = e.screenY - Zn.screenY) : lo = ro = 0, Zn = e), ro);
  }, movementY: function(e) {
    return "movementY" in e ? e.movementY : lo;
  } }), yu = We(Vr), pc = N({}, Vr, { dataTransfer: 0 }), mc = We(pc), hc = N({}, qn, { relatedTarget: 0 }), oo = We(hc), vc = N({}, vn, { animationName: 0, elapsedTime: 0, pseudoElement: 0 }), gc = We(vc), yc = N({}, vn, { clipboardData: function(e) {
    return "clipboardData" in e ? e.clipboardData : window.clipboardData;
  } }), wc = We(yc), Sc = N({}, vn, { data: 0 }), wu = We(Sc), kc = {
    Esc: "Escape",
    Spacebar: " ",
    Left: "ArrowLeft",
    Up: "ArrowUp",
    Right: "ArrowRight",
    Down: "ArrowDown",
    Del: "Delete",
    Win: "OS",
    Menu: "ContextMenu",
    Apps: "ContextMenu",
    Scroll: "ScrollLock",
    MozPrintableKey: "Unidentified"
  }, Ec = {
    8: "Backspace",
    9: "Tab",
    12: "Clear",
    13: "Enter",
    16: "Shift",
    17: "Control",
    18: "Alt",
    19: "Pause",
    20: "CapsLock",
    27: "Escape",
    32: " ",
    33: "PageUp",
    34: "PageDown",
    35: "End",
    36: "Home",
    37: "ArrowLeft",
    38: "ArrowUp",
    39: "ArrowRight",
    40: "ArrowDown",
    45: "Insert",
    46: "Delete",
    112: "F1",
    113: "F2",
    114: "F3",
    115: "F4",
    116: "F5",
    117: "F6",
    118: "F7",
    119: "F8",
    120: "F9",
    121: "F10",
    122: "F11",
    123: "F12",
    144: "NumLock",
    145: "ScrollLock",
    224: "Meta"
  }, xc = { Alt: "altKey", Control: "ctrlKey", Meta: "metaKey", Shift: "shiftKey" };
  function Cc(e) {
    var t = this.nativeEvent;
    return t.getModifierState ? t.getModifierState(e) : (e = xc[e]) ? !!t[e] : !1;
  }
  function io() {
    return Cc;
  }
  var _c = N({}, qn, { key: function(e) {
    if (e.key) {
      var t = kc[e.key] || e.key;
      if (t !== "Unidentified") return t;
    }
    return e.type === "keypress" ? (e = Fr(e), e === 13 ? "Enter" : String.fromCharCode(e)) : e.type === "keydown" || e.type === "keyup" ? Ec[e.keyCode] || "Unidentified" : "";
  }, code: 0, location: 0, ctrlKey: 0, shiftKey: 0, altKey: 0, metaKey: 0, repeat: 0, locale: 0, getModifierState: io, charCode: function(e) {
    return e.type === "keypress" ? Fr(e) : 0;
  }, keyCode: function(e) {
    return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
  }, which: function(e) {
    return e.type === "keypress" ? Fr(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
  } }), Nc = We(_c), Pc = N({}, Vr, { pointerId: 0, width: 0, height: 0, pressure: 0, tangentialPressure: 0, tiltX: 0, tiltY: 0, twist: 0, pointerType: 0, isPrimary: 0 }), Su = We(Pc), Mc = N({}, qn, { touches: 0, targetTouches: 0, changedTouches: 0, altKey: 0, metaKey: 0, ctrlKey: 0, shiftKey: 0, getModifierState: io }), Rc = We(Mc), Tc = N({}, vn, { propertyName: 0, elapsedTime: 0, pseudoElement: 0 }), Lc = We(Tc), zc = N({}, Vr, {
    deltaX: function(e) {
      return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
    },
    deltaY: function(e) {
      return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
    },
    deltaZ: 0,
    deltaMode: 0
  }), Oc = We(zc), jc = [9, 13, 27, 32], uo = I && "CompositionEvent" in window, Jn = null;
  I && "documentMode" in document && (Jn = document.documentMode);
  var Dc = I && "TextEvent" in window && !Jn, ku = I && (!uo || Jn && 8 < Jn && 11 >= Jn), Eu = " ", xu = !1;
  function Cu(e, t) {
    switch (e) {
      case "keyup":
        return jc.indexOf(t.keyCode) !== -1;
      case "keydown":
        return t.keyCode !== 229;
      case "keypress":
      case "mousedown":
      case "focusout":
        return !0;
      default:
        return !1;
    }
  }
  function _u(e) {
    return e = e.detail, typeof e == "object" && "data" in e ? e.data : null;
  }
  var gn = !1;
  function Ic(e, t) {
    switch (e) {
      case "compositionend":
        return _u(t);
      case "keypress":
        return t.which !== 32 ? null : (xu = !0, Eu);
      case "textInput":
        return e = t.data, e === Eu && xu ? null : e;
      default:
        return null;
    }
  }
  function Ac(e, t) {
    if (gn) return e === "compositionend" || !uo && Cu(e, t) ? (e = vu(), Ar = to = jt = null, gn = !1, e) : null;
    switch (e) {
      case "paste":
        return null;
      case "keypress":
        if (!(t.ctrlKey || t.altKey || t.metaKey) || t.ctrlKey && t.altKey) {
          if (t.char && 1 < t.char.length) return t.char;
          if (t.which) return String.fromCharCode(t.which);
        }
        return null;
      case "compositionend":
        return ku && t.locale !== "ko" ? null : t.data;
      default:
        return null;
    }
  }
  var Fc = { color: !0, date: !0, datetime: !0, "datetime-local": !0, email: !0, month: !0, number: !0, password: !0, range: !0, search: !0, tel: !0, text: !0, time: !0, url: !0, week: !0 };
  function Nu(e) {
    var t = e && e.nodeName && e.nodeName.toLowerCase();
    return t === "input" ? !!Fc[e.type] : t === "textarea";
  }
  function Pu(e, t, n, r) {
    Gi(r), t = Qr(t, "onChange"), 0 < t.length && (n = new no("onChange", "change", null, n, r), e.push({ event: n, listeners: t }));
  }
  var bn = null, er = null;
  function Uc(e) {
    Qu(e, 0);
  }
  function Br(e) {
    var t = En(e);
    if (Di(t)) return e;
  }
  function Vc(e, t) {
    if (e === "change") return t;
  }
  var Mu = !1;
  if (I) {
    var so;
    if (I) {
      var ao = "oninput" in document;
      if (!ao) {
        var Ru = document.createElement("div");
        Ru.setAttribute("oninput", "return;"), ao = typeof Ru.oninput == "function";
      }
      so = ao;
    } else so = !1;
    Mu = so && (!document.documentMode || 9 < document.documentMode);
  }
  function Tu() {
    bn && (bn.detachEvent("onpropertychange", Lu), er = bn = null);
  }
  function Lu(e) {
    if (e.propertyName === "value" && Br(er)) {
      var t = [];
      Pu(t, er, e, Hl(e)), Zi(Uc, t);
    }
  }
  function Bc(e, t, n) {
    e === "focusin" ? (Tu(), bn = t, er = n, bn.attachEvent("onpropertychange", Lu)) : e === "focusout" && Tu();
  }
  function Hc(e) {
    if (e === "selectionchange" || e === "keyup" || e === "keydown") return Br(er);
  }
  function Wc(e, t) {
    if (e === "click") return Br(t);
  }
  function $c(e, t) {
    if (e === "input" || e === "change") return Br(t);
  }
  function Qc(e, t) {
    return e === t && (e !== 0 || 1 / e === 1 / t) || e !== e && t !== t;
  }
  var lt = typeof Object.is == "function" ? Object.is : Qc;
  function tr(e, t) {
    if (lt(e, t)) return !0;
    if (typeof e != "object" || e === null || typeof t != "object" || t === null) return !1;
    var n = Object.keys(e), r = Object.keys(t);
    if (n.length !== r.length) return !1;
    for (r = 0; r < n.length; r++) {
      var l = n[r];
      if (!F.call(t, l) || !lt(e[l], t[l])) return !1;
    }
    return !0;
  }
  function zu(e) {
    for (; e && e.firstChild; ) e = e.firstChild;
    return e;
  }
  function Ou(e, t) {
    var n = zu(e);
    e = 0;
    for (var r; n; ) {
      if (n.nodeType === 3) {
        if (r = e + n.textContent.length, e <= t && r >= t) return { node: n, offset: t - e };
        e = r;
      }
      e: {
        for (; n; ) {
          if (n.nextSibling) {
            n = n.nextSibling;
            break e;
          }
          n = n.parentNode;
        }
        n = void 0;
      }
      n = zu(n);
    }
  }
  function ju(e, t) {
    return e && t ? e === t ? !0 : e && e.nodeType === 3 ? !1 : t && t.nodeType === 3 ? ju(e, t.parentNode) : "contains" in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1 : !1;
  }
  function Du() {
    for (var e = window, t = Cr(); t instanceof e.HTMLIFrameElement; ) {
      try {
        var n = typeof t.contentWindow.location.href == "string";
      } catch {
        n = !1;
      }
      if (n) e = t.contentWindow;
      else break;
      t = Cr(e.document);
    }
    return t;
  }
  function co(e) {
    var t = e && e.nodeName && e.nodeName.toLowerCase();
    return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true");
  }
  function Kc(e) {
    var t = Du(), n = e.focusedElem, r = e.selectionRange;
    if (t !== n && n && n.ownerDocument && ju(n.ownerDocument.documentElement, n)) {
      if (r !== null && co(n)) {
        if (t = r.start, e = r.end, e === void 0 && (e = t), "selectionStart" in n) n.selectionStart = t, n.selectionEnd = Math.min(e, n.value.length);
        else if (e = (t = n.ownerDocument || document) && t.defaultView || window, e.getSelection) {
          e = e.getSelection();
          var l = n.textContent.length, o = Math.min(r.start, l);
          r = r.end === void 0 ? o : Math.min(r.end, l), !e.extend && o > r && (l = r, r = o, o = l), l = Ou(n, o);
          var i = Ou(
            n,
            r
          );
          l && i && (e.rangeCount !== 1 || e.anchorNode !== l.node || e.anchorOffset !== l.offset || e.focusNode !== i.node || e.focusOffset !== i.offset) && (t = t.createRange(), t.setStart(l.node, l.offset), e.removeAllRanges(), o > r ? (e.addRange(t), e.extend(i.node, i.offset)) : (t.setEnd(i.node, i.offset), e.addRange(t)));
        }
      }
      for (t = [], e = n; e = e.parentNode; ) e.nodeType === 1 && t.push({ element: e, left: e.scrollLeft, top: e.scrollTop });
      for (typeof n.focus == "function" && n.focus(), n = 0; n < t.length; n++) e = t[n], e.element.scrollLeft = e.left, e.element.scrollTop = e.top;
    }
  }
  var Gc = I && "documentMode" in document && 11 >= document.documentMode, yn = null, fo = null, nr = null, po = !1;
  function Iu(e, t, n) {
    var r = n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
    po || yn == null || yn !== Cr(r) || (r = yn, "selectionStart" in r && co(r) ? r = { start: r.selectionStart, end: r.selectionEnd } : (r = (r.ownerDocument && r.ownerDocument.defaultView || window).getSelection(), r = { anchorNode: r.anchorNode, anchorOffset: r.anchorOffset, focusNode: r.focusNode, focusOffset: r.focusOffset }), nr && tr(nr, r) || (nr = r, r = Qr(fo, "onSelect"), 0 < r.length && (t = new no("onSelect", "select", null, t, n), e.push({ event: t, listeners: r }), t.target = yn)));
  }
  function Hr(e, t) {
    var n = {};
    return n[e.toLowerCase()] = t.toLowerCase(), n["Webkit" + e] = "webkit" + t, n["Moz" + e] = "moz" + t, n;
  }
  var wn = { animationend: Hr("Animation", "AnimationEnd"), animationiteration: Hr("Animation", "AnimationIteration"), animationstart: Hr("Animation", "AnimationStart"), transitionend: Hr("Transition", "TransitionEnd") }, mo = {}, Au = {};
  I && (Au = document.createElement("div").style, "AnimationEvent" in window || (delete wn.animationend.animation, delete wn.animationiteration.animation, delete wn.animationstart.animation), "TransitionEvent" in window || delete wn.transitionend.transition);
  function Wr(e) {
    if (mo[e]) return mo[e];
    if (!wn[e]) return e;
    var t = wn[e], n;
    for (n in t) if (t.hasOwnProperty(n) && n in Au) return mo[e] = t[n];
    return e;
  }
  var Fu = Wr("animationend"), Uu = Wr("animationiteration"), Vu = Wr("animationstart"), Bu = Wr("transitionend"), Hu = /* @__PURE__ */ new Map(), Wu = "abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
  function Dt(e, t) {
    Hu.set(e, t), K(t, [e]);
  }
  for (var ho = 0; ho < Wu.length; ho++) {
    var vo = Wu[ho], Yc = vo.toLowerCase(), Xc = vo[0].toUpperCase() + vo.slice(1);
    Dt(Yc, "on" + Xc);
  }
  Dt(Fu, "onAnimationEnd"), Dt(Uu, "onAnimationIteration"), Dt(Vu, "onAnimationStart"), Dt("dblclick", "onDoubleClick"), Dt("focusin", "onFocus"), Dt("focusout", "onBlur"), Dt(Bu, "onTransitionEnd"), A("onMouseEnter", ["mouseout", "mouseover"]), A("onMouseLeave", ["mouseout", "mouseover"]), A("onPointerEnter", ["pointerout", "pointerover"]), A("onPointerLeave", ["pointerout", "pointerover"]), K("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" ")), K("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")), K("onBeforeInput", ["compositionend", "keypress", "textInput", "paste"]), K("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" ")), K("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" ")), K("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
  var rr = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), qc = new Set("cancel close invalid load scroll toggle".split(" ").concat(rr));
  function $u(e, t, n) {
    var r = e.type || "unknown-event";
    e.currentTarget = n, Ya(r, t, void 0, e), e.currentTarget = null;
  }
  function Qu(e, t) {
    t = (t & 4) !== 0;
    for (var n = 0; n < e.length; n++) {
      var r = e[n], l = r.event;
      r = r.listeners;
      e: {
        var o = void 0;
        if (t) for (var i = r.length - 1; 0 <= i; i--) {
          var u = r[i], s = u.instance, p = u.currentTarget;
          if (u = u.listener, s !== o && l.isPropagationStopped()) break e;
          $u(l, u, p), o = s;
        }
        else for (i = 0; i < r.length; i++) {
          if (u = r[i], s = u.instance, p = u.currentTarget, u = u.listener, s !== o && l.isPropagationStopped()) break e;
          $u(l, u, p), o = s;
        }
      }
    }
    if (Pr) throw e = Kl, Pr = !1, Kl = null, e;
  }
  function le(e, t) {
    var n = t[Co];
    n === void 0 && (n = t[Co] = /* @__PURE__ */ new Set());
    var r = e + "__bubble";
    n.has(r) || (Ku(t, e, 2, !1), n.add(r));
  }
  function go(e, t, n) {
    var r = 0;
    t && (r |= 4), Ku(n, e, r, t);
  }
  var $r = "_reactListening" + Math.random().toString(36).slice(2);
  function lr(e) {
    if (!e[$r]) {
      e[$r] = !0, J.forEach(function(n) {
        n !== "selectionchange" && (qc.has(n) || go(n, !1, e), go(n, !0, e));
      });
      var t = e.nodeType === 9 ? e : e.ownerDocument;
      t === null || t[$r] || (t[$r] = !0, go("selectionchange", !1, t));
    }
  }
  function Ku(e, t, n, r) {
    switch (hu(t)) {
      case 1:
        var l = cc;
        break;
      case 4:
        l = fc;
        break;
      default:
        l = bl;
    }
    n = l.bind(null, t, n, e), l = void 0, !Ql || t !== "touchstart" && t !== "touchmove" && t !== "wheel" || (l = !0), r ? l !== void 0 ? e.addEventListener(t, n, { capture: !0, passive: l }) : e.addEventListener(t, n, !0) : l !== void 0 ? e.addEventListener(t, n, { passive: l }) : e.addEventListener(t, n, !1);
  }
  function yo(e, t, n, r, l) {
    var o = r;
    if ((t & 1) === 0 && (t & 2) === 0 && r !== null) e: for (; ; ) {
      if (r === null) return;
      var i = r.tag;
      if (i === 3 || i === 4) {
        var u = r.stateNode.containerInfo;
        if (u === l || u.nodeType === 8 && u.parentNode === l) break;
        if (i === 4) for (i = r.return; i !== null; ) {
          var s = i.tag;
          if ((s === 3 || s === 4) && (s = i.stateNode.containerInfo, s === l || s.nodeType === 8 && s.parentNode === l)) return;
          i = i.return;
        }
        for (; u !== null; ) {
          if (i = Zt(u), i === null) return;
          if (s = i.tag, s === 5 || s === 6) {
            r = o = i;
            continue e;
          }
          u = u.parentNode;
        }
      }
      r = r.return;
    }
    Zi(function() {
      var p = o, w = Hl(n), S = [];
      e: {
        var v = Hu.get(e);
        if (v !== void 0) {
          var x = no, P = e;
          switch (e) {
            case "keypress":
              if (Fr(n) === 0) break e;
            case "keydown":
            case "keyup":
              x = Nc;
              break;
            case "focusin":
              P = "focus", x = oo;
              break;
            case "focusout":
              P = "blur", x = oo;
              break;
            case "beforeblur":
            case "afterblur":
              x = oo;
              break;
            case "click":
              if (n.button === 2) break e;
            case "auxclick":
            case "dblclick":
            case "mousedown":
            case "mousemove":
            case "mouseup":
            case "mouseout":
            case "mouseover":
            case "contextmenu":
              x = yu;
              break;
            case "drag":
            case "dragend":
            case "dragenter":
            case "dragexit":
            case "dragleave":
            case "dragover":
            case "dragstart":
            case "drop":
              x = mc;
              break;
            case "touchcancel":
            case "touchend":
            case "touchmove":
            case "touchstart":
              x = Rc;
              break;
            case Fu:
            case Uu:
            case Vu:
              x = gc;
              break;
            case Bu:
              x = Lc;
              break;
            case "scroll":
              x = dc;
              break;
            case "wheel":
              x = Oc;
              break;
            case "copy":
            case "cut":
            case "paste":
              x = wc;
              break;
            case "gotpointercapture":
            case "lostpointercapture":
            case "pointercancel":
            case "pointerdown":
            case "pointermove":
            case "pointerout":
            case "pointerover":
            case "pointerup":
              x = Su;
          }
          var M = (t & 4) !== 0, me = !M && e === "scroll", f = M ? v !== null ? v + "Capture" : null : v;
          M = [];
          for (var a = p, d; a !== null; ) {
            d = a;
            var k = d.stateNode;
            if (d.tag === 5 && k !== null && (d = k, f !== null && (k = Vn(a, f), k != null && M.push(or(a, k, d)))), me) break;
            a = a.return;
          }
          0 < M.length && (v = new x(v, P, null, n, w), S.push({ event: v, listeners: M }));
        }
      }
      if ((t & 7) === 0) {
        e: {
          if (v = e === "mouseover" || e === "pointerover", x = e === "mouseout" || e === "pointerout", v && n !== Bl && (P = n.relatedTarget || n.fromElement) && (Zt(P) || P[kt])) break e;
          if ((x || v) && (v = w.window === w ? w : (v = w.ownerDocument) ? v.defaultView || v.parentWindow : window, x ? (P = n.relatedTarget || n.toElement, x = p, P = P ? Zt(P) : null, P !== null && (me = qt(P), P !== me || P.tag !== 5 && P.tag !== 6) && (P = null)) : (x = null, P = p), x !== P)) {
            if (M = yu, k = "onMouseLeave", f = "onMouseEnter", a = "mouse", (e === "pointerout" || e === "pointerover") && (M = Su, k = "onPointerLeave", f = "onPointerEnter", a = "pointer"), me = x == null ? v : En(x), d = P == null ? v : En(P), v = new M(k, a + "leave", x, n, w), v.target = me, v.relatedTarget = d, k = null, Zt(w) === p && (M = new M(f, a + "enter", P, n, w), M.target = d, M.relatedTarget = me, k = M), me = k, x && P) t: {
              for (M = x, f = P, a = 0, d = M; d; d = Sn(d)) a++;
              for (d = 0, k = f; k; k = Sn(k)) d++;
              for (; 0 < a - d; ) M = Sn(M), a--;
              for (; 0 < d - a; ) f = Sn(f), d--;
              for (; a--; ) {
                if (M === f || f !== null && M === f.alternate) break t;
                M = Sn(M), f = Sn(f);
              }
              M = null;
            }
            else M = null;
            x !== null && Gu(S, v, x, M, !1), P !== null && me !== null && Gu(S, me, P, M, !0);
          }
        }
        e: {
          if (v = p ? En(p) : window, x = v.nodeName && v.nodeName.toLowerCase(), x === "select" || x === "input" && v.type === "file") var R = Vc;
          else if (Nu(v)) if (Mu) R = $c;
          else {
            R = Hc;
            var L = Bc;
          }
          else (x = v.nodeName) && x.toLowerCase() === "input" && (v.type === "checkbox" || v.type === "radio") && (R = Wc);
          if (R && (R = R(e, p))) {
            Pu(S, R, n, w);
            break e;
          }
          L && L(e, v, p), e === "focusout" && (L = v._wrapperState) && L.controlled && v.type === "number" && Il(v, "number", v.value);
        }
        switch (L = p ? En(p) : window, e) {
          case "focusin":
            (Nu(L) || L.contentEditable === "true") && (yn = L, fo = p, nr = null);
            break;
          case "focusout":
            nr = fo = yn = null;
            break;
          case "mousedown":
            po = !0;
            break;
          case "contextmenu":
          case "mouseup":
          case "dragend":
            po = !1, Iu(S, n, w);
            break;
          case "selectionchange":
            if (Gc) break;
          case "keydown":
          case "keyup":
            Iu(S, n, w);
        }
        var z;
        if (uo) e: {
          switch (e) {
            case "compositionstart":
              var D = "onCompositionStart";
              break e;
            case "compositionend":
              D = "onCompositionEnd";
              break e;
            case "compositionupdate":
              D = "onCompositionUpdate";
              break e;
          }
          D = void 0;
        }
        else gn ? Cu(e, n) && (D = "onCompositionEnd") : e === "keydown" && n.keyCode === 229 && (D = "onCompositionStart");
        D && (ku && n.locale !== "ko" && (gn || D !== "onCompositionStart" ? D === "onCompositionEnd" && gn && (z = vu()) : (jt = w, to = "value" in jt ? jt.value : jt.textContent, gn = !0)), L = Qr(p, D), 0 < L.length && (D = new wu(D, e, null, n, w), S.push({ event: D, listeners: L }), z ? D.data = z : (z = _u(n), z !== null && (D.data = z)))), (z = Dc ? Ic(e, n) : Ac(e, n)) && (p = Qr(p, "onBeforeInput"), 0 < p.length && (w = new wu("onBeforeInput", "beforeinput", null, n, w), S.push({ event: w, listeners: p }), w.data = z));
      }
      Qu(S, t);
    });
  }
  function or(e, t, n) {
    return { instance: e, listener: t, currentTarget: n };
  }
  function Qr(e, t) {
    for (var n = t + "Capture", r = []; e !== null; ) {
      var l = e, o = l.stateNode;
      l.tag === 5 && o !== null && (l = o, o = Vn(e, n), o != null && r.unshift(or(e, o, l)), o = Vn(e, t), o != null && r.push(or(e, o, l))), e = e.return;
    }
    return r;
  }
  function Sn(e) {
    if (e === null) return null;
    do
      e = e.return;
    while (e && e.tag !== 5);
    return e || null;
  }
  function Gu(e, t, n, r, l) {
    for (var o = t._reactName, i = []; n !== null && n !== r; ) {
      var u = n, s = u.alternate, p = u.stateNode;
      if (s !== null && s === r) break;
      u.tag === 5 && p !== null && (u = p, l ? (s = Vn(n, o), s != null && i.unshift(or(n, s, u))) : l || (s = Vn(n, o), s != null && i.push(or(n, s, u)))), n = n.return;
    }
    i.length !== 0 && e.push({ event: t, listeners: i });
  }
  var Zc = /\r\n?/g, Jc = /\u0000|\uFFFD/g;
  function Yu(e) {
    return (typeof e == "string" ? e : "" + e).replace(Zc, `
`).replace(Jc, "");
  }
  function Kr(e, t, n) {
    if (t = Yu(t), Yu(e) !== t && n) throw Error(m(425));
  }
  function Gr() {
  }
  var wo = null, So = null;
  function ko(e, t) {
    return e === "textarea" || e === "noscript" || typeof t.children == "string" || typeof t.children == "number" || typeof t.dangerouslySetInnerHTML == "object" && t.dangerouslySetInnerHTML !== null && t.dangerouslySetInnerHTML.__html != null;
  }
  var Eo = typeof setTimeout == "function" ? setTimeout : void 0, bc = typeof clearTimeout == "function" ? clearTimeout : void 0, Xu = typeof Promise == "function" ? Promise : void 0, ef = typeof queueMicrotask == "function" ? queueMicrotask : typeof Xu < "u" ? function(e) {
    return Xu.resolve(null).then(e).catch(tf);
  } : Eo;
  function tf(e) {
    setTimeout(function() {
      throw e;
    });
  }
  function xo(e, t) {
    var n = t, r = 0;
    do {
      var l = n.nextSibling;
      if (e.removeChild(n), l && l.nodeType === 8) if (n = l.data, n === "/$") {
        if (r === 0) {
          e.removeChild(l), Xn(t);
          return;
        }
        r--;
      } else n !== "$" && n !== "$?" && n !== "$!" || r++;
      n = l;
    } while (n);
    Xn(t);
  }
  function It(e) {
    for (; e != null; e = e.nextSibling) {
      var t = e.nodeType;
      if (t === 1 || t === 3) break;
      if (t === 8) {
        if (t = e.data, t === "$" || t === "$!" || t === "$?") break;
        if (t === "/$") return null;
      }
    }
    return e;
  }
  function qu(e) {
    e = e.previousSibling;
    for (var t = 0; e; ) {
      if (e.nodeType === 8) {
        var n = e.data;
        if (n === "$" || n === "$!" || n === "$?") {
          if (t === 0) return e;
          t--;
        } else n === "/$" && t++;
      }
      e = e.previousSibling;
    }
    return null;
  }
  var kn = Math.random().toString(36).slice(2), mt = "__reactFiber$" + kn, ir = "__reactProps$" + kn, kt = "__reactContainer$" + kn, Co = "__reactEvents$" + kn, nf = "__reactListeners$" + kn, rf = "__reactHandles$" + kn;
  function Zt(e) {
    var t = e[mt];
    if (t) return t;
    for (var n = e.parentNode; n; ) {
      if (t = n[kt] || n[mt]) {
        if (n = t.alternate, t.child !== null || n !== null && n.child !== null) for (e = qu(e); e !== null; ) {
          if (n = e[mt]) return n;
          e = qu(e);
        }
        return t;
      }
      e = n, n = e.parentNode;
    }
    return null;
  }
  function ur(e) {
    return e = e[mt] || e[kt], !e || e.tag !== 5 && e.tag !== 6 && e.tag !== 13 && e.tag !== 3 ? null : e;
  }
  function En(e) {
    if (e.tag === 5 || e.tag === 6) return e.stateNode;
    throw Error(m(33));
  }
  function Yr(e) {
    return e[ir] || null;
  }
  var _o = [], xn = -1;
  function At(e) {
    return { current: e };
  }
  function oe(e) {
    0 > xn || (e.current = _o[xn], _o[xn] = null, xn--);
  }
  function re(e, t) {
    xn++, _o[xn] = e.current, e.current = t;
  }
  var Ft = {}, Ne = At(Ft), De = At(!1), Jt = Ft;
  function Cn(e, t) {
    var n = e.type.contextTypes;
    if (!n) return Ft;
    var r = e.stateNode;
    if (r && r.__reactInternalMemoizedUnmaskedChildContext === t) return r.__reactInternalMemoizedMaskedChildContext;
    var l = {}, o;
    for (o in n) l[o] = t[o];
    return r && (e = e.stateNode, e.__reactInternalMemoizedUnmaskedChildContext = t, e.__reactInternalMemoizedMaskedChildContext = l), l;
  }
  function Ie(e) {
    return e = e.childContextTypes, e != null;
  }
  function Xr() {
    oe(De), oe(Ne);
  }
  function Zu(e, t, n) {
    if (Ne.current !== Ft) throw Error(m(168));
    re(Ne, t), re(De, n);
  }
  function Ju(e, t, n) {
    var r = e.stateNode;
    if (t = t.childContextTypes, typeof r.getChildContext != "function") return n;
    r = r.getChildContext();
    for (var l in r) if (!(l in t)) throw Error(m(108, ne(e) || "Unknown", l));
    return N({}, n, r);
  }
  function qr(e) {
    return e = (e = e.stateNode) && e.__reactInternalMemoizedMergedChildContext || Ft, Jt = Ne.current, re(Ne, e), re(De, De.current), !0;
  }
  function bu(e, t, n) {
    var r = e.stateNode;
    if (!r) throw Error(m(169));
    n ? (e = Ju(e, t, Jt), r.__reactInternalMemoizedMergedChildContext = e, oe(De), oe(Ne), re(Ne, e)) : oe(De), re(De, n);
  }
  var Et = null, Zr = !1, No = !1;
  function es(e) {
    Et === null ? Et = [e] : Et.push(e);
  }
  function lf(e) {
    Zr = !0, es(e);
  }
  function Ut() {
    if (!No && Et !== null) {
      No = !0;
      var e = 0, t = Z;
      try {
        var n = Et;
        for (Z = 1; e < n.length; e++) {
          var r = n[e];
          do
            r = r(!0);
          while (r !== null);
        }
        Et = null, Zr = !1;
      } catch (l) {
        throw Et !== null && (Et = Et.slice(e + 1)), nu(Gl, Ut), l;
      } finally {
        Z = t, No = !1;
      }
    }
    return null;
  }
  var _n = [], Nn = 0, Jr = null, br = 0, Ye = [], Xe = 0, bt = null, xt = 1, Ct = "";
  function en(e, t) {
    _n[Nn++] = br, _n[Nn++] = Jr, Jr = e, br = t;
  }
  function ts(e, t, n) {
    Ye[Xe++] = xt, Ye[Xe++] = Ct, Ye[Xe++] = bt, bt = e;
    var r = xt;
    e = Ct;
    var l = 32 - rt(r) - 1;
    r &= ~(1 << l), n += 1;
    var o = 32 - rt(t) + l;
    if (30 < o) {
      var i = l - l % 5;
      o = (r & (1 << i) - 1).toString(32), r >>= i, l -= i, xt = 1 << 32 - rt(t) + l | n << l | r, Ct = o + e;
    } else xt = 1 << o | n << l | r, Ct = e;
  }
  function Po(e) {
    e.return !== null && (en(e, 1), ts(e, 1, 0));
  }
  function Mo(e) {
    for (; e === Jr; ) Jr = _n[--Nn], _n[Nn] = null, br = _n[--Nn], _n[Nn] = null;
    for (; e === bt; ) bt = Ye[--Xe], Ye[Xe] = null, Ct = Ye[--Xe], Ye[Xe] = null, xt = Ye[--Xe], Ye[Xe] = null;
  }
  var $e = null, Qe = null, ue = !1, ot = null;
  function ns(e, t) {
    var n = be(5, null, null, 0);
    n.elementType = "DELETED", n.stateNode = t, n.return = e, t = e.deletions, t === null ? (e.deletions = [n], e.flags |= 16) : t.push(n);
  }
  function rs(e, t) {
    switch (e.tag) {
      case 5:
        var n = e.type;
        return t = t.nodeType !== 1 || n.toLowerCase() !== t.nodeName.toLowerCase() ? null : t, t !== null ? (e.stateNode = t, $e = e, Qe = It(t.firstChild), !0) : !1;
      case 6:
        return t = e.pendingProps === "" || t.nodeType !== 3 ? null : t, t !== null ? (e.stateNode = t, $e = e, Qe = null, !0) : !1;
      case 13:
        return t = t.nodeType !== 8 ? null : t, t !== null ? (n = bt !== null ? { id: xt, overflow: Ct } : null, e.memoizedState = { dehydrated: t, treeContext: n, retryLane: 1073741824 }, n = be(18, null, null, 0), n.stateNode = t, n.return = e, e.child = n, $e = e, Qe = null, !0) : !1;
      default:
        return !1;
    }
  }
  function Ro(e) {
    return (e.mode & 1) !== 0 && (e.flags & 128) === 0;
  }
  function To(e) {
    if (ue) {
      var t = Qe;
      if (t) {
        var n = t;
        if (!rs(e, t)) {
          if (Ro(e)) throw Error(m(418));
          t = It(n.nextSibling);
          var r = $e;
          t && rs(e, t) ? ns(r, n) : (e.flags = e.flags & -4097 | 2, ue = !1, $e = e);
        }
      } else {
        if (Ro(e)) throw Error(m(418));
        e.flags = e.flags & -4097 | 2, ue = !1, $e = e;
      }
    }
  }
  function ls(e) {
    for (e = e.return; e !== null && e.tag !== 5 && e.tag !== 3 && e.tag !== 13; ) e = e.return;
    $e = e;
  }
  function el(e) {
    if (e !== $e) return !1;
    if (!ue) return ls(e), ue = !0, !1;
    var t;
    if ((t = e.tag !== 3) && !(t = e.tag !== 5) && (t = e.type, t = t !== "head" && t !== "body" && !ko(e.type, e.memoizedProps)), t && (t = Qe)) {
      if (Ro(e)) throw os(), Error(m(418));
      for (; t; ) ns(e, t), t = It(t.nextSibling);
    }
    if (ls(e), e.tag === 13) {
      if (e = e.memoizedState, e = e !== null ? e.dehydrated : null, !e) throw Error(m(317));
      e: {
        for (e = e.nextSibling, t = 0; e; ) {
          if (e.nodeType === 8) {
            var n = e.data;
            if (n === "/$") {
              if (t === 0) {
                Qe = It(e.nextSibling);
                break e;
              }
              t--;
            } else n !== "$" && n !== "$!" && n !== "$?" || t++;
          }
          e = e.nextSibling;
        }
        Qe = null;
      }
    } else Qe = $e ? It(e.stateNode.nextSibling) : null;
    return !0;
  }
  function os() {
    for (var e = Qe; e; ) e = It(e.nextSibling);
  }
  function Pn() {
    Qe = $e = null, ue = !1;
  }
  function Lo(e) {
    ot === null ? ot = [e] : ot.push(e);
  }
  var of = _e.ReactCurrentBatchConfig;
  function sr(e, t, n) {
    if (e = n.ref, e !== null && typeof e != "function" && typeof e != "object") {
      if (n._owner) {
        if (n = n._owner, n) {
          if (n.tag !== 1) throw Error(m(309));
          var r = n.stateNode;
        }
        if (!r) throw Error(m(147, e));
        var l = r, o = "" + e;
        return t !== null && t.ref !== null && typeof t.ref == "function" && t.ref._stringRef === o ? t.ref : (t = function(i) {
          var u = l.refs;
          i === null ? delete u[o] : u[o] = i;
        }, t._stringRef = o, t);
      }
      if (typeof e != "string") throw Error(m(284));
      if (!n._owner) throw Error(m(290, e));
    }
    return e;
  }
  function tl(e, t) {
    throw e = Object.prototype.toString.call(t), Error(m(31, e === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : e));
  }
  function is(e) {
    var t = e._init;
    return t(e._payload);
  }
  function us(e) {
    function t(f, a) {
      if (e) {
        var d = f.deletions;
        d === null ? (f.deletions = [a], f.flags |= 16) : d.push(a);
      }
    }
    function n(f, a) {
      if (!e) return null;
      for (; a !== null; ) t(f, a), a = a.sibling;
      return null;
    }
    function r(f, a) {
      for (f = /* @__PURE__ */ new Map(); a !== null; ) a.key !== null ? f.set(a.key, a) : f.set(a.index, a), a = a.sibling;
      return f;
    }
    function l(f, a) {
      return f = Gt(f, a), f.index = 0, f.sibling = null, f;
    }
    function o(f, a, d) {
      return f.index = d, e ? (d = f.alternate, d !== null ? (d = d.index, d < a ? (f.flags |= 2, a) : d) : (f.flags |= 2, a)) : (f.flags |= 1048576, a);
    }
    function i(f) {
      return e && f.alternate === null && (f.flags |= 2), f;
    }
    function u(f, a, d, k) {
      return a === null || a.tag !== 6 ? (a = Ei(d, f.mode, k), a.return = f, a) : (a = l(a, d), a.return = f, a);
    }
    function s(f, a, d, k) {
      var R = d.type;
      return R === Oe ? w(f, a, d.props.children, k, d.key) : a !== null && (a.elementType === R || typeof R == "object" && R !== null && R.$$typeof === je && is(R) === a.type) ? (k = l(a, d.props), k.ref = sr(f, a, d), k.return = f, k) : (k = _l(d.type, d.key, d.props, null, f.mode, k), k.ref = sr(f, a, d), k.return = f, k);
    }
    function p(f, a, d, k) {
      return a === null || a.tag !== 4 || a.stateNode.containerInfo !== d.containerInfo || a.stateNode.implementation !== d.implementation ? (a = xi(d, f.mode, k), a.return = f, a) : (a = l(a, d.children || []), a.return = f, a);
    }
    function w(f, a, d, k, R) {
      return a === null || a.tag !== 7 ? (a = an(d, f.mode, k, R), a.return = f, a) : (a = l(a, d), a.return = f, a);
    }
    function S(f, a, d) {
      if (typeof a == "string" && a !== "" || typeof a == "number") return a = Ei("" + a, f.mode, d), a.return = f, a;
      if (typeof a == "object" && a !== null) {
        switch (a.$$typeof) {
          case tt:
            return d = _l(a.type, a.key, a.props, null, f.mode, d), d.ref = sr(f, null, a), d.return = f, d;
          case Te:
            return a = xi(a, f.mode, d), a.return = f, a;
          case je:
            var k = a._init;
            return S(f, k(a._payload), d);
        }
        if (An(a) || j(a)) return a = an(a, f.mode, d, null), a.return = f, a;
        tl(f, a);
      }
      return null;
    }
    function v(f, a, d, k) {
      var R = a !== null ? a.key : null;
      if (typeof d == "string" && d !== "" || typeof d == "number") return R !== null ? null : u(f, a, "" + d, k);
      if (typeof d == "object" && d !== null) {
        switch (d.$$typeof) {
          case tt:
            return d.key === R ? s(f, a, d, k) : null;
          case Te:
            return d.key === R ? p(f, a, d, k) : null;
          case je:
            return R = d._init, v(
              f,
              a,
              R(d._payload),
              k
            );
        }
        if (An(d) || j(d)) return R !== null ? null : w(f, a, d, k, null);
        tl(f, d);
      }
      return null;
    }
    function x(f, a, d, k, R) {
      if (typeof k == "string" && k !== "" || typeof k == "number") return f = f.get(d) || null, u(a, f, "" + k, R);
      if (typeof k == "object" && k !== null) {
        switch (k.$$typeof) {
          case tt:
            return f = f.get(k.key === null ? d : k.key) || null, s(a, f, k, R);
          case Te:
            return f = f.get(k.key === null ? d : k.key) || null, p(a, f, k, R);
          case je:
            var L = k._init;
            return x(f, a, d, L(k._payload), R);
        }
        if (An(k) || j(k)) return f = f.get(d) || null, w(a, f, k, R, null);
        tl(a, k);
      }
      return null;
    }
    function P(f, a, d, k) {
      for (var R = null, L = null, z = a, D = a = 0, ke = null; z !== null && D < d.length; D++) {
        z.index > D ? (ke = z, z = null) : ke = z.sibling;
        var Q = v(f, z, d[D], k);
        if (Q === null) {
          z === null && (z = ke);
          break;
        }
        e && z && Q.alternate === null && t(f, z), a = o(Q, a, D), L === null ? R = Q : L.sibling = Q, L = Q, z = ke;
      }
      if (D === d.length) return n(f, z), ue && en(f, D), R;
      if (z === null) {
        for (; D < d.length; D++) z = S(f, d[D], k), z !== null && (a = o(z, a, D), L === null ? R = z : L.sibling = z, L = z);
        return ue && en(f, D), R;
      }
      for (z = r(f, z); D < d.length; D++) ke = x(z, f, D, d[D], k), ke !== null && (e && ke.alternate !== null && z.delete(ke.key === null ? D : ke.key), a = o(ke, a, D), L === null ? R = ke : L.sibling = ke, L = ke);
      return e && z.forEach(function(Yt) {
        return t(f, Yt);
      }), ue && en(f, D), R;
    }
    function M(f, a, d, k) {
      var R = j(d);
      if (typeof R != "function") throw Error(m(150));
      if (d = R.call(d), d == null) throw Error(m(151));
      for (var L = R = null, z = a, D = a = 0, ke = null, Q = d.next(); z !== null && !Q.done; D++, Q = d.next()) {
        z.index > D ? (ke = z, z = null) : ke = z.sibling;
        var Yt = v(f, z, Q.value, k);
        if (Yt === null) {
          z === null && (z = ke);
          break;
        }
        e && z && Yt.alternate === null && t(f, z), a = o(Yt, a, D), L === null ? R = Yt : L.sibling = Yt, L = Yt, z = ke;
      }
      if (Q.done) return n(
        f,
        z
      ), ue && en(f, D), R;
      if (z === null) {
        for (; !Q.done; D++, Q = d.next()) Q = S(f, Q.value, k), Q !== null && (a = o(Q, a, D), L === null ? R = Q : L.sibling = Q, L = Q);
        return ue && en(f, D), R;
      }
      for (z = r(f, z); !Q.done; D++, Q = d.next()) Q = x(z, f, D, Q.value, k), Q !== null && (e && Q.alternate !== null && z.delete(Q.key === null ? D : Q.key), a = o(Q, a, D), L === null ? R = Q : L.sibling = Q, L = Q);
      return e && z.forEach(function(Uf) {
        return t(f, Uf);
      }), ue && en(f, D), R;
    }
    function me(f, a, d, k) {
      if (typeof d == "object" && d !== null && d.type === Oe && d.key === null && (d = d.props.children), typeof d == "object" && d !== null) {
        switch (d.$$typeof) {
          case tt:
            e: {
              for (var R = d.key, L = a; L !== null; ) {
                if (L.key === R) {
                  if (R = d.type, R === Oe) {
                    if (L.tag === 7) {
                      n(f, L.sibling), a = l(L, d.props.children), a.return = f, f = a;
                      break e;
                    }
                  } else if (L.elementType === R || typeof R == "object" && R !== null && R.$$typeof === je && is(R) === L.type) {
                    n(f, L.sibling), a = l(L, d.props), a.ref = sr(f, L, d), a.return = f, f = a;
                    break e;
                  }
                  n(f, L);
                  break;
                } else t(f, L);
                L = L.sibling;
              }
              d.type === Oe ? (a = an(d.props.children, f.mode, k, d.key), a.return = f, f = a) : (k = _l(d.type, d.key, d.props, null, f.mode, k), k.ref = sr(f, a, d), k.return = f, f = k);
            }
            return i(f);
          case Te:
            e: {
              for (L = d.key; a !== null; ) {
                if (a.key === L) if (a.tag === 4 && a.stateNode.containerInfo === d.containerInfo && a.stateNode.implementation === d.implementation) {
                  n(f, a.sibling), a = l(a, d.children || []), a.return = f, f = a;
                  break e;
                } else {
                  n(f, a);
                  break;
                }
                else t(f, a);
                a = a.sibling;
              }
              a = xi(d, f.mode, k), a.return = f, f = a;
            }
            return i(f);
          case je:
            return L = d._init, me(f, a, L(d._payload), k);
        }
        if (An(d)) return P(f, a, d, k);
        if (j(d)) return M(f, a, d, k);
        tl(f, d);
      }
      return typeof d == "string" && d !== "" || typeof d == "number" ? (d = "" + d, a !== null && a.tag === 6 ? (n(f, a.sibling), a = l(a, d), a.return = f, f = a) : (n(f, a), a = Ei(d, f.mode, k), a.return = f, f = a), i(f)) : n(f, a);
    }
    return me;
  }
  var Mn = us(!0), ss = us(!1), nl = At(null), rl = null, Rn = null, zo = null;
  function Oo() {
    zo = Rn = rl = null;
  }
  function jo(e) {
    var t = nl.current;
    oe(nl), e._currentValue = t;
  }
  function Do(e, t, n) {
    for (; e !== null; ) {
      var r = e.alternate;
      if ((e.childLanes & t) !== t ? (e.childLanes |= t, r !== null && (r.childLanes |= t)) : r !== null && (r.childLanes & t) !== t && (r.childLanes |= t), e === n) break;
      e = e.return;
    }
  }
  function Tn(e, t) {
    rl = e, zo = Rn = null, e = e.dependencies, e !== null && e.firstContext !== null && ((e.lanes & t) !== 0 && (Ae = !0), e.firstContext = null);
  }
  function qe(e) {
    var t = e._currentValue;
    if (zo !== e) if (e = { context: e, memoizedValue: t, next: null }, Rn === null) {
      if (rl === null) throw Error(m(308));
      Rn = e, rl.dependencies = { lanes: 0, firstContext: e };
    } else Rn = Rn.next = e;
    return t;
  }
  var tn = null;
  function Io(e) {
    tn === null ? tn = [e] : tn.push(e);
  }
  function as(e, t, n, r) {
    var l = t.interleaved;
    return l === null ? (n.next = n, Io(t)) : (n.next = l.next, l.next = n), t.interleaved = n, _t(e, r);
  }
  function _t(e, t) {
    e.lanes |= t;
    var n = e.alternate;
    for (n !== null && (n.lanes |= t), n = e, e = e.return; e !== null; ) e.childLanes |= t, n = e.alternate, n !== null && (n.childLanes |= t), n = e, e = e.return;
    return n.tag === 3 ? n.stateNode : null;
  }
  var Vt = !1;
  function Ao(e) {
    e.updateQueue = { baseState: e.memoizedState, firstBaseUpdate: null, lastBaseUpdate: null, shared: { pending: null, interleaved: null, lanes: 0 }, effects: null };
  }
  function cs(e, t) {
    e = e.updateQueue, t.updateQueue === e && (t.updateQueue = { baseState: e.baseState, firstBaseUpdate: e.firstBaseUpdate, lastBaseUpdate: e.lastBaseUpdate, shared: e.shared, effects: e.effects });
  }
  function Nt(e, t) {
    return { eventTime: e, lane: t, tag: 0, payload: null, callback: null, next: null };
  }
  function Bt(e, t, n) {
    var r = e.updateQueue;
    if (r === null) return null;
    if (r = r.shared, (H & 2) !== 0) {
      var l = r.pending;
      return l === null ? t.next = t : (t.next = l.next, l.next = t), r.pending = t, _t(e, n);
    }
    return l = r.interleaved, l === null ? (t.next = t, Io(r)) : (t.next = l.next, l.next = t), r.interleaved = t, _t(e, n);
  }
  function ll(e, t, n) {
    if (t = t.updateQueue, t !== null && (t = t.shared, (n & 4194240) !== 0)) {
      var r = t.lanes;
      r &= e.pendingLanes, n |= r, t.lanes = n, ql(e, n);
    }
  }
  function fs(e, t) {
    var n = e.updateQueue, r = e.alternate;
    if (r !== null && (r = r.updateQueue, n === r)) {
      var l = null, o = null;
      if (n = n.firstBaseUpdate, n !== null) {
        do {
          var i = { eventTime: n.eventTime, lane: n.lane, tag: n.tag, payload: n.payload, callback: n.callback, next: null };
          o === null ? l = o = i : o = o.next = i, n = n.next;
        } while (n !== null);
        o === null ? l = o = t : o = o.next = t;
      } else l = o = t;
      n = { baseState: r.baseState, firstBaseUpdate: l, lastBaseUpdate: o, shared: r.shared, effects: r.effects }, e.updateQueue = n;
      return;
    }
    e = n.lastBaseUpdate, e === null ? n.firstBaseUpdate = t : e.next = t, n.lastBaseUpdate = t;
  }
  function ol(e, t, n, r) {
    var l = e.updateQueue;
    Vt = !1;
    var o = l.firstBaseUpdate, i = l.lastBaseUpdate, u = l.shared.pending;
    if (u !== null) {
      l.shared.pending = null;
      var s = u, p = s.next;
      s.next = null, i === null ? o = p : i.next = p, i = s;
      var w = e.alternate;
      w !== null && (w = w.updateQueue, u = w.lastBaseUpdate, u !== i && (u === null ? w.firstBaseUpdate = p : u.next = p, w.lastBaseUpdate = s));
    }
    if (o !== null) {
      var S = l.baseState;
      i = 0, w = p = s = null, u = o;
      do {
        var v = u.lane, x = u.eventTime;
        if ((r & v) === v) {
          w !== null && (w = w.next = {
            eventTime: x,
            lane: 0,
            tag: u.tag,
            payload: u.payload,
            callback: u.callback,
            next: null
          });
          e: {
            var P = e, M = u;
            switch (v = t, x = n, M.tag) {
              case 1:
                if (P = M.payload, typeof P == "function") {
                  S = P.call(x, S, v);
                  break e;
                }
                S = P;
                break e;
              case 3:
                P.flags = P.flags & -65537 | 128;
              case 0:
                if (P = M.payload, v = typeof P == "function" ? P.call(x, S, v) : P, v == null) break e;
                S = N({}, S, v);
                break e;
              case 2:
                Vt = !0;
            }
          }
          u.callback !== null && u.lane !== 0 && (e.flags |= 64, v = l.effects, v === null ? l.effects = [u] : v.push(u));
        } else x = { eventTime: x, lane: v, tag: u.tag, payload: u.payload, callback: u.callback, next: null }, w === null ? (p = w = x, s = S) : w = w.next = x, i |= v;
        if (u = u.next, u === null) {
          if (u = l.shared.pending, u === null) break;
          v = u, u = v.next, v.next = null, l.lastBaseUpdate = v, l.shared.pending = null;
        }
      } while (!0);
      if (w === null && (s = S), l.baseState = s, l.firstBaseUpdate = p, l.lastBaseUpdate = w, t = l.shared.interleaved, t !== null) {
        l = t;
        do
          i |= l.lane, l = l.next;
        while (l !== t);
      } else o === null && (l.shared.lanes = 0);
      ln |= i, e.lanes = i, e.memoizedState = S;
    }
  }
  function ds(e, t, n) {
    if (e = t.effects, t.effects = null, e !== null) for (t = 0; t < e.length; t++) {
      var r = e[t], l = r.callback;
      if (l !== null) {
        if (r.callback = null, r = n, typeof l != "function") throw Error(m(191, l));
        l.call(r);
      }
    }
  }
  var ar = {}, ht = At(ar), cr = At(ar), fr = At(ar);
  function nn(e) {
    if (e === ar) throw Error(m(174));
    return e;
  }
  function Fo(e, t) {
    switch (re(fr, t), re(cr, e), re(ht, ar), e = t.nodeType, e) {
      case 9:
      case 11:
        t = (t = t.documentElement) ? t.namespaceURI : Fl(null, "");
        break;
      default:
        e = e === 8 ? t.parentNode : t, t = e.namespaceURI || null, e = e.tagName, t = Fl(t, e);
    }
    oe(ht), re(ht, t);
  }
  function Ln() {
    oe(ht), oe(cr), oe(fr);
  }
  function ps(e) {
    nn(fr.current);
    var t = nn(ht.current), n = Fl(t, e.type);
    t !== n && (re(cr, e), re(ht, n));
  }
  function Uo(e) {
    cr.current === e && (oe(ht), oe(cr));
  }
  var se = At(0);
  function il(e) {
    for (var t = e; t !== null; ) {
      if (t.tag === 13) {
        var n = t.memoizedState;
        if (n !== null && (n = n.dehydrated, n === null || n.data === "$?" || n.data === "$!")) return t;
      } else if (t.tag === 19 && t.memoizedProps.revealOrder !== void 0) {
        if ((t.flags & 128) !== 0) return t;
      } else if (t.child !== null) {
        t.child.return = t, t = t.child;
        continue;
      }
      if (t === e) break;
      for (; t.sibling === null; ) {
        if (t.return === null || t.return === e) return null;
        t = t.return;
      }
      t.sibling.return = t.return, t = t.sibling;
    }
    return null;
  }
  var Vo = [];
  function Bo() {
    for (var e = 0; e < Vo.length; e++) Vo[e]._workInProgressVersionPrimary = null;
    Vo.length = 0;
  }
  var ul = _e.ReactCurrentDispatcher, Ho = _e.ReactCurrentBatchConfig, rn = 0, ae = null, ge = null, we = null, sl = !1, dr = !1, pr = 0, uf = 0;
  function Pe() {
    throw Error(m(321));
  }
  function Wo(e, t) {
    if (t === null) return !1;
    for (var n = 0; n < t.length && n < e.length; n++) if (!lt(e[n], t[n])) return !1;
    return !0;
  }
  function $o(e, t, n, r, l, o) {
    if (rn = o, ae = t, t.memoizedState = null, t.updateQueue = null, t.lanes = 0, ul.current = e === null || e.memoizedState === null ? ff : df, e = n(r, l), dr) {
      o = 0;
      do {
        if (dr = !1, pr = 0, 25 <= o) throw Error(m(301));
        o += 1, we = ge = null, t.updateQueue = null, ul.current = pf, e = n(r, l);
      } while (dr);
    }
    if (ul.current = fl, t = ge !== null && ge.next !== null, rn = 0, we = ge = ae = null, sl = !1, t) throw Error(m(300));
    return e;
  }
  function Qo() {
    var e = pr !== 0;
    return pr = 0, e;
  }
  function vt() {
    var e = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
    return we === null ? ae.memoizedState = we = e : we = we.next = e, we;
  }
  function Ze() {
    if (ge === null) {
      var e = ae.alternate;
      e = e !== null ? e.memoizedState : null;
    } else e = ge.next;
    var t = we === null ? ae.memoizedState : we.next;
    if (t !== null) we = t, ge = e;
    else {
      if (e === null) throw Error(m(310));
      ge = e, e = { memoizedState: ge.memoizedState, baseState: ge.baseState, baseQueue: ge.baseQueue, queue: ge.queue, next: null }, we === null ? ae.memoizedState = we = e : we = we.next = e;
    }
    return we;
  }
  function mr(e, t) {
    return typeof t == "function" ? t(e) : t;
  }
  function Ko(e) {
    var t = Ze(), n = t.queue;
    if (n === null) throw Error(m(311));
    n.lastRenderedReducer = e;
    var r = ge, l = r.baseQueue, o = n.pending;
    if (o !== null) {
      if (l !== null) {
        var i = l.next;
        l.next = o.next, o.next = i;
      }
      r.baseQueue = l = o, n.pending = null;
    }
    if (l !== null) {
      o = l.next, r = r.baseState;
      var u = i = null, s = null, p = o;
      do {
        var w = p.lane;
        if ((rn & w) === w) s !== null && (s = s.next = { lane: 0, action: p.action, hasEagerState: p.hasEagerState, eagerState: p.eagerState, next: null }), r = p.hasEagerState ? p.eagerState : e(r, p.action);
        else {
          var S = {
            lane: w,
            action: p.action,
            hasEagerState: p.hasEagerState,
            eagerState: p.eagerState,
            next: null
          };
          s === null ? (u = s = S, i = r) : s = s.next = S, ae.lanes |= w, ln |= w;
        }
        p = p.next;
      } while (p !== null && p !== o);
      s === null ? i = r : s.next = u, lt(r, t.memoizedState) || (Ae = !0), t.memoizedState = r, t.baseState = i, t.baseQueue = s, n.lastRenderedState = r;
    }
    if (e = n.interleaved, e !== null) {
      l = e;
      do
        o = l.lane, ae.lanes |= o, ln |= o, l = l.next;
      while (l !== e);
    } else l === null && (n.lanes = 0);
    return [t.memoizedState, n.dispatch];
  }
  function Go(e) {
    var t = Ze(), n = t.queue;
    if (n === null) throw Error(m(311));
    n.lastRenderedReducer = e;
    var r = n.dispatch, l = n.pending, o = t.memoizedState;
    if (l !== null) {
      n.pending = null;
      var i = l = l.next;
      do
        o = e(o, i.action), i = i.next;
      while (i !== l);
      lt(o, t.memoizedState) || (Ae = !0), t.memoizedState = o, t.baseQueue === null && (t.baseState = o), n.lastRenderedState = o;
    }
    return [o, r];
  }
  function ms() {
  }
  function hs(e, t) {
    var n = ae, r = Ze(), l = t(), o = !lt(r.memoizedState, l);
    if (o && (r.memoizedState = l, Ae = !0), r = r.queue, Yo(ys.bind(null, n, r, e), [e]), r.getSnapshot !== t || o || we !== null && we.memoizedState.tag & 1) {
      if (n.flags |= 2048, hr(9, gs.bind(null, n, r, l, t), void 0, null), Se === null) throw Error(m(349));
      (rn & 30) !== 0 || vs(n, t, l);
    }
    return l;
  }
  function vs(e, t, n) {
    e.flags |= 16384, e = { getSnapshot: t, value: n }, t = ae.updateQueue, t === null ? (t = { lastEffect: null, stores: null }, ae.updateQueue = t, t.stores = [e]) : (n = t.stores, n === null ? t.stores = [e] : n.push(e));
  }
  function gs(e, t, n, r) {
    t.value = n, t.getSnapshot = r, ws(t) && Ss(e);
  }
  function ys(e, t, n) {
    return n(function() {
      ws(t) && Ss(e);
    });
  }
  function ws(e) {
    var t = e.getSnapshot;
    e = e.value;
    try {
      var n = t();
      return !lt(e, n);
    } catch {
      return !0;
    }
  }
  function Ss(e) {
    var t = _t(e, 1);
    t !== null && at(t, e, 1, -1);
  }
  function ks(e) {
    var t = vt();
    return typeof e == "function" && (e = e()), t.memoizedState = t.baseState = e, e = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: mr, lastRenderedState: e }, t.queue = e, e = e.dispatch = cf.bind(null, ae, e), [t.memoizedState, e];
  }
  function hr(e, t, n, r) {
    return e = { tag: e, create: t, destroy: n, deps: r, next: null }, t = ae.updateQueue, t === null ? (t = { lastEffect: null, stores: null }, ae.updateQueue = t, t.lastEffect = e.next = e) : (n = t.lastEffect, n === null ? t.lastEffect = e.next = e : (r = n.next, n.next = e, e.next = r, t.lastEffect = e)), e;
  }
  function Es() {
    return Ze().memoizedState;
  }
  function al(e, t, n, r) {
    var l = vt();
    ae.flags |= e, l.memoizedState = hr(1 | t, n, void 0, r === void 0 ? null : r);
  }
  function cl(e, t, n, r) {
    var l = Ze();
    r = r === void 0 ? null : r;
    var o = void 0;
    if (ge !== null) {
      var i = ge.memoizedState;
      if (o = i.destroy, r !== null && Wo(r, i.deps)) {
        l.memoizedState = hr(t, n, o, r);
        return;
      }
    }
    ae.flags |= e, l.memoizedState = hr(1 | t, n, o, r);
  }
  function xs(e, t) {
    return al(8390656, 8, e, t);
  }
  function Yo(e, t) {
    return cl(2048, 8, e, t);
  }
  function Cs(e, t) {
    return cl(4, 2, e, t);
  }
  function _s(e, t) {
    return cl(4, 4, e, t);
  }
  function Ns(e, t) {
    if (typeof t == "function") return e = e(), t(e), function() {
      t(null);
    };
    if (t != null) return e = e(), t.current = e, function() {
      t.current = null;
    };
  }
  function Ps(e, t, n) {
    return n = n != null ? n.concat([e]) : null, cl(4, 4, Ns.bind(null, t, e), n);
  }
  function Xo() {
  }
  function Ms(e, t) {
    var n = Ze();
    t = t === void 0 ? null : t;
    var r = n.memoizedState;
    return r !== null && t !== null && Wo(t, r[1]) ? r[0] : (n.memoizedState = [e, t], e);
  }
  function Rs(e, t) {
    var n = Ze();
    t = t === void 0 ? null : t;
    var r = n.memoizedState;
    return r !== null && t !== null && Wo(t, r[1]) ? r[0] : (e = e(), n.memoizedState = [e, t], e);
  }
  function Ts(e, t, n) {
    return (rn & 21) === 0 ? (e.baseState && (e.baseState = !1, Ae = !0), e.memoizedState = n) : (lt(n, t) || (n = iu(), ae.lanes |= n, ln |= n, e.baseState = !0), t);
  }
  function sf(e, t) {
    var n = Z;
    Z = n !== 0 && 4 > n ? n : 4, e(!0);
    var r = Ho.transition;
    Ho.transition = {};
    try {
      e(!1), t();
    } finally {
      Z = n, Ho.transition = r;
    }
  }
  function Ls() {
    return Ze().memoizedState;
  }
  function af(e, t, n) {
    var r = Qt(e);
    if (n = { lane: r, action: n, hasEagerState: !1, eagerState: null, next: null }, zs(e)) Os(t, n);
    else if (n = as(e, t, n, r), n !== null) {
      var l = ze();
      at(n, e, r, l), js(n, t, r);
    }
  }
  function cf(e, t, n) {
    var r = Qt(e), l = { lane: r, action: n, hasEagerState: !1, eagerState: null, next: null };
    if (zs(e)) Os(t, l);
    else {
      var o = e.alternate;
      if (e.lanes === 0 && (o === null || o.lanes === 0) && (o = t.lastRenderedReducer, o !== null)) try {
        var i = t.lastRenderedState, u = o(i, n);
        if (l.hasEagerState = !0, l.eagerState = u, lt(u, i)) {
          var s = t.interleaved;
          s === null ? (l.next = l, Io(t)) : (l.next = s.next, s.next = l), t.interleaved = l;
          return;
        }
      } catch {
      } finally {
      }
      n = as(e, t, l, r), n !== null && (l = ze(), at(n, e, r, l), js(n, t, r));
    }
  }
  function zs(e) {
    var t = e.alternate;
    return e === ae || t !== null && t === ae;
  }
  function Os(e, t) {
    dr = sl = !0;
    var n = e.pending;
    n === null ? t.next = t : (t.next = n.next, n.next = t), e.pending = t;
  }
  function js(e, t, n) {
    if ((n & 4194240) !== 0) {
      var r = t.lanes;
      r &= e.pendingLanes, n |= r, t.lanes = n, ql(e, n);
    }
  }
  var fl = { readContext: qe, useCallback: Pe, useContext: Pe, useEffect: Pe, useImperativeHandle: Pe, useInsertionEffect: Pe, useLayoutEffect: Pe, useMemo: Pe, useReducer: Pe, useRef: Pe, useState: Pe, useDebugValue: Pe, useDeferredValue: Pe, useTransition: Pe, useMutableSource: Pe, useSyncExternalStore: Pe, useId: Pe, unstable_isNewReconciler: !1 }, ff = { readContext: qe, useCallback: function(e, t) {
    return vt().memoizedState = [e, t === void 0 ? null : t], e;
  }, useContext: qe, useEffect: xs, useImperativeHandle: function(e, t, n) {
    return n = n != null ? n.concat([e]) : null, al(
      4194308,
      4,
      Ns.bind(null, t, e),
      n
    );
  }, useLayoutEffect: function(e, t) {
    return al(4194308, 4, e, t);
  }, useInsertionEffect: function(e, t) {
    return al(4, 2, e, t);
  }, useMemo: function(e, t) {
    var n = vt();
    return t = t === void 0 ? null : t, e = e(), n.memoizedState = [e, t], e;
  }, useReducer: function(e, t, n) {
    var r = vt();
    return t = n !== void 0 ? n(t) : t, r.memoizedState = r.baseState = t, e = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: e, lastRenderedState: t }, r.queue = e, e = e.dispatch = af.bind(null, ae, e), [r.memoizedState, e];
  }, useRef: function(e) {
    var t = vt();
    return e = { current: e }, t.memoizedState = e;
  }, useState: ks, useDebugValue: Xo, useDeferredValue: function(e) {
    return vt().memoizedState = e;
  }, useTransition: function() {
    var e = ks(!1), t = e[0];
    return e = sf.bind(null, e[1]), vt().memoizedState = e, [t, e];
  }, useMutableSource: function() {
  }, useSyncExternalStore: function(e, t, n) {
    var r = ae, l = vt();
    if (ue) {
      if (n === void 0) throw Error(m(407));
      n = n();
    } else {
      if (n = t(), Se === null) throw Error(m(349));
      (rn & 30) !== 0 || vs(r, t, n);
    }
    l.memoizedState = n;
    var o = { value: n, getSnapshot: t };
    return l.queue = o, xs(ys.bind(
      null,
      r,
      o,
      e
    ), [e]), r.flags |= 2048, hr(9, gs.bind(null, r, o, n, t), void 0, null), n;
  }, useId: function() {
    var e = vt(), t = Se.identifierPrefix;
    if (ue) {
      var n = Ct, r = xt;
      n = (r & ~(1 << 32 - rt(r) - 1)).toString(32) + n, t = ":" + t + "R" + n, n = pr++, 0 < n && (t += "H" + n.toString(32)), t += ":";
    } else n = uf++, t = ":" + t + "r" + n.toString(32) + ":";
    return e.memoizedState = t;
  }, unstable_isNewReconciler: !1 }, df = {
    readContext: qe,
    useCallback: Ms,
    useContext: qe,
    useEffect: Yo,
    useImperativeHandle: Ps,
    useInsertionEffect: Cs,
    useLayoutEffect: _s,
    useMemo: Rs,
    useReducer: Ko,
    useRef: Es,
    useState: function() {
      return Ko(mr);
    },
    useDebugValue: Xo,
    useDeferredValue: function(e) {
      var t = Ze();
      return Ts(t, ge.memoizedState, e);
    },
    useTransition: function() {
      var e = Ko(mr)[0], t = Ze().memoizedState;
      return [e, t];
    },
    useMutableSource: ms,
    useSyncExternalStore: hs,
    useId: Ls,
    unstable_isNewReconciler: !1
  }, pf = { readContext: qe, useCallback: Ms, useContext: qe, useEffect: Yo, useImperativeHandle: Ps, useInsertionEffect: Cs, useLayoutEffect: _s, useMemo: Rs, useReducer: Go, useRef: Es, useState: function() {
    return Go(mr);
  }, useDebugValue: Xo, useDeferredValue: function(e) {
    var t = Ze();
    return ge === null ? t.memoizedState = e : Ts(t, ge.memoizedState, e);
  }, useTransition: function() {
    var e = Go(mr)[0], t = Ze().memoizedState;
    return [e, t];
  }, useMutableSource: ms, useSyncExternalStore: hs, useId: Ls, unstable_isNewReconciler: !1 };
  function it(e, t) {
    if (e && e.defaultProps) {
      t = N({}, t), e = e.defaultProps;
      for (var n in e) t[n] === void 0 && (t[n] = e[n]);
      return t;
    }
    return t;
  }
  function qo(e, t, n, r) {
    t = e.memoizedState, n = n(r, t), n = n == null ? t : N({}, t, n), e.memoizedState = n, e.lanes === 0 && (e.updateQueue.baseState = n);
  }
  var dl = { isMounted: function(e) {
    return (e = e._reactInternals) ? qt(e) === e : !1;
  }, enqueueSetState: function(e, t, n) {
    e = e._reactInternals;
    var r = ze(), l = Qt(e), o = Nt(r, l);
    o.payload = t, n != null && (o.callback = n), t = Bt(e, o, l), t !== null && (at(t, e, l, r), ll(t, e, l));
  }, enqueueReplaceState: function(e, t, n) {
    e = e._reactInternals;
    var r = ze(), l = Qt(e), o = Nt(r, l);
    o.tag = 1, o.payload = t, n != null && (o.callback = n), t = Bt(e, o, l), t !== null && (at(t, e, l, r), ll(t, e, l));
  }, enqueueForceUpdate: function(e, t) {
    e = e._reactInternals;
    var n = ze(), r = Qt(e), l = Nt(n, r);
    l.tag = 2, t != null && (l.callback = t), t = Bt(e, l, r), t !== null && (at(t, e, r, n), ll(t, e, r));
  } };
  function Ds(e, t, n, r, l, o, i) {
    return e = e.stateNode, typeof e.shouldComponentUpdate == "function" ? e.shouldComponentUpdate(r, o, i) : t.prototype && t.prototype.isPureReactComponent ? !tr(n, r) || !tr(l, o) : !0;
  }
  function Is(e, t, n) {
    var r = !1, l = Ft, o = t.contextType;
    return typeof o == "object" && o !== null ? o = qe(o) : (l = Ie(t) ? Jt : Ne.current, r = t.contextTypes, o = (r = r != null) ? Cn(e, l) : Ft), t = new t(n, o), e.memoizedState = t.state !== null && t.state !== void 0 ? t.state : null, t.updater = dl, e.stateNode = t, t._reactInternals = e, r && (e = e.stateNode, e.__reactInternalMemoizedUnmaskedChildContext = l, e.__reactInternalMemoizedMaskedChildContext = o), t;
  }
  function As(e, t, n, r) {
    e = t.state, typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(n, r), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(n, r), t.state !== e && dl.enqueueReplaceState(t, t.state, null);
  }
  function Zo(e, t, n, r) {
    var l = e.stateNode;
    l.props = n, l.state = e.memoizedState, l.refs = {}, Ao(e);
    var o = t.contextType;
    typeof o == "object" && o !== null ? l.context = qe(o) : (o = Ie(t) ? Jt : Ne.current, l.context = Cn(e, o)), l.state = e.memoizedState, o = t.getDerivedStateFromProps, typeof o == "function" && (qo(e, t, o, n), l.state = e.memoizedState), typeof t.getDerivedStateFromProps == "function" || typeof l.getSnapshotBeforeUpdate == "function" || typeof l.UNSAFE_componentWillMount != "function" && typeof l.componentWillMount != "function" || (t = l.state, typeof l.componentWillMount == "function" && l.componentWillMount(), typeof l.UNSAFE_componentWillMount == "function" && l.UNSAFE_componentWillMount(), t !== l.state && dl.enqueueReplaceState(l, l.state, null), ol(e, n, l, r), l.state = e.memoizedState), typeof l.componentDidMount == "function" && (e.flags |= 4194308);
  }
  function zn(e, t) {
    try {
      var n = "", r = t;
      do
        n += W(r), r = r.return;
      while (r);
      var l = n;
    } catch (o) {
      l = `
Error generating stack: ` + o.message + `
` + o.stack;
    }
    return { value: e, source: t, stack: l, digest: null };
  }
  function Jo(e, t, n) {
    return { value: e, source: null, stack: n ?? null, digest: t ?? null };
  }
  function bo(e, t) {
    try {
      console.error(t.value);
    } catch (n) {
      setTimeout(function() {
        throw n;
      });
    }
  }
  var mf = typeof WeakMap == "function" ? WeakMap : Map;
  function Fs(e, t, n) {
    n = Nt(-1, n), n.tag = 3, n.payload = { element: null };
    var r = t.value;
    return n.callback = function() {
      wl || (wl = !0, mi = r), bo(e, t);
    }, n;
  }
  function Us(e, t, n) {
    n = Nt(-1, n), n.tag = 3;
    var r = e.type.getDerivedStateFromError;
    if (typeof r == "function") {
      var l = t.value;
      n.payload = function() {
        return r(l);
      }, n.callback = function() {
        bo(e, t);
      };
    }
    var o = e.stateNode;
    return o !== null && typeof o.componentDidCatch == "function" && (n.callback = function() {
      bo(e, t), typeof r != "function" && (Wt === null ? Wt = /* @__PURE__ */ new Set([this]) : Wt.add(this));
      var i = t.stack;
      this.componentDidCatch(t.value, { componentStack: i !== null ? i : "" });
    }), n;
  }
  function Vs(e, t, n) {
    var r = e.pingCache;
    if (r === null) {
      r = e.pingCache = new mf();
      var l = /* @__PURE__ */ new Set();
      r.set(t, l);
    } else l = r.get(t), l === void 0 && (l = /* @__PURE__ */ new Set(), r.set(t, l));
    l.has(n) || (l.add(n), e = Mf.bind(null, e, t, n), t.then(e, e));
  }
  function Bs(e) {
    do {
      var t;
      if ((t = e.tag === 13) && (t = e.memoizedState, t = t !== null ? t.dehydrated !== null : !0), t) return e;
      e = e.return;
    } while (e !== null);
    return null;
  }
  function Hs(e, t, n, r, l) {
    return (e.mode & 1) === 0 ? (e === t ? e.flags |= 65536 : (e.flags |= 128, n.flags |= 131072, n.flags &= -52805, n.tag === 1 && (n.alternate === null ? n.tag = 17 : (t = Nt(-1, 1), t.tag = 2, Bt(n, t, 1))), n.lanes |= 1), e) : (e.flags |= 65536, e.lanes = l, e);
  }
  var hf = _e.ReactCurrentOwner, Ae = !1;
  function Le(e, t, n, r) {
    t.child = e === null ? ss(t, null, n, r) : Mn(t, e.child, n, r);
  }
  function Ws(e, t, n, r, l) {
    n = n.render;
    var o = t.ref;
    return Tn(t, l), r = $o(e, t, n, r, o, l), n = Qo(), e !== null && !Ae ? (t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~l, Pt(e, t, l)) : (ue && n && Po(t), t.flags |= 1, Le(e, t, r, l), t.child);
  }
  function $s(e, t, n, r, l) {
    if (e === null) {
      var o = n.type;
      return typeof o == "function" && !ki(o) && o.defaultProps === void 0 && n.compare === null && n.defaultProps === void 0 ? (t.tag = 15, t.type = o, Qs(e, t, o, r, l)) : (e = _l(n.type, null, r, t, t.mode, l), e.ref = t.ref, e.return = t, t.child = e);
    }
    if (o = e.child, (e.lanes & l) === 0) {
      var i = o.memoizedProps;
      if (n = n.compare, n = n !== null ? n : tr, n(i, r) && e.ref === t.ref) return Pt(e, t, l);
    }
    return t.flags |= 1, e = Gt(o, r), e.ref = t.ref, e.return = t, t.child = e;
  }
  function Qs(e, t, n, r, l) {
    if (e !== null) {
      var o = e.memoizedProps;
      if (tr(o, r) && e.ref === t.ref) if (Ae = !1, t.pendingProps = r = o, (e.lanes & l) !== 0) (e.flags & 131072) !== 0 && (Ae = !0);
      else return t.lanes = e.lanes, Pt(e, t, l);
    }
    return ei(e, t, n, r, l);
  }
  function Ks(e, t, n) {
    var r = t.pendingProps, l = r.children, o = e !== null ? e.memoizedState : null;
    if (r.mode === "hidden") if ((t.mode & 1) === 0) t.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }, re(jn, Ke), Ke |= n;
    else {
      if ((n & 1073741824) === 0) return e = o !== null ? o.baseLanes | n : n, t.lanes = t.childLanes = 1073741824, t.memoizedState = { baseLanes: e, cachePool: null, transitions: null }, t.updateQueue = null, re(jn, Ke), Ke |= e, null;
      t.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }, r = o !== null ? o.baseLanes : n, re(jn, Ke), Ke |= r;
    }
    else o !== null ? (r = o.baseLanes | n, t.memoizedState = null) : r = n, re(jn, Ke), Ke |= r;
    return Le(e, t, l, n), t.child;
  }
  function Gs(e, t) {
    var n = t.ref;
    (e === null && n !== null || e !== null && e.ref !== n) && (t.flags |= 512, t.flags |= 2097152);
  }
  function ei(e, t, n, r, l) {
    var o = Ie(n) ? Jt : Ne.current;
    return o = Cn(t, o), Tn(t, l), n = $o(e, t, n, r, o, l), r = Qo(), e !== null && !Ae ? (t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~l, Pt(e, t, l)) : (ue && r && Po(t), t.flags |= 1, Le(e, t, n, l), t.child);
  }
  function Ys(e, t, n, r, l) {
    if (Ie(n)) {
      var o = !0;
      qr(t);
    } else o = !1;
    if (Tn(t, l), t.stateNode === null) ml(e, t), Is(t, n, r), Zo(t, n, r, l), r = !0;
    else if (e === null) {
      var i = t.stateNode, u = t.memoizedProps;
      i.props = u;
      var s = i.context, p = n.contextType;
      typeof p == "object" && p !== null ? p = qe(p) : (p = Ie(n) ? Jt : Ne.current, p = Cn(t, p));
      var w = n.getDerivedStateFromProps, S = typeof w == "function" || typeof i.getSnapshotBeforeUpdate == "function";
      S || typeof i.UNSAFE_componentWillReceiveProps != "function" && typeof i.componentWillReceiveProps != "function" || (u !== r || s !== p) && As(t, i, r, p), Vt = !1;
      var v = t.memoizedState;
      i.state = v, ol(t, r, i, l), s = t.memoizedState, u !== r || v !== s || De.current || Vt ? (typeof w == "function" && (qo(t, n, w, r), s = t.memoizedState), (u = Vt || Ds(t, n, u, r, v, s, p)) ? (S || typeof i.UNSAFE_componentWillMount != "function" && typeof i.componentWillMount != "function" || (typeof i.componentWillMount == "function" && i.componentWillMount(), typeof i.UNSAFE_componentWillMount == "function" && i.UNSAFE_componentWillMount()), typeof i.componentDidMount == "function" && (t.flags |= 4194308)) : (typeof i.componentDidMount == "function" && (t.flags |= 4194308), t.memoizedProps = r, t.memoizedState = s), i.props = r, i.state = s, i.context = p, r = u) : (typeof i.componentDidMount == "function" && (t.flags |= 4194308), r = !1);
    } else {
      i = t.stateNode, cs(e, t), u = t.memoizedProps, p = t.type === t.elementType ? u : it(t.type, u), i.props = p, S = t.pendingProps, v = i.context, s = n.contextType, typeof s == "object" && s !== null ? s = qe(s) : (s = Ie(n) ? Jt : Ne.current, s = Cn(t, s));
      var x = n.getDerivedStateFromProps;
      (w = typeof x == "function" || typeof i.getSnapshotBeforeUpdate == "function") || typeof i.UNSAFE_componentWillReceiveProps != "function" && typeof i.componentWillReceiveProps != "function" || (u !== S || v !== s) && As(t, i, r, s), Vt = !1, v = t.memoizedState, i.state = v, ol(t, r, i, l);
      var P = t.memoizedState;
      u !== S || v !== P || De.current || Vt ? (typeof x == "function" && (qo(t, n, x, r), P = t.memoizedState), (p = Vt || Ds(t, n, p, r, v, P, s) || !1) ? (w || typeof i.UNSAFE_componentWillUpdate != "function" && typeof i.componentWillUpdate != "function" || (typeof i.componentWillUpdate == "function" && i.componentWillUpdate(r, P, s), typeof i.UNSAFE_componentWillUpdate == "function" && i.UNSAFE_componentWillUpdate(r, P, s)), typeof i.componentDidUpdate == "function" && (t.flags |= 4), typeof i.getSnapshotBeforeUpdate == "function" && (t.flags |= 1024)) : (typeof i.componentDidUpdate != "function" || u === e.memoizedProps && v === e.memoizedState || (t.flags |= 4), typeof i.getSnapshotBeforeUpdate != "function" || u === e.memoizedProps && v === e.memoizedState || (t.flags |= 1024), t.memoizedProps = r, t.memoizedState = P), i.props = r, i.state = P, i.context = s, r = p) : (typeof i.componentDidUpdate != "function" || u === e.memoizedProps && v === e.memoizedState || (t.flags |= 4), typeof i.getSnapshotBeforeUpdate != "function" || u === e.memoizedProps && v === e.memoizedState || (t.flags |= 1024), r = !1);
    }
    return ti(e, t, n, r, o, l);
  }
  function ti(e, t, n, r, l, o) {
    Gs(e, t);
    var i = (t.flags & 128) !== 0;
    if (!r && !i) return l && bu(t, n, !1), Pt(e, t, o);
    r = t.stateNode, hf.current = t;
    var u = i && typeof n.getDerivedStateFromError != "function" ? null : r.render();
    return t.flags |= 1, e !== null && i ? (t.child = Mn(t, e.child, null, o), t.child = Mn(t, null, u, o)) : Le(e, t, u, o), t.memoizedState = r.state, l && bu(t, n, !0), t.child;
  }
  function Xs(e) {
    var t = e.stateNode;
    t.pendingContext ? Zu(e, t.pendingContext, t.pendingContext !== t.context) : t.context && Zu(e, t.context, !1), Fo(e, t.containerInfo);
  }
  function qs(e, t, n, r, l) {
    return Pn(), Lo(l), t.flags |= 256, Le(e, t, n, r), t.child;
  }
  var ni = { dehydrated: null, treeContext: null, retryLane: 0 };
  function ri(e) {
    return { baseLanes: e, cachePool: null, transitions: null };
  }
  function Zs(e, t, n) {
    var r = t.pendingProps, l = se.current, o = !1, i = (t.flags & 128) !== 0, u;
    if ((u = i) || (u = e !== null && e.memoizedState === null ? !1 : (l & 2) !== 0), u ? (o = !0, t.flags &= -129) : (e === null || e.memoizedState !== null) && (l |= 1), re(se, l & 1), e === null)
      return To(t), e = t.memoizedState, e !== null && (e = e.dehydrated, e !== null) ? ((t.mode & 1) === 0 ? t.lanes = 1 : e.data === "$!" ? t.lanes = 8 : t.lanes = 1073741824, null) : (i = r.children, e = r.fallback, o ? (r = t.mode, o = t.child, i = { mode: "hidden", children: i }, (r & 1) === 0 && o !== null ? (o.childLanes = 0, o.pendingProps = i) : o = Nl(i, r, 0, null), e = an(e, r, n, null), o.return = t, e.return = t, o.sibling = e, t.child = o, t.child.memoizedState = ri(n), t.memoizedState = ni, e) : li(t, i));
    if (l = e.memoizedState, l !== null && (u = l.dehydrated, u !== null)) return vf(e, t, i, r, u, l, n);
    if (o) {
      o = r.fallback, i = t.mode, l = e.child, u = l.sibling;
      var s = { mode: "hidden", children: r.children };
      return (i & 1) === 0 && t.child !== l ? (r = t.child, r.childLanes = 0, r.pendingProps = s, t.deletions = null) : (r = Gt(l, s), r.subtreeFlags = l.subtreeFlags & 14680064), u !== null ? o = Gt(u, o) : (o = an(o, i, n, null), o.flags |= 2), o.return = t, r.return = t, r.sibling = o, t.child = r, r = o, o = t.child, i = e.child.memoizedState, i = i === null ? ri(n) : { baseLanes: i.baseLanes | n, cachePool: null, transitions: i.transitions }, o.memoizedState = i, o.childLanes = e.childLanes & ~n, t.memoizedState = ni, r;
    }
    return o = e.child, e = o.sibling, r = Gt(o, { mode: "visible", children: r.children }), (t.mode & 1) === 0 && (r.lanes = n), r.return = t, r.sibling = null, e !== null && (n = t.deletions, n === null ? (t.deletions = [e], t.flags |= 16) : n.push(e)), t.child = r, t.memoizedState = null, r;
  }
  function li(e, t) {
    return t = Nl({ mode: "visible", children: t }, e.mode, 0, null), t.return = e, e.child = t;
  }
  function pl(e, t, n, r) {
    return r !== null && Lo(r), Mn(t, e.child, null, n), e = li(t, t.pendingProps.children), e.flags |= 2, t.memoizedState = null, e;
  }
  function vf(e, t, n, r, l, o, i) {
    if (n)
      return t.flags & 256 ? (t.flags &= -257, r = Jo(Error(m(422))), pl(e, t, i, r)) : t.memoizedState !== null ? (t.child = e.child, t.flags |= 128, null) : (o = r.fallback, l = t.mode, r = Nl({ mode: "visible", children: r.children }, l, 0, null), o = an(o, l, i, null), o.flags |= 2, r.return = t, o.return = t, r.sibling = o, t.child = r, (t.mode & 1) !== 0 && Mn(t, e.child, null, i), t.child.memoizedState = ri(i), t.memoizedState = ni, o);
    if ((t.mode & 1) === 0) return pl(e, t, i, null);
    if (l.data === "$!") {
      if (r = l.nextSibling && l.nextSibling.dataset, r) var u = r.dgst;
      return r = u, o = Error(m(419)), r = Jo(o, r, void 0), pl(e, t, i, r);
    }
    if (u = (i & e.childLanes) !== 0, Ae || u) {
      if (r = Se, r !== null) {
        switch (i & -i) {
          case 4:
            l = 2;
            break;
          case 16:
            l = 8;
            break;
          case 64:
          case 128:
          case 256:
          case 512:
          case 1024:
          case 2048:
          case 4096:
          case 8192:
          case 16384:
          case 32768:
          case 65536:
          case 131072:
          case 262144:
          case 524288:
          case 1048576:
          case 2097152:
          case 4194304:
          case 8388608:
          case 16777216:
          case 33554432:
          case 67108864:
            l = 32;
            break;
          case 536870912:
            l = 268435456;
            break;
          default:
            l = 0;
        }
        l = (l & (r.suspendedLanes | i)) !== 0 ? 0 : l, l !== 0 && l !== o.retryLane && (o.retryLane = l, _t(e, l), at(r, e, l, -1));
      }
      return Si(), r = Jo(Error(m(421))), pl(e, t, i, r);
    }
    return l.data === "$?" ? (t.flags |= 128, t.child = e.child, t = Rf.bind(null, e), l._reactRetry = t, null) : (e = o.treeContext, Qe = It(l.nextSibling), $e = t, ue = !0, ot = null, e !== null && (Ye[Xe++] = xt, Ye[Xe++] = Ct, Ye[Xe++] = bt, xt = e.id, Ct = e.overflow, bt = t), t = li(t, r.children), t.flags |= 4096, t);
  }
  function Js(e, t, n) {
    e.lanes |= t;
    var r = e.alternate;
    r !== null && (r.lanes |= t), Do(e.return, t, n);
  }
  function oi(e, t, n, r, l) {
    var o = e.memoizedState;
    o === null ? e.memoizedState = { isBackwards: t, rendering: null, renderingStartTime: 0, last: r, tail: n, tailMode: l } : (o.isBackwards = t, o.rendering = null, o.renderingStartTime = 0, o.last = r, o.tail = n, o.tailMode = l);
  }
  function bs(e, t, n) {
    var r = t.pendingProps, l = r.revealOrder, o = r.tail;
    if (Le(e, t, r.children, n), r = se.current, (r & 2) !== 0) r = r & 1 | 2, t.flags |= 128;
    else {
      if (e !== null && (e.flags & 128) !== 0) e: for (e = t.child; e !== null; ) {
        if (e.tag === 13) e.memoizedState !== null && Js(e, n, t);
        else if (e.tag === 19) Js(e, n, t);
        else if (e.child !== null) {
          e.child.return = e, e = e.child;
          continue;
        }
        if (e === t) break e;
        for (; e.sibling === null; ) {
          if (e.return === null || e.return === t) break e;
          e = e.return;
        }
        e.sibling.return = e.return, e = e.sibling;
      }
      r &= 1;
    }
    if (re(se, r), (t.mode & 1) === 0) t.memoizedState = null;
    else switch (l) {
      case "forwards":
        for (n = t.child, l = null; n !== null; ) e = n.alternate, e !== null && il(e) === null && (l = n), n = n.sibling;
        n = l, n === null ? (l = t.child, t.child = null) : (l = n.sibling, n.sibling = null), oi(t, !1, l, n, o);
        break;
      case "backwards":
        for (n = null, l = t.child, t.child = null; l !== null; ) {
          if (e = l.alternate, e !== null && il(e) === null) {
            t.child = l;
            break;
          }
          e = l.sibling, l.sibling = n, n = l, l = e;
        }
        oi(t, !0, n, null, o);
        break;
      case "together":
        oi(t, !1, null, null, void 0);
        break;
      default:
        t.memoizedState = null;
    }
    return t.child;
  }
  function ml(e, t) {
    (t.mode & 1) === 0 && e !== null && (e.alternate = null, t.alternate = null, t.flags |= 2);
  }
  function Pt(e, t, n) {
    if (e !== null && (t.dependencies = e.dependencies), ln |= t.lanes, (n & t.childLanes) === 0) return null;
    if (e !== null && t.child !== e.child) throw Error(m(153));
    if (t.child !== null) {
      for (e = t.child, n = Gt(e, e.pendingProps), t.child = n, n.return = t; e.sibling !== null; ) e = e.sibling, n = n.sibling = Gt(e, e.pendingProps), n.return = t;
      n.sibling = null;
    }
    return t.child;
  }
  function gf(e, t, n) {
    switch (t.tag) {
      case 3:
        Xs(t), Pn();
        break;
      case 5:
        ps(t);
        break;
      case 1:
        Ie(t.type) && qr(t);
        break;
      case 4:
        Fo(t, t.stateNode.containerInfo);
        break;
      case 10:
        var r = t.type._context, l = t.memoizedProps.value;
        re(nl, r._currentValue), r._currentValue = l;
        break;
      case 13:
        if (r = t.memoizedState, r !== null)
          return r.dehydrated !== null ? (re(se, se.current & 1), t.flags |= 128, null) : (n & t.child.childLanes) !== 0 ? Zs(e, t, n) : (re(se, se.current & 1), e = Pt(e, t, n), e !== null ? e.sibling : null);
        re(se, se.current & 1);
        break;
      case 19:
        if (r = (n & t.childLanes) !== 0, (e.flags & 128) !== 0) {
          if (r) return bs(e, t, n);
          t.flags |= 128;
        }
        if (l = t.memoizedState, l !== null && (l.rendering = null, l.tail = null, l.lastEffect = null), re(se, se.current), r) break;
        return null;
      case 22:
      case 23:
        return t.lanes = 0, Ks(e, t, n);
    }
    return Pt(e, t, n);
  }
  var ea, ii, ta, na;
  ea = function(e, t) {
    for (var n = t.child; n !== null; ) {
      if (n.tag === 5 || n.tag === 6) e.appendChild(n.stateNode);
      else if (n.tag !== 4 && n.child !== null) {
        n.child.return = n, n = n.child;
        continue;
      }
      if (n === t) break;
      for (; n.sibling === null; ) {
        if (n.return === null || n.return === t) return;
        n = n.return;
      }
      n.sibling.return = n.return, n = n.sibling;
    }
  }, ii = function() {
  }, ta = function(e, t, n, r) {
    var l = e.memoizedProps;
    if (l !== r) {
      e = t.stateNode, nn(ht.current);
      var o = null;
      switch (n) {
        case "input":
          l = jl(e, l), r = jl(e, r), o = [];
          break;
        case "select":
          l = N({}, l, { value: void 0 }), r = N({}, r, { value: void 0 }), o = [];
          break;
        case "textarea":
          l = Al(e, l), r = Al(e, r), o = [];
          break;
        default:
          typeof l.onClick != "function" && typeof r.onClick == "function" && (e.onclick = Gr);
      }
      Ul(n, r);
      var i;
      n = null;
      for (p in l) if (!r.hasOwnProperty(p) && l.hasOwnProperty(p) && l[p] != null) if (p === "style") {
        var u = l[p];
        for (i in u) u.hasOwnProperty(i) && (n || (n = {}), n[i] = "");
      } else p !== "dangerouslySetInnerHTML" && p !== "children" && p !== "suppressContentEditableWarning" && p !== "suppressHydrationWarning" && p !== "autoFocus" && (te.hasOwnProperty(p) ? o || (o = []) : (o = o || []).push(p, null));
      for (p in r) {
        var s = r[p];
        if (u = l != null ? l[p] : void 0, r.hasOwnProperty(p) && s !== u && (s != null || u != null)) if (p === "style") if (u) {
          for (i in u) !u.hasOwnProperty(i) || s && s.hasOwnProperty(i) || (n || (n = {}), n[i] = "");
          for (i in s) s.hasOwnProperty(i) && u[i] !== s[i] && (n || (n = {}), n[i] = s[i]);
        } else n || (o || (o = []), o.push(
          p,
          n
        )), n = s;
        else p === "dangerouslySetInnerHTML" ? (s = s ? s.__html : void 0, u = u ? u.__html : void 0, s != null && u !== s && (o = o || []).push(p, s)) : p === "children" ? typeof s != "string" && typeof s != "number" || (o = o || []).push(p, "" + s) : p !== "suppressContentEditableWarning" && p !== "suppressHydrationWarning" && (te.hasOwnProperty(p) ? (s != null && p === "onScroll" && le("scroll", e), o || u === s || (o = [])) : (o = o || []).push(p, s));
      }
      n && (o = o || []).push("style", n);
      var p = o;
      (t.updateQueue = p) && (t.flags |= 4);
    }
  }, na = function(e, t, n, r) {
    n !== r && (t.flags |= 4);
  };
  function vr(e, t) {
    if (!ue) switch (e.tailMode) {
      case "hidden":
        t = e.tail;
        for (var n = null; t !== null; ) t.alternate !== null && (n = t), t = t.sibling;
        n === null ? e.tail = null : n.sibling = null;
        break;
      case "collapsed":
        n = e.tail;
        for (var r = null; n !== null; ) n.alternate !== null && (r = n), n = n.sibling;
        r === null ? t || e.tail === null ? e.tail = null : e.tail.sibling = null : r.sibling = null;
    }
  }
  function Me(e) {
    var t = e.alternate !== null && e.alternate.child === e.child, n = 0, r = 0;
    if (t) for (var l = e.child; l !== null; ) n |= l.lanes | l.childLanes, r |= l.subtreeFlags & 14680064, r |= l.flags & 14680064, l.return = e, l = l.sibling;
    else for (l = e.child; l !== null; ) n |= l.lanes | l.childLanes, r |= l.subtreeFlags, r |= l.flags, l.return = e, l = l.sibling;
    return e.subtreeFlags |= r, e.childLanes = n, t;
  }
  function yf(e, t, n) {
    var r = t.pendingProps;
    switch (Mo(t), t.tag) {
      case 2:
      case 16:
      case 15:
      case 0:
      case 11:
      case 7:
      case 8:
      case 12:
      case 9:
      case 14:
        return Me(t), null;
      case 1:
        return Ie(t.type) && Xr(), Me(t), null;
      case 3:
        return r = t.stateNode, Ln(), oe(De), oe(Ne), Bo(), r.pendingContext && (r.context = r.pendingContext, r.pendingContext = null), (e === null || e.child === null) && (el(t) ? t.flags |= 4 : e === null || e.memoizedState.isDehydrated && (t.flags & 256) === 0 || (t.flags |= 1024, ot !== null && (gi(ot), ot = null))), ii(e, t), Me(t), null;
      case 5:
        Uo(t);
        var l = nn(fr.current);
        if (n = t.type, e !== null && t.stateNode != null) ta(e, t, n, r, l), e.ref !== t.ref && (t.flags |= 512, t.flags |= 2097152);
        else {
          if (!r) {
            if (t.stateNode === null) throw Error(m(166));
            return Me(t), null;
          }
          if (e = nn(ht.current), el(t)) {
            r = t.stateNode, n = t.type;
            var o = t.memoizedProps;
            switch (r[mt] = t, r[ir] = o, e = (t.mode & 1) !== 0, n) {
              case "dialog":
                le("cancel", r), le("close", r);
                break;
              case "iframe":
              case "object":
              case "embed":
                le("load", r);
                break;
              case "video":
              case "audio":
                for (l = 0; l < rr.length; l++) le(rr[l], r);
                break;
              case "source":
                le("error", r);
                break;
              case "img":
              case "image":
              case "link":
                le(
                  "error",
                  r
                ), le("load", r);
                break;
              case "details":
                le("toggle", r);
                break;
              case "input":
                Ii(r, o), le("invalid", r);
                break;
              case "select":
                r._wrapperState = { wasMultiple: !!o.multiple }, le("invalid", r);
                break;
              case "textarea":
                Ui(r, o), le("invalid", r);
            }
            Ul(n, o), l = null;
            for (var i in o) if (o.hasOwnProperty(i)) {
              var u = o[i];
              i === "children" ? typeof u == "string" ? r.textContent !== u && (o.suppressHydrationWarning !== !0 && Kr(r.textContent, u, e), l = ["children", u]) : typeof u == "number" && r.textContent !== "" + u && (o.suppressHydrationWarning !== !0 && Kr(
                r.textContent,
                u,
                e
              ), l = ["children", "" + u]) : te.hasOwnProperty(i) && u != null && i === "onScroll" && le("scroll", r);
            }
            switch (n) {
              case "input":
                xr(r), Fi(r, o, !0);
                break;
              case "textarea":
                xr(r), Bi(r);
                break;
              case "select":
              case "option":
                break;
              default:
                typeof o.onClick == "function" && (r.onclick = Gr);
            }
            r = l, t.updateQueue = r, r !== null && (t.flags |= 4);
          } else {
            i = l.nodeType === 9 ? l : l.ownerDocument, e === "http://www.w3.org/1999/xhtml" && (e = Hi(n)), e === "http://www.w3.org/1999/xhtml" ? n === "script" ? (e = i.createElement("div"), e.innerHTML = "<script><\/script>", e = e.removeChild(e.firstChild)) : typeof r.is == "string" ? e = i.createElement(n, { is: r.is }) : (e = i.createElement(n), n === "select" && (i = e, r.multiple ? i.multiple = !0 : r.size && (i.size = r.size))) : e = i.createElementNS(e, n), e[mt] = t, e[ir] = r, ea(e, t, !1, !1), t.stateNode = e;
            e: {
              switch (i = Vl(n, r), n) {
                case "dialog":
                  le("cancel", e), le("close", e), l = r;
                  break;
                case "iframe":
                case "object":
                case "embed":
                  le("load", e), l = r;
                  break;
                case "video":
                case "audio":
                  for (l = 0; l < rr.length; l++) le(rr[l], e);
                  l = r;
                  break;
                case "source":
                  le("error", e), l = r;
                  break;
                case "img":
                case "image":
                case "link":
                  le(
                    "error",
                    e
                  ), le("load", e), l = r;
                  break;
                case "details":
                  le("toggle", e), l = r;
                  break;
                case "input":
                  Ii(e, r), l = jl(e, r), le("invalid", e);
                  break;
                case "option":
                  l = r;
                  break;
                case "select":
                  e._wrapperState = { wasMultiple: !!r.multiple }, l = N({}, r, { value: void 0 }), le("invalid", e);
                  break;
                case "textarea":
                  Ui(e, r), l = Al(e, r), le("invalid", e);
                  break;
                default:
                  l = r;
              }
              Ul(n, l), u = l;
              for (o in u) if (u.hasOwnProperty(o)) {
                var s = u[o];
                o === "style" ? Qi(e, s) : o === "dangerouslySetInnerHTML" ? (s = s ? s.__html : void 0, s != null && Wi(e, s)) : o === "children" ? typeof s == "string" ? (n !== "textarea" || s !== "") && Fn(e, s) : typeof s == "number" && Fn(e, "" + s) : o !== "suppressContentEditableWarning" && o !== "suppressHydrationWarning" && o !== "autoFocus" && (te.hasOwnProperty(o) ? s != null && o === "onScroll" && le("scroll", e) : s != null && et(e, o, s, i));
              }
              switch (n) {
                case "input":
                  xr(e), Fi(e, r, !1);
                  break;
                case "textarea":
                  xr(e), Bi(e);
                  break;
                case "option":
                  r.value != null && e.setAttribute("value", "" + q(r.value));
                  break;
                case "select":
                  e.multiple = !!r.multiple, o = r.value, o != null ? dn(e, !!r.multiple, o, !1) : r.defaultValue != null && dn(
                    e,
                    !!r.multiple,
                    r.defaultValue,
                    !0
                  );
                  break;
                default:
                  typeof l.onClick == "function" && (e.onclick = Gr);
              }
              switch (n) {
                case "button":
                case "input":
                case "select":
                case "textarea":
                  r = !!r.autoFocus;
                  break e;
                case "img":
                  r = !0;
                  break e;
                default:
                  r = !1;
              }
            }
            r && (t.flags |= 4);
          }
          t.ref !== null && (t.flags |= 512, t.flags |= 2097152);
        }
        return Me(t), null;
      case 6:
        if (e && t.stateNode != null) na(e, t, e.memoizedProps, r);
        else {
          if (typeof r != "string" && t.stateNode === null) throw Error(m(166));
          if (n = nn(fr.current), nn(ht.current), el(t)) {
            if (r = t.stateNode, n = t.memoizedProps, r[mt] = t, (o = r.nodeValue !== n) && (e = $e, e !== null)) switch (e.tag) {
              case 3:
                Kr(r.nodeValue, n, (e.mode & 1) !== 0);
                break;
              case 5:
                e.memoizedProps.suppressHydrationWarning !== !0 && Kr(r.nodeValue, n, (e.mode & 1) !== 0);
            }
            o && (t.flags |= 4);
          } else r = (n.nodeType === 9 ? n : n.ownerDocument).createTextNode(r), r[mt] = t, t.stateNode = r;
        }
        return Me(t), null;
      case 13:
        if (oe(se), r = t.memoizedState, e === null || e.memoizedState !== null && e.memoizedState.dehydrated !== null) {
          if (ue && Qe !== null && (t.mode & 1) !== 0 && (t.flags & 128) === 0) os(), Pn(), t.flags |= 98560, o = !1;
          else if (o = el(t), r !== null && r.dehydrated !== null) {
            if (e === null) {
              if (!o) throw Error(m(318));
              if (o = t.memoizedState, o = o !== null ? o.dehydrated : null, !o) throw Error(m(317));
              o[mt] = t;
            } else Pn(), (t.flags & 128) === 0 && (t.memoizedState = null), t.flags |= 4;
            Me(t), o = !1;
          } else ot !== null && (gi(ot), ot = null), o = !0;
          if (!o) return t.flags & 65536 ? t : null;
        }
        return (t.flags & 128) !== 0 ? (t.lanes = n, t) : (r = r !== null, r !== (e !== null && e.memoizedState !== null) && r && (t.child.flags |= 8192, (t.mode & 1) !== 0 && (e === null || (se.current & 1) !== 0 ? ye === 0 && (ye = 3) : Si())), t.updateQueue !== null && (t.flags |= 4), Me(t), null);
      case 4:
        return Ln(), ii(e, t), e === null && lr(t.stateNode.containerInfo), Me(t), null;
      case 10:
        return jo(t.type._context), Me(t), null;
      case 17:
        return Ie(t.type) && Xr(), Me(t), null;
      case 19:
        if (oe(se), o = t.memoizedState, o === null) return Me(t), null;
        if (r = (t.flags & 128) !== 0, i = o.rendering, i === null) if (r) vr(o, !1);
        else {
          if (ye !== 0 || e !== null && (e.flags & 128) !== 0) for (e = t.child; e !== null; ) {
            if (i = il(e), i !== null) {
              for (t.flags |= 128, vr(o, !1), r = i.updateQueue, r !== null && (t.updateQueue = r, t.flags |= 4), t.subtreeFlags = 0, r = n, n = t.child; n !== null; ) o = n, e = r, o.flags &= 14680066, i = o.alternate, i === null ? (o.childLanes = 0, o.lanes = e, o.child = null, o.subtreeFlags = 0, o.memoizedProps = null, o.memoizedState = null, o.updateQueue = null, o.dependencies = null, o.stateNode = null) : (o.childLanes = i.childLanes, o.lanes = i.lanes, o.child = i.child, o.subtreeFlags = 0, o.deletions = null, o.memoizedProps = i.memoizedProps, o.memoizedState = i.memoizedState, o.updateQueue = i.updateQueue, o.type = i.type, e = i.dependencies, o.dependencies = e === null ? null : { lanes: e.lanes, firstContext: e.firstContext }), n = n.sibling;
              return re(se, se.current & 1 | 2), t.child;
            }
            e = e.sibling;
          }
          o.tail !== null && pe() > Dn && (t.flags |= 128, r = !0, vr(o, !1), t.lanes = 4194304);
        }
        else {
          if (!r) if (e = il(i), e !== null) {
            if (t.flags |= 128, r = !0, n = e.updateQueue, n !== null && (t.updateQueue = n, t.flags |= 4), vr(o, !0), o.tail === null && o.tailMode === "hidden" && !i.alternate && !ue) return Me(t), null;
          } else 2 * pe() - o.renderingStartTime > Dn && n !== 1073741824 && (t.flags |= 128, r = !0, vr(o, !1), t.lanes = 4194304);
          o.isBackwards ? (i.sibling = t.child, t.child = i) : (n = o.last, n !== null ? n.sibling = i : t.child = i, o.last = i);
        }
        return o.tail !== null ? (t = o.tail, o.rendering = t, o.tail = t.sibling, o.renderingStartTime = pe(), t.sibling = null, n = se.current, re(se, r ? n & 1 | 2 : n & 1), t) : (Me(t), null);
      case 22:
      case 23:
        return wi(), r = t.memoizedState !== null, e !== null && e.memoizedState !== null !== r && (t.flags |= 8192), r && (t.mode & 1) !== 0 ? (Ke & 1073741824) !== 0 && (Me(t), t.subtreeFlags & 6 && (t.flags |= 8192)) : Me(t), null;
      case 24:
        return null;
      case 25:
        return null;
    }
    throw Error(m(156, t.tag));
  }
  function wf(e, t) {
    switch (Mo(t), t.tag) {
      case 1:
        return Ie(t.type) && Xr(), e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
      case 3:
        return Ln(), oe(De), oe(Ne), Bo(), e = t.flags, (e & 65536) !== 0 && (e & 128) === 0 ? (t.flags = e & -65537 | 128, t) : null;
      case 5:
        return Uo(t), null;
      case 13:
        if (oe(se), e = t.memoizedState, e !== null && e.dehydrated !== null) {
          if (t.alternate === null) throw Error(m(340));
          Pn();
        }
        return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
      case 19:
        return oe(se), null;
      case 4:
        return Ln(), null;
      case 10:
        return jo(t.type._context), null;
      case 22:
      case 23:
        return wi(), null;
      case 24:
        return null;
      default:
        return null;
    }
  }
  var hl = !1, Re = !1, Sf = typeof WeakSet == "function" ? WeakSet : Set, _ = null;
  function On(e, t) {
    var n = e.ref;
    if (n !== null) if (typeof n == "function") try {
      n(null);
    } catch (r) {
      fe(e, t, r);
    }
    else n.current = null;
  }
  function ui(e, t, n) {
    try {
      n();
    } catch (r) {
      fe(e, t, r);
    }
  }
  var ra = !1;
  function kf(e, t) {
    if (wo = Dr, e = Du(), co(e)) {
      if ("selectionStart" in e) var n = { start: e.selectionStart, end: e.selectionEnd };
      else e: {
        n = (n = e.ownerDocument) && n.defaultView || window;
        var r = n.getSelection && n.getSelection();
        if (r && r.rangeCount !== 0) {
          n = r.anchorNode;
          var l = r.anchorOffset, o = r.focusNode;
          r = r.focusOffset;
          try {
            n.nodeType, o.nodeType;
          } catch {
            n = null;
            break e;
          }
          var i = 0, u = -1, s = -1, p = 0, w = 0, S = e, v = null;
          t: for (; ; ) {
            for (var x; S !== n || l !== 0 && S.nodeType !== 3 || (u = i + l), S !== o || r !== 0 && S.nodeType !== 3 || (s = i + r), S.nodeType === 3 && (i += S.nodeValue.length), (x = S.firstChild) !== null; )
              v = S, S = x;
            for (; ; ) {
              if (S === e) break t;
              if (v === n && ++p === l && (u = i), v === o && ++w === r && (s = i), (x = S.nextSibling) !== null) break;
              S = v, v = S.parentNode;
            }
            S = x;
          }
          n = u === -1 || s === -1 ? null : { start: u, end: s };
        } else n = null;
      }
      n = n || { start: 0, end: 0 };
    } else n = null;
    for (So = { focusedElem: e, selectionRange: n }, Dr = !1, _ = t; _ !== null; ) if (t = _, e = t.child, (t.subtreeFlags & 1028) !== 0 && e !== null) e.return = t, _ = e;
    else for (; _ !== null; ) {
      t = _;
      try {
        var P = t.alternate;
        if ((t.flags & 1024) !== 0) switch (t.tag) {
          case 0:
          case 11:
          case 15:
            break;
          case 1:
            if (P !== null) {
              var M = P.memoizedProps, me = P.memoizedState, f = t.stateNode, a = f.getSnapshotBeforeUpdate(t.elementType === t.type ? M : it(t.type, M), me);
              f.__reactInternalSnapshotBeforeUpdate = a;
            }
            break;
          case 3:
            var d = t.stateNode.containerInfo;
            d.nodeType === 1 ? d.textContent = "" : d.nodeType === 9 && d.documentElement && d.removeChild(d.documentElement);
            break;
          case 5:
          case 6:
          case 4:
          case 17:
            break;
          default:
            throw Error(m(163));
        }
      } catch (k) {
        fe(t, t.return, k);
      }
      if (e = t.sibling, e !== null) {
        e.return = t.return, _ = e;
        break;
      }
      _ = t.return;
    }
    return P = ra, ra = !1, P;
  }
  function gr(e, t, n) {
    var r = t.updateQueue;
    if (r = r !== null ? r.lastEffect : null, r !== null) {
      var l = r = r.next;
      do {
        if ((l.tag & e) === e) {
          var o = l.destroy;
          l.destroy = void 0, o !== void 0 && ui(t, n, o);
        }
        l = l.next;
      } while (l !== r);
    }
  }
  function vl(e, t) {
    if (t = t.updateQueue, t = t !== null ? t.lastEffect : null, t !== null) {
      var n = t = t.next;
      do {
        if ((n.tag & e) === e) {
          var r = n.create;
          n.destroy = r();
        }
        n = n.next;
      } while (n !== t);
    }
  }
  function si(e) {
    var t = e.ref;
    if (t !== null) {
      var n = e.stateNode;
      switch (e.tag) {
        case 5:
          e = n;
          break;
        default:
          e = n;
      }
      typeof t == "function" ? t(e) : t.current = e;
    }
  }
  function la(e) {
    var t = e.alternate;
    t !== null && (e.alternate = null, la(t)), e.child = null, e.deletions = null, e.sibling = null, e.tag === 5 && (t = e.stateNode, t !== null && (delete t[mt], delete t[ir], delete t[Co], delete t[nf], delete t[rf])), e.stateNode = null, e.return = null, e.dependencies = null, e.memoizedProps = null, e.memoizedState = null, e.pendingProps = null, e.stateNode = null, e.updateQueue = null;
  }
  function oa(e) {
    return e.tag === 5 || e.tag === 3 || e.tag === 4;
  }
  function ia(e) {
    e: for (; ; ) {
      for (; e.sibling === null; ) {
        if (e.return === null || oa(e.return)) return null;
        e = e.return;
      }
      for (e.sibling.return = e.return, e = e.sibling; e.tag !== 5 && e.tag !== 6 && e.tag !== 18; ) {
        if (e.flags & 2 || e.child === null || e.tag === 4) continue e;
        e.child.return = e, e = e.child;
      }
      if (!(e.flags & 2)) return e.stateNode;
    }
  }
  function ai(e, t, n) {
    var r = e.tag;
    if (r === 5 || r === 6) e = e.stateNode, t ? n.nodeType === 8 ? n.parentNode.insertBefore(e, t) : n.insertBefore(e, t) : (n.nodeType === 8 ? (t = n.parentNode, t.insertBefore(e, n)) : (t = n, t.appendChild(e)), n = n._reactRootContainer, n != null || t.onclick !== null || (t.onclick = Gr));
    else if (r !== 4 && (e = e.child, e !== null)) for (ai(e, t, n), e = e.sibling; e !== null; ) ai(e, t, n), e = e.sibling;
  }
  function ci(e, t, n) {
    var r = e.tag;
    if (r === 5 || r === 6) e = e.stateNode, t ? n.insertBefore(e, t) : n.appendChild(e);
    else if (r !== 4 && (e = e.child, e !== null)) for (ci(e, t, n), e = e.sibling; e !== null; ) ci(e, t, n), e = e.sibling;
  }
  var xe = null, ut = !1;
  function Ht(e, t, n) {
    for (n = n.child; n !== null; ) ua(e, t, n), n = n.sibling;
  }
  function ua(e, t, n) {
    if (pt && typeof pt.onCommitFiberUnmount == "function") try {
      pt.onCommitFiberUnmount(Rr, n);
    } catch {
    }
    switch (n.tag) {
      case 5:
        Re || On(n, t);
      case 6:
        var r = xe, l = ut;
        xe = null, Ht(e, t, n), xe = r, ut = l, xe !== null && (ut ? (e = xe, n = n.stateNode, e.nodeType === 8 ? e.parentNode.removeChild(n) : e.removeChild(n)) : xe.removeChild(n.stateNode));
        break;
      case 18:
        xe !== null && (ut ? (e = xe, n = n.stateNode, e.nodeType === 8 ? xo(e.parentNode, n) : e.nodeType === 1 && xo(e, n), Xn(e)) : xo(xe, n.stateNode));
        break;
      case 4:
        r = xe, l = ut, xe = n.stateNode.containerInfo, ut = !0, Ht(e, t, n), xe = r, ut = l;
        break;
      case 0:
      case 11:
      case 14:
      case 15:
        if (!Re && (r = n.updateQueue, r !== null && (r = r.lastEffect, r !== null))) {
          l = r = r.next;
          do {
            var o = l, i = o.destroy;
            o = o.tag, i !== void 0 && ((o & 2) !== 0 || (o & 4) !== 0) && ui(n, t, i), l = l.next;
          } while (l !== r);
        }
        Ht(e, t, n);
        break;
      case 1:
        if (!Re && (On(n, t), r = n.stateNode, typeof r.componentWillUnmount == "function")) try {
          r.props = n.memoizedProps, r.state = n.memoizedState, r.componentWillUnmount();
        } catch (u) {
          fe(n, t, u);
        }
        Ht(e, t, n);
        break;
      case 21:
        Ht(e, t, n);
        break;
      case 22:
        n.mode & 1 ? (Re = (r = Re) || n.memoizedState !== null, Ht(e, t, n), Re = r) : Ht(e, t, n);
        break;
      default:
        Ht(e, t, n);
    }
  }
  function sa(e) {
    var t = e.updateQueue;
    if (t !== null) {
      e.updateQueue = null;
      var n = e.stateNode;
      n === null && (n = e.stateNode = new Sf()), t.forEach(function(r) {
        var l = Tf.bind(null, e, r);
        n.has(r) || (n.add(r), r.then(l, l));
      });
    }
  }
  function st(e, t) {
    var n = t.deletions;
    if (n !== null) for (var r = 0; r < n.length; r++) {
      var l = n[r];
      try {
        var o = e, i = t, u = i;
        e: for (; u !== null; ) {
          switch (u.tag) {
            case 5:
              xe = u.stateNode, ut = !1;
              break e;
            case 3:
              xe = u.stateNode.containerInfo, ut = !0;
              break e;
            case 4:
              xe = u.stateNode.containerInfo, ut = !0;
              break e;
          }
          u = u.return;
        }
        if (xe === null) throw Error(m(160));
        ua(o, i, l), xe = null, ut = !1;
        var s = l.alternate;
        s !== null && (s.return = null), l.return = null;
      } catch (p) {
        fe(l, t, p);
      }
    }
    if (t.subtreeFlags & 12854) for (t = t.child; t !== null; ) aa(t, e), t = t.sibling;
  }
  function aa(e, t) {
    var n = e.alternate, r = e.flags;
    switch (e.tag) {
      case 0:
      case 11:
      case 14:
      case 15:
        if (st(t, e), gt(e), r & 4) {
          try {
            gr(3, e, e.return), vl(3, e);
          } catch (M) {
            fe(e, e.return, M);
          }
          try {
            gr(5, e, e.return);
          } catch (M) {
            fe(e, e.return, M);
          }
        }
        break;
      case 1:
        st(t, e), gt(e), r & 512 && n !== null && On(n, n.return);
        break;
      case 5:
        if (st(t, e), gt(e), r & 512 && n !== null && On(n, n.return), e.flags & 32) {
          var l = e.stateNode;
          try {
            Fn(l, "");
          } catch (M) {
            fe(e, e.return, M);
          }
        }
        if (r & 4 && (l = e.stateNode, l != null)) {
          var o = e.memoizedProps, i = n !== null ? n.memoizedProps : o, u = e.type, s = e.updateQueue;
          if (e.updateQueue = null, s !== null) try {
            u === "input" && o.type === "radio" && o.name != null && Ai(l, o), Vl(u, i);
            var p = Vl(u, o);
            for (i = 0; i < s.length; i += 2) {
              var w = s[i], S = s[i + 1];
              w === "style" ? Qi(l, S) : w === "dangerouslySetInnerHTML" ? Wi(l, S) : w === "children" ? Fn(l, S) : et(l, w, S, p);
            }
            switch (u) {
              case "input":
                Dl(l, o);
                break;
              case "textarea":
                Vi(l, o);
                break;
              case "select":
                var v = l._wrapperState.wasMultiple;
                l._wrapperState.wasMultiple = !!o.multiple;
                var x = o.value;
                x != null ? dn(l, !!o.multiple, x, !1) : v !== !!o.multiple && (o.defaultValue != null ? dn(
                  l,
                  !!o.multiple,
                  o.defaultValue,
                  !0
                ) : dn(l, !!o.multiple, o.multiple ? [] : "", !1));
            }
            l[ir] = o;
          } catch (M) {
            fe(e, e.return, M);
          }
        }
        break;
      case 6:
        if (st(t, e), gt(e), r & 4) {
          if (e.stateNode === null) throw Error(m(162));
          l = e.stateNode, o = e.memoizedProps;
          try {
            l.nodeValue = o;
          } catch (M) {
            fe(e, e.return, M);
          }
        }
        break;
      case 3:
        if (st(t, e), gt(e), r & 4 && n !== null && n.memoizedState.isDehydrated) try {
          Xn(t.containerInfo);
        } catch (M) {
          fe(e, e.return, M);
        }
        break;
      case 4:
        st(t, e), gt(e);
        break;
      case 13:
        st(t, e), gt(e), l = e.child, l.flags & 8192 && (o = l.memoizedState !== null, l.stateNode.isHidden = o, !o || l.alternate !== null && l.alternate.memoizedState !== null || (pi = pe())), r & 4 && sa(e);
        break;
      case 22:
        if (w = n !== null && n.memoizedState !== null, e.mode & 1 ? (Re = (p = Re) || w, st(t, e), Re = p) : st(t, e), gt(e), r & 8192) {
          if (p = e.memoizedState !== null, (e.stateNode.isHidden = p) && !w && (e.mode & 1) !== 0) for (_ = e, w = e.child; w !== null; ) {
            for (S = _ = w; _ !== null; ) {
              switch (v = _, x = v.child, v.tag) {
                case 0:
                case 11:
                case 14:
                case 15:
                  gr(4, v, v.return);
                  break;
                case 1:
                  On(v, v.return);
                  var P = v.stateNode;
                  if (typeof P.componentWillUnmount == "function") {
                    r = v, n = v.return;
                    try {
                      t = r, P.props = t.memoizedProps, P.state = t.memoizedState, P.componentWillUnmount();
                    } catch (M) {
                      fe(r, n, M);
                    }
                  }
                  break;
                case 5:
                  On(v, v.return);
                  break;
                case 22:
                  if (v.memoizedState !== null) {
                    da(S);
                    continue;
                  }
              }
              x !== null ? (x.return = v, _ = x) : da(S);
            }
            w = w.sibling;
          }
          e: for (w = null, S = e; ; ) {
            if (S.tag === 5) {
              if (w === null) {
                w = S;
                try {
                  l = S.stateNode, p ? (o = l.style, typeof o.setProperty == "function" ? o.setProperty("display", "none", "important") : o.display = "none") : (u = S.stateNode, s = S.memoizedProps.style, i = s != null && s.hasOwnProperty("display") ? s.display : null, u.style.display = $i("display", i));
                } catch (M) {
                  fe(e, e.return, M);
                }
              }
            } else if (S.tag === 6) {
              if (w === null) try {
                S.stateNode.nodeValue = p ? "" : S.memoizedProps;
              } catch (M) {
                fe(e, e.return, M);
              }
            } else if ((S.tag !== 22 && S.tag !== 23 || S.memoizedState === null || S === e) && S.child !== null) {
              S.child.return = S, S = S.child;
              continue;
            }
            if (S === e) break e;
            for (; S.sibling === null; ) {
              if (S.return === null || S.return === e) break e;
              w === S && (w = null), S = S.return;
            }
            w === S && (w = null), S.sibling.return = S.return, S = S.sibling;
          }
        }
        break;
      case 19:
        st(t, e), gt(e), r & 4 && sa(e);
        break;
      case 21:
        break;
      default:
        st(
          t,
          e
        ), gt(e);
    }
  }
  function gt(e) {
    var t = e.flags;
    if (t & 2) {
      try {
        e: {
          for (var n = e.return; n !== null; ) {
            if (oa(n)) {
              var r = n;
              break e;
            }
            n = n.return;
          }
          throw Error(m(160));
        }
        switch (r.tag) {
          case 5:
            var l = r.stateNode;
            r.flags & 32 && (Fn(l, ""), r.flags &= -33);
            var o = ia(e);
            ci(e, o, l);
            break;
          case 3:
          case 4:
            var i = r.stateNode.containerInfo, u = ia(e);
            ai(e, u, i);
            break;
          default:
            throw Error(m(161));
        }
      } catch (s) {
        fe(e, e.return, s);
      }
      e.flags &= -3;
    }
    t & 4096 && (e.flags &= -4097);
  }
  function Ef(e, t, n) {
    _ = e, ca(e);
  }
  function ca(e, t, n) {
    for (var r = (e.mode & 1) !== 0; _ !== null; ) {
      var l = _, o = l.child;
      if (l.tag === 22 && r) {
        var i = l.memoizedState !== null || hl;
        if (!i) {
          var u = l.alternate, s = u !== null && u.memoizedState !== null || Re;
          u = hl;
          var p = Re;
          if (hl = i, (Re = s) && !p) for (_ = l; _ !== null; ) i = _, s = i.child, i.tag === 22 && i.memoizedState !== null ? pa(l) : s !== null ? (s.return = i, _ = s) : pa(l);
          for (; o !== null; ) _ = o, ca(o), o = o.sibling;
          _ = l, hl = u, Re = p;
        }
        fa(e);
      } else (l.subtreeFlags & 8772) !== 0 && o !== null ? (o.return = l, _ = o) : fa(e);
    }
  }
  function fa(e) {
    for (; _ !== null; ) {
      var t = _;
      if ((t.flags & 8772) !== 0) {
        var n = t.alternate;
        try {
          if ((t.flags & 8772) !== 0) switch (t.tag) {
            case 0:
            case 11:
            case 15:
              Re || vl(5, t);
              break;
            case 1:
              var r = t.stateNode;
              if (t.flags & 4 && !Re) if (n === null) r.componentDidMount();
              else {
                var l = t.elementType === t.type ? n.memoizedProps : it(t.type, n.memoizedProps);
                r.componentDidUpdate(l, n.memoizedState, r.__reactInternalSnapshotBeforeUpdate);
              }
              var o = t.updateQueue;
              o !== null && ds(t, o, r);
              break;
            case 3:
              var i = t.updateQueue;
              if (i !== null) {
                if (n = null, t.child !== null) switch (t.child.tag) {
                  case 5:
                    n = t.child.stateNode;
                    break;
                  case 1:
                    n = t.child.stateNode;
                }
                ds(t, i, n);
              }
              break;
            case 5:
              var u = t.stateNode;
              if (n === null && t.flags & 4) {
                n = u;
                var s = t.memoizedProps;
                switch (t.type) {
                  case "button":
                  case "input":
                  case "select":
                  case "textarea":
                    s.autoFocus && n.focus();
                    break;
                  case "img":
                    s.src && (n.src = s.src);
                }
              }
              break;
            case 6:
              break;
            case 4:
              break;
            case 12:
              break;
            case 13:
              if (t.memoizedState === null) {
                var p = t.alternate;
                if (p !== null) {
                  var w = p.memoizedState;
                  if (w !== null) {
                    var S = w.dehydrated;
                    S !== null && Xn(S);
                  }
                }
              }
              break;
            case 19:
            case 17:
            case 21:
            case 22:
            case 23:
            case 25:
              break;
            default:
              throw Error(m(163));
          }
          Re || t.flags & 512 && si(t);
        } catch (v) {
          fe(t, t.return, v);
        }
      }
      if (t === e) {
        _ = null;
        break;
      }
      if (n = t.sibling, n !== null) {
        n.return = t.return, _ = n;
        break;
      }
      _ = t.return;
    }
  }
  function da(e) {
    for (; _ !== null; ) {
      var t = _;
      if (t === e) {
        _ = null;
        break;
      }
      var n = t.sibling;
      if (n !== null) {
        n.return = t.return, _ = n;
        break;
      }
      _ = t.return;
    }
  }
  function pa(e) {
    for (; _ !== null; ) {
      var t = _;
      try {
        switch (t.tag) {
          case 0:
          case 11:
          case 15:
            var n = t.return;
            try {
              vl(4, t);
            } catch (s) {
              fe(t, n, s);
            }
            break;
          case 1:
            var r = t.stateNode;
            if (typeof r.componentDidMount == "function") {
              var l = t.return;
              try {
                r.componentDidMount();
              } catch (s) {
                fe(t, l, s);
              }
            }
            var o = t.return;
            try {
              si(t);
            } catch (s) {
              fe(t, o, s);
            }
            break;
          case 5:
            var i = t.return;
            try {
              si(t);
            } catch (s) {
              fe(t, i, s);
            }
        }
      } catch (s) {
        fe(t, t.return, s);
      }
      if (t === e) {
        _ = null;
        break;
      }
      var u = t.sibling;
      if (u !== null) {
        u.return = t.return, _ = u;
        break;
      }
      _ = t.return;
    }
  }
  var xf = Math.ceil, gl = _e.ReactCurrentDispatcher, fi = _e.ReactCurrentOwner, Je = _e.ReactCurrentBatchConfig, H = 0, Se = null, ve = null, Ce = 0, Ke = 0, jn = At(0), ye = 0, yr = null, ln = 0, yl = 0, di = 0, wr = null, Fe = null, pi = 0, Dn = 1 / 0, Mt = null, wl = !1, mi = null, Wt = null, Sl = !1, $t = null, kl = 0, Sr = 0, hi = null, El = -1, xl = 0;
  function ze() {
    return (H & 6) !== 0 ? pe() : El !== -1 ? El : El = pe();
  }
  function Qt(e) {
    return (e.mode & 1) === 0 ? 1 : (H & 2) !== 0 && Ce !== 0 ? Ce & -Ce : of.transition !== null ? (xl === 0 && (xl = iu()), xl) : (e = Z, e !== 0 || (e = window.event, e = e === void 0 ? 16 : hu(e.type)), e);
  }
  function at(e, t, n, r) {
    if (50 < Sr) throw Sr = 0, hi = null, Error(m(185));
    $n(e, n, r), ((H & 2) === 0 || e !== Se) && (e === Se && ((H & 2) === 0 && (yl |= n), ye === 4 && Kt(e, Ce)), Ue(e, r), n === 1 && H === 0 && (t.mode & 1) === 0 && (Dn = pe() + 500, Zr && Ut()));
  }
  function Ue(e, t) {
    var n = e.callbackNode;
    oc(e, t);
    var r = zr(e, e === Se ? Ce : 0);
    if (r === 0) n !== null && ru(n), e.callbackNode = null, e.callbackPriority = 0;
    else if (t = r & -r, e.callbackPriority !== t) {
      if (n != null && ru(n), t === 1) e.tag === 0 ? lf(ha.bind(null, e)) : es(ha.bind(null, e)), ef(function() {
        (H & 6) === 0 && Ut();
      }), n = null;
      else {
        switch (uu(r)) {
          case 1:
            n = Gl;
            break;
          case 4:
            n = lu;
            break;
          case 16:
            n = Mr;
            break;
          case 536870912:
            n = ou;
            break;
          default:
            n = Mr;
        }
        n = xa(n, ma.bind(null, e));
      }
      e.callbackPriority = t, e.callbackNode = n;
    }
  }
  function ma(e, t) {
    if (El = -1, xl = 0, (H & 6) !== 0) throw Error(m(327));
    var n = e.callbackNode;
    if (In() && e.callbackNode !== n) return null;
    var r = zr(e, e === Se ? Ce : 0);
    if (r === 0) return null;
    if ((r & 30) !== 0 || (r & e.expiredLanes) !== 0 || t) t = Cl(e, r);
    else {
      t = r;
      var l = H;
      H |= 2;
      var o = ga();
      (Se !== e || Ce !== t) && (Mt = null, Dn = pe() + 500, un(e, t));
      do
        try {
          Nf();
          break;
        } catch (u) {
          va(e, u);
        }
      while (!0);
      Oo(), gl.current = o, H = l, ve !== null ? t = 0 : (Se = null, Ce = 0, t = ye);
    }
    if (t !== 0) {
      if (t === 2 && (l = Yl(e), l !== 0 && (r = l, t = vi(e, l))), t === 1) throw n = yr, un(e, 0), Kt(e, r), Ue(e, pe()), n;
      if (t === 6) Kt(e, r);
      else {
        if (l = e.current.alternate, (r & 30) === 0 && !Cf(l) && (t = Cl(e, r), t === 2 && (o = Yl(e), o !== 0 && (r = o, t = vi(e, o))), t === 1)) throw n = yr, un(e, 0), Kt(e, r), Ue(e, pe()), n;
        switch (e.finishedWork = l, e.finishedLanes = r, t) {
          case 0:
          case 1:
            throw Error(m(345));
          case 2:
            sn(e, Fe, Mt);
            break;
          case 3:
            if (Kt(e, r), (r & 130023424) === r && (t = pi + 500 - pe(), 10 < t)) {
              if (zr(e, 0) !== 0) break;
              if (l = e.suspendedLanes, (l & r) !== r) {
                ze(), e.pingedLanes |= e.suspendedLanes & l;
                break;
              }
              e.timeoutHandle = Eo(sn.bind(null, e, Fe, Mt), t);
              break;
            }
            sn(e, Fe, Mt);
            break;
          case 4:
            if (Kt(e, r), (r & 4194240) === r) break;
            for (t = e.eventTimes, l = -1; 0 < r; ) {
              var i = 31 - rt(r);
              o = 1 << i, i = t[i], i > l && (l = i), r &= ~o;
            }
            if (r = l, r = pe() - r, r = (120 > r ? 120 : 480 > r ? 480 : 1080 > r ? 1080 : 1920 > r ? 1920 : 3e3 > r ? 3e3 : 4320 > r ? 4320 : 1960 * xf(r / 1960)) - r, 10 < r) {
              e.timeoutHandle = Eo(sn.bind(null, e, Fe, Mt), r);
              break;
            }
            sn(e, Fe, Mt);
            break;
          case 5:
            sn(e, Fe, Mt);
            break;
          default:
            throw Error(m(329));
        }
      }
    }
    return Ue(e, pe()), e.callbackNode === n ? ma.bind(null, e) : null;
  }
  function vi(e, t) {
    var n = wr;
    return e.current.memoizedState.isDehydrated && (un(e, t).flags |= 256), e = Cl(e, t), e !== 2 && (t = Fe, Fe = n, t !== null && gi(t)), e;
  }
  function gi(e) {
    Fe === null ? Fe = e : Fe.push.apply(Fe, e);
  }
  function Cf(e) {
    for (var t = e; ; ) {
      if (t.flags & 16384) {
        var n = t.updateQueue;
        if (n !== null && (n = n.stores, n !== null)) for (var r = 0; r < n.length; r++) {
          var l = n[r], o = l.getSnapshot;
          l = l.value;
          try {
            if (!lt(o(), l)) return !1;
          } catch {
            return !1;
          }
        }
      }
      if (n = t.child, t.subtreeFlags & 16384 && n !== null) n.return = t, t = n;
      else {
        if (t === e) break;
        for (; t.sibling === null; ) {
          if (t.return === null || t.return === e) return !0;
          t = t.return;
        }
        t.sibling.return = t.return, t = t.sibling;
      }
    }
    return !0;
  }
  function Kt(e, t) {
    for (t &= ~di, t &= ~yl, e.suspendedLanes |= t, e.pingedLanes &= ~t, e = e.expirationTimes; 0 < t; ) {
      var n = 31 - rt(t), r = 1 << n;
      e[n] = -1, t &= ~r;
    }
  }
  function ha(e) {
    if ((H & 6) !== 0) throw Error(m(327));
    In();
    var t = zr(e, 0);
    if ((t & 1) === 0) return Ue(e, pe()), null;
    var n = Cl(e, t);
    if (e.tag !== 0 && n === 2) {
      var r = Yl(e);
      r !== 0 && (t = r, n = vi(e, r));
    }
    if (n === 1) throw n = yr, un(e, 0), Kt(e, t), Ue(e, pe()), n;
    if (n === 6) throw Error(m(345));
    return e.finishedWork = e.current.alternate, e.finishedLanes = t, sn(e, Fe, Mt), Ue(e, pe()), null;
  }
  function yi(e, t) {
    var n = H;
    H |= 1;
    try {
      return e(t);
    } finally {
      H = n, H === 0 && (Dn = pe() + 500, Zr && Ut());
    }
  }
  function on(e) {
    $t !== null && $t.tag === 0 && (H & 6) === 0 && In();
    var t = H;
    H |= 1;
    var n = Je.transition, r = Z;
    try {
      if (Je.transition = null, Z = 1, e) return e();
    } finally {
      Z = r, Je.transition = n, H = t, (H & 6) === 0 && Ut();
    }
  }
  function wi() {
    Ke = jn.current, oe(jn);
  }
  function un(e, t) {
    e.finishedWork = null, e.finishedLanes = 0;
    var n = e.timeoutHandle;
    if (n !== -1 && (e.timeoutHandle = -1, bc(n)), ve !== null) for (n = ve.return; n !== null; ) {
      var r = n;
      switch (Mo(r), r.tag) {
        case 1:
          r = r.type.childContextTypes, r != null && Xr();
          break;
        case 3:
          Ln(), oe(De), oe(Ne), Bo();
          break;
        case 5:
          Uo(r);
          break;
        case 4:
          Ln();
          break;
        case 13:
          oe(se);
          break;
        case 19:
          oe(se);
          break;
        case 10:
          jo(r.type._context);
          break;
        case 22:
        case 23:
          wi();
      }
      n = n.return;
    }
    if (Se = e, ve = e = Gt(e.current, null), Ce = Ke = t, ye = 0, yr = null, di = yl = ln = 0, Fe = wr = null, tn !== null) {
      for (t = 0; t < tn.length; t++) if (n = tn[t], r = n.interleaved, r !== null) {
        n.interleaved = null;
        var l = r.next, o = n.pending;
        if (o !== null) {
          var i = o.next;
          o.next = l, r.next = i;
        }
        n.pending = r;
      }
      tn = null;
    }
    return e;
  }
  function va(e, t) {
    do {
      var n = ve;
      try {
        if (Oo(), ul.current = fl, sl) {
          for (var r = ae.memoizedState; r !== null; ) {
            var l = r.queue;
            l !== null && (l.pending = null), r = r.next;
          }
          sl = !1;
        }
        if (rn = 0, we = ge = ae = null, dr = !1, pr = 0, fi.current = null, n === null || n.return === null) {
          ye = 1, yr = t, ve = null;
          break;
        }
        e: {
          var o = e, i = n.return, u = n, s = t;
          if (t = Ce, u.flags |= 32768, s !== null && typeof s == "object" && typeof s.then == "function") {
            var p = s, w = u, S = w.tag;
            if ((w.mode & 1) === 0 && (S === 0 || S === 11 || S === 15)) {
              var v = w.alternate;
              v ? (w.updateQueue = v.updateQueue, w.memoizedState = v.memoizedState, w.lanes = v.lanes) : (w.updateQueue = null, w.memoizedState = null);
            }
            var x = Bs(i);
            if (x !== null) {
              x.flags &= -257, Hs(x, i, u, o, t), x.mode & 1 && Vs(o, p, t), t = x, s = p;
              var P = t.updateQueue;
              if (P === null) {
                var M = /* @__PURE__ */ new Set();
                M.add(s), t.updateQueue = M;
              } else P.add(s);
              break e;
            } else {
              if ((t & 1) === 0) {
                Vs(o, p, t), Si();
                break e;
              }
              s = Error(m(426));
            }
          } else if (ue && u.mode & 1) {
            var me = Bs(i);
            if (me !== null) {
              (me.flags & 65536) === 0 && (me.flags |= 256), Hs(me, i, u, o, t), Lo(zn(s, u));
              break e;
            }
          }
          o = s = zn(s, u), ye !== 4 && (ye = 2), wr === null ? wr = [o] : wr.push(o), o = i;
          do {
            switch (o.tag) {
              case 3:
                o.flags |= 65536, t &= -t, o.lanes |= t;
                var f = Fs(o, s, t);
                fs(o, f);
                break e;
              case 1:
                u = s;
                var a = o.type, d = o.stateNode;
                if ((o.flags & 128) === 0 && (typeof a.getDerivedStateFromError == "function" || d !== null && typeof d.componentDidCatch == "function" && (Wt === null || !Wt.has(d)))) {
                  o.flags |= 65536, t &= -t, o.lanes |= t;
                  var k = Us(o, u, t);
                  fs(o, k);
                  break e;
                }
            }
            o = o.return;
          } while (o !== null);
        }
        wa(n);
      } catch (R) {
        t = R, ve === n && n !== null && (ve = n = n.return);
        continue;
      }
      break;
    } while (!0);
  }
  function ga() {
    var e = gl.current;
    return gl.current = fl, e === null ? fl : e;
  }
  function Si() {
    (ye === 0 || ye === 3 || ye === 2) && (ye = 4), Se === null || (ln & 268435455) === 0 && (yl & 268435455) === 0 || Kt(Se, Ce);
  }
  function Cl(e, t) {
    var n = H;
    H |= 2;
    var r = ga();
    (Se !== e || Ce !== t) && (Mt = null, un(e, t));
    do
      try {
        _f();
        break;
      } catch (l) {
        va(e, l);
      }
    while (!0);
    if (Oo(), H = n, gl.current = r, ve !== null) throw Error(m(261));
    return Se = null, Ce = 0, ye;
  }
  function _f() {
    for (; ve !== null; ) ya(ve);
  }
  function Nf() {
    for (; ve !== null && !qa(); ) ya(ve);
  }
  function ya(e) {
    var t = Ea(e.alternate, e, Ke);
    e.memoizedProps = e.pendingProps, t === null ? wa(e) : ve = t, fi.current = null;
  }
  function wa(e) {
    var t = e;
    do {
      var n = t.alternate;
      if (e = t.return, (t.flags & 32768) === 0) {
        if (n = yf(n, t, Ke), n !== null) {
          ve = n;
          return;
        }
      } else {
        if (n = wf(n, t), n !== null) {
          n.flags &= 32767, ve = n;
          return;
        }
        if (e !== null) e.flags |= 32768, e.subtreeFlags = 0, e.deletions = null;
        else {
          ye = 6, ve = null;
          return;
        }
      }
      if (t = t.sibling, t !== null) {
        ve = t;
        return;
      }
      ve = t = e;
    } while (t !== null);
    ye === 0 && (ye = 5);
  }
  function sn(e, t, n) {
    var r = Z, l = Je.transition;
    try {
      Je.transition = null, Z = 1, Pf(e, t, n, r);
    } finally {
      Je.transition = l, Z = r;
    }
    return null;
  }
  function Pf(e, t, n, r) {
    do
      In();
    while ($t !== null);
    if ((H & 6) !== 0) throw Error(m(327));
    n = e.finishedWork;
    var l = e.finishedLanes;
    if (n === null) return null;
    if (e.finishedWork = null, e.finishedLanes = 0, n === e.current) throw Error(m(177));
    e.callbackNode = null, e.callbackPriority = 0;
    var o = n.lanes | n.childLanes;
    if (ic(e, o), e === Se && (ve = Se = null, Ce = 0), (n.subtreeFlags & 2064) === 0 && (n.flags & 2064) === 0 || Sl || (Sl = !0, xa(Mr, function() {
      return In(), null;
    })), o = (n.flags & 15990) !== 0, (n.subtreeFlags & 15990) !== 0 || o) {
      o = Je.transition, Je.transition = null;
      var i = Z;
      Z = 1;
      var u = H;
      H |= 4, fi.current = null, kf(e, n), aa(n, e), Kc(So), Dr = !!wo, So = wo = null, e.current = n, Ef(n), Za(), H = u, Z = i, Je.transition = o;
    } else e.current = n;
    if (Sl && (Sl = !1, $t = e, kl = l), o = e.pendingLanes, o === 0 && (Wt = null), ec(n.stateNode), Ue(e, pe()), t !== null) for (r = e.onRecoverableError, n = 0; n < t.length; n++) l = t[n], r(l.value, { componentStack: l.stack, digest: l.digest });
    if (wl) throw wl = !1, e = mi, mi = null, e;
    return (kl & 1) !== 0 && e.tag !== 0 && In(), o = e.pendingLanes, (o & 1) !== 0 ? e === hi ? Sr++ : (Sr = 0, hi = e) : Sr = 0, Ut(), null;
  }
  function In() {
    if ($t !== null) {
      var e = uu(kl), t = Je.transition, n = Z;
      try {
        if (Je.transition = null, Z = 16 > e ? 16 : e, $t === null) var r = !1;
        else {
          if (e = $t, $t = null, kl = 0, (H & 6) !== 0) throw Error(m(331));
          var l = H;
          for (H |= 4, _ = e.current; _ !== null; ) {
            var o = _, i = o.child;
            if ((_.flags & 16) !== 0) {
              var u = o.deletions;
              if (u !== null) {
                for (var s = 0; s < u.length; s++) {
                  var p = u[s];
                  for (_ = p; _ !== null; ) {
                    var w = _;
                    switch (w.tag) {
                      case 0:
                      case 11:
                      case 15:
                        gr(8, w, o);
                    }
                    var S = w.child;
                    if (S !== null) S.return = w, _ = S;
                    else for (; _ !== null; ) {
                      w = _;
                      var v = w.sibling, x = w.return;
                      if (la(w), w === p) {
                        _ = null;
                        break;
                      }
                      if (v !== null) {
                        v.return = x, _ = v;
                        break;
                      }
                      _ = x;
                    }
                  }
                }
                var P = o.alternate;
                if (P !== null) {
                  var M = P.child;
                  if (M !== null) {
                    P.child = null;
                    do {
                      var me = M.sibling;
                      M.sibling = null, M = me;
                    } while (M !== null);
                  }
                }
                _ = o;
              }
            }
            if ((o.subtreeFlags & 2064) !== 0 && i !== null) i.return = o, _ = i;
            else e: for (; _ !== null; ) {
              if (o = _, (o.flags & 2048) !== 0) switch (o.tag) {
                case 0:
                case 11:
                case 15:
                  gr(9, o, o.return);
              }
              var f = o.sibling;
              if (f !== null) {
                f.return = o.return, _ = f;
                break e;
              }
              _ = o.return;
            }
          }
          var a = e.current;
          for (_ = a; _ !== null; ) {
            i = _;
            var d = i.child;
            if ((i.subtreeFlags & 2064) !== 0 && d !== null) d.return = i, _ = d;
            else e: for (i = a; _ !== null; ) {
              if (u = _, (u.flags & 2048) !== 0) try {
                switch (u.tag) {
                  case 0:
                  case 11:
                  case 15:
                    vl(9, u);
                }
              } catch (R) {
                fe(u, u.return, R);
              }
              if (u === i) {
                _ = null;
                break e;
              }
              var k = u.sibling;
              if (k !== null) {
                k.return = u.return, _ = k;
                break e;
              }
              _ = u.return;
            }
          }
          if (H = l, Ut(), pt && typeof pt.onPostCommitFiberRoot == "function") try {
            pt.onPostCommitFiberRoot(Rr, e);
          } catch {
          }
          r = !0;
        }
        return r;
      } finally {
        Z = n, Je.transition = t;
      }
    }
    return !1;
  }
  function Sa(e, t, n) {
    t = zn(n, t), t = Fs(e, t, 1), e = Bt(e, t, 1), t = ze(), e !== null && ($n(e, 1, t), Ue(e, t));
  }
  function fe(e, t, n) {
    if (e.tag === 3) Sa(e, e, n);
    else for (; t !== null; ) {
      if (t.tag === 3) {
        Sa(t, e, n);
        break;
      } else if (t.tag === 1) {
        var r = t.stateNode;
        if (typeof t.type.getDerivedStateFromError == "function" || typeof r.componentDidCatch == "function" && (Wt === null || !Wt.has(r))) {
          e = zn(n, e), e = Us(t, e, 1), t = Bt(t, e, 1), e = ze(), t !== null && ($n(t, 1, e), Ue(t, e));
          break;
        }
      }
      t = t.return;
    }
  }
  function Mf(e, t, n) {
    var r = e.pingCache;
    r !== null && r.delete(t), t = ze(), e.pingedLanes |= e.suspendedLanes & n, Se === e && (Ce & n) === n && (ye === 4 || ye === 3 && (Ce & 130023424) === Ce && 500 > pe() - pi ? un(e, 0) : di |= n), Ue(e, t);
  }
  function ka(e, t) {
    t === 0 && ((e.mode & 1) === 0 ? t = 1 : (t = Lr, Lr <<= 1, (Lr & 130023424) === 0 && (Lr = 4194304)));
    var n = ze();
    e = _t(e, t), e !== null && ($n(e, t, n), Ue(e, n));
  }
  function Rf(e) {
    var t = e.memoizedState, n = 0;
    t !== null && (n = t.retryLane), ka(e, n);
  }
  function Tf(e, t) {
    var n = 0;
    switch (e.tag) {
      case 13:
        var r = e.stateNode, l = e.memoizedState;
        l !== null && (n = l.retryLane);
        break;
      case 19:
        r = e.stateNode;
        break;
      default:
        throw Error(m(314));
    }
    r !== null && r.delete(t), ka(e, n);
  }
  var Ea;
  Ea = function(e, t, n) {
    if (e !== null) if (e.memoizedProps !== t.pendingProps || De.current) Ae = !0;
    else {
      if ((e.lanes & n) === 0 && (t.flags & 128) === 0) return Ae = !1, gf(e, t, n);
      Ae = (e.flags & 131072) !== 0;
    }
    else Ae = !1, ue && (t.flags & 1048576) !== 0 && ts(t, br, t.index);
    switch (t.lanes = 0, t.tag) {
      case 2:
        var r = t.type;
        ml(e, t), e = t.pendingProps;
        var l = Cn(t, Ne.current);
        Tn(t, n), l = $o(null, t, r, e, l, n);
        var o = Qo();
        return t.flags |= 1, typeof l == "object" && l !== null && typeof l.render == "function" && l.$$typeof === void 0 ? (t.tag = 1, t.memoizedState = null, t.updateQueue = null, Ie(r) ? (o = !0, qr(t)) : o = !1, t.memoizedState = l.state !== null && l.state !== void 0 ? l.state : null, Ao(t), l.updater = dl, t.stateNode = l, l._reactInternals = t, Zo(t, r, e, n), t = ti(null, t, r, !0, o, n)) : (t.tag = 0, ue && o && Po(t), Le(null, t, l, n), t = t.child), t;
      case 16:
        r = t.elementType;
        e: {
          switch (ml(e, t), e = t.pendingProps, l = r._init, r = l(r._payload), t.type = r, l = t.tag = zf(r), e = it(r, e), l) {
            case 0:
              t = ei(null, t, r, e, n);
              break e;
            case 1:
              t = Ys(null, t, r, e, n);
              break e;
            case 11:
              t = Ws(null, t, r, e, n);
              break e;
            case 14:
              t = $s(null, t, r, it(r.type, e), n);
              break e;
          }
          throw Error(m(
            306,
            r,
            ""
          ));
        }
        return t;
      case 0:
        return r = t.type, l = t.pendingProps, l = t.elementType === r ? l : it(r, l), ei(e, t, r, l, n);
      case 1:
        return r = t.type, l = t.pendingProps, l = t.elementType === r ? l : it(r, l), Ys(e, t, r, l, n);
      case 3:
        e: {
          if (Xs(t), e === null) throw Error(m(387));
          r = t.pendingProps, o = t.memoizedState, l = o.element, cs(e, t), ol(t, r, null, n);
          var i = t.memoizedState;
          if (r = i.element, o.isDehydrated) if (o = { element: r, isDehydrated: !1, cache: i.cache, pendingSuspenseBoundaries: i.pendingSuspenseBoundaries, transitions: i.transitions }, t.updateQueue.baseState = o, t.memoizedState = o, t.flags & 256) {
            l = zn(Error(m(423)), t), t = qs(e, t, r, n, l);
            break e;
          } else if (r !== l) {
            l = zn(Error(m(424)), t), t = qs(e, t, r, n, l);
            break e;
          } else for (Qe = It(t.stateNode.containerInfo.firstChild), $e = t, ue = !0, ot = null, n = ss(t, null, r, n), t.child = n; n; ) n.flags = n.flags & -3 | 4096, n = n.sibling;
          else {
            if (Pn(), r === l) {
              t = Pt(e, t, n);
              break e;
            }
            Le(e, t, r, n);
          }
          t = t.child;
        }
        return t;
      case 5:
        return ps(t), e === null && To(t), r = t.type, l = t.pendingProps, o = e !== null ? e.memoizedProps : null, i = l.children, ko(r, l) ? i = null : o !== null && ko(r, o) && (t.flags |= 32), Gs(e, t), Le(e, t, i, n), t.child;
      case 6:
        return e === null && To(t), null;
      case 13:
        return Zs(e, t, n);
      case 4:
        return Fo(t, t.stateNode.containerInfo), r = t.pendingProps, e === null ? t.child = Mn(t, null, r, n) : Le(e, t, r, n), t.child;
      case 11:
        return r = t.type, l = t.pendingProps, l = t.elementType === r ? l : it(r, l), Ws(e, t, r, l, n);
      case 7:
        return Le(e, t, t.pendingProps, n), t.child;
      case 8:
        return Le(e, t, t.pendingProps.children, n), t.child;
      case 12:
        return Le(e, t, t.pendingProps.children, n), t.child;
      case 10:
        e: {
          if (r = t.type._context, l = t.pendingProps, o = t.memoizedProps, i = l.value, re(nl, r._currentValue), r._currentValue = i, o !== null) if (lt(o.value, i)) {
            if (o.children === l.children && !De.current) {
              t = Pt(e, t, n);
              break e;
            }
          } else for (o = t.child, o !== null && (o.return = t); o !== null; ) {
            var u = o.dependencies;
            if (u !== null) {
              i = o.child;
              for (var s = u.firstContext; s !== null; ) {
                if (s.context === r) {
                  if (o.tag === 1) {
                    s = Nt(-1, n & -n), s.tag = 2;
                    var p = o.updateQueue;
                    if (p !== null) {
                      p = p.shared;
                      var w = p.pending;
                      w === null ? s.next = s : (s.next = w.next, w.next = s), p.pending = s;
                    }
                  }
                  o.lanes |= n, s = o.alternate, s !== null && (s.lanes |= n), Do(
                    o.return,
                    n,
                    t
                  ), u.lanes |= n;
                  break;
                }
                s = s.next;
              }
            } else if (o.tag === 10) i = o.type === t.type ? null : o.child;
            else if (o.tag === 18) {
              if (i = o.return, i === null) throw Error(m(341));
              i.lanes |= n, u = i.alternate, u !== null && (u.lanes |= n), Do(i, n, t), i = o.sibling;
            } else i = o.child;
            if (i !== null) i.return = o;
            else for (i = o; i !== null; ) {
              if (i === t) {
                i = null;
                break;
              }
              if (o = i.sibling, o !== null) {
                o.return = i.return, i = o;
                break;
              }
              i = i.return;
            }
            o = i;
          }
          Le(e, t, l.children, n), t = t.child;
        }
        return t;
      case 9:
        return l = t.type, r = t.pendingProps.children, Tn(t, n), l = qe(l), r = r(l), t.flags |= 1, Le(e, t, r, n), t.child;
      case 14:
        return r = t.type, l = it(r, t.pendingProps), l = it(r.type, l), $s(e, t, r, l, n);
      case 15:
        return Qs(e, t, t.type, t.pendingProps, n);
      case 17:
        return r = t.type, l = t.pendingProps, l = t.elementType === r ? l : it(r, l), ml(e, t), t.tag = 1, Ie(r) ? (e = !0, qr(t)) : e = !1, Tn(t, n), Is(t, r, l), Zo(t, r, l, n), ti(null, t, r, !0, e, n);
      case 19:
        return bs(e, t, n);
      case 22:
        return Ks(e, t, n);
    }
    throw Error(m(156, t.tag));
  };
  function xa(e, t) {
    return nu(e, t);
  }
  function Lf(e, t, n, r) {
    this.tag = e, this.key = n, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.ref = null, this.pendingProps = t, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = r, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null;
  }
  function be(e, t, n, r) {
    return new Lf(e, t, n, r);
  }
  function ki(e) {
    return e = e.prototype, !(!e || !e.isReactComponent);
  }
  function zf(e) {
    if (typeof e == "function") return ki(e) ? 1 : 0;
    if (e != null) {
      if (e = e.$$typeof, e === ft) return 11;
      if (e === dt) return 14;
    }
    return 2;
  }
  function Gt(e, t) {
    var n = e.alternate;
    return n === null ? (n = be(e.tag, t, e.key, e.mode), n.elementType = e.elementType, n.type = e.type, n.stateNode = e.stateNode, n.alternate = e, e.alternate = n) : (n.pendingProps = t, n.type = e.type, n.flags = 0, n.subtreeFlags = 0, n.deletions = null), n.flags = e.flags & 14680064, n.childLanes = e.childLanes, n.lanes = e.lanes, n.child = e.child, n.memoizedProps = e.memoizedProps, n.memoizedState = e.memoizedState, n.updateQueue = e.updateQueue, t = e.dependencies, n.dependencies = t === null ? null : { lanes: t.lanes, firstContext: t.firstContext }, n.sibling = e.sibling, n.index = e.index, n.ref = e.ref, n;
  }
  function _l(e, t, n, r, l, o) {
    var i = 2;
    if (r = e, typeof e == "function") ki(e) && (i = 1);
    else if (typeof e == "string") i = 5;
    else e: switch (e) {
      case Oe:
        return an(n.children, l, o, t);
      case Ge:
        i = 8, l |= 8;
        break;
      case Rt:
        return e = be(12, n, t, l | 2), e.elementType = Rt, e.lanes = o, e;
      case Be:
        return e = be(13, n, t, l), e.elementType = Be, e.lanes = o, e;
      case nt:
        return e = be(19, n, t, l), e.elementType = nt, e.lanes = o, e;
      case ce:
        return Nl(n, l, o, t);
      default:
        if (typeof e == "object" && e !== null) switch (e.$$typeof) {
          case St:
            i = 10;
            break e;
          case Xt:
            i = 9;
            break e;
          case ft:
            i = 11;
            break e;
          case dt:
            i = 14;
            break e;
          case je:
            i = 16, r = null;
            break e;
        }
        throw Error(m(130, e == null ? e : typeof e, ""));
    }
    return t = be(i, n, t, l), t.elementType = e, t.type = r, t.lanes = o, t;
  }
  function an(e, t, n, r) {
    return e = be(7, e, r, t), e.lanes = n, e;
  }
  function Nl(e, t, n, r) {
    return e = be(22, e, r, t), e.elementType = ce, e.lanes = n, e.stateNode = { isHidden: !1 }, e;
  }
  function Ei(e, t, n) {
    return e = be(6, e, null, t), e.lanes = n, e;
  }
  function xi(e, t, n) {
    return t = be(4, e.children !== null ? e.children : [], e.key, t), t.lanes = n, t.stateNode = { containerInfo: e.containerInfo, pendingChildren: null, implementation: e.implementation }, t;
  }
  function Of(e, t, n, r, l) {
    this.tag = t, this.containerInfo = e, this.finishedWork = this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = -1, this.callbackNode = this.pendingContext = this.context = null, this.callbackPriority = 0, this.eventTimes = Xl(0), this.expirationTimes = Xl(-1), this.entangledLanes = this.finishedLanes = this.mutableReadLanes = this.expiredLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = Xl(0), this.identifierPrefix = r, this.onRecoverableError = l, this.mutableSourceEagerHydrationData = null;
  }
  function Ci(e, t, n, r, l, o, i, u, s) {
    return e = new Of(e, t, n, u, s), t === 1 ? (t = 1, o === !0 && (t |= 8)) : t = 0, o = be(3, null, null, t), e.current = o, o.stateNode = e, o.memoizedState = { element: r, isDehydrated: n, cache: null, transitions: null, pendingSuspenseBoundaries: null }, Ao(o), e;
  }
  function jf(e, t, n) {
    var r = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
    return { $$typeof: Te, key: r == null ? null : "" + r, children: e, containerInfo: t, implementation: n };
  }
  function Ca(e) {
    if (!e) return Ft;
    e = e._reactInternals;
    e: {
      if (qt(e) !== e || e.tag !== 1) throw Error(m(170));
      var t = e;
      do {
        switch (t.tag) {
          case 3:
            t = t.stateNode.context;
            break e;
          case 1:
            if (Ie(t.type)) {
              t = t.stateNode.__reactInternalMemoizedMergedChildContext;
              break e;
            }
        }
        t = t.return;
      } while (t !== null);
      throw Error(m(171));
    }
    if (e.tag === 1) {
      var n = e.type;
      if (Ie(n)) return Ju(e, n, t);
    }
    return t;
  }
  function _a(e, t, n, r, l, o, i, u, s) {
    return e = Ci(n, r, !0, e, l, o, i, u, s), e.context = Ca(null), n = e.current, r = ze(), l = Qt(n), o = Nt(r, l), o.callback = t ?? null, Bt(n, o, l), e.current.lanes = l, $n(e, l, r), Ue(e, r), e;
  }
  function Pl(e, t, n, r) {
    var l = t.current, o = ze(), i = Qt(l);
    return n = Ca(n), t.context === null ? t.context = n : t.pendingContext = n, t = Nt(o, i), t.payload = { element: e }, r = r === void 0 ? null : r, r !== null && (t.callback = r), e = Bt(l, t, i), e !== null && (at(e, l, i, o), ll(e, l, i)), i;
  }
  function Ml(e) {
    if (e = e.current, !e.child) return null;
    switch (e.child.tag) {
      case 5:
        return e.child.stateNode;
      default:
        return e.child.stateNode;
    }
  }
  function Na(e, t) {
    if (e = e.memoizedState, e !== null && e.dehydrated !== null) {
      var n = e.retryLane;
      e.retryLane = n !== 0 && n < t ? n : t;
    }
  }
  function _i(e, t) {
    Na(e, t), (e = e.alternate) && Na(e, t);
  }
  function Df() {
    return null;
  }
  var Pa = typeof reportError == "function" ? reportError : function(e) {
    console.error(e);
  };
  function Ni(e) {
    this._internalRoot = e;
  }
  Rl.prototype.render = Ni.prototype.render = function(e) {
    var t = this._internalRoot;
    if (t === null) throw Error(m(409));
    Pl(e, t, null, null);
  }, Rl.prototype.unmount = Ni.prototype.unmount = function() {
    var e = this._internalRoot;
    if (e !== null) {
      this._internalRoot = null;
      var t = e.containerInfo;
      on(function() {
        Pl(null, e, null, null);
      }), t[kt] = null;
    }
  };
  function Rl(e) {
    this._internalRoot = e;
  }
  Rl.prototype.unstable_scheduleHydration = function(e) {
    if (e) {
      var t = cu();
      e = { blockedOn: null, target: e, priority: t };
      for (var n = 0; n < Ot.length && t !== 0 && t < Ot[n].priority; n++) ;
      Ot.splice(n, 0, e), n === 0 && pu(e);
    }
  };
  function Pi(e) {
    return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11);
  }
  function Tl(e) {
    return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11 && (e.nodeType !== 8 || e.nodeValue !== " react-mount-point-unstable "));
  }
  function Ma() {
  }
  function If(e, t, n, r, l) {
    if (l) {
      if (typeof r == "function") {
        var o = r;
        r = function() {
          var p = Ml(i);
          o.call(p);
        };
      }
      var i = _a(t, r, e, 0, null, !1, !1, "", Ma);
      return e._reactRootContainer = i, e[kt] = i.current, lr(e.nodeType === 8 ? e.parentNode : e), on(), i;
    }
    for (; l = e.lastChild; ) e.removeChild(l);
    if (typeof r == "function") {
      var u = r;
      r = function() {
        var p = Ml(s);
        u.call(p);
      };
    }
    var s = Ci(e, 0, !1, null, null, !1, !1, "", Ma);
    return e._reactRootContainer = s, e[kt] = s.current, lr(e.nodeType === 8 ? e.parentNode : e), on(function() {
      Pl(t, s, n, r);
    }), s;
  }
  function Ll(e, t, n, r, l) {
    var o = n._reactRootContainer;
    if (o) {
      var i = o;
      if (typeof l == "function") {
        var u = l;
        l = function() {
          var s = Ml(i);
          u.call(s);
        };
      }
      Pl(t, i, e, l);
    } else i = If(n, t, e, l, r);
    return Ml(i);
  }
  su = function(e) {
    switch (e.tag) {
      case 3:
        var t = e.stateNode;
        if (t.current.memoizedState.isDehydrated) {
          var n = Wn(t.pendingLanes);
          n !== 0 && (ql(t, n | 1), Ue(t, pe()), (H & 6) === 0 && (Dn = pe() + 500, Ut()));
        }
        break;
      case 13:
        on(function() {
          var r = _t(e, 1);
          if (r !== null) {
            var l = ze();
            at(r, e, 1, l);
          }
        }), _i(e, 1);
    }
  }, Zl = function(e) {
    if (e.tag === 13) {
      var t = _t(e, 134217728);
      if (t !== null) {
        var n = ze();
        at(t, e, 134217728, n);
      }
      _i(e, 134217728);
    }
  }, au = function(e) {
    if (e.tag === 13) {
      var t = Qt(e), n = _t(e, t);
      if (n !== null) {
        var r = ze();
        at(n, e, t, r);
      }
      _i(e, t);
    }
  }, cu = function() {
    return Z;
  }, fu = function(e, t) {
    var n = Z;
    try {
      return Z = e, t();
    } finally {
      Z = n;
    }
  }, Wl = function(e, t, n) {
    switch (t) {
      case "input":
        if (Dl(e, n), t = n.name, n.type === "radio" && t != null) {
          for (n = e; n.parentNode; ) n = n.parentNode;
          for (n = n.querySelectorAll("input[name=" + JSON.stringify("" + t) + '][type="radio"]'), t = 0; t < n.length; t++) {
            var r = n[t];
            if (r !== e && r.form === e.form) {
              var l = Yr(r);
              if (!l) throw Error(m(90));
              Di(r), Dl(r, l);
            }
          }
        }
        break;
      case "textarea":
        Vi(e, n);
        break;
      case "select":
        t = n.value, t != null && dn(e, !!n.multiple, t, !1);
    }
  }, Xi = yi, qi = on;
  var Af = { usingClientEntryPoint: !1, Events: [ur, En, Yr, Gi, Yi, yi] }, kr = { findFiberByHostInstance: Zt, bundleType: 0, version: "18.3.1", rendererPackageName: "react-dom" }, Ff = { bundleType: kr.bundleType, version: kr.version, rendererPackageName: kr.rendererPackageName, rendererConfig: kr.rendererConfig, overrideHookState: null, overrideHookStateDeletePath: null, overrideHookStateRenamePath: null, overrideProps: null, overridePropsDeletePath: null, overridePropsRenamePath: null, setErrorHandler: null, setSuspenseHandler: null, scheduleUpdate: null, currentDispatcherRef: _e.ReactCurrentDispatcher, findHostInstanceByFiber: function(e) {
    return e = eu(e), e === null ? null : e.stateNode;
  }, findFiberByHostInstance: kr.findFiberByHostInstance || Df, findHostInstancesForRefresh: null, scheduleRefresh: null, scheduleRoot: null, setRefreshHandler: null, getCurrentFiber: null, reconcilerVersion: "18.3.1-next-f1338f8080-20240426" };
  if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u") {
    var zl = __REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!zl.isDisabled && zl.supportsFiber) try {
      Rr = zl.inject(Ff), pt = zl;
    } catch {
    }
  }
  return Ve.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = Af, Ve.createPortal = function(e, t) {
    var n = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
    if (!Pi(t)) throw Error(m(200));
    return jf(e, t, null, n);
  }, Ve.createRoot = function(e, t) {
    if (!Pi(e)) throw Error(m(299));
    var n = !1, r = "", l = Pa;
    return t != null && (t.unstable_strictMode === !0 && (n = !0), t.identifierPrefix !== void 0 && (r = t.identifierPrefix), t.onRecoverableError !== void 0 && (l = t.onRecoverableError)), t = Ci(e, 1, !1, null, null, n, !1, r, l), e[kt] = t.current, lr(e.nodeType === 8 ? e.parentNode : e), new Ni(t);
  }, Ve.findDOMNode = function(e) {
    if (e == null) return null;
    if (e.nodeType === 1) return e;
    var t = e._reactInternals;
    if (t === void 0)
      throw typeof e.render == "function" ? Error(m(188)) : (e = Object.keys(e).join(","), Error(m(268, e)));
    return e = eu(t), e = e === null ? null : e.stateNode, e;
  }, Ve.flushSync = function(e) {
    return on(e);
  }, Ve.hydrate = function(e, t, n) {
    if (!Tl(t)) throw Error(m(200));
    return Ll(null, e, t, !0, n);
  }, Ve.hydrateRoot = function(e, t, n) {
    if (!Pi(e)) throw Error(m(405));
    var r = n != null && n.hydratedSources || null, l = !1, o = "", i = Pa;
    if (n != null && (n.unstable_strictMode === !0 && (l = !0), n.identifierPrefix !== void 0 && (o = n.identifierPrefix), n.onRecoverableError !== void 0 && (i = n.onRecoverableError)), t = _a(t, null, e, 1, n ?? null, l, !1, o, i), e[kt] = t.current, lr(e), r) for (e = 0; e < r.length; e++) n = r[e], l = n._getVersion, l = l(n._source), t.mutableSourceEagerHydrationData == null ? t.mutableSourceEagerHydrationData = [n, l] : t.mutableSourceEagerHydrationData.push(
      n,
      l
    );
    return new Rl(t);
  }, Ve.render = function(e, t, n) {
    if (!Tl(t)) throw Error(m(200));
    return Ll(null, e, t, !1, n);
  }, Ve.unmountComponentAtNode = function(e) {
    if (!Tl(e)) throw Error(m(40));
    return e._reactRootContainer ? (on(function() {
      Ll(null, null, e, !1, function() {
        e._reactRootContainer = null, e[kt] = null;
      });
    }), !0) : !1;
  }, Ve.unstable_batchedUpdates = yi, Ve.unstable_renderSubtreeIntoContainer = function(e, t, n, r) {
    if (!Tl(n)) throw Error(m(200));
    if (e == null || e._reactInternals === void 0) throw Error(m(38));
    return Ll(e, t, n, !1, r);
  }, Ve.version = "18.3.1-next-f1338f8080-20240426", Ve;
}
var Ia;
function Kf() {
  if (Ia) return Ti.exports;
  Ia = 1;
  function h() {
    if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"))
      try {
        __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(h);
      } catch (O) {
        console.error(O);
      }
  }
  return h(), Ti.exports = Qf(), Ti.exports;
}
var Aa;
function Gf() {
  if (Aa) return Ol;
  Aa = 1;
  var h = Kf();
  return Ol.createRoot = h.createRoot, Ol.hydrateRoot = h.hydrateRoot, Ol;
}
var Yf = Gf();
const Xf = {
  none: /* @__PURE__ */ g.jsx(g.Fragment, {}),
  calendar: /* @__PURE__ */ g.jsxs(g.Fragment, { children: [
    /* @__PURE__ */ g.jsx("rect", { x: "3", y: "4.5", width: "18", height: "16", rx: "2" }),
    /* @__PURE__ */ g.jsx("path", { d: "M3 9.5h18M8 2.5v4M16 2.5v4" })
  ] }),
  factory: /* @__PURE__ */ g.jsx("path", { d: "M3 20.5h18M4 20.5V11l5 3v-3l5 3v-3l5 3V4.5h2v16" }),
  shield: /* @__PURE__ */ g.jsxs(g.Fragment, { children: [
    /* @__PURE__ */ g.jsx("path", { d: "M12 3l7.5 3v5.5c0 4.5-3.2 8-7.5 9.5-4.3-1.5-7.5-5-7.5-9.5V6z" }),
    /* @__PURE__ */ g.jsx("path", { d: "M8.5 12l2.5 2.5 4.5-5" })
  ] }),
  flask: /* @__PURE__ */ g.jsxs(g.Fragment, { children: [
    /* @__PURE__ */ g.jsx("path", { d: "M9 3h6M10 3v6.5L4.5 19a1.5 1.5 0 0 0 1.3 2.2h12.4a1.5 1.5 0 0 0 1.3-2.2L14 9.5V3" }),
    /* @__PURE__ */ g.jsx("path", { d: "M7 15h10" })
  ] }),
  folder: /* @__PURE__ */ g.jsx("path", { d: "M3 6.5A1.5 1.5 0 0 1 4.5 5h4.8l2 2.5h8.2A1.5 1.5 0 0 1 21 9v9.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z" }),
  thermometer: /* @__PURE__ */ g.jsx("path", { d: "M14 14.8V4.5a2 2 0 0 0-4 0v10.3a4 4 0 1 0 4 0z" }),
  drop: /* @__PURE__ */ g.jsx("path", { d: "M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" }),
  history: /* @__PURE__ */ g.jsxs(g.Fragment, { children: [
    /* @__PURE__ */ g.jsx("path", { d: "M3.5 12a8.5 8.5 0 1 0 2.5-6" }),
    /* @__PURE__ */ g.jsx("path", { d: "M3.5 4v4.5H8M12 7.5V12l3 2" })
  ] }),
  database: /* @__PURE__ */ g.jsxs(g.Fragment, { children: [
    /* @__PURE__ */ g.jsx("ellipse", { cx: "12", cy: "5.5", rx: "7.5", ry: "2.5" }),
    /* @__PURE__ */ g.jsx("path", { d: "M4.5 5.5v13c0 1.4 3.4 2.5 7.5 2.5s7.5-1.1 7.5-2.5v-13M4.5 12c0 1.4 3.4 2.5 7.5 2.5s7.5-1.1 7.5-2.5" })
  ] }),
  sliders: /* @__PURE__ */ g.jsxs(g.Fragment, { children: [
    /* @__PURE__ */ g.jsx("path", { d: "M4 7h10M18 7h2M4 17h4M12 17h8" }),
    /* @__PURE__ */ g.jsx("circle", { cx: "16", cy: "7", r: "2" }),
    /* @__PURE__ */ g.jsx("circle", { cx: "10", cy: "17", r: "2" })
  ] }),
  help: /* @__PURE__ */ g.jsxs(g.Fragment, { children: [
    /* @__PURE__ */ g.jsx("circle", { cx: "12", cy: "12", r: "9" }),
    /* @__PURE__ */ g.jsx("path", { d: "M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01" })
  ] }),
  users: /* @__PURE__ */ g.jsxs(g.Fragment, { children: [
    /* @__PURE__ */ g.jsx("circle", { cx: "9", cy: "8", r: "3.5" }),
    /* @__PURE__ */ g.jsx("path", { d: "M2.5 20c.6-3.5 3.2-5.5 6.5-5.5s5.9 2 6.5 5.5M16 4.8a3.5 3.5 0 0 1 0 6.4M18.5 14.8c1.6.7 2.7 2.4 3 5.2" })
  ] }),
  post: /* @__PURE__ */ g.jsx("path", { d: "M10.5 21.5h3M11 21.5l.5-19h1l.5 19M8 6h8M9 10h6" }),
  alert: /* @__PURE__ */ g.jsxs(g.Fragment, { children: [
    /* @__PURE__ */ g.jsx("path", { d: "M10.3 4.2L2.8 17.5A2 2 0 0 0 4.5 20.5h15a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0z" }),
    /* @__PURE__ */ g.jsx("path", { d: "M12 9.5v4M12 17h.01" })
  ] }),
  map: /* @__PURE__ */ g.jsxs(g.Fragment, { children: [
    /* @__PURE__ */ g.jsx("path", { d: "M9 4.5L3.5 6.5v13L9 17.5l6 2 5.5-2v-13L15 6.5z" }),
    /* @__PURE__ */ g.jsx("path", { d: "M9 4.5v13M15 6.5v13" })
  ] }),
  doc: /* @__PURE__ */ g.jsxs(g.Fragment, { children: [
    /* @__PURE__ */ g.jsx("path", { d: "M14 3H7a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V7.5z" }),
    /* @__PURE__ */ g.jsx("path", { d: "M14 3v4.5h4.5M9 13h6M9 16.5h6" })
  ] })
};
function cn({ name: h, size: O = 18 }) {
  const m = {
    chevronLeft: /* @__PURE__ */ g.jsx("path", { d: "M15 6l-6 6 6 6" }),
    chevronRight: /* @__PURE__ */ g.jsx("path", { d: "M9 6l6 6-6 6" }),
    updown: /* @__PURE__ */ g.jsx("path", { d: "M7 10l5-5 5 5M7 14l5 5 5-5" }),
    logout: /* @__PURE__ */ g.jsx("path", { d: "M15 4h3.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H15M10 16l-4-4 4-4M6 12h10" }),
    check: /* @__PURE__ */ g.jsx("path", { d: "M5 12.5l4.5 4.5L19 7.5" })
  };
  return /* @__PURE__ */ g.jsx("svg", { className: "sb-ic", width: O, height: O, viewBox: "0 0 24 24", "aria-hidden": "true", children: Xf[h] ?? m[h] });
}
const qf = (h, O) => O === h.href || O.startsWith(h.href + "/");
var Ba;
const Fa = ((Ba = window.UnificadoModuleTheme) == null ? void 0 : Ba.theme) || {};
function Zf(h) {
  var X;
  const O = h.modules.find((T) => T.id === h.activeModuleId) ?? h.modules[0], [m, J] = yt.useState(!1), te = yt.useRef(null), [K, A] = yt.useState(null), I = (T) => {
    if (!h.collapsed) return;
    const Y = T.target.closest("[data-tip]");
    if (!Y) return A(null);
    const he = Y.getBoundingClientRect();
    A({ text: Y.dataset.tip ?? "", top: he.top + he.height / 2, left: he.right + 12 });
  }, F = () => A(null);
  yt.useEffect(() => {
    h.collapsed || A(null);
  }, [h.collapsed]), yt.useEffect(() => {
    if (!m) return;
    const T = (he) => {
      var b;
      (b = te.current) != null && b.contains(he.target) || J(!1);
    }, Y = (he) => {
      he.key === "Escape" && J(!1);
    };
    return document.addEventListener("pointerdown", T), document.addEventListener("keydown", Y), () => {
      document.removeEventListener("pointerdown", T), document.removeEventListener("keydown", Y);
    };
  }, [m]);
  const C = (T) => (Y) => {
    Y.metaKey || Y.ctrlKey || Y.shiftKey || Y.button === 1 || (Y.preventDefault(), h.onNavigate(T));
  }, G = (T) => {
    const Y = qf(T, h.activePath);
    return /* @__PURE__ */ g.jsxs(
      "a",
      {
        href: T.href,
        className: "sb-link" + (Y ? " is-active" : ""),
        "aria-current": Y ? "page" : void 0,
        "data-tip": T.label,
        onClick: C(T.href),
        children: [
          /* @__PURE__ */ g.jsx(cn, { name: T.icon }),
          /* @__PURE__ */ g.jsx("span", { className: "sb-label", children: T.label }),
          T.badge && /* @__PURE__ */ g.jsx("span", { className: "sb-badge sb-badge--" + T.badge.tone, children: T.badge.text })
        ]
      },
      T.id
    );
  };
  return O ? /* @__PURE__ */ g.jsxs(
    "nav",
    {
      className: "sb" + (h.collapsed ? " is-collapsed" : ""),
      "aria-label": "Menu principal",
      style: { "--mod": O.color, "--mod-ink": ((X = Fa[O.id]) == null ? void 0 : X.ink) || "#0F1B2D" },
      onMouseOver: I,
      onFocus: I,
      onMouseLeave: F,
      onBlur: F,
      children: [
        /* @__PURE__ */ g.jsxs("div", { className: "sb-brand", children: [
          /* @__PURE__ */ g.jsxs("a", { className: "sb-logo", href: "/unificado/", "aria-label": "Ir ao menu principal", "data-tip": "Menu principal", onClick: C("/unificado/"), children: [
            /* @__PURE__ */ g.jsx("img", { className: "sb-logo-concrefer", src: h.logoConcrefer, alt: "Concrefer" }),
            /* @__PURE__ */ g.jsx("span", { className: "sb-logo-sep", "aria-hidden": "true" }),
            /* @__PURE__ */ g.jsx("img", { className: "sb-logo-ct", src: h.logoConcretrack, alt: "ConcreTrack" })
          ] }),
          /* @__PURE__ */ g.jsx(
            "button",
            {
              type: "button",
              className: "sb-iconbtn sb-collapse",
              "aria-label": h.collapsed ? "Expandir menu" : "Recolher menu",
              "aria-expanded": !h.collapsed,
              onClick: h.onToggleCollapsed,
              children: /* @__PURE__ */ g.jsx(cn, { name: h.collapsed ? "chevronRight" : "chevronLeft" })
            }
          )
        ] }),
        /* @__PURE__ */ g.jsxs("div", { className: "sb-switcher", ref: te, children: [
          /* @__PURE__ */ g.jsxs(
            "button",
            {
              type: "button",
              className: "sb-switcher-btn",
              "aria-haspopup": "menu",
              "aria-expanded": m,
              "data-tip": "Módulo: " + O.label,
              onClick: () => {
                A(null), J((T) => !T);
              },
              children: [
                /* @__PURE__ */ g.jsx("span", { className: "sb-mod-tile", children: /* @__PURE__ */ g.jsx(cn, { name: O.icon }) }),
                /* @__PURE__ */ g.jsx("span", { className: "sb-switcher-text", children: /* @__PURE__ */ g.jsx("span", { className: "sb-switcher-name", children: O.label }) }),
                /* @__PURE__ */ g.jsx("span", { className: "sb-switcher-chev", children: /* @__PURE__ */ g.jsx(cn, { name: "updown" }) })
              ]
            }
          ),
          m && /* @__PURE__ */ g.jsx("div", { className: "sb-menu", role: "menu", children: h.modules.map((T) => {
            var Y;
            return /* @__PURE__ */ g.jsxs(
              "button",
              {
                type: "button",
                role: "menuitemradio",
                "aria-checked": T.id === O.id,
                className: "sb-menu-item",
                style: { "--item-mod": T.color, "--item-ink": ((Y = Fa[T.id]) == null ? void 0 : Y.ink) || "#0F1B2D" },
                onClick: () => {
                  J(!1), h.onSelectModule(T.id);
                },
                children: [
                  /* @__PURE__ */ g.jsx("span", { className: "sb-menu-sigla", children: /* @__PURE__ */ g.jsx(cn, { name: T.icon }) }),
                  T.label,
                  T.id === O.id && /* @__PURE__ */ g.jsx("span", { className: "sb-menu-check", children: /* @__PURE__ */ g.jsx(cn, { name: "check", size: 16 }) })
                ]
              },
              T.id
            );
          }) })
        ] }),
        /* @__PURE__ */ g.jsx("div", { className: "sb-scroll", children: O.sections.map((T) => /* @__PURE__ */ g.jsxs("div", { className: "sb-section", children: [
          /* @__PURE__ */ g.jsx("div", { className: "sb-section-title", children: T.title }),
          T.items.map(G)
        ] }, T.title)) }),
        /* @__PURE__ */ g.jsxs("div", { className: "sb-footer", children: [
          h.updateAvailable && /* @__PURE__ */ g.jsxs("button", { type: "button", className: "sb-update", "data-tip": "Atualizar aplicativo", onClick: h.onUpdate, children: [
            /* @__PURE__ */ g.jsx("span", { className: "sb-update-dot", "aria-hidden": "true" }),
            /* @__PURE__ */ g.jsx("span", { className: "sb-label", children: "Nova versão — atualizar" })
          ] }),
          h.footerItems.map(G),
          /* @__PURE__ */ g.jsxs("div", { className: "sb-user", children: [
            /* @__PURE__ */ g.jsx("span", { className: "sb-avatar", "aria-hidden": "true", children: h.user.name.trim().charAt(0).toUpperCase() }),
            /* @__PURE__ */ g.jsxs("span", { className: "sb-user-text", children: [
              /* @__PURE__ */ g.jsx("span", { className: "sb-user-name", children: h.user.name }),
              /* @__PURE__ */ g.jsx("span", { className: "sb-user-meta", children: h.user.role }),
              /* @__PURE__ */ g.jsxs("span", { className: "sb-user-meta sb-mono", children: [
                "Uni ",
                h.version
              ] })
            ] }),
            /* @__PURE__ */ g.jsx("button", { type: "button", className: "sb-iconbtn", "aria-label": "Sair", "data-tip": "Sair", onClick: h.onLogout, children: /* @__PURE__ */ g.jsx(cn, { name: "logout" }) })
          ] })
        ] }),
        h.collapsed && K && !m && /* @__PURE__ */ g.jsx("div", { className: "sb-tip", role: "tooltip", style: { top: K.top, left: K.left }, children: K.text })
      ]
    }
  ) : null;
}
function Jf(h = "ct.sidebar.collapsed") {
  const O = () => {
    try {
      const K = localStorage.getItem(h);
      if (K !== null) return K === "1";
    } catch {
    }
    return typeof window < "u" && window.innerWidth < 1200;
  }, [m, J] = yt.useState(O);
  return [m, () => J((K) => {
    try {
      localStorage.setItem(h, K ? "0" : "1");
    } catch {
    }
    return !K;
  })];
}
var Ha;
const bf = (Ha = window.UnificadoModuleTheme) == null ? void 0 : Ha.theme, fn = Object.fromEntries(
  Object.entries(bf || {}).map(([h, O]) => [h, O.color])
), Oi = (h) => "/unificado/?view=" + encodeURIComponent(h), de = (h, O) => ({
  title: h,
  items: O.map(([m, J, te, K, A]) => ({ id: m, label: J, href: Oi(te), icon: K, ...A ? { badge: A } : {} }))
}), Ee = (h) => `mapa/operacao/?tela=${h}`, Ua = [
  { id: "planejamento", label: "Planejamento", color: fn.planejamento, icon: "calendar", sections: [
    de("GERAL", [
      ["dashboard", "Dashboard", "pcp/dashboard/", "map"],
      ["comparacao", "Programado vs Realizado", "pcp/comparacao/", "sliders"]
    ]),
    de("PROGRAMAÇÃO", [
      ["programacao12", "Setor 1 e 2", "pcp/programacao-alex/", "calendar"],
      ["programacao34", "Setor 3 e 4", "pcp/programacao/", "calendar"],
      ["circular3", "Circular Setor 3", "pcp/programacao-circular-s3/", "calendar"],
      ["dt4", "DT Setor 4", "pcp/programacao-circular-s4/", "calendar"],
      ["programacaoFinal", "Programação Final", "pcp/programacao-final/", "calendar"]
    ]),
    de("RELATÓRIOS DE PROGRAMAÇÃO", [
      ["relatorio12", "Setor 1 e 2", "pcp/relatorio-producao/", "doc"],
      ["relatorio3", "Setor 3", "pcp/relatorio-programacao-s3/", "doc"],
      ["relatorio4", "Setor 4", "pcp/relatorio-programacao-s4/", "doc"]
    ]),
    de("ARMADURAS", [
      ["postesNumerosSerie", "Números de série dos postes", "pcp/numeros-serie/", "history"],
      ["armadurasProgramacao", "Programação semanal", "pcp/armaduras/", "calendar"],
      ["armadurasRelatorio", "Relatório de produção", "pcp/armaduras-relatorio/", "doc"]
    ]),
    de("ETIQUETAS", [
      ["etiquetas", "Padrão", "pcp/etiquetas/", "doc"],
      ["etiquetasSc", "SC-Prod.", "pcp/etiquetas-sc/", "doc"],
      ["etiquetasArmaduras", "Armaduras", "pcp/etiquetas-armaduras/", "doc"]
    ]),
    de("ACOMPANHAMENTO", [
      ["pcpDiario", "PCP Diário", "pcp/pcp-diario/", "history"],
      ["acompMensal", "Acompanhamento Mensal", "pcp/acompanhamento-mensal/", "history"],
      ["acompMensal34", "Acompanhamento Mensal Setor 3 e 4", "pcp/acompanhamento-mensal-setor-34/", "history"],
      ["apontamentoMega", "Apontamento Mega", "pcp/apontamento-mega/", "database"],
      ["fechamentoDiarioPcp", "Fechamento Diário", "pcp/fechamento-diario/", "doc"]
    ]),
    de("PRODUÇÃO E APOIO", [
      ["producaoPcp", "Produção PCP", "pcp/producao/", "factory"],
      ["maodeobra", "Mão de Obra", "pcp/maodeobra/", "users"],
      ["maodeobraRateio", "Rateio de Mão de Obra", "pcp/maodeobra-rateio/", "users"],
      ["formasPorSetor", "Formas por Setor", "pcp/formas-por-setor/", "database"],
      ["testeProgramacao", "Teste Programação", "pcp/teste-programacao/", "sliders"]
    ])
  ] },
  { id: "producao", label: "Produção", color: fn.producao, icon: "factory", sections: [
    de("PRODUÇÃO", [
      ["liberacao", "Produção / Liberação", Ee("LIBERACAO"), "factory"],
      ["setor1", "Setor 1", Ee("LIBERACAO_S1"), "factory"],
      ["setor2", "Setor 2", Ee("LIBERACAO_S2"), "factory"],
      ["setor3", "Setor 3", Ee("LIBERACAO_S3"), "factory"],
      ["setor4", "Setor 4", Ee("LIBERACAO_S4"), "factory"],
      ["mandril", "Mandril Circular", Ee("MANDRIL_CIRCULAR"), "sliders"]
    ]),
    de("MONTAGEM", [
      ["inspecao", "Inspeção Setor 3 e 4", Ee("INSPECAO"), "shield"],
      ["montagem", "Montagem Postes", Ee("MONTAGEM_POSTES"), "post"],
      ["sequencia", "Sequência Setor 3", Ee("SEQUENCIA_S3"), "history"]
    ]),
    de("CONTROLE", [
      ["relatorioMapa", "Relatório Enc. Produção", Ee("RELATORIO"), "doc"],
      ["historico", "Histórico", Ee("HISTORICO"), "history"],
      ["acmpConcretagem", "Acmp. Concretagem", Ee("ACMP_CONCRETAGEM"), "sliders"],
      ["manutencao", "Manutenção Formas", Ee("RELATORIO_MANUTENCAO"), "sliders"],
      ["tratativa", "Tratativa Defeitos", Ee("TRATATIVA_DEFEITOS"), "alert"]
    ]),
    de("INDICADORES", [
      ["dashMontagem", "Dashboard Montagem", Ee("MONTAGEM_INDICADORES"), "map"],
      ["dashDefeitos", "Dashboard Defeitos", Ee("DASHBOARD_DEFEITOS"), "map"],
      ["produtividade", "Dashboard Concretagem Matriz", Ee("PROD_ANALISE"), "map"],
      ["tvFormas", "Painel TV — Formas", "tv/formas/", "map"]
    ])
  ] },
  { id: "qualidade", label: "Qualidade", color: fn.qualidade, icon: "shield", sections: [
    de("NÃO CONFORMIDADES", [
      ["qualidadePainel", "Painel de RNCs", "qualidade/", "alert"],
      ["qualidadeAbertura", "Abrir RNC", "qualidade/abrir", "doc"],
      ["qualidadeResultadosBancada", "Resultados de bancada", "qualidade/resultados-bancada", "doc"],
      ["qualidadeCadastros", "Cadastros", "qualidade/cadastros", "database"]
    ])
  ] },
  { id: "laboratorio", label: "Laboratório", color: fn.laboratorio, icon: "flask", sections: [
    de("DOSAGEM", [
      ["labDosagem", "Visão geral", "laboratorio/dosagem/", "flask"],
      ["labDosagemEmpacotamento", "Empacotamento", "laboratorio/dosagem/#/dosagem/empacotamento", "flask"],
      ["labDosagemVolume", "Volume", "laboratorio/dosagem/#/dosagem/volume", "flask"],
      ["labDosagemComparacao", "Comparação dos métodos", "laboratorio/dosagem/#/comparacao-metodos", "sliders"],
      ["labDosagemTracos", "Traços", "laboratorio/dosagem/#/tracos", "doc"],
      ["labDosagemMateriais", "Materiais", "laboratorio/dosagem/#/materiais", "database"],
      ["labDosagemFornecedores", "Fornecedores", "laboratorio/dosagem/#/fornecedores", "database"],
      ["labDosagemEnsaios", "Ensaios", "laboratorio/dosagem/#/ensaios", "flask"],
      ["labDosagemFerramentas", "Ferramentas", "laboratorio/dosagem/#/ferramentas", "sliders"],
      ["labDosagemCustos", "Custos", "laboratorio/dosagem/#/custos", "doc"],
      ["labDosagemReferencia", "Referência", "laboratorio/dosagem/#/referencia", "help"],
      ["labDosagemProducao", "Produção", "laboratorio/dosagem/#/producao-r1", "factory"],
      ["labDosagemImportacao", "Importação", "laboratorio/dosagem/#/importacao-r1", "database"],
      ["labDosagemConfig", "Configurações", "laboratorio/dosagem/#/config", "sliders"]
    ]),
    de("CONCRETO FRESCO", [
      ["labSlump", "Registro de slump / flow", "laboratorio/slump", "thermometer"]
    ]),
    de("CURA TÉRMICA", [
      ["labMonitor", "Monitoramento", "laboratorio/", "thermometer", { text: "AO VIVO", tone: "live" }],
      ["labHistory", "Histórico de medições", "laboratorio/?view=history", "history"],
      ["labDevice", "Dispositivo", "laboratorio/?view=settings", "sliders"]
    ]),
    de("POSTES", [
      ["labPole", "Ensaio de postes", "laboratorio/novo/postes", "post"],
      ["labAbsorption", "Absorção", "laboratorio/novo/postes?tab=absorcao", "drop"],
      ["labTests", "Histórico de ensaios", "laboratorio/novo/postes?tab=historico", "history"],
      ["labRegisters", "Cadastros", "laboratorio/novo/postes?tab=cadastros", "database"],
      ["labCriteria", "Critérios", "laboratorio/novo/postes?tab=criterios", "sliders"]
    ]),
    de("CRONOANÁLISE", [
      ["cronoanalise.inicio", "Início", "laboratorio/cronoanalise", "history"],
      ["cronoanalise.coletar", "Coletar", "laboratorio/cronoanalise/coletar", "thermometer"],
      ["cronoanalise.medicoes", "Medições", "laboratorio/cronoanalise/medicoes", "database"],
      ["cronoanalise.catalogo", "Catálogo", "laboratorio/cronoanalise/catalogo", "sliders"],
      ["cronoanalise.dimensionar", "Dimensionar", "laboratorio/cronoanalise/dimensionar", "factory"],
      ["cronoanalise.simular", "Simular", "laboratorio/cronoanalise/simular", "map"],
      ["cronoanalise.metodologia", "Metodologia", "laboratorio/cronoanalise/metodologia", "help"]
    ])
  ] },
  { id: "usinas", label: "Usinas", color: fn.usinas, icon: "factory", sections: [
    de("GERAL", [
      ["usinasInicio", "Cartas de traço", "usinas/", "map"],
      ["usinasCec", "Controle estatístico", "usinas/?area=cec", "database"],
      ["usinasRelatorios", "Relatórios gerenciais", "usinas/?area=relatorios", "doc"],
      ["usinasEstoque", "Controle de estoque", "usinas/?area=estoque", "factory"]
    ])
  ] },
  { id: "ged", label: "GED", color: fn.ged, icon: "folder", sections: [
    de("GESTÃO DOCUMENTAL", [
      ["ged-dashboard", "Painel", "ged/dashboard", "map"],
      ["ged-documents", "Documentos", "ged/documents", "doc"],
      ["ged-approvals", "Aprovações", "ged/approvals", "shield"],
      ["ged-tasks", "Tarefas", "ged/tasks", "calendar"],
      ["ged-calibrations", "Calibrações", "ged/calibrations", "sliders"]
    ])
  ] },
  { id: "suprimentos", label: "Suprimentos", color: fn.suprimentos, icon: "database", sections: [
    de("SOLICITAÇÕES", [
      ["suprimentosPainel", "Painel", "suprimentos/painel/", "map"],
      ["suprimentosSolicitacoes", "Solicitações", "suprimentos/solicitacoes/", "doc"],
      ["suprimentosNova", "Nova solicitação", "suprimentos/nova/", "post"],
      ["suprimentosAlmoxarifado", "Almoxarifado", "suprimentos/almoxarifado/", "database"],
      ["suprimentosInventario", "Inventário", "suprimentos/inventario/", "sliders"]
    ]),
    de("COMPRAS", [
      ["suprimentosCotacoes", "Cotações e pedidos", "suprimentos/cotacoes/", "doc"],
      ["suprimentosRecebimento", "Recebimento", "suprimentos/recebimento/", "post"],
      ["suprimentosFornecedores", "Fornecedores", "suprimentos/fornecedores/", "users"],
      ["suprimentosIndicadores", "Indicadores", "suprimentos/analises/", "map"]
    ]),
    de("ADMINISTRAÇÃO", [
      ["suprimentosCadastros", "Cadastros e alçadas", "suprimentos/cadastros/", "sliders"]
    ])
  ] }
], ed = [
  { id: "usuarios", label: "Usuários", href: Oi(Ee("USUARIOS")), icon: "users" },
  { id: "reportProblem", label: "Relatar problema", href: "/unificado/testar/#relatar", icon: "alert" },
  { id: "labHelp", label: "Como funciona", href: Oi("laboratorio/?view=help"), icon: "help" }
];
function td(h) {
  var K;
  const O = new Set(h.allowedModuleIds), m = new Set(h.allowedItemIds), J = ((K = h.navModules) == null ? void 0 : K.map((A) => {
    const I = Ua.find((F) => F.id === A.id);
    return {
      id: A.id,
      label: A.label,
      color: (I == null ? void 0 : I.color) ?? "#5B8DEF",
      icon: (I == null ? void 0 : I.icon) ?? "doc",
      sections: A.sections.map((F) => ({ title: F.title, items: F.items.map((C) => {
        var G;
        return {
          ...C,
          icon: ((G = I == null ? void 0 : I.sections.flatMap((X) => X.items).find((X) => X.id === C.id)) == null ? void 0 : G.icon) ?? (/mao.?de.?obra|rateio|premia/i.test(C.id + " " + C.label) ? "users" : /document|aprov/i.test(C.id + " " + C.label) ? "doc" : /calibra/i.test(C.id + " " + C.label) ? "thermometer" : /apontamento|mega|\bDT\b/i.test(C.id + " " + C.label) ? "calendar" : /massada/i.test(C.id + " " + C.label) ? "factory" : /custo/i.test(C.id + " " + C.label) ? "sliders" : "none")
        };
      }) }))
    };
  })) ?? [];
  return [...J, ...Ua.filter((A) => A.id === "ged" && !J.some((I) => I.id === "ged"))].filter((A) => O.has(A.id)).map((A) => ({
    ...A,
    sections: A.sections.map((I) => ({
      ...I,
      items: I.items.filter((F) => m.has(F.id))
    })).filter((I) => I.items.length > 0)
  })).filter((A) => A.sections.length > 0);
}
function nd() {
  const [h, O] = yt.useState(() => {
    var C;
    return ((C = window.UnificadoSidebarModelA) == null ? void 0 : C.snapshot()) ?? null;
  }), [m, J] = Jf();
  if (yt.useEffect(() => {
    const C = () => {
      var G;
      return O(((G = window.UnificadoSidebarModelA) == null ? void 0 : G.snapshot()) ?? null);
    };
    return window.addEventListener("unificado-sidebar-model-a-update", C), window.addEventListener("popstate", C), C(), () => {
      window.removeEventListener("unificado-sidebar-model-a-update", C), window.removeEventListener("popstate", C);
    };
  }, []), yt.useEffect(() => {
    const C = () => {
      m && J();
    };
    return window.addEventListener("unificado-sidebar-module-selected", C), () => window.removeEventListener("unificado-sidebar-module-selected", C);
  }, [m, J]), yt.useEffect(() => {
    var C;
    (C = document.querySelector("#sidebar-model-a .sb-scroll")) == null || C.scrollTo(0, 0);
  }, [h == null ? void 0 : h.activeModuleId]), !h || !window.UnificadoSidebarModelA) return null;
  const te = td(h);
  if (te.length === 0) return null;
  const K = te.some((C) => C.id === h.activeModuleId) ? h.activeModuleId : te[0].id, A = new Set(h.footerItemIds), I = ed.filter((C) => A.has(C.id)).map((C) => C.id === "usuarios" && h.allowedItemIds.includes("pcpUsuarios") && !h.allowedItemIds.includes("prodUsuarios") ? { ...C, href: "/unificado/?view=" + encodeURIComponent("pcp/usuarios/") } : C), F = (C) => {
    var G;
    return (G = window.UnificadoSidebarModelA) == null ? void 0 : G.navigate(C);
  };
  return /* @__PURE__ */ g.jsx(
    Zf,
    {
      modules: te,
      activeModuleId: K,
      activePath: h.activePath,
      footerItems: I,
      user: h.user,
      version: h.version,
      logoConcrefer: "/unificado/assets/img/logo-concrefer.png",
      logoConcretrack: "/unificado/assets/img/logo-concretrack.png",
      collapsed: m,
      onToggleCollapsed: J,
      onSelectModule: (C) => {
        var G;
        return (G = window.UnificadoSidebarModelA) == null ? void 0 : G.selectModule(C);
      },
      onNavigate: F,
      onLogout: () => {
        var C;
        return (C = window.UnificadoSidebarModelA) == null ? void 0 : C.logout();
      },
      updateAvailable: h.updateAvailable,
      onUpdate: () => {
        var C;
        return (C = window.UnificadoSidebarModelA) == null ? void 0 : C.update();
      }
    }
  );
}
const Va = document.getElementById("sidebar-model-a");
Va && Yf.createRoot(Va).render(/* @__PURE__ */ g.jsx(nd, {}));
