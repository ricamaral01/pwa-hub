var es = { exports: {} }, el = {}, ts = { exports: {} }, re = {};
/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Vu;
function Qd() {
  if (Vu) return re;
  Vu = 1;
  var p = Symbol.for("react.element"), N = Symbol.for("react.portal"), d = Symbol.for("react.fragment"), j = Symbol.for("react.strict_mode"), v = Symbol.for("react.profiler"), P = Symbol.for("react.provider"), y = Symbol.for("react.context"), z = Symbol.for("react.forward_ref"), T = Symbol.for("react.suspense"), F = Symbol.for("react.memo"), w = Symbol.for("react.lazy"), k = Symbol.iterator;
  function B(m) {
    return m === null || typeof m != "object" ? null : (m = k && m[k] || m["@@iterator"], typeof m == "function" ? m : null);
  }
  var se = { isMounted: function() {
    return !1;
  }, enqueueForceUpdate: function() {
  }, enqueueReplaceState: function() {
  }, enqueueSetState: function() {
  } }, K = Object.assign, X = {};
  function te(m, S, U) {
    this.props = m, this.context = S, this.refs = X, this.updater = U || se;
  }
  te.prototype.isReactComponent = {}, te.prototype.setState = function(m, S) {
    if (typeof m != "object" && typeof m != "function" && m != null) throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
    this.updater.enqueueSetState(this, m, S, "setState");
  }, te.prototype.forceUpdate = function(m) {
    this.updater.enqueueForceUpdate(this, m, "forceUpdate");
  };
  function be() {
  }
  be.prototype = te.prototype;
  function oe(m, S, U) {
    this.props = m, this.context = S, this.refs = X, this.updater = U || se;
  }
  var Te = oe.prototype = new be();
  Te.constructor = oe, K(Te, te.prototype), Te.isPureReactComponent = !0;
  var pe = Array.isArray, Ue = Object.prototype.hasOwnProperty, $e = { current: null }, Ke = { key: !0, ref: !0, __self: !0, __source: !0 };
  function et(m, S, U) {
    var b, ie = {}, ae = null, me = null;
    if (S != null) for (b in S.ref !== void 0 && (me = S.ref), S.key !== void 0 && (ae = "" + S.key), S) Ue.call(S, b) && !Ke.hasOwnProperty(b) && (ie[b] = S[b]);
    var de = arguments.length - 2;
    if (de === 1) ie.children = U;
    else if (1 < de) {
      for (var he = Array(de), Be = 0; Be < de; Be++) he[Be] = arguments[Be + 2];
      ie.children = he;
    }
    if (m && m.defaultProps) for (b in de = m.defaultProps, de) ie[b] === void 0 && (ie[b] = de[b]);
    return { $$typeof: p, type: m, key: ae, ref: me, props: ie, _owner: $e.current };
  }
  function dt(m, S) {
    return { $$typeof: p, type: m.type, key: S, ref: m.ref, props: m.props, _owner: m._owner };
  }
  function yt(m) {
    return typeof m == "object" && m !== null && m.$$typeof === p;
  }
  function ne(m) {
    var S = { "=": "=0", ":": "=2" };
    return "$" + m.replace(/[=:]/g, function(U) {
      return S[U];
    });
  }
  var ft = /\/+/g;
  function Me(m, S) {
    return typeof m == "object" && m !== null && m.key != null ? ne("" + m.key) : S.toString(36);
  }
  function Ee(m, S, U, b, ie) {
    var ae = typeof m;
    (ae === "undefined" || ae === "boolean") && (m = null);
    var me = !1;
    if (m === null) me = !0;
    else switch (ae) {
      case "string":
      case "number":
        me = !0;
        break;
      case "object":
        switch (m.$$typeof) {
          case p:
          case N:
            me = !0;
        }
    }
    if (me) return me = m, ie = ie(me), m = b === "" ? "." + Me(me, 0) : b, pe(ie) ? (U = "", m != null && (U = m.replace(ft, "$&/") + "/"), Ee(ie, S, U, "", function(Be) {
      return Be;
    })) : ie != null && (yt(ie) && (ie = dt(ie, U + (!ie.key || me && me.key === ie.key ? "" : ("" + ie.key).replace(ft, "$&/") + "/") + m)), S.push(ie)), 1;
    if (me = 0, b = b === "" ? "." : b + ":", pe(m)) for (var de = 0; de < m.length; de++) {
      ae = m[de];
      var he = b + Me(ae, de);
      me += Ee(ae, S, U, he, ie);
    }
    else if (he = B(m), typeof he == "function") for (m = he.call(m), de = 0; !(ae = m.next()).done; ) ae = ae.value, he = b + Me(ae, de++), me += Ee(ae, S, U, he, ie);
    else if (ae === "object") throw S = String(m), Error("Objects are not valid as a React child (found: " + (S === "[object Object]" ? "object with keys {" + Object.keys(m).join(", ") + "}" : S) + "). If you meant to render a collection of children, use an array instead.");
    return me;
  }
  function pt(m, S, U) {
    if (m == null) return m;
    var b = [], ie = 0;
    return Ee(m, b, "", "", function(ae) {
      return S.call(U, ae, ie++);
    }), b;
  }
  function Ve(m) {
    if (m._status === -1) {
      var S = m._result;
      S = S(), S.then(function(U) {
        (m._status === 0 || m._status === -1) && (m._status = 1, m._result = U);
      }, function(U) {
        (m._status === 0 || m._status === -1) && (m._status = 2, m._result = U);
      }), m._status === -1 && (m._status = 0, m._result = S);
    }
    if (m._status === 1) return m._result.default;
    throw m._result;
  }
  var ge = { current: null }, D = { transition: null }, G = { ReactCurrentDispatcher: ge, ReactCurrentBatchConfig: D, ReactCurrentOwner: $e };
  function I() {
    throw Error("act(...) is not supported in production builds of React.");
  }
  return re.Children = { map: pt, forEach: function(m, S, U) {
    pt(m, function() {
      S.apply(this, arguments);
    }, U);
  }, count: function(m) {
    var S = 0;
    return pt(m, function() {
      S++;
    }), S;
  }, toArray: function(m) {
    return pt(m, function(S) {
      return S;
    }) || [];
  }, only: function(m) {
    if (!yt(m)) throw Error("React.Children.only expected to receive a single React element child.");
    return m;
  } }, re.Component = te, re.Fragment = d, re.Profiler = v, re.PureComponent = oe, re.StrictMode = j, re.Suspense = T, re.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = G, re.act = I, re.cloneElement = function(m, S, U) {
    if (m == null) throw Error("React.cloneElement(...): The argument must be a React element, but you passed " + m + ".");
    var b = K({}, m.props), ie = m.key, ae = m.ref, me = m._owner;
    if (S != null) {
      if (S.ref !== void 0 && (ae = S.ref, me = $e.current), S.key !== void 0 && (ie = "" + S.key), m.type && m.type.defaultProps) var de = m.type.defaultProps;
      for (he in S) Ue.call(S, he) && !Ke.hasOwnProperty(he) && (b[he] = S[he] === void 0 && de !== void 0 ? de[he] : S[he]);
    }
    var he = arguments.length - 2;
    if (he === 1) b.children = U;
    else if (1 < he) {
      de = Array(he);
      for (var Be = 0; Be < he; Be++) de[Be] = arguments[Be + 2];
      b.children = de;
    }
    return { $$typeof: p, type: m.type, key: ie, ref: ae, props: b, _owner: me };
  }, re.createContext = function(m) {
    return m = { $$typeof: y, _currentValue: m, _currentValue2: m, _threadCount: 0, Provider: null, Consumer: null, _defaultValue: null, _globalName: null }, m.Provider = { $$typeof: P, _context: m }, m.Consumer = m;
  }, re.createElement = et, re.createFactory = function(m) {
    var S = et.bind(null, m);
    return S.type = m, S;
  }, re.createRef = function() {
    return { current: null };
  }, re.forwardRef = function(m) {
    return { $$typeof: z, render: m };
  }, re.isValidElement = yt, re.lazy = function(m) {
    return { $$typeof: w, _payload: { _status: -1, _result: m }, _init: Ve };
  }, re.memo = function(m, S) {
    return { $$typeof: F, type: m, compare: S === void 0 ? null : S };
  }, re.startTransition = function(m) {
    var S = D.transition;
    D.transition = {};
    try {
      m();
    } finally {
      D.transition = S;
    }
  }, re.unstable_act = I, re.useCallback = function(m, S) {
    return ge.current.useCallback(m, S);
  }, re.useContext = function(m) {
    return ge.current.useContext(m);
  }, re.useDebugValue = function() {
  }, re.useDeferredValue = function(m) {
    return ge.current.useDeferredValue(m);
  }, re.useEffect = function(m, S) {
    return ge.current.useEffect(m, S);
  }, re.useId = function() {
    return ge.current.useId();
  }, re.useImperativeHandle = function(m, S, U) {
    return ge.current.useImperativeHandle(m, S, U);
  }, re.useInsertionEffect = function(m, S) {
    return ge.current.useInsertionEffect(m, S);
  }, re.useLayoutEffect = function(m, S) {
    return ge.current.useLayoutEffect(m, S);
  }, re.useMemo = function(m, S) {
    return ge.current.useMemo(m, S);
  }, re.useReducer = function(m, S, U) {
    return ge.current.useReducer(m, S, U);
  }, re.useRef = function(m) {
    return ge.current.useRef(m);
  }, re.useState = function(m) {
    return ge.current.useState(m);
  }, re.useSyncExternalStore = function(m, S, U) {
    return ge.current.useSyncExternalStore(m, S, U);
  }, re.useTransition = function() {
    return ge.current.useTransition();
  }, re.version = "18.3.1", re;
}
var Bu;
function us() {
  return Bu || (Bu = 1, ts.exports = Qd()), ts.exports;
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
var Hu;
function Kd() {
  if (Hu) return el;
  Hu = 1;
  var p = us(), N = Symbol.for("react.element"), d = Symbol.for("react.fragment"), j = Object.prototype.hasOwnProperty, v = p.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner, P = { key: !0, ref: !0, __self: !0, __source: !0 };
  function y(z, T, F) {
    var w, k = {}, B = null, se = null;
    F !== void 0 && (B = "" + F), T.key !== void 0 && (B = "" + T.key), T.ref !== void 0 && (se = T.ref);
    for (w in T) j.call(T, w) && !P.hasOwnProperty(w) && (k[w] = T[w]);
    if (z && z.defaultProps) for (w in T = z.defaultProps, T) k[w] === void 0 && (k[w] = T[w]);
    return { $$typeof: N, type: z, key: B, ref: se, props: k, _owner: v.current };
  }
  return el.Fragment = d, el.jsx = y, el.jsxs = y, el;
}
var Wu;
function Gd() {
  return Wu || (Wu = 1, es.exports = Kd()), es.exports;
}
var o = Gd(), ho = {}, ns = { exports: {} }, ut = {}, rs = { exports: {} }, ls = {};
/**
 * @license React
 * scheduler.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Qu;
function qd() {
  return Qu || (Qu = 1, (function(p) {
    function N(D, G) {
      var I = D.length;
      D.push(G);
      e: for (; 0 < I; ) {
        var m = I - 1 >>> 1, S = D[m];
        if (0 < v(S, G)) D[m] = G, D[I] = S, I = m;
        else break e;
      }
    }
    function d(D) {
      return D.length === 0 ? null : D[0];
    }
    function j(D) {
      if (D.length === 0) return null;
      var G = D[0], I = D.pop();
      if (I !== G) {
        D[0] = I;
        e: for (var m = 0, S = D.length, U = S >>> 1; m < U; ) {
          var b = 2 * (m + 1) - 1, ie = D[b], ae = b + 1, me = D[ae];
          if (0 > v(ie, I)) ae < S && 0 > v(me, ie) ? (D[m] = me, D[ae] = I, m = ae) : (D[m] = ie, D[b] = I, m = b);
          else if (ae < S && 0 > v(me, I)) D[m] = me, D[ae] = I, m = ae;
          else break e;
        }
      }
      return G;
    }
    function v(D, G) {
      var I = D.sortIndex - G.sortIndex;
      return I !== 0 ? I : D.id - G.id;
    }
    if (typeof performance == "object" && typeof performance.now == "function") {
      var P = performance;
      p.unstable_now = function() {
        return P.now();
      };
    } else {
      var y = Date, z = y.now();
      p.unstable_now = function() {
        return y.now() - z;
      };
    }
    var T = [], F = [], w = 1, k = null, B = 3, se = !1, K = !1, X = !1, te = typeof setTimeout == "function" ? setTimeout : null, be = typeof clearTimeout == "function" ? clearTimeout : null, oe = typeof setImmediate < "u" ? setImmediate : null;
    typeof navigator < "u" && navigator.scheduling !== void 0 && navigator.scheduling.isInputPending !== void 0 && navigator.scheduling.isInputPending.bind(navigator.scheduling);
    function Te(D) {
      for (var G = d(F); G !== null; ) {
        if (G.callback === null) j(F);
        else if (G.startTime <= D) j(F), G.sortIndex = G.expirationTime, N(T, G);
        else break;
        G = d(F);
      }
    }
    function pe(D) {
      if (X = !1, Te(D), !K) if (d(T) !== null) K = !0, Ve(Ue);
      else {
        var G = d(F);
        G !== null && ge(pe, G.startTime - D);
      }
    }
    function Ue(D, G) {
      K = !1, X && (X = !1, be(et), et = -1), se = !0;
      var I = B;
      try {
        for (Te(G), k = d(T); k !== null && (!(k.expirationTime > G) || D && !ne()); ) {
          var m = k.callback;
          if (typeof m == "function") {
            k.callback = null, B = k.priorityLevel;
            var S = m(k.expirationTime <= G);
            G = p.unstable_now(), typeof S == "function" ? k.callback = S : k === d(T) && j(T), Te(G);
          } else j(T);
          k = d(T);
        }
        if (k !== null) var U = !0;
        else {
          var b = d(F);
          b !== null && ge(pe, b.startTime - G), U = !1;
        }
        return U;
      } finally {
        k = null, B = I, se = !1;
      }
    }
    var $e = !1, Ke = null, et = -1, dt = 5, yt = -1;
    function ne() {
      return !(p.unstable_now() - yt < dt);
    }
    function ft() {
      if (Ke !== null) {
        var D = p.unstable_now();
        yt = D;
        var G = !0;
        try {
          G = Ke(!0, D);
        } finally {
          G ? Me() : ($e = !1, Ke = null);
        }
      } else $e = !1;
    }
    var Me;
    if (typeof oe == "function") Me = function() {
      oe(ft);
    };
    else if (typeof MessageChannel < "u") {
      var Ee = new MessageChannel(), pt = Ee.port2;
      Ee.port1.onmessage = ft, Me = function() {
        pt.postMessage(null);
      };
    } else Me = function() {
      te(ft, 0);
    };
    function Ve(D) {
      Ke = D, $e || ($e = !0, Me());
    }
    function ge(D, G) {
      et = te(function() {
        D(p.unstable_now());
      }, G);
    }
    p.unstable_IdlePriority = 5, p.unstable_ImmediatePriority = 1, p.unstable_LowPriority = 4, p.unstable_NormalPriority = 3, p.unstable_Profiling = null, p.unstable_UserBlockingPriority = 2, p.unstable_cancelCallback = function(D) {
      D.callback = null;
    }, p.unstable_continueExecution = function() {
      K || se || (K = !0, Ve(Ue));
    }, p.unstable_forceFrameRate = function(D) {
      0 > D || 125 < D ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : dt = 0 < D ? Math.floor(1e3 / D) : 5;
    }, p.unstable_getCurrentPriorityLevel = function() {
      return B;
    }, p.unstable_getFirstCallbackNode = function() {
      return d(T);
    }, p.unstable_next = function(D) {
      switch (B) {
        case 1:
        case 2:
        case 3:
          var G = 3;
          break;
        default:
          G = B;
      }
      var I = B;
      B = G;
      try {
        return D();
      } finally {
        B = I;
      }
    }, p.unstable_pauseExecution = function() {
    }, p.unstable_requestPaint = function() {
    }, p.unstable_runWithPriority = function(D, G) {
      switch (D) {
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
          break;
        default:
          D = 3;
      }
      var I = B;
      B = D;
      try {
        return G();
      } finally {
        B = I;
      }
    }, p.unstable_scheduleCallback = function(D, G, I) {
      var m = p.unstable_now();
      switch (typeof I == "object" && I !== null ? (I = I.delay, I = typeof I == "number" && 0 < I ? m + I : m) : I = m, D) {
        case 1:
          var S = -1;
          break;
        case 2:
          S = 250;
          break;
        case 5:
          S = 1073741823;
          break;
        case 4:
          S = 1e4;
          break;
        default:
          S = 5e3;
      }
      return S = I + S, D = { id: w++, callback: G, priorityLevel: D, startTime: I, expirationTime: S, sortIndex: -1 }, I > m ? (D.sortIndex = I, N(F, D), d(T) === null && D === d(F) && (X ? (be(et), et = -1) : X = !0, ge(pe, I - m))) : (D.sortIndex = S, N(T, D), K || se || (K = !0, Ve(Ue))), D;
    }, p.unstable_shouldYield = ne, p.unstable_wrapCallback = function(D) {
      var G = B;
      return function() {
        var I = B;
        B = G;
        try {
          return D.apply(this, arguments);
        } finally {
          B = I;
        }
      };
    };
  })(ls)), ls;
}
var Ku;
function Yd() {
  return Ku || (Ku = 1, rs.exports = qd()), rs.exports;
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
var Gu;
function Xd() {
  if (Gu) return ut;
  Gu = 1;
  var p = us(), N = Yd();
  function d(e) {
    for (var t = "https://reactjs.org/docs/error-decoder.html?invariant=" + e, n = 1; n < arguments.length; n++) t += "&args[]=" + encodeURIComponent(arguments[n]);
    return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
  }
  var j = /* @__PURE__ */ new Set(), v = {};
  function P(e, t) {
    y(e, t), y(e + "Capture", t);
  }
  function y(e, t) {
    for (v[e] = t, e = 0; e < t.length; e++) j.add(t[e]);
  }
  var z = !(typeof window > "u" || typeof window.document > "u" || typeof window.document.createElement > "u"), T = Object.prototype.hasOwnProperty, F = /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/, w = {}, k = {};
  function B(e) {
    return T.call(k, e) ? !0 : T.call(w, e) ? !1 : F.test(e) ? k[e] = !0 : (w[e] = !0, !1);
  }
  function se(e, t, n, r) {
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
  function K(e, t, n, r) {
    if (t === null || typeof t > "u" || se(e, t, n, r)) return !0;
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
  function X(e, t, n, r, l, i, s) {
    this.acceptsBooleans = t === 2 || t === 3 || t === 4, this.attributeName = r, this.attributeNamespace = l, this.mustUseProperty = n, this.propertyName = e, this.type = t, this.sanitizeURL = i, this.removeEmptyString = s;
  }
  var te = {};
  "children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(e) {
    te[e] = new X(e, 0, !1, e, null, !1, !1);
  }), [["acceptCharset", "accept-charset"], ["className", "class"], ["htmlFor", "for"], ["httpEquiv", "http-equiv"]].forEach(function(e) {
    var t = e[0];
    te[t] = new X(t, 1, !1, e[1], null, !1, !1);
  }), ["contentEditable", "draggable", "spellCheck", "value"].forEach(function(e) {
    te[e] = new X(e, 2, !1, e.toLowerCase(), null, !1, !1);
  }), ["autoReverse", "externalResourcesRequired", "focusable", "preserveAlpha"].forEach(function(e) {
    te[e] = new X(e, 2, !1, e, null, !1, !1);
  }), "allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(e) {
    te[e] = new X(e, 3, !1, e.toLowerCase(), null, !1, !1);
  }), ["checked", "multiple", "muted", "selected"].forEach(function(e) {
    te[e] = new X(e, 3, !0, e, null, !1, !1);
  }), ["capture", "download"].forEach(function(e) {
    te[e] = new X(e, 4, !1, e, null, !1, !1);
  }), ["cols", "rows", "size", "span"].forEach(function(e) {
    te[e] = new X(e, 6, !1, e, null, !1, !1);
  }), ["rowSpan", "start"].forEach(function(e) {
    te[e] = new X(e, 5, !1, e.toLowerCase(), null, !1, !1);
  });
  var be = /[\-:]([a-z])/g;
  function oe(e) {
    return e[1].toUpperCase();
  }
  "accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(e) {
    var t = e.replace(
      be,
      oe
    );
    te[t] = new X(t, 1, !1, e, null, !1, !1);
  }), "xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(e) {
    var t = e.replace(be, oe);
    te[t] = new X(t, 1, !1, e, "http://www.w3.org/1999/xlink", !1, !1);
  }), ["xml:base", "xml:lang", "xml:space"].forEach(function(e) {
    var t = e.replace(be, oe);
    te[t] = new X(t, 1, !1, e, "http://www.w3.org/XML/1998/namespace", !1, !1);
  }), ["tabIndex", "crossOrigin"].forEach(function(e) {
    te[e] = new X(e, 1, !1, e.toLowerCase(), null, !1, !1);
  }), te.xlinkHref = new X("xlinkHref", 1, !1, "xlink:href", "http://www.w3.org/1999/xlink", !0, !1), ["src", "href", "action", "formAction"].forEach(function(e) {
    te[e] = new X(e, 1, !1, e.toLowerCase(), null, !0, !0);
  });
  function Te(e, t, n, r) {
    var l = te.hasOwnProperty(t) ? te[t] : null;
    (l !== null ? l.type !== 0 : r || !(2 < t.length) || t[0] !== "o" && t[0] !== "O" || t[1] !== "n" && t[1] !== "N") && (K(t, n, l, r) && (n = null), r || l === null ? B(t) && (n === null ? e.removeAttribute(t) : e.setAttribute(t, "" + n)) : l.mustUseProperty ? e[l.propertyName] = n === null ? l.type === 3 ? !1 : "" : n : (t = l.attributeName, r = l.attributeNamespace, n === null ? e.removeAttribute(t) : (l = l.type, n = l === 3 || l === 4 && n === !0 ? "" : "" + n, r ? e.setAttributeNS(r, t, n) : e.setAttribute(t, n))));
  }
  var pe = p.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED, Ue = Symbol.for("react.element"), $e = Symbol.for("react.portal"), Ke = Symbol.for("react.fragment"), et = Symbol.for("react.strict_mode"), dt = Symbol.for("react.profiler"), yt = Symbol.for("react.provider"), ne = Symbol.for("react.context"), ft = Symbol.for("react.forward_ref"), Me = Symbol.for("react.suspense"), Ee = Symbol.for("react.suspense_list"), pt = Symbol.for("react.memo"), Ve = Symbol.for("react.lazy"), ge = Symbol.for("react.offscreen"), D = Symbol.iterator;
  function G(e) {
    return e === null || typeof e != "object" ? null : (e = D && e[D] || e["@@iterator"], typeof e == "function" ? e : null);
  }
  var I = Object.assign, m;
  function S(e) {
    if (m === void 0) try {
      throw Error();
    } catch (n) {
      var t = n.stack.trim().match(/\n( *(at )?)/);
      m = t && t[1] || "";
    }
    return `
` + m + e;
  }
  var U = !1;
  function b(e, t) {
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
        } catch (x) {
          var r = x;
        }
        Reflect.construct(e, [], t);
      } else {
        try {
          t.call();
        } catch (x) {
          r = x;
        }
        e.call(t.prototype);
      }
      else {
        try {
          throw Error();
        } catch (x) {
          r = x;
        }
        e();
      }
    } catch (x) {
      if (x && r && typeof x.stack == "string") {
        for (var l = x.stack.split(`
`), i = r.stack.split(`
`), s = l.length - 1, u = i.length - 1; 1 <= s && 0 <= u && l[s] !== i[u]; ) u--;
        for (; 1 <= s && 0 <= u; s--, u--) if (l[s] !== i[u]) {
          if (s !== 1 || u !== 1)
            do
              if (s--, u--, 0 > u || l[s] !== i[u]) {
                var c = `
` + l[s].replace(" at new ", " at ");
                return e.displayName && c.includes("<anonymous>") && (c = c.replace("<anonymous>", e.displayName)), c;
              }
            while (1 <= s && 0 <= u);
          break;
        }
      }
    } finally {
      U = !1, Error.prepareStackTrace = n;
    }
    return (e = e ? e.displayName || e.name : "") ? S(e) : "";
  }
  function ie(e) {
    switch (e.tag) {
      case 5:
        return S(e.type);
      case 16:
        return S("Lazy");
      case 13:
        return S("Suspense");
      case 19:
        return S("SuspenseList");
      case 0:
      case 2:
      case 15:
        return e = b(e.type, !1), e;
      case 11:
        return e = b(e.type.render, !1), e;
      case 1:
        return e = b(e.type, !0), e;
      default:
        return "";
    }
  }
  function ae(e) {
    if (e == null) return null;
    if (typeof e == "function") return e.displayName || e.name || null;
    if (typeof e == "string") return e;
    switch (e) {
      case Ke:
        return "Fragment";
      case $e:
        return "Portal";
      case dt:
        return "Profiler";
      case et:
        return "StrictMode";
      case Me:
        return "Suspense";
      case Ee:
        return "SuspenseList";
    }
    if (typeof e == "object") switch (e.$$typeof) {
      case ne:
        return (e.displayName || "Context") + ".Consumer";
      case yt:
        return (e._context.displayName || "Context") + ".Provider";
      case ft:
        var t = e.render;
        return e = e.displayName, e || (e = t.displayName || t.name || "", e = e !== "" ? "ForwardRef(" + e + ")" : "ForwardRef"), e;
      case pt:
        return t = e.displayName || null, t !== null ? t : ae(e.type) || "Memo";
      case Ve:
        t = e._payload, e = e._init;
        try {
          return ae(e(t));
        } catch {
        }
    }
    return null;
  }
  function me(e) {
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
        return ae(t);
      case 8:
        return t === et ? "StrictMode" : "Mode";
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
  function de(e) {
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
  function he(e) {
    var t = e.type;
    return (e = e.nodeName) && e.toLowerCase() === "input" && (t === "checkbox" || t === "radio");
  }
  function Be(e) {
    var t = he(e) ? "checked" : "value", n = Object.getOwnPropertyDescriptor(e.constructor.prototype, t), r = "" + e[t];
    if (!e.hasOwnProperty(t) && typeof n < "u" && typeof n.get == "function" && typeof n.set == "function") {
      var l = n.get, i = n.set;
      return Object.defineProperty(e, t, { configurable: !0, get: function() {
        return l.call(this);
      }, set: function(s) {
        r = "" + s, i.call(this, s);
      } }), Object.defineProperty(e, t, { enumerable: n.enumerable }), { getValue: function() {
        return r;
      }, setValue: function(s) {
        r = "" + s;
      }, stopTracking: function() {
        e._valueTracker = null, delete e[t];
      } };
    }
  }
  function M(e) {
    e._valueTracker || (e._valueTracker = Be(e));
  }
  function ke(e) {
    if (!e) return !1;
    var t = e._valueTracker;
    if (!t) return !0;
    var n = t.getValue(), r = "";
    return e && (r = he(e) ? e.checked ? "true" : "false" : e.value), e = r, e !== n ? (t.setValue(e), !0) : !1;
  }
  function Q(e) {
    if (e = e || (typeof document < "u" ? document : void 0), typeof e > "u") return null;
    try {
      return e.activeElement || e.body;
    } catch {
      return e.body;
    }
  }
  function Ne(e, t) {
    var n = t.checked;
    return I({}, t, { defaultChecked: void 0, defaultValue: void 0, value: void 0, checked: n ?? e._wrapperState.initialChecked });
  }
  function In(e, t) {
    var n = t.defaultValue == null ? "" : t.defaultValue, r = t.checked != null ? t.checked : t.defaultChecked;
    n = de(t.value != null ? t.value : n), e._wrapperState = { initialChecked: r, initialValue: n, controlled: t.type === "checkbox" || t.type === "radio" ? t.checked != null : t.value != null };
  }
  function Sn(e, t) {
    t = t.checked, t != null && Te(e, "checked", t, !1);
  }
  function Un(e, t) {
    Sn(e, t);
    var n = de(t.value), r = t.type;
    if (n != null) r === "number" ? (n === 0 && e.value === "" || e.value != n) && (e.value = "" + n) : e.value !== "" + n && (e.value = "" + n);
    else if (r === "submit" || r === "reset") {
      e.removeAttribute("value");
      return;
    }
    t.hasOwnProperty("value") ? ye(e, t.type, n) : t.hasOwnProperty("defaultValue") && ye(e, t.type, de(t.defaultValue)), t.checked == null && t.defaultChecked != null && (e.defaultChecked = !!t.defaultChecked);
  }
  function rl(e, t, n) {
    if (t.hasOwnProperty("value") || t.hasOwnProperty("defaultValue")) {
      var r = t.type;
      if (!(r !== "submit" && r !== "reset" || t.value !== void 0 && t.value !== null)) return;
      t = "" + e._wrapperState.initialValue, n || t === e.value || (e.value = t), e.defaultValue = t;
    }
    n = e.name, n !== "" && (e.name = ""), e.defaultChecked = !!e._wrapperState.initialChecked, n !== "" && (e.name = n);
  }
  function ye(e, t, n) {
    (t !== "number" || Q(e.ownerDocument) !== e) && (n == null ? e.defaultValue = "" + e._wrapperState.initialValue : e.defaultValue !== "" + n && (e.defaultValue = "" + n));
  }
  var Ut = Array.isArray;
  function bt(e, t, n, r) {
    if (e = e.options, t) {
      t = {};
      for (var l = 0; l < n.length; l++) t["$" + n[l]] = !0;
      for (n = 0; n < e.length; n++) l = t.hasOwnProperty("$" + e[n].value), e[n].selected !== l && (e[n].selected = l), l && r && (e[n].defaultSelected = !0);
    } else {
      for (n = "" + de(n), t = null, l = 0; l < e.length; l++) {
        if (e[l].value === n) {
          e[l].selected = !0, r && (e[l].defaultSelected = !0);
          return;
        }
        t !== null || e[l].disabled || (t = e[l]);
      }
      t !== null && (t.selected = !0);
    }
  }
  function gr(e, t) {
    if (t.dangerouslySetInnerHTML != null) throw Error(d(91));
    return I({}, t, { value: void 0, defaultValue: void 0, children: "" + e._wrapperState.initialValue });
  }
  function ll(e, t) {
    var n = t.value;
    if (n == null) {
      if (n = t.children, t = t.defaultValue, n != null) {
        if (t != null) throw Error(d(92));
        if (Ut(n)) {
          if (1 < n.length) throw Error(d(93));
          n = n[0];
        }
        t = n;
      }
      t == null && (t = ""), n = t;
    }
    e._wrapperState = { initialValue: de(n) };
  }
  function tt(e, t) {
    var n = de(t.value), r = de(t.defaultValue);
    n != null && (n = "" + n, n !== e.value && (e.value = n), t.defaultValue == null && e.defaultValue !== n && (e.defaultValue = n)), r != null && (e.defaultValue = "" + r);
  }
  function ol(e) {
    var t = e.textContent;
    t === e._wrapperState.initialValue && t !== "" && t !== null && (e.value = t);
  }
  function nt(e) {
    switch (e) {
      case "svg":
        return "http://www.w3.org/2000/svg";
      case "math":
        return "http://www.w3.org/1998/Math/MathML";
      default:
        return "http://www.w3.org/1999/xhtml";
    }
  }
  function Cn(e, t) {
    return e == null || e === "http://www.w3.org/1999/xhtml" ? nt(t) : e === "http://www.w3.org/2000/svg" && t === "foreignObject" ? "http://www.w3.org/1999/xhtml" : e;
  }
  var $n, $t = (function(e) {
    return typeof MSApp < "u" && MSApp.execUnsafeLocalFunction ? function(t, n, r, l) {
      MSApp.execUnsafeLocalFunction(function() {
        return e(t, n, r, l);
      });
    } : e;
  })(function(e, t) {
    if (e.namespaceURI !== "http://www.w3.org/2000/svg" || "innerHTML" in e) e.innerHTML = t;
    else {
      for ($n = $n || document.createElement("div"), $n.innerHTML = "<svg>" + t.valueOf().toString() + "</svg>", t = $n.firstChild; e.firstChild; ) e.removeChild(e.firstChild);
      for (; t.firstChild; ) e.appendChild(t.firstChild);
    }
  });
  function He(e, t) {
    if (t) {
      var n = e.firstChild;
      if (n && n === e.lastChild && n.nodeType === 3) {
        n.nodeValue = t;
        return;
      }
    }
    e.textContent = t;
  }
  var en = {
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
  }, yo = ["Webkit", "ms", "Moz", "O"];
  Object.keys(en).forEach(function(e) {
    yo.forEach(function(t) {
      t = t + e.charAt(0).toUpperCase() + e.substring(1), en[t] = en[e];
    });
  });
  function yr(e, t, n) {
    return t == null || typeof t == "boolean" || t === "" ? "" : n || typeof t != "number" || t === 0 || en.hasOwnProperty(e) && en[e] ? ("" + t).trim() : t + "px";
  }
  function xr(e, t) {
    e = e.style;
    for (var n in t) if (t.hasOwnProperty(n)) {
      var r = n.indexOf("--") === 0, l = yr(n, t[n], r);
      n === "float" && (n = "cssFloat"), r ? e.setProperty(n, l) : e[n] = l;
    }
  }
  var il = I({ menuitem: !0 }, { area: !0, base: !0, br: !0, col: !0, embed: !0, hr: !0, img: !0, input: !0, keygen: !0, link: !0, meta: !0, param: !0, source: !0, track: !0, wbr: !0 });
  function Vn(e, t) {
    if (t) {
      if (il[e] && (t.children != null || t.dangerouslySetInnerHTML != null)) throw Error(d(137, e));
      if (t.dangerouslySetInnerHTML != null) {
        if (t.children != null) throw Error(d(60));
        if (typeof t.dangerouslySetInnerHTML != "object" || !("__html" in t.dangerouslySetInnerHTML)) throw Error(d(61));
      }
      if (t.style != null && typeof t.style != "object") throw Error(d(62));
    }
  }
  function Bn(e, t) {
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
  var Hn = null;
  function Wn(e) {
    return e = e.target || e.srcElement || window, e.correspondingUseElement && (e = e.correspondingUseElement), e.nodeType === 3 ? e.parentNode : e;
  }
  var Qn = null, Vt = null, Bt = null;
  function jr(e) {
    if (e = Ur(e)) {
      if (typeof Qn != "function") throw Error(d(280));
      var t = e.stateNode;
      t && (t = Tl(t), Qn(e.stateNode, e.type, t));
    }
  }
  function a(e) {
    Vt ? Bt ? Bt.push(e) : Bt = [e] : Vt = e;
  }
  function R() {
    if (Vt) {
      var e = Vt, t = Bt;
      if (Bt = Vt = null, jr(e), t) for (e = 0; e < t.length; e++) jr(t[e]);
    }
  }
  function O(e, t) {
    return e(t);
  }
  function ue() {
  }
  var rt = !1;
  function _t(e, t, n) {
    if (rt) return e(t, n);
    rt = !0;
    try {
      return O(e, t, n);
    } finally {
      rt = !1, (Vt !== null || Bt !== null) && (ue(), R());
    }
  }
  function Et(e, t) {
    var n = e.stateNode;
    if (n === null) return null;
    var r = Tl(n);
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
    if (n && typeof n != "function") throw Error(d(231, t, typeof n));
    return n;
  }
  var Kn = !1;
  if (z) try {
    var tn = {};
    Object.defineProperty(tn, "passive", { get: function() {
      Kn = !0;
    } }), window.addEventListener("test", tn, tn), window.removeEventListener("test", tn, tn);
  } catch {
    Kn = !1;
  }
  function sl(e, t, n, r, l, i, s, u, c) {
    var x = Array.prototype.slice.call(arguments, 3);
    try {
      t.apply(n, x);
    } catch (_) {
      this.onError(_);
    }
  }
  var nn = !1, Gn = null, al = !1, xo = null, Zu = { onError: function(e) {
    nn = !0, Gn = e;
  } };
  function bu(e, t, n, r, l, i, s, u, c) {
    nn = !1, Gn = null, sl.apply(Zu, arguments);
  }
  function ec(e, t, n, r, l, i, s, u, c) {
    if (bu.apply(this, arguments), nn) {
      if (nn) {
        var x = Gn;
        nn = !1, Gn = null;
      } else throw Error(d(198));
      al || (al = !0, xo = x);
    }
  }
  function _n(e) {
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
  function cs(e) {
    if (e.tag === 13) {
      var t = e.memoizedState;
      if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null) return t.dehydrated;
    }
    return null;
  }
  function ds(e) {
    if (_n(e) !== e) throw Error(d(188));
  }
  function tc(e) {
    var t = e.alternate;
    if (!t) {
      if (t = _n(e), t === null) throw Error(d(188));
      return t !== e ? null : e;
    }
    for (var n = e, r = t; ; ) {
      var l = n.return;
      if (l === null) break;
      var i = l.alternate;
      if (i === null) {
        if (r = l.return, r !== null) {
          n = r;
          continue;
        }
        break;
      }
      if (l.child === i.child) {
        for (i = l.child; i; ) {
          if (i === n) return ds(l), e;
          if (i === r) return ds(l), t;
          i = i.sibling;
        }
        throw Error(d(188));
      }
      if (n.return !== r.return) n = l, r = i;
      else {
        for (var s = !1, u = l.child; u; ) {
          if (u === n) {
            s = !0, n = l, r = i;
            break;
          }
          if (u === r) {
            s = !0, r = l, n = i;
            break;
          }
          u = u.sibling;
        }
        if (!s) {
          for (u = i.child; u; ) {
            if (u === n) {
              s = !0, n = i, r = l;
              break;
            }
            if (u === r) {
              s = !0, r = i, n = l;
              break;
            }
            u = u.sibling;
          }
          if (!s) throw Error(d(189));
        }
      }
      if (n.alternate !== r) throw Error(d(190));
    }
    if (n.tag !== 3) throw Error(d(188));
    return n.stateNode.current === n ? e : t;
  }
  function fs(e) {
    return e = tc(e), e !== null ? ps(e) : null;
  }
  function ps(e) {
    if (e.tag === 5 || e.tag === 6) return e;
    for (e = e.child; e !== null; ) {
      var t = ps(e);
      if (t !== null) return t;
      e = e.sibling;
    }
    return null;
  }
  var ms = N.unstable_scheduleCallback, hs = N.unstable_cancelCallback, nc = N.unstable_shouldYield, rc = N.unstable_requestPaint, Le = N.unstable_now, lc = N.unstable_getCurrentPriorityLevel, jo = N.unstable_ImmediatePriority, vs = N.unstable_UserBlockingPriority, ul = N.unstable_NormalPriority, oc = N.unstable_LowPriority, gs = N.unstable_IdlePriority, cl = null, Dt = null;
  function ic(e) {
    if (Dt && typeof Dt.onCommitFiberRoot == "function") try {
      Dt.onCommitFiberRoot(cl, e, void 0, (e.current.flags & 128) === 128);
    } catch {
    }
  }
  var Nt = Math.clz32 ? Math.clz32 : uc, sc = Math.log, ac = Math.LN2;
  function uc(e) {
    return e >>>= 0, e === 0 ? 32 : 31 - (sc(e) / ac | 0) | 0;
  }
  var dl = 64, fl = 4194304;
  function wr(e) {
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
  function pl(e, t) {
    var n = e.pendingLanes;
    if (n === 0) return 0;
    var r = 0, l = e.suspendedLanes, i = e.pingedLanes, s = n & 268435455;
    if (s !== 0) {
      var u = s & ~l;
      u !== 0 ? r = wr(u) : (i &= s, i !== 0 && (r = wr(i)));
    } else s = n & ~l, s !== 0 ? r = wr(s) : i !== 0 && (r = wr(i));
    if (r === 0) return 0;
    if (t !== 0 && t !== r && (t & l) === 0 && (l = r & -r, i = t & -t, l >= i || l === 16 && (i & 4194240) !== 0)) return t;
    if ((r & 4) !== 0 && (r |= n & 16), t = e.entangledLanes, t !== 0) for (e = e.entanglements, t &= r; 0 < t; ) n = 31 - Nt(t), l = 1 << n, r |= e[n], t &= ~l;
    return r;
  }
  function cc(e, t) {
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
  function dc(e, t) {
    for (var n = e.suspendedLanes, r = e.pingedLanes, l = e.expirationTimes, i = e.pendingLanes; 0 < i; ) {
      var s = 31 - Nt(i), u = 1 << s, c = l[s];
      c === -1 ? ((u & n) === 0 || (u & r) !== 0) && (l[s] = cc(u, t)) : c <= t && (e.expiredLanes |= u), i &= ~u;
    }
  }
  function wo(e) {
    return e = e.pendingLanes & -1073741825, e !== 0 ? e : e & 1073741824 ? 1073741824 : 0;
  }
  function ys() {
    var e = dl;
    return dl <<= 1, (dl & 4194240) === 0 && (dl = 64), e;
  }
  function ko(e) {
    for (var t = [], n = 0; 31 > n; n++) t.push(e);
    return t;
  }
  function kr(e, t, n) {
    e.pendingLanes |= t, t !== 536870912 && (e.suspendedLanes = 0, e.pingedLanes = 0), e = e.eventTimes, t = 31 - Nt(t), e[t] = n;
  }
  function fc(e, t) {
    var n = e.pendingLanes & ~t;
    e.pendingLanes = t, e.suspendedLanes = 0, e.pingedLanes = 0, e.expiredLanes &= t, e.mutableReadLanes &= t, e.entangledLanes &= t, t = e.entanglements;
    var r = e.eventTimes;
    for (e = e.expirationTimes; 0 < n; ) {
      var l = 31 - Nt(n), i = 1 << l;
      t[l] = 0, r[l] = -1, e[l] = -1, n &= ~i;
    }
  }
  function So(e, t) {
    var n = e.entangledLanes |= t;
    for (e = e.entanglements; n; ) {
      var r = 31 - Nt(n), l = 1 << r;
      l & t | e[r] & t && (e[r] |= t), n &= ~l;
    }
  }
  var ve = 0;
  function xs(e) {
    return e &= -e, 1 < e ? 4 < e ? (e & 268435455) !== 0 ? 16 : 536870912 : 4 : 1;
  }
  var js, Co, ws, ks, Ss, _o = !1, ml = [], rn = null, ln = null, on = null, Sr = /* @__PURE__ */ new Map(), Cr = /* @__PURE__ */ new Map(), sn = [], pc = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(" ");
  function Cs(e, t) {
    switch (e) {
      case "focusin":
      case "focusout":
        rn = null;
        break;
      case "dragenter":
      case "dragleave":
        ln = null;
        break;
      case "mouseover":
      case "mouseout":
        on = null;
        break;
      case "pointerover":
      case "pointerout":
        Sr.delete(t.pointerId);
        break;
      case "gotpointercapture":
      case "lostpointercapture":
        Cr.delete(t.pointerId);
    }
  }
  function _r(e, t, n, r, l, i) {
    return e === null || e.nativeEvent !== i ? (e = { blockedOn: t, domEventName: n, eventSystemFlags: r, nativeEvent: i, targetContainers: [l] }, t !== null && (t = Ur(t), t !== null && Co(t)), e) : (e.eventSystemFlags |= r, t = e.targetContainers, l !== null && t.indexOf(l) === -1 && t.push(l), e);
  }
  function mc(e, t, n, r, l) {
    switch (t) {
      case "focusin":
        return rn = _r(rn, e, t, n, r, l), !0;
      case "dragenter":
        return ln = _r(ln, e, t, n, r, l), !0;
      case "mouseover":
        return on = _r(on, e, t, n, r, l), !0;
      case "pointerover":
        var i = l.pointerId;
        return Sr.set(i, _r(Sr.get(i) || null, e, t, n, r, l)), !0;
      case "gotpointercapture":
        return i = l.pointerId, Cr.set(i, _r(Cr.get(i) || null, e, t, n, r, l)), !0;
    }
    return !1;
  }
  function _s(e) {
    var t = En(e.target);
    if (t !== null) {
      var n = _n(t);
      if (n !== null) {
        if (t = n.tag, t === 13) {
          if (t = cs(n), t !== null) {
            e.blockedOn = t, Ss(e.priority, function() {
              ws(n);
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
  function hl(e) {
    if (e.blockedOn !== null) return !1;
    for (var t = e.targetContainers; 0 < t.length; ) {
      var n = No(e.domEventName, e.eventSystemFlags, t[0], e.nativeEvent);
      if (n === null) {
        n = e.nativeEvent;
        var r = new n.constructor(n.type, n);
        Hn = r, n.target.dispatchEvent(r), Hn = null;
      } else return t = Ur(n), t !== null && Co(t), e.blockedOn = n, !1;
      t.shift();
    }
    return !0;
  }
  function Es(e, t, n) {
    hl(e) && n.delete(t);
  }
  function hc() {
    _o = !1, rn !== null && hl(rn) && (rn = null), ln !== null && hl(ln) && (ln = null), on !== null && hl(on) && (on = null), Sr.forEach(Es), Cr.forEach(Es);
  }
  function Er(e, t) {
    e.blockedOn === t && (e.blockedOn = null, _o || (_o = !0, N.unstable_scheduleCallback(N.unstable_NormalPriority, hc)));
  }
  function Nr(e) {
    function t(l) {
      return Er(l, e);
    }
    if (0 < ml.length) {
      Er(ml[0], e);
      for (var n = 1; n < ml.length; n++) {
        var r = ml[n];
        r.blockedOn === e && (r.blockedOn = null);
      }
    }
    for (rn !== null && Er(rn, e), ln !== null && Er(ln, e), on !== null && Er(on, e), Sr.forEach(t), Cr.forEach(t), n = 0; n < sn.length; n++) r = sn[n], r.blockedOn === e && (r.blockedOn = null);
    for (; 0 < sn.length && (n = sn[0], n.blockedOn === null); ) _s(n), n.blockedOn === null && sn.shift();
  }
  var qn = pe.ReactCurrentBatchConfig, vl = !0;
  function vc(e, t, n, r) {
    var l = ve, i = qn.transition;
    qn.transition = null;
    try {
      ve = 1, Eo(e, t, n, r);
    } finally {
      ve = l, qn.transition = i;
    }
  }
  function gc(e, t, n, r) {
    var l = ve, i = qn.transition;
    qn.transition = null;
    try {
      ve = 4, Eo(e, t, n, r);
    } finally {
      ve = l, qn.transition = i;
    }
  }
  function Eo(e, t, n, r) {
    if (vl) {
      var l = No(e, t, n, r);
      if (l === null) Wo(e, t, r, gl, n), Cs(e, r);
      else if (mc(l, e, t, n, r)) r.stopPropagation();
      else if (Cs(e, r), t & 4 && -1 < pc.indexOf(e)) {
        for (; l !== null; ) {
          var i = Ur(l);
          if (i !== null && js(i), i = No(e, t, n, r), i === null && Wo(e, t, r, gl, n), i === l) break;
          l = i;
        }
        l !== null && r.stopPropagation();
      } else Wo(e, t, r, null, n);
    }
  }
  var gl = null;
  function No(e, t, n, r) {
    if (gl = null, e = Wn(r), e = En(e), e !== null) if (t = _n(e), t === null) e = null;
    else if (n = t.tag, n === 13) {
      if (e = cs(t), e !== null) return e;
      e = null;
    } else if (n === 3) {
      if (t.stateNode.current.memoizedState.isDehydrated) return t.tag === 3 ? t.stateNode.containerInfo : null;
      e = null;
    } else t !== e && (e = null);
    return gl = e, null;
  }
  function Ns(e) {
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
        switch (lc()) {
          case jo:
            return 1;
          case vs:
            return 4;
          case ul:
          case oc:
            return 16;
          case gs:
            return 536870912;
          default:
            return 16;
        }
      default:
        return 16;
    }
  }
  var an = null, Po = null, yl = null;
  function Ps() {
    if (yl) return yl;
    var e, t = Po, n = t.length, r, l = "value" in an ? an.value : an.textContent, i = l.length;
    for (e = 0; e < n && t[e] === l[e]; e++) ;
    var s = n - e;
    for (r = 1; r <= s && t[n - r] === l[i - r]; r++) ;
    return yl = l.slice(e, 1 < r ? 1 - r : void 0);
  }
  function xl(e) {
    var t = e.keyCode;
    return "charCode" in e ? (e = e.charCode, e === 0 && t === 13 && (e = 13)) : e = t, e === 10 && (e = 13), 32 <= e || e === 13 ? e : 0;
  }
  function jl() {
    return !0;
  }
  function Ts() {
    return !1;
  }
  function mt(e) {
    function t(n, r, l, i, s) {
      this._reactName = n, this._targetInst = l, this.type = r, this.nativeEvent = i, this.target = s, this.currentTarget = null;
      for (var u in e) e.hasOwnProperty(u) && (n = e[u], this[u] = n ? n(i) : i[u]);
      return this.isDefaultPrevented = (i.defaultPrevented != null ? i.defaultPrevented : i.returnValue === !1) ? jl : Ts, this.isPropagationStopped = Ts, this;
    }
    return I(t.prototype, { preventDefault: function() {
      this.defaultPrevented = !0;
      var n = this.nativeEvent;
      n && (n.preventDefault ? n.preventDefault() : typeof n.returnValue != "unknown" && (n.returnValue = !1), this.isDefaultPrevented = jl);
    }, stopPropagation: function() {
      var n = this.nativeEvent;
      n && (n.stopPropagation ? n.stopPropagation() : typeof n.cancelBubble != "unknown" && (n.cancelBubble = !0), this.isPropagationStopped = jl);
    }, persist: function() {
    }, isPersistent: jl }), t;
  }
  var Yn = { eventPhase: 0, bubbles: 0, cancelable: 0, timeStamp: function(e) {
    return e.timeStamp || Date.now();
  }, defaultPrevented: 0, isTrusted: 0 }, To = mt(Yn), Pr = I({}, Yn, { view: 0, detail: 0 }), yc = mt(Pr), Lo, zo, Tr, wl = I({}, Pr, { screenX: 0, screenY: 0, clientX: 0, clientY: 0, pageX: 0, pageY: 0, ctrlKey: 0, shiftKey: 0, altKey: 0, metaKey: 0, getModifierState: Mo, button: 0, buttons: 0, relatedTarget: function(e) {
    return e.relatedTarget === void 0 ? e.fromElement === e.srcElement ? e.toElement : e.fromElement : e.relatedTarget;
  }, movementX: function(e) {
    return "movementX" in e ? e.movementX : (e !== Tr && (Tr && e.type === "mousemove" ? (Lo = e.screenX - Tr.screenX, zo = e.screenY - Tr.screenY) : zo = Lo = 0, Tr = e), Lo);
  }, movementY: function(e) {
    return "movementY" in e ? e.movementY : zo;
  } }), Ls = mt(wl), xc = I({}, wl, { dataTransfer: 0 }), jc = mt(xc), wc = I({}, Pr, { relatedTarget: 0 }), Ro = mt(wc), kc = I({}, Yn, { animationName: 0, elapsedTime: 0, pseudoElement: 0 }), Sc = mt(kc), Cc = I({}, Yn, { clipboardData: function(e) {
    return "clipboardData" in e ? e.clipboardData : window.clipboardData;
  } }), _c = mt(Cc), Ec = I({}, Yn, { data: 0 }), zs = mt(Ec), Nc = {
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
  }, Pc = {
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
  }, Tc = { Alt: "altKey", Control: "ctrlKey", Meta: "metaKey", Shift: "shiftKey" };
  function Lc(e) {
    var t = this.nativeEvent;
    return t.getModifierState ? t.getModifierState(e) : (e = Tc[e]) ? !!t[e] : !1;
  }
  function Mo() {
    return Lc;
  }
  var zc = I({}, Pr, { key: function(e) {
    if (e.key) {
      var t = Nc[e.key] || e.key;
      if (t !== "Unidentified") return t;
    }
    return e.type === "keypress" ? (e = xl(e), e === 13 ? "Enter" : String.fromCharCode(e)) : e.type === "keydown" || e.type === "keyup" ? Pc[e.keyCode] || "Unidentified" : "";
  }, code: 0, location: 0, ctrlKey: 0, shiftKey: 0, altKey: 0, metaKey: 0, repeat: 0, locale: 0, getModifierState: Mo, charCode: function(e) {
    return e.type === "keypress" ? xl(e) : 0;
  }, keyCode: function(e) {
    return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
  }, which: function(e) {
    return e.type === "keypress" ? xl(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
  } }), Rc = mt(zc), Mc = I({}, wl, { pointerId: 0, width: 0, height: 0, pressure: 0, tangentialPressure: 0, tiltX: 0, tiltY: 0, twist: 0, pointerType: 0, isPrimary: 0 }), Rs = mt(Mc), Dc = I({}, Pr, { touches: 0, targetTouches: 0, changedTouches: 0, altKey: 0, metaKey: 0, ctrlKey: 0, shiftKey: 0, getModifierState: Mo }), Oc = mt(Dc), Fc = I({}, Yn, { propertyName: 0, elapsedTime: 0, pseudoElement: 0 }), Ac = mt(Fc), Ic = I({}, wl, {
    deltaX: function(e) {
      return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
    },
    deltaY: function(e) {
      return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
    },
    deltaZ: 0,
    deltaMode: 0
  }), Uc = mt(Ic), $c = [9, 13, 27, 32], Do = z && "CompositionEvent" in window, Lr = null;
  z && "documentMode" in document && (Lr = document.documentMode);
  var Vc = z && "TextEvent" in window && !Lr, Ms = z && (!Do || Lr && 8 < Lr && 11 >= Lr), Ds = " ", Os = !1;
  function Fs(e, t) {
    switch (e) {
      case "keyup":
        return $c.indexOf(t.keyCode) !== -1;
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
  function As(e) {
    return e = e.detail, typeof e == "object" && "data" in e ? e.data : null;
  }
  var Xn = !1;
  function Bc(e, t) {
    switch (e) {
      case "compositionend":
        return As(t);
      case "keypress":
        return t.which !== 32 ? null : (Os = !0, Ds);
      case "textInput":
        return e = t.data, e === Ds && Os ? null : e;
      default:
        return null;
    }
  }
  function Hc(e, t) {
    if (Xn) return e === "compositionend" || !Do && Fs(e, t) ? (e = Ps(), yl = Po = an = null, Xn = !1, e) : null;
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
        return Ms && t.locale !== "ko" ? null : t.data;
      default:
        return null;
    }
  }
  var Wc = { color: !0, date: !0, datetime: !0, "datetime-local": !0, email: !0, month: !0, number: !0, password: !0, range: !0, search: !0, tel: !0, text: !0, time: !0, url: !0, week: !0 };
  function Is(e) {
    var t = e && e.nodeName && e.nodeName.toLowerCase();
    return t === "input" ? !!Wc[e.type] : t === "textarea";
  }
  function Us(e, t, n, r) {
    a(r), t = El(t, "onChange"), 0 < t.length && (n = new To("onChange", "change", null, n, r), e.push({ event: n, listeners: t }));
  }
  var zr = null, Rr = null;
  function Qc(e) {
    ra(e, 0);
  }
  function kl(e) {
    var t = tr(e);
    if (ke(t)) return e;
  }
  function Kc(e, t) {
    if (e === "change") return t;
  }
  var $s = !1;
  if (z) {
    var Oo;
    if (z) {
      var Fo = "oninput" in document;
      if (!Fo) {
        var Vs = document.createElement("div");
        Vs.setAttribute("oninput", "return;"), Fo = typeof Vs.oninput == "function";
      }
      Oo = Fo;
    } else Oo = !1;
    $s = Oo && (!document.documentMode || 9 < document.documentMode);
  }
  function Bs() {
    zr && (zr.detachEvent("onpropertychange", Hs), Rr = zr = null);
  }
  function Hs(e) {
    if (e.propertyName === "value" && kl(Rr)) {
      var t = [];
      Us(t, Rr, e, Wn(e)), _t(Qc, t);
    }
  }
  function Gc(e, t, n) {
    e === "focusin" ? (Bs(), zr = t, Rr = n, zr.attachEvent("onpropertychange", Hs)) : e === "focusout" && Bs();
  }
  function qc(e) {
    if (e === "selectionchange" || e === "keyup" || e === "keydown") return kl(Rr);
  }
  function Yc(e, t) {
    if (e === "click") return kl(t);
  }
  function Xc(e, t) {
    if (e === "input" || e === "change") return kl(t);
  }
  function Jc(e, t) {
    return e === t && (e !== 0 || 1 / e === 1 / t) || e !== e && t !== t;
  }
  var Pt = typeof Object.is == "function" ? Object.is : Jc;
  function Mr(e, t) {
    if (Pt(e, t)) return !0;
    if (typeof e != "object" || e === null || typeof t != "object" || t === null) return !1;
    var n = Object.keys(e), r = Object.keys(t);
    if (n.length !== r.length) return !1;
    for (r = 0; r < n.length; r++) {
      var l = n[r];
      if (!T.call(t, l) || !Pt(e[l], t[l])) return !1;
    }
    return !0;
  }
  function Ws(e) {
    for (; e && e.firstChild; ) e = e.firstChild;
    return e;
  }
  function Qs(e, t) {
    var n = Ws(e);
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
      n = Ws(n);
    }
  }
  function Ks(e, t) {
    return e && t ? e === t ? !0 : e && e.nodeType === 3 ? !1 : t && t.nodeType === 3 ? Ks(e, t.parentNode) : "contains" in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1 : !1;
  }
  function Gs() {
    for (var e = window, t = Q(); t instanceof e.HTMLIFrameElement; ) {
      try {
        var n = typeof t.contentWindow.location.href == "string";
      } catch {
        n = !1;
      }
      if (n) e = t.contentWindow;
      else break;
      t = Q(e.document);
    }
    return t;
  }
  function Ao(e) {
    var t = e && e.nodeName && e.nodeName.toLowerCase();
    return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true");
  }
  function Zc(e) {
    var t = Gs(), n = e.focusedElem, r = e.selectionRange;
    if (t !== n && n && n.ownerDocument && Ks(n.ownerDocument.documentElement, n)) {
      if (r !== null && Ao(n)) {
        if (t = r.start, e = r.end, e === void 0 && (e = t), "selectionStart" in n) n.selectionStart = t, n.selectionEnd = Math.min(e, n.value.length);
        else if (e = (t = n.ownerDocument || document) && t.defaultView || window, e.getSelection) {
          e = e.getSelection();
          var l = n.textContent.length, i = Math.min(r.start, l);
          r = r.end === void 0 ? i : Math.min(r.end, l), !e.extend && i > r && (l = r, r = i, i = l), l = Qs(n, i);
          var s = Qs(
            n,
            r
          );
          l && s && (e.rangeCount !== 1 || e.anchorNode !== l.node || e.anchorOffset !== l.offset || e.focusNode !== s.node || e.focusOffset !== s.offset) && (t = t.createRange(), t.setStart(l.node, l.offset), e.removeAllRanges(), i > r ? (e.addRange(t), e.extend(s.node, s.offset)) : (t.setEnd(s.node, s.offset), e.addRange(t)));
        }
      }
      for (t = [], e = n; e = e.parentNode; ) e.nodeType === 1 && t.push({ element: e, left: e.scrollLeft, top: e.scrollTop });
      for (typeof n.focus == "function" && n.focus(), n = 0; n < t.length; n++) e = t[n], e.element.scrollLeft = e.left, e.element.scrollTop = e.top;
    }
  }
  var bc = z && "documentMode" in document && 11 >= document.documentMode, Jn = null, Io = null, Dr = null, Uo = !1;
  function qs(e, t, n) {
    var r = n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
    Uo || Jn == null || Jn !== Q(r) || (r = Jn, "selectionStart" in r && Ao(r) ? r = { start: r.selectionStart, end: r.selectionEnd } : (r = (r.ownerDocument && r.ownerDocument.defaultView || window).getSelection(), r = { anchorNode: r.anchorNode, anchorOffset: r.anchorOffset, focusNode: r.focusNode, focusOffset: r.focusOffset }), Dr && Mr(Dr, r) || (Dr = r, r = El(Io, "onSelect"), 0 < r.length && (t = new To("onSelect", "select", null, t, n), e.push({ event: t, listeners: r }), t.target = Jn)));
  }
  function Sl(e, t) {
    var n = {};
    return n[e.toLowerCase()] = t.toLowerCase(), n["Webkit" + e] = "webkit" + t, n["Moz" + e] = "moz" + t, n;
  }
  var Zn = { animationend: Sl("Animation", "AnimationEnd"), animationiteration: Sl("Animation", "AnimationIteration"), animationstart: Sl("Animation", "AnimationStart"), transitionend: Sl("Transition", "TransitionEnd") }, $o = {}, Ys = {};
  z && (Ys = document.createElement("div").style, "AnimationEvent" in window || (delete Zn.animationend.animation, delete Zn.animationiteration.animation, delete Zn.animationstart.animation), "TransitionEvent" in window || delete Zn.transitionend.transition);
  function Cl(e) {
    if ($o[e]) return $o[e];
    if (!Zn[e]) return e;
    var t = Zn[e], n;
    for (n in t) if (t.hasOwnProperty(n) && n in Ys) return $o[e] = t[n];
    return e;
  }
  var Xs = Cl("animationend"), Js = Cl("animationiteration"), Zs = Cl("animationstart"), bs = Cl("transitionend"), ea = /* @__PURE__ */ new Map(), ta = "abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
  function un(e, t) {
    ea.set(e, t), P(t, [e]);
  }
  for (var Vo = 0; Vo < ta.length; Vo++) {
    var Bo = ta[Vo], ed = Bo.toLowerCase(), td = Bo[0].toUpperCase() + Bo.slice(1);
    un(ed, "on" + td);
  }
  un(Xs, "onAnimationEnd"), un(Js, "onAnimationIteration"), un(Zs, "onAnimationStart"), un("dblclick", "onDoubleClick"), un("focusin", "onFocus"), un("focusout", "onBlur"), un(bs, "onTransitionEnd"), y("onMouseEnter", ["mouseout", "mouseover"]), y("onMouseLeave", ["mouseout", "mouseover"]), y("onPointerEnter", ["pointerout", "pointerover"]), y("onPointerLeave", ["pointerout", "pointerover"]), P("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" ")), P("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")), P("onBeforeInput", ["compositionend", "keypress", "textInput", "paste"]), P("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" ")), P("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" ")), P("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
  var Or = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), nd = new Set("cancel close invalid load scroll toggle".split(" ").concat(Or));
  function na(e, t, n) {
    var r = e.type || "unknown-event";
    e.currentTarget = n, ec(r, t, void 0, e), e.currentTarget = null;
  }
  function ra(e, t) {
    t = (t & 4) !== 0;
    for (var n = 0; n < e.length; n++) {
      var r = e[n], l = r.event;
      r = r.listeners;
      e: {
        var i = void 0;
        if (t) for (var s = r.length - 1; 0 <= s; s--) {
          var u = r[s], c = u.instance, x = u.currentTarget;
          if (u = u.listener, c !== i && l.isPropagationStopped()) break e;
          na(l, u, x), i = c;
        }
        else for (s = 0; s < r.length; s++) {
          if (u = r[s], c = u.instance, x = u.currentTarget, u = u.listener, c !== i && l.isPropagationStopped()) break e;
          na(l, u, x), i = c;
        }
      }
    }
    if (al) throw e = xo, al = !1, xo = null, e;
  }
  function je(e, t) {
    var n = t[Xo];
    n === void 0 && (n = t[Xo] = /* @__PURE__ */ new Set());
    var r = e + "__bubble";
    n.has(r) || (la(t, e, 2, !1), n.add(r));
  }
  function Ho(e, t, n) {
    var r = 0;
    t && (r |= 4), la(n, e, r, t);
  }
  var _l = "_reactListening" + Math.random().toString(36).slice(2);
  function Fr(e) {
    if (!e[_l]) {
      e[_l] = !0, j.forEach(function(n) {
        n !== "selectionchange" && (nd.has(n) || Ho(n, !1, e), Ho(n, !0, e));
      });
      var t = e.nodeType === 9 ? e : e.ownerDocument;
      t === null || t[_l] || (t[_l] = !0, Ho("selectionchange", !1, t));
    }
  }
  function la(e, t, n, r) {
    switch (Ns(t)) {
      case 1:
        var l = vc;
        break;
      case 4:
        l = gc;
        break;
      default:
        l = Eo;
    }
    n = l.bind(null, t, n, e), l = void 0, !Kn || t !== "touchstart" && t !== "touchmove" && t !== "wheel" || (l = !0), r ? l !== void 0 ? e.addEventListener(t, n, { capture: !0, passive: l }) : e.addEventListener(t, n, !0) : l !== void 0 ? e.addEventListener(t, n, { passive: l }) : e.addEventListener(t, n, !1);
  }
  function Wo(e, t, n, r, l) {
    var i = r;
    if ((t & 1) === 0 && (t & 2) === 0 && r !== null) e: for (; ; ) {
      if (r === null) return;
      var s = r.tag;
      if (s === 3 || s === 4) {
        var u = r.stateNode.containerInfo;
        if (u === l || u.nodeType === 8 && u.parentNode === l) break;
        if (s === 4) for (s = r.return; s !== null; ) {
          var c = s.tag;
          if ((c === 3 || c === 4) && (c = s.stateNode.containerInfo, c === l || c.nodeType === 8 && c.parentNode === l)) return;
          s = s.return;
        }
        for (; u !== null; ) {
          if (s = En(u), s === null) return;
          if (c = s.tag, c === 5 || c === 6) {
            r = i = s;
            continue e;
          }
          u = u.parentNode;
        }
      }
      r = r.return;
    }
    _t(function() {
      var x = i, _ = Wn(n), E = [];
      e: {
        var C = ea.get(e);
        if (C !== void 0) {
          var A = To, V = e;
          switch (e) {
            case "keypress":
              if (xl(n) === 0) break e;
            case "keydown":
            case "keyup":
              A = Rc;
              break;
            case "focusin":
              V = "focus", A = Ro;
              break;
            case "focusout":
              V = "blur", A = Ro;
              break;
            case "beforeblur":
            case "afterblur":
              A = Ro;
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
              A = Ls;
              break;
            case "drag":
            case "dragend":
            case "dragenter":
            case "dragexit":
            case "dragleave":
            case "dragover":
            case "dragstart":
            case "drop":
              A = jc;
              break;
            case "touchcancel":
            case "touchend":
            case "touchmove":
            case "touchstart":
              A = Oc;
              break;
            case Xs:
            case Js:
            case Zs:
              A = Sc;
              break;
            case bs:
              A = Ac;
              break;
            case "scroll":
              A = yc;
              break;
            case "wheel":
              A = Uc;
              break;
            case "copy":
            case "cut":
            case "paste":
              A = _c;
              break;
            case "gotpointercapture":
            case "lostpointercapture":
            case "pointercancel":
            case "pointerdown":
            case "pointermove":
            case "pointerout":
            case "pointerover":
            case "pointerup":
              A = Rs;
          }
          var H = (t & 4) !== 0, ze = !H && e === "scroll", h = H ? C !== null ? C + "Capture" : null : C;
          H = [];
          for (var f = x, g; f !== null; ) {
            g = f;
            var L = g.stateNode;
            if (g.tag === 5 && L !== null && (g = L, h !== null && (L = Et(f, h), L != null && H.push(Ar(f, L, g)))), ze) break;
            f = f.return;
          }
          0 < H.length && (C = new A(C, V, null, n, _), E.push({ event: C, listeners: H }));
        }
      }
      if ((t & 7) === 0) {
        e: {
          if (C = e === "mouseover" || e === "pointerover", A = e === "mouseout" || e === "pointerout", C && n !== Hn && (V = n.relatedTarget || n.fromElement) && (En(V) || V[Ht])) break e;
          if ((A || C) && (C = _.window === _ ? _ : (C = _.ownerDocument) ? C.defaultView || C.parentWindow : window, A ? (V = n.relatedTarget || n.toElement, A = x, V = V ? En(V) : null, V !== null && (ze = _n(V), V !== ze || V.tag !== 5 && V.tag !== 6) && (V = null)) : (A = null, V = x), A !== V)) {
            if (H = Ls, L = "onMouseLeave", h = "onMouseEnter", f = "mouse", (e === "pointerout" || e === "pointerover") && (H = Rs, L = "onPointerLeave", h = "onPointerEnter", f = "pointer"), ze = A == null ? C : tr(A), g = V == null ? C : tr(V), C = new H(L, f + "leave", A, n, _), C.target = ze, C.relatedTarget = g, L = null, En(_) === x && (H = new H(h, f + "enter", V, n, _), H.target = g, H.relatedTarget = ze, L = H), ze = L, A && V) t: {
              for (H = A, h = V, f = 0, g = H; g; g = bn(g)) f++;
              for (g = 0, L = h; L; L = bn(L)) g++;
              for (; 0 < f - g; ) H = bn(H), f--;
              for (; 0 < g - f; ) h = bn(h), g--;
              for (; f--; ) {
                if (H === h || h !== null && H === h.alternate) break t;
                H = bn(H), h = bn(h);
              }
              H = null;
            }
            else H = null;
            A !== null && oa(E, C, A, H, !1), V !== null && ze !== null && oa(E, ze, V, H, !0);
          }
        }
        e: {
          if (C = x ? tr(x) : window, A = C.nodeName && C.nodeName.toLowerCase(), A === "select" || A === "input" && C.type === "file") var W = Kc;
          else if (Is(C)) if ($s) W = Xc;
          else {
            W = qc;
            var q = Gc;
          }
          else (A = C.nodeName) && A.toLowerCase() === "input" && (C.type === "checkbox" || C.type === "radio") && (W = Yc);
          if (W && (W = W(e, x))) {
            Us(E, W, n, _);
            break e;
          }
          q && q(e, C, x), e === "focusout" && (q = C._wrapperState) && q.controlled && C.type === "number" && ye(C, "number", C.value);
        }
        switch (q = x ? tr(x) : window, e) {
          case "focusin":
            (Is(q) || q.contentEditable === "true") && (Jn = q, Io = x, Dr = null);
            break;
          case "focusout":
            Dr = Io = Jn = null;
            break;
          case "mousedown":
            Uo = !0;
            break;
          case "contextmenu":
          case "mouseup":
          case "dragend":
            Uo = !1, qs(E, n, _);
            break;
          case "selectionchange":
            if (bc) break;
          case "keydown":
          case "keyup":
            qs(E, n, _);
        }
        var Y;
        if (Do) e: {
          switch (e) {
            case "compositionstart":
              var J = "onCompositionStart";
              break e;
            case "compositionend":
              J = "onCompositionEnd";
              break e;
            case "compositionupdate":
              J = "onCompositionUpdate";
              break e;
          }
          J = void 0;
        }
        else Xn ? Fs(e, n) && (J = "onCompositionEnd") : e === "keydown" && n.keyCode === 229 && (J = "onCompositionStart");
        J && (Ms && n.locale !== "ko" && (Xn || J !== "onCompositionStart" ? J === "onCompositionEnd" && Xn && (Y = Ps()) : (an = _, Po = "value" in an ? an.value : an.textContent, Xn = !0)), q = El(x, J), 0 < q.length && (J = new zs(J, e, null, n, _), E.push({ event: J, listeners: q }), Y ? J.data = Y : (Y = As(n), Y !== null && (J.data = Y)))), (Y = Vc ? Bc(e, n) : Hc(e, n)) && (x = El(x, "onBeforeInput"), 0 < x.length && (_ = new zs("onBeforeInput", "beforeinput", null, n, _), E.push({ event: _, listeners: x }), _.data = Y));
      }
      ra(E, t);
    });
  }
  function Ar(e, t, n) {
    return { instance: e, listener: t, currentTarget: n };
  }
  function El(e, t) {
    for (var n = t + "Capture", r = []; e !== null; ) {
      var l = e, i = l.stateNode;
      l.tag === 5 && i !== null && (l = i, i = Et(e, n), i != null && r.unshift(Ar(e, i, l)), i = Et(e, t), i != null && r.push(Ar(e, i, l))), e = e.return;
    }
    return r;
  }
  function bn(e) {
    if (e === null) return null;
    do
      e = e.return;
    while (e && e.tag !== 5);
    return e || null;
  }
  function oa(e, t, n, r, l) {
    for (var i = t._reactName, s = []; n !== null && n !== r; ) {
      var u = n, c = u.alternate, x = u.stateNode;
      if (c !== null && c === r) break;
      u.tag === 5 && x !== null && (u = x, l ? (c = Et(n, i), c != null && s.unshift(Ar(n, c, u))) : l || (c = Et(n, i), c != null && s.push(Ar(n, c, u)))), n = n.return;
    }
    s.length !== 0 && e.push({ event: t, listeners: s });
  }
  var rd = /\r\n?/g, ld = /\u0000|\uFFFD/g;
  function ia(e) {
    return (typeof e == "string" ? e : "" + e).replace(rd, `
`).replace(ld, "");
  }
  function Nl(e, t, n) {
    if (t = ia(t), ia(e) !== t && n) throw Error(d(425));
  }
  function Pl() {
  }
  var Qo = null, Ko = null;
  function Go(e, t) {
    return e === "textarea" || e === "noscript" || typeof t.children == "string" || typeof t.children == "number" || typeof t.dangerouslySetInnerHTML == "object" && t.dangerouslySetInnerHTML !== null && t.dangerouslySetInnerHTML.__html != null;
  }
  var qo = typeof setTimeout == "function" ? setTimeout : void 0, od = typeof clearTimeout == "function" ? clearTimeout : void 0, sa = typeof Promise == "function" ? Promise : void 0, id = typeof queueMicrotask == "function" ? queueMicrotask : typeof sa < "u" ? function(e) {
    return sa.resolve(null).then(e).catch(sd);
  } : qo;
  function sd(e) {
    setTimeout(function() {
      throw e;
    });
  }
  function Yo(e, t) {
    var n = t, r = 0;
    do {
      var l = n.nextSibling;
      if (e.removeChild(n), l && l.nodeType === 8) if (n = l.data, n === "/$") {
        if (r === 0) {
          e.removeChild(l), Nr(t);
          return;
        }
        r--;
      } else n !== "$" && n !== "$?" && n !== "$!" || r++;
      n = l;
    } while (n);
    Nr(t);
  }
  function cn(e) {
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
  function aa(e) {
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
  var er = Math.random().toString(36).slice(2), Ot = "__reactFiber$" + er, Ir = "__reactProps$" + er, Ht = "__reactContainer$" + er, Xo = "__reactEvents$" + er, ad = "__reactListeners$" + er, ud = "__reactHandles$" + er;
  function En(e) {
    var t = e[Ot];
    if (t) return t;
    for (var n = e.parentNode; n; ) {
      if (t = n[Ht] || n[Ot]) {
        if (n = t.alternate, t.child !== null || n !== null && n.child !== null) for (e = aa(e); e !== null; ) {
          if (n = e[Ot]) return n;
          e = aa(e);
        }
        return t;
      }
      e = n, n = e.parentNode;
    }
    return null;
  }
  function Ur(e) {
    return e = e[Ot] || e[Ht], !e || e.tag !== 5 && e.tag !== 6 && e.tag !== 13 && e.tag !== 3 ? null : e;
  }
  function tr(e) {
    if (e.tag === 5 || e.tag === 6) return e.stateNode;
    throw Error(d(33));
  }
  function Tl(e) {
    return e[Ir] || null;
  }
  var Jo = [], nr = -1;
  function dn(e) {
    return { current: e };
  }
  function we(e) {
    0 > nr || (e.current = Jo[nr], Jo[nr] = null, nr--);
  }
  function xe(e, t) {
    nr++, Jo[nr] = e.current, e.current = t;
  }
  var fn = {}, Ge = dn(fn), lt = dn(!1), Nn = fn;
  function rr(e, t) {
    var n = e.type.contextTypes;
    if (!n) return fn;
    var r = e.stateNode;
    if (r && r.__reactInternalMemoizedUnmaskedChildContext === t) return r.__reactInternalMemoizedMaskedChildContext;
    var l = {}, i;
    for (i in n) l[i] = t[i];
    return r && (e = e.stateNode, e.__reactInternalMemoizedUnmaskedChildContext = t, e.__reactInternalMemoizedMaskedChildContext = l), l;
  }
  function ot(e) {
    return e = e.childContextTypes, e != null;
  }
  function Ll() {
    we(lt), we(Ge);
  }
  function ua(e, t, n) {
    if (Ge.current !== fn) throw Error(d(168));
    xe(Ge, t), xe(lt, n);
  }
  function ca(e, t, n) {
    var r = e.stateNode;
    if (t = t.childContextTypes, typeof r.getChildContext != "function") return n;
    r = r.getChildContext();
    for (var l in r) if (!(l in t)) throw Error(d(108, me(e) || "Unknown", l));
    return I({}, n, r);
  }
  function zl(e) {
    return e = (e = e.stateNode) && e.__reactInternalMemoizedMergedChildContext || fn, Nn = Ge.current, xe(Ge, e), xe(lt, lt.current), !0;
  }
  function da(e, t, n) {
    var r = e.stateNode;
    if (!r) throw Error(d(169));
    n ? (e = ca(e, t, Nn), r.__reactInternalMemoizedMergedChildContext = e, we(lt), we(Ge), xe(Ge, e)) : we(lt), xe(lt, n);
  }
  var Wt = null, Rl = !1, Zo = !1;
  function fa(e) {
    Wt === null ? Wt = [e] : Wt.push(e);
  }
  function cd(e) {
    Rl = !0, fa(e);
  }
  function pn() {
    if (!Zo && Wt !== null) {
      Zo = !0;
      var e = 0, t = ve;
      try {
        var n = Wt;
        for (ve = 1; e < n.length; e++) {
          var r = n[e];
          do
            r = r(!0);
          while (r !== null);
        }
        Wt = null, Rl = !1;
      } catch (l) {
        throw Wt !== null && (Wt = Wt.slice(e + 1)), ms(jo, pn), l;
      } finally {
        ve = t, Zo = !1;
      }
    }
    return null;
  }
  var lr = [], or = 0, Ml = null, Dl = 0, xt = [], jt = 0, Pn = null, Qt = 1, Kt = "";
  function Tn(e, t) {
    lr[or++] = Dl, lr[or++] = Ml, Ml = e, Dl = t;
  }
  function pa(e, t, n) {
    xt[jt++] = Qt, xt[jt++] = Kt, xt[jt++] = Pn, Pn = e;
    var r = Qt;
    e = Kt;
    var l = 32 - Nt(r) - 1;
    r &= ~(1 << l), n += 1;
    var i = 32 - Nt(t) + l;
    if (30 < i) {
      var s = l - l % 5;
      i = (r & (1 << s) - 1).toString(32), r >>= s, l -= s, Qt = 1 << 32 - Nt(t) + l | n << l | r, Kt = i + e;
    } else Qt = 1 << i | n << l | r, Kt = e;
  }
  function bo(e) {
    e.return !== null && (Tn(e, 1), pa(e, 1, 0));
  }
  function ei(e) {
    for (; e === Ml; ) Ml = lr[--or], lr[or] = null, Dl = lr[--or], lr[or] = null;
    for (; e === Pn; ) Pn = xt[--jt], xt[jt] = null, Kt = xt[--jt], xt[jt] = null, Qt = xt[--jt], xt[jt] = null;
  }
  var ht = null, vt = null, Se = !1, Tt = null;
  function ma(e, t) {
    var n = Ct(5, null, null, 0);
    n.elementType = "DELETED", n.stateNode = t, n.return = e, t = e.deletions, t === null ? (e.deletions = [n], e.flags |= 16) : t.push(n);
  }
  function ha(e, t) {
    switch (e.tag) {
      case 5:
        var n = e.type;
        return t = t.nodeType !== 1 || n.toLowerCase() !== t.nodeName.toLowerCase() ? null : t, t !== null ? (e.stateNode = t, ht = e, vt = cn(t.firstChild), !0) : !1;
      case 6:
        return t = e.pendingProps === "" || t.nodeType !== 3 ? null : t, t !== null ? (e.stateNode = t, ht = e, vt = null, !0) : !1;
      case 13:
        return t = t.nodeType !== 8 ? null : t, t !== null ? (n = Pn !== null ? { id: Qt, overflow: Kt } : null, e.memoizedState = { dehydrated: t, treeContext: n, retryLane: 1073741824 }, n = Ct(18, null, null, 0), n.stateNode = t, n.return = e, e.child = n, ht = e, vt = null, !0) : !1;
      default:
        return !1;
    }
  }
  function ti(e) {
    return (e.mode & 1) !== 0 && (e.flags & 128) === 0;
  }
  function ni(e) {
    if (Se) {
      var t = vt;
      if (t) {
        var n = t;
        if (!ha(e, t)) {
          if (ti(e)) throw Error(d(418));
          t = cn(n.nextSibling);
          var r = ht;
          t && ha(e, t) ? ma(r, n) : (e.flags = e.flags & -4097 | 2, Se = !1, ht = e);
        }
      } else {
        if (ti(e)) throw Error(d(418));
        e.flags = e.flags & -4097 | 2, Se = !1, ht = e;
      }
    }
  }
  function va(e) {
    for (e = e.return; e !== null && e.tag !== 5 && e.tag !== 3 && e.tag !== 13; ) e = e.return;
    ht = e;
  }
  function Ol(e) {
    if (e !== ht) return !1;
    if (!Se) return va(e), Se = !0, !1;
    var t;
    if ((t = e.tag !== 3) && !(t = e.tag !== 5) && (t = e.type, t = t !== "head" && t !== "body" && !Go(e.type, e.memoizedProps)), t && (t = vt)) {
      if (ti(e)) throw ga(), Error(d(418));
      for (; t; ) ma(e, t), t = cn(t.nextSibling);
    }
    if (va(e), e.tag === 13) {
      if (e = e.memoizedState, e = e !== null ? e.dehydrated : null, !e) throw Error(d(317));
      e: {
        for (e = e.nextSibling, t = 0; e; ) {
          if (e.nodeType === 8) {
            var n = e.data;
            if (n === "/$") {
              if (t === 0) {
                vt = cn(e.nextSibling);
                break e;
              }
              t--;
            } else n !== "$" && n !== "$!" && n !== "$?" || t++;
          }
          e = e.nextSibling;
        }
        vt = null;
      }
    } else vt = ht ? cn(e.stateNode.nextSibling) : null;
    return !0;
  }
  function ga() {
    for (var e = vt; e; ) e = cn(e.nextSibling);
  }
  function ir() {
    vt = ht = null, Se = !1;
  }
  function ri(e) {
    Tt === null ? Tt = [e] : Tt.push(e);
  }
  var dd = pe.ReactCurrentBatchConfig;
  function $r(e, t, n) {
    if (e = n.ref, e !== null && typeof e != "function" && typeof e != "object") {
      if (n._owner) {
        if (n = n._owner, n) {
          if (n.tag !== 1) throw Error(d(309));
          var r = n.stateNode;
        }
        if (!r) throw Error(d(147, e));
        var l = r, i = "" + e;
        return t !== null && t.ref !== null && typeof t.ref == "function" && t.ref._stringRef === i ? t.ref : (t = function(s) {
          var u = l.refs;
          s === null ? delete u[i] : u[i] = s;
        }, t._stringRef = i, t);
      }
      if (typeof e != "string") throw Error(d(284));
      if (!n._owner) throw Error(d(290, e));
    }
    return e;
  }
  function Fl(e, t) {
    throw e = Object.prototype.toString.call(t), Error(d(31, e === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : e));
  }
  function ya(e) {
    var t = e._init;
    return t(e._payload);
  }
  function xa(e) {
    function t(h, f) {
      if (e) {
        var g = h.deletions;
        g === null ? (h.deletions = [f], h.flags |= 16) : g.push(f);
      }
    }
    function n(h, f) {
      if (!e) return null;
      for (; f !== null; ) t(h, f), f = f.sibling;
      return null;
    }
    function r(h, f) {
      for (h = /* @__PURE__ */ new Map(); f !== null; ) f.key !== null ? h.set(f.key, f) : h.set(f.index, f), f = f.sibling;
      return h;
    }
    function l(h, f) {
      return h = wn(h, f), h.index = 0, h.sibling = null, h;
    }
    function i(h, f, g) {
      return h.index = g, e ? (g = h.alternate, g !== null ? (g = g.index, g < f ? (h.flags |= 2, f) : g) : (h.flags |= 2, f)) : (h.flags |= 1048576, f);
    }
    function s(h) {
      return e && h.alternate === null && (h.flags |= 2), h;
    }
    function u(h, f, g, L) {
      return f === null || f.tag !== 6 ? (f = qi(g, h.mode, L), f.return = h, f) : (f = l(f, g), f.return = h, f);
    }
    function c(h, f, g, L) {
      var W = g.type;
      return W === Ke ? _(h, f, g.props.children, L, g.key) : f !== null && (f.elementType === W || typeof W == "object" && W !== null && W.$$typeof === Ve && ya(W) === f.type) ? (L = l(f, g.props), L.ref = $r(h, f, g), L.return = h, L) : (L = io(g.type, g.key, g.props, null, h.mode, L), L.ref = $r(h, f, g), L.return = h, L);
    }
    function x(h, f, g, L) {
      return f === null || f.tag !== 4 || f.stateNode.containerInfo !== g.containerInfo || f.stateNode.implementation !== g.implementation ? (f = Yi(g, h.mode, L), f.return = h, f) : (f = l(f, g.children || []), f.return = h, f);
    }
    function _(h, f, g, L, W) {
      return f === null || f.tag !== 7 ? (f = An(g, h.mode, L, W), f.return = h, f) : (f = l(f, g), f.return = h, f);
    }
    function E(h, f, g) {
      if (typeof f == "string" && f !== "" || typeof f == "number") return f = qi("" + f, h.mode, g), f.return = h, f;
      if (typeof f == "object" && f !== null) {
        switch (f.$$typeof) {
          case Ue:
            return g = io(f.type, f.key, f.props, null, h.mode, g), g.ref = $r(h, null, f), g.return = h, g;
          case $e:
            return f = Yi(f, h.mode, g), f.return = h, f;
          case Ve:
            var L = f._init;
            return E(h, L(f._payload), g);
        }
        if (Ut(f) || G(f)) return f = An(f, h.mode, g, null), f.return = h, f;
        Fl(h, f);
      }
      return null;
    }
    function C(h, f, g, L) {
      var W = f !== null ? f.key : null;
      if (typeof g == "string" && g !== "" || typeof g == "number") return W !== null ? null : u(h, f, "" + g, L);
      if (typeof g == "object" && g !== null) {
        switch (g.$$typeof) {
          case Ue:
            return g.key === W ? c(h, f, g, L) : null;
          case $e:
            return g.key === W ? x(h, f, g, L) : null;
          case Ve:
            return W = g._init, C(
              h,
              f,
              W(g._payload),
              L
            );
        }
        if (Ut(g) || G(g)) return W !== null ? null : _(h, f, g, L, null);
        Fl(h, g);
      }
      return null;
    }
    function A(h, f, g, L, W) {
      if (typeof L == "string" && L !== "" || typeof L == "number") return h = h.get(g) || null, u(f, h, "" + L, W);
      if (typeof L == "object" && L !== null) {
        switch (L.$$typeof) {
          case Ue:
            return h = h.get(L.key === null ? g : L.key) || null, c(f, h, L, W);
          case $e:
            return h = h.get(L.key === null ? g : L.key) || null, x(f, h, L, W);
          case Ve:
            var q = L._init;
            return A(h, f, g, q(L._payload), W);
        }
        if (Ut(L) || G(L)) return h = h.get(g) || null, _(f, h, L, W, null);
        Fl(f, L);
      }
      return null;
    }
    function V(h, f, g, L) {
      for (var W = null, q = null, Y = f, J = f = 0, Ie = null; Y !== null && J < g.length; J++) {
        Y.index > J ? (Ie = Y, Y = null) : Ie = Y.sibling;
        var fe = C(h, Y, g[J], L);
        if (fe === null) {
          Y === null && (Y = Ie);
          break;
        }
        e && Y && fe.alternate === null && t(h, Y), f = i(fe, f, J), q === null ? W = fe : q.sibling = fe, q = fe, Y = Ie;
      }
      if (J === g.length) return n(h, Y), Se && Tn(h, J), W;
      if (Y === null) {
        for (; J < g.length; J++) Y = E(h, g[J], L), Y !== null && (f = i(Y, f, J), q === null ? W = Y : q.sibling = Y, q = Y);
        return Se && Tn(h, J), W;
      }
      for (Y = r(h, Y); J < g.length; J++) Ie = A(Y, h, J, g[J], L), Ie !== null && (e && Ie.alternate !== null && Y.delete(Ie.key === null ? J : Ie.key), f = i(Ie, f, J), q === null ? W = Ie : q.sibling = Ie, q = Ie);
      return e && Y.forEach(function(kn) {
        return t(h, kn);
      }), Se && Tn(h, J), W;
    }
    function H(h, f, g, L) {
      var W = G(g);
      if (typeof W != "function") throw Error(d(150));
      if (g = W.call(g), g == null) throw Error(d(151));
      for (var q = W = null, Y = f, J = f = 0, Ie = null, fe = g.next(); Y !== null && !fe.done; J++, fe = g.next()) {
        Y.index > J ? (Ie = Y, Y = null) : Ie = Y.sibling;
        var kn = C(h, Y, fe.value, L);
        if (kn === null) {
          Y === null && (Y = Ie);
          break;
        }
        e && Y && kn.alternate === null && t(h, Y), f = i(kn, f, J), q === null ? W = kn : q.sibling = kn, q = kn, Y = Ie;
      }
      if (fe.done) return n(
        h,
        Y
      ), Se && Tn(h, J), W;
      if (Y === null) {
        for (; !fe.done; J++, fe = g.next()) fe = E(h, fe.value, L), fe !== null && (f = i(fe, f, J), q === null ? W = fe : q.sibling = fe, q = fe);
        return Se && Tn(h, J), W;
      }
      for (Y = r(h, Y); !fe.done; J++, fe = g.next()) fe = A(Y, h, J, fe.value, L), fe !== null && (e && fe.alternate !== null && Y.delete(fe.key === null ? J : fe.key), f = i(fe, f, J), q === null ? W = fe : q.sibling = fe, q = fe);
      return e && Y.forEach(function(Wd) {
        return t(h, Wd);
      }), Se && Tn(h, J), W;
    }
    function ze(h, f, g, L) {
      if (typeof g == "object" && g !== null && g.type === Ke && g.key === null && (g = g.props.children), typeof g == "object" && g !== null) {
        switch (g.$$typeof) {
          case Ue:
            e: {
              for (var W = g.key, q = f; q !== null; ) {
                if (q.key === W) {
                  if (W = g.type, W === Ke) {
                    if (q.tag === 7) {
                      n(h, q.sibling), f = l(q, g.props.children), f.return = h, h = f;
                      break e;
                    }
                  } else if (q.elementType === W || typeof W == "object" && W !== null && W.$$typeof === Ve && ya(W) === q.type) {
                    n(h, q.sibling), f = l(q, g.props), f.ref = $r(h, q, g), f.return = h, h = f;
                    break e;
                  }
                  n(h, q);
                  break;
                } else t(h, q);
                q = q.sibling;
              }
              g.type === Ke ? (f = An(g.props.children, h.mode, L, g.key), f.return = h, h = f) : (L = io(g.type, g.key, g.props, null, h.mode, L), L.ref = $r(h, f, g), L.return = h, h = L);
            }
            return s(h);
          case $e:
            e: {
              for (q = g.key; f !== null; ) {
                if (f.key === q) if (f.tag === 4 && f.stateNode.containerInfo === g.containerInfo && f.stateNode.implementation === g.implementation) {
                  n(h, f.sibling), f = l(f, g.children || []), f.return = h, h = f;
                  break e;
                } else {
                  n(h, f);
                  break;
                }
                else t(h, f);
                f = f.sibling;
              }
              f = Yi(g, h.mode, L), f.return = h, h = f;
            }
            return s(h);
          case Ve:
            return q = g._init, ze(h, f, q(g._payload), L);
        }
        if (Ut(g)) return V(h, f, g, L);
        if (G(g)) return H(h, f, g, L);
        Fl(h, g);
      }
      return typeof g == "string" && g !== "" || typeof g == "number" ? (g = "" + g, f !== null && f.tag === 6 ? (n(h, f.sibling), f = l(f, g), f.return = h, h = f) : (n(h, f), f = qi(g, h.mode, L), f.return = h, h = f), s(h)) : n(h, f);
    }
    return ze;
  }
  var sr = xa(!0), ja = xa(!1), Al = dn(null), Il = null, ar = null, li = null;
  function oi() {
    li = ar = Il = null;
  }
  function ii(e) {
    var t = Al.current;
    we(Al), e._currentValue = t;
  }
  function si(e, t, n) {
    for (; e !== null; ) {
      var r = e.alternate;
      if ((e.childLanes & t) !== t ? (e.childLanes |= t, r !== null && (r.childLanes |= t)) : r !== null && (r.childLanes & t) !== t && (r.childLanes |= t), e === n) break;
      e = e.return;
    }
  }
  function ur(e, t) {
    Il = e, li = ar = null, e = e.dependencies, e !== null && e.firstContext !== null && ((e.lanes & t) !== 0 && (it = !0), e.firstContext = null);
  }
  function wt(e) {
    var t = e._currentValue;
    if (li !== e) if (e = { context: e, memoizedValue: t, next: null }, ar === null) {
      if (Il === null) throw Error(d(308));
      ar = e, Il.dependencies = { lanes: 0, firstContext: e };
    } else ar = ar.next = e;
    return t;
  }
  var Ln = null;
  function ai(e) {
    Ln === null ? Ln = [e] : Ln.push(e);
  }
  function wa(e, t, n, r) {
    var l = t.interleaved;
    return l === null ? (n.next = n, ai(t)) : (n.next = l.next, l.next = n), t.interleaved = n, Gt(e, r);
  }
  function Gt(e, t) {
    e.lanes |= t;
    var n = e.alternate;
    for (n !== null && (n.lanes |= t), n = e, e = e.return; e !== null; ) e.childLanes |= t, n = e.alternate, n !== null && (n.childLanes |= t), n = e, e = e.return;
    return n.tag === 3 ? n.stateNode : null;
  }
  var mn = !1;
  function ui(e) {
    e.updateQueue = { baseState: e.memoizedState, firstBaseUpdate: null, lastBaseUpdate: null, shared: { pending: null, interleaved: null, lanes: 0 }, effects: null };
  }
  function ka(e, t) {
    e = e.updateQueue, t.updateQueue === e && (t.updateQueue = { baseState: e.baseState, firstBaseUpdate: e.firstBaseUpdate, lastBaseUpdate: e.lastBaseUpdate, shared: e.shared, effects: e.effects });
  }
  function qt(e, t) {
    return { eventTime: e, lane: t, tag: 0, payload: null, callback: null, next: null };
  }
  function hn(e, t, n) {
    var r = e.updateQueue;
    if (r === null) return null;
    if (r = r.shared, (ce & 2) !== 0) {
      var l = r.pending;
      return l === null ? t.next = t : (t.next = l.next, l.next = t), r.pending = t, Gt(e, n);
    }
    return l = r.interleaved, l === null ? (t.next = t, ai(r)) : (t.next = l.next, l.next = t), r.interleaved = t, Gt(e, n);
  }
  function Ul(e, t, n) {
    if (t = t.updateQueue, t !== null && (t = t.shared, (n & 4194240) !== 0)) {
      var r = t.lanes;
      r &= e.pendingLanes, n |= r, t.lanes = n, So(e, n);
    }
  }
  function Sa(e, t) {
    var n = e.updateQueue, r = e.alternate;
    if (r !== null && (r = r.updateQueue, n === r)) {
      var l = null, i = null;
      if (n = n.firstBaseUpdate, n !== null) {
        do {
          var s = { eventTime: n.eventTime, lane: n.lane, tag: n.tag, payload: n.payload, callback: n.callback, next: null };
          i === null ? l = i = s : i = i.next = s, n = n.next;
        } while (n !== null);
        i === null ? l = i = t : i = i.next = t;
      } else l = i = t;
      n = { baseState: r.baseState, firstBaseUpdate: l, lastBaseUpdate: i, shared: r.shared, effects: r.effects }, e.updateQueue = n;
      return;
    }
    e = n.lastBaseUpdate, e === null ? n.firstBaseUpdate = t : e.next = t, n.lastBaseUpdate = t;
  }
  function $l(e, t, n, r) {
    var l = e.updateQueue;
    mn = !1;
    var i = l.firstBaseUpdate, s = l.lastBaseUpdate, u = l.shared.pending;
    if (u !== null) {
      l.shared.pending = null;
      var c = u, x = c.next;
      c.next = null, s === null ? i = x : s.next = x, s = c;
      var _ = e.alternate;
      _ !== null && (_ = _.updateQueue, u = _.lastBaseUpdate, u !== s && (u === null ? _.firstBaseUpdate = x : u.next = x, _.lastBaseUpdate = c));
    }
    if (i !== null) {
      var E = l.baseState;
      s = 0, _ = x = c = null, u = i;
      do {
        var C = u.lane, A = u.eventTime;
        if ((r & C) === C) {
          _ !== null && (_ = _.next = {
            eventTime: A,
            lane: 0,
            tag: u.tag,
            payload: u.payload,
            callback: u.callback,
            next: null
          });
          e: {
            var V = e, H = u;
            switch (C = t, A = n, H.tag) {
              case 1:
                if (V = H.payload, typeof V == "function") {
                  E = V.call(A, E, C);
                  break e;
                }
                E = V;
                break e;
              case 3:
                V.flags = V.flags & -65537 | 128;
              case 0:
                if (V = H.payload, C = typeof V == "function" ? V.call(A, E, C) : V, C == null) break e;
                E = I({}, E, C);
                break e;
              case 2:
                mn = !0;
            }
          }
          u.callback !== null && u.lane !== 0 && (e.flags |= 64, C = l.effects, C === null ? l.effects = [u] : C.push(u));
        } else A = { eventTime: A, lane: C, tag: u.tag, payload: u.payload, callback: u.callback, next: null }, _ === null ? (x = _ = A, c = E) : _ = _.next = A, s |= C;
        if (u = u.next, u === null) {
          if (u = l.shared.pending, u === null) break;
          C = u, u = C.next, C.next = null, l.lastBaseUpdate = C, l.shared.pending = null;
        }
      } while (!0);
      if (_ === null && (c = E), l.baseState = c, l.firstBaseUpdate = x, l.lastBaseUpdate = _, t = l.shared.interleaved, t !== null) {
        l = t;
        do
          s |= l.lane, l = l.next;
        while (l !== t);
      } else i === null && (l.shared.lanes = 0);
      Mn |= s, e.lanes = s, e.memoizedState = E;
    }
  }
  function Ca(e, t, n) {
    if (e = t.effects, t.effects = null, e !== null) for (t = 0; t < e.length; t++) {
      var r = e[t], l = r.callback;
      if (l !== null) {
        if (r.callback = null, r = n, typeof l != "function") throw Error(d(191, l));
        l.call(r);
      }
    }
  }
  var Vr = {}, Ft = dn(Vr), Br = dn(Vr), Hr = dn(Vr);
  function zn(e) {
    if (e === Vr) throw Error(d(174));
    return e;
  }
  function ci(e, t) {
    switch (xe(Hr, t), xe(Br, e), xe(Ft, Vr), e = t.nodeType, e) {
      case 9:
      case 11:
        t = (t = t.documentElement) ? t.namespaceURI : Cn(null, "");
        break;
      default:
        e = e === 8 ? t.parentNode : t, t = e.namespaceURI || null, e = e.tagName, t = Cn(t, e);
    }
    we(Ft), xe(Ft, t);
  }
  function cr() {
    we(Ft), we(Br), we(Hr);
  }
  function _a(e) {
    zn(Hr.current);
    var t = zn(Ft.current), n = Cn(t, e.type);
    t !== n && (xe(Br, e), xe(Ft, n));
  }
  function di(e) {
    Br.current === e && (we(Ft), we(Br));
  }
  var Ce = dn(0);
  function Vl(e) {
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
  var fi = [];
  function pi() {
    for (var e = 0; e < fi.length; e++) fi[e]._workInProgressVersionPrimary = null;
    fi.length = 0;
  }
  var Bl = pe.ReactCurrentDispatcher, mi = pe.ReactCurrentBatchConfig, Rn = 0, _e = null, De = null, Fe = null, Hl = !1, Wr = !1, Qr = 0, fd = 0;
  function qe() {
    throw Error(d(321));
  }
  function hi(e, t) {
    if (t === null) return !1;
    for (var n = 0; n < t.length && n < e.length; n++) if (!Pt(e[n], t[n])) return !1;
    return !0;
  }
  function vi(e, t, n, r, l, i) {
    if (Rn = i, _e = t, t.memoizedState = null, t.updateQueue = null, t.lanes = 0, Bl.current = e === null || e.memoizedState === null ? vd : gd, e = n(r, l), Wr) {
      i = 0;
      do {
        if (Wr = !1, Qr = 0, 25 <= i) throw Error(d(301));
        i += 1, Fe = De = null, t.updateQueue = null, Bl.current = yd, e = n(r, l);
      } while (Wr);
    }
    if (Bl.current = Kl, t = De !== null && De.next !== null, Rn = 0, Fe = De = _e = null, Hl = !1, t) throw Error(d(300));
    return e;
  }
  function gi() {
    var e = Qr !== 0;
    return Qr = 0, e;
  }
  function At() {
    var e = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
    return Fe === null ? _e.memoizedState = Fe = e : Fe = Fe.next = e, Fe;
  }
  function kt() {
    if (De === null) {
      var e = _e.alternate;
      e = e !== null ? e.memoizedState : null;
    } else e = De.next;
    var t = Fe === null ? _e.memoizedState : Fe.next;
    if (t !== null) Fe = t, De = e;
    else {
      if (e === null) throw Error(d(310));
      De = e, e = { memoizedState: De.memoizedState, baseState: De.baseState, baseQueue: De.baseQueue, queue: De.queue, next: null }, Fe === null ? _e.memoizedState = Fe = e : Fe = Fe.next = e;
    }
    return Fe;
  }
  function Kr(e, t) {
    return typeof t == "function" ? t(e) : t;
  }
  function yi(e) {
    var t = kt(), n = t.queue;
    if (n === null) throw Error(d(311));
    n.lastRenderedReducer = e;
    var r = De, l = r.baseQueue, i = n.pending;
    if (i !== null) {
      if (l !== null) {
        var s = l.next;
        l.next = i.next, i.next = s;
      }
      r.baseQueue = l = i, n.pending = null;
    }
    if (l !== null) {
      i = l.next, r = r.baseState;
      var u = s = null, c = null, x = i;
      do {
        var _ = x.lane;
        if ((Rn & _) === _) c !== null && (c = c.next = { lane: 0, action: x.action, hasEagerState: x.hasEagerState, eagerState: x.eagerState, next: null }), r = x.hasEagerState ? x.eagerState : e(r, x.action);
        else {
          var E = {
            lane: _,
            action: x.action,
            hasEagerState: x.hasEagerState,
            eagerState: x.eagerState,
            next: null
          };
          c === null ? (u = c = E, s = r) : c = c.next = E, _e.lanes |= _, Mn |= _;
        }
        x = x.next;
      } while (x !== null && x !== i);
      c === null ? s = r : c.next = u, Pt(r, t.memoizedState) || (it = !0), t.memoizedState = r, t.baseState = s, t.baseQueue = c, n.lastRenderedState = r;
    }
    if (e = n.interleaved, e !== null) {
      l = e;
      do
        i = l.lane, _e.lanes |= i, Mn |= i, l = l.next;
      while (l !== e);
    } else l === null && (n.lanes = 0);
    return [t.memoizedState, n.dispatch];
  }
  function xi(e) {
    var t = kt(), n = t.queue;
    if (n === null) throw Error(d(311));
    n.lastRenderedReducer = e;
    var r = n.dispatch, l = n.pending, i = t.memoizedState;
    if (l !== null) {
      n.pending = null;
      var s = l = l.next;
      do
        i = e(i, s.action), s = s.next;
      while (s !== l);
      Pt(i, t.memoizedState) || (it = !0), t.memoizedState = i, t.baseQueue === null && (t.baseState = i), n.lastRenderedState = i;
    }
    return [i, r];
  }
  function Ea() {
  }
  function Na(e, t) {
    var n = _e, r = kt(), l = t(), i = !Pt(r.memoizedState, l);
    if (i && (r.memoizedState = l, it = !0), r = r.queue, ji(La.bind(null, n, r, e), [e]), r.getSnapshot !== t || i || Fe !== null && Fe.memoizedState.tag & 1) {
      if (n.flags |= 2048, Gr(9, Ta.bind(null, n, r, l, t), void 0, null), Ae === null) throw Error(d(349));
      (Rn & 30) !== 0 || Pa(n, t, l);
    }
    return l;
  }
  function Pa(e, t, n) {
    e.flags |= 16384, e = { getSnapshot: t, value: n }, t = _e.updateQueue, t === null ? (t = { lastEffect: null, stores: null }, _e.updateQueue = t, t.stores = [e]) : (n = t.stores, n === null ? t.stores = [e] : n.push(e));
  }
  function Ta(e, t, n, r) {
    t.value = n, t.getSnapshot = r, za(t) && Ra(e);
  }
  function La(e, t, n) {
    return n(function() {
      za(t) && Ra(e);
    });
  }
  function za(e) {
    var t = e.getSnapshot;
    e = e.value;
    try {
      var n = t();
      return !Pt(e, n);
    } catch {
      return !0;
    }
  }
  function Ra(e) {
    var t = Gt(e, 1);
    t !== null && Mt(t, e, 1, -1);
  }
  function Ma(e) {
    var t = At();
    return typeof e == "function" && (e = e()), t.memoizedState = t.baseState = e, e = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: Kr, lastRenderedState: e }, t.queue = e, e = e.dispatch = hd.bind(null, _e, e), [t.memoizedState, e];
  }
  function Gr(e, t, n, r) {
    return e = { tag: e, create: t, destroy: n, deps: r, next: null }, t = _e.updateQueue, t === null ? (t = { lastEffect: null, stores: null }, _e.updateQueue = t, t.lastEffect = e.next = e) : (n = t.lastEffect, n === null ? t.lastEffect = e.next = e : (r = n.next, n.next = e, e.next = r, t.lastEffect = e)), e;
  }
  function Da() {
    return kt().memoizedState;
  }
  function Wl(e, t, n, r) {
    var l = At();
    _e.flags |= e, l.memoizedState = Gr(1 | t, n, void 0, r === void 0 ? null : r);
  }
  function Ql(e, t, n, r) {
    var l = kt();
    r = r === void 0 ? null : r;
    var i = void 0;
    if (De !== null) {
      var s = De.memoizedState;
      if (i = s.destroy, r !== null && hi(r, s.deps)) {
        l.memoizedState = Gr(t, n, i, r);
        return;
      }
    }
    _e.flags |= e, l.memoizedState = Gr(1 | t, n, i, r);
  }
  function Oa(e, t) {
    return Wl(8390656, 8, e, t);
  }
  function ji(e, t) {
    return Ql(2048, 8, e, t);
  }
  function Fa(e, t) {
    return Ql(4, 2, e, t);
  }
  function Aa(e, t) {
    return Ql(4, 4, e, t);
  }
  function Ia(e, t) {
    if (typeof t == "function") return e = e(), t(e), function() {
      t(null);
    };
    if (t != null) return e = e(), t.current = e, function() {
      t.current = null;
    };
  }
  function Ua(e, t, n) {
    return n = n != null ? n.concat([e]) : null, Ql(4, 4, Ia.bind(null, t, e), n);
  }
  function wi() {
  }
  function $a(e, t) {
    var n = kt();
    t = t === void 0 ? null : t;
    var r = n.memoizedState;
    return r !== null && t !== null && hi(t, r[1]) ? r[0] : (n.memoizedState = [e, t], e);
  }
  function Va(e, t) {
    var n = kt();
    t = t === void 0 ? null : t;
    var r = n.memoizedState;
    return r !== null && t !== null && hi(t, r[1]) ? r[0] : (e = e(), n.memoizedState = [e, t], e);
  }
  function Ba(e, t, n) {
    return (Rn & 21) === 0 ? (e.baseState && (e.baseState = !1, it = !0), e.memoizedState = n) : (Pt(n, t) || (n = ys(), _e.lanes |= n, Mn |= n, e.baseState = !0), t);
  }
  function pd(e, t) {
    var n = ve;
    ve = n !== 0 && 4 > n ? n : 4, e(!0);
    var r = mi.transition;
    mi.transition = {};
    try {
      e(!1), t();
    } finally {
      ve = n, mi.transition = r;
    }
  }
  function Ha() {
    return kt().memoizedState;
  }
  function md(e, t, n) {
    var r = xn(e);
    if (n = { lane: r, action: n, hasEagerState: !1, eagerState: null, next: null }, Wa(e)) Qa(t, n);
    else if (n = wa(e, t, n, r), n !== null) {
      var l = Ze();
      Mt(n, e, r, l), Ka(n, t, r);
    }
  }
  function hd(e, t, n) {
    var r = xn(e), l = { lane: r, action: n, hasEagerState: !1, eagerState: null, next: null };
    if (Wa(e)) Qa(t, l);
    else {
      var i = e.alternate;
      if (e.lanes === 0 && (i === null || i.lanes === 0) && (i = t.lastRenderedReducer, i !== null)) try {
        var s = t.lastRenderedState, u = i(s, n);
        if (l.hasEagerState = !0, l.eagerState = u, Pt(u, s)) {
          var c = t.interleaved;
          c === null ? (l.next = l, ai(t)) : (l.next = c.next, c.next = l), t.interleaved = l;
          return;
        }
      } catch {
      } finally {
      }
      n = wa(e, t, l, r), n !== null && (l = Ze(), Mt(n, e, r, l), Ka(n, t, r));
    }
  }
  function Wa(e) {
    var t = e.alternate;
    return e === _e || t !== null && t === _e;
  }
  function Qa(e, t) {
    Wr = Hl = !0;
    var n = e.pending;
    n === null ? t.next = t : (t.next = n.next, n.next = t), e.pending = t;
  }
  function Ka(e, t, n) {
    if ((n & 4194240) !== 0) {
      var r = t.lanes;
      r &= e.pendingLanes, n |= r, t.lanes = n, So(e, n);
    }
  }
  var Kl = { readContext: wt, useCallback: qe, useContext: qe, useEffect: qe, useImperativeHandle: qe, useInsertionEffect: qe, useLayoutEffect: qe, useMemo: qe, useReducer: qe, useRef: qe, useState: qe, useDebugValue: qe, useDeferredValue: qe, useTransition: qe, useMutableSource: qe, useSyncExternalStore: qe, useId: qe, unstable_isNewReconciler: !1 }, vd = { readContext: wt, useCallback: function(e, t) {
    return At().memoizedState = [e, t === void 0 ? null : t], e;
  }, useContext: wt, useEffect: Oa, useImperativeHandle: function(e, t, n) {
    return n = n != null ? n.concat([e]) : null, Wl(
      4194308,
      4,
      Ia.bind(null, t, e),
      n
    );
  }, useLayoutEffect: function(e, t) {
    return Wl(4194308, 4, e, t);
  }, useInsertionEffect: function(e, t) {
    return Wl(4, 2, e, t);
  }, useMemo: function(e, t) {
    var n = At();
    return t = t === void 0 ? null : t, e = e(), n.memoizedState = [e, t], e;
  }, useReducer: function(e, t, n) {
    var r = At();
    return t = n !== void 0 ? n(t) : t, r.memoizedState = r.baseState = t, e = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: e, lastRenderedState: t }, r.queue = e, e = e.dispatch = md.bind(null, _e, e), [r.memoizedState, e];
  }, useRef: function(e) {
    var t = At();
    return e = { current: e }, t.memoizedState = e;
  }, useState: Ma, useDebugValue: wi, useDeferredValue: function(e) {
    return At().memoizedState = e;
  }, useTransition: function() {
    var e = Ma(!1), t = e[0];
    return e = pd.bind(null, e[1]), At().memoizedState = e, [t, e];
  }, useMutableSource: function() {
  }, useSyncExternalStore: function(e, t, n) {
    var r = _e, l = At();
    if (Se) {
      if (n === void 0) throw Error(d(407));
      n = n();
    } else {
      if (n = t(), Ae === null) throw Error(d(349));
      (Rn & 30) !== 0 || Pa(r, t, n);
    }
    l.memoizedState = n;
    var i = { value: n, getSnapshot: t };
    return l.queue = i, Oa(La.bind(
      null,
      r,
      i,
      e
    ), [e]), r.flags |= 2048, Gr(9, Ta.bind(null, r, i, n, t), void 0, null), n;
  }, useId: function() {
    var e = At(), t = Ae.identifierPrefix;
    if (Se) {
      var n = Kt, r = Qt;
      n = (r & ~(1 << 32 - Nt(r) - 1)).toString(32) + n, t = ":" + t + "R" + n, n = Qr++, 0 < n && (t += "H" + n.toString(32)), t += ":";
    } else n = fd++, t = ":" + t + "r" + n.toString(32) + ":";
    return e.memoizedState = t;
  }, unstable_isNewReconciler: !1 }, gd = {
    readContext: wt,
    useCallback: $a,
    useContext: wt,
    useEffect: ji,
    useImperativeHandle: Ua,
    useInsertionEffect: Fa,
    useLayoutEffect: Aa,
    useMemo: Va,
    useReducer: yi,
    useRef: Da,
    useState: function() {
      return yi(Kr);
    },
    useDebugValue: wi,
    useDeferredValue: function(e) {
      var t = kt();
      return Ba(t, De.memoizedState, e);
    },
    useTransition: function() {
      var e = yi(Kr)[0], t = kt().memoizedState;
      return [e, t];
    },
    useMutableSource: Ea,
    useSyncExternalStore: Na,
    useId: Ha,
    unstable_isNewReconciler: !1
  }, yd = { readContext: wt, useCallback: $a, useContext: wt, useEffect: ji, useImperativeHandle: Ua, useInsertionEffect: Fa, useLayoutEffect: Aa, useMemo: Va, useReducer: xi, useRef: Da, useState: function() {
    return xi(Kr);
  }, useDebugValue: wi, useDeferredValue: function(e) {
    var t = kt();
    return De === null ? t.memoizedState = e : Ba(t, De.memoizedState, e);
  }, useTransition: function() {
    var e = xi(Kr)[0], t = kt().memoizedState;
    return [e, t];
  }, useMutableSource: Ea, useSyncExternalStore: Na, useId: Ha, unstable_isNewReconciler: !1 };
  function Lt(e, t) {
    if (e && e.defaultProps) {
      t = I({}, t), e = e.defaultProps;
      for (var n in e) t[n] === void 0 && (t[n] = e[n]);
      return t;
    }
    return t;
  }
  function ki(e, t, n, r) {
    t = e.memoizedState, n = n(r, t), n = n == null ? t : I({}, t, n), e.memoizedState = n, e.lanes === 0 && (e.updateQueue.baseState = n);
  }
  var Gl = { isMounted: function(e) {
    return (e = e._reactInternals) ? _n(e) === e : !1;
  }, enqueueSetState: function(e, t, n) {
    e = e._reactInternals;
    var r = Ze(), l = xn(e), i = qt(r, l);
    i.payload = t, n != null && (i.callback = n), t = hn(e, i, l), t !== null && (Mt(t, e, l, r), Ul(t, e, l));
  }, enqueueReplaceState: function(e, t, n) {
    e = e._reactInternals;
    var r = Ze(), l = xn(e), i = qt(r, l);
    i.tag = 1, i.payload = t, n != null && (i.callback = n), t = hn(e, i, l), t !== null && (Mt(t, e, l, r), Ul(t, e, l));
  }, enqueueForceUpdate: function(e, t) {
    e = e._reactInternals;
    var n = Ze(), r = xn(e), l = qt(n, r);
    l.tag = 2, t != null && (l.callback = t), t = hn(e, l, r), t !== null && (Mt(t, e, r, n), Ul(t, e, r));
  } };
  function Ga(e, t, n, r, l, i, s) {
    return e = e.stateNode, typeof e.shouldComponentUpdate == "function" ? e.shouldComponentUpdate(r, i, s) : t.prototype && t.prototype.isPureReactComponent ? !Mr(n, r) || !Mr(l, i) : !0;
  }
  function qa(e, t, n) {
    var r = !1, l = fn, i = t.contextType;
    return typeof i == "object" && i !== null ? i = wt(i) : (l = ot(t) ? Nn : Ge.current, r = t.contextTypes, i = (r = r != null) ? rr(e, l) : fn), t = new t(n, i), e.memoizedState = t.state !== null && t.state !== void 0 ? t.state : null, t.updater = Gl, e.stateNode = t, t._reactInternals = e, r && (e = e.stateNode, e.__reactInternalMemoizedUnmaskedChildContext = l, e.__reactInternalMemoizedMaskedChildContext = i), t;
  }
  function Ya(e, t, n, r) {
    e = t.state, typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(n, r), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(n, r), t.state !== e && Gl.enqueueReplaceState(t, t.state, null);
  }
  function Si(e, t, n, r) {
    var l = e.stateNode;
    l.props = n, l.state = e.memoizedState, l.refs = {}, ui(e);
    var i = t.contextType;
    typeof i == "object" && i !== null ? l.context = wt(i) : (i = ot(t) ? Nn : Ge.current, l.context = rr(e, i)), l.state = e.memoizedState, i = t.getDerivedStateFromProps, typeof i == "function" && (ki(e, t, i, n), l.state = e.memoizedState), typeof t.getDerivedStateFromProps == "function" || typeof l.getSnapshotBeforeUpdate == "function" || typeof l.UNSAFE_componentWillMount != "function" && typeof l.componentWillMount != "function" || (t = l.state, typeof l.componentWillMount == "function" && l.componentWillMount(), typeof l.UNSAFE_componentWillMount == "function" && l.UNSAFE_componentWillMount(), t !== l.state && Gl.enqueueReplaceState(l, l.state, null), $l(e, n, l, r), l.state = e.memoizedState), typeof l.componentDidMount == "function" && (e.flags |= 4194308);
  }
  function dr(e, t) {
    try {
      var n = "", r = t;
      do
        n += ie(r), r = r.return;
      while (r);
      var l = n;
    } catch (i) {
      l = `
Error generating stack: ` + i.message + `
` + i.stack;
    }
    return { value: e, source: t, stack: l, digest: null };
  }
  function Ci(e, t, n) {
    return { value: e, source: null, stack: n ?? null, digest: t ?? null };
  }
  function _i(e, t) {
    try {
      console.error(t.value);
    } catch (n) {
      setTimeout(function() {
        throw n;
      });
    }
  }
  var xd = typeof WeakMap == "function" ? WeakMap : Map;
  function Xa(e, t, n) {
    n = qt(-1, n), n.tag = 3, n.payload = { element: null };
    var r = t.value;
    return n.callback = function() {
      eo || (eo = !0, $i = r), _i(e, t);
    }, n;
  }
  function Ja(e, t, n) {
    n = qt(-1, n), n.tag = 3;
    var r = e.type.getDerivedStateFromError;
    if (typeof r == "function") {
      var l = t.value;
      n.payload = function() {
        return r(l);
      }, n.callback = function() {
        _i(e, t);
      };
    }
    var i = e.stateNode;
    return i !== null && typeof i.componentDidCatch == "function" && (n.callback = function() {
      _i(e, t), typeof r != "function" && (gn === null ? gn = /* @__PURE__ */ new Set([this]) : gn.add(this));
      var s = t.stack;
      this.componentDidCatch(t.value, { componentStack: s !== null ? s : "" });
    }), n;
  }
  function Za(e, t, n) {
    var r = e.pingCache;
    if (r === null) {
      r = e.pingCache = new xd();
      var l = /* @__PURE__ */ new Set();
      r.set(t, l);
    } else l = r.get(t), l === void 0 && (l = /* @__PURE__ */ new Set(), r.set(t, l));
    l.has(n) || (l.add(n), e = Md.bind(null, e, t, n), t.then(e, e));
  }
  function ba(e) {
    do {
      var t;
      if ((t = e.tag === 13) && (t = e.memoizedState, t = t !== null ? t.dehydrated !== null : !0), t) return e;
      e = e.return;
    } while (e !== null);
    return null;
  }
  function eu(e, t, n, r, l) {
    return (e.mode & 1) === 0 ? (e === t ? e.flags |= 65536 : (e.flags |= 128, n.flags |= 131072, n.flags &= -52805, n.tag === 1 && (n.alternate === null ? n.tag = 17 : (t = qt(-1, 1), t.tag = 2, hn(n, t, 1))), n.lanes |= 1), e) : (e.flags |= 65536, e.lanes = l, e);
  }
  var jd = pe.ReactCurrentOwner, it = !1;
  function Je(e, t, n, r) {
    t.child = e === null ? ja(t, null, n, r) : sr(t, e.child, n, r);
  }
  function tu(e, t, n, r, l) {
    n = n.render;
    var i = t.ref;
    return ur(t, l), r = vi(e, t, n, r, i, l), n = gi(), e !== null && !it ? (t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~l, Yt(e, t, l)) : (Se && n && bo(t), t.flags |= 1, Je(e, t, r, l), t.child);
  }
  function nu(e, t, n, r, l) {
    if (e === null) {
      var i = n.type;
      return typeof i == "function" && !Gi(i) && i.defaultProps === void 0 && n.compare === null && n.defaultProps === void 0 ? (t.tag = 15, t.type = i, ru(e, t, i, r, l)) : (e = io(n.type, null, r, t, t.mode, l), e.ref = t.ref, e.return = t, t.child = e);
    }
    if (i = e.child, (e.lanes & l) === 0) {
      var s = i.memoizedProps;
      if (n = n.compare, n = n !== null ? n : Mr, n(s, r) && e.ref === t.ref) return Yt(e, t, l);
    }
    return t.flags |= 1, e = wn(i, r), e.ref = t.ref, e.return = t, t.child = e;
  }
  function ru(e, t, n, r, l) {
    if (e !== null) {
      var i = e.memoizedProps;
      if (Mr(i, r) && e.ref === t.ref) if (it = !1, t.pendingProps = r = i, (e.lanes & l) !== 0) (e.flags & 131072) !== 0 && (it = !0);
      else return t.lanes = e.lanes, Yt(e, t, l);
    }
    return Ei(e, t, n, r, l);
  }
  function lu(e, t, n) {
    var r = t.pendingProps, l = r.children, i = e !== null ? e.memoizedState : null;
    if (r.mode === "hidden") if ((t.mode & 1) === 0) t.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }, xe(pr, gt), gt |= n;
    else {
      if ((n & 1073741824) === 0) return e = i !== null ? i.baseLanes | n : n, t.lanes = t.childLanes = 1073741824, t.memoizedState = { baseLanes: e, cachePool: null, transitions: null }, t.updateQueue = null, xe(pr, gt), gt |= e, null;
      t.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }, r = i !== null ? i.baseLanes : n, xe(pr, gt), gt |= r;
    }
    else i !== null ? (r = i.baseLanes | n, t.memoizedState = null) : r = n, xe(pr, gt), gt |= r;
    return Je(e, t, l, n), t.child;
  }
  function ou(e, t) {
    var n = t.ref;
    (e === null && n !== null || e !== null && e.ref !== n) && (t.flags |= 512, t.flags |= 2097152);
  }
  function Ei(e, t, n, r, l) {
    var i = ot(n) ? Nn : Ge.current;
    return i = rr(t, i), ur(t, l), n = vi(e, t, n, r, i, l), r = gi(), e !== null && !it ? (t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~l, Yt(e, t, l)) : (Se && r && bo(t), t.flags |= 1, Je(e, t, n, l), t.child);
  }
  function iu(e, t, n, r, l) {
    if (ot(n)) {
      var i = !0;
      zl(t);
    } else i = !1;
    if (ur(t, l), t.stateNode === null) Yl(e, t), qa(t, n, r), Si(t, n, r, l), r = !0;
    else if (e === null) {
      var s = t.stateNode, u = t.memoizedProps;
      s.props = u;
      var c = s.context, x = n.contextType;
      typeof x == "object" && x !== null ? x = wt(x) : (x = ot(n) ? Nn : Ge.current, x = rr(t, x));
      var _ = n.getDerivedStateFromProps, E = typeof _ == "function" || typeof s.getSnapshotBeforeUpdate == "function";
      E || typeof s.UNSAFE_componentWillReceiveProps != "function" && typeof s.componentWillReceiveProps != "function" || (u !== r || c !== x) && Ya(t, s, r, x), mn = !1;
      var C = t.memoizedState;
      s.state = C, $l(t, r, s, l), c = t.memoizedState, u !== r || C !== c || lt.current || mn ? (typeof _ == "function" && (ki(t, n, _, r), c = t.memoizedState), (u = mn || Ga(t, n, u, r, C, c, x)) ? (E || typeof s.UNSAFE_componentWillMount != "function" && typeof s.componentWillMount != "function" || (typeof s.componentWillMount == "function" && s.componentWillMount(), typeof s.UNSAFE_componentWillMount == "function" && s.UNSAFE_componentWillMount()), typeof s.componentDidMount == "function" && (t.flags |= 4194308)) : (typeof s.componentDidMount == "function" && (t.flags |= 4194308), t.memoizedProps = r, t.memoizedState = c), s.props = r, s.state = c, s.context = x, r = u) : (typeof s.componentDidMount == "function" && (t.flags |= 4194308), r = !1);
    } else {
      s = t.stateNode, ka(e, t), u = t.memoizedProps, x = t.type === t.elementType ? u : Lt(t.type, u), s.props = x, E = t.pendingProps, C = s.context, c = n.contextType, typeof c == "object" && c !== null ? c = wt(c) : (c = ot(n) ? Nn : Ge.current, c = rr(t, c));
      var A = n.getDerivedStateFromProps;
      (_ = typeof A == "function" || typeof s.getSnapshotBeforeUpdate == "function") || typeof s.UNSAFE_componentWillReceiveProps != "function" && typeof s.componentWillReceiveProps != "function" || (u !== E || C !== c) && Ya(t, s, r, c), mn = !1, C = t.memoizedState, s.state = C, $l(t, r, s, l);
      var V = t.memoizedState;
      u !== E || C !== V || lt.current || mn ? (typeof A == "function" && (ki(t, n, A, r), V = t.memoizedState), (x = mn || Ga(t, n, x, r, C, V, c) || !1) ? (_ || typeof s.UNSAFE_componentWillUpdate != "function" && typeof s.componentWillUpdate != "function" || (typeof s.componentWillUpdate == "function" && s.componentWillUpdate(r, V, c), typeof s.UNSAFE_componentWillUpdate == "function" && s.UNSAFE_componentWillUpdate(r, V, c)), typeof s.componentDidUpdate == "function" && (t.flags |= 4), typeof s.getSnapshotBeforeUpdate == "function" && (t.flags |= 1024)) : (typeof s.componentDidUpdate != "function" || u === e.memoizedProps && C === e.memoizedState || (t.flags |= 4), typeof s.getSnapshotBeforeUpdate != "function" || u === e.memoizedProps && C === e.memoizedState || (t.flags |= 1024), t.memoizedProps = r, t.memoizedState = V), s.props = r, s.state = V, s.context = c, r = x) : (typeof s.componentDidUpdate != "function" || u === e.memoizedProps && C === e.memoizedState || (t.flags |= 4), typeof s.getSnapshotBeforeUpdate != "function" || u === e.memoizedProps && C === e.memoizedState || (t.flags |= 1024), r = !1);
    }
    return Ni(e, t, n, r, i, l);
  }
  function Ni(e, t, n, r, l, i) {
    ou(e, t);
    var s = (t.flags & 128) !== 0;
    if (!r && !s) return l && da(t, n, !1), Yt(e, t, i);
    r = t.stateNode, jd.current = t;
    var u = s && typeof n.getDerivedStateFromError != "function" ? null : r.render();
    return t.flags |= 1, e !== null && s ? (t.child = sr(t, e.child, null, i), t.child = sr(t, null, u, i)) : Je(e, t, u, i), t.memoizedState = r.state, l && da(t, n, !0), t.child;
  }
  function su(e) {
    var t = e.stateNode;
    t.pendingContext ? ua(e, t.pendingContext, t.pendingContext !== t.context) : t.context && ua(e, t.context, !1), ci(e, t.containerInfo);
  }
  function au(e, t, n, r, l) {
    return ir(), ri(l), t.flags |= 256, Je(e, t, n, r), t.child;
  }
  var Pi = { dehydrated: null, treeContext: null, retryLane: 0 };
  function Ti(e) {
    return { baseLanes: e, cachePool: null, transitions: null };
  }
  function uu(e, t, n) {
    var r = t.pendingProps, l = Ce.current, i = !1, s = (t.flags & 128) !== 0, u;
    if ((u = s) || (u = e !== null && e.memoizedState === null ? !1 : (l & 2) !== 0), u ? (i = !0, t.flags &= -129) : (e === null || e.memoizedState !== null) && (l |= 1), xe(Ce, l & 1), e === null)
      return ni(t), e = t.memoizedState, e !== null && (e = e.dehydrated, e !== null) ? ((t.mode & 1) === 0 ? t.lanes = 1 : e.data === "$!" ? t.lanes = 8 : t.lanes = 1073741824, null) : (s = r.children, e = r.fallback, i ? (r = t.mode, i = t.child, s = { mode: "hidden", children: s }, (r & 1) === 0 && i !== null ? (i.childLanes = 0, i.pendingProps = s) : i = so(s, r, 0, null), e = An(e, r, n, null), i.return = t, e.return = t, i.sibling = e, t.child = i, t.child.memoizedState = Ti(n), t.memoizedState = Pi, e) : Li(t, s));
    if (l = e.memoizedState, l !== null && (u = l.dehydrated, u !== null)) return wd(e, t, s, r, u, l, n);
    if (i) {
      i = r.fallback, s = t.mode, l = e.child, u = l.sibling;
      var c = { mode: "hidden", children: r.children };
      return (s & 1) === 0 && t.child !== l ? (r = t.child, r.childLanes = 0, r.pendingProps = c, t.deletions = null) : (r = wn(l, c), r.subtreeFlags = l.subtreeFlags & 14680064), u !== null ? i = wn(u, i) : (i = An(i, s, n, null), i.flags |= 2), i.return = t, r.return = t, r.sibling = i, t.child = r, r = i, i = t.child, s = e.child.memoizedState, s = s === null ? Ti(n) : { baseLanes: s.baseLanes | n, cachePool: null, transitions: s.transitions }, i.memoizedState = s, i.childLanes = e.childLanes & ~n, t.memoizedState = Pi, r;
    }
    return i = e.child, e = i.sibling, r = wn(i, { mode: "visible", children: r.children }), (t.mode & 1) === 0 && (r.lanes = n), r.return = t, r.sibling = null, e !== null && (n = t.deletions, n === null ? (t.deletions = [e], t.flags |= 16) : n.push(e)), t.child = r, t.memoizedState = null, r;
  }
  function Li(e, t) {
    return t = so({ mode: "visible", children: t }, e.mode, 0, null), t.return = e, e.child = t;
  }
  function ql(e, t, n, r) {
    return r !== null && ri(r), sr(t, e.child, null, n), e = Li(t, t.pendingProps.children), e.flags |= 2, t.memoizedState = null, e;
  }
  function wd(e, t, n, r, l, i, s) {
    if (n)
      return t.flags & 256 ? (t.flags &= -257, r = Ci(Error(d(422))), ql(e, t, s, r)) : t.memoizedState !== null ? (t.child = e.child, t.flags |= 128, null) : (i = r.fallback, l = t.mode, r = so({ mode: "visible", children: r.children }, l, 0, null), i = An(i, l, s, null), i.flags |= 2, r.return = t, i.return = t, r.sibling = i, t.child = r, (t.mode & 1) !== 0 && sr(t, e.child, null, s), t.child.memoizedState = Ti(s), t.memoizedState = Pi, i);
    if ((t.mode & 1) === 0) return ql(e, t, s, null);
    if (l.data === "$!") {
      if (r = l.nextSibling && l.nextSibling.dataset, r) var u = r.dgst;
      return r = u, i = Error(d(419)), r = Ci(i, r, void 0), ql(e, t, s, r);
    }
    if (u = (s & e.childLanes) !== 0, it || u) {
      if (r = Ae, r !== null) {
        switch (s & -s) {
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
        l = (l & (r.suspendedLanes | s)) !== 0 ? 0 : l, l !== 0 && l !== i.retryLane && (i.retryLane = l, Gt(e, l), Mt(r, e, l, -1));
      }
      return Ki(), r = Ci(Error(d(421))), ql(e, t, s, r);
    }
    return l.data === "$?" ? (t.flags |= 128, t.child = e.child, t = Dd.bind(null, e), l._reactRetry = t, null) : (e = i.treeContext, vt = cn(l.nextSibling), ht = t, Se = !0, Tt = null, e !== null && (xt[jt++] = Qt, xt[jt++] = Kt, xt[jt++] = Pn, Qt = e.id, Kt = e.overflow, Pn = t), t = Li(t, r.children), t.flags |= 4096, t);
  }
  function cu(e, t, n) {
    e.lanes |= t;
    var r = e.alternate;
    r !== null && (r.lanes |= t), si(e.return, t, n);
  }
  function zi(e, t, n, r, l) {
    var i = e.memoizedState;
    i === null ? e.memoizedState = { isBackwards: t, rendering: null, renderingStartTime: 0, last: r, tail: n, tailMode: l } : (i.isBackwards = t, i.rendering = null, i.renderingStartTime = 0, i.last = r, i.tail = n, i.tailMode = l);
  }
  function du(e, t, n) {
    var r = t.pendingProps, l = r.revealOrder, i = r.tail;
    if (Je(e, t, r.children, n), r = Ce.current, (r & 2) !== 0) r = r & 1 | 2, t.flags |= 128;
    else {
      if (e !== null && (e.flags & 128) !== 0) e: for (e = t.child; e !== null; ) {
        if (e.tag === 13) e.memoizedState !== null && cu(e, n, t);
        else if (e.tag === 19) cu(e, n, t);
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
    if (xe(Ce, r), (t.mode & 1) === 0) t.memoizedState = null;
    else switch (l) {
      case "forwards":
        for (n = t.child, l = null; n !== null; ) e = n.alternate, e !== null && Vl(e) === null && (l = n), n = n.sibling;
        n = l, n === null ? (l = t.child, t.child = null) : (l = n.sibling, n.sibling = null), zi(t, !1, l, n, i);
        break;
      case "backwards":
        for (n = null, l = t.child, t.child = null; l !== null; ) {
          if (e = l.alternate, e !== null && Vl(e) === null) {
            t.child = l;
            break;
          }
          e = l.sibling, l.sibling = n, n = l, l = e;
        }
        zi(t, !0, n, null, i);
        break;
      case "together":
        zi(t, !1, null, null, void 0);
        break;
      default:
        t.memoizedState = null;
    }
    return t.child;
  }
  function Yl(e, t) {
    (t.mode & 1) === 0 && e !== null && (e.alternate = null, t.alternate = null, t.flags |= 2);
  }
  function Yt(e, t, n) {
    if (e !== null && (t.dependencies = e.dependencies), Mn |= t.lanes, (n & t.childLanes) === 0) return null;
    if (e !== null && t.child !== e.child) throw Error(d(153));
    if (t.child !== null) {
      for (e = t.child, n = wn(e, e.pendingProps), t.child = n, n.return = t; e.sibling !== null; ) e = e.sibling, n = n.sibling = wn(e, e.pendingProps), n.return = t;
      n.sibling = null;
    }
    return t.child;
  }
  function kd(e, t, n) {
    switch (t.tag) {
      case 3:
        su(t), ir();
        break;
      case 5:
        _a(t);
        break;
      case 1:
        ot(t.type) && zl(t);
        break;
      case 4:
        ci(t, t.stateNode.containerInfo);
        break;
      case 10:
        var r = t.type._context, l = t.memoizedProps.value;
        xe(Al, r._currentValue), r._currentValue = l;
        break;
      case 13:
        if (r = t.memoizedState, r !== null)
          return r.dehydrated !== null ? (xe(Ce, Ce.current & 1), t.flags |= 128, null) : (n & t.child.childLanes) !== 0 ? uu(e, t, n) : (xe(Ce, Ce.current & 1), e = Yt(e, t, n), e !== null ? e.sibling : null);
        xe(Ce, Ce.current & 1);
        break;
      case 19:
        if (r = (n & t.childLanes) !== 0, (e.flags & 128) !== 0) {
          if (r) return du(e, t, n);
          t.flags |= 128;
        }
        if (l = t.memoizedState, l !== null && (l.rendering = null, l.tail = null, l.lastEffect = null), xe(Ce, Ce.current), r) break;
        return null;
      case 22:
      case 23:
        return t.lanes = 0, lu(e, t, n);
    }
    return Yt(e, t, n);
  }
  var fu, Ri, pu, mu;
  fu = function(e, t) {
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
  }, Ri = function() {
  }, pu = function(e, t, n, r) {
    var l = e.memoizedProps;
    if (l !== r) {
      e = t.stateNode, zn(Ft.current);
      var i = null;
      switch (n) {
        case "input":
          l = Ne(e, l), r = Ne(e, r), i = [];
          break;
        case "select":
          l = I({}, l, { value: void 0 }), r = I({}, r, { value: void 0 }), i = [];
          break;
        case "textarea":
          l = gr(e, l), r = gr(e, r), i = [];
          break;
        default:
          typeof l.onClick != "function" && typeof r.onClick == "function" && (e.onclick = Pl);
      }
      Vn(n, r);
      var s;
      n = null;
      for (x in l) if (!r.hasOwnProperty(x) && l.hasOwnProperty(x) && l[x] != null) if (x === "style") {
        var u = l[x];
        for (s in u) u.hasOwnProperty(s) && (n || (n = {}), n[s] = "");
      } else x !== "dangerouslySetInnerHTML" && x !== "children" && x !== "suppressContentEditableWarning" && x !== "suppressHydrationWarning" && x !== "autoFocus" && (v.hasOwnProperty(x) ? i || (i = []) : (i = i || []).push(x, null));
      for (x in r) {
        var c = r[x];
        if (u = l != null ? l[x] : void 0, r.hasOwnProperty(x) && c !== u && (c != null || u != null)) if (x === "style") if (u) {
          for (s in u) !u.hasOwnProperty(s) || c && c.hasOwnProperty(s) || (n || (n = {}), n[s] = "");
          for (s in c) c.hasOwnProperty(s) && u[s] !== c[s] && (n || (n = {}), n[s] = c[s]);
        } else n || (i || (i = []), i.push(
          x,
          n
        )), n = c;
        else x === "dangerouslySetInnerHTML" ? (c = c ? c.__html : void 0, u = u ? u.__html : void 0, c != null && u !== c && (i = i || []).push(x, c)) : x === "children" ? typeof c != "string" && typeof c != "number" || (i = i || []).push(x, "" + c) : x !== "suppressContentEditableWarning" && x !== "suppressHydrationWarning" && (v.hasOwnProperty(x) ? (c != null && x === "onScroll" && je("scroll", e), i || u === c || (i = [])) : (i = i || []).push(x, c));
      }
      n && (i = i || []).push("style", n);
      var x = i;
      (t.updateQueue = x) && (t.flags |= 4);
    }
  }, mu = function(e, t, n, r) {
    n !== r && (t.flags |= 4);
  };
  function qr(e, t) {
    if (!Se) switch (e.tailMode) {
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
  function Ye(e) {
    var t = e.alternate !== null && e.alternate.child === e.child, n = 0, r = 0;
    if (t) for (var l = e.child; l !== null; ) n |= l.lanes | l.childLanes, r |= l.subtreeFlags & 14680064, r |= l.flags & 14680064, l.return = e, l = l.sibling;
    else for (l = e.child; l !== null; ) n |= l.lanes | l.childLanes, r |= l.subtreeFlags, r |= l.flags, l.return = e, l = l.sibling;
    return e.subtreeFlags |= r, e.childLanes = n, t;
  }
  function Sd(e, t, n) {
    var r = t.pendingProps;
    switch (ei(t), t.tag) {
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
        return Ye(t), null;
      case 1:
        return ot(t.type) && Ll(), Ye(t), null;
      case 3:
        return r = t.stateNode, cr(), we(lt), we(Ge), pi(), r.pendingContext && (r.context = r.pendingContext, r.pendingContext = null), (e === null || e.child === null) && (Ol(t) ? t.flags |= 4 : e === null || e.memoizedState.isDehydrated && (t.flags & 256) === 0 || (t.flags |= 1024, Tt !== null && (Hi(Tt), Tt = null))), Ri(e, t), Ye(t), null;
      case 5:
        di(t);
        var l = zn(Hr.current);
        if (n = t.type, e !== null && t.stateNode != null) pu(e, t, n, r, l), e.ref !== t.ref && (t.flags |= 512, t.flags |= 2097152);
        else {
          if (!r) {
            if (t.stateNode === null) throw Error(d(166));
            return Ye(t), null;
          }
          if (e = zn(Ft.current), Ol(t)) {
            r = t.stateNode, n = t.type;
            var i = t.memoizedProps;
            switch (r[Ot] = t, r[Ir] = i, e = (t.mode & 1) !== 0, n) {
              case "dialog":
                je("cancel", r), je("close", r);
                break;
              case "iframe":
              case "object":
              case "embed":
                je("load", r);
                break;
              case "video":
              case "audio":
                for (l = 0; l < Or.length; l++) je(Or[l], r);
                break;
              case "source":
                je("error", r);
                break;
              case "img":
              case "image":
              case "link":
                je(
                  "error",
                  r
                ), je("load", r);
                break;
              case "details":
                je("toggle", r);
                break;
              case "input":
                In(r, i), je("invalid", r);
                break;
              case "select":
                r._wrapperState = { wasMultiple: !!i.multiple }, je("invalid", r);
                break;
              case "textarea":
                ll(r, i), je("invalid", r);
            }
            Vn(n, i), l = null;
            for (var s in i) if (i.hasOwnProperty(s)) {
              var u = i[s];
              s === "children" ? typeof u == "string" ? r.textContent !== u && (i.suppressHydrationWarning !== !0 && Nl(r.textContent, u, e), l = ["children", u]) : typeof u == "number" && r.textContent !== "" + u && (i.suppressHydrationWarning !== !0 && Nl(
                r.textContent,
                u,
                e
              ), l = ["children", "" + u]) : v.hasOwnProperty(s) && u != null && s === "onScroll" && je("scroll", r);
            }
            switch (n) {
              case "input":
                M(r), rl(r, i, !0);
                break;
              case "textarea":
                M(r), ol(r);
                break;
              case "select":
              case "option":
                break;
              default:
                typeof i.onClick == "function" && (r.onclick = Pl);
            }
            r = l, t.updateQueue = r, r !== null && (t.flags |= 4);
          } else {
            s = l.nodeType === 9 ? l : l.ownerDocument, e === "http://www.w3.org/1999/xhtml" && (e = nt(n)), e === "http://www.w3.org/1999/xhtml" ? n === "script" ? (e = s.createElement("div"), e.innerHTML = "<script><\/script>", e = e.removeChild(e.firstChild)) : typeof r.is == "string" ? e = s.createElement(n, { is: r.is }) : (e = s.createElement(n), n === "select" && (s = e, r.multiple ? s.multiple = !0 : r.size && (s.size = r.size))) : e = s.createElementNS(e, n), e[Ot] = t, e[Ir] = r, fu(e, t, !1, !1), t.stateNode = e;
            e: {
              switch (s = Bn(n, r), n) {
                case "dialog":
                  je("cancel", e), je("close", e), l = r;
                  break;
                case "iframe":
                case "object":
                case "embed":
                  je("load", e), l = r;
                  break;
                case "video":
                case "audio":
                  for (l = 0; l < Or.length; l++) je(Or[l], e);
                  l = r;
                  break;
                case "source":
                  je("error", e), l = r;
                  break;
                case "img":
                case "image":
                case "link":
                  je(
                    "error",
                    e
                  ), je("load", e), l = r;
                  break;
                case "details":
                  je("toggle", e), l = r;
                  break;
                case "input":
                  In(e, r), l = Ne(e, r), je("invalid", e);
                  break;
                case "option":
                  l = r;
                  break;
                case "select":
                  e._wrapperState = { wasMultiple: !!r.multiple }, l = I({}, r, { value: void 0 }), je("invalid", e);
                  break;
                case "textarea":
                  ll(e, r), l = gr(e, r), je("invalid", e);
                  break;
                default:
                  l = r;
              }
              Vn(n, l), u = l;
              for (i in u) if (u.hasOwnProperty(i)) {
                var c = u[i];
                i === "style" ? xr(e, c) : i === "dangerouslySetInnerHTML" ? (c = c ? c.__html : void 0, c != null && $t(e, c)) : i === "children" ? typeof c == "string" ? (n !== "textarea" || c !== "") && He(e, c) : typeof c == "number" && He(e, "" + c) : i !== "suppressContentEditableWarning" && i !== "suppressHydrationWarning" && i !== "autoFocus" && (v.hasOwnProperty(i) ? c != null && i === "onScroll" && je("scroll", e) : c != null && Te(e, i, c, s));
              }
              switch (n) {
                case "input":
                  M(e), rl(e, r, !1);
                  break;
                case "textarea":
                  M(e), ol(e);
                  break;
                case "option":
                  r.value != null && e.setAttribute("value", "" + de(r.value));
                  break;
                case "select":
                  e.multiple = !!r.multiple, i = r.value, i != null ? bt(e, !!r.multiple, i, !1) : r.defaultValue != null && bt(
                    e,
                    !!r.multiple,
                    r.defaultValue,
                    !0
                  );
                  break;
                default:
                  typeof l.onClick == "function" && (e.onclick = Pl);
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
        return Ye(t), null;
      case 6:
        if (e && t.stateNode != null) mu(e, t, e.memoizedProps, r);
        else {
          if (typeof r != "string" && t.stateNode === null) throw Error(d(166));
          if (n = zn(Hr.current), zn(Ft.current), Ol(t)) {
            if (r = t.stateNode, n = t.memoizedProps, r[Ot] = t, (i = r.nodeValue !== n) && (e = ht, e !== null)) switch (e.tag) {
              case 3:
                Nl(r.nodeValue, n, (e.mode & 1) !== 0);
                break;
              case 5:
                e.memoizedProps.suppressHydrationWarning !== !0 && Nl(r.nodeValue, n, (e.mode & 1) !== 0);
            }
            i && (t.flags |= 4);
          } else r = (n.nodeType === 9 ? n : n.ownerDocument).createTextNode(r), r[Ot] = t, t.stateNode = r;
        }
        return Ye(t), null;
      case 13:
        if (we(Ce), r = t.memoizedState, e === null || e.memoizedState !== null && e.memoizedState.dehydrated !== null) {
          if (Se && vt !== null && (t.mode & 1) !== 0 && (t.flags & 128) === 0) ga(), ir(), t.flags |= 98560, i = !1;
          else if (i = Ol(t), r !== null && r.dehydrated !== null) {
            if (e === null) {
              if (!i) throw Error(d(318));
              if (i = t.memoizedState, i = i !== null ? i.dehydrated : null, !i) throw Error(d(317));
              i[Ot] = t;
            } else ir(), (t.flags & 128) === 0 && (t.memoizedState = null), t.flags |= 4;
            Ye(t), i = !1;
          } else Tt !== null && (Hi(Tt), Tt = null), i = !0;
          if (!i) return t.flags & 65536 ? t : null;
        }
        return (t.flags & 128) !== 0 ? (t.lanes = n, t) : (r = r !== null, r !== (e !== null && e.memoizedState !== null) && r && (t.child.flags |= 8192, (t.mode & 1) !== 0 && (e === null || (Ce.current & 1) !== 0 ? Oe === 0 && (Oe = 3) : Ki())), t.updateQueue !== null && (t.flags |= 4), Ye(t), null);
      case 4:
        return cr(), Ri(e, t), e === null && Fr(t.stateNode.containerInfo), Ye(t), null;
      case 10:
        return ii(t.type._context), Ye(t), null;
      case 17:
        return ot(t.type) && Ll(), Ye(t), null;
      case 19:
        if (we(Ce), i = t.memoizedState, i === null) return Ye(t), null;
        if (r = (t.flags & 128) !== 0, s = i.rendering, s === null) if (r) qr(i, !1);
        else {
          if (Oe !== 0 || e !== null && (e.flags & 128) !== 0) for (e = t.child; e !== null; ) {
            if (s = Vl(e), s !== null) {
              for (t.flags |= 128, qr(i, !1), r = s.updateQueue, r !== null && (t.updateQueue = r, t.flags |= 4), t.subtreeFlags = 0, r = n, n = t.child; n !== null; ) i = n, e = r, i.flags &= 14680066, s = i.alternate, s === null ? (i.childLanes = 0, i.lanes = e, i.child = null, i.subtreeFlags = 0, i.memoizedProps = null, i.memoizedState = null, i.updateQueue = null, i.dependencies = null, i.stateNode = null) : (i.childLanes = s.childLanes, i.lanes = s.lanes, i.child = s.child, i.subtreeFlags = 0, i.deletions = null, i.memoizedProps = s.memoizedProps, i.memoizedState = s.memoizedState, i.updateQueue = s.updateQueue, i.type = s.type, e = s.dependencies, i.dependencies = e === null ? null : { lanes: e.lanes, firstContext: e.firstContext }), n = n.sibling;
              return xe(Ce, Ce.current & 1 | 2), t.child;
            }
            e = e.sibling;
          }
          i.tail !== null && Le() > mr && (t.flags |= 128, r = !0, qr(i, !1), t.lanes = 4194304);
        }
        else {
          if (!r) if (e = Vl(s), e !== null) {
            if (t.flags |= 128, r = !0, n = e.updateQueue, n !== null && (t.updateQueue = n, t.flags |= 4), qr(i, !0), i.tail === null && i.tailMode === "hidden" && !s.alternate && !Se) return Ye(t), null;
          } else 2 * Le() - i.renderingStartTime > mr && n !== 1073741824 && (t.flags |= 128, r = !0, qr(i, !1), t.lanes = 4194304);
          i.isBackwards ? (s.sibling = t.child, t.child = s) : (n = i.last, n !== null ? n.sibling = s : t.child = s, i.last = s);
        }
        return i.tail !== null ? (t = i.tail, i.rendering = t, i.tail = t.sibling, i.renderingStartTime = Le(), t.sibling = null, n = Ce.current, xe(Ce, r ? n & 1 | 2 : n & 1), t) : (Ye(t), null);
      case 22:
      case 23:
        return Qi(), r = t.memoizedState !== null, e !== null && e.memoizedState !== null !== r && (t.flags |= 8192), r && (t.mode & 1) !== 0 ? (gt & 1073741824) !== 0 && (Ye(t), t.subtreeFlags & 6 && (t.flags |= 8192)) : Ye(t), null;
      case 24:
        return null;
      case 25:
        return null;
    }
    throw Error(d(156, t.tag));
  }
  function Cd(e, t) {
    switch (ei(t), t.tag) {
      case 1:
        return ot(t.type) && Ll(), e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
      case 3:
        return cr(), we(lt), we(Ge), pi(), e = t.flags, (e & 65536) !== 0 && (e & 128) === 0 ? (t.flags = e & -65537 | 128, t) : null;
      case 5:
        return di(t), null;
      case 13:
        if (we(Ce), e = t.memoizedState, e !== null && e.dehydrated !== null) {
          if (t.alternate === null) throw Error(d(340));
          ir();
        }
        return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
      case 19:
        return we(Ce), null;
      case 4:
        return cr(), null;
      case 10:
        return ii(t.type._context), null;
      case 22:
      case 23:
        return Qi(), null;
      case 24:
        return null;
      default:
        return null;
    }
  }
  var Xl = !1, Xe = !1, _d = typeof WeakSet == "function" ? WeakSet : Set, $ = null;
  function fr(e, t) {
    var n = e.ref;
    if (n !== null) if (typeof n == "function") try {
      n(null);
    } catch (r) {
      Pe(e, t, r);
    }
    else n.current = null;
  }
  function Mi(e, t, n) {
    try {
      n();
    } catch (r) {
      Pe(e, t, r);
    }
  }
  var hu = !1;
  function Ed(e, t) {
    if (Qo = vl, e = Gs(), Ao(e)) {
      if ("selectionStart" in e) var n = { start: e.selectionStart, end: e.selectionEnd };
      else e: {
        n = (n = e.ownerDocument) && n.defaultView || window;
        var r = n.getSelection && n.getSelection();
        if (r && r.rangeCount !== 0) {
          n = r.anchorNode;
          var l = r.anchorOffset, i = r.focusNode;
          r = r.focusOffset;
          try {
            n.nodeType, i.nodeType;
          } catch {
            n = null;
            break e;
          }
          var s = 0, u = -1, c = -1, x = 0, _ = 0, E = e, C = null;
          t: for (; ; ) {
            for (var A; E !== n || l !== 0 && E.nodeType !== 3 || (u = s + l), E !== i || r !== 0 && E.nodeType !== 3 || (c = s + r), E.nodeType === 3 && (s += E.nodeValue.length), (A = E.firstChild) !== null; )
              C = E, E = A;
            for (; ; ) {
              if (E === e) break t;
              if (C === n && ++x === l && (u = s), C === i && ++_ === r && (c = s), (A = E.nextSibling) !== null) break;
              E = C, C = E.parentNode;
            }
            E = A;
          }
          n = u === -1 || c === -1 ? null : { start: u, end: c };
        } else n = null;
      }
      n = n || { start: 0, end: 0 };
    } else n = null;
    for (Ko = { focusedElem: e, selectionRange: n }, vl = !1, $ = t; $ !== null; ) if (t = $, e = t.child, (t.subtreeFlags & 1028) !== 0 && e !== null) e.return = t, $ = e;
    else for (; $ !== null; ) {
      t = $;
      try {
        var V = t.alternate;
        if ((t.flags & 1024) !== 0) switch (t.tag) {
          case 0:
          case 11:
          case 15:
            break;
          case 1:
            if (V !== null) {
              var H = V.memoizedProps, ze = V.memoizedState, h = t.stateNode, f = h.getSnapshotBeforeUpdate(t.elementType === t.type ? H : Lt(t.type, H), ze);
              h.__reactInternalSnapshotBeforeUpdate = f;
            }
            break;
          case 3:
            var g = t.stateNode.containerInfo;
            g.nodeType === 1 ? g.textContent = "" : g.nodeType === 9 && g.documentElement && g.removeChild(g.documentElement);
            break;
          case 5:
          case 6:
          case 4:
          case 17:
            break;
          default:
            throw Error(d(163));
        }
      } catch (L) {
        Pe(t, t.return, L);
      }
      if (e = t.sibling, e !== null) {
        e.return = t.return, $ = e;
        break;
      }
      $ = t.return;
    }
    return V = hu, hu = !1, V;
  }
  function Yr(e, t, n) {
    var r = t.updateQueue;
    if (r = r !== null ? r.lastEffect : null, r !== null) {
      var l = r = r.next;
      do {
        if ((l.tag & e) === e) {
          var i = l.destroy;
          l.destroy = void 0, i !== void 0 && Mi(t, n, i);
        }
        l = l.next;
      } while (l !== r);
    }
  }
  function Jl(e, t) {
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
  function Di(e) {
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
  function vu(e) {
    var t = e.alternate;
    t !== null && (e.alternate = null, vu(t)), e.child = null, e.deletions = null, e.sibling = null, e.tag === 5 && (t = e.stateNode, t !== null && (delete t[Ot], delete t[Ir], delete t[Xo], delete t[ad], delete t[ud])), e.stateNode = null, e.return = null, e.dependencies = null, e.memoizedProps = null, e.memoizedState = null, e.pendingProps = null, e.stateNode = null, e.updateQueue = null;
  }
  function gu(e) {
    return e.tag === 5 || e.tag === 3 || e.tag === 4;
  }
  function yu(e) {
    e: for (; ; ) {
      for (; e.sibling === null; ) {
        if (e.return === null || gu(e.return)) return null;
        e = e.return;
      }
      for (e.sibling.return = e.return, e = e.sibling; e.tag !== 5 && e.tag !== 6 && e.tag !== 18; ) {
        if (e.flags & 2 || e.child === null || e.tag === 4) continue e;
        e.child.return = e, e = e.child;
      }
      if (!(e.flags & 2)) return e.stateNode;
    }
  }
  function Oi(e, t, n) {
    var r = e.tag;
    if (r === 5 || r === 6) e = e.stateNode, t ? n.nodeType === 8 ? n.parentNode.insertBefore(e, t) : n.insertBefore(e, t) : (n.nodeType === 8 ? (t = n.parentNode, t.insertBefore(e, n)) : (t = n, t.appendChild(e)), n = n._reactRootContainer, n != null || t.onclick !== null || (t.onclick = Pl));
    else if (r !== 4 && (e = e.child, e !== null)) for (Oi(e, t, n), e = e.sibling; e !== null; ) Oi(e, t, n), e = e.sibling;
  }
  function Fi(e, t, n) {
    var r = e.tag;
    if (r === 5 || r === 6) e = e.stateNode, t ? n.insertBefore(e, t) : n.appendChild(e);
    else if (r !== 4 && (e = e.child, e !== null)) for (Fi(e, t, n), e = e.sibling; e !== null; ) Fi(e, t, n), e = e.sibling;
  }
  var We = null, zt = !1;
  function vn(e, t, n) {
    for (n = n.child; n !== null; ) xu(e, t, n), n = n.sibling;
  }
  function xu(e, t, n) {
    if (Dt && typeof Dt.onCommitFiberUnmount == "function") try {
      Dt.onCommitFiberUnmount(cl, n);
    } catch {
    }
    switch (n.tag) {
      case 5:
        Xe || fr(n, t);
      case 6:
        var r = We, l = zt;
        We = null, vn(e, t, n), We = r, zt = l, We !== null && (zt ? (e = We, n = n.stateNode, e.nodeType === 8 ? e.parentNode.removeChild(n) : e.removeChild(n)) : We.removeChild(n.stateNode));
        break;
      case 18:
        We !== null && (zt ? (e = We, n = n.stateNode, e.nodeType === 8 ? Yo(e.parentNode, n) : e.nodeType === 1 && Yo(e, n), Nr(e)) : Yo(We, n.stateNode));
        break;
      case 4:
        r = We, l = zt, We = n.stateNode.containerInfo, zt = !0, vn(e, t, n), We = r, zt = l;
        break;
      case 0:
      case 11:
      case 14:
      case 15:
        if (!Xe && (r = n.updateQueue, r !== null && (r = r.lastEffect, r !== null))) {
          l = r = r.next;
          do {
            var i = l, s = i.destroy;
            i = i.tag, s !== void 0 && ((i & 2) !== 0 || (i & 4) !== 0) && Mi(n, t, s), l = l.next;
          } while (l !== r);
        }
        vn(e, t, n);
        break;
      case 1:
        if (!Xe && (fr(n, t), r = n.stateNode, typeof r.componentWillUnmount == "function")) try {
          r.props = n.memoizedProps, r.state = n.memoizedState, r.componentWillUnmount();
        } catch (u) {
          Pe(n, t, u);
        }
        vn(e, t, n);
        break;
      case 21:
        vn(e, t, n);
        break;
      case 22:
        n.mode & 1 ? (Xe = (r = Xe) || n.memoizedState !== null, vn(e, t, n), Xe = r) : vn(e, t, n);
        break;
      default:
        vn(e, t, n);
    }
  }
  function ju(e) {
    var t = e.updateQueue;
    if (t !== null) {
      e.updateQueue = null;
      var n = e.stateNode;
      n === null && (n = e.stateNode = new _d()), t.forEach(function(r) {
        var l = Od.bind(null, e, r);
        n.has(r) || (n.add(r), r.then(l, l));
      });
    }
  }
  function Rt(e, t) {
    var n = t.deletions;
    if (n !== null) for (var r = 0; r < n.length; r++) {
      var l = n[r];
      try {
        var i = e, s = t, u = s;
        e: for (; u !== null; ) {
          switch (u.tag) {
            case 5:
              We = u.stateNode, zt = !1;
              break e;
            case 3:
              We = u.stateNode.containerInfo, zt = !0;
              break e;
            case 4:
              We = u.stateNode.containerInfo, zt = !0;
              break e;
          }
          u = u.return;
        }
        if (We === null) throw Error(d(160));
        xu(i, s, l), We = null, zt = !1;
        var c = l.alternate;
        c !== null && (c.return = null), l.return = null;
      } catch (x) {
        Pe(l, t, x);
      }
    }
    if (t.subtreeFlags & 12854) for (t = t.child; t !== null; ) wu(t, e), t = t.sibling;
  }
  function wu(e, t) {
    var n = e.alternate, r = e.flags;
    switch (e.tag) {
      case 0:
      case 11:
      case 14:
      case 15:
        if (Rt(t, e), It(e), r & 4) {
          try {
            Yr(3, e, e.return), Jl(3, e);
          } catch (H) {
            Pe(e, e.return, H);
          }
          try {
            Yr(5, e, e.return);
          } catch (H) {
            Pe(e, e.return, H);
          }
        }
        break;
      case 1:
        Rt(t, e), It(e), r & 512 && n !== null && fr(n, n.return);
        break;
      case 5:
        if (Rt(t, e), It(e), r & 512 && n !== null && fr(n, n.return), e.flags & 32) {
          var l = e.stateNode;
          try {
            He(l, "");
          } catch (H) {
            Pe(e, e.return, H);
          }
        }
        if (r & 4 && (l = e.stateNode, l != null)) {
          var i = e.memoizedProps, s = n !== null ? n.memoizedProps : i, u = e.type, c = e.updateQueue;
          if (e.updateQueue = null, c !== null) try {
            u === "input" && i.type === "radio" && i.name != null && Sn(l, i), Bn(u, s);
            var x = Bn(u, i);
            for (s = 0; s < c.length; s += 2) {
              var _ = c[s], E = c[s + 1];
              _ === "style" ? xr(l, E) : _ === "dangerouslySetInnerHTML" ? $t(l, E) : _ === "children" ? He(l, E) : Te(l, _, E, x);
            }
            switch (u) {
              case "input":
                Un(l, i);
                break;
              case "textarea":
                tt(l, i);
                break;
              case "select":
                var C = l._wrapperState.wasMultiple;
                l._wrapperState.wasMultiple = !!i.multiple;
                var A = i.value;
                A != null ? bt(l, !!i.multiple, A, !1) : C !== !!i.multiple && (i.defaultValue != null ? bt(
                  l,
                  !!i.multiple,
                  i.defaultValue,
                  !0
                ) : bt(l, !!i.multiple, i.multiple ? [] : "", !1));
            }
            l[Ir] = i;
          } catch (H) {
            Pe(e, e.return, H);
          }
        }
        break;
      case 6:
        if (Rt(t, e), It(e), r & 4) {
          if (e.stateNode === null) throw Error(d(162));
          l = e.stateNode, i = e.memoizedProps;
          try {
            l.nodeValue = i;
          } catch (H) {
            Pe(e, e.return, H);
          }
        }
        break;
      case 3:
        if (Rt(t, e), It(e), r & 4 && n !== null && n.memoizedState.isDehydrated) try {
          Nr(t.containerInfo);
        } catch (H) {
          Pe(e, e.return, H);
        }
        break;
      case 4:
        Rt(t, e), It(e);
        break;
      case 13:
        Rt(t, e), It(e), l = e.child, l.flags & 8192 && (i = l.memoizedState !== null, l.stateNode.isHidden = i, !i || l.alternate !== null && l.alternate.memoizedState !== null || (Ui = Le())), r & 4 && ju(e);
        break;
      case 22:
        if (_ = n !== null && n.memoizedState !== null, e.mode & 1 ? (Xe = (x = Xe) || _, Rt(t, e), Xe = x) : Rt(t, e), It(e), r & 8192) {
          if (x = e.memoizedState !== null, (e.stateNode.isHidden = x) && !_ && (e.mode & 1) !== 0) for ($ = e, _ = e.child; _ !== null; ) {
            for (E = $ = _; $ !== null; ) {
              switch (C = $, A = C.child, C.tag) {
                case 0:
                case 11:
                case 14:
                case 15:
                  Yr(4, C, C.return);
                  break;
                case 1:
                  fr(C, C.return);
                  var V = C.stateNode;
                  if (typeof V.componentWillUnmount == "function") {
                    r = C, n = C.return;
                    try {
                      t = r, V.props = t.memoizedProps, V.state = t.memoizedState, V.componentWillUnmount();
                    } catch (H) {
                      Pe(r, n, H);
                    }
                  }
                  break;
                case 5:
                  fr(C, C.return);
                  break;
                case 22:
                  if (C.memoizedState !== null) {
                    Cu(E);
                    continue;
                  }
              }
              A !== null ? (A.return = C, $ = A) : Cu(E);
            }
            _ = _.sibling;
          }
          e: for (_ = null, E = e; ; ) {
            if (E.tag === 5) {
              if (_ === null) {
                _ = E;
                try {
                  l = E.stateNode, x ? (i = l.style, typeof i.setProperty == "function" ? i.setProperty("display", "none", "important") : i.display = "none") : (u = E.stateNode, c = E.memoizedProps.style, s = c != null && c.hasOwnProperty("display") ? c.display : null, u.style.display = yr("display", s));
                } catch (H) {
                  Pe(e, e.return, H);
                }
              }
            } else if (E.tag === 6) {
              if (_ === null) try {
                E.stateNode.nodeValue = x ? "" : E.memoizedProps;
              } catch (H) {
                Pe(e, e.return, H);
              }
            } else if ((E.tag !== 22 && E.tag !== 23 || E.memoizedState === null || E === e) && E.child !== null) {
              E.child.return = E, E = E.child;
              continue;
            }
            if (E === e) break e;
            for (; E.sibling === null; ) {
              if (E.return === null || E.return === e) break e;
              _ === E && (_ = null), E = E.return;
            }
            _ === E && (_ = null), E.sibling.return = E.return, E = E.sibling;
          }
        }
        break;
      case 19:
        Rt(t, e), It(e), r & 4 && ju(e);
        break;
      case 21:
        break;
      default:
        Rt(
          t,
          e
        ), It(e);
    }
  }
  function It(e) {
    var t = e.flags;
    if (t & 2) {
      try {
        e: {
          for (var n = e.return; n !== null; ) {
            if (gu(n)) {
              var r = n;
              break e;
            }
            n = n.return;
          }
          throw Error(d(160));
        }
        switch (r.tag) {
          case 5:
            var l = r.stateNode;
            r.flags & 32 && (He(l, ""), r.flags &= -33);
            var i = yu(e);
            Fi(e, i, l);
            break;
          case 3:
          case 4:
            var s = r.stateNode.containerInfo, u = yu(e);
            Oi(e, u, s);
            break;
          default:
            throw Error(d(161));
        }
      } catch (c) {
        Pe(e, e.return, c);
      }
      e.flags &= -3;
    }
    t & 4096 && (e.flags &= -4097);
  }
  function Nd(e, t, n) {
    $ = e, ku(e);
  }
  function ku(e, t, n) {
    for (var r = (e.mode & 1) !== 0; $ !== null; ) {
      var l = $, i = l.child;
      if (l.tag === 22 && r) {
        var s = l.memoizedState !== null || Xl;
        if (!s) {
          var u = l.alternate, c = u !== null && u.memoizedState !== null || Xe;
          u = Xl;
          var x = Xe;
          if (Xl = s, (Xe = c) && !x) for ($ = l; $ !== null; ) s = $, c = s.child, s.tag === 22 && s.memoizedState !== null ? _u(l) : c !== null ? (c.return = s, $ = c) : _u(l);
          for (; i !== null; ) $ = i, ku(i), i = i.sibling;
          $ = l, Xl = u, Xe = x;
        }
        Su(e);
      } else (l.subtreeFlags & 8772) !== 0 && i !== null ? (i.return = l, $ = i) : Su(e);
    }
  }
  function Su(e) {
    for (; $ !== null; ) {
      var t = $;
      if ((t.flags & 8772) !== 0) {
        var n = t.alternate;
        try {
          if ((t.flags & 8772) !== 0) switch (t.tag) {
            case 0:
            case 11:
            case 15:
              Xe || Jl(5, t);
              break;
            case 1:
              var r = t.stateNode;
              if (t.flags & 4 && !Xe) if (n === null) r.componentDidMount();
              else {
                var l = t.elementType === t.type ? n.memoizedProps : Lt(t.type, n.memoizedProps);
                r.componentDidUpdate(l, n.memoizedState, r.__reactInternalSnapshotBeforeUpdate);
              }
              var i = t.updateQueue;
              i !== null && Ca(t, i, r);
              break;
            case 3:
              var s = t.updateQueue;
              if (s !== null) {
                if (n = null, t.child !== null) switch (t.child.tag) {
                  case 5:
                    n = t.child.stateNode;
                    break;
                  case 1:
                    n = t.child.stateNode;
                }
                Ca(t, s, n);
              }
              break;
            case 5:
              var u = t.stateNode;
              if (n === null && t.flags & 4) {
                n = u;
                var c = t.memoizedProps;
                switch (t.type) {
                  case "button":
                  case "input":
                  case "select":
                  case "textarea":
                    c.autoFocus && n.focus();
                    break;
                  case "img":
                    c.src && (n.src = c.src);
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
                var x = t.alternate;
                if (x !== null) {
                  var _ = x.memoizedState;
                  if (_ !== null) {
                    var E = _.dehydrated;
                    E !== null && Nr(E);
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
              throw Error(d(163));
          }
          Xe || t.flags & 512 && Di(t);
        } catch (C) {
          Pe(t, t.return, C);
        }
      }
      if (t === e) {
        $ = null;
        break;
      }
      if (n = t.sibling, n !== null) {
        n.return = t.return, $ = n;
        break;
      }
      $ = t.return;
    }
  }
  function Cu(e) {
    for (; $ !== null; ) {
      var t = $;
      if (t === e) {
        $ = null;
        break;
      }
      var n = t.sibling;
      if (n !== null) {
        n.return = t.return, $ = n;
        break;
      }
      $ = t.return;
    }
  }
  function _u(e) {
    for (; $ !== null; ) {
      var t = $;
      try {
        switch (t.tag) {
          case 0:
          case 11:
          case 15:
            var n = t.return;
            try {
              Jl(4, t);
            } catch (c) {
              Pe(t, n, c);
            }
            break;
          case 1:
            var r = t.stateNode;
            if (typeof r.componentDidMount == "function") {
              var l = t.return;
              try {
                r.componentDidMount();
              } catch (c) {
                Pe(t, l, c);
              }
            }
            var i = t.return;
            try {
              Di(t);
            } catch (c) {
              Pe(t, i, c);
            }
            break;
          case 5:
            var s = t.return;
            try {
              Di(t);
            } catch (c) {
              Pe(t, s, c);
            }
        }
      } catch (c) {
        Pe(t, t.return, c);
      }
      if (t === e) {
        $ = null;
        break;
      }
      var u = t.sibling;
      if (u !== null) {
        u.return = t.return, $ = u;
        break;
      }
      $ = t.return;
    }
  }
  var Pd = Math.ceil, Zl = pe.ReactCurrentDispatcher, Ai = pe.ReactCurrentOwner, St = pe.ReactCurrentBatchConfig, ce = 0, Ae = null, Re = null, Qe = 0, gt = 0, pr = dn(0), Oe = 0, Xr = null, Mn = 0, bl = 0, Ii = 0, Jr = null, st = null, Ui = 0, mr = 1 / 0, Xt = null, eo = !1, $i = null, gn = null, to = !1, yn = null, no = 0, Zr = 0, Vi = null, ro = -1, lo = 0;
  function Ze() {
    return (ce & 6) !== 0 ? Le() : ro !== -1 ? ro : ro = Le();
  }
  function xn(e) {
    return (e.mode & 1) === 0 ? 1 : (ce & 2) !== 0 && Qe !== 0 ? Qe & -Qe : dd.transition !== null ? (lo === 0 && (lo = ys()), lo) : (e = ve, e !== 0 || (e = window.event, e = e === void 0 ? 16 : Ns(e.type)), e);
  }
  function Mt(e, t, n, r) {
    if (50 < Zr) throw Zr = 0, Vi = null, Error(d(185));
    kr(e, n, r), ((ce & 2) === 0 || e !== Ae) && (e === Ae && ((ce & 2) === 0 && (bl |= n), Oe === 4 && jn(e, Qe)), at(e, r), n === 1 && ce === 0 && (t.mode & 1) === 0 && (mr = Le() + 500, Rl && pn()));
  }
  function at(e, t) {
    var n = e.callbackNode;
    dc(e, t);
    var r = pl(e, e === Ae ? Qe : 0);
    if (r === 0) n !== null && hs(n), e.callbackNode = null, e.callbackPriority = 0;
    else if (t = r & -r, e.callbackPriority !== t) {
      if (n != null && hs(n), t === 1) e.tag === 0 ? cd(Nu.bind(null, e)) : fa(Nu.bind(null, e)), id(function() {
        (ce & 6) === 0 && pn();
      }), n = null;
      else {
        switch (xs(r)) {
          case 1:
            n = jo;
            break;
          case 4:
            n = vs;
            break;
          case 16:
            n = ul;
            break;
          case 536870912:
            n = gs;
            break;
          default:
            n = ul;
        }
        n = Ou(n, Eu.bind(null, e));
      }
      e.callbackPriority = t, e.callbackNode = n;
    }
  }
  function Eu(e, t) {
    if (ro = -1, lo = 0, (ce & 6) !== 0) throw Error(d(327));
    var n = e.callbackNode;
    if (hr() && e.callbackNode !== n) return null;
    var r = pl(e, e === Ae ? Qe : 0);
    if (r === 0) return null;
    if ((r & 30) !== 0 || (r & e.expiredLanes) !== 0 || t) t = oo(e, r);
    else {
      t = r;
      var l = ce;
      ce |= 2;
      var i = Tu();
      (Ae !== e || Qe !== t) && (Xt = null, mr = Le() + 500, On(e, t));
      do
        try {
          zd();
          break;
        } catch (u) {
          Pu(e, u);
        }
      while (!0);
      oi(), Zl.current = i, ce = l, Re !== null ? t = 0 : (Ae = null, Qe = 0, t = Oe);
    }
    if (t !== 0) {
      if (t === 2 && (l = wo(e), l !== 0 && (r = l, t = Bi(e, l))), t === 1) throw n = Xr, On(e, 0), jn(e, r), at(e, Le()), n;
      if (t === 6) jn(e, r);
      else {
        if (l = e.current.alternate, (r & 30) === 0 && !Td(l) && (t = oo(e, r), t === 2 && (i = wo(e), i !== 0 && (r = i, t = Bi(e, i))), t === 1)) throw n = Xr, On(e, 0), jn(e, r), at(e, Le()), n;
        switch (e.finishedWork = l, e.finishedLanes = r, t) {
          case 0:
          case 1:
            throw Error(d(345));
          case 2:
            Fn(e, st, Xt);
            break;
          case 3:
            if (jn(e, r), (r & 130023424) === r && (t = Ui + 500 - Le(), 10 < t)) {
              if (pl(e, 0) !== 0) break;
              if (l = e.suspendedLanes, (l & r) !== r) {
                Ze(), e.pingedLanes |= e.suspendedLanes & l;
                break;
              }
              e.timeoutHandle = qo(Fn.bind(null, e, st, Xt), t);
              break;
            }
            Fn(e, st, Xt);
            break;
          case 4:
            if (jn(e, r), (r & 4194240) === r) break;
            for (t = e.eventTimes, l = -1; 0 < r; ) {
              var s = 31 - Nt(r);
              i = 1 << s, s = t[s], s > l && (l = s), r &= ~i;
            }
            if (r = l, r = Le() - r, r = (120 > r ? 120 : 480 > r ? 480 : 1080 > r ? 1080 : 1920 > r ? 1920 : 3e3 > r ? 3e3 : 4320 > r ? 4320 : 1960 * Pd(r / 1960)) - r, 10 < r) {
              e.timeoutHandle = qo(Fn.bind(null, e, st, Xt), r);
              break;
            }
            Fn(e, st, Xt);
            break;
          case 5:
            Fn(e, st, Xt);
            break;
          default:
            throw Error(d(329));
        }
      }
    }
    return at(e, Le()), e.callbackNode === n ? Eu.bind(null, e) : null;
  }
  function Bi(e, t) {
    var n = Jr;
    return e.current.memoizedState.isDehydrated && (On(e, t).flags |= 256), e = oo(e, t), e !== 2 && (t = st, st = n, t !== null && Hi(t)), e;
  }
  function Hi(e) {
    st === null ? st = e : st.push.apply(st, e);
  }
  function Td(e) {
    for (var t = e; ; ) {
      if (t.flags & 16384) {
        var n = t.updateQueue;
        if (n !== null && (n = n.stores, n !== null)) for (var r = 0; r < n.length; r++) {
          var l = n[r], i = l.getSnapshot;
          l = l.value;
          try {
            if (!Pt(i(), l)) return !1;
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
  function jn(e, t) {
    for (t &= ~Ii, t &= ~bl, e.suspendedLanes |= t, e.pingedLanes &= ~t, e = e.expirationTimes; 0 < t; ) {
      var n = 31 - Nt(t), r = 1 << n;
      e[n] = -1, t &= ~r;
    }
  }
  function Nu(e) {
    if ((ce & 6) !== 0) throw Error(d(327));
    hr();
    var t = pl(e, 0);
    if ((t & 1) === 0) return at(e, Le()), null;
    var n = oo(e, t);
    if (e.tag !== 0 && n === 2) {
      var r = wo(e);
      r !== 0 && (t = r, n = Bi(e, r));
    }
    if (n === 1) throw n = Xr, On(e, 0), jn(e, t), at(e, Le()), n;
    if (n === 6) throw Error(d(345));
    return e.finishedWork = e.current.alternate, e.finishedLanes = t, Fn(e, st, Xt), at(e, Le()), null;
  }
  function Wi(e, t) {
    var n = ce;
    ce |= 1;
    try {
      return e(t);
    } finally {
      ce = n, ce === 0 && (mr = Le() + 500, Rl && pn());
    }
  }
  function Dn(e) {
    yn !== null && yn.tag === 0 && (ce & 6) === 0 && hr();
    var t = ce;
    ce |= 1;
    var n = St.transition, r = ve;
    try {
      if (St.transition = null, ve = 1, e) return e();
    } finally {
      ve = r, St.transition = n, ce = t, (ce & 6) === 0 && pn();
    }
  }
  function Qi() {
    gt = pr.current, we(pr);
  }
  function On(e, t) {
    e.finishedWork = null, e.finishedLanes = 0;
    var n = e.timeoutHandle;
    if (n !== -1 && (e.timeoutHandle = -1, od(n)), Re !== null) for (n = Re.return; n !== null; ) {
      var r = n;
      switch (ei(r), r.tag) {
        case 1:
          r = r.type.childContextTypes, r != null && Ll();
          break;
        case 3:
          cr(), we(lt), we(Ge), pi();
          break;
        case 5:
          di(r);
          break;
        case 4:
          cr();
          break;
        case 13:
          we(Ce);
          break;
        case 19:
          we(Ce);
          break;
        case 10:
          ii(r.type._context);
          break;
        case 22:
        case 23:
          Qi();
      }
      n = n.return;
    }
    if (Ae = e, Re = e = wn(e.current, null), Qe = gt = t, Oe = 0, Xr = null, Ii = bl = Mn = 0, st = Jr = null, Ln !== null) {
      for (t = 0; t < Ln.length; t++) if (n = Ln[t], r = n.interleaved, r !== null) {
        n.interleaved = null;
        var l = r.next, i = n.pending;
        if (i !== null) {
          var s = i.next;
          i.next = l, r.next = s;
        }
        n.pending = r;
      }
      Ln = null;
    }
    return e;
  }
  function Pu(e, t) {
    do {
      var n = Re;
      try {
        if (oi(), Bl.current = Kl, Hl) {
          for (var r = _e.memoizedState; r !== null; ) {
            var l = r.queue;
            l !== null && (l.pending = null), r = r.next;
          }
          Hl = !1;
        }
        if (Rn = 0, Fe = De = _e = null, Wr = !1, Qr = 0, Ai.current = null, n === null || n.return === null) {
          Oe = 1, Xr = t, Re = null;
          break;
        }
        e: {
          var i = e, s = n.return, u = n, c = t;
          if (t = Qe, u.flags |= 32768, c !== null && typeof c == "object" && typeof c.then == "function") {
            var x = c, _ = u, E = _.tag;
            if ((_.mode & 1) === 0 && (E === 0 || E === 11 || E === 15)) {
              var C = _.alternate;
              C ? (_.updateQueue = C.updateQueue, _.memoizedState = C.memoizedState, _.lanes = C.lanes) : (_.updateQueue = null, _.memoizedState = null);
            }
            var A = ba(s);
            if (A !== null) {
              A.flags &= -257, eu(A, s, u, i, t), A.mode & 1 && Za(i, x, t), t = A, c = x;
              var V = t.updateQueue;
              if (V === null) {
                var H = /* @__PURE__ */ new Set();
                H.add(c), t.updateQueue = H;
              } else V.add(c);
              break e;
            } else {
              if ((t & 1) === 0) {
                Za(i, x, t), Ki();
                break e;
              }
              c = Error(d(426));
            }
          } else if (Se && u.mode & 1) {
            var ze = ba(s);
            if (ze !== null) {
              (ze.flags & 65536) === 0 && (ze.flags |= 256), eu(ze, s, u, i, t), ri(dr(c, u));
              break e;
            }
          }
          i = c = dr(c, u), Oe !== 4 && (Oe = 2), Jr === null ? Jr = [i] : Jr.push(i), i = s;
          do {
            switch (i.tag) {
              case 3:
                i.flags |= 65536, t &= -t, i.lanes |= t;
                var h = Xa(i, c, t);
                Sa(i, h);
                break e;
              case 1:
                u = c;
                var f = i.type, g = i.stateNode;
                if ((i.flags & 128) === 0 && (typeof f.getDerivedStateFromError == "function" || g !== null && typeof g.componentDidCatch == "function" && (gn === null || !gn.has(g)))) {
                  i.flags |= 65536, t &= -t, i.lanes |= t;
                  var L = Ja(i, u, t);
                  Sa(i, L);
                  break e;
                }
            }
            i = i.return;
          } while (i !== null);
        }
        zu(n);
      } catch (W) {
        t = W, Re === n && n !== null && (Re = n = n.return);
        continue;
      }
      break;
    } while (!0);
  }
  function Tu() {
    var e = Zl.current;
    return Zl.current = Kl, e === null ? Kl : e;
  }
  function Ki() {
    (Oe === 0 || Oe === 3 || Oe === 2) && (Oe = 4), Ae === null || (Mn & 268435455) === 0 && (bl & 268435455) === 0 || jn(Ae, Qe);
  }
  function oo(e, t) {
    var n = ce;
    ce |= 2;
    var r = Tu();
    (Ae !== e || Qe !== t) && (Xt = null, On(e, t));
    do
      try {
        Ld();
        break;
      } catch (l) {
        Pu(e, l);
      }
    while (!0);
    if (oi(), ce = n, Zl.current = r, Re !== null) throw Error(d(261));
    return Ae = null, Qe = 0, Oe;
  }
  function Ld() {
    for (; Re !== null; ) Lu(Re);
  }
  function zd() {
    for (; Re !== null && !nc(); ) Lu(Re);
  }
  function Lu(e) {
    var t = Du(e.alternate, e, gt);
    e.memoizedProps = e.pendingProps, t === null ? zu(e) : Re = t, Ai.current = null;
  }
  function zu(e) {
    var t = e;
    do {
      var n = t.alternate;
      if (e = t.return, (t.flags & 32768) === 0) {
        if (n = Sd(n, t, gt), n !== null) {
          Re = n;
          return;
        }
      } else {
        if (n = Cd(n, t), n !== null) {
          n.flags &= 32767, Re = n;
          return;
        }
        if (e !== null) e.flags |= 32768, e.subtreeFlags = 0, e.deletions = null;
        else {
          Oe = 6, Re = null;
          return;
        }
      }
      if (t = t.sibling, t !== null) {
        Re = t;
        return;
      }
      Re = t = e;
    } while (t !== null);
    Oe === 0 && (Oe = 5);
  }
  function Fn(e, t, n) {
    var r = ve, l = St.transition;
    try {
      St.transition = null, ve = 1, Rd(e, t, n, r);
    } finally {
      St.transition = l, ve = r;
    }
    return null;
  }
  function Rd(e, t, n, r) {
    do
      hr();
    while (yn !== null);
    if ((ce & 6) !== 0) throw Error(d(327));
    n = e.finishedWork;
    var l = e.finishedLanes;
    if (n === null) return null;
    if (e.finishedWork = null, e.finishedLanes = 0, n === e.current) throw Error(d(177));
    e.callbackNode = null, e.callbackPriority = 0;
    var i = n.lanes | n.childLanes;
    if (fc(e, i), e === Ae && (Re = Ae = null, Qe = 0), (n.subtreeFlags & 2064) === 0 && (n.flags & 2064) === 0 || to || (to = !0, Ou(ul, function() {
      return hr(), null;
    })), i = (n.flags & 15990) !== 0, (n.subtreeFlags & 15990) !== 0 || i) {
      i = St.transition, St.transition = null;
      var s = ve;
      ve = 1;
      var u = ce;
      ce |= 4, Ai.current = null, Ed(e, n), wu(n, e), Zc(Ko), vl = !!Qo, Ko = Qo = null, e.current = n, Nd(n), rc(), ce = u, ve = s, St.transition = i;
    } else e.current = n;
    if (to && (to = !1, yn = e, no = l), i = e.pendingLanes, i === 0 && (gn = null), ic(n.stateNode), at(e, Le()), t !== null) for (r = e.onRecoverableError, n = 0; n < t.length; n++) l = t[n], r(l.value, { componentStack: l.stack, digest: l.digest });
    if (eo) throw eo = !1, e = $i, $i = null, e;
    return (no & 1) !== 0 && e.tag !== 0 && hr(), i = e.pendingLanes, (i & 1) !== 0 ? e === Vi ? Zr++ : (Zr = 0, Vi = e) : Zr = 0, pn(), null;
  }
  function hr() {
    if (yn !== null) {
      var e = xs(no), t = St.transition, n = ve;
      try {
        if (St.transition = null, ve = 16 > e ? 16 : e, yn === null) var r = !1;
        else {
          if (e = yn, yn = null, no = 0, (ce & 6) !== 0) throw Error(d(331));
          var l = ce;
          for (ce |= 4, $ = e.current; $ !== null; ) {
            var i = $, s = i.child;
            if (($.flags & 16) !== 0) {
              var u = i.deletions;
              if (u !== null) {
                for (var c = 0; c < u.length; c++) {
                  var x = u[c];
                  for ($ = x; $ !== null; ) {
                    var _ = $;
                    switch (_.tag) {
                      case 0:
                      case 11:
                      case 15:
                        Yr(8, _, i);
                    }
                    var E = _.child;
                    if (E !== null) E.return = _, $ = E;
                    else for (; $ !== null; ) {
                      _ = $;
                      var C = _.sibling, A = _.return;
                      if (vu(_), _ === x) {
                        $ = null;
                        break;
                      }
                      if (C !== null) {
                        C.return = A, $ = C;
                        break;
                      }
                      $ = A;
                    }
                  }
                }
                var V = i.alternate;
                if (V !== null) {
                  var H = V.child;
                  if (H !== null) {
                    V.child = null;
                    do {
                      var ze = H.sibling;
                      H.sibling = null, H = ze;
                    } while (H !== null);
                  }
                }
                $ = i;
              }
            }
            if ((i.subtreeFlags & 2064) !== 0 && s !== null) s.return = i, $ = s;
            else e: for (; $ !== null; ) {
              if (i = $, (i.flags & 2048) !== 0) switch (i.tag) {
                case 0:
                case 11:
                case 15:
                  Yr(9, i, i.return);
              }
              var h = i.sibling;
              if (h !== null) {
                h.return = i.return, $ = h;
                break e;
              }
              $ = i.return;
            }
          }
          var f = e.current;
          for ($ = f; $ !== null; ) {
            s = $;
            var g = s.child;
            if ((s.subtreeFlags & 2064) !== 0 && g !== null) g.return = s, $ = g;
            else e: for (s = f; $ !== null; ) {
              if (u = $, (u.flags & 2048) !== 0) try {
                switch (u.tag) {
                  case 0:
                  case 11:
                  case 15:
                    Jl(9, u);
                }
              } catch (W) {
                Pe(u, u.return, W);
              }
              if (u === s) {
                $ = null;
                break e;
              }
              var L = u.sibling;
              if (L !== null) {
                L.return = u.return, $ = L;
                break e;
              }
              $ = u.return;
            }
          }
          if (ce = l, pn(), Dt && typeof Dt.onPostCommitFiberRoot == "function") try {
            Dt.onPostCommitFiberRoot(cl, e);
          } catch {
          }
          r = !0;
        }
        return r;
      } finally {
        ve = n, St.transition = t;
      }
    }
    return !1;
  }
  function Ru(e, t, n) {
    t = dr(n, t), t = Xa(e, t, 1), e = hn(e, t, 1), t = Ze(), e !== null && (kr(e, 1, t), at(e, t));
  }
  function Pe(e, t, n) {
    if (e.tag === 3) Ru(e, e, n);
    else for (; t !== null; ) {
      if (t.tag === 3) {
        Ru(t, e, n);
        break;
      } else if (t.tag === 1) {
        var r = t.stateNode;
        if (typeof t.type.getDerivedStateFromError == "function" || typeof r.componentDidCatch == "function" && (gn === null || !gn.has(r))) {
          e = dr(n, e), e = Ja(t, e, 1), t = hn(t, e, 1), e = Ze(), t !== null && (kr(t, 1, e), at(t, e));
          break;
        }
      }
      t = t.return;
    }
  }
  function Md(e, t, n) {
    var r = e.pingCache;
    r !== null && r.delete(t), t = Ze(), e.pingedLanes |= e.suspendedLanes & n, Ae === e && (Qe & n) === n && (Oe === 4 || Oe === 3 && (Qe & 130023424) === Qe && 500 > Le() - Ui ? On(e, 0) : Ii |= n), at(e, t);
  }
  function Mu(e, t) {
    t === 0 && ((e.mode & 1) === 0 ? t = 1 : (t = fl, fl <<= 1, (fl & 130023424) === 0 && (fl = 4194304)));
    var n = Ze();
    e = Gt(e, t), e !== null && (kr(e, t, n), at(e, n));
  }
  function Dd(e) {
    var t = e.memoizedState, n = 0;
    t !== null && (n = t.retryLane), Mu(e, n);
  }
  function Od(e, t) {
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
        throw Error(d(314));
    }
    r !== null && r.delete(t), Mu(e, n);
  }
  var Du;
  Du = function(e, t, n) {
    if (e !== null) if (e.memoizedProps !== t.pendingProps || lt.current) it = !0;
    else {
      if ((e.lanes & n) === 0 && (t.flags & 128) === 0) return it = !1, kd(e, t, n);
      it = (e.flags & 131072) !== 0;
    }
    else it = !1, Se && (t.flags & 1048576) !== 0 && pa(t, Dl, t.index);
    switch (t.lanes = 0, t.tag) {
      case 2:
        var r = t.type;
        Yl(e, t), e = t.pendingProps;
        var l = rr(t, Ge.current);
        ur(t, n), l = vi(null, t, r, e, l, n);
        var i = gi();
        return t.flags |= 1, typeof l == "object" && l !== null && typeof l.render == "function" && l.$$typeof === void 0 ? (t.tag = 1, t.memoizedState = null, t.updateQueue = null, ot(r) ? (i = !0, zl(t)) : i = !1, t.memoizedState = l.state !== null && l.state !== void 0 ? l.state : null, ui(t), l.updater = Gl, t.stateNode = l, l._reactInternals = t, Si(t, r, e, n), t = Ni(null, t, r, !0, i, n)) : (t.tag = 0, Se && i && bo(t), Je(null, t, l, n), t = t.child), t;
      case 16:
        r = t.elementType;
        e: {
          switch (Yl(e, t), e = t.pendingProps, l = r._init, r = l(r._payload), t.type = r, l = t.tag = Ad(r), e = Lt(r, e), l) {
            case 0:
              t = Ei(null, t, r, e, n);
              break e;
            case 1:
              t = iu(null, t, r, e, n);
              break e;
            case 11:
              t = tu(null, t, r, e, n);
              break e;
            case 14:
              t = nu(null, t, r, Lt(r.type, e), n);
              break e;
          }
          throw Error(d(
            306,
            r,
            ""
          ));
        }
        return t;
      case 0:
        return r = t.type, l = t.pendingProps, l = t.elementType === r ? l : Lt(r, l), Ei(e, t, r, l, n);
      case 1:
        return r = t.type, l = t.pendingProps, l = t.elementType === r ? l : Lt(r, l), iu(e, t, r, l, n);
      case 3:
        e: {
          if (su(t), e === null) throw Error(d(387));
          r = t.pendingProps, i = t.memoizedState, l = i.element, ka(e, t), $l(t, r, null, n);
          var s = t.memoizedState;
          if (r = s.element, i.isDehydrated) if (i = { element: r, isDehydrated: !1, cache: s.cache, pendingSuspenseBoundaries: s.pendingSuspenseBoundaries, transitions: s.transitions }, t.updateQueue.baseState = i, t.memoizedState = i, t.flags & 256) {
            l = dr(Error(d(423)), t), t = au(e, t, r, n, l);
            break e;
          } else if (r !== l) {
            l = dr(Error(d(424)), t), t = au(e, t, r, n, l);
            break e;
          } else for (vt = cn(t.stateNode.containerInfo.firstChild), ht = t, Se = !0, Tt = null, n = ja(t, null, r, n), t.child = n; n; ) n.flags = n.flags & -3 | 4096, n = n.sibling;
          else {
            if (ir(), r === l) {
              t = Yt(e, t, n);
              break e;
            }
            Je(e, t, r, n);
          }
          t = t.child;
        }
        return t;
      case 5:
        return _a(t), e === null && ni(t), r = t.type, l = t.pendingProps, i = e !== null ? e.memoizedProps : null, s = l.children, Go(r, l) ? s = null : i !== null && Go(r, i) && (t.flags |= 32), ou(e, t), Je(e, t, s, n), t.child;
      case 6:
        return e === null && ni(t), null;
      case 13:
        return uu(e, t, n);
      case 4:
        return ci(t, t.stateNode.containerInfo), r = t.pendingProps, e === null ? t.child = sr(t, null, r, n) : Je(e, t, r, n), t.child;
      case 11:
        return r = t.type, l = t.pendingProps, l = t.elementType === r ? l : Lt(r, l), tu(e, t, r, l, n);
      case 7:
        return Je(e, t, t.pendingProps, n), t.child;
      case 8:
        return Je(e, t, t.pendingProps.children, n), t.child;
      case 12:
        return Je(e, t, t.pendingProps.children, n), t.child;
      case 10:
        e: {
          if (r = t.type._context, l = t.pendingProps, i = t.memoizedProps, s = l.value, xe(Al, r._currentValue), r._currentValue = s, i !== null) if (Pt(i.value, s)) {
            if (i.children === l.children && !lt.current) {
              t = Yt(e, t, n);
              break e;
            }
          } else for (i = t.child, i !== null && (i.return = t); i !== null; ) {
            var u = i.dependencies;
            if (u !== null) {
              s = i.child;
              for (var c = u.firstContext; c !== null; ) {
                if (c.context === r) {
                  if (i.tag === 1) {
                    c = qt(-1, n & -n), c.tag = 2;
                    var x = i.updateQueue;
                    if (x !== null) {
                      x = x.shared;
                      var _ = x.pending;
                      _ === null ? c.next = c : (c.next = _.next, _.next = c), x.pending = c;
                    }
                  }
                  i.lanes |= n, c = i.alternate, c !== null && (c.lanes |= n), si(
                    i.return,
                    n,
                    t
                  ), u.lanes |= n;
                  break;
                }
                c = c.next;
              }
            } else if (i.tag === 10) s = i.type === t.type ? null : i.child;
            else if (i.tag === 18) {
              if (s = i.return, s === null) throw Error(d(341));
              s.lanes |= n, u = s.alternate, u !== null && (u.lanes |= n), si(s, n, t), s = i.sibling;
            } else s = i.child;
            if (s !== null) s.return = i;
            else for (s = i; s !== null; ) {
              if (s === t) {
                s = null;
                break;
              }
              if (i = s.sibling, i !== null) {
                i.return = s.return, s = i;
                break;
              }
              s = s.return;
            }
            i = s;
          }
          Je(e, t, l.children, n), t = t.child;
        }
        return t;
      case 9:
        return l = t.type, r = t.pendingProps.children, ur(t, n), l = wt(l), r = r(l), t.flags |= 1, Je(e, t, r, n), t.child;
      case 14:
        return r = t.type, l = Lt(r, t.pendingProps), l = Lt(r.type, l), nu(e, t, r, l, n);
      case 15:
        return ru(e, t, t.type, t.pendingProps, n);
      case 17:
        return r = t.type, l = t.pendingProps, l = t.elementType === r ? l : Lt(r, l), Yl(e, t), t.tag = 1, ot(r) ? (e = !0, zl(t)) : e = !1, ur(t, n), qa(t, r, l), Si(t, r, l, n), Ni(null, t, r, !0, e, n);
      case 19:
        return du(e, t, n);
      case 22:
        return lu(e, t, n);
    }
    throw Error(d(156, t.tag));
  };
  function Ou(e, t) {
    return ms(e, t);
  }
  function Fd(e, t, n, r) {
    this.tag = e, this.key = n, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.ref = null, this.pendingProps = t, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = r, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null;
  }
  function Ct(e, t, n, r) {
    return new Fd(e, t, n, r);
  }
  function Gi(e) {
    return e = e.prototype, !(!e || !e.isReactComponent);
  }
  function Ad(e) {
    if (typeof e == "function") return Gi(e) ? 1 : 0;
    if (e != null) {
      if (e = e.$$typeof, e === ft) return 11;
      if (e === pt) return 14;
    }
    return 2;
  }
  function wn(e, t) {
    var n = e.alternate;
    return n === null ? (n = Ct(e.tag, t, e.key, e.mode), n.elementType = e.elementType, n.type = e.type, n.stateNode = e.stateNode, n.alternate = e, e.alternate = n) : (n.pendingProps = t, n.type = e.type, n.flags = 0, n.subtreeFlags = 0, n.deletions = null), n.flags = e.flags & 14680064, n.childLanes = e.childLanes, n.lanes = e.lanes, n.child = e.child, n.memoizedProps = e.memoizedProps, n.memoizedState = e.memoizedState, n.updateQueue = e.updateQueue, t = e.dependencies, n.dependencies = t === null ? null : { lanes: t.lanes, firstContext: t.firstContext }, n.sibling = e.sibling, n.index = e.index, n.ref = e.ref, n;
  }
  function io(e, t, n, r, l, i) {
    var s = 2;
    if (r = e, typeof e == "function") Gi(e) && (s = 1);
    else if (typeof e == "string") s = 5;
    else e: switch (e) {
      case Ke:
        return An(n.children, l, i, t);
      case et:
        s = 8, l |= 8;
        break;
      case dt:
        return e = Ct(12, n, t, l | 2), e.elementType = dt, e.lanes = i, e;
      case Me:
        return e = Ct(13, n, t, l), e.elementType = Me, e.lanes = i, e;
      case Ee:
        return e = Ct(19, n, t, l), e.elementType = Ee, e.lanes = i, e;
      case ge:
        return so(n, l, i, t);
      default:
        if (typeof e == "object" && e !== null) switch (e.$$typeof) {
          case yt:
            s = 10;
            break e;
          case ne:
            s = 9;
            break e;
          case ft:
            s = 11;
            break e;
          case pt:
            s = 14;
            break e;
          case Ve:
            s = 16, r = null;
            break e;
        }
        throw Error(d(130, e == null ? e : typeof e, ""));
    }
    return t = Ct(s, n, t, l), t.elementType = e, t.type = r, t.lanes = i, t;
  }
  function An(e, t, n, r) {
    return e = Ct(7, e, r, t), e.lanes = n, e;
  }
  function so(e, t, n, r) {
    return e = Ct(22, e, r, t), e.elementType = ge, e.lanes = n, e.stateNode = { isHidden: !1 }, e;
  }
  function qi(e, t, n) {
    return e = Ct(6, e, null, t), e.lanes = n, e;
  }
  function Yi(e, t, n) {
    return t = Ct(4, e.children !== null ? e.children : [], e.key, t), t.lanes = n, t.stateNode = { containerInfo: e.containerInfo, pendingChildren: null, implementation: e.implementation }, t;
  }
  function Id(e, t, n, r, l) {
    this.tag = t, this.containerInfo = e, this.finishedWork = this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = -1, this.callbackNode = this.pendingContext = this.context = null, this.callbackPriority = 0, this.eventTimes = ko(0), this.expirationTimes = ko(-1), this.entangledLanes = this.finishedLanes = this.mutableReadLanes = this.expiredLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = ko(0), this.identifierPrefix = r, this.onRecoverableError = l, this.mutableSourceEagerHydrationData = null;
  }
  function Xi(e, t, n, r, l, i, s, u, c) {
    return e = new Id(e, t, n, u, c), t === 1 ? (t = 1, i === !0 && (t |= 8)) : t = 0, i = Ct(3, null, null, t), e.current = i, i.stateNode = e, i.memoizedState = { element: r, isDehydrated: n, cache: null, transitions: null, pendingSuspenseBoundaries: null }, ui(i), e;
  }
  function Ud(e, t, n) {
    var r = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
    return { $$typeof: $e, key: r == null ? null : "" + r, children: e, containerInfo: t, implementation: n };
  }
  function Fu(e) {
    if (!e) return fn;
    e = e._reactInternals;
    e: {
      if (_n(e) !== e || e.tag !== 1) throw Error(d(170));
      var t = e;
      do {
        switch (t.tag) {
          case 3:
            t = t.stateNode.context;
            break e;
          case 1:
            if (ot(t.type)) {
              t = t.stateNode.__reactInternalMemoizedMergedChildContext;
              break e;
            }
        }
        t = t.return;
      } while (t !== null);
      throw Error(d(171));
    }
    if (e.tag === 1) {
      var n = e.type;
      if (ot(n)) return ca(e, n, t);
    }
    return t;
  }
  function Au(e, t, n, r, l, i, s, u, c) {
    return e = Xi(n, r, !0, e, l, i, s, u, c), e.context = Fu(null), n = e.current, r = Ze(), l = xn(n), i = qt(r, l), i.callback = t ?? null, hn(n, i, l), e.current.lanes = l, kr(e, l, r), at(e, r), e;
  }
  function ao(e, t, n, r) {
    var l = t.current, i = Ze(), s = xn(l);
    return n = Fu(n), t.context === null ? t.context = n : t.pendingContext = n, t = qt(i, s), t.payload = { element: e }, r = r === void 0 ? null : r, r !== null && (t.callback = r), e = hn(l, t, s), e !== null && (Mt(e, l, s, i), Ul(e, l, s)), s;
  }
  function uo(e) {
    if (e = e.current, !e.child) return null;
    switch (e.child.tag) {
      case 5:
        return e.child.stateNode;
      default:
        return e.child.stateNode;
    }
  }
  function Iu(e, t) {
    if (e = e.memoizedState, e !== null && e.dehydrated !== null) {
      var n = e.retryLane;
      e.retryLane = n !== 0 && n < t ? n : t;
    }
  }
  function Ji(e, t) {
    Iu(e, t), (e = e.alternate) && Iu(e, t);
  }
  function $d() {
    return null;
  }
  var Uu = typeof reportError == "function" ? reportError : function(e) {
    console.error(e);
  };
  function Zi(e) {
    this._internalRoot = e;
  }
  co.prototype.render = Zi.prototype.render = function(e) {
    var t = this._internalRoot;
    if (t === null) throw Error(d(409));
    ao(e, t, null, null);
  }, co.prototype.unmount = Zi.prototype.unmount = function() {
    var e = this._internalRoot;
    if (e !== null) {
      this._internalRoot = null;
      var t = e.containerInfo;
      Dn(function() {
        ao(null, e, null, null);
      }), t[Ht] = null;
    }
  };
  function co(e) {
    this._internalRoot = e;
  }
  co.prototype.unstable_scheduleHydration = function(e) {
    if (e) {
      var t = ks();
      e = { blockedOn: null, target: e, priority: t };
      for (var n = 0; n < sn.length && t !== 0 && t < sn[n].priority; n++) ;
      sn.splice(n, 0, e), n === 0 && _s(e);
    }
  };
  function bi(e) {
    return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11);
  }
  function fo(e) {
    return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11 && (e.nodeType !== 8 || e.nodeValue !== " react-mount-point-unstable "));
  }
  function $u() {
  }
  function Vd(e, t, n, r, l) {
    if (l) {
      if (typeof r == "function") {
        var i = r;
        r = function() {
          var x = uo(s);
          i.call(x);
        };
      }
      var s = Au(t, r, e, 0, null, !1, !1, "", $u);
      return e._reactRootContainer = s, e[Ht] = s.current, Fr(e.nodeType === 8 ? e.parentNode : e), Dn(), s;
    }
    for (; l = e.lastChild; ) e.removeChild(l);
    if (typeof r == "function") {
      var u = r;
      r = function() {
        var x = uo(c);
        u.call(x);
      };
    }
    var c = Xi(e, 0, !1, null, null, !1, !1, "", $u);
    return e._reactRootContainer = c, e[Ht] = c.current, Fr(e.nodeType === 8 ? e.parentNode : e), Dn(function() {
      ao(t, c, n, r);
    }), c;
  }
  function po(e, t, n, r, l) {
    var i = n._reactRootContainer;
    if (i) {
      var s = i;
      if (typeof l == "function") {
        var u = l;
        l = function() {
          var c = uo(s);
          u.call(c);
        };
      }
      ao(t, s, e, l);
    } else s = Vd(n, t, e, l, r);
    return uo(s);
  }
  js = function(e) {
    switch (e.tag) {
      case 3:
        var t = e.stateNode;
        if (t.current.memoizedState.isDehydrated) {
          var n = wr(t.pendingLanes);
          n !== 0 && (So(t, n | 1), at(t, Le()), (ce & 6) === 0 && (mr = Le() + 500, pn()));
        }
        break;
      case 13:
        Dn(function() {
          var r = Gt(e, 1);
          if (r !== null) {
            var l = Ze();
            Mt(r, e, 1, l);
          }
        }), Ji(e, 1);
    }
  }, Co = function(e) {
    if (e.tag === 13) {
      var t = Gt(e, 134217728);
      if (t !== null) {
        var n = Ze();
        Mt(t, e, 134217728, n);
      }
      Ji(e, 134217728);
    }
  }, ws = function(e) {
    if (e.tag === 13) {
      var t = xn(e), n = Gt(e, t);
      if (n !== null) {
        var r = Ze();
        Mt(n, e, t, r);
      }
      Ji(e, t);
    }
  }, ks = function() {
    return ve;
  }, Ss = function(e, t) {
    var n = ve;
    try {
      return ve = e, t();
    } finally {
      ve = n;
    }
  }, Qn = function(e, t, n) {
    switch (t) {
      case "input":
        if (Un(e, n), t = n.name, n.type === "radio" && t != null) {
          for (n = e; n.parentNode; ) n = n.parentNode;
          for (n = n.querySelectorAll("input[name=" + JSON.stringify("" + t) + '][type="radio"]'), t = 0; t < n.length; t++) {
            var r = n[t];
            if (r !== e && r.form === e.form) {
              var l = Tl(r);
              if (!l) throw Error(d(90));
              ke(r), Un(r, l);
            }
          }
        }
        break;
      case "textarea":
        tt(e, n);
        break;
      case "select":
        t = n.value, t != null && bt(e, !!n.multiple, t, !1);
    }
  }, O = Wi, ue = Dn;
  var Bd = { usingClientEntryPoint: !1, Events: [Ur, tr, Tl, a, R, Wi] }, br = { findFiberByHostInstance: En, bundleType: 0, version: "18.3.1", rendererPackageName: "react-dom" }, Hd = { bundleType: br.bundleType, version: br.version, rendererPackageName: br.rendererPackageName, rendererConfig: br.rendererConfig, overrideHookState: null, overrideHookStateDeletePath: null, overrideHookStateRenamePath: null, overrideProps: null, overridePropsDeletePath: null, overridePropsRenamePath: null, setErrorHandler: null, setSuspenseHandler: null, scheduleUpdate: null, currentDispatcherRef: pe.ReactCurrentDispatcher, findHostInstanceByFiber: function(e) {
    return e = fs(e), e === null ? null : e.stateNode;
  }, findFiberByHostInstance: br.findFiberByHostInstance || $d, findHostInstancesForRefresh: null, scheduleRefresh: null, scheduleRoot: null, setRefreshHandler: null, getCurrentFiber: null, reconcilerVersion: "18.3.1-next-f1338f8080-20240426" };
  if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u") {
    var mo = __REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!mo.isDisabled && mo.supportsFiber) try {
      cl = mo.inject(Hd), Dt = mo;
    } catch {
    }
  }
  return ut.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = Bd, ut.createPortal = function(e, t) {
    var n = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
    if (!bi(t)) throw Error(d(200));
    return Ud(e, t, null, n);
  }, ut.createRoot = function(e, t) {
    if (!bi(e)) throw Error(d(299));
    var n = !1, r = "", l = Uu;
    return t != null && (t.unstable_strictMode === !0 && (n = !0), t.identifierPrefix !== void 0 && (r = t.identifierPrefix), t.onRecoverableError !== void 0 && (l = t.onRecoverableError)), t = Xi(e, 1, !1, null, null, n, !1, r, l), e[Ht] = t.current, Fr(e.nodeType === 8 ? e.parentNode : e), new Zi(t);
  }, ut.findDOMNode = function(e) {
    if (e == null) return null;
    if (e.nodeType === 1) return e;
    var t = e._reactInternals;
    if (t === void 0)
      throw typeof e.render == "function" ? Error(d(188)) : (e = Object.keys(e).join(","), Error(d(268, e)));
    return e = fs(t), e = e === null ? null : e.stateNode, e;
  }, ut.flushSync = function(e) {
    return Dn(e);
  }, ut.hydrate = function(e, t, n) {
    if (!fo(t)) throw Error(d(200));
    return po(null, e, t, !0, n);
  }, ut.hydrateRoot = function(e, t, n) {
    if (!bi(e)) throw Error(d(405));
    var r = n != null && n.hydratedSources || null, l = !1, i = "", s = Uu;
    if (n != null && (n.unstable_strictMode === !0 && (l = !0), n.identifierPrefix !== void 0 && (i = n.identifierPrefix), n.onRecoverableError !== void 0 && (s = n.onRecoverableError)), t = Au(t, null, e, 1, n ?? null, l, !1, i, s), e[Ht] = t.current, Fr(e), r) for (e = 0; e < r.length; e++) n = r[e], l = n._getVersion, l = l(n._source), t.mutableSourceEagerHydrationData == null ? t.mutableSourceEagerHydrationData = [n, l] : t.mutableSourceEagerHydrationData.push(
      n,
      l
    );
    return new co(t);
  }, ut.render = function(e, t, n) {
    if (!fo(t)) throw Error(d(200));
    return po(null, e, t, !1, n);
  }, ut.unmountComponentAtNode = function(e) {
    if (!fo(e)) throw Error(d(40));
    return e._reactRootContainer ? (Dn(function() {
      po(null, null, e, !1, function() {
        e._reactRootContainer = null, e[Ht] = null;
      });
    }), !0) : !1;
  }, ut.unstable_batchedUpdates = Wi, ut.unstable_renderSubtreeIntoContainer = function(e, t, n, r) {
    if (!fo(n)) throw Error(d(200));
    if (e == null || e._reactInternals === void 0) throw Error(d(38));
    return po(e, t, n, !1, r);
  }, ut.version = "18.3.1-next-f1338f8080-20240426", ut;
}
var qu;
function Jd() {
  if (qu) return ns.exports;
  qu = 1;
  function p() {
    if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"))
      try {
        __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(p);
      } catch (N) {
        console.error(N);
      }
  }
  return p(), ns.exports = Xd(), ns.exports;
}
var Yu;
function Zd() {
  if (Yu) return ho;
  Yu = 1;
  var p = Jd();
  return ho.createRoot = p.createRoot, ho.hydrateRoot = p.hydrateRoot, ho;
}
var bd = Zd(), Z = us();
const Xu = "/unificado/logistica/api", nl = ["velocidade", "aceleracao", "frenagem", "curva", "distracao", "distancia"], os = { velocidade: "Velocidade", aceleracao: "Aceleração", frenagem: "Frenagem", curva: "Curva", distracao: "Distração", distancia: "Distância insegura" }, ef = [["", "Início"], ["painel", "Painel Km/Evento"], ["correcoes", "Correções e exclusões"], ["fechamento", "Fechamento trimestral"], ["premiacao", "Premiação"], ["meses", "Meses e importação"], ["metas", "Metas"], ["motoristas", "Motoristas"], ["ajudantes", "Ajudantes"], ["mapeamento-cobli", "Mapeamento Cobli"], ["cadastros", "Cadastros"]], ee = (p, N = 0) => new Intl.NumberFormat("pt-BR", { maximumFractionDigits: N }).format(Number(p || 0)), vr = (p) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(p || 0)), ct = (p) => (/* @__PURE__ */ new Date(p.slice(0, 7) + "-15T12:00:00")).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
function vo() {
  return (/* @__PURE__ */ new Date()).toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" }).slice(0, 7);
}
function tl(p) {
  return p.slice(0, 4) + "-T" + Math.ceil(Number(p.slice(5, 7)) / 3);
}
async function le(p, N, d = "GET", j, v) {
  const P = new AbortController(), y = () => P.abort();
  v == null || v.addEventListener("abort", y, { once: !0 }), v != null && v.aborted && P.abort();
  const z = setTimeout(y, 3e4);
  try {
    const T = await fetch(Xu + p, {
      method: d,
      credentials: "same-origin",
      cache: "no-store",
      signal: P.signal,
      headers: { "X-Unidade": N, ...j instanceof FormData ? {} : { "Content-Type": "application/json" } },
      body: j === void 0 ? void 0 : j instanceof FormData ? j : JSON.stringify(j)
    });
    let F;
    try {
      F = await T.json();
    } catch (w) {
      throw P.signal.aborted ? w : Error("Resposta indisponível. Tente novamente.");
    }
    if (P.signal.aborted) throw new DOMException("Consulta cancelada.", "AbortError");
    if (!T.ok)
      throw T.status === 401 && location.assign("/unificado/login.html?next=" + encodeURIComponent(location.pathname + location.search)), Error(typeof F.detail == "string" ? F.detail : "Confira os campos informados.");
    return F;
  } catch (T) {
    throw P.signal.aborted && !(v != null && v.aborted) ? Error("A conexão demorou. Tente novamente.") : T;
  } finally {
    clearTimeout(z), v == null || v.removeEventListener("abort", y);
  }
}
async function is(p, N) {
  var P, y;
  const d = await fetch(Xu + p, { credentials: "same-origin", headers: { "X-Unidade": N } });
  if (!d.ok) throw Error("Não foi possível baixar o arquivo.");
  const j = URL.createObjectURL(await d.blob()), v = document.createElement("a");
  v.href = j, v.download = ((y = (P = d.headers.get("Content-Disposition")) == null ? void 0 : P.match(/filename="?([^";]+)/)) == null ? void 0 : y[1]) || "relatorio.csv", v.click(), setTimeout(() => URL.revokeObjectURL(j), 500);
}
const Ju = [
  ["painel", "Painel Km/Evento", "Indicadores, evolução e ranking", "logisticaPainel", "Km/Evento"],
  ["correcoes", "Correções e exclusões", "Falsos alarmes e exclusões por mês", "logisticaCorrecoes", "Km/Evento"],
  ["fechamento", "Fechamento trimestral", "Conferência dos três meses", "logisticaFechamento", "Km/Evento"],
  ["premiacao", "Premiação", "Avaliações e classificação oficial · restrito", "logisticaPremiacao", "Km/Evento"],
  ["meses", "Meses e importação", "Relatório geral e fechamento mensal", "logisticaMeses", "Km/Evento"],
  ["metas", "Metas", "Planejamento por trimestre e unidade", "logisticaMetas", "Km/Evento"],
  ["motoristas", "Motoristas", "Unidade, participação e vínculo Cobli", "logisticaMotoristas", "Cadastros"],
  ["ajudantes", "Ajudantes", "Cadastro de pessoas e unidades", "logisticaAjudantes", "Cadastros"],
  ["mapeamento-cobli", "Mapeamento Cobli", "Grupos, unidades e pendências", "logisticaCobli", "Cadastros"]
];
function tf({ ctx: p, go: N, search: d, setSearch: j }) {
  const v = Ju.filter((P) => p.screens.includes(P[3]));
  return /* @__PURE__ */ o.jsxs(o.Fragment, { children: [
    /* @__PURE__ */ o.jsxs("section", { className: "lg-home-intro", children: [
      /* @__PURE__ */ o.jsx("h2", { children: "Acesso rápido" }),
      /* @__PURE__ */ o.jsx("p", { children: "Encontre uma ferramenta ou navegue pelas seções da Logística." }),
      /* @__PURE__ */ o.jsxs("label", { children: [
        "Buscar tela",
        /* @__PURE__ */ o.jsx("input", { type: "search", "aria-label": "Buscar tela na Logística", placeholder: "Nome da tela ou atividade", value: d, onChange: (P) => j(P.target.value) })
      ] })
    ] }),
    ["Km/Evento", "Cadastros"].map((P) => {
      const y = v.filter((z) => z[4] === P && (z[1] + " " + z[2]).toLocaleLowerCase().includes(d.toLocaleLowerCase()));
      return y.length > 0 && /* @__PURE__ */ o.jsxs("section", { className: "lg-home-section", children: [
        /* @__PURE__ */ o.jsx("h2", { children: P }),
        /* @__PURE__ */ o.jsx("div", { className: "lg-tools", children: y.map(([z, T, F, w]) => /* @__PURE__ */ o.jsxs("button", { className: "lg-tool", onClick: () => N(z), children: [
          /* @__PURE__ */ o.jsx("strong", { children: T }),
          /* @__PURE__ */ o.jsx("small", { children: F }),
          z === "premiacao" && /* @__PURE__ */ o.jsx("span", { className: "lg-badge", children: "Acesso restrito" })
        ] }, w)) })
      ] }, P);
    }),
    !v.some((P) => (P[1] + " " + P[2]).toLocaleLowerCase().includes(d.toLocaleLowerCase())) && /* @__PURE__ */ o.jsx("p", { className: "lg-empty", children: "Nenhuma tela encontrada." })
  ] });
}
function nf({ data: p, canEdit: N, busy: d, unit: j, run: v, refresh: P }) {
  const [y, z] = Z.useState(null);
  Z.useEffect(() => z(null), [j, P, p.ano]);
  const T = Array.from(new Set(p.rows.map((F) => F.trimestre)));
  return /* @__PURE__ */ o.jsxs(o.Fragment, { children: [
    /* @__PURE__ */ o.jsx("p", { className: "lg-alert", children: "Padrões por trimestre: 250 / 320 / 380 / 450 km/evento. Meses já fechados e exceções históricas são preservados. O próximo ano também pode ser planejado." }),
    T.map((F) => {
      var se;
      const w = p.rows.filter((K) => K.trimestre === F), k = (se = p.trimestres) == null ? void 0 : se.find((K) => K.trimestre === F), B = w.every((K) => K.fechado);
      return /* @__PURE__ */ o.jsxs("section", { className: "lg-card lg-quarter-target", "aria-label": "Metas " + F, children: [
        /* @__PURE__ */ o.jsxs("div", { className: "lg-card-head", children: [
          /* @__PURE__ */ o.jsxs("h3", { children: [
            F.slice(-1),
            "º trimestre / ",
            F.slice(0, 4)
          ] }),
          /* @__PURE__ */ o.jsx("span", { className: "lg-badge " + (B ? "good" : "warn"), children: B ? "Encerrado · somente leitura" : "Planejamento disponível" })
        ] }),
        /* @__PURE__ */ o.jsxs("form", { onSubmit: (K) => {
          K.preventDefault();
          const X = new FormData(K.currentTarget);
          v(() => le("/trimestres/" + F + "/metas", j, "PUT", { versao_trimestre: k == null ? void 0 : k.versao, motivo: X.get("motivo"), rows: w.map((te) => ({ unidade_id: te.unidade_id, versao: te.versao, meta: Number(X.get("meta_" + te.unidade_id)) })) }), "Metas do trimestre salvas. Meses fechados preservados.");
        }, children: [
          /* @__PURE__ */ o.jsx("div", { className: "lg-table-wrap", children: /* @__PURE__ */ o.jsxs("table", { children: [
            /* @__PURE__ */ o.jsx("thead", { children: /* @__PURE__ */ o.jsxs("tr", { children: [
              /* @__PURE__ */ o.jsx("th", { children: "Unidade" }),
              /* @__PURE__ */ o.jsx("th", { children: "Padrão" }),
              /* @__PURE__ */ o.jsx("th", { children: "Meta planejada" }),
              /* @__PURE__ */ o.jsx("th", { children: "Metas mensais preservadas" })
            ] }) }),
            /* @__PURE__ */ o.jsx("tbody", { children: w.map((K) => /* @__PURE__ */ o.jsxs("tr", { children: [
              /* @__PURE__ */ o.jsx("td", { children: K.unidade }),
              /* @__PURE__ */ o.jsx("td", { children: ee(K.padrao) }),
              /* @__PURE__ */ o.jsx("td", { children: /* @__PURE__ */ o.jsx("input", { "aria-label": "Meta " + K.unidade + " " + F, name: "meta_" + K.unidade_id, type: "number", min: "1", max: "10000000", step: "1", defaultValue: K.override ?? K.padrao, required: !0, disabled: d || B || !N }) }),
              /* @__PURE__ */ o.jsxs("td", { children: [
                K.meses.length ? K.meses.map((X) => /* @__PURE__ */ o.jsxs("small", { children: [
                  ct(X.competencia),
                  ": ",
                  ee(X.meta),
                  " ",
                  X.status === "fechado" ? "· congelada" : ""
                ] }, X.competencia)) : "Sem importação ainda",
                K.excecoes.length > 0 && /* @__PURE__ */ o.jsx("small", { className: "lg-attention", children: "Exceções históricas preservadas" })
              ] })
            ] }, K.unidade_id)) })
          ] }) }),
          N && !B && /* @__PURE__ */ o.jsxs(o.Fragment, { children: [
            /* @__PURE__ */ o.jsxs("label", { children: [
              "Motivo do ajuste",
              /* @__PURE__ */ o.jsx("input", { name: "motivo", required: !0, maxLength: 1e3, placeholder: "Descreva o planejamento ou revisão" })
            ] }),
            /* @__PURE__ */ o.jsx("button", { className: "primary", disabled: d || !!y, children: "Salvar metas do trimestre" })
          ] })
        ] }, P + "-" + j + "-" + F),
        /* @__PURE__ */ o.jsxs("footer", { className: "lg-quarter-controls", children: [
          /* @__PURE__ */ o.jsx("small", { children: "Controle das metas do trimestre em todas as unidades. Meses fechados e premiações aprovadas permanecem preservados. Somente administradores podem reabrir ou fechar." }),
          /* @__PURE__ */ o.jsxs("div", { className: "lg-actions", children: [
            /* @__PURE__ */ o.jsx("button", { type: "button", disabled: d || !p.pode_gerenciar_trimestres || !B || !!y, onClick: () => z({ t: F, action: "reabrir", versao: k == null ? void 0 : k.versao }), children: "Reabrir trimestre" }),
            /* @__PURE__ */ o.jsx("button", { type: "button", className: "lg-quarter-close", disabled: d || !p.pode_gerenciar_trimestres || B || !!y, onClick: () => z({ t: F, action: "fechar", versao: k == null ? void 0 : k.versao }), children: "Fechar trimestre" })
          ] }),
          (y == null ? void 0 : y.t) === F && /* @__PURE__ */ o.jsxs("form", { className: "lg-quarter-confirm", onSubmit: (K) => {
            K.preventDefault();
            const X = new FormData(K.currentTarget).get("motivo");
            v(async () => {
              await le("/trimestres/" + F + "/metas/" + y.action, j, "POST", { versao: y.versao, motivo: X }), z(null);
            }, y.action === "fechar" ? "Trimestre fechado. Metas bloqueadas para edição." : "Trimestre reaberto para edição das metas.");
          }, children: [
            /* @__PURE__ */ o.jsxs("h4", { children: [
              y.action === "fechar" ? "Fechar" : "Reabrir",
              " ",
              F
            ] }),
            /* @__PURE__ */ o.jsxs("p", { children: [
              y.action === "fechar" ? "As metas deste trimestre ficarão somente leitura em todas as unidades." : "As metas deste trimestre poderão ser ajustadas novamente. Meses já fechados continuarão congelados.",
              " A ação ficará registrada no histórico."
            ] }),
            /* @__PURE__ */ o.jsxs("label", { children: [
              "Motivo ",
              y.action === "fechar" ? "do fechamento" : "da reabertura",
              /* @__PURE__ */ o.jsx("textarea", { name: "motivo", required: !0, maxLength: 1e3, autoFocus: !0, disabled: d })
            ] }),
            /* @__PURE__ */ o.jsxs("div", { className: "lg-actions", children: [
              /* @__PURE__ */ o.jsx("button", { type: "button", disabled: d, onClick: () => z(null), children: "Cancelar" }),
              /* @__PURE__ */ o.jsx("button", { className: "primary", disabled: d, children: y.action === "fechar" ? "Confirmar fechamento do trimestre" : "Confirmar reabertura do trimestre" })
            ] })
          ] })
        ] })
      ] }, F);
    })
  ] });
}
function rf({ data: p }) {
  var N;
  return p.status !== "aprovada" && /* @__PURE__ */ o.jsxs("section", { className: "lg-card", children: [
    /* @__PURE__ */ o.jsx("h3", { children: "O que falta para aprovar" }),
    (N = p.pendencias) != null && N.length ? /* @__PURE__ */ o.jsx("div", { className: "lg-people", children: p.pendencias.map((d) => /* @__PURE__ */ o.jsxs("article", { children: [
      /* @__PURE__ */ o.jsxs("strong", { children: [
        ct(d.competencia),
        " · ",
        d.unidade
      ] }),
      /* @__PURE__ */ o.jsx("span", { className: "lg-badge warn", children: d.status === "sem_dados" ? "Importar dados" : "Conferir e fechar mês" })
    ] }, d.unidade_id + d.competencia)) }) : /* @__PURE__ */ o.jsx("p", { children: "Os meses das unidades exibidas estão fechados." }),
    !p.parametros.confirmado && /* @__PURE__ */ o.jsx("p", { className: "lg-alert warn", children: "Conferir e salvar os parâmetros do trimestre." }),
    !p.pode_aprovar && /* @__PURE__ */ o.jsx("p", { className: "lg-alert warn", children: "A aprovação exige Todas e acesso ao consolidado completo." })
  ] });
}
function lf({ rows: p, pending: N, canEdit: d, busy: j, onEdit: v, onNew: P }) {
  return /* @__PURE__ */ o.jsxs(o.Fragment, { children: [
    /* @__PURE__ */ o.jsxs("section", { className: "lg-card", children: [
      /* @__PURE__ */ o.jsx("h3", { children: "Grupo Cobli → unidade" }),
      /* @__PURE__ */ o.jsx("div", { className: "lg-table-wrap", children: /* @__PURE__ */ o.jsxs("table", { children: [
        /* @__PURE__ */ o.jsx("thead", { children: /* @__PURE__ */ o.jsxs("tr", { children: [
          /* @__PURE__ */ o.jsx("th", { children: "Grupo no relatório" }),
          /* @__PURE__ */ o.jsx("th", { children: "Unidade" }),
          /* @__PURE__ */ o.jsx("th", { children: "Situação" }),
          /* @__PURE__ */ o.jsx("th", { children: "Ação" })
        ] }) }),
        /* @__PURE__ */ o.jsx("tbody", { children: p.map((y) => /* @__PURE__ */ o.jsxs("tr", { children: [
          /* @__PURE__ */ o.jsx("td", { children: y.grupo }),
          /* @__PURE__ */ o.jsx("td", { children: y.unidade }),
          /* @__PURE__ */ o.jsx("td", { children: y.ativo ? "Ativo" : "Inativo" }),
          /* @__PURE__ */ o.jsx("td", { children: /* @__PURE__ */ o.jsx("button", { disabled: !d || j, onClick: () => v(y), children: "Editar mapeamento" }) })
        ] }, y.id)) })
      ] }) })
    ] }),
    /* @__PURE__ */ o.jsxs("section", { className: "lg-card", children: [
      /* @__PURE__ */ o.jsx("h3", { children: "Grupos sem mapeamento" }),
      /* @__PURE__ */ o.jsx("p", { children: "Linhas desses grupos não entram na produção dos indicadores. Motoristas com unidade fixada manualmente mantêm seu vínculo." }),
      N.length ? N.map((y) => /* @__PURE__ */ o.jsxs("div", { className: "lg-alert warn", children: [
        /* @__PURE__ */ o.jsx("strong", { children: y.grupo }),
        " · Sem mapeamento ",
        /* @__PURE__ */ o.jsx("button", { className: "lg-map-pending", disabled: !d || j, onClick: () => P(y.grupo), children: "Vincular unidade" })
      ] }, y.grupo)) : /* @__PURE__ */ o.jsx("p", { children: "Nenhum grupo pendente identificado nas importações disponíveis." })
    ] })
  ] });
}
function of({ unit: p }) {
  const [N, d] = Z.useState(null);
  return Z.useEffect(() => {
    let j = !0;
    return le("/migracoes", p).then((v) => {
      var P;
      j && d((P = v.rows.find((y) => y.origem === "backup_localstorage_2026-11-13.json")) == null ? void 0 : P.resultado);
    }).catch(() => {
    }), () => {
      j = !1;
    };
  }, [p]), N && /* @__PURE__ */ o.jsxs("section", { className: "lg-card", children: [
    /* @__PURE__ */ o.jsx("h3", { children: "Backup v7 · carga conciliada" }),
    /* @__PURE__ */ o.jsx("p", { children: "Dados recuperados com auditoria. Fechamentos existentes preservados; nenhuma aprovação financeira automática." }),
    /* @__PURE__ */ o.jsx("div", { className: "lg-mini-kpis", children: [["Competências por unidade recuperadas", N.meses_recuperados], ["Registros recuperados", N.registros_novos], ["Registros existentes preservados", N.registros_existentes_preservados], ["Avaliações de motoristas", N.avaliacoes_motoristas], ["Conflitos para revisão", N.conflitos_para_revisao]].map(([j, v]) => /* @__PURE__ */ o.jsxs("span", { children: [
      j,
      ": ",
      /* @__PURE__ */ o.jsx("b", { children: v })
    ] }, j)) }),
    /* @__PURE__ */ o.jsx("p", { children: "O backup fornecido não contém cadastro nem avaliações de ajudantes. Inclua os ajudantes em Cadastros → Ajudantes e lance as notas reais na Premiação." })
  ] });
}
function sf({ value: p, busy: N, confirm: d, cancel: j }) {
  var T, F;
  const v = p.importacoes || [], P = (w, k) => w.linhas.filter((B) => B.decisao === k).length, y = v.some((w) => P(w, "erro") > 0), z = v.some((w) => w.status === "previa" && P(w, "aceita") > 0);
  return /* @__PURE__ */ o.jsxs(o.Fragment, { children: [
    /* @__PURE__ */ o.jsx("strong", { children: p.nome_arquivo }),
    /* @__PURE__ */ o.jsxs("p", { children: [
      "Arquivo geral · ",
      p.periodo_inicio,
      " a ",
      p.periodo_fim
    ] }),
    /* @__PURE__ */ o.jsx("p", { children: "Confira cada unidade abaixo. Uma confirmação grava as unidades abertas. Meses fechados mostram diferenças e permanecem preservados." }),
    v.map((w) => /* @__PURE__ */ o.jsxs("details", { className: "lg-card", open: !0, children: [
      /* @__PURE__ */ o.jsxs("summary", { children: [
        /* @__PURE__ */ o.jsx("strong", { children: w.unidade }),
        " · ",
        P(w, "aceita"),
        " válidos · ",
        P(w, "remocao"),
        " remoções · ",
        w.status === "diferenca" ? "Mês fechado · somente diferenças" : w.status === "confirmada" ? "Já confirmada" : "Aguardando confirmação"
      ] }),
      /* @__PURE__ */ o.jsxs("div", { className: "lg-mini-kpis", children: [
        /* @__PURE__ */ o.jsxs("span", { children: [
          w.linhas.filter((k) => k.novo).length,
          " novos"
        ] }),
        /* @__PURE__ */ o.jsxs("span", { children: [
          P(w, "erro"),
          " erros"
        ] })
      ] }),
      w.status === "diferenca" && /* @__PURE__ */ o.jsx("p", { className: "lg-alert warn", children: "Os números fechados desta unidade não serão sobrescritos." }),
      /* @__PURE__ */ o.jsx("div", { className: "lg-preview-lines", children: w.linhas.map((k, B) => /* @__PURE__ */ o.jsxs("article", { children: [
        /* @__PURE__ */ o.jsxs("b", { children: [
          "Linha ",
          k.linha,
          " · ",
          k.nome || "Fora do escopo"
        ] }),
        /* @__PURE__ */ o.jsxs("small", { children: [
          k.decisao,
          " ",
          k.novo ? "· novo motorista" : "",
          " · ",
          k.motivo || `${ee(k.km, 1)} km`
        ] }),
        k.diferenca_km !== void 0 && /* @__PURE__ */ o.jsxs("small", { children: [
          "Diferença: ",
          ee(k.diferenca_km, 2),
          " km · eventos ",
          JSON.stringify(k.diferenca_eventos)
        ] })
      ] }, B)) })
    ] }, w.id)),
    ((T = p.ignoradas) == null ? void 0 : T.length) > 0 && /* @__PURE__ */ o.jsxs("details", { children: [
      /* @__PURE__ */ o.jsxs("summary", { children: [
        p.ignoradas.length,
        " linhas não importadas"
      ] }),
      p.ignoradas.map((w, k) => /* @__PURE__ */ o.jsxs("p", { children: [
        "Linha ",
        w.linha,
        ": ",
        w.motivo
      ] }, k))
    ] }),
    (F = p.sem_alteracao) == null ? void 0 : F.map((w) => /* @__PURE__ */ o.jsxs("p", { children: [
      w.unidade,
      ": ",
      w.motivo
    ] }, w.unidade_id)),
    y && /* @__PURE__ */ o.jsx("p", { className: "lg-alert bad", children: "Resolva os erros antes de confirmar o arquivo geral." }),
    /* @__PURE__ */ o.jsxs("div", { className: "lg-actions", children: [
      /* @__PURE__ */ o.jsx("button", { disabled: N, onClick: j, children: "Cancelar prévias" }),
      /* @__PURE__ */ o.jsx("button", { className: "primary", disabled: N || y || !z, onClick: d, children: "Confirmar unidades abertas" })
    ] })
  ] });
}
const ss = ["#245582", "#a74867", "#25845f", "#b68a13"];
function af({ data: p }) {
  const N = [["Km/Evento", ee(p.taxa, 2), `${ee(p.percentual, 1)}% da meta`], ["Meta do período", ee(p.meta), "Km por evento"], ["Eventos corrigidos", ee(p.eventos), `${ee(p.correcoes)} falsos alarmes descontados`], ["Km total", ee(p.km), "Motoristas incluídos"], ["Acima da meta", `${p.na_meta} / ${p.motoristas}`, "Meta da própria unidade"]];
  return /* @__PURE__ */ o.jsx("div", { className: "lg-kpis five", children: N.map(([d, j, v]) => /* @__PURE__ */ o.jsxs("article", { children: [
    /* @__PURE__ */ o.jsx("span", { children: d }),
    /* @__PURE__ */ o.jsx("strong", { children: j }),
    /* @__PURE__ */ o.jsx("small", { children: v })
  ] }, d)) });
}
function uf({ u: p }) {
  var j;
  const N = p.taxa >= p.meta, d = p.trimestre;
  return /* @__PURE__ */ o.jsxs("article", { className: "lg-card lg-unit", children: [
    /* @__PURE__ */ o.jsxs("div", { className: "lg-card-head", children: [
      /* @__PURE__ */ o.jsx("strong", { children: p.nome }),
      /* @__PURE__ */ o.jsx("span", { className: "lg-badge " + (N ? "good" : "bad"), children: N ? "▲ Acima" : "▼ Abaixo" })
    ] }),
    /* @__PURE__ */ o.jsxs("p", { className: "lg-rate", children: [
      ee(p.taxa, 2),
      " ",
      /* @__PURE__ */ o.jsx("small", { children: "km/evento" })
    ] }),
    /* @__PURE__ */ o.jsxs("div", { className: "lg-unit-facts", children: [
      /* @__PURE__ */ o.jsxs("span", { children: [
        "Meta ",
        /* @__PURE__ */ o.jsx("b", { children: ee(p.meta) })
      ] }),
      /* @__PURE__ */ o.jsxs("span", { children: [
        "Eventos ",
        /* @__PURE__ */ o.jsx("b", { children: ee(p.eventos) })
      ] }),
      /* @__PURE__ */ o.jsxs("span", { children: [
        "Km ",
        /* @__PURE__ */ o.jsx("b", { children: ee(p.km) })
      ] })
    ] }),
    /* @__PURE__ */ o.jsxs("div", { className: "lg-meta-track", role: "img", "aria-label": `${ee(p.taxa / p.meta * 100)}% da meta`, children: [
      /* @__PURE__ */ o.jsx("i", { style: { width: Math.min(100, p.taxa / (p.meta * 3) * 100) + "%" } }),
      /* @__PURE__ */ o.jsx("b", {})
    ] }),
    /* @__PURE__ */ o.jsxs("small", { className: N ? "lg-good" : "lg-bad", children: [
      (p.taxa / p.meta).toFixed(1).replace(".", ","),
      "x ",
      N ? "acima" : "abaixo",
      " da meta · ",
      ee(p.taxa / p.meta * 100),
      "%"
    ] }),
    /* @__PURE__ */ o.jsx("div", { className: "lg-month-grid", children: (j = p.historico) == null ? void 0 : j.map((v) => /* @__PURE__ */ o.jsxs("div", { children: [
      /* @__PURE__ */ o.jsx("small", { children: ct(v.competencia) }),
      /* @__PURE__ */ o.jsx("b", { children: ee(v.taxa, 2) }),
      /* @__PURE__ */ o.jsx("small", { className: v.acima ? "lg-good" : "lg-bad", children: v.acima ? "▲ acima" : "▼ abaixo" })
    ] }, v.competencia)) }),
    (d == null ? void 0 : d.mostrar) && /* @__PURE__ */ o.jsxs("div", { className: "lg-unit-quarter", children: [
      /* @__PURE__ */ o.jsx("small", { children: "Trimestre · acumulado real" }),
      /* @__PURE__ */ o.jsxs("strong", { children: [
        ee(d.taxa, 2),
        " km/evento"
      ] }),
      /* @__PURE__ */ o.jsxs("small", { children: [
        ee(d.km),
        " km / ",
        ee(d.eventos),
        " eventos · meta ",
        ee(d.meta)
      ] }),
      /* @__PURE__ */ o.jsx("span", { className: "lg-badge " + (d.taxa >= d.meta ? "good" : "bad"), children: d.taxa >= d.meta ? "Meta atingida" : "Meta não atingida" })
    ] })
  ] });
}
function cf({ rows: p, unit: N }) {
  var w;
  const [d, j] = Z.useState([]), v = N === "todas", P = ((w = p[0]) == null ? void 0 : w.unidades) || [], y = [...v ? [{ key: "geral", label: "Geral", color: "#122b4c", values: p.map((k) => k.taxa) }] : [], ...P.map((k, B) => ({ key: k.codigo, label: k.nome, color: ss[B % 4], values: p.map((se) => {
    var K;
    return ((K = se.unidades.find((X) => X.codigo === k.codigo)) == null ? void 0 : K.taxa) ?? null;
  }) })), { key: "meta", label: "Meta", color: "#e78224", values: p.map((k) => k.meta) }], z = Math.max(1, ...y.flatMap((k) => k.values).filter((k) => k !== null)), T = (k) => 35 + k * 550 / Math.max(1, p.length - 1), F = (k) => 175 - k / z * 145;
  return /* @__PURE__ */ o.jsxs("section", { className: "lg-card", children: [
    /* @__PURE__ */ o.jsx("h3", { children: "Km/Evento · evolução mensal" }),
    /* @__PURE__ */ o.jsx("div", { className: "lg-series", children: y.map((k) => /* @__PURE__ */ o.jsxs("button", { "aria-pressed": !d.includes(k.key), onClick: () => j(d.includes(k.key) ? d.filter((B) => B !== k.key) : [...d, k.key]), children: [
      /* @__PURE__ */ o.jsx("i", { style: { background: k.color } }),
      k.label
    ] }, k.key)) }),
    p.length ? /* @__PURE__ */ o.jsxs("svg", { viewBox: "0 0 620 225", role: "img", "aria-label": "Evolução por unidade e meta", children: [
      /* @__PURE__ */ o.jsx("line", { x1: "35", x2: "585", y1: "175", y2: "175", stroke: "#cbd5e1" }),
      y.filter((k) => !d.includes(k.key)).map((k) => {
        const B = [];
        let se = [];
        return k.values.forEach((K, X) => {
          K === null ? (se.length && B.push(se), se = []) : se.push(X);
        }), se.length && B.push(se), /* @__PURE__ */ o.jsxs("g", { children: [
          B.map((K, X) => /* @__PURE__ */ o.jsx("polyline", { points: K.map((te) => `${T(te)},${F(k.values[te])}`).join(" "), fill: "none", stroke: k.color, strokeWidth: k.key === "geral" ? 3 : 2, strokeDasharray: k.key === "meta" ? "6 4" : void 0 }, X)),
          k.values.map((K, X) => K === null ? null : /* @__PURE__ */ o.jsx("circle", { cx: T(X), cy: F(K), r: k.key === "meta" ? 0 : 3, fill: k.color, children: /* @__PURE__ */ o.jsxs("title", { children: [
            k.label,
            " · ",
            ct(p[X].competencia),
            ": ",
            ee(K, 2)
          ] }) }, X))
        ] }, k.key);
      }),
      p.map((k, B) => /* @__PURE__ */ o.jsx("text", { x: T(B), y: "200", textAnchor: "middle", fontSize: "9", children: ct(k.competencia) }, k.competencia))
    ] }) : /* @__PURE__ */ o.jsx("p", { children: "Nenhum mês importado." })
  ] });
}
function df({ units: p }) {
  const N = p.reduce((j, v) => j + v.eventos, 0);
  let d = 0;
  return /* @__PURE__ */ o.jsxs("section", { className: "lg-card", children: [
    /* @__PURE__ */ o.jsx("h3", { children: "Eventos corrigidos por unidade" }),
    /* @__PURE__ */ o.jsx("p", { children: "Eventos restantes após as correções" }),
    /* @__PURE__ */ o.jsxs("div", { className: "lg-donut-layout", children: [
      /* @__PURE__ */ o.jsxs("svg", { viewBox: "0 0 160 160", role: "img", "aria-label": `${N} eventos líquidos por unidade`, children: [
        /* @__PURE__ */ o.jsx("circle", { cx: "80", cy: "80", r: "55", fill: "none", stroke: "#edf2f7", strokeWidth: "26" }),
        p.map((j, v) => {
          const P = N ? j.eventos / N * 345.575 : 0, y = d;
          return d += P, /* @__PURE__ */ o.jsx("circle", { cx: "80", cy: "80", r: "55", fill: "none", stroke: ss[v % 4], strokeWidth: "26", strokeDasharray: `${P} ${345.575 - P}`, strokeDashoffset: -y, transform: "rotate(-90 80 80)", children: /* @__PURE__ */ o.jsxs("title", { children: [
            j.nome,
            ": ",
            j.eventos
          ] }) }, j.id);
        }),
        /* @__PURE__ */ o.jsx("text", { x: "80", y: "80", textAnchor: "middle", fontSize: "24", fontWeight: "700", children: ee(N) }),
        /* @__PURE__ */ o.jsx("text", { x: "80", y: "99", textAnchor: "middle", fontSize: "10", children: "eventos" })
      ] }),
      /* @__PURE__ */ o.jsx("div", { children: p.map((j, v) => /* @__PURE__ */ o.jsxs("p", { children: [
        /* @__PURE__ */ o.jsx("i", { style: { background: ss[v % 4] } }),
        j.nome,
        " ",
        /* @__PURE__ */ o.jsx("b", { children: ee(j.eventos) })
      ] }, j.id)) })
    ] })
  ] });
}
function ff({ rows: p, tri: N }) {
  const [d, j] = Z.useState({ col: "media", dir: "desc" }), v = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"], P = (Number(N.slice(-1)) - 1) * 3, y = [["nome", "Motorista"], ["unidade", "Unidade"], ...[0, 1, 2].map((w) => ["m" + w, v[P + w]]), ["media", "Média trimestre"], ["n", "Meses"]], z = (w) => j({ col: w, dir: d.col === w ? d.dir === "asc" ? "desc" : "asc" : ["nome", "unidade"].includes(w) ? "asc" : "desc" }), T = (w) => d.col.startsWith("m") && d.col !== "media" ? w.vals[Number(d.col.slice(1))] ?? -1 / 0 : w[d.col], F = [...p].sort((w, k) => {
    const B = T(w), se = T(k), K = typeof B == "string" ? B.localeCompare(se, "pt-BR") : B === se ? 0 : B > se ? 1 : -1;
    return d.dir === "asc" ? K : -K;
  });
  return /* @__PURE__ */ o.jsxs(o.Fragment, { children: [
    /* @__PURE__ */ o.jsxs("div", { className: "lg-sort-mobile", children: [
      /* @__PURE__ */ o.jsxs("label", { children: [
        "Ordenar por",
        /* @__PURE__ */ o.jsx("select", { value: d.col, onChange: (w) => z(w.target.value), children: y.map(([w, k]) => /* @__PURE__ */ o.jsx("option", { value: w, children: k }, w)) })
      ] }),
      /* @__PURE__ */ o.jsx("button", { onClick: () => z(d.col), children: d.dir === "asc" ? "↑ Crescente" : "↓ Decrescente" })
    ] }),
    /* @__PURE__ */ o.jsx("div", { className: "lg-table-wrap", children: /* @__PURE__ */ o.jsxs("table", { className: "lg-quarter-table", children: [
      /* @__PURE__ */ o.jsx("thead", { children: /* @__PURE__ */ o.jsx("tr", { children: y.map(([w, k]) => /* @__PURE__ */ o.jsx("th", { "aria-sort": d.col === w ? d.dir === "asc" ? "ascending" : "descending" : "none", children: /* @__PURE__ */ o.jsxs("button", { className: "lg-sort", onClick: () => z(w), children: [
        k,
        d.col === w ? d.dir === "asc" ? " ▲" : " ▼" : ""
      ] }) }, w)) }) }),
      /* @__PURE__ */ o.jsx("tbody", { children: F.map((w) => /* @__PURE__ */ o.jsxs("tr", { children: [
        /* @__PURE__ */ o.jsx("td", { "data-label": "Motorista", children: /* @__PURE__ */ o.jsx("strong", { children: w.nome }) }),
        /* @__PURE__ */ o.jsx("td", { "data-label": "Unidade", children: w.unidade }),
        w.vals.map((k, B) => /* @__PURE__ */ o.jsx("td", { "data-label": v[P + B], children: k === null ? "—" : ee(k, 2) }, B)),
        /* @__PURE__ */ o.jsx("td", { "data-label": "Média trimestre", children: /* @__PURE__ */ o.jsx("b", { children: ee(w.media, 2) }) }),
        /* @__PURE__ */ o.jsxs("td", { "data-label": "Meses", children: [
          w.n,
          "/3 meses"
        ] })
      ] }, w.motorista_id)) })
    ] }) })
  ] });
}
function pf({ data: p, search: N, busy: d, onNote: j, onParticipation: v }) {
  const P = p.parametros;
  return /* @__PURE__ */ o.jsxs("section", { className: "lg-card", children: [
    /* @__PURE__ */ o.jsx("h3", { children: "Motoristas · classificação oficial geral" }),
    /* @__PURE__ */ o.jsx("p", { children: "Pontos decrescentes; desempate pela maior média mensal de km/evento do trimestre." }),
    /* @__PURE__ */ o.jsx("div", { className: "lg-table-wrap", children: /* @__PURE__ */ o.jsxs("table", { children: [
      /* @__PURE__ */ o.jsx("thead", { children: /* @__PURE__ */ o.jsx("tr", { children: ["Pos.", "Motorista", "Participa", "Unidade", "Média km/ev", `Cobli ×${P.pesos.cobli}`, `Sinistro −${P.pesos.sinistro}`, `Multa −${P.pesos.multa}`, `Manobras ×${P.pesos.manobras}`, `Check List ×${P.pesos.checklist}`, "Pontos", "Prêmio", "Ações"].map((y) => /* @__PURE__ */ o.jsx("th", { children: y }, y)) }) }),
      /* @__PURE__ */ o.jsx("tbody", { children: p.motoristas.filter((y) => y.nome.toLowerCase().includes(N.toLowerCase())).map((y) => {
        var z, T, F;
        return /* @__PURE__ */ o.jsxs("tr", { className: y.participa ? "" : "lg-not-participating", children: [
          /* @__PURE__ */ o.jsx("td", { "data-label": "Posição", children: y.posicao ? y.posicao + "º" : "—" }),
          /* @__PURE__ */ o.jsx("td", { "data-label": "Motorista", children: /* @__PURE__ */ o.jsx("strong", { children: y.nome }) }),
          /* @__PURE__ */ o.jsx("td", { "data-label": "Participa", children: /* @__PURE__ */ o.jsx("input", { "aria-label": "Participa " + y.nome, type: "checkbox", checked: y.participa, disabled: d || p.status === "aprovada", onChange: (w) => v("motoristas", y, w.target.checked) }) }),
          /* @__PURE__ */ o.jsx("td", { "data-label": "Unidade", children: y.unidade }),
          /* @__PURE__ */ o.jsx("td", { "data-label": "Média km/ev", children: ee(y.taxa, 2) }),
          /* @__PURE__ */ o.jsx("td", { "data-label": "Nota Cobli", children: (z = y.notas) == null ? void 0 : z.cobli }),
          /* @__PURE__ */ o.jsx("td", { "data-label": "Sinistro · quantidade", children: y.entrada.sinistros || 0 }),
          /* @__PURE__ */ o.jsx("td", { "data-label": "Multa · quantidade", children: y.entrada.multas || 0 }),
          /* @__PURE__ */ o.jsx("td", { "data-label": "Nota manobras", children: ((T = y.notas) == null ? void 0 : T.manobras) || 0 }),
          /* @__PURE__ */ o.jsx("td", { "data-label": "Nota checklist", children: ((F = y.notas) == null ? void 0 : F.checklist) || 0 }),
          /* @__PURE__ */ o.jsx("td", { "data-label": "Pontos", children: /* @__PURE__ */ o.jsx("b", { children: ee(y.pontos, 2) }) }),
          /* @__PURE__ */ o.jsx("td", { "data-label": "Prêmio", children: /* @__PURE__ */ o.jsx("b", { children: vr(y.premio) }) }),
          /* @__PURE__ */ o.jsx("td", { children: /* @__PURE__ */ o.jsx("button", { disabled: d || p.status === "aprovada", onClick: () => j(y), children: "Notas" }) })
        ] }, y.motorista_id);
      }) })
    ] }) }),
    !p.motoristas.length && /* @__PURE__ */ o.jsx("p", { children: "Nenhum motorista neste filtro." })
  ] });
}
function mf({ data: p, busy: N, onNote: d, onParticipation: j }) {
  return /* @__PURE__ */ o.jsxs("section", { className: "lg-card", children: [
    /* @__PURE__ */ o.jsx("h3", { children: "Ajudantes · classificação oficial geral" }),
    /* @__PURE__ */ o.jsx("p", { children: "Soma das nove notas multiplicadas pelos respectivos pesos." }),
    /* @__PURE__ */ o.jsx("div", { className: "lg-table-wrap", children: /* @__PURE__ */ o.jsxs("table", { children: [
      /* @__PURE__ */ o.jsx("thead", { children: /* @__PURE__ */ o.jsx("tr", { children: ["Pos.", "Ajudante", "Participa", "Unidade", ...p.parametros.criterios_ajudantes.map((v) => `${v.rotulo} ×${v.peso}`), "Pontos", "Média ponderada", "Prêmio", "Ações"].map((v) => /* @__PURE__ */ o.jsx("th", { children: v }, v)) }) }),
      /* @__PURE__ */ o.jsx("tbody", { children: p.ajudantes.map((v) => /* @__PURE__ */ o.jsxs("tr", { className: v.participa ? "" : "lg-not-participating", children: [
        /* @__PURE__ */ o.jsx("td", { "data-label": "Posição", children: v.posicao ? v.posicao + "º" : "—" }),
        /* @__PURE__ */ o.jsx("td", { "data-label": "Ajudante", children: /* @__PURE__ */ o.jsx("strong", { children: v.nome }) }),
        /* @__PURE__ */ o.jsx("td", { "data-label": "Participa", children: /* @__PURE__ */ o.jsx("input", { "aria-label": "Participa " + v.nome, type: "checkbox", checked: v.participa, disabled: N || p.status === "aprovada", onChange: (P) => j("ajudantes", v, P.target.checked) }) }),
        /* @__PURE__ */ o.jsx("td", { "data-label": "Unidade", children: v.unidade }),
        p.parametros.criterios_ajudantes.map((P) => /* @__PURE__ */ o.jsx("td", { "data-label": `${P.rotulo} ×${P.peso}`, children: v.notas[P.chave] || 0 }, P.chave)),
        /* @__PURE__ */ o.jsx("td", { "data-label": "Pontos", children: /* @__PURE__ */ o.jsx("b", { children: ee(v.pontos, 2) }) }),
        /* @__PURE__ */ o.jsx("td", { "data-label": "Média ponderada", children: ee(v.media_ponderada, 2) }),
        /* @__PURE__ */ o.jsx("td", { "data-label": "Prêmio", children: /* @__PURE__ */ o.jsx("b", { children: vr(v.premio) }) }),
        /* @__PURE__ */ o.jsx("td", { children: /* @__PURE__ */ o.jsx("button", { disabled: N || p.status === "aprovada", onClick: () => d(v), children: "Notas (9)" }) })
      ] }, v.id)) })
    ] }) }),
    !p.ajudantes.length && /* @__PURE__ */ o.jsx("p", { children: "Cadastre os ajudantes para lançar as notas reais do trimestre." })
  ] });
}
function hf({ value: p, tri: N, busy: d, save: j }) {
  const [v, P] = Z.useState(structuredClone(p)), y = (z, T) => P({ ...v, [z]: T });
  return /* @__PURE__ */ o.jsxs("form", { onSubmit: (z) => {
    z.preventDefault(), j(v);
  }, children: [
    /* @__PURE__ */ o.jsxs("p", { children: [
      "Parâmetros padrão v7 · ",
      N,
      ". Alterações geram uma versão auditada e preservam premiações aprovadas."
    ] }),
    /* @__PURE__ */ o.jsxs("label", { children: [
      "Modo do Check List",
      /* @__PURE__ */ o.jsxs("select", { value: v.checklist_modo, onChange: (z) => y("checklist_modo", z.target.value), children: [
        /* @__PURE__ */ o.jsx("option", { value: "manual", children: "Nota manual 0–5 · padrão v7" }),
        /* @__PURE__ */ o.jsx("option", { value: "media_dia", children: "Média de checklists por dia · alternativa" })
      ] })
    ] }),
    ["cobli_faixas", ...v.checklist_modo === "media_dia" ? ["checklist_faixas"] : []].map((z) => /* @__PURE__ */ o.jsxs("section", { children: [
      /* @__PURE__ */ o.jsx("h3", { children: z === "cobli_faixas" ? "Faixas da nota Cobli" : "Faixas por média/dia" }),
      v[z].map((T, F) => /* @__PURE__ */ o.jsxs("div", { className: "lg-parameter-band", children: [
        /* @__PURE__ */ o.jsxs("label", { children: [
          "Limite inferior",
          /* @__PURE__ */ o.jsx("input", { type: "number", min: "0", step: "0.01", value: T.minimo, onChange: (w) => {
            const k = [...v[z]];
            k[F] = { ...T, minimo: Number(w.target.value) }, y(z, k);
          } })
        ] }),
        /* @__PURE__ */ o.jsxs("label", { children: [
          "Nota",
          /* @__PURE__ */ o.jsx("select", { value: T.nota, onChange: (w) => {
            const k = [...v[z]];
            k[F] = { ...T, nota: Number(w.target.value) }, y(z, k);
          }, children: [0, 1, 2, 3, 4, 5].map((w) => /* @__PURE__ */ o.jsx("option", { children: w }, w)) })
        ] }),
        /* @__PURE__ */ o.jsxs("label", { className: "lg-check", children: [
          /* @__PURE__ */ o.jsx("input", { type: "checkbox", disabled: F === 0, checked: !!T.exclusivo, onChange: (w) => {
            const k = [...v[z]];
            k[F] = { ...T, exclusivo: w.target.checked }, y(z, k);
          } }),
          "Estritamente acima"
        ] })
      ] }, F))
    ] }, z)),
    /* @__PURE__ */ o.jsx("h3", { children: "Pesos dos motoristas" }),
    /* @__PURE__ */ o.jsx("div", { className: "lg-form-grid", children: Object.keys(v.pesos).map((z) => /* @__PURE__ */ o.jsxs("label", { children: [
      z,
      /* @__PURE__ */ o.jsx("input", { type: "number", min: "0", max: "100", step: "0.1", value: v.pesos[z], onChange: (T) => y("pesos", { ...v.pesos, [z]: Number(T.target.value) }) })
    ] }, z)) }),
    /* @__PURE__ */ o.jsx("h3", { children: "Ajudantes · nove critérios e pesos" }),
    v.criterios_ajudantes.map((z, T) => /* @__PURE__ */ o.jsxs("div", { className: "lg-form-grid", children: [
      /* @__PURE__ */ o.jsxs("label", { children: [
        "Critério ",
        T + 1,
        /* @__PURE__ */ o.jsx("input", { required: !0, value: z.rotulo, maxLength: 100, onChange: (F) => {
          const w = [...v.criterios_ajudantes];
          w[T] = { ...z, rotulo: F.target.value }, y("criterios_ajudantes", w);
        } })
      ] }),
      /* @__PURE__ */ o.jsxs("label", { children: [
        "Peso",
        /* @__PURE__ */ o.jsx("input", { type: "number", min: "0", max: "100", step: "0.1", value: z.peso, onChange: (F) => {
          const w = [...v.criterios_ajudantes];
          w[T] = { ...z, peso: Number(F.target.value) }, y("criterios_ajudantes", w);
        } })
      ] })
    ] }, z.chave)),
    ["premios_motoristas", "premios_ajudantes"].map((z) => /* @__PURE__ */ o.jsxs("section", { children: [
      /* @__PURE__ */ o.jsx("h3", { children: z === "premios_motoristas" ? "Prêmios dos motoristas" : "Prêmios dos ajudantes" }),
      /* @__PURE__ */ o.jsx("div", { className: "lg-form-grid", children: v[z].map((T, F) => /* @__PURE__ */ o.jsxs("label", { children: [
        F + 1,
        "º · R$",
        /* @__PURE__ */ o.jsx("input", { type: "number", min: "0", step: "0.01", value: T, onChange: (w) => {
          const k = [...v[z]];
          k[F] = Number(w.target.value), y(z, k);
        } })
      ] }, F)) })
    ] }, z)),
    /* @__PURE__ */ o.jsxs("label", { className: "lg-check", children: [
      /* @__PURE__ */ o.jsx("input", { type: "checkbox", required: !0 }),
      "Conferi os critérios, pesos e valores deste trimestre"
    ] }),
    /* @__PURE__ */ o.jsx("button", { className: "primary", disabled: d, children: "Salvar nova versão dos parâmetros" })
  ] });
}
const vf = (p) => p === "Excelente" || p === "Na meta" || p === "fechado" || p === "aprovada" ? "good" : p === "Crítico" ? "bad" : "warn";
function go({ value: p }) {
  return /* @__PURE__ */ o.jsx("span", { className: "lg-badge " + vf(p), children: p });
}
function Jt({ children: p = "Nenhum registro neste período." }) {
  return /* @__PURE__ */ o.jsx("div", { className: "lg-empty", children: p });
}
function gf({ title: p, onClose: N, children: d }) {
  const j = Z.useRef(null);
  return Z.useEffect(() => {
    var v;
    return (v = j.current) == null || v.showModal(), () => {
      var P;
      return (P = j.current) == null ? void 0 : P.close();
    };
  }, []), /* @__PURE__ */ o.jsxs("dialog", { ref: j, className: "lg-dialog", onCancel: (v) => {
    v.preventDefault(), N();
  }, children: [
    /* @__PURE__ */ o.jsxs("header", { children: [
      /* @__PURE__ */ o.jsx("h2", { children: p }),
      /* @__PURE__ */ o.jsx("button", { type: "button", onClick: N, "aria-label": "Fechar", children: "×" })
    ] }),
    /* @__PURE__ */ o.jsx("div", { className: "lg-dialog-body", children: d })
  ] });
}
function yf({ values: p }) {
  const N = Math.max(1, ...Object.values(p || {})), d = Object.values(p || {}).reduce((j, v) => j + v, 0);
  return /* @__PURE__ */ o.jsxs("section", { className: "lg-card", children: [
    /* @__PURE__ */ o.jsx("h3", { children: "Eventos por categoria" }),
    nl.map((j) => /* @__PURE__ */ o.jsxs("div", { className: "lg-bar", children: [
      /* @__PURE__ */ o.jsx("span", { children: os[j] }),
      /* @__PURE__ */ o.jsxs("b", { children: [
        ee(p == null ? void 0 : p[j]),
        " · ",
        d ? ee(p[j] / d * 100) : 0,
        "%"
      ] }),
      /* @__PURE__ */ o.jsx("div", { children: /* @__PURE__ */ o.jsx("i", { style: { width: Number((p == null ? void 0 : p[j]) || 0) / N * 100 + "%" } }) })
    ] }, j))
  ] });
}
function xf({ route: p }) {
  var yr, xr, il, Vn, Bn, Hn, Wn, Qn, Vt, Bt, jr;
  const N = p.path.replace(/^logistica\/?/, "").replace(/\/$/, "") || "", d = { motoristas: "motoristas", ajudantes: "ajudantes", "mapeamento-cobli": "grupos-cobli" }, j = d[N] ? "cadastros" : N === "cadastros" ? "cadastros-home" : N, [v, P] = Z.useState(null), [y, z] = Z.useState(""), [T, F] = Z.useState(vo()), [w, k] = Z.useState(tl(vo())), [B, se] = Z.useState(null), [K, X] = Z.useState([]), [te, be] = Z.useState([]), [oe, Te] = Z.useState("motoristas"), pe = d[N] || oe, [Ue, $e] = Z.useState(Number((/* @__PURE__ */ new Date()).getFullYear())), [Ke, et] = Z.useState([]), [dt, yt] = Z.useState(!1), [ne, ft] = Z.useState(!1), [Me, Ee] = Z.useState(""), [pt, Ve] = Z.useState(""), [ge, D] = Z.useState(0), [G, I] = Z.useState(""), [m, S] = Z.useState(null), [U, b] = Z.useState(null), [ie, ae] = Z.useState([]), [me, de] = Z.useState(!1), he = Z.useRef(0), Be = Z.useRef(!1), M = (m == null ? void 0 : m.__view) === j ? m : null, ke = (a) => {
    a || he.current++, S(a ? { ...a, __view: j } : null);
  };
  Z.useEffect(() => {
    document.querySelectorAll(".lg table").forEach((a) => {
      const R = Array.from(a.querySelectorAll("thead th")).map((O) => O.textContent || "");
      a.querySelectorAll("tbody tr").forEach((O) => Array.from(O.children).forEach((ue, rt) => ue.setAttribute("data-label", R[rt] || "")));
    });
  }, [B, j]), Z.useEffect(() => {
    Ee("");
  }, [M == null ? void 0 : M.kind]), Z.useEffect(() => {
    if (!v || !y) return;
    const a = new URLSearchParams(p.search);
    a.get("unidade") && v.units.some((R) => R.codigo === a.get("unidade")) && z(a.get("unidade")), /^20[0-9]{2}-[0-9]{2}$/.test(a.get("mes") || "") && F(a.get("mes")), /^20[0-9]{2}-T[1-4]$/.test(a.get("tri") || "") && k(a.get("tri"));
  }, [p.search]), Z.useEffect(() => {
    if (!v || !y) return;
    const a = new URL(location.href);
    (a.searchParams.get("view") || "").startsWith("logistica/") && (a.searchParams.set("view", p.path + "?" + new URLSearchParams({ unidade: y, mes: T, tri: w })), history.replaceState(history.state, "", a));
  }, [y, T, w, j, v]);
  const Q = (B == null ? void 0 : B.__view) === j ? B : null, Ne = (a) => !!(v != null && v.actions.includes(a.startsWith("logistica.") ? a : a === "consolidado" ? "logistica.consolidado" : "logistica.kmevento." + a)), In = (a = !1) => Ne("logistica.cadastros." + { motoristas: "motoristas", ajudantes: "ajudantes", "grupos-cobli": "cobli" }[pe] + (a ? ".editar" : ".consulta")), Sn = (a) => {
    var R;
    return ((R = v.units.find((O) => O.id === a.unidade_id)) == null ? void 0 : R.codigo) || y;
  }, Un = () => D((a) => a + 1);
  Z.useEffect(() => {
    const a = new AbortController();
    return le("/contexto", "", "GET", void 0, a.signal).then(async (R) => {
      var Kn, tn, sl, nn;
      if (a.signal.aborted) return;
      P(R);
      const O = new URLSearchParams(p.search);
      Be.current = /^20[0-9]{2}-T[1-4]$/.test(O.get("tri") || "");
      const ue = O.get("unidade"), rt = ((Kn = R.units.find((Gn) => Gn.codigo === ue)) == null ? void 0 : Kn.codigo) || (R.actions.includes("logistica.consolidado") ? "todas" : ((tn = R.units[0]) == null ? void 0 : tn.codigo) || "");
      if (z(rt), !rt) throw Error("Nenhuma unidade habilitada para seu usuário.");
      const _t = R.actions.includes("logistica.kmevento.consulta") ? await le("/meses", rt, "GET", void 0, a.signal) : { rows: [] };
      if (a.signal.aborted) return;
      if (!Array.isArray(_t.rows)) throw Error("Resposta de meses indisponível. Tente novamente.");
      X(_t.rows);
      const Et = O.get("mes") || ((nn = (sl = _t.rows[0]) == null ? void 0 : sl.competencia) == null ? void 0 : nn.slice(0, 7)) || vo();
      F(Et), k(/^20[0-9]{2}-T[1-4]$/.test(O.get("tri") || "") ? O.get("tri") : tl(Et));
    }).catch((R) => {
      a.signal.aborted || Ee(R.message);
    }), () => a.abort();
  }, []), Z.useEffect(() => {
    if (!v || !y) return;
    const a = new AbortController();
    return yt(!0), Ee(""), se(null), (async () => {
      const R = Ne("consulta") ? await le("/meses", y, "GET", void 0, a.signal) : { rows: [] };
      if (a.signal.aborted) return;
      if (!Array.isArray(R.rows)) throw Error("Resposta de meses indisponível. Tente novamente.");
      X(R.rows);
      let O;
      if (!j || j === "cadastros-home" ? O = { rows: [] } : j === "metas" ? O = await le("/metas-trimestrais?ano=" + Ue, y, "GET", void 0, a.signal) : j === "fechamento" ? O = await le(`/trimestres/${w}/fechamento`, y, "GET", void 0, a.signal) : j === "premiacao" ? O = await le(`/trimestres/${w}/premiacao`, y, "GET", void 0, a.signal) : j === "cadastros" ? O = await le("/" + pe, y, "GET", void 0, a.signal) : O = await le(`/meses/${T}/painel`, y, "GET", void 0, a.signal), !a.signal.aborted) {
        if (se({ ...O, __view: j }), j === "cadastros" && pe === "grupos-cobli") {
          const ue = await le("/grupos-cobli/nao-mapeados", y, "GET", void 0, a.signal);
          a.signal.aborted || et(ue.rows);
        }
        if (j === "painel") {
          const ue = await le("/evolucao", y, "GET", void 0, a.signal);
          a.signal.aborted || be(ue.rows);
        }
      }
    })().catch((R) => {
      a.signal.aborted || Ee(R.message);
    }).finally(() => {
      a.signal.aborted || yt(!1);
    }), () => a.abort();
  }, [v, y, T, w, j, pe, ge, Ue]), Z.useEffect(() => {
    I(""), de(!1), ke(null), b(null);
  }, [y, N]);
  const rl = async (a, R = "Informações salvas.") => {
    if (!ne) {
      ft(!0), Ee("");
      try {
        const O = await a();
        return Ve(R), Un(), O;
      } catch (O) {
        throw Ee(O.message), O;
      } finally {
        ft(!1);
      }
    }
  }, ye = (a, R) => void rl(a, R).catch(() => {
  }), Ut = (a) => p.navigate("logistica/" + a + (a ? "/" : "")), bt = async (a) => {
    const R = ++he.current;
    try {
      ke({ kind: "loading" });
      const O = await le(`/meses/${T}/motoristas/${a.motorista_id}/resumo`, Sn(a));
      R === he.current && ke({ kind: "resumo", ...O });
    } catch (O) {
      R === he.current && (ke(null), Ee(O.message));
    }
  }, gr = ((Q == null ? void 0 : Q.rows) || []).filter((a) => (a.nome || a.grupo || "").toLocaleLowerCase().includes(G.toLocaleLowerCase())), ll = [...(Q == null ? void 0 : Q.rows) || []].filter((a) => !a.excluido).sort((a, R) => R.taxa - a.taxa).map((a, R) => ({ ...a, posicao: R + 1 })), tt = j === "painel" ? ll.filter((a) => a.nome.toLocaleLowerCase().includes(G.toLocaleLowerCase())) : gr, ol = async () => {
    try {
      const a = await le("/auditoria", y);
      ae(a.rows), ke({ kind: "historico" });
    } catch (a) {
      Ee(a.message);
    }
  }, nt = () => {
    ne || ke(null);
  }, Cn = (a) => {
    F(a), Be.current || k(tl(a));
  }, $n = Array.from(/* @__PURE__ */ new Set([...K.map((a) => tl(a.competencia)), tl(vo()), w])).sort(), $t = (a) => {
    var R;
    return (R = Q == null ? void 0 : Q.meses) == null ? void 0 : R.some((O) => O.unidade_id === a.unidade_id && O.status === "aberto");
  }, He = (yr = Q == null ? void 0 : Q.meses) == null ? void 0 : yr.find((a) => a.codigo_unidade === y && a.status === "aberto"), en = (a, R, O) => ye(async () => {
    let ue = Q.versao;
    ue || (ue = (await le(`/trimestres/${w}/premiacao/rascunho`, y, "POST", {})).versao), await le(`/trimestres/${w}/premiacao/${a}/${a === "motoristas" ? R.motorista_id : R.id}`, y, "PUT", { versao: ue, ...a === "motoristas" ? { entrada: { participa: O } } : { participa: O } });
  }, "Participação atualizada sem apagar as notas."), yo = /* @__PURE__ */ o.jsxs(o.Fragment, { children: [
    /* @__PURE__ */ o.jsxs("div", { className: "lg-top ph", children: [
      /* @__PURE__ */ o.jsxs("div", { children: [
        /* @__PURE__ */ o.jsx("h1", { children: ((xr = ef.find((a) => a[0] === N)) == null ? void 0 : xr[1]) || "Logística" }),
        /* @__PURE__ */ o.jsx("p", { children: j ? j === "cadastros" ? "Cadastros compartilhados da Logística" : "Km/Evento · indicadores de segurança" : "Ferramentas e cadastros da Logística" })
      ] }),
      /* @__PURE__ */ o.jsx("button", { onClick: Un, disabled: ne || dt, children: "↻ Atualizar" })
    ] }),
    j && j !== "cadastros" && j !== "cadastros-home" && /* @__PURE__ */ o.jsx("nav", { className: "lg-tabs", "aria-label": "Km/Evento", children: Ju.filter((a) => a[4] === "Km/Evento" && (v == null ? void 0 : v.screens.includes(a[3]))).map(([a, R]) => /* @__PURE__ */ o.jsx("button", { "aria-current": j === a ? "page" : void 0, onClick: () => Ut(a), children: R }, a)) }),
    j && j !== "cadastros-home" && /* @__PURE__ */ o.jsxs(o.Fragment, { children: [
      " ",
      /* @__PURE__ */ o.jsxs("div", { className: "lg-filters", children: [
        /* @__PURE__ */ o.jsxs("label", { children: [
          "Unidade",
          /* @__PURE__ */ o.jsxs("select", { "aria-label": "Unidade", value: y, onChange: (a) => z(a.target.value), disabled: ne || !!M, children: [
            Ne("consolidado") && /* @__PURE__ */ o.jsx("option", { value: "todas", children: "Todas (consolidado)" }),
            v == null ? void 0 : v.units.map((a) => /* @__PURE__ */ o.jsx("option", { value: a.codigo, children: a.nome }, a.id))
          ] })
        ] }),
        j === "metas" ? /* @__PURE__ */ o.jsxs("label", { children: [
          "Ano",
          /* @__PURE__ */ o.jsx("input", { "aria-label": "Ano das metas", type: "number", min: "2020", max: "2099", value: Ue, onChange: (a) => $e(Number(a.target.value)) })
        ] }) : ["fechamento", "premiacao"].includes(j) ? /* @__PURE__ */ o.jsxs("label", { children: [
          "Trimestre",
          /* @__PURE__ */ o.jsx("select", { "aria-label": "Trimestre", value: w, onChange: (a) => {
            Be.current = !0, k(a.target.value);
          }, children: $n.map((a) => /* @__PURE__ */ o.jsxs("option", { value: a, children: [
            a.slice(-1),
            "º trimestre / ",
            a.slice(0, 4)
          ] }, a)) })
        ] }) : j !== "cadastros" && /* @__PURE__ */ o.jsxs("label", { children: [
          "Mês",
          /* @__PURE__ */ o.jsx("input", { type: "month", "aria-label": "Mês", value: T, onChange: (a) => Cn(a.target.value) })
        ] }),
        j && /* @__PURE__ */ o.jsxs("label", { className: "lg-search", children: [
          "Buscar",
          /* @__PURE__ */ o.jsx("input", { "aria-label": "Buscar", value: G, onChange: (a) => I(a.target.value), placeholder: "Buscar motorista ou grupo" })
        ] }),
        /* @__PURE__ */ o.jsx("button", { onClick: () => void ol(), disabled: !y, children: "Histórico" })
      ] })
    ] })
  ] });
  return /* @__PURE__ */ o.jsxs("div", { className: "lg", "aria-busy": dt || ne, children: [
    yo,
    Me && /* @__PURE__ */ o.jsxs("div", { className: "lg-alert bad", role: "alert", children: [
      Me,
      /* @__PURE__ */ o.jsx("button", { onClick: () => Ee(""), "aria-label": "Fechar aviso", children: "×" })
    ] }),
    pt && /* @__PURE__ */ o.jsxs("div", { className: "lg-alert good", role: "status", children: [
      pt,
      /* @__PURE__ */ o.jsx("button", { onClick: () => Ve(""), "aria-label": "Fechar aviso", children: "×" })
    ] }),
    dt && /* @__PURE__ */ o.jsx("div", { className: "lg-loading", role: "status", children: "Conferindo informações…" }),
    !v && !dt && !Me && /* @__PURE__ */ o.jsx(Jt, { children: "Carregando seu acesso…" }),
    v && (j === "" || j === "cadastros-home") && /* @__PURE__ */ o.jsx(tf, { ctx: j === "cadastros-home" ? { ...v, screens: v.screens.filter((a) => ["logisticaMotoristas", "logisticaAjudantes", "logisticaCobli"].includes(a)) } : v, go: Ut, search: G, setSearch: I }),
    Q && j === "metas" && /* @__PURE__ */ o.jsx(nf, { data: Q, canEdit: Ne("metas"), busy: ne, unit: y, run: ye, refresh: ge }),
    Q && j === "painel" && /* @__PURE__ */ o.jsxs(o.Fragment, { children: [
      /* @__PURE__ */ o.jsx(af, { data: Q.resumo }),
      /* @__PURE__ */ o.jsx("div", { className: "lg-unit-grid", children: Q.unidades.map((a) => /* @__PURE__ */ o.jsx(uf, { u: a }, a.id)) }),
      /* @__PURE__ */ o.jsxs("div", { className: "lg-chart-grid", children: [
        /* @__PURE__ */ o.jsx(cf, { rows: te, unit: y }),
        /* @__PURE__ */ o.jsx(df, { units: Q.unidades })
      ] }),
      /* @__PURE__ */ o.jsx(yf, { values: Q.resumo.categorias }),
      /* @__PURE__ */ o.jsxs("section", { className: "lg-card", children: [
        /* @__PURE__ */ o.jsxs("div", { className: "lg-card-head", children: [
          /* @__PURE__ */ o.jsx("h3", { children: "Ranking de motoristas" }),
          /* @__PURE__ */ o.jsx("button", { onClick: () => ye(() => is(`/meses/${T}/ranking/exportacao`, y), "Exportação pronta."), children: "Exportar" })
        ] }),
        /* @__PURE__ */ o.jsx(jf, { rows: me ? tt : tt.slice(0, 25), onResume: bt, onEdit: Ne("correcao") ? (a) => ke({ kind: "correcao", row: a }) : null }),
        tt.length > 25 && !me && /* @__PURE__ */ o.jsxs("button", { onClick: () => de(!0), children: [
          "Ver todos (",
          tt.length,
          ")"
        ] })
      ] })
    ] }),
    Q && j === "correcoes" && /* @__PURE__ */ o.jsxs("section", { className: "lg-card", children: [
      /* @__PURE__ */ o.jsxs("div", { className: "lg-card-head", children: [
        /* @__PURE__ */ o.jsxs("div", { children: [
          /* @__PURE__ */ o.jsxs("h3", { children: [
            "Correções e exclusões de ",
            ct(T)
          ] }),
          /* @__PURE__ */ o.jsx("p", { children: "Histórico oficial e correções manuais têm origens distintas. Meses fechados são somente leitura." })
        ] }),
        Ne("correcao") && /* @__PURE__ */ o.jsx("button", { disabled: ne || !He, onClick: () => ke({ kind: "limpar" }), children: "Limpar correções salvas deste mês" })
      ] }),
      tt.length ? /* @__PURE__ */ o.jsx("div", { className: "lg-people", children: tt.map((a) => /* @__PURE__ */ o.jsxs("article", { children: [
        /* @__PURE__ */ o.jsxs("div", { children: [
          /* @__PURE__ */ o.jsx("strong", { children: a.nome }),
          /* @__PURE__ */ o.jsxs("small", { children: [
            a.unidade,
            " · ",
            ee(a.total_eventos),
            " eventos · ",
            ee(a.taxa, 2),
            " km/evento"
          ] }),
          /* @__PURE__ */ o.jsx(go, { value: a.origem === "historico_v7" ? "Histórico – planilha" : "Novo – Cobli" }),
          a.excluido && /* @__PURE__ */ o.jsx(go, { value: "Excluído neste mês" })
        ] }),
        /* @__PURE__ */ o.jsxs("div", { className: "lg-actions", children: [
          /* @__PURE__ */ o.jsx("button", { onClick: () => ke({ kind: "correcao", row: a }), children: Ne("correcao") && $t(a) ? "Corrigir eventos" : "Ver eventos" }),
          Ne("correcao") && /* @__PURE__ */ o.jsx("button", { disabled: !$t(a), onClick: () => ke({ kind: "exclusao", row: a }), children: a.excluido ? "Reincluir" : "Excluir do mês" })
        ] })
      ] }, a.id)) }) : /* @__PURE__ */ o.jsx(Jt, {}),
      /* @__PURE__ */ o.jsx("h3", { children: "Exclusões por nome neste mês" }),
      /* @__PURE__ */ o.jsx("div", { className: "lg-people", children: (il = Q.exclusoes_nominais) == null ? void 0 : il.map((a) => /* @__PURE__ */ o.jsxs("article", { children: [
        /* @__PURE__ */ o.jsxs("div", { children: [
          /* @__PURE__ */ o.jsx("strong", { children: a.nome }),
          /* @__PURE__ */ o.jsxs("small", { children: [
            a.origem === "historico_v7" ? "Exclusão inicial da v7" : "Exclusão manual",
            " · ",
            a.motivo
          ] })
        ] }),
        He && a.unidade_id === He.unidade_id && Ne("correcao") && /* @__PURE__ */ o.jsx("button", { onClick: () => ke({ kind: "nominal_remover", row: a }), children: "Reincluir nome" })
      ] }, a.id)) }),
      Ne("correcao") && /* @__PURE__ */ o.jsx("button", { disabled: ne || !He, onClick: () => ke({ kind: "exclusao_nome" }), children: "Excluir por nome" }),
      !He && Ne("correcao") && /* @__PURE__ */ o.jsx("p", { children: "Para alterar ou limpar correções, selecione uma unidade com o mês aberto." })
    ] }),
    Q && j === "fechamento" && /* @__PURE__ */ o.jsxs(o.Fragment, { children: [
      /* @__PURE__ */ o.jsx("div", { className: "lg-status-grid", children: [1, 2, 3].map((a) => {
        const R = w.slice(0, 4) + "-" + String((Number(w.slice(-1)) - 1) * 3 + a).padStart(2, "0"), O = Q.meses.filter((ue) => ue.competencia.startsWith(R));
        return /* @__PURE__ */ o.jsxs("article", { className: "lg-card", children: [
          /* @__PURE__ */ o.jsx("small", { children: ct(R) }),
          /* @__PURE__ */ o.jsx("strong", { children: O.length === v.units.filter((ue) => y === "todas" || ue.codigo === y).length && O.every((ue) => ue.status === "fechado") ? "Fechado · congelado" : "Aberto ou sem dados" })
        ] }, a);
      }) }),
      /* @__PURE__ */ o.jsxs("section", { className: "lg-card", children: [
        /* @__PURE__ */ o.jsxs("div", { className: "lg-card-head", children: [
          /* @__PURE__ */ o.jsxs("div", { children: [
            /* @__PURE__ */ o.jsx("h3", { children: "Média trimestral por motorista" }),
            /* @__PURE__ */ o.jsx("p", { children: "Média simples das taxas mensais disponíveis. Exclusão vale somente para o mês correspondente." })
          ] }),
          /* @__PURE__ */ o.jsx("button", { onClick: () => ye(() => is(`/trimestres/${w}/fechamento/exportacao`, y), "Exportação pronta."), children: "Exportar" })
        ] }),
        /* @__PURE__ */ o.jsx(ff, { rows: tt, tri: w }),
        !tt.length && /* @__PURE__ */ o.jsx(Jt, {})
      ] })
    ] }),
    Q && j === "meses" && /* @__PURE__ */ o.jsxs(o.Fragment, { children: [
      /* @__PURE__ */ o.jsxs("div", { className: "lg-chart-grid", children: [
        /* @__PURE__ */ o.jsxs("section", { className: "lg-card", children: [
          /* @__PURE__ */ o.jsx("h3", { children: "Importar relatório Cobli" }),
          /* @__PURE__ */ o.jsx("p", { children: "Arquivo .xlsx · até 10 MB. Para o relatório geral, selecione Todas (consolidado): a prévia separa os dados pelas unidades autorizadas." }),
          Ne("upload") ? /* @__PURE__ */ o.jsxs("form", { onSubmit: (a) => {
            a.preventDefault();
            const R = new FormData(a.currentTarget);
            R.set("competencia", T), R.set("mapa_colunas", JSON.stringify(Object.fromEntries(["nome", "grupo", "km", ...nl].map((O) => [O, Number(R.get("col_" + O)) || 0])))), ye(async () => {
              const O = await le("/importacoes/previas", y, "POST", R);
              b(O);
            }, "Prévia gerada. Confira antes de confirmar.");
          }, children: [
            /* @__PURE__ */ o.jsxs("label", { children: [
              "Relatório",
              /* @__PURE__ */ o.jsx("input", { type: "file", accept: ".xlsx", name: "arquivo", required: !0, onChange: (a) => {
                var ue, rt, _t, Et;
                if ((((rt = (ue = a.target.files) == null ? void 0 : ue[0]) == null ? void 0 : rt.size) || 0) > 1e7) {
                  Ee("Arquivo acima de 10 MB."), a.target.value = "";
                  return;
                }
                const O = (((Et = (_t = a.target.files) == null ? void 0 : _t[0]) == null ? void 0 : Et.name) || "").match(/(\d{2})-(\d{2})-(\d{4})/);
                O && Number(O[2]) >= 1 && Number(O[2]) <= 12 && Cn(O[3] + "-" + O[2]);
              } })
            ] }),
            /* @__PURE__ */ o.jsxs("label", { children: [
              "Velocidade",
              /* @__PURE__ */ o.jsxs("select", { name: "tipo_velocidade", children: [
                /* @__PURE__ */ o.jsx("option", { value: "", children: "Detectar pelo título" }),
                /* @__PURE__ */ o.jsx("option", { value: "ROAD_SPEED_EVENT", children: "Velocidade da via" }),
                /* @__PURE__ */ o.jsx("option", { value: "VEHICLE_SPEED_EVENT", children: "Velocidade do veículo" })
              ] })
            ] }),
            /* @__PURE__ */ o.jsxs("details", { children: [
              /* @__PURE__ */ o.jsx("summary", { children: "Opções de leitura das colunas" }),
              /* @__PURE__ */ o.jsx("p", { children: "Use somente se a detecção automática não reconhecer o relatório. Números começam em 1." }),
              /* @__PURE__ */ o.jsxs("label", { children: [
                "Linha do cabeçalho",
                /* @__PURE__ */ o.jsx("input", { name: "linha_cabecalho", type: "number", min: "0", defaultValue: "0" })
              ] }),
              /* @__PURE__ */ o.jsx("div", { className: "lg-form-grid", children: ["nome", "grupo", "km", ...nl].map((a) => /* @__PURE__ */ o.jsxs("label", { children: [
                os[a] || a,
                /* @__PURE__ */ o.jsx("input", { name: "col_" + a, type: "number", min: "0", max: "100", defaultValue: "0" })
              ] }, a)) })
            ] }),
            /* @__PURE__ */ o.jsx("button", { className: "primary", disabled: ne, children: "Gerar prévia" })
          ] }) : /* @__PURE__ */ o.jsx("p", { children: "Seu acesso permite consulta. Importação exige permissão específica." })
        ] }),
        /* @__PURE__ */ o.jsxs("section", { className: "lg-card", children: [
          /* @__PURE__ */ o.jsx("h3", { children: "Prévia da importação" }),
          U ? U.geral ? /* @__PURE__ */ o.jsx(sf, { value: U, busy: ne, cancel: () => ye(async () => {
            await le("/importacoes/geral/cancelar", "todas", "POST", { ids: U.importacoes.map((a) => a.id) }), b(null);
          }, "Prévias canceladas."), confirm: () => ye(async () => {
            await le("/importacoes/geral/confirmar", "todas", "POST", { ids: U.importacoes.map((a) => a.id) }), b(null);
          }, "Unidades abertas importadas. Meses fechados preservados.") }) : /* @__PURE__ */ o.jsxs(o.Fragment, { children: [
            /* @__PURE__ */ o.jsx("strong", { children: U.nome_arquivo }),
            /* @__PURE__ */ o.jsxs("small", { children: [
              "Leitura: ",
              U.parser || U.parser_versao,
              " · mês sugerido: ",
              U.mes_sugerido || T
            ] }),
            /* @__PURE__ */ o.jsxs("p", { children: [
              U.periodo_inicio,
              " a ",
              U.periodo_fim,
              " · ",
              U.tipo_velocidade === "ROAD_SPEED_EVENT" ? "Velocidade da via" : "Velocidade do veículo"
            ] }),
            /* @__PURE__ */ o.jsxs("div", { className: "lg-mini-kpis", children: [
              /* @__PURE__ */ o.jsxs("span", { children: [
                U.linhas.filter((a) => a.decisao === "aceita").length,
                " válidos"
              ] }),
              /* @__PURE__ */ o.jsxs("span", { children: [
                U.linhas.filter((a) => a.novo).length,
                " novos"
              ] }),
              /* @__PURE__ */ o.jsxs("span", { children: [
                U.linhas.filter((a) => a.decisao === "ignorada").length,
                " ignorados"
              ] }),
              /* @__PURE__ */ o.jsxs("span", { children: [
                U.linhas.filter((a) => a.decisao === "erro").length,
                " erros"
              ] }),
              /* @__PURE__ */ o.jsxs("span", { children: [
                U.linhas.filter((a) => a.decisao === "remocao").length,
                " remoções"
              ] })
            ] }),
            U.status === "previa" && !U.linhas.some((a) => a.decisao === "aceita") && U.linhas.some((a) => a.decisao === "remocao") && /* @__PURE__ */ o.jsx("div", { className: "lg-alert warn", children: "Esta confirmação retirará todos os registros desta unidade dos totais do mês. As correções e a auditoria serão preservadas." }),
            U.status === "diferenca" && /* @__PURE__ */ o.jsx("div", { className: "lg-alert warn", children: "Mês fechado. Esta leitura mostra somente diferenças e não sobrescreve os números." }),
            /* @__PURE__ */ o.jsx("div", { className: "lg-preview-lines", children: U.linhas.map((a, R) => /* @__PURE__ */ o.jsxs("article", { children: [
              /* @__PURE__ */ o.jsxs("b", { children: [
                "Linha ",
                a.linha,
                " · ",
                a.nome || "Fora do escopo"
              ] }),
              /* @__PURE__ */ o.jsxs("small", { children: [
                a.decisao,
                " ",
                a.novo ? "· novo motorista" : "",
                " · ",
                a.motivo || `${ee(a.km, 1)} km`
              ] }),
              a.diferenca_km !== void 0 && /* @__PURE__ */ o.jsxs("small", { children: [
                "Diferença: ",
                ee(a.diferenca_km, 2),
                " km · eventos ",
                JSON.stringify(a.diferenca_eventos)
              ] })
            ] }, R)) }),
            /* @__PURE__ */ o.jsxs("div", { className: "lg-actions", children: [
              /* @__PURE__ */ o.jsx("button", { disabled: ne, onClick: () => ye(async () => {
                await le(`/importacoes/${U.id}/cancelar`, y, "POST", {}), b(null);
              }, "Prévia cancelada."), children: "Cancelar" }),
              /* @__PURE__ */ o.jsx("button", { className: "primary", disabled: ne || U.status !== "previa" || U.linhas.some((a) => a.decisao === "erro") || !U.linhas.some((a) => a.decisao === "aceita") && !(U.linhas.some((a) => a.decisao === "remocao") && U.linhas.some((a) => a.valida_outra_unidade)), onClick: () => ye(async () => {
                await le(`/importacoes/${U.id}/confirmar`, y, "POST", {}), b(null);
              }, "Importação concluída."), children: "Confirmar importação" })
            ] })
          ] }) : /* @__PURE__ */ o.jsx(Jt, { children: "Escolha o relatório para conferir as informações antes de gravar." })
        ] })
      ] }),
      /* @__PURE__ */ o.jsxs("section", { className: "lg-card", children: [
        /* @__PURE__ */ o.jsx("h3", { children: "Meses importados" }),
        K.length ? /* @__PURE__ */ o.jsx("div", { className: "lg-people", children: K.map((a) => /* @__PURE__ */ o.jsxs("article", { children: [
          /* @__PURE__ */ o.jsxs("div", { children: [
            /* @__PURE__ */ o.jsxs("strong", { children: [
              ct(a.competencia),
              " · ",
              a.unidade
            ] }),
            /* @__PURE__ */ o.jsxs("small", { children: [
              "Versão ",
              a.versao,
              a.fechado_em ? " · fechado em " + new Date(a.fechado_em).toLocaleString("pt-BR") : ""
            ] })
          ] }),
          /* @__PURE__ */ o.jsx(go, { value: a.status }),
          /* @__PURE__ */ o.jsxs("div", { className: "lg-actions", children: [
            Ne("upload") && /* @__PURE__ */ o.jsx("button", { onClick: () => {
              z(a.codigo_unidade), Cn(a.competencia.slice(0, 7)), b(null);
            }, children: a.status === "fechado" ? "Reimportar · só diferença" : "Selecionar mês" }),
            Ne("fechar_mes") && a.status === "aberto" && /* @__PURE__ */ o.jsx("button", { onClick: () => ke({ kind: "fechar", row: a }), children: "Fechar mês" })
          ] })
        ] }, a.id)) }) : /* @__PURE__ */ o.jsx(Jt, {})
      ] }),
      /* @__PURE__ */ o.jsxs("section", { className: "lg-card", children: [
        /* @__PURE__ */ o.jsxs("h3", { children: [
          "Meta vigente · ",
          ct(T)
        ] }),
        /* @__PURE__ */ o.jsx("div", { className: "lg-form-grid", children: Q.meses.map((a) => /* @__PURE__ */ o.jsxs("p", { children: [
          a.unidade,
          ": ",
          /* @__PURE__ */ o.jsxs("strong", { children: [
            ee(a.meta),
            " km/evento"
          ] }),
          " ",
          a.status === "fechado" ? "· congelada" : ""
        ] }, a.id)) }),
        /* @__PURE__ */ o.jsx("button", { onClick: () => Ut("metas"), children: "Consultar planejamento de metas" })
      ] }),
      (v == null ? void 0 : v.user) && ["user-ricardo", "alex", "marcelo", "suportelogistica"].includes(v.user.id) && /* @__PURE__ */ o.jsx(of, { unit: y }),
      Ne("upload") && /* @__PURE__ */ o.jsx(wf, { unit: y, refresh: ge, run: ye, select: (a) => b(a) })
    ] }),
    Q && j === "cadastros" && /* @__PURE__ */ o.jsxs(o.Fragment, { children: [
      /* @__PURE__ */ o.jsx("div", { className: "lg-section-head", children: /* @__PURE__ */ o.jsx("button", { className: "primary", disabled: ne || !In(!0), onClick: () => ke({ kind: "cadastro", row: null }), children: "+ Novo" }) }),
      pe === "grupos-cobli" ? /* @__PURE__ */ o.jsx(lf, { rows: tt, pending: Ke, canEdit: In(!0), busy: ne, onEdit: (a) => ke({ kind: "cadastro", row: a }), onNew: (a) => ke({ kind: "cadastro", row: null, grupo: a }) }) : /* @__PURE__ */ o.jsxs("section", { className: "lg-card", children: [
        /* @__PURE__ */ o.jsx("div", { className: "lg-people", children: tt.map((a) => /* @__PURE__ */ o.jsxs("article", { children: [
          /* @__PURE__ */ o.jsxs("div", { children: [
            /* @__PURE__ */ o.jsx("strong", { children: a.nome }),
            /* @__PURE__ */ o.jsxs("small", { children: [
              a.unidade,
              " ",
              pe === "motoristas" ? a.unidade_manual ? "· fixada manualmente" : "· pelo grupo Cobli" : ""
            ] }),
            pe === "motoristas" && /* @__PURE__ */ o.jsxs("small", { children: [
              a.participa_premiacao ? "Participa da premiação" : "Não participa da premiação",
              " · padrão para avaliações sem ajuste trimestral"
            ] })
          ] }),
          /* @__PURE__ */ o.jsx(go, { value: a.ativo ? "Ativo" : "Inativo" }),
          /* @__PURE__ */ o.jsx("button", { disabled: !In(!0) || ne, onClick: () => ke({ kind: "cadastro", row: a }), children: "Editar" })
        ] }, a.id)) }),
        !tt.length && /* @__PURE__ */ o.jsx(Jt, {})
      ] }),
      (v == null ? void 0 : v.user) && ["user-ricardo", "alex", "marcelo", "suportelogistica"].includes(v.user.id) && /* @__PURE__ */ o.jsx(kf, { run: ye })
    ] }),
    Q && j === "premiacao" && /* @__PURE__ */ o.jsxs(o.Fragment, { children: [
      /* @__PURE__ */ o.jsx("div", { className: "lg-alert", children: "Classificação oficial geral do trimestre. O filtro de unidade somente altera a visualização; posições e prêmios permanecem gerais." }),
      /* @__PURE__ */ o.jsxs("div", { className: "lg-actions", children: [
        /* @__PURE__ */ o.jsx("button", { disabled: ne || !["user-ricardo", "alex", "marcelo", "suportelogistica"].includes((Vn = v == null ? void 0 : v.user) == null ? void 0 : Vn.id), onClick: () => ke({ kind: "parametros", value: Q.parametros }), children: "Parâmetros" }),
        Q.status === "rascunho" && /* @__PURE__ */ o.jsx("button", { className: "primary", disabled: ne || !Q.pode_aprovar || !Q.completo || !Q.parametros.confirmado, onClick: () => ke({ kind: "aprovar" }), children: "Aprovar premiação geral" })
      ] }),
      Q.filtro_visual && /* @__PURE__ */ o.jsx("div", { className: "lg-alert warn", children: "Visualização filtrada. Para aprovar o ranking oficial, selecione Todas e utilize uma conta com acesso ao consolidado completo." }),
      !Q.parametros.confirmado && /* @__PURE__ */ o.jsx("div", { className: "lg-alert warn", children: "Parâmetros padrão da v7 disponíveis. Confira e salve os critérios e valores antes da aprovação financeira." }),
      !Q.completo && Q.status !== "aprovada" && /* @__PURE__ */ o.jsx("div", { className: "lg-alert warn", children: "Os três meses de todas as unidades precisam estar fechados para aprovar." }),
      /* @__PURE__ */ o.jsxs("div", { className: "lg-kpis three", children: [
        /* @__PURE__ */ o.jsxs("article", { children: [
          /* @__PURE__ */ o.jsx("span", { children: "Total motoristas" }),
          /* @__PURE__ */ o.jsx("strong", { children: vr(Q.total_motoristas) }),
          /* @__PURE__ */ o.jsx("small", { children: "Até cinco premiados" })
        ] }),
        /* @__PURE__ */ o.jsxs("article", { children: [
          /* @__PURE__ */ o.jsx("span", { children: "Total ajudantes" }),
          /* @__PURE__ */ o.jsx("strong", { children: vr(Q.total_ajudantes) }),
          /* @__PURE__ */ o.jsx("small", { children: "Até três premiados" })
        ] }),
        /* @__PURE__ */ o.jsxs("article", { children: [
          /* @__PURE__ */ o.jsx("span", { children: "Status" }),
          /* @__PURE__ */ o.jsx("strong", { children: Q.status === "aprovada" ? "Aprovada" : "Rascunho" }),
          /* @__PURE__ */ o.jsx("small", { children: Q.aprovado_por || "Aguardando conferência" })
        ] })
      ] }),
      /* @__PURE__ */ o.jsx(rf, { data: Q }),
      /* @__PURE__ */ o.jsx(pf, { data: Q, search: G, busy: ne, onNote: (a) => ke({ kind: "nota_motorista", row: a }), onParticipation: en }),
      /* @__PURE__ */ o.jsx(mf, { data: Q, busy: ne, onNote: (a) => ke({ kind: "nota_ajudante", row: a }), onParticipation: en })
    ] }),
    M && /* @__PURE__ */ o.jsxs(gf, { title: M.kind === "resumo" ? "Resumo do motorista" : M.kind === "correcao" ? "Correção dos eventos" : M.kind === "parametros" ? "Parâmetros do trimestre" : M.kind === "historico" ? "Histórico de alterações" : M.kind === "fechar" ? "Fechar mês" : M.kind === "aprovar" ? "Aprovar premiação" : M.kind === "cadastro" ? "Cadastro" : M.kind === "exclusao" ? "Exclusão mensal" : "Notas e avaliação", onClose: nt, children: [
      Me && /* @__PURE__ */ o.jsx("div", { className: "lg-alert bad", role: "alert", children: Me }),
      ne && /* @__PURE__ */ o.jsx("p", { role: "status", children: "Salvando…" }),
      M.kind === "limpar" && /* @__PURE__ */ o.jsxs("form", { onSubmit: (a) => {
        a.preventDefault();
        const R = new FormData(a.currentTarget);
        ye(async () => {
          await le(`/meses/${T}/correcoes/limpar`, y, "POST", { versao: He.versao, motivo: R.get("motivo") }), nt();
        }, "Correções manuais removidas; origem restaurada.");
      }, children: [
        /* @__PURE__ */ o.jsxs("p", { children: [
          "Limpar as correções manuais de ",
          ct(T),
          " em ",
          He == null ? void 0 : He.unidade,
          "? Os valores originais serão restaurados. A operação será auditada."
        ] }),
        /* @__PURE__ */ o.jsxs("label", { children: [
          "Motivo",
          /* @__PURE__ */ o.jsx("textarea", { name: "motivo", required: !0, maxLength: 1e3 })
        ] }),
        /* @__PURE__ */ o.jsx("button", { className: "primary", disabled: ne || !He, children: "Confirmar limpeza das correções" })
      ] }),
      ["exclusao_nome", "nominal_remover"].includes(M.kind) && /* @__PURE__ */ o.jsxs("form", { onSubmit: (a) => {
        a.preventDefault();
        const R = new FormData(a.currentTarget);
        ye(async () => {
          await le(`/meses/${T}/exclusoes-nominais` + (M.kind === "nominal_remover" ? "/" + M.row.id : ""), y, M.kind === "nominal_remover" ? "DELETE" : "POST", { versao: He.versao, nome: R.get("nome"), motivo: R.get("motivo") }), nt();
        });
      }, children: [
        M.kind === "exclusao_nome" ? /* @__PURE__ */ o.jsxs("label", { children: [
          "Nome para excluir deste mês",
          /* @__PURE__ */ o.jsx("input", { name: "nome", required: !0, maxLength: 300 })
        ] }) : /* @__PURE__ */ o.jsxs("p", { children: [
          "Reincluir ",
          M.row.nome,
          " neste mês?"
        ] }),
        /* @__PURE__ */ o.jsxs("label", { children: [
          "Motivo",
          /* @__PURE__ */ o.jsx("textarea", { name: "motivo", required: !0, maxLength: 1e3 })
        ] }),
        /* @__PURE__ */ o.jsx("button", { className: "primary", disabled: ne, children: "Confirmar" })
      ] }),
      M.kind === "loading" && /* @__PURE__ */ o.jsx("p", { children: "Carregando…" }),
      M.kind === "resumo" && /* @__PURE__ */ o.jsxs(o.Fragment, { children: [
        /* @__PURE__ */ o.jsx("h3", { children: M.row.nome }),
        /* @__PURE__ */ o.jsxs("p", { children: [
          M.row.unidade,
          " · ",
          ct(T)
        ] }),
        /* @__PURE__ */ o.jsxs("div", { className: "lg-mini-kpis", children: [
          /* @__PURE__ */ o.jsxs("span", { children: [
            ee(M.row.taxa, 2),
            " km/evento"
          ] }),
          /* @__PURE__ */ o.jsxs("span", { children: [
            M.row.total_eventos,
            " eventos"
          ] })
        ] }),
        /* @__PURE__ */ o.jsx("pre", { children: M.texto }),
        /* @__PURE__ */ o.jsx("button", { className: "primary", onClick: () => ye(async () => {
          await navigator.clipboard.writeText(M.texto);
        }, "Resumo copiado. Cole na conversa desejada."), children: "Copiar para WhatsApp" })
      ] }),
      M.kind === "correcao" && /* @__PURE__ */ o.jsxs("form", { onSubmit: (a) => {
        a.preventDefault();
        const R = new FormData(a.currentTarget);
        ye(async () => {
          await le(`/meses/${T}/motoristas/${M.row.motorista_id}/correcoes`, Sn(M.row), "PUT", { versao: M.row.versao, correcoes: Object.fromEntries(nl.map((O) => [O, Number(R.get(O))])), motivo: R.get("motivo") }), nt();
        }, "Correção salva.");
      }, children: [
        /* @__PURE__ */ o.jsxs("h3", { children: [
          M.row.nome,
          " · ",
          ct(T)
        ] }),
        /* @__PURE__ */ o.jsxs("div", { className: "lg-correction-head", children: [
          /* @__PURE__ */ o.jsx("b", { children: "Categoria" }),
          /* @__PURE__ */ o.jsx("b", { children: "Bruto" }),
          /* @__PURE__ */ o.jsx("b", { children: "Falso alarme" })
        ] }),
        nl.map((a) => /* @__PURE__ */ o.jsxs("label", { className: "lg-correction-row", children: [
          /* @__PURE__ */ o.jsxs("span", { children: [
            os[a],
            /* @__PURE__ */ o.jsxs("small", { children: [
              "Líquido atual: ",
              M.row.liquidos[a]
            ] })
          ] }),
          /* @__PURE__ */ o.jsx("b", { children: M.row.eventos[a] }),
          /* @__PURE__ */ o.jsx("input", { type: "number", min: "0", max: M.row.eventos[a], name: a, defaultValue: M.row.correcoes[a], disabled: !Ne("correcao") || !$t(M.row), required: !0 })
        ] }, a)),
        /* @__PURE__ */ o.jsxs("label", { children: [
          "Motivo",
          /* @__PURE__ */ o.jsx("textarea", { name: "motivo", required: !0, maxLength: 1e3, disabled: !Ne("correcao") || !$t(M.row) })
        ] }),
        /* @__PURE__ */ o.jsx("p", { children: "O desconto pertence somente a este motorista e mês. Não pode superar o bruto." }),
        /* @__PURE__ */ o.jsxs("div", { className: "lg-actions", children: [
          /* @__PURE__ */ o.jsx("button", { type: "reset", disabled: !$t(M.row), children: "Desfazer" }),
          /* @__PURE__ */ o.jsx("button", { className: "primary", disabled: ne || !Ne("correcao") || !$t(M.row), children: "Salvar correção" })
        ] })
      ] }),
      M.kind === "exclusao" && /* @__PURE__ */ o.jsxs("form", { onSubmit: (a) => {
        a.preventDefault();
        const R = new FormData(a.currentTarget);
        ye(async () => {
          await le(`/meses/${T}/motoristas/${M.row.motorista_id}/exclusao`, Sn(M.row), "PUT", { versao: M.row.versao, excluido: !M.row.excluido, motivo: R.get("motivo") }), nt();
        });
      }, children: [
        /* @__PURE__ */ o.jsxs("p", { children: [
          M.row.excluido ? "Reincluir" : "Excluir",
          " ",
          M.row.nome,
          " em ",
          ct(T),
          ". Os outros meses permanecem no histórico."
        ] }),
        /* @__PURE__ */ o.jsxs("label", { children: [
          "Motivo",
          /* @__PURE__ */ o.jsx("textarea", { name: "motivo", required: !0, maxLength: 1e3 })
        ] }),
        /* @__PURE__ */ o.jsx("button", { className: "primary", disabled: ne, children: "Confirmar" })
      ] }),
      M.kind === "fechar" && /* @__PURE__ */ o.jsxs(o.Fragment, { children: [
        /* @__PURE__ */ o.jsxs("p", { children: [
          "Congelar os números de ",
          /* @__PURE__ */ o.jsxs("b", { children: [
            M.row.unidade,
            " · ",
            ct(M.row.competencia)
          ] }),
          "? Correções, exclusões e metas ficarão somente leitura. Reimportar mostrará apenas diferenças."
        ] }),
        /* @__PURE__ */ o.jsx("button", { className: "primary", disabled: ne, onClick: () => ye(async () => {
          await le(`/meses/${M.row.competencia.slice(0, 7)}/fechar`, M.row.codigo_unidade, "POST", { versao: M.row.versao }), nt();
        }, "Mês fechado e números congelados."), children: "Confirmar fechamento" })
      ] }),
      M.kind === "cadastro" && /* @__PURE__ */ o.jsxs("form", { onSubmit: (a) => {
        a.preventDefault();
        const R = new FormData(a.currentTarget), O = M.row, ue = Number(R.get("unidade_id")), rt = v.units.find((_t) => _t.id === ue);
        ye(async () => {
          await le("/" + pe + (O ? "/" + O.id : ""), O ? Sn(O) : rt.codigo, O ? "PATCH" : "POST", { nome: R.get("nome"), grupo: R.get("nome"), unidade_id: ue, unidade_manual: R.get("manual") === "on", ativo: R.get("ativo") === "on", ...pe === "motoristas" ? { participa_premiacao: R.get("participa_premiacao") === "on" } : {}, ...O ? { versao: O.versao } : {} }), nt();
        });
      }, children: [
        /* @__PURE__ */ o.jsxs("label", { children: [
          pe === "grupos-cobli" ? "Grupo exato no relatório Cobli" : "Nome",
          /* @__PURE__ */ o.jsx("input", { name: "nome", defaultValue: ((Bn = M.row) == null ? void 0 : Bn.nome) || ((Hn = M.row) == null ? void 0 : Hn.grupo) || M.grupo || "", maxLength: 300, required: !0 })
        ] }),
        /* @__PURE__ */ o.jsxs("label", { children: [
          "Unidade",
          /* @__PURE__ */ o.jsxs("select", { name: "unidade_id", required: !0, defaultValue: ((Wn = M.row) == null ? void 0 : Wn.unidade_id) || ((Qn = v.units.find((a) => a.codigo === y)) == null ? void 0 : Qn.id) || "", children: [
            /* @__PURE__ */ o.jsx("option", { value: "", disabled: !0, children: "Selecione a unidade" }),
            v.units.map((a) => /* @__PURE__ */ o.jsx("option", { value: a.id, children: a.nome }, a.id))
          ] })
        ] }),
        /* @__PURE__ */ o.jsx("p", { children: "A alteração do cadastro vale para a atribuição futura. O histórico mensal permanece na unidade registrada." }),
        pe === "motoristas" && /* @__PURE__ */ o.jsxs(o.Fragment, { children: [
          /* @__PURE__ */ o.jsxs("label", { className: "lg-check", children: [
            /* @__PURE__ */ o.jsx("input", { type: "checkbox", name: "manual", defaultChecked: ((Vt = M.row) == null ? void 0 : Vt.unidade_manual) || !1 }),
            "Fixar esta unidade manualmente"
          ] }),
          /* @__PURE__ */ o.jsxs("label", { className: "lg-check", children: [
            /* @__PURE__ */ o.jsx("input", { type: "checkbox", name: "participa_premiacao", defaultChecked: ((Bt = M.row) == null ? void 0 : Bt.participa_premiacao) ?? !0 }),
            "Participa na premiação"
          ] }),
          /* @__PURE__ */ o.jsx("p", { children: "ID Cobli será preenchido na futura integração; não é obrigatório nesta fase." })
        ] }),
        /* @__PURE__ */ o.jsxs("label", { className: "lg-check", children: [
          /* @__PURE__ */ o.jsx("input", { type: "checkbox", name: "ativo", defaultChecked: ((jr = M.row) == null ? void 0 : jr.ativo) ?? !0 }),
          "Cadastro ativo"
        ] }),
        /* @__PURE__ */ o.jsx("button", { className: "primary", disabled: ne, children: "Salvar cadastro" })
      ] }),
      M.kind === "parametros" && /* @__PURE__ */ o.jsx(hf, { value: M.value, tri: w, unit: y, busy: ne, save: (a) => ye(async () => {
        const R = await le(`/trimestres/${w}/parametros-premiacao`, y);
        await le(`/trimestres/${w}/parametros-premiacao`, y, "PUT", { versao: R.versao, parametros: a }), nt();
      }, "Nova versão dos parâmetros salva.") }),
      M.kind === "nota_motorista" && /* @__PURE__ */ o.jsxs("form", { onSubmit: (a) => {
        a.preventDefault();
        const R = new FormData(a.currentTarget);
        ye(async () => {
          let O = Q.versao;
          O || (O = (await le(`/trimestres/${w}/premiacao/rascunho`, y, "POST", {})).versao), await le(`/trimestres/${w}/premiacao/motoristas/${M.row.motorista_id}`, y, "PUT", { versao: O, entrada: Object.fromEntries(["checklist", "checklists", "dias", "manobras", "sinistros", "multas"].filter((ue) => R.has(ue)).map((ue) => [ue, Number(R.get(ue))])) }), nt();
        });
      }, children: [
        /* @__PURE__ */ o.jsx("h3", { children: M.row.nome }),
        /* @__PURE__ */ o.jsxs("p", { children: [
          "Média km/ev: ",
          ee(M.row.taxa, 2),
          " · nota Cobli automática ",
          M.row.notas.cobli,
          " · peso ",
          Q.parametros.pesos.cobli
        ] }),
        ["manobras", ...Q.parametros.checklist_modo === "manual" ? ["checklist"] : []].map((a) => /* @__PURE__ */ o.jsxs("label", { children: [
          a === "manobras" ? "Manobras" : "Check List",
          " · nota 0–5",
          /* @__PURE__ */ o.jsx("select", { name: a, defaultValue: M.row.entrada[a] || 0, children: [0, 1, 2, 3, 4, 5].map((R) => /* @__PURE__ */ o.jsx("option", { children: R }, R)) })
        ] }, a)),
        (Q.parametros.checklist_modo === "media_dia" ? [["checklists", "Checklists realizados", 1e4], ["dias", "Dias de trabalho", 366]] : []).concat([["sinistros", "Quantidade de sinistros", 1e3], ["multas", "Quantidade de multas", 1e3]]).map(([a, R, O]) => /* @__PURE__ */ o.jsxs("label", { children: [
          R,
          /* @__PURE__ */ o.jsx("input", { name: String(a), type: "number", min: "0", max: O, step: "1", defaultValue: M.row.entrada[a] || 0, required: !0 })
        ] }, a)),
        /* @__PURE__ */ o.jsx("button", { className: "primary", disabled: ne, children: "Salvar notas" })
      ] }),
      M.kind === "nota_ajudante" && /* @__PURE__ */ o.jsxs("form", { onSubmit: (a) => {
        a.preventDefault();
        const R = new FormData(a.currentTarget);
        ye(async () => {
          let O = Q.versao;
          O || (O = (await le(`/trimestres/${w}/premiacao/rascunho`, y, "POST", {})).versao), await le(`/trimestres/${w}/premiacao/ajudantes/${M.row.id}`, y, "PUT", { versao: O, notas: Object.fromEntries(Q.parametros.criterios_ajudantes.map((ue) => [ue.chave, Number(R.get(ue.chave))])) }), nt();
        });
      }, children: [
        /* @__PURE__ */ o.jsx("h3", { children: M.row.nome }),
        Q.parametros.criterios_ajudantes.map((a) => /* @__PURE__ */ o.jsxs("label", { children: [
          a.rotulo,
          " · peso ",
          a.peso,
          /* @__PURE__ */ o.jsx("select", { name: a.chave, defaultValue: M.row.notas[a.chave] || 0, children: [0, 1, 2, 3, 4, 5].map((R) => /* @__PURE__ */ o.jsx("option", { children: R }, R)) })
        ] }, a.chave)),
        /* @__PURE__ */ o.jsx("button", { className: "primary", disabled: ne, children: "Salvar notas" })
      ] }),
      M.kind === "aprovar" && /* @__PURE__ */ o.jsxs(o.Fragment, { children: [
        /* @__PURE__ */ o.jsxs("p", { children: [
          "Confirmar a premiação geral de ",
          w,
          "? Motoristas: ",
          /* @__PURE__ */ o.jsx("b", { children: vr(Q.total_motoristas) }),
          ". Ajudantes: ",
          /* @__PURE__ */ o.jsx("b", { children: vr(Q.total_ajudantes) }),
          ". O resultado aprovado ficará congelado."
        ] }),
        /* @__PURE__ */ o.jsx("button", { className: "primary", disabled: ne, onClick: () => ye(async () => {
          let a = Q.versao;
          a || (a = (await le(`/trimestres/${w}/premiacao/rascunho`, y, "POST", {})).versao), await le(`/trimestres/${w}/premiacao/aprovar`, y, "POST", { versao: a }), nt();
        }, "Premiação aprovada."), children: "Confirmar aprovação" })
      ] }),
      M.kind === "historico" && /* @__PURE__ */ o.jsxs("div", { className: "lg-history", children: [
        ie.map((a) => /* @__PURE__ */ o.jsxs("article", { children: [
          /* @__PURE__ */ o.jsxs("strong", { children: [
            a.ator_nome,
            " · ",
            a.acao
          ] }),
          /* @__PURE__ */ o.jsxs("small", { children: [
            a.entidade,
            " · ",
            new Date(a.criado_em).toLocaleString("pt-BR")
          ] }),
          a.motivo && /* @__PURE__ */ o.jsx("p", { children: a.motivo }),
          /* @__PURE__ */ o.jsxs("details", { children: [
            /* @__PURE__ */ o.jsx("summary", { children: "Antes e depois" }),
            /* @__PURE__ */ o.jsx("pre", { children: JSON.stringify({ antes: a.antes, depois: a.depois }, null, 2) })
          ] })
        ] }, a.id)),
        !ie.length && /* @__PURE__ */ o.jsx(Jt, { children: "Nenhuma alteração autorizada para consultar." })
      ] })
    ] })
  ] });
}
function jf({ rows: p, onResume: N, onEdit: d }) {
  return p.length ? /* @__PURE__ */ o.jsx("div", { className: "lg-table-wrap", children: /* @__PURE__ */ o.jsxs("table", { className: "lg-ranking", children: [
    /* @__PURE__ */ o.jsx("thead", { children: /* @__PURE__ */ o.jsxs("tr", { children: [
      /* @__PURE__ */ o.jsx("th", { children: "#" }),
      /* @__PURE__ */ o.jsx("th", { children: "Motorista" }),
      /* @__PURE__ */ o.jsx("th", { children: "Unidade" }),
      /* @__PURE__ */ o.jsx("th", { children: "Km" }),
      /* @__PURE__ */ o.jsx("th", { children: "Eventos" }),
      /* @__PURE__ */ o.jsx("th", { children: "Km/evento" }),
      /* @__PURE__ */ o.jsx("th", { children: "Correções" }),
      /* @__PURE__ */ o.jsx("th", { children: "Ações" })
    ] }) }),
    /* @__PURE__ */ o.jsx("tbody", { children: p.map((j, v) => /* @__PURE__ */ o.jsxs("tr", { children: [
      /* @__PURE__ */ o.jsx("td", { children: j.posicao }),
      /* @__PURE__ */ o.jsx("td", { children: /* @__PURE__ */ o.jsx("strong", { children: j.nome }) }),
      /* @__PURE__ */ o.jsx("td", { children: j.unidade }),
      /* @__PURE__ */ o.jsx("td", { children: ee(j.km, 1) }),
      /* @__PURE__ */ o.jsx("td", { children: ee(j.total_eventos) }),
      /* @__PURE__ */ o.jsx("td", { className: j.taxa >= j.meta * 2 ? "lg-rate-top" : j.taxa >= j.meta ? "lg-good" : j.taxa >= j.meta / 2 ? "lg-attention" : "lg-bad", children: /* @__PURE__ */ o.jsx("b", { children: ee(j.taxa, 2) }) }),
      /* @__PURE__ */ o.jsx("td", { children: j.total_correcoes ? "-" + j.total_correcoes + " corrigidos" : j.ev_total_cobli + " ev brutos" }),
      /* @__PURE__ */ o.jsx("td", { children: /* @__PURE__ */ o.jsxs("div", { className: "lg-actions", children: [
        /* @__PURE__ */ o.jsx("button", { onClick: () => void N(j), children: "Resumo" }),
        d && /* @__PURE__ */ o.jsx("button", { onClick: () => d(j), children: "Ver/corrigir" })
      ] }) })
    ] }, j.id)) })
  ] }) }) : /* @__PURE__ */ o.jsx(Jt, {});
}
function wf({ unit: p, refresh: N, run: d, select: j }) {
  const [v, P] = Z.useState([]);
  return Z.useEffect(() => {
    const y = new AbortController();
    return le("/importacoes", p, "GET", void 0, y.signal).then((z) => P(z.rows)).catch(() => {
    }), () => y.abort();
  }, [p, N]), /* @__PURE__ */ o.jsxs("section", { className: "lg-card", children: [
    /* @__PURE__ */ o.jsx("h3", { children: "Últimas importações" }),
    /* @__PURE__ */ o.jsx("div", { className: "lg-people", children: v.map((y) => /* @__PURE__ */ o.jsxs("article", { children: [
      /* @__PURE__ */ o.jsxs("div", { children: [
        /* @__PURE__ */ o.jsx("strong", { children: y.nome_arquivo }),
        /* @__PURE__ */ o.jsxs("small", { children: [
          y.competencia,
          " · ",
          y.status
        ] })
      ] }),
      /* @__PURE__ */ o.jsx("button", { onClick: () => d(async () => {
        const z = await le(`/importacoes/${y.id}`, p);
        j(z);
      }, "Prévia carregada."), children: "Ver prévia/diferenças" }),
      /* @__PURE__ */ o.jsx("button", { onClick: () => d(() => is(`/importacoes/${y.id}/arquivo`, p), "Arquivo baixado."), children: "Baixar original" })
    ] }, y.id)) }),
    !v.length && /* @__PURE__ */ o.jsx(Jt, {})
  ] });
}
function kf({ run: p }) {
  var be;
  const [N, d] = Z.useState([]), [j, v] = Z.useState([]), [P, y] = Z.useState(null), [z, T] = Z.useState(!1), [F, w] = Z.useState([]), [k, B] = Z.useState(!1), [se, K] = Z.useState(""), X = "/unificado/mapa/api/unified/logistica/users", te = async () => {
    const oe = await fetch(X, { credentials: "same-origin" });
    if (!oe.ok) throw Error("Não foi possível consultar os acessos.");
    const Te = await oe.json();
    d(Te.users), v(Te.units), w(Te.actions_catalog || []), T(!0);
  };
  return /* @__PURE__ */ o.jsxs("section", { className: "lg-card", children: [
    /* @__PURE__ */ o.jsx("h3", { children: "Acessos à Logística" }),
    /* @__PURE__ */ o.jsx("p", { children: "Contas do cadastro central. A unidade selecionada é o vínculo central do usuário e também é utilizada pelos outros módulos." }),
    /* @__PURE__ */ o.jsx("button", { disabled: k, onClick: async () => {
      B(!0), K("");
      try {
        await te();
      } catch (oe) {
        K(oe.message);
      } finally {
        B(!1);
      }
    }, children: "Consultar usuários" }),
    se && /* @__PURE__ */ o.jsx("p", { role: "alert", children: se }),
    z && /* @__PURE__ */ o.jsxs("label", { children: [
      "Usuário",
      /* @__PURE__ */ o.jsxs("select", { value: (P == null ? void 0 : P.id) || "", onChange: (oe) => y(N.find((Te) => Te.id === oe.target.value) || null), children: [
        /* @__PURE__ */ o.jsx("option", { value: "", children: "Selecione" }),
        N.map((oe) => /* @__PURE__ */ o.jsx("option", { value: oe.id, children: oe.nome }, oe.id))
      ] })
    ] }),
    P && /* @__PURE__ */ o.jsxs("form", { onSubmit: (oe) => {
      oe.preventDefault();
      const Te = new FormData(oe.currentTarget);
      p(async () => {
        const pe = await fetch(X + "/" + encodeURIComponent(P.id), { method: "PUT", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ actions: Te.getAll("action"), units: [Te.get("unit")] }) });
        if (!pe.ok) {
          const Ue = await pe.json();
          throw Error(Ue.error || "Não foi possível salvar os acessos.");
        }
        await te(), y(null);
      }, "Acessos atualizados.");
    }, children: [
      F.map((oe) => /* @__PURE__ */ o.jsxs("label", { className: "lg-check", children: [
        /* @__PURE__ */ o.jsx("input", { type: "checkbox", name: "action", value: oe.id, defaultChecked: P.actions.includes(oe.id) }),
        oe.label
      ] }, oe.id)),
      /* @__PURE__ */ o.jsxs("label", { children: [
        "Unidade central",
        /* @__PURE__ */ o.jsxs("select", { name: "unit", defaultValue: P.units.length > 1 ? "todos" : P.units[0] || ((be = j[0]) == null ? void 0 : be.codigo), children: [
          /* @__PURE__ */ o.jsx("option", { value: "todos", children: "Todas as unidades" }),
          j.map((oe) => /* @__PURE__ */ o.jsx("option", { value: oe.codigo, children: oe.nome }, oe.id))
        ] })
      ] }),
      /* @__PURE__ */ o.jsx("button", { className: "primary", disabled: ["user-ricardo", "alex", "marcelo", "suportelogistica"].includes(P.id), children: "Salvar acessos" })
    ] }, P.id)
  ] });
}
let Zt = null, as = null;
function Sf(p, N) {
  as !== p && (Zt == null || Zt.unmount(), Zt = bd.createRoot(p), as = p), Zt.render(/* @__PURE__ */ o.jsx(xf, { route: N }));
}
function Cf() {
  Zt == null || Zt.unmount(), Zt = null, as = null;
}
export {
  Sf as mountLogistica,
  Cf as unmountLogistica
};
