var Bf = { exports: {} }, Dn = {};
var ih;
function pv() {
  if (ih) return Dn;
  ih = 1;
  var i = /* @__PURE__ */ Symbol.for("react.transitional.element"), f = /* @__PURE__ */ Symbol.for("react.fragment");
  function s(d, r, v) {
    var E = null;
    if (v !== void 0 && (E = "" + v), r.key !== void 0 && (E = "" + r.key), "key" in r) {
      v = {};
      for (var R in r)
        R !== "key" && (v[R] = r[R]);
    } else v = r;
    return r = v.ref, {
      $$typeof: i,
      type: d,
      key: E,
      ref: r !== void 0 ? r : null,
      props: v
    };
  }
  return Dn.Fragment = f, Dn.jsx = s, Dn.jsxs = s, Dn;
}
var ch;
function gv() {
  return ch || (ch = 1, Bf.exports = pv()), Bf.exports;
}
var h = gv(), Lf = { exports: {} }, P = {}, fh;
function Sv() {
  if (fh) return P;
  fh = 1;
  var i = { env: {} };
  var f = /* @__PURE__ */ Symbol.for("react.transitional.element"), s = /* @__PURE__ */ Symbol.for("react.portal"), d = /* @__PURE__ */ Symbol.for("react.fragment"), r = /* @__PURE__ */ Symbol.for("react.strict_mode"), v = /* @__PURE__ */ Symbol.for("react.profiler"), E = /* @__PURE__ */ Symbol.for("react.consumer"), R = /* @__PURE__ */ Symbol.for("react.context"), S = /* @__PURE__ */ Symbol.for("react.forward_ref"), y = /* @__PURE__ */ Symbol.for("react.suspense"), M = /* @__PURE__ */ Symbol.for("react.memo"), x = /* @__PURE__ */ Symbol.for("react.lazy"), U = /* @__PURE__ */ Symbol.for("react.activity"), K = Symbol.iterator;
  function J(g) {
    return g === null || typeof g != "object" ? null : (g = K && g[K] || g["@@iterator"], typeof g == "function" ? g : null);
  }
  var Q = {
    isMounted: function() {
      return !1;
    },
    enqueueForceUpdate: function() {
    },
    enqueueReplaceState: function() {
    },
    enqueueSetState: function() {
    }
  }, X = Object.assign, Y = {};
  function $(g, C, q) {
    this.props = g, this.context = C, this.refs = Y, this.updater = q || Q;
  }
  $.prototype.isReactComponent = {}, $.prototype.setState = function(g, C) {
    if (typeof g != "object" && typeof g != "function" && g != null)
      throw Error(
        "takes an object of state variables to update or a function which returns an object of state variables."
      );
    this.updater.enqueueSetState(this, g, C, "setState");
  }, $.prototype.forceUpdate = function(g) {
    this.updater.enqueueForceUpdate(this, g, "forceUpdate");
  };
  function I() {
  }
  I.prototype = $.prototype;
  function at(g, C, q) {
    this.props = g, this.context = C, this.refs = Y, this.updater = q || Q;
  }
  var st = at.prototype = new I();
  st.constructor = at, X(st, $.prototype), st.isPureReactComponent = !0;
  var ht = Array.isArray;
  function mt() {
  }
  var tt = { H: null, A: null, T: null, S: null }, zt = Object.prototype.hasOwnProperty;
  function Qt(g, C, q) {
    var k = q.ref;
    return {
      $$typeof: f,
      type: g,
      key: C,
      ref: k !== void 0 ? k : null,
      props: q
    };
  }
  function ce(g, C) {
    return Qt(g.type, C, g.props);
  }
  function B(g) {
    return typeof g == "object" && g !== null && g.$$typeof === f;
  }
  function Ut(g) {
    var C = { "=": "=0", ":": "=2" };
    return "$" + g.replace(/[=:]/g, function(q) {
      return C[q];
    });
  }
  var w = /\/+/g;
  function nt(g, C) {
    return typeof g == "object" && g !== null && g.key != null ? Ut("" + g.key) : C.toString(36);
  }
  function L(g) {
    switch (g.status) {
      case "fulfilled":
        return g.value;
      case "rejected":
        throw g.reason;
      default:
        switch (typeof g.status == "string" ? g.then(mt, mt) : (g.status = "pending", g.then(
          function(C) {
            g.status === "pending" && (g.status = "fulfilled", g.value = C);
          },
          function(C) {
            g.status === "pending" && (g.status = "rejected", g.reason = C);
          }
        )), g.status) {
          case "fulfilled":
            return g.value;
          case "rejected":
            throw g.reason;
        }
    }
    throw g;
  }
  function H(g, C, q, k, ut) {
    var it = typeof g;
    (it === "undefined" || it === "boolean") && (g = null);
    var St = !1;
    if (g === null) St = !0;
    else
      switch (it) {
        case "bigint":
        case "string":
        case "number":
          St = !0;
          break;
        case "object":
          switch (g.$$typeof) {
            case f:
            case s:
              St = !0;
              break;
            case x:
              return St = g._init, H(
                St(g._payload),
                C,
                q,
                k,
                ut
              );
          }
      }
    if (St)
      return ut = ut(g), St = k === "" ? "." + nt(g, 0) : k, ht(ut) ? (q = "", St != null && (q = St.replace(w, "$&/") + "/"), H(ut, C, q, "", function(qa) {
        return qa;
      })) : ut != null && (B(ut) && (ut = ce(
        ut,
        q + (ut.key == null || g && g.key === ut.key ? "" : ("" + ut.key).replace(
          w,
          "$&/"
        ) + "/") + St
      )), C.push(ut)), 1;
    St = 0;
    var It = k === "" ? "." : k + ":";
    if (ht(g))
      for (var Ht = 0; Ht < g.length; Ht++)
        k = g[Ht], it = It + nt(k, Ht), St += H(
          k,
          C,
          q,
          it,
          ut
        );
    else if (Ht = J(g), typeof Ht == "function")
      for (g = Ht.call(g), Ht = 0; !(k = g.next()).done; )
        k = k.value, it = It + nt(k, Ht++), St += H(
          k,
          C,
          q,
          it,
          ut
        );
    else if (it === "object") {
      if (typeof g.then == "function")
        return H(
          L(g),
          C,
          q,
          k,
          ut
        );
      throw C = String(g), Error(
        "Objects are not valid as a React child (found: " + (C === "[object Object]" ? "object with keys {" + Object.keys(g).join(", ") + "}" : C) + "). If you meant to render a collection of children, use an array instead."
      );
    }
    return St;
  }
  function G(g, C, q) {
    if (g == null) return g;
    var k = [], ut = 0;
    return H(g, k, "", "", function(it) {
      return C.call(q, it, ut++);
    }), k;
  }
  function pt(g) {
    if (g._status === -1) {
      var C = g._result;
      C = C(), C.then(
        function(q) {
          (g._status === 0 || g._status === -1) && (g._status = 1, g._result = q);
        },
        function(q) {
          (g._status === 0 || g._status === -1) && (g._status = 2, g._result = q);
        }
      ), g._status === -1 && (g._status = 0, g._result = C);
    }
    if (g._status === 1) return g._result.default;
    throw g._result;
  }
  var xt = typeof reportError == "function" ? reportError : function(g) {
    if (typeof window == "object" && typeof window.ErrorEvent == "function") {
      var C = new window.ErrorEvent("error", {
        bubbles: !0,
        cancelable: !0,
        message: typeof g == "object" && g !== null && typeof g.message == "string" ? String(g.message) : String(g),
        error: g
      });
      if (!window.dispatchEvent(C)) return;
    } else if (typeof i == "object" && typeof i.emit == "function") {
      i.emit("uncaughtException", g);
      return;
    }
    console.error(g);
  }, fe = {
    map: G,
    forEach: function(g, C, q) {
      G(
        g,
        function() {
          C.apply(this, arguments);
        },
        q
      );
    },
    count: function(g) {
      var C = 0;
      return G(g, function() {
        C++;
      }), C;
    },
    toArray: function(g) {
      return G(g, function(C) {
        return C;
      }) || [];
    },
    only: function(g) {
      if (!B(g))
        throw Error(
          "React.Children.only expected to receive a single React element child."
        );
      return g;
    }
  };
  return P.Activity = U, P.Children = fe, P.Component = $, P.Fragment = d, P.Profiler = v, P.PureComponent = at, P.StrictMode = r, P.Suspense = y, P.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = tt, P.__COMPILER_RUNTIME = {
    __proto__: null,
    c: function(g) {
      return tt.H.useMemoCache(g);
    }
  }, P.cache = function(g) {
    return function() {
      return g.apply(null, arguments);
    };
  }, P.cacheSignal = function() {
    return null;
  }, P.cloneElement = function(g, C, q) {
    if (g == null)
      throw Error(
        "The argument must be a React element, but you passed " + g + "."
      );
    var k = X({}, g.props), ut = g.key;
    if (C != null)
      for (it in C.key !== void 0 && (ut = "" + C.key), C)
        !zt.call(C, it) || it === "key" || it === "__self" || it === "__source" || it === "ref" && C.ref === void 0 || (k[it] = C[it]);
    var it = arguments.length - 2;
    if (it === 1) k.children = q;
    else if (1 < it) {
      for (var St = Array(it), It = 0; It < it; It++)
        St[It] = arguments[It + 2];
      k.children = St;
    }
    return Qt(g.type, ut, k);
  }, P.createContext = function(g) {
    return g = {
      $$typeof: R,
      _currentValue: g,
      _currentValue2: g,
      _threadCount: 0,
      Provider: null,
      Consumer: null
    }, g.Provider = g, g.Consumer = {
      $$typeof: E,
      _context: g
    }, g;
  }, P.createElement = function(g, C, q) {
    var k, ut = {}, it = null;
    if (C != null)
      for (k in C.key !== void 0 && (it = "" + C.key), C)
        zt.call(C, k) && k !== "key" && k !== "__self" && k !== "__source" && (ut[k] = C[k]);
    var St = arguments.length - 2;
    if (St === 1) ut.children = q;
    else if (1 < St) {
      for (var It = Array(St), Ht = 0; Ht < St; Ht++)
        It[Ht] = arguments[Ht + 2];
      ut.children = It;
    }
    if (g && g.defaultProps)
      for (k in St = g.defaultProps, St)
        ut[k] === void 0 && (ut[k] = St[k]);
    return Qt(g, it, ut);
  }, P.createRef = function() {
    return { current: null };
  }, P.forwardRef = function(g) {
    return { $$typeof: S, render: g };
  }, P.isValidElement = B, P.lazy = function(g) {
    return {
      $$typeof: x,
      _payload: { _status: -1, _result: g },
      _init: pt
    };
  }, P.memo = function(g, C) {
    return {
      $$typeof: M,
      type: g,
      compare: C === void 0 ? null : C
    };
  }, P.startTransition = function(g) {
    var C = tt.T, q = {};
    tt.T = q;
    try {
      var k = g(), ut = tt.S;
      ut !== null && ut(q, k), typeof k == "object" && k !== null && typeof k.then == "function" && k.then(mt, xt);
    } catch (it) {
      xt(it);
    } finally {
      C !== null && q.types !== null && (C.types = q.types), tt.T = C;
    }
  }, P.unstable_useCacheRefresh = function() {
    return tt.H.useCacheRefresh();
  }, P.use = function(g) {
    return tt.H.use(g);
  }, P.useActionState = function(g, C, q) {
    return tt.H.useActionState(g, C, q);
  }, P.useCallback = function(g, C) {
    return tt.H.useCallback(g, C);
  }, P.useContext = function(g) {
    return tt.H.useContext(g);
  }, P.useDebugValue = function() {
  }, P.useDeferredValue = function(g, C) {
    return tt.H.useDeferredValue(g, C);
  }, P.useEffect = function(g, C) {
    return tt.H.useEffect(g, C);
  }, P.useEffectEvent = function(g) {
    return tt.H.useEffectEvent(g);
  }, P.useId = function() {
    return tt.H.useId();
  }, P.useImperativeHandle = function(g, C, q) {
    return tt.H.useImperativeHandle(g, C, q);
  }, P.useInsertionEffect = function(g, C) {
    return tt.H.useInsertionEffect(g, C);
  }, P.useLayoutEffect = function(g, C) {
    return tt.H.useLayoutEffect(g, C);
  }, P.useMemo = function(g, C) {
    return tt.H.useMemo(g, C);
  }, P.useOptimistic = function(g, C) {
    return tt.H.useOptimistic(g, C);
  }, P.useReducer = function(g, C, q) {
    return tt.H.useReducer(g, C, q);
  }, P.useRef = function(g) {
    return tt.H.useRef(g);
  }, P.useState = function(g) {
    return tt.H.useState(g);
  }, P.useSyncExternalStore = function(g, C, q) {
    return tt.H.useSyncExternalStore(
      g,
      C,
      q
    );
  }, P.useTransition = function() {
    return tt.H.useTransition();
  }, P.version = "19.2.4", P;
}
var sh;
function Wf() {
  return sh || (sh = 1, Lf.exports = Sv()), Lf.exports;
}
var A = Wf(), qf = { exports: {} }, Cn = {}, Yf = { exports: {} }, Gf = {};
var rh;
function bv() {
  return rh || (rh = 1, (function(i) {
    function f(L, H) {
      var G = L.length;
      L.push(H);
      t: for (; 0 < G; ) {
        var pt = G - 1 >>> 1, xt = L[pt];
        if (0 < r(xt, H))
          L[pt] = H, L[G] = xt, G = pt;
        else break t;
      }
    }
    function s(L) {
      return L.length === 0 ? null : L[0];
    }
    function d(L) {
      if (L.length === 0) return null;
      var H = L[0], G = L.pop();
      if (G !== H) {
        L[0] = G;
        t: for (var pt = 0, xt = L.length, fe = xt >>> 1; pt < fe; ) {
          var g = 2 * (pt + 1) - 1, C = L[g], q = g + 1, k = L[q];
          if (0 > r(C, G))
            q < xt && 0 > r(k, C) ? (L[pt] = k, L[q] = G, pt = q) : (L[pt] = C, L[g] = G, pt = g);
          else if (q < xt && 0 > r(k, G))
            L[pt] = k, L[q] = G, pt = q;
          else break t;
        }
      }
      return H;
    }
    function r(L, H) {
      var G = L.sortIndex - H.sortIndex;
      return G !== 0 ? G : L.id - H.id;
    }
    if (i.unstable_now = void 0, typeof performance == "object" && typeof performance.now == "function") {
      var v = performance;
      i.unstable_now = function() {
        return v.now();
      };
    } else {
      var E = Date, R = E.now();
      i.unstable_now = function() {
        return E.now() - R;
      };
    }
    var S = [], y = [], M = 1, x = null, U = 3, K = !1, J = !1, Q = !1, X = !1, Y = typeof setTimeout == "function" ? setTimeout : null, $ = typeof clearTimeout == "function" ? clearTimeout : null, I = typeof setImmediate != "undefined" ? setImmediate : null;
    function at(L) {
      for (var H = s(y); H !== null; ) {
        if (H.callback === null) d(y);
        else if (H.startTime <= L)
          d(y), H.sortIndex = H.expirationTime, f(S, H);
        else break;
        H = s(y);
      }
    }
    function st(L) {
      if (Q = !1, at(L), !J)
        if (s(S) !== null)
          J = !0, ht || (ht = !0, B());
        else {
          var H = s(y);
          H !== null && nt(st, H.startTime - L);
        }
    }
    var ht = !1, mt = -1, tt = 5, zt = -1;
    function Qt() {
      return X ? !0 : !(i.unstable_now() - zt < tt);
    }
    function ce() {
      if (X = !1, ht) {
        var L = i.unstable_now();
        zt = L;
        var H = !0;
        try {
          t: {
            J = !1, Q && (Q = !1, $(mt), mt = -1), K = !0;
            var G = U;
            try {
              e: {
                for (at(L), x = s(S); x !== null && !(x.expirationTime > L && Qt()); ) {
                  var pt = x.callback;
                  if (typeof pt == "function") {
                    x.callback = null, U = x.priorityLevel;
                    var xt = pt(
                      x.expirationTime <= L
                    );
                    if (L = i.unstable_now(), typeof xt == "function") {
                      x.callback = xt, at(L), H = !0;
                      break e;
                    }
                    x === s(S) && d(S), at(L);
                  } else d(S);
                  x = s(S);
                }
                if (x !== null) H = !0;
                else {
                  var fe = s(y);
                  fe !== null && nt(
                    st,
                    fe.startTime - L
                  ), H = !1;
                }
              }
              break t;
            } finally {
              x = null, U = G, K = !1;
            }
            H = void 0;
          }
        } finally {
          H ? B() : ht = !1;
        }
      }
    }
    var B;
    if (typeof I == "function")
      B = function() {
        I(ce);
      };
    else if (typeof MessageChannel != "undefined") {
      var Ut = new MessageChannel(), w = Ut.port2;
      Ut.port1.onmessage = ce, B = function() {
        w.postMessage(null);
      };
    } else
      B = function() {
        Y(ce, 0);
      };
    function nt(L, H) {
      mt = Y(function() {
        L(i.unstable_now());
      }, H);
    }
    i.unstable_IdlePriority = 5, i.unstable_ImmediatePriority = 1, i.unstable_LowPriority = 4, i.unstable_NormalPriority = 3, i.unstable_Profiling = null, i.unstable_UserBlockingPriority = 2, i.unstable_cancelCallback = function(L) {
      L.callback = null;
    }, i.unstable_forceFrameRate = function(L) {
      0 > L || 125 < L ? console.error(
        "forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"
      ) : tt = 0 < L ? Math.floor(1e3 / L) : 5;
    }, i.unstable_getCurrentPriorityLevel = function() {
      return U;
    }, i.unstable_next = function(L) {
      switch (U) {
        case 1:
        case 2:
        case 3:
          var H = 3;
          break;
        default:
          H = U;
      }
      var G = U;
      U = H;
      try {
        return L();
      } finally {
        U = G;
      }
    }, i.unstable_requestPaint = function() {
      X = !0;
    }, i.unstable_runWithPriority = function(L, H) {
      switch (L) {
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
          break;
        default:
          L = 3;
      }
      var G = U;
      U = L;
      try {
        return H();
      } finally {
        U = G;
      }
    }, i.unstable_scheduleCallback = function(L, H, G) {
      var pt = i.unstable_now();
      switch (typeof G == "object" && G !== null ? (G = G.delay, G = typeof G == "number" && 0 < G ? pt + G : pt) : G = pt, L) {
        case 1:
          var xt = -1;
          break;
        case 2:
          xt = 250;
          break;
        case 5:
          xt = 1073741823;
          break;
        case 4:
          xt = 1e4;
          break;
        default:
          xt = 5e3;
      }
      return xt = G + xt, L = {
        id: M++,
        callback: H,
        priorityLevel: L,
        startTime: G,
        expirationTime: xt,
        sortIndex: -1
      }, G > pt ? (L.sortIndex = G, f(y, L), s(S) === null && L === s(y) && (Q ? ($(mt), mt = -1) : Q = !0, nt(st, G - pt))) : (L.sortIndex = xt, f(S, L), J || K || (J = !0, ht || (ht = !0, B()))), L;
    }, i.unstable_shouldYield = Qt, i.unstable_wrapCallback = function(L) {
      var H = U;
      return function() {
        var G = U;
        U = H;
        try {
          return L.apply(this, arguments);
        } finally {
          U = G;
        }
      };
    };
  })(Gf)), Gf;
}
var oh;
function Ev() {
  return oh || (oh = 1, Yf.exports = bv()), Yf.exports;
}
var Xf = { exports: {} }, Wt = {};
var dh;
function jv() {
  if (dh) return Wt;
  dh = 1;
  var i = Wf();
  function f(S) {
    var y = "https://react.dev/errors/" + S;
    if (1 < arguments.length) {
      y += "?args[]=" + encodeURIComponent(arguments[1]);
      for (var M = 2; M < arguments.length; M++)
        y += "&args[]=" + encodeURIComponent(arguments[M]);
    }
    return "Minified React error #" + S + "; visit " + y + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
  }
  function s() {
  }
  var d = {
    d: {
      f: s,
      r: function() {
        throw Error(f(522));
      },
      D: s,
      C: s,
      L: s,
      m: s,
      X: s,
      S: s,
      M: s
    },
    p: 0,
    findDOMNode: null
  }, r = /* @__PURE__ */ Symbol.for("react.portal");
  function v(S, y, M) {
    var x = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
    return {
      $$typeof: r,
      key: x == null ? null : "" + x,
      children: S,
      containerInfo: y,
      implementation: M
    };
  }
  var E = i.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
  function R(S, y) {
    if (S === "font") return "";
    if (typeof y == "string")
      return y === "use-credentials" ? y : "";
  }
  return Wt.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = d, Wt.createPortal = function(S, y) {
    var M = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
    if (!y || y.nodeType !== 1 && y.nodeType !== 9 && y.nodeType !== 11)
      throw Error(f(299));
    return v(S, y, null, M);
  }, Wt.flushSync = function(S) {
    var y = E.T, M = d.p;
    try {
      if (E.T = null, d.p = 2, S) return S();
    } finally {
      E.T = y, d.p = M, d.d.f();
    }
  }, Wt.preconnect = function(S, y) {
    typeof S == "string" && (y ? (y = y.crossOrigin, y = typeof y == "string" ? y === "use-credentials" ? y : "" : void 0) : y = null, d.d.C(S, y));
  }, Wt.prefetchDNS = function(S) {
    typeof S == "string" && d.d.D(S);
  }, Wt.preinit = function(S, y) {
    if (typeof S == "string" && y && typeof y.as == "string") {
      var M = y.as, x = R(M, y.crossOrigin), U = typeof y.integrity == "string" ? y.integrity : void 0, K = typeof y.fetchPriority == "string" ? y.fetchPriority : void 0;
      M === "style" ? d.d.S(
        S,
        typeof y.precedence == "string" ? y.precedence : void 0,
        {
          crossOrigin: x,
          integrity: U,
          fetchPriority: K
        }
      ) : M === "script" && d.d.X(S, {
        crossOrigin: x,
        integrity: U,
        fetchPriority: K,
        nonce: typeof y.nonce == "string" ? y.nonce : void 0
      });
    }
  }, Wt.preinitModule = function(S, y) {
    if (typeof S == "string")
      if (typeof y == "object" && y !== null) {
        if (y.as == null || y.as === "script") {
          var M = R(
            y.as,
            y.crossOrigin
          );
          d.d.M(S, {
            crossOrigin: M,
            integrity: typeof y.integrity == "string" ? y.integrity : void 0,
            nonce: typeof y.nonce == "string" ? y.nonce : void 0
          });
        }
      } else y == null && d.d.M(S);
  }, Wt.preload = function(S, y) {
    if (typeof S == "string" && typeof y == "object" && y !== null && typeof y.as == "string") {
      var M = y.as, x = R(M, y.crossOrigin);
      d.d.L(S, M, {
        crossOrigin: x,
        integrity: typeof y.integrity == "string" ? y.integrity : void 0,
        nonce: typeof y.nonce == "string" ? y.nonce : void 0,
        type: typeof y.type == "string" ? y.type : void 0,
        fetchPriority: typeof y.fetchPriority == "string" ? y.fetchPriority : void 0,
        referrerPolicy: typeof y.referrerPolicy == "string" ? y.referrerPolicy : void 0,
        imageSrcSet: typeof y.imageSrcSet == "string" ? y.imageSrcSet : void 0,
        imageSizes: typeof y.imageSizes == "string" ? y.imageSizes : void 0,
        media: typeof y.media == "string" ? y.media : void 0
      });
    }
  }, Wt.preloadModule = function(S, y) {
    if (typeof S == "string")
      if (y) {
        var M = R(y.as, y.crossOrigin);
        d.d.m(S, {
          as: typeof y.as == "string" && y.as !== "script" ? y.as : void 0,
          crossOrigin: M,
          integrity: typeof y.integrity == "string" ? y.integrity : void 0
        });
      } else d.d.m(S);
  }, Wt.requestFormReset = function(S) {
    d.d.r(S);
  }, Wt.unstable_batchedUpdates = function(S, y) {
    return S(y);
  }, Wt.useFormState = function(S, y, M) {
    return E.H.useFormState(S, y, M);
  }, Wt.useFormStatus = function() {
    return E.H.useHostTransitionStatus();
  }, Wt.version = "19.2.4", Wt;
}
var hh;
function Tv() {
  if (hh) return Xf.exports;
  hh = 1;
  function i() {
    if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ == "undefined" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"))
      try {
        __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(i);
      } catch (f) {
        console.error(f);
      }
  }
  return i(), Xf.exports = jv(), Xf.exports;
}
var mh;
function _v() {
  if (mh) return Cn;
  mh = 1;
  var i = { env: {} };
  var f = Ev(), s = Wf(), d = Tv();
  function r(t) {
    var e = "https://react.dev/errors/" + t;
    if (1 < arguments.length) {
      e += "?args[]=" + encodeURIComponent(arguments[1]);
      for (var l = 2; l < arguments.length; l++)
        e += "&args[]=" + encodeURIComponent(arguments[l]);
    }
    return "Minified React error #" + t + "; visit " + e + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
  }
  function v(t) {
    return !(!t || t.nodeType !== 1 && t.nodeType !== 9 && t.nodeType !== 11);
  }
  function E(t) {
    var e = t, l = t;
    if (t.alternate) for (; e.return; ) e = e.return;
    else {
      t = e;
      do
        e = t, (e.flags & 4098) !== 0 && (l = e.return), t = e.return;
      while (t);
    }
    return e.tag === 3 ? l : null;
  }
  function R(t) {
    if (t.tag === 13) {
      var e = t.memoizedState;
      if (e === null && (t = t.alternate, t !== null && (e = t.memoizedState)), e !== null) return e.dehydrated;
    }
    return null;
  }
  function S(t) {
    if (t.tag === 31) {
      var e = t.memoizedState;
      if (e === null && (t = t.alternate, t !== null && (e = t.memoizedState)), e !== null) return e.dehydrated;
    }
    return null;
  }
  function y(t) {
    if (E(t) !== t)
      throw Error(r(188));
  }
  function M(t) {
    var e = t.alternate;
    if (!e) {
      if (e = E(t), e === null) throw Error(r(188));
      return e !== t ? null : t;
    }
    for (var l = t, a = e; ; ) {
      var n = l.return;
      if (n === null) break;
      var u = n.alternate;
      if (u === null) {
        if (a = n.return, a !== null) {
          l = a;
          continue;
        }
        break;
      }
      if (n.child === u.child) {
        for (u = n.child; u; ) {
          if (u === l) return y(n), t;
          if (u === a) return y(n), e;
          u = u.sibling;
        }
        throw Error(r(188));
      }
      if (l.return !== a.return) l = n, a = u;
      else {
        for (var c = !1, o = n.child; o; ) {
          if (o === l) {
            c = !0, l = n, a = u;
            break;
          }
          if (o === a) {
            c = !0, a = n, l = u;
            break;
          }
          o = o.sibling;
        }
        if (!c) {
          for (o = u.child; o; ) {
            if (o === l) {
              c = !0, l = u, a = n;
              break;
            }
            if (o === a) {
              c = !0, a = u, l = n;
              break;
            }
            o = o.sibling;
          }
          if (!c) throw Error(r(189));
        }
      }
      if (l.alternate !== a) throw Error(r(190));
    }
    if (l.tag !== 3) throw Error(r(188));
    return l.stateNode.current === l ? t : e;
  }
  function x(t) {
    var e = t.tag;
    if (e === 5 || e === 26 || e === 27 || e === 6) return t;
    for (t = t.child; t !== null; ) {
      if (e = x(t), e !== null) return e;
      t = t.sibling;
    }
    return null;
  }
  var U = Object.assign, K = /* @__PURE__ */ Symbol.for("react.element"), J = /* @__PURE__ */ Symbol.for("react.transitional.element"), Q = /* @__PURE__ */ Symbol.for("react.portal"), X = /* @__PURE__ */ Symbol.for("react.fragment"), Y = /* @__PURE__ */ Symbol.for("react.strict_mode"), $ = /* @__PURE__ */ Symbol.for("react.profiler"), I = /* @__PURE__ */ Symbol.for("react.consumer"), at = /* @__PURE__ */ Symbol.for("react.context"), st = /* @__PURE__ */ Symbol.for("react.forward_ref"), ht = /* @__PURE__ */ Symbol.for("react.suspense"), mt = /* @__PURE__ */ Symbol.for("react.suspense_list"), tt = /* @__PURE__ */ Symbol.for("react.memo"), zt = /* @__PURE__ */ Symbol.for("react.lazy"), Qt = /* @__PURE__ */ Symbol.for("react.activity"), ce = /* @__PURE__ */ Symbol.for("react.memo_cache_sentinel"), B = Symbol.iterator;
  function Ut(t) {
    return t === null || typeof t != "object" ? null : (t = B && t[B] || t["@@iterator"], typeof t == "function" ? t : null);
  }
  var w = /* @__PURE__ */ Symbol.for("react.client.reference");
  function nt(t) {
    if (t == null) return null;
    if (typeof t == "function")
      return t.$$typeof === w ? null : t.displayName || t.name || null;
    if (typeof t == "string") return t;
    switch (t) {
      case X:
        return "Fragment";
      case $:
        return "Profiler";
      case Y:
        return "StrictMode";
      case ht:
        return "Suspense";
      case mt:
        return "SuspenseList";
      case Qt:
        return "Activity";
    }
    if (typeof t == "object")
      switch (t.$$typeof) {
        case Q:
          return "Portal";
        case at:
          return t.displayName || "Context";
        case I:
          return (t._context.displayName || "Context") + ".Consumer";
        case st:
          var e = t.render;
          return t = t.displayName, t || (t = e.displayName || e.name || "", t = t !== "" ? "ForwardRef(" + t + ")" : "ForwardRef"), t;
        case tt:
          return e = t.displayName || null, e !== null ? e : nt(t.type) || "Memo";
        case zt:
          e = t._payload, t = t._init;
          try {
            return nt(t(e));
          } catch (l) {
          }
      }
    return null;
  }
  var L = Array.isArray, H = s.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, G = d.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, pt = {
    pending: !1,
    data: null,
    method: null,
    action: null
  }, xt = [], fe = -1;
  function g(t) {
    return { current: t };
  }
  function C(t) {
    0 > fe || (t.current = xt[fe], xt[fe] = null, fe--);
  }
  function q(t, e) {
    fe++, xt[fe] = t.current, t.current = e;
  }
  var k = g(null), ut = g(null), it = g(null), St = g(null);
  function It(t, e) {
    switch (q(it, e), q(ut, t), q(k, null), e.nodeType) {
      case 9:
      case 11:
        t = (t = e.documentElement) && (t = t.namespaceURI) ? Nd(t) : 0;
        break;
      default:
        if (t = e.tagName, e = e.namespaceURI)
          e = Nd(e), t = Od(e, t);
        else
          switch (t) {
            case "svg":
              t = 1;
              break;
            case "math":
              t = 2;
              break;
            default:
              t = 0;
          }
    }
    C(k), q(k, t);
  }
  function Ht() {
    C(k), C(ut), C(it);
  }
  function qa(t) {
    t.memoizedState !== null && q(St, t);
    var e = k.current, l = Od(e, t.type);
    e !== l && (q(ut, t), q(k, l));
  }
  function qn(t) {
    ut.current === t && (C(k), C(ut)), St.current === t && (C(St), Rn._currentValue = pt);
  }
  var pi, ns;
  function Ml(t) {
    if (pi === void 0)
      try {
        throw Error();
      } catch (l) {
        var e = l.stack.trim().match(/\n( *(at )?)/);
        pi = e && e[1] || "", ns = -1 < l.stack.indexOf(`
    at`) ? " (<anonymous>)" : -1 < l.stack.indexOf("@") ? "@unknown:0:0" : "";
      }
    return `
` + pi + t + ns;
  }
  var gi = !1;
  function Si(t, e) {
    if (!t || gi) return "";
    gi = !0;
    var l = Error.prepareStackTrace;
    Error.prepareStackTrace = void 0;
    try {
      var a = {
        DetermineComponentFrameRoot: function() {
          try {
            if (e) {
              var D = function() {
                throw Error();
              };
              if (Object.defineProperty(D.prototype, "props", {
                set: function() {
                  throw Error();
                }
              }), typeof Reflect == "object" && Reflect.construct) {
                try {
                  Reflect.construct(D, []);
                } catch (z) {
                  var _ = z;
                }
                Reflect.construct(t, [], D);
              } else {
                try {
                  D.call();
                } catch (z) {
                  _ = z;
                }
                t.call(D.prototype);
              }
            } else {
              try {
                throw Error();
              } catch (z) {
                _ = z;
              }
              (D = t()) && typeof D.catch == "function" && D.catch(function() {
              });
            }
          } catch (z) {
            if (z && _ && typeof z.stack == "string")
              return [z.stack, _.stack];
          }
          return [null, null];
        }
      };
      a.DetermineComponentFrameRoot.displayName = "DetermineComponentFrameRoot";
      var n = Object.getOwnPropertyDescriptor(
        a.DetermineComponentFrameRoot,
        "name"
      );
      n && n.configurable && Object.defineProperty(
        a.DetermineComponentFrameRoot,
        "name",
        { value: "DetermineComponentFrameRoot" }
      );
      var u = a.DetermineComponentFrameRoot(), c = u[0], o = u[1];
      if (c && o) {
        var m = c.split(`
`), T = o.split(`
`);
        for (n = a = 0; a < m.length && !m[a].includes("DetermineComponentFrameRoot"); )
          a++;
        for (; n < T.length && !T[n].includes(
          "DetermineComponentFrameRoot"
        ); )
          n++;
        if (a === m.length || n === T.length)
          for (a = m.length - 1, n = T.length - 1; 1 <= a && 0 <= n && m[a] !== T[n]; )
            n--;
        for (; 1 <= a && 0 <= n; a--, n--)
          if (m[a] !== T[n]) {
            if (a !== 1 || n !== 1)
              do
                if (a--, n--, 0 > n || m[a] !== T[n]) {
                  var N = `
` + m[a].replace(" at new ", " at ");
                  return t.displayName && N.includes("<anonymous>") && (N = N.replace("<anonymous>", t.displayName)), N;
                }
              while (1 <= a && 0 <= n);
            break;
          }
      }
    } finally {
      gi = !1, Error.prepareStackTrace = l;
    }
    return (l = t ? t.displayName || t.name : "") ? Ml(l) : "";
  }
  function kh(t, e) {
    switch (t.tag) {
      case 26:
      case 27:
      case 5:
        return Ml(t.type);
      case 16:
        return Ml("Lazy");
      case 13:
        return t.child !== e && e !== null ? Ml("Suspense Fallback") : Ml("Suspense");
      case 19:
        return Ml("SuspenseList");
      case 0:
      case 15:
        return Si(t.type, !1);
      case 11:
        return Si(t.type.render, !1);
      case 1:
        return Si(t.type, !0);
      case 31:
        return Ml("Activity");
      default:
        return "";
    }
  }
  function us(t) {
    try {
      var e = "", l = null;
      do
        e += kh(t, l), l = t, t = t.return;
      while (t);
      return e;
    } catch (a) {
      return `
Error generating stack: ` + a.message + `
` + a.stack;
    }
  }
  var bi = Object.prototype.hasOwnProperty, Ei = f.unstable_scheduleCallback, ji = f.unstable_cancelCallback, Fh = f.unstable_shouldYield, $h = f.unstable_requestPaint, se = f.unstable_now, Wh = f.unstable_getCurrentPriorityLevel, is = f.unstable_ImmediatePriority, cs = f.unstable_UserBlockingPriority, Yn = f.unstable_NormalPriority, Ih = f.unstable_LowPriority, fs = f.unstable_IdlePriority, Ph = f.log, tm = f.unstable_setDisableYieldValue, Ya = null, re = null;
  function il(t) {
    if (typeof Ph == "function" && tm(t), re && typeof re.setStrictMode == "function")
      try {
        re.setStrictMode(Ya, t);
      } catch (e) {
      }
  }
  var oe = Math.clz32 ? Math.clz32 : am, em = Math.log, lm = Math.LN2;
  function am(t) {
    return t >>>= 0, t === 0 ? 32 : 31 - (em(t) / lm | 0) | 0;
  }
  var Gn = 256, Xn = 262144, Qn = 4194304;
  function Dl(t) {
    var e = t & 42;
    if (e !== 0) return e;
    switch (t & -t) {
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
        return 64;
      case 128:
        return 128;
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
        return t & 261888;
      case 262144:
      case 524288:
      case 1048576:
      case 2097152:
        return t & 3932160;
      case 4194304:
      case 8388608:
      case 16777216:
      case 33554432:
        return t & 62914560;
      case 67108864:
        return 67108864;
      case 134217728:
        return 134217728;
      case 268435456:
        return 268435456;
      case 536870912:
        return 536870912;
      case 1073741824:
        return 0;
      default:
        return t;
    }
  }
  function Zn(t, e, l) {
    var a = t.pendingLanes;
    if (a === 0) return 0;
    var n = 0, u = t.suspendedLanes, c = t.pingedLanes;
    t = t.warmLanes;
    var o = a & 134217727;
    return o !== 0 ? (a = o & ~u, a !== 0 ? n = Dl(a) : (c &= o, c !== 0 ? n = Dl(c) : l || (l = o & ~t, l !== 0 && (n = Dl(l))))) : (o = a & ~u, o !== 0 ? n = Dl(o) : c !== 0 ? n = Dl(c) : l || (l = a & ~t, l !== 0 && (n = Dl(l)))), n === 0 ? 0 : e !== 0 && e !== n && (e & u) === 0 && (u = n & -n, l = e & -e, u >= l || u === 32 && (l & 4194048) !== 0) ? e : n;
  }
  function Ga(t, e) {
    return (t.pendingLanes & ~(t.suspendedLanes & ~t.pingedLanes) & e) === 0;
  }
  function nm(t, e) {
    switch (t) {
      case 1:
      case 2:
      case 4:
      case 8:
      case 64:
        return e + 250;
      case 16:
      case 32:
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
        return e + 5e3;
      case 4194304:
      case 8388608:
      case 16777216:
      case 33554432:
        return -1;
      case 67108864:
      case 134217728:
      case 268435456:
      case 536870912:
      case 1073741824:
        return -1;
      default:
        return -1;
    }
  }
  function ss() {
    var t = Qn;
    return Qn <<= 1, (Qn & 62914560) === 0 && (Qn = 4194304), t;
  }
  function Ti(t) {
    for (var e = [], l = 0; 31 > l; l++) e.push(t);
    return e;
  }
  function Xa(t, e) {
    t.pendingLanes |= e, e !== 268435456 && (t.suspendedLanes = 0, t.pingedLanes = 0, t.warmLanes = 0);
  }
  function um(t, e, l, a, n, u) {
    var c = t.pendingLanes;
    t.pendingLanes = l, t.suspendedLanes = 0, t.pingedLanes = 0, t.warmLanes = 0, t.expiredLanes &= l, t.entangledLanes &= l, t.errorRecoveryDisabledLanes &= l, t.shellSuspendCounter = 0;
    var o = t.entanglements, m = t.expirationTimes, T = t.hiddenUpdates;
    for (l = c & ~l; 0 < l; ) {
      var N = 31 - oe(l), D = 1 << N;
      o[N] = 0, m[N] = -1;
      var _ = T[N];
      if (_ !== null)
        for (T[N] = null, N = 0; N < _.length; N++) {
          var z = _[N];
          z !== null && (z.lane &= -536870913);
        }
      l &= ~D;
    }
    a !== 0 && rs(t, a, 0), u !== 0 && n === 0 && t.tag !== 0 && (t.suspendedLanes |= u & ~(c & ~e));
  }
  function rs(t, e, l) {
    t.pendingLanes |= e, t.suspendedLanes &= ~e;
    var a = 31 - oe(e);
    t.entangledLanes |= e, t.entanglements[a] = t.entanglements[a] | 1073741824 | l & 261930;
  }
  function os(t, e) {
    var l = t.entangledLanes |= e;
    for (t = t.entanglements; l; ) {
      var a = 31 - oe(l), n = 1 << a;
      n & e | t[a] & e && (t[a] |= e), l &= ~n;
    }
  }
  function ds(t, e) {
    var l = e & -e;
    return l = (l & 42) !== 0 ? 1 : _i(l), (l & (t.suspendedLanes | e)) !== 0 ? 0 : l;
  }
  function _i(t) {
    switch (t) {
      case 2:
        t = 1;
        break;
      case 8:
        t = 4;
        break;
      case 32:
        t = 16;
        break;
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
        t = 128;
        break;
      case 268435456:
        t = 134217728;
        break;
      default:
        t = 0;
    }
    return t;
  }
  function Ai(t) {
    return t &= -t, 2 < t ? 8 < t ? (t & 134217727) !== 0 ? 32 : 268435456 : 8 : 2;
  }
  function hs() {
    var t = G.p;
    return t !== 0 ? t : (t = window.event, t === void 0 ? 32 : Pd(t.type));
  }
  function ms(t, e) {
    var l = G.p;
    try {
      return G.p = t, e();
    } finally {
      G.p = l;
    }
  }
  var cl = Math.random().toString(36).slice(2), Jt = "__reactFiber$" + cl, te = "__reactProps$" + cl, Wl = "__reactContainer$" + cl, zi = "__reactEvents$" + cl, im = "__reactListeners$" + cl, cm = "__reactHandles$" + cl, ys = "__reactResources$" + cl, Qa = "__reactMarker$" + cl;
  function xi(t) {
    delete t[Jt], delete t[te], delete t[zi], delete t[im], delete t[cm];
  }
  function Il(t) {
    var e = t[Jt];
    if (e) return e;
    for (var l = t.parentNode; l; ) {
      if (e = l[Wl] || l[Jt]) {
        if (l = e.alternate, e.child !== null || l !== null && l.child !== null)
          for (t = Ld(t); t !== null; ) {
            if (l = t[Jt]) return l;
            t = Ld(t);
          }
        return e;
      }
      t = l, l = t.parentNode;
    }
    return null;
  }
  function Pl(t) {
    if (t = t[Jt] || t[Wl]) {
      var e = t.tag;
      if (e === 5 || e === 6 || e === 13 || e === 31 || e === 26 || e === 27 || e === 3)
        return t;
    }
    return null;
  }
  function Za(t) {
    var e = t.tag;
    if (e === 5 || e === 26 || e === 27 || e === 6) return t.stateNode;
    throw Error(r(33));
  }
  function ta(t) {
    var e = t[ys];
    return e || (e = t[ys] = { hoistableStyles: /* @__PURE__ */ new Map(), hoistableScripts: /* @__PURE__ */ new Map() }), e;
  }
  function wt(t) {
    t[Qa] = !0;
  }
  var vs = /* @__PURE__ */ new Set(), ps = {};
  function Cl(t, e) {
    ea(t, e), ea(t + "Capture", e);
  }
  function ea(t, e) {
    for (ps[t] = e, t = 0; t < e.length; t++)
      vs.add(e[t]);
  }
  var fm = RegExp(
    "^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"
  ), gs = {}, Ss = {};
  function sm(t) {
    return bi.call(Ss, t) ? !0 : bi.call(gs, t) ? !1 : fm.test(t) ? Ss[t] = !0 : (gs[t] = !0, !1);
  }
  function wn(t, e, l) {
    if (sm(e))
      if (l === null) t.removeAttribute(e);
      else {
        switch (typeof l) {
          case "undefined":
          case "function":
          case "symbol":
            t.removeAttribute(e);
            return;
          case "boolean":
            var a = e.toLowerCase().slice(0, 5);
            if (a !== "data-" && a !== "aria-") {
              t.removeAttribute(e);
              return;
            }
        }
        t.setAttribute(e, "" + l);
      }
  }
  function Vn(t, e, l) {
    if (l === null) t.removeAttribute(e);
    else {
      switch (typeof l) {
        case "undefined":
        case "function":
        case "symbol":
        case "boolean":
          t.removeAttribute(e);
          return;
      }
      t.setAttribute(e, "" + l);
    }
  }
  function Xe(t, e, l, a) {
    if (a === null) t.removeAttribute(l);
    else {
      switch (typeof a) {
        case "undefined":
        case "function":
        case "symbol":
        case "boolean":
          t.removeAttribute(l);
          return;
      }
      t.setAttributeNS(e, l, "" + a);
    }
  }
  function be(t) {
    switch (typeof t) {
      case "bigint":
      case "boolean":
      case "number":
      case "string":
      case "undefined":
        return t;
      case "object":
        return t;
      default:
        return "";
    }
  }
  function bs(t) {
    var e = t.type;
    return (t = t.nodeName) && t.toLowerCase() === "input" && (e === "checkbox" || e === "radio");
  }
  function rm(t, e, l) {
    var a = Object.getOwnPropertyDescriptor(
      t.constructor.prototype,
      e
    );
    if (!t.hasOwnProperty(e) && typeof a != "undefined" && typeof a.get == "function" && typeof a.set == "function") {
      var n = a.get, u = a.set;
      return Object.defineProperty(t, e, {
        configurable: !0,
        get: function() {
          return n.call(this);
        },
        set: function(c) {
          l = "" + c, u.call(this, c);
        }
      }), Object.defineProperty(t, e, {
        enumerable: a.enumerable
      }), {
        getValue: function() {
          return l;
        },
        setValue: function(c) {
          l = "" + c;
        },
        stopTracking: function() {
          t._valueTracker = null, delete t[e];
        }
      };
    }
  }
  function Ri(t) {
    if (!t._valueTracker) {
      var e = bs(t) ? "checked" : "value";
      t._valueTracker = rm(
        t,
        e,
        "" + t[e]
      );
    }
  }
  function Es(t) {
    if (!t) return !1;
    var e = t._valueTracker;
    if (!e) return !0;
    var l = e.getValue(), a = "";
    return t && (a = bs(t) ? t.checked ? "true" : "false" : t.value), t = a, t !== l ? (e.setValue(t), !0) : !1;
  }
  function Jn(t) {
    if (t = t || (typeof document != "undefined" ? document : void 0), typeof t == "undefined") return null;
    try {
      return t.activeElement || t.body;
    } catch (e) {
      return t.body;
    }
  }
  var om = /[\n"\\]/g;
  function Ee(t) {
    return t.replace(
      om,
      function(e) {
        return "\\" + e.charCodeAt(0).toString(16) + " ";
      }
    );
  }
  function Ni(t, e, l, a, n, u, c, o) {
    t.name = "", c != null && typeof c != "function" && typeof c != "symbol" && typeof c != "boolean" ? t.type = c : t.removeAttribute("type"), e != null ? c === "number" ? (e === 0 && t.value === "" || t.value != e) && (t.value = "" + be(e)) : t.value !== "" + be(e) && (t.value = "" + be(e)) : c !== "submit" && c !== "reset" || t.removeAttribute("value"), e != null ? Oi(t, c, be(e)) : l != null ? Oi(t, c, be(l)) : a != null && t.removeAttribute("value"), n == null && u != null && (t.defaultChecked = !!u), n != null && (t.checked = n && typeof n != "function" && typeof n != "symbol"), o != null && typeof o != "function" && typeof o != "symbol" && typeof o != "boolean" ? t.name = "" + be(o) : t.removeAttribute("name");
  }
  function js(t, e, l, a, n, u, c, o) {
    if (u != null && typeof u != "function" && typeof u != "symbol" && typeof u != "boolean" && (t.type = u), e != null || l != null) {
      if (!(u !== "submit" && u !== "reset" || e != null)) {
        Ri(t);
        return;
      }
      l = l != null ? "" + be(l) : "", e = e != null ? "" + be(e) : l, o || e === t.value || (t.value = e), t.defaultValue = e;
    }
    a = a != null ? a : n, a = typeof a != "function" && typeof a != "symbol" && !!a, t.checked = o ? t.checked : !!a, t.defaultChecked = !!a, c != null && typeof c != "function" && typeof c != "symbol" && typeof c != "boolean" && (t.name = c), Ri(t);
  }
  function Oi(t, e, l) {
    e === "number" && Jn(t.ownerDocument) === t || t.defaultValue === "" + l || (t.defaultValue = "" + l);
  }
  function la(t, e, l, a) {
    if (t = t.options, e) {
      e = {};
      for (var n = 0; n < l.length; n++)
        e["$" + l[n]] = !0;
      for (l = 0; l < t.length; l++)
        n = e.hasOwnProperty("$" + t[l].value), t[l].selected !== n && (t[l].selected = n), n && a && (t[l].defaultSelected = !0);
    } else {
      for (l = "" + be(l), e = null, n = 0; n < t.length; n++) {
        if (t[n].value === l) {
          t[n].selected = !0, a && (t[n].defaultSelected = !0);
          return;
        }
        e !== null || t[n].disabled || (e = t[n]);
      }
      e !== null && (e.selected = !0);
    }
  }
  function Ts(t, e, l) {
    if (e != null && (e = "" + be(e), e !== t.value && (t.value = e), l == null)) {
      t.defaultValue !== e && (t.defaultValue = e);
      return;
    }
    t.defaultValue = l != null ? "" + be(l) : "";
  }
  function _s(t, e, l, a) {
    if (e == null) {
      if (a != null) {
        if (l != null) throw Error(r(92));
        if (L(a)) {
          if (1 < a.length) throw Error(r(93));
          a = a[0];
        }
        l = a;
      }
      l == null && (l = ""), e = l;
    }
    l = be(e), t.defaultValue = l, a = t.textContent, a === l && a !== "" && a !== null && (t.value = a), Ri(t);
  }
  function aa(t, e) {
    if (e) {
      var l = t.firstChild;
      if (l && l === t.lastChild && l.nodeType === 3) {
        l.nodeValue = e;
        return;
      }
    }
    t.textContent = e;
  }
  var dm = new Set(
    "animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(
      " "
    )
  );
  function As(t, e, l) {
    var a = e.indexOf("--") === 0;
    l == null || typeof l == "boolean" || l === "" ? a ? t.setProperty(e, "") : e === "float" ? t.cssFloat = "" : t[e] = "" : a ? t.setProperty(e, l) : typeof l != "number" || l === 0 || dm.has(e) ? e === "float" ? t.cssFloat = l : t[e] = ("" + l).trim() : t[e] = l + "px";
  }
  function zs(t, e, l) {
    if (e != null && typeof e != "object")
      throw Error(r(62));
    if (t = t.style, l != null) {
      for (var a in l)
        !l.hasOwnProperty(a) || e != null && e.hasOwnProperty(a) || (a.indexOf("--") === 0 ? t.setProperty(a, "") : a === "float" ? t.cssFloat = "" : t[a] = "");
      for (var n in e)
        a = e[n], e.hasOwnProperty(n) && l[n] !== a && As(t, n, a);
    } else
      for (var u in e)
        e.hasOwnProperty(u) && As(t, u, e[u]);
  }
  function Mi(t) {
    if (t.indexOf("-") === -1) return !1;
    switch (t) {
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
  var hm = /* @__PURE__ */ new Map([
    ["acceptCharset", "accept-charset"],
    ["htmlFor", "for"],
    ["httpEquiv", "http-equiv"],
    ["crossOrigin", "crossorigin"],
    ["accentHeight", "accent-height"],
    ["alignmentBaseline", "alignment-baseline"],
    ["arabicForm", "arabic-form"],
    ["baselineShift", "baseline-shift"],
    ["capHeight", "cap-height"],
    ["clipPath", "clip-path"],
    ["clipRule", "clip-rule"],
    ["colorInterpolation", "color-interpolation"],
    ["colorInterpolationFilters", "color-interpolation-filters"],
    ["colorProfile", "color-profile"],
    ["colorRendering", "color-rendering"],
    ["dominantBaseline", "dominant-baseline"],
    ["enableBackground", "enable-background"],
    ["fillOpacity", "fill-opacity"],
    ["fillRule", "fill-rule"],
    ["floodColor", "flood-color"],
    ["floodOpacity", "flood-opacity"],
    ["fontFamily", "font-family"],
    ["fontSize", "font-size"],
    ["fontSizeAdjust", "font-size-adjust"],
    ["fontStretch", "font-stretch"],
    ["fontStyle", "font-style"],
    ["fontVariant", "font-variant"],
    ["fontWeight", "font-weight"],
    ["glyphName", "glyph-name"],
    ["glyphOrientationHorizontal", "glyph-orientation-horizontal"],
    ["glyphOrientationVertical", "glyph-orientation-vertical"],
    ["horizAdvX", "horiz-adv-x"],
    ["horizOriginX", "horiz-origin-x"],
    ["imageRendering", "image-rendering"],
    ["letterSpacing", "letter-spacing"],
    ["lightingColor", "lighting-color"],
    ["markerEnd", "marker-end"],
    ["markerMid", "marker-mid"],
    ["markerStart", "marker-start"],
    ["overlinePosition", "overline-position"],
    ["overlineThickness", "overline-thickness"],
    ["paintOrder", "paint-order"],
    ["panose-1", "panose-1"],
    ["pointerEvents", "pointer-events"],
    ["renderingIntent", "rendering-intent"],
    ["shapeRendering", "shape-rendering"],
    ["stopColor", "stop-color"],
    ["stopOpacity", "stop-opacity"],
    ["strikethroughPosition", "strikethrough-position"],
    ["strikethroughThickness", "strikethrough-thickness"],
    ["strokeDasharray", "stroke-dasharray"],
    ["strokeDashoffset", "stroke-dashoffset"],
    ["strokeLinecap", "stroke-linecap"],
    ["strokeLinejoin", "stroke-linejoin"],
    ["strokeMiterlimit", "stroke-miterlimit"],
    ["strokeOpacity", "stroke-opacity"],
    ["strokeWidth", "stroke-width"],
    ["textAnchor", "text-anchor"],
    ["textDecoration", "text-decoration"],
    ["textRendering", "text-rendering"],
    ["transformOrigin", "transform-origin"],
    ["underlinePosition", "underline-position"],
    ["underlineThickness", "underline-thickness"],
    ["unicodeBidi", "unicode-bidi"],
    ["unicodeRange", "unicode-range"],
    ["unitsPerEm", "units-per-em"],
    ["vAlphabetic", "v-alphabetic"],
    ["vHanging", "v-hanging"],
    ["vIdeographic", "v-ideographic"],
    ["vMathematical", "v-mathematical"],
    ["vectorEffect", "vector-effect"],
    ["vertAdvY", "vert-adv-y"],
    ["vertOriginX", "vert-origin-x"],
    ["vertOriginY", "vert-origin-y"],
    ["wordSpacing", "word-spacing"],
    ["writingMode", "writing-mode"],
    ["xmlnsXlink", "xmlns:xlink"],
    ["xHeight", "x-height"]
  ]), mm = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
  function Kn(t) {
    return mm.test("" + t) ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')" : t;
  }
  function Qe() {
  }
  var Di = null;
  function Ci(t) {
    return t = t.target || t.srcElement || window, t.correspondingUseElement && (t = t.correspondingUseElement), t.nodeType === 3 ? t.parentNode : t;
  }
  var na = null, ua = null;
  function xs(t) {
    var e = Pl(t);
    if (e && (t = e.stateNode)) {
      var l = t[te] || null;
      t: switch (t = e.stateNode, e.type) {
        case "input":
          if (Ni(
            t,
            l.value,
            l.defaultValue,
            l.defaultValue,
            l.checked,
            l.defaultChecked,
            l.type,
            l.name
          ), e = l.name, l.type === "radio" && e != null) {
            for (l = t; l.parentNode; ) l = l.parentNode;
            for (l = l.querySelectorAll(
              'input[name="' + Ee(
                "" + e
              ) + '"][type="radio"]'
            ), e = 0; e < l.length; e++) {
              var a = l[e];
              if (a !== t && a.form === t.form) {
                var n = a[te] || null;
                if (!n) throw Error(r(90));
                Ni(
                  a,
                  n.value,
                  n.defaultValue,
                  n.defaultValue,
                  n.checked,
                  n.defaultChecked,
                  n.type,
                  n.name
                );
              }
            }
            for (e = 0; e < l.length; e++)
              a = l[e], a.form === t.form && Es(a);
          }
          break t;
        case "textarea":
          Ts(t, l.value, l.defaultValue);
          break t;
        case "select":
          e = l.value, e != null && la(t, !!l.multiple, e, !1);
      }
    }
  }
  var Ui = !1;
  function Rs(t, e, l) {
    if (Ui) return t(e, l);
    Ui = !0;
    try {
      var a = t(e);
      return a;
    } finally {
      if (Ui = !1, (na !== null || ua !== null) && (Uu(), na && (e = na, t = ua, ua = na = null, xs(e), t)))
        for (e = 0; e < t.length; e++) xs(t[e]);
    }
  }
  function wa(t, e) {
    var l = t.stateNode;
    if (l === null) return null;
    var a = l[te] || null;
    if (a === null) return null;
    l = a[e];
    t: switch (e) {
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
        (a = !a.disabled) || (t = t.type, a = !(t === "button" || t === "input" || t === "select" || t === "textarea")), t = !a;
        break t;
      default:
        t = !1;
    }
    if (t) return null;
    if (l && typeof l != "function")
      throw Error(
        r(231, e, typeof l)
      );
    return l;
  }
  var Ze = !(typeof window == "undefined" || typeof window.document == "undefined" || typeof window.document.createElement == "undefined"), Hi = !1;
  if (Ze)
    try {
      var Va = {};
      Object.defineProperty(Va, "passive", {
        get: function() {
          Hi = !0;
        }
      }), window.addEventListener("test", Va, Va), window.removeEventListener("test", Va, Va);
    } catch (t) {
      Hi = !1;
    }
  var fl = null, Bi = null, kn = null;
  function Ns() {
    if (kn) return kn;
    var t, e = Bi, l = e.length, a, n = "value" in fl ? fl.value : fl.textContent, u = n.length;
    for (t = 0; t < l && e[t] === n[t]; t++) ;
    var c = l - t;
    for (a = 1; a <= c && e[l - a] === n[u - a]; a++) ;
    return kn = n.slice(t, 1 < a ? 1 - a : void 0);
  }
  function Fn(t) {
    var e = t.keyCode;
    return "charCode" in t ? (t = t.charCode, t === 0 && e === 13 && (t = 13)) : t = e, t === 10 && (t = 13), 32 <= t || t === 13 ? t : 0;
  }
  function $n() {
    return !0;
  }
  function Os() {
    return !1;
  }
  function ee(t) {
    function e(l, a, n, u, c) {
      this._reactName = l, this._targetInst = n, this.type = a, this.nativeEvent = u, this.target = c, this.currentTarget = null;
      for (var o in t)
        t.hasOwnProperty(o) && (l = t[o], this[o] = l ? l(u) : u[o]);
      return this.isDefaultPrevented = (u.defaultPrevented != null ? u.defaultPrevented : u.returnValue === !1) ? $n : Os, this.isPropagationStopped = Os, this;
    }
    return U(e.prototype, {
      preventDefault: function() {
        this.defaultPrevented = !0;
        var l = this.nativeEvent;
        l && (l.preventDefault ? l.preventDefault() : typeof l.returnValue != "unknown" && (l.returnValue = !1), this.isDefaultPrevented = $n);
      },
      stopPropagation: function() {
        var l = this.nativeEvent;
        l && (l.stopPropagation ? l.stopPropagation() : typeof l.cancelBubble != "unknown" && (l.cancelBubble = !0), this.isPropagationStopped = $n);
      },
      persist: function() {
      },
      isPersistent: $n
    }), e;
  }
  var Ul = {
    eventPhase: 0,
    bubbles: 0,
    cancelable: 0,
    timeStamp: function(t) {
      return t.timeStamp || Date.now();
    },
    defaultPrevented: 0,
    isTrusted: 0
  }, Wn = ee(Ul), Ja = U({}, Ul, { view: 0, detail: 0 }), ym = ee(Ja), Li, qi, Ka, In = U({}, Ja, {
    screenX: 0,
    screenY: 0,
    clientX: 0,
    clientY: 0,
    pageX: 0,
    pageY: 0,
    ctrlKey: 0,
    shiftKey: 0,
    altKey: 0,
    metaKey: 0,
    getModifierState: Gi,
    button: 0,
    buttons: 0,
    relatedTarget: function(t) {
      return t.relatedTarget === void 0 ? t.fromElement === t.srcElement ? t.toElement : t.fromElement : t.relatedTarget;
    },
    movementX: function(t) {
      return "movementX" in t ? t.movementX : (t !== Ka && (Ka && t.type === "mousemove" ? (Li = t.screenX - Ka.screenX, qi = t.screenY - Ka.screenY) : qi = Li = 0, Ka = t), Li);
    },
    movementY: function(t) {
      return "movementY" in t ? t.movementY : qi;
    }
  }), Ms = ee(In), vm = U({}, In, { dataTransfer: 0 }), pm = ee(vm), gm = U({}, Ja, { relatedTarget: 0 }), Yi = ee(gm), Sm = U({}, Ul, {
    animationName: 0,
    elapsedTime: 0,
    pseudoElement: 0
  }), bm = ee(Sm), Em = U({}, Ul, {
    clipboardData: function(t) {
      return "clipboardData" in t ? t.clipboardData : window.clipboardData;
    }
  }), jm = ee(Em), Tm = U({}, Ul, { data: 0 }), Ds = ee(Tm), _m = {
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
  }, Am = {
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
  }, zm = {
    Alt: "altKey",
    Control: "ctrlKey",
    Meta: "metaKey",
    Shift: "shiftKey"
  };
  function xm(t) {
    var e = this.nativeEvent;
    return e.getModifierState ? e.getModifierState(t) : (t = zm[t]) ? !!e[t] : !1;
  }
  function Gi() {
    return xm;
  }
  var Rm = U({}, Ja, {
    key: function(t) {
      if (t.key) {
        var e = _m[t.key] || t.key;
        if (e !== "Unidentified") return e;
      }
      return t.type === "keypress" ? (t = Fn(t), t === 13 ? "Enter" : String.fromCharCode(t)) : t.type === "keydown" || t.type === "keyup" ? Am[t.keyCode] || "Unidentified" : "";
    },
    code: 0,
    location: 0,
    ctrlKey: 0,
    shiftKey: 0,
    altKey: 0,
    metaKey: 0,
    repeat: 0,
    locale: 0,
    getModifierState: Gi,
    charCode: function(t) {
      return t.type === "keypress" ? Fn(t) : 0;
    },
    keyCode: function(t) {
      return t.type === "keydown" || t.type === "keyup" ? t.keyCode : 0;
    },
    which: function(t) {
      return t.type === "keypress" ? Fn(t) : t.type === "keydown" || t.type === "keyup" ? t.keyCode : 0;
    }
  }), Nm = ee(Rm), Om = U({}, In, {
    pointerId: 0,
    width: 0,
    height: 0,
    pressure: 0,
    tangentialPressure: 0,
    tiltX: 0,
    tiltY: 0,
    twist: 0,
    pointerType: 0,
    isPrimary: 0
  }), Cs = ee(Om), Mm = U({}, Ja, {
    touches: 0,
    targetTouches: 0,
    changedTouches: 0,
    altKey: 0,
    metaKey: 0,
    ctrlKey: 0,
    shiftKey: 0,
    getModifierState: Gi
  }), Dm = ee(Mm), Cm = U({}, Ul, {
    propertyName: 0,
    elapsedTime: 0,
    pseudoElement: 0
  }), Um = ee(Cm), Hm = U({}, In, {
    deltaX: function(t) {
      return "deltaX" in t ? t.deltaX : "wheelDeltaX" in t ? -t.wheelDeltaX : 0;
    },
    deltaY: function(t) {
      return "deltaY" in t ? t.deltaY : "wheelDeltaY" in t ? -t.wheelDeltaY : "wheelDelta" in t ? -t.wheelDelta : 0;
    },
    deltaZ: 0,
    deltaMode: 0
  }), Bm = ee(Hm), Lm = U({}, Ul, {
    newState: 0,
    oldState: 0
  }), qm = ee(Lm), Ym = [9, 13, 27, 32], Xi = Ze && "CompositionEvent" in window, ka = null;
  Ze && "documentMode" in document && (ka = document.documentMode);
  var Gm = Ze && "TextEvent" in window && !ka, Us = Ze && (!Xi || ka && 8 < ka && 11 >= ka), Hs = " ", Bs = !1;
  function Ls(t, e) {
    switch (t) {
      case "keyup":
        return Ym.indexOf(e.keyCode) !== -1;
      case "keydown":
        return e.keyCode !== 229;
      case "keypress":
      case "mousedown":
      case "focusout":
        return !0;
      default:
        return !1;
    }
  }
  function qs(t) {
    return t = t.detail, typeof t == "object" && "data" in t ? t.data : null;
  }
  var ia = !1;
  function Xm(t, e) {
    switch (t) {
      case "compositionend":
        return qs(e);
      case "keypress":
        return e.which !== 32 ? null : (Bs = !0, Hs);
      case "textInput":
        return t = e.data, t === Hs && Bs ? null : t;
      default:
        return null;
    }
  }
  function Qm(t, e) {
    if (ia)
      return t === "compositionend" || !Xi && Ls(t, e) ? (t = Ns(), kn = Bi = fl = null, ia = !1, t) : null;
    switch (t) {
      case "paste":
        return null;
      case "keypress":
        if (!(e.ctrlKey || e.altKey || e.metaKey) || e.ctrlKey && e.altKey) {
          if (e.char && 1 < e.char.length)
            return e.char;
          if (e.which) return String.fromCharCode(e.which);
        }
        return null;
      case "compositionend":
        return Us && e.locale !== "ko" ? null : e.data;
      default:
        return null;
    }
  }
  var Zm = {
    color: !0,
    date: !0,
    datetime: !0,
    "datetime-local": !0,
    email: !0,
    month: !0,
    number: !0,
    password: !0,
    range: !0,
    search: !0,
    tel: !0,
    text: !0,
    time: !0,
    url: !0,
    week: !0
  };
  function Ys(t) {
    var e = t && t.nodeName && t.nodeName.toLowerCase();
    return e === "input" ? !!Zm[t.type] : e === "textarea";
  }
  function Gs(t, e, l, a) {
    na ? ua ? ua.push(a) : ua = [a] : na = a, e = Xu(e, "onChange"), 0 < e.length && (l = new Wn(
      "onChange",
      "change",
      null,
      l,
      a
    ), t.push({ event: l, listeners: e }));
  }
  var Fa = null, $a = null;
  function wm(t) {
    Td(t, 0);
  }
  function Pn(t) {
    var e = Za(t);
    if (Es(e)) return t;
  }
  function Xs(t, e) {
    if (t === "change") return e;
  }
  var Qs = !1;
  if (Ze) {
    var Qi;
    if (Ze) {
      var Zi = "oninput" in document;
      if (!Zi) {
        var Zs = document.createElement("div");
        Zs.setAttribute("oninput", "return;"), Zi = typeof Zs.oninput == "function";
      }
      Qi = Zi;
    } else Qi = !1;
    Qs = Qi && (!document.documentMode || 9 < document.documentMode);
  }
  function ws() {
    Fa && (Fa.detachEvent("onpropertychange", Vs), $a = Fa = null);
  }
  function Vs(t) {
    if (t.propertyName === "value" && Pn($a)) {
      var e = [];
      Gs(
        e,
        $a,
        t,
        Ci(t)
      ), Rs(wm, e);
    }
  }
  function Vm(t, e, l) {
    t === "focusin" ? (ws(), Fa = e, $a = l, Fa.attachEvent("onpropertychange", Vs)) : t === "focusout" && ws();
  }
  function Jm(t) {
    if (t === "selectionchange" || t === "keyup" || t === "keydown")
      return Pn($a);
  }
  function Km(t, e) {
    if (t === "click") return Pn(e);
  }
  function km(t, e) {
    if (t === "input" || t === "change")
      return Pn(e);
  }
  function Fm(t, e) {
    return t === e && (t !== 0 || 1 / t === 1 / e) || t !== t && e !== e;
  }
  var de = typeof Object.is == "function" ? Object.is : Fm;
  function Wa(t, e) {
    if (de(t, e)) return !0;
    if (typeof t != "object" || t === null || typeof e != "object" || e === null)
      return !1;
    var l = Object.keys(t), a = Object.keys(e);
    if (l.length !== a.length) return !1;
    for (a = 0; a < l.length; a++) {
      var n = l[a];
      if (!bi.call(e, n) || !de(t[n], e[n]))
        return !1;
    }
    return !0;
  }
  function Js(t) {
    for (; t && t.firstChild; ) t = t.firstChild;
    return t;
  }
  function Ks(t, e) {
    var l = Js(t);
    t = 0;
    for (var a; l; ) {
      if (l.nodeType === 3) {
        if (a = t + l.textContent.length, t <= e && a >= e)
          return { node: l, offset: e - t };
        t = a;
      }
      t: {
        for (; l; ) {
          if (l.nextSibling) {
            l = l.nextSibling;
            break t;
          }
          l = l.parentNode;
        }
        l = void 0;
      }
      l = Js(l);
    }
  }
  function ks(t, e) {
    return t && e ? t === e ? !0 : t && t.nodeType === 3 ? !1 : e && e.nodeType === 3 ? ks(t, e.parentNode) : "contains" in t ? t.contains(e) : t.compareDocumentPosition ? !!(t.compareDocumentPosition(e) & 16) : !1 : !1;
  }
  function Fs(t) {
    t = t != null && t.ownerDocument != null && t.ownerDocument.defaultView != null ? t.ownerDocument.defaultView : window;
    for (var e = Jn(t.document); e instanceof t.HTMLIFrameElement; ) {
      try {
        var l = typeof e.contentWindow.location.href == "string";
      } catch (a) {
        l = !1;
      }
      if (l) t = e.contentWindow;
      else break;
      e = Jn(t.document);
    }
    return e;
  }
  function wi(t) {
    var e = t && t.nodeName && t.nodeName.toLowerCase();
    return e && (e === "input" && (t.type === "text" || t.type === "search" || t.type === "tel" || t.type === "url" || t.type === "password") || e === "textarea" || t.contentEditable === "true");
  }
  var $m = Ze && "documentMode" in document && 11 >= document.documentMode, ca = null, Vi = null, Ia = null, Ji = !1;
  function $s(t, e, l) {
    var a = l.window === l ? l.document : l.nodeType === 9 ? l : l.ownerDocument;
    Ji || ca == null || ca !== Jn(a) || (a = ca, "selectionStart" in a && wi(a) ? a = { start: a.selectionStart, end: a.selectionEnd } : (a = (a.ownerDocument && a.ownerDocument.defaultView || window).getSelection(), a = {
      anchorNode: a.anchorNode,
      anchorOffset: a.anchorOffset,
      focusNode: a.focusNode,
      focusOffset: a.focusOffset
    }), Ia && Wa(Ia, a) || (Ia = a, a = Xu(Vi, "onSelect"), 0 < a.length && (e = new Wn(
      "onSelect",
      "select",
      null,
      e,
      l
    ), t.push({ event: e, listeners: a }), e.target = ca)));
  }
  function Hl(t, e) {
    var l = {};
    return l[t.toLowerCase()] = e.toLowerCase(), l["Webkit" + t] = "webkit" + e, l["Moz" + t] = "moz" + e, l;
  }
  var fa = {
    animationend: Hl("Animation", "AnimationEnd"),
    animationiteration: Hl("Animation", "AnimationIteration"),
    animationstart: Hl("Animation", "AnimationStart"),
    transitionrun: Hl("Transition", "TransitionRun"),
    transitionstart: Hl("Transition", "TransitionStart"),
    transitioncancel: Hl("Transition", "TransitionCancel"),
    transitionend: Hl("Transition", "TransitionEnd")
  }, Ki = {}, Ws = {};
  Ze && (Ws = document.createElement("div").style, "AnimationEvent" in window || (delete fa.animationend.animation, delete fa.animationiteration.animation, delete fa.animationstart.animation), "TransitionEvent" in window || delete fa.transitionend.transition);
  function Bl(t) {
    if (Ki[t]) return Ki[t];
    if (!fa[t]) return t;
    var e = fa[t], l;
    for (l in e)
      if (e.hasOwnProperty(l) && l in Ws)
        return Ki[t] = e[l];
    return t;
  }
  var Is = Bl("animationend"), Ps = Bl("animationiteration"), tr = Bl("animationstart"), Wm = Bl("transitionrun"), Im = Bl("transitionstart"), Pm = Bl("transitioncancel"), er = Bl("transitionend"), lr = /* @__PURE__ */ new Map(), ki = "abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(
    " "
  );
  ki.push("scrollEnd");
  function Me(t, e) {
    lr.set(t, e), Cl(e, [t]);
  }
  var tu = typeof reportError == "function" ? reportError : function(t) {
    if (typeof window == "object" && typeof window.ErrorEvent == "function") {
      var e = new window.ErrorEvent("error", {
        bubbles: !0,
        cancelable: !0,
        message: typeof t == "object" && t !== null && typeof t.message == "string" ? String(t.message) : String(t),
        error: t
      });
      if (!window.dispatchEvent(e)) return;
    } else if (typeof i == "object" && typeof i.emit == "function") {
      i.emit("uncaughtException", t);
      return;
    }
    console.error(t);
  }, je = [], sa = 0, Fi = 0;
  function eu() {
    for (var t = sa, e = Fi = sa = 0; e < t; ) {
      var l = je[e];
      je[e++] = null;
      var a = je[e];
      je[e++] = null;
      var n = je[e];
      je[e++] = null;
      var u = je[e];
      if (je[e++] = null, a !== null && n !== null) {
        var c = a.pending;
        c === null ? n.next = n : (n.next = c.next, c.next = n), a.pending = n;
      }
      u !== 0 && ar(l, n, u);
    }
  }
  function lu(t, e, l, a) {
    je[sa++] = t, je[sa++] = e, je[sa++] = l, je[sa++] = a, Fi |= a, t.lanes |= a, t = t.alternate, t !== null && (t.lanes |= a);
  }
  function $i(t, e, l, a) {
    return lu(t, e, l, a), au(t);
  }
  function Ll(t, e) {
    return lu(t, null, null, e), au(t);
  }
  function ar(t, e, l) {
    t.lanes |= l;
    var a = t.alternate;
    a !== null && (a.lanes |= l);
    for (var n = !1, u = t.return; u !== null; )
      u.childLanes |= l, a = u.alternate, a !== null && (a.childLanes |= l), u.tag === 22 && (t = u.stateNode, t === null || t._visibility & 1 || (n = !0)), t = u, u = u.return;
    return t.tag === 3 ? (u = t.stateNode, n && e !== null && (n = 31 - oe(l), t = u.hiddenUpdates, a = t[n], a === null ? t[n] = [e] : a.push(e), e.lane = l | 536870912), u) : null;
  }
  function au(t) {
    if (50 < En)
      throw En = 0, uf = null, Error(r(185));
    for (var e = t.return; e !== null; )
      t = e, e = t.return;
    return t.tag === 3 ? t.stateNode : null;
  }
  var ra = {};
  function ty(t, e, l, a) {
    this.tag = t, this.key = l, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.refCleanup = this.ref = null, this.pendingProps = e, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = a, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null;
  }
  function he(t, e, l, a) {
    return new ty(t, e, l, a);
  }
  function Wi(t) {
    return t = t.prototype, !(!t || !t.isReactComponent);
  }
  function we(t, e) {
    var l = t.alternate;
    return l === null ? (l = he(
      t.tag,
      e,
      t.key,
      t.mode
    ), l.elementType = t.elementType, l.type = t.type, l.stateNode = t.stateNode, l.alternate = t, t.alternate = l) : (l.pendingProps = e, l.type = t.type, l.flags = 0, l.subtreeFlags = 0, l.deletions = null), l.flags = t.flags & 65011712, l.childLanes = t.childLanes, l.lanes = t.lanes, l.child = t.child, l.memoizedProps = t.memoizedProps, l.memoizedState = t.memoizedState, l.updateQueue = t.updateQueue, e = t.dependencies, l.dependencies = e === null ? null : { lanes: e.lanes, firstContext: e.firstContext }, l.sibling = t.sibling, l.index = t.index, l.ref = t.ref, l.refCleanup = t.refCleanup, l;
  }
  function nr(t, e) {
    t.flags &= 65011714;
    var l = t.alternate;
    return l === null ? (t.childLanes = 0, t.lanes = e, t.child = null, t.subtreeFlags = 0, t.memoizedProps = null, t.memoizedState = null, t.updateQueue = null, t.dependencies = null, t.stateNode = null) : (t.childLanes = l.childLanes, t.lanes = l.lanes, t.child = l.child, t.subtreeFlags = 0, t.deletions = null, t.memoizedProps = l.memoizedProps, t.memoizedState = l.memoizedState, t.updateQueue = l.updateQueue, t.type = l.type, e = l.dependencies, t.dependencies = e === null ? null : {
      lanes: e.lanes,
      firstContext: e.firstContext
    }), t;
  }
  function nu(t, e, l, a, n, u) {
    var c = 0;
    if (a = t, typeof t == "function") Wi(t) && (c = 1);
    else if (typeof t == "string")
      c = uv(
        t,
        l,
        k.current
      ) ? 26 : t === "html" || t === "head" || t === "body" ? 27 : 5;
    else
      t: switch (t) {
        case Qt:
          return t = he(31, l, e, n), t.elementType = Qt, t.lanes = u, t;
        case X:
          return ql(l.children, n, u, e);
        case Y:
          c = 8, n |= 24;
          break;
        case $:
          return t = he(12, l, e, n | 2), t.elementType = $, t.lanes = u, t;
        case ht:
          return t = he(13, l, e, n), t.elementType = ht, t.lanes = u, t;
        case mt:
          return t = he(19, l, e, n), t.elementType = mt, t.lanes = u, t;
        default:
          if (typeof t == "object" && t !== null)
            switch (t.$$typeof) {
              case at:
                c = 10;
                break t;
              case I:
                c = 9;
                break t;
              case st:
                c = 11;
                break t;
              case tt:
                c = 14;
                break t;
              case zt:
                c = 16, a = null;
                break t;
            }
          c = 29, l = Error(
            r(130, t === null ? "null" : typeof t, "")
          ), a = null;
      }
    return e = he(c, l, e, n), e.elementType = t, e.type = a, e.lanes = u, e;
  }
  function ql(t, e, l, a) {
    return t = he(7, t, a, e), t.lanes = l, t;
  }
  function Ii(t, e, l) {
    return t = he(6, t, null, e), t.lanes = l, t;
  }
  function ur(t) {
    var e = he(18, null, null, 0);
    return e.stateNode = t, e;
  }
  function Pi(t, e, l) {
    return e = he(
      4,
      t.children !== null ? t.children : [],
      t.key,
      e
    ), e.lanes = l, e.stateNode = {
      containerInfo: t.containerInfo,
      pendingChildren: null,
      implementation: t.implementation
    }, e;
  }
  var ir = /* @__PURE__ */ new WeakMap();
  function Te(t, e) {
    if (typeof t == "object" && t !== null) {
      var l = ir.get(t);
      return l !== void 0 ? l : (e = {
        value: t,
        source: e,
        stack: us(e)
      }, ir.set(t, e), e);
    }
    return {
      value: t,
      source: e,
      stack: us(e)
    };
  }
  var oa = [], da = 0, uu = null, Pa = 0, _e = [], Ae = 0, sl = null, He = 1, Be = "";
  function Ve(t, e) {
    oa[da++] = Pa, oa[da++] = uu, uu = t, Pa = e;
  }
  function cr(t, e, l) {
    _e[Ae++] = He, _e[Ae++] = Be, _e[Ae++] = sl, sl = t;
    var a = He;
    t = Be;
    var n = 32 - oe(a) - 1;
    a &= ~(1 << n), l += 1;
    var u = 32 - oe(e) + n;
    if (30 < u) {
      var c = n - n % 5;
      u = (a & (1 << c) - 1).toString(32), a >>= c, n -= c, He = 1 << 32 - oe(e) + n | l << n | a, Be = u + t;
    } else
      He = 1 << u | l << n | a, Be = t;
  }
  function tc(t) {
    t.return !== null && (Ve(t, 1), cr(t, 1, 0));
  }
  function ec(t) {
    for (; t === uu; )
      uu = oa[--da], oa[da] = null, Pa = oa[--da], oa[da] = null;
    for (; t === sl; )
      sl = _e[--Ae], _e[Ae] = null, Be = _e[--Ae], _e[Ae] = null, He = _e[--Ae], _e[Ae] = null;
  }
  function fr(t, e) {
    _e[Ae++] = He, _e[Ae++] = Be, _e[Ae++] = sl, He = e.id, Be = e.overflow, sl = t;
  }
  var Kt = null, Rt = null, dt = !1, rl = null, ze = !1, lc = Error(r(519));
  function ol(t) {
    var e = Error(
      r(
        418,
        1 < arguments.length && arguments[1] !== void 0 && arguments[1] ? "text" : "HTML",
        ""
      )
    );
    throw tn(Te(e, t)), lc;
  }
  function sr(t) {
    var e = t.stateNode, l = t.type, a = t.memoizedProps;
    switch (e[Jt] = t, e[te] = a, l) {
      case "dialog":
        ft("cancel", e), ft("close", e);
        break;
      case "iframe":
      case "object":
      case "embed":
        ft("load", e);
        break;
      case "video":
      case "audio":
        for (l = 0; l < Tn.length; l++)
          ft(Tn[l], e);
        break;
      case "source":
        ft("error", e);
        break;
      case "img":
      case "image":
      case "link":
        ft("error", e), ft("load", e);
        break;
      case "details":
        ft("toggle", e);
        break;
      case "input":
        ft("invalid", e), js(
          e,
          a.value,
          a.defaultValue,
          a.checked,
          a.defaultChecked,
          a.type,
          a.name,
          !0
        );
        break;
      case "select":
        ft("invalid", e);
        break;
      case "textarea":
        ft("invalid", e), _s(e, a.value, a.defaultValue, a.children);
    }
    l = a.children, typeof l != "string" && typeof l != "number" && typeof l != "bigint" || e.textContent === "" + l || a.suppressHydrationWarning === !0 || xd(e.textContent, l) ? (a.popover != null && (ft("beforetoggle", e), ft("toggle", e)), a.onScroll != null && ft("scroll", e), a.onScrollEnd != null && ft("scrollend", e), a.onClick != null && (e.onclick = Qe), e = !0) : e = !1, e || ol(t, !0);
  }
  function rr(t) {
    for (Kt = t.return; Kt; )
      switch (Kt.tag) {
        case 5:
        case 31:
        case 13:
          ze = !1;
          return;
        case 27:
        case 3:
          ze = !0;
          return;
        default:
          Kt = Kt.return;
      }
  }
  function ha(t) {
    if (t !== Kt) return !1;
    if (!dt) return rr(t), dt = !0, !1;
    var e = t.tag, l;
    if ((l = e !== 3 && e !== 27) && ((l = e === 5) && (l = t.type, l = !(l !== "form" && l !== "button") || Ef(t.type, t.memoizedProps)), l = !l), l && Rt && ol(t), rr(t), e === 13) {
      if (t = t.memoizedState, t = t !== null ? t.dehydrated : null, !t) throw Error(r(317));
      Rt = Bd(t);
    } else if (e === 31) {
      if (t = t.memoizedState, t = t !== null ? t.dehydrated : null, !t) throw Error(r(317));
      Rt = Bd(t);
    } else
      e === 27 ? (e = Rt, Al(t.type) ? (t = zf, zf = null, Rt = t) : Rt = e) : Rt = Kt ? Re(t.stateNode.nextSibling) : null;
    return !0;
  }
  function Yl() {
    Rt = Kt = null, dt = !1;
  }
  function ac() {
    var t = rl;
    return t !== null && (ue === null ? ue = t : ue.push.apply(
      ue,
      t
    ), rl = null), t;
  }
  function tn(t) {
    rl === null ? rl = [t] : rl.push(t);
  }
  var nc = g(null), Gl = null, Je = null;
  function dl(t, e, l) {
    q(nc, e._currentValue), e._currentValue = l;
  }
  function Ke(t) {
    t._currentValue = nc.current, C(nc);
  }
  function uc(t, e, l) {
    for (; t !== null; ) {
      var a = t.alternate;
      if ((t.childLanes & e) !== e ? (t.childLanes |= e, a !== null && (a.childLanes |= e)) : a !== null && (a.childLanes & e) !== e && (a.childLanes |= e), t === l) break;
      t = t.return;
    }
  }
  function ic(t, e, l, a) {
    var n = t.child;
    for (n !== null && (n.return = t); n !== null; ) {
      var u = n.dependencies;
      if (u !== null) {
        var c = n.child;
        u = u.firstContext;
        t: for (; u !== null; ) {
          var o = u;
          u = n;
          for (var m = 0; m < e.length; m++)
            if (o.context === e[m]) {
              u.lanes |= l, o = u.alternate, o !== null && (o.lanes |= l), uc(
                u.return,
                l,
                t
              ), a || (c = null);
              break t;
            }
          u = o.next;
        }
      } else if (n.tag === 18) {
        if (c = n.return, c === null) throw Error(r(341));
        c.lanes |= l, u = c.alternate, u !== null && (u.lanes |= l), uc(c, l, t), c = null;
      } else c = n.child;
      if (c !== null) c.return = n;
      else
        for (c = n; c !== null; ) {
          if (c === t) {
            c = null;
            break;
          }
          if (n = c.sibling, n !== null) {
            n.return = c.return, c = n;
            break;
          }
          c = c.return;
        }
      n = c;
    }
  }
  function ma(t, e, l, a) {
    t = null;
    for (var n = e, u = !1; n !== null; ) {
      if (!u) {
        if ((n.flags & 524288) !== 0) u = !0;
        else if ((n.flags & 262144) !== 0) break;
      }
      if (n.tag === 10) {
        var c = n.alternate;
        if (c === null) throw Error(r(387));
        if (c = c.memoizedProps, c !== null) {
          var o = n.type;
          de(n.pendingProps.value, c.value) || (t !== null ? t.push(o) : t = [o]);
        }
      } else if (n === St.current) {
        if (c = n.alternate, c === null) throw Error(r(387));
        c.memoizedState.memoizedState !== n.memoizedState.memoizedState && (t !== null ? t.push(Rn) : t = [Rn]);
      }
      n = n.return;
    }
    t !== null && ic(
      e,
      t,
      l,
      a
    ), e.flags |= 262144;
  }
  function iu(t) {
    for (t = t.firstContext; t !== null; ) {
      if (!de(
        t.context._currentValue,
        t.memoizedValue
      ))
        return !0;
      t = t.next;
    }
    return !1;
  }
  function Xl(t) {
    Gl = t, Je = null, t = t.dependencies, t !== null && (t.firstContext = null);
  }
  function kt(t) {
    return or(Gl, t);
  }
  function cu(t, e) {
    return Gl === null && Xl(t), or(t, e);
  }
  function or(t, e) {
    var l = e._currentValue;
    if (e = { context: e, memoizedValue: l, next: null }, Je === null) {
      if (t === null) throw Error(r(308));
      Je = e, t.dependencies = { lanes: 0, firstContext: e }, t.flags |= 524288;
    } else Je = Je.next = e;
    return l;
  }
  var ey = typeof AbortController != "undefined" ? AbortController : function() {
    var t = [], e = this.signal = {
      aborted: !1,
      addEventListener: function(l, a) {
        t.push(a);
      }
    };
    this.abort = function() {
      e.aborted = !0, t.forEach(function(l) {
        return l();
      });
    };
  }, ly = f.unstable_scheduleCallback, ay = f.unstable_NormalPriority, qt = {
    $$typeof: at,
    Consumer: null,
    Provider: null,
    _currentValue: null,
    _currentValue2: null,
    _threadCount: 0
  };
  function cc() {
    return {
      controller: new ey(),
      data: /* @__PURE__ */ new Map(),
      refCount: 0
    };
  }
  function en(t) {
    t.refCount--, t.refCount === 0 && ly(ay, function() {
      t.controller.abort();
    });
  }
  var ln = null, fc = 0, ya = 0, va = null;
  function ny(t, e) {
    if (ln === null) {
      var l = ln = [];
      fc = 0, ya = df(), va = {
        status: "pending",
        value: void 0,
        then: function(a) {
          l.push(a);
        }
      };
    }
    return fc++, e.then(dr, dr), e;
  }
  function dr() {
    if (--fc === 0 && ln !== null) {
      va !== null && (va.status = "fulfilled");
      var t = ln;
      ln = null, ya = 0, va = null;
      for (var e = 0; e < t.length; e++) (0, t[e])();
    }
  }
  function uy(t, e) {
    var l = [], a = {
      status: "pending",
      value: null,
      reason: null,
      then: function(n) {
        l.push(n);
      }
    };
    return t.then(
      function() {
        a.status = "fulfilled", a.value = e;
        for (var n = 0; n < l.length; n++) (0, l[n])(e);
      },
      function(n) {
        for (a.status = "rejected", a.reason = n, n = 0; n < l.length; n++)
          (0, l[n])(void 0);
      }
    ), a;
  }
  var hr = H.S;
  H.S = function(t, e) {
    Wo = se(), typeof e == "object" && e !== null && typeof e.then == "function" && ny(t, e), hr !== null && hr(t, e);
  };
  var Ql = g(null);
  function sc() {
    var t = Ql.current;
    return t !== null ? t : At.pooledCache;
  }
  function fu(t, e) {
    e === null ? q(Ql, Ql.current) : q(Ql, e.pool);
  }
  function mr() {
    var t = sc();
    return t === null ? null : { parent: qt._currentValue, pool: t };
  }
  var pa = Error(r(460)), rc = Error(r(474)), su = Error(r(542)), ru = { then: function() {
  } };
  function yr(t) {
    return t = t.status, t === "fulfilled" || t === "rejected";
  }
  function vr(t, e, l) {
    switch (l = t[l], l === void 0 ? t.push(e) : l !== e && (e.then(Qe, Qe), e = l), e.status) {
      case "fulfilled":
        return e.value;
      case "rejected":
        throw t = e.reason, gr(t), t;
      default:
        if (typeof e.status == "string") e.then(Qe, Qe);
        else {
          if (t = At, t !== null && 100 < t.shellSuspendCounter)
            throw Error(r(482));
          t = e, t.status = "pending", t.then(
            function(a) {
              if (e.status === "pending") {
                var n = e;
                n.status = "fulfilled", n.value = a;
              }
            },
            function(a) {
              if (e.status === "pending") {
                var n = e;
                n.status = "rejected", n.reason = a;
              }
            }
          );
        }
        switch (e.status) {
          case "fulfilled":
            return e.value;
          case "rejected":
            throw t = e.reason, gr(t), t;
        }
        throw wl = e, pa;
    }
  }
  function Zl(t) {
    try {
      var e = t._init;
      return e(t._payload);
    } catch (l) {
      throw l !== null && typeof l == "object" && typeof l.then == "function" ? (wl = l, pa) : l;
    }
  }
  var wl = null;
  function pr() {
    if (wl === null) throw Error(r(459));
    var t = wl;
    return wl = null, t;
  }
  function gr(t) {
    if (t === pa || t === su)
      throw Error(r(483));
  }
  var ga = null, an = 0;
  function ou(t) {
    var e = an;
    return an += 1, ga === null && (ga = []), vr(ga, t, e);
  }
  function nn(t, e) {
    e = e.props.ref, t.ref = e !== void 0 ? e : null;
  }
  function du(t, e) {
    throw e.$$typeof === K ? Error(r(525)) : (t = Object.prototype.toString.call(e), Error(
      r(
        31,
        t === "[object Object]" ? "object with keys {" + Object.keys(e).join(", ") + "}" : t
      )
    ));
  }
  function Sr(t) {
    function e(b, p) {
      if (t) {
        var j = b.deletions;
        j === null ? (b.deletions = [p], b.flags |= 16) : j.push(p);
      }
    }
    function l(b, p) {
      if (!t) return null;
      for (; p !== null; )
        e(b, p), p = p.sibling;
      return null;
    }
    function a(b) {
      for (var p = /* @__PURE__ */ new Map(); b !== null; )
        b.key !== null ? p.set(b.key, b) : p.set(b.index, b), b = b.sibling;
      return p;
    }
    function n(b, p) {
      return b = we(b, p), b.index = 0, b.sibling = null, b;
    }
    function u(b, p, j) {
      return b.index = j, t ? (j = b.alternate, j !== null ? (j = j.index, j < p ? (b.flags |= 67108866, p) : j) : (b.flags |= 67108866, p)) : (b.flags |= 1048576, p);
    }
    function c(b) {
      return t && b.alternate === null && (b.flags |= 67108866), b;
    }
    function o(b, p, j, O) {
      return p === null || p.tag !== 6 ? (p = Ii(j, b.mode, O), p.return = b, p) : (p = n(p, j), p.return = b, p);
    }
    function m(b, p, j, O) {
      var F = j.type;
      return F === X ? N(
        b,
        p,
        j.props.children,
        O,
        j.key
      ) : p !== null && (p.elementType === F || typeof F == "object" && F !== null && F.$$typeof === zt && Zl(F) === p.type) ? (p = n(p, j.props), nn(p, j), p.return = b, p) : (p = nu(
        j.type,
        j.key,
        j.props,
        null,
        b.mode,
        O
      ), nn(p, j), p.return = b, p);
    }
    function T(b, p, j, O) {
      return p === null || p.tag !== 4 || p.stateNode.containerInfo !== j.containerInfo || p.stateNode.implementation !== j.implementation ? (p = Pi(j, b.mode, O), p.return = b, p) : (p = n(p, j.children || []), p.return = b, p);
    }
    function N(b, p, j, O, F) {
      return p === null || p.tag !== 7 ? (p = ql(
        j,
        b.mode,
        O,
        F
      ), p.return = b, p) : (p = n(p, j), p.return = b, p);
    }
    function D(b, p, j) {
      if (typeof p == "string" && p !== "" || typeof p == "number" || typeof p == "bigint")
        return p = Ii(
          "" + p,
          b.mode,
          j
        ), p.return = b, p;
      if (typeof p == "object" && p !== null) {
        switch (p.$$typeof) {
          case J:
            return j = nu(
              p.type,
              p.key,
              p.props,
              null,
              b.mode,
              j
            ), nn(j, p), j.return = b, j;
          case Q:
            return p = Pi(
              p,
              b.mode,
              j
            ), p.return = b, p;
          case zt:
            return p = Zl(p), D(b, p, j);
        }
        if (L(p) || Ut(p))
          return p = ql(
            p,
            b.mode,
            j,
            null
          ), p.return = b, p;
        if (typeof p.then == "function")
          return D(b, ou(p), j);
        if (p.$$typeof === at)
          return D(
            b,
            cu(b, p),
            j
          );
        du(b, p);
      }
      return null;
    }
    function _(b, p, j, O) {
      var F = p !== null ? p.key : null;
      if (typeof j == "string" && j !== "" || typeof j == "number" || typeof j == "bigint")
        return F !== null ? null : o(b, p, "" + j, O);
      if (typeof j == "object" && j !== null) {
        switch (j.$$typeof) {
          case J:
            return j.key === F ? m(b, p, j, O) : null;
          case Q:
            return j.key === F ? T(b, p, j, O) : null;
          case zt:
            return j = Zl(j), _(b, p, j, O);
        }
        if (L(j) || Ut(j))
          return F !== null ? null : N(b, p, j, O, null);
        if (typeof j.then == "function")
          return _(
            b,
            p,
            ou(j),
            O
          );
        if (j.$$typeof === at)
          return _(
            b,
            p,
            cu(b, j),
            O
          );
        du(b, j);
      }
      return null;
    }
    function z(b, p, j, O, F) {
      if (typeof O == "string" && O !== "" || typeof O == "number" || typeof O == "bigint")
        return b = b.get(j) || null, o(p, b, "" + O, F);
      if (typeof O == "object" && O !== null) {
        switch (O.$$typeof) {
          case J:
            return b = b.get(
              O.key === null ? j : O.key
            ) || null, m(p, b, O, F);
          case Q:
            return b = b.get(
              O.key === null ? j : O.key
            ) || null, T(p, b, O, F);
          case zt:
            return O = Zl(O), z(
              b,
              p,
              j,
              O,
              F
            );
        }
        if (L(O) || Ut(O))
          return b = b.get(j) || null, N(p, b, O, F, null);
        if (typeof O.then == "function")
          return z(
            b,
            p,
            j,
            ou(O),
            F
          );
        if (O.$$typeof === at)
          return z(
            b,
            p,
            j,
            cu(p, O),
            F
          );
        du(p, O);
      }
      return null;
    }
    function Z(b, p, j, O) {
      for (var F = null, yt = null, V = p, lt = p = 0, ot = null; V !== null && lt < j.length; lt++) {
        V.index > lt ? (ot = V, V = null) : ot = V.sibling;
        var vt = _(
          b,
          V,
          j[lt],
          O
        );
        if (vt === null) {
          V === null && (V = ot);
          break;
        }
        t && V && vt.alternate === null && e(b, V), p = u(vt, p, lt), yt === null ? F = vt : yt.sibling = vt, yt = vt, V = ot;
      }
      if (lt === j.length)
        return l(b, V), dt && Ve(b, lt), F;
      if (V === null) {
        for (; lt < j.length; lt++)
          V = D(b, j[lt], O), V !== null && (p = u(
            V,
            p,
            lt
          ), yt === null ? F = V : yt.sibling = V, yt = V);
        return dt && Ve(b, lt), F;
      }
      for (V = a(V); lt < j.length; lt++)
        ot = z(
          V,
          b,
          lt,
          j[lt],
          O
        ), ot !== null && (t && ot.alternate !== null && V.delete(
          ot.key === null ? lt : ot.key
        ), p = u(
          ot,
          p,
          lt
        ), yt === null ? F = ot : yt.sibling = ot, yt = ot);
      return t && V.forEach(function(Ol) {
        return e(b, Ol);
      }), dt && Ve(b, lt), F;
    }
    function W(b, p, j, O) {
      if (j == null) throw Error(r(151));
      for (var F = null, yt = null, V = p, lt = p = 0, ot = null, vt = j.next(); V !== null && !vt.done; lt++, vt = j.next()) {
        V.index > lt ? (ot = V, V = null) : ot = V.sibling;
        var Ol = _(b, V, vt.value, O);
        if (Ol === null) {
          V === null && (V = ot);
          break;
        }
        t && V && Ol.alternate === null && e(b, V), p = u(Ol, p, lt), yt === null ? F = Ol : yt.sibling = Ol, yt = Ol, V = ot;
      }
      if (vt.done)
        return l(b, V), dt && Ve(b, lt), F;
      if (V === null) {
        for (; !vt.done; lt++, vt = j.next())
          vt = D(b, vt.value, O), vt !== null && (p = u(vt, p, lt), yt === null ? F = vt : yt.sibling = vt, yt = vt);
        return dt && Ve(b, lt), F;
      }
      for (V = a(V); !vt.done; lt++, vt = j.next())
        vt = z(V, b, lt, vt.value, O), vt !== null && (t && vt.alternate !== null && V.delete(vt.key === null ? lt : vt.key), p = u(vt, p, lt), yt === null ? F = vt : yt.sibling = vt, yt = vt);
      return t && V.forEach(function(vv) {
        return e(b, vv);
      }), dt && Ve(b, lt), F;
    }
    function _t(b, p, j, O) {
      if (typeof j == "object" && j !== null && j.type === X && j.key === null && (j = j.props.children), typeof j == "object" && j !== null) {
        switch (j.$$typeof) {
          case J:
            t: {
              for (var F = j.key; p !== null; ) {
                if (p.key === F) {
                  if (F = j.type, F === X) {
                    if (p.tag === 7) {
                      l(
                        b,
                        p.sibling
                      ), O = n(
                        p,
                        j.props.children
                      ), O.return = b, b = O;
                      break t;
                    }
                  } else if (p.elementType === F || typeof F == "object" && F !== null && F.$$typeof === zt && Zl(F) === p.type) {
                    l(
                      b,
                      p.sibling
                    ), O = n(p, j.props), nn(O, j), O.return = b, b = O;
                    break t;
                  }
                  l(b, p);
                  break;
                } else e(b, p);
                p = p.sibling;
              }
              j.type === X ? (O = ql(
                j.props.children,
                b.mode,
                O,
                j.key
              ), O.return = b, b = O) : (O = nu(
                j.type,
                j.key,
                j.props,
                null,
                b.mode,
                O
              ), nn(O, j), O.return = b, b = O);
            }
            return c(b);
          case Q:
            t: {
              for (F = j.key; p !== null; ) {
                if (p.key === F)
                  if (p.tag === 4 && p.stateNode.containerInfo === j.containerInfo && p.stateNode.implementation === j.implementation) {
                    l(
                      b,
                      p.sibling
                    ), O = n(p, j.children || []), O.return = b, b = O;
                    break t;
                  } else {
                    l(b, p);
                    break;
                  }
                else e(b, p);
                p = p.sibling;
              }
              O = Pi(j, b.mode, O), O.return = b, b = O;
            }
            return c(b);
          case zt:
            return j = Zl(j), _t(
              b,
              p,
              j,
              O
            );
        }
        if (L(j))
          return Z(
            b,
            p,
            j,
            O
          );
        if (Ut(j)) {
          if (F = Ut(j), typeof F != "function") throw Error(r(150));
          return j = F.call(j), W(
            b,
            p,
            j,
            O
          );
        }
        if (typeof j.then == "function")
          return _t(
            b,
            p,
            ou(j),
            O
          );
        if (j.$$typeof === at)
          return _t(
            b,
            p,
            cu(b, j),
            O
          );
        du(b, j);
      }
      return typeof j == "string" && j !== "" || typeof j == "number" || typeof j == "bigint" ? (j = "" + j, p !== null && p.tag === 6 ? (l(b, p.sibling), O = n(p, j), O.return = b, b = O) : (l(b, p), O = Ii(j, b.mode, O), O.return = b, b = O), c(b)) : l(b, p);
    }
    return function(b, p, j, O) {
      try {
        an = 0;
        var F = _t(
          b,
          p,
          j,
          O
        );
        return ga = null, F;
      } catch (V) {
        if (V === pa || V === su) throw V;
        var yt = he(29, V, null, b.mode);
        return yt.lanes = O, yt.return = b, yt;
      }
    };
  }
  var Vl = Sr(!0), br = Sr(!1), hl = !1;
  function oc(t) {
    t.updateQueue = {
      baseState: t.memoizedState,
      firstBaseUpdate: null,
      lastBaseUpdate: null,
      shared: { pending: null, lanes: 0, hiddenCallbacks: null },
      callbacks: null
    };
  }
  function dc(t, e) {
    t = t.updateQueue, e.updateQueue === t && (e.updateQueue = {
      baseState: t.baseState,
      firstBaseUpdate: t.firstBaseUpdate,
      lastBaseUpdate: t.lastBaseUpdate,
      shared: t.shared,
      callbacks: null
    });
  }
  function ml(t) {
    return { lane: t, tag: 0, payload: null, callback: null, next: null };
  }
  function yl(t, e, l) {
    var a = t.updateQueue;
    if (a === null) return null;
    if (a = a.shared, (gt & 2) !== 0) {
      var n = a.pending;
      return n === null ? e.next = e : (e.next = n.next, n.next = e), a.pending = e, e = au(t), ar(t, null, l), e;
    }
    return lu(t, a, e, l), au(t);
  }
  function un(t, e, l) {
    if (e = e.updateQueue, e !== null && (e = e.shared, (l & 4194048) !== 0)) {
      var a = e.lanes;
      a &= t.pendingLanes, l |= a, e.lanes = l, os(t, l);
    }
  }
  function hc(t, e) {
    var l = t.updateQueue, a = t.alternate;
    if (a !== null && (a = a.updateQueue, l === a)) {
      var n = null, u = null;
      if (l = l.firstBaseUpdate, l !== null) {
        do {
          var c = {
            lane: l.lane,
            tag: l.tag,
            payload: l.payload,
            callback: null,
            next: null
          };
          u === null ? n = u = c : u = u.next = c, l = l.next;
        } while (l !== null);
        u === null ? n = u = e : u = u.next = e;
      } else n = u = e;
      l = {
        baseState: a.baseState,
        firstBaseUpdate: n,
        lastBaseUpdate: u,
        shared: a.shared,
        callbacks: a.callbacks
      }, t.updateQueue = l;
      return;
    }
    t = l.lastBaseUpdate, t === null ? l.firstBaseUpdate = e : t.next = e, l.lastBaseUpdate = e;
  }
  var mc = !1;
  function cn() {
    if (mc) {
      var t = va;
      if (t !== null) throw t;
    }
  }
  function fn(t, e, l, a) {
    mc = !1;
    var n = t.updateQueue;
    hl = !1;
    var u = n.firstBaseUpdate, c = n.lastBaseUpdate, o = n.shared.pending;
    if (o !== null) {
      n.shared.pending = null;
      var m = o, T = m.next;
      m.next = null, c === null ? u = T : c.next = T, c = m;
      var N = t.alternate;
      N !== null && (N = N.updateQueue, o = N.lastBaseUpdate, o !== c && (o === null ? N.firstBaseUpdate = T : o.next = T, N.lastBaseUpdate = m));
    }
    if (u !== null) {
      var D = n.baseState;
      c = 0, N = T = m = null, o = u;
      do {
        var _ = o.lane & -536870913, z = _ !== o.lane;
        if (z ? (rt & _) === _ : (a & _) === _) {
          _ !== 0 && _ === ya && (mc = !0), N !== null && (N = N.next = {
            lane: 0,
            tag: o.tag,
            payload: o.payload,
            callback: null,
            next: null
          });
          t: {
            var Z = t, W = o;
            _ = e;
            var _t = l;
            switch (W.tag) {
              case 1:
                if (Z = W.payload, typeof Z == "function") {
                  D = Z.call(_t, D, _);
                  break t;
                }
                D = Z;
                break t;
              case 3:
                Z.flags = Z.flags & -65537 | 128;
              case 0:
                if (Z = W.payload, _ = typeof Z == "function" ? Z.call(_t, D, _) : Z, _ == null) break t;
                D = U({}, D, _);
                break t;
              case 2:
                hl = !0;
            }
          }
          _ = o.callback, _ !== null && (t.flags |= 64, z && (t.flags |= 8192), z = n.callbacks, z === null ? n.callbacks = [_] : z.push(_));
        } else
          z = {
            lane: _,
            tag: o.tag,
            payload: o.payload,
            callback: o.callback,
            next: null
          }, N === null ? (T = N = z, m = D) : N = N.next = z, c |= _;
        if (o = o.next, o === null) {
          if (o = n.shared.pending, o === null)
            break;
          z = o, o = z.next, z.next = null, n.lastBaseUpdate = z, n.shared.pending = null;
        }
      } while (!0);
      N === null && (m = D), n.baseState = m, n.firstBaseUpdate = T, n.lastBaseUpdate = N, u === null && (n.shared.lanes = 0), bl |= c, t.lanes = c, t.memoizedState = D;
    }
  }
  function Er(t, e) {
    if (typeof t != "function")
      throw Error(r(191, t));
    t.call(e);
  }
  function jr(t, e) {
    var l = t.callbacks;
    if (l !== null)
      for (t.callbacks = null, t = 0; t < l.length; t++)
        Er(l[t], e);
  }
  var Sa = g(null), hu = g(0);
  function Tr(t, e) {
    t = ll, q(hu, t), q(Sa, e), ll = t | e.baseLanes;
  }
  function yc() {
    q(hu, ll), q(Sa, Sa.current);
  }
  function vc() {
    ll = hu.current, C(Sa), C(hu);
  }
  var me = g(null), xe = null;
  function vl(t) {
    var e = t.alternate;
    q(Bt, Bt.current & 1), q(me, t), xe === null && (e === null || Sa.current !== null || e.memoizedState !== null) && (xe = t);
  }
  function pc(t) {
    q(Bt, Bt.current), q(me, t), xe === null && (xe = t);
  }
  function _r(t) {
    t.tag === 22 ? (q(Bt, Bt.current), q(me, t), xe === null && (xe = t)) : pl();
  }
  function pl() {
    q(Bt, Bt.current), q(me, me.current);
  }
  function ye(t) {
    C(me), xe === t && (xe = null), C(Bt);
  }
  var Bt = g(0);
  function mu(t) {
    for (var e = t; e !== null; ) {
      if (e.tag === 13) {
        var l = e.memoizedState;
        if (l !== null && (l = l.dehydrated, l === null || _f(l) || Af(l)))
          return e;
      } else if (e.tag === 19 && (e.memoizedProps.revealOrder === "forwards" || e.memoizedProps.revealOrder === "backwards" || e.memoizedProps.revealOrder === "unstable_legacy-backwards" || e.memoizedProps.revealOrder === "together")) {
        if ((e.flags & 128) !== 0) return e;
      } else if (e.child !== null) {
        e.child.return = e, e = e.child;
        continue;
      }
      if (e === t) break;
      for (; e.sibling === null; ) {
        if (e.return === null || e.return === t) return null;
        e = e.return;
      }
      e.sibling.return = e.return, e = e.sibling;
    }
    return null;
  }
  var ke = 0, et = null, jt = null, Yt = null, yu = !1, ba = !1, Jl = !1, vu = 0, sn = 0, Ea = null, iy = 0;
  function Dt() {
    throw Error(r(321));
  }
  function gc(t, e) {
    if (e === null) return !1;
    for (var l = 0; l < e.length && l < t.length; l++)
      if (!de(t[l], e[l])) return !1;
    return !0;
  }
  function Sc(t, e, l, a, n, u) {
    return ke = u, et = e, e.memoizedState = null, e.updateQueue = null, e.lanes = 0, H.H = t === null || t.memoizedState === null ? co : Uc, Jl = !1, u = l(a, n), Jl = !1, ba && (u = zr(
      e,
      l,
      a,
      n
    )), Ar(t), u;
  }
  function Ar(t) {
    H.H = dn;
    var e = jt !== null && jt.next !== null;
    if (ke = 0, Yt = jt = et = null, yu = !1, sn = 0, Ea = null, e) throw Error(r(300));
    t === null || Gt || (t = t.dependencies, t !== null && iu(t) && (Gt = !0));
  }
  function zr(t, e, l, a) {
    et = t;
    var n = 0;
    do {
      if (ba && (Ea = null), sn = 0, ba = !1, 25 <= n) throw Error(r(301));
      if (n += 1, Yt = jt = null, t.updateQueue != null) {
        var u = t.updateQueue;
        u.lastEffect = null, u.events = null, u.stores = null, u.memoCache != null && (u.memoCache.index = 0);
      }
      H.H = fo, u = e(l, a);
    } while (ba);
    return u;
  }
  function cy() {
    var t = H.H, e = t.useState()[0];
    return e = typeof e.then == "function" ? rn(e) : e, t = t.useState()[0], (jt !== null ? jt.memoizedState : null) !== t && (et.flags |= 1024), e;
  }
  function bc() {
    var t = vu !== 0;
    return vu = 0, t;
  }
  function Ec(t, e, l) {
    e.updateQueue = t.updateQueue, e.flags &= -2053, t.lanes &= ~l;
  }
  function jc(t) {
    if (yu) {
      for (t = t.memoizedState; t !== null; ) {
        var e = t.queue;
        e !== null && (e.pending = null), t = t.next;
      }
      yu = !1;
    }
    ke = 0, Yt = jt = et = null, ba = !1, sn = vu = 0, Ea = null;
  }
  function Pt() {
    var t = {
      memoizedState: null,
      baseState: null,
      baseQueue: null,
      queue: null,
      next: null
    };
    return Yt === null ? et.memoizedState = Yt = t : Yt = Yt.next = t, Yt;
  }
  function Lt() {
    if (jt === null) {
      var t = et.alternate;
      t = t !== null ? t.memoizedState : null;
    } else t = jt.next;
    var e = Yt === null ? et.memoizedState : Yt.next;
    if (e !== null)
      Yt = e, jt = t;
    else {
      if (t === null)
        throw et.alternate === null ? Error(r(467)) : Error(r(310));
      jt = t, t = {
        memoizedState: jt.memoizedState,
        baseState: jt.baseState,
        baseQueue: jt.baseQueue,
        queue: jt.queue,
        next: null
      }, Yt === null ? et.memoizedState = Yt = t : Yt = Yt.next = t;
    }
    return Yt;
  }
  function pu() {
    return { lastEffect: null, events: null, stores: null, memoCache: null };
  }
  function rn(t) {
    var e = sn;
    return sn += 1, Ea === null && (Ea = []), t = vr(Ea, t, e), e = et, (Yt === null ? e.memoizedState : Yt.next) === null && (e = e.alternate, H.H = e === null || e.memoizedState === null ? co : Uc), t;
  }
  function gu(t) {
    if (t !== null && typeof t == "object") {
      if (typeof t.then == "function") return rn(t);
      if (t.$$typeof === at) return kt(t);
    }
    throw Error(r(438, String(t)));
  }
  function Tc(t) {
    var e = null, l = et.updateQueue;
    if (l !== null && (e = l.memoCache), e == null) {
      var a = et.alternate;
      a !== null && (a = a.updateQueue, a !== null && (a = a.memoCache, a != null && (e = {
        data: a.data.map(function(n) {
          return n.slice();
        }),
        index: 0
      })));
    }
    if (e == null && (e = { data: [], index: 0 }), l === null && (l = pu(), et.updateQueue = l), l.memoCache = e, l = e.data[e.index], l === void 0)
      for (l = e.data[e.index] = Array(t), a = 0; a < t; a++)
        l[a] = ce;
    return e.index++, l;
  }
  function Fe(t, e) {
    return typeof e == "function" ? e(t) : e;
  }
  function Su(t) {
    var e = Lt();
    return _c(e, jt, t);
  }
  function _c(t, e, l) {
    var a = t.queue;
    if (a === null) throw Error(r(311));
    a.lastRenderedReducer = l;
    var n = t.baseQueue, u = a.pending;
    if (u !== null) {
      if (n !== null) {
        var c = n.next;
        n.next = u.next, u.next = c;
      }
      e.baseQueue = n = u, a.pending = null;
    }
    if (u = t.baseState, n === null) t.memoizedState = u;
    else {
      e = n.next;
      var o = c = null, m = null, T = e, N = !1;
      do {
        var D = T.lane & -536870913;
        if (D !== T.lane ? (rt & D) === D : (ke & D) === D) {
          var _ = T.revertLane;
          if (_ === 0)
            m !== null && (m = m.next = {
              lane: 0,
              revertLane: 0,
              gesture: null,
              action: T.action,
              hasEagerState: T.hasEagerState,
              eagerState: T.eagerState,
              next: null
            }), D === ya && (N = !0);
          else if ((ke & _) === _) {
            T = T.next, _ === ya && (N = !0);
            continue;
          } else
            D = {
              lane: 0,
              revertLane: T.revertLane,
              gesture: null,
              action: T.action,
              hasEagerState: T.hasEagerState,
              eagerState: T.eagerState,
              next: null
            }, m === null ? (o = m = D, c = u) : m = m.next = D, et.lanes |= _, bl |= _;
          D = T.action, Jl && l(u, D), u = T.hasEagerState ? T.eagerState : l(u, D);
        } else
          _ = {
            lane: D,
            revertLane: T.revertLane,
            gesture: T.gesture,
            action: T.action,
            hasEagerState: T.hasEagerState,
            eagerState: T.eagerState,
            next: null
          }, m === null ? (o = m = _, c = u) : m = m.next = _, et.lanes |= D, bl |= D;
        T = T.next;
      } while (T !== null && T !== e);
      if (m === null ? c = u : m.next = o, !de(u, t.memoizedState) && (Gt = !0, N && (l = va, l !== null)))
        throw l;
      t.memoizedState = u, t.baseState = c, t.baseQueue = m, a.lastRenderedState = u;
    }
    return n === null && (a.lanes = 0), [t.memoizedState, a.dispatch];
  }
  function Ac(t) {
    var e = Lt(), l = e.queue;
    if (l === null) throw Error(r(311));
    l.lastRenderedReducer = t;
    var a = l.dispatch, n = l.pending, u = e.memoizedState;
    if (n !== null) {
      l.pending = null;
      var c = n = n.next;
      do
        u = t(u, c.action), c = c.next;
      while (c !== n);
      de(u, e.memoizedState) || (Gt = !0), e.memoizedState = u, e.baseQueue === null && (e.baseState = u), l.lastRenderedState = u;
    }
    return [u, a];
  }
  function xr(t, e, l) {
    var a = et, n = Lt(), u = dt;
    if (u) {
      if (l === void 0) throw Error(r(407));
      l = l();
    } else l = e();
    var c = !de(
      (jt || n).memoizedState,
      l
    );
    if (c && (n.memoizedState = l, Gt = !0), n = n.queue, Rc(Or.bind(null, a, n, t), [
      t
    ]), n.getSnapshot !== e || c || Yt !== null && Yt.memoizedState.tag & 1) {
      if (a.flags |= 2048, ja(
        9,
        { destroy: void 0 },
        Nr.bind(
          null,
          a,
          n,
          l,
          e
        ),
        null
      ), At === null) throw Error(r(349));
      u || (ke & 127) !== 0 || Rr(a, e, l);
    }
    return l;
  }
  function Rr(t, e, l) {
    t.flags |= 16384, t = { getSnapshot: e, value: l }, e = et.updateQueue, e === null ? (e = pu(), et.updateQueue = e, e.stores = [t]) : (l = e.stores, l === null ? e.stores = [t] : l.push(t));
  }
  function Nr(t, e, l, a) {
    e.value = l, e.getSnapshot = a, Mr(e) && Dr(t);
  }
  function Or(t, e, l) {
    return l(function() {
      Mr(e) && Dr(t);
    });
  }
  function Mr(t) {
    var e = t.getSnapshot;
    t = t.value;
    try {
      var l = e();
      return !de(t, l);
    } catch (a) {
      return !0;
    }
  }
  function Dr(t) {
    var e = Ll(t, 2);
    e !== null && ie(e, t, 2);
  }
  function zc(t) {
    var e = Pt();
    if (typeof t == "function") {
      var l = t;
      if (t = l(), Jl) {
        il(!0);
        try {
          l();
        } finally {
          il(!1);
        }
      }
    }
    return e.memoizedState = e.baseState = t, e.queue = {
      pending: null,
      lanes: 0,
      dispatch: null,
      lastRenderedReducer: Fe,
      lastRenderedState: t
    }, e;
  }
  function Cr(t, e, l, a) {
    return t.baseState = l, _c(
      t,
      jt,
      typeof a == "function" ? a : Fe
    );
  }
  function fy(t, e, l, a, n) {
    if (ju(t)) throw Error(r(485));
    if (t = e.action, t !== null) {
      var u = {
        payload: n,
        action: t,
        next: null,
        isTransition: !0,
        status: "pending",
        value: null,
        reason: null,
        listeners: [],
        then: function(c) {
          u.listeners.push(c);
        }
      };
      H.T !== null ? l(!0) : u.isTransition = !1, a(u), l = e.pending, l === null ? (u.next = e.pending = u, Ur(e, u)) : (u.next = l.next, e.pending = l.next = u);
    }
  }
  function Ur(t, e) {
    var l = e.action, a = e.payload, n = t.state;
    if (e.isTransition) {
      var u = H.T, c = {};
      H.T = c;
      try {
        var o = l(n, a), m = H.S;
        m !== null && m(c, o), Hr(t, e, o);
      } catch (T) {
        xc(t, e, T);
      } finally {
        u !== null && c.types !== null && (u.types = c.types), H.T = u;
      }
    } else
      try {
        u = l(n, a), Hr(t, e, u);
      } catch (T) {
        xc(t, e, T);
      }
  }
  function Hr(t, e, l) {
    l !== null && typeof l == "object" && typeof l.then == "function" ? l.then(
      function(a) {
        Br(t, e, a);
      },
      function(a) {
        return xc(t, e, a);
      }
    ) : Br(t, e, l);
  }
  function Br(t, e, l) {
    e.status = "fulfilled", e.value = l, Lr(e), t.state = l, e = t.pending, e !== null && (l = e.next, l === e ? t.pending = null : (l = l.next, e.next = l, Ur(t, l)));
  }
  function xc(t, e, l) {
    var a = t.pending;
    if (t.pending = null, a !== null) {
      a = a.next;
      do
        e.status = "rejected", e.reason = l, Lr(e), e = e.next;
      while (e !== a);
    }
    t.action = null;
  }
  function Lr(t) {
    t = t.listeners;
    for (var e = 0; e < t.length; e++) (0, t[e])();
  }
  function qr(t, e) {
    return e;
  }
  function Yr(t, e) {
    if (dt) {
      var l = At.formState;
      if (l !== null) {
        t: {
          var a = et;
          if (dt) {
            if (Rt) {
              e: {
                for (var n = Rt, u = ze; n.nodeType !== 8; ) {
                  if (!u) {
                    n = null;
                    break e;
                  }
                  if (n = Re(
                    n.nextSibling
                  ), n === null) {
                    n = null;
                    break e;
                  }
                }
                u = n.data, n = u === "F!" || u === "F" ? n : null;
              }
              if (n) {
                Rt = Re(
                  n.nextSibling
                ), a = n.data === "F!";
                break t;
              }
            }
            ol(a);
          }
          a = !1;
        }
        a && (e = l[0]);
      }
    }
    return l = Pt(), l.memoizedState = l.baseState = e, a = {
      pending: null,
      lanes: 0,
      dispatch: null,
      lastRenderedReducer: qr,
      lastRenderedState: e
    }, l.queue = a, l = no.bind(
      null,
      et,
      a
    ), a.dispatch = l, a = zc(!1), u = Cc.bind(
      null,
      et,
      !1,
      a.queue
    ), a = Pt(), n = {
      state: e,
      dispatch: null,
      action: t,
      pending: null
    }, a.queue = n, l = fy.bind(
      null,
      et,
      n,
      u,
      l
    ), n.dispatch = l, a.memoizedState = t, [e, l, !1];
  }
  function Gr(t) {
    var e = Lt();
    return Xr(e, jt, t);
  }
  function Xr(t, e, l) {
    if (e = _c(
      t,
      e,
      qr
    )[0], t = Su(Fe)[0], typeof e == "object" && e !== null && typeof e.then == "function")
      try {
        var a = rn(e);
      } catch (c) {
        throw c === pa ? su : c;
      }
    else a = e;
    e = Lt();
    var n = e.queue, u = n.dispatch;
    return l !== e.memoizedState && (et.flags |= 2048, ja(
      9,
      { destroy: void 0 },
      sy.bind(null, n, l),
      null
    )), [a, u, t];
  }
  function sy(t, e) {
    t.action = e;
  }
  function Qr(t) {
    var e = Lt(), l = jt;
    if (l !== null)
      return Xr(e, l, t);
    Lt(), e = e.memoizedState, l = Lt();
    var a = l.queue.dispatch;
    return l.memoizedState = t, [e, a, !1];
  }
  function ja(t, e, l, a) {
    return t = { tag: t, create: l, deps: a, inst: e, next: null }, e = et.updateQueue, e === null && (e = pu(), et.updateQueue = e), l = e.lastEffect, l === null ? e.lastEffect = t.next = t : (a = l.next, l.next = t, t.next = a, e.lastEffect = t), t;
  }
  function Zr() {
    return Lt().memoizedState;
  }
  function bu(t, e, l, a) {
    var n = Pt();
    et.flags |= t, n.memoizedState = ja(
      1 | e,
      { destroy: void 0 },
      l,
      a === void 0 ? null : a
    );
  }
  function Eu(t, e, l, a) {
    var n = Lt();
    a = a === void 0 ? null : a;
    var u = n.memoizedState.inst;
    jt !== null && a !== null && gc(a, jt.memoizedState.deps) ? n.memoizedState = ja(e, u, l, a) : (et.flags |= t, n.memoizedState = ja(
      1 | e,
      u,
      l,
      a
    ));
  }
  function wr(t, e) {
    bu(8390656, 8, t, e);
  }
  function Rc(t, e) {
    Eu(2048, 8, t, e);
  }
  function ry(t) {
    et.flags |= 4;
    var e = et.updateQueue;
    if (e === null)
      e = pu(), et.updateQueue = e, e.events = [t];
    else {
      var l = e.events;
      l === null ? e.events = [t] : l.push(t);
    }
  }
  function Vr(t) {
    var e = Lt().memoizedState;
    return ry({ ref: e, nextImpl: t }), function() {
      if ((gt & 2) !== 0) throw Error(r(440));
      return e.impl.apply(void 0, arguments);
    };
  }
  function Jr(t, e) {
    return Eu(4, 2, t, e);
  }
  function Kr(t, e) {
    return Eu(4, 4, t, e);
  }
  function kr(t, e) {
    if (typeof e == "function") {
      t = t();
      var l = e(t);
      return function() {
        typeof l == "function" ? l() : e(null);
      };
    }
    if (e != null)
      return t = t(), e.current = t, function() {
        e.current = null;
      };
  }
  function Fr(t, e, l) {
    l = l != null ? l.concat([t]) : null, Eu(4, 4, kr.bind(null, e, t), l);
  }
  function Nc() {
  }
  function $r(t, e) {
    var l = Lt();
    e = e === void 0 ? null : e;
    var a = l.memoizedState;
    return e !== null && gc(e, a[1]) ? a[0] : (l.memoizedState = [t, e], t);
  }
  function Wr(t, e) {
    var l = Lt();
    e = e === void 0 ? null : e;
    var a = l.memoizedState;
    if (e !== null && gc(e, a[1]))
      return a[0];
    if (a = t(), Jl) {
      il(!0);
      try {
        t();
      } finally {
        il(!1);
      }
    }
    return l.memoizedState = [a, e], a;
  }
  function Oc(t, e, l) {
    return l === void 0 || (ke & 1073741824) !== 0 && (rt & 261930) === 0 ? t.memoizedState = e : (t.memoizedState = l, t = Po(), et.lanes |= t, bl |= t, l);
  }
  function Ir(t, e, l, a) {
    return de(l, e) ? l : Sa.current !== null ? (t = Oc(t, l, a), de(t, e) || (Gt = !0), t) : (ke & 42) === 0 || (ke & 1073741824) !== 0 && (rt & 261930) === 0 ? (Gt = !0, t.memoizedState = l) : (t = Po(), et.lanes |= t, bl |= t, e);
  }
  function Pr(t, e, l, a, n) {
    var u = G.p;
    G.p = u !== 0 && 8 > u ? u : 8;
    var c = H.T, o = {};
    H.T = o, Cc(t, !1, e, l);
    try {
      var m = n(), T = H.S;
      if (T !== null && T(o, m), m !== null && typeof m == "object" && typeof m.then == "function") {
        var N = uy(
          m,
          a
        );
        on(
          t,
          e,
          N,
          ge(t)
        );
      } else
        on(
          t,
          e,
          a,
          ge(t)
        );
    } catch (D) {
      on(
        t,
        e,
        { then: function() {
        }, status: "rejected", reason: D },
        ge()
      );
    } finally {
      G.p = u, c !== null && o.types !== null && (c.types = o.types), H.T = c;
    }
  }
  function oy() {
  }
  function Mc(t, e, l, a) {
    if (t.tag !== 5) throw Error(r(476));
    var n = to(t).queue;
    Pr(
      t,
      n,
      e,
      pt,
      l === null ? oy : function() {
        return eo(t), l(a);
      }
    );
  }
  function to(t) {
    var e = t.memoizedState;
    if (e !== null) return e;
    e = {
      memoizedState: pt,
      baseState: pt,
      baseQueue: null,
      queue: {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: Fe,
        lastRenderedState: pt
      },
      next: null
    };
    var l = {};
    return e.next = {
      memoizedState: l,
      baseState: l,
      baseQueue: null,
      queue: {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: Fe,
        lastRenderedState: l
      },
      next: null
    }, t.memoizedState = e, t = t.alternate, t !== null && (t.memoizedState = e), e;
  }
  function eo(t) {
    var e = to(t);
    e.next === null && (e = t.alternate.memoizedState), on(
      t,
      e.next.queue,
      {},
      ge()
    );
  }
  function Dc() {
    return kt(Rn);
  }
  function lo() {
    return Lt().memoizedState;
  }
  function ao() {
    return Lt().memoizedState;
  }
  function dy(t) {
    for (var e = t.return; e !== null; ) {
      switch (e.tag) {
        case 24:
        case 3:
          var l = ge();
          t = ml(l);
          var a = yl(e, t, l);
          a !== null && (ie(a, e, l), un(a, e, l)), e = { cache: cc() }, t.payload = e;
          return;
      }
      e = e.return;
    }
  }
  function hy(t, e, l) {
    var a = ge();
    l = {
      lane: a,
      revertLane: 0,
      gesture: null,
      action: l,
      hasEagerState: !1,
      eagerState: null,
      next: null
    }, ju(t) ? uo(e, l) : (l = $i(t, e, l, a), l !== null && (ie(l, t, a), io(l, e, a)));
  }
  function no(t, e, l) {
    var a = ge();
    on(t, e, l, a);
  }
  function on(t, e, l, a) {
    var n = {
      lane: a,
      revertLane: 0,
      gesture: null,
      action: l,
      hasEagerState: !1,
      eagerState: null,
      next: null
    };
    if (ju(t)) uo(e, n);
    else {
      var u = t.alternate;
      if (t.lanes === 0 && (u === null || u.lanes === 0) && (u = e.lastRenderedReducer, u !== null))
        try {
          var c = e.lastRenderedState, o = u(c, l);
          if (n.hasEagerState = !0, n.eagerState = o, de(o, c))
            return lu(t, e, n, 0), At === null && eu(), !1;
        } catch (m) {
        }
      if (l = $i(t, e, n, a), l !== null)
        return ie(l, t, a), io(l, e, a), !0;
    }
    return !1;
  }
  function Cc(t, e, l, a) {
    if (a = {
      lane: 2,
      revertLane: df(),
      gesture: null,
      action: a,
      hasEagerState: !1,
      eagerState: null,
      next: null
    }, ju(t)) {
      if (e) throw Error(r(479));
    } else
      e = $i(
        t,
        l,
        a,
        2
      ), e !== null && ie(e, t, 2);
  }
  function ju(t) {
    var e = t.alternate;
    return t === et || e !== null && e === et;
  }
  function uo(t, e) {
    ba = yu = !0;
    var l = t.pending;
    l === null ? e.next = e : (e.next = l.next, l.next = e), t.pending = e;
  }
  function io(t, e, l) {
    if ((l & 4194048) !== 0) {
      var a = e.lanes;
      a &= t.pendingLanes, l |= a, e.lanes = l, os(t, l);
    }
  }
  var dn = {
    readContext: kt,
    use: gu,
    useCallback: Dt,
    useContext: Dt,
    useEffect: Dt,
    useImperativeHandle: Dt,
    useLayoutEffect: Dt,
    useInsertionEffect: Dt,
    useMemo: Dt,
    useReducer: Dt,
    useRef: Dt,
    useState: Dt,
    useDebugValue: Dt,
    useDeferredValue: Dt,
    useTransition: Dt,
    useSyncExternalStore: Dt,
    useId: Dt,
    useHostTransitionStatus: Dt,
    useFormState: Dt,
    useActionState: Dt,
    useOptimistic: Dt,
    useMemoCache: Dt,
    useCacheRefresh: Dt
  };
  dn.useEffectEvent = Dt;
  var co = {
    readContext: kt,
    use: gu,
    useCallback: function(t, e) {
      return Pt().memoizedState = [
        t,
        e === void 0 ? null : e
      ], t;
    },
    useContext: kt,
    useEffect: wr,
    useImperativeHandle: function(t, e, l) {
      l = l != null ? l.concat([t]) : null, bu(
        4194308,
        4,
        kr.bind(null, e, t),
        l
      );
    },
    useLayoutEffect: function(t, e) {
      return bu(4194308, 4, t, e);
    },
    useInsertionEffect: function(t, e) {
      bu(4, 2, t, e);
    },
    useMemo: function(t, e) {
      var l = Pt();
      e = e === void 0 ? null : e;
      var a = t();
      if (Jl) {
        il(!0);
        try {
          t();
        } finally {
          il(!1);
        }
      }
      return l.memoizedState = [a, e], a;
    },
    useReducer: function(t, e, l) {
      var a = Pt();
      if (l !== void 0) {
        var n = l(e);
        if (Jl) {
          il(!0);
          try {
            l(e);
          } finally {
            il(!1);
          }
        }
      } else n = e;
      return a.memoizedState = a.baseState = n, t = {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: t,
        lastRenderedState: n
      }, a.queue = t, t = t.dispatch = hy.bind(
        null,
        et,
        t
      ), [a.memoizedState, t];
    },
    useRef: function(t) {
      var e = Pt();
      return t = { current: t }, e.memoizedState = t;
    },
    useState: function(t) {
      t = zc(t);
      var e = t.queue, l = no.bind(null, et, e);
      return e.dispatch = l, [t.memoizedState, l];
    },
    useDebugValue: Nc,
    useDeferredValue: function(t, e) {
      var l = Pt();
      return Oc(l, t, e);
    },
    useTransition: function() {
      var t = zc(!1);
      return t = Pr.bind(
        null,
        et,
        t.queue,
        !0,
        !1
      ), Pt().memoizedState = t, [!1, t];
    },
    useSyncExternalStore: function(t, e, l) {
      var a = et, n = Pt();
      if (dt) {
        if (l === void 0)
          throw Error(r(407));
        l = l();
      } else {
        if (l = e(), At === null)
          throw Error(r(349));
        (rt & 127) !== 0 || Rr(a, e, l);
      }
      n.memoizedState = l;
      var u = { value: l, getSnapshot: e };
      return n.queue = u, wr(Or.bind(null, a, u, t), [
        t
      ]), a.flags |= 2048, ja(
        9,
        { destroy: void 0 },
        Nr.bind(
          null,
          a,
          u,
          l,
          e
        ),
        null
      ), l;
    },
    useId: function() {
      var t = Pt(), e = At.identifierPrefix;
      if (dt) {
        var l = Be, a = He;
        l = (a & ~(1 << 32 - oe(a) - 1)).toString(32) + l, e = "_" + e + "R_" + l, l = vu++, 0 < l && (e += "H" + l.toString(32)), e += "_";
      } else
        l = iy++, e = "_" + e + "r_" + l.toString(32) + "_";
      return t.memoizedState = e;
    },
    useHostTransitionStatus: Dc,
    useFormState: Yr,
    useActionState: Yr,
    useOptimistic: function(t) {
      var e = Pt();
      e.memoizedState = e.baseState = t;
      var l = {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: null,
        lastRenderedState: null
      };
      return e.queue = l, e = Cc.bind(
        null,
        et,
        !0,
        l
      ), l.dispatch = e, [t, e];
    },
    useMemoCache: Tc,
    useCacheRefresh: function() {
      return Pt().memoizedState = dy.bind(
        null,
        et
      );
    },
    useEffectEvent: function(t) {
      var e = Pt(), l = { impl: t };
      return e.memoizedState = l, function() {
        if ((gt & 2) !== 0)
          throw Error(r(440));
        return l.impl.apply(void 0, arguments);
      };
    }
  }, Uc = {
    readContext: kt,
    use: gu,
    useCallback: $r,
    useContext: kt,
    useEffect: Rc,
    useImperativeHandle: Fr,
    useInsertionEffect: Jr,
    useLayoutEffect: Kr,
    useMemo: Wr,
    useReducer: Su,
    useRef: Zr,
    useState: function() {
      return Su(Fe);
    },
    useDebugValue: Nc,
    useDeferredValue: function(t, e) {
      var l = Lt();
      return Ir(
        l,
        jt.memoizedState,
        t,
        e
      );
    },
    useTransition: function() {
      var t = Su(Fe)[0], e = Lt().memoizedState;
      return [
        typeof t == "boolean" ? t : rn(t),
        e
      ];
    },
    useSyncExternalStore: xr,
    useId: lo,
    useHostTransitionStatus: Dc,
    useFormState: Gr,
    useActionState: Gr,
    useOptimistic: function(t, e) {
      var l = Lt();
      return Cr(l, jt, t, e);
    },
    useMemoCache: Tc,
    useCacheRefresh: ao
  };
  Uc.useEffectEvent = Vr;
  var fo = {
    readContext: kt,
    use: gu,
    useCallback: $r,
    useContext: kt,
    useEffect: Rc,
    useImperativeHandle: Fr,
    useInsertionEffect: Jr,
    useLayoutEffect: Kr,
    useMemo: Wr,
    useReducer: Ac,
    useRef: Zr,
    useState: function() {
      return Ac(Fe);
    },
    useDebugValue: Nc,
    useDeferredValue: function(t, e) {
      var l = Lt();
      return jt === null ? Oc(l, t, e) : Ir(
        l,
        jt.memoizedState,
        t,
        e
      );
    },
    useTransition: function() {
      var t = Ac(Fe)[0], e = Lt().memoizedState;
      return [
        typeof t == "boolean" ? t : rn(t),
        e
      ];
    },
    useSyncExternalStore: xr,
    useId: lo,
    useHostTransitionStatus: Dc,
    useFormState: Qr,
    useActionState: Qr,
    useOptimistic: function(t, e) {
      var l = Lt();
      return jt !== null ? Cr(l, jt, t, e) : (l.baseState = t, [t, l.queue.dispatch]);
    },
    useMemoCache: Tc,
    useCacheRefresh: ao
  };
  fo.useEffectEvent = Vr;
  function Hc(t, e, l, a) {
    e = t.memoizedState, l = l(a, e), l = l == null ? e : U({}, e, l), t.memoizedState = l, t.lanes === 0 && (t.updateQueue.baseState = l);
  }
  var Bc = {
    enqueueSetState: function(t, e, l) {
      t = t._reactInternals;
      var a = ge(), n = ml(a);
      n.payload = e, l != null && (n.callback = l), e = yl(t, n, a), e !== null && (ie(e, t, a), un(e, t, a));
    },
    enqueueReplaceState: function(t, e, l) {
      t = t._reactInternals;
      var a = ge(), n = ml(a);
      n.tag = 1, n.payload = e, l != null && (n.callback = l), e = yl(t, n, a), e !== null && (ie(e, t, a), un(e, t, a));
    },
    enqueueForceUpdate: function(t, e) {
      t = t._reactInternals;
      var l = ge(), a = ml(l);
      a.tag = 2, e != null && (a.callback = e), e = yl(t, a, l), e !== null && (ie(e, t, l), un(e, t, l));
    }
  };
  function so(t, e, l, a, n, u, c) {
    return t = t.stateNode, typeof t.shouldComponentUpdate == "function" ? t.shouldComponentUpdate(a, u, c) : e.prototype && e.prototype.isPureReactComponent ? !Wa(l, a) || !Wa(n, u) : !0;
  }
  function ro(t, e, l, a) {
    t = e.state, typeof e.componentWillReceiveProps == "function" && e.componentWillReceiveProps(l, a), typeof e.UNSAFE_componentWillReceiveProps == "function" && e.UNSAFE_componentWillReceiveProps(l, a), e.state !== t && Bc.enqueueReplaceState(e, e.state, null);
  }
  function Kl(t, e) {
    var l = e;
    if ("ref" in e) {
      l = {};
      for (var a in e)
        a !== "ref" && (l[a] = e[a]);
    }
    if (t = t.defaultProps) {
      l === e && (l = U({}, l));
      for (var n in t)
        l[n] === void 0 && (l[n] = t[n]);
    }
    return l;
  }
  function oo(t) {
    tu(t);
  }
  function ho(t) {
    console.error(t);
  }
  function mo(t) {
    tu(t);
  }
  function Tu(t, e) {
    try {
      var l = t.onUncaughtError;
      l(e.value, { componentStack: e.stack });
    } catch (a) {
      setTimeout(function() {
        throw a;
      });
    }
  }
  function yo(t, e, l) {
    try {
      var a = t.onCaughtError;
      a(l.value, {
        componentStack: l.stack,
        errorBoundary: e.tag === 1 ? e.stateNode : null
      });
    } catch (n) {
      setTimeout(function() {
        throw n;
      });
    }
  }
  function Lc(t, e, l) {
    return l = ml(l), l.tag = 3, l.payload = { element: null }, l.callback = function() {
      Tu(t, e);
    }, l;
  }
  function vo(t) {
    return t = ml(t), t.tag = 3, t;
  }
  function po(t, e, l, a) {
    var n = l.type.getDerivedStateFromError;
    if (typeof n == "function") {
      var u = a.value;
      t.payload = function() {
        return n(u);
      }, t.callback = function() {
        yo(e, l, a);
      };
    }
    var c = l.stateNode;
    c !== null && typeof c.componentDidCatch == "function" && (t.callback = function() {
      yo(e, l, a), typeof n != "function" && (El === null ? El = /* @__PURE__ */ new Set([this]) : El.add(this));
      var o = a.stack;
      this.componentDidCatch(a.value, {
        componentStack: o !== null ? o : ""
      });
    });
  }
  function my(t, e, l, a, n) {
    if (l.flags |= 32768, a !== null && typeof a == "object" && typeof a.then == "function") {
      if (e = l.alternate, e !== null && ma(
        e,
        l,
        n,
        !0
      ), l = me.current, l !== null) {
        switch (l.tag) {
          case 31:
          case 13:
            return xe === null ? Hu() : l.alternate === null && Ct === 0 && (Ct = 3), l.flags &= -257, l.flags |= 65536, l.lanes = n, a === ru ? l.flags |= 16384 : (e = l.updateQueue, e === null ? l.updateQueue = /* @__PURE__ */ new Set([a]) : e.add(a), sf(t, a, n)), !1;
          case 22:
            return l.flags |= 65536, a === ru ? l.flags |= 16384 : (e = l.updateQueue, e === null ? (e = {
              transitions: null,
              markerInstances: null,
              retryQueue: /* @__PURE__ */ new Set([a])
            }, l.updateQueue = e) : (l = e.retryQueue, l === null ? e.retryQueue = /* @__PURE__ */ new Set([a]) : l.add(a)), sf(t, a, n)), !1;
        }
        throw Error(r(435, l.tag));
      }
      return sf(t, a, n), Hu(), !1;
    }
    if (dt)
      return e = me.current, e !== null ? ((e.flags & 65536) === 0 && (e.flags |= 256), e.flags |= 65536, e.lanes = n, a !== lc && (t = Error(r(422), { cause: a }), tn(Te(t, l)))) : (a !== lc && (e = Error(r(423), {
        cause: a
      }), tn(
        Te(e, l)
      )), t = t.current.alternate, t.flags |= 65536, n &= -n, t.lanes |= n, a = Te(a, l), n = Lc(
        t.stateNode,
        a,
        n
      ), hc(t, n), Ct !== 4 && (Ct = 2)), !1;
    var u = Error(r(520), { cause: a });
    if (u = Te(u, l), bn === null ? bn = [u] : bn.push(u), Ct !== 4 && (Ct = 2), e === null) return !0;
    a = Te(a, l), l = e;
    do {
      switch (l.tag) {
        case 3:
          return l.flags |= 65536, t = n & -n, l.lanes |= t, t = Lc(l.stateNode, a, t), hc(l, t), !1;
        case 1:
          if (e = l.type, u = l.stateNode, (l.flags & 128) === 0 && (typeof e.getDerivedStateFromError == "function" || u !== null && typeof u.componentDidCatch == "function" && (El === null || !El.has(u))))
            return l.flags |= 65536, n &= -n, l.lanes |= n, n = vo(n), po(
              n,
              t,
              l,
              a
            ), hc(l, n), !1;
      }
      l = l.return;
    } while (l !== null);
    return !1;
  }
  var qc = Error(r(461)), Gt = !1;
  function Ft(t, e, l, a) {
    e.child = t === null ? br(e, null, l, a) : Vl(
      e,
      t.child,
      l,
      a
    );
  }
  function go(t, e, l, a, n) {
    l = l.render;
    var u = e.ref;
    if ("ref" in a) {
      var c = {};
      for (var o in a)
        o !== "ref" && (c[o] = a[o]);
    } else c = a;
    return Xl(e), a = Sc(
      t,
      e,
      l,
      c,
      u,
      n
    ), o = bc(), t !== null && !Gt ? (Ec(t, e, n), $e(t, e, n)) : (dt && o && tc(e), e.flags |= 1, Ft(t, e, a, n), e.child);
  }
  function So(t, e, l, a, n) {
    if (t === null) {
      var u = l.type;
      return typeof u == "function" && !Wi(u) && u.defaultProps === void 0 && l.compare === null ? (e.tag = 15, e.type = u, bo(
        t,
        e,
        u,
        a,
        n
      )) : (t = nu(
        l.type,
        null,
        a,
        e,
        e.mode,
        n
      ), t.ref = e.ref, t.return = e, e.child = t);
    }
    if (u = t.child, !Jc(t, n)) {
      var c = u.memoizedProps;
      if (l = l.compare, l = l !== null ? l : Wa, l(c, a) && t.ref === e.ref)
        return $e(t, e, n);
    }
    return e.flags |= 1, t = we(u, a), t.ref = e.ref, t.return = e, e.child = t;
  }
  function bo(t, e, l, a, n) {
    if (t !== null) {
      var u = t.memoizedProps;
      if (Wa(u, a) && t.ref === e.ref)
        if (Gt = !1, e.pendingProps = a = u, Jc(t, n))
          (t.flags & 131072) !== 0 && (Gt = !0);
        else
          return e.lanes = t.lanes, $e(t, e, n);
    }
    return Yc(
      t,
      e,
      l,
      a,
      n
    );
  }
  function Eo(t, e, l, a) {
    var n = a.children, u = t !== null ? t.memoizedState : null;
    if (t === null && e.stateNode === null && (e.stateNode = {
      _visibility: 1,
      _pendingMarkers: null,
      _retryCache: null,
      _transitions: null
    }), a.mode === "hidden") {
      if ((e.flags & 128) !== 0) {
        if (u = u !== null ? u.baseLanes | l : l, t !== null) {
          for (a = e.child = t.child, n = 0; a !== null; )
            n = n | a.lanes | a.childLanes, a = a.sibling;
          a = n & ~u;
        } else a = 0, e.child = null;
        return jo(
          t,
          e,
          u,
          l,
          a
        );
      }
      if ((l & 536870912) !== 0)
        e.memoizedState = { baseLanes: 0, cachePool: null }, t !== null && fu(
          e,
          u !== null ? u.cachePool : null
        ), u !== null ? Tr(e, u) : yc(), _r(e);
      else
        return a = e.lanes = 536870912, jo(
          t,
          e,
          u !== null ? u.baseLanes | l : l,
          l,
          a
        );
    } else
      u !== null ? (fu(e, u.cachePool), Tr(e, u), pl(), e.memoizedState = null) : (t !== null && fu(e, null), yc(), pl());
    return Ft(t, e, n, l), e.child;
  }
  function hn(t, e) {
    return t !== null && t.tag === 22 || e.stateNode !== null || (e.stateNode = {
      _visibility: 1,
      _pendingMarkers: null,
      _retryCache: null,
      _transitions: null
    }), e.sibling;
  }
  function jo(t, e, l, a, n) {
    var u = sc();
    return u = u === null ? null : { parent: qt._currentValue, pool: u }, e.memoizedState = {
      baseLanes: l,
      cachePool: u
    }, t !== null && fu(e, null), yc(), _r(e), t !== null && ma(t, e, a, !0), e.childLanes = n, null;
  }
  function _u(t, e) {
    return e = zu(
      { mode: e.mode, children: e.children },
      t.mode
    ), e.ref = t.ref, t.child = e, e.return = t, e;
  }
  function To(t, e, l) {
    return Vl(e, t.child, null, l), t = _u(e, e.pendingProps), t.flags |= 2, ye(e), e.memoizedState = null, t;
  }
  function yy(t, e, l) {
    var a = e.pendingProps, n = (e.flags & 128) !== 0;
    if (e.flags &= -129, t === null) {
      if (dt) {
        if (a.mode === "hidden")
          return t = _u(e, a), e.lanes = 536870912, hn(null, t);
        if (pc(e), (t = Rt) ? (t = Hd(
          t,
          ze
        ), t = t !== null && t.data === "&" ? t : null, t !== null && (e.memoizedState = {
          dehydrated: t,
          treeContext: sl !== null ? { id: He, overflow: Be } : null,
          retryLane: 536870912,
          hydrationErrors: null
        }, l = ur(t), l.return = e, e.child = l, Kt = e, Rt = null)) : t = null, t === null) throw ol(e);
        return e.lanes = 536870912, null;
      }
      return _u(e, a);
    }
    var u = t.memoizedState;
    if (u !== null) {
      var c = u.dehydrated;
      if (pc(e), n)
        if (e.flags & 256)
          e.flags &= -257, e = To(
            t,
            e,
            l
          );
        else if (e.memoizedState !== null)
          e.child = t.child, e.flags |= 128, e = null;
        else throw Error(r(558));
      else if (Gt || ma(t, e, l, !1), n = (l & t.childLanes) !== 0, Gt || n) {
        if (a = At, a !== null && (c = ds(a, l), c !== 0 && c !== u.retryLane))
          throw u.retryLane = c, Ll(t, c), ie(a, t, c), qc;
        Hu(), e = To(
          t,
          e,
          l
        );
      } else
        t = u.treeContext, Rt = Re(c.nextSibling), Kt = e, dt = !0, rl = null, ze = !1, t !== null && fr(e, t), e = _u(e, a), e.flags |= 4096;
      return e;
    }
    return t = we(t.child, {
      mode: a.mode,
      children: a.children
    }), t.ref = e.ref, e.child = t, t.return = e, t;
  }
  function Au(t, e) {
    var l = e.ref;
    if (l === null)
      t !== null && t.ref !== null && (e.flags |= 4194816);
    else {
      if (typeof l != "function" && typeof l != "object")
        throw Error(r(284));
      (t === null || t.ref !== l) && (e.flags |= 4194816);
    }
  }
  function Yc(t, e, l, a, n) {
    return Xl(e), l = Sc(
      t,
      e,
      l,
      a,
      void 0,
      n
    ), a = bc(), t !== null && !Gt ? (Ec(t, e, n), $e(t, e, n)) : (dt && a && tc(e), e.flags |= 1, Ft(t, e, l, n), e.child);
  }
  function _o(t, e, l, a, n, u) {
    return Xl(e), e.updateQueue = null, l = zr(
      e,
      a,
      l,
      n
    ), Ar(t), a = bc(), t !== null && !Gt ? (Ec(t, e, u), $e(t, e, u)) : (dt && a && tc(e), e.flags |= 1, Ft(t, e, l, u), e.child);
  }
  function Ao(t, e, l, a, n) {
    if (Xl(e), e.stateNode === null) {
      var u = ra, c = l.contextType;
      typeof c == "object" && c !== null && (u = kt(c)), u = new l(a, u), e.memoizedState = u.state !== null && u.state !== void 0 ? u.state : null, u.updater = Bc, e.stateNode = u, u._reactInternals = e, u = e.stateNode, u.props = a, u.state = e.memoizedState, u.refs = {}, oc(e), c = l.contextType, u.context = typeof c == "object" && c !== null ? kt(c) : ra, u.state = e.memoizedState, c = l.getDerivedStateFromProps, typeof c == "function" && (Hc(
        e,
        l,
        c,
        a
      ), u.state = e.memoizedState), typeof l.getDerivedStateFromProps == "function" || typeof u.getSnapshotBeforeUpdate == "function" || typeof u.UNSAFE_componentWillMount != "function" && typeof u.componentWillMount != "function" || (c = u.state, typeof u.componentWillMount == "function" && u.componentWillMount(), typeof u.UNSAFE_componentWillMount == "function" && u.UNSAFE_componentWillMount(), c !== u.state && Bc.enqueueReplaceState(u, u.state, null), fn(e, a, u, n), cn(), u.state = e.memoizedState), typeof u.componentDidMount == "function" && (e.flags |= 4194308), a = !0;
    } else if (t === null) {
      u = e.stateNode;
      var o = e.memoizedProps, m = Kl(l, o);
      u.props = m;
      var T = u.context, N = l.contextType;
      c = ra, typeof N == "object" && N !== null && (c = kt(N));
      var D = l.getDerivedStateFromProps;
      N = typeof D == "function" || typeof u.getSnapshotBeforeUpdate == "function", o = e.pendingProps !== o, N || typeof u.UNSAFE_componentWillReceiveProps != "function" && typeof u.componentWillReceiveProps != "function" || (o || T !== c) && ro(
        e,
        u,
        a,
        c
      ), hl = !1;
      var _ = e.memoizedState;
      u.state = _, fn(e, a, u, n), cn(), T = e.memoizedState, o || _ !== T || hl ? (typeof D == "function" && (Hc(
        e,
        l,
        D,
        a
      ), T = e.memoizedState), (m = hl || so(
        e,
        l,
        m,
        a,
        _,
        T,
        c
      )) ? (N || typeof u.UNSAFE_componentWillMount != "function" && typeof u.componentWillMount != "function" || (typeof u.componentWillMount == "function" && u.componentWillMount(), typeof u.UNSAFE_componentWillMount == "function" && u.UNSAFE_componentWillMount()), typeof u.componentDidMount == "function" && (e.flags |= 4194308)) : (typeof u.componentDidMount == "function" && (e.flags |= 4194308), e.memoizedProps = a, e.memoizedState = T), u.props = a, u.state = T, u.context = c, a = m) : (typeof u.componentDidMount == "function" && (e.flags |= 4194308), a = !1);
    } else {
      u = e.stateNode, dc(t, e), c = e.memoizedProps, N = Kl(l, c), u.props = N, D = e.pendingProps, _ = u.context, T = l.contextType, m = ra, typeof T == "object" && T !== null && (m = kt(T)), o = l.getDerivedStateFromProps, (T = typeof o == "function" || typeof u.getSnapshotBeforeUpdate == "function") || typeof u.UNSAFE_componentWillReceiveProps != "function" && typeof u.componentWillReceiveProps != "function" || (c !== D || _ !== m) && ro(
        e,
        u,
        a,
        m
      ), hl = !1, _ = e.memoizedState, u.state = _, fn(e, a, u, n), cn();
      var z = e.memoizedState;
      c !== D || _ !== z || hl || t !== null && t.dependencies !== null && iu(t.dependencies) ? (typeof o == "function" && (Hc(
        e,
        l,
        o,
        a
      ), z = e.memoizedState), (N = hl || so(
        e,
        l,
        N,
        a,
        _,
        z,
        m
      ) || t !== null && t.dependencies !== null && iu(t.dependencies)) ? (T || typeof u.UNSAFE_componentWillUpdate != "function" && typeof u.componentWillUpdate != "function" || (typeof u.componentWillUpdate == "function" && u.componentWillUpdate(a, z, m), typeof u.UNSAFE_componentWillUpdate == "function" && u.UNSAFE_componentWillUpdate(
        a,
        z,
        m
      )), typeof u.componentDidUpdate == "function" && (e.flags |= 4), typeof u.getSnapshotBeforeUpdate == "function" && (e.flags |= 1024)) : (typeof u.componentDidUpdate != "function" || c === t.memoizedProps && _ === t.memoizedState || (e.flags |= 4), typeof u.getSnapshotBeforeUpdate != "function" || c === t.memoizedProps && _ === t.memoizedState || (e.flags |= 1024), e.memoizedProps = a, e.memoizedState = z), u.props = a, u.state = z, u.context = m, a = N) : (typeof u.componentDidUpdate != "function" || c === t.memoizedProps && _ === t.memoizedState || (e.flags |= 4), typeof u.getSnapshotBeforeUpdate != "function" || c === t.memoizedProps && _ === t.memoizedState || (e.flags |= 1024), a = !1);
    }
    return u = a, Au(t, e), a = (e.flags & 128) !== 0, u || a ? (u = e.stateNode, l = a && typeof l.getDerivedStateFromError != "function" ? null : u.render(), e.flags |= 1, t !== null && a ? (e.child = Vl(
      e,
      t.child,
      null,
      n
    ), e.child = Vl(
      e,
      null,
      l,
      n
    )) : Ft(t, e, l, n), e.memoizedState = u.state, t = e.child) : t = $e(
      t,
      e,
      n
    ), t;
  }
  function zo(t, e, l, a) {
    return Yl(), e.flags |= 256, Ft(t, e, l, a), e.child;
  }
  var Gc = {
    dehydrated: null,
    treeContext: null,
    retryLane: 0,
    hydrationErrors: null
  };
  function Xc(t) {
    return { baseLanes: t, cachePool: mr() };
  }
  function Qc(t, e, l) {
    return t = t !== null ? t.childLanes & ~l : 0, e && (t |= pe), t;
  }
  function xo(t, e, l) {
    var a = e.pendingProps, n = !1, u = (e.flags & 128) !== 0, c;
    if ((c = u) || (c = t !== null && t.memoizedState === null ? !1 : (Bt.current & 2) !== 0), c && (n = !0, e.flags &= -129), c = (e.flags & 32) !== 0, e.flags &= -33, t === null) {
      if (dt) {
        if (n ? vl(e) : pl(), (t = Rt) ? (t = Hd(
          t,
          ze
        ), t = t !== null && t.data !== "&" ? t : null, t !== null && (e.memoizedState = {
          dehydrated: t,
          treeContext: sl !== null ? { id: He, overflow: Be } : null,
          retryLane: 536870912,
          hydrationErrors: null
        }, l = ur(t), l.return = e, e.child = l, Kt = e, Rt = null)) : t = null, t === null) throw ol(e);
        return Af(t) ? e.lanes = 32 : e.lanes = 536870912, null;
      }
      var o = a.children;
      return a = a.fallback, n ? (pl(), n = e.mode, o = zu(
        { mode: "hidden", children: o },
        n
      ), a = ql(
        a,
        n,
        l,
        null
      ), o.return = e, a.return = e, o.sibling = a, e.child = o, a = e.child, a.memoizedState = Xc(l), a.childLanes = Qc(
        t,
        c,
        l
      ), e.memoizedState = Gc, hn(null, a)) : (vl(e), Zc(e, o));
    }
    var m = t.memoizedState;
    if (m !== null && (o = m.dehydrated, o !== null)) {
      if (u)
        e.flags & 256 ? (vl(e), e.flags &= -257, e = wc(
          t,
          e,
          l
        )) : e.memoizedState !== null ? (pl(), e.child = t.child, e.flags |= 128, e = null) : (pl(), o = a.fallback, n = e.mode, a = zu(
          { mode: "visible", children: a.children },
          n
        ), o = ql(
          o,
          n,
          l,
          null
        ), o.flags |= 2, a.return = e, o.return = e, a.sibling = o, e.child = a, Vl(
          e,
          t.child,
          null,
          l
        ), a = e.child, a.memoizedState = Xc(l), a.childLanes = Qc(
          t,
          c,
          l
        ), e.memoizedState = Gc, e = hn(null, a));
      else if (vl(e), Af(o)) {
        if (c = o.nextSibling && o.nextSibling.dataset, c) var T = c.dgst;
        c = T, a = Error(r(419)), a.stack = "", a.digest = c, tn({ value: a, source: null, stack: null }), e = wc(
          t,
          e,
          l
        );
      } else if (Gt || ma(t, e, l, !1), c = (l & t.childLanes) !== 0, Gt || c) {
        if (c = At, c !== null && (a = ds(c, l), a !== 0 && a !== m.retryLane))
          throw m.retryLane = a, Ll(t, a), ie(c, t, a), qc;
        _f(o) || Hu(), e = wc(
          t,
          e,
          l
        );
      } else
        _f(o) ? (e.flags |= 192, e.child = t.child, e = null) : (t = m.treeContext, Rt = Re(
          o.nextSibling
        ), Kt = e, dt = !0, rl = null, ze = !1, t !== null && fr(e, t), e = Zc(
          e,
          a.children
        ), e.flags |= 4096);
      return e;
    }
    return n ? (pl(), o = a.fallback, n = e.mode, m = t.child, T = m.sibling, a = we(m, {
      mode: "hidden",
      children: a.children
    }), a.subtreeFlags = m.subtreeFlags & 65011712, T !== null ? o = we(
      T,
      o
    ) : (o = ql(
      o,
      n,
      l,
      null
    ), o.flags |= 2), o.return = e, a.return = e, a.sibling = o, e.child = a, hn(null, a), a = e.child, o = t.child.memoizedState, o === null ? o = Xc(l) : (n = o.cachePool, n !== null ? (m = qt._currentValue, n = n.parent !== m ? { parent: m, pool: m } : n) : n = mr(), o = {
      baseLanes: o.baseLanes | l,
      cachePool: n
    }), a.memoizedState = o, a.childLanes = Qc(
      t,
      c,
      l
    ), e.memoizedState = Gc, hn(t.child, a)) : (vl(e), l = t.child, t = l.sibling, l = we(l, {
      mode: "visible",
      children: a.children
    }), l.return = e, l.sibling = null, t !== null && (c = e.deletions, c === null ? (e.deletions = [t], e.flags |= 16) : c.push(t)), e.child = l, e.memoizedState = null, l);
  }
  function Zc(t, e) {
    return e = zu(
      { mode: "visible", children: e },
      t.mode
    ), e.return = t, t.child = e;
  }
  function zu(t, e) {
    return t = he(22, t, null, e), t.lanes = 0, t;
  }
  function wc(t, e, l) {
    return Vl(e, t.child, null, l), t = Zc(
      e,
      e.pendingProps.children
    ), t.flags |= 2, e.memoizedState = null, t;
  }
  function Ro(t, e, l) {
    t.lanes |= e;
    var a = t.alternate;
    a !== null && (a.lanes |= e), uc(t.return, e, l);
  }
  function Vc(t, e, l, a, n, u) {
    var c = t.memoizedState;
    c === null ? t.memoizedState = {
      isBackwards: e,
      rendering: null,
      renderingStartTime: 0,
      last: a,
      tail: l,
      tailMode: n,
      treeForkCount: u
    } : (c.isBackwards = e, c.rendering = null, c.renderingStartTime = 0, c.last = a, c.tail = l, c.tailMode = n, c.treeForkCount = u);
  }
  function No(t, e, l) {
    var a = e.pendingProps, n = a.revealOrder, u = a.tail;
    a = a.children;
    var c = Bt.current, o = (c & 2) !== 0;
    if (o ? (c = c & 1 | 2, e.flags |= 128) : c &= 1, q(Bt, c), Ft(t, e, a, l), a = dt ? Pa : 0, !o && t !== null && (t.flags & 128) !== 0)
      t: for (t = e.child; t !== null; ) {
        if (t.tag === 13)
          t.memoizedState !== null && Ro(t, l, e);
        else if (t.tag === 19)
          Ro(t, l, e);
        else if (t.child !== null) {
          t.child.return = t, t = t.child;
          continue;
        }
        if (t === e) break t;
        for (; t.sibling === null; ) {
          if (t.return === null || t.return === e)
            break t;
          t = t.return;
        }
        t.sibling.return = t.return, t = t.sibling;
      }
    switch (n) {
      case "forwards":
        for (l = e.child, n = null; l !== null; )
          t = l.alternate, t !== null && mu(t) === null && (n = l), l = l.sibling;
        l = n, l === null ? (n = e.child, e.child = null) : (n = l.sibling, l.sibling = null), Vc(
          e,
          !1,
          n,
          l,
          u,
          a
        );
        break;
      case "backwards":
      case "unstable_legacy-backwards":
        for (l = null, n = e.child, e.child = null; n !== null; ) {
          if (t = n.alternate, t !== null && mu(t) === null) {
            e.child = n;
            break;
          }
          t = n.sibling, n.sibling = l, l = n, n = t;
        }
        Vc(
          e,
          !0,
          l,
          null,
          u,
          a
        );
        break;
      case "together":
        Vc(
          e,
          !1,
          null,
          null,
          void 0,
          a
        );
        break;
      default:
        e.memoizedState = null;
    }
    return e.child;
  }
  function $e(t, e, l) {
    if (t !== null && (e.dependencies = t.dependencies), bl |= e.lanes, (l & e.childLanes) === 0)
      if (t !== null) {
        if (ma(
          t,
          e,
          l,
          !1
        ), (l & e.childLanes) === 0)
          return null;
      } else return null;
    if (t !== null && e.child !== t.child)
      throw Error(r(153));
    if (e.child !== null) {
      for (t = e.child, l = we(t, t.pendingProps), e.child = l, l.return = e; t.sibling !== null; )
        t = t.sibling, l = l.sibling = we(t, t.pendingProps), l.return = e;
      l.sibling = null;
    }
    return e.child;
  }
  function Jc(t, e) {
    return (t.lanes & e) !== 0 ? !0 : (t = t.dependencies, !!(t !== null && iu(t)));
  }
  function vy(t, e, l) {
    switch (e.tag) {
      case 3:
        It(e, e.stateNode.containerInfo), dl(e, qt, t.memoizedState.cache), Yl();
        break;
      case 27:
      case 5:
        qa(e);
        break;
      case 4:
        It(e, e.stateNode.containerInfo);
        break;
      case 10:
        dl(
          e,
          e.type,
          e.memoizedProps.value
        );
        break;
      case 31:
        if (e.memoizedState !== null)
          return e.flags |= 128, pc(e), null;
        break;
      case 13:
        var a = e.memoizedState;
        if (a !== null)
          return a.dehydrated !== null ? (vl(e), e.flags |= 128, null) : (l & e.child.childLanes) !== 0 ? xo(t, e, l) : (vl(e), t = $e(
            t,
            e,
            l
          ), t !== null ? t.sibling : null);
        vl(e);
        break;
      case 19:
        var n = (t.flags & 128) !== 0;
        if (a = (l & e.childLanes) !== 0, a || (ma(
          t,
          e,
          l,
          !1
        ), a = (l & e.childLanes) !== 0), n) {
          if (a)
            return No(
              t,
              e,
              l
            );
          e.flags |= 128;
        }
        if (n = e.memoizedState, n !== null && (n.rendering = null, n.tail = null, n.lastEffect = null), q(Bt, Bt.current), a) break;
        return null;
      case 22:
        return e.lanes = 0, Eo(
          t,
          e,
          l,
          e.pendingProps
        );
      case 24:
        dl(e, qt, t.memoizedState.cache);
    }
    return $e(t, e, l);
  }
  function Oo(t, e, l) {
    if (t !== null)
      if (t.memoizedProps !== e.pendingProps)
        Gt = !0;
      else {
        if (!Jc(t, l) && (e.flags & 128) === 0)
          return Gt = !1, vy(
            t,
            e,
            l
          );
        Gt = (t.flags & 131072) !== 0;
      }
    else
      Gt = !1, dt && (e.flags & 1048576) !== 0 && cr(e, Pa, e.index);
    switch (e.lanes = 0, e.tag) {
      case 16:
        t: {
          var a = e.pendingProps;
          if (t = Zl(e.elementType), e.type = t, typeof t == "function")
            Wi(t) ? (a = Kl(t, a), e.tag = 1, e = Ao(
              null,
              e,
              t,
              a,
              l
            )) : (e.tag = 0, e = Yc(
              null,
              e,
              t,
              a,
              l
            ));
          else {
            if (t != null) {
              var n = t.$$typeof;
              if (n === st) {
                e.tag = 11, e = go(
                  null,
                  e,
                  t,
                  a,
                  l
                );
                break t;
              } else if (n === tt) {
                e.tag = 14, e = So(
                  null,
                  e,
                  t,
                  a,
                  l
                );
                break t;
              }
            }
            throw e = nt(t) || t, Error(r(306, e, ""));
          }
        }
        return e;
      case 0:
        return Yc(
          t,
          e,
          e.type,
          e.pendingProps,
          l
        );
      case 1:
        return a = e.type, n = Kl(
          a,
          e.pendingProps
        ), Ao(
          t,
          e,
          a,
          n,
          l
        );
      case 3:
        t: {
          if (It(
            e,
            e.stateNode.containerInfo
          ), t === null) throw Error(r(387));
          a = e.pendingProps;
          var u = e.memoizedState;
          n = u.element, dc(t, e), fn(e, a, null, l);
          var c = e.memoizedState;
          if (a = c.cache, dl(e, qt, a), a !== u.cache && ic(
            e,
            [qt],
            l,
            !0
          ), cn(), a = c.element, u.isDehydrated)
            if (u = {
              element: a,
              isDehydrated: !1,
              cache: c.cache
            }, e.updateQueue.baseState = u, e.memoizedState = u, e.flags & 256) {
              e = zo(
                t,
                e,
                a,
                l
              );
              break t;
            } else if (a !== n) {
              n = Te(
                Error(r(424)),
                e
              ), tn(n), e = zo(
                t,
                e,
                a,
                l
              );
              break t;
            } else
              for (t = e.stateNode.containerInfo, t.nodeType === 9 ? t = t.body : t = t.nodeName === "HTML" ? t.ownerDocument.body : t, Rt = Re(t.firstChild), Kt = e, dt = !0, rl = null, ze = !0, l = br(
                e,
                null,
                a,
                l
              ), e.child = l; l; )
                l.flags = l.flags & -3 | 4096, l = l.sibling;
          else {
            if (Yl(), a === n) {
              e = $e(
                t,
                e,
                l
              );
              break t;
            }
            Ft(t, e, a, l);
          }
          e = e.child;
        }
        return e;
      case 26:
        return Au(t, e), t === null ? (l = Xd(
          e.type,
          null,
          e.pendingProps,
          null
        )) ? e.memoizedState = l : dt || (l = e.type, t = e.pendingProps, a = Qu(
          it.current
        ).createElement(l), a[Jt] = e, a[te] = t, $t(a, l, t), wt(a), e.stateNode = a) : e.memoizedState = Xd(
          e.type,
          t.memoizedProps,
          e.pendingProps,
          t.memoizedState
        ), null;
      case 27:
        return qa(e), t === null && dt && (a = e.stateNode = qd(
          e.type,
          e.pendingProps,
          it.current
        ), Kt = e, ze = !0, n = Rt, Al(e.type) ? (zf = n, Rt = Re(a.firstChild)) : Rt = n), Ft(
          t,
          e,
          e.pendingProps.children,
          l
        ), Au(t, e), t === null && (e.flags |= 4194304), e.child;
      case 5:
        return t === null && dt && ((n = a = Rt) && (a = Jy(
          a,
          e.type,
          e.pendingProps,
          ze
        ), a !== null ? (e.stateNode = a, Kt = e, Rt = Re(a.firstChild), ze = !1, n = !0) : n = !1), n || ol(e)), qa(e), n = e.type, u = e.pendingProps, c = t !== null ? t.memoizedProps : null, a = u.children, Ef(n, u) ? a = null : c !== null && Ef(n, c) && (e.flags |= 32), e.memoizedState !== null && (n = Sc(
          t,
          e,
          cy,
          null,
          null,
          l
        ), Rn._currentValue = n), Au(t, e), Ft(t, e, a, l), e.child;
      case 6:
        return t === null && dt && ((t = l = Rt) && (l = Ky(
          l,
          e.pendingProps,
          ze
        ), l !== null ? (e.stateNode = l, Kt = e, Rt = null, t = !0) : t = !1), t || ol(e)), null;
      case 13:
        return xo(t, e, l);
      case 4:
        return It(
          e,
          e.stateNode.containerInfo
        ), a = e.pendingProps, t === null ? e.child = Vl(
          e,
          null,
          a,
          l
        ) : Ft(t, e, a, l), e.child;
      case 11:
        return go(
          t,
          e,
          e.type,
          e.pendingProps,
          l
        );
      case 7:
        return Ft(
          t,
          e,
          e.pendingProps,
          l
        ), e.child;
      case 8:
        return Ft(
          t,
          e,
          e.pendingProps.children,
          l
        ), e.child;
      case 12:
        return Ft(
          t,
          e,
          e.pendingProps.children,
          l
        ), e.child;
      case 10:
        return a = e.pendingProps, dl(e, e.type, a.value), Ft(t, e, a.children, l), e.child;
      case 9:
        return n = e.type._context, a = e.pendingProps.children, Xl(e), n = kt(n), a = a(n), e.flags |= 1, Ft(t, e, a, l), e.child;
      case 14:
        return So(
          t,
          e,
          e.type,
          e.pendingProps,
          l
        );
      case 15:
        return bo(
          t,
          e,
          e.type,
          e.pendingProps,
          l
        );
      case 19:
        return No(t, e, l);
      case 31:
        return yy(t, e, l);
      case 22:
        return Eo(
          t,
          e,
          l,
          e.pendingProps
        );
      case 24:
        return Xl(e), a = kt(qt), t === null ? (n = sc(), n === null && (n = At, u = cc(), n.pooledCache = u, u.refCount++, u !== null && (n.pooledCacheLanes |= l), n = u), e.memoizedState = { parent: a, cache: n }, oc(e), dl(e, qt, n)) : ((t.lanes & l) !== 0 && (dc(t, e), fn(e, null, null, l), cn()), n = t.memoizedState, u = e.memoizedState, n.parent !== a ? (n = { parent: a, cache: a }, e.memoizedState = n, e.lanes === 0 && (e.memoizedState = e.updateQueue.baseState = n), dl(e, qt, a)) : (a = u.cache, dl(e, qt, a), a !== n.cache && ic(
          e,
          [qt],
          l,
          !0
        ))), Ft(
          t,
          e,
          e.pendingProps.children,
          l
        ), e.child;
      case 29:
        throw e.pendingProps;
    }
    throw Error(r(156, e.tag));
  }
  function We(t) {
    t.flags |= 4;
  }
  function Kc(t, e, l, a, n) {
    if ((e = (t.mode & 32) !== 0) && (e = !1), e) {
      if (t.flags |= 16777216, (n & 335544128) === n)
        if (t.stateNode.complete) t.flags |= 8192;
        else if (ad()) t.flags |= 8192;
        else
          throw wl = ru, rc;
    } else t.flags &= -16777217;
  }
  function Mo(t, e) {
    if (e.type !== "stylesheet" || (e.state.loading & 4) !== 0)
      t.flags &= -16777217;
    else if (t.flags |= 16777216, !Jd(e))
      if (ad()) t.flags |= 8192;
      else
        throw wl = ru, rc;
  }
  function xu(t, e) {
    e !== null && (t.flags |= 4), t.flags & 16384 && (e = t.tag !== 22 ? ss() : 536870912, t.lanes |= e, za |= e);
  }
  function mn(t, e) {
    if (!dt)
      switch (t.tailMode) {
        case "hidden":
          e = t.tail;
          for (var l = null; e !== null; )
            e.alternate !== null && (l = e), e = e.sibling;
          l === null ? t.tail = null : l.sibling = null;
          break;
        case "collapsed":
          l = t.tail;
          for (var a = null; l !== null; )
            l.alternate !== null && (a = l), l = l.sibling;
          a === null ? e || t.tail === null ? t.tail = null : t.tail.sibling = null : a.sibling = null;
      }
  }
  function Nt(t) {
    var e = t.alternate !== null && t.alternate.child === t.child, l = 0, a = 0;
    if (e)
      for (var n = t.child; n !== null; )
        l |= n.lanes | n.childLanes, a |= n.subtreeFlags & 65011712, a |= n.flags & 65011712, n.return = t, n = n.sibling;
    else
      for (n = t.child; n !== null; )
        l |= n.lanes | n.childLanes, a |= n.subtreeFlags, a |= n.flags, n.return = t, n = n.sibling;
    return t.subtreeFlags |= a, t.childLanes = l, e;
  }
  function py(t, e, l) {
    var a = e.pendingProps;
    switch (ec(e), e.tag) {
      case 16:
      case 15:
      case 0:
      case 11:
      case 7:
      case 8:
      case 12:
      case 9:
      case 14:
        return Nt(e), null;
      case 1:
        return Nt(e), null;
      case 3:
        return l = e.stateNode, a = null, t !== null && (a = t.memoizedState.cache), e.memoizedState.cache !== a && (e.flags |= 2048), Ke(qt), Ht(), l.pendingContext && (l.context = l.pendingContext, l.pendingContext = null), (t === null || t.child === null) && (ha(e) ? We(e) : t === null || t.memoizedState.isDehydrated && (e.flags & 256) === 0 || (e.flags |= 1024, ac())), Nt(e), null;
      case 26:
        var n = e.type, u = e.memoizedState;
        return t === null ? (We(e), u !== null ? (Nt(e), Mo(e, u)) : (Nt(e), Kc(
          e,
          n,
          null,
          a,
          l
        ))) : u ? u !== t.memoizedState ? (We(e), Nt(e), Mo(e, u)) : (Nt(e), e.flags &= -16777217) : (t = t.memoizedProps, t !== a && We(e), Nt(e), Kc(
          e,
          n,
          t,
          a,
          l
        )), null;
      case 27:
        if (qn(e), l = it.current, n = e.type, t !== null && e.stateNode != null)
          t.memoizedProps !== a && We(e);
        else {
          if (!a) {
            if (e.stateNode === null)
              throw Error(r(166));
            return Nt(e), null;
          }
          t = k.current, ha(e) ? sr(e) : (t = qd(n, a, l), e.stateNode = t, We(e));
        }
        return Nt(e), null;
      case 5:
        if (qn(e), n = e.type, t !== null && e.stateNode != null)
          t.memoizedProps !== a && We(e);
        else {
          if (!a) {
            if (e.stateNode === null)
              throw Error(r(166));
            return Nt(e), null;
          }
          if (u = k.current, ha(e))
            sr(e);
          else {
            var c = Qu(
              it.current
            );
            switch (u) {
              case 1:
                u = c.createElementNS(
                  "http://www.w3.org/2000/svg",
                  n
                );
                break;
              case 2:
                u = c.createElementNS(
                  "http://www.w3.org/1998/Math/MathML",
                  n
                );
                break;
              default:
                switch (n) {
                  case "svg":
                    u = c.createElementNS(
                      "http://www.w3.org/2000/svg",
                      n
                    );
                    break;
                  case "math":
                    u = c.createElementNS(
                      "http://www.w3.org/1998/Math/MathML",
                      n
                    );
                    break;
                  case "script":
                    u = c.createElement("div"), u.innerHTML = "<script><\/script>", u = u.removeChild(
                      u.firstChild
                    );
                    break;
                  case "select":
                    u = typeof a.is == "string" ? c.createElement("select", {
                      is: a.is
                    }) : c.createElement("select"), a.multiple ? u.multiple = !0 : a.size && (u.size = a.size);
                    break;
                  default:
                    u = typeof a.is == "string" ? c.createElement(n, { is: a.is }) : c.createElement(n);
                }
            }
            u[Jt] = e, u[te] = a;
            t: for (c = e.child; c !== null; ) {
              if (c.tag === 5 || c.tag === 6)
                u.appendChild(c.stateNode);
              else if (c.tag !== 4 && c.tag !== 27 && c.child !== null) {
                c.child.return = c, c = c.child;
                continue;
              }
              if (c === e) break t;
              for (; c.sibling === null; ) {
                if (c.return === null || c.return === e)
                  break t;
                c = c.return;
              }
              c.sibling.return = c.return, c = c.sibling;
            }
            e.stateNode = u;
            t: switch ($t(u, n, a), n) {
              case "button":
              case "input":
              case "select":
              case "textarea":
                a = !!a.autoFocus;
                break t;
              case "img":
                a = !0;
                break t;
              default:
                a = !1;
            }
            a && We(e);
          }
        }
        return Nt(e), Kc(
          e,
          e.type,
          t === null ? null : t.memoizedProps,
          e.pendingProps,
          l
        ), null;
      case 6:
        if (t && e.stateNode != null)
          t.memoizedProps !== a && We(e);
        else {
          if (typeof a != "string" && e.stateNode === null)
            throw Error(r(166));
          if (t = it.current, ha(e)) {
            if (t = e.stateNode, l = e.memoizedProps, a = null, n = Kt, n !== null)
              switch (n.tag) {
                case 27:
                case 5:
                  a = n.memoizedProps;
              }
            t[Jt] = e, t = !!(t.nodeValue === l || a !== null && a.suppressHydrationWarning === !0 || xd(t.nodeValue, l)), t || ol(e, !0);
          } else
            t = Qu(t).createTextNode(
              a
            ), t[Jt] = e, e.stateNode = t;
        }
        return Nt(e), null;
      case 31:
        if (l = e.memoizedState, t === null || t.memoizedState !== null) {
          if (a = ha(e), l !== null) {
            if (t === null) {
              if (!a) throw Error(r(318));
              if (t = e.memoizedState, t = t !== null ? t.dehydrated : null, !t) throw Error(r(557));
              t[Jt] = e;
            } else
              Yl(), (e.flags & 128) === 0 && (e.memoizedState = null), e.flags |= 4;
            Nt(e), t = !1;
          } else
            l = ac(), t !== null && t.memoizedState !== null && (t.memoizedState.hydrationErrors = l), t = !0;
          if (!t)
            return e.flags & 256 ? (ye(e), e) : (ye(e), null);
          if ((e.flags & 128) !== 0)
            throw Error(r(558));
        }
        return Nt(e), null;
      case 13:
        if (a = e.memoizedState, t === null || t.memoizedState !== null && t.memoizedState.dehydrated !== null) {
          if (n = ha(e), a !== null && a.dehydrated !== null) {
            if (t === null) {
              if (!n) throw Error(r(318));
              if (n = e.memoizedState, n = n !== null ? n.dehydrated : null, !n) throw Error(r(317));
              n[Jt] = e;
            } else
              Yl(), (e.flags & 128) === 0 && (e.memoizedState = null), e.flags |= 4;
            Nt(e), n = !1;
          } else
            n = ac(), t !== null && t.memoizedState !== null && (t.memoizedState.hydrationErrors = n), n = !0;
          if (!n)
            return e.flags & 256 ? (ye(e), e) : (ye(e), null);
        }
        return ye(e), (e.flags & 128) !== 0 ? (e.lanes = l, e) : (l = a !== null, t = t !== null && t.memoizedState !== null, l && (a = e.child, n = null, a.alternate !== null && a.alternate.memoizedState !== null && a.alternate.memoizedState.cachePool !== null && (n = a.alternate.memoizedState.cachePool.pool), u = null, a.memoizedState !== null && a.memoizedState.cachePool !== null && (u = a.memoizedState.cachePool.pool), u !== n && (a.flags |= 2048)), l !== t && l && (e.child.flags |= 8192), xu(e, e.updateQueue), Nt(e), null);
      case 4:
        return Ht(), t === null && vf(e.stateNode.containerInfo), Nt(e), null;
      case 10:
        return Ke(e.type), Nt(e), null;
      case 19:
        if (C(Bt), a = e.memoizedState, a === null) return Nt(e), null;
        if (n = (e.flags & 128) !== 0, u = a.rendering, u === null)
          if (n) mn(a, !1);
          else {
            if (Ct !== 0 || t !== null && (t.flags & 128) !== 0)
              for (t = e.child; t !== null; ) {
                if (u = mu(t), u !== null) {
                  for (e.flags |= 128, mn(a, !1), t = u.updateQueue, e.updateQueue = t, xu(e, t), e.subtreeFlags = 0, t = l, l = e.child; l !== null; )
                    nr(l, t), l = l.sibling;
                  return q(
                    Bt,
                    Bt.current & 1 | 2
                  ), dt && Ve(e, a.treeForkCount), e.child;
                }
                t = t.sibling;
              }
            a.tail !== null && se() > Du && (e.flags |= 128, n = !0, mn(a, !1), e.lanes = 4194304);
          }
        else {
          if (!n)
            if (t = mu(u), t !== null) {
              if (e.flags |= 128, n = !0, t = t.updateQueue, e.updateQueue = t, xu(e, t), mn(a, !0), a.tail === null && a.tailMode === "hidden" && !u.alternate && !dt)
                return Nt(e), null;
            } else
              2 * se() - a.renderingStartTime > Du && l !== 536870912 && (e.flags |= 128, n = !0, mn(a, !1), e.lanes = 4194304);
          a.isBackwards ? (u.sibling = e.child, e.child = u) : (t = a.last, t !== null ? t.sibling = u : e.child = u, a.last = u);
        }
        return a.tail !== null ? (t = a.tail, a.rendering = t, a.tail = t.sibling, a.renderingStartTime = se(), t.sibling = null, l = Bt.current, q(
          Bt,
          n ? l & 1 | 2 : l & 1
        ), dt && Ve(e, a.treeForkCount), t) : (Nt(e), null);
      case 22:
      case 23:
        return ye(e), vc(), a = e.memoizedState !== null, t !== null ? t.memoizedState !== null !== a && (e.flags |= 8192) : a && (e.flags |= 8192), a ? (l & 536870912) !== 0 && (e.flags & 128) === 0 && (Nt(e), e.subtreeFlags & 6 && (e.flags |= 8192)) : Nt(e), l = e.updateQueue, l !== null && xu(e, l.retryQueue), l = null, t !== null && t.memoizedState !== null && t.memoizedState.cachePool !== null && (l = t.memoizedState.cachePool.pool), a = null, e.memoizedState !== null && e.memoizedState.cachePool !== null && (a = e.memoizedState.cachePool.pool), a !== l && (e.flags |= 2048), t !== null && C(Ql), null;
      case 24:
        return l = null, t !== null && (l = t.memoizedState.cache), e.memoizedState.cache !== l && (e.flags |= 2048), Ke(qt), Nt(e), null;
      case 25:
        return null;
      case 30:
        return null;
    }
    throw Error(r(156, e.tag));
  }
  function gy(t, e) {
    switch (ec(e), e.tag) {
      case 1:
        return t = e.flags, t & 65536 ? (e.flags = t & -65537 | 128, e) : null;
      case 3:
        return Ke(qt), Ht(), t = e.flags, (t & 65536) !== 0 && (t & 128) === 0 ? (e.flags = t & -65537 | 128, e) : null;
      case 26:
      case 27:
      case 5:
        return qn(e), null;
      case 31:
        if (e.memoizedState !== null) {
          if (ye(e), e.alternate === null)
            throw Error(r(340));
          Yl();
        }
        return t = e.flags, t & 65536 ? (e.flags = t & -65537 | 128, e) : null;
      case 13:
        if (ye(e), t = e.memoizedState, t !== null && t.dehydrated !== null) {
          if (e.alternate === null)
            throw Error(r(340));
          Yl();
        }
        return t = e.flags, t & 65536 ? (e.flags = t & -65537 | 128, e) : null;
      case 19:
        return C(Bt), null;
      case 4:
        return Ht(), null;
      case 10:
        return Ke(e.type), null;
      case 22:
      case 23:
        return ye(e), vc(), t !== null && C(Ql), t = e.flags, t & 65536 ? (e.flags = t & -65537 | 128, e) : null;
      case 24:
        return Ke(qt), null;
      case 25:
        return null;
      default:
        return null;
    }
  }
  function Do(t, e) {
    switch (ec(e), e.tag) {
      case 3:
        Ke(qt), Ht();
        break;
      case 26:
      case 27:
      case 5:
        qn(e);
        break;
      case 4:
        Ht();
        break;
      case 31:
        e.memoizedState !== null && ye(e);
        break;
      case 13:
        ye(e);
        break;
      case 19:
        C(Bt);
        break;
      case 10:
        Ke(e.type);
        break;
      case 22:
      case 23:
        ye(e), vc(), t !== null && C(Ql);
        break;
      case 24:
        Ke(qt);
    }
  }
  function yn(t, e) {
    try {
      var l = e.updateQueue, a = l !== null ? l.lastEffect : null;
      if (a !== null) {
        var n = a.next;
        l = n;
        do {
          if ((l.tag & t) === t) {
            a = void 0;
            var u = l.create, c = l.inst;
            a = u(), c.destroy = a;
          }
          l = l.next;
        } while (l !== n);
      }
    } catch (o) {
      Et(e, e.return, o);
    }
  }
  function gl(t, e, l) {
    try {
      var a = e.updateQueue, n = a !== null ? a.lastEffect : null;
      if (n !== null) {
        var u = n.next;
        a = u;
        do {
          if ((a.tag & t) === t) {
            var c = a.inst, o = c.destroy;
            if (o !== void 0) {
              c.destroy = void 0, n = e;
              var m = l, T = o;
              try {
                T();
              } catch (N) {
                Et(
                  n,
                  m,
                  N
                );
              }
            }
          }
          a = a.next;
        } while (a !== u);
      }
    } catch (N) {
      Et(e, e.return, N);
    }
  }
  function Co(t) {
    var e = t.updateQueue;
    if (e !== null) {
      var l = t.stateNode;
      try {
        jr(e, l);
      } catch (a) {
        Et(t, t.return, a);
      }
    }
  }
  function Uo(t, e, l) {
    l.props = Kl(
      t.type,
      t.memoizedProps
    ), l.state = t.memoizedState;
    try {
      l.componentWillUnmount();
    } catch (a) {
      Et(t, e, a);
    }
  }
  function vn(t, e) {
    try {
      var l = t.ref;
      if (l !== null) {
        switch (t.tag) {
          case 26:
          case 27:
          case 5:
            var a = t.stateNode;
            break;
          case 30:
            a = t.stateNode;
            break;
          default:
            a = t.stateNode;
        }
        typeof l == "function" ? t.refCleanup = l(a) : l.current = a;
      }
    } catch (n) {
      Et(t, e, n);
    }
  }
  function Le(t, e) {
    var l = t.ref, a = t.refCleanup;
    if (l !== null)
      if (typeof a == "function")
        try {
          a();
        } catch (n) {
          Et(t, e, n);
        } finally {
          t.refCleanup = null, t = t.alternate, t != null && (t.refCleanup = null);
        }
      else if (typeof l == "function")
        try {
          l(null);
        } catch (n) {
          Et(t, e, n);
        }
      else l.current = null;
  }
  function Ho(t) {
    var e = t.type, l = t.memoizedProps, a = t.stateNode;
    try {
      t: switch (e) {
        case "button":
        case "input":
        case "select":
        case "textarea":
          l.autoFocus && a.focus();
          break t;
        case "img":
          l.src ? a.src = l.src : l.srcSet && (a.srcset = l.srcSet);
      }
    } catch (n) {
      Et(t, t.return, n);
    }
  }
  function kc(t, e, l) {
    try {
      var a = t.stateNode;
      Gy(a, t.type, l, e), a[te] = e;
    } catch (n) {
      Et(t, t.return, n);
    }
  }
  function Bo(t) {
    return t.tag === 5 || t.tag === 3 || t.tag === 26 || t.tag === 27 && Al(t.type) || t.tag === 4;
  }
  function Fc(t) {
    t: for (; ; ) {
      for (; t.sibling === null; ) {
        if (t.return === null || Bo(t.return)) return null;
        t = t.return;
      }
      for (t.sibling.return = t.return, t = t.sibling; t.tag !== 5 && t.tag !== 6 && t.tag !== 18; ) {
        if (t.tag === 27 && Al(t.type) || t.flags & 2 || t.child === null || t.tag === 4) continue t;
        t.child.return = t, t = t.child;
      }
      if (!(t.flags & 2)) return t.stateNode;
    }
  }
  function $c(t, e, l) {
    var a = t.tag;
    if (a === 5 || a === 6)
      t = t.stateNode, e ? (l.nodeType === 9 ? l.body : l.nodeName === "HTML" ? l.ownerDocument.body : l).insertBefore(t, e) : (e = l.nodeType === 9 ? l.body : l.nodeName === "HTML" ? l.ownerDocument.body : l, e.appendChild(t), l = l._reactRootContainer, l != null || e.onclick !== null || (e.onclick = Qe));
    else if (a !== 4 && (a === 27 && Al(t.type) && (l = t.stateNode, e = null), t = t.child, t !== null))
      for ($c(t, e, l), t = t.sibling; t !== null; )
        $c(t, e, l), t = t.sibling;
  }
  function Ru(t, e, l) {
    var a = t.tag;
    if (a === 5 || a === 6)
      t = t.stateNode, e ? l.insertBefore(t, e) : l.appendChild(t);
    else if (a !== 4 && (a === 27 && Al(t.type) && (l = t.stateNode), t = t.child, t !== null))
      for (Ru(t, e, l), t = t.sibling; t !== null; )
        Ru(t, e, l), t = t.sibling;
  }
  function Lo(t) {
    var e = t.stateNode, l = t.memoizedProps;
    try {
      for (var a = t.type, n = e.attributes; n.length; )
        e.removeAttributeNode(n[0]);
      $t(e, a, l), e[Jt] = t, e[te] = l;
    } catch (u) {
      Et(t, t.return, u);
    }
  }
  var Ie = !1, Xt = !1, Wc = !1, qo = typeof WeakSet == "function" ? WeakSet : Set, Vt = null;
  function Sy(t, e) {
    if (t = t.containerInfo, Sf = Fu, t = Fs(t), wi(t)) {
      if ("selectionStart" in t)
        var l = {
          start: t.selectionStart,
          end: t.selectionEnd
        };
      else
        t: {
          l = (l = t.ownerDocument) && l.defaultView || window;
          var a = l.getSelection && l.getSelection();
          if (a && a.rangeCount !== 0) {
            l = a.anchorNode;
            var n = a.anchorOffset, u = a.focusNode;
            a = a.focusOffset;
            try {
              l.nodeType, u.nodeType;
            } catch (W) {
              l = null;
              break t;
            }
            var c = 0, o = -1, m = -1, T = 0, N = 0, D = t, _ = null;
            e: for (; ; ) {
              for (var z; D !== l || n !== 0 && D.nodeType !== 3 || (o = c + n), D !== u || a !== 0 && D.nodeType !== 3 || (m = c + a), D.nodeType === 3 && (c += D.nodeValue.length), (z = D.firstChild) !== null; )
                _ = D, D = z;
              for (; ; ) {
                if (D === t) break e;
                if (_ === l && ++T === n && (o = c), _ === u && ++N === a && (m = c), (z = D.nextSibling) !== null) break;
                D = _, _ = D.parentNode;
              }
              D = z;
            }
            l = o === -1 || m === -1 ? null : { start: o, end: m };
          } else l = null;
        }
      l = l || { start: 0, end: 0 };
    } else l = null;
    for (bf = { focusedElem: t, selectionRange: l }, Fu = !1, Vt = e; Vt !== null; )
      if (e = Vt, t = e.child, (e.subtreeFlags & 1028) !== 0 && t !== null)
        t.return = e, Vt = t;
      else
        for (; Vt !== null; ) {
          switch (e = Vt, u = e.alternate, t = e.flags, e.tag) {
            case 0:
              if ((t & 4) !== 0 && (t = e.updateQueue, t = t !== null ? t.events : null, t !== null))
                for (l = 0; l < t.length; l++)
                  n = t[l], n.ref.impl = n.nextImpl;
              break;
            case 11:
            case 15:
              break;
            case 1:
              if ((t & 1024) !== 0 && u !== null) {
                t = void 0, l = e, n = u.memoizedProps, u = u.memoizedState, a = l.stateNode;
                try {
                  var Z = Kl(
                    l.type,
                    n
                  );
                  t = a.getSnapshotBeforeUpdate(
                    Z,
                    u
                  ), a.__reactInternalSnapshotBeforeUpdate = t;
                } catch (W) {
                  Et(
                    l,
                    l.return,
                    W
                  );
                }
              }
              break;
            case 3:
              if ((t & 1024) !== 0) {
                if (t = e.stateNode.containerInfo, l = t.nodeType, l === 9)
                  Tf(t);
                else if (l === 1)
                  switch (t.nodeName) {
                    case "HEAD":
                    case "HTML":
                    case "BODY":
                      Tf(t);
                      break;
                    default:
                      t.textContent = "";
                  }
              }
              break;
            case 5:
            case 26:
            case 27:
            case 6:
            case 4:
            case 17:
              break;
            default:
              if ((t & 1024) !== 0) throw Error(r(163));
          }
          if (t = e.sibling, t !== null) {
            t.return = e.return, Vt = t;
            break;
          }
          Vt = e.return;
        }
  }
  function Yo(t, e, l) {
    var a = l.flags;
    switch (l.tag) {
      case 0:
      case 11:
      case 15:
        tl(t, l), a & 4 && yn(5, l);
        break;
      case 1:
        if (tl(t, l), a & 4)
          if (t = l.stateNode, e === null)
            try {
              t.componentDidMount();
            } catch (c) {
              Et(l, l.return, c);
            }
          else {
            var n = Kl(
              l.type,
              e.memoizedProps
            );
            e = e.memoizedState;
            try {
              t.componentDidUpdate(
                n,
                e,
                t.__reactInternalSnapshotBeforeUpdate
              );
            } catch (c) {
              Et(
                l,
                l.return,
                c
              );
            }
          }
        a & 64 && Co(l), a & 512 && vn(l, l.return);
        break;
      case 3:
        if (tl(t, l), a & 64 && (t = l.updateQueue, t !== null)) {
          if (e = null, l.child !== null)
            switch (l.child.tag) {
              case 27:
              case 5:
                e = l.child.stateNode;
                break;
              case 1:
                e = l.child.stateNode;
            }
          try {
            jr(t, e);
          } catch (c) {
            Et(l, l.return, c);
          }
        }
        break;
      case 27:
        e === null && a & 4 && Lo(l);
      case 26:
      case 5:
        tl(t, l), e === null && a & 4 && Ho(l), a & 512 && vn(l, l.return);
        break;
      case 12:
        tl(t, l);
        break;
      case 31:
        tl(t, l), a & 4 && Qo(t, l);
        break;
      case 13:
        tl(t, l), a & 4 && Zo(t, l), a & 64 && (t = l.memoizedState, t !== null && (t = t.dehydrated, t !== null && (l = Ry.bind(
          null,
          l
        ), ky(t, l))));
        break;
      case 22:
        if (a = l.memoizedState !== null || Ie, !a) {
          e = e !== null && e.memoizedState !== null || Xt, n = Ie;
          var u = Xt;
          Ie = a, (Xt = e) && !u ? el(
            t,
            l,
            (l.subtreeFlags & 8772) !== 0
          ) : tl(t, l), Ie = n, Xt = u;
        }
        break;
      case 30:
        break;
      default:
        tl(t, l);
    }
  }
  function Go(t) {
    var e = t.alternate;
    e !== null && (t.alternate = null, Go(e)), t.child = null, t.deletions = null, t.sibling = null, t.tag === 5 && (e = t.stateNode, e !== null && xi(e)), t.stateNode = null, t.return = null, t.dependencies = null, t.memoizedProps = null, t.memoizedState = null, t.pendingProps = null, t.stateNode = null, t.updateQueue = null;
  }
  var Ot = null, le = !1;
  function Pe(t, e, l) {
    for (l = l.child; l !== null; )
      Xo(t, e, l), l = l.sibling;
  }
  function Xo(t, e, l) {
    if (re && typeof re.onCommitFiberUnmount == "function")
      try {
        re.onCommitFiberUnmount(Ya, l);
      } catch (u) {
      }
    switch (l.tag) {
      case 26:
        Xt || Le(l, e), Pe(
          t,
          e,
          l
        ), l.memoizedState ? l.memoizedState.count-- : l.stateNode && (l = l.stateNode, l.parentNode.removeChild(l));
        break;
      case 27:
        Xt || Le(l, e);
        var a = Ot, n = le;
        Al(l.type) && (Ot = l.stateNode, le = !1), Pe(
          t,
          e,
          l
        ), An(l.stateNode), Ot = a, le = n;
        break;
      case 5:
        Xt || Le(l, e);
      case 6:
        if (a = Ot, n = le, Ot = null, Pe(
          t,
          e,
          l
        ), Ot = a, le = n, Ot !== null)
          if (le)
            try {
              (Ot.nodeType === 9 ? Ot.body : Ot.nodeName === "HTML" ? Ot.ownerDocument.body : Ot).removeChild(l.stateNode);
            } catch (u) {
              Et(
                l,
                e,
                u
              );
            }
          else
            try {
              Ot.removeChild(l.stateNode);
            } catch (u) {
              Et(
                l,
                e,
                u
              );
            }
        break;
      case 18:
        Ot !== null && (le ? (t = Ot, Cd(
          t.nodeType === 9 ? t.body : t.nodeName === "HTML" ? t.ownerDocument.body : t,
          l.stateNode
        ), Ua(t)) : Cd(Ot, l.stateNode));
        break;
      case 4:
        a = Ot, n = le, Ot = l.stateNode.containerInfo, le = !0, Pe(
          t,
          e,
          l
        ), Ot = a, le = n;
        break;
      case 0:
      case 11:
      case 14:
      case 15:
        gl(2, l, e), Xt || gl(4, l, e), Pe(
          t,
          e,
          l
        );
        break;
      case 1:
        Xt || (Le(l, e), a = l.stateNode, typeof a.componentWillUnmount == "function" && Uo(
          l,
          e,
          a
        )), Pe(
          t,
          e,
          l
        );
        break;
      case 21:
        Pe(
          t,
          e,
          l
        );
        break;
      case 22:
        Xt = (a = Xt) || l.memoizedState !== null, Pe(
          t,
          e,
          l
        ), Xt = a;
        break;
      default:
        Pe(
          t,
          e,
          l
        );
    }
  }
  function Qo(t, e) {
    if (e.memoizedState === null && (t = e.alternate, t !== null && (t = t.memoizedState, t !== null))) {
      t = t.dehydrated;
      try {
        Ua(t);
      } catch (l) {
        Et(e, e.return, l);
      }
    }
  }
  function Zo(t, e) {
    if (e.memoizedState === null && (t = e.alternate, t !== null && (t = t.memoizedState, t !== null && (t = t.dehydrated, t !== null))))
      try {
        Ua(t);
      } catch (l) {
        Et(e, e.return, l);
      }
  }
  function by(t) {
    switch (t.tag) {
      case 31:
      case 13:
      case 19:
        var e = t.stateNode;
        return e === null && (e = t.stateNode = new qo()), e;
      case 22:
        return t = t.stateNode, e = t._retryCache, e === null && (e = t._retryCache = new qo()), e;
      default:
        throw Error(r(435, t.tag));
    }
  }
  function Nu(t, e) {
    var l = by(t);
    e.forEach(function(a) {
      if (!l.has(a)) {
        l.add(a);
        var n = Ny.bind(null, t, a);
        a.then(n, n);
      }
    });
  }
  function ae(t, e) {
    var l = e.deletions;
    if (l !== null)
      for (var a = 0; a < l.length; a++) {
        var n = l[a], u = t, c = e, o = c;
        t: for (; o !== null; ) {
          switch (o.tag) {
            case 27:
              if (Al(o.type)) {
                Ot = o.stateNode, le = !1;
                break t;
              }
              break;
            case 5:
              Ot = o.stateNode, le = !1;
              break t;
            case 3:
            case 4:
              Ot = o.stateNode.containerInfo, le = !0;
              break t;
          }
          o = o.return;
        }
        if (Ot === null) throw Error(r(160));
        Xo(u, c, n), Ot = null, le = !1, u = n.alternate, u !== null && (u.return = null), n.return = null;
      }
    if (e.subtreeFlags & 13886)
      for (e = e.child; e !== null; )
        wo(e, t), e = e.sibling;
  }
  var De = null;
  function wo(t, e) {
    var l = t.alternate, a = t.flags;
    switch (t.tag) {
      case 0:
      case 11:
      case 14:
      case 15:
        ae(e, t), ne(t), a & 4 && (gl(3, t, t.return), yn(3, t), gl(5, t, t.return));
        break;
      case 1:
        ae(e, t), ne(t), a & 512 && (Xt || l === null || Le(l, l.return)), a & 64 && Ie && (t = t.updateQueue, t !== null && (a = t.callbacks, a !== null && (l = t.shared.hiddenCallbacks, t.shared.hiddenCallbacks = l === null ? a : l.concat(a))));
        break;
      case 26:
        var n = De;
        if (ae(e, t), ne(t), a & 512 && (Xt || l === null || Le(l, l.return)), a & 4) {
          var u = l !== null ? l.memoizedState : null;
          if (a = t.memoizedState, l === null)
            if (a === null)
              if (t.stateNode === null) {
                t: {
                  a = t.type, l = t.memoizedProps, n = n.ownerDocument || n;
                  e: switch (a) {
                    case "title":
                      u = n.getElementsByTagName("title")[0], (!u || u[Qa] || u[Jt] || u.namespaceURI === "http://www.w3.org/2000/svg" || u.hasAttribute("itemprop")) && (u = n.createElement(a), n.head.insertBefore(
                        u,
                        n.querySelector("head > title")
                      )), $t(u, a, l), u[Jt] = t, wt(u), a = u;
                      break t;
                    case "link":
                      var c = wd(
                        "link",
                        "href",
                        n
                      ).get(a + (l.href || ""));
                      if (c) {
                        for (var o = 0; o < c.length; o++)
                          if (u = c[o], u.getAttribute("href") === (l.href == null || l.href === "" ? null : l.href) && u.getAttribute("rel") === (l.rel == null ? null : l.rel) && u.getAttribute("title") === (l.title == null ? null : l.title) && u.getAttribute("crossorigin") === (l.crossOrigin == null ? null : l.crossOrigin)) {
                            c.splice(o, 1);
                            break e;
                          }
                      }
                      u = n.createElement(a), $t(u, a, l), n.head.appendChild(u);
                      break;
                    case "meta":
                      if (c = wd(
                        "meta",
                        "content",
                        n
                      ).get(a + (l.content || ""))) {
                        for (o = 0; o < c.length; o++)
                          if (u = c[o], u.getAttribute("content") === (l.content == null ? null : "" + l.content) && u.getAttribute("name") === (l.name == null ? null : l.name) && u.getAttribute("property") === (l.property == null ? null : l.property) && u.getAttribute("http-equiv") === (l.httpEquiv == null ? null : l.httpEquiv) && u.getAttribute("charset") === (l.charSet == null ? null : l.charSet)) {
                            c.splice(o, 1);
                            break e;
                          }
                      }
                      u = n.createElement(a), $t(u, a, l), n.head.appendChild(u);
                      break;
                    default:
                      throw Error(r(468, a));
                  }
                  u[Jt] = t, wt(u), a = u;
                }
                t.stateNode = a;
              } else
                Vd(
                  n,
                  t.type,
                  t.stateNode
                );
            else
              t.stateNode = Zd(
                n,
                a,
                t.memoizedProps
              );
          else
            u !== a ? (u === null ? l.stateNode !== null && (l = l.stateNode, l.parentNode.removeChild(l)) : u.count--, a === null ? Vd(
              n,
              t.type,
              t.stateNode
            ) : Zd(
              n,
              a,
              t.memoizedProps
            )) : a === null && t.stateNode !== null && kc(
              t,
              t.memoizedProps,
              l.memoizedProps
            );
        }
        break;
      case 27:
        ae(e, t), ne(t), a & 512 && (Xt || l === null || Le(l, l.return)), l !== null && a & 4 && kc(
          t,
          t.memoizedProps,
          l.memoizedProps
        );
        break;
      case 5:
        if (ae(e, t), ne(t), a & 512 && (Xt || l === null || Le(l, l.return)), t.flags & 32) {
          n = t.stateNode;
          try {
            aa(n, "");
          } catch (Z) {
            Et(t, t.return, Z);
          }
        }
        a & 4 && t.stateNode != null && (n = t.memoizedProps, kc(
          t,
          n,
          l !== null ? l.memoizedProps : n
        )), a & 1024 && (Wc = !0);
        break;
      case 6:
        if (ae(e, t), ne(t), a & 4) {
          if (t.stateNode === null)
            throw Error(r(162));
          a = t.memoizedProps, l = t.stateNode;
          try {
            l.nodeValue = a;
          } catch (Z) {
            Et(t, t.return, Z);
          }
        }
        break;
      case 3:
        if (Vu = null, n = De, De = Zu(e.containerInfo), ae(e, t), De = n, ne(t), a & 4 && l !== null && l.memoizedState.isDehydrated)
          try {
            Ua(e.containerInfo);
          } catch (Z) {
            Et(t, t.return, Z);
          }
        Wc && (Wc = !1, Vo(t));
        break;
      case 4:
        a = De, De = Zu(
          t.stateNode.containerInfo
        ), ae(e, t), ne(t), De = a;
        break;
      case 12:
        ae(e, t), ne(t);
        break;
      case 31:
        ae(e, t), ne(t), a & 4 && (a = t.updateQueue, a !== null && (t.updateQueue = null, Nu(t, a)));
        break;
      case 13:
        ae(e, t), ne(t), t.child.flags & 8192 && t.memoizedState !== null != (l !== null && l.memoizedState !== null) && (Mu = se()), a & 4 && (a = t.updateQueue, a !== null && (t.updateQueue = null, Nu(t, a)));
        break;
      case 22:
        n = t.memoizedState !== null;
        var m = l !== null && l.memoizedState !== null, T = Ie, N = Xt;
        if (Ie = T || n, Xt = N || m, ae(e, t), Xt = N, Ie = T, ne(t), a & 8192)
          t: for (e = t.stateNode, e._visibility = n ? e._visibility & -2 : e._visibility | 1, n && (l === null || m || Ie || Xt || kl(t)), l = null, e = t; ; ) {
            if (e.tag === 5 || e.tag === 26) {
              if (l === null) {
                m = l = e;
                try {
                  if (u = m.stateNode, n)
                    c = u.style, typeof c.setProperty == "function" ? c.setProperty("display", "none", "important") : c.display = "none";
                  else {
                    o = m.stateNode;
                    var D = m.memoizedProps.style, _ = D != null && D.hasOwnProperty("display") ? D.display : null;
                    o.style.display = _ == null || typeof _ == "boolean" ? "" : ("" + _).trim();
                  }
                } catch (Z) {
                  Et(m, m.return, Z);
                }
              }
            } else if (e.tag === 6) {
              if (l === null) {
                m = e;
                try {
                  m.stateNode.nodeValue = n ? "" : m.memoizedProps;
                } catch (Z) {
                  Et(m, m.return, Z);
                }
              }
            } else if (e.tag === 18) {
              if (l === null) {
                m = e;
                try {
                  var z = m.stateNode;
                  n ? Ud(z, !0) : Ud(m.stateNode, !1);
                } catch (Z) {
                  Et(m, m.return, Z);
                }
              }
            } else if ((e.tag !== 22 && e.tag !== 23 || e.memoizedState === null || e === t) && e.child !== null) {
              e.child.return = e, e = e.child;
              continue;
            }
            if (e === t) break t;
            for (; e.sibling === null; ) {
              if (e.return === null || e.return === t) break t;
              l === e && (l = null), e = e.return;
            }
            l === e && (l = null), e.sibling.return = e.return, e = e.sibling;
          }
        a & 4 && (a = t.updateQueue, a !== null && (l = a.retryQueue, l !== null && (a.retryQueue = null, Nu(t, l))));
        break;
      case 19:
        ae(e, t), ne(t), a & 4 && (a = t.updateQueue, a !== null && (t.updateQueue = null, Nu(t, a)));
        break;
      case 30:
        break;
      case 21:
        break;
      default:
        ae(e, t), ne(t);
    }
  }
  function ne(t) {
    var e = t.flags;
    if (e & 2) {
      try {
        for (var l, a = t.return; a !== null; ) {
          if (Bo(a)) {
            l = a;
            break;
          }
          a = a.return;
        }
        if (l == null) throw Error(r(160));
        switch (l.tag) {
          case 27:
            var n = l.stateNode, u = Fc(t);
            Ru(t, u, n);
            break;
          case 5:
            var c = l.stateNode;
            l.flags & 32 && (aa(c, ""), l.flags &= -33);
            var o = Fc(t);
            Ru(t, o, c);
            break;
          case 3:
          case 4:
            var m = l.stateNode.containerInfo, T = Fc(t);
            $c(
              t,
              T,
              m
            );
            break;
          default:
            throw Error(r(161));
        }
      } catch (N) {
        Et(t, t.return, N);
      }
      t.flags &= -3;
    }
    e & 4096 && (t.flags &= -4097);
  }
  function Vo(t) {
    if (t.subtreeFlags & 1024)
      for (t = t.child; t !== null; ) {
        var e = t;
        Vo(e), e.tag === 5 && e.flags & 1024 && e.stateNode.reset(), t = t.sibling;
      }
  }
  function tl(t, e) {
    if (e.subtreeFlags & 8772)
      for (e = e.child; e !== null; )
        Yo(t, e.alternate, e), e = e.sibling;
  }
  function kl(t) {
    for (t = t.child; t !== null; ) {
      var e = t;
      switch (e.tag) {
        case 0:
        case 11:
        case 14:
        case 15:
          gl(4, e, e.return), kl(e);
          break;
        case 1:
          Le(e, e.return);
          var l = e.stateNode;
          typeof l.componentWillUnmount == "function" && Uo(
            e,
            e.return,
            l
          ), kl(e);
          break;
        case 27:
          An(e.stateNode);
        case 26:
        case 5:
          Le(e, e.return), kl(e);
          break;
        case 22:
          e.memoizedState === null && kl(e);
          break;
        case 30:
          kl(e);
          break;
        default:
          kl(e);
      }
      t = t.sibling;
    }
  }
  function el(t, e, l) {
    for (l = l && (e.subtreeFlags & 8772) !== 0, e = e.child; e !== null; ) {
      var a = e.alternate, n = t, u = e, c = u.flags;
      switch (u.tag) {
        case 0:
        case 11:
        case 15:
          el(
            n,
            u,
            l
          ), yn(4, u);
          break;
        case 1:
          if (el(
            n,
            u,
            l
          ), a = u, n = a.stateNode, typeof n.componentDidMount == "function")
            try {
              n.componentDidMount();
            } catch (T) {
              Et(a, a.return, T);
            }
          if (a = u, n = a.updateQueue, n !== null) {
            var o = a.stateNode;
            try {
              var m = n.shared.hiddenCallbacks;
              if (m !== null)
                for (n.shared.hiddenCallbacks = null, n = 0; n < m.length; n++)
                  Er(m[n], o);
            } catch (T) {
              Et(a, a.return, T);
            }
          }
          l && c & 64 && Co(u), vn(u, u.return);
          break;
        case 27:
          Lo(u);
        case 26:
        case 5:
          el(
            n,
            u,
            l
          ), l && a === null && c & 4 && Ho(u), vn(u, u.return);
          break;
        case 12:
          el(
            n,
            u,
            l
          );
          break;
        case 31:
          el(
            n,
            u,
            l
          ), l && c & 4 && Qo(n, u);
          break;
        case 13:
          el(
            n,
            u,
            l
          ), l && c & 4 && Zo(n, u);
          break;
        case 22:
          u.memoizedState === null && el(
            n,
            u,
            l
          ), vn(u, u.return);
          break;
        case 30:
          break;
        default:
          el(
            n,
            u,
            l
          );
      }
      e = e.sibling;
    }
  }
  function Ic(t, e) {
    var l = null;
    t !== null && t.memoizedState !== null && t.memoizedState.cachePool !== null && (l = t.memoizedState.cachePool.pool), t = null, e.memoizedState !== null && e.memoizedState.cachePool !== null && (t = e.memoizedState.cachePool.pool), t !== l && (t != null && t.refCount++, l != null && en(l));
  }
  function Pc(t, e) {
    t = null, e.alternate !== null && (t = e.alternate.memoizedState.cache), e = e.memoizedState.cache, e !== t && (e.refCount++, t != null && en(t));
  }
  function Ce(t, e, l, a) {
    if (e.subtreeFlags & 10256)
      for (e = e.child; e !== null; )
        Jo(
          t,
          e,
          l,
          a
        ), e = e.sibling;
  }
  function Jo(t, e, l, a) {
    var n = e.flags;
    switch (e.tag) {
      case 0:
      case 11:
      case 15:
        Ce(
          t,
          e,
          l,
          a
        ), n & 2048 && yn(9, e);
        break;
      case 1:
        Ce(
          t,
          e,
          l,
          a
        );
        break;
      case 3:
        Ce(
          t,
          e,
          l,
          a
        ), n & 2048 && (t = null, e.alternate !== null && (t = e.alternate.memoizedState.cache), e = e.memoizedState.cache, e !== t && (e.refCount++, t != null && en(t)));
        break;
      case 12:
        if (n & 2048) {
          Ce(
            t,
            e,
            l,
            a
          ), t = e.stateNode;
          try {
            var u = e.memoizedProps, c = u.id, o = u.onPostCommit;
            typeof o == "function" && o(
              c,
              e.alternate === null ? "mount" : "update",
              t.passiveEffectDuration,
              -0
            );
          } catch (m) {
            Et(e, e.return, m);
          }
        } else
          Ce(
            t,
            e,
            l,
            a
          );
        break;
      case 31:
        Ce(
          t,
          e,
          l,
          a
        );
        break;
      case 13:
        Ce(
          t,
          e,
          l,
          a
        );
        break;
      case 23:
        break;
      case 22:
        u = e.stateNode, c = e.alternate, e.memoizedState !== null ? u._visibility & 2 ? Ce(
          t,
          e,
          l,
          a
        ) : pn(t, e) : u._visibility & 2 ? Ce(
          t,
          e,
          l,
          a
        ) : (u._visibility |= 2, Ta(
          t,
          e,
          l,
          a,
          (e.subtreeFlags & 10256) !== 0 || !1
        )), n & 2048 && Ic(c, e);
        break;
      case 24:
        Ce(
          t,
          e,
          l,
          a
        ), n & 2048 && Pc(e.alternate, e);
        break;
      default:
        Ce(
          t,
          e,
          l,
          a
        );
    }
  }
  function Ta(t, e, l, a, n) {
    for (n = n && ((e.subtreeFlags & 10256) !== 0 || !1), e = e.child; e !== null; ) {
      var u = t, c = e, o = l, m = a, T = c.flags;
      switch (c.tag) {
        case 0:
        case 11:
        case 15:
          Ta(
            u,
            c,
            o,
            m,
            n
          ), yn(8, c);
          break;
        case 23:
          break;
        case 22:
          var N = c.stateNode;
          c.memoizedState !== null ? N._visibility & 2 ? Ta(
            u,
            c,
            o,
            m,
            n
          ) : pn(
            u,
            c
          ) : (N._visibility |= 2, Ta(
            u,
            c,
            o,
            m,
            n
          )), n && T & 2048 && Ic(
            c.alternate,
            c
          );
          break;
        case 24:
          Ta(
            u,
            c,
            o,
            m,
            n
          ), n && T & 2048 && Pc(c.alternate, c);
          break;
        default:
          Ta(
            u,
            c,
            o,
            m,
            n
          );
      }
      e = e.sibling;
    }
  }
  function pn(t, e) {
    if (e.subtreeFlags & 10256)
      for (e = e.child; e !== null; ) {
        var l = t, a = e, n = a.flags;
        switch (a.tag) {
          case 22:
            pn(l, a), n & 2048 && Ic(
              a.alternate,
              a
            );
            break;
          case 24:
            pn(l, a), n & 2048 && Pc(a.alternate, a);
            break;
          default:
            pn(l, a);
        }
        e = e.sibling;
      }
  }
  var gn = 8192;
  function _a(t, e, l) {
    if (t.subtreeFlags & gn)
      for (t = t.child; t !== null; )
        Ko(
          t,
          e,
          l
        ), t = t.sibling;
  }
  function Ko(t, e, l) {
    switch (t.tag) {
      case 26:
        _a(
          t,
          e,
          l
        ), t.flags & gn && t.memoizedState !== null && iv(
          l,
          De,
          t.memoizedState,
          t.memoizedProps
        );
        break;
      case 5:
        _a(
          t,
          e,
          l
        );
        break;
      case 3:
      case 4:
        var a = De;
        De = Zu(t.stateNode.containerInfo), _a(
          t,
          e,
          l
        ), De = a;
        break;
      case 22:
        t.memoizedState === null && (a = t.alternate, a !== null && a.memoizedState !== null ? (a = gn, gn = 16777216, _a(
          t,
          e,
          l
        ), gn = a) : _a(
          t,
          e,
          l
        ));
        break;
      default:
        _a(
          t,
          e,
          l
        );
    }
  }
  function ko(t) {
    var e = t.alternate;
    if (e !== null && (t = e.child, t !== null)) {
      e.child = null;
      do
        e = t.sibling, t.sibling = null, t = e;
      while (t !== null);
    }
  }
  function Sn(t) {
    var e = t.deletions;
    if ((t.flags & 16) !== 0) {
      if (e !== null)
        for (var l = 0; l < e.length; l++) {
          var a = e[l];
          Vt = a, $o(
            a,
            t
          );
        }
      ko(t);
    }
    if (t.subtreeFlags & 10256)
      for (t = t.child; t !== null; )
        Fo(t), t = t.sibling;
  }
  function Fo(t) {
    switch (t.tag) {
      case 0:
      case 11:
      case 15:
        Sn(t), t.flags & 2048 && gl(9, t, t.return);
        break;
      case 3:
        Sn(t);
        break;
      case 12:
        Sn(t);
        break;
      case 22:
        var e = t.stateNode;
        t.memoizedState !== null && e._visibility & 2 && (t.return === null || t.return.tag !== 13) ? (e._visibility &= -3, Ou(t)) : Sn(t);
        break;
      default:
        Sn(t);
    }
  }
  function Ou(t) {
    var e = t.deletions;
    if ((t.flags & 16) !== 0) {
      if (e !== null)
        for (var l = 0; l < e.length; l++) {
          var a = e[l];
          Vt = a, $o(
            a,
            t
          );
        }
      ko(t);
    }
    for (t = t.child; t !== null; ) {
      switch (e = t, e.tag) {
        case 0:
        case 11:
        case 15:
          gl(8, e, e.return), Ou(e);
          break;
        case 22:
          l = e.stateNode, l._visibility & 2 && (l._visibility &= -3, Ou(e));
          break;
        default:
          Ou(e);
      }
      t = t.sibling;
    }
  }
  function $o(t, e) {
    for (; Vt !== null; ) {
      var l = Vt;
      switch (l.tag) {
        case 0:
        case 11:
        case 15:
          gl(8, l, e);
          break;
        case 23:
        case 22:
          if (l.memoizedState !== null && l.memoizedState.cachePool !== null) {
            var a = l.memoizedState.cachePool.pool;
            a != null && a.refCount++;
          }
          break;
        case 24:
          en(l.memoizedState.cache);
      }
      if (a = l.child, a !== null) a.return = l, Vt = a;
      else
        t: for (l = t; Vt !== null; ) {
          a = Vt;
          var n = a.sibling, u = a.return;
          if (Go(a), a === l) {
            Vt = null;
            break t;
          }
          if (n !== null) {
            n.return = u, Vt = n;
            break t;
          }
          Vt = u;
        }
    }
  }
  var Ey = {
    getCacheForType: function(t) {
      var e = kt(qt), l = e.data.get(t);
      return l === void 0 && (l = t(), e.data.set(t, l)), l;
    },
    cacheSignal: function() {
      return kt(qt).controller.signal;
    }
  }, jy = typeof WeakMap == "function" ? WeakMap : Map, gt = 0, At = null, ct = null, rt = 0, bt = 0, ve = null, Sl = !1, Aa = !1, tf = !1, ll = 0, Ct = 0, bl = 0, Fl = 0, ef = 0, pe = 0, za = 0, bn = null, ue = null, lf = !1, Mu = 0, Wo = 0, Du = 1 / 0, Cu = null, El = null, Zt = 0, jl = null, xa = null, al = 0, af = 0, nf = null, Io = null, En = 0, uf = null;
  function ge() {
    return (gt & 2) !== 0 && rt !== 0 ? rt & -rt : H.T !== null ? df() : hs();
  }
  function Po() {
    if (pe === 0)
      if ((rt & 536870912) === 0 || dt) {
        var t = Xn;
        Xn <<= 1, (Xn & 3932160) === 0 && (Xn = 262144), pe = t;
      } else pe = 536870912;
    return t = me.current, t !== null && (t.flags |= 32), pe;
  }
  function ie(t, e, l) {
    (t === At && (bt === 2 || bt === 9) || t.cancelPendingCommit !== null) && (Ra(t, 0), Tl(
      t,
      rt,
      pe,
      !1
    )), Xa(t, l), ((gt & 2) === 0 || t !== At) && (t === At && ((gt & 2) === 0 && (Fl |= l), Ct === 4 && Tl(
      t,
      rt,
      pe,
      !1
    )), qe(t));
  }
  function td(t, e, l) {
    if ((gt & 6) !== 0) throw Error(r(327));
    var a = !l && (e & 127) === 0 && (e & t.expiredLanes) === 0 || Ga(t, e), n = a ? Ay(t, e) : ff(t, e, !0), u = a;
    do {
      if (n === 0) {
        Aa && !a && Tl(t, e, 0, !1);
        break;
      } else {
        if (l = t.current.alternate, u && !Ty(l)) {
          n = ff(t, e, !1), u = !1;
          continue;
        }
        if (n === 2) {
          if (u = e, t.errorRecoveryDisabledLanes & u)
            var c = 0;
          else
            c = t.pendingLanes & -536870913, c = c !== 0 ? c : c & 536870912 ? 536870912 : 0;
          if (c !== 0) {
            e = c;
            t: {
              var o = t;
              n = bn;
              var m = o.current.memoizedState.isDehydrated;
              if (m && (Ra(o, c).flags |= 256), c = ff(
                o,
                c,
                !1
              ), c !== 2) {
                if (tf && !m) {
                  o.errorRecoveryDisabledLanes |= u, Fl |= u, n = 4;
                  break t;
                }
                u = ue, ue = n, u !== null && (ue === null ? ue = u : ue.push.apply(
                  ue,
                  u
                ));
              }
              n = c;
            }
            if (u = !1, n !== 2) continue;
          }
        }
        if (n === 1) {
          Ra(t, 0), Tl(t, e, 0, !0);
          break;
        }
        t: {
          switch (a = t, u = n, u) {
            case 0:
            case 1:
              throw Error(r(345));
            case 4:
              if ((e & 4194048) !== e) break;
            case 6:
              Tl(
                a,
                e,
                pe,
                !Sl
              );
              break t;
            case 2:
              ue = null;
              break;
            case 3:
            case 5:
              break;
            default:
              throw Error(r(329));
          }
          if ((e & 62914560) === e && (n = Mu + 300 - se(), 10 < n)) {
            if (Tl(
              a,
              e,
              pe,
              !Sl
            ), Zn(a, 0, !0) !== 0) break t;
            al = e, a.timeoutHandle = Md(
              ed.bind(
                null,
                a,
                l,
                ue,
                Cu,
                lf,
                e,
                pe,
                Fl,
                za,
                Sl,
                u,
                "Throttled",
                -0,
                0
              ),
              n
            );
            break t;
          }
          ed(
            a,
            l,
            ue,
            Cu,
            lf,
            e,
            pe,
            Fl,
            za,
            Sl,
            u,
            null,
            -0,
            0
          );
        }
      }
      break;
    } while (!0);
    qe(t);
  }
  function ed(t, e, l, a, n, u, c, o, m, T, N, D, _, z) {
    if (t.timeoutHandle = -1, D = e.subtreeFlags, D & 8192 || (D & 16785408) === 16785408) {
      D = {
        stylesheets: null,
        count: 0,
        imgCount: 0,
        imgBytes: 0,
        suspenseyImages: [],
        waitingForImages: !0,
        waitingForViewTransition: !1,
        unsuspend: Qe
      }, Ko(
        e,
        u,
        D
      );
      var Z = (u & 62914560) === u ? Mu - se() : (u & 4194048) === u ? Wo - se() : 0;
      if (Z = cv(
        D,
        Z
      ), Z !== null) {
        al = u, t.cancelPendingCommit = Z(
          sd.bind(
            null,
            t,
            e,
            u,
            l,
            a,
            n,
            c,
            o,
            m,
            N,
            D,
            null,
            _,
            z
          )
        ), Tl(t, u, c, !T);
        return;
      }
    }
    sd(
      t,
      e,
      u,
      l,
      a,
      n,
      c,
      o,
      m
    );
  }
  function Ty(t) {
    for (var e = t; ; ) {
      var l = e.tag;
      if ((l === 0 || l === 11 || l === 15) && e.flags & 16384 && (l = e.updateQueue, l !== null && (l = l.stores, l !== null)))
        for (var a = 0; a < l.length; a++) {
          var n = l[a], u = n.getSnapshot;
          n = n.value;
          try {
            if (!de(u(), n)) return !1;
          } catch (c) {
            return !1;
          }
        }
      if (l = e.child, e.subtreeFlags & 16384 && l !== null)
        l.return = e, e = l;
      else {
        if (e === t) break;
        for (; e.sibling === null; ) {
          if (e.return === null || e.return === t) return !0;
          e = e.return;
        }
        e.sibling.return = e.return, e = e.sibling;
      }
    }
    return !0;
  }
  function Tl(t, e, l, a) {
    e &= ~ef, e &= ~Fl, t.suspendedLanes |= e, t.pingedLanes &= ~e, a && (t.warmLanes |= e), a = t.expirationTimes;
    for (var n = e; 0 < n; ) {
      var u = 31 - oe(n), c = 1 << u;
      a[u] = -1, n &= ~c;
    }
    l !== 0 && rs(t, l, e);
  }
  function Uu() {
    return (gt & 6) === 0 ? (jn(0), !1) : !0;
  }
  function cf() {
    if (ct !== null) {
      if (bt === 0)
        var t = ct.return;
      else
        t = ct, Je = Gl = null, jc(t), ga = null, an = 0, t = ct;
      for (; t !== null; )
        Do(t.alternate, t), t = t.return;
      ct = null;
    }
  }
  function Ra(t, e) {
    var l = t.timeoutHandle;
    l !== -1 && (t.timeoutHandle = -1, Zy(l)), l = t.cancelPendingCommit, l !== null && (t.cancelPendingCommit = null, l()), al = 0, cf(), At = t, ct = l = we(t.current, null), rt = e, bt = 0, ve = null, Sl = !1, Aa = Ga(t, e), tf = !1, za = pe = ef = Fl = bl = Ct = 0, ue = bn = null, lf = !1, (e & 8) !== 0 && (e |= e & 32);
    var a = t.entangledLanes;
    if (a !== 0)
      for (t = t.entanglements, a &= e; 0 < a; ) {
        var n = 31 - oe(a), u = 1 << n;
        e |= t[n], a &= ~u;
      }
    return ll = e, eu(), l;
  }
  function ld(t, e) {
    et = null, H.H = dn, e === pa || e === su ? (e = pr(), bt = 3) : e === rc ? (e = pr(), bt = 4) : bt = e === qc ? 8 : e !== null && typeof e == "object" && typeof e.then == "function" ? 6 : 1, ve = e, ct === null && (Ct = 1, Tu(
      t,
      Te(e, t.current)
    ));
  }
  function ad() {
    var t = me.current;
    return t === null ? !0 : (rt & 4194048) === rt ? xe === null : (rt & 62914560) === rt || (rt & 536870912) !== 0 ? t === xe : !1;
  }
  function nd() {
    var t = H.H;
    return H.H = dn, t === null ? dn : t;
  }
  function ud() {
    var t = H.A;
    return H.A = Ey, t;
  }
  function Hu() {
    Ct = 4, Sl || (rt & 4194048) !== rt && me.current !== null || (Aa = !0), (bl & 134217727) === 0 && (Fl & 134217727) === 0 || At === null || Tl(
      At,
      rt,
      pe,
      !1
    );
  }
  function ff(t, e, l) {
    var a = gt;
    gt |= 2;
    var n = nd(), u = ud();
    (At !== t || rt !== e) && (Cu = null, Ra(t, e)), e = !1;
    var c = Ct;
    t: do
      try {
        if (bt !== 0 && ct !== null) {
          var o = ct, m = ve;
          switch (bt) {
            case 8:
              cf(), c = 6;
              break t;
            case 3:
            case 2:
            case 9:
            case 6:
              me.current === null && (e = !0);
              var T = bt;
              if (bt = 0, ve = null, Na(t, o, m, T), l && Aa) {
                c = 0;
                break t;
              }
              break;
            default:
              T = bt, bt = 0, ve = null, Na(t, o, m, T);
          }
        }
        _y(), c = Ct;
        break;
      } catch (N) {
        ld(t, N);
      }
    while (!0);
    return e && t.shellSuspendCounter++, Je = Gl = null, gt = a, H.H = n, H.A = u, ct === null && (At = null, rt = 0, eu()), c;
  }
  function _y() {
    for (; ct !== null; ) id(ct);
  }
  function Ay(t, e) {
    var l = gt;
    gt |= 2;
    var a = nd(), n = ud();
    At !== t || rt !== e ? (Cu = null, Du = se() + 500, Ra(t, e)) : Aa = Ga(
      t,
      e
    );
    t: do
      try {
        if (bt !== 0 && ct !== null) {
          e = ct;
          var u = ve;
          e: switch (bt) {
            case 1:
              bt = 0, ve = null, Na(t, e, u, 1);
              break;
            case 2:
            case 9:
              if (yr(u)) {
                bt = 0, ve = null, cd(e);
                break;
              }
              e = function() {
                bt !== 2 && bt !== 9 || At !== t || (bt = 7), qe(t);
              }, u.then(e, e);
              break t;
            case 3:
              bt = 7;
              break t;
            case 4:
              bt = 5;
              break t;
            case 7:
              yr(u) ? (bt = 0, ve = null, cd(e)) : (bt = 0, ve = null, Na(t, e, u, 7));
              break;
            case 5:
              var c = null;
              switch (ct.tag) {
                case 26:
                  c = ct.memoizedState;
                case 5:
                case 27:
                  var o = ct;
                  if (c ? Jd(c) : o.stateNode.complete) {
                    bt = 0, ve = null;
                    var m = o.sibling;
                    if (m !== null) ct = m;
                    else {
                      var T = o.return;
                      T !== null ? (ct = T, Bu(T)) : ct = null;
                    }
                    break e;
                  }
              }
              bt = 0, ve = null, Na(t, e, u, 5);
              break;
            case 6:
              bt = 0, ve = null, Na(t, e, u, 6);
              break;
            case 8:
              cf(), Ct = 6;
              break t;
            default:
              throw Error(r(462));
          }
        }
        zy();
        break;
      } catch (N) {
        ld(t, N);
      }
    while (!0);
    return Je = Gl = null, H.H = a, H.A = n, gt = l, ct !== null ? 0 : (At = null, rt = 0, eu(), Ct);
  }
  function zy() {
    for (; ct !== null && !Fh(); )
      id(ct);
  }
  function id(t) {
    var e = Oo(t.alternate, t, ll);
    t.memoizedProps = t.pendingProps, e === null ? Bu(t) : ct = e;
  }
  function cd(t) {
    var e = t, l = e.alternate;
    switch (e.tag) {
      case 15:
      case 0:
        e = _o(
          l,
          e,
          e.pendingProps,
          e.type,
          void 0,
          rt
        );
        break;
      case 11:
        e = _o(
          l,
          e,
          e.pendingProps,
          e.type.render,
          e.ref,
          rt
        );
        break;
      case 5:
        jc(e);
      default:
        Do(l, e), e = ct = nr(e, ll), e = Oo(l, e, ll);
    }
    t.memoizedProps = t.pendingProps, e === null ? Bu(t) : ct = e;
  }
  function Na(t, e, l, a) {
    Je = Gl = null, jc(e), ga = null, an = 0;
    var n = e.return;
    try {
      if (my(
        t,
        n,
        e,
        l,
        rt
      )) {
        Ct = 1, Tu(
          t,
          Te(l, t.current)
        ), ct = null;
        return;
      }
    } catch (u) {
      if (n !== null) throw ct = n, u;
      Ct = 1, Tu(
        t,
        Te(l, t.current)
      ), ct = null;
      return;
    }
    e.flags & 32768 ? (dt || a === 1 ? t = !0 : Aa || (rt & 536870912) !== 0 ? t = !1 : (Sl = t = !0, (a === 2 || a === 9 || a === 3 || a === 6) && (a = me.current, a !== null && a.tag === 13 && (a.flags |= 16384))), fd(e, t)) : Bu(e);
  }
  function Bu(t) {
    var e = t;
    do {
      if ((e.flags & 32768) !== 0) {
        fd(
          e,
          Sl
        );
        return;
      }
      t = e.return;
      var l = py(
        e.alternate,
        e,
        ll
      );
      if (l !== null) {
        ct = l;
        return;
      }
      if (e = e.sibling, e !== null) {
        ct = e;
        return;
      }
      ct = e = t;
    } while (e !== null);
    Ct === 0 && (Ct = 5);
  }
  function fd(t, e) {
    do {
      var l = gy(t.alternate, t);
      if (l !== null) {
        l.flags &= 32767, ct = l;
        return;
      }
      if (l = t.return, l !== null && (l.flags |= 32768, l.subtreeFlags = 0, l.deletions = null), !e && (t = t.sibling, t !== null)) {
        ct = t;
        return;
      }
      ct = t = l;
    } while (t !== null);
    Ct = 6, ct = null;
  }
  function sd(t, e, l, a, n, u, c, o, m) {
    t.cancelPendingCommit = null;
    do
      Lu();
    while (Zt !== 0);
    if ((gt & 6) !== 0) throw Error(r(327));
    if (e !== null) {
      if (e === t.current) throw Error(r(177));
      if (u = e.lanes | e.childLanes, u |= Fi, um(
        t,
        l,
        u,
        c,
        o,
        m
      ), t === At && (ct = At = null, rt = 0), xa = e, jl = t, al = l, af = u, nf = n, Io = a, (e.subtreeFlags & 10256) !== 0 || (e.flags & 10256) !== 0 ? (t.callbackNode = null, t.callbackPriority = 0, Oy(Yn, function() {
        return md(), null;
      })) : (t.callbackNode = null, t.callbackPriority = 0), a = (e.flags & 13878) !== 0, (e.subtreeFlags & 13878) !== 0 || a) {
        a = H.T, H.T = null, n = G.p, G.p = 2, c = gt, gt |= 4;
        try {
          Sy(t, e, l);
        } finally {
          gt = c, G.p = n, H.T = a;
        }
      }
      Zt = 1, rd(), od(), dd();
    }
  }
  function rd() {
    if (Zt === 1) {
      Zt = 0;
      var t = jl, e = xa, l = (e.flags & 13878) !== 0;
      if ((e.subtreeFlags & 13878) !== 0 || l) {
        l = H.T, H.T = null;
        var a = G.p;
        G.p = 2;
        var n = gt;
        gt |= 4;
        try {
          wo(e, t);
          var u = bf, c = Fs(t.containerInfo), o = u.focusedElem, m = u.selectionRange;
          if (c !== o && o && o.ownerDocument && ks(
            o.ownerDocument.documentElement,
            o
          )) {
            if (m !== null && wi(o)) {
              var T = m.start, N = m.end;
              if (N === void 0 && (N = T), "selectionStart" in o)
                o.selectionStart = T, o.selectionEnd = Math.min(
                  N,
                  o.value.length
                );
              else {
                var D = o.ownerDocument || document, _ = D && D.defaultView || window;
                if (_.getSelection) {
                  var z = _.getSelection(), Z = o.textContent.length, W = Math.min(m.start, Z), _t = m.end === void 0 ? W : Math.min(m.end, Z);
                  !z.extend && W > _t && (c = _t, _t = W, W = c);
                  var b = Ks(
                    o,
                    W
                  ), p = Ks(
                    o,
                    _t
                  );
                  if (b && p && (z.rangeCount !== 1 || z.anchorNode !== b.node || z.anchorOffset !== b.offset || z.focusNode !== p.node || z.focusOffset !== p.offset)) {
                    var j = D.createRange();
                    j.setStart(b.node, b.offset), z.removeAllRanges(), W > _t ? (z.addRange(j), z.extend(p.node, p.offset)) : (j.setEnd(p.node, p.offset), z.addRange(j));
                  }
                }
              }
            }
            for (D = [], z = o; z = z.parentNode; )
              z.nodeType === 1 && D.push({
                element: z,
                left: z.scrollLeft,
                top: z.scrollTop
              });
            for (typeof o.focus == "function" && o.focus(), o = 0; o < D.length; o++) {
              var O = D[o];
              O.element.scrollLeft = O.left, O.element.scrollTop = O.top;
            }
          }
          Fu = !!Sf, bf = Sf = null;
        } finally {
          gt = n, G.p = a, H.T = l;
        }
      }
      t.current = e, Zt = 2;
    }
  }
  function od() {
    if (Zt === 2) {
      Zt = 0;
      var t = jl, e = xa, l = (e.flags & 8772) !== 0;
      if ((e.subtreeFlags & 8772) !== 0 || l) {
        l = H.T, H.T = null;
        var a = G.p;
        G.p = 2;
        var n = gt;
        gt |= 4;
        try {
          Yo(t, e.alternate, e);
        } finally {
          gt = n, G.p = a, H.T = l;
        }
      }
      Zt = 3;
    }
  }
  function dd() {
    if (Zt === 4 || Zt === 3) {
      Zt = 0, $h();
      var t = jl, e = xa, l = al, a = Io;
      (e.subtreeFlags & 10256) !== 0 || (e.flags & 10256) !== 0 ? Zt = 5 : (Zt = 0, xa = jl = null, hd(t, t.pendingLanes));
      var n = t.pendingLanes;
      if (n === 0 && (El = null), Ai(l), e = e.stateNode, re && typeof re.onCommitFiberRoot == "function")
        try {
          re.onCommitFiberRoot(
            Ya,
            e,
            void 0,
            (e.current.flags & 128) === 128
          );
        } catch (m) {
        }
      if (a !== null) {
        e = H.T, n = G.p, G.p = 2, H.T = null;
        try {
          for (var u = t.onRecoverableError, c = 0; c < a.length; c++) {
            var o = a[c];
            u(o.value, {
              componentStack: o.stack
            });
          }
        } finally {
          H.T = e, G.p = n;
        }
      }
      (al & 3) !== 0 && Lu(), qe(t), n = t.pendingLanes, (l & 261930) !== 0 && (n & 42) !== 0 ? t === uf ? En++ : (En = 0, uf = t) : En = 0, jn(0);
    }
  }
  function hd(t, e) {
    (t.pooledCacheLanes &= e) === 0 && (e = t.pooledCache, e != null && (t.pooledCache = null, en(e)));
  }
  function Lu() {
    return rd(), od(), dd(), md();
  }
  function md() {
    if (Zt !== 5) return !1;
    var t = jl, e = af;
    af = 0;
    var l = Ai(al), a = H.T, n = G.p;
    try {
      G.p = 32 > l ? 32 : l, H.T = null, l = nf, nf = null;
      var u = jl, c = al;
      if (Zt = 0, xa = jl = null, al = 0, (gt & 6) !== 0) throw Error(r(331));
      var o = gt;
      if (gt |= 4, Fo(u.current), Jo(
        u,
        u.current,
        c,
        l
      ), gt = o, jn(0, !1), re && typeof re.onPostCommitFiberRoot == "function")
        try {
          re.onPostCommitFiberRoot(Ya, u);
        } catch (m) {
        }
      return !0;
    } finally {
      G.p = n, H.T = a, hd(t, e);
    }
  }
  function yd(t, e, l) {
    e = Te(l, e), e = Lc(t.stateNode, e, 2), t = yl(t, e, 2), t !== null && (Xa(t, 2), qe(t));
  }
  function Et(t, e, l) {
    if (t.tag === 3)
      yd(t, t, l);
    else
      for (; e !== null; ) {
        if (e.tag === 3) {
          yd(
            e,
            t,
            l
          );
          break;
        } else if (e.tag === 1) {
          var a = e.stateNode;
          if (typeof e.type.getDerivedStateFromError == "function" || typeof a.componentDidCatch == "function" && (El === null || !El.has(a))) {
            t = Te(l, t), l = vo(2), a = yl(e, l, 2), a !== null && (po(
              l,
              a,
              e,
              t
            ), Xa(a, 2), qe(a));
            break;
          }
        }
        e = e.return;
      }
  }
  function sf(t, e, l) {
    var a = t.pingCache;
    if (a === null) {
      a = t.pingCache = new jy();
      var n = /* @__PURE__ */ new Set();
      a.set(e, n);
    } else
      n = a.get(e), n === void 0 && (n = /* @__PURE__ */ new Set(), a.set(e, n));
    n.has(l) || (tf = !0, n.add(l), t = xy.bind(null, t, e, l), e.then(t, t));
  }
  function xy(t, e, l) {
    var a = t.pingCache;
    a !== null && a.delete(e), t.pingedLanes |= t.suspendedLanes & l, t.warmLanes &= ~l, At === t && (rt & l) === l && (Ct === 4 || Ct === 3 && (rt & 62914560) === rt && 300 > se() - Mu ? (gt & 2) === 0 && Ra(t, 0) : ef |= l, za === rt && (za = 0)), qe(t);
  }
  function vd(t, e) {
    e === 0 && (e = ss()), t = Ll(t, e), t !== null && (Xa(t, e), qe(t));
  }
  function Ry(t) {
    var e = t.memoizedState, l = 0;
    e !== null && (l = e.retryLane), vd(t, l);
  }
  function Ny(t, e) {
    var l = 0;
    switch (t.tag) {
      case 31:
      case 13:
        var a = t.stateNode, n = t.memoizedState;
        n !== null && (l = n.retryLane);
        break;
      case 19:
        a = t.stateNode;
        break;
      case 22:
        a = t.stateNode._retryCache;
        break;
      default:
        throw Error(r(314));
    }
    a !== null && a.delete(e), vd(t, l);
  }
  function Oy(t, e) {
    return Ei(t, e);
  }
  var qu = null, Oa = null, rf = !1, Yu = !1, of = !1, _l = 0;
  function qe(t) {
    t !== Oa && t.next === null && (Oa === null ? qu = Oa = t : Oa = Oa.next = t), Yu = !0, rf || (rf = !0, Dy());
  }
  function jn(t, e) {
    if (!of && Yu) {
      of = !0;
      do
        for (var l = !1, a = qu; a !== null; ) {
          if (t !== 0) {
            var n = a.pendingLanes;
            if (n === 0) var u = 0;
            else {
              var c = a.suspendedLanes, o = a.pingedLanes;
              u = (1 << 31 - oe(42 | t) + 1) - 1, u &= n & ~(c & ~o), u = u & 201326741 ? u & 201326741 | 1 : u ? u | 2 : 0;
            }
            u !== 0 && (l = !0, bd(a, u));
          } else
            u = rt, u = Zn(
              a,
              a === At ? u : 0,
              a.cancelPendingCommit !== null || a.timeoutHandle !== -1
            ), (u & 3) === 0 || Ga(a, u) || (l = !0, bd(a, u));
          a = a.next;
        }
      while (l);
      of = !1;
    }
  }
  function My() {
    pd();
  }
  function pd() {
    Yu = rf = !1;
    var t = 0;
    _l !== 0 && Qy() && (t = _l);
    for (var e = se(), l = null, a = qu; a !== null; ) {
      var n = a.next, u = gd(a, e);
      u === 0 ? (a.next = null, l === null ? qu = n : l.next = n, n === null && (Oa = l)) : (l = a, (t !== 0 || (u & 3) !== 0) && (Yu = !0)), a = n;
    }
    Zt !== 0 && Zt !== 5 || jn(t), _l !== 0 && (_l = 0);
  }
  function gd(t, e) {
    for (var l = t.suspendedLanes, a = t.pingedLanes, n = t.expirationTimes, u = t.pendingLanes & -62914561; 0 < u; ) {
      var c = 31 - oe(u), o = 1 << c, m = n[c];
      m === -1 ? ((o & l) === 0 || (o & a) !== 0) && (n[c] = nm(o, e)) : m <= e && (t.expiredLanes |= o), u &= ~o;
    }
    if (e = At, l = rt, l = Zn(
      t,
      t === e ? l : 0,
      t.cancelPendingCommit !== null || t.timeoutHandle !== -1
    ), a = t.callbackNode, l === 0 || t === e && (bt === 2 || bt === 9) || t.cancelPendingCommit !== null)
      return a !== null && a !== null && ji(a), t.callbackNode = null, t.callbackPriority = 0;
    if ((l & 3) === 0 || Ga(t, l)) {
      if (e = l & -l, e === t.callbackPriority) return e;
      switch (a !== null && ji(a), Ai(l)) {
        case 2:
        case 8:
          l = cs;
          break;
        case 32:
          l = Yn;
          break;
        case 268435456:
          l = fs;
          break;
        default:
          l = Yn;
      }
      return a = Sd.bind(null, t), l = Ei(l, a), t.callbackPriority = e, t.callbackNode = l, e;
    }
    return a !== null && a !== null && ji(a), t.callbackPriority = 2, t.callbackNode = null, 2;
  }
  function Sd(t, e) {
    if (Zt !== 0 && Zt !== 5)
      return t.callbackNode = null, t.callbackPriority = 0, null;
    var l = t.callbackNode;
    if (Lu() && t.callbackNode !== l)
      return null;
    var a = rt;
    return a = Zn(
      t,
      t === At ? a : 0,
      t.cancelPendingCommit !== null || t.timeoutHandle !== -1
    ), a === 0 ? null : (td(t, a, e), gd(t, se()), t.callbackNode != null && t.callbackNode === l ? Sd.bind(null, t) : null);
  }
  function bd(t, e) {
    if (Lu()) return null;
    td(t, e, !0);
  }
  function Dy() {
    wy(function() {
      (gt & 6) !== 0 ? Ei(
        is,
        My
      ) : pd();
    });
  }
  function df() {
    if (_l === 0) {
      var t = ya;
      t === 0 && (t = Gn, Gn <<= 1, (Gn & 261888) === 0 && (Gn = 256)), _l = t;
    }
    return _l;
  }
  function Ed(t) {
    return t == null || typeof t == "symbol" || typeof t == "boolean" ? null : typeof t == "function" ? t : Kn("" + t);
  }
  function jd(t, e) {
    var l = e.ownerDocument.createElement("input");
    return l.name = e.name, l.value = e.value, t.id && l.setAttribute("form", t.id), e.parentNode.insertBefore(l, e), t = new FormData(t), l.parentNode.removeChild(l), t;
  }
  function Cy(t, e, l, a, n) {
    if (e === "submit" && l && l.stateNode === n) {
      var u = Ed(
        (n[te] || null).action
      ), c = a.submitter;
      c && (e = (e = c[te] || null) ? Ed(e.formAction) : c.getAttribute("formAction"), e !== null && (u = e, c = null));
      var o = new Wn(
        "action",
        "action",
        null,
        a,
        n
      );
      t.push({
        event: o,
        listeners: [
          {
            instance: null,
            listener: function() {
              if (a.defaultPrevented) {
                if (_l !== 0) {
                  var m = c ? jd(n, c) : new FormData(n);
                  Mc(
                    l,
                    {
                      pending: !0,
                      data: m,
                      method: n.method,
                      action: u
                    },
                    null,
                    m
                  );
                }
              } else
                typeof u == "function" && (o.preventDefault(), m = c ? jd(n, c) : new FormData(n), Mc(
                  l,
                  {
                    pending: !0,
                    data: m,
                    method: n.method,
                    action: u
                  },
                  u,
                  m
                ));
            },
            currentTarget: n
          }
        ]
      });
    }
  }
  for (var hf = 0; hf < ki.length; hf++) {
    var mf = ki[hf], Uy = mf.toLowerCase(), Hy = mf[0].toUpperCase() + mf.slice(1);
    Me(
      Uy,
      "on" + Hy
    );
  }
  Me(Is, "onAnimationEnd"), Me(Ps, "onAnimationIteration"), Me(tr, "onAnimationStart"), Me("dblclick", "onDoubleClick"), Me("focusin", "onFocus"), Me("focusout", "onBlur"), Me(Wm, "onTransitionRun"), Me(Im, "onTransitionStart"), Me(Pm, "onTransitionCancel"), Me(er, "onTransitionEnd"), ea("onMouseEnter", ["mouseout", "mouseover"]), ea("onMouseLeave", ["mouseout", "mouseover"]), ea("onPointerEnter", ["pointerout", "pointerover"]), ea("onPointerLeave", ["pointerout", "pointerover"]), Cl(
    "onChange",
    "change click focusin focusout input keydown keyup selectionchange".split(" ")
  ), Cl(
    "onSelect",
    "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(
      " "
    )
  ), Cl("onBeforeInput", [
    "compositionend",
    "keypress",
    "textInput",
    "paste"
  ]), Cl(
    "onCompositionEnd",
    "compositionend focusout keydown keypress keyup mousedown".split(" ")
  ), Cl(
    "onCompositionStart",
    "compositionstart focusout keydown keypress keyup mousedown".split(" ")
  ), Cl(
    "onCompositionUpdate",
    "compositionupdate focusout keydown keypress keyup mousedown".split(" ")
  );
  var Tn = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(
    " "
  ), By = new Set(
    "beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(Tn)
  );
  function Td(t, e) {
    e = (e & 4) !== 0;
    for (var l = 0; l < t.length; l++) {
      var a = t[l], n = a.event;
      a = a.listeners;
      t: {
        var u = void 0;
        if (e)
          for (var c = a.length - 1; 0 <= c; c--) {
            var o = a[c], m = o.instance, T = o.currentTarget;
            if (o = o.listener, m !== u && n.isPropagationStopped())
              break t;
            u = o, n.currentTarget = T;
            try {
              u(n);
            } catch (N) {
              tu(N);
            }
            n.currentTarget = null, u = m;
          }
        else
          for (c = 0; c < a.length; c++) {
            if (o = a[c], m = o.instance, T = o.currentTarget, o = o.listener, m !== u && n.isPropagationStopped())
              break t;
            u = o, n.currentTarget = T;
            try {
              u(n);
            } catch (N) {
              tu(N);
            }
            n.currentTarget = null, u = m;
          }
      }
    }
  }
  function ft(t, e) {
    var l = e[zi];
    l === void 0 && (l = e[zi] = /* @__PURE__ */ new Set());
    var a = t + "__bubble";
    l.has(a) || (_d(e, t, 2, !1), l.add(a));
  }
  function yf(t, e, l) {
    var a = 0;
    e && (a |= 4), _d(
      l,
      t,
      a,
      e
    );
  }
  var Gu = "_reactListening" + Math.random().toString(36).slice(2);
  function vf(t) {
    if (!t[Gu]) {
      t[Gu] = !0, vs.forEach(function(l) {
        l !== "selectionchange" && (By.has(l) || yf(l, !1, t), yf(l, !0, t));
      });
      var e = t.nodeType === 9 ? t : t.ownerDocument;
      e === null || e[Gu] || (e[Gu] = !0, yf("selectionchange", !1, e));
    }
  }
  function _d(t, e, l, a) {
    switch (Pd(e)) {
      case 2:
        var n = rv;
        break;
      case 8:
        n = ov;
        break;
      default:
        n = Mf;
    }
    l = n.bind(
      null,
      e,
      l,
      t
    ), n = void 0, !Hi || e !== "touchstart" && e !== "touchmove" && e !== "wheel" || (n = !0), a ? n !== void 0 ? t.addEventListener(e, l, {
      capture: !0,
      passive: n
    }) : t.addEventListener(e, l, !0) : n !== void 0 ? t.addEventListener(e, l, {
      passive: n
    }) : t.addEventListener(e, l, !1);
  }
  function pf(t, e, l, a, n) {
    var u = a;
    if ((e & 1) === 0 && (e & 2) === 0 && a !== null)
      t: for (; ; ) {
        if (a === null) return;
        var c = a.tag;
        if (c === 3 || c === 4) {
          var o = a.stateNode.containerInfo;
          if (o === n) break;
          if (c === 4)
            for (c = a.return; c !== null; ) {
              var m = c.tag;
              if ((m === 3 || m === 4) && c.stateNode.containerInfo === n)
                return;
              c = c.return;
            }
          for (; o !== null; ) {
            if (c = Il(o), c === null) return;
            if (m = c.tag, m === 5 || m === 6 || m === 26 || m === 27) {
              a = u = c;
              continue t;
            }
            o = o.parentNode;
          }
        }
        a = a.return;
      }
    Rs(function() {
      var T = u, N = Ci(l), D = [];
      t: {
        var _ = lr.get(t);
        if (_ !== void 0) {
          var z = Wn, Z = t;
          switch (t) {
            case "keypress":
              if (Fn(l) === 0) break t;
            case "keydown":
            case "keyup":
              z = Nm;
              break;
            case "focusin":
              Z = "focus", z = Yi;
              break;
            case "focusout":
              Z = "blur", z = Yi;
              break;
            case "beforeblur":
            case "afterblur":
              z = Yi;
              break;
            case "click":
              if (l.button === 2) break t;
            case "auxclick":
            case "dblclick":
            case "mousedown":
            case "mousemove":
            case "mouseup":
            case "mouseout":
            case "mouseover":
            case "contextmenu":
              z = Ms;
              break;
            case "drag":
            case "dragend":
            case "dragenter":
            case "dragexit":
            case "dragleave":
            case "dragover":
            case "dragstart":
            case "drop":
              z = pm;
              break;
            case "touchcancel":
            case "touchend":
            case "touchmove":
            case "touchstart":
              z = Dm;
              break;
            case Is:
            case Ps:
            case tr:
              z = bm;
              break;
            case er:
              z = Um;
              break;
            case "scroll":
            case "scrollend":
              z = ym;
              break;
            case "wheel":
              z = Bm;
              break;
            case "copy":
            case "cut":
            case "paste":
              z = jm;
              break;
            case "gotpointercapture":
            case "lostpointercapture":
            case "pointercancel":
            case "pointerdown":
            case "pointermove":
            case "pointerout":
            case "pointerover":
            case "pointerup":
              z = Cs;
              break;
            case "toggle":
            case "beforetoggle":
              z = qm;
          }
          var W = (e & 4) !== 0, _t = !W && (t === "scroll" || t === "scrollend"), b = W ? _ !== null ? _ + "Capture" : null : _;
          W = [];
          for (var p = T, j; p !== null; ) {
            var O = p;
            if (j = O.stateNode, O = O.tag, O !== 5 && O !== 26 && O !== 27 || j === null || b === null || (O = wa(p, b), O != null && W.push(
              _n(p, O, j)
            )), _t) break;
            p = p.return;
          }
          0 < W.length && (_ = new z(
            _,
            Z,
            null,
            l,
            N
          ), D.push({ event: _, listeners: W }));
        }
      }
      if ((e & 7) === 0) {
        t: {
          if (_ = t === "mouseover" || t === "pointerover", z = t === "mouseout" || t === "pointerout", _ && l !== Di && (Z = l.relatedTarget || l.fromElement) && (Il(Z) || Z[Wl]))
            break t;
          if ((z || _) && (_ = N.window === N ? N : (_ = N.ownerDocument) ? _.defaultView || _.parentWindow : window, z ? (Z = l.relatedTarget || l.toElement, z = T, Z = Z ? Il(Z) : null, Z !== null && (_t = E(Z), W = Z.tag, Z !== _t || W !== 5 && W !== 27 && W !== 6) && (Z = null)) : (z = null, Z = T), z !== Z)) {
            if (W = Ms, O = "onMouseLeave", b = "onMouseEnter", p = "mouse", (t === "pointerout" || t === "pointerover") && (W = Cs, O = "onPointerLeave", b = "onPointerEnter", p = "pointer"), _t = z == null ? _ : Za(z), j = Z == null ? _ : Za(Z), _ = new W(
              O,
              p + "leave",
              z,
              l,
              N
            ), _.target = _t, _.relatedTarget = j, O = null, Il(N) === T && (W = new W(
              b,
              p + "enter",
              Z,
              l,
              N
            ), W.target = j, W.relatedTarget = _t, O = W), _t = O, z && Z)
              e: {
                for (W = Ly, b = z, p = Z, j = 0, O = b; O; O = W(O))
                  j++;
                O = 0;
                for (var F = p; F; F = W(F))
                  O++;
                for (; 0 < j - O; )
                  b = W(b), j--;
                for (; 0 < O - j; )
                  p = W(p), O--;
                for (; j--; ) {
                  if (b === p || p !== null && b === p.alternate) {
                    W = b;
                    break e;
                  }
                  b = W(b), p = W(p);
                }
                W = null;
              }
            else W = null;
            z !== null && Ad(
              D,
              _,
              z,
              W,
              !1
            ), Z !== null && _t !== null && Ad(
              D,
              _t,
              Z,
              W,
              !0
            );
          }
        }
        t: {
          if (_ = T ? Za(T) : window, z = _.nodeName && _.nodeName.toLowerCase(), z === "select" || z === "input" && _.type === "file")
            var yt = Xs;
          else if (Ys(_))
            if (Qs)
              yt = km;
            else {
              yt = Jm;
              var V = Vm;
            }
          else
            z = _.nodeName, !z || z.toLowerCase() !== "input" || _.type !== "checkbox" && _.type !== "radio" ? T && Mi(T.elementType) && (yt = Xs) : yt = Km;
          if (yt && (yt = yt(t, T))) {
            Gs(
              D,
              yt,
              l,
              N
            );
            break t;
          }
          V && V(t, _, T), t === "focusout" && T && _.type === "number" && T.memoizedProps.value != null && Oi(_, "number", _.value);
        }
        switch (V = T ? Za(T) : window, t) {
          case "focusin":
            (Ys(V) || V.contentEditable === "true") && (ca = V, Vi = T, Ia = null);
            break;
          case "focusout":
            Ia = Vi = ca = null;
            break;
          case "mousedown":
            Ji = !0;
            break;
          case "contextmenu":
          case "mouseup":
          case "dragend":
            Ji = !1, $s(D, l, N);
            break;
          case "selectionchange":
            if ($m) break;
          case "keydown":
          case "keyup":
            $s(D, l, N);
        }
        var lt;
        if (Xi)
          t: {
            switch (t) {
              case "compositionstart":
                var ot = "onCompositionStart";
                break t;
              case "compositionend":
                ot = "onCompositionEnd";
                break t;
              case "compositionupdate":
                ot = "onCompositionUpdate";
                break t;
            }
            ot = void 0;
          }
        else
          ia ? Ls(t, l) && (ot = "onCompositionEnd") : t === "keydown" && l.keyCode === 229 && (ot = "onCompositionStart");
        ot && (Us && l.locale !== "ko" && (ia || ot !== "onCompositionStart" ? ot === "onCompositionEnd" && ia && (lt = Ns()) : (fl = N, Bi = "value" in fl ? fl.value : fl.textContent, ia = !0)), V = Xu(T, ot), 0 < V.length && (ot = new Ds(
          ot,
          t,
          null,
          l,
          N
        ), D.push({ event: ot, listeners: V }), lt ? ot.data = lt : (lt = qs(l), lt !== null && (ot.data = lt)))), (lt = Gm ? Xm(t, l) : Qm(t, l)) && (ot = Xu(T, "onBeforeInput"), 0 < ot.length && (V = new Ds(
          "onBeforeInput",
          "beforeinput",
          null,
          l,
          N
        ), D.push({
          event: V,
          listeners: ot
        }), V.data = lt)), Cy(
          D,
          t,
          T,
          l,
          N
        );
      }
      Td(D, e);
    });
  }
  function _n(t, e, l) {
    return {
      instance: t,
      listener: e,
      currentTarget: l
    };
  }
  function Xu(t, e) {
    for (var l = e + "Capture", a = []; t !== null; ) {
      var n = t, u = n.stateNode;
      if (n = n.tag, n !== 5 && n !== 26 && n !== 27 || u === null || (n = wa(t, l), n != null && a.unshift(
        _n(t, n, u)
      ), n = wa(t, e), n != null && a.push(
        _n(t, n, u)
      )), t.tag === 3) return a;
      t = t.return;
    }
    return [];
  }
  function Ly(t) {
    if (t === null) return null;
    do
      t = t.return;
    while (t && t.tag !== 5 && t.tag !== 27);
    return t || null;
  }
  function Ad(t, e, l, a, n) {
    for (var u = e._reactName, c = []; l !== null && l !== a; ) {
      var o = l, m = o.alternate, T = o.stateNode;
      if (o = o.tag, m !== null && m === a) break;
      o !== 5 && o !== 26 && o !== 27 || T === null || (m = T, n ? (T = wa(l, u), T != null && c.unshift(
        _n(l, T, m)
      )) : n || (T = wa(l, u), T != null && c.push(
        _n(l, T, m)
      ))), l = l.return;
    }
    c.length !== 0 && t.push({ event: e, listeners: c });
  }
  var qy = /\r\n?/g, Yy = /\u0000|\uFFFD/g;
  function zd(t) {
    return (typeof t == "string" ? t : "" + t).replace(qy, `
`).replace(Yy, "");
  }
  function xd(t, e) {
    return e = zd(e), zd(t) === e;
  }
  function Tt(t, e, l, a, n, u) {
    switch (l) {
      case "children":
        typeof a == "string" ? e === "body" || e === "textarea" && a === "" || aa(t, a) : (typeof a == "number" || typeof a == "bigint") && e !== "body" && aa(t, "" + a);
        break;
      case "className":
        Vn(t, "class", a);
        break;
      case "tabIndex":
        Vn(t, "tabindex", a);
        break;
      case "dir":
      case "role":
      case "viewBox":
      case "width":
      case "height":
        Vn(t, l, a);
        break;
      case "style":
        zs(t, a, u);
        break;
      case "data":
        if (e !== "object") {
          Vn(t, "data", a);
          break;
        }
      case "src":
      case "href":
        if (a === "" && (e !== "a" || l !== "href")) {
          t.removeAttribute(l);
          break;
        }
        if (a == null || typeof a == "function" || typeof a == "symbol" || typeof a == "boolean") {
          t.removeAttribute(l);
          break;
        }
        a = Kn("" + a), t.setAttribute(l, a);
        break;
      case "action":
      case "formAction":
        if (typeof a == "function") {
          t.setAttribute(
            l,
            "javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')"
          );
          break;
        } else
          typeof u == "function" && (l === "formAction" ? (e !== "input" && Tt(t, e, "name", n.name, n, null), Tt(
            t,
            e,
            "formEncType",
            n.formEncType,
            n,
            null
          ), Tt(
            t,
            e,
            "formMethod",
            n.formMethod,
            n,
            null
          ), Tt(
            t,
            e,
            "formTarget",
            n.formTarget,
            n,
            null
          )) : (Tt(t, e, "encType", n.encType, n, null), Tt(t, e, "method", n.method, n, null), Tt(t, e, "target", n.target, n, null)));
        if (a == null || typeof a == "symbol" || typeof a == "boolean") {
          t.removeAttribute(l);
          break;
        }
        a = Kn("" + a), t.setAttribute(l, a);
        break;
      case "onClick":
        a != null && (t.onclick = Qe);
        break;
      case "onScroll":
        a != null && ft("scroll", t);
        break;
      case "onScrollEnd":
        a != null && ft("scrollend", t);
        break;
      case "dangerouslySetInnerHTML":
        if (a != null) {
          if (typeof a != "object" || !("__html" in a))
            throw Error(r(61));
          if (l = a.__html, l != null) {
            if (n.children != null) throw Error(r(60));
            t.innerHTML = l;
          }
        }
        break;
      case "multiple":
        t.multiple = a && typeof a != "function" && typeof a != "symbol";
        break;
      case "muted":
        t.muted = a && typeof a != "function" && typeof a != "symbol";
        break;
      case "suppressContentEditableWarning":
      case "suppressHydrationWarning":
      case "defaultValue":
      case "defaultChecked":
      case "innerHTML":
      case "ref":
        break;
      case "autoFocus":
        break;
      case "xlinkHref":
        if (a == null || typeof a == "function" || typeof a == "boolean" || typeof a == "symbol") {
          t.removeAttribute("xlink:href");
          break;
        }
        l = Kn("" + a), t.setAttributeNS(
          "http://www.w3.org/1999/xlink",
          "xlink:href",
          l
        );
        break;
      case "contentEditable":
      case "spellCheck":
      case "draggable":
      case "value":
      case "autoReverse":
      case "externalResourcesRequired":
      case "focusable":
      case "preserveAlpha":
        a != null && typeof a != "function" && typeof a != "symbol" ? t.setAttribute(l, "" + a) : t.removeAttribute(l);
        break;
      case "inert":
      case "allowFullScreen":
      case "async":
      case "autoPlay":
      case "controls":
      case "default":
      case "defer":
      case "disabled":
      case "disablePictureInPicture":
      case "disableRemotePlayback":
      case "formNoValidate":
      case "hidden":
      case "loop":
      case "noModule":
      case "noValidate":
      case "open":
      case "playsInline":
      case "readOnly":
      case "required":
      case "reversed":
      case "scoped":
      case "seamless":
      case "itemScope":
        a && typeof a != "function" && typeof a != "symbol" ? t.setAttribute(l, "") : t.removeAttribute(l);
        break;
      case "capture":
      case "download":
        a === !0 ? t.setAttribute(l, "") : a !== !1 && a != null && typeof a != "function" && typeof a != "symbol" ? t.setAttribute(l, a) : t.removeAttribute(l);
        break;
      case "cols":
      case "rows":
      case "size":
      case "span":
        a != null && typeof a != "function" && typeof a != "symbol" && !isNaN(a) && 1 <= a ? t.setAttribute(l, a) : t.removeAttribute(l);
        break;
      case "rowSpan":
      case "start":
        a == null || typeof a == "function" || typeof a == "symbol" || isNaN(a) ? t.removeAttribute(l) : t.setAttribute(l, a);
        break;
      case "popover":
        ft("beforetoggle", t), ft("toggle", t), wn(t, "popover", a);
        break;
      case "xlinkActuate":
        Xe(
          t,
          "http://www.w3.org/1999/xlink",
          "xlink:actuate",
          a
        );
        break;
      case "xlinkArcrole":
        Xe(
          t,
          "http://www.w3.org/1999/xlink",
          "xlink:arcrole",
          a
        );
        break;
      case "xlinkRole":
        Xe(
          t,
          "http://www.w3.org/1999/xlink",
          "xlink:role",
          a
        );
        break;
      case "xlinkShow":
        Xe(
          t,
          "http://www.w3.org/1999/xlink",
          "xlink:show",
          a
        );
        break;
      case "xlinkTitle":
        Xe(
          t,
          "http://www.w3.org/1999/xlink",
          "xlink:title",
          a
        );
        break;
      case "xlinkType":
        Xe(
          t,
          "http://www.w3.org/1999/xlink",
          "xlink:type",
          a
        );
        break;
      case "xmlBase":
        Xe(
          t,
          "http://www.w3.org/XML/1998/namespace",
          "xml:base",
          a
        );
        break;
      case "xmlLang":
        Xe(
          t,
          "http://www.w3.org/XML/1998/namespace",
          "xml:lang",
          a
        );
        break;
      case "xmlSpace":
        Xe(
          t,
          "http://www.w3.org/XML/1998/namespace",
          "xml:space",
          a
        );
        break;
      case "is":
        wn(t, "is", a);
        break;
      case "innerText":
      case "textContent":
        break;
      default:
        (!(2 < l.length) || l[0] !== "o" && l[0] !== "O" || l[1] !== "n" && l[1] !== "N") && (l = hm.get(l) || l, wn(t, l, a));
    }
  }
  function gf(t, e, l, a, n, u) {
    switch (l) {
      case "style":
        zs(t, a, u);
        break;
      case "dangerouslySetInnerHTML":
        if (a != null) {
          if (typeof a != "object" || !("__html" in a))
            throw Error(r(61));
          if (l = a.__html, l != null) {
            if (n.children != null) throw Error(r(60));
            t.innerHTML = l;
          }
        }
        break;
      case "children":
        typeof a == "string" ? aa(t, a) : (typeof a == "number" || typeof a == "bigint") && aa(t, "" + a);
        break;
      case "onScroll":
        a != null && ft("scroll", t);
        break;
      case "onScrollEnd":
        a != null && ft("scrollend", t);
        break;
      case "onClick":
        a != null && (t.onclick = Qe);
        break;
      case "suppressContentEditableWarning":
      case "suppressHydrationWarning":
      case "innerHTML":
      case "ref":
        break;
      case "innerText":
      case "textContent":
        break;
      default:
        if (!ps.hasOwnProperty(l))
          t: {
            if (l[0] === "o" && l[1] === "n" && (n = l.endsWith("Capture"), e = l.slice(2, n ? l.length - 7 : void 0), u = t[te] || null, u = u != null ? u[l] : null, typeof u == "function" && t.removeEventListener(e, u, n), typeof a == "function")) {
              typeof u != "function" && u !== null && (l in t ? t[l] = null : t.hasAttribute(l) && t.removeAttribute(l)), t.addEventListener(e, a, n);
              break t;
            }
            l in t ? t[l] = a : a === !0 ? t.setAttribute(l, "") : wn(t, l, a);
          }
    }
  }
  function $t(t, e, l) {
    switch (e) {
      case "div":
      case "span":
      case "svg":
      case "path":
      case "a":
      case "g":
      case "p":
      case "li":
        break;
      case "img":
        ft("error", t), ft("load", t);
        var a = !1, n = !1, u;
        for (u in l)
          if (l.hasOwnProperty(u)) {
            var c = l[u];
            if (c != null)
              switch (u) {
                case "src":
                  a = !0;
                  break;
                case "srcSet":
                  n = !0;
                  break;
                case "children":
                case "dangerouslySetInnerHTML":
                  throw Error(r(137, e));
                default:
                  Tt(t, e, u, c, l, null);
              }
          }
        n && Tt(t, e, "srcSet", l.srcSet, l, null), a && Tt(t, e, "src", l.src, l, null);
        return;
      case "input":
        ft("invalid", t);
        var o = u = c = n = null, m = null, T = null;
        for (a in l)
          if (l.hasOwnProperty(a)) {
            var N = l[a];
            if (N != null)
              switch (a) {
                case "name":
                  n = N;
                  break;
                case "type":
                  c = N;
                  break;
                case "checked":
                  m = N;
                  break;
                case "defaultChecked":
                  T = N;
                  break;
                case "value":
                  u = N;
                  break;
                case "defaultValue":
                  o = N;
                  break;
                case "children":
                case "dangerouslySetInnerHTML":
                  if (N != null)
                    throw Error(r(137, e));
                  break;
                default:
                  Tt(t, e, a, N, l, null);
              }
          }
        js(
          t,
          u,
          o,
          m,
          T,
          c,
          n,
          !1
        );
        return;
      case "select":
        ft("invalid", t), a = c = u = null;
        for (n in l)
          if (l.hasOwnProperty(n) && (o = l[n], o != null))
            switch (n) {
              case "value":
                u = o;
                break;
              case "defaultValue":
                c = o;
                break;
              case "multiple":
                a = o;
              default:
                Tt(t, e, n, o, l, null);
            }
        e = u, l = c, t.multiple = !!a, e != null ? la(t, !!a, e, !1) : l != null && la(t, !!a, l, !0);
        return;
      case "textarea":
        ft("invalid", t), u = n = a = null;
        for (c in l)
          if (l.hasOwnProperty(c) && (o = l[c], o != null))
            switch (c) {
              case "value":
                a = o;
                break;
              case "defaultValue":
                n = o;
                break;
              case "children":
                u = o;
                break;
              case "dangerouslySetInnerHTML":
                if (o != null) throw Error(r(91));
                break;
              default:
                Tt(t, e, c, o, l, null);
            }
        _s(t, a, n, u);
        return;
      case "option":
        for (m in l)
          l.hasOwnProperty(m) && (a = l[m], a != null) && (m === "selected" ? t.selected = a && typeof a != "function" && typeof a != "symbol" : Tt(t, e, m, a, l, null));
        return;
      case "dialog":
        ft("beforetoggle", t), ft("toggle", t), ft("cancel", t), ft("close", t);
        break;
      case "iframe":
      case "object":
        ft("load", t);
        break;
      case "video":
      case "audio":
        for (a = 0; a < Tn.length; a++)
          ft(Tn[a], t);
        break;
      case "image":
        ft("error", t), ft("load", t);
        break;
      case "details":
        ft("toggle", t);
        break;
      case "embed":
      case "source":
      case "link":
        ft("error", t), ft("load", t);
      case "area":
      case "base":
      case "br":
      case "col":
      case "hr":
      case "keygen":
      case "meta":
      case "param":
      case "track":
      case "wbr":
      case "menuitem":
        for (T in l)
          if (l.hasOwnProperty(T) && (a = l[T], a != null))
            switch (T) {
              case "children":
              case "dangerouslySetInnerHTML":
                throw Error(r(137, e));
              default:
                Tt(t, e, T, a, l, null);
            }
        return;
      default:
        if (Mi(e)) {
          for (N in l)
            l.hasOwnProperty(N) && (a = l[N], a !== void 0 && gf(
              t,
              e,
              N,
              a,
              l,
              void 0
            ));
          return;
        }
    }
    for (o in l)
      l.hasOwnProperty(o) && (a = l[o], a != null && Tt(t, e, o, a, l, null));
  }
  function Gy(t, e, l, a) {
    switch (e) {
      case "div":
      case "span":
      case "svg":
      case "path":
      case "a":
      case "g":
      case "p":
      case "li":
        break;
      case "input":
        var n = null, u = null, c = null, o = null, m = null, T = null, N = null;
        for (z in l) {
          var D = l[z];
          if (l.hasOwnProperty(z) && D != null)
            switch (z) {
              case "checked":
                break;
              case "value":
                break;
              case "defaultValue":
                m = D;
              default:
                a.hasOwnProperty(z) || Tt(t, e, z, null, a, D);
            }
        }
        for (var _ in a) {
          var z = a[_];
          if (D = l[_], a.hasOwnProperty(_) && (z != null || D != null))
            switch (_) {
              case "type":
                u = z;
                break;
              case "name":
                n = z;
                break;
              case "checked":
                T = z;
                break;
              case "defaultChecked":
                N = z;
                break;
              case "value":
                c = z;
                break;
              case "defaultValue":
                o = z;
                break;
              case "children":
              case "dangerouslySetInnerHTML":
                if (z != null)
                  throw Error(r(137, e));
                break;
              default:
                z !== D && Tt(
                  t,
                  e,
                  _,
                  z,
                  a,
                  D
                );
            }
        }
        Ni(
          t,
          c,
          o,
          m,
          T,
          N,
          u,
          n
        );
        return;
      case "select":
        z = c = o = _ = null;
        for (u in l)
          if (m = l[u], l.hasOwnProperty(u) && m != null)
            switch (u) {
              case "value":
                break;
              case "multiple":
                z = m;
              default:
                a.hasOwnProperty(u) || Tt(
                  t,
                  e,
                  u,
                  null,
                  a,
                  m
                );
            }
        for (n in a)
          if (u = a[n], m = l[n], a.hasOwnProperty(n) && (u != null || m != null))
            switch (n) {
              case "value":
                _ = u;
                break;
              case "defaultValue":
                o = u;
                break;
              case "multiple":
                c = u;
              default:
                u !== m && Tt(
                  t,
                  e,
                  n,
                  u,
                  a,
                  m
                );
            }
        e = o, l = c, a = z, _ != null ? la(t, !!l, _, !1) : !!a != !!l && (e != null ? la(t, !!l, e, !0) : la(t, !!l, l ? [] : "", !1));
        return;
      case "textarea":
        z = _ = null;
        for (o in l)
          if (n = l[o], l.hasOwnProperty(o) && n != null && !a.hasOwnProperty(o))
            switch (o) {
              case "value":
                break;
              case "children":
                break;
              default:
                Tt(t, e, o, null, a, n);
            }
        for (c in a)
          if (n = a[c], u = l[c], a.hasOwnProperty(c) && (n != null || u != null))
            switch (c) {
              case "value":
                _ = n;
                break;
              case "defaultValue":
                z = n;
                break;
              case "children":
                break;
              case "dangerouslySetInnerHTML":
                if (n != null) throw Error(r(91));
                break;
              default:
                n !== u && Tt(t, e, c, n, a, u);
            }
        Ts(t, _, z);
        return;
      case "option":
        for (var Z in l)
          _ = l[Z], l.hasOwnProperty(Z) && _ != null && !a.hasOwnProperty(Z) && (Z === "selected" ? t.selected = !1 : Tt(
            t,
            e,
            Z,
            null,
            a,
            _
          ));
        for (m in a)
          _ = a[m], z = l[m], a.hasOwnProperty(m) && _ !== z && (_ != null || z != null) && (m === "selected" ? t.selected = _ && typeof _ != "function" && typeof _ != "symbol" : Tt(
            t,
            e,
            m,
            _,
            a,
            z
          ));
        return;
      case "img":
      case "link":
      case "area":
      case "base":
      case "br":
      case "col":
      case "embed":
      case "hr":
      case "keygen":
      case "meta":
      case "param":
      case "source":
      case "track":
      case "wbr":
      case "menuitem":
        for (var W in l)
          _ = l[W], l.hasOwnProperty(W) && _ != null && !a.hasOwnProperty(W) && Tt(t, e, W, null, a, _);
        for (T in a)
          if (_ = a[T], z = l[T], a.hasOwnProperty(T) && _ !== z && (_ != null || z != null))
            switch (T) {
              case "children":
              case "dangerouslySetInnerHTML":
                if (_ != null)
                  throw Error(r(137, e));
                break;
              default:
                Tt(
                  t,
                  e,
                  T,
                  _,
                  a,
                  z
                );
            }
        return;
      default:
        if (Mi(e)) {
          for (var _t in l)
            _ = l[_t], l.hasOwnProperty(_t) && _ !== void 0 && !a.hasOwnProperty(_t) && gf(
              t,
              e,
              _t,
              void 0,
              a,
              _
            );
          for (N in a)
            _ = a[N], z = l[N], !a.hasOwnProperty(N) || _ === z || _ === void 0 && z === void 0 || gf(
              t,
              e,
              N,
              _,
              a,
              z
            );
          return;
        }
    }
    for (var b in l)
      _ = l[b], l.hasOwnProperty(b) && _ != null && !a.hasOwnProperty(b) && Tt(t, e, b, null, a, _);
    for (D in a)
      _ = a[D], z = l[D], !a.hasOwnProperty(D) || _ === z || _ == null && z == null || Tt(t, e, D, _, a, z);
  }
  function Rd(t) {
    switch (t) {
      case "css":
      case "script":
      case "font":
      case "img":
      case "image":
      case "input":
      case "link":
        return !0;
      default:
        return !1;
    }
  }
  function Xy() {
    if (typeof performance.getEntriesByType == "function") {
      for (var t = 0, e = 0, l = performance.getEntriesByType("resource"), a = 0; a < l.length; a++) {
        var n = l[a], u = n.transferSize, c = n.initiatorType, o = n.duration;
        if (u && o && Rd(c)) {
          for (c = 0, o = n.responseEnd, a += 1; a < l.length; a++) {
            var m = l[a], T = m.startTime;
            if (T > o) break;
            var N = m.transferSize, D = m.initiatorType;
            N && Rd(D) && (m = m.responseEnd, c += N * (m < o ? 1 : (o - T) / (m - T)));
          }
          if (--a, e += 8 * (u + c) / (n.duration / 1e3), t++, 10 < t) break;
        }
      }
      if (0 < t) return e / t / 1e6;
    }
    return navigator.connection && (t = navigator.connection.downlink, typeof t == "number") ? t : 5;
  }
  var Sf = null, bf = null;
  function Qu(t) {
    return t.nodeType === 9 ? t : t.ownerDocument;
  }
  function Nd(t) {
    switch (t) {
      case "http://www.w3.org/2000/svg":
        return 1;
      case "http://www.w3.org/1998/Math/MathML":
        return 2;
      default:
        return 0;
    }
  }
  function Od(t, e) {
    if (t === 0)
      switch (e) {
        case "svg":
          return 1;
        case "math":
          return 2;
        default:
          return 0;
      }
    return t === 1 && e === "foreignObject" ? 0 : t;
  }
  function Ef(t, e) {
    return t === "textarea" || t === "noscript" || typeof e.children == "string" || typeof e.children == "number" || typeof e.children == "bigint" || typeof e.dangerouslySetInnerHTML == "object" && e.dangerouslySetInnerHTML !== null && e.dangerouslySetInnerHTML.__html != null;
  }
  var jf = null;
  function Qy() {
    var t = window.event;
    return t && t.type === "popstate" ? t === jf ? !1 : (jf = t, !0) : (jf = null, !1);
  }
  var Md = typeof setTimeout == "function" ? setTimeout : void 0, Zy = typeof clearTimeout == "function" ? clearTimeout : void 0, Dd = typeof Promise == "function" ? Promise : void 0, wy = typeof queueMicrotask == "function" ? queueMicrotask : typeof Dd != "undefined" ? function(t) {
    return Dd.resolve(null).then(t).catch(Vy);
  } : Md;
  function Vy(t) {
    setTimeout(function() {
      throw t;
    });
  }
  function Al(t) {
    return t === "head";
  }
  function Cd(t, e) {
    var l = e, a = 0;
    do {
      var n = l.nextSibling;
      if (t.removeChild(l), n && n.nodeType === 8)
        if (l = n.data, l === "/$" || l === "/&") {
          if (a === 0) {
            t.removeChild(n), Ua(e);
            return;
          }
          a--;
        } else if (l === "$" || l === "$?" || l === "$~" || l === "$!" || l === "&")
          a++;
        else if (l === "html")
          An(t.ownerDocument.documentElement);
        else if (l === "head") {
          l = t.ownerDocument.head, An(l);
          for (var u = l.firstChild; u; ) {
            var c = u.nextSibling, o = u.nodeName;
            u[Qa] || o === "SCRIPT" || o === "STYLE" || o === "LINK" && u.rel.toLowerCase() === "stylesheet" || l.removeChild(u), u = c;
          }
        } else
          l === "body" && An(t.ownerDocument.body);
      l = n;
    } while (l);
    Ua(e);
  }
  function Ud(t, e) {
    var l = t;
    t = 0;
    do {
      var a = l.nextSibling;
      if (l.nodeType === 1 ? e ? (l._stashedDisplay = l.style.display, l.style.display = "none") : (l.style.display = l._stashedDisplay || "", l.getAttribute("style") === "" && l.removeAttribute("style")) : l.nodeType === 3 && (e ? (l._stashedText = l.nodeValue, l.nodeValue = "") : l.nodeValue = l._stashedText || ""), a && a.nodeType === 8)
        if (l = a.data, l === "/$") {
          if (t === 0) break;
          t--;
        } else
          l !== "$" && l !== "$?" && l !== "$~" && l !== "$!" || t++;
      l = a;
    } while (l);
  }
  function Tf(t) {
    var e = t.firstChild;
    for (e && e.nodeType === 10 && (e = e.nextSibling); e; ) {
      var l = e;
      switch (e = e.nextSibling, l.nodeName) {
        case "HTML":
        case "HEAD":
        case "BODY":
          Tf(l), xi(l);
          continue;
        case "SCRIPT":
        case "STYLE":
          continue;
        case "LINK":
          if (l.rel.toLowerCase() === "stylesheet") continue;
      }
      t.removeChild(l);
    }
  }
  function Jy(t, e, l, a) {
    for (; t.nodeType === 1; ) {
      var n = l;
      if (t.nodeName.toLowerCase() !== e.toLowerCase()) {
        if (!a && (t.nodeName !== "INPUT" || t.type !== "hidden"))
          break;
      } else if (a) {
        if (!t[Qa])
          switch (e) {
            case "meta":
              if (!t.hasAttribute("itemprop")) break;
              return t;
            case "link":
              if (u = t.getAttribute("rel"), u === "stylesheet" && t.hasAttribute("data-precedence"))
                break;
              if (u !== n.rel || t.getAttribute("href") !== (n.href == null || n.href === "" ? null : n.href) || t.getAttribute("crossorigin") !== (n.crossOrigin == null ? null : n.crossOrigin) || t.getAttribute("title") !== (n.title == null ? null : n.title))
                break;
              return t;
            case "style":
              if (t.hasAttribute("data-precedence")) break;
              return t;
            case "script":
              if (u = t.getAttribute("src"), (u !== (n.src == null ? null : n.src) || t.getAttribute("type") !== (n.type == null ? null : n.type) || t.getAttribute("crossorigin") !== (n.crossOrigin == null ? null : n.crossOrigin)) && u && t.hasAttribute("async") && !t.hasAttribute("itemprop"))
                break;
              return t;
            default:
              return t;
          }
      } else if (e === "input" && t.type === "hidden") {
        var u = n.name == null ? null : "" + n.name;
        if (n.type === "hidden" && t.getAttribute("name") === u)
          return t;
      } else return t;
      if (t = Re(t.nextSibling), t === null) break;
    }
    return null;
  }
  function Ky(t, e, l) {
    if (e === "") return null;
    for (; t.nodeType !== 3; )
      if ((t.nodeType !== 1 || t.nodeName !== "INPUT" || t.type !== "hidden") && !l || (t = Re(t.nextSibling), t === null)) return null;
    return t;
  }
  function Hd(t, e) {
    for (; t.nodeType !== 8; )
      if ((t.nodeType !== 1 || t.nodeName !== "INPUT" || t.type !== "hidden") && !e || (t = Re(t.nextSibling), t === null)) return null;
    return t;
  }
  function _f(t) {
    return t.data === "$?" || t.data === "$~";
  }
  function Af(t) {
    return t.data === "$!" || t.data === "$?" && t.ownerDocument.readyState !== "loading";
  }
  function ky(t, e) {
    var l = t.ownerDocument;
    if (t.data === "$~") t._reactRetry = e;
    else if (t.data !== "$?" || l.readyState !== "loading")
      e();
    else {
      var a = function() {
        e(), l.removeEventListener("DOMContentLoaded", a);
      };
      l.addEventListener("DOMContentLoaded", a), t._reactRetry = a;
    }
  }
  function Re(t) {
    for (; t != null; t = t.nextSibling) {
      var e = t.nodeType;
      if (e === 1 || e === 3) break;
      if (e === 8) {
        if (e = t.data, e === "$" || e === "$!" || e === "$?" || e === "$~" || e === "&" || e === "F!" || e === "F")
          break;
        if (e === "/$" || e === "/&") return null;
      }
    }
    return t;
  }
  var zf = null;
  function Bd(t) {
    t = t.nextSibling;
    for (var e = 0; t; ) {
      if (t.nodeType === 8) {
        var l = t.data;
        if (l === "/$" || l === "/&") {
          if (e === 0)
            return Re(t.nextSibling);
          e--;
        } else
          l !== "$" && l !== "$!" && l !== "$?" && l !== "$~" && l !== "&" || e++;
      }
      t = t.nextSibling;
    }
    return null;
  }
  function Ld(t) {
    t = t.previousSibling;
    for (var e = 0; t; ) {
      if (t.nodeType === 8) {
        var l = t.data;
        if (l === "$" || l === "$!" || l === "$?" || l === "$~" || l === "&") {
          if (e === 0) return t;
          e--;
        } else l !== "/$" && l !== "/&" || e++;
      }
      t = t.previousSibling;
    }
    return null;
  }
  function qd(t, e, l) {
    switch (e = Qu(l), t) {
      case "html":
        if (t = e.documentElement, !t) throw Error(r(452));
        return t;
      case "head":
        if (t = e.head, !t) throw Error(r(453));
        return t;
      case "body":
        if (t = e.body, !t) throw Error(r(454));
        return t;
      default:
        throw Error(r(451));
    }
  }
  function An(t) {
    for (var e = t.attributes; e.length; )
      t.removeAttributeNode(e[0]);
    xi(t);
  }
  var Ne = /* @__PURE__ */ new Map(), Yd = /* @__PURE__ */ new Set();
  function Zu(t) {
    return typeof t.getRootNode == "function" ? t.getRootNode() : t.nodeType === 9 ? t : t.ownerDocument;
  }
  var nl = G.d;
  G.d = {
    f: Fy,
    r: $y,
    D: Wy,
    C: Iy,
    L: Py,
    m: tv,
    X: lv,
    S: ev,
    M: av
  };
  function Fy() {
    var t = nl.f(), e = Uu();
    return t || e;
  }
  function $y(t) {
    var e = Pl(t);
    e !== null && e.tag === 5 && e.type === "form" ? eo(e) : nl.r(t);
  }
  var Ma = typeof document == "undefined" ? null : document;
  function Gd(t, e, l) {
    var a = Ma;
    if (a && typeof e == "string" && e) {
      var n = Ee(e);
      n = 'link[rel="' + t + '"][href="' + n + '"]', typeof l == "string" && (n += '[crossorigin="' + l + '"]'), Yd.has(n) || (Yd.add(n), t = { rel: t, crossOrigin: l, href: e }, a.querySelector(n) === null && (e = a.createElement("link"), $t(e, "link", t), wt(e), a.head.appendChild(e)));
    }
  }
  function Wy(t) {
    nl.D(t), Gd("dns-prefetch", t, null);
  }
  function Iy(t, e) {
    nl.C(t, e), Gd("preconnect", t, e);
  }
  function Py(t, e, l) {
    nl.L(t, e, l);
    var a = Ma;
    if (a && t && e) {
      var n = 'link[rel="preload"][as="' + Ee(e) + '"]';
      e === "image" && l && l.imageSrcSet ? (n += '[imagesrcset="' + Ee(
        l.imageSrcSet
      ) + '"]', typeof l.imageSizes == "string" && (n += '[imagesizes="' + Ee(
        l.imageSizes
      ) + '"]')) : n += '[href="' + Ee(t) + '"]';
      var u = n;
      switch (e) {
        case "style":
          u = Da(t);
          break;
        case "script":
          u = Ca(t);
      }
      Ne.has(u) || (t = U(
        {
          rel: "preload",
          href: e === "image" && l && l.imageSrcSet ? void 0 : t,
          as: e
        },
        l
      ), Ne.set(u, t), a.querySelector(n) !== null || e === "style" && a.querySelector(zn(u)) || e === "script" && a.querySelector(xn(u)) || (e = a.createElement("link"), $t(e, "link", t), wt(e), a.head.appendChild(e)));
    }
  }
  function tv(t, e) {
    nl.m(t, e);
    var l = Ma;
    if (l && t) {
      var a = e && typeof e.as == "string" ? e.as : "script", n = 'link[rel="modulepreload"][as="' + Ee(a) + '"][href="' + Ee(t) + '"]', u = n;
      switch (a) {
        case "audioworklet":
        case "paintworklet":
        case "serviceworker":
        case "sharedworker":
        case "worker":
        case "script":
          u = Ca(t);
      }
      if (!Ne.has(u) && (t = U({ rel: "modulepreload", href: t }, e), Ne.set(u, t), l.querySelector(n) === null)) {
        switch (a) {
          case "audioworklet":
          case "paintworklet":
          case "serviceworker":
          case "sharedworker":
          case "worker":
          case "script":
            if (l.querySelector(xn(u)))
              return;
        }
        a = l.createElement("link"), $t(a, "link", t), wt(a), l.head.appendChild(a);
      }
    }
  }
  function ev(t, e, l) {
    nl.S(t, e, l);
    var a = Ma;
    if (a && t) {
      var n = ta(a).hoistableStyles, u = Da(t);
      e = e || "default";
      var c = n.get(u);
      if (!c) {
        var o = { loading: 0, preload: null };
        if (c = a.querySelector(
          zn(u)
        ))
          o.loading = 5;
        else {
          t = U(
            { rel: "stylesheet", href: t, "data-precedence": e },
            l
          ), (l = Ne.get(u)) && xf(t, l);
          var m = c = a.createElement("link");
          wt(m), $t(m, "link", t), m._p = new Promise(function(T, N) {
            m.onload = T, m.onerror = N;
          }), m.addEventListener("load", function() {
            o.loading |= 1;
          }), m.addEventListener("error", function() {
            o.loading |= 2;
          }), o.loading |= 4, wu(c, e, a);
        }
        c = {
          type: "stylesheet",
          instance: c,
          count: 1,
          state: o
        }, n.set(u, c);
      }
    }
  }
  function lv(t, e) {
    nl.X(t, e);
    var l = Ma;
    if (l && t) {
      var a = ta(l).hoistableScripts, n = Ca(t), u = a.get(n);
      u || (u = l.querySelector(xn(n)), u || (t = U({ src: t, async: !0 }, e), (e = Ne.get(n)) && Rf(t, e), u = l.createElement("script"), wt(u), $t(u, "link", t), l.head.appendChild(u)), u = {
        type: "script",
        instance: u,
        count: 1,
        state: null
      }, a.set(n, u));
    }
  }
  function av(t, e) {
    nl.M(t, e);
    var l = Ma;
    if (l && t) {
      var a = ta(l).hoistableScripts, n = Ca(t), u = a.get(n);
      u || (u = l.querySelector(xn(n)), u || (t = U({ src: t, async: !0, type: "module" }, e), (e = Ne.get(n)) && Rf(t, e), u = l.createElement("script"), wt(u), $t(u, "link", t), l.head.appendChild(u)), u = {
        type: "script",
        instance: u,
        count: 1,
        state: null
      }, a.set(n, u));
    }
  }
  function Xd(t, e, l, a) {
    var n = (n = it.current) ? Zu(n) : null;
    if (!n) throw Error(r(446));
    switch (t) {
      case "meta":
      case "title":
        return null;
      case "style":
        return typeof l.precedence == "string" && typeof l.href == "string" ? (e = Da(l.href), l = ta(
          n
        ).hoistableStyles, a = l.get(e), a || (a = {
          type: "style",
          instance: null,
          count: 0,
          state: null
        }, l.set(e, a)), a) : { type: "void", instance: null, count: 0, state: null };
      case "link":
        if (l.rel === "stylesheet" && typeof l.href == "string" && typeof l.precedence == "string") {
          t = Da(l.href);
          var u = ta(
            n
          ).hoistableStyles, c = u.get(t);
          if (c || (n = n.ownerDocument || n, c = {
            type: "stylesheet",
            instance: null,
            count: 0,
            state: { loading: 0, preload: null }
          }, u.set(t, c), (u = n.querySelector(
            zn(t)
          )) && !u._p && (c.instance = u, c.state.loading = 5), Ne.has(t) || (l = {
            rel: "preload",
            as: "style",
            href: l.href,
            crossOrigin: l.crossOrigin,
            integrity: l.integrity,
            media: l.media,
            hrefLang: l.hrefLang,
            referrerPolicy: l.referrerPolicy
          }, Ne.set(t, l), u || nv(
            n,
            t,
            l,
            c.state
          ))), e && a === null)
            throw Error(r(528, ""));
          return c;
        }
        if (e && a !== null)
          throw Error(r(529, ""));
        return null;
      case "script":
        return e = l.async, l = l.src, typeof l == "string" && e && typeof e != "function" && typeof e != "symbol" ? (e = Ca(l), l = ta(
          n
        ).hoistableScripts, a = l.get(e), a || (a = {
          type: "script",
          instance: null,
          count: 0,
          state: null
        }, l.set(e, a)), a) : { type: "void", instance: null, count: 0, state: null };
      default:
        throw Error(r(444, t));
    }
  }
  function Da(t) {
    return 'href="' + Ee(t) + '"';
  }
  function zn(t) {
    return 'link[rel="stylesheet"][' + t + "]";
  }
  function Qd(t) {
    return U({}, t, {
      "data-precedence": t.precedence,
      precedence: null
    });
  }
  function nv(t, e, l, a) {
    t.querySelector('link[rel="preload"][as="style"][' + e + "]") ? a.loading = 1 : (e = t.createElement("link"), a.preload = e, e.addEventListener("load", function() {
      return a.loading |= 1;
    }), e.addEventListener("error", function() {
      return a.loading |= 2;
    }), $t(e, "link", l), wt(e), t.head.appendChild(e));
  }
  function Ca(t) {
    return '[src="' + Ee(t) + '"]';
  }
  function xn(t) {
    return "script[async]" + t;
  }
  function Zd(t, e, l) {
    if (e.count++, e.instance === null)
      switch (e.type) {
        case "style":
          var a = t.querySelector(
            'style[data-href~="' + Ee(l.href) + '"]'
          );
          if (a)
            return e.instance = a, wt(a), a;
          var n = U({}, l, {
            "data-href": l.href,
            "data-precedence": l.precedence,
            href: null,
            precedence: null
          });
          return a = (t.ownerDocument || t).createElement(
            "style"
          ), wt(a), $t(a, "style", n), wu(a, l.precedence, t), e.instance = a;
        case "stylesheet":
          n = Da(l.href);
          var u = t.querySelector(
            zn(n)
          );
          if (u)
            return e.state.loading |= 4, e.instance = u, wt(u), u;
          a = Qd(l), (n = Ne.get(n)) && xf(a, n), u = (t.ownerDocument || t).createElement("link"), wt(u);
          var c = u;
          return c._p = new Promise(function(o, m) {
            c.onload = o, c.onerror = m;
          }), $t(u, "link", a), e.state.loading |= 4, wu(u, l.precedence, t), e.instance = u;
        case "script":
          return u = Ca(l.src), (n = t.querySelector(
            xn(u)
          )) ? (e.instance = n, wt(n), n) : (a = l, (n = Ne.get(u)) && (a = U({}, l), Rf(a, n)), t = t.ownerDocument || t, n = t.createElement("script"), wt(n), $t(n, "link", a), t.head.appendChild(n), e.instance = n);
        case "void":
          return null;
        default:
          throw Error(r(443, e.type));
      }
    else
      e.type === "stylesheet" && (e.state.loading & 4) === 0 && (a = e.instance, e.state.loading |= 4, wu(a, l.precedence, t));
    return e.instance;
  }
  function wu(t, e, l) {
    for (var a = l.querySelectorAll(
      'link[rel="stylesheet"][data-precedence],style[data-precedence]'
    ), n = a.length ? a[a.length - 1] : null, u = n, c = 0; c < a.length; c++) {
      var o = a[c];
      if (o.dataset.precedence === e) u = o;
      else if (u !== n) break;
    }
    u ? u.parentNode.insertBefore(t, u.nextSibling) : (e = l.nodeType === 9 ? l.head : l, e.insertBefore(t, e.firstChild));
  }
  function xf(t, e) {
    t.crossOrigin == null && (t.crossOrigin = e.crossOrigin), t.referrerPolicy == null && (t.referrerPolicy = e.referrerPolicy), t.title == null && (t.title = e.title);
  }
  function Rf(t, e) {
    t.crossOrigin == null && (t.crossOrigin = e.crossOrigin), t.referrerPolicy == null && (t.referrerPolicy = e.referrerPolicy), t.integrity == null && (t.integrity = e.integrity);
  }
  var Vu = null;
  function wd(t, e, l) {
    if (Vu === null) {
      var a = /* @__PURE__ */ new Map(), n = Vu = /* @__PURE__ */ new Map();
      n.set(l, a);
    } else
      n = Vu, a = n.get(l), a || (a = /* @__PURE__ */ new Map(), n.set(l, a));
    if (a.has(t)) return a;
    for (a.set(t, null), l = l.getElementsByTagName(t), n = 0; n < l.length; n++) {
      var u = l[n];
      if (!(u[Qa] || u[Jt] || t === "link" && u.getAttribute("rel") === "stylesheet") && u.namespaceURI !== "http://www.w3.org/2000/svg") {
        var c = u.getAttribute(e) || "";
        c = t + c;
        var o = a.get(c);
        o ? o.push(u) : a.set(c, [u]);
      }
    }
    return a;
  }
  function Vd(t, e, l) {
    t = t.ownerDocument || t, t.head.insertBefore(
      l,
      e === "title" ? t.querySelector("head > title") : null
    );
  }
  function uv(t, e, l) {
    if (l === 1 || e.itemProp != null) return !1;
    switch (t) {
      case "meta":
      case "title":
        return !0;
      case "style":
        if (typeof e.precedence != "string" || typeof e.href != "string" || e.href === "")
          break;
        return !0;
      case "link":
        if (typeof e.rel != "string" || typeof e.href != "string" || e.href === "" || e.onLoad || e.onError)
          break;
        return e.rel === "stylesheet" ? (t = e.disabled, typeof e.precedence == "string" && t == null) : !0;
      case "script":
        if (e.async && typeof e.async != "function" && typeof e.async != "symbol" && !e.onLoad && !e.onError && e.src && typeof e.src == "string")
          return !0;
    }
    return !1;
  }
  function Jd(t) {
    return !(t.type === "stylesheet" && (t.state.loading & 3) === 0);
  }
  function iv(t, e, l, a) {
    if (l.type === "stylesheet" && (typeof a.media != "string" || matchMedia(a.media).matches !== !1) && (l.state.loading & 4) === 0) {
      if (l.instance === null) {
        var n = Da(a.href), u = e.querySelector(
          zn(n)
        );
        if (u) {
          e = u._p, e !== null && typeof e == "object" && typeof e.then == "function" && (t.count++, t = Ju.bind(t), e.then(t, t)), l.state.loading |= 4, l.instance = u, wt(u);
          return;
        }
        u = e.ownerDocument || e, a = Qd(a), (n = Ne.get(n)) && xf(a, n), u = u.createElement("link"), wt(u);
        var c = u;
        c._p = new Promise(function(o, m) {
          c.onload = o, c.onerror = m;
        }), $t(u, "link", a), l.instance = u;
      }
      t.stylesheets === null && (t.stylesheets = /* @__PURE__ */ new Map()), t.stylesheets.set(l, e), (e = l.state.preload) && (l.state.loading & 3) === 0 && (t.count++, l = Ju.bind(t), e.addEventListener("load", l), e.addEventListener("error", l));
    }
  }
  var Nf = 0;
  function cv(t, e) {
    return t.stylesheets && t.count === 0 && ku(t, t.stylesheets), 0 < t.count || 0 < t.imgCount ? function(l) {
      var a = setTimeout(function() {
        if (t.stylesheets && ku(t, t.stylesheets), t.unsuspend) {
          var u = t.unsuspend;
          t.unsuspend = null, u();
        }
      }, 6e4 + e);
      0 < t.imgBytes && Nf === 0 && (Nf = 62500 * Xy());
      var n = setTimeout(
        function() {
          if (t.waitingForImages = !1, t.count === 0 && (t.stylesheets && ku(t, t.stylesheets), t.unsuspend)) {
            var u = t.unsuspend;
            t.unsuspend = null, u();
          }
        },
        (t.imgBytes > Nf ? 50 : 800) + e
      );
      return t.unsuspend = l, function() {
        t.unsuspend = null, clearTimeout(a), clearTimeout(n);
      };
    } : null;
  }
  function Ju() {
    if (this.count--, this.count === 0 && (this.imgCount === 0 || !this.waitingForImages)) {
      if (this.stylesheets) ku(this, this.stylesheets);
      else if (this.unsuspend) {
        var t = this.unsuspend;
        this.unsuspend = null, t();
      }
    }
  }
  var Ku = null;
  function ku(t, e) {
    t.stylesheets = null, t.unsuspend !== null && (t.count++, Ku = /* @__PURE__ */ new Map(), e.forEach(fv, t), Ku = null, Ju.call(t));
  }
  function fv(t, e) {
    if (!(e.state.loading & 4)) {
      var l = Ku.get(t);
      if (l) var a = l.get(null);
      else {
        l = /* @__PURE__ */ new Map(), Ku.set(t, l);
        for (var n = t.querySelectorAll(
          "link[data-precedence],style[data-precedence]"
        ), u = 0; u < n.length; u++) {
          var c = n[u];
          (c.nodeName === "LINK" || c.getAttribute("media") !== "not all") && (l.set(c.dataset.precedence, c), a = c);
        }
        a && l.set(null, a);
      }
      n = e.instance, c = n.getAttribute("data-precedence"), u = l.get(c) || a, u === a && l.set(null, n), l.set(c, n), this.count++, a = Ju.bind(this), n.addEventListener("load", a), n.addEventListener("error", a), u ? u.parentNode.insertBefore(n, u.nextSibling) : (t = t.nodeType === 9 ? t.head : t, t.insertBefore(n, t.firstChild)), e.state.loading |= 4;
    }
  }
  var Rn = {
    $$typeof: at,
    Provider: null,
    Consumer: null,
    _currentValue: pt,
    _currentValue2: pt,
    _threadCount: 0
  };
  function sv(t, e, l, a, n, u, c, o, m) {
    this.tag = 1, this.containerInfo = t, this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = -1, this.callbackNode = this.next = this.pendingContext = this.context = this.cancelPendingCommit = null, this.callbackPriority = 0, this.expirationTimes = Ti(-1), this.entangledLanes = this.shellSuspendCounter = this.errorRecoveryDisabledLanes = this.expiredLanes = this.warmLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = Ti(0), this.hiddenUpdates = Ti(null), this.identifierPrefix = a, this.onUncaughtError = n, this.onCaughtError = u, this.onRecoverableError = c, this.pooledCache = null, this.pooledCacheLanes = 0, this.formState = m, this.incompleteTransitions = /* @__PURE__ */ new Map();
  }
  function Kd(t, e, l, a, n, u, c, o, m, T, N, D) {
    return t = new sv(
      t,
      e,
      l,
      c,
      m,
      T,
      N,
      D,
      o
    ), e = 1, u === !0 && (e |= 24), u = he(3, null, null, e), t.current = u, u.stateNode = t, e = cc(), e.refCount++, t.pooledCache = e, e.refCount++, u.memoizedState = {
      element: a,
      isDehydrated: l,
      cache: e
    }, oc(u), t;
  }
  function kd(t) {
    return t ? (t = ra, t) : ra;
  }
  function Fd(t, e, l, a, n, u) {
    n = kd(n), a.context === null ? a.context = n : a.pendingContext = n, a = ml(e), a.payload = { element: l }, u = u === void 0 ? null : u, u !== null && (a.callback = u), l = yl(t, a, e), l !== null && (ie(l, t, e), un(l, t, e));
  }
  function $d(t, e) {
    if (t = t.memoizedState, t !== null && t.dehydrated !== null) {
      var l = t.retryLane;
      t.retryLane = l !== 0 && l < e ? l : e;
    }
  }
  function Of(t, e) {
    $d(t, e), (t = t.alternate) && $d(t, e);
  }
  function Wd(t) {
    if (t.tag === 13 || t.tag === 31) {
      var e = Ll(t, 67108864);
      e !== null && ie(e, t, 67108864), Of(t, 67108864);
    }
  }
  function Id(t) {
    if (t.tag === 13 || t.tag === 31) {
      var e = ge();
      e = _i(e);
      var l = Ll(t, e);
      l !== null && ie(l, t, e), Of(t, e);
    }
  }
  var Fu = !0;
  function rv(t, e, l, a) {
    var n = H.T;
    H.T = null;
    var u = G.p;
    try {
      G.p = 2, Mf(t, e, l, a);
    } finally {
      G.p = u, H.T = n;
    }
  }
  function ov(t, e, l, a) {
    var n = H.T;
    H.T = null;
    var u = G.p;
    try {
      G.p = 8, Mf(t, e, l, a);
    } finally {
      G.p = u, H.T = n;
    }
  }
  function Mf(t, e, l, a) {
    if (Fu) {
      var n = Df(a);
      if (n === null)
        pf(
          t,
          e,
          a,
          $u,
          l
        ), th(t, a);
      else if (hv(
        n,
        t,
        e,
        l,
        a
      ))
        a.stopPropagation();
      else if (th(t, a), e & 4 && -1 < dv.indexOf(t)) {
        for (; n !== null; ) {
          var u = Pl(n);
          if (u !== null)
            switch (u.tag) {
              case 3:
                if (u = u.stateNode, u.current.memoizedState.isDehydrated) {
                  var c = Dl(u.pendingLanes);
                  if (c !== 0) {
                    var o = u;
                    for (o.pendingLanes |= 2, o.entangledLanes |= 2; c; ) {
                      var m = 1 << 31 - oe(c);
                      o.entanglements[1] |= m, c &= ~m;
                    }
                    qe(u), (gt & 6) === 0 && (Du = se() + 500, jn(0));
                  }
                }
                break;
              case 31:
              case 13:
                o = Ll(u, 2), o !== null && ie(o, u, 2), Uu(), Of(u, 2);
            }
          if (u = Df(a), u === null && pf(
            t,
            e,
            a,
            $u,
            l
          ), u === n) break;
          n = u;
        }
        n !== null && a.stopPropagation();
      } else
        pf(
          t,
          e,
          a,
          null,
          l
        );
    }
  }
  function Df(t) {
    return t = Ci(t), Cf(t);
  }
  var $u = null;
  function Cf(t) {
    if ($u = null, t = Il(t), t !== null) {
      var e = E(t);
      if (e === null) t = null;
      else {
        var l = e.tag;
        if (l === 13) {
          if (t = R(e), t !== null) return t;
          t = null;
        } else if (l === 31) {
          if (t = S(e), t !== null) return t;
          t = null;
        } else if (l === 3) {
          if (e.stateNode.current.memoizedState.isDehydrated)
            return e.tag === 3 ? e.stateNode.containerInfo : null;
          t = null;
        } else e !== t && (t = null);
      }
    }
    return $u = t, null;
  }
  function Pd(t) {
    switch (t) {
      case "beforetoggle":
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
      case "toggle":
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
        return 2;
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
      case "touchmove":
      case "wheel":
      case "mouseenter":
      case "mouseleave":
      case "pointerenter":
      case "pointerleave":
        return 8;
      case "message":
        switch (Wh()) {
          case is:
            return 2;
          case cs:
            return 8;
          case Yn:
          case Ih:
            return 32;
          case fs:
            return 268435456;
          default:
            return 32;
        }
      default:
        return 32;
    }
  }
  var Uf = !1, zl = null, xl = null, Rl = null, Nn = /* @__PURE__ */ new Map(), On = /* @__PURE__ */ new Map(), Nl = [], dv = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(
    " "
  );
  function th(t, e) {
    switch (t) {
      case "focusin":
      case "focusout":
        zl = null;
        break;
      case "dragenter":
      case "dragleave":
        xl = null;
        break;
      case "mouseover":
      case "mouseout":
        Rl = null;
        break;
      case "pointerover":
      case "pointerout":
        Nn.delete(e.pointerId);
        break;
      case "gotpointercapture":
      case "lostpointercapture":
        On.delete(e.pointerId);
    }
  }
  function Mn(t, e, l, a, n, u) {
    return t === null || t.nativeEvent !== u ? (t = {
      blockedOn: e,
      domEventName: l,
      eventSystemFlags: a,
      nativeEvent: u,
      targetContainers: [n]
    }, e !== null && (e = Pl(e), e !== null && Wd(e)), t) : (t.eventSystemFlags |= a, e = t.targetContainers, n !== null && e.indexOf(n) === -1 && e.push(n), t);
  }
  function hv(t, e, l, a, n) {
    switch (e) {
      case "focusin":
        return zl = Mn(
          zl,
          t,
          e,
          l,
          a,
          n
        ), !0;
      case "dragenter":
        return xl = Mn(
          xl,
          t,
          e,
          l,
          a,
          n
        ), !0;
      case "mouseover":
        return Rl = Mn(
          Rl,
          t,
          e,
          l,
          a,
          n
        ), !0;
      case "pointerover":
        var u = n.pointerId;
        return Nn.set(
          u,
          Mn(
            Nn.get(u) || null,
            t,
            e,
            l,
            a,
            n
          )
        ), !0;
      case "gotpointercapture":
        return u = n.pointerId, On.set(
          u,
          Mn(
            On.get(u) || null,
            t,
            e,
            l,
            a,
            n
          )
        ), !0;
    }
    return !1;
  }
  function eh(t) {
    var e = Il(t.target);
    if (e !== null) {
      var l = E(e);
      if (l !== null) {
        if (e = l.tag, e === 13) {
          if (e = R(l), e !== null) {
            t.blockedOn = e, ms(t.priority, function() {
              Id(l);
            });
            return;
          }
        } else if (e === 31) {
          if (e = S(l), e !== null) {
            t.blockedOn = e, ms(t.priority, function() {
              Id(l);
            });
            return;
          }
        } else if (e === 3 && l.stateNode.current.memoizedState.isDehydrated) {
          t.blockedOn = l.tag === 3 ? l.stateNode.containerInfo : null;
          return;
        }
      }
    }
    t.blockedOn = null;
  }
  function Wu(t) {
    if (t.blockedOn !== null) return !1;
    for (var e = t.targetContainers; 0 < e.length; ) {
      var l = Df(t.nativeEvent);
      if (l === null) {
        l = t.nativeEvent;
        var a = new l.constructor(
          l.type,
          l
        );
        Di = a, l.target.dispatchEvent(a), Di = null;
      } else
        return e = Pl(l), e !== null && Wd(e), t.blockedOn = l, !1;
      e.shift();
    }
    return !0;
  }
  function lh(t, e, l) {
    Wu(t) && l.delete(e);
  }
  function mv() {
    Uf = !1, zl !== null && Wu(zl) && (zl = null), xl !== null && Wu(xl) && (xl = null), Rl !== null && Wu(Rl) && (Rl = null), Nn.forEach(lh), On.forEach(lh);
  }
  function Iu(t, e) {
    t.blockedOn === e && (t.blockedOn = null, Uf || (Uf = !0, f.unstable_scheduleCallback(
      f.unstable_NormalPriority,
      mv
    )));
  }
  var Pu = null;
  function ah(t) {
    Pu !== t && (Pu = t, f.unstable_scheduleCallback(
      f.unstable_NormalPriority,
      function() {
        Pu === t && (Pu = null);
        for (var e = 0; e < t.length; e += 3) {
          var l = t[e], a = t[e + 1], n = t[e + 2];
          if (typeof a != "function") {
            if (Cf(a || l) === null)
              continue;
            break;
          }
          var u = Pl(l);
          u !== null && (t.splice(e, 3), e -= 3, Mc(
            u,
            {
              pending: !0,
              data: n,
              method: l.method,
              action: a
            },
            a,
            n
          ));
        }
      }
    ));
  }
  function Ua(t) {
    function e(m) {
      return Iu(m, t);
    }
    zl !== null && Iu(zl, t), xl !== null && Iu(xl, t), Rl !== null && Iu(Rl, t), Nn.forEach(e), On.forEach(e);
    for (var l = 0; l < Nl.length; l++) {
      var a = Nl[l];
      a.blockedOn === t && (a.blockedOn = null);
    }
    for (; 0 < Nl.length && (l = Nl[0], l.blockedOn === null); )
      eh(l), l.blockedOn === null && Nl.shift();
    if (l = (t.ownerDocument || t).$$reactFormReplay, l != null)
      for (a = 0; a < l.length; a += 3) {
        var n = l[a], u = l[a + 1], c = n[te] || null;
        if (typeof u == "function")
          c || ah(l);
        else if (c) {
          var o = null;
          if (u && u.hasAttribute("formAction")) {
            if (n = u, c = u[te] || null)
              o = c.formAction;
            else if (Cf(n) !== null) continue;
          } else o = c.action;
          typeof o == "function" ? l[a + 1] = o : (l.splice(a, 3), a -= 3), ah(l);
        }
      }
  }
  function nh() {
    function t(u) {
      u.canIntercept && u.info === "react-transition" && u.intercept({
        handler: function() {
          return new Promise(function(c) {
            return n = c;
          });
        },
        focusReset: "manual",
        scroll: "manual"
      });
    }
    function e() {
      n !== null && (n(), n = null), a || setTimeout(l, 20);
    }
    function l() {
      if (!a && !navigation.transition) {
        var u = navigation.currentEntry;
        u && u.url != null && navigation.navigate(u.url, {
          state: u.getState(),
          info: "react-transition",
          history: "replace"
        });
      }
    }
    if (typeof navigation == "object") {
      var a = !1, n = null;
      return navigation.addEventListener("navigate", t), navigation.addEventListener("navigatesuccess", e), navigation.addEventListener("navigateerror", e), setTimeout(l, 100), function() {
        a = !0, navigation.removeEventListener("navigate", t), navigation.removeEventListener("navigatesuccess", e), navigation.removeEventListener("navigateerror", e), n !== null && (n(), n = null);
      };
    }
  }
  function Hf(t) {
    this._internalRoot = t;
  }
  ti.prototype.render = Hf.prototype.render = function(t) {
    var e = this._internalRoot;
    if (e === null) throw Error(r(409));
    var l = e.current, a = ge();
    Fd(l, a, t, e, null, null);
  }, ti.prototype.unmount = Hf.prototype.unmount = function() {
    var t = this._internalRoot;
    if (t !== null) {
      this._internalRoot = null;
      var e = t.containerInfo;
      Fd(t.current, 2, null, t, null, null), Uu(), e[Wl] = null;
    }
  };
  function ti(t) {
    this._internalRoot = t;
  }
  ti.prototype.unstable_scheduleHydration = function(t) {
    if (t) {
      var e = hs();
      t = { blockedOn: null, target: t, priority: e };
      for (var l = 0; l < Nl.length && e !== 0 && e < Nl[l].priority; l++) ;
      Nl.splice(l, 0, t), l === 0 && eh(t);
    }
  };
  var uh = s.version;
  if (uh !== "19.2.4")
    throw Error(
      r(
        527,
        uh,
        "19.2.4"
      )
    );
  G.findDOMNode = function(t) {
    var e = t._reactInternals;
    if (e === void 0)
      throw typeof t.render == "function" ? Error(r(188)) : (t = Object.keys(t).join(","), Error(r(268, t)));
    return t = M(e), t = t !== null ? x(t) : null, t = t === null ? null : t.stateNode, t;
  };
  var yv = {
    bundleType: 0,
    version: "19.2.4",
    rendererPackageName: "react-dom",
    currentDispatcherRef: H,
    reconcilerVersion: "19.2.4"
  };
  if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ != "undefined") {
    var ei = __REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!ei.isDisabled && ei.supportsFiber)
      try {
        Ya = ei.inject(
          yv
        ), re = ei;
      } catch (t) {
      }
  }
  return Cn.createRoot = function(t, e) {
    if (!v(t)) throw Error(r(299));
    var l = !1, a = "", n = oo, u = ho, c = mo;
    return e != null && (e.unstable_strictMode === !0 && (l = !0), e.identifierPrefix !== void 0 && (a = e.identifierPrefix), e.onUncaughtError !== void 0 && (n = e.onUncaughtError), e.onCaughtError !== void 0 && (u = e.onCaughtError), e.onRecoverableError !== void 0 && (c = e.onRecoverableError)), e = Kd(
      t,
      1,
      !1,
      null,
      null,
      l,
      a,
      null,
      n,
      u,
      c,
      nh
    ), t[Wl] = e.current, vf(t), new Hf(e);
  }, Cn.hydrateRoot = function(t, e, l) {
    if (!v(t)) throw Error(r(299));
    var a = !1, n = "", u = oo, c = ho, o = mo, m = null;
    return l != null && (l.unstable_strictMode === !0 && (a = !0), l.identifierPrefix !== void 0 && (n = l.identifierPrefix), l.onUncaughtError !== void 0 && (u = l.onUncaughtError), l.onCaughtError !== void 0 && (c = l.onCaughtError), l.onRecoverableError !== void 0 && (o = l.onRecoverableError), l.formState !== void 0 && (m = l.formState)), e = Kd(
      t,
      1,
      !0,
      e,
      l != null ? l : null,
      a,
      n,
      m,
      u,
      c,
      o,
      nh
    ), e.context = kd(null), l = e.current, a = ge(), a = _i(a), n = ml(a), n.callback = null, yl(l, n, a), l = a, e.current.lanes = l, Xa(e, l), qe(e), t[Wl] = e.current, vf(t), new ti(e);
  }, Cn.version = "19.2.4", Cn;
}
var yh;
function Av() {
  if (yh) return qf.exports;
  yh = 1;
  function i() {
    if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ == "undefined" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"))
      try {
        __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(i);
      } catch (f) {
        console.error(f);
      }
  }
  return i(), qf.exports = _v(), qf.exports;
}
var zv = Av();
var vh = "popstate";
function ph(i) {
  return typeof i == "object" && i != null && "pathname" in i && "search" in i && "hash" in i && "state" in i && "key" in i;
}
function xv(i = {}) {
  function f(d, r) {
    var y;
    let v = (y = r.state) == null ? void 0 : y.masked, { pathname: E, search: R, hash: S } = v || d.location;
    return Jf(
      "",
      { pathname: E, search: R, hash: S },
      // state defaults to `null` because `window.history.state` does
      r.state && r.state.usr || null,
      r.state && r.state.key || "default",
      v ? {
        pathname: d.location.pathname,
        search: d.location.search,
        hash: d.location.hash
      } : void 0
    );
  }
  function s(d, r) {
    return typeof r == "string" ? r : Hn(r);
  }
  return Nv(
    f,
    s,
    null,
    i
  );
}
function Mt(i, f) {
  if (i === !1 || i === null || typeof i == "undefined")
    throw new Error(f);
}
function Oe(i, f) {
  if (!i) {
    typeof console != "undefined" && console.warn(f);
    try {
      throw new Error(f);
    } catch (s) {
    }
  }
}
function Rv() {
  return Math.random().toString(36).substring(2, 10);
}
function gh(i, f) {
  return {
    usr: i.state,
    key: i.key,
    idx: f,
    masked: i.unstable_mask ? {
      pathname: i.pathname,
      search: i.search,
      hash: i.hash
    } : void 0
  };
}
function Jf(i, f, s = null, d, r) {
  return {
    pathname: typeof i == "string" ? i : i.pathname,
    search: "",
    hash: "",
    ...typeof f == "string" ? Ha(f) : f,
    state: s,
    // TODO: This could be cleaned up.  push/replace should probably just take
    // full Locations now and avoid the need to run through this flow at all
    // But that's a pretty big refactor to the current test suite so going to
    // keep as is for the time being and just let any incoming keys take precedence
    key: f && f.key || d || Rv(),
    unstable_mask: r
  };
}
function Hn({
  pathname: i = "/",
  search: f = "",
  hash: s = ""
}) {
  return f && f !== "?" && (i += f.charAt(0) === "?" ? f : "?" + f), s && s !== "#" && (i += s.charAt(0) === "#" ? s : "#" + s), i;
}
function Ha(i) {
  let f = {};
  if (i) {
    let s = i.indexOf("#");
    s >= 0 && (f.hash = i.substring(s), i = i.substring(0, s));
    let d = i.indexOf("?");
    d >= 0 && (f.search = i.substring(d), i = i.substring(0, d)), i && (f.pathname = i);
  }
  return f;
}
function Nv(i, f, s, d = {}) {
  let { window: r = document.defaultView, v5Compat: v = !1 } = d, E = r.history, R = "POP", S = null, y = M();
  y == null && (y = 0, E.replaceState({ ...E.state, idx: y }, ""));
  function M() {
    return (E.state || { idx: null }).idx;
  }
  function x() {
    R = "POP";
    let X = M(), Y = X == null ? null : X - y;
    y = X, S && S({ action: R, location: Q.location, delta: Y });
  }
  function U(X, Y) {
    R = "PUSH";
    let $ = ph(X) ? X : Jf(Q.location, X, Y);
    y = M() + 1;
    let I = gh($, y), at = Q.createHref($.unstable_mask || $);
    try {
      E.pushState(I, "", at);
    } catch (st) {
      if (st instanceof DOMException && st.name === "DataCloneError")
        throw st;
      r.location.assign(at);
    }
    v && S && S({ action: R, location: Q.location, delta: 1 });
  }
  function K(X, Y) {
    R = "REPLACE";
    let $ = ph(X) ? X : Jf(Q.location, X, Y);
    y = M();
    let I = gh($, y), at = Q.createHref($.unstable_mask || $);
    E.replaceState(I, "", at), v && S && S({ action: R, location: Q.location, delta: 0 });
  }
  function J(X) {
    return Ov(X);
  }
  let Q = {
    get action() {
      return R;
    },
    get location() {
      return i(r, E);
    },
    listen(X) {
      if (S)
        throw new Error("A history only accepts one active listener");
      return r.addEventListener(vh, x), S = X, () => {
        r.removeEventListener(vh, x), S = null;
      };
    },
    createHref(X) {
      return f(r, X);
    },
    createURL: J,
    encodeLocation(X) {
      let Y = J(X);
      return {
        pathname: Y.pathname,
        search: Y.search,
        hash: Y.hash
      };
    },
    push: U,
    replace: K,
    go(X) {
      return E.go(X);
    }
  };
  return Q;
}
function Ov(i, f = !1) {
  let s = "http://localhost";
  typeof window != "undefined" && (s = window.location.origin !== "null" ? window.location.origin : window.location.href), Mt(s, "No window.location.(origin|href) available to create URL");
  let d = typeof i == "string" ? i : Hn(i);
  return d = d.replace(/ $/, "%20"), !f && d.startsWith("//") && (d = s + d), new URL(d, s);
}
function zh(i, f, s = "/") {
  return Mv(i, f, s, !1);
}
function Mv(i, f, s, d) {
  let r = typeof f == "string" ? Ha(f) : f, v = ul(r.pathname || "/", s);
  if (v == null)
    return null;
  let E = xh(i);
  Dv(E);
  let R = null;
  for (let S = 0; R == null && S < E.length; ++S) {
    let y = Zv(v);
    R = Xv(
      E[S],
      y,
      d
    );
  }
  return R;
}
function xh(i, f = [], s = [], d = "", r = !1) {
  let v = (E, R, S = r, y) => {
    let M = {
      relativePath: y === void 0 ? E.path || "" : y,
      caseSensitive: E.caseSensitive === !0,
      childrenIndex: R,
      route: E
    };
    if (M.relativePath.startsWith("/")) {
      if (!M.relativePath.startsWith(d) && S)
        return;
      Mt(
        M.relativePath.startsWith(d),
        `Absolute route path "${M.relativePath}" nested under path "${d}" is not valid. An absolute child route path must start with the combined path of all its parent routes.`
      ), M.relativePath = M.relativePath.slice(d.length);
    }
    let x = Ye([d, M.relativePath]), U = s.concat(M);
    E.children && E.children.length > 0 && (Mt(
      // Our types know better, but runtime JS may not!
      // @ts-expect-error
      E.index !== !0,
      `Index routes must not have child routes. Please remove all child routes from route path "${x}".`
    ), xh(
      E.children,
      f,
      U,
      x,
      S
    )), !(E.path == null && !E.index) && f.push({
      path: x,
      score: Yv(x, E.index),
      routesMeta: U
    });
  };
  return i.forEach((E, R) => {
    var S;
    if (E.path === "" || !((S = E.path) != null && S.includes("?")))
      v(E, R);
    else
      for (let y of Rh(E.path))
        v(E, R, !0, y);
  }), f;
}
function Rh(i) {
  let f = i.split("/");
  if (f.length === 0) return [];
  let [s, ...d] = f, r = s.endsWith("?"), v = s.replace(/\?$/, "");
  if (d.length === 0)
    return r ? [v, ""] : [v];
  let E = Rh(d.join("/")), R = [];
  return R.push(
    ...E.map(
      (S) => S === "" ? v : [v, S].join("/")
    )
  ), r && R.push(...E), R.map(
    (S) => i.startsWith("/") && S === "" ? "/" : S
  );
}
function Dv(i) {
  i.sort(
    (f, s) => f.score !== s.score ? s.score - f.score : Gv(
      f.routesMeta.map((d) => d.childrenIndex),
      s.routesMeta.map((d) => d.childrenIndex)
    )
  );
}
var Cv = /^:[\w-]+$/, Uv = 3, Hv = 2, Bv = 1, Lv = 10, qv = -2, Sh = (i) => i === "*";
function Yv(i, f) {
  let s = i.split("/"), d = s.length;
  return s.some(Sh) && (d += qv), f && (d += Hv), s.filter((r) => !Sh(r)).reduce(
    (r, v) => r + (Cv.test(v) ? Uv : v === "" ? Bv : Lv),
    d
  );
}
function Gv(i, f) {
  return i.length === f.length && i.slice(0, -1).every((d, r) => d === f[r]) ? (
    // If two routes are siblings, we should try to match the earlier sibling
    // first. This allows people to have fine-grained control over the matching
    // behavior by simply putting routes with identical paths in the order they
    // want them tried.
    i[i.length - 1] - f[f.length - 1]
  ) : (
    // Otherwise, it doesn't really make sense to rank non-siblings by index,
    // so they sort equally.
    0
  );
}
function Xv(i, f, s = !1) {
  let { routesMeta: d } = i, r = {}, v = "/", E = [];
  for (let R = 0; R < d.length; ++R) {
    let S = d[R], y = R === d.length - 1, M = v === "/" ? f : f.slice(v.length) || "/", x = oi(
      { path: S.relativePath, caseSensitive: S.caseSensitive, end: y },
      M
    ), U = S.route;
    if (!x && y && s && !d[d.length - 1].route.index && (x = oi(
      {
        path: S.relativePath,
        caseSensitive: S.caseSensitive,
        end: !1
      },
      M
    )), !x)
      return null;
    Object.assign(r, x.params), E.push({
      // TODO: Can this as be avoided?
      params: r,
      pathname: Ye([v, x.pathname]),
      pathnameBase: Kv(
        Ye([v, x.pathnameBase])
      ),
      route: U
    }), x.pathnameBase !== "/" && (v = Ye([v, x.pathnameBase]));
  }
  return E;
}
function oi(i, f) {
  typeof i == "string" && (i = { path: i, caseSensitive: !1, end: !0 });
  let [s, d] = Qv(
    i.path,
    i.caseSensitive,
    i.end
  ), r = f.match(s);
  if (!r) return null;
  let v = r[0], E = v.replace(/(.)\/+$/, "$1"), R = r.slice(1);
  return {
    params: d.reduce(
      (y, { paramName: M, isOptional: x }, U) => {
        if (M === "*") {
          let J = R[U] || "";
          E = v.slice(0, v.length - J.length).replace(/(.)\/+$/, "$1");
        }
        const K = R[U];
        return x && !K ? y[M] = void 0 : y[M] = (K || "").replace(/%2F/g, "/"), y;
      },
      {}
    ),
    pathname: v,
    pathnameBase: E,
    pattern: i
  };
}
function Qv(i, f = !1, s = !0) {
  Oe(
    i === "*" || !i.endsWith("*") || i.endsWith("/*"),
    `Route path "${i}" will be treated as if it were "${i.replace(/\*$/, "/*")}" because the \`*\` character must always follow a \`/\` in the pattern. To get rid of this warning, please change the route path to "${i.replace(/\*$/, "/*")}".`
  );
  let d = [], r = "^" + i.replace(/\/*\*?$/, "").replace(/^\/*/, "/").replace(/[\\.*+^${}|()[\]]/g, "\\$&").replace(
    /\/:([\w-]+)(\?)?/g,
    (E, R, S, y, M) => {
      if (d.push({ paramName: R, isOptional: S != null }), S) {
        let x = M.charAt(y + E.length);
        return x && x !== "/" ? "/([^\\/]*)" : "(?:/([^\\/]*))?";
      }
      return "/([^\\/]+)";
    }
  ).replace(/\/([\w-]+)\?(\/|$)/g, "(/$1)?$2");
  return i.endsWith("*") ? (d.push({ paramName: "*" }), r += i === "*" || i === "/*" ? "(.*)$" : "(?:\\/(.+)|\\/*)$") : s ? r += "\\/*$" : i !== "" && i !== "/" && (r += "(?:(?=\\/|$))"), [new RegExp(r, f ? void 0 : "i"), d];
}
function Zv(i) {
  try {
    return i.split("/").map((f) => decodeURIComponent(f).replace(/\//g, "%2F")).join("/");
  } catch (f) {
    return Oe(
      !1,
      `The URL path "${i}" could not be decoded because it is a malformed URL segment. This is probably due to a bad percent encoding (${f}).`
    ), i;
  }
}
function ul(i, f) {
  if (f === "/") return i;
  if (!i.toLowerCase().startsWith(f.toLowerCase()))
    return null;
  let s = f.endsWith("/") ? f.length - 1 : f.length, d = i.charAt(s);
  return d && d !== "/" ? null : i.slice(s) || "/";
}
var wv = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;
function Vv(i, f = "/") {
  let {
    pathname: s,
    search: d = "",
    hash: r = ""
  } = typeof i == "string" ? Ha(i) : i, v;
  return s ? (s = s.replace(/\/\/+/g, "/"), s.startsWith("/") ? v = bh(s.substring(1), "/") : v = bh(s, f)) : v = f, {
    pathname: v,
    search: kv(d),
    hash: Fv(r)
  };
}
function bh(i, f) {
  let s = f.replace(/\/+$/, "").split("/");
  return i.split("/").forEach((r) => {
    r === ".." ? s.length > 1 && s.pop() : r !== "." && s.push(r);
  }), s.length > 1 ? s.join("/") : "/";
}
function Qf(i, f, s, d) {
  return `Cannot include a '${i}' character in a manually specified \`to.${f}\` field [${JSON.stringify(
    d
  )}].  Please separate it out to the \`to.${s}\` field. Alternatively you may provide the full path as a string in <Link to="..."> and the router will parse it for you.`;
}
function Jv(i) {
  return i.filter(
    (f, s) => s === 0 || f.route.path && f.route.path.length > 0
  );
}
function If(i) {
  let f = Jv(i);
  return f.map(
    (s, d) => d === f.length - 1 ? s.pathname : s.pathnameBase
  );
}
function hi(i, f, s, d = !1) {
  let r;
  typeof i == "string" ? r = Ha(i) : (r = { ...i }, Mt(
    !r.pathname || !r.pathname.includes("?"),
    Qf("?", "pathname", "search", r)
  ), Mt(
    !r.pathname || !r.pathname.includes("#"),
    Qf("#", "pathname", "hash", r)
  ), Mt(
    !r.search || !r.search.includes("#"),
    Qf("#", "search", "hash", r)
  ));
  let v = i === "" || r.pathname === "", E = v ? "/" : r.pathname, R;
  if (E == null)
    R = s;
  else {
    let x = f.length - 1;
    if (!d && E.startsWith("..")) {
      let U = E.split("/");
      for (; U[0] === ".."; )
        U.shift(), x -= 1;
      r.pathname = U.join("/");
    }
    R = x >= 0 ? f[x] : "/";
  }
  let S = Vv(r, R), y = E && E !== "/" && E.endsWith("/"), M = (v || E === ".") && s.endsWith("/");
  return !S.pathname.endsWith("/") && (y || M) && (S.pathname += "/"), S;
}
var Ye = (i) => i.join("/").replace(/\/\/+/g, "/"), Kv = (i) => i.replace(/\/+$/, "").replace(/^\/*/, "/"), kv = (i) => !i || i === "?" ? "" : i.startsWith("?") ? i : "?" + i, Fv = (i) => !i || i === "#" ? "" : i.startsWith("#") ? i : "#" + i, $v = class {
  constructor(i, f, s, d = !1) {
    this.status = i, this.statusText = f || "", this.internal = d, s instanceof Error ? (this.data = s.toString(), this.error = s) : this.data = s;
  }
};
function Wv(i) {
  return i != null && typeof i.status == "number" && typeof i.statusText == "string" && typeof i.internal == "boolean" && "data" in i;
}
function Iv(i) {
  return i.map((f) => f.route.path).filter(Boolean).join("/").replace(/\/\/*/g, "/") || "/";
}
var Nh = typeof window != "undefined" && typeof window.document != "undefined" && typeof window.document.createElement != "undefined";
function Oh(i, f) {
  let s = i;
  if (typeof s != "string" || !wv.test(s))
    return {
      absoluteURL: void 0,
      isExternal: !1,
      to: s
    };
  let d = s, r = !1;
  if (Nh)
    try {
      let v = new URL(window.location.href), E = s.startsWith("//") ? new URL(v.protocol + s) : new URL(s), R = ul(E.pathname, f);
      E.origin === v.origin && R != null ? s = R + E.search + E.hash : r = !0;
    } catch (v) {
      Oe(
        !1,
        `<Link to="${s}"> contains an invalid URL which will probably break when clicked - please update to a valid URL path.`
      );
    }
  return {
    absoluteURL: d,
    isExternal: r,
    to: s
  };
}
Object.getOwnPropertyNames(Object.prototype).sort().join("\0");
var Mh = [
  "POST",
  "PUT",
  "PATCH",
  "DELETE"
];
new Set(
  Mh
);
var Pv = [
  "GET",
  ...Mh
];
new Set(Pv);
var Ba = A.createContext(null);
Ba.displayName = "DataRouter";
var mi = A.createContext(null);
mi.displayName = "DataRouterState";
var tp = A.createContext(!1), Dh = A.createContext({
  isTransitioning: !1
});
Dh.displayName = "ViewTransition";
var ep = A.createContext(
  /* @__PURE__ */ new Map()
);
ep.displayName = "Fetchers";
var lp = A.createContext(null);
lp.displayName = "Await";
var Se = A.createContext(
  null
);
Se.displayName = "Navigation";
var Bn = A.createContext(
  null
);
Bn.displayName = "Location";
var Ue = A.createContext({
  outlet: null,
  matches: [],
  isDataRoute: !1
});
Ue.displayName = "Route";
var Pf = A.createContext(null);
Pf.displayName = "RouteError";
var Ch = "REACT_ROUTER_ERROR", ap = "REDIRECT", np = "ROUTE_ERROR_RESPONSE";
function up(i) {
  if (i.startsWith(`${Ch}:${ap}:{`))
    try {
      let f = JSON.parse(i.slice(28));
      if (typeof f == "object" && f && typeof f.status == "number" && typeof f.statusText == "string" && typeof f.location == "string" && typeof f.reloadDocument == "boolean" && typeof f.replace == "boolean")
        return f;
    } catch (f) {
    }
}
function ip(i) {
  if (i.startsWith(
    `${Ch}:${np}:{`
  ))
    try {
      let f = JSON.parse(i.slice(40));
      if (typeof f == "object" && f && typeof f.status == "number" && typeof f.statusText == "string")
        return new $v(
          f.status,
          f.statusText,
          f.data
        );
    } catch (f) {
    }
}
function cp(i, { relative: f } = {}) {
  Mt(
    La(),
    // TODO: This error is probably because they somehow have 2 versions of the
    // router loaded. We can help them understand how to avoid that.
    "useHref() may be used only in the context of a <Router> component."
  );
  let { basename: s, navigator: d } = A.useContext(Se), { hash: r, pathname: v, search: E } = Ln(i, { relative: f }), R = v;
  return s !== "/" && (R = v === "/" ? s : Ye([s, v])), d.createHref({ pathname: R, search: E, hash: r });
}
function La() {
  return A.useContext(Bn) != null;
}
function Ge() {
  return Mt(
    La(),
    // TODO: This error is probably because they somehow have 2 versions of the
    // router loaded. We can help them understand how to avoid that.
    "useLocation() may be used only in the context of a <Router> component."
  ), A.useContext(Bn).location;
}
var Uh = "You should call navigate() in a React.useEffect(), not when your component is first rendered.";
function Hh(i) {
  A.useContext(Se).static || A.useLayoutEffect(i);
}
function yi() {
  let { isDataRoute: i } = A.useContext(Ue);
  return i ? Ep() : fp();
}
function fp() {
  Mt(
    La(),
    // TODO: This error is probably because they somehow have 2 versions of the
    // router loaded. We can help them understand how to avoid that.
    "useNavigate() may be used only in the context of a <Router> component."
  );
  let i = A.useContext(Ba), { basename: f, navigator: s } = A.useContext(Se), { matches: d } = A.useContext(Ue), { pathname: r } = Ge(), v = JSON.stringify(If(d)), E = A.useRef(!1);
  return Hh(() => {
    E.current = !0;
  }), A.useCallback(
    (S, y = {}) => {
      if (Oe(E.current, Uh), !E.current) return;
      if (typeof S == "number") {
        s.go(S);
        return;
      }
      let M = hi(
        S,
        JSON.parse(v),
        r,
        y.relative === "path"
      );
      i == null && f !== "/" && (M.pathname = M.pathname === "/" ? f : Ye([f, M.pathname])), (y.replace ? s.replace : s.push)(
        M,
        y.state,
        y
      );
    },
    [
      f,
      s,
      v,
      r,
      i
    ]
  );
}
A.createContext(null);
function sp() {
  let { matches: i } = A.useContext(Ue), f = i[i.length - 1];
  return f ? f.params : {};
}
function Ln(i, { relative: f } = {}) {
  let { matches: s } = A.useContext(Ue), { pathname: d } = Ge(), r = JSON.stringify(If(s));
  return A.useMemo(
    () => hi(
      i,
      JSON.parse(r),
      d,
      f === "path"
    ),
    [i, r, d, f]
  );
}
function rp(i, f) {
  return Bh(i, f);
}
function Bh(i, f, s) {
  var X;
  Mt(
    La(),
    // TODO: This error is probably because they somehow have 2 versions of the
    // router loaded. We can help them understand how to avoid that.
    "useRoutes() may be used only in the context of a <Router> component."
  );
  let { navigator: d } = A.useContext(Se), { matches: r } = A.useContext(Ue), v = r[r.length - 1], E = v ? v.params : {}, R = v ? v.pathname : "/", S = v ? v.pathnameBase : "/", y = v && v.route;
  {
    let Y = y && y.path || "";
    qh(
      R,
      !y || Y.endsWith("*") || Y.endsWith("*?"),
      `You rendered descendant <Routes> (or called \`useRoutes()\`) at "${R}" (under <Route path="${Y}">) but the parent route path has no trailing "*". This means if you navigate deeper, the parent won't match anymore and therefore the child routes will never render.

Please change the parent <Route path="${Y}"> to <Route path="${Y === "/" ? "*" : `${Y}/*`}">.`
    );
  }
  let M = Ge(), x;
  if (f) {
    let Y = typeof f == "string" ? Ha(f) : f;
    Mt(
      S === "/" || ((X = Y.pathname) == null ? void 0 : X.startsWith(S)),
      `When overriding the location using \`<Routes location>\` or \`useRoutes(routes, location)\`, the location pathname must begin with the portion of the URL pathname that was matched by all parent routes. The current pathname base is "${S}" but pathname "${Y.pathname}" was given in the \`location\` prop.`
    ), x = Y;
  } else
    x = M;
  let U = x.pathname || "/", K = U;
  if (S !== "/") {
    let Y = S.replace(/^\//, "").split("/");
    K = "/" + U.replace(/^\//, "").split("/").slice(Y.length).join("/");
  }
  let J = zh(i, { pathname: K });
  Oe(
    y || J != null,
    `No routes matched location "${x.pathname}${x.search}${x.hash}" `
  ), Oe(
    J == null || J[J.length - 1].route.element !== void 0 || J[J.length - 1].route.Component !== void 0 || J[J.length - 1].route.lazy !== void 0,
    `Matched leaf route at location "${x.pathname}${x.search}${x.hash}" does not have an element or Component. This means it will render an <Outlet /> with a null value by default resulting in an "empty" page.`
  );
  let Q = yp(
    J && J.map(
      (Y) => Object.assign({}, Y, {
        params: Object.assign({}, E, Y.params),
        pathname: Ye([
          S,
          // Re-encode pathnames that were decoded inside matchRoutes.
          // Pre-encode `%`, `?` and `#` ahead of `encodeLocation` because it uses
          // `new URL()` internally and we need to prevent it from treating
          // them as separators
          d.encodeLocation ? d.encodeLocation(
            Y.pathname.replace(/%/g, "%25").replace(/\?/g, "%3F").replace(/#/g, "%23")
          ).pathname : Y.pathname
        ]),
        pathnameBase: Y.pathnameBase === "/" ? S : Ye([
          S,
          // Re-encode pathnames that were decoded inside matchRoutes
          // Pre-encode `%`, `?` and `#` ahead of `encodeLocation` because it uses
          // `new URL()` internally and we need to prevent it from treating
          // them as separators
          d.encodeLocation ? d.encodeLocation(
            Y.pathnameBase.replace(/%/g, "%25").replace(/\?/g, "%3F").replace(/#/g, "%23")
          ).pathname : Y.pathnameBase
        ])
      })
    ),
    r,
    s
  );
  return f && Q ? /* @__PURE__ */ A.createElement(
    Bn.Provider,
    {
      value: {
        location: {
          pathname: "/",
          search: "",
          hash: "",
          state: null,
          key: "default",
          unstable_mask: void 0,
          ...x
        },
        navigationType: "POP"
        /* Pop */
      }
    },
    Q
  ) : Q;
}
function op() {
  let i = bp(), f = Wv(i) ? `${i.status} ${i.statusText}` : i instanceof Error ? i.message : JSON.stringify(i), s = i instanceof Error ? i.stack : null, d = "rgba(200,200,200, 0.5)", r = { padding: "0.5rem", backgroundColor: d }, v = { padding: "2px 4px", backgroundColor: d }, E = null;
  return console.error(
    "Error handled by React Router default ErrorBoundary:",
    i
  ), E = /* @__PURE__ */ A.createElement(A.Fragment, null, /* @__PURE__ */ A.createElement("p", null, "💿 Hey developer 👋"), /* @__PURE__ */ A.createElement("p", null, "You can provide a way better UX than this when your app throws errors by providing your own ", /* @__PURE__ */ A.createElement("code", { style: v }, "ErrorBoundary"), " or", " ", /* @__PURE__ */ A.createElement("code", { style: v }, "errorElement"), " prop on your route.")), /* @__PURE__ */ A.createElement(A.Fragment, null, /* @__PURE__ */ A.createElement("h2", null, "Unexpected Application Error!"), /* @__PURE__ */ A.createElement("h3", { style: { fontStyle: "italic" } }, f), s ? /* @__PURE__ */ A.createElement("pre", { style: r }, s) : null, E);
}
var dp = /* @__PURE__ */ A.createElement(op, null), Lh = class extends A.Component {
  constructor(i) {
    super(i), this.state = {
      location: i.location,
      revalidation: i.revalidation,
      error: i.error
    };
  }
  static getDerivedStateFromError(i) {
    return { error: i };
  }
  static getDerivedStateFromProps(i, f) {
    return f.location !== i.location || f.revalidation !== "idle" && i.revalidation === "idle" ? {
      error: i.error,
      location: i.location,
      revalidation: i.revalidation
    } : {
      error: i.error !== void 0 ? i.error : f.error,
      location: f.location,
      revalidation: i.revalidation || f.revalidation
    };
  }
  componentDidCatch(i, f) {
    this.props.onError ? this.props.onError(i, f) : console.error(
      "React Router caught the following error during render",
      i
    );
  }
  render() {
    let i = this.state.error;
    if (this.context && typeof i == "object" && i && "digest" in i && typeof i.digest == "string") {
      const s = ip(i.digest);
      s && (i = s);
    }
    let f = i !== void 0 ? /* @__PURE__ */ A.createElement(Ue.Provider, { value: this.props.routeContext }, /* @__PURE__ */ A.createElement(
      Pf.Provider,
      {
        value: i,
        children: this.props.component
      }
    )) : this.props.children;
    return this.context ? /* @__PURE__ */ A.createElement(hp, { error: i }, f) : f;
  }
};
Lh.contextType = tp;
var Zf = /* @__PURE__ */ new WeakMap();
function hp({
  children: i,
  error: f
}) {
  let { basename: s } = A.useContext(Se);
  if (typeof f == "object" && f && "digest" in f && typeof f.digest == "string") {
    let d = up(f.digest);
    if (d) {
      let r = Zf.get(f);
      if (r) throw r;
      let v = Oh(d.location, s);
      if (Nh && !Zf.get(f))
        if (v.isExternal || d.reloadDocument)
          window.location.href = v.absoluteURL || v.to;
        else {
          const E = Promise.resolve().then(
            () => window.__reactRouterDataRouter.navigate(v.to, {
              replace: d.replace
            })
          );
          throw Zf.set(f, E), E;
        }
      return /* @__PURE__ */ A.createElement(
        "meta",
        {
          httpEquiv: "refresh",
          content: `0;url=${v.absoluteURL || v.to}`
        }
      );
    }
  }
  return i;
}
function mp({ routeContext: i, match: f, children: s }) {
  let d = A.useContext(Ba);
  return d && d.static && d.staticContext && (f.route.errorElement || f.route.ErrorBoundary) && (d.staticContext._deepestRenderedBoundaryId = f.route.id), /* @__PURE__ */ A.createElement(Ue.Provider, { value: i }, s);
}
function yp(i, f = [], s) {
  let d = s == null ? void 0 : s.state;
  if (i == null) {
    if (!d)
      return null;
    if (d.errors)
      i = d.matches;
    else if (f.length === 0 && !d.initialized && d.matches.length > 0)
      i = d.matches;
    else
      return null;
  }
  let r = i, v = d == null ? void 0 : d.errors;
  if (v != null) {
    let M = r.findIndex(
      (x) => x.route.id && (v == null ? void 0 : v[x.route.id]) !== void 0
    );
    Mt(
      M >= 0,
      `Could not find a matching route for errors on route IDs: ${Object.keys(
        v
      ).join(",")}`
    ), r = r.slice(
      0,
      Math.min(r.length, M + 1)
    );
  }
  let E = !1, R = -1;
  if (s && d) {
    E = d.renderFallback;
    for (let M = 0; M < r.length; M++) {
      let x = r[M];
      if ((x.route.HydrateFallback || x.route.hydrateFallbackElement) && (R = M), x.route.id) {
        let { loaderData: U, errors: K } = d, J = x.route.loader && !U.hasOwnProperty(x.route.id) && (!K || K[x.route.id] === void 0);
        if (x.route.lazy || J) {
          s.isStatic && (E = !0), R >= 0 ? r = r.slice(0, R + 1) : r = [r[0]];
          break;
        }
      }
    }
  }
  let S = s == null ? void 0 : s.onError, y = d && S ? (M, x) => {
    var U, K, J;
    S(M, {
      location: d.location,
      params: (J = (K = (U = d.matches) == null ? void 0 : U[0]) == null ? void 0 : K.params) != null ? J : {},
      unstable_pattern: Iv(d.matches),
      errorInfo: x
    });
  } : void 0;
  return r.reduceRight(
    (M, x, U) => {
      let K, J = !1, Q = null, X = null;
      d && (K = v && x.route.id ? v[x.route.id] : void 0, Q = x.route.errorElement || dp, E && (R < 0 && U === 0 ? (qh(
        "route-fallback",
        !1,
        "No `HydrateFallback` element provided to render during initial hydration"
      ), J = !0, X = null) : R === U && (J = !0, X = x.route.hydrateFallbackElement || null)));
      let Y = f.concat(r.slice(0, U + 1)), $ = () => {
        let I;
        return K ? I = Q : J ? I = X : x.route.Component ? I = /* @__PURE__ */ A.createElement(x.route.Component, null) : x.route.element ? I = x.route.element : I = M, /* @__PURE__ */ A.createElement(
          mp,
          {
            match: x,
            routeContext: {
              outlet: M,
              matches: Y,
              isDataRoute: d != null
            },
            children: I
          }
        );
      };
      return d && (x.route.ErrorBoundary || x.route.errorElement || U === 0) ? /* @__PURE__ */ A.createElement(
        Lh,
        {
          location: d.location,
          revalidation: d.revalidation,
          component: Q,
          error: K,
          children: $(),
          routeContext: { outlet: null, matches: Y, isDataRoute: !0 },
          onError: y
        }
      ) : $();
    },
    null
  );
}
function ts(i) {
  return `${i} must be used within a data router.  See https://reactrouter.com/en/main/routers/picking-a-router.`;
}
function vp(i) {
  let f = A.useContext(Ba);
  return Mt(f, ts(i)), f;
}
function pp(i) {
  let f = A.useContext(mi);
  return Mt(f, ts(i)), f;
}
function gp(i) {
  let f = A.useContext(Ue);
  return Mt(f, ts(i)), f;
}
function es(i) {
  let f = gp(i), s = f.matches[f.matches.length - 1];
  return Mt(
    s.route.id,
    `${i} can only be used on routes that contain a unique "id"`
  ), s.route.id;
}
function Sp() {
  return es(
    "useRouteId"
    /* UseRouteId */
  );
}
function bp() {
  var d;
  let i = A.useContext(Pf), f = pp(
    "useRouteError"
    /* UseRouteError */
  ), s = es(
    "useRouteError"
    /* UseRouteError */
  );
  return i !== void 0 ? i : (d = f.errors) == null ? void 0 : d[s];
}
function Ep() {
  let { router: i } = vp(
    "useNavigate"
    /* UseNavigateStable */
  ), f = es(
    "useNavigate"
    /* UseNavigateStable */
  ), s = A.useRef(!1);
  return Hh(() => {
    s.current = !0;
  }), A.useCallback(
    async (r, v = {}) => {
      Oe(s.current, Uh), s.current && (typeof r == "number" ? await i.navigate(r) : await i.navigate(r, { fromRouteId: f, ...v }));
    },
    [i, f]
  );
}
var Eh = {};
function qh(i, f, s) {
  !f && !Eh[i] && (Eh[i] = !0, Oe(!1, s));
}
A.memo(jp);
function jp({
  routes: i,
  future: f,
  state: s,
  isStatic: d,
  onError: r
}) {
  return Bh(i, void 0, { state: s, isStatic: d, onError: r });
}
function Tp({
  to: i,
  replace: f,
  state: s,
  relative: d
}) {
  Mt(
    La(),
    // TODO: This error is probably because they somehow have 2 versions of
    // the router loaded. We can help them understand how to avoid that.
    "<Navigate> may be used only in the context of a <Router> component."
  );
  let { static: r } = A.useContext(Se);
  Oe(
    !r,
    "<Navigate> must not be used on the initial render in a <StaticRouter>. This is a no-op, but you should modify your code so the <Navigate> is only ever rendered in response to some user interaction or state change."
  );
  let { matches: v } = A.useContext(Ue), { pathname: E } = Ge(), R = yi(), S = hi(
    i,
    If(v),
    E,
    d === "path"
  ), y = JSON.stringify(S);
  return A.useEffect(() => {
    R(JSON.parse(y), { replace: f, state: s, relative: d });
  }, [R, y, d, f, s]), null;
}
function ci(i) {
  Mt(
    !1,
    "A <Route> is only ever to be used as the child of <Routes> element, never rendered directly. Please wrap your <Route> in a <Routes>."
  );
}
function _p({
  basename: i = "/",
  children: f = null,
  location: s,
  navigationType: d = "POP",
  navigator: r,
  static: v = !1,
  unstable_useTransitions: E
}) {
  Mt(
    !La(),
    "You cannot render a <Router> inside another <Router>. You should never have more than one in your app."
  );
  let R = i.replace(/^\/*/, "/"), S = A.useMemo(
    () => ({
      basename: R,
      navigator: r,
      static: v,
      unstable_useTransitions: E,
      future: {}
    }),
    [R, r, v, E]
  );
  typeof s == "string" && (s = Ha(s));
  let {
    pathname: y = "/",
    search: M = "",
    hash: x = "",
    state: U = null,
    key: K = "default",
    unstable_mask: J
  } = s, Q = A.useMemo(() => {
    let X = ul(y, R);
    return X == null ? null : {
      location: {
        pathname: X,
        search: M,
        hash: x,
        state: U,
        key: K,
        unstable_mask: J
      },
      navigationType: d
    };
  }, [
    R,
    y,
    M,
    x,
    U,
    K,
    d,
    J
  ]);
  return Oe(
    Q != null,
    `<Router basename="${R}"> is not able to match the URL "${y}${M}${x}" because it does not start with the basename, so the <Router> won't render anything.`
  ), Q == null ? null : /* @__PURE__ */ A.createElement(Se.Provider, { value: S }, /* @__PURE__ */ A.createElement(Bn.Provider, { children: f, value: Q }));
}
function Ap({
  children: i,
  location: f
}) {
  return rp(Kf(i), f);
}
function Kf(i, f = []) {
  let s = [];
  return A.Children.forEach(i, (d, r) => {
    if (!A.isValidElement(d))
      return;
    let v = [...f, r];
    if (d.type === A.Fragment) {
      s.push.apply(
        s,
        Kf(d.props.children, v)
      );
      return;
    }
    Mt(
      d.type === ci,
      `[${typeof d.type == "string" ? d.type : d.type.name}] is not a <Route> component. All component children of <Routes> must be a <Route> or <React.Fragment>`
    ), Mt(
      !d.props.index || !d.props.children,
      "An index route cannot have child routes."
    );
    let E = {
      id: d.props.id || v.join("-"),
      caseSensitive: d.props.caseSensitive,
      element: d.props.element,
      Component: d.props.Component,
      index: d.props.index,
      path: d.props.path,
      middleware: d.props.middleware,
      loader: d.props.loader,
      action: d.props.action,
      hydrateFallbackElement: d.props.hydrateFallbackElement,
      HydrateFallback: d.props.HydrateFallback,
      errorElement: d.props.errorElement,
      ErrorBoundary: d.props.ErrorBoundary,
      hasErrorBoundary: d.props.hasErrorBoundary === !0 || d.props.ErrorBoundary != null || d.props.errorElement != null,
      shouldRevalidate: d.props.shouldRevalidate,
      handle: d.props.handle,
      lazy: d.props.lazy
    };
    d.props.children && (E.children = Kf(
      d.props.children,
      v
    )), s.push(E);
  }), s;
}
var fi = "get", si = "application/x-www-form-urlencoded";
function vi(i) {
  return typeof HTMLElement != "undefined" && i instanceof HTMLElement;
}
function zp(i) {
  return vi(i) && i.tagName.toLowerCase() === "button";
}
function xp(i) {
  return vi(i) && i.tagName.toLowerCase() === "form";
}
function Rp(i) {
  return vi(i) && i.tagName.toLowerCase() === "input";
}
function Np(i) {
  return !!(i.metaKey || i.altKey || i.ctrlKey || i.shiftKey);
}
function Op(i, f) {
  return i.button === 0 && // Ignore everything but left clicks
  (!f || f === "_self") && // Let browser handle "target=_blank" etc.
  !Np(i);
}
function kf(i = "") {
  return new URLSearchParams(
    typeof i == "string" || Array.isArray(i) || i instanceof URLSearchParams ? i : Object.keys(i).reduce((f, s) => {
      let d = i[s];
      return f.concat(
        Array.isArray(d) ? d.map((r) => [s, r]) : [[s, d]]
      );
    }, [])
  );
}
function Mp(i, f) {
  let s = kf(i);
  return f && f.forEach((d, r) => {
    s.has(r) || f.getAll(r).forEach((v) => {
      s.append(r, v);
    });
  }), s;
}
var li = null;
function Dp() {
  if (li === null)
    try {
      new FormData(
        document.createElement("form"),
        // @ts-expect-error if FormData supports the submitter parameter, this will throw
        0
      ), li = !1;
    } catch (i) {
      li = !0;
    }
  return li;
}
var Cp = /* @__PURE__ */ new Set([
  "application/x-www-form-urlencoded",
  "multipart/form-data",
  "text/plain"
]);
function wf(i) {
  return i != null && !Cp.has(i) ? (Oe(
    !1,
    `"${i}" is not a valid \`encType\` for \`<Form>\`/\`<fetcher.Form>\` and will default to "${si}"`
  ), null) : i;
}
function Up(i, f) {
  let s, d, r, v, E;
  if (xp(i)) {
    let R = i.getAttribute("action");
    d = R ? ul(R, f) : null, s = i.getAttribute("method") || fi, r = wf(i.getAttribute("enctype")) || si, v = new FormData(i);
  } else if (zp(i) || Rp(i) && (i.type === "submit" || i.type === "image")) {
    let R = i.form;
    if (R == null)
      throw new Error(
        'Cannot submit a <button> or <input type="submit"> without a <form>'
      );
    let S = i.getAttribute("formaction") || R.getAttribute("action");
    if (d = S ? ul(S, f) : null, s = i.getAttribute("formmethod") || R.getAttribute("method") || fi, r = wf(i.getAttribute("formenctype")) || wf(R.getAttribute("enctype")) || si, v = new FormData(R, i), !Dp()) {
      let { name: y, type: M, value: x } = i;
      if (M === "image") {
        let U = y ? `${y}.` : "";
        v.append(`${U}x`, "0"), v.append(`${U}y`, "0");
      } else y && v.append(y, x);
    }
  } else {
    if (vi(i))
      throw new Error(
        'Cannot submit element that is not <form>, <button>, or <input type="submit|image">'
      );
    s = fi, d = null, r = si, E = i;
  }
  return v && r === "text/plain" && (E = v, v = void 0), { action: d, method: s.toLowerCase(), encType: r, formData: v, body: E };
}
Object.getOwnPropertyNames(Object.prototype).sort().join("\0");
function ls(i, f) {
  if (i === !1 || i === null || typeof i == "undefined")
    throw new Error(f);
}
function Hp(i, f, s, d) {
  let r = typeof i == "string" ? new URL(
    i,
    // This can be called during the SSR flow via PrefetchPageLinksImpl so
    // don't assume window is available
    typeof window == "undefined" ? "server://singlefetch/" : window.location.origin
  ) : i;
  return s ? r.pathname.endsWith("/") ? r.pathname = `${r.pathname}_.${d}` : r.pathname = `${r.pathname}.${d}` : r.pathname === "/" ? r.pathname = `_root.${d}` : f && ul(r.pathname, f) === "/" ? r.pathname = `${f.replace(/\/$/, "")}/_root.${d}` : r.pathname = `${r.pathname.replace(/\/$/, "")}.${d}`, r;
}
async function Bp(i, f) {
  if (i.id in f)
    return f[i.id];
  try {
    let s = await import(
      /* @vite-ignore */
      /* webpackIgnore: true */
      i.module
    );
    return f[i.id] = s, s;
  } catch (s) {
    return console.error(
      `Error loading route module \`${i.module}\`, reloading page...`
    ), console.error(s), window.__reactRouterContext && window.__reactRouterContext.isSpaMode, window.location.reload(), new Promise(() => {
    });
  }
}
function Lp(i) {
  return i == null ? !1 : i.href == null ? i.rel === "preload" && typeof i.imageSrcSet == "string" && typeof i.imageSizes == "string" : typeof i.rel == "string" && typeof i.href == "string";
}
async function qp(i, f, s) {
  let d = await Promise.all(
    i.map(async (r) => {
      let v = f.routes[r.route.id];
      if (v) {
        let E = await Bp(v, s);
        return E.links ? E.links() : [];
      }
      return [];
    })
  );
  return Qp(
    d.flat(1).filter(Lp).filter((r) => r.rel === "stylesheet" || r.rel === "preload").map(
      (r) => r.rel === "stylesheet" ? { ...r, rel: "prefetch", as: "style" } : { ...r, rel: "prefetch" }
    )
  );
}
function jh(i, f, s, d, r, v) {
  let E = (S, y) => s[y] ? S.route.id !== s[y].route.id : !0, R = (S, y) => {
    var M;
    return (
      // param change, /users/123 -> /users/456
      s[y].pathname !== S.pathname || // splat param changed, which is not present in match.path
      // e.g. /files/images/avatar.jpg -> files/finances.xls
      ((M = s[y].route.path) == null ? void 0 : M.endsWith("*")) && s[y].params["*"] !== S.params["*"]
    );
  };
  return v === "assets" ? f.filter(
    (S, y) => E(S, y) || R(S, y)
  ) : v === "data" ? f.filter((S, y) => {
    var x;
    let M = d.routes[S.route.id];
    if (!M || !M.hasLoader)
      return !1;
    if (E(S, y) || R(S, y))
      return !0;
    if (S.route.shouldRevalidate) {
      let U = S.route.shouldRevalidate({
        currentUrl: new URL(
          r.pathname + r.search + r.hash,
          window.origin
        ),
        currentParams: ((x = s[0]) == null ? void 0 : x.params) || {},
        nextUrl: new URL(i, window.origin),
        nextParams: S.params,
        defaultShouldRevalidate: !0
      });
      if (typeof U == "boolean")
        return U;
    }
    return !0;
  }) : [];
}
function Yp(i, f, { includeHydrateFallback: s } = {}) {
  return Gp(
    i.map((d) => {
      let r = f.routes[d.route.id];
      if (!r) return [];
      let v = [r.module];
      return r.clientActionModule && (v = v.concat(r.clientActionModule)), r.clientLoaderModule && (v = v.concat(r.clientLoaderModule)), s && r.hydrateFallbackModule && (v = v.concat(r.hydrateFallbackModule)), r.imports && (v = v.concat(r.imports)), v;
    }).flat(1)
  );
}
function Gp(i) {
  return [...new Set(i)];
}
function Xp(i) {
  let f = {}, s = Object.keys(i).sort();
  for (let d of s)
    f[d] = i[d];
  return f;
}
function Qp(i, f) {
  let s = /* @__PURE__ */ new Set();
  return new Set(f), i.reduce((d, r) => {
    let v = JSON.stringify(Xp(r));
    return s.has(v) || (s.add(v), d.push({ key: v, link: r })), d;
  }, []);
}
function Yh() {
  let i = A.useContext(Ba);
  return ls(
    i,
    "You must render this element inside a <DataRouterContext.Provider> element"
  ), i;
}
function Zp() {
  let i = A.useContext(mi);
  return ls(
    i,
    "You must render this element inside a <DataRouterStateContext.Provider> element"
  ), i;
}
var as = A.createContext(void 0);
as.displayName = "FrameworkContext";
function Gh() {
  let i = A.useContext(as);
  return ls(
    i,
    "You must render this element inside a <HydratedRouter> element"
  ), i;
}
function wp(i, f) {
  let s = A.useContext(as), [d, r] = A.useState(!1), [v, E] = A.useState(!1), { onFocus: R, onBlur: S, onMouseEnter: y, onMouseLeave: M, onTouchStart: x } = f, U = A.useRef(null);
  A.useEffect(() => {
    if (i === "render" && E(!0), i === "viewport") {
      let Q = (Y) => {
        Y.forEach(($) => {
          E($.isIntersecting);
        });
      }, X = new IntersectionObserver(Q, { threshold: 0.5 });
      return U.current && X.observe(U.current), () => {
        X.disconnect();
      };
    }
  }, [i]), A.useEffect(() => {
    if (d) {
      let Q = setTimeout(() => {
        E(!0);
      }, 100);
      return () => {
        clearTimeout(Q);
      };
    }
  }, [d]);
  let K = () => {
    r(!0);
  }, J = () => {
    r(!1), E(!1);
  };
  return s ? i !== "intent" ? [v, U, {}] : [
    v,
    U,
    {
      onFocus: Un(R, K),
      onBlur: Un(S, J),
      onMouseEnter: Un(y, K),
      onMouseLeave: Un(M, J),
      onTouchStart: Un(x, K)
    }
  ] : [!1, U, {}];
}
function Un(i, f) {
  return (s) => {
    i && i(s), s.defaultPrevented || f(s);
  };
}
function Vp({ page: i, ...f }) {
  let { router: s } = Yh(), d = A.useMemo(
    () => zh(s.routes, i, s.basename),
    [s.routes, i, s.basename]
  );
  return d ? /* @__PURE__ */ A.createElement(Kp, { page: i, matches: d, ...f }) : null;
}
function Jp(i) {
  let { manifest: f, routeModules: s } = Gh(), [d, r] = A.useState([]);
  return A.useEffect(() => {
    let v = !1;
    return qp(i, f, s).then(
      (E) => {
        v || r(E);
      }
    ), () => {
      v = !0;
    };
  }, [i, f, s]), d;
}
function Kp({
  page: i,
  matches: f,
  ...s
}) {
  let d = Ge(), { future: r, manifest: v, routeModules: E } = Gh(), { basename: R } = Yh(), { loaderData: S, matches: y } = Zp(), M = A.useMemo(
    () => jh(
      i,
      f,
      y,
      v,
      d,
      "data"
    ),
    [i, f, y, v, d]
  ), x = A.useMemo(
    () => jh(
      i,
      f,
      y,
      v,
      d,
      "assets"
    ),
    [i, f, y, v, d]
  ), U = A.useMemo(() => {
    if (i === d.pathname + d.search + d.hash)
      return [];
    let Q = /* @__PURE__ */ new Set(), X = !1;
    if (f.forEach(($) => {
      var at;
      let I = v.routes[$.route.id];
      !I || !I.hasLoader || (!M.some((st) => st.route.id === $.route.id) && $.route.id in S && ((at = E[$.route.id]) != null && at.shouldRevalidate) || I.hasClientLoader ? X = !0 : Q.add($.route.id));
    }), Q.size === 0)
      return [];
    let Y = Hp(
      i,
      R,
      r.unstable_trailingSlashAwareDataRequests,
      "data"
    );
    return X && Q.size > 0 && Y.searchParams.set(
      "_routes",
      f.filter(($) => Q.has($.route.id)).map(($) => $.route.id).join(",")
    ), [Y.pathname + Y.search];
  }, [
    R,
    r.unstable_trailingSlashAwareDataRequests,
    S,
    d,
    v,
    M,
    f,
    i,
    E
  ]), K = A.useMemo(
    () => Yp(x, v),
    [x, v]
  ), J = Jp(x);
  return /* @__PURE__ */ A.createElement(A.Fragment, null, U.map((Q) => /* @__PURE__ */ A.createElement("link", { key: Q, rel: "prefetch", as: "fetch", href: Q, ...s })), K.map((Q) => /* @__PURE__ */ A.createElement("link", { key: Q, rel: "modulepreload", href: Q, ...s })), J.map(({ key: Q, link: X }) => {
    var Y;
    return (
      // these don't spread `linkProps` because they are full link descriptors
      // already with their own props
      /* @__PURE__ */ A.createElement(
        "link",
        {
          key: Q,
          nonce: s.nonce,
          ...X,
          crossOrigin: (Y = X.crossOrigin) != null ? Y : s.crossOrigin
        }
      )
    );
  }));
}
function kp(...i) {
  return (f) => {
    i.forEach((s) => {
      typeof s == "function" ? s(f) : s != null && (s.current = f);
    });
  };
}
var Fp = typeof window != "undefined" && typeof window.document != "undefined" && typeof window.document.createElement != "undefined";
try {
  Fp && (window.__reactRouterVersion = // @ts-expect-error
  "7.13.2");
} catch (i) {
}
function $p({
  basename: i,
  children: f,
  unstable_useTransitions: s,
  window: d
}) {
  let r = A.useRef();
  r.current == null && (r.current = xv({ window: d, v5Compat: !0 }));
  let v = r.current, [E, R] = A.useState({
    action: v.action,
    location: v.location
  }), S = A.useCallback(
    (y) => {
      s === !1 ? R(y) : A.startTransition(() => R(y));
    },
    [s]
  );
  return A.useLayoutEffect(() => v.listen(S), [v, S]), /* @__PURE__ */ A.createElement(
    _p,
    {
      basename: i,
      children: f,
      location: E.location,
      navigationType: E.action,
      navigator: v,
      unstable_useTransitions: s
    }
  );
}
var Xh = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i, $l = A.forwardRef(
  function({
    onClick: f,
    discover: s = "render",
    prefetch: d = "none",
    relative: r,
    reloadDocument: v,
    replace: E,
    unstable_mask: R,
    state: S,
    target: y,
    to: M,
    preventScrollReset: x,
    viewTransition: U,
    unstable_defaultShouldRevalidate: K,
    ...J
  }, Q) {
    let { basename: X, navigator: Y, unstable_useTransitions: $ } = A.useContext(Se), I = typeof M == "string" && Xh.test(M), at = Oh(M, X);
    M = at.to;
    let st = cp(M, { relative: r }), ht = Ge(), mt = null;
    if (R) {
      let nt = hi(
        R,
        [],
        ht.unstable_mask ? ht.unstable_mask.pathname : "/",
        !0
      );
      X !== "/" && (nt.pathname = nt.pathname === "/" ? X : Ye([X, nt.pathname])), mt = Y.createHref(nt);
    }
    let [tt, zt, Qt] = wp(
      d,
      J
    ), ce = t0(M, {
      replace: E,
      unstable_mask: R,
      state: S,
      target: y,
      preventScrollReset: x,
      relative: r,
      viewTransition: U,
      unstable_defaultShouldRevalidate: K,
      unstable_useTransitions: $
    });
    function B(nt) {
      f && f(nt), nt.defaultPrevented || ce(nt);
    }
    let Ut = !(at.isExternal || v), w = (
      // eslint-disable-next-line jsx-a11y/anchor-has-content
      /* @__PURE__ */ A.createElement(
        "a",
        {
          ...J,
          ...Qt,
          href: (Ut ? mt : void 0) || at.absoluteURL || st,
          onClick: Ut ? B : f,
          ref: kp(Q, zt),
          target: y,
          "data-discover": !I && s === "render" ? "true" : void 0
        }
      )
    );
    return tt && !I ? /* @__PURE__ */ A.createElement(A.Fragment, null, w, /* @__PURE__ */ A.createElement(Vp, { page: st })) : w;
  }
);
$l.displayName = "Link";
var Wp = A.forwardRef(
  function({
    "aria-current": f = "page",
    caseSensitive: s = !1,
    className: d = "",
    end: r = !1,
    style: v,
    to: E,
    viewTransition: R,
    children: S,
    ...y
  }, M) {
    let x = Ln(E, { relative: y.relative }), U = Ge(), K = A.useContext(mi), { navigator: J, basename: Q } = A.useContext(Se), X = K != null && // Conditional usage is OK here because the usage of a data router is static
    // eslint-disable-next-line react-hooks/rules-of-hooks
    i0(x) && R === !0, Y = J.encodeLocation ? J.encodeLocation(x).pathname : x.pathname, $ = U.pathname, I = K && K.navigation && K.navigation.location ? K.navigation.location.pathname : null;
    s || ($ = $.toLowerCase(), I = I ? I.toLowerCase() : null, Y = Y.toLowerCase()), I && Q && (I = ul(I, Q) || I);
    const at = Y !== "/" && Y.endsWith("/") ? Y.length - 1 : Y.length;
    let st = $ === Y || !r && $.startsWith(Y) && $.charAt(at) === "/", ht = I != null && (I === Y || !r && I.startsWith(Y) && I.charAt(Y.length) === "/"), mt = {
      isActive: st,
      isPending: ht,
      isTransitioning: X
    }, tt = st ? f : void 0, zt;
    typeof d == "function" ? zt = d(mt) : zt = [
      d,
      st ? "active" : null,
      ht ? "pending" : null,
      X ? "transitioning" : null
    ].filter(Boolean).join(" ");
    let Qt = typeof v == "function" ? v(mt) : v;
    return /* @__PURE__ */ A.createElement(
      $l,
      {
        ...y,
        "aria-current": tt,
        className: zt,
        ref: M,
        style: Qt,
        to: E,
        viewTransition: R
      },
      typeof S == "function" ? S(mt) : S
    );
  }
);
Wp.displayName = "NavLink";
var Ip = A.forwardRef(
  ({
    discover: i = "render",
    fetcherKey: f,
    navigate: s,
    reloadDocument: d,
    replace: r,
    state: v,
    method: E = fi,
    action: R,
    onSubmit: S,
    relative: y,
    preventScrollReset: M,
    viewTransition: x,
    unstable_defaultShouldRevalidate: U,
    ...K
  }, J) => {
    let { unstable_useTransitions: Q } = A.useContext(Se), X = n0(), Y = u0(R, { relative: y }), $ = E.toLowerCase() === "get" ? "get" : "post", I = typeof R == "string" && Xh.test(R), at = (st) => {
      if (S && S(st), st.defaultPrevented) return;
      st.preventDefault();
      let ht = st.nativeEvent.submitter, mt = (ht == null ? void 0 : ht.getAttribute("formmethod")) || E, tt = () => X(ht || st.currentTarget, {
        fetcherKey: f,
        method: mt,
        navigate: s,
        replace: r,
        state: v,
        relative: y,
        preventScrollReset: M,
        viewTransition: x,
        unstable_defaultShouldRevalidate: U
      });
      Q && s !== !1 ? A.startTransition(() => tt()) : tt();
    };
    return /* @__PURE__ */ A.createElement(
      "form",
      {
        ref: J,
        method: $,
        action: Y,
        onSubmit: d ? S : at,
        ...K,
        "data-discover": !I && i === "render" ? "true" : void 0
      }
    );
  }
);
Ip.displayName = "Form";
function Pp(i) {
  return `${i} must be used within a data router.  See https://reactrouter.com/en/main/routers/picking-a-router.`;
}
function Qh(i) {
  let f = A.useContext(Ba);
  return Mt(f, Pp(i)), f;
}
function t0(i, {
  target: f,
  replace: s,
  unstable_mask: d,
  state: r,
  preventScrollReset: v,
  relative: E,
  viewTransition: R,
  unstable_defaultShouldRevalidate: S,
  unstable_useTransitions: y
} = {}) {
  let M = yi(), x = Ge(), U = Ln(i, { relative: E });
  return A.useCallback(
    (K) => {
      if (Op(K, f)) {
        K.preventDefault();
        let J = s !== void 0 ? s : Hn(x) === Hn(U), Q = () => M(i, {
          replace: J,
          unstable_mask: d,
          state: r,
          preventScrollReset: v,
          relative: E,
          viewTransition: R,
          unstable_defaultShouldRevalidate: S
        });
        y ? A.startTransition(() => Q()) : Q();
      }
    },
    [
      x,
      M,
      U,
      s,
      d,
      r,
      f,
      i,
      v,
      E,
      R,
      S,
      y
    ]
  );
}
function e0(i) {
  Oe(
    typeof URLSearchParams != "undefined",
    "You cannot use the `useSearchParams` hook in a browser that does not support the URLSearchParams API. If you need to support Internet Explorer 11, we recommend you load a polyfill such as https://github.com/ungap/url-search-params."
  );
  let f = A.useRef(kf(i)), s = A.useRef(!1), d = Ge(), r = A.useMemo(
    () => (
      // Only merge in the defaults if we haven't yet called setSearchParams.
      // Once we call that we want those to take precedence, otherwise you can't
      // remove a param with setSearchParams({}) if it has an initial value
      Mp(
        d.search,
        s.current ? null : f.current
      )
    ),
    [d.search]
  ), v = yi(), E = A.useCallback(
    (R, S) => {
      const y = kf(
        typeof R == "function" ? R(new URLSearchParams(r)) : R
      );
      s.current = !0, v("?" + y, S);
    },
    [v, r]
  );
  return [r, E];
}
var l0 = 0, a0 = () => `__${String(++l0)}__`;
function n0() {
  let { router: i } = Qh(
    "useSubmit"
    /* UseSubmit */
  ), { basename: f } = A.useContext(Se), s = Sp(), d = i.fetch, r = i.navigate;
  return A.useCallback(
    async (v, E = {}) => {
      let { action: R, method: S, encType: y, formData: M, body: x } = Up(
        v,
        f
      );
      if (E.navigate === !1) {
        let U = E.fetcherKey || a0();
        await d(U, s, E.action || R, {
          unstable_defaultShouldRevalidate: E.unstable_defaultShouldRevalidate,
          preventScrollReset: E.preventScrollReset,
          formData: M,
          body: x,
          formMethod: E.method || S,
          formEncType: E.encType || y,
          flushSync: E.flushSync
        });
      } else
        await r(E.action || R, {
          unstable_defaultShouldRevalidate: E.unstable_defaultShouldRevalidate,
          preventScrollReset: E.preventScrollReset,
          formData: M,
          body: x,
          formMethod: E.method || S,
          formEncType: E.encType || y,
          replace: E.replace,
          state: E.state,
          fromRouteId: s,
          flushSync: E.flushSync,
          viewTransition: E.viewTransition
        });
    },
    [d, r, f, s]
  );
}
function u0(i, { relative: f } = {}) {
  let { basename: s } = A.useContext(Se), d = A.useContext(Ue);
  Mt(d, "useFormAction must be used inside a RouteContext");
  let [r] = d.matches.slice(-1), v = { ...Ln(i || ".", { relative: f }) }, E = Ge();
  if (i == null) {
    v.search = E.search;
    let R = new URLSearchParams(v.search), S = R.getAll("index");
    if (S.some((M) => M === "")) {
      R.delete("index"), S.filter((x) => x).forEach((x) => R.append("index", x));
      let M = R.toString();
      v.search = M ? `?${M}` : "";
    }
  }
  return (!i || i === ".") && r.route.index && (v.search = v.search ? v.search.replace(/^\?/, "?index&") : "?index"), s !== "/" && (v.pathname = v.pathname === "/" ? s : Ye([s, v.pathname])), Hn(v);
}
function i0(i, { relative: f } = {}) {
  let s = A.useContext(Dh);
  Mt(
    s != null,
    "`useViewTransitionState` must be used within `react-router-dom`'s `RouterProvider`.  Did you accidentally import `RouterProvider` from `react-router`?"
  );
  let { basename: d } = Qh(
    "useViewTransitionState"
    /* useViewTransitionState */
  ), r = Ln(i, { relative: f });
  if (!s.isTransitioning)
    return !1;
  let v = ul(s.currentLocation.pathname, d) || s.currentLocation.pathname, E = ul(s.nextLocation.pathname, d) || s.nextLocation.pathname;
  return oi(r.pathname, E) != null || oi(r.pathname, v) != null;
}
const Zh = (i) => i.length === 0 ? "/jobs" : i.startsWith("/") ? i : "/" + i, c0 = (i) => {
  const f = Zh(i);
  return "/login?redirect-to=" + encodeURIComponent(f);
}, wh = () => {
  const i = window.PUBLIC_JOBS_BOOT || {}, f = Zh(i.currentPath || window.location.pathname || "/jobs");
  return {
    appName: i.appName || "CareVerse HQ",
    logo: i.logo || "/assets/careverse_hq/images/logo.svg",
    currentYear: Number(i.currentYear) || (/* @__PURE__ */ new Date()).getFullYear(),
    csrfToken: i.csrfToken || window.csrf_token || "",
    isAuthenticated: !!i.isAuthenticated,
    hasAdminAccess: !!i.hasAdminAccess,
    userFullName: i.userFullName,
    userInitials: i.userInitials,
    userEmail: i.userEmail,
    userRoleLabel: i.userRoleLabel,
    adminCentralLink: i.adminCentralLink || "/admin-central",
    profileLink: i.profileLink || "/admin-central#profile",
    signInLink: i.signInLink || c0(f),
    currentPath: f,
    jobSlug: i.jobSlug
  };
};
function f0({ boot: i }) {
  return /* @__PURE__ */ h.jsx("footer", { className: "pj-footer", children: /* @__PURE__ */ h.jsxs("div", { className: "pj-shell pj-footer-inner", children: [
    /* @__PURE__ */ h.jsxs("p", { className: "pj-footer-copy", children: [
      "© ",
      i.currentYear,
      " ",
      i.appName,
      ". All rights reserved."
    ] }),
    /* @__PURE__ */ h.jsxs("div", { className: "pj-footer-links", children: [
      /* @__PURE__ */ h.jsx("a", { href: "/jobs", children: "Jobs Board" }),
      i.hasAdminAccess ? /* @__PURE__ */ h.jsx("a", { href: i.adminCentralLink, children: "Admin Central" }) : null,
      /* @__PURE__ */ h.jsx("a", { href: "/login", children: "Sign In" })
    ] })
  ] }) });
}
const s0 = (i, f) => {
  const s = (i || f || "CV").trim();
  if (s.length === 0) return "CV";
  const d = s.split(/\s+/).filter(Boolean);
  return d.length === 1 ? d[0].slice(0, 2).toUpperCase() : (d[0][0] + d[d.length - 1][0]).toUpperCase();
}, r0 = async () => {
  const i = { Accept: "application/json" };
  window.csrf_token && (i["X-Frappe-CSRF-Token"] = window.csrf_token);
  try {
    await fetch("/api/method/logout", {
      method: "POST",
      credentials: "same-origin",
      headers: i
    });
  } catch (f) {
  }
  window.location.href = "/jobs";
};
function o0({ boot: i }) {
  const f = A.useMemo(() => s0(i.userFullName, i.userEmail), [i.userEmail, i.userFullName]);
  return /* @__PURE__ */ h.jsx("header", { className: "pj-header", children: /* @__PURE__ */ h.jsxs("div", { className: "pj-shell pj-header-inner", children: [
    /* @__PURE__ */ h.jsxs("a", { href: "/jobs", className: "pj-brand-link", "aria-label": i.appName + " jobs board", children: [
      /* @__PURE__ */ h.jsx("span", { className: "pj-brand-mark", children: /* @__PURE__ */ h.jsx("img", { src: i.logo, alt: i.appName }) }),
      /* @__PURE__ */ h.jsxs("span", { className: "pj-brand-copy", children: [
        /* @__PURE__ */ h.jsx("span", { className: "pj-brand-title", children: i.appName }),
        /* @__PURE__ */ h.jsx("span", { className: "pj-brand-subtitle", children: "Public Jobs Board" })
      ] })
    ] }),
    /* @__PURE__ */ h.jsx("div", { className: "pj-header-actions", children: i.isAuthenticated ? /* @__PURE__ */ h.jsxs(h.Fragment, { children: [
      i.hasAdminAccess ? /* @__PURE__ */ h.jsx("a", { className: "pj-btn pj-btn-ghost", href: i.adminCentralLink, children: "Back to Admin Central" }) : null,
      /* @__PURE__ */ h.jsx("a", { className: "pj-btn pj-btn-ghost", href: i.profileLink, children: "My Profile" }),
      /* @__PURE__ */ h.jsxs("button", { type: "button", className: "pj-user-chip", onClick: () => {
        r0();
      }, children: [
        /* @__PURE__ */ h.jsx("span", { className: "pj-user-avatar", children: i.userInitials || f }),
        /* @__PURE__ */ h.jsxs("span", { className: "pj-user-meta", children: [
          /* @__PURE__ */ h.jsx("span", { className: "pj-user-name", children: i.userFullName || i.userEmail || "Signed in user" }),
          /* @__PURE__ */ h.jsx("span", { className: "pj-user-role", children: i.userRoleLabel || "Signed-in applicant" })
        ] }),
        /* @__PURE__ */ h.jsx("span", { className: "pj-user-action", children: "Sign Out" })
      ] })
    ] }) : /* @__PURE__ */ h.jsx("a", { className: "pj-btn pj-btn-primary", href: i.signInLink, children: "Sign In" }) })
  ] }) });
}
const ai = "/api/method/careverse_hq.api.public_jobs", ni = (i) => {
  if (i && typeof i == "object") {
    const f = i;
    return f.message && typeof f.message == "object" ? f.message : f;
  }
  return {};
}, ui = async (i) => {
  try {
    return await i.json();
  } catch (f) {
    return {};
  }
}, ii = (i, f, s) => {
  if (i.ok && f.status === "success")
    return f;
  throw new Error(f.message || s);
}, Th = (i) => {
  const f = new URLSearchParams();
  return Object.entries(i).forEach(([s, d]) => {
    if (d === void 0) return;
    const r = String(d).trim();
    r.length !== 0 && f.set(s, r);
  }), f.toString();
}, di = {
  async getFilterOptions() {
    const i = await fetch(ai + ".get_job_filter_options", {
      method: "GET",
      credentials: "same-origin",
      headers: { Accept: "application/json" }
    }), f = ni(await ui(i));
    return ii(i, f, "Failed to load filter options").data || { locations: [], employment_types: [], designations: [], companies: [] };
  },
  async getJobs(i) {
    const f = Th(i), s = await fetch(ai + ".get_public_jobs" + (f ? "?" + f : ""), {
      method: "GET",
      credentials: "same-origin",
      headers: { Accept: "application/json" }
    }), d = ni(await ui(s)), r = ii(s, d, "Failed to load jobs");
    return {
      jobs: r.data && Array.isArray(r.data.jobs) ? r.data.jobs : [],
      pagination: r.pagination || { current_page: 1, per_page: 20, total_count: 0 }
    };
  },
  async getJobDetail(i) {
    const f = Th({ slug: i }), s = await fetch(ai + ".get_public_job_detail?" + f, {
      method: "GET",
      credentials: "same-origin",
      headers: { Accept: "application/json" }
    }), d = ni(await ui(s));
    return ii(s, d, "Failed to load job detail").data || {};
  },
  async submitApplication(i) {
    const f = {
      Accept: "application/json",
      "Content-Type": "application/json"
    };
    window.csrf_token && (f["X-Frappe-CSRF-Token"] = window.csrf_token);
    const s = await fetch(ai + ".submit_application", {
      method: "POST",
      credentials: "same-origin",
      headers: f,
      body: JSON.stringify(i)
    }), d = ni(await ui(s));
    return ii(s, d, "Failed to submit application").data || {};
  }
};
function ri({
  title: i,
  description: f,
  message: s,
  tone: d = "neutral",
  actionLabel: r,
  onAction: v
}) {
  const E = (f || s || "").trim();
  return /* @__PURE__ */ h.jsxs("div", { className: "pj-state-panel pj-state-panel-" + d, role: d === "error" ? "alert" : "status", children: [
    /* @__PURE__ */ h.jsxs("div", { className: "pj-state-panel-copy", children: [
      /* @__PURE__ */ h.jsx("strong", { children: i }),
      E ? /* @__PURE__ */ h.jsx("p", { children: E }) : null
    ] }),
    r && v ? /* @__PURE__ */ h.jsx("button", { type: "button", className: "pj-btn pj-btn-primary", onClick: v, children: r }) : null
  ] });
}
const Vh = (i) => (i.job_title || i.designation || i.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+/, "").replace(/-+$/, "") + "-" + i.name, Ff = (i) => {
  if (i == null || i === "") return "";
  const f = new Date(i);
  return Number.isNaN(f.getTime()) ? String(i) : f.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}, Jh = (i) => {
  const f = typeof i.lower_range == "number" ? i.lower_range : void 0, s = typeof i.upper_range == "number" ? i.upper_range : void 0, d = i.currency || "", r = i.salary_per ? " / " + i.salary_per.toLowerCase() : "";
  return f === void 0 && s === void 0 ? "" : f !== void 0 && s !== void 0 ? d + " " + f.toLocaleString() + " - " + s.toLocaleString() + r : f !== void 0 ? "From " + d + " " + f.toLocaleString() + r : "Up to " + d + " " + String(s) + r;
}, Kh = (i) => {
  if (i == null || i === "")
    return { label: "Rolling review", tone: "rolling", closed: !1 };
  const f = new Date(i);
  if (Number.isNaN(f.getTime()))
    return { label: "Deadline set", tone: "neutral", closed: !1 };
  const s = /* @__PURE__ */ new Date();
  s.setHours(0, 0, 0, 0), f.setHours(0, 0, 0, 0);
  const d = Math.floor((f.getTime() - s.getTime()) / 864e5);
  return d < 0 ? { label: "Closed", tone: "today", closed: !0 } : d === 0 ? { label: "Closes today", tone: "today", closed: !1 } : d <= 7 ? { label: "Closes in " + d + " days", tone: "soon", closed: !1 } : { label: "Closes in " + d + " days", tone: "neutral", closed: !1 };
}, d0 = (i) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(i), h0 = (i) => {
  try {
    const f = new URL(i);
    return f.protocol === "http:" || f.protocol === "https:";
  } catch (f) {
    return !1;
  }
}, m0 = /^\+?[0-9][0-9\s().-]{5,31}$/, y0 = {
  applicant_name: "",
  email_id: "",
  phone: "",
  resume_link: "",
  cover_letter: "",
  consent_given: !1,
  website: ""
}, _h = () => {
  const i = wh();
  return {
    ...y0,
    applicant_name: i.userFullName || "",
    email_id: i.userEmail || ""
  };
};
function v0() {
  const { jobSlug: i = "" } = sp(), f = yi(), [s, d] = A.useState(null), [r, v] = A.useState(!0), [E, R] = A.useState(""), [S, y] = A.useState(_h), [M, x] = A.useState(""), [U, K] = A.useState(!1), [J, Q] = A.useState(!1), [X, Y] = A.useState(1), [$, I] = A.useState(0);
  A.useEffect(() => {
    let w = !1;
    return (async () => {
      if (i.trim().length === 0) {
        R("Job not found."), v(!1);
        return;
      }
      v(!0), R("");
      try {
        const L = await di.getJobDetail(i);
        if (w) return;
        d(L);
      } catch (L) {
        if (w) return;
        const H = L instanceof Error ? L.message : "Failed to load job details.";
        R(H), d(null);
      } finally {
        w === !1 && v(!1);
      }
    })(), () => {
      w = !0;
    };
  }, [i, $]), A.useEffect(() => {
    s && (s.job_title || s.designation) && (document.title = (s.job_title || s.designation || "Job Details") + " - CareVerse HQ");
  }, [s]);
  const at = A.useMemo(() => Kh(s == null ? void 0 : s.closes_on), [s == null ? void 0 : s.closes_on]), st = !!(s && s.status === "Open" && at.closed === !1), ht = (w, nt) => {
    y((L) => ({ ...L, [w]: nt }));
  }, mt = () => {
    const w = S.applicant_name.trim(), nt = S.email_id.trim();
    return w.length === 0 || nt.length === 0 ? (x("Please provide your full name and email."), !1) : w.length > 140 ? (x("Full name must be 140 characters or fewer."), !1) : d0(nt) === !1 ? (x("Please provide a valid email address."), !1) : (x(""), !0);
  }, tt = () => S.phone.trim().length > 0 && m0.test(S.phone.trim()) === !1 ? (x("Please provide a valid phone number."), !1) : S.resume_link.trim().length > 0 && h0(S.resume_link.trim()) === !1 ? (x("Resume link must start with http:// or https://"), !1) : S.consent_given === !1 ? (x("You must consent before submitting your application."), !1) : (x(""), !0), zt = () => {
    mt() && Y(2);
  }, Qt = () => {
    Y(1), x("");
  }, ce = () => {
    I((w) => w + 1);
  }, B = async (w) => {
    if (w.preventDefault(), s === null || st === !1) {
      x("Applications are currently unavailable for this role.");
      return;
    }
    if (mt() === !1) {
      Y(1);
      return;
    }
    if (tt() === !1) {
      Y(2);
      return;
    }
    const nt = {
      job_opening: s.name,
      applicant_name: S.applicant_name.trim(),
      email_id: S.email_id.trim(),
      phone: S.phone.trim() || void 0,
      resume_link: S.resume_link.trim() || void 0,
      cover_letter: S.cover_letter.trim() || void 0,
      consent_given: 1,
      website: S.website.trim() || void 0
    };
    K(!0), x("");
    try {
      await di.submitApplication(nt), Q(!0), y(_h());
    } catch (L) {
      const H = L instanceof Error ? L.message : "Failed to submit application.";
      x(H);
    } finally {
      K(!1);
    }
  };
  if (r)
    return /* @__PURE__ */ h.jsx("main", { className: "pj-main pj-shell", children: /* @__PURE__ */ h.jsxs("div", { className: "pj-detail-loading-shell", "aria-busy": "true", children: [
      /* @__PURE__ */ h.jsxs("div", { className: "pj-breadcrumbs", children: [
        /* @__PURE__ */ h.jsx($l, { to: "/", children: "Jobs Board" }),
        /* @__PURE__ */ h.jsx("span", { children: " / " }),
        /* @__PURE__ */ h.jsx("span", { children: "Loading role" })
      ] }),
      /* @__PURE__ */ h.jsxs("section", { className: "pj-detail-hero", children: [
        /* @__PURE__ */ h.jsxs("div", { className: "pj-loading-block", children: [
          /* @__PURE__ */ h.jsx("div", { className: "pj-skeleton-chip" }),
          /* @__PURE__ */ h.jsx("div", { className: "pj-skeleton-title" }),
          /* @__PURE__ */ h.jsx("div", { className: "pj-skeleton-line" })
        ] }),
        /* @__PURE__ */ h.jsx("div", { className: "pj-skeleton-chip" })
      ] }),
      /* @__PURE__ */ h.jsxs("section", { className: "pj-detail-grid", children: [
        /* @__PURE__ */ h.jsx("article", { className: "pj-detail-card", children: /* @__PURE__ */ h.jsxs("div", { className: "pj-state-panel pj-state-panel-neutral pj-skeleton-panel", children: [
          /* @__PURE__ */ h.jsxs("div", { className: "pj-state-panel-copy", children: [
            /* @__PURE__ */ h.jsx("strong", { children: "Loading role details" }),
            /* @__PURE__ */ h.jsx("p", { children: "Fetching the posting, description, and related openings." })
          ] }),
          /* @__PURE__ */ h.jsx("div", { className: "pj-skeleton-line" })
        ] }) }),
        /* @__PURE__ */ h.jsx("aside", { className: "pj-detail-card", children: /* @__PURE__ */ h.jsxs("div", { className: "pj-skeleton-card", children: [
          /* @__PURE__ */ h.jsx("div", { className: "pj-skeleton-title" }),
          /* @__PURE__ */ h.jsx("div", { className: "pj-skeleton-line" }),
          /* @__PURE__ */ h.jsx("div", { className: "pj-skeleton-line short" })
        ] }) })
      ] })
    ] }) });
  if (E.length > 0 || s === null)
    return /* @__PURE__ */ h.jsxs("main", { className: "pj-main pj-shell", children: [
      /* @__PURE__ */ h.jsxs("div", { className: "pj-breadcrumbs", children: [
        /* @__PURE__ */ h.jsx($l, { to: "/", children: "Jobs Board" }),
        /* @__PURE__ */ h.jsx("span", { children: " / " }),
        /* @__PURE__ */ h.jsx("span", { children: "Unavailable role" })
      ] }),
      /* @__PURE__ */ h.jsx("section", { className: "pj-detail-hero", children: /* @__PURE__ */ h.jsxs("div", { children: [
        /* @__PURE__ */ h.jsx("p", { className: "pj-eyebrow", children: "Public Healthcare Hiring" }),
        /* @__PURE__ */ h.jsx("h1", { children: "Role unavailable" }),
        /* @__PURE__ */ h.jsx("p", { className: "pj-detail-subtitle", children: "The requested opening could not be loaded from the public jobs board." })
      ] }) }),
      /* @__PURE__ */ h.jsxs("section", { className: "pj-detail-grid", children: [
        /* @__PURE__ */ h.jsx("article", { className: "pj-detail-card", children: /* @__PURE__ */ h.jsx(
          ri,
          {
            tone: "error",
            title: "Could not load job detail",
            description: E || "Job not found.",
            actionLabel: "Retry detail",
            onAction: ce
          }
        ) }),
        /* @__PURE__ */ h.jsxs("aside", { className: "pj-detail-card", children: [
          /* @__PURE__ */ h.jsx("h2", { children: "What you can do" }),
          /* @__PURE__ */ h.jsx("p", { className: "pj-copy", children: "Return to the jobs board and continue browsing other openings." }),
          /* @__PURE__ */ h.jsx("div", { className: "pj-inline-actions", children: /* @__PURE__ */ h.jsx("button", { type: "button", className: "pj-btn pj-btn-primary", onClick: () => f("/"), children: "Back to Jobs Board" }) })
        ] })
      ] })
    ] });
  const Ut = Jh(s);
  return /* @__PURE__ */ h.jsxs("main", { className: "pj-main pj-shell", children: [
    /* @__PURE__ */ h.jsxs("div", { className: "pj-breadcrumbs", children: [
      /* @__PURE__ */ h.jsx($l, { to: "/", children: "Jobs Board" }),
      /* @__PURE__ */ h.jsx("span", { children: " / " }),
      /* @__PURE__ */ h.jsx("span", { children: s.job_title || s.designation || "Role Details" })
    ] }),
    /* @__PURE__ */ h.jsxs("section", { className: "pj-detail-hero", children: [
      /* @__PURE__ */ h.jsxs("div", { children: [
        /* @__PURE__ */ h.jsx("p", { className: "pj-eyebrow", children: s.company || "Healthcare Facility" }),
        /* @__PURE__ */ h.jsx("h1", { children: s.job_title || s.designation || "Open role" }),
        /* @__PURE__ */ h.jsx("p", { className: "pj-detail-subtitle", children: [s.location, s.employment_type, s.designation].filter(Boolean).join(" • ") || "Published healthcare opportunity" })
      ] }),
      /* @__PURE__ */ h.jsx("span", { className: "pj-deadline " + at.tone, children: at.label })
    ] }),
    /* @__PURE__ */ h.jsxs("section", { className: "pj-detail-grid", children: [
      /* @__PURE__ */ h.jsxs("article", { className: "pj-detail-card", children: [
        /* @__PURE__ */ h.jsx("h2", { children: "Role Overview" }),
        /* @__PURE__ */ h.jsxs("div", { className: "pj-fact-grid", children: [
          /* @__PURE__ */ h.jsxs("div", { children: [
            /* @__PURE__ */ h.jsx("span", { children: "Facility" }),
            /* @__PURE__ */ h.jsx("strong", { children: s.company || "Not specified" })
          ] }),
          /* @__PURE__ */ h.jsxs("div", { children: [
            /* @__PURE__ */ h.jsx("span", { children: "Location" }),
            /* @__PURE__ */ h.jsx("strong", { children: s.location || "Not specified" })
          ] }),
          /* @__PURE__ */ h.jsxs("div", { children: [
            /* @__PURE__ */ h.jsx("span", { children: "Employment Type" }),
            /* @__PURE__ */ h.jsx("strong", { children: s.employment_type || "Not specified" })
          ] }),
          /* @__PURE__ */ h.jsxs("div", { children: [
            /* @__PURE__ */ h.jsx("span", { children: "Compensation" }),
            /* @__PURE__ */ h.jsx("strong", { children: Ut || "Shared during hiring process" })
          ] }),
          /* @__PURE__ */ h.jsxs("div", { children: [
            /* @__PURE__ */ h.jsx("span", { children: "Posted" }),
            /* @__PURE__ */ h.jsx("strong", { children: Ff(s.posted_on) || "—" })
          ] }),
          /* @__PURE__ */ h.jsxs("div", { children: [
            /* @__PURE__ */ h.jsx("span", { children: "Deadline" }),
            /* @__PURE__ */ h.jsx("strong", { children: Ff(s.closes_on) || "Rolling review" })
          ] })
        ] }),
        /* @__PURE__ */ h.jsx("h3", { children: "Description" }),
        s.description_html ? /* @__PURE__ */ h.jsx("div", { className: "pj-rich-copy", dangerouslySetInnerHTML: { __html: s.description_html } }) : /* @__PURE__ */ h.jsx("p", { className: "pj-copy", children: s.description || "The employer has not added more detail for this role yet." })
      ] }),
      /* @__PURE__ */ h.jsxs("aside", { className: "pj-detail-card", children: [
        /* @__PURE__ */ h.jsx("h2", { children: "Apply" }),
        st ? /* @__PURE__ */ h.jsx(h.Fragment, { children: J ? /* @__PURE__ */ h.jsx("div", { className: "pj-success", children: "Your application has been submitted successfully." }) : /* @__PURE__ */ h.jsxs("form", { className: "pj-form", onSubmit: B, children: [
          /* @__PURE__ */ h.jsxs("div", { className: "pj-stepper", children: [
            /* @__PURE__ */ h.jsx("span", { className: X === 1 ? "active" : "", children: "1. Basic Details" }),
            /* @__PURE__ */ h.jsx("span", { className: X === 2 ? "active" : "", children: "2. Supporting Details" })
          ] }),
          X === 1 ? /* @__PURE__ */ h.jsxs(h.Fragment, { children: [
            /* @__PURE__ */ h.jsxs("label", { children: [
              /* @__PURE__ */ h.jsx("span", { children: "Full Name" }),
              /* @__PURE__ */ h.jsx(
                "input",
                {
                  className: "pj-input",
                  value: S.applicant_name,
                  onChange: (w) => ht("applicant_name", w.target.value),
                  maxLength: 140,
                  required: !0
                }
              )
            ] }),
            /* @__PURE__ */ h.jsxs("label", { children: [
              /* @__PURE__ */ h.jsx("span", { children: "Email" }),
              /* @__PURE__ */ h.jsx(
                "input",
                {
                  className: "pj-input",
                  type: "email",
                  value: S.email_id,
                  onChange: (w) => ht("email_id", w.target.value),
                  maxLength: 254,
                  required: !0
                }
              )
            ] }),
            /* @__PURE__ */ h.jsx("div", { className: "pj-inline-actions", children: /* @__PURE__ */ h.jsx("button", { type: "button", className: "pj-btn pj-btn-primary", onClick: zt, children: "Continue" }) })
          ] }) : /* @__PURE__ */ h.jsxs(h.Fragment, { children: [
            /* @__PURE__ */ h.jsxs("label", { children: [
              /* @__PURE__ */ h.jsx("span", { children: "Phone (optional)" }),
              /* @__PURE__ */ h.jsx(
                "input",
                {
                  className: "pj-input",
                  value: S.phone,
                  onChange: (w) => ht("phone", w.target.value),
                  maxLength: 32
                }
              )
            ] }),
            /* @__PURE__ */ h.jsxs("label", { children: [
              /* @__PURE__ */ h.jsx("span", { children: "Resume Link (optional)" }),
              /* @__PURE__ */ h.jsx(
                "input",
                {
                  className: "pj-input",
                  value: S.resume_link,
                  onChange: (w) => ht("resume_link", w.target.value),
                  maxLength: 2048
                }
              )
            ] }),
            /* @__PURE__ */ h.jsxs("label", { children: [
              /* @__PURE__ */ h.jsx("span", { children: "Cover Letter (optional)" }),
              /* @__PURE__ */ h.jsx(
                "textarea",
                {
                  className: "pj-textarea",
                  value: S.cover_letter,
                  onChange: (w) => ht("cover_letter", w.target.value),
                  maxLength: 5e3,
                  rows: 4
                }
              )
            ] }),
            /* @__PURE__ */ h.jsxs("label", { className: "pj-checkbox-row", children: [
              /* @__PURE__ */ h.jsx(
                "input",
                {
                  type: "checkbox",
                  checked: S.consent_given,
                  onChange: (w) => ht("consent_given", w.target.checked)
                }
              ),
              /* @__PURE__ */ h.jsx("span", { children: "I consent to processing of my profile and KYC data for hiring review." })
            ] }),
            /* @__PURE__ */ h.jsx(
              "input",
              {
                type: "text",
                className: "pj-hidden-input",
                value: S.website,
                onChange: (w) => ht("website", w.target.value),
                tabIndex: -1,
                autoComplete: "off",
                "aria-hidden": "true"
              }
            ),
            /* @__PURE__ */ h.jsxs("div", { className: "pj-inline-actions", children: [
              /* @__PURE__ */ h.jsx("button", { type: "button", className: "pj-btn pj-btn-ghost", onClick: Qt, children: "Back" }),
              /* @__PURE__ */ h.jsx("button", { type: "submit", className: "pj-btn pj-btn-primary", disabled: U, children: U ? "Submitting..." : "Submit Application" })
            ] })
          ] }),
          M.length > 0 ? /* @__PURE__ */ h.jsx("div", { className: "pj-state pj-state-error", children: M }) : null
        ] }) }) : /* @__PURE__ */ h.jsx("div", { className: "pj-state", children: "Applications for this role are currently closed." })
      ] })
    ] }),
    /* @__PURE__ */ h.jsxs("section", { className: "pj-detail-card", children: [
      /* @__PURE__ */ h.jsx("h2", { children: "Related Roles" }),
      Array.isArray(s.related_jobs) && s.related_jobs.length > 0 ? /* @__PURE__ */ h.jsx("div", { className: "pj-related-grid", children: s.related_jobs.map((w) => /* @__PURE__ */ h.jsxs($l, { className: "pj-related-item", to: encodeURIComponent(Vh(w)), children: [
        /* @__PURE__ */ h.jsx("h3", { children: w.job_title || w.designation || "Open role" }),
        /* @__PURE__ */ h.jsx("p", { children: [w.company, w.location, w.employment_type].filter(Boolean).join(" • ") || "Published opportunity" })
      ] }, w.name)) }) : /* @__PURE__ */ h.jsx("p", { className: "pj-copy", children: "No related openings are currently available." })
    ] })
  ] });
}
const $f = 20, Ah = {
  locations: [],
  employment_types: [],
  designations: [],
  companies: []
}, Vf = {
  current_page: 1,
  per_page: $f,
  total_count: 0
}, p0 = (i, f) => {
  const s = Number(i || "");
  return Number.isFinite(s) && s >= 1 ? Math.floor(s) : f;
}, g0 = (i, f) => {
  if (f <= 1) return [1];
  const s = 5;
  let d = Math.max(1, i - Math.floor(s / 2));
  const r = Math.min(f, d + s - 1);
  r - d + 1 < s && (d = Math.max(1, r - s + 1));
  const v = [];
  for (let E = d; E <= r; E += 1)
    v.push(E);
  return v;
};
function S0() {
  const [i, f] = e0(), s = A.useMemo(() => ({
    search: (i.get("search") || "").trim(),
    location: (i.get("location") || "").trim(),
    employmentType: (i.get("employment_type") || "").trim(),
    designation: (i.get("designation") || "").trim(),
    company: (i.get("company") || "").trim(),
    page: p0(i.get("page"), 1)
  }), [i]), [d, r] = A.useState(s.search), [v, E] = A.useState([]), [R, S] = A.useState(Ah), [y, M] = A.useState(Vf), [x, U] = A.useState(!0), [K, J] = A.useState(""), [Q, X] = A.useState(!0), [Y, $] = A.useState(""), [I, at] = A.useState(0);
  A.useEffect(() => {
    r(s.search);
  }, [s.search]), A.useEffect(() => {
    let B = !1;
    return (async () => {
      X(!0), $("");
      try {
        const w = await di.getFilterOptions();
        if (B) return;
        S(w);
      } catch (w) {
        if (B) return;
        S(Ah), $("Filter options could not be loaded right now. You can still browse jobs.");
      } finally {
        B === !1 && X(!1);
      }
    })(), () => {
      B = !0;
    };
  }, [I]), A.useEffect(() => {
    let B = !1;
    return (async () => {
      U(!0), J("");
      try {
        const w = await di.getJobs({
          page: s.page,
          page_size: $f,
          search: s.search,
          location: s.location,
          employment_type: s.employmentType,
          designation: s.designation,
          company: s.company
        });
        if (B) return;
        E(w.jobs), M(w.pagination || Vf);
      } catch (w) {
        if (B) return;
        const nt = w instanceof Error ? w.message : "Failed to load jobs.";
        J(nt), E([]), M(Vf);
      } finally {
        B === !1 && U(!1);
      }
    })(), () => {
      B = !0;
    };
  }, [s.company, s.designation, s.employmentType, s.location, s.page, s.search, I]);
  const st = Math.max(1, Math.ceil((y.total_count || 0) / (y.per_page || $f))), ht = g0(s.page, st), mt = (B, Ut = !1) => {
    const w = new URLSearchParams(i), nt = (L, H) => {
      if (H == null || String(H).trim().length === 0) {
        w.delete(L);
        return;
      }
      w.set(L, String(H));
    };
    B.search !== void 0 && nt("search", B.search), B.location !== void 0 && nt("location", B.location), B.employmentType !== void 0 && nt("employment_type", B.employmentType), B.designation !== void 0 && nt("designation", B.designation), B.company !== void 0 && nt("company", B.company), B.page !== void 0 && nt("page", B.page), Ut && w.delete("page"), f(w, { replace: !0 });
  }, tt = (B) => {
    B.preventDefault(), mt({ search: d.trim() }, !0);
  }, zt = () => {
    r(""), f({}, { replace: !0 });
  }, Qt = () => {
    at((B) => B + 1);
  }, ce = [
    s.search,
    s.location,
    s.employmentType,
    s.designation,
    s.company
  ].filter((B) => B.length > 0).length;
  return /* @__PURE__ */ h.jsxs("main", { className: "pj-main", children: [
    /* @__PURE__ */ h.jsxs("section", { className: "pj-hero pj-shell", children: [
      /* @__PURE__ */ h.jsx("p", { className: "pj-eyebrow", children: "Public Healthcare Hiring" }),
      /* @__PURE__ */ h.jsx("h1", { children: "Find your next role with verified healthcare facilities." }),
      /* @__PURE__ */ h.jsx("p", { children: "Browse open postings, compare timelines, and apply securely from one public jobs board." })
    ] }),
    /* @__PURE__ */ h.jsxs("section", { className: "pj-shell pj-list-card", children: [
      /* @__PURE__ */ h.jsxs("form", { className: "pj-search-row", onSubmit: tt, children: [
        /* @__PURE__ */ h.jsx(
          "input",
          {
            className: "pj-input",
            value: d,
            onChange: (B) => r(B.target.value),
            placeholder: "Search by role title or designation",
            maxLength: 120,
            "aria-label": "Search jobs"
          }
        ),
        /* @__PURE__ */ h.jsx("button", { type: "submit", className: "pj-btn pj-btn-primary", children: "Search" })
      ] }),
      /* @__PURE__ */ h.jsxs("div", { className: "pj-filters-grid", children: [
        /* @__PURE__ */ h.jsxs("label", { children: [
          /* @__PURE__ */ h.jsx("span", { children: "Facility" }),
          /* @__PURE__ */ h.jsxs(
            "select",
            {
              className: "pj-select",
              value: s.company,
              onChange: (B) => mt({ company: B.target.value }, !0),
              disabled: Q,
              children: [
                /* @__PURE__ */ h.jsx("option", { value: "", children: "All facilities" }),
                R.companies.map((B) => /* @__PURE__ */ h.jsx("option", { value: B, children: B }, B))
              ]
            }
          )
        ] }),
        /* @__PURE__ */ h.jsxs("label", { children: [
          /* @__PURE__ */ h.jsx("span", { children: "Location" }),
          /* @__PURE__ */ h.jsxs(
            "select",
            {
              className: "pj-select",
              value: s.location,
              onChange: (B) => mt({ location: B.target.value }, !0),
              disabled: Q,
              children: [
                /* @__PURE__ */ h.jsx("option", { value: "", children: "All locations" }),
                R.locations.map((B) => /* @__PURE__ */ h.jsx("option", { value: B, children: B }, B))
              ]
            }
          )
        ] }),
        /* @__PURE__ */ h.jsxs("label", { children: [
          /* @__PURE__ */ h.jsx("span", { children: "Employment type" }),
          /* @__PURE__ */ h.jsxs(
            "select",
            {
              className: "pj-select",
              value: s.employmentType,
              onChange: (B) => mt({ employmentType: B.target.value }, !0),
              disabled: Q,
              children: [
                /* @__PURE__ */ h.jsx("option", { value: "", children: "All types" }),
                R.employment_types.map((B) => /* @__PURE__ */ h.jsx("option", { value: B, children: B }, B))
              ]
            }
          )
        ] }),
        /* @__PURE__ */ h.jsxs("label", { children: [
          /* @__PURE__ */ h.jsx("span", { children: "Role" }),
          /* @__PURE__ */ h.jsxs(
            "select",
            {
              className: "pj-select",
              value: s.designation,
              onChange: (B) => mt({ designation: B.target.value }, !0),
              disabled: Q,
              children: [
                /* @__PURE__ */ h.jsx("option", { value: "", children: "All roles" }),
                R.designations.map((B) => /* @__PURE__ */ h.jsx("option", { value: B, children: B }, B))
              ]
            }
          )
        ] })
      ] }),
      Y.length > 0 ? /* @__PURE__ */ h.jsx("div", { className: "pj-state-wrap", children: /* @__PURE__ */ h.jsx(
        ri,
        {
          tone: "neutral",
          title: "Filters unavailable",
          description: Y,
          actionLabel: "Retry loading filters",
          onAction: Qt
        }
      ) }) : null,
      /* @__PURE__ */ h.jsxs("div", { className: "pj-results-meta", children: [
        /* @__PURE__ */ h.jsxs("div", { children: [
          /* @__PURE__ */ h.jsxs("h2", { children: [
            y.total_count,
            " Open Position",
            y.total_count === 1 ? "" : "s"
          ] }),
          /* @__PURE__ */ h.jsx("p", { children: ce > 0 ? "Filtered results shown." : "Showing all currently published openings." })
        ] }),
        /* @__PURE__ */ h.jsx("button", { type: "button", className: "pj-btn pj-btn-ghost", onClick: zt, children: "Reset Filters" })
      ] }),
      x ? /* @__PURE__ */ h.jsx("div", { className: "pj-state-wrap", children: /* @__PURE__ */ h.jsxs("div", { className: "pj-state-panel pj-state-panel-neutral pj-skeleton-panel", "aria-busy": "true", children: [
        /* @__PURE__ */ h.jsxs("div", { className: "pj-state-panel-copy", children: [
          /* @__PURE__ */ h.jsx("strong", { children: "Loading open roles" }),
          /* @__PURE__ */ h.jsx("p", { children: "Fetching current vacancies and publishing metadata." })
        ] }),
        /* @__PURE__ */ h.jsx("div", { className: "pj-skeleton-line" })
      ] }) }) : null,
      K.length > 0 ? /* @__PURE__ */ h.jsx("div", { className: "pj-state-wrap", children: /* @__PURE__ */ h.jsx(
        ri,
        {
          tone: "error",
          title: "Could not load jobs",
          description: K,
          actionLabel: "Retry jobs",
          onAction: Qt
        }
      ) }) : null,
      x === !1 && K.length === 0 && v.length === 0 ? /* @__PURE__ */ h.jsx("div", { className: "pj-state-wrap", children: /* @__PURE__ */ h.jsx(
        ri,
        {
          tone: "neutral",
          title: "No matching jobs",
          description: "No jobs match your current filters. Try broadening your search or reset the filters to view all openings.",
          actionLabel: "Reset filters",
          onAction: zt
        }
      ) }) : null,
      x === !1 && K.length === 0 && v.length > 0 ? /* @__PURE__ */ h.jsxs(h.Fragment, { children: [
        /* @__PURE__ */ h.jsx("div", { className: "pj-jobs-grid", children: v.map((B) => {
          const Ut = Jh(B), w = Kh(B.closes_on), nt = encodeURIComponent(Vh(B));
          return /* @__PURE__ */ h.jsxs($l, { className: "pj-job-card", to: nt, children: [
            /* @__PURE__ */ h.jsxs("div", { className: "pj-job-card-head", children: [
              /* @__PURE__ */ h.jsx("p", { className: "pj-job-company", children: B.company || "Healthcare facility" }),
              /* @__PURE__ */ h.jsx("span", { className: "pj-deadline " + w.tone, children: w.label })
            ] }),
            /* @__PURE__ */ h.jsx("h3", { children: B.job_title || B.designation || "Open role" }),
            /* @__PURE__ */ h.jsx("p", { className: "pj-job-meta", children: [B.location, B.employment_type, B.designation].filter(Boolean).join(" • ") || "Details available on role page" }),
            /* @__PURE__ */ h.jsxs("div", { className: "pj-job-highlight-row", children: [
              /* @__PURE__ */ h.jsx("span", { children: Ut || "Compensation shared during hiring process" }),
              /* @__PURE__ */ h.jsx("span", { children: B.closes_on ? "Deadline: " + Ff(B.closes_on) : "Rolling review" })
            ] })
          ] }, B.name);
        }) }),
        /* @__PURE__ */ h.jsxs("div", { className: "pj-pagination", children: [
          /* @__PURE__ */ h.jsx(
            "button",
            {
              type: "button",
              className: "pj-page-btn",
              disabled: s.page <= 1,
              onClick: () => mt({ page: s.page - 1 }),
              children: "Previous"
            }
          ),
          ht.map((B) => /* @__PURE__ */ h.jsx(
            "button",
            {
              type: "button",
              className: "pj-page-btn" + (B === s.page ? " active" : ""),
              onClick: () => mt({ page: B }),
              children: B
            },
            B
          )),
          /* @__PURE__ */ h.jsx(
            "button",
            {
              type: "button",
              className: "pj-page-btn",
              disabled: s.page >= st,
              onClick: () => mt({ page: s.page + 1 }),
              children: "Next"
            }
          )
        ] })
      ] }) : null
    ] })
  ] });
}
function b0() {
  const i = wh();
  return /* @__PURE__ */ h.jsx($p, { basename: "/jobs", children: /* @__PURE__ */ h.jsxs("div", { className: "pj-app", children: [
    /* @__PURE__ */ h.jsx(o0, { boot: i }),
    /* @__PURE__ */ h.jsxs(Ap, { children: [
      /* @__PURE__ */ h.jsx(ci, { path: "/", element: /* @__PURE__ */ h.jsx(S0, {}) }),
      /* @__PURE__ */ h.jsx(ci, { path: ":jobSlug", element: /* @__PURE__ */ h.jsx(v0, {}) }),
      /* @__PURE__ */ h.jsx(ci, { path: "*", element: /* @__PURE__ */ h.jsx(Tp, { to: "/", replace: !0 }) })
    ] }),
    /* @__PURE__ */ h.jsx(f0, { boot: i })
  ] }) });
}
const E0 = () => {
  const i = document.getElementById("public-jobs-root");
  if (i) return i;
  const f = document.createElement("div");
  return f.id = "public-jobs-root", document.body.appendChild(f), f;
}, j0 = E0();
try {
  zv.createRoot(j0).render(
    /* @__PURE__ */ h.jsx(A.StrictMode, { children: /* @__PURE__ */ h.jsx(b0, {}) })
  ), window.__PUBLIC_JOBS_MOUNTED = !0;
} catch (i) {
  window.__PUBLIC_JOBS_MOUNTED = !1, typeof window.__showPublicJobsFallback == "function" && window.__showPublicJobsFallback("The public jobs application failed to start."), console.error("Public jobs bootstrap failed", i);
}
//# sourceMappingURL=public-jobs.js.map
