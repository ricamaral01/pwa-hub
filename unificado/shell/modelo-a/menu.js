var Ri = { exports: {} }, kr = {}, Ti = { exports: {} }, V = {};
/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Ta;
function Vf() {
  if (Ta) return V;
  Ta = 1;
  var h = Symbol.for("react.element"), z = Symbol.for("react.portal"), m = Symbol.for("react.fragment"), ee = Symbol.for("react.strict_mode"), ne = Symbol.for("react.profiler"), G = Symbol.for("react.provider"), F = Symbol.for("react.context"), D = Symbol.for("react.forward_ref"), A = Symbol.for("react.suspense"), R = Symbol.for("react.memo"), Y = Symbol.for("react.lazy"), q = Symbol.iterator;
  function te(c) {
    return c === null || typeof c != "object" ? null : (c = q && c[q] || c["@@iterator"], typeof c == "function" ? c : null);
  }
  var j = { isMounted: function() {
    return !1;
  }, enqueueForceUpdate: function() {
  }, enqueueReplaceState: function() {
  }, enqueueSetState: function() {
  } }, X = Object.assign, H = {};
  function Z(c, g, U) {
    this.props = c, this.context = g, this.refs = H, this.updater = U || j;
  }
  Z.prototype.isReactComponent = {}, Z.prototype.setState = function(c, g) {
    if (typeof c != "object" && typeof c != "function" && c != null) throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
    this.updater.enqueueSetState(this, c, g, "setState");
  }, Z.prototype.forceUpdate = function(c) {
    this.updater.enqueueForceUpdate(this, c, "forceUpdate");
  };
  function wt() {
  }
  wt.prototype = Z.prototype;
  function ct(c, g, U) {
    this.props = c, this.context = g, this.refs = H, this.updater = U || j;
  }
  var et = ct.prototype = new wt();
  et.constructor = ct, X(et, Z.prototype), et.isPureReactComponent = !0;
  var _e = Array.isArray, tt = Object.prototype.hasOwnProperty, Te = { current: null }, Oe = { key: !0, ref: !0, __self: !0, __source: !0 };
  function Ge(c, g, U) {
    var B, W = {}, Q = null, re = null;
    if (g != null) for (B in g.ref !== void 0 && (re = g.ref), g.key !== void 0 && (Q = "" + g.key), g) tt.call(g, B) && !Oe.hasOwnProperty(B) && (W[B] = g[B]);
    var J = arguments.length - 2;
    if (J === 1) W.children = U;
    else if (1 < J) {
      for (var ue = Array(J), He = 0; He < J; He++) ue[He] = arguments[He + 2];
      W.children = ue;
    }
    if (c && c.defaultProps) for (B in J = c.defaultProps, J) W[B] === void 0 && (W[B] = J[B]);
    return { $$typeof: h, type: c, key: Q, ref: re, props: W, _owner: Te.current };
  }
  function Rt(c, g) {
    return { $$typeof: h, type: c.type, key: g, ref: c.ref, props: c.props, _owner: c._owner };
  }
  function St(c) {
    return typeof c == "object" && c !== null && c.$$typeof === h;
  }
  function Xt(c) {
    var g = { "=": "=0", ":": "=2" };
    return "$" + c.replace(/[=:]/g, function(U) {
      return g[U];
    });
  }
  var ft = /\/+/g;
  function Be(c, g) {
    return typeof c == "object" && c !== null && c.key != null ? Xt("" + c.key) : g.toString(36);
  }
  function nt(c, g, U, B, W) {
    var Q = typeof c;
    (Q === "undefined" || Q === "boolean") && (c = null);
    var re = !1;
    if (c === null) re = !0;
    else switch (Q) {
      case "string":
      case "number":
        re = !0;
        break;
      case "object":
        switch (c.$$typeof) {
          case h:
          case z:
            re = !0;
        }
    }
    if (re) return re = c, W = W(re), c = B === "" ? "." + Be(re, 0) : B, _e(W) ? (U = "", c != null && (U = c.replace(ft, "$&/") + "/"), nt(W, g, U, "", function(He) {
      return He;
    })) : W != null && (St(W) && (W = Rt(W, U + (!W.key || re && re.key === W.key ? "" : ("" + W.key).replace(ft, "$&/") + "/") + c)), g.push(W)), 1;
    if (re = 0, B = B === "" ? "." : B + ":", _e(c)) for (var J = 0; J < c.length; J++) {
      Q = c[J];
      var ue = B + Be(Q, J);
      re += nt(Q, g, U, ue, W);
    }
    else if (ue = te(c), typeof ue == "function") for (c = ue.call(c), J = 0; !(Q = c.next()).done; ) Q = Q.value, ue = B + Be(Q, J++), re += nt(Q, g, U, ue, W);
    else if (Q === "object") throw g = String(c), Error("Objects are not valid as a React child (found: " + (g === "[object Object]" ? "object with keys {" + Object.keys(c).join(", ") + "}" : g) + "). If you meant to render a collection of children, use an array instead.");
    return re;
  }
  function dt(c, g, U) {
    if (c == null) return c;
    var B = [], W = 0;
    return nt(c, B, "", "", function(Q) {
      return g.call(U, Q, W++);
    }), B;
  }
  function je(c) {
    if (c._status === -1) {
      var g = c._result;
      g = g(), g.then(function(U) {
        (c._status === 0 || c._status === -1) && (c._status = 1, c._result = U);
      }, function(U) {
        (c._status === 0 || c._status === -1) && (c._status = 2, c._result = U);
      }), c._status === -1 && (c._status = 0, c._result = g);
    }
    if (c._status === 1) return c._result.default;
    throw c._result;
  }
  var fe = { current: null }, E = { transition: null }, O = { ReactCurrentDispatcher: fe, ReactCurrentBatchConfig: E, ReactCurrentOwner: Te };
  function _() {
    throw Error("act(...) is not supported in production builds of React.");
  }
  return V.Children = { map: dt, forEach: function(c, g, U) {
    dt(c, function() {
      g.apply(this, arguments);
    }, U);
  }, count: function(c) {
    var g = 0;
    return dt(c, function() {
      g++;
    }), g;
  }, toArray: function(c) {
    return dt(c, function(g) {
      return g;
    }) || [];
  }, only: function(c) {
    if (!St(c)) throw Error("React.Children.only expected to receive a single React element child.");
    return c;
  } }, V.Component = Z, V.Fragment = m, V.Profiler = ne, V.PureComponent = ct, V.StrictMode = ee, V.Suspense = A, V.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = O, V.act = _, V.cloneElement = function(c, g, U) {
    if (c == null) throw Error("React.cloneElement(...): The argument must be a React element, but you passed " + c + ".");
    var B = X({}, c.props), W = c.key, Q = c.ref, re = c._owner;
    if (g != null) {
      if (g.ref !== void 0 && (Q = g.ref, re = Te.current), g.key !== void 0 && (W = "" + g.key), c.type && c.type.defaultProps) var J = c.type.defaultProps;
      for (ue in g) tt.call(g, ue) && !Oe.hasOwnProperty(ue) && (B[ue] = g[ue] === void 0 && J !== void 0 ? J[ue] : g[ue]);
    }
    var ue = arguments.length - 2;
    if (ue === 1) B.children = U;
    else if (1 < ue) {
      J = Array(ue);
      for (var He = 0; He < ue; He++) J[He] = arguments[He + 2];
      B.children = J;
    }
    return { $$typeof: h, type: c.type, key: W, ref: Q, props: B, _owner: re };
  }, V.createContext = function(c) {
    return c = { $$typeof: F, _currentValue: c, _currentValue2: c, _threadCount: 0, Provider: null, Consumer: null, _defaultValue: null, _globalName: null }, c.Provider = { $$typeof: G, _context: c }, c.Consumer = c;
  }, V.createElement = Ge, V.createFactory = function(c) {
    var g = Ge.bind(null, c);
    return g.type = c, g;
  }, V.createRef = function() {
    return { current: null };
  }, V.forwardRef = function(c) {
    return { $$typeof: D, render: c };
  }, V.isValidElement = St, V.lazy = function(c) {
    return { $$typeof: Y, _payload: { _status: -1, _result: c }, _init: je };
  }, V.memo = function(c, g) {
    return { $$typeof: R, type: c, compare: g === void 0 ? null : g };
  }, V.startTransition = function(c) {
    var g = E.transition;
    E.transition = {};
    try {
      c();
    } finally {
      E.transition = g;
    }
  }, V.unstable_act = _, V.useCallback = function(c, g) {
    return fe.current.useCallback(c, g);
  }, V.useContext = function(c) {
    return fe.current.useContext(c);
  }, V.useDebugValue = function() {
  }, V.useDeferredValue = function(c) {
    return fe.current.useDeferredValue(c);
  }, V.useEffect = function(c, g) {
    return fe.current.useEffect(c, g);
  }, V.useId = function() {
    return fe.current.useId();
  }, V.useImperativeHandle = function(c, g, U) {
    return fe.current.useImperativeHandle(c, g, U);
  }, V.useInsertionEffect = function(c, g) {
    return fe.current.useInsertionEffect(c, g);
  }, V.useLayoutEffect = function(c, g) {
    return fe.current.useLayoutEffect(c, g);
  }, V.useMemo = function(c, g) {
    return fe.current.useMemo(c, g);
  }, V.useReducer = function(c, g, U) {
    return fe.current.useReducer(c, g, U);
  }, V.useRef = function(c) {
    return fe.current.useRef(c);
  }, V.useState = function(c) {
    return fe.current.useState(c);
  }, V.useSyncExternalStore = function(c, g, U) {
    return fe.current.useSyncExternalStore(c, g, U);
  }, V.useTransition = function() {
    return fe.current.useTransition();
  }, V.version = "18.3.1", V;
}
var La;
function Ii() {
  return La || (La = 1, Ti.exports = Vf()), Ti.exports;
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
var za;
function Bf() {
  if (za) return kr;
  za = 1;
  var h = Ii(), z = Symbol.for("react.element"), m = Symbol.for("react.fragment"), ee = Object.prototype.hasOwnProperty, ne = h.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner, G = { key: !0, ref: !0, __self: !0, __source: !0 };
  function F(D, A, R) {
    var Y, q = {}, te = null, j = null;
    R !== void 0 && (te = "" + R), A.key !== void 0 && (te = "" + A.key), A.ref !== void 0 && (j = A.ref);
    for (Y in A) ee.call(A, Y) && !G.hasOwnProperty(Y) && (q[Y] = A[Y]);
    if (D && D.defaultProps) for (Y in A = D.defaultProps, A) q[Y] === void 0 && (q[Y] = A[Y]);
    return { $$typeof: z, type: D, key: te, ref: j, props: q, _owner: ne.current };
  }
  return kr.Fragment = m, kr.jsx = F, kr.jsxs = F, kr;
}
var Oa;
function Hf() {
  return Oa || (Oa = 1, Ri.exports = Bf()), Ri.exports;
}
var w = Hf(), yt = Ii(), Ol = {}, Li = { exports: {} }, Ve = {}, zi = { exports: {} }, Oi = {};
/**
 * @license React
 * scheduler.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var ja;
function $f() {
  return ja || (ja = 1, (function(h) {
    function z(E, O) {
      var _ = E.length;
      E.push(O);
      e: for (; 0 < _; ) {
        var c = _ - 1 >>> 1, g = E[c];
        if (0 < ne(g, O)) E[c] = O, E[_] = g, _ = c;
        else break e;
      }
    }
    function m(E) {
      return E.length === 0 ? null : E[0];
    }
    function ee(E) {
      if (E.length === 0) return null;
      var O = E[0], _ = E.pop();
      if (_ !== O) {
        E[0] = _;
        e: for (var c = 0, g = E.length, U = g >>> 1; c < U; ) {
          var B = 2 * (c + 1) - 1, W = E[B], Q = B + 1, re = E[Q];
          if (0 > ne(W, _)) Q < g && 0 > ne(re, W) ? (E[c] = re, E[Q] = _, c = Q) : (E[c] = W, E[B] = _, c = B);
          else if (Q < g && 0 > ne(re, _)) E[c] = re, E[Q] = _, c = Q;
          else break e;
        }
      }
      return O;
    }
    function ne(E, O) {
      var _ = E.sortIndex - O.sortIndex;
      return _ !== 0 ? _ : E.id - O.id;
    }
    if (typeof performance == "object" && typeof performance.now == "function") {
      var G = performance;
      h.unstable_now = function() {
        return G.now();
      };
    } else {
      var F = Date, D = F.now();
      h.unstable_now = function() {
        return F.now() - D;
      };
    }
    var A = [], R = [], Y = 1, q = null, te = 3, j = !1, X = !1, H = !1, Z = typeof setTimeout == "function" ? setTimeout : null, wt = typeof clearTimeout == "function" ? clearTimeout : null, ct = typeof setImmediate < "u" ? setImmediate : null;
    typeof navigator < "u" && navigator.scheduling !== void 0 && navigator.scheduling.isInputPending !== void 0 && navigator.scheduling.isInputPending.bind(navigator.scheduling);
    function et(E) {
      for (var O = m(R); O !== null; ) {
        if (O.callback === null) ee(R);
        else if (O.startTime <= E) ee(R), O.sortIndex = O.expirationTime, z(A, O);
        else break;
        O = m(R);
      }
    }
    function _e(E) {
      if (H = !1, et(E), !X) if (m(A) !== null) X = !0, je(tt);
      else {
        var O = m(R);
        O !== null && fe(_e, O.startTime - E);
      }
    }
    function tt(E, O) {
      X = !1, H && (H = !1, wt(Ge), Ge = -1), j = !0;
      var _ = te;
      try {
        for (et(O), q = m(A); q !== null && (!(q.expirationTime > O) || E && !Xt()); ) {
          var c = q.callback;
          if (typeof c == "function") {
            q.callback = null, te = q.priorityLevel;
            var g = c(q.expirationTime <= O);
            O = h.unstable_now(), typeof g == "function" ? q.callback = g : q === m(A) && ee(A), et(O);
          } else ee(A);
          q = m(A);
        }
        if (q !== null) var U = !0;
        else {
          var B = m(R);
          B !== null && fe(_e, B.startTime - O), U = !1;
        }
        return U;
      } finally {
        q = null, te = _, j = !1;
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
        var O = !0;
        try {
          O = Oe(!0, E);
        } finally {
          O ? Be() : (Te = !1, Oe = null);
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
      Z(ft, 0);
    };
    function je(E) {
      Oe = E, Te || (Te = !0, Be());
    }
    function fe(E, O) {
      Ge = Z(function() {
        E(h.unstable_now());
      }, O);
    }
    h.unstable_IdlePriority = 5, h.unstable_ImmediatePriority = 1, h.unstable_LowPriority = 4, h.unstable_NormalPriority = 3, h.unstable_Profiling = null, h.unstable_UserBlockingPriority = 2, h.unstable_cancelCallback = function(E) {
      E.callback = null;
    }, h.unstable_continueExecution = function() {
      X || j || (X = !0, je(tt));
    }, h.unstable_forceFrameRate = function(E) {
      0 > E || 125 < E ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : Rt = 0 < E ? Math.floor(1e3 / E) : 5;
    }, h.unstable_getCurrentPriorityLevel = function() {
      return te;
    }, h.unstable_getFirstCallbackNode = function() {
      return m(A);
    }, h.unstable_next = function(E) {
      switch (te) {
        case 1:
        case 2:
        case 3:
          var O = 3;
          break;
        default:
          O = te;
      }
      var _ = te;
      te = O;
      try {
        return E();
      } finally {
        te = _;
      }
    }, h.unstable_pauseExecution = function() {
    }, h.unstable_requestPaint = function() {
    }, h.unstable_runWithPriority = function(E, O) {
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
      var _ = te;
      te = E;
      try {
        return O();
      } finally {
        te = _;
      }
    }, h.unstable_scheduleCallback = function(E, O, _) {
      var c = h.unstable_now();
      switch (typeof _ == "object" && _ !== null ? (_ = _.delay, _ = typeof _ == "number" && 0 < _ ? c + _ : c) : _ = c, E) {
        case 1:
          var g = -1;
          break;
        case 2:
          g = 250;
          break;
        case 5:
          g = 1073741823;
          break;
        case 4:
          g = 1e4;
          break;
        default:
          g = 5e3;
      }
      return g = _ + g, E = { id: Y++, callback: O, priorityLevel: E, startTime: _, expirationTime: g, sortIndex: -1 }, _ > c ? (E.sortIndex = _, z(R, E), m(A) === null && E === m(R) && (H ? (wt(Ge), Ge = -1) : H = !0, fe(_e, _ - c))) : (E.sortIndex = g, z(A, E), X || j || (X = !0, je(tt))), E;
    }, h.unstable_shouldYield = Xt, h.unstable_wrapCallback = function(E) {
      var O = te;
      return function() {
        var _ = te;
        te = O;
        try {
          return E.apply(this, arguments);
        } finally {
          te = _;
        }
      };
    };
  })(Oi)), Oi;
}
var Ia;
function Wf() {
  return Ia || (Ia = 1, zi.exports = $f()), zi.exports;
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
  var h = Ii(), z = Wf();
  function m(e) {
    for (var t = "https://reactjs.org/docs/error-decoder.html?invariant=" + e, n = 1; n < arguments.length; n++) t += "&args[]=" + encodeURIComponent(arguments[n]);
    return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
  }
  var ee = /* @__PURE__ */ new Set(), ne = {};
  function G(e, t) {
    F(e, t), F(e + "Capture", t);
  }
  function F(e, t) {
    for (ne[e] = t, e = 0; e < t.length; e++) ee.add(t[e]);
  }
  var D = !(typeof window > "u" || typeof window.document > "u" || typeof window.document.createElement > "u"), A = Object.prototype.hasOwnProperty, R = /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/, Y = {}, q = {};
  function te(e) {
    return A.call(q, e) ? !0 : A.call(Y, e) ? !1 : R.test(e) ? q[e] = !0 : (Y[e] = !0, !1);
  }
  function j(e, t, n, r) {
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
  function X(e, t, n, r) {
    if (t === null || typeof t > "u" || j(e, t, n, r)) return !0;
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
  function H(e, t, n, r, l, o, i) {
    this.acceptsBooleans = t === 2 || t === 3 || t === 4, this.attributeName = r, this.attributeNamespace = l, this.mustUseProperty = n, this.propertyName = e, this.type = t, this.sanitizeURL = o, this.removeEmptyString = i;
  }
  var Z = {};
  "children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(e) {
    Z[e] = new H(e, 0, !1, e, null, !1, !1);
  }), [["acceptCharset", "accept-charset"], ["className", "class"], ["htmlFor", "for"], ["httpEquiv", "http-equiv"]].forEach(function(e) {
    var t = e[0];
    Z[t] = new H(t, 1, !1, e[1], null, !1, !1);
  }), ["contentEditable", "draggable", "spellCheck", "value"].forEach(function(e) {
    Z[e] = new H(e, 2, !1, e.toLowerCase(), null, !1, !1);
  }), ["autoReverse", "externalResourcesRequired", "focusable", "preserveAlpha"].forEach(function(e) {
    Z[e] = new H(e, 2, !1, e, null, !1, !1);
  }), "allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(e) {
    Z[e] = new H(e, 3, !1, e.toLowerCase(), null, !1, !1);
  }), ["checked", "multiple", "muted", "selected"].forEach(function(e) {
    Z[e] = new H(e, 3, !0, e, null, !1, !1);
  }), ["capture", "download"].forEach(function(e) {
    Z[e] = new H(e, 4, !1, e, null, !1, !1);
  }), ["cols", "rows", "size", "span"].forEach(function(e) {
    Z[e] = new H(e, 6, !1, e, null, !1, !1);
  }), ["rowSpan", "start"].forEach(function(e) {
    Z[e] = new H(e, 5, !1, e.toLowerCase(), null, !1, !1);
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
    Z[t] = new H(t, 1, !1, e, null, !1, !1);
  }), "xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(e) {
    var t = e.replace(wt, ct);
    Z[t] = new H(t, 1, !1, e, "http://www.w3.org/1999/xlink", !1, !1);
  }), ["xml:base", "xml:lang", "xml:space"].forEach(function(e) {
    var t = e.replace(wt, ct);
    Z[t] = new H(t, 1, !1, e, "http://www.w3.org/XML/1998/namespace", !1, !1);
  }), ["tabIndex", "crossOrigin"].forEach(function(e) {
    Z[e] = new H(e, 1, !1, e.toLowerCase(), null, !1, !1);
  }), Z.xlinkHref = new H("xlinkHref", 1, !1, "xlink:href", "http://www.w3.org/1999/xlink", !0, !1), ["src", "href", "action", "formAction"].forEach(function(e) {
    Z[e] = new H(e, 1, !1, e.toLowerCase(), null, !0, !0);
  });
  function et(e, t, n, r) {
    var l = Z.hasOwnProperty(t) ? Z[t] : null;
    (l !== null ? l.type !== 0 : r || !(2 < t.length) || t[0] !== "o" && t[0] !== "O" || t[1] !== "n" && t[1] !== "N") && (X(t, n, l, r) && (n = null), r || l === null ? te(t) && (n === null ? e.removeAttribute(t) : e.setAttribute(t, "" + n)) : l.mustUseProperty ? e[l.propertyName] = n === null ? l.type === 3 ? !1 : "" : n : (t = l.attributeName, r = l.attributeNamespace, n === null ? e.removeAttribute(t) : (l = l.type, n = l === 3 || l === 4 && n === !0 ? "" : "" + n, r ? e.setAttributeNS(r, t, n) : e.setAttribute(t, n))));
  }
  var _e = h.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED, tt = Symbol.for("react.element"), Te = Symbol.for("react.portal"), Oe = Symbol.for("react.fragment"), Ge = Symbol.for("react.strict_mode"), Rt = Symbol.for("react.profiler"), St = Symbol.for("react.provider"), Xt = Symbol.for("react.context"), ft = Symbol.for("react.forward_ref"), Be = Symbol.for("react.suspense"), nt = Symbol.for("react.suspense_list"), dt = Symbol.for("react.memo"), je = Symbol.for("react.lazy"), fe = Symbol.for("react.offscreen"), E = Symbol.iterator;
  function O(e) {
    return e === null || typeof e != "object" ? null : (e = E && e[E] || e["@@iterator"], typeof e == "function" ? e : null);
  }
  var _ = Object.assign, c;
  function g(e) {
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
    return (e = e ? e.displayName || e.name : "") ? g(e) : "";
  }
  function W(e) {
    switch (e.tag) {
      case 5:
        return g(e.type);
      case 16:
        return g("Lazy");
      case 13:
        return g("Suspense");
      case 19:
        return g("SuspenseList");
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
  function Q(e) {
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
        return t = e.displayName || null, t !== null ? t : Q(e.type) || "Memo";
      case je:
        t = e._payload, e = e._init;
        try {
          return Q(e(t));
        } catch {
        }
    }
    return null;
  }
  function re(e) {
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
        return Q(t);
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
  function J(e) {
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
  function ue(e) {
    var t = e.type;
    return (e = e.nodeName) && e.toLowerCase() === "input" && (t === "checkbox" || t === "radio");
  }
  function He(e) {
    var t = ue(e) ? "checked" : "value", n = Object.getOwnPropertyDescriptor(e.constructor.prototype, t), r = "" + e[t];
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
    return e && (r = ue(e) ? e.checked ? "true" : "false" : e.value), e = r, e !== n ? (t.setValue(e), !0) : !1;
  }
  function Cr(e) {
    if (e = e || (typeof document < "u" ? document : void 0), typeof e > "u") return null;
    try {
      return e.activeElement || e.body;
    } catch {
      return e.body;
    }
  }
  function Il(e, t) {
    var n = t.checked;
    return _({}, t, { defaultChecked: void 0, defaultValue: void 0, value: void 0, checked: n ?? e._wrapperState.initialChecked });
  }
  function Fi(e, t) {
    var n = t.defaultValue == null ? "" : t.defaultValue, r = t.checked != null ? t.checked : t.defaultChecked;
    n = J(t.value != null ? t.value : n), e._wrapperState = { initialChecked: r, initialValue: n, controlled: t.type === "checkbox" || t.type === "radio" ? t.checked != null : t.value != null };
  }
  function Ai(e, t) {
    t = t.checked, t != null && et(e, "checked", t, !1);
  }
  function Dl(e, t) {
    Ai(e, t);
    var n = J(t.value), r = t.type;
    if (n != null) r === "number" ? (n === 0 && e.value === "" || e.value != n) && (e.value = "" + n) : e.value !== "" + n && (e.value = "" + n);
    else if (r === "submit" || r === "reset") {
      e.removeAttribute("value");
      return;
    }
    t.hasOwnProperty("value") ? Fl(e, t.type, n) : t.hasOwnProperty("defaultValue") && Fl(e, t.type, J(t.defaultValue)), t.checked == null && t.defaultChecked != null && (e.defaultChecked = !!t.defaultChecked);
  }
  function Ui(e, t, n) {
    if (t.hasOwnProperty("value") || t.hasOwnProperty("defaultValue")) {
      var r = t.type;
      if (!(r !== "submit" && r !== "reset" || t.value !== void 0 && t.value !== null)) return;
      t = "" + e._wrapperState.initialValue, n || t === e.value || (e.value = t), e.defaultValue = t;
    }
    n = e.name, n !== "" && (e.name = ""), e.defaultChecked = !!e._wrapperState.initialChecked, n !== "" && (e.name = n);
  }
  function Fl(e, t, n) {
    (t !== "number" || Cr(e.ownerDocument) !== e) && (n == null ? e.defaultValue = "" + e._wrapperState.initialValue : e.defaultValue !== "" + n && (e.defaultValue = "" + n));
  }
  var Dn = Array.isArray;
  function fn(e, t, n, r) {
    if (e = e.options, t) {
      t = {};
      for (var l = 0; l < n.length; l++) t["$" + n[l]] = !0;
      for (n = 0; n < e.length; n++) l = t.hasOwnProperty("$" + e[n].value), e[n].selected !== l && (e[n].selected = l), l && r && (e[n].defaultSelected = !0);
    } else {
      for (n = "" + J(n), t = null, l = 0; l < e.length; l++) {
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
    return _({}, t, { value: void 0, defaultValue: void 0, children: "" + e._wrapperState.initialValue });
  }
  function Vi(e, t) {
    var n = t.value;
    if (n == null) {
      if (n = t.children, t = t.defaultValue, n != null) {
        if (t != null) throw Error(m(92));
        if (Dn(n)) {
          if (1 < n.length) throw Error(m(93));
          n = n[0];
        }
        t = n;
      }
      t == null && (t = ""), n = t;
    }
    e._wrapperState = { initialValue: J(n) };
  }
  function Bi(e, t) {
    var n = J(t.value), r = J(t.defaultValue);
    n != null && (n = "" + n, n !== e.value && (e.value = n), t.defaultValue == null && e.defaultValue !== n && (e.defaultValue = n)), r != null && (e.defaultValue = "" + r);
  }
  function Hi(e) {
    var t = e.textContent;
    t === e._wrapperState.initialValue && t !== "" && t !== null && (e.value = t);
  }
  function $i(e) {
    switch (e) {
      case "svg":
        return "http://www.w3.org/2000/svg";
      case "math":
        return "http://www.w3.org/1998/Math/MathML";
      default:
        return "http://www.w3.org/1999/xhtml";
    }
  }
  function Ul(e, t) {
    return e == null || e === "http://www.w3.org/1999/xhtml" ? $i(t) : e === "http://www.w3.org/2000/svg" && t === "foreignObject" ? "http://www.w3.org/1999/xhtml" : e;
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
  var An = {
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
  }, $a = ["Webkit", "ms", "Moz", "O"];
  Object.keys(An).forEach(function(e) {
    $a.forEach(function(t) {
      t = t + e.charAt(0).toUpperCase() + e.substring(1), An[t] = An[e];
    });
  });
  function Qi(e, t, n) {
    return t == null || typeof t == "boolean" || t === "" ? "" : n || typeof t != "number" || t === 0 || An.hasOwnProperty(e) && An[e] ? ("" + t).trim() : t + "px";
  }
  function Ki(e, t) {
    e = e.style;
    for (var n in t) if (t.hasOwnProperty(n)) {
      var r = n.indexOf("--") === 0, l = Qi(n, t[n], r);
      n === "float" && (n = "cssFloat"), r ? e.setProperty(n, l) : e[n] = l;
    }
  }
  var Wa = _({ menuitem: !0 }, { area: !0, base: !0, br: !0, col: !0, embed: !0, hr: !0, img: !0, input: !0, keygen: !0, link: !0, meta: !0, param: !0, source: !0, track: !0, wbr: !0 });
  function Vl(e, t) {
    if (t) {
      if (Wa[e] && (t.children != null || t.dangerouslySetInnerHTML != null)) throw Error(m(137, e));
      if (t.dangerouslySetInnerHTML != null) {
        if (t.children != null) throw Error(m(60));
        if (typeof t.dangerouslySetInnerHTML != "object" || !("__html" in t.dangerouslySetInnerHTML)) throw Error(m(61));
      }
      if (t.style != null && typeof t.style != "object") throw Error(m(62));
    }
  }
  function Bl(e, t) {
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
  var Hl = null;
  function $l(e) {
    return e = e.target || e.srcElement || window, e.correspondingUseElement && (e = e.correspondingUseElement), e.nodeType === 3 ? e.parentNode : e;
  }
  var Wl = null, dn = null, pn = null;
  function Gi(e) {
    if (e = ir(e)) {
      if (typeof Wl != "function") throw Error(m(280));
      var t = e.stateNode;
      t && (t = Yr(t), Wl(e.stateNode, e.type, t));
    }
  }
  function Yi(e) {
    dn ? pn ? pn.push(e) : pn = [e] : dn = e;
  }
  function Xi() {
    if (dn) {
      var e = dn, t = pn;
      if (pn = dn = null, Gi(e), t) for (e = 0; e < t.length; e++) Gi(t[e]);
    }
  }
  function qi(e, t) {
    return e(t);
  }
  function Zi() {
  }
  var Ql = !1;
  function Ji(e, t, n) {
    if (Ql) return e(t, n);
    Ql = !0;
    try {
      return qi(e, t, n);
    } finally {
      Ql = !1, (dn !== null || pn !== null) && (Zi(), Xi());
    }
  }
  function Un(e, t) {
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
  var Kl = !1;
  if (D) try {
    var Vn = {};
    Object.defineProperty(Vn, "passive", { get: function() {
      Kl = !0;
    } }), window.addEventListener("test", Vn, Vn), window.removeEventListener("test", Vn, Vn);
  } catch {
    Kl = !1;
  }
  function Qa(e, t, n, r, l, o, i, u, s) {
    var p = Array.prototype.slice.call(arguments, 3);
    try {
      t.apply(n, p);
    } catch (y) {
      this.onError(y);
    }
  }
  var Bn = !1, Nr = null, Pr = !1, Gl = null, Ka = { onError: function(e) {
    Bn = !0, Nr = e;
  } };
  function Ga(e, t, n, r, l, o, i, u, s) {
    Bn = !1, Nr = null, Qa.apply(Ka, arguments);
  }
  function Ya(e, t, n, r, l, o, i, u, s) {
    if (Ga.apply(this, arguments), Bn) {
      if (Bn) {
        var p = Nr;
        Bn = !1, Nr = null;
      } else throw Error(m(198));
      Pr || (Pr = !0, Gl = p);
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
  function bi(e) {
    if (e.tag === 13) {
      var t = e.memoizedState;
      if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null) return t.dehydrated;
    }
    return null;
  }
  function eu(e) {
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
          if (o === n) return eu(l), e;
          if (o === r) return eu(l), t;
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
  function tu(e) {
    return e = Xa(e), e !== null ? nu(e) : null;
  }
  function nu(e) {
    if (e.tag === 5 || e.tag === 6) return e;
    for (e = e.child; e !== null; ) {
      var t = nu(e);
      if (t !== null) return t;
      e = e.sibling;
    }
    return null;
  }
  var ru = z.unstable_scheduleCallback, lu = z.unstable_cancelCallback, qa = z.unstable_shouldYield, Za = z.unstable_requestPaint, pe = z.unstable_now, Ja = z.unstable_getCurrentPriorityLevel, Yl = z.unstable_ImmediatePriority, ou = z.unstable_UserBlockingPriority, Mr = z.unstable_NormalPriority, ba = z.unstable_LowPriority, iu = z.unstable_IdlePriority, Rr = null, pt = null;
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
  function Hn(e) {
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
      u !== 0 ? r = Hn(u) : (o &= i, o !== 0 && (r = Hn(o)));
    } else i = n & ~l, i !== 0 ? r = Hn(i) : o !== 0 && (r = Hn(o));
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
  function Xl(e) {
    return e = e.pendingLanes & -1073741825, e !== 0 ? e : e & 1073741824 ? 1073741824 : 0;
  }
  function uu() {
    var e = Tr;
    return Tr <<= 1, (Tr & 4194240) === 0 && (Tr = 64), e;
  }
  function ql(e) {
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
  function Zl(e, t) {
    var n = e.entangledLanes |= t;
    for (e = e.entanglements; n; ) {
      var r = 31 - rt(n), l = 1 << r;
      l & t | e[r] & t && (e[r] |= t), n &= ~l;
    }
  }
  var b = 0;
  function su(e) {
    return e &= -e, 1 < e ? 4 < e ? (e & 268435455) !== 0 ? 16 : 536870912 : 4 : 1;
  }
  var au, Jl, cu, fu, du, bl = !1, Or = [], Tt = null, Lt = null, zt = null, Wn = /* @__PURE__ */ new Map(), Qn = /* @__PURE__ */ new Map(), Ot = [], uc = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(" ");
  function pu(e, t) {
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
        Wn.delete(t.pointerId);
        break;
      case "gotpointercapture":
      case "lostpointercapture":
        Qn.delete(t.pointerId);
    }
  }
  function Kn(e, t, n, r, l, o) {
    return e === null || e.nativeEvent !== o ? (e = { blockedOn: t, domEventName: n, eventSystemFlags: r, nativeEvent: o, targetContainers: [l] }, t !== null && (t = ir(t), t !== null && Jl(t)), e) : (e.eventSystemFlags |= r, t = e.targetContainers, l !== null && t.indexOf(l) === -1 && t.push(l), e);
  }
  function sc(e, t, n, r, l) {
    switch (t) {
      case "focusin":
        return Tt = Kn(Tt, e, t, n, r, l), !0;
      case "dragenter":
        return Lt = Kn(Lt, e, t, n, r, l), !0;
      case "mouseover":
        return zt = Kn(zt, e, t, n, r, l), !0;
      case "pointerover":
        var o = l.pointerId;
        return Wn.set(o, Kn(Wn.get(o) || null, e, t, n, r, l)), !0;
      case "gotpointercapture":
        return o = l.pointerId, Qn.set(o, Kn(Qn.get(o) || null, e, t, n, r, l)), !0;
    }
    return !1;
  }
  function mu(e) {
    var t = Zt(e.target);
    if (t !== null) {
      var n = qt(t);
      if (n !== null) {
        if (t = n.tag, t === 13) {
          if (t = bi(n), t !== null) {
            e.blockedOn = t, du(e.priority, function() {
              cu(n);
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
      var n = to(e.domEventName, e.eventSystemFlags, t[0], e.nativeEvent);
      if (n === null) {
        n = e.nativeEvent;
        var r = new n.constructor(n.type, n);
        Hl = r, n.target.dispatchEvent(r), Hl = null;
      } else return t = ir(n), t !== null && Jl(t), e.blockedOn = n, !1;
      t.shift();
    }
    return !0;
  }
  function hu(e, t, n) {
    jr(e) && n.delete(t);
  }
  function ac() {
    bl = !1, Tt !== null && jr(Tt) && (Tt = null), Lt !== null && jr(Lt) && (Lt = null), zt !== null && jr(zt) && (zt = null), Wn.forEach(hu), Qn.forEach(hu);
  }
  function Gn(e, t) {
    e.blockedOn === t && (e.blockedOn = null, bl || (bl = !0, z.unstable_scheduleCallback(z.unstable_NormalPriority, ac)));
  }
  function Yn(e) {
    function t(l) {
      return Gn(l, e);
    }
    if (0 < Or.length) {
      Gn(Or[0], e);
      for (var n = 1; n < Or.length; n++) {
        var r = Or[n];
        r.blockedOn === e && (r.blockedOn = null);
      }
    }
    for (Tt !== null && Gn(Tt, e), Lt !== null && Gn(Lt, e), zt !== null && Gn(zt, e), Wn.forEach(t), Qn.forEach(t), n = 0; n < Ot.length; n++) r = Ot[n], r.blockedOn === e && (r.blockedOn = null);
    for (; 0 < Ot.length && (n = Ot[0], n.blockedOn === null); ) mu(n), n.blockedOn === null && Ot.shift();
  }
  var mn = _e.ReactCurrentBatchConfig, Ir = !0;
  function cc(e, t, n, r) {
    var l = b, o = mn.transition;
    mn.transition = null;
    try {
      b = 1, eo(e, t, n, r);
    } finally {
      b = l, mn.transition = o;
    }
  }
  function fc(e, t, n, r) {
    var l = b, o = mn.transition;
    mn.transition = null;
    try {
      b = 4, eo(e, t, n, r);
    } finally {
      b = l, mn.transition = o;
    }
  }
  function eo(e, t, n, r) {
    if (Ir) {
      var l = to(e, t, n, r);
      if (l === null) wo(e, t, r, Dr, n), pu(e, r);
      else if (sc(l, e, t, n, r)) r.stopPropagation();
      else if (pu(e, r), t & 4 && -1 < uc.indexOf(e)) {
        for (; l !== null; ) {
          var o = ir(l);
          if (o !== null && au(o), o = to(e, t, n, r), o === null && wo(e, t, r, Dr, n), o === l) break;
          l = o;
        }
        l !== null && r.stopPropagation();
      } else wo(e, t, r, null, n);
    }
  }
  var Dr = null;
  function to(e, t, n, r) {
    if (Dr = null, e = $l(r), e = Zt(e), e !== null) if (t = qt(e), t === null) e = null;
    else if (n = t.tag, n === 13) {
      if (e = bi(t), e !== null) return e;
      e = null;
    } else if (n === 3) {
      if (t.stateNode.current.memoizedState.isDehydrated) return t.tag === 3 ? t.stateNode.containerInfo : null;
      e = null;
    } else t !== e && (e = null);
    return Dr = e, null;
  }
  function vu(e) {
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
          case Yl:
            return 1;
          case ou:
            return 4;
          case Mr:
          case ba:
            return 16;
          case iu:
            return 536870912;
          default:
            return 16;
        }
      default:
        return 16;
    }
  }
  var jt = null, no = null, Fr = null;
  function gu() {
    if (Fr) return Fr;
    var e, t = no, n = t.length, r, l = "value" in jt ? jt.value : jt.textContent, o = l.length;
    for (e = 0; e < n && t[e] === l[e]; e++) ;
    var i = n - e;
    for (r = 1; r <= i && t[n - r] === l[o - r]; r++) ;
    return Fr = l.slice(e, 1 < r ? 1 - r : void 0);
  }
  function Ar(e) {
    var t = e.keyCode;
    return "charCode" in e ? (e = e.charCode, e === 0 && t === 13 && (e = 13)) : e = t, e === 10 && (e = 13), 32 <= e || e === 13 ? e : 0;
  }
  function Ur() {
    return !0;
  }
  function yu() {
    return !1;
  }
  function $e(e) {
    function t(n, r, l, o, i) {
      this._reactName = n, this._targetInst = l, this.type = r, this.nativeEvent = o, this.target = i, this.currentTarget = null;
      for (var u in e) e.hasOwnProperty(u) && (n = e[u], this[u] = n ? n(o) : o[u]);
      return this.isDefaultPrevented = (o.defaultPrevented != null ? o.defaultPrevented : o.returnValue === !1) ? Ur : yu, this.isPropagationStopped = yu, this;
    }
    return _(t.prototype, { preventDefault: function() {
      this.defaultPrevented = !0;
      var n = this.nativeEvent;
      n && (n.preventDefault ? n.preventDefault() : typeof n.returnValue != "unknown" && (n.returnValue = !1), this.isDefaultPrevented = Ur);
    }, stopPropagation: function() {
      var n = this.nativeEvent;
      n && (n.stopPropagation ? n.stopPropagation() : typeof n.cancelBubble != "unknown" && (n.cancelBubble = !0), this.isPropagationStopped = Ur);
    }, persist: function() {
    }, isPersistent: Ur }), t;
  }
  var hn = { eventPhase: 0, bubbles: 0, cancelable: 0, timeStamp: function(e) {
    return e.timeStamp || Date.now();
  }, defaultPrevented: 0, isTrusted: 0 }, ro = $e(hn), Xn = _({}, hn, { view: 0, detail: 0 }), dc = $e(Xn), lo, oo, qn, Vr = _({}, Xn, { screenX: 0, screenY: 0, clientX: 0, clientY: 0, pageX: 0, pageY: 0, ctrlKey: 0, shiftKey: 0, altKey: 0, metaKey: 0, getModifierState: uo, button: 0, buttons: 0, relatedTarget: function(e) {
    return e.relatedTarget === void 0 ? e.fromElement === e.srcElement ? e.toElement : e.fromElement : e.relatedTarget;
  }, movementX: function(e) {
    return "movementX" in e ? e.movementX : (e !== qn && (qn && e.type === "mousemove" ? (lo = e.screenX - qn.screenX, oo = e.screenY - qn.screenY) : oo = lo = 0, qn = e), lo);
  }, movementY: function(e) {
    return "movementY" in e ? e.movementY : oo;
  } }), wu = $e(Vr), pc = _({}, Vr, { dataTransfer: 0 }), mc = $e(pc), hc = _({}, Xn, { relatedTarget: 0 }), io = $e(hc), vc = _({}, hn, { animationName: 0, elapsedTime: 0, pseudoElement: 0 }), gc = $e(vc), yc = _({}, hn, { clipboardData: function(e) {
    return "clipboardData" in e ? e.clipboardData : window.clipboardData;
  } }), wc = $e(yc), Sc = _({}, hn, { data: 0 }), Su = $e(Sc), kc = {
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
  function uo() {
    return Cc;
  }
  var _c = _({}, Xn, { key: function(e) {
    if (e.key) {
      var t = kc[e.key] || e.key;
      if (t !== "Unidentified") return t;
    }
    return e.type === "keypress" ? (e = Ar(e), e === 13 ? "Enter" : String.fromCharCode(e)) : e.type === "keydown" || e.type === "keyup" ? Ec[e.keyCode] || "Unidentified" : "";
  }, code: 0, location: 0, ctrlKey: 0, shiftKey: 0, altKey: 0, metaKey: 0, repeat: 0, locale: 0, getModifierState: uo, charCode: function(e) {
    return e.type === "keypress" ? Ar(e) : 0;
  }, keyCode: function(e) {
    return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
  }, which: function(e) {
    return e.type === "keypress" ? Ar(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
  } }), Nc = $e(_c), Pc = _({}, Vr, { pointerId: 0, width: 0, height: 0, pressure: 0, tangentialPressure: 0, tiltX: 0, tiltY: 0, twist: 0, pointerType: 0, isPrimary: 0 }), ku = $e(Pc), Mc = _({}, Xn, { touches: 0, targetTouches: 0, changedTouches: 0, altKey: 0, metaKey: 0, ctrlKey: 0, shiftKey: 0, getModifierState: uo }), Rc = $e(Mc), Tc = _({}, hn, { propertyName: 0, elapsedTime: 0, pseudoElement: 0 }), Lc = $e(Tc), zc = _({}, Vr, {
    deltaX: function(e) {
      return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
    },
    deltaY: function(e) {
      return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
    },
    deltaZ: 0,
    deltaMode: 0
  }), Oc = $e(zc), jc = [9, 13, 27, 32], so = D && "CompositionEvent" in window, Zn = null;
  D && "documentMode" in document && (Zn = document.documentMode);
  var Ic = D && "TextEvent" in window && !Zn, Eu = D && (!so || Zn && 8 < Zn && 11 >= Zn), xu = " ", Cu = !1;
  function _u(e, t) {
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
  function Nu(e) {
    return e = e.detail, typeof e == "object" && "data" in e ? e.data : null;
  }
  var vn = !1;
  function Dc(e, t) {
    switch (e) {
      case "compositionend":
        return Nu(t);
      case "keypress":
        return t.which !== 32 ? null : (Cu = !0, xu);
      case "textInput":
        return e = t.data, e === xu && Cu ? null : e;
      default:
        return null;
    }
  }
  function Fc(e, t) {
    if (vn) return e === "compositionend" || !so && _u(e, t) ? (e = gu(), Fr = no = jt = null, vn = !1, e) : null;
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
        return Eu && t.locale !== "ko" ? null : t.data;
      default:
        return null;
    }
  }
  var Ac = { color: !0, date: !0, datetime: !0, "datetime-local": !0, email: !0, month: !0, number: !0, password: !0, range: !0, search: !0, tel: !0, text: !0, time: !0, url: !0, week: !0 };
  function Pu(e) {
    var t = e && e.nodeName && e.nodeName.toLowerCase();
    return t === "input" ? !!Ac[e.type] : t === "textarea";
  }
  function Mu(e, t, n, r) {
    Yi(r), t = Qr(t, "onChange"), 0 < t.length && (n = new ro("onChange", "change", null, n, r), e.push({ event: n, listeners: t }));
  }
  var Jn = null, bn = null;
  function Uc(e) {
    Ku(e, 0);
  }
  function Br(e) {
    var t = kn(e);
    if (Di(t)) return e;
  }
  function Vc(e, t) {
    if (e === "change") return t;
  }
  var Ru = !1;
  if (D) {
    var ao;
    if (D) {
      var co = "oninput" in document;
      if (!co) {
        var Tu = document.createElement("div");
        Tu.setAttribute("oninput", "return;"), co = typeof Tu.oninput == "function";
      }
      ao = co;
    } else ao = !1;
    Ru = ao && (!document.documentMode || 9 < document.documentMode);
  }
  function Lu() {
    Jn && (Jn.detachEvent("onpropertychange", zu), bn = Jn = null);
  }
  function zu(e) {
    if (e.propertyName === "value" && Br(bn)) {
      var t = [];
      Mu(t, bn, e, $l(e)), Ji(Uc, t);
    }
  }
  function Bc(e, t, n) {
    e === "focusin" ? (Lu(), Jn = t, bn = n, Jn.attachEvent("onpropertychange", zu)) : e === "focusout" && Lu();
  }
  function Hc(e) {
    if (e === "selectionchange" || e === "keyup" || e === "keydown") return Br(bn);
  }
  function $c(e, t) {
    if (e === "click") return Br(t);
  }
  function Wc(e, t) {
    if (e === "input" || e === "change") return Br(t);
  }
  function Qc(e, t) {
    return e === t && (e !== 0 || 1 / e === 1 / t) || e !== e && t !== t;
  }
  var lt = typeof Object.is == "function" ? Object.is : Qc;
  function er(e, t) {
    if (lt(e, t)) return !0;
    if (typeof e != "object" || e === null || typeof t != "object" || t === null) return !1;
    var n = Object.keys(e), r = Object.keys(t);
    if (n.length !== r.length) return !1;
    for (r = 0; r < n.length; r++) {
      var l = n[r];
      if (!A.call(t, l) || !lt(e[l], t[l])) return !1;
    }
    return !0;
  }
  function Ou(e) {
    for (; e && e.firstChild; ) e = e.firstChild;
    return e;
  }
  function ju(e, t) {
    var n = Ou(e);
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
      n = Ou(n);
    }
  }
  function Iu(e, t) {
    return e && t ? e === t ? !0 : e && e.nodeType === 3 ? !1 : t && t.nodeType === 3 ? Iu(e, t.parentNode) : "contains" in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1 : !1;
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
  function fo(e) {
    var t = e && e.nodeName && e.nodeName.toLowerCase();
    return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true");
  }
  function Kc(e) {
    var t = Du(), n = e.focusedElem, r = e.selectionRange;
    if (t !== n && n && n.ownerDocument && Iu(n.ownerDocument.documentElement, n)) {
      if (r !== null && fo(n)) {
        if (t = r.start, e = r.end, e === void 0 && (e = t), "selectionStart" in n) n.selectionStart = t, n.selectionEnd = Math.min(e, n.value.length);
        else if (e = (t = n.ownerDocument || document) && t.defaultView || window, e.getSelection) {
          e = e.getSelection();
          var l = n.textContent.length, o = Math.min(r.start, l);
          r = r.end === void 0 ? o : Math.min(r.end, l), !e.extend && o > r && (l = r, r = o, o = l), l = ju(n, o);
          var i = ju(
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
  var Gc = D && "documentMode" in document && 11 >= document.documentMode, gn = null, po = null, tr = null, mo = !1;
  function Fu(e, t, n) {
    var r = n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
    mo || gn == null || gn !== Cr(r) || (r = gn, "selectionStart" in r && fo(r) ? r = { start: r.selectionStart, end: r.selectionEnd } : (r = (r.ownerDocument && r.ownerDocument.defaultView || window).getSelection(), r = { anchorNode: r.anchorNode, anchorOffset: r.anchorOffset, focusNode: r.focusNode, focusOffset: r.focusOffset }), tr && er(tr, r) || (tr = r, r = Qr(po, "onSelect"), 0 < r.length && (t = new ro("onSelect", "select", null, t, n), e.push({ event: t, listeners: r }), t.target = gn)));
  }
  function Hr(e, t) {
    var n = {};
    return n[e.toLowerCase()] = t.toLowerCase(), n["Webkit" + e] = "webkit" + t, n["Moz" + e] = "moz" + t, n;
  }
  var yn = { animationend: Hr("Animation", "AnimationEnd"), animationiteration: Hr("Animation", "AnimationIteration"), animationstart: Hr("Animation", "AnimationStart"), transitionend: Hr("Transition", "TransitionEnd") }, ho = {}, Au = {};
  D && (Au = document.createElement("div").style, "AnimationEvent" in window || (delete yn.animationend.animation, delete yn.animationiteration.animation, delete yn.animationstart.animation), "TransitionEvent" in window || delete yn.transitionend.transition);
  function $r(e) {
    if (ho[e]) return ho[e];
    if (!yn[e]) return e;
    var t = yn[e], n;
    for (n in t) if (t.hasOwnProperty(n) && n in Au) return ho[e] = t[n];
    return e;
  }
  var Uu = $r("animationend"), Vu = $r("animationiteration"), Bu = $r("animationstart"), Hu = $r("transitionend"), $u = /* @__PURE__ */ new Map(), Wu = "abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
  function It(e, t) {
    $u.set(e, t), G(t, [e]);
  }
  for (var vo = 0; vo < Wu.length; vo++) {
    var go = Wu[vo], Yc = go.toLowerCase(), Xc = go[0].toUpperCase() + go.slice(1);
    It(Yc, "on" + Xc);
  }
  It(Uu, "onAnimationEnd"), It(Vu, "onAnimationIteration"), It(Bu, "onAnimationStart"), It("dblclick", "onDoubleClick"), It("focusin", "onFocus"), It("focusout", "onBlur"), It(Hu, "onTransitionEnd"), F("onMouseEnter", ["mouseout", "mouseover"]), F("onMouseLeave", ["mouseout", "mouseover"]), F("onPointerEnter", ["pointerout", "pointerover"]), F("onPointerLeave", ["pointerout", "pointerover"]), G("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" ")), G("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")), G("onBeforeInput", ["compositionend", "keypress", "textInput", "paste"]), G("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" ")), G("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" ")), G("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
  var nr = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), qc = new Set("cancel close invalid load scroll toggle".split(" ").concat(nr));
  function Qu(e, t, n) {
    var r = e.type || "unknown-event";
    e.currentTarget = n, Ya(r, t, void 0, e), e.currentTarget = null;
  }
  function Ku(e, t) {
    t = (t & 4) !== 0;
    for (var n = 0; n < e.length; n++) {
      var r = e[n], l = r.event;
      r = r.listeners;
      e: {
        var o = void 0;
        if (t) for (var i = r.length - 1; 0 <= i; i--) {
          var u = r[i], s = u.instance, p = u.currentTarget;
          if (u = u.listener, s !== o && l.isPropagationStopped()) break e;
          Qu(l, u, p), o = s;
        }
        else for (i = 0; i < r.length; i++) {
          if (u = r[i], s = u.instance, p = u.currentTarget, u = u.listener, s !== o && l.isPropagationStopped()) break e;
          Qu(l, u, p), o = s;
        }
      }
    }
    if (Pr) throw e = Gl, Pr = !1, Gl = null, e;
  }
  function oe(e, t) {
    var n = t[_o];
    n === void 0 && (n = t[_o] = /* @__PURE__ */ new Set());
    var r = e + "__bubble";
    n.has(r) || (Gu(t, e, 2, !1), n.add(r));
  }
  function yo(e, t, n) {
    var r = 0;
    t && (r |= 4), Gu(n, e, r, t);
  }
  var Wr = "_reactListening" + Math.random().toString(36).slice(2);
  function rr(e) {
    if (!e[Wr]) {
      e[Wr] = !0, ee.forEach(function(n) {
        n !== "selectionchange" && (qc.has(n) || yo(n, !1, e), yo(n, !0, e));
      });
      var t = e.nodeType === 9 ? e : e.ownerDocument;
      t === null || t[Wr] || (t[Wr] = !0, yo("selectionchange", !1, t));
    }
  }
  function Gu(e, t, n, r) {
    switch (vu(t)) {
      case 1:
        var l = cc;
        break;
      case 4:
        l = fc;
        break;
      default:
        l = eo;
    }
    n = l.bind(null, t, n, e), l = void 0, !Kl || t !== "touchstart" && t !== "touchmove" && t !== "wheel" || (l = !0), r ? l !== void 0 ? e.addEventListener(t, n, { capture: !0, passive: l }) : e.addEventListener(t, n, !0) : l !== void 0 ? e.addEventListener(t, n, { passive: l }) : e.addEventListener(t, n, !1);
  }
  function wo(e, t, n, r, l) {
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
    Ji(function() {
      var p = o, y = $l(n), S = [];
      e: {
        var v = $u.get(e);
        if (v !== void 0) {
          var x = ro, N = e;
          switch (e) {
            case "keypress":
              if (Ar(n) === 0) break e;
            case "keydown":
            case "keyup":
              x = Nc;
              break;
            case "focusin":
              N = "focus", x = io;
              break;
            case "focusout":
              N = "blur", x = io;
              break;
            case "beforeblur":
            case "afterblur":
              x = io;
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
              x = wu;
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
            case Uu:
            case Vu:
            case Bu:
              x = gc;
              break;
            case Hu:
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
              x = ku;
          }
          var P = (t & 4) !== 0, me = !P && e === "scroll", f = P ? v !== null ? v + "Capture" : null : v;
          P = [];
          for (var a = p, d; a !== null; ) {
            d = a;
            var k = d.stateNode;
            if (d.tag === 5 && k !== null && (d = k, f !== null && (k = Un(a, f), k != null && P.push(lr(a, k, d)))), me) break;
            a = a.return;
          }
          0 < P.length && (v = new x(v, N, null, n, y), S.push({ event: v, listeners: P }));
        }
      }
      if ((t & 7) === 0) {
        e: {
          if (v = e === "mouseover" || e === "pointerover", x = e === "mouseout" || e === "pointerout", v && n !== Hl && (N = n.relatedTarget || n.fromElement) && (Zt(N) || N[kt])) break e;
          if ((x || v) && (v = y.window === y ? y : (v = y.ownerDocument) ? v.defaultView || v.parentWindow : window, x ? (N = n.relatedTarget || n.toElement, x = p, N = N ? Zt(N) : null, N !== null && (me = qt(N), N !== me || N.tag !== 5 && N.tag !== 6) && (N = null)) : (x = null, N = p), x !== N)) {
            if (P = wu, k = "onMouseLeave", f = "onMouseEnter", a = "mouse", (e === "pointerout" || e === "pointerover") && (P = ku, k = "onPointerLeave", f = "onPointerEnter", a = "pointer"), me = x == null ? v : kn(x), d = N == null ? v : kn(N), v = new P(k, a + "leave", x, n, y), v.target = me, v.relatedTarget = d, k = null, Zt(y) === p && (P = new P(f, a + "enter", N, n, y), P.target = d, P.relatedTarget = me, k = P), me = k, x && N) t: {
              for (P = x, f = N, a = 0, d = P; d; d = wn(d)) a++;
              for (d = 0, k = f; k; k = wn(k)) d++;
              for (; 0 < a - d; ) P = wn(P), a--;
              for (; 0 < d - a; ) f = wn(f), d--;
              for (; a--; ) {
                if (P === f || f !== null && P === f.alternate) break t;
                P = wn(P), f = wn(f);
              }
              P = null;
            }
            else P = null;
            x !== null && Yu(S, v, x, P, !1), N !== null && me !== null && Yu(S, me, N, P, !0);
          }
        }
        e: {
          if (v = p ? kn(p) : window, x = v.nodeName && v.nodeName.toLowerCase(), x === "select" || x === "input" && v.type === "file") var M = Vc;
          else if (Pu(v)) if (Ru) M = Wc;
          else {
            M = Hc;
            var T = Bc;
          }
          else (x = v.nodeName) && x.toLowerCase() === "input" && (v.type === "checkbox" || v.type === "radio") && (M = $c);
          if (M && (M = M(e, p))) {
            Mu(S, M, n, y);
            break e;
          }
          T && T(e, v, p), e === "focusout" && (T = v._wrapperState) && T.controlled && v.type === "number" && Fl(v, "number", v.value);
        }
        switch (T = p ? kn(p) : window, e) {
          case "focusin":
            (Pu(T) || T.contentEditable === "true") && (gn = T, po = p, tr = null);
            break;
          case "focusout":
            tr = po = gn = null;
            break;
          case "mousedown":
            mo = !0;
            break;
          case "contextmenu":
          case "mouseup":
          case "dragend":
            mo = !1, Fu(S, n, y);
            break;
          case "selectionchange":
            if (Gc) break;
          case "keydown":
          case "keyup":
            Fu(S, n, y);
        }
        var L;
        if (so) e: {
          switch (e) {
            case "compositionstart":
              var I = "onCompositionStart";
              break e;
            case "compositionend":
              I = "onCompositionEnd";
              break e;
            case "compositionupdate":
              I = "onCompositionUpdate";
              break e;
          }
          I = void 0;
        }
        else vn ? _u(e, n) && (I = "onCompositionEnd") : e === "keydown" && n.keyCode === 229 && (I = "onCompositionStart");
        I && (Eu && n.locale !== "ko" && (vn || I !== "onCompositionStart" ? I === "onCompositionEnd" && vn && (L = gu()) : (jt = y, no = "value" in jt ? jt.value : jt.textContent, vn = !0)), T = Qr(p, I), 0 < T.length && (I = new Su(I, e, null, n, y), S.push({ event: I, listeners: T }), L ? I.data = L : (L = Nu(n), L !== null && (I.data = L)))), (L = Ic ? Dc(e, n) : Fc(e, n)) && (p = Qr(p, "onBeforeInput"), 0 < p.length && (y = new Su("onBeforeInput", "beforeinput", null, n, y), S.push({ event: y, listeners: p }), y.data = L));
      }
      Ku(S, t);
    });
  }
  function lr(e, t, n) {
    return { instance: e, listener: t, currentTarget: n };
  }
  function Qr(e, t) {
    for (var n = t + "Capture", r = []; e !== null; ) {
      var l = e, o = l.stateNode;
      l.tag === 5 && o !== null && (l = o, o = Un(e, n), o != null && r.unshift(lr(e, o, l)), o = Un(e, t), o != null && r.push(lr(e, o, l))), e = e.return;
    }
    return r;
  }
  function wn(e) {
    if (e === null) return null;
    do
      e = e.return;
    while (e && e.tag !== 5);
    return e || null;
  }
  function Yu(e, t, n, r, l) {
    for (var o = t._reactName, i = []; n !== null && n !== r; ) {
      var u = n, s = u.alternate, p = u.stateNode;
      if (s !== null && s === r) break;
      u.tag === 5 && p !== null && (u = p, l ? (s = Un(n, o), s != null && i.unshift(lr(n, s, u))) : l || (s = Un(n, o), s != null && i.push(lr(n, s, u)))), n = n.return;
    }
    i.length !== 0 && e.push({ event: t, listeners: i });
  }
  var Zc = /\r\n?/g, Jc = /\u0000|\uFFFD/g;
  function Xu(e) {
    return (typeof e == "string" ? e : "" + e).replace(Zc, `
`).replace(Jc, "");
  }
  function Kr(e, t, n) {
    if (t = Xu(t), Xu(e) !== t && n) throw Error(m(425));
  }
  function Gr() {
  }
  var So = null, ko = null;
  function Eo(e, t) {
    return e === "textarea" || e === "noscript" || typeof t.children == "string" || typeof t.children == "number" || typeof t.dangerouslySetInnerHTML == "object" && t.dangerouslySetInnerHTML !== null && t.dangerouslySetInnerHTML.__html != null;
  }
  var xo = typeof setTimeout == "function" ? setTimeout : void 0, bc = typeof clearTimeout == "function" ? clearTimeout : void 0, qu = typeof Promise == "function" ? Promise : void 0, ef = typeof queueMicrotask == "function" ? queueMicrotask : typeof qu < "u" ? function(e) {
    return qu.resolve(null).then(e).catch(tf);
  } : xo;
  function tf(e) {
    setTimeout(function() {
      throw e;
    });
  }
  function Co(e, t) {
    var n = t, r = 0;
    do {
      var l = n.nextSibling;
      if (e.removeChild(n), l && l.nodeType === 8) if (n = l.data, n === "/$") {
        if (r === 0) {
          e.removeChild(l), Yn(t);
          return;
        }
        r--;
      } else n !== "$" && n !== "$?" && n !== "$!" || r++;
      n = l;
    } while (n);
    Yn(t);
  }
  function Dt(e) {
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
  function Zu(e) {
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
  var Sn = Math.random().toString(36).slice(2), mt = "__reactFiber$" + Sn, or = "__reactProps$" + Sn, kt = "__reactContainer$" + Sn, _o = "__reactEvents$" + Sn, nf = "__reactListeners$" + Sn, rf = "__reactHandles$" + Sn;
  function Zt(e) {
    var t = e[mt];
    if (t) return t;
    for (var n = e.parentNode; n; ) {
      if (t = n[kt] || n[mt]) {
        if (n = t.alternate, t.child !== null || n !== null && n.child !== null) for (e = Zu(e); e !== null; ) {
          if (n = e[mt]) return n;
          e = Zu(e);
        }
        return t;
      }
      e = n, n = e.parentNode;
    }
    return null;
  }
  function ir(e) {
    return e = e[mt] || e[kt], !e || e.tag !== 5 && e.tag !== 6 && e.tag !== 13 && e.tag !== 3 ? null : e;
  }
  function kn(e) {
    if (e.tag === 5 || e.tag === 6) return e.stateNode;
    throw Error(m(33));
  }
  function Yr(e) {
    return e[or] || null;
  }
  var No = [], En = -1;
  function Ft(e) {
    return { current: e };
  }
  function ie(e) {
    0 > En || (e.current = No[En], No[En] = null, En--);
  }
  function le(e, t) {
    En++, No[En] = e.current, e.current = t;
  }
  var At = {}, Ne = Ft(At), Ie = Ft(!1), Jt = At;
  function xn(e, t) {
    var n = e.type.contextTypes;
    if (!n) return At;
    var r = e.stateNode;
    if (r && r.__reactInternalMemoizedUnmaskedChildContext === t) return r.__reactInternalMemoizedMaskedChildContext;
    var l = {}, o;
    for (o in n) l[o] = t[o];
    return r && (e = e.stateNode, e.__reactInternalMemoizedUnmaskedChildContext = t, e.__reactInternalMemoizedMaskedChildContext = l), l;
  }
  function De(e) {
    return e = e.childContextTypes, e != null;
  }
  function Xr() {
    ie(Ie), ie(Ne);
  }
  function Ju(e, t, n) {
    if (Ne.current !== At) throw Error(m(168));
    le(Ne, t), le(Ie, n);
  }
  function bu(e, t, n) {
    var r = e.stateNode;
    if (t = t.childContextTypes, typeof r.getChildContext != "function") return n;
    r = r.getChildContext();
    for (var l in r) if (!(l in t)) throw Error(m(108, re(e) || "Unknown", l));
    return _({}, n, r);
  }
  function qr(e) {
    return e = (e = e.stateNode) && e.__reactInternalMemoizedMergedChildContext || At, Jt = Ne.current, le(Ne, e), le(Ie, Ie.current), !0;
  }
  function es(e, t, n) {
    var r = e.stateNode;
    if (!r) throw Error(m(169));
    n ? (e = bu(e, t, Jt), r.__reactInternalMemoizedMergedChildContext = e, ie(Ie), ie(Ne), le(Ne, e)) : ie(Ie), le(Ie, n);
  }
  var Et = null, Zr = !1, Po = !1;
  function ts(e) {
    Et === null ? Et = [e] : Et.push(e);
  }
  function lf(e) {
    Zr = !0, ts(e);
  }
  function Ut() {
    if (!Po && Et !== null) {
      Po = !0;
      var e = 0, t = b;
      try {
        var n = Et;
        for (b = 1; e < n.length; e++) {
          var r = n[e];
          do
            r = r(!0);
          while (r !== null);
        }
        Et = null, Zr = !1;
      } catch (l) {
        throw Et !== null && (Et = Et.slice(e + 1)), ru(Yl, Ut), l;
      } finally {
        b = t, Po = !1;
      }
    }
    return null;
  }
  var Cn = [], _n = 0, Jr = null, br = 0, Ye = [], Xe = 0, bt = null, xt = 1, Ct = "";
  function en(e, t) {
    Cn[_n++] = br, Cn[_n++] = Jr, Jr = e, br = t;
  }
  function ns(e, t, n) {
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
  function Mo(e) {
    e.return !== null && (en(e, 1), ns(e, 1, 0));
  }
  function Ro(e) {
    for (; e === Jr; ) Jr = Cn[--_n], Cn[_n] = null, br = Cn[--_n], Cn[_n] = null;
    for (; e === bt; ) bt = Ye[--Xe], Ye[Xe] = null, Ct = Ye[--Xe], Ye[Xe] = null, xt = Ye[--Xe], Ye[Xe] = null;
  }
  var We = null, Qe = null, se = !1, ot = null;
  function rs(e, t) {
    var n = be(5, null, null, 0);
    n.elementType = "DELETED", n.stateNode = t, n.return = e, t = e.deletions, t === null ? (e.deletions = [n], e.flags |= 16) : t.push(n);
  }
  function ls(e, t) {
    switch (e.tag) {
      case 5:
        var n = e.type;
        return t = t.nodeType !== 1 || n.toLowerCase() !== t.nodeName.toLowerCase() ? null : t, t !== null ? (e.stateNode = t, We = e, Qe = Dt(t.firstChild), !0) : !1;
      case 6:
        return t = e.pendingProps === "" || t.nodeType !== 3 ? null : t, t !== null ? (e.stateNode = t, We = e, Qe = null, !0) : !1;
      case 13:
        return t = t.nodeType !== 8 ? null : t, t !== null ? (n = bt !== null ? { id: xt, overflow: Ct } : null, e.memoizedState = { dehydrated: t, treeContext: n, retryLane: 1073741824 }, n = be(18, null, null, 0), n.stateNode = t, n.return = e, e.child = n, We = e, Qe = null, !0) : !1;
      default:
        return !1;
    }
  }
  function To(e) {
    return (e.mode & 1) !== 0 && (e.flags & 128) === 0;
  }
  function Lo(e) {
    if (se) {
      var t = Qe;
      if (t) {
        var n = t;
        if (!ls(e, t)) {
          if (To(e)) throw Error(m(418));
          t = Dt(n.nextSibling);
          var r = We;
          t && ls(e, t) ? rs(r, n) : (e.flags = e.flags & -4097 | 2, se = !1, We = e);
        }
      } else {
        if (To(e)) throw Error(m(418));
        e.flags = e.flags & -4097 | 2, se = !1, We = e;
      }
    }
  }
  function os(e) {
    for (e = e.return; e !== null && e.tag !== 5 && e.tag !== 3 && e.tag !== 13; ) e = e.return;
    We = e;
  }
  function el(e) {
    if (e !== We) return !1;
    if (!se) return os(e), se = !0, !1;
    var t;
    if ((t = e.tag !== 3) && !(t = e.tag !== 5) && (t = e.type, t = t !== "head" && t !== "body" && !Eo(e.type, e.memoizedProps)), t && (t = Qe)) {
      if (To(e)) throw is(), Error(m(418));
      for (; t; ) rs(e, t), t = Dt(t.nextSibling);
    }
    if (os(e), e.tag === 13) {
      if (e = e.memoizedState, e = e !== null ? e.dehydrated : null, !e) throw Error(m(317));
      e: {
        for (e = e.nextSibling, t = 0; e; ) {
          if (e.nodeType === 8) {
            var n = e.data;
            if (n === "/$") {
              if (t === 0) {
                Qe = Dt(e.nextSibling);
                break e;
              }
              t--;
            } else n !== "$" && n !== "$!" && n !== "$?" || t++;
          }
          e = e.nextSibling;
        }
        Qe = null;
      }
    } else Qe = We ? Dt(e.stateNode.nextSibling) : null;
    return !0;
  }
  function is() {
    for (var e = Qe; e; ) e = Dt(e.nextSibling);
  }
  function Nn() {
    Qe = We = null, se = !1;
  }
  function zo(e) {
    ot === null ? ot = [e] : ot.push(e);
  }
  var of = _e.ReactCurrentBatchConfig;
  function ur(e, t, n) {
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
  function us(e) {
    var t = e._init;
    return t(e._payload);
  }
  function ss(e) {
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
      return a === null || a.tag !== 6 ? (a = xi(d, f.mode, k), a.return = f, a) : (a = l(a, d), a.return = f, a);
    }
    function s(f, a, d, k) {
      var M = d.type;
      return M === Oe ? y(f, a, d.props.children, k, d.key) : a !== null && (a.elementType === M || typeof M == "object" && M !== null && M.$$typeof === je && us(M) === a.type) ? (k = l(a, d.props), k.ref = ur(f, a, d), k.return = f, k) : (k = _l(d.type, d.key, d.props, null, f.mode, k), k.ref = ur(f, a, d), k.return = f, k);
    }
    function p(f, a, d, k) {
      return a === null || a.tag !== 4 || a.stateNode.containerInfo !== d.containerInfo || a.stateNode.implementation !== d.implementation ? (a = Ci(d, f.mode, k), a.return = f, a) : (a = l(a, d.children || []), a.return = f, a);
    }
    function y(f, a, d, k, M) {
      return a === null || a.tag !== 7 ? (a = an(d, f.mode, k, M), a.return = f, a) : (a = l(a, d), a.return = f, a);
    }
    function S(f, a, d) {
      if (typeof a == "string" && a !== "" || typeof a == "number") return a = xi("" + a, f.mode, d), a.return = f, a;
      if (typeof a == "object" && a !== null) {
        switch (a.$$typeof) {
          case tt:
            return d = _l(a.type, a.key, a.props, null, f.mode, d), d.ref = ur(f, null, a), d.return = f, d;
          case Te:
            return a = Ci(a, f.mode, d), a.return = f, a;
          case je:
            var k = a._init;
            return S(f, k(a._payload), d);
        }
        if (Dn(a) || O(a)) return a = an(a, f.mode, d, null), a.return = f, a;
        tl(f, a);
      }
      return null;
    }
    function v(f, a, d, k) {
      var M = a !== null ? a.key : null;
      if (typeof d == "string" && d !== "" || typeof d == "number") return M !== null ? null : u(f, a, "" + d, k);
      if (typeof d == "object" && d !== null) {
        switch (d.$$typeof) {
          case tt:
            return d.key === M ? s(f, a, d, k) : null;
          case Te:
            return d.key === M ? p(f, a, d, k) : null;
          case je:
            return M = d._init, v(
              f,
              a,
              M(d._payload),
              k
            );
        }
        if (Dn(d) || O(d)) return M !== null ? null : y(f, a, d, k, null);
        tl(f, d);
      }
      return null;
    }
    function x(f, a, d, k, M) {
      if (typeof k == "string" && k !== "" || typeof k == "number") return f = f.get(d) || null, u(a, f, "" + k, M);
      if (typeof k == "object" && k !== null) {
        switch (k.$$typeof) {
          case tt:
            return f = f.get(k.key === null ? d : k.key) || null, s(a, f, k, M);
          case Te:
            return f = f.get(k.key === null ? d : k.key) || null, p(a, f, k, M);
          case je:
            var T = k._init;
            return x(f, a, d, T(k._payload), M);
        }
        if (Dn(k) || O(k)) return f = f.get(d) || null, y(a, f, k, M, null);
        tl(a, k);
      }
      return null;
    }
    function N(f, a, d, k) {
      for (var M = null, T = null, L = a, I = a = 0, ke = null; L !== null && I < d.length; I++) {
        L.index > I ? (ke = L, L = null) : ke = L.sibling;
        var K = v(f, L, d[I], k);
        if (K === null) {
          L === null && (L = ke);
          break;
        }
        e && L && K.alternate === null && t(f, L), a = o(K, a, I), T === null ? M = K : T.sibling = K, T = K, L = ke;
      }
      if (I === d.length) return n(f, L), se && en(f, I), M;
      if (L === null) {
        for (; I < d.length; I++) L = S(f, d[I], k), L !== null && (a = o(L, a, I), T === null ? M = L : T.sibling = L, T = L);
        return se && en(f, I), M;
      }
      for (L = r(f, L); I < d.length; I++) ke = x(L, f, I, d[I], k), ke !== null && (e && ke.alternate !== null && L.delete(ke.key === null ? I : ke.key), a = o(ke, a, I), T === null ? M = ke : T.sibling = ke, T = ke);
      return e && L.forEach(function(Yt) {
        return t(f, Yt);
      }), se && en(f, I), M;
    }
    function P(f, a, d, k) {
      var M = O(d);
      if (typeof M != "function") throw Error(m(150));
      if (d = M.call(d), d == null) throw Error(m(151));
      for (var T = M = null, L = a, I = a = 0, ke = null, K = d.next(); L !== null && !K.done; I++, K = d.next()) {
        L.index > I ? (ke = L, L = null) : ke = L.sibling;
        var Yt = v(f, L, K.value, k);
        if (Yt === null) {
          L === null && (L = ke);
          break;
        }
        e && L && Yt.alternate === null && t(f, L), a = o(Yt, a, I), T === null ? M = Yt : T.sibling = Yt, T = Yt, L = ke;
      }
      if (K.done) return n(
        f,
        L
      ), se && en(f, I), M;
      if (L === null) {
        for (; !K.done; I++, K = d.next()) K = S(f, K.value, k), K !== null && (a = o(K, a, I), T === null ? M = K : T.sibling = K, T = K);
        return se && en(f, I), M;
      }
      for (L = r(f, L); !K.done; I++, K = d.next()) K = x(L, f, I, K.value, k), K !== null && (e && K.alternate !== null && L.delete(K.key === null ? I : K.key), a = o(K, a, I), T === null ? M = K : T.sibling = K, T = K);
      return e && L.forEach(function(Uf) {
        return t(f, Uf);
      }), se && en(f, I), M;
    }
    function me(f, a, d, k) {
      if (typeof d == "object" && d !== null && d.type === Oe && d.key === null && (d = d.props.children), typeof d == "object" && d !== null) {
        switch (d.$$typeof) {
          case tt:
            e: {
              for (var M = d.key, T = a; T !== null; ) {
                if (T.key === M) {
                  if (M = d.type, M === Oe) {
                    if (T.tag === 7) {
                      n(f, T.sibling), a = l(T, d.props.children), a.return = f, f = a;
                      break e;
                    }
                  } else if (T.elementType === M || typeof M == "object" && M !== null && M.$$typeof === je && us(M) === T.type) {
                    n(f, T.sibling), a = l(T, d.props), a.ref = ur(f, T, d), a.return = f, f = a;
                    break e;
                  }
                  n(f, T);
                  break;
                } else t(f, T);
                T = T.sibling;
              }
              d.type === Oe ? (a = an(d.props.children, f.mode, k, d.key), a.return = f, f = a) : (k = _l(d.type, d.key, d.props, null, f.mode, k), k.ref = ur(f, a, d), k.return = f, f = k);
            }
            return i(f);
          case Te:
            e: {
              for (T = d.key; a !== null; ) {
                if (a.key === T) if (a.tag === 4 && a.stateNode.containerInfo === d.containerInfo && a.stateNode.implementation === d.implementation) {
                  n(f, a.sibling), a = l(a, d.children || []), a.return = f, f = a;
                  break e;
                } else {
                  n(f, a);
                  break;
                }
                else t(f, a);
                a = a.sibling;
              }
              a = Ci(d, f.mode, k), a.return = f, f = a;
            }
            return i(f);
          case je:
            return T = d._init, me(f, a, T(d._payload), k);
        }
        if (Dn(d)) return N(f, a, d, k);
        if (O(d)) return P(f, a, d, k);
        tl(f, d);
      }
      return typeof d == "string" && d !== "" || typeof d == "number" ? (d = "" + d, a !== null && a.tag === 6 ? (n(f, a.sibling), a = l(a, d), a.return = f, f = a) : (n(f, a), a = xi(d, f.mode, k), a.return = f, f = a), i(f)) : n(f, a);
    }
    return me;
  }
  var Pn = ss(!0), as = ss(!1), nl = Ft(null), rl = null, Mn = null, Oo = null;
  function jo() {
    Oo = Mn = rl = null;
  }
  function Io(e) {
    var t = nl.current;
    ie(nl), e._currentValue = t;
  }
  function Do(e, t, n) {
    for (; e !== null; ) {
      var r = e.alternate;
      if ((e.childLanes & t) !== t ? (e.childLanes |= t, r !== null && (r.childLanes |= t)) : r !== null && (r.childLanes & t) !== t && (r.childLanes |= t), e === n) break;
      e = e.return;
    }
  }
  function Rn(e, t) {
    rl = e, Oo = Mn = null, e = e.dependencies, e !== null && e.firstContext !== null && ((e.lanes & t) !== 0 && (Fe = !0), e.firstContext = null);
  }
  function qe(e) {
    var t = e._currentValue;
    if (Oo !== e) if (e = { context: e, memoizedValue: t, next: null }, Mn === null) {
      if (rl === null) throw Error(m(308));
      Mn = e, rl.dependencies = { lanes: 0, firstContext: e };
    } else Mn = Mn.next = e;
    return t;
  }
  var tn = null;
  function Fo(e) {
    tn === null ? tn = [e] : tn.push(e);
  }
  function cs(e, t, n, r) {
    var l = t.interleaved;
    return l === null ? (n.next = n, Fo(t)) : (n.next = l.next, l.next = n), t.interleaved = n, _t(e, r);
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
  function fs(e, t) {
    e = e.updateQueue, t.updateQueue === e && (t.updateQueue = { baseState: e.baseState, firstBaseUpdate: e.firstBaseUpdate, lastBaseUpdate: e.lastBaseUpdate, shared: e.shared, effects: e.effects });
  }
  function Nt(e, t) {
    return { eventTime: e, lane: t, tag: 0, payload: null, callback: null, next: null };
  }
  function Bt(e, t, n) {
    var r = e.updateQueue;
    if (r === null) return null;
    if (r = r.shared, ($ & 2) !== 0) {
      var l = r.pending;
      return l === null ? t.next = t : (t.next = l.next, l.next = t), r.pending = t, _t(e, n);
    }
    return l = r.interleaved, l === null ? (t.next = t, Fo(r)) : (t.next = l.next, l.next = t), r.interleaved = t, _t(e, n);
  }
  function ll(e, t, n) {
    if (t = t.updateQueue, t !== null && (t = t.shared, (n & 4194240) !== 0)) {
      var r = t.lanes;
      r &= e.pendingLanes, n |= r, t.lanes = n, Zl(e, n);
    }
  }
  function ds(e, t) {
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
      var y = e.alternate;
      y !== null && (y = y.updateQueue, u = y.lastBaseUpdate, u !== i && (u === null ? y.firstBaseUpdate = p : u.next = p, y.lastBaseUpdate = s));
    }
    if (o !== null) {
      var S = l.baseState;
      i = 0, y = p = s = null, u = o;
      do {
        var v = u.lane, x = u.eventTime;
        if ((r & v) === v) {
          y !== null && (y = y.next = {
            eventTime: x,
            lane: 0,
            tag: u.tag,
            payload: u.payload,
            callback: u.callback,
            next: null
          });
          e: {
            var N = e, P = u;
            switch (v = t, x = n, P.tag) {
              case 1:
                if (N = P.payload, typeof N == "function") {
                  S = N.call(x, S, v);
                  break e;
                }
                S = N;
                break e;
              case 3:
                N.flags = N.flags & -65537 | 128;
              case 0:
                if (N = P.payload, v = typeof N == "function" ? N.call(x, S, v) : N, v == null) break e;
                S = _({}, S, v);
                break e;
              case 2:
                Vt = !0;
            }
          }
          u.callback !== null && u.lane !== 0 && (e.flags |= 64, v = l.effects, v === null ? l.effects = [u] : v.push(u));
        } else x = { eventTime: x, lane: v, tag: u.tag, payload: u.payload, callback: u.callback, next: null }, y === null ? (p = y = x, s = S) : y = y.next = x, i |= v;
        if (u = u.next, u === null) {
          if (u = l.shared.pending, u === null) break;
          v = u, u = v.next, v.next = null, l.lastBaseUpdate = v, l.shared.pending = null;
        }
      } while (!0);
      if (y === null && (s = S), l.baseState = s, l.firstBaseUpdate = p, l.lastBaseUpdate = y, t = l.shared.interleaved, t !== null) {
        l = t;
        do
          i |= l.lane, l = l.next;
        while (l !== t);
      } else o === null && (l.shared.lanes = 0);
      ln |= i, e.lanes = i, e.memoizedState = S;
    }
  }
  function ps(e, t, n) {
    if (e = t.effects, t.effects = null, e !== null) for (t = 0; t < e.length; t++) {
      var r = e[t], l = r.callback;
      if (l !== null) {
        if (r.callback = null, r = n, typeof l != "function") throw Error(m(191, l));
        l.call(r);
      }
    }
  }
  var sr = {}, ht = Ft(sr), ar = Ft(sr), cr = Ft(sr);
  function nn(e) {
    if (e === sr) throw Error(m(174));
    return e;
  }
  function Uo(e, t) {
    switch (le(cr, t), le(ar, e), le(ht, sr), e = t.nodeType, e) {
      case 9:
      case 11:
        t = (t = t.documentElement) ? t.namespaceURI : Ul(null, "");
        break;
      default:
        e = e === 8 ? t.parentNode : t, t = e.namespaceURI || null, e = e.tagName, t = Ul(t, e);
    }
    ie(ht), le(ht, t);
  }
  function Tn() {
    ie(ht), ie(ar), ie(cr);
  }
  function ms(e) {
    nn(cr.current);
    var t = nn(ht.current), n = Ul(t, e.type);
    t !== n && (le(ar, e), le(ht, n));
  }
  function Vo(e) {
    ar.current === e && (ie(ht), ie(ar));
  }
  var ae = Ft(0);
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
  var Bo = [];
  function Ho() {
    for (var e = 0; e < Bo.length; e++) Bo[e]._workInProgressVersionPrimary = null;
    Bo.length = 0;
  }
  var ul = _e.ReactCurrentDispatcher, $o = _e.ReactCurrentBatchConfig, rn = 0, ce = null, ge = null, we = null, sl = !1, fr = !1, dr = 0, uf = 0;
  function Pe() {
    throw Error(m(321));
  }
  function Wo(e, t) {
    if (t === null) return !1;
    for (var n = 0; n < t.length && n < e.length; n++) if (!lt(e[n], t[n])) return !1;
    return !0;
  }
  function Qo(e, t, n, r, l, o) {
    if (rn = o, ce = t, t.memoizedState = null, t.updateQueue = null, t.lanes = 0, ul.current = e === null || e.memoizedState === null ? ff : df, e = n(r, l), fr) {
      o = 0;
      do {
        if (fr = !1, dr = 0, 25 <= o) throw Error(m(301));
        o += 1, we = ge = null, t.updateQueue = null, ul.current = pf, e = n(r, l);
      } while (fr);
    }
    if (ul.current = fl, t = ge !== null && ge.next !== null, rn = 0, we = ge = ce = null, sl = !1, t) throw Error(m(300));
    return e;
  }
  function Ko() {
    var e = dr !== 0;
    return dr = 0, e;
  }
  function vt() {
    var e = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
    return we === null ? ce.memoizedState = we = e : we = we.next = e, we;
  }
  function Ze() {
    if (ge === null) {
      var e = ce.alternate;
      e = e !== null ? e.memoizedState : null;
    } else e = ge.next;
    var t = we === null ? ce.memoizedState : we.next;
    if (t !== null) we = t, ge = e;
    else {
      if (e === null) throw Error(m(310));
      ge = e, e = { memoizedState: ge.memoizedState, baseState: ge.baseState, baseQueue: ge.baseQueue, queue: ge.queue, next: null }, we === null ? ce.memoizedState = we = e : we = we.next = e;
    }
    return we;
  }
  function pr(e, t) {
    return typeof t == "function" ? t(e) : t;
  }
  function Go(e) {
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
        var y = p.lane;
        if ((rn & y) === y) s !== null && (s = s.next = { lane: 0, action: p.action, hasEagerState: p.hasEagerState, eagerState: p.eagerState, next: null }), r = p.hasEagerState ? p.eagerState : e(r, p.action);
        else {
          var S = {
            lane: y,
            action: p.action,
            hasEagerState: p.hasEagerState,
            eagerState: p.eagerState,
            next: null
          };
          s === null ? (u = s = S, i = r) : s = s.next = S, ce.lanes |= y, ln |= y;
        }
        p = p.next;
      } while (p !== null && p !== o);
      s === null ? i = r : s.next = u, lt(r, t.memoizedState) || (Fe = !0), t.memoizedState = r, t.baseState = i, t.baseQueue = s, n.lastRenderedState = r;
    }
    if (e = n.interleaved, e !== null) {
      l = e;
      do
        o = l.lane, ce.lanes |= o, ln |= o, l = l.next;
      while (l !== e);
    } else l === null && (n.lanes = 0);
    return [t.memoizedState, n.dispatch];
  }
  function Yo(e) {
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
      lt(o, t.memoizedState) || (Fe = !0), t.memoizedState = o, t.baseQueue === null && (t.baseState = o), n.lastRenderedState = o;
    }
    return [o, r];
  }
  function hs() {
  }
  function vs(e, t) {
    var n = ce, r = Ze(), l = t(), o = !lt(r.memoizedState, l);
    if (o && (r.memoizedState = l, Fe = !0), r = r.queue, Xo(ws.bind(null, n, r, e), [e]), r.getSnapshot !== t || o || we !== null && we.memoizedState.tag & 1) {
      if (n.flags |= 2048, mr(9, ys.bind(null, n, r, l, t), void 0, null), Se === null) throw Error(m(349));
      (rn & 30) !== 0 || gs(n, t, l);
    }
    return l;
  }
  function gs(e, t, n) {
    e.flags |= 16384, e = { getSnapshot: t, value: n }, t = ce.updateQueue, t === null ? (t = { lastEffect: null, stores: null }, ce.updateQueue = t, t.stores = [e]) : (n = t.stores, n === null ? t.stores = [e] : n.push(e));
  }
  function ys(e, t, n, r) {
    t.value = n, t.getSnapshot = r, Ss(t) && ks(e);
  }
  function ws(e, t, n) {
    return n(function() {
      Ss(t) && ks(e);
    });
  }
  function Ss(e) {
    var t = e.getSnapshot;
    e = e.value;
    try {
      var n = t();
      return !lt(e, n);
    } catch {
      return !0;
    }
  }
  function ks(e) {
    var t = _t(e, 1);
    t !== null && at(t, e, 1, -1);
  }
  function Es(e) {
    var t = vt();
    return typeof e == "function" && (e = e()), t.memoizedState = t.baseState = e, e = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: pr, lastRenderedState: e }, t.queue = e, e = e.dispatch = cf.bind(null, ce, e), [t.memoizedState, e];
  }
  function mr(e, t, n, r) {
    return e = { tag: e, create: t, destroy: n, deps: r, next: null }, t = ce.updateQueue, t === null ? (t = { lastEffect: null, stores: null }, ce.updateQueue = t, t.lastEffect = e.next = e) : (n = t.lastEffect, n === null ? t.lastEffect = e.next = e : (r = n.next, n.next = e, e.next = r, t.lastEffect = e)), e;
  }
  function xs() {
    return Ze().memoizedState;
  }
  function al(e, t, n, r) {
    var l = vt();
    ce.flags |= e, l.memoizedState = mr(1 | t, n, void 0, r === void 0 ? null : r);
  }
  function cl(e, t, n, r) {
    var l = Ze();
    r = r === void 0 ? null : r;
    var o = void 0;
    if (ge !== null) {
      var i = ge.memoizedState;
      if (o = i.destroy, r !== null && Wo(r, i.deps)) {
        l.memoizedState = mr(t, n, o, r);
        return;
      }
    }
    ce.flags |= e, l.memoizedState = mr(1 | t, n, o, r);
  }
  function Cs(e, t) {
    return al(8390656, 8, e, t);
  }
  function Xo(e, t) {
    return cl(2048, 8, e, t);
  }
  function _s(e, t) {
    return cl(4, 2, e, t);
  }
  function Ns(e, t) {
    return cl(4, 4, e, t);
  }
  function Ps(e, t) {
    if (typeof t == "function") return e = e(), t(e), function() {
      t(null);
    };
    if (t != null) return e = e(), t.current = e, function() {
      t.current = null;
    };
  }
  function Ms(e, t, n) {
    return n = n != null ? n.concat([e]) : null, cl(4, 4, Ps.bind(null, t, e), n);
  }
  function qo() {
  }
  function Rs(e, t) {
    var n = Ze();
    t = t === void 0 ? null : t;
    var r = n.memoizedState;
    return r !== null && t !== null && Wo(t, r[1]) ? r[0] : (n.memoizedState = [e, t], e);
  }
  function Ts(e, t) {
    var n = Ze();
    t = t === void 0 ? null : t;
    var r = n.memoizedState;
    return r !== null && t !== null && Wo(t, r[1]) ? r[0] : (e = e(), n.memoizedState = [e, t], e);
  }
  function Ls(e, t, n) {
    return (rn & 21) === 0 ? (e.baseState && (e.baseState = !1, Fe = !0), e.memoizedState = n) : (lt(n, t) || (n = uu(), ce.lanes |= n, ln |= n, e.baseState = !0), t);
  }
  function sf(e, t) {
    var n = b;
    b = n !== 0 && 4 > n ? n : 4, e(!0);
    var r = $o.transition;
    $o.transition = {};
    try {
      e(!1), t();
    } finally {
      b = n, $o.transition = r;
    }
  }
  function zs() {
    return Ze().memoizedState;
  }
  function af(e, t, n) {
    var r = Qt(e);
    if (n = { lane: r, action: n, hasEagerState: !1, eagerState: null, next: null }, Os(e)) js(t, n);
    else if (n = cs(e, t, n, r), n !== null) {
      var l = ze();
      at(n, e, r, l), Is(n, t, r);
    }
  }
  function cf(e, t, n) {
    var r = Qt(e), l = { lane: r, action: n, hasEagerState: !1, eagerState: null, next: null };
    if (Os(e)) js(t, l);
    else {
      var o = e.alternate;
      if (e.lanes === 0 && (o === null || o.lanes === 0) && (o = t.lastRenderedReducer, o !== null)) try {
        var i = t.lastRenderedState, u = o(i, n);
        if (l.hasEagerState = !0, l.eagerState = u, lt(u, i)) {
          var s = t.interleaved;
          s === null ? (l.next = l, Fo(t)) : (l.next = s.next, s.next = l), t.interleaved = l;
          return;
        }
      } catch {
      } finally {
      }
      n = cs(e, t, l, r), n !== null && (l = ze(), at(n, e, r, l), Is(n, t, r));
    }
  }
  function Os(e) {
    var t = e.alternate;
    return e === ce || t !== null && t === ce;
  }
  function js(e, t) {
    fr = sl = !0;
    var n = e.pending;
    n === null ? t.next = t : (t.next = n.next, n.next = t), e.pending = t;
  }
  function Is(e, t, n) {
    if ((n & 4194240) !== 0) {
      var r = t.lanes;
      r &= e.pendingLanes, n |= r, t.lanes = n, Zl(e, n);
    }
  }
  var fl = { readContext: qe, useCallback: Pe, useContext: Pe, useEffect: Pe, useImperativeHandle: Pe, useInsertionEffect: Pe, useLayoutEffect: Pe, useMemo: Pe, useReducer: Pe, useRef: Pe, useState: Pe, useDebugValue: Pe, useDeferredValue: Pe, useTransition: Pe, useMutableSource: Pe, useSyncExternalStore: Pe, useId: Pe, unstable_isNewReconciler: !1 }, ff = { readContext: qe, useCallback: function(e, t) {
    return vt().memoizedState = [e, t === void 0 ? null : t], e;
  }, useContext: qe, useEffect: Cs, useImperativeHandle: function(e, t, n) {
    return n = n != null ? n.concat([e]) : null, al(
      4194308,
      4,
      Ps.bind(null, t, e),
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
    return t = n !== void 0 ? n(t) : t, r.memoizedState = r.baseState = t, e = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: e, lastRenderedState: t }, r.queue = e, e = e.dispatch = af.bind(null, ce, e), [r.memoizedState, e];
  }, useRef: function(e) {
    var t = vt();
    return e = { current: e }, t.memoizedState = e;
  }, useState: Es, useDebugValue: qo, useDeferredValue: function(e) {
    return vt().memoizedState = e;
  }, useTransition: function() {
    var e = Es(!1), t = e[0];
    return e = sf.bind(null, e[1]), vt().memoizedState = e, [t, e];
  }, useMutableSource: function() {
  }, useSyncExternalStore: function(e, t, n) {
    var r = ce, l = vt();
    if (se) {
      if (n === void 0) throw Error(m(407));
      n = n();
    } else {
      if (n = t(), Se === null) throw Error(m(349));
      (rn & 30) !== 0 || gs(r, t, n);
    }
    l.memoizedState = n;
    var o = { value: n, getSnapshot: t };
    return l.queue = o, Cs(ws.bind(
      null,
      r,
      o,
      e
    ), [e]), r.flags |= 2048, mr(9, ys.bind(null, r, o, n, t), void 0, null), n;
  }, useId: function() {
    var e = vt(), t = Se.identifierPrefix;
    if (se) {
      var n = Ct, r = xt;
      n = (r & ~(1 << 32 - rt(r) - 1)).toString(32) + n, t = ":" + t + "R" + n, n = dr++, 0 < n && (t += "H" + n.toString(32)), t += ":";
    } else n = uf++, t = ":" + t + "r" + n.toString(32) + ":";
    return e.memoizedState = t;
  }, unstable_isNewReconciler: !1 }, df = {
    readContext: qe,
    useCallback: Rs,
    useContext: qe,
    useEffect: Xo,
    useImperativeHandle: Ms,
    useInsertionEffect: _s,
    useLayoutEffect: Ns,
    useMemo: Ts,
    useReducer: Go,
    useRef: xs,
    useState: function() {
      return Go(pr);
    },
    useDebugValue: qo,
    useDeferredValue: function(e) {
      var t = Ze();
      return Ls(t, ge.memoizedState, e);
    },
    useTransition: function() {
      var e = Go(pr)[0], t = Ze().memoizedState;
      return [e, t];
    },
    useMutableSource: hs,
    useSyncExternalStore: vs,
    useId: zs,
    unstable_isNewReconciler: !1
  }, pf = { readContext: qe, useCallback: Rs, useContext: qe, useEffect: Xo, useImperativeHandle: Ms, useInsertionEffect: _s, useLayoutEffect: Ns, useMemo: Ts, useReducer: Yo, useRef: xs, useState: function() {
    return Yo(pr);
  }, useDebugValue: qo, useDeferredValue: function(e) {
    var t = Ze();
    return ge === null ? t.memoizedState = e : Ls(t, ge.memoizedState, e);
  }, useTransition: function() {
    var e = Yo(pr)[0], t = Ze().memoizedState;
    return [e, t];
  }, useMutableSource: hs, useSyncExternalStore: vs, useId: zs, unstable_isNewReconciler: !1 };
  function it(e, t) {
    if (e && e.defaultProps) {
      t = _({}, t), e = e.defaultProps;
      for (var n in e) t[n] === void 0 && (t[n] = e[n]);
      return t;
    }
    return t;
  }
  function Zo(e, t, n, r) {
    t = e.memoizedState, n = n(r, t), n = n == null ? t : _({}, t, n), e.memoizedState = n, e.lanes === 0 && (e.updateQueue.baseState = n);
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
    return e = e.stateNode, typeof e.shouldComponentUpdate == "function" ? e.shouldComponentUpdate(r, o, i) : t.prototype && t.prototype.isPureReactComponent ? !er(n, r) || !er(l, o) : !0;
  }
  function Fs(e, t, n) {
    var r = !1, l = At, o = t.contextType;
    return typeof o == "object" && o !== null ? o = qe(o) : (l = De(t) ? Jt : Ne.current, r = t.contextTypes, o = (r = r != null) ? xn(e, l) : At), t = new t(n, o), e.memoizedState = t.state !== null && t.state !== void 0 ? t.state : null, t.updater = dl, e.stateNode = t, t._reactInternals = e, r && (e = e.stateNode, e.__reactInternalMemoizedUnmaskedChildContext = l, e.__reactInternalMemoizedMaskedChildContext = o), t;
  }
  function As(e, t, n, r) {
    e = t.state, typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(n, r), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(n, r), t.state !== e && dl.enqueueReplaceState(t, t.state, null);
  }
  function Jo(e, t, n, r) {
    var l = e.stateNode;
    l.props = n, l.state = e.memoizedState, l.refs = {}, Ao(e);
    var o = t.contextType;
    typeof o == "object" && o !== null ? l.context = qe(o) : (o = De(t) ? Jt : Ne.current, l.context = xn(e, o)), l.state = e.memoizedState, o = t.getDerivedStateFromProps, typeof o == "function" && (Zo(e, t, o, n), l.state = e.memoizedState), typeof t.getDerivedStateFromProps == "function" || typeof l.getSnapshotBeforeUpdate == "function" || typeof l.UNSAFE_componentWillMount != "function" && typeof l.componentWillMount != "function" || (t = l.state, typeof l.componentWillMount == "function" && l.componentWillMount(), typeof l.UNSAFE_componentWillMount == "function" && l.UNSAFE_componentWillMount(), t !== l.state && dl.enqueueReplaceState(l, l.state, null), ol(e, n, l, r), l.state = e.memoizedState), typeof l.componentDidMount == "function" && (e.flags |= 4194308);
  }
  function Ln(e, t) {
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
  function bo(e, t, n) {
    return { value: e, source: null, stack: n ?? null, digest: t ?? null };
  }
  function ei(e, t) {
    try {
      console.error(t.value);
    } catch (n) {
      setTimeout(function() {
        throw n;
      });
    }
  }
  var mf = typeof WeakMap == "function" ? WeakMap : Map;
  function Us(e, t, n) {
    n = Nt(-1, n), n.tag = 3, n.payload = { element: null };
    var r = t.value;
    return n.callback = function() {
      wl || (wl = !0, hi = r), ei(e, t);
    }, n;
  }
  function Vs(e, t, n) {
    n = Nt(-1, n), n.tag = 3;
    var r = e.type.getDerivedStateFromError;
    if (typeof r == "function") {
      var l = t.value;
      n.payload = function() {
        return r(l);
      }, n.callback = function() {
        ei(e, t);
      };
    }
    var o = e.stateNode;
    return o !== null && typeof o.componentDidCatch == "function" && (n.callback = function() {
      ei(e, t), typeof r != "function" && ($t === null ? $t = /* @__PURE__ */ new Set([this]) : $t.add(this));
      var i = t.stack;
      this.componentDidCatch(t.value, { componentStack: i !== null ? i : "" });
    }), n;
  }
  function Bs(e, t, n) {
    var r = e.pingCache;
    if (r === null) {
      r = e.pingCache = new mf();
      var l = /* @__PURE__ */ new Set();
      r.set(t, l);
    } else l = r.get(t), l === void 0 && (l = /* @__PURE__ */ new Set(), r.set(t, l));
    l.has(n) || (l.add(n), e = Mf.bind(null, e, t, n), t.then(e, e));
  }
  function Hs(e) {
    do {
      var t;
      if ((t = e.tag === 13) && (t = e.memoizedState, t = t !== null ? t.dehydrated !== null : !0), t) return e;
      e = e.return;
    } while (e !== null);
    return null;
  }
  function $s(e, t, n, r, l) {
    return (e.mode & 1) === 0 ? (e === t ? e.flags |= 65536 : (e.flags |= 128, n.flags |= 131072, n.flags &= -52805, n.tag === 1 && (n.alternate === null ? n.tag = 17 : (t = Nt(-1, 1), t.tag = 2, Bt(n, t, 1))), n.lanes |= 1), e) : (e.flags |= 65536, e.lanes = l, e);
  }
  var hf = _e.ReactCurrentOwner, Fe = !1;
  function Le(e, t, n, r) {
    t.child = e === null ? as(t, null, n, r) : Pn(t, e.child, n, r);
  }
  function Ws(e, t, n, r, l) {
    n = n.render;
    var o = t.ref;
    return Rn(t, l), r = Qo(e, t, n, r, o, l), n = Ko(), e !== null && !Fe ? (t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~l, Pt(e, t, l)) : (se && n && Mo(t), t.flags |= 1, Le(e, t, r, l), t.child);
  }
  function Qs(e, t, n, r, l) {
    if (e === null) {
      var o = n.type;
      return typeof o == "function" && !Ei(o) && o.defaultProps === void 0 && n.compare === null && n.defaultProps === void 0 ? (t.tag = 15, t.type = o, Ks(e, t, o, r, l)) : (e = _l(n.type, null, r, t, t.mode, l), e.ref = t.ref, e.return = t, t.child = e);
    }
    if (o = e.child, (e.lanes & l) === 0) {
      var i = o.memoizedProps;
      if (n = n.compare, n = n !== null ? n : er, n(i, r) && e.ref === t.ref) return Pt(e, t, l);
    }
    return t.flags |= 1, e = Gt(o, r), e.ref = t.ref, e.return = t, t.child = e;
  }
  function Ks(e, t, n, r, l) {
    if (e !== null) {
      var o = e.memoizedProps;
      if (er(o, r) && e.ref === t.ref) if (Fe = !1, t.pendingProps = r = o, (e.lanes & l) !== 0) (e.flags & 131072) !== 0 && (Fe = !0);
      else return t.lanes = e.lanes, Pt(e, t, l);
    }
    return ti(e, t, n, r, l);
  }
  function Gs(e, t, n) {
    var r = t.pendingProps, l = r.children, o = e !== null ? e.memoizedState : null;
    if (r.mode === "hidden") if ((t.mode & 1) === 0) t.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }, le(On, Ke), Ke |= n;
    else {
      if ((n & 1073741824) === 0) return e = o !== null ? o.baseLanes | n : n, t.lanes = t.childLanes = 1073741824, t.memoizedState = { baseLanes: e, cachePool: null, transitions: null }, t.updateQueue = null, le(On, Ke), Ke |= e, null;
      t.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }, r = o !== null ? o.baseLanes : n, le(On, Ke), Ke |= r;
    }
    else o !== null ? (r = o.baseLanes | n, t.memoizedState = null) : r = n, le(On, Ke), Ke |= r;
    return Le(e, t, l, n), t.child;
  }
  function Ys(e, t) {
    var n = t.ref;
    (e === null && n !== null || e !== null && e.ref !== n) && (t.flags |= 512, t.flags |= 2097152);
  }
  function ti(e, t, n, r, l) {
    var o = De(n) ? Jt : Ne.current;
    return o = xn(t, o), Rn(t, l), n = Qo(e, t, n, r, o, l), r = Ko(), e !== null && !Fe ? (t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~l, Pt(e, t, l)) : (se && r && Mo(t), t.flags |= 1, Le(e, t, n, l), t.child);
  }
  function Xs(e, t, n, r, l) {
    if (De(n)) {
      var o = !0;
      qr(t);
    } else o = !1;
    if (Rn(t, l), t.stateNode === null) ml(e, t), Fs(t, n, r), Jo(t, n, r, l), r = !0;
    else if (e === null) {
      var i = t.stateNode, u = t.memoizedProps;
      i.props = u;
      var s = i.context, p = n.contextType;
      typeof p == "object" && p !== null ? p = qe(p) : (p = De(n) ? Jt : Ne.current, p = xn(t, p));
      var y = n.getDerivedStateFromProps, S = typeof y == "function" || typeof i.getSnapshotBeforeUpdate == "function";
      S || typeof i.UNSAFE_componentWillReceiveProps != "function" && typeof i.componentWillReceiveProps != "function" || (u !== r || s !== p) && As(t, i, r, p), Vt = !1;
      var v = t.memoizedState;
      i.state = v, ol(t, r, i, l), s = t.memoizedState, u !== r || v !== s || Ie.current || Vt ? (typeof y == "function" && (Zo(t, n, y, r), s = t.memoizedState), (u = Vt || Ds(t, n, u, r, v, s, p)) ? (S || typeof i.UNSAFE_componentWillMount != "function" && typeof i.componentWillMount != "function" || (typeof i.componentWillMount == "function" && i.componentWillMount(), typeof i.UNSAFE_componentWillMount == "function" && i.UNSAFE_componentWillMount()), typeof i.componentDidMount == "function" && (t.flags |= 4194308)) : (typeof i.componentDidMount == "function" && (t.flags |= 4194308), t.memoizedProps = r, t.memoizedState = s), i.props = r, i.state = s, i.context = p, r = u) : (typeof i.componentDidMount == "function" && (t.flags |= 4194308), r = !1);
    } else {
      i = t.stateNode, fs(e, t), u = t.memoizedProps, p = t.type === t.elementType ? u : it(t.type, u), i.props = p, S = t.pendingProps, v = i.context, s = n.contextType, typeof s == "object" && s !== null ? s = qe(s) : (s = De(n) ? Jt : Ne.current, s = xn(t, s));
      var x = n.getDerivedStateFromProps;
      (y = typeof x == "function" || typeof i.getSnapshotBeforeUpdate == "function") || typeof i.UNSAFE_componentWillReceiveProps != "function" && typeof i.componentWillReceiveProps != "function" || (u !== S || v !== s) && As(t, i, r, s), Vt = !1, v = t.memoizedState, i.state = v, ol(t, r, i, l);
      var N = t.memoizedState;
      u !== S || v !== N || Ie.current || Vt ? (typeof x == "function" && (Zo(t, n, x, r), N = t.memoizedState), (p = Vt || Ds(t, n, p, r, v, N, s) || !1) ? (y || typeof i.UNSAFE_componentWillUpdate != "function" && typeof i.componentWillUpdate != "function" || (typeof i.componentWillUpdate == "function" && i.componentWillUpdate(r, N, s), typeof i.UNSAFE_componentWillUpdate == "function" && i.UNSAFE_componentWillUpdate(r, N, s)), typeof i.componentDidUpdate == "function" && (t.flags |= 4), typeof i.getSnapshotBeforeUpdate == "function" && (t.flags |= 1024)) : (typeof i.componentDidUpdate != "function" || u === e.memoizedProps && v === e.memoizedState || (t.flags |= 4), typeof i.getSnapshotBeforeUpdate != "function" || u === e.memoizedProps && v === e.memoizedState || (t.flags |= 1024), t.memoizedProps = r, t.memoizedState = N), i.props = r, i.state = N, i.context = s, r = p) : (typeof i.componentDidUpdate != "function" || u === e.memoizedProps && v === e.memoizedState || (t.flags |= 4), typeof i.getSnapshotBeforeUpdate != "function" || u === e.memoizedProps && v === e.memoizedState || (t.flags |= 1024), r = !1);
    }
    return ni(e, t, n, r, o, l);
  }
  function ni(e, t, n, r, l, o) {
    Ys(e, t);
    var i = (t.flags & 128) !== 0;
    if (!r && !i) return l && es(t, n, !1), Pt(e, t, o);
    r = t.stateNode, hf.current = t;
    var u = i && typeof n.getDerivedStateFromError != "function" ? null : r.render();
    return t.flags |= 1, e !== null && i ? (t.child = Pn(t, e.child, null, o), t.child = Pn(t, null, u, o)) : Le(e, t, u, o), t.memoizedState = r.state, l && es(t, n, !0), t.child;
  }
  function qs(e) {
    var t = e.stateNode;
    t.pendingContext ? Ju(e, t.pendingContext, t.pendingContext !== t.context) : t.context && Ju(e, t.context, !1), Uo(e, t.containerInfo);
  }
  function Zs(e, t, n, r, l) {
    return Nn(), zo(l), t.flags |= 256, Le(e, t, n, r), t.child;
  }
  var ri = { dehydrated: null, treeContext: null, retryLane: 0 };
  function li(e) {
    return { baseLanes: e, cachePool: null, transitions: null };
  }
  function Js(e, t, n) {
    var r = t.pendingProps, l = ae.current, o = !1, i = (t.flags & 128) !== 0, u;
    if ((u = i) || (u = e !== null && e.memoizedState === null ? !1 : (l & 2) !== 0), u ? (o = !0, t.flags &= -129) : (e === null || e.memoizedState !== null) && (l |= 1), le(ae, l & 1), e === null)
      return Lo(t), e = t.memoizedState, e !== null && (e = e.dehydrated, e !== null) ? ((t.mode & 1) === 0 ? t.lanes = 1 : e.data === "$!" ? t.lanes = 8 : t.lanes = 1073741824, null) : (i = r.children, e = r.fallback, o ? (r = t.mode, o = t.child, i = { mode: "hidden", children: i }, (r & 1) === 0 && o !== null ? (o.childLanes = 0, o.pendingProps = i) : o = Nl(i, r, 0, null), e = an(e, r, n, null), o.return = t, e.return = t, o.sibling = e, t.child = o, t.child.memoizedState = li(n), t.memoizedState = ri, e) : oi(t, i));
    if (l = e.memoizedState, l !== null && (u = l.dehydrated, u !== null)) return vf(e, t, i, r, u, l, n);
    if (o) {
      o = r.fallback, i = t.mode, l = e.child, u = l.sibling;
      var s = { mode: "hidden", children: r.children };
      return (i & 1) === 0 && t.child !== l ? (r = t.child, r.childLanes = 0, r.pendingProps = s, t.deletions = null) : (r = Gt(l, s), r.subtreeFlags = l.subtreeFlags & 14680064), u !== null ? o = Gt(u, o) : (o = an(o, i, n, null), o.flags |= 2), o.return = t, r.return = t, r.sibling = o, t.child = r, r = o, o = t.child, i = e.child.memoizedState, i = i === null ? li(n) : { baseLanes: i.baseLanes | n, cachePool: null, transitions: i.transitions }, o.memoizedState = i, o.childLanes = e.childLanes & ~n, t.memoizedState = ri, r;
    }
    return o = e.child, e = o.sibling, r = Gt(o, { mode: "visible", children: r.children }), (t.mode & 1) === 0 && (r.lanes = n), r.return = t, r.sibling = null, e !== null && (n = t.deletions, n === null ? (t.deletions = [e], t.flags |= 16) : n.push(e)), t.child = r, t.memoizedState = null, r;
  }
  function oi(e, t) {
    return t = Nl({ mode: "visible", children: t }, e.mode, 0, null), t.return = e, e.child = t;
  }
  function pl(e, t, n, r) {
    return r !== null && zo(r), Pn(t, e.child, null, n), e = oi(t, t.pendingProps.children), e.flags |= 2, t.memoizedState = null, e;
  }
  function vf(e, t, n, r, l, o, i) {
    if (n)
      return t.flags & 256 ? (t.flags &= -257, r = bo(Error(m(422))), pl(e, t, i, r)) : t.memoizedState !== null ? (t.child = e.child, t.flags |= 128, null) : (o = r.fallback, l = t.mode, r = Nl({ mode: "visible", children: r.children }, l, 0, null), o = an(o, l, i, null), o.flags |= 2, r.return = t, o.return = t, r.sibling = o, t.child = r, (t.mode & 1) !== 0 && Pn(t, e.child, null, i), t.child.memoizedState = li(i), t.memoizedState = ri, o);
    if ((t.mode & 1) === 0) return pl(e, t, i, null);
    if (l.data === "$!") {
      if (r = l.nextSibling && l.nextSibling.dataset, r) var u = r.dgst;
      return r = u, o = Error(m(419)), r = bo(o, r, void 0), pl(e, t, i, r);
    }
    if (u = (i & e.childLanes) !== 0, Fe || u) {
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
      return ki(), r = bo(Error(m(421))), pl(e, t, i, r);
    }
    return l.data === "$?" ? (t.flags |= 128, t.child = e.child, t = Rf.bind(null, e), l._reactRetry = t, null) : (e = o.treeContext, Qe = Dt(l.nextSibling), We = t, se = !0, ot = null, e !== null && (Ye[Xe++] = xt, Ye[Xe++] = Ct, Ye[Xe++] = bt, xt = e.id, Ct = e.overflow, bt = t), t = oi(t, r.children), t.flags |= 4096, t);
  }
  function bs(e, t, n) {
    e.lanes |= t;
    var r = e.alternate;
    r !== null && (r.lanes |= t), Do(e.return, t, n);
  }
  function ii(e, t, n, r, l) {
    var o = e.memoizedState;
    o === null ? e.memoizedState = { isBackwards: t, rendering: null, renderingStartTime: 0, last: r, tail: n, tailMode: l } : (o.isBackwards = t, o.rendering = null, o.renderingStartTime = 0, o.last = r, o.tail = n, o.tailMode = l);
  }
  function ea(e, t, n) {
    var r = t.pendingProps, l = r.revealOrder, o = r.tail;
    if (Le(e, t, r.children, n), r = ae.current, (r & 2) !== 0) r = r & 1 | 2, t.flags |= 128;
    else {
      if (e !== null && (e.flags & 128) !== 0) e: for (e = t.child; e !== null; ) {
        if (e.tag === 13) e.memoizedState !== null && bs(e, n, t);
        else if (e.tag === 19) bs(e, n, t);
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
    if (le(ae, r), (t.mode & 1) === 0) t.memoizedState = null;
    else switch (l) {
      case "forwards":
        for (n = t.child, l = null; n !== null; ) e = n.alternate, e !== null && il(e) === null && (l = n), n = n.sibling;
        n = l, n === null ? (l = t.child, t.child = null) : (l = n.sibling, n.sibling = null), ii(t, !1, l, n, o);
        break;
      case "backwards":
        for (n = null, l = t.child, t.child = null; l !== null; ) {
          if (e = l.alternate, e !== null && il(e) === null) {
            t.child = l;
            break;
          }
          e = l.sibling, l.sibling = n, n = l, l = e;
        }
        ii(t, !0, n, null, o);
        break;
      case "together":
        ii(t, !1, null, null, void 0);
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
        qs(t), Nn();
        break;
      case 5:
        ms(t);
        break;
      case 1:
        De(t.type) && qr(t);
        break;
      case 4:
        Uo(t, t.stateNode.containerInfo);
        break;
      case 10:
        var r = t.type._context, l = t.memoizedProps.value;
        le(nl, r._currentValue), r._currentValue = l;
        break;
      case 13:
        if (r = t.memoizedState, r !== null)
          return r.dehydrated !== null ? (le(ae, ae.current & 1), t.flags |= 128, null) : (n & t.child.childLanes) !== 0 ? Js(e, t, n) : (le(ae, ae.current & 1), e = Pt(e, t, n), e !== null ? e.sibling : null);
        le(ae, ae.current & 1);
        break;
      case 19:
        if (r = (n & t.childLanes) !== 0, (e.flags & 128) !== 0) {
          if (r) return ea(e, t, n);
          t.flags |= 128;
        }
        if (l = t.memoizedState, l !== null && (l.rendering = null, l.tail = null, l.lastEffect = null), le(ae, ae.current), r) break;
        return null;
      case 22:
      case 23:
        return t.lanes = 0, Gs(e, t, n);
    }
    return Pt(e, t, n);
  }
  var ta, ui, na, ra;
  ta = function(e, t) {
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
  }, ui = function() {
  }, na = function(e, t, n, r) {
    var l = e.memoizedProps;
    if (l !== r) {
      e = t.stateNode, nn(ht.current);
      var o = null;
      switch (n) {
        case "input":
          l = Il(e, l), r = Il(e, r), o = [];
          break;
        case "select":
          l = _({}, l, { value: void 0 }), r = _({}, r, { value: void 0 }), o = [];
          break;
        case "textarea":
          l = Al(e, l), r = Al(e, r), o = [];
          break;
        default:
          typeof l.onClick != "function" && typeof r.onClick == "function" && (e.onclick = Gr);
      }
      Vl(n, r);
      var i;
      n = null;
      for (p in l) if (!r.hasOwnProperty(p) && l.hasOwnProperty(p) && l[p] != null) if (p === "style") {
        var u = l[p];
        for (i in u) u.hasOwnProperty(i) && (n || (n = {}), n[i] = "");
      } else p !== "dangerouslySetInnerHTML" && p !== "children" && p !== "suppressContentEditableWarning" && p !== "suppressHydrationWarning" && p !== "autoFocus" && (ne.hasOwnProperty(p) ? o || (o = []) : (o = o || []).push(p, null));
      for (p in r) {
        var s = r[p];
        if (u = l != null ? l[p] : void 0, r.hasOwnProperty(p) && s !== u && (s != null || u != null)) if (p === "style") if (u) {
          for (i in u) !u.hasOwnProperty(i) || s && s.hasOwnProperty(i) || (n || (n = {}), n[i] = "");
          for (i in s) s.hasOwnProperty(i) && u[i] !== s[i] && (n || (n = {}), n[i] = s[i]);
        } else n || (o || (o = []), o.push(
          p,
          n
        )), n = s;
        else p === "dangerouslySetInnerHTML" ? (s = s ? s.__html : void 0, u = u ? u.__html : void 0, s != null && u !== s && (o = o || []).push(p, s)) : p === "children" ? typeof s != "string" && typeof s != "number" || (o = o || []).push(p, "" + s) : p !== "suppressContentEditableWarning" && p !== "suppressHydrationWarning" && (ne.hasOwnProperty(p) ? (s != null && p === "onScroll" && oe("scroll", e), o || u === s || (o = [])) : (o = o || []).push(p, s));
      }
      n && (o = o || []).push("style", n);
      var p = o;
      (t.updateQueue = p) && (t.flags |= 4);
    }
  }, ra = function(e, t, n, r) {
    n !== r && (t.flags |= 4);
  };
  function hr(e, t) {
    if (!se) switch (e.tailMode) {
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
    switch (Ro(t), t.tag) {
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
        return De(t.type) && Xr(), Me(t), null;
      case 3:
        return r = t.stateNode, Tn(), ie(Ie), ie(Ne), Ho(), r.pendingContext && (r.context = r.pendingContext, r.pendingContext = null), (e === null || e.child === null) && (el(t) ? t.flags |= 4 : e === null || e.memoizedState.isDehydrated && (t.flags & 256) === 0 || (t.flags |= 1024, ot !== null && (yi(ot), ot = null))), ui(e, t), Me(t), null;
      case 5:
        Vo(t);
        var l = nn(cr.current);
        if (n = t.type, e !== null && t.stateNode != null) na(e, t, n, r, l), e.ref !== t.ref && (t.flags |= 512, t.flags |= 2097152);
        else {
          if (!r) {
            if (t.stateNode === null) throw Error(m(166));
            return Me(t), null;
          }
          if (e = nn(ht.current), el(t)) {
            r = t.stateNode, n = t.type;
            var o = t.memoizedProps;
            switch (r[mt] = t, r[or] = o, e = (t.mode & 1) !== 0, n) {
              case "dialog":
                oe("cancel", r), oe("close", r);
                break;
              case "iframe":
              case "object":
              case "embed":
                oe("load", r);
                break;
              case "video":
              case "audio":
                for (l = 0; l < nr.length; l++) oe(nr[l], r);
                break;
              case "source":
                oe("error", r);
                break;
              case "img":
              case "image":
              case "link":
                oe(
                  "error",
                  r
                ), oe("load", r);
                break;
              case "details":
                oe("toggle", r);
                break;
              case "input":
                Fi(r, o), oe("invalid", r);
                break;
              case "select":
                r._wrapperState = { wasMultiple: !!o.multiple }, oe("invalid", r);
                break;
              case "textarea":
                Vi(r, o), oe("invalid", r);
            }
            Vl(n, o), l = null;
            for (var i in o) if (o.hasOwnProperty(i)) {
              var u = o[i];
              i === "children" ? typeof u == "string" ? r.textContent !== u && (o.suppressHydrationWarning !== !0 && Kr(r.textContent, u, e), l = ["children", u]) : typeof u == "number" && r.textContent !== "" + u && (o.suppressHydrationWarning !== !0 && Kr(
                r.textContent,
                u,
                e
              ), l = ["children", "" + u]) : ne.hasOwnProperty(i) && u != null && i === "onScroll" && oe("scroll", r);
            }
            switch (n) {
              case "input":
                xr(r), Ui(r, o, !0);
                break;
              case "textarea":
                xr(r), Hi(r);
                break;
              case "select":
              case "option":
                break;
              default:
                typeof o.onClick == "function" && (r.onclick = Gr);
            }
            r = l, t.updateQueue = r, r !== null && (t.flags |= 4);
          } else {
            i = l.nodeType === 9 ? l : l.ownerDocument, e === "http://www.w3.org/1999/xhtml" && (e = $i(n)), e === "http://www.w3.org/1999/xhtml" ? n === "script" ? (e = i.createElement("div"), e.innerHTML = "<script><\/script>", e = e.removeChild(e.firstChild)) : typeof r.is == "string" ? e = i.createElement(n, { is: r.is }) : (e = i.createElement(n), n === "select" && (i = e, r.multiple ? i.multiple = !0 : r.size && (i.size = r.size))) : e = i.createElementNS(e, n), e[mt] = t, e[or] = r, ta(e, t, !1, !1), t.stateNode = e;
            e: {
              switch (i = Bl(n, r), n) {
                case "dialog":
                  oe("cancel", e), oe("close", e), l = r;
                  break;
                case "iframe":
                case "object":
                case "embed":
                  oe("load", e), l = r;
                  break;
                case "video":
                case "audio":
                  for (l = 0; l < nr.length; l++) oe(nr[l], e);
                  l = r;
                  break;
                case "source":
                  oe("error", e), l = r;
                  break;
                case "img":
                case "image":
                case "link":
                  oe(
                    "error",
                    e
                  ), oe("load", e), l = r;
                  break;
                case "details":
                  oe("toggle", e), l = r;
                  break;
                case "input":
                  Fi(e, r), l = Il(e, r), oe("invalid", e);
                  break;
                case "option":
                  l = r;
                  break;
                case "select":
                  e._wrapperState = { wasMultiple: !!r.multiple }, l = _({}, r, { value: void 0 }), oe("invalid", e);
                  break;
                case "textarea":
                  Vi(e, r), l = Al(e, r), oe("invalid", e);
                  break;
                default:
                  l = r;
              }
              Vl(n, l), u = l;
              for (o in u) if (u.hasOwnProperty(o)) {
                var s = u[o];
                o === "style" ? Ki(e, s) : o === "dangerouslySetInnerHTML" ? (s = s ? s.__html : void 0, s != null && Wi(e, s)) : o === "children" ? typeof s == "string" ? (n !== "textarea" || s !== "") && Fn(e, s) : typeof s == "number" && Fn(e, "" + s) : o !== "suppressContentEditableWarning" && o !== "suppressHydrationWarning" && o !== "autoFocus" && (ne.hasOwnProperty(o) ? s != null && o === "onScroll" && oe("scroll", e) : s != null && et(e, o, s, i));
              }
              switch (n) {
                case "input":
                  xr(e), Ui(e, r, !1);
                  break;
                case "textarea":
                  xr(e), Hi(e);
                  break;
                case "option":
                  r.value != null && e.setAttribute("value", "" + J(r.value));
                  break;
                case "select":
                  e.multiple = !!r.multiple, o = r.value, o != null ? fn(e, !!r.multiple, o, !1) : r.defaultValue != null && fn(
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
        if (e && t.stateNode != null) ra(e, t, e.memoizedProps, r);
        else {
          if (typeof r != "string" && t.stateNode === null) throw Error(m(166));
          if (n = nn(cr.current), nn(ht.current), el(t)) {
            if (r = t.stateNode, n = t.memoizedProps, r[mt] = t, (o = r.nodeValue !== n) && (e = We, e !== null)) switch (e.tag) {
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
        if (ie(ae), r = t.memoizedState, e === null || e.memoizedState !== null && e.memoizedState.dehydrated !== null) {
          if (se && Qe !== null && (t.mode & 1) !== 0 && (t.flags & 128) === 0) is(), Nn(), t.flags |= 98560, o = !1;
          else if (o = el(t), r !== null && r.dehydrated !== null) {
            if (e === null) {
              if (!o) throw Error(m(318));
              if (o = t.memoizedState, o = o !== null ? o.dehydrated : null, !o) throw Error(m(317));
              o[mt] = t;
            } else Nn(), (t.flags & 128) === 0 && (t.memoizedState = null), t.flags |= 4;
            Me(t), o = !1;
          } else ot !== null && (yi(ot), ot = null), o = !0;
          if (!o) return t.flags & 65536 ? t : null;
        }
        return (t.flags & 128) !== 0 ? (t.lanes = n, t) : (r = r !== null, r !== (e !== null && e.memoizedState !== null) && r && (t.child.flags |= 8192, (t.mode & 1) !== 0 && (e === null || (ae.current & 1) !== 0 ? ye === 0 && (ye = 3) : ki())), t.updateQueue !== null && (t.flags |= 4), Me(t), null);
      case 4:
        return Tn(), ui(e, t), e === null && rr(t.stateNode.containerInfo), Me(t), null;
      case 10:
        return Io(t.type._context), Me(t), null;
      case 17:
        return De(t.type) && Xr(), Me(t), null;
      case 19:
        if (ie(ae), o = t.memoizedState, o === null) return Me(t), null;
        if (r = (t.flags & 128) !== 0, i = o.rendering, i === null) if (r) hr(o, !1);
        else {
          if (ye !== 0 || e !== null && (e.flags & 128) !== 0) for (e = t.child; e !== null; ) {
            if (i = il(e), i !== null) {
              for (t.flags |= 128, hr(o, !1), r = i.updateQueue, r !== null && (t.updateQueue = r, t.flags |= 4), t.subtreeFlags = 0, r = n, n = t.child; n !== null; ) o = n, e = r, o.flags &= 14680066, i = o.alternate, i === null ? (o.childLanes = 0, o.lanes = e, o.child = null, o.subtreeFlags = 0, o.memoizedProps = null, o.memoizedState = null, o.updateQueue = null, o.dependencies = null, o.stateNode = null) : (o.childLanes = i.childLanes, o.lanes = i.lanes, o.child = i.child, o.subtreeFlags = 0, o.deletions = null, o.memoizedProps = i.memoizedProps, o.memoizedState = i.memoizedState, o.updateQueue = i.updateQueue, o.type = i.type, e = i.dependencies, o.dependencies = e === null ? null : { lanes: e.lanes, firstContext: e.firstContext }), n = n.sibling;
              return le(ae, ae.current & 1 | 2), t.child;
            }
            e = e.sibling;
          }
          o.tail !== null && pe() > jn && (t.flags |= 128, r = !0, hr(o, !1), t.lanes = 4194304);
        }
        else {
          if (!r) if (e = il(i), e !== null) {
            if (t.flags |= 128, r = !0, n = e.updateQueue, n !== null && (t.updateQueue = n, t.flags |= 4), hr(o, !0), o.tail === null && o.tailMode === "hidden" && !i.alternate && !se) return Me(t), null;
          } else 2 * pe() - o.renderingStartTime > jn && n !== 1073741824 && (t.flags |= 128, r = !0, hr(o, !1), t.lanes = 4194304);
          o.isBackwards ? (i.sibling = t.child, t.child = i) : (n = o.last, n !== null ? n.sibling = i : t.child = i, o.last = i);
        }
        return o.tail !== null ? (t = o.tail, o.rendering = t, o.tail = t.sibling, o.renderingStartTime = pe(), t.sibling = null, n = ae.current, le(ae, r ? n & 1 | 2 : n & 1), t) : (Me(t), null);
      case 22:
      case 23:
        return Si(), r = t.memoizedState !== null, e !== null && e.memoizedState !== null !== r && (t.flags |= 8192), r && (t.mode & 1) !== 0 ? (Ke & 1073741824) !== 0 && (Me(t), t.subtreeFlags & 6 && (t.flags |= 8192)) : Me(t), null;
      case 24:
        return null;
      case 25:
        return null;
    }
    throw Error(m(156, t.tag));
  }
  function wf(e, t) {
    switch (Ro(t), t.tag) {
      case 1:
        return De(t.type) && Xr(), e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
      case 3:
        return Tn(), ie(Ie), ie(Ne), Ho(), e = t.flags, (e & 65536) !== 0 && (e & 128) === 0 ? (t.flags = e & -65537 | 128, t) : null;
      case 5:
        return Vo(t), null;
      case 13:
        if (ie(ae), e = t.memoizedState, e !== null && e.dehydrated !== null) {
          if (t.alternate === null) throw Error(m(340));
          Nn();
        }
        return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
      case 19:
        return ie(ae), null;
      case 4:
        return Tn(), null;
      case 10:
        return Io(t.type._context), null;
      case 22:
      case 23:
        return Si(), null;
      case 24:
        return null;
      default:
        return null;
    }
  }
  var hl = !1, Re = !1, Sf = typeof WeakSet == "function" ? WeakSet : Set, C = null;
  function zn(e, t) {
    var n = e.ref;
    if (n !== null) if (typeof n == "function") try {
      n(null);
    } catch (r) {
      de(e, t, r);
    }
    else n.current = null;
  }
  function si(e, t, n) {
    try {
      n();
    } catch (r) {
      de(e, t, r);
    }
  }
  var la = !1;
  function kf(e, t) {
    if (So = Ir, e = Du(), fo(e)) {
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
          var i = 0, u = -1, s = -1, p = 0, y = 0, S = e, v = null;
          t: for (; ; ) {
            for (var x; S !== n || l !== 0 && S.nodeType !== 3 || (u = i + l), S !== o || r !== 0 && S.nodeType !== 3 || (s = i + r), S.nodeType === 3 && (i += S.nodeValue.length), (x = S.firstChild) !== null; )
              v = S, S = x;
            for (; ; ) {
              if (S === e) break t;
              if (v === n && ++p === l && (u = i), v === o && ++y === r && (s = i), (x = S.nextSibling) !== null) break;
              S = v, v = S.parentNode;
            }
            S = x;
          }
          n = u === -1 || s === -1 ? null : { start: u, end: s };
        } else n = null;
      }
      n = n || { start: 0, end: 0 };
    } else n = null;
    for (ko = { focusedElem: e, selectionRange: n }, Ir = !1, C = t; C !== null; ) if (t = C, e = t.child, (t.subtreeFlags & 1028) !== 0 && e !== null) e.return = t, C = e;
    else for (; C !== null; ) {
      t = C;
      try {
        var N = t.alternate;
        if ((t.flags & 1024) !== 0) switch (t.tag) {
          case 0:
          case 11:
          case 15:
            break;
          case 1:
            if (N !== null) {
              var P = N.memoizedProps, me = N.memoizedState, f = t.stateNode, a = f.getSnapshotBeforeUpdate(t.elementType === t.type ? P : it(t.type, P), me);
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
        de(t, t.return, k);
      }
      if (e = t.sibling, e !== null) {
        e.return = t.return, C = e;
        break;
      }
      C = t.return;
    }
    return N = la, la = !1, N;
  }
  function vr(e, t, n) {
    var r = t.updateQueue;
    if (r = r !== null ? r.lastEffect : null, r !== null) {
      var l = r = r.next;
      do {
        if ((l.tag & e) === e) {
          var o = l.destroy;
          l.destroy = void 0, o !== void 0 && si(t, n, o);
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
  function ai(e) {
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
  function oa(e) {
    var t = e.alternate;
    t !== null && (e.alternate = null, oa(t)), e.child = null, e.deletions = null, e.sibling = null, e.tag === 5 && (t = e.stateNode, t !== null && (delete t[mt], delete t[or], delete t[_o], delete t[nf], delete t[rf])), e.stateNode = null, e.return = null, e.dependencies = null, e.memoizedProps = null, e.memoizedState = null, e.pendingProps = null, e.stateNode = null, e.updateQueue = null;
  }
  function ia(e) {
    return e.tag === 5 || e.tag === 3 || e.tag === 4;
  }
  function ua(e) {
    e: for (; ; ) {
      for (; e.sibling === null; ) {
        if (e.return === null || ia(e.return)) return null;
        e = e.return;
      }
      for (e.sibling.return = e.return, e = e.sibling; e.tag !== 5 && e.tag !== 6 && e.tag !== 18; ) {
        if (e.flags & 2 || e.child === null || e.tag === 4) continue e;
        e.child.return = e, e = e.child;
      }
      if (!(e.flags & 2)) return e.stateNode;
    }
  }
  function ci(e, t, n) {
    var r = e.tag;
    if (r === 5 || r === 6) e = e.stateNode, t ? n.nodeType === 8 ? n.parentNode.insertBefore(e, t) : n.insertBefore(e, t) : (n.nodeType === 8 ? (t = n.parentNode, t.insertBefore(e, n)) : (t = n, t.appendChild(e)), n = n._reactRootContainer, n != null || t.onclick !== null || (t.onclick = Gr));
    else if (r !== 4 && (e = e.child, e !== null)) for (ci(e, t, n), e = e.sibling; e !== null; ) ci(e, t, n), e = e.sibling;
  }
  function fi(e, t, n) {
    var r = e.tag;
    if (r === 5 || r === 6) e = e.stateNode, t ? n.insertBefore(e, t) : n.appendChild(e);
    else if (r !== 4 && (e = e.child, e !== null)) for (fi(e, t, n), e = e.sibling; e !== null; ) fi(e, t, n), e = e.sibling;
  }
  var xe = null, ut = !1;
  function Ht(e, t, n) {
    for (n = n.child; n !== null; ) sa(e, t, n), n = n.sibling;
  }
  function sa(e, t, n) {
    if (pt && typeof pt.onCommitFiberUnmount == "function") try {
      pt.onCommitFiberUnmount(Rr, n);
    } catch {
    }
    switch (n.tag) {
      case 5:
        Re || zn(n, t);
      case 6:
        var r = xe, l = ut;
        xe = null, Ht(e, t, n), xe = r, ut = l, xe !== null && (ut ? (e = xe, n = n.stateNode, e.nodeType === 8 ? e.parentNode.removeChild(n) : e.removeChild(n)) : xe.removeChild(n.stateNode));
        break;
      case 18:
        xe !== null && (ut ? (e = xe, n = n.stateNode, e.nodeType === 8 ? Co(e.parentNode, n) : e.nodeType === 1 && Co(e, n), Yn(e)) : Co(xe, n.stateNode));
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
            o = o.tag, i !== void 0 && ((o & 2) !== 0 || (o & 4) !== 0) && si(n, t, i), l = l.next;
          } while (l !== r);
        }
        Ht(e, t, n);
        break;
      case 1:
        if (!Re && (zn(n, t), r = n.stateNode, typeof r.componentWillUnmount == "function")) try {
          r.props = n.memoizedProps, r.state = n.memoizedState, r.componentWillUnmount();
        } catch (u) {
          de(n, t, u);
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
  function aa(e) {
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
        sa(o, i, l), xe = null, ut = !1;
        var s = l.alternate;
        s !== null && (s.return = null), l.return = null;
      } catch (p) {
        de(l, t, p);
      }
    }
    if (t.subtreeFlags & 12854) for (t = t.child; t !== null; ) ca(t, e), t = t.sibling;
  }
  function ca(e, t) {
    var n = e.alternate, r = e.flags;
    switch (e.tag) {
      case 0:
      case 11:
      case 14:
      case 15:
        if (st(t, e), gt(e), r & 4) {
          try {
            vr(3, e, e.return), vl(3, e);
          } catch (P) {
            de(e, e.return, P);
          }
          try {
            vr(5, e, e.return);
          } catch (P) {
            de(e, e.return, P);
          }
        }
        break;
      case 1:
        st(t, e), gt(e), r & 512 && n !== null && zn(n, n.return);
        break;
      case 5:
        if (st(t, e), gt(e), r & 512 && n !== null && zn(n, n.return), e.flags & 32) {
          var l = e.stateNode;
          try {
            Fn(l, "");
          } catch (P) {
            de(e, e.return, P);
          }
        }
        if (r & 4 && (l = e.stateNode, l != null)) {
          var o = e.memoizedProps, i = n !== null ? n.memoizedProps : o, u = e.type, s = e.updateQueue;
          if (e.updateQueue = null, s !== null) try {
            u === "input" && o.type === "radio" && o.name != null && Ai(l, o), Bl(u, i);
            var p = Bl(u, o);
            for (i = 0; i < s.length; i += 2) {
              var y = s[i], S = s[i + 1];
              y === "style" ? Ki(l, S) : y === "dangerouslySetInnerHTML" ? Wi(l, S) : y === "children" ? Fn(l, S) : et(l, y, S, p);
            }
            switch (u) {
              case "input":
                Dl(l, o);
                break;
              case "textarea":
                Bi(l, o);
                break;
              case "select":
                var v = l._wrapperState.wasMultiple;
                l._wrapperState.wasMultiple = !!o.multiple;
                var x = o.value;
                x != null ? fn(l, !!o.multiple, x, !1) : v !== !!o.multiple && (o.defaultValue != null ? fn(
                  l,
                  !!o.multiple,
                  o.defaultValue,
                  !0
                ) : fn(l, !!o.multiple, o.multiple ? [] : "", !1));
            }
            l[or] = o;
          } catch (P) {
            de(e, e.return, P);
          }
        }
        break;
      case 6:
        if (st(t, e), gt(e), r & 4) {
          if (e.stateNode === null) throw Error(m(162));
          l = e.stateNode, o = e.memoizedProps;
          try {
            l.nodeValue = o;
          } catch (P) {
            de(e, e.return, P);
          }
        }
        break;
      case 3:
        if (st(t, e), gt(e), r & 4 && n !== null && n.memoizedState.isDehydrated) try {
          Yn(t.containerInfo);
        } catch (P) {
          de(e, e.return, P);
        }
        break;
      case 4:
        st(t, e), gt(e);
        break;
      case 13:
        st(t, e), gt(e), l = e.child, l.flags & 8192 && (o = l.memoizedState !== null, l.stateNode.isHidden = o, !o || l.alternate !== null && l.alternate.memoizedState !== null || (mi = pe())), r & 4 && aa(e);
        break;
      case 22:
        if (y = n !== null && n.memoizedState !== null, e.mode & 1 ? (Re = (p = Re) || y, st(t, e), Re = p) : st(t, e), gt(e), r & 8192) {
          if (p = e.memoizedState !== null, (e.stateNode.isHidden = p) && !y && (e.mode & 1) !== 0) for (C = e, y = e.child; y !== null; ) {
            for (S = C = y; C !== null; ) {
              switch (v = C, x = v.child, v.tag) {
                case 0:
                case 11:
                case 14:
                case 15:
                  vr(4, v, v.return);
                  break;
                case 1:
                  zn(v, v.return);
                  var N = v.stateNode;
                  if (typeof N.componentWillUnmount == "function") {
                    r = v, n = v.return;
                    try {
                      t = r, N.props = t.memoizedProps, N.state = t.memoizedState, N.componentWillUnmount();
                    } catch (P) {
                      de(r, n, P);
                    }
                  }
                  break;
                case 5:
                  zn(v, v.return);
                  break;
                case 22:
                  if (v.memoizedState !== null) {
                    pa(S);
                    continue;
                  }
              }
              x !== null ? (x.return = v, C = x) : pa(S);
            }
            y = y.sibling;
          }
          e: for (y = null, S = e; ; ) {
            if (S.tag === 5) {
              if (y === null) {
                y = S;
                try {
                  l = S.stateNode, p ? (o = l.style, typeof o.setProperty == "function" ? o.setProperty("display", "none", "important") : o.display = "none") : (u = S.stateNode, s = S.memoizedProps.style, i = s != null && s.hasOwnProperty("display") ? s.display : null, u.style.display = Qi("display", i));
                } catch (P) {
                  de(e, e.return, P);
                }
              }
            } else if (S.tag === 6) {
              if (y === null) try {
                S.stateNode.nodeValue = p ? "" : S.memoizedProps;
              } catch (P) {
                de(e, e.return, P);
              }
            } else if ((S.tag !== 22 && S.tag !== 23 || S.memoizedState === null || S === e) && S.child !== null) {
              S.child.return = S, S = S.child;
              continue;
            }
            if (S === e) break e;
            for (; S.sibling === null; ) {
              if (S.return === null || S.return === e) break e;
              y === S && (y = null), S = S.return;
            }
            y === S && (y = null), S.sibling.return = S.return, S = S.sibling;
          }
        }
        break;
      case 19:
        st(t, e), gt(e), r & 4 && aa(e);
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
            if (ia(n)) {
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
            var o = ua(e);
            fi(e, o, l);
            break;
          case 3:
          case 4:
            var i = r.stateNode.containerInfo, u = ua(e);
            ci(e, u, i);
            break;
          default:
            throw Error(m(161));
        }
      } catch (s) {
        de(e, e.return, s);
      }
      e.flags &= -3;
    }
    t & 4096 && (e.flags &= -4097);
  }
  function Ef(e, t, n) {
    C = e, fa(e);
  }
  function fa(e, t, n) {
    for (var r = (e.mode & 1) !== 0; C !== null; ) {
      var l = C, o = l.child;
      if (l.tag === 22 && r) {
        var i = l.memoizedState !== null || hl;
        if (!i) {
          var u = l.alternate, s = u !== null && u.memoizedState !== null || Re;
          u = hl;
          var p = Re;
          if (hl = i, (Re = s) && !p) for (C = l; C !== null; ) i = C, s = i.child, i.tag === 22 && i.memoizedState !== null ? ma(l) : s !== null ? (s.return = i, C = s) : ma(l);
          for (; o !== null; ) C = o, fa(o), o = o.sibling;
          C = l, hl = u, Re = p;
        }
        da(e);
      } else (l.subtreeFlags & 8772) !== 0 && o !== null ? (o.return = l, C = o) : da(e);
    }
  }
  function da(e) {
    for (; C !== null; ) {
      var t = C;
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
              o !== null && ps(t, o, r);
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
                ps(t, i, n);
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
                  var y = p.memoizedState;
                  if (y !== null) {
                    var S = y.dehydrated;
                    S !== null && Yn(S);
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
          Re || t.flags & 512 && ai(t);
        } catch (v) {
          de(t, t.return, v);
        }
      }
      if (t === e) {
        C = null;
        break;
      }
      if (n = t.sibling, n !== null) {
        n.return = t.return, C = n;
        break;
      }
      C = t.return;
    }
  }
  function pa(e) {
    for (; C !== null; ) {
      var t = C;
      if (t === e) {
        C = null;
        break;
      }
      var n = t.sibling;
      if (n !== null) {
        n.return = t.return, C = n;
        break;
      }
      C = t.return;
    }
  }
  function ma(e) {
    for (; C !== null; ) {
      var t = C;
      try {
        switch (t.tag) {
          case 0:
          case 11:
          case 15:
            var n = t.return;
            try {
              vl(4, t);
            } catch (s) {
              de(t, n, s);
            }
            break;
          case 1:
            var r = t.stateNode;
            if (typeof r.componentDidMount == "function") {
              var l = t.return;
              try {
                r.componentDidMount();
              } catch (s) {
                de(t, l, s);
              }
            }
            var o = t.return;
            try {
              ai(t);
            } catch (s) {
              de(t, o, s);
            }
            break;
          case 5:
            var i = t.return;
            try {
              ai(t);
            } catch (s) {
              de(t, i, s);
            }
        }
      } catch (s) {
        de(t, t.return, s);
      }
      if (t === e) {
        C = null;
        break;
      }
      var u = t.sibling;
      if (u !== null) {
        u.return = t.return, C = u;
        break;
      }
      C = t.return;
    }
  }
  var xf = Math.ceil, gl = _e.ReactCurrentDispatcher, di = _e.ReactCurrentOwner, Je = _e.ReactCurrentBatchConfig, $ = 0, Se = null, ve = null, Ce = 0, Ke = 0, On = Ft(0), ye = 0, gr = null, ln = 0, yl = 0, pi = 0, yr = null, Ae = null, mi = 0, jn = 1 / 0, Mt = null, wl = !1, hi = null, $t = null, Sl = !1, Wt = null, kl = 0, wr = 0, vi = null, El = -1, xl = 0;
  function ze() {
    return ($ & 6) !== 0 ? pe() : El !== -1 ? El : El = pe();
  }
  function Qt(e) {
    return (e.mode & 1) === 0 ? 1 : ($ & 2) !== 0 && Ce !== 0 ? Ce & -Ce : of.transition !== null ? (xl === 0 && (xl = uu()), xl) : (e = b, e !== 0 || (e = window.event, e = e === void 0 ? 16 : vu(e.type)), e);
  }
  function at(e, t, n, r) {
    if (50 < wr) throw wr = 0, vi = null, Error(m(185));
    $n(e, n, r), (($ & 2) === 0 || e !== Se) && (e === Se && (($ & 2) === 0 && (yl |= n), ye === 4 && Kt(e, Ce)), Ue(e, r), n === 1 && $ === 0 && (t.mode & 1) === 0 && (jn = pe() + 500, Zr && Ut()));
  }
  function Ue(e, t) {
    var n = e.callbackNode;
    oc(e, t);
    var r = zr(e, e === Se ? Ce : 0);
    if (r === 0) n !== null && lu(n), e.callbackNode = null, e.callbackPriority = 0;
    else if (t = r & -r, e.callbackPriority !== t) {
      if (n != null && lu(n), t === 1) e.tag === 0 ? lf(va.bind(null, e)) : ts(va.bind(null, e)), ef(function() {
        ($ & 6) === 0 && Ut();
      }), n = null;
      else {
        switch (su(r)) {
          case 1:
            n = Yl;
            break;
          case 4:
            n = ou;
            break;
          case 16:
            n = Mr;
            break;
          case 536870912:
            n = iu;
            break;
          default:
            n = Mr;
        }
        n = Ca(n, ha.bind(null, e));
      }
      e.callbackPriority = t, e.callbackNode = n;
    }
  }
  function ha(e, t) {
    if (El = -1, xl = 0, ($ & 6) !== 0) throw Error(m(327));
    var n = e.callbackNode;
    if (In() && e.callbackNode !== n) return null;
    var r = zr(e, e === Se ? Ce : 0);
    if (r === 0) return null;
    if ((r & 30) !== 0 || (r & e.expiredLanes) !== 0 || t) t = Cl(e, r);
    else {
      t = r;
      var l = $;
      $ |= 2;
      var o = ya();
      (Se !== e || Ce !== t) && (Mt = null, jn = pe() + 500, un(e, t));
      do
        try {
          Nf();
          break;
        } catch (u) {
          ga(e, u);
        }
      while (!0);
      jo(), gl.current = o, $ = l, ve !== null ? t = 0 : (Se = null, Ce = 0, t = ye);
    }
    if (t !== 0) {
      if (t === 2 && (l = Xl(e), l !== 0 && (r = l, t = gi(e, l))), t === 1) throw n = gr, un(e, 0), Kt(e, r), Ue(e, pe()), n;
      if (t === 6) Kt(e, r);
      else {
        if (l = e.current.alternate, (r & 30) === 0 && !Cf(l) && (t = Cl(e, r), t === 2 && (o = Xl(e), o !== 0 && (r = o, t = gi(e, o))), t === 1)) throw n = gr, un(e, 0), Kt(e, r), Ue(e, pe()), n;
        switch (e.finishedWork = l, e.finishedLanes = r, t) {
          case 0:
          case 1:
            throw Error(m(345));
          case 2:
            sn(e, Ae, Mt);
            break;
          case 3:
            if (Kt(e, r), (r & 130023424) === r && (t = mi + 500 - pe(), 10 < t)) {
              if (zr(e, 0) !== 0) break;
              if (l = e.suspendedLanes, (l & r) !== r) {
                ze(), e.pingedLanes |= e.suspendedLanes & l;
                break;
              }
              e.timeoutHandle = xo(sn.bind(null, e, Ae, Mt), t);
              break;
            }
            sn(e, Ae, Mt);
            break;
          case 4:
            if (Kt(e, r), (r & 4194240) === r) break;
            for (t = e.eventTimes, l = -1; 0 < r; ) {
              var i = 31 - rt(r);
              o = 1 << i, i = t[i], i > l && (l = i), r &= ~o;
            }
            if (r = l, r = pe() - r, r = (120 > r ? 120 : 480 > r ? 480 : 1080 > r ? 1080 : 1920 > r ? 1920 : 3e3 > r ? 3e3 : 4320 > r ? 4320 : 1960 * xf(r / 1960)) - r, 10 < r) {
              e.timeoutHandle = xo(sn.bind(null, e, Ae, Mt), r);
              break;
            }
            sn(e, Ae, Mt);
            break;
          case 5:
            sn(e, Ae, Mt);
            break;
          default:
            throw Error(m(329));
        }
      }
    }
    return Ue(e, pe()), e.callbackNode === n ? ha.bind(null, e) : null;
  }
  function gi(e, t) {
    var n = yr;
    return e.current.memoizedState.isDehydrated && (un(e, t).flags |= 256), e = Cl(e, t), e !== 2 && (t = Ae, Ae = n, t !== null && yi(t)), e;
  }
  function yi(e) {
    Ae === null ? Ae = e : Ae.push.apply(Ae, e);
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
    for (t &= ~pi, t &= ~yl, e.suspendedLanes |= t, e.pingedLanes &= ~t, e = e.expirationTimes; 0 < t; ) {
      var n = 31 - rt(t), r = 1 << n;
      e[n] = -1, t &= ~r;
    }
  }
  function va(e) {
    if (($ & 6) !== 0) throw Error(m(327));
    In();
    var t = zr(e, 0);
    if ((t & 1) === 0) return Ue(e, pe()), null;
    var n = Cl(e, t);
    if (e.tag !== 0 && n === 2) {
      var r = Xl(e);
      r !== 0 && (t = r, n = gi(e, r));
    }
    if (n === 1) throw n = gr, un(e, 0), Kt(e, t), Ue(e, pe()), n;
    if (n === 6) throw Error(m(345));
    return e.finishedWork = e.current.alternate, e.finishedLanes = t, sn(e, Ae, Mt), Ue(e, pe()), null;
  }
  function wi(e, t) {
    var n = $;
    $ |= 1;
    try {
      return e(t);
    } finally {
      $ = n, $ === 0 && (jn = pe() + 500, Zr && Ut());
    }
  }
  function on(e) {
    Wt !== null && Wt.tag === 0 && ($ & 6) === 0 && In();
    var t = $;
    $ |= 1;
    var n = Je.transition, r = b;
    try {
      if (Je.transition = null, b = 1, e) return e();
    } finally {
      b = r, Je.transition = n, $ = t, ($ & 6) === 0 && Ut();
    }
  }
  function Si() {
    Ke = On.current, ie(On);
  }
  function un(e, t) {
    e.finishedWork = null, e.finishedLanes = 0;
    var n = e.timeoutHandle;
    if (n !== -1 && (e.timeoutHandle = -1, bc(n)), ve !== null) for (n = ve.return; n !== null; ) {
      var r = n;
      switch (Ro(r), r.tag) {
        case 1:
          r = r.type.childContextTypes, r != null && Xr();
          break;
        case 3:
          Tn(), ie(Ie), ie(Ne), Ho();
          break;
        case 5:
          Vo(r);
          break;
        case 4:
          Tn();
          break;
        case 13:
          ie(ae);
          break;
        case 19:
          ie(ae);
          break;
        case 10:
          Io(r.type._context);
          break;
        case 22:
        case 23:
          Si();
      }
      n = n.return;
    }
    if (Se = e, ve = e = Gt(e.current, null), Ce = Ke = t, ye = 0, gr = null, pi = yl = ln = 0, Ae = yr = null, tn !== null) {
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
  function ga(e, t) {
    do {
      var n = ve;
      try {
        if (jo(), ul.current = fl, sl) {
          for (var r = ce.memoizedState; r !== null; ) {
            var l = r.queue;
            l !== null && (l.pending = null), r = r.next;
          }
          sl = !1;
        }
        if (rn = 0, we = ge = ce = null, fr = !1, dr = 0, di.current = null, n === null || n.return === null) {
          ye = 1, gr = t, ve = null;
          break;
        }
        e: {
          var o = e, i = n.return, u = n, s = t;
          if (t = Ce, u.flags |= 32768, s !== null && typeof s == "object" && typeof s.then == "function") {
            var p = s, y = u, S = y.tag;
            if ((y.mode & 1) === 0 && (S === 0 || S === 11 || S === 15)) {
              var v = y.alternate;
              v ? (y.updateQueue = v.updateQueue, y.memoizedState = v.memoizedState, y.lanes = v.lanes) : (y.updateQueue = null, y.memoizedState = null);
            }
            var x = Hs(i);
            if (x !== null) {
              x.flags &= -257, $s(x, i, u, o, t), x.mode & 1 && Bs(o, p, t), t = x, s = p;
              var N = t.updateQueue;
              if (N === null) {
                var P = /* @__PURE__ */ new Set();
                P.add(s), t.updateQueue = P;
              } else N.add(s);
              break e;
            } else {
              if ((t & 1) === 0) {
                Bs(o, p, t), ki();
                break e;
              }
              s = Error(m(426));
            }
          } else if (se && u.mode & 1) {
            var me = Hs(i);
            if (me !== null) {
              (me.flags & 65536) === 0 && (me.flags |= 256), $s(me, i, u, o, t), zo(Ln(s, u));
              break e;
            }
          }
          o = s = Ln(s, u), ye !== 4 && (ye = 2), yr === null ? yr = [o] : yr.push(o), o = i;
          do {
            switch (o.tag) {
              case 3:
                o.flags |= 65536, t &= -t, o.lanes |= t;
                var f = Us(o, s, t);
                ds(o, f);
                break e;
              case 1:
                u = s;
                var a = o.type, d = o.stateNode;
                if ((o.flags & 128) === 0 && (typeof a.getDerivedStateFromError == "function" || d !== null && typeof d.componentDidCatch == "function" && ($t === null || !$t.has(d)))) {
                  o.flags |= 65536, t &= -t, o.lanes |= t;
                  var k = Vs(o, u, t);
                  ds(o, k);
                  break e;
                }
            }
            o = o.return;
          } while (o !== null);
        }
        Sa(n);
      } catch (M) {
        t = M, ve === n && n !== null && (ve = n = n.return);
        continue;
      }
      break;
    } while (!0);
  }
  function ya() {
    var e = gl.current;
    return gl.current = fl, e === null ? fl : e;
  }
  function ki() {
    (ye === 0 || ye === 3 || ye === 2) && (ye = 4), Se === null || (ln & 268435455) === 0 && (yl & 268435455) === 0 || Kt(Se, Ce);
  }
  function Cl(e, t) {
    var n = $;
    $ |= 2;
    var r = ya();
    (Se !== e || Ce !== t) && (Mt = null, un(e, t));
    do
      try {
        _f();
        break;
      } catch (l) {
        ga(e, l);
      }
    while (!0);
    if (jo(), $ = n, gl.current = r, ve !== null) throw Error(m(261));
    return Se = null, Ce = 0, ye;
  }
  function _f() {
    for (; ve !== null; ) wa(ve);
  }
  function Nf() {
    for (; ve !== null && !qa(); ) wa(ve);
  }
  function wa(e) {
    var t = xa(e.alternate, e, Ke);
    e.memoizedProps = e.pendingProps, t === null ? Sa(e) : ve = t, di.current = null;
  }
  function Sa(e) {
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
    var r = b, l = Je.transition;
    try {
      Je.transition = null, b = 1, Pf(e, t, n, r);
    } finally {
      Je.transition = l, b = r;
    }
    return null;
  }
  function Pf(e, t, n, r) {
    do
      In();
    while (Wt !== null);
    if (($ & 6) !== 0) throw Error(m(327));
    n = e.finishedWork;
    var l = e.finishedLanes;
    if (n === null) return null;
    if (e.finishedWork = null, e.finishedLanes = 0, n === e.current) throw Error(m(177));
    e.callbackNode = null, e.callbackPriority = 0;
    var o = n.lanes | n.childLanes;
    if (ic(e, o), e === Se && (ve = Se = null, Ce = 0), (n.subtreeFlags & 2064) === 0 && (n.flags & 2064) === 0 || Sl || (Sl = !0, Ca(Mr, function() {
      return In(), null;
    })), o = (n.flags & 15990) !== 0, (n.subtreeFlags & 15990) !== 0 || o) {
      o = Je.transition, Je.transition = null;
      var i = b;
      b = 1;
      var u = $;
      $ |= 4, di.current = null, kf(e, n), ca(n, e), Kc(ko), Ir = !!So, ko = So = null, e.current = n, Ef(n), Za(), $ = u, b = i, Je.transition = o;
    } else e.current = n;
    if (Sl && (Sl = !1, Wt = e, kl = l), o = e.pendingLanes, o === 0 && ($t = null), ec(n.stateNode), Ue(e, pe()), t !== null) for (r = e.onRecoverableError, n = 0; n < t.length; n++) l = t[n], r(l.value, { componentStack: l.stack, digest: l.digest });
    if (wl) throw wl = !1, e = hi, hi = null, e;
    return (kl & 1) !== 0 && e.tag !== 0 && In(), o = e.pendingLanes, (o & 1) !== 0 ? e === vi ? wr++ : (wr = 0, vi = e) : wr = 0, Ut(), null;
  }
  function In() {
    if (Wt !== null) {
      var e = su(kl), t = Je.transition, n = b;
      try {
        if (Je.transition = null, b = 16 > e ? 16 : e, Wt === null) var r = !1;
        else {
          if (e = Wt, Wt = null, kl = 0, ($ & 6) !== 0) throw Error(m(331));
          var l = $;
          for ($ |= 4, C = e.current; C !== null; ) {
            var o = C, i = o.child;
            if ((C.flags & 16) !== 0) {
              var u = o.deletions;
              if (u !== null) {
                for (var s = 0; s < u.length; s++) {
                  var p = u[s];
                  for (C = p; C !== null; ) {
                    var y = C;
                    switch (y.tag) {
                      case 0:
                      case 11:
                      case 15:
                        vr(8, y, o);
                    }
                    var S = y.child;
                    if (S !== null) S.return = y, C = S;
                    else for (; C !== null; ) {
                      y = C;
                      var v = y.sibling, x = y.return;
                      if (oa(y), y === p) {
                        C = null;
                        break;
                      }
                      if (v !== null) {
                        v.return = x, C = v;
                        break;
                      }
                      C = x;
                    }
                  }
                }
                var N = o.alternate;
                if (N !== null) {
                  var P = N.child;
                  if (P !== null) {
                    N.child = null;
                    do {
                      var me = P.sibling;
                      P.sibling = null, P = me;
                    } while (P !== null);
                  }
                }
                C = o;
              }
            }
            if ((o.subtreeFlags & 2064) !== 0 && i !== null) i.return = o, C = i;
            else e: for (; C !== null; ) {
              if (o = C, (o.flags & 2048) !== 0) switch (o.tag) {
                case 0:
                case 11:
                case 15:
                  vr(9, o, o.return);
              }
              var f = o.sibling;
              if (f !== null) {
                f.return = o.return, C = f;
                break e;
              }
              C = o.return;
            }
          }
          var a = e.current;
          for (C = a; C !== null; ) {
            i = C;
            var d = i.child;
            if ((i.subtreeFlags & 2064) !== 0 && d !== null) d.return = i, C = d;
            else e: for (i = a; C !== null; ) {
              if (u = C, (u.flags & 2048) !== 0) try {
                switch (u.tag) {
                  case 0:
                  case 11:
                  case 15:
                    vl(9, u);
                }
              } catch (M) {
                de(u, u.return, M);
              }
              if (u === i) {
                C = null;
                break e;
              }
              var k = u.sibling;
              if (k !== null) {
                k.return = u.return, C = k;
                break e;
              }
              C = u.return;
            }
          }
          if ($ = l, Ut(), pt && typeof pt.onPostCommitFiberRoot == "function") try {
            pt.onPostCommitFiberRoot(Rr, e);
          } catch {
          }
          r = !0;
        }
        return r;
      } finally {
        b = n, Je.transition = t;
      }
    }
    return !1;
  }
  function ka(e, t, n) {
    t = Ln(n, t), t = Us(e, t, 1), e = Bt(e, t, 1), t = ze(), e !== null && ($n(e, 1, t), Ue(e, t));
  }
  function de(e, t, n) {
    if (e.tag === 3) ka(e, e, n);
    else for (; t !== null; ) {
      if (t.tag === 3) {
        ka(t, e, n);
        break;
      } else if (t.tag === 1) {
        var r = t.stateNode;
        if (typeof t.type.getDerivedStateFromError == "function" || typeof r.componentDidCatch == "function" && ($t === null || !$t.has(r))) {
          e = Ln(n, e), e = Vs(t, e, 1), t = Bt(t, e, 1), e = ze(), t !== null && ($n(t, 1, e), Ue(t, e));
          break;
        }
      }
      t = t.return;
    }
  }
  function Mf(e, t, n) {
    var r = e.pingCache;
    r !== null && r.delete(t), t = ze(), e.pingedLanes |= e.suspendedLanes & n, Se === e && (Ce & n) === n && (ye === 4 || ye === 3 && (Ce & 130023424) === Ce && 500 > pe() - mi ? un(e, 0) : pi |= n), Ue(e, t);
  }
  function Ea(e, t) {
    t === 0 && ((e.mode & 1) === 0 ? t = 1 : (t = Lr, Lr <<= 1, (Lr & 130023424) === 0 && (Lr = 4194304)));
    var n = ze();
    e = _t(e, t), e !== null && ($n(e, t, n), Ue(e, n));
  }
  function Rf(e) {
    var t = e.memoizedState, n = 0;
    t !== null && (n = t.retryLane), Ea(e, n);
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
    r !== null && r.delete(t), Ea(e, n);
  }
  var xa;
  xa = function(e, t, n) {
    if (e !== null) if (e.memoizedProps !== t.pendingProps || Ie.current) Fe = !0;
    else {
      if ((e.lanes & n) === 0 && (t.flags & 128) === 0) return Fe = !1, gf(e, t, n);
      Fe = (e.flags & 131072) !== 0;
    }
    else Fe = !1, se && (t.flags & 1048576) !== 0 && ns(t, br, t.index);
    switch (t.lanes = 0, t.tag) {
      case 2:
        var r = t.type;
        ml(e, t), e = t.pendingProps;
        var l = xn(t, Ne.current);
        Rn(t, n), l = Qo(null, t, r, e, l, n);
        var o = Ko();
        return t.flags |= 1, typeof l == "object" && l !== null && typeof l.render == "function" && l.$$typeof === void 0 ? (t.tag = 1, t.memoizedState = null, t.updateQueue = null, De(r) ? (o = !0, qr(t)) : o = !1, t.memoizedState = l.state !== null && l.state !== void 0 ? l.state : null, Ao(t), l.updater = dl, t.stateNode = l, l._reactInternals = t, Jo(t, r, e, n), t = ni(null, t, r, !0, o, n)) : (t.tag = 0, se && o && Mo(t), Le(null, t, l, n), t = t.child), t;
      case 16:
        r = t.elementType;
        e: {
          switch (ml(e, t), e = t.pendingProps, l = r._init, r = l(r._payload), t.type = r, l = t.tag = zf(r), e = it(r, e), l) {
            case 0:
              t = ti(null, t, r, e, n);
              break e;
            case 1:
              t = Xs(null, t, r, e, n);
              break e;
            case 11:
              t = Ws(null, t, r, e, n);
              break e;
            case 14:
              t = Qs(null, t, r, it(r.type, e), n);
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
        return r = t.type, l = t.pendingProps, l = t.elementType === r ? l : it(r, l), ti(e, t, r, l, n);
      case 1:
        return r = t.type, l = t.pendingProps, l = t.elementType === r ? l : it(r, l), Xs(e, t, r, l, n);
      case 3:
        e: {
          if (qs(t), e === null) throw Error(m(387));
          r = t.pendingProps, o = t.memoizedState, l = o.element, fs(e, t), ol(t, r, null, n);
          var i = t.memoizedState;
          if (r = i.element, o.isDehydrated) if (o = { element: r, isDehydrated: !1, cache: i.cache, pendingSuspenseBoundaries: i.pendingSuspenseBoundaries, transitions: i.transitions }, t.updateQueue.baseState = o, t.memoizedState = o, t.flags & 256) {
            l = Ln(Error(m(423)), t), t = Zs(e, t, r, n, l);
            break e;
          } else if (r !== l) {
            l = Ln(Error(m(424)), t), t = Zs(e, t, r, n, l);
            break e;
          } else for (Qe = Dt(t.stateNode.containerInfo.firstChild), We = t, se = !0, ot = null, n = as(t, null, r, n), t.child = n; n; ) n.flags = n.flags & -3 | 4096, n = n.sibling;
          else {
            if (Nn(), r === l) {
              t = Pt(e, t, n);
              break e;
            }
            Le(e, t, r, n);
          }
          t = t.child;
        }
        return t;
      case 5:
        return ms(t), e === null && Lo(t), r = t.type, l = t.pendingProps, o = e !== null ? e.memoizedProps : null, i = l.children, Eo(r, l) ? i = null : o !== null && Eo(r, o) && (t.flags |= 32), Ys(e, t), Le(e, t, i, n), t.child;
      case 6:
        return e === null && Lo(t), null;
      case 13:
        return Js(e, t, n);
      case 4:
        return Uo(t, t.stateNode.containerInfo), r = t.pendingProps, e === null ? t.child = Pn(t, null, r, n) : Le(e, t, r, n), t.child;
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
          if (r = t.type._context, l = t.pendingProps, o = t.memoizedProps, i = l.value, le(nl, r._currentValue), r._currentValue = i, o !== null) if (lt(o.value, i)) {
            if (o.children === l.children && !Ie.current) {
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
                      var y = p.pending;
                      y === null ? s.next = s : (s.next = y.next, y.next = s), p.pending = s;
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
        return l = t.type, r = t.pendingProps.children, Rn(t, n), l = qe(l), r = r(l), t.flags |= 1, Le(e, t, r, n), t.child;
      case 14:
        return r = t.type, l = it(r, t.pendingProps), l = it(r.type, l), Qs(e, t, r, l, n);
      case 15:
        return Ks(e, t, t.type, t.pendingProps, n);
      case 17:
        return r = t.type, l = t.pendingProps, l = t.elementType === r ? l : it(r, l), ml(e, t), t.tag = 1, De(r) ? (e = !0, qr(t)) : e = !1, Rn(t, n), Fs(t, r, l), Jo(t, r, l, n), ni(null, t, r, !0, e, n);
      case 19:
        return ea(e, t, n);
      case 22:
        return Gs(e, t, n);
    }
    throw Error(m(156, t.tag));
  };
  function Ca(e, t) {
    return ru(e, t);
  }
  function Lf(e, t, n, r) {
    this.tag = e, this.key = n, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.ref = null, this.pendingProps = t, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = r, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null;
  }
  function be(e, t, n, r) {
    return new Lf(e, t, n, r);
  }
  function Ei(e) {
    return e = e.prototype, !(!e || !e.isReactComponent);
  }
  function zf(e) {
    if (typeof e == "function") return Ei(e) ? 1 : 0;
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
    if (r = e, typeof e == "function") Ei(e) && (i = 1);
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
      case fe:
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
    return e = be(22, e, r, t), e.elementType = fe, e.lanes = n, e.stateNode = { isHidden: !1 }, e;
  }
  function xi(e, t, n) {
    return e = be(6, e, null, t), e.lanes = n, e;
  }
  function Ci(e, t, n) {
    return t = be(4, e.children !== null ? e.children : [], e.key, t), t.lanes = n, t.stateNode = { containerInfo: e.containerInfo, pendingChildren: null, implementation: e.implementation }, t;
  }
  function Of(e, t, n, r, l) {
    this.tag = t, this.containerInfo = e, this.finishedWork = this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = -1, this.callbackNode = this.pendingContext = this.context = null, this.callbackPriority = 0, this.eventTimes = ql(0), this.expirationTimes = ql(-1), this.entangledLanes = this.finishedLanes = this.mutableReadLanes = this.expiredLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = ql(0), this.identifierPrefix = r, this.onRecoverableError = l, this.mutableSourceEagerHydrationData = null;
  }
  function _i(e, t, n, r, l, o, i, u, s) {
    return e = new Of(e, t, n, u, s), t === 1 ? (t = 1, o === !0 && (t |= 8)) : t = 0, o = be(3, null, null, t), e.current = o, o.stateNode = e, o.memoizedState = { element: r, isDehydrated: n, cache: null, transitions: null, pendingSuspenseBoundaries: null }, Ao(o), e;
  }
  function jf(e, t, n) {
    var r = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
    return { $$typeof: Te, key: r == null ? null : "" + r, children: e, containerInfo: t, implementation: n };
  }
  function _a(e) {
    if (!e) return At;
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
            if (De(t.type)) {
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
      if (De(n)) return bu(e, n, t);
    }
    return t;
  }
  function Na(e, t, n, r, l, o, i, u, s) {
    return e = _i(n, r, !0, e, l, o, i, u, s), e.context = _a(null), n = e.current, r = ze(), l = Qt(n), o = Nt(r, l), o.callback = t ?? null, Bt(n, o, l), e.current.lanes = l, $n(e, l, r), Ue(e, r), e;
  }
  function Pl(e, t, n, r) {
    var l = t.current, o = ze(), i = Qt(l);
    return n = _a(n), t.context === null ? t.context = n : t.pendingContext = n, t = Nt(o, i), t.payload = { element: e }, r = r === void 0 ? null : r, r !== null && (t.callback = r), e = Bt(l, t, i), e !== null && (at(e, l, i, o), ll(e, l, i)), i;
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
  function Pa(e, t) {
    if (e = e.memoizedState, e !== null && e.dehydrated !== null) {
      var n = e.retryLane;
      e.retryLane = n !== 0 && n < t ? n : t;
    }
  }
  function Ni(e, t) {
    Pa(e, t), (e = e.alternate) && Pa(e, t);
  }
  function If() {
    return null;
  }
  var Ma = typeof reportError == "function" ? reportError : function(e) {
    console.error(e);
  };
  function Pi(e) {
    this._internalRoot = e;
  }
  Rl.prototype.render = Pi.prototype.render = function(e) {
    var t = this._internalRoot;
    if (t === null) throw Error(m(409));
    Pl(e, t, null, null);
  }, Rl.prototype.unmount = Pi.prototype.unmount = function() {
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
      var t = fu();
      e = { blockedOn: null, target: e, priority: t };
      for (var n = 0; n < Ot.length && t !== 0 && t < Ot[n].priority; n++) ;
      Ot.splice(n, 0, e), n === 0 && mu(e);
    }
  };
  function Mi(e) {
    return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11);
  }
  function Tl(e) {
    return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11 && (e.nodeType !== 8 || e.nodeValue !== " react-mount-point-unstable "));
  }
  function Ra() {
  }
  function Df(e, t, n, r, l) {
    if (l) {
      if (typeof r == "function") {
        var o = r;
        r = function() {
          var p = Ml(i);
          o.call(p);
        };
      }
      var i = Na(t, r, e, 0, null, !1, !1, "", Ra);
      return e._reactRootContainer = i, e[kt] = i.current, rr(e.nodeType === 8 ? e.parentNode : e), on(), i;
    }
    for (; l = e.lastChild; ) e.removeChild(l);
    if (typeof r == "function") {
      var u = r;
      r = function() {
        var p = Ml(s);
        u.call(p);
      };
    }
    var s = _i(e, 0, !1, null, null, !1, !1, "", Ra);
    return e._reactRootContainer = s, e[kt] = s.current, rr(e.nodeType === 8 ? e.parentNode : e), on(function() {
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
    } else i = Df(n, t, e, l, r);
    return Ml(i);
  }
  au = function(e) {
    switch (e.tag) {
      case 3:
        var t = e.stateNode;
        if (t.current.memoizedState.isDehydrated) {
          var n = Hn(t.pendingLanes);
          n !== 0 && (Zl(t, n | 1), Ue(t, pe()), ($ & 6) === 0 && (jn = pe() + 500, Ut()));
        }
        break;
      case 13:
        on(function() {
          var r = _t(e, 1);
          if (r !== null) {
            var l = ze();
            at(r, e, 1, l);
          }
        }), Ni(e, 1);
    }
  }, Jl = function(e) {
    if (e.tag === 13) {
      var t = _t(e, 134217728);
      if (t !== null) {
        var n = ze();
        at(t, e, 134217728, n);
      }
      Ni(e, 134217728);
    }
  }, cu = function(e) {
    if (e.tag === 13) {
      var t = Qt(e), n = _t(e, t);
      if (n !== null) {
        var r = ze();
        at(n, e, t, r);
      }
      Ni(e, t);
    }
  }, fu = function() {
    return b;
  }, du = function(e, t) {
    var n = b;
    try {
      return b = e, t();
    } finally {
      b = n;
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
        Bi(e, n);
        break;
      case "select":
        t = n.value, t != null && fn(e, !!n.multiple, t, !1);
    }
  }, qi = wi, Zi = on;
  var Ff = { usingClientEntryPoint: !1, Events: [ir, kn, Yr, Yi, Xi, wi] }, Sr = { findFiberByHostInstance: Zt, bundleType: 0, version: "18.3.1", rendererPackageName: "react-dom" }, Af = { bundleType: Sr.bundleType, version: Sr.version, rendererPackageName: Sr.rendererPackageName, rendererConfig: Sr.rendererConfig, overrideHookState: null, overrideHookStateDeletePath: null, overrideHookStateRenamePath: null, overrideProps: null, overridePropsDeletePath: null, overridePropsRenamePath: null, setErrorHandler: null, setSuspenseHandler: null, scheduleUpdate: null, currentDispatcherRef: _e.ReactCurrentDispatcher, findHostInstanceByFiber: function(e) {
    return e = tu(e), e === null ? null : e.stateNode;
  }, findFiberByHostInstance: Sr.findFiberByHostInstance || If, findHostInstancesForRefresh: null, scheduleRefresh: null, scheduleRoot: null, setRefreshHandler: null, getCurrentFiber: null, reconcilerVersion: "18.3.1-next-f1338f8080-20240426" };
  if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u") {
    var zl = __REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!zl.isDisabled && zl.supportsFiber) try {
      Rr = zl.inject(Af), pt = zl;
    } catch {
    }
  }
  return Ve.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = Ff, Ve.createPortal = function(e, t) {
    var n = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
    if (!Mi(t)) throw Error(m(200));
    return jf(e, t, null, n);
  }, Ve.createRoot = function(e, t) {
    if (!Mi(e)) throw Error(m(299));
    var n = !1, r = "", l = Ma;
    return t != null && (t.unstable_strictMode === !0 && (n = !0), t.identifierPrefix !== void 0 && (r = t.identifierPrefix), t.onRecoverableError !== void 0 && (l = t.onRecoverableError)), t = _i(e, 1, !1, null, null, n, !1, r, l), e[kt] = t.current, rr(e.nodeType === 8 ? e.parentNode : e), new Pi(t);
  }, Ve.findDOMNode = function(e) {
    if (e == null) return null;
    if (e.nodeType === 1) return e;
    var t = e._reactInternals;
    if (t === void 0)
      throw typeof e.render == "function" ? Error(m(188)) : (e = Object.keys(e).join(","), Error(m(268, e)));
    return e = tu(t), e = e === null ? null : e.stateNode, e;
  }, Ve.flushSync = function(e) {
    return on(e);
  }, Ve.hydrate = function(e, t, n) {
    if (!Tl(t)) throw Error(m(200));
    return Ll(null, e, t, !0, n);
  }, Ve.hydrateRoot = function(e, t, n) {
    if (!Mi(e)) throw Error(m(405));
    var r = n != null && n.hydratedSources || null, l = !1, o = "", i = Ma;
    if (n != null && (n.unstable_strictMode === !0 && (l = !0), n.identifierPrefix !== void 0 && (o = n.identifierPrefix), n.onRecoverableError !== void 0 && (i = n.onRecoverableError)), t = Na(t, null, e, 1, n ?? null, l, !1, o, i), e[kt] = t.current, rr(e), r) for (e = 0; e < r.length; e++) n = r[e], l = n._getVersion, l = l(n._source), t.mutableSourceEagerHydrationData == null ? t.mutableSourceEagerHydrationData = [n, l] : t.mutableSourceEagerHydrationData.push(
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
  }, Ve.unstable_batchedUpdates = wi, Ve.unstable_renderSubtreeIntoContainer = function(e, t, n, r) {
    if (!Tl(n)) throw Error(m(200));
    if (e == null || e._reactInternals === void 0) throw Error(m(38));
    return Ll(e, t, n, !1, r);
  }, Ve.version = "18.3.1-next-f1338f8080-20240426", Ve;
}
var Fa;
function Kf() {
  if (Fa) return Li.exports;
  Fa = 1;
  function h() {
    if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"))
      try {
        __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(h);
      } catch (z) {
        console.error(z);
      }
  }
  return h(), Li.exports = Qf(), Li.exports;
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
  calendar: /* @__PURE__ */ w.jsxs(w.Fragment, { children: [
    /* @__PURE__ */ w.jsx("rect", { x: "3", y: "4.5", width: "18", height: "16", rx: "2" }),
    /* @__PURE__ */ w.jsx("path", { d: "M3 9.5h18M8 2.5v4M16 2.5v4" })
  ] }),
  factory: /* @__PURE__ */ w.jsx("path", { d: "M3 20.5h18M4 20.5V11l5 3v-3l5 3v-3l5 3V4.5h2v16" }),
  shield: /* @__PURE__ */ w.jsxs(w.Fragment, { children: [
    /* @__PURE__ */ w.jsx("path", { d: "M12 3l7.5 3v5.5c0 4.5-3.2 8-7.5 9.5-4.3-1.5-7.5-5-7.5-9.5V6z" }),
    /* @__PURE__ */ w.jsx("path", { d: "M8.5 12l2.5 2.5 4.5-5" })
  ] }),
  flask: /* @__PURE__ */ w.jsxs(w.Fragment, { children: [
    /* @__PURE__ */ w.jsx("path", { d: "M9 3h6M10 3v6.5L4.5 19a1.5 1.5 0 0 0 1.3 2.2h12.4a1.5 1.5 0 0 0 1.3-2.2L14 9.5V3" }),
    /* @__PURE__ */ w.jsx("path", { d: "M7 15h10" })
  ] }),
  folder: /* @__PURE__ */ w.jsx("path", { d: "M3 6.5A1.5 1.5 0 0 1 4.5 5h4.8l2 2.5h8.2A1.5 1.5 0 0 1 21 9v9.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z" }),
  thermometer: /* @__PURE__ */ w.jsx("path", { d: "M14 14.8V4.5a2 2 0 0 0-4 0v10.3a4 4 0 1 0 4 0z" }),
  drop: /* @__PURE__ */ w.jsx("path", { d: "M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" }),
  history: /* @__PURE__ */ w.jsxs(w.Fragment, { children: [
    /* @__PURE__ */ w.jsx("path", { d: "M3.5 12a8.5 8.5 0 1 0 2.5-6" }),
    /* @__PURE__ */ w.jsx("path", { d: "M3.5 4v4.5H8M12 7.5V12l3 2" })
  ] }),
  database: /* @__PURE__ */ w.jsxs(w.Fragment, { children: [
    /* @__PURE__ */ w.jsx("ellipse", { cx: "12", cy: "5.5", rx: "7.5", ry: "2.5" }),
    /* @__PURE__ */ w.jsx("path", { d: "M4.5 5.5v13c0 1.4 3.4 2.5 7.5 2.5s7.5-1.1 7.5-2.5v-13M4.5 12c0 1.4 3.4 2.5 7.5 2.5s7.5-1.1 7.5-2.5" })
  ] }),
  sliders: /* @__PURE__ */ w.jsxs(w.Fragment, { children: [
    /* @__PURE__ */ w.jsx("path", { d: "M4 7h10M18 7h2M4 17h4M12 17h8" }),
    /* @__PURE__ */ w.jsx("circle", { cx: "16", cy: "7", r: "2" }),
    /* @__PURE__ */ w.jsx("circle", { cx: "10", cy: "17", r: "2" })
  ] }),
  help: /* @__PURE__ */ w.jsxs(w.Fragment, { children: [
    /* @__PURE__ */ w.jsx("circle", { cx: "12", cy: "12", r: "9" }),
    /* @__PURE__ */ w.jsx("path", { d: "M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01" })
  ] }),
  users: /* @__PURE__ */ w.jsxs(w.Fragment, { children: [
    /* @__PURE__ */ w.jsx("circle", { cx: "9", cy: "8", r: "3.5" }),
    /* @__PURE__ */ w.jsx("path", { d: "M2.5 20c.6-3.5 3.2-5.5 6.5-5.5s5.9 2 6.5 5.5M16 4.8a3.5 3.5 0 0 1 0 6.4M18.5 14.8c1.6.7 2.7 2.4 3 5.2" })
  ] }),
  post: /* @__PURE__ */ w.jsx("path", { d: "M10.5 21.5h3M11 21.5l.5-19h1l.5 19M8 6h8M9 10h6" }),
  alert: /* @__PURE__ */ w.jsxs(w.Fragment, { children: [
    /* @__PURE__ */ w.jsx("path", { d: "M10.3 4.2L2.8 17.5A2 2 0 0 0 4.5 20.5h15a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0z" }),
    /* @__PURE__ */ w.jsx("path", { d: "M12 9.5v4M12 17h.01" })
  ] }),
  map: /* @__PURE__ */ w.jsxs(w.Fragment, { children: [
    /* @__PURE__ */ w.jsx("path", { d: "M9 4.5L3.5 6.5v13L9 17.5l6 2 5.5-2v-13L15 6.5z" }),
    /* @__PURE__ */ w.jsx("path", { d: "M9 4.5v13M15 6.5v13" })
  ] }),
  doc: /* @__PURE__ */ w.jsxs(w.Fragment, { children: [
    /* @__PURE__ */ w.jsx("path", { d: "M14 3H7a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V7.5z" }),
    /* @__PURE__ */ w.jsx("path", { d: "M14 3v4.5h4.5M9 13h6M9 16.5h6" })
  ] })
};
function Er({ name: h, size: z = 18 }) {
  const m = {
    chevronLeft: /* @__PURE__ */ w.jsx("path", { d: "M15 6l-6 6 6 6" }),
    chevronRight: /* @__PURE__ */ w.jsx("path", { d: "M9 6l6 6-6 6" }),
    updown: /* @__PURE__ */ w.jsx("path", { d: "M7 10l5-5 5 5M7 14l5 5 5-5" }),
    logout: /* @__PURE__ */ w.jsx("path", { d: "M15 4h3.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H15M10 16l-4-4 4-4M6 12h10" }),
    check: /* @__PURE__ */ w.jsx("path", { d: "M5 12.5l4.5 4.5L19 7.5" })
  };
  return /* @__PURE__ */ w.jsx("svg", { className: "sb-ic", width: z, height: z, viewBox: "0 0 24 24", "aria-hidden": "true", children: Xf[h] ?? m[h] });
}
const qf = (h, z) => z === h.href || z.startsWith(h.href + "/");
var Ba;
const jl = ((Ba = window.UnificadoModuleTheme) == null ? void 0 : Ba.theme) || {};
function Zf(h) {
  var q, te;
  const z = h.modules.find((j) => j.id === h.activeModuleId) ?? h.modules[0], [m, ee] = yt.useState(!1), ne = yt.useRef(null), [G, F] = yt.useState(null), D = (j) => {
    if (!h.collapsed) return;
    const X = j.target.closest("[data-tip]");
    if (!X) return F(null);
    const H = X.getBoundingClientRect();
    F({ text: X.dataset.tip ?? "", top: H.top + H.height / 2, left: H.right + 12 });
  }, A = () => F(null);
  yt.useEffect(() => {
    h.collapsed || F(null);
  }, [h.collapsed]), yt.useEffect(() => {
    if (!m) return;
    const j = (H) => {
      var Z;
      (Z = ne.current) != null && Z.contains(H.target) || ee(!1);
    }, X = (H) => {
      H.key === "Escape" && ee(!1);
    };
    return document.addEventListener("pointerdown", j), document.addEventListener("keydown", X), () => {
      document.removeEventListener("pointerdown", j), document.removeEventListener("keydown", X);
    };
  }, [m]);
  const R = (j) => (X) => {
    X.metaKey || X.ctrlKey || X.shiftKey || X.button === 1 || (X.preventDefault(), h.onNavigate(j));
  }, Y = (j) => {
    const X = qf(j, h.activePath);
    return /* @__PURE__ */ w.jsxs(
      "a",
      {
        href: j.href,
        className: "sb-link" + (X ? " is-active" : ""),
        "aria-current": X ? "page" : void 0,
        "data-tip": j.label,
        onClick: R(j.href),
        children: [
          /* @__PURE__ */ w.jsx(Er, { name: j.icon }),
          /* @__PURE__ */ w.jsx("span", { className: "sb-label", children: j.label }),
          j.badge && /* @__PURE__ */ w.jsx("span", { className: "sb-badge sb-badge--" + j.badge.tone, children: j.badge.text })
        ]
      },
      j.id
    );
  };
  return z ? /* @__PURE__ */ w.jsxs(
    "nav",
    {
      className: "sb" + (h.collapsed ? " is-collapsed" : ""),
      "aria-label": "Menu principal",
      style: { "--mod": z.color, "--mod-ink": ((q = jl[z.id]) == null ? void 0 : q.ink) || "#0F1B2D" },
      onMouseOver: D,
      onFocus: D,
      onMouseLeave: A,
      onBlur: A,
      children: [
        /* @__PURE__ */ w.jsxs("div", { className: "sb-brand", children: [
          /* @__PURE__ */ w.jsxs("a", { className: "sb-logo", href: "/unificado/", "aria-label": "Ir ao menu principal", "data-tip": "Menu principal", onClick: R("/unificado/"), children: [
            /* @__PURE__ */ w.jsx("img", { className: "sb-logo-concrefer", src: h.logoConcrefer, alt: "Concrefer" }),
            /* @__PURE__ */ w.jsx("span", { className: "sb-logo-sep", "aria-hidden": "true" }),
            /* @__PURE__ */ w.jsx("img", { className: "sb-logo-ct", src: h.logoConcretrack, alt: "ConcreTrack" })
          ] }),
          /* @__PURE__ */ w.jsx(
            "button",
            {
              type: "button",
              className: "sb-iconbtn sb-collapse",
              "aria-label": h.collapsed ? "Expandir menu" : "Recolher menu",
              "aria-expanded": !h.collapsed,
              onClick: h.onToggleCollapsed,
              children: /* @__PURE__ */ w.jsx(Er, { name: h.collapsed ? "chevronRight" : "chevronLeft" })
            }
          )
        ] }),
        /* @__PURE__ */ w.jsxs("div", { className: "sb-switcher", ref: ne, children: [
          /* @__PURE__ */ w.jsxs(
            "button",
            {
              type: "button",
              className: "sb-switcher-btn",
              "aria-haspopup": "menu",
              "aria-expanded": m,
              "data-tip": "Módulo: " + z.label,
              onClick: () => {
                F(null), ee((j) => !j);
              },
              children: [
                /* @__PURE__ */ w.jsx("span", { className: "sb-mod-tile", children: ((te = jl[z.id]) == null ? void 0 : te.sigla) || z.label.slice(0, 2).toUpperCase() }),
                /* @__PURE__ */ w.jsxs("span", { className: "sb-switcher-text", children: [
                  /* @__PURE__ */ w.jsx("span", { className: "sb-eyebrow", children: "MÓDULO" }),
                  /* @__PURE__ */ w.jsx("span", { className: "sb-switcher-name", children: z.label })
                ] }),
                /* @__PURE__ */ w.jsx("span", { className: "sb-switcher-chev", children: /* @__PURE__ */ w.jsx(Er, { name: "updown" }) })
              ]
            }
          ),
          m && /* @__PURE__ */ w.jsx("div", { className: "sb-menu", role: "menu", children: h.modules.map((j) => {
            var X, H;
            return /* @__PURE__ */ w.jsxs(
              "button",
              {
                type: "button",
                role: "menuitemradio",
                "aria-checked": j.id === z.id,
                className: "sb-menu-item",
                style: { "--item-mod": j.color, "--item-ink": ((X = jl[j.id]) == null ? void 0 : X.ink) || "#0F1B2D" },
                onClick: () => {
                  ee(!1), h.onSelectModule(j.id);
                },
                children: [
                  /* @__PURE__ */ w.jsx("span", { className: "sb-menu-sigla", children: ((H = jl[j.id]) == null ? void 0 : H.sigla) || j.label.slice(0, 2).toUpperCase() }),
                  j.label,
                  j.id === z.id && /* @__PURE__ */ w.jsx("span", { className: "sb-menu-check", children: /* @__PURE__ */ w.jsx(Er, { name: "check", size: 16 }) })
                ]
              },
              j.id
            );
          }) })
        ] }),
        /* @__PURE__ */ w.jsx("div", { className: "sb-scroll", children: z.sections.map((j) => /* @__PURE__ */ w.jsxs("div", { className: "sb-section", children: [
          /* @__PURE__ */ w.jsx("div", { className: "sb-section-title", children: j.title }),
          j.items.map(Y)
        ] }, j.title)) }),
        /* @__PURE__ */ w.jsxs("div", { className: "sb-footer", children: [
          h.updateAvailable && /* @__PURE__ */ w.jsxs("button", { type: "button", className: "sb-update", "data-tip": "Atualizar aplicativo", onClick: h.onUpdate, children: [
            /* @__PURE__ */ w.jsx("span", { className: "sb-update-dot", "aria-hidden": "true" }),
            /* @__PURE__ */ w.jsx("span", { className: "sb-label", children: "Nova versão — atualizar" })
          ] }),
          h.footerItems.map(Y),
          /* @__PURE__ */ w.jsxs("div", { className: "sb-user", children: [
            /* @__PURE__ */ w.jsx("span", { className: "sb-avatar", "aria-hidden": "true", children: h.user.name.trim().charAt(0).toUpperCase() }),
            /* @__PURE__ */ w.jsxs("span", { className: "sb-user-text", children: [
              /* @__PURE__ */ w.jsx("span", { className: "sb-user-name", children: h.user.name }),
              /* @__PURE__ */ w.jsx("span", { className: "sb-user-meta", children: h.user.role }),
              /* @__PURE__ */ w.jsxs("span", { className: "sb-user-meta sb-mono", children: [
                "v",
                h.version
              ] })
            ] }),
            /* @__PURE__ */ w.jsx("button", { type: "button", className: "sb-iconbtn", "aria-label": "Sair", "data-tip": "Sair", onClick: h.onLogout, children: /* @__PURE__ */ w.jsx(Er, { name: "logout" }) })
          ] })
        ] }),
        h.collapsed && G && !m && /* @__PURE__ */ w.jsx("div", { className: "sb-tip", role: "tooltip", style: { top: G.top, left: G.left }, children: G.text })
      ]
    }
  ) : null;
}
function Jf(h = "ct.sidebar.collapsed") {
  const z = () => {
    try {
      const G = localStorage.getItem(h);
      if (G !== null) return G === "1";
    } catch {
    }
    return typeof window < "u" && window.innerWidth < 1200;
  }, [m, ee] = yt.useState(z);
  return [m, () => ee((G) => {
    try {
      localStorage.setItem(h, G ? "0" : "1");
    } catch {
    }
    return !G;
  })];
}
var Ha;
const bf = (Ha = window.UnificadoModuleTheme) == null ? void 0 : Ha.theme, ed = window.UnificadoGedMenu || [], cn = Object.fromEntries(
  Object.entries(bf || {}).map(([h, z]) => [h, z.color])
), ji = (h) => "/unificado/?view=" + encodeURIComponent(h), he = (h, z) => ({
  title: h,
  items: z.map(([m, ee, ne, G, F]) => ({ id: m, label: ee, href: ji(ne), icon: G, ...F ? { badge: F } : {} }))
}), Ee = (h) => `mapa/operacao/?tela=${h}`, Ua = [
  { id: "planejamento", label: "Planejamento", color: cn.planejamento, icon: "calendar", sections: [
    he("GERAL", [
      ["dashboard", "Dashboard", "pcp/dashboard/", "map"],
      ["comparacao", "Programado vs Realizado", "pcp/comparacao/", "sliders"]
    ]),
    he("PROGRAMAÇÃO", [
      ["programacao12", "Setor 1 e 2", "pcp/programacao-alex/", "calendar"],
      ["programacao34", "Setor 3 e 4", "pcp/programacao/", "calendar"],
      ["circular3", "Circular Setor 3", "pcp/programacao-circular-s3/", "calendar"],
      ["dt4", "DT Setor 4", "pcp/programacao-circular-s4/", "calendar"],
      ["programacaoFinal", "Programação Final", "pcp/programacao-final/", "calendar"]
    ]),
    he("RELATÓRIOS DE PROGRAMAÇÃO", [
      ["relatorio12", "Setor 1 e 2", "pcp/relatorio-producao/", "doc"],
      ["relatorio3", "Setor 3", "pcp/relatorio-programacao-s3/", "doc"],
      ["relatorio4", "Setor 4", "pcp/relatorio-programacao-s4/", "doc"]
    ]),
    he("ETIQUETAS", [
      ["etiquetas", "Padrão", "pcp/etiquetas/", "doc"],
      ["etiquetasSc", "SC-Prod.", "pcp/etiquetas-sc/", "doc"],
      ["etiquetasArmaduras", "Armaduras", "pcp/etiquetas-armaduras/", "doc"]
    ]),
    he("ACOMPANHAMENTO", [
      ["pcpDiario", "PCP Diário", "pcp/pcp-diario/", "history"],
      ["acompMensal", "Acompanhamento Mensal", "pcp/acompanhamento-mensal/", "history"],
      ["acompMensal34", "Acompanhamento Mensal Setor 3 e 4", "pcp/acompanhamento-mensal-setor-34/", "history"],
      ["apontamentoMega", "Apontamento Mega", "pcp/apontamento-mega/", "database"],
      ["fechamentoDiarioPcp", "Fechamento Diário", "pcp/fechamento-diario/", "doc"]
    ]),
    he("PRODUÇÃO E APOIO", [
      ["producaoPcp", "Produção PCP", "pcp/producao/", "factory"],
      ["maodeobra", "Mão de Obra", "pcp/maodeobra/", "users"],
      ["maodeobraRateio", "Rateio de Mão de Obra", "pcp/maodeobra-rateio/", "users"],
      ["formasPorSetor", "Formas por Setor", "pcp/formas-por-setor/", "database"],
      ["testeProgramacao", "Teste Programação", "pcp/teste-programacao/", "sliders"]
    ])
  ] },
  { id: "producao", label: "Produção", color: cn.producao, icon: "factory", sections: [
    he("PRODUÇÃO", [
      ["liberacao", "Produção / Liberação", Ee("LIBERACAO"), "factory"],
      ["setor1", "Setor 1", Ee("LIBERACAO_S1"), "factory"],
      ["setor2", "Setor 2", Ee("LIBERACAO_S2"), "factory"],
      ["setor3", "Setor 3", Ee("LIBERACAO_S3"), "factory"],
      ["setor4", "Setor 4", Ee("LIBERACAO_S4"), "factory"],
      ["mandril", "Mandril Circular", Ee("MANDRIL_CIRCULAR"), "sliders"]
    ]),
    he("MONTAGEM", [
      ["inspecao", "Inspeção Setor 3 e 4", Ee("INSPECAO"), "shield"],
      ["montagem", "Montagem Postes", Ee("MONTAGEM_POSTES"), "post"],
      ["sequencia", "Sequência Setor 3", Ee("SEQUENCIA_S3"), "history"]
    ]),
    he("CONTROLE", [
      ["relatorioMapa", "Relatório Enc. Produção", Ee("RELATORIO"), "doc"],
      ["historico", "Histórico", Ee("HISTORICO"), "history"],
      ["acmpConcretagem", "Acmp. Concretagem", Ee("ACMP_CONCRETAGEM"), "sliders"],
      ["manutencao", "Manutenção Formas", Ee("RELATORIO_MANUTENCAO"), "sliders"],
      ["tratativa", "Tratativa Defeitos", Ee("TRATATIVA_DEFEITOS"), "alert"]
    ]),
    he("INDICADORES", [
      ["dashMontagem", "Dashboard Montagem", Ee("MONTAGEM_INDICADORES"), "map"],
      ["dashDefeitos", "Dashboard Defeitos", Ee("DASHBOARD_DEFEITOS"), "map"],
      ["produtividade", "Dashboard Concretagem Matriz", Ee("PROD_ANALISE"), "map"],
      ["tvFormas", "Painel TV — Formas", "tv/formas/", "map"]
    ])
  ] },
  { id: "qualidade", label: "Qualidade", color: cn.qualidade, icon: "shield", sections: [
    he("NÃO CONFORMIDADES", [
      ["qualidadePainel", "Painel de RNCs", "qualidade/", "alert"],
      ["qualidadeAbertura", "Abrir RNC", "qualidade/abrir", "doc"],
      ["qualidadeResultadosBancada", "Resultados de bancada", "qualidade/resultados-bancada", "doc"],
      ["qualidadeCadastros", "Cadastros", "qualidade/cadastros", "database"]
    ])
  ] },
  { id: "laboratorio", label: "Laboratório", color: cn.laboratorio, icon: "flask", sections: [
    he("DOSAGEM", [
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
    he("CONCRETO FRESCO", [
      ["labSlump", "Registro de slump / flow", "laboratorio/slump", "thermometer"]
    ]),
    he("CURA TÉRMICA", [
      ["labMonitor", "Monitoramento", "laboratorio/", "thermometer", { text: "AO VIVO", tone: "live" }],
      ["labHistory", "Histórico de medições", "laboratorio/?view=history", "history"],
      ["labDevice", "Dispositivo", "laboratorio/?view=settings", "sliders"]
    ]),
    he("POSTES", [
      ["labPole", "Ensaio de postes", "laboratorio/novo/postes", "post"],
      ["labAbsorption", "Absorção", "laboratorio/novo/postes?tab=absorcao", "drop"],
      ["labTests", "Histórico de ensaios", "laboratorio/novo/postes?tab=historico", "history"],
      ["labRegisters", "Cadastros", "laboratorio/novo/postes?tab=cadastros", "database"],
      ["labCriteria", "Critérios", "laboratorio/novo/postes?tab=criterios", "sliders"]
    ]),
    he("CRONOANÁLISE", [
      ["cronoanalise.inicio", "Início", "laboratorio/cronoanalise", "history"],
      ["cronoanalise.coletar", "Coletar", "laboratorio/cronoanalise/coletar", "thermometer"],
      ["cronoanalise.medicoes", "Medições", "laboratorio/cronoanalise/medicoes", "database"],
      ["cronoanalise.catalogo", "Catálogo", "laboratorio/cronoanalise/catalogo", "sliders"],
      ["cronoanalise.dimensionar", "Dimensionar", "laboratorio/cronoanalise/dimensionar", "factory"],
      ["cronoanalise.simular", "Simular", "laboratorio/cronoanalise/simular", "map"],
      ["cronoanalise.metodologia", "Metodologia", "laboratorio/cronoanalise/metodologia", "help"]
    ])
  ] },
  { id: "usinas", label: "Usinas", color: cn.usinas, icon: "factory", sections: [
    he("GERAL", [
      ["usinasInicio", "Cartas de traço", "usinas/", "map"],
      ["usinasCec", "Controle estatístico", "usinas/?area=cec", "database"],
      ["usinasRelatorios", "Relatórios gerenciais", "usinas/?area=relatorios", "doc"],
      ["usinasEstoque", "Controle de estoque", "usinas/?area=estoque", "factory"]
    ])
  ] },
  { id: "ged", label: "GED", color: cn.ged, icon: "folder", sections: [
    he("GESTÃO DOCUMENTAL", ed.map((h) => [h.id, h.label, `ged/${h.route}`, h.icon]))
  ] },
  { id: "suprimentos", label: "Suprimentos", color: cn.suprimentos, icon: "database", sections: [
    he("SOLICITAÇÕES", [
      ["suprimentosPainel", "Painel", "suprimentos/painel/", "map"],
      ["suprimentosSolicitacoes", "Solicitações", "suprimentos/solicitacoes/", "doc"],
      ["suprimentosNova", "Nova solicitação", "suprimentos/nova/", "post"],
      ["suprimentosAlmoxarifado", "Almoxarifado", "suprimentos/almoxarifado/", "database"],
      ["suprimentosInventario", "Inventário", "suprimentos/inventario/", "sliders"]
    ]),
    he("COMPRAS", [
      ["suprimentosCotacoes", "Cotações e pedidos", "suprimentos/cotacoes/", "doc"],
      ["suprimentosRecebimento", "Recebimento", "suprimentos/recebimento/", "post"],
      ["suprimentosFornecedores", "Fornecedores", "suprimentos/fornecedores/", "users"],
      ["suprimentosIndicadores", "Indicadores", "suprimentos/analises/", "map"]
    ]),
    he("ADMINISTRAÇÃO", [
      ["suprimentosCadastros", "Cadastros e alçadas", "suprimentos/cadastros/", "sliders"]
    ])
  ] }
], td = [
  { id: "usuarios", label: "Usuários", href: ji(Ee("USUARIOS")), icon: "users" },
  { id: "reportProblem", label: "Relatar problema", href: "/unificado/testar/#relatar", icon: "alert" },
  { id: "labHelp", label: "Como funciona", href: ji("laboratorio/?view=help"), icon: "help" }
];
function nd(h) {
  var G;
  const z = new Set(h.allowedModuleIds), m = new Set(h.allowedItemIds), ee = ((G = h.navModules) == null ? void 0 : G.map((F) => {
    const D = Ua.find((A) => A.id === F.id);
    return {
      id: F.id,
      label: F.label,
      color: (D == null ? void 0 : D.color) ?? "#5B8DEF",
      icon: (D == null ? void 0 : D.icon) ?? "doc",
      sections: F.sections.map((A) => ({ title: A.title, items: A.items.map((R) => {
        var Y;
        return {
          ...R,
          icon: ((Y = D == null ? void 0 : D.sections.flatMap((q) => q.items).find((q) => q.id === R.id)) == null ? void 0 : Y.icon) ?? "doc"
        };
      }) }))
    };
  })) ?? [];
  return [...ee, ...Ua.filter((F) => F.id === "ged" && !ee.some((D) => D.id === "ged"))].filter((F) => z.has(F.id)).map((F) => ({
    ...F,
    sections: F.sections.map((D) => ({
      ...D,
      items: D.items.filter((A) => m.has(A.id))
    })).filter((D) => D.items.length > 0)
  })).filter((F) => F.sections.length > 0);
}
function rd() {
  const [h, z] = yt.useState(() => {
    var R;
    return ((R = window.UnificadoSidebarModelA) == null ? void 0 : R.snapshot()) ?? null;
  }), [m, ee] = Jf();
  if (yt.useEffect(() => {
    const R = () => {
      var Y;
      return z(((Y = window.UnificadoSidebarModelA) == null ? void 0 : Y.snapshot()) ?? null);
    };
    return window.addEventListener("unificado-sidebar-model-a-update", R), window.addEventListener("popstate", R), R(), () => {
      window.removeEventListener("unificado-sidebar-model-a-update", R), window.removeEventListener("popstate", R);
    };
  }, []), yt.useEffect(() => {
    const R = () => {
      m && ee();
    };
    return window.addEventListener("unificado-sidebar-module-selected", R), () => window.removeEventListener("unificado-sidebar-module-selected", R);
  }, [m, ee]), yt.useEffect(() => {
    var R;
    (R = document.querySelector("#sidebar-model-a .sb-scroll")) == null || R.scrollTo(0, 0);
  }, [h == null ? void 0 : h.activeModuleId]), !h || !window.UnificadoSidebarModelA) return null;
  const ne = nd(h);
  if (ne.length === 0) return null;
  const G = ne.some((R) => R.id === h.activeModuleId) ? h.activeModuleId : ne[0].id, F = new Set(h.footerItemIds), D = td.filter((R) => F.has(R.id)).map((R) => R.id === "usuarios" && h.allowedItemIds.includes("pcpUsuarios") && !h.allowedItemIds.includes("prodUsuarios") ? { ...R, href: "/unificado/?view=" + encodeURIComponent("pcp/usuarios/") } : R), A = (R) => {
    var Y;
    return (Y = window.UnificadoSidebarModelA) == null ? void 0 : Y.navigate(R);
  };
  return /* @__PURE__ */ w.jsx(
    Zf,
    {
      modules: ne,
      activeModuleId: G,
      activePath: h.activePath,
      footerItems: D,
      user: h.user,
      version: h.version,
      logoConcrefer: "/unificado/assets/img/logo-concrefer.png",
      logoConcretrack: "/unificado/assets/img/logo-concretrack.png",
      collapsed: m,
      onToggleCollapsed: ee,
      onSelectModule: (R) => {
        var Y;
        return (Y = window.UnificadoSidebarModelA) == null ? void 0 : Y.selectModule(R);
      },
      onNavigate: A,
      onLogout: () => {
        var R;
        return (R = window.UnificadoSidebarModelA) == null ? void 0 : R.logout();
      },
      updateAvailable: h.updateAvailable,
      onUpdate: () => {
        var R;
        return (R = window.UnificadoSidebarModelA) == null ? void 0 : R.update();
      }
    }
  );
}
const Va = document.getElementById("sidebar-model-a");
Va && Yf.createRoot(Va).render(/* @__PURE__ */ w.jsx(rd, {}));
