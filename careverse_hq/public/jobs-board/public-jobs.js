var Bf = { exports: {} }, Dn = {};
var ih;
function gp() {
  if (ih) return Dn;
  ih = 1;
  var i = /* @__PURE__ */ Symbol.for("react.transitional.element"), s = /* @__PURE__ */ Symbol.for("react.fragment");
  function f(d, r, v) {
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
  return Dn.Fragment = s, Dn.jsx = f, Dn.jsxs = f, Dn;
}
var ch;
function bp() {
  return ch || (ch = 1, Bf.exports = gp()), Bf.exports;
}
var h = bp(), Lf = { exports: {} }, ee = {}, fh;
function Sp() {
  if (fh) return ee;
  fh = 1;
  var i = { env: {} };
  var s = /* @__PURE__ */ Symbol.for("react.transitional.element"), f = /* @__PURE__ */ Symbol.for("react.portal"), d = /* @__PURE__ */ Symbol.for("react.fragment"), r = /* @__PURE__ */ Symbol.for("react.strict_mode"), v = /* @__PURE__ */ Symbol.for("react.profiler"), E = /* @__PURE__ */ Symbol.for("react.consumer"), R = /* @__PURE__ */ Symbol.for("react.context"), b = /* @__PURE__ */ Symbol.for("react.forward_ref"), p = /* @__PURE__ */ Symbol.for("react.suspense"), D = /* @__PURE__ */ Symbol.for("react.memo"), A = /* @__PURE__ */ Symbol.for("react.lazy"), H = /* @__PURE__ */ Symbol.for("react.activity"), K = Symbol.iterator;
  function J(y) {
    return y === null || typeof y != "object" ? null : (y = K && y[K] || y["@@iterator"], typeof y == "function" ? y : null);
  }
  var w = {
    isMounted: function() {
      return !1;
    },
    enqueueForceUpdate: function() {
    },
    enqueueReplaceState: function() {
    },
    enqueueSetState: function() {
    }
  }, X = Object.assign, G = {};
  function $(y, O, L) {
    this.props = y, this.context = O, this.refs = G, this.updater = L || w;
  }
  $.prototype.isReactComponent = {}, $.prototype.setState = function(y, O) {
    if (typeof y != "object" && typeof y != "function" && y != null)
      throw Error(
        "takes an object of state variables to update or a function which returns an object of state variables."
      );
    this.updater.enqueueSetState(this, y, O, "setState");
  }, $.prototype.forceUpdate = function(y) {
    this.updater.enqueueForceUpdate(this, y, "forceUpdate");
  };
  function I() {
  }
  I.prototype = $.prototype;
  function ae(y, O, L) {
    this.props = y, this.context = O, this.refs = G, this.updater = L || w;
  }
  var fe = ae.prototype = new I();
  fe.constructor = ae, X(fe, $.prototype), fe.isPureReactComponent = !0;
  var be = Array.isArray;
  function oe() {
  }
  var P = { H: null, A: null, T: null, S: null }, Re = Object.prototype.hasOwnProperty;
  function He(y, O, L) {
    var k = L.ref;
    return {
      $$typeof: s,
      type: y,
      key: O,
      ref: k !== void 0 ? k : null,
      props: L
    };
  }
  function tt(y, O) {
    return He(y.type, O, y.props);
  }
  function U(y) {
    return typeof y == "object" && y !== null && y.$$typeof === s;
  }
  function Be(y) {
    var O = { "=": "=0", ":": "=2" };
    return "$" + y.replace(/[=:]/g, function(L) {
      return O[L];
    });
  }
  var Se = /\/+/g;
  function he(y, O) {
    return typeof y == "object" && y !== null && y.key != null ? Be("" + y.key) : O.toString(36);
  }
  function q(y) {
    switch (y.status) {
      case "fulfilled":
        return y.value;
      case "rejected":
        throw y.reason;
      default:
        switch (typeof y.status == "string" ? y.then(oe, oe) : (y.status = "pending", y.then(
          function(O) {
            y.status === "pending" && (y.status = "fulfilled", y.value = O);
          },
          function(O) {
            y.status === "pending" && (y.status = "rejected", y.reason = O);
          }
        )), y.status) {
          case "fulfilled":
            return y.value;
          case "rejected":
            throw y.reason;
        }
    }
    throw y;
  }
  function B(y, O, L, k, ne) {
    var ue = typeof y;
    (ue === "undefined" || ue === "boolean") && (y = null);
    var ge = !1;
    if (y === null) ge = !0;
    else
      switch (ue) {
        case "bigint":
        case "string":
        case "number":
          ge = !0;
          break;
        case "object":
          switch (y.$$typeof) {
            case s:
            case f:
              ge = !0;
              break;
            case A:
              return ge = y._init, B(
                ge(y._payload),
                O,
                L,
                k,
                ne
              );
          }
      }
    if (ge)
      return ne = ne(y), ge = k === "" ? "." + he(y, 0) : k, be(ne) ? (L = "", ge != null && (L = ge.replace(Se, "$&/") + "/"), B(ne, O, L, "", function(qa) {
        return qa;
      })) : ne != null && (U(ne) && (ne = tt(
        ne,
        L + (ne.key == null || y && y.key === ne.key ? "" : ("" + ne.key).replace(
          Se,
          "$&/"
        ) + "/") + ge
      )), O.push(ne)), 1;
    ge = 0;
    var Pe = k === "" ? "." : k + ":";
    if (be(y))
      for (var Le = 0; Le < y.length; Le++)
        k = y[Le], ue = Pe + he(k, Le), ge += B(
          k,
          O,
          L,
          ue,
          ne
        );
    else if (Le = J(y), typeof Le == "function")
      for (y = Le.call(y), Le = 0; !(k = y.next()).done; )
        k = k.value, ue = Pe + he(k, Le++), ge += B(
          k,
          O,
          L,
          ue,
          ne
        );
    else if (ue === "object") {
      if (typeof y.then == "function")
        return B(
          q(y),
          O,
          L,
          k,
          ne
        );
      throw O = String(y), Error(
        "Objects are not valid as a React child (found: " + (O === "[object Object]" ? "object with keys {" + Object.keys(y).join(", ") + "}" : O) + "). If you meant to render a collection of children, use an array instead."
      );
    }
    return ge;
  }
  function Y(y, O, L) {
    if (y == null) return y;
    var k = [], ne = 0;
    return B(y, k, "", "", function(ue) {
      return O.call(L, ue, ne++);
    }), k;
  }
  function me(y) {
    if (y._status === -1) {
      var O = y._result;
      O = O(), O.then(
        function(L) {
          (y._status === 0 || y._status === -1) && (y._status = 1, y._result = L);
        },
        function(L) {
          (y._status === 0 || y._status === -1) && (y._status = 2, y._result = L);
        }
      ), y._status === -1 && (y._status = 0, y._result = O);
    }
    if (y._status === 1) return y._result.default;
    throw y._result;
  }
  var Ae = typeof reportError == "function" ? reportError : function(y) {
    if (typeof window == "object" && typeof window.ErrorEvent == "function") {
      var O = new window.ErrorEvent("error", {
        bubbles: !0,
        cancelable: !0,
        message: typeof y == "object" && y !== null && typeof y.message == "string" ? String(y.message) : String(y),
        error: y
      });
      if (!window.dispatchEvent(O)) return;
    } else if (typeof i == "object" && typeof i.emit == "function") {
      i.emit("uncaughtException", y);
      return;
    }
    console.error(y);
  }, Q = {
    map: Y,
    forEach: function(y, O, L) {
      Y(
        y,
        function() {
          O.apply(this, arguments);
        },
        L
      );
    },
    count: function(y) {
      var O = 0;
      return Y(y, function() {
        O++;
      }), O;
    },
    toArray: function(y) {
      return Y(y, function(O) {
        return O;
      }) || [];
    },
    only: function(y) {
      if (!U(y))
        throw Error(
          "React.Children.only expected to receive a single React element child."
        );
      return y;
    }
  };
  return ee.Activity = H, ee.Children = Q, ee.Component = $, ee.Fragment = d, ee.Profiler = v, ee.PureComponent = ae, ee.StrictMode = r, ee.Suspense = p, ee.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = P, ee.__COMPILER_RUNTIME = {
    __proto__: null,
    c: function(y) {
      return P.H.useMemoCache(y);
    }
  }, ee.cache = function(y) {
    return function() {
      return y.apply(null, arguments);
    };
  }, ee.cacheSignal = function() {
    return null;
  }, ee.cloneElement = function(y, O, L) {
    if (y == null)
      throw Error(
        "The argument must be a React element, but you passed " + y + "."
      );
    var k = X({}, y.props), ne = y.key;
    if (O != null)
      for (ue in O.key !== void 0 && (ne = "" + O.key), O)
        !Re.call(O, ue) || ue === "key" || ue === "__self" || ue === "__source" || ue === "ref" && O.ref === void 0 || (k[ue] = O[ue]);
    var ue = arguments.length - 2;
    if (ue === 1) k.children = L;
    else if (1 < ue) {
      for (var ge = Array(ue), Pe = 0; Pe < ue; Pe++)
        ge[Pe] = arguments[Pe + 2];
      k.children = ge;
    }
    return He(y.type, ne, k);
  }, ee.createContext = function(y) {
    return y = {
      $$typeof: R,
      _currentValue: y,
      _currentValue2: y,
      _threadCount: 0,
      Provider: null,
      Consumer: null
    }, y.Provider = y, y.Consumer = {
      $$typeof: E,
      _context: y
    }, y;
  }, ee.createElement = function(y, O, L) {
    var k, ne = {}, ue = null;
    if (O != null)
      for (k in O.key !== void 0 && (ue = "" + O.key), O)
        Re.call(O, k) && k !== "key" && k !== "__self" && k !== "__source" && (ne[k] = O[k]);
    var ge = arguments.length - 2;
    if (ge === 1) ne.children = L;
    else if (1 < ge) {
      for (var Pe = Array(ge), Le = 0; Le < ge; Le++)
        Pe[Le] = arguments[Le + 2];
      ne.children = Pe;
    }
    if (y && y.defaultProps)
      for (k in ge = y.defaultProps, ge)
        ne[k] === void 0 && (ne[k] = ge[k]);
    return He(y, ue, ne);
  }, ee.createRef = function() {
    return { current: null };
  }, ee.forwardRef = function(y) {
    return { $$typeof: b, render: y };
  }, ee.isValidElement = U, ee.lazy = function(y) {
    return {
      $$typeof: A,
      _payload: { _status: -1, _result: y },
      _init: me
    };
  }, ee.memo = function(y, O) {
    return {
      $$typeof: D,
      type: y,
      compare: O === void 0 ? null : O
    };
  }, ee.startTransition = function(y) {
    var O = P.T, L = {};
    P.T = L;
    try {
      var k = y(), ne = P.S;
      ne !== null && ne(L, k), typeof k == "object" && k !== null && typeof k.then == "function" && k.then(oe, Ae);
    } catch (ue) {
      Ae(ue);
    } finally {
      O !== null && L.types !== null && (O.types = L.types), P.T = O;
    }
  }, ee.unstable_useCacheRefresh = function() {
    return P.H.useCacheRefresh();
  }, ee.use = function(y) {
    return P.H.use(y);
  }, ee.useActionState = function(y, O, L) {
    return P.H.useActionState(y, O, L);
  }, ee.useCallback = function(y, O) {
    return P.H.useCallback(y, O);
  }, ee.useContext = function(y) {
    return P.H.useContext(y);
  }, ee.useDebugValue = function() {
  }, ee.useDeferredValue = function(y, O) {
    return P.H.useDeferredValue(y, O);
  }, ee.useEffect = function(y, O) {
    return P.H.useEffect(y, O);
  }, ee.useEffectEvent = function(y) {
    return P.H.useEffectEvent(y);
  }, ee.useId = function() {
    return P.H.useId();
  }, ee.useImperativeHandle = function(y, O, L) {
    return P.H.useImperativeHandle(y, O, L);
  }, ee.useInsertionEffect = function(y, O) {
    return P.H.useInsertionEffect(y, O);
  }, ee.useLayoutEffect = function(y, O) {
    return P.H.useLayoutEffect(y, O);
  }, ee.useMemo = function(y, O) {
    return P.H.useMemo(y, O);
  }, ee.useOptimistic = function(y, O) {
    return P.H.useOptimistic(y, O);
  }, ee.useReducer = function(y, O, L) {
    return P.H.useReducer(y, O, L);
  }, ee.useRef = function(y) {
    return P.H.useRef(y);
  }, ee.useState = function(y) {
    return P.H.useState(y);
  }, ee.useSyncExternalStore = function(y, O, L) {
    return P.H.useSyncExternalStore(
      y,
      O,
      L
    );
  }, ee.useTransition = function() {
    return P.H.useTransition();
  }, ee.version = "19.2.4", ee;
}
var sh;
function Wf() {
  return sh || (sh = 1, Lf.exports = Sp()), Lf.exports;
}
var T = Wf(), qf = { exports: {} }, Cn = {}, Yf = { exports: {} }, Gf = {};
var rh;
function Ep() {
  return rh || (rh = 1, (function(i) {
    function s(q, B) {
      var Y = q.length;
      q.push(B);
      e: for (; 0 < Y; ) {
        var me = Y - 1 >>> 1, Ae = q[me];
        if (0 < r(Ae, B))
          q[me] = B, q[Y] = Ae, Y = me;
        else break e;
      }
    }
    function f(q) {
      return q.length === 0 ? null : q[0];
    }
    function d(q) {
      if (q.length === 0) return null;
      var B = q[0], Y = q.pop();
      if (Y !== B) {
        q[0] = Y;
        e: for (var me = 0, Ae = q.length, Q = Ae >>> 1; me < Q; ) {
          var y = 2 * (me + 1) - 1, O = q[y], L = y + 1, k = q[L];
          if (0 > r(O, Y))
            L < Ae && 0 > r(k, O) ? (q[me] = k, q[L] = Y, me = L) : (q[me] = O, q[y] = Y, me = y);
          else if (L < Ae && 0 > r(k, Y))
            q[me] = k, q[L] = Y, me = L;
          else break e;
        }
      }
      return B;
    }
    function r(q, B) {
      var Y = q.sortIndex - B.sortIndex;
      return Y !== 0 ? Y : q.id - B.id;
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
    var b = [], p = [], D = 1, A = null, H = 3, K = !1, J = !1, w = !1, X = !1, G = typeof setTimeout == "function" ? setTimeout : null, $ = typeof clearTimeout == "function" ? clearTimeout : null, I = typeof setImmediate != "undefined" ? setImmediate : null;
    function ae(q) {
      for (var B = f(p); B !== null; ) {
        if (B.callback === null) d(p);
        else if (B.startTime <= q)
          d(p), B.sortIndex = B.expirationTime, s(b, B);
        else break;
        B = f(p);
      }
    }
    function fe(q) {
      if (w = !1, ae(q), !J)
        if (f(b) !== null)
          J = !0, be || (be = !0, U());
        else {
          var B = f(p);
          B !== null && he(fe, B.startTime - q);
        }
    }
    var be = !1, oe = -1, P = 5, Re = -1;
    function He() {
      return X ? !0 : !(i.unstable_now() - Re < P);
    }
    function tt() {
      if (X = !1, be) {
        var q = i.unstable_now();
        Re = q;
        var B = !0;
        try {
          e: {
            J = !1, w && (w = !1, $(oe), oe = -1), K = !0;
            var Y = H;
            try {
              t: {
                for (ae(q), A = f(b); A !== null && !(A.expirationTime > q && He()); ) {
                  var me = A.callback;
                  if (typeof me == "function") {
                    A.callback = null, H = A.priorityLevel;
                    var Ae = me(
                      A.expirationTime <= q
                    );
                    if (q = i.unstable_now(), typeof Ae == "function") {
                      A.callback = Ae, ae(q), B = !0;
                      break t;
                    }
                    A === f(b) && d(b), ae(q);
                  } else d(b);
                  A = f(b);
                }
                if (A !== null) B = !0;
                else {
                  var Q = f(p);
                  Q !== null && he(
                    fe,
                    Q.startTime - q
                  ), B = !1;
                }
              }
              break e;
            } finally {
              A = null, H = Y, K = !1;
            }
            B = void 0;
          }
        } finally {
          B ? U() : be = !1;
        }
      }
    }
    var U;
    if (typeof I == "function")
      U = function() {
        I(tt);
      };
    else if (typeof MessageChannel != "undefined") {
      var Be = new MessageChannel(), Se = Be.port2;
      Be.port1.onmessage = tt, U = function() {
        Se.postMessage(null);
      };
    } else
      U = function() {
        G(tt, 0);
      };
    function he(q, B) {
      oe = G(function() {
        q(i.unstable_now());
      }, B);
    }
    i.unstable_IdlePriority = 5, i.unstable_ImmediatePriority = 1, i.unstable_LowPriority = 4, i.unstable_NormalPriority = 3, i.unstable_Profiling = null, i.unstable_UserBlockingPriority = 2, i.unstable_cancelCallback = function(q) {
      q.callback = null;
    }, i.unstable_forceFrameRate = function(q) {
      0 > q || 125 < q ? console.error(
        "forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"
      ) : P = 0 < q ? Math.floor(1e3 / q) : 5;
    }, i.unstable_getCurrentPriorityLevel = function() {
      return H;
    }, i.unstable_next = function(q) {
      switch (H) {
        case 1:
        case 2:
        case 3:
          var B = 3;
          break;
        default:
          B = H;
      }
      var Y = H;
      H = B;
      try {
        return q();
      } finally {
        H = Y;
      }
    }, i.unstable_requestPaint = function() {
      X = !0;
    }, i.unstable_runWithPriority = function(q, B) {
      switch (q) {
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
          break;
        default:
          q = 3;
      }
      var Y = H;
      H = q;
      try {
        return B();
      } finally {
        H = Y;
      }
    }, i.unstable_scheduleCallback = function(q, B, Y) {
      var me = i.unstable_now();
      switch (typeof Y == "object" && Y !== null ? (Y = Y.delay, Y = typeof Y == "number" && 0 < Y ? me + Y : me) : Y = me, q) {
        case 1:
          var Ae = -1;
          break;
        case 2:
          Ae = 250;
          break;
        case 5:
          Ae = 1073741823;
          break;
        case 4:
          Ae = 1e4;
          break;
        default:
          Ae = 5e3;
      }
      return Ae = Y + Ae, q = {
        id: D++,
        callback: B,
        priorityLevel: q,
        startTime: Y,
        expirationTime: Ae,
        sortIndex: -1
      }, Y > me ? (q.sortIndex = Y, s(p, q), f(b) === null && q === f(p) && (w ? ($(oe), oe = -1) : w = !0, he(fe, Y - me))) : (q.sortIndex = Ae, s(b, q), J || K || (J = !0, be || (be = !0, U()))), q;
    }, i.unstable_shouldYield = He, i.unstable_wrapCallback = function(q) {
      var B = H;
      return function() {
        var Y = H;
        H = B;
        try {
          return q.apply(this, arguments);
        } finally {
          H = Y;
        }
      };
    };
  })(Gf)), Gf;
}
var oh;
function jp() {
  return oh || (oh = 1, Yf.exports = Ep()), Yf.exports;
}
var Xf = { exports: {} }, Ie = {};
var dh;
function _p() {
  if (dh) return Ie;
  dh = 1;
  var i = Wf();
  function s(b) {
    var p = "https://react.dev/errors/" + b;
    if (1 < arguments.length) {
      p += "?args[]=" + encodeURIComponent(arguments[1]);
      for (var D = 2; D < arguments.length; D++)
        p += "&args[]=" + encodeURIComponent(arguments[D]);
    }
    return "Minified React error #" + b + "; visit " + p + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
  }
  function f() {
  }
  var d = {
    d: {
      f,
      r: function() {
        throw Error(s(522));
      },
      D: f,
      C: f,
      L: f,
      m: f,
      X: f,
      S: f,
      M: f
    },
    p: 0,
    findDOMNode: null
  }, r = /* @__PURE__ */ Symbol.for("react.portal");
  function v(b, p, D) {
    var A = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
    return {
      $$typeof: r,
      key: A == null ? null : "" + A,
      children: b,
      containerInfo: p,
      implementation: D
    };
  }
  var E = i.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
  function R(b, p) {
    if (b === "font") return "";
    if (typeof p == "string")
      return p === "use-credentials" ? p : "";
  }
  return Ie.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = d, Ie.createPortal = function(b, p) {
    var D = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
    if (!p || p.nodeType !== 1 && p.nodeType !== 9 && p.nodeType !== 11)
      throw Error(s(299));
    return v(b, p, null, D);
  }, Ie.flushSync = function(b) {
    var p = E.T, D = d.p;
    try {
      if (E.T = null, d.p = 2, b) return b();
    } finally {
      E.T = p, d.p = D, d.d.f();
    }
  }, Ie.preconnect = function(b, p) {
    typeof b == "string" && (p ? (p = p.crossOrigin, p = typeof p == "string" ? p === "use-credentials" ? p : "" : void 0) : p = null, d.d.C(b, p));
  }, Ie.prefetchDNS = function(b) {
    typeof b == "string" && d.d.D(b);
  }, Ie.preinit = function(b, p) {
    if (typeof b == "string" && p && typeof p.as == "string") {
      var D = p.as, A = R(D, p.crossOrigin), H = typeof p.integrity == "string" ? p.integrity : void 0, K = typeof p.fetchPriority == "string" ? p.fetchPriority : void 0;
      D === "style" ? d.d.S(
        b,
        typeof p.precedence == "string" ? p.precedence : void 0,
        {
          crossOrigin: A,
          integrity: H,
          fetchPriority: K
        }
      ) : D === "script" && d.d.X(b, {
        crossOrigin: A,
        integrity: H,
        fetchPriority: K,
        nonce: typeof p.nonce == "string" ? p.nonce : void 0
      });
    }
  }, Ie.preinitModule = function(b, p) {
    if (typeof b == "string")
      if (typeof p == "object" && p !== null) {
        if (p.as == null || p.as === "script") {
          var D = R(
            p.as,
            p.crossOrigin
          );
          d.d.M(b, {
            crossOrigin: D,
            integrity: typeof p.integrity == "string" ? p.integrity : void 0,
            nonce: typeof p.nonce == "string" ? p.nonce : void 0
          });
        }
      } else p == null && d.d.M(b);
  }, Ie.preload = function(b, p) {
    if (typeof b == "string" && typeof p == "object" && p !== null && typeof p.as == "string") {
      var D = p.as, A = R(D, p.crossOrigin);
      d.d.L(b, D, {
        crossOrigin: A,
        integrity: typeof p.integrity == "string" ? p.integrity : void 0,
        nonce: typeof p.nonce == "string" ? p.nonce : void 0,
        type: typeof p.type == "string" ? p.type : void 0,
        fetchPriority: typeof p.fetchPriority == "string" ? p.fetchPriority : void 0,
        referrerPolicy: typeof p.referrerPolicy == "string" ? p.referrerPolicy : void 0,
        imageSrcSet: typeof p.imageSrcSet == "string" ? p.imageSrcSet : void 0,
        imageSizes: typeof p.imageSizes == "string" ? p.imageSizes : void 0,
        media: typeof p.media == "string" ? p.media : void 0
      });
    }
  }, Ie.preloadModule = function(b, p) {
    if (typeof b == "string")
      if (p) {
        var D = R(p.as, p.crossOrigin);
        d.d.m(b, {
          as: typeof p.as == "string" && p.as !== "script" ? p.as : void 0,
          crossOrigin: D,
          integrity: typeof p.integrity == "string" ? p.integrity : void 0
        });
      } else d.d.m(b);
  }, Ie.requestFormReset = function(b) {
    d.d.r(b);
  }, Ie.unstable_batchedUpdates = function(b, p) {
    return b(p);
  }, Ie.useFormState = function(b, p, D) {
    return E.H.useFormState(b, p, D);
  }, Ie.useFormStatus = function() {
    return E.H.useHostTransitionStatus();
  }, Ie.version = "19.2.4", Ie;
}
var hh;
function Tp() {
  if (hh) return Xf.exports;
  hh = 1;
  function i() {
    if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ == "undefined" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"))
      try {
        __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(i);
      } catch (s) {
        console.error(s);
      }
  }
  return i(), Xf.exports = _p(), Xf.exports;
}
var mh;
function xp() {
  if (mh) return Cn;
  mh = 1;
  var i = { env: {} };
  var s = jp(), f = Wf(), d = Tp();
  function r(e) {
    var t = "https://react.dev/errors/" + e;
    if (1 < arguments.length) {
      t += "?args[]=" + encodeURIComponent(arguments[1]);
      for (var l = 2; l < arguments.length; l++)
        t += "&args[]=" + encodeURIComponent(arguments[l]);
    }
    return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
  }
  function v(e) {
    return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11);
  }
  function E(e) {
    var t = e, l = e;
    if (e.alternate) for (; t.return; ) t = t.return;
    else {
      e = t;
      do
        t = e, (t.flags & 4098) !== 0 && (l = t.return), e = t.return;
      while (e);
    }
    return t.tag === 3 ? l : null;
  }
  function R(e) {
    if (e.tag === 13) {
      var t = e.memoizedState;
      if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null) return t.dehydrated;
    }
    return null;
  }
  function b(e) {
    if (e.tag === 31) {
      var t = e.memoizedState;
      if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null) return t.dehydrated;
    }
    return null;
  }
  function p(e) {
    if (E(e) !== e)
      throw Error(r(188));
  }
  function D(e) {
    var t = e.alternate;
    if (!t) {
      if (t = E(e), t === null) throw Error(r(188));
      return t !== e ? null : e;
    }
    for (var l = e, a = t; ; ) {
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
          if (u === l) return p(n), e;
          if (u === a) return p(n), t;
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
    return l.stateNode.current === l ? e : t;
  }
  function A(e) {
    var t = e.tag;
    if (t === 5 || t === 26 || t === 27 || t === 6) return e;
    for (e = e.child; e !== null; ) {
      if (t = A(e), t !== null) return t;
      e = e.sibling;
    }
    return null;
  }
  var H = Object.assign, K = /* @__PURE__ */ Symbol.for("react.element"), J = /* @__PURE__ */ Symbol.for("react.transitional.element"), w = /* @__PURE__ */ Symbol.for("react.portal"), X = /* @__PURE__ */ Symbol.for("react.fragment"), G = /* @__PURE__ */ Symbol.for("react.strict_mode"), $ = /* @__PURE__ */ Symbol.for("react.profiler"), I = /* @__PURE__ */ Symbol.for("react.consumer"), ae = /* @__PURE__ */ Symbol.for("react.context"), fe = /* @__PURE__ */ Symbol.for("react.forward_ref"), be = /* @__PURE__ */ Symbol.for("react.suspense"), oe = /* @__PURE__ */ Symbol.for("react.suspense_list"), P = /* @__PURE__ */ Symbol.for("react.memo"), Re = /* @__PURE__ */ Symbol.for("react.lazy"), He = /* @__PURE__ */ Symbol.for("react.activity"), tt = /* @__PURE__ */ Symbol.for("react.memo_cache_sentinel"), U = Symbol.iterator;
  function Be(e) {
    return e === null || typeof e != "object" ? null : (e = U && e[U] || e["@@iterator"], typeof e == "function" ? e : null);
  }
  var Se = /* @__PURE__ */ Symbol.for("react.client.reference");
  function he(e) {
    if (e == null) return null;
    if (typeof e == "function")
      return e.$$typeof === Se ? null : e.displayName || e.name || null;
    if (typeof e == "string") return e;
    switch (e) {
      case X:
        return "Fragment";
      case $:
        return "Profiler";
      case G:
        return "StrictMode";
      case be:
        return "Suspense";
      case oe:
        return "SuspenseList";
      case He:
        return "Activity";
    }
    if (typeof e == "object")
      switch (e.$$typeof) {
        case w:
          return "Portal";
        case ae:
          return e.displayName || "Context";
        case I:
          return (e._context.displayName || "Context") + ".Consumer";
        case fe:
          var t = e.render;
          return e = e.displayName, e || (e = t.displayName || t.name || "", e = e !== "" ? "ForwardRef(" + e + ")" : "ForwardRef"), e;
        case P:
          return t = e.displayName || null, t !== null ? t : he(e.type) || "Memo";
        case Re:
          t = e._payload, e = e._init;
          try {
            return he(e(t));
          } catch (l) {
          }
      }
    return null;
  }
  var q = Array.isArray, B = f.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, Y = d.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, me = {
    pending: !1,
    data: null,
    method: null,
    action: null
  }, Ae = [], Q = -1;
  function y(e) {
    return { current: e };
  }
  function O(e) {
    0 > Q || (e.current = Ae[Q], Ae[Q] = null, Q--);
  }
  function L(e, t) {
    Q++, Ae[Q] = e.current, e.current = t;
  }
  var k = y(null), ne = y(null), ue = y(null), ge = y(null);
  function Pe(e, t) {
    switch (L(ue, t), L(ne, e), L(k, null), t.nodeType) {
      case 9:
      case 11:
        e = (e = t.documentElement) && (e = e.namespaceURI) ? Nd(e) : 0;
        break;
      default:
        if (e = t.tagName, t = t.namespaceURI)
          t = Nd(t), e = Od(t, e);
        else
          switch (e) {
            case "svg":
              e = 1;
              break;
            case "math":
              e = 2;
              break;
            default:
              e = 0;
          }
    }
    O(k), L(k, e);
  }
  function Le() {
    O(k), O(ne), O(ue);
  }
  function qa(e) {
    e.memoizedState !== null && L(ge, e);
    var t = k.current, l = Od(t, e.type);
    t !== l && (L(ne, e), L(k, l));
  }
  function wn(e) {
    ne.current === e && (O(k), O(ne)), ge.current === e && (O(ge), Rn._currentValue = me);
  }
  var vi, ns;
  function Ml(e) {
    if (vi === void 0)
      try {
        throw Error();
      } catch (l) {
        var t = l.stack.trim().match(/\n( *(at )?)/);
        vi = t && t[1] || "", ns = -1 < l.stack.indexOf(`
    at`) ? " (<anonymous>)" : -1 < l.stack.indexOf("@") ? "@unknown:0:0" : "";
      }
    return `
` + vi + e + ns;
  }
  var gi = !1;
  function bi(e, t) {
    if (!e || gi) return "";
    gi = !0;
    var l = Error.prepareStackTrace;
    Error.prepareStackTrace = void 0;
    try {
      var a = {
        DetermineComponentFrameRoot: function() {
          try {
            if (t) {
              var C = function() {
                throw Error();
              };
              if (Object.defineProperty(C.prototype, "props", {
                set: function() {
                  throw Error();
                }
              }), typeof Reflect == "object" && Reflect.construct) {
                try {
                  Reflect.construct(C, []);
                } catch (z) {
                  var x = z;
                }
                Reflect.construct(e, [], C);
              } else {
                try {
                  C.call();
                } catch (z) {
                  x = z;
                }
                e.call(C.prototype);
              }
            } else {
              try {
                throw Error();
              } catch (z) {
                x = z;
              }
              (C = e()) && typeof C.catch == "function" && C.catch(function() {
              });
            }
          } catch (z) {
            if (z && x && typeof z.stack == "string")
              return [z.stack, x.stack];
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
`), _ = o.split(`
`);
        for (n = a = 0; a < m.length && !m[a].includes("DetermineComponentFrameRoot"); )
          a++;
        for (; n < _.length && !_[n].includes(
          "DetermineComponentFrameRoot"
        ); )
          n++;
        if (a === m.length || n === _.length)
          for (a = m.length - 1, n = _.length - 1; 1 <= a && 0 <= n && m[a] !== _[n]; )
            n--;
        for (; 1 <= a && 0 <= n; a--, n--)
          if (m[a] !== _[n]) {
            if (a !== 1 || n !== 1)
              do
                if (a--, n--, 0 > n || m[a] !== _[n]) {
                  var N = `
` + m[a].replace(" at new ", " at ");
                  return e.displayName && N.includes("<anonymous>") && (N = N.replace("<anonymous>", e.displayName)), N;
                }
              while (1 <= a && 0 <= n);
            break;
          }
      }
    } finally {
      gi = !1, Error.prepareStackTrace = l;
    }
    return (l = e ? e.displayName || e.name : "") ? Ml(l) : "";
  }
  function Fh(e, t) {
    switch (e.tag) {
      case 26:
      case 27:
      case 5:
        return Ml(e.type);
      case 16:
        return Ml("Lazy");
      case 13:
        return e.child !== t && t !== null ? Ml("Suspense Fallback") : Ml("Suspense");
      case 19:
        return Ml("SuspenseList");
      case 0:
      case 15:
        return bi(e.type, !1);
      case 11:
        return bi(e.type.render, !1);
      case 1:
        return bi(e.type, !0);
      case 31:
        return Ml("Activity");
      default:
        return "";
    }
  }
  function us(e) {
    try {
      var t = "", l = null;
      do
        t += Fh(e, l), l = e, e = e.return;
      while (e);
      return t;
    } catch (a) {
      return `
Error generating stack: ` + a.message + `
` + a.stack;
    }
  }
  var Si = Object.prototype.hasOwnProperty, Ei = s.unstable_scheduleCallback, ji = s.unstable_cancelCallback, $h = s.unstable_shouldYield, Wh = s.unstable_requestPaint, st = s.unstable_now, Ih = s.unstable_getCurrentPriorityLevel, is = s.unstable_ImmediatePriority, cs = s.unstable_UserBlockingPriority, Zn = s.unstable_NormalPriority, Ph = s.unstable_LowPriority, fs = s.unstable_IdlePriority, em = s.log, tm = s.unstable_setDisableYieldValue, Ya = null, rt = null;
  function il(e) {
    if (typeof em == "function" && tm(e), rt && typeof rt.setStrictMode == "function")
      try {
        rt.setStrictMode(Ya, e);
      } catch (t) {
      }
  }
  var ot = Math.clz32 ? Math.clz32 : nm, lm = Math.log, am = Math.LN2;
  function nm(e) {
    return e >>>= 0, e === 0 ? 32 : 31 - (lm(e) / am | 0) | 0;
  }
  var Vn = 256, Jn = 262144, Kn = 4194304;
  function Dl(e) {
    var t = e & 42;
    if (t !== 0) return t;
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
        return e & 261888;
      case 262144:
      case 524288:
      case 1048576:
      case 2097152:
        return e & 3932160;
      case 4194304:
      case 8388608:
      case 16777216:
      case 33554432:
        return e & 62914560;
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
        return e;
    }
  }
  function kn(e, t, l) {
    var a = e.pendingLanes;
    if (a === 0) return 0;
    var n = 0, u = e.suspendedLanes, c = e.pingedLanes;
    e = e.warmLanes;
    var o = a & 134217727;
    return o !== 0 ? (a = o & ~u, a !== 0 ? n = Dl(a) : (c &= o, c !== 0 ? n = Dl(c) : l || (l = o & ~e, l !== 0 && (n = Dl(l))))) : (o = a & ~u, o !== 0 ? n = Dl(o) : c !== 0 ? n = Dl(c) : l || (l = a & ~e, l !== 0 && (n = Dl(l)))), n === 0 ? 0 : t !== 0 && t !== n && (t & u) === 0 && (u = n & -n, l = t & -t, u >= l || u === 32 && (l & 4194048) !== 0) ? t : n;
  }
  function Ga(e, t) {
    return (e.pendingLanes & ~(e.suspendedLanes & ~e.pingedLanes) & t) === 0;
  }
  function um(e, t) {
    switch (e) {
      case 1:
      case 2:
      case 4:
      case 8:
      case 64:
        return t + 250;
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
        return t + 5e3;
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
    var e = Kn;
    return Kn <<= 1, (Kn & 62914560) === 0 && (Kn = 4194304), e;
  }
  function _i(e) {
    for (var t = [], l = 0; 31 > l; l++) t.push(e);
    return t;
  }
  function Xa(e, t) {
    e.pendingLanes |= t, t !== 268435456 && (e.suspendedLanes = 0, e.pingedLanes = 0, e.warmLanes = 0);
  }
  function im(e, t, l, a, n, u) {
    var c = e.pendingLanes;
    e.pendingLanes = l, e.suspendedLanes = 0, e.pingedLanes = 0, e.warmLanes = 0, e.expiredLanes &= l, e.entangledLanes &= l, e.errorRecoveryDisabledLanes &= l, e.shellSuspendCounter = 0;
    var o = e.entanglements, m = e.expirationTimes, _ = e.hiddenUpdates;
    for (l = c & ~l; 0 < l; ) {
      var N = 31 - ot(l), C = 1 << N;
      o[N] = 0, m[N] = -1;
      var x = _[N];
      if (x !== null)
        for (_[N] = null, N = 0; N < x.length; N++) {
          var z = x[N];
          z !== null && (z.lane &= -536870913);
        }
      l &= ~C;
    }
    a !== 0 && rs(e, a, 0), u !== 0 && n === 0 && e.tag !== 0 && (e.suspendedLanes |= u & ~(c & ~t));
  }
  function rs(e, t, l) {
    e.pendingLanes |= t, e.suspendedLanes &= ~t;
    var a = 31 - ot(t);
    e.entangledLanes |= t, e.entanglements[a] = e.entanglements[a] | 1073741824 | l & 261930;
  }
  function os(e, t) {
    var l = e.entangledLanes |= t;
    for (e = e.entanglements; l; ) {
      var a = 31 - ot(l), n = 1 << a;
      n & t | e[a] & t && (e[a] |= t), l &= ~n;
    }
  }
  function ds(e, t) {
    var l = t & -t;
    return l = (l & 42) !== 0 ? 1 : Ti(l), (l & (e.suspendedLanes | t)) !== 0 ? 0 : l;
  }
  function Ti(e) {
    switch (e) {
      case 2:
        e = 1;
        break;
      case 8:
        e = 4;
        break;
      case 32:
        e = 16;
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
        e = 128;
        break;
      case 268435456:
        e = 134217728;
        break;
      default:
        e = 0;
    }
    return e;
  }
  function xi(e) {
    return e &= -e, 2 < e ? 8 < e ? (e & 134217727) !== 0 ? 32 : 268435456 : 8 : 2;
  }
  function hs() {
    var e = Y.p;
    return e !== 0 ? e : (e = window.event, e === void 0 ? 32 : Pd(e.type));
  }
  function ms(e, t) {
    var l = Y.p;
    try {
      return Y.p = e, t();
    } finally {
      Y.p = l;
    }
  }
  var cl = Math.random().toString(36).slice(2), Ke = "__reactFiber$" + cl, lt = "__reactProps$" + cl, Wl = "__reactContainer$" + cl, Ai = "__reactEvents$" + cl, cm = "__reactListeners$" + cl, fm = "__reactHandles$" + cl, ys = "__reactResources$" + cl, Qa = "__reactMarker$" + cl;
  function zi(e) {
    delete e[Ke], delete e[lt], delete e[Ai], delete e[cm], delete e[fm];
  }
  function Il(e) {
    var t = e[Ke];
    if (t) return t;
    for (var l = e.parentNode; l; ) {
      if (t = l[Wl] || l[Ke]) {
        if (l = t.alternate, t.child !== null || l !== null && l.child !== null)
          for (e = Ld(e); e !== null; ) {
            if (l = e[Ke]) return l;
            e = Ld(e);
          }
        return t;
      }
      e = l, l = e.parentNode;
    }
    return null;
  }
  function Pl(e) {
    if (e = e[Ke] || e[Wl]) {
      var t = e.tag;
      if (t === 5 || t === 6 || t === 13 || t === 31 || t === 26 || t === 27 || t === 3)
        return e;
    }
    return null;
  }
  function wa(e) {
    var t = e.tag;
    if (t === 5 || t === 26 || t === 27 || t === 6) return e.stateNode;
    throw Error(r(33));
  }
  function ea(e) {
    var t = e[ys];
    return t || (t = e[ys] = { hoistableStyles: /* @__PURE__ */ new Map(), hoistableScripts: /* @__PURE__ */ new Map() }), t;
  }
  function Ve(e) {
    e[Qa] = !0;
  }
  var ps = /* @__PURE__ */ new Set(), vs = {};
  function Cl(e, t) {
    ta(e, t), ta(e + "Capture", t);
  }
  function ta(e, t) {
    for (vs[e] = t, e = 0; e < t.length; e++)
      ps.add(t[e]);
  }
  var sm = RegExp(
    "^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"
  ), gs = {}, bs = {};
  function rm(e) {
    return Si.call(bs, e) ? !0 : Si.call(gs, e) ? !1 : sm.test(e) ? bs[e] = !0 : (gs[e] = !0, !1);
  }
  function Fn(e, t, l) {
    if (rm(t))
      if (l === null) e.removeAttribute(t);
      else {
        switch (typeof l) {
          case "undefined":
          case "function":
          case "symbol":
            e.removeAttribute(t);
            return;
          case "boolean":
            var a = t.toLowerCase().slice(0, 5);
            if (a !== "data-" && a !== "aria-") {
              e.removeAttribute(t);
              return;
            }
        }
        e.setAttribute(t, "" + l);
      }
  }
  function $n(e, t, l) {
    if (l === null) e.removeAttribute(t);
    else {
      switch (typeof l) {
        case "undefined":
        case "function":
        case "symbol":
        case "boolean":
          e.removeAttribute(t);
          return;
      }
      e.setAttribute(t, "" + l);
    }
  }
  function Xt(e, t, l, a) {
    if (a === null) e.removeAttribute(l);
    else {
      switch (typeof a) {
        case "undefined":
        case "function":
        case "symbol":
        case "boolean":
          e.removeAttribute(l);
          return;
      }
      e.setAttributeNS(t, l, "" + a);
    }
  }
  function St(e) {
    switch (typeof e) {
      case "bigint":
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
  function Ss(e) {
    var t = e.type;
    return (e = e.nodeName) && e.toLowerCase() === "input" && (t === "checkbox" || t === "radio");
  }
  function om(e, t, l) {
    var a = Object.getOwnPropertyDescriptor(
      e.constructor.prototype,
      t
    );
    if (!e.hasOwnProperty(t) && typeof a != "undefined" && typeof a.get == "function" && typeof a.set == "function") {
      var n = a.get, u = a.set;
      return Object.defineProperty(e, t, {
        configurable: !0,
        get: function() {
          return n.call(this);
        },
        set: function(c) {
          l = "" + c, u.call(this, c);
        }
      }), Object.defineProperty(e, t, {
        enumerable: a.enumerable
      }), {
        getValue: function() {
          return l;
        },
        setValue: function(c) {
          l = "" + c;
        },
        stopTracking: function() {
          e._valueTracker = null, delete e[t];
        }
      };
    }
  }
  function Ri(e) {
    if (!e._valueTracker) {
      var t = Ss(e) ? "checked" : "value";
      e._valueTracker = om(
        e,
        t,
        "" + e[t]
      );
    }
  }
  function Es(e) {
    if (!e) return !1;
    var t = e._valueTracker;
    if (!t) return !0;
    var l = t.getValue(), a = "";
    return e && (a = Ss(e) ? e.checked ? "true" : "false" : e.value), e = a, e !== l ? (t.setValue(e), !0) : !1;
  }
  function Wn(e) {
    if (e = e || (typeof document != "undefined" ? document : void 0), typeof e == "undefined") return null;
    try {
      return e.activeElement || e.body;
    } catch (t) {
      return e.body;
    }
  }
  var dm = /[\n"\\]/g;
  function Et(e) {
    return e.replace(
      dm,
      function(t) {
        return "\\" + t.charCodeAt(0).toString(16) + " ";
      }
    );
  }
  function Ni(e, t, l, a, n, u, c, o) {
    e.name = "", c != null && typeof c != "function" && typeof c != "symbol" && typeof c != "boolean" ? e.type = c : e.removeAttribute("type"), t != null ? c === "number" ? (t === 0 && e.value === "" || e.value != t) && (e.value = "" + St(t)) : e.value !== "" + St(t) && (e.value = "" + St(t)) : c !== "submit" && c !== "reset" || e.removeAttribute("value"), t != null ? Oi(e, c, St(t)) : l != null ? Oi(e, c, St(l)) : a != null && e.removeAttribute("value"), n == null && u != null && (e.defaultChecked = !!u), n != null && (e.checked = n && typeof n != "function" && typeof n != "symbol"), o != null && typeof o != "function" && typeof o != "symbol" && typeof o != "boolean" ? e.name = "" + St(o) : e.removeAttribute("name");
  }
  function js(e, t, l, a, n, u, c, o) {
    if (u != null && typeof u != "function" && typeof u != "symbol" && typeof u != "boolean" && (e.type = u), t != null || l != null) {
      if (!(u !== "submit" && u !== "reset" || t != null)) {
        Ri(e);
        return;
      }
      l = l != null ? "" + St(l) : "", t = t != null ? "" + St(t) : l, o || t === e.value || (e.value = t), e.defaultValue = t;
    }
    a = a != null ? a : n, a = typeof a != "function" && typeof a != "symbol" && !!a, e.checked = o ? e.checked : !!a, e.defaultChecked = !!a, c != null && typeof c != "function" && typeof c != "symbol" && typeof c != "boolean" && (e.name = c), Ri(e);
  }
  function Oi(e, t, l) {
    t === "number" && Wn(e.ownerDocument) === e || e.defaultValue === "" + l || (e.defaultValue = "" + l);
  }
  function la(e, t, l, a) {
    if (e = e.options, t) {
      t = {};
      for (var n = 0; n < l.length; n++)
        t["$" + l[n]] = !0;
      for (l = 0; l < e.length; l++)
        n = t.hasOwnProperty("$" + e[l].value), e[l].selected !== n && (e[l].selected = n), n && a && (e[l].defaultSelected = !0);
    } else {
      for (l = "" + St(l), t = null, n = 0; n < e.length; n++) {
        if (e[n].value === l) {
          e[n].selected = !0, a && (e[n].defaultSelected = !0);
          return;
        }
        t !== null || e[n].disabled || (t = e[n]);
      }
      t !== null && (t.selected = !0);
    }
  }
  function _s(e, t, l) {
    if (t != null && (t = "" + St(t), t !== e.value && (e.value = t), l == null)) {
      e.defaultValue !== t && (e.defaultValue = t);
      return;
    }
    e.defaultValue = l != null ? "" + St(l) : "";
  }
  function Ts(e, t, l, a) {
    if (t == null) {
      if (a != null) {
        if (l != null) throw Error(r(92));
        if (q(a)) {
          if (1 < a.length) throw Error(r(93));
          a = a[0];
        }
        l = a;
      }
      l == null && (l = ""), t = l;
    }
    l = St(t), e.defaultValue = l, a = e.textContent, a === l && a !== "" && a !== null && (e.value = a), Ri(e);
  }
  function aa(e, t) {
    if (t) {
      var l = e.firstChild;
      if (l && l === e.lastChild && l.nodeType === 3) {
        l.nodeValue = t;
        return;
      }
    }
    e.textContent = t;
  }
  var hm = new Set(
    "animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(
      " "
    )
  );
  function xs(e, t, l) {
    var a = t.indexOf("--") === 0;
    l == null || typeof l == "boolean" || l === "" ? a ? e.setProperty(t, "") : t === "float" ? e.cssFloat = "" : e[t] = "" : a ? e.setProperty(t, l) : typeof l != "number" || l === 0 || hm.has(t) ? t === "float" ? e.cssFloat = l : e[t] = ("" + l).trim() : e[t] = l + "px";
  }
  function As(e, t, l) {
    if (t != null && typeof t != "object")
      throw Error(r(62));
    if (e = e.style, l != null) {
      for (var a in l)
        !l.hasOwnProperty(a) || t != null && t.hasOwnProperty(a) || (a.indexOf("--") === 0 ? e.setProperty(a, "") : a === "float" ? e.cssFloat = "" : e[a] = "");
      for (var n in t)
        a = t[n], t.hasOwnProperty(n) && l[n] !== a && xs(e, n, a);
    } else
      for (var u in t)
        t.hasOwnProperty(u) && xs(e, u, t[u]);
  }
  function Mi(e) {
    if (e.indexOf("-") === -1) return !1;
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
  var mm = /* @__PURE__ */ new Map([
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
  ]), ym = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
  function In(e) {
    return ym.test("" + e) ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')" : e;
  }
  function Qt() {
  }
  var Di = null;
  function Ci(e) {
    return e = e.target || e.srcElement || window, e.correspondingUseElement && (e = e.correspondingUseElement), e.nodeType === 3 ? e.parentNode : e;
  }
  var na = null, ua = null;
  function zs(e) {
    var t = Pl(e);
    if (t && (e = t.stateNode)) {
      var l = e[lt] || null;
      e: switch (e = t.stateNode, t.type) {
        case "input":
          if (Ni(
            e,
            l.value,
            l.defaultValue,
            l.defaultValue,
            l.checked,
            l.defaultChecked,
            l.type,
            l.name
          ), t = l.name, l.type === "radio" && t != null) {
            for (l = e; l.parentNode; ) l = l.parentNode;
            for (l = l.querySelectorAll(
              'input[name="' + Et(
                "" + t
              ) + '"][type="radio"]'
            ), t = 0; t < l.length; t++) {
              var a = l[t];
              if (a !== e && a.form === e.form) {
                var n = a[lt] || null;
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
            for (t = 0; t < l.length; t++)
              a = l[t], a.form === e.form && Es(a);
          }
          break e;
        case "textarea":
          _s(e, l.value, l.defaultValue);
          break e;
        case "select":
          t = l.value, t != null && la(e, !!l.multiple, t, !1);
      }
    }
  }
  var Ui = !1;
  function Rs(e, t, l) {
    if (Ui) return e(t, l);
    Ui = !0;
    try {
      var a = e(t);
      return a;
    } finally {
      if (Ui = !1, (na !== null || ua !== null) && (Yu(), na && (t = na, e = ua, ua = na = null, zs(t), e)))
        for (t = 0; t < e.length; t++) zs(e[t]);
    }
  }
  function Za(e, t) {
    var l = e.stateNode;
    if (l === null) return null;
    var a = l[lt] || null;
    if (a === null) return null;
    l = a[t];
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
        (a = !a.disabled) || (e = e.type, a = !(e === "button" || e === "input" || e === "select" || e === "textarea")), e = !a;
        break e;
      default:
        e = !1;
    }
    if (e) return null;
    if (l && typeof l != "function")
      throw Error(
        r(231, t, typeof l)
      );
    return l;
  }
  var wt = !(typeof window == "undefined" || typeof window.document == "undefined" || typeof window.document.createElement == "undefined"), Hi = !1;
  if (wt)
    try {
      var Va = {};
      Object.defineProperty(Va, "passive", {
        get: function() {
          Hi = !0;
        }
      }), window.addEventListener("test", Va, Va), window.removeEventListener("test", Va, Va);
    } catch (e) {
      Hi = !1;
    }
  var fl = null, Bi = null, Pn = null;
  function Ns() {
    if (Pn) return Pn;
    var e, t = Bi, l = t.length, a, n = "value" in fl ? fl.value : fl.textContent, u = n.length;
    for (e = 0; e < l && t[e] === n[e]; e++) ;
    var c = l - e;
    for (a = 1; a <= c && t[l - a] === n[u - a]; a++) ;
    return Pn = n.slice(e, 1 < a ? 1 - a : void 0);
  }
  function eu(e) {
    var t = e.keyCode;
    return "charCode" in e ? (e = e.charCode, e === 0 && t === 13 && (e = 13)) : e = t, e === 10 && (e = 13), 32 <= e || e === 13 ? e : 0;
  }
  function tu() {
    return !0;
  }
  function Os() {
    return !1;
  }
  function at(e) {
    function t(l, a, n, u, c) {
      this._reactName = l, this._targetInst = n, this.type = a, this.nativeEvent = u, this.target = c, this.currentTarget = null;
      for (var o in e)
        e.hasOwnProperty(o) && (l = e[o], this[o] = l ? l(u) : u[o]);
      return this.isDefaultPrevented = (u.defaultPrevented != null ? u.defaultPrevented : u.returnValue === !1) ? tu : Os, this.isPropagationStopped = Os, this;
    }
    return H(t.prototype, {
      preventDefault: function() {
        this.defaultPrevented = !0;
        var l = this.nativeEvent;
        l && (l.preventDefault ? l.preventDefault() : typeof l.returnValue != "unknown" && (l.returnValue = !1), this.isDefaultPrevented = tu);
      },
      stopPropagation: function() {
        var l = this.nativeEvent;
        l && (l.stopPropagation ? l.stopPropagation() : typeof l.cancelBubble != "unknown" && (l.cancelBubble = !0), this.isPropagationStopped = tu);
      },
      persist: function() {
      },
      isPersistent: tu
    }), t;
  }
  var Ul = {
    eventPhase: 0,
    bubbles: 0,
    cancelable: 0,
    timeStamp: function(e) {
      return e.timeStamp || Date.now();
    },
    defaultPrevented: 0,
    isTrusted: 0
  }, lu = at(Ul), Ja = H({}, Ul, { view: 0, detail: 0 }), pm = at(Ja), Li, qi, Ka, au = H({}, Ja, {
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
    relatedTarget: function(e) {
      return e.relatedTarget === void 0 ? e.fromElement === e.srcElement ? e.toElement : e.fromElement : e.relatedTarget;
    },
    movementX: function(e) {
      return "movementX" in e ? e.movementX : (e !== Ka && (Ka && e.type === "mousemove" ? (Li = e.screenX - Ka.screenX, qi = e.screenY - Ka.screenY) : qi = Li = 0, Ka = e), Li);
    },
    movementY: function(e) {
      return "movementY" in e ? e.movementY : qi;
    }
  }), Ms = at(au), vm = H({}, au, { dataTransfer: 0 }), gm = at(vm), bm = H({}, Ja, { relatedTarget: 0 }), Yi = at(bm), Sm = H({}, Ul, {
    animationName: 0,
    elapsedTime: 0,
    pseudoElement: 0
  }), Em = at(Sm), jm = H({}, Ul, {
    clipboardData: function(e) {
      return "clipboardData" in e ? e.clipboardData : window.clipboardData;
    }
  }), _m = at(jm), Tm = H({}, Ul, { data: 0 }), Ds = at(Tm), xm = {
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
  function Rm(e) {
    var t = this.nativeEvent;
    return t.getModifierState ? t.getModifierState(e) : (e = zm[e]) ? !!t[e] : !1;
  }
  function Gi() {
    return Rm;
  }
  var Nm = H({}, Ja, {
    key: function(e) {
      if (e.key) {
        var t = xm[e.key] || e.key;
        if (t !== "Unidentified") return t;
      }
      return e.type === "keypress" ? (e = eu(e), e === 13 ? "Enter" : String.fromCharCode(e)) : e.type === "keydown" || e.type === "keyup" ? Am[e.keyCode] || "Unidentified" : "";
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
    charCode: function(e) {
      return e.type === "keypress" ? eu(e) : 0;
    },
    keyCode: function(e) {
      return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
    },
    which: function(e) {
      return e.type === "keypress" ? eu(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
    }
  }), Om = at(Nm), Mm = H({}, au, {
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
  }), Cs = at(Mm), Dm = H({}, Ja, {
    touches: 0,
    targetTouches: 0,
    changedTouches: 0,
    altKey: 0,
    metaKey: 0,
    ctrlKey: 0,
    shiftKey: 0,
    getModifierState: Gi
  }), Cm = at(Dm), Um = H({}, Ul, {
    propertyName: 0,
    elapsedTime: 0,
    pseudoElement: 0
  }), Hm = at(Um), Bm = H({}, au, {
    deltaX: function(e) {
      return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
    },
    deltaY: function(e) {
      return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
    },
    deltaZ: 0,
    deltaMode: 0
  }), Lm = at(Bm), qm = H({}, Ul, {
    newState: 0,
    oldState: 0
  }), Ym = at(qm), Gm = [9, 13, 27, 32], Xi = wt && "CompositionEvent" in window, ka = null;
  wt && "documentMode" in document && (ka = document.documentMode);
  var Xm = wt && "TextEvent" in window && !ka, Us = wt && (!Xi || ka && 8 < ka && 11 >= ka), Hs = " ", Bs = !1;
  function Ls(e, t) {
    switch (e) {
      case "keyup":
        return Gm.indexOf(t.keyCode) !== -1;
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
  function qs(e) {
    return e = e.detail, typeof e == "object" && "data" in e ? e.data : null;
  }
  var ia = !1;
  function Qm(e, t) {
    switch (e) {
      case "compositionend":
        return qs(t);
      case "keypress":
        return t.which !== 32 ? null : (Bs = !0, Hs);
      case "textInput":
        return e = t.data, e === Hs && Bs ? null : e;
      default:
        return null;
    }
  }
  function wm(e, t) {
    if (ia)
      return e === "compositionend" || !Xi && Ls(e, t) ? (e = Ns(), Pn = Bi = fl = null, ia = !1, e) : null;
    switch (e) {
      case "paste":
        return null;
      case "keypress":
        if (!(t.ctrlKey || t.altKey || t.metaKey) || t.ctrlKey && t.altKey) {
          if (t.char && 1 < t.char.length)
            return t.char;
          if (t.which) return String.fromCharCode(t.which);
        }
        return null;
      case "compositionend":
        return Us && t.locale !== "ko" ? null : t.data;
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
  function Ys(e) {
    var t = e && e.nodeName && e.nodeName.toLowerCase();
    return t === "input" ? !!Zm[e.type] : t === "textarea";
  }
  function Gs(e, t, l, a) {
    na ? ua ? ua.push(a) : ua = [a] : na = a, t = Ju(t, "onChange"), 0 < t.length && (l = new lu(
      "onChange",
      "change",
      null,
      l,
      a
    ), e.push({ event: l, listeners: t }));
  }
  var Fa = null, $a = null;
  function Vm(e) {
    _d(e, 0);
  }
  function nu(e) {
    var t = wa(e);
    if (Es(t)) return e;
  }
  function Xs(e, t) {
    if (e === "change") return t;
  }
  var Qs = !1;
  if (wt) {
    var Qi;
    if (wt) {
      var wi = "oninput" in document;
      if (!wi) {
        var ws = document.createElement("div");
        ws.setAttribute("oninput", "return;"), wi = typeof ws.oninput == "function";
      }
      Qi = wi;
    } else Qi = !1;
    Qs = Qi && (!document.documentMode || 9 < document.documentMode);
  }
  function Zs() {
    Fa && (Fa.detachEvent("onpropertychange", Vs), $a = Fa = null);
  }
  function Vs(e) {
    if (e.propertyName === "value" && nu($a)) {
      var t = [];
      Gs(
        t,
        $a,
        e,
        Ci(e)
      ), Rs(Vm, t);
    }
  }
  function Jm(e, t, l) {
    e === "focusin" ? (Zs(), Fa = t, $a = l, Fa.attachEvent("onpropertychange", Vs)) : e === "focusout" && Zs();
  }
  function Km(e) {
    if (e === "selectionchange" || e === "keyup" || e === "keydown")
      return nu($a);
  }
  function km(e, t) {
    if (e === "click") return nu(t);
  }
  function Fm(e, t) {
    if (e === "input" || e === "change")
      return nu(t);
  }
  function $m(e, t) {
    return e === t && (e !== 0 || 1 / e === 1 / t) || e !== e && t !== t;
  }
  var dt = typeof Object.is == "function" ? Object.is : $m;
  function Wa(e, t) {
    if (dt(e, t)) return !0;
    if (typeof e != "object" || e === null || typeof t != "object" || t === null)
      return !1;
    var l = Object.keys(e), a = Object.keys(t);
    if (l.length !== a.length) return !1;
    for (a = 0; a < l.length; a++) {
      var n = l[a];
      if (!Si.call(t, n) || !dt(e[n], t[n]))
        return !1;
    }
    return !0;
  }
  function Js(e) {
    for (; e && e.firstChild; ) e = e.firstChild;
    return e;
  }
  function Ks(e, t) {
    var l = Js(e);
    e = 0;
    for (var a; l; ) {
      if (l.nodeType === 3) {
        if (a = e + l.textContent.length, e <= t && a >= t)
          return { node: l, offset: t - e };
        e = a;
      }
      e: {
        for (; l; ) {
          if (l.nextSibling) {
            l = l.nextSibling;
            break e;
          }
          l = l.parentNode;
        }
        l = void 0;
      }
      l = Js(l);
    }
  }
  function ks(e, t) {
    return e && t ? e === t ? !0 : e && e.nodeType === 3 ? !1 : t && t.nodeType === 3 ? ks(e, t.parentNode) : "contains" in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1 : !1;
  }
  function Fs(e) {
    e = e != null && e.ownerDocument != null && e.ownerDocument.defaultView != null ? e.ownerDocument.defaultView : window;
    for (var t = Wn(e.document); t instanceof e.HTMLIFrameElement; ) {
      try {
        var l = typeof t.contentWindow.location.href == "string";
      } catch (a) {
        l = !1;
      }
      if (l) e = t.contentWindow;
      else break;
      t = Wn(e.document);
    }
    return t;
  }
  function Zi(e) {
    var t = e && e.nodeName && e.nodeName.toLowerCase();
    return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true");
  }
  var Wm = wt && "documentMode" in document && 11 >= document.documentMode, ca = null, Vi = null, Ia = null, Ji = !1;
  function $s(e, t, l) {
    var a = l.window === l ? l.document : l.nodeType === 9 ? l : l.ownerDocument;
    Ji || ca == null || ca !== Wn(a) || (a = ca, "selectionStart" in a && Zi(a) ? a = { start: a.selectionStart, end: a.selectionEnd } : (a = (a.ownerDocument && a.ownerDocument.defaultView || window).getSelection(), a = {
      anchorNode: a.anchorNode,
      anchorOffset: a.anchorOffset,
      focusNode: a.focusNode,
      focusOffset: a.focusOffset
    }), Ia && Wa(Ia, a) || (Ia = a, a = Ju(Vi, "onSelect"), 0 < a.length && (t = new lu(
      "onSelect",
      "select",
      null,
      t,
      l
    ), e.push({ event: t, listeners: a }), t.target = ca)));
  }
  function Hl(e, t) {
    var l = {};
    return l[e.toLowerCase()] = t.toLowerCase(), l["Webkit" + e] = "webkit" + t, l["Moz" + e] = "moz" + t, l;
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
  wt && (Ws = document.createElement("div").style, "AnimationEvent" in window || (delete fa.animationend.animation, delete fa.animationiteration.animation, delete fa.animationstart.animation), "TransitionEvent" in window || delete fa.transitionend.transition);
  function Bl(e) {
    if (Ki[e]) return Ki[e];
    if (!fa[e]) return e;
    var t = fa[e], l;
    for (l in t)
      if (t.hasOwnProperty(l) && l in Ws)
        return Ki[e] = t[l];
    return e;
  }
  var Is = Bl("animationend"), Ps = Bl("animationiteration"), er = Bl("animationstart"), Im = Bl("transitionrun"), Pm = Bl("transitionstart"), ey = Bl("transitioncancel"), tr = Bl("transitionend"), lr = /* @__PURE__ */ new Map(), ki = "abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(
    " "
  );
  ki.push("scrollEnd");
  function Mt(e, t) {
    lr.set(e, t), Cl(t, [e]);
  }
  var uu = typeof reportError == "function" ? reportError : function(e) {
    if (typeof window == "object" && typeof window.ErrorEvent == "function") {
      var t = new window.ErrorEvent("error", {
        bubbles: !0,
        cancelable: !0,
        message: typeof e == "object" && e !== null && typeof e.message == "string" ? String(e.message) : String(e),
        error: e
      });
      if (!window.dispatchEvent(t)) return;
    } else if (typeof i == "object" && typeof i.emit == "function") {
      i.emit("uncaughtException", e);
      return;
    }
    console.error(e);
  }, jt = [], sa = 0, Fi = 0;
  function iu() {
    for (var e = sa, t = Fi = sa = 0; t < e; ) {
      var l = jt[t];
      jt[t++] = null;
      var a = jt[t];
      jt[t++] = null;
      var n = jt[t];
      jt[t++] = null;
      var u = jt[t];
      if (jt[t++] = null, a !== null && n !== null) {
        var c = a.pending;
        c === null ? n.next = n : (n.next = c.next, c.next = n), a.pending = n;
      }
      u !== 0 && ar(l, n, u);
    }
  }
  function cu(e, t, l, a) {
    jt[sa++] = e, jt[sa++] = t, jt[sa++] = l, jt[sa++] = a, Fi |= a, e.lanes |= a, e = e.alternate, e !== null && (e.lanes |= a);
  }
  function $i(e, t, l, a) {
    return cu(e, t, l, a), fu(e);
  }
  function Ll(e, t) {
    return cu(e, null, null, t), fu(e);
  }
  function ar(e, t, l) {
    e.lanes |= l;
    var a = e.alternate;
    a !== null && (a.lanes |= l);
    for (var n = !1, u = e.return; u !== null; )
      u.childLanes |= l, a = u.alternate, a !== null && (a.childLanes |= l), u.tag === 22 && (e = u.stateNode, e === null || e._visibility & 1 || (n = !0)), e = u, u = u.return;
    return e.tag === 3 ? (u = e.stateNode, n && t !== null && (n = 31 - ot(l), e = u.hiddenUpdates, a = e[n], a === null ? e[n] = [t] : a.push(t), t.lane = l | 536870912), u) : null;
  }
  function fu(e) {
    if (50 < En)
      throw En = 0, uf = null, Error(r(185));
    for (var t = e.return; t !== null; )
      e = t, t = e.return;
    return e.tag === 3 ? e.stateNode : null;
  }
  var ra = {};
  function ty(e, t, l, a) {
    this.tag = e, this.key = l, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.refCleanup = this.ref = null, this.pendingProps = t, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = a, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null;
  }
  function ht(e, t, l, a) {
    return new ty(e, t, l, a);
  }
  function Wi(e) {
    return e = e.prototype, !(!e || !e.isReactComponent);
  }
  function Zt(e, t) {
    var l = e.alternate;
    return l === null ? (l = ht(
      e.tag,
      t,
      e.key,
      e.mode
    ), l.elementType = e.elementType, l.type = e.type, l.stateNode = e.stateNode, l.alternate = e, e.alternate = l) : (l.pendingProps = t, l.type = e.type, l.flags = 0, l.subtreeFlags = 0, l.deletions = null), l.flags = e.flags & 65011712, l.childLanes = e.childLanes, l.lanes = e.lanes, l.child = e.child, l.memoizedProps = e.memoizedProps, l.memoizedState = e.memoizedState, l.updateQueue = e.updateQueue, t = e.dependencies, l.dependencies = t === null ? null : { lanes: t.lanes, firstContext: t.firstContext }, l.sibling = e.sibling, l.index = e.index, l.ref = e.ref, l.refCleanup = e.refCleanup, l;
  }
  function nr(e, t) {
    e.flags &= 65011714;
    var l = e.alternate;
    return l === null ? (e.childLanes = 0, e.lanes = t, e.child = null, e.subtreeFlags = 0, e.memoizedProps = null, e.memoizedState = null, e.updateQueue = null, e.dependencies = null, e.stateNode = null) : (e.childLanes = l.childLanes, e.lanes = l.lanes, e.child = l.child, e.subtreeFlags = 0, e.deletions = null, e.memoizedProps = l.memoizedProps, e.memoizedState = l.memoizedState, e.updateQueue = l.updateQueue, e.type = l.type, t = l.dependencies, e.dependencies = t === null ? null : {
      lanes: t.lanes,
      firstContext: t.firstContext
    }), e;
  }
  function su(e, t, l, a, n, u) {
    var c = 0;
    if (a = e, typeof e == "function") Wi(e) && (c = 1);
    else if (typeof e == "string")
      c = ip(
        e,
        l,
        k.current
      ) ? 26 : e === "html" || e === "head" || e === "body" ? 27 : 5;
    else
      e: switch (e) {
        case He:
          return e = ht(31, l, t, n), e.elementType = He, e.lanes = u, e;
        case X:
          return ql(l.children, n, u, t);
        case G:
          c = 8, n |= 24;
          break;
        case $:
          return e = ht(12, l, t, n | 2), e.elementType = $, e.lanes = u, e;
        case be:
          return e = ht(13, l, t, n), e.elementType = be, e.lanes = u, e;
        case oe:
          return e = ht(19, l, t, n), e.elementType = oe, e.lanes = u, e;
        default:
          if (typeof e == "object" && e !== null)
            switch (e.$$typeof) {
              case ae:
                c = 10;
                break e;
              case I:
                c = 9;
                break e;
              case fe:
                c = 11;
                break e;
              case P:
                c = 14;
                break e;
              case Re:
                c = 16, a = null;
                break e;
            }
          c = 29, l = Error(
            r(130, e === null ? "null" : typeof e, "")
          ), a = null;
      }
    return t = ht(c, l, t, n), t.elementType = e, t.type = a, t.lanes = u, t;
  }
  function ql(e, t, l, a) {
    return e = ht(7, e, a, t), e.lanes = l, e;
  }
  function Ii(e, t, l) {
    return e = ht(6, e, null, t), e.lanes = l, e;
  }
  function ur(e) {
    var t = ht(18, null, null, 0);
    return t.stateNode = e, t;
  }
  function Pi(e, t, l) {
    return t = ht(
      4,
      e.children !== null ? e.children : [],
      e.key,
      t
    ), t.lanes = l, t.stateNode = {
      containerInfo: e.containerInfo,
      pendingChildren: null,
      implementation: e.implementation
    }, t;
  }
  var ir = /* @__PURE__ */ new WeakMap();
  function _t(e, t) {
    if (typeof e == "object" && e !== null) {
      var l = ir.get(e);
      return l !== void 0 ? l : (t = {
        value: e,
        source: t,
        stack: us(t)
      }, ir.set(e, t), t);
    }
    return {
      value: e,
      source: t,
      stack: us(t)
    };
  }
  var oa = [], da = 0, ru = null, Pa = 0, Tt = [], xt = 0, sl = null, Ht = 1, Bt = "";
  function Vt(e, t) {
    oa[da++] = Pa, oa[da++] = ru, ru = e, Pa = t;
  }
  function cr(e, t, l) {
    Tt[xt++] = Ht, Tt[xt++] = Bt, Tt[xt++] = sl, sl = e;
    var a = Ht;
    e = Bt;
    var n = 32 - ot(a) - 1;
    a &= ~(1 << n), l += 1;
    var u = 32 - ot(t) + n;
    if (30 < u) {
      var c = n - n % 5;
      u = (a & (1 << c) - 1).toString(32), a >>= c, n -= c, Ht = 1 << 32 - ot(t) + n | l << n | a, Bt = u + e;
    } else
      Ht = 1 << u | l << n | a, Bt = e;
  }
  function ec(e) {
    e.return !== null && (Vt(e, 1), cr(e, 1, 0));
  }
  function tc(e) {
    for (; e === ru; )
      ru = oa[--da], oa[da] = null, Pa = oa[--da], oa[da] = null;
    for (; e === sl; )
      sl = Tt[--xt], Tt[xt] = null, Bt = Tt[--xt], Tt[xt] = null, Ht = Tt[--xt], Tt[xt] = null;
  }
  function fr(e, t) {
    Tt[xt++] = Ht, Tt[xt++] = Bt, Tt[xt++] = sl, Ht = t.id, Bt = t.overflow, sl = e;
  }
  var ke = null, Ne = null, de = !1, rl = null, At = !1, lc = Error(r(519));
  function ol(e) {
    var t = Error(
      r(
        418,
        1 < arguments.length && arguments[1] !== void 0 && arguments[1] ? "text" : "HTML",
        ""
      )
    );
    throw en(_t(t, e)), lc;
  }
  function sr(e) {
    var t = e.stateNode, l = e.type, a = e.memoizedProps;
    switch (t[Ke] = e, t[lt] = a, l) {
      case "dialog":
        ce("cancel", t), ce("close", t);
        break;
      case "iframe":
      case "object":
      case "embed":
        ce("load", t);
        break;
      case "video":
      case "audio":
        for (l = 0; l < _n.length; l++)
          ce(_n[l], t);
        break;
      case "source":
        ce("error", t);
        break;
      case "img":
      case "image":
      case "link":
        ce("error", t), ce("load", t);
        break;
      case "details":
        ce("toggle", t);
        break;
      case "input":
        ce("invalid", t), js(
          t,
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
        ce("invalid", t);
        break;
      case "textarea":
        ce("invalid", t), Ts(t, a.value, a.defaultValue, a.children);
    }
    l = a.children, typeof l != "string" && typeof l != "number" && typeof l != "bigint" || t.textContent === "" + l || a.suppressHydrationWarning === !0 || zd(t.textContent, l) ? (a.popover != null && (ce("beforetoggle", t), ce("toggle", t)), a.onScroll != null && ce("scroll", t), a.onScrollEnd != null && ce("scrollend", t), a.onClick != null && (t.onclick = Qt), t = !0) : t = !1, t || ol(e, !0);
  }
  function rr(e) {
    for (ke = e.return; ke; )
      switch (ke.tag) {
        case 5:
        case 31:
        case 13:
          At = !1;
          return;
        case 27:
        case 3:
          At = !0;
          return;
        default:
          ke = ke.return;
      }
  }
  function ha(e) {
    if (e !== ke) return !1;
    if (!de) return rr(e), de = !0, !1;
    var t = e.tag, l;
    if ((l = t !== 3 && t !== 27) && ((l = t === 5) && (l = e.type, l = !(l !== "form" && l !== "button") || Ef(e.type, e.memoizedProps)), l = !l), l && Ne && ol(e), rr(e), t === 13) {
      if (e = e.memoizedState, e = e !== null ? e.dehydrated : null, !e) throw Error(r(317));
      Ne = Bd(e);
    } else if (t === 31) {
      if (e = e.memoizedState, e = e !== null ? e.dehydrated : null, !e) throw Error(r(317));
      Ne = Bd(e);
    } else
      t === 27 ? (t = Ne, xl(e.type) ? (e = Af, Af = null, Ne = e) : Ne = t) : Ne = ke ? Rt(e.stateNode.nextSibling) : null;
    return !0;
  }
  function Yl() {
    Ne = ke = null, de = !1;
  }
  function ac() {
    var e = rl;
    return e !== null && (ct === null ? ct = e : ct.push.apply(
      ct,
      e
    ), rl = null), e;
  }
  function en(e) {
    rl === null ? rl = [e] : rl.push(e);
  }
  var nc = y(null), Gl = null, Jt = null;
  function dl(e, t, l) {
    L(nc, t._currentValue), t._currentValue = l;
  }
  function Kt(e) {
    e._currentValue = nc.current, O(nc);
  }
  function uc(e, t, l) {
    for (; e !== null; ) {
      var a = e.alternate;
      if ((e.childLanes & t) !== t ? (e.childLanes |= t, a !== null && (a.childLanes |= t)) : a !== null && (a.childLanes & t) !== t && (a.childLanes |= t), e === l) break;
      e = e.return;
    }
  }
  function ic(e, t, l, a) {
    var n = e.child;
    for (n !== null && (n.return = e); n !== null; ) {
      var u = n.dependencies;
      if (u !== null) {
        var c = n.child;
        u = u.firstContext;
        e: for (; u !== null; ) {
          var o = u;
          u = n;
          for (var m = 0; m < t.length; m++)
            if (o.context === t[m]) {
              u.lanes |= l, o = u.alternate, o !== null && (o.lanes |= l), uc(
                u.return,
                l,
                e
              ), a || (c = null);
              break e;
            }
          u = o.next;
        }
      } else if (n.tag === 18) {
        if (c = n.return, c === null) throw Error(r(341));
        c.lanes |= l, u = c.alternate, u !== null && (u.lanes |= l), uc(c, l, e), c = null;
      } else c = n.child;
      if (c !== null) c.return = n;
      else
        for (c = n; c !== null; ) {
          if (c === e) {
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
  function ma(e, t, l, a) {
    e = null;
    for (var n = t, u = !1; n !== null; ) {
      if (!u) {
        if ((n.flags & 524288) !== 0) u = !0;
        else if ((n.flags & 262144) !== 0) break;
      }
      if (n.tag === 10) {
        var c = n.alternate;
        if (c === null) throw Error(r(387));
        if (c = c.memoizedProps, c !== null) {
          var o = n.type;
          dt(n.pendingProps.value, c.value) || (e !== null ? e.push(o) : e = [o]);
        }
      } else if (n === ge.current) {
        if (c = n.alternate, c === null) throw Error(r(387));
        c.memoizedState.memoizedState !== n.memoizedState.memoizedState && (e !== null ? e.push(Rn) : e = [Rn]);
      }
      n = n.return;
    }
    e !== null && ic(
      t,
      e,
      l,
      a
    ), t.flags |= 262144;
  }
  function ou(e) {
    for (e = e.firstContext; e !== null; ) {
      if (!dt(
        e.context._currentValue,
        e.memoizedValue
      ))
        return !0;
      e = e.next;
    }
    return !1;
  }
  function Xl(e) {
    Gl = e, Jt = null, e = e.dependencies, e !== null && (e.firstContext = null);
  }
  function Fe(e) {
    return or(Gl, e);
  }
  function du(e, t) {
    return Gl === null && Xl(e), or(e, t);
  }
  function or(e, t) {
    var l = t._currentValue;
    if (t = { context: t, memoizedValue: l, next: null }, Jt === null) {
      if (e === null) throw Error(r(308));
      Jt = t, e.dependencies = { lanes: 0, firstContext: t }, e.flags |= 524288;
    } else Jt = Jt.next = t;
    return l;
  }
  var ly = typeof AbortController != "undefined" ? AbortController : function() {
    var e = [], t = this.signal = {
      aborted: !1,
      addEventListener: function(l, a) {
        e.push(a);
      }
    };
    this.abort = function() {
      t.aborted = !0, e.forEach(function(l) {
        return l();
      });
    };
  }, ay = s.unstable_scheduleCallback, ny = s.unstable_NormalPriority, Ge = {
    $$typeof: ae,
    Consumer: null,
    Provider: null,
    _currentValue: null,
    _currentValue2: null,
    _threadCount: 0
  };
  function cc() {
    return {
      controller: new ly(),
      data: /* @__PURE__ */ new Map(),
      refCount: 0
    };
  }
  function tn(e) {
    e.refCount--, e.refCount === 0 && ay(ny, function() {
      e.controller.abort();
    });
  }
  var ln = null, fc = 0, ya = 0, pa = null;
  function uy(e, t) {
    if (ln === null) {
      var l = ln = [];
      fc = 0, ya = df(), pa = {
        status: "pending",
        value: void 0,
        then: function(a) {
          l.push(a);
        }
      };
    }
    return fc++, t.then(dr, dr), t;
  }
  function dr() {
    if (--fc === 0 && ln !== null) {
      pa !== null && (pa.status = "fulfilled");
      var e = ln;
      ln = null, ya = 0, pa = null;
      for (var t = 0; t < e.length; t++) (0, e[t])();
    }
  }
  function iy(e, t) {
    var l = [], a = {
      status: "pending",
      value: null,
      reason: null,
      then: function(n) {
        l.push(n);
      }
    };
    return e.then(
      function() {
        a.status = "fulfilled", a.value = t;
        for (var n = 0; n < l.length; n++) (0, l[n])(t);
      },
      function(n) {
        for (a.status = "rejected", a.reason = n, n = 0; n < l.length; n++)
          (0, l[n])(void 0);
      }
    ), a;
  }
  var hr = B.S;
  B.S = function(e, t) {
    Wo = st(), typeof t == "object" && t !== null && typeof t.then == "function" && uy(e, t), hr !== null && hr(e, t);
  };
  var Ql = y(null);
  function sc() {
    var e = Ql.current;
    return e !== null ? e : ze.pooledCache;
  }
  function hu(e, t) {
    t === null ? L(Ql, Ql.current) : L(Ql, t.pool);
  }
  function mr() {
    var e = sc();
    return e === null ? null : { parent: Ge._currentValue, pool: e };
  }
  var va = Error(r(460)), rc = Error(r(474)), mu = Error(r(542)), yu = { then: function() {
  } };
  function yr(e) {
    return e = e.status, e === "fulfilled" || e === "rejected";
  }
  function pr(e, t, l) {
    switch (l = e[l], l === void 0 ? e.push(t) : l !== t && (t.then(Qt, Qt), t = l), t.status) {
      case "fulfilled":
        return t.value;
      case "rejected":
        throw e = t.reason, gr(e), e;
      default:
        if (typeof t.status == "string") t.then(Qt, Qt);
        else {
          if (e = ze, e !== null && 100 < e.shellSuspendCounter)
            throw Error(r(482));
          e = t, e.status = "pending", e.then(
            function(a) {
              if (t.status === "pending") {
                var n = t;
                n.status = "fulfilled", n.value = a;
              }
            },
            function(a) {
              if (t.status === "pending") {
                var n = t;
                n.status = "rejected", n.reason = a;
              }
            }
          );
        }
        switch (t.status) {
          case "fulfilled":
            return t.value;
          case "rejected":
            throw e = t.reason, gr(e), e;
        }
        throw Zl = t, va;
    }
  }
  function wl(e) {
    try {
      var t = e._init;
      return t(e._payload);
    } catch (l) {
      throw l !== null && typeof l == "object" && typeof l.then == "function" ? (Zl = l, va) : l;
    }
  }
  var Zl = null;
  function vr() {
    if (Zl === null) throw Error(r(459));
    var e = Zl;
    return Zl = null, e;
  }
  function gr(e) {
    if (e === va || e === mu)
      throw Error(r(483));
  }
  var ga = null, an = 0;
  function pu(e) {
    var t = an;
    return an += 1, ga === null && (ga = []), pr(ga, e, t);
  }
  function nn(e, t) {
    t = t.props.ref, e.ref = t !== void 0 ? t : null;
  }
  function vu(e, t) {
    throw t.$$typeof === K ? Error(r(525)) : (e = Object.prototype.toString.call(t), Error(
      r(
        31,
        e === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : e
      )
    ));
  }
  function br(e) {
    function t(S, g) {
      if (e) {
        var j = S.deletions;
        j === null ? (S.deletions = [g], S.flags |= 16) : j.push(g);
      }
    }
    function l(S, g) {
      if (!e) return null;
      for (; g !== null; )
        t(S, g), g = g.sibling;
      return null;
    }
    function a(S) {
      for (var g = /* @__PURE__ */ new Map(); S !== null; )
        S.key !== null ? g.set(S.key, S) : g.set(S.index, S), S = S.sibling;
      return g;
    }
    function n(S, g) {
      return S = Zt(S, g), S.index = 0, S.sibling = null, S;
    }
    function u(S, g, j) {
      return S.index = j, e ? (j = S.alternate, j !== null ? (j = j.index, j < g ? (S.flags |= 67108866, g) : j) : (S.flags |= 67108866, g)) : (S.flags |= 1048576, g);
    }
    function c(S) {
      return e && S.alternate === null && (S.flags |= 67108866), S;
    }
    function o(S, g, j, M) {
      return g === null || g.tag !== 6 ? (g = Ii(j, S.mode, M), g.return = S, g) : (g = n(g, j), g.return = S, g);
    }
    function m(S, g, j, M) {
      var F = j.type;
      return F === X ? N(
        S,
        g,
        j.props.children,
        M,
        j.key
      ) : g !== null && (g.elementType === F || typeof F == "object" && F !== null && F.$$typeof === Re && wl(F) === g.type) ? (g = n(g, j.props), nn(g, j), g.return = S, g) : (g = su(
        j.type,
        j.key,
        j.props,
        null,
        S.mode,
        M
      ), nn(g, j), g.return = S, g);
    }
    function _(S, g, j, M) {
      return g === null || g.tag !== 4 || g.stateNode.containerInfo !== j.containerInfo || g.stateNode.implementation !== j.implementation ? (g = Pi(j, S.mode, M), g.return = S, g) : (g = n(g, j.children || []), g.return = S, g);
    }
    function N(S, g, j, M, F) {
      return g === null || g.tag !== 7 ? (g = ql(
        j,
        S.mode,
        M,
        F
      ), g.return = S, g) : (g = n(g, j), g.return = S, g);
    }
    function C(S, g, j) {
      if (typeof g == "string" && g !== "" || typeof g == "number" || typeof g == "bigint")
        return g = Ii(
          "" + g,
          S.mode,
          j
        ), g.return = S, g;
      if (typeof g == "object" && g !== null) {
        switch (g.$$typeof) {
          case J:
            return j = su(
              g.type,
              g.key,
              g.props,
              null,
              S.mode,
              j
            ), nn(j, g), j.return = S, j;
          case w:
            return g = Pi(
              g,
              S.mode,
              j
            ), g.return = S, g;
          case Re:
            return g = wl(g), C(S, g, j);
        }
        if (q(g) || Be(g))
          return g = ql(
            g,
            S.mode,
            j,
            null
          ), g.return = S, g;
        if (typeof g.then == "function")
          return C(S, pu(g), j);
        if (g.$$typeof === ae)
          return C(
            S,
            du(S, g),
            j
          );
        vu(S, g);
      }
      return null;
    }
    function x(S, g, j, M) {
      var F = g !== null ? g.key : null;
      if (typeof j == "string" && j !== "" || typeof j == "number" || typeof j == "bigint")
        return F !== null ? null : o(S, g, "" + j, M);
      if (typeof j == "object" && j !== null) {
        switch (j.$$typeof) {
          case J:
            return j.key === F ? m(S, g, j, M) : null;
          case w:
            return j.key === F ? _(S, g, j, M) : null;
          case Re:
            return j = wl(j), x(S, g, j, M);
        }
        if (q(j) || Be(j))
          return F !== null ? null : N(S, g, j, M, null);
        if (typeof j.then == "function")
          return x(
            S,
            g,
            pu(j),
            M
          );
        if (j.$$typeof === ae)
          return x(
            S,
            g,
            du(S, j),
            M
          );
        vu(S, j);
      }
      return null;
    }
    function z(S, g, j, M, F) {
      if (typeof M == "string" && M !== "" || typeof M == "number" || typeof M == "bigint")
        return S = S.get(j) || null, o(g, S, "" + M, F);
      if (typeof M == "object" && M !== null) {
        switch (M.$$typeof) {
          case J:
            return S = S.get(
              M.key === null ? j : M.key
            ) || null, m(g, S, M, F);
          case w:
            return S = S.get(
              M.key === null ? j : M.key
            ) || null, _(g, S, M, F);
          case Re:
            return M = wl(M), z(
              S,
              g,
              j,
              M,
              F
            );
        }
        if (q(M) || Be(M))
          return S = S.get(j) || null, N(g, S, M, F, null);
        if (typeof M.then == "function")
          return z(
            S,
            g,
            j,
            pu(M),
            F
          );
        if (M.$$typeof === ae)
          return z(
            S,
            g,
            j,
            du(g, M),
            F
          );
        vu(g, M);
      }
      return null;
    }
    function Z(S, g, j, M) {
      for (var F = null, ye = null, V = g, le = g = 0, re = null; V !== null && le < j.length; le++) {
        V.index > le ? (re = V, V = null) : re = V.sibling;
        var pe = x(
          S,
          V,
          j[le],
          M
        );
        if (pe === null) {
          V === null && (V = re);
          break;
        }
        e && V && pe.alternate === null && t(S, V), g = u(pe, g, le), ye === null ? F = pe : ye.sibling = pe, ye = pe, V = re;
      }
      if (le === j.length)
        return l(S, V), de && Vt(S, le), F;
      if (V === null) {
        for (; le < j.length; le++)
          V = C(S, j[le], M), V !== null && (g = u(
            V,
            g,
            le
          ), ye === null ? F = V : ye.sibling = V, ye = V);
        return de && Vt(S, le), F;
      }
      for (V = a(V); le < j.length; le++)
        re = z(
          V,
          S,
          le,
          j[le],
          M
        ), re !== null && (e && re.alternate !== null && V.delete(
          re.key === null ? le : re.key
        ), g = u(
          re,
          g,
          le
        ), ye === null ? F = re : ye.sibling = re, ye = re);
      return e && V.forEach(function(Ol) {
        return t(S, Ol);
      }), de && Vt(S, le), F;
    }
    function W(S, g, j, M) {
      if (j == null) throw Error(r(151));
      for (var F = null, ye = null, V = g, le = g = 0, re = null, pe = j.next(); V !== null && !pe.done; le++, pe = j.next()) {
        V.index > le ? (re = V, V = null) : re = V.sibling;
        var Ol = x(S, V, pe.value, M);
        if (Ol === null) {
          V === null && (V = re);
          break;
        }
        e && V && Ol.alternate === null && t(S, V), g = u(Ol, g, le), ye === null ? F = Ol : ye.sibling = Ol, ye = Ol, V = re;
      }
      if (pe.done)
        return l(S, V), de && Vt(S, le), F;
      if (V === null) {
        for (; !pe.done; le++, pe = j.next())
          pe = C(S, pe.value, M), pe !== null && (g = u(pe, g, le), ye === null ? F = pe : ye.sibling = pe, ye = pe);
        return de && Vt(S, le), F;
      }
      for (V = a(V); !pe.done; le++, pe = j.next())
        pe = z(V, S, le, pe.value, M), pe !== null && (e && pe.alternate !== null && V.delete(pe.key === null ? le : pe.key), g = u(pe, g, le), ye === null ? F = pe : ye.sibling = pe, ye = pe);
      return e && V.forEach(function(vp) {
        return t(S, vp);
      }), de && Vt(S, le), F;
    }
    function xe(S, g, j, M) {
      if (typeof j == "object" && j !== null && j.type === X && j.key === null && (j = j.props.children), typeof j == "object" && j !== null) {
        switch (j.$$typeof) {
          case J:
            e: {
              for (var F = j.key; g !== null; ) {
                if (g.key === F) {
                  if (F = j.type, F === X) {
                    if (g.tag === 7) {
                      l(
                        S,
                        g.sibling
                      ), M = n(
                        g,
                        j.props.children
                      ), M.return = S, S = M;
                      break e;
                    }
                  } else if (g.elementType === F || typeof F == "object" && F !== null && F.$$typeof === Re && wl(F) === g.type) {
                    l(
                      S,
                      g.sibling
                    ), M = n(g, j.props), nn(M, j), M.return = S, S = M;
                    break e;
                  }
                  l(S, g);
                  break;
                } else t(S, g);
                g = g.sibling;
              }
              j.type === X ? (M = ql(
                j.props.children,
                S.mode,
                M,
                j.key
              ), M.return = S, S = M) : (M = su(
                j.type,
                j.key,
                j.props,
                null,
                S.mode,
                M
              ), nn(M, j), M.return = S, S = M);
            }
            return c(S);
          case w:
            e: {
              for (F = j.key; g !== null; ) {
                if (g.key === F)
                  if (g.tag === 4 && g.stateNode.containerInfo === j.containerInfo && g.stateNode.implementation === j.implementation) {
                    l(
                      S,
                      g.sibling
                    ), M = n(g, j.children || []), M.return = S, S = M;
                    break e;
                  } else {
                    l(S, g);
                    break;
                  }
                else t(S, g);
                g = g.sibling;
              }
              M = Pi(j, S.mode, M), M.return = S, S = M;
            }
            return c(S);
          case Re:
            return j = wl(j), xe(
              S,
              g,
              j,
              M
            );
        }
        if (q(j))
          return Z(
            S,
            g,
            j,
            M
          );
        if (Be(j)) {
          if (F = Be(j), typeof F != "function") throw Error(r(150));
          return j = F.call(j), W(
            S,
            g,
            j,
            M
          );
        }
        if (typeof j.then == "function")
          return xe(
            S,
            g,
            pu(j),
            M
          );
        if (j.$$typeof === ae)
          return xe(
            S,
            g,
            du(S, j),
            M
          );
        vu(S, j);
      }
      return typeof j == "string" && j !== "" || typeof j == "number" || typeof j == "bigint" ? (j = "" + j, g !== null && g.tag === 6 ? (l(S, g.sibling), M = n(g, j), M.return = S, S = M) : (l(S, g), M = Ii(j, S.mode, M), M.return = S, S = M), c(S)) : l(S, g);
    }
    return function(S, g, j, M) {
      try {
        an = 0;
        var F = xe(
          S,
          g,
          j,
          M
        );
        return ga = null, F;
      } catch (V) {
        if (V === va || V === mu) throw V;
        var ye = ht(29, V, null, S.mode);
        return ye.lanes = M, ye.return = S, ye;
      }
    };
  }
  var Vl = br(!0), Sr = br(!1), hl = !1;
  function oc(e) {
    e.updateQueue = {
      baseState: e.memoizedState,
      firstBaseUpdate: null,
      lastBaseUpdate: null,
      shared: { pending: null, lanes: 0, hiddenCallbacks: null },
      callbacks: null
    };
  }
  function dc(e, t) {
    e = e.updateQueue, t.updateQueue === e && (t.updateQueue = {
      baseState: e.baseState,
      firstBaseUpdate: e.firstBaseUpdate,
      lastBaseUpdate: e.lastBaseUpdate,
      shared: e.shared,
      callbacks: null
    });
  }
  function ml(e) {
    return { lane: e, tag: 0, payload: null, callback: null, next: null };
  }
  function yl(e, t, l) {
    var a = e.updateQueue;
    if (a === null) return null;
    if (a = a.shared, (ve & 2) !== 0) {
      var n = a.pending;
      return n === null ? t.next = t : (t.next = n.next, n.next = t), a.pending = t, t = fu(e), ar(e, null, l), t;
    }
    return cu(e, a, t, l), fu(e);
  }
  function un(e, t, l) {
    if (t = t.updateQueue, t !== null && (t = t.shared, (l & 4194048) !== 0)) {
      var a = t.lanes;
      a &= e.pendingLanes, l |= a, t.lanes = l, os(e, l);
    }
  }
  function hc(e, t) {
    var l = e.updateQueue, a = e.alternate;
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
        u === null ? n = u = t : u = u.next = t;
      } else n = u = t;
      l = {
        baseState: a.baseState,
        firstBaseUpdate: n,
        lastBaseUpdate: u,
        shared: a.shared,
        callbacks: a.callbacks
      }, e.updateQueue = l;
      return;
    }
    e = l.lastBaseUpdate, e === null ? l.firstBaseUpdate = t : e.next = t, l.lastBaseUpdate = t;
  }
  var mc = !1;
  function cn() {
    if (mc) {
      var e = pa;
      if (e !== null) throw e;
    }
  }
  function fn(e, t, l, a) {
    mc = !1;
    var n = e.updateQueue;
    hl = !1;
    var u = n.firstBaseUpdate, c = n.lastBaseUpdate, o = n.shared.pending;
    if (o !== null) {
      n.shared.pending = null;
      var m = o, _ = m.next;
      m.next = null, c === null ? u = _ : c.next = _, c = m;
      var N = e.alternate;
      N !== null && (N = N.updateQueue, o = N.lastBaseUpdate, o !== c && (o === null ? N.firstBaseUpdate = _ : o.next = _, N.lastBaseUpdate = m));
    }
    if (u !== null) {
      var C = n.baseState;
      c = 0, N = _ = m = null, o = u;
      do {
        var x = o.lane & -536870913, z = x !== o.lane;
        if (z ? (se & x) === x : (a & x) === x) {
          x !== 0 && x === ya && (mc = !0), N !== null && (N = N.next = {
            lane: 0,
            tag: o.tag,
            payload: o.payload,
            callback: null,
            next: null
          });
          e: {
            var Z = e, W = o;
            x = t;
            var xe = l;
            switch (W.tag) {
              case 1:
                if (Z = W.payload, typeof Z == "function") {
                  C = Z.call(xe, C, x);
                  break e;
                }
                C = Z;
                break e;
              case 3:
                Z.flags = Z.flags & -65537 | 128;
              case 0:
                if (Z = W.payload, x = typeof Z == "function" ? Z.call(xe, C, x) : Z, x == null) break e;
                C = H({}, C, x);
                break e;
              case 2:
                hl = !0;
            }
          }
          x = o.callback, x !== null && (e.flags |= 64, z && (e.flags |= 8192), z = n.callbacks, z === null ? n.callbacks = [x] : z.push(x));
        } else
          z = {
            lane: x,
            tag: o.tag,
            payload: o.payload,
            callback: o.callback,
            next: null
          }, N === null ? (_ = N = z, m = C) : N = N.next = z, c |= x;
        if (o = o.next, o === null) {
          if (o = n.shared.pending, o === null)
            break;
          z = o, o = z.next, z.next = null, n.lastBaseUpdate = z, n.shared.pending = null;
        }
      } while (!0);
      N === null && (m = C), n.baseState = m, n.firstBaseUpdate = _, n.lastBaseUpdate = N, u === null && (n.shared.lanes = 0), Sl |= c, e.lanes = c, e.memoizedState = C;
    }
  }
  function Er(e, t) {
    if (typeof e != "function")
      throw Error(r(191, e));
    e.call(t);
  }
  function jr(e, t) {
    var l = e.callbacks;
    if (l !== null)
      for (e.callbacks = null, e = 0; e < l.length; e++)
        Er(l[e], t);
  }
  var ba = y(null), gu = y(0);
  function _r(e, t) {
    e = ll, L(gu, e), L(ba, t), ll = e | t.baseLanes;
  }
  function yc() {
    L(gu, ll), L(ba, ba.current);
  }
  function pc() {
    ll = gu.current, O(ba), O(gu);
  }
  var mt = y(null), zt = null;
  function pl(e) {
    var t = e.alternate;
    L(qe, qe.current & 1), L(mt, e), zt === null && (t === null || ba.current !== null || t.memoizedState !== null) && (zt = e);
  }
  function vc(e) {
    L(qe, qe.current), L(mt, e), zt === null && (zt = e);
  }
  function Tr(e) {
    e.tag === 22 ? (L(qe, qe.current), L(mt, e), zt === null && (zt = e)) : vl();
  }
  function vl() {
    L(qe, qe.current), L(mt, mt.current);
  }
  function yt(e) {
    O(mt), zt === e && (zt = null), O(qe);
  }
  var qe = y(0);
  function bu(e) {
    for (var t = e; t !== null; ) {
      if (t.tag === 13) {
        var l = t.memoizedState;
        if (l !== null && (l = l.dehydrated, l === null || Tf(l) || xf(l)))
          return t;
      } else if (t.tag === 19 && (t.memoizedProps.revealOrder === "forwards" || t.memoizedProps.revealOrder === "backwards" || t.memoizedProps.revealOrder === "unstable_legacy-backwards" || t.memoizedProps.revealOrder === "together")) {
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
  var kt = 0, te = null, _e = null, Xe = null, Su = !1, Sa = !1, Jl = !1, Eu = 0, sn = 0, Ea = null, cy = 0;
  function Ce() {
    throw Error(r(321));
  }
  function gc(e, t) {
    if (t === null) return !1;
    for (var l = 0; l < t.length && l < e.length; l++)
      if (!dt(e[l], t[l])) return !1;
    return !0;
  }
  function bc(e, t, l, a, n, u) {
    return kt = u, te = t, t.memoizedState = null, t.updateQueue = null, t.lanes = 0, B.H = e === null || e.memoizedState === null ? co : Uc, Jl = !1, u = l(a, n), Jl = !1, Sa && (u = Ar(
      t,
      l,
      a,
      n
    )), xr(e), u;
  }
  function xr(e) {
    B.H = dn;
    var t = _e !== null && _e.next !== null;
    if (kt = 0, Xe = _e = te = null, Su = !1, sn = 0, Ea = null, t) throw Error(r(300));
    e === null || Qe || (e = e.dependencies, e !== null && ou(e) && (Qe = !0));
  }
  function Ar(e, t, l, a) {
    te = e;
    var n = 0;
    do {
      if (Sa && (Ea = null), sn = 0, Sa = !1, 25 <= n) throw Error(r(301));
      if (n += 1, Xe = _e = null, e.updateQueue != null) {
        var u = e.updateQueue;
        u.lastEffect = null, u.events = null, u.stores = null, u.memoCache != null && (u.memoCache.index = 0);
      }
      B.H = fo, u = t(l, a);
    } while (Sa);
    return u;
  }
  function fy() {
    var e = B.H, t = e.useState()[0];
    return t = typeof t.then == "function" ? rn(t) : t, e = e.useState()[0], (_e !== null ? _e.memoizedState : null) !== e && (te.flags |= 1024), t;
  }
  function Sc() {
    var e = Eu !== 0;
    return Eu = 0, e;
  }
  function Ec(e, t, l) {
    t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~l;
  }
  function jc(e) {
    if (Su) {
      for (e = e.memoizedState; e !== null; ) {
        var t = e.queue;
        t !== null && (t.pending = null), e = e.next;
      }
      Su = !1;
    }
    kt = 0, Xe = _e = te = null, Sa = !1, sn = Eu = 0, Ea = null;
  }
  function et() {
    var e = {
      memoizedState: null,
      baseState: null,
      baseQueue: null,
      queue: null,
      next: null
    };
    return Xe === null ? te.memoizedState = Xe = e : Xe = Xe.next = e, Xe;
  }
  function Ye() {
    if (_e === null) {
      var e = te.alternate;
      e = e !== null ? e.memoizedState : null;
    } else e = _e.next;
    var t = Xe === null ? te.memoizedState : Xe.next;
    if (t !== null)
      Xe = t, _e = e;
    else {
      if (e === null)
        throw te.alternate === null ? Error(r(467)) : Error(r(310));
      _e = e, e = {
        memoizedState: _e.memoizedState,
        baseState: _e.baseState,
        baseQueue: _e.baseQueue,
        queue: _e.queue,
        next: null
      }, Xe === null ? te.memoizedState = Xe = e : Xe = Xe.next = e;
    }
    return Xe;
  }
  function ju() {
    return { lastEffect: null, events: null, stores: null, memoCache: null };
  }
  function rn(e) {
    var t = sn;
    return sn += 1, Ea === null && (Ea = []), e = pr(Ea, e, t), t = te, (Xe === null ? t.memoizedState : Xe.next) === null && (t = t.alternate, B.H = t === null || t.memoizedState === null ? co : Uc), e;
  }
  function _u(e) {
    if (e !== null && typeof e == "object") {
      if (typeof e.then == "function") return rn(e);
      if (e.$$typeof === ae) return Fe(e);
    }
    throw Error(r(438, String(e)));
  }
  function _c(e) {
    var t = null, l = te.updateQueue;
    if (l !== null && (t = l.memoCache), t == null) {
      var a = te.alternate;
      a !== null && (a = a.updateQueue, a !== null && (a = a.memoCache, a != null && (t = {
        data: a.data.map(function(n) {
          return n.slice();
        }),
        index: 0
      })));
    }
    if (t == null && (t = { data: [], index: 0 }), l === null && (l = ju(), te.updateQueue = l), l.memoCache = t, l = t.data[t.index], l === void 0)
      for (l = t.data[t.index] = Array(e), a = 0; a < e; a++)
        l[a] = tt;
    return t.index++, l;
  }
  function Ft(e, t) {
    return typeof t == "function" ? t(e) : t;
  }
  function Tu(e) {
    var t = Ye();
    return Tc(t, _e, e);
  }
  function Tc(e, t, l) {
    var a = e.queue;
    if (a === null) throw Error(r(311));
    a.lastRenderedReducer = l;
    var n = e.baseQueue, u = a.pending;
    if (u !== null) {
      if (n !== null) {
        var c = n.next;
        n.next = u.next, u.next = c;
      }
      t.baseQueue = n = u, a.pending = null;
    }
    if (u = e.baseState, n === null) e.memoizedState = u;
    else {
      t = n.next;
      var o = c = null, m = null, _ = t, N = !1;
      do {
        var C = _.lane & -536870913;
        if (C !== _.lane ? (se & C) === C : (kt & C) === C) {
          var x = _.revertLane;
          if (x === 0)
            m !== null && (m = m.next = {
              lane: 0,
              revertLane: 0,
              gesture: null,
              action: _.action,
              hasEagerState: _.hasEagerState,
              eagerState: _.eagerState,
              next: null
            }), C === ya && (N = !0);
          else if ((kt & x) === x) {
            _ = _.next, x === ya && (N = !0);
            continue;
          } else
            C = {
              lane: 0,
              revertLane: _.revertLane,
              gesture: null,
              action: _.action,
              hasEagerState: _.hasEagerState,
              eagerState: _.eagerState,
              next: null
            }, m === null ? (o = m = C, c = u) : m = m.next = C, te.lanes |= x, Sl |= x;
          C = _.action, Jl && l(u, C), u = _.hasEagerState ? _.eagerState : l(u, C);
        } else
          x = {
            lane: C,
            revertLane: _.revertLane,
            gesture: _.gesture,
            action: _.action,
            hasEagerState: _.hasEagerState,
            eagerState: _.eagerState,
            next: null
          }, m === null ? (o = m = x, c = u) : m = m.next = x, te.lanes |= C, Sl |= C;
        _ = _.next;
      } while (_ !== null && _ !== t);
      if (m === null ? c = u : m.next = o, !dt(u, e.memoizedState) && (Qe = !0, N && (l = pa, l !== null)))
        throw l;
      e.memoizedState = u, e.baseState = c, e.baseQueue = m, a.lastRenderedState = u;
    }
    return n === null && (a.lanes = 0), [e.memoizedState, a.dispatch];
  }
  function xc(e) {
    var t = Ye(), l = t.queue;
    if (l === null) throw Error(r(311));
    l.lastRenderedReducer = e;
    var a = l.dispatch, n = l.pending, u = t.memoizedState;
    if (n !== null) {
      l.pending = null;
      var c = n = n.next;
      do
        u = e(u, c.action), c = c.next;
      while (c !== n);
      dt(u, t.memoizedState) || (Qe = !0), t.memoizedState = u, t.baseQueue === null && (t.baseState = u), l.lastRenderedState = u;
    }
    return [u, a];
  }
  function zr(e, t, l) {
    var a = te, n = Ye(), u = de;
    if (u) {
      if (l === void 0) throw Error(r(407));
      l = l();
    } else l = t();
    var c = !dt(
      (_e || n).memoizedState,
      l
    );
    if (c && (n.memoizedState = l, Qe = !0), n = n.queue, Rc(Or.bind(null, a, n, e), [
      e
    ]), n.getSnapshot !== t || c || Xe !== null && Xe.memoizedState.tag & 1) {
      if (a.flags |= 2048, ja(
        9,
        { destroy: void 0 },
        Nr.bind(
          null,
          a,
          n,
          l,
          t
        ),
        null
      ), ze === null) throw Error(r(349));
      u || (kt & 127) !== 0 || Rr(a, t, l);
    }
    return l;
  }
  function Rr(e, t, l) {
    e.flags |= 16384, e = { getSnapshot: t, value: l }, t = te.updateQueue, t === null ? (t = ju(), te.updateQueue = t, t.stores = [e]) : (l = t.stores, l === null ? t.stores = [e] : l.push(e));
  }
  function Nr(e, t, l, a) {
    t.value = l, t.getSnapshot = a, Mr(t) && Dr(e);
  }
  function Or(e, t, l) {
    return l(function() {
      Mr(t) && Dr(e);
    });
  }
  function Mr(e) {
    var t = e.getSnapshot;
    e = e.value;
    try {
      var l = t();
      return !dt(e, l);
    } catch (a) {
      return !0;
    }
  }
  function Dr(e) {
    var t = Ll(e, 2);
    t !== null && ft(t, e, 2);
  }
  function Ac(e) {
    var t = et();
    if (typeof e == "function") {
      var l = e;
      if (e = l(), Jl) {
        il(!0);
        try {
          l();
        } finally {
          il(!1);
        }
      }
    }
    return t.memoizedState = t.baseState = e, t.queue = {
      pending: null,
      lanes: 0,
      dispatch: null,
      lastRenderedReducer: Ft,
      lastRenderedState: e
    }, t;
  }
  function Cr(e, t, l, a) {
    return e.baseState = l, Tc(
      e,
      _e,
      typeof a == "function" ? a : Ft
    );
  }
  function sy(e, t, l, a, n) {
    if (zu(e)) throw Error(r(485));
    if (e = t.action, e !== null) {
      var u = {
        payload: n,
        action: e,
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
      B.T !== null ? l(!0) : u.isTransition = !1, a(u), l = t.pending, l === null ? (u.next = t.pending = u, Ur(t, u)) : (u.next = l.next, t.pending = l.next = u);
    }
  }
  function Ur(e, t) {
    var l = t.action, a = t.payload, n = e.state;
    if (t.isTransition) {
      var u = B.T, c = {};
      B.T = c;
      try {
        var o = l(n, a), m = B.S;
        m !== null && m(c, o), Hr(e, t, o);
      } catch (_) {
        zc(e, t, _);
      } finally {
        u !== null && c.types !== null && (u.types = c.types), B.T = u;
      }
    } else
      try {
        u = l(n, a), Hr(e, t, u);
      } catch (_) {
        zc(e, t, _);
      }
  }
  function Hr(e, t, l) {
    l !== null && typeof l == "object" && typeof l.then == "function" ? l.then(
      function(a) {
        Br(e, t, a);
      },
      function(a) {
        return zc(e, t, a);
      }
    ) : Br(e, t, l);
  }
  function Br(e, t, l) {
    t.status = "fulfilled", t.value = l, Lr(t), e.state = l, t = e.pending, t !== null && (l = t.next, l === t ? e.pending = null : (l = l.next, t.next = l, Ur(e, l)));
  }
  function zc(e, t, l) {
    var a = e.pending;
    if (e.pending = null, a !== null) {
      a = a.next;
      do
        t.status = "rejected", t.reason = l, Lr(t), t = t.next;
      while (t !== a);
    }
    e.action = null;
  }
  function Lr(e) {
    e = e.listeners;
    for (var t = 0; t < e.length; t++) (0, e[t])();
  }
  function qr(e, t) {
    return t;
  }
  function Yr(e, t) {
    if (de) {
      var l = ze.formState;
      if (l !== null) {
        e: {
          var a = te;
          if (de) {
            if (Ne) {
              t: {
                for (var n = Ne, u = At; n.nodeType !== 8; ) {
                  if (!u) {
                    n = null;
                    break t;
                  }
                  if (n = Rt(
                    n.nextSibling
                  ), n === null) {
                    n = null;
                    break t;
                  }
                }
                u = n.data, n = u === "F!" || u === "F" ? n : null;
              }
              if (n) {
                Ne = Rt(
                  n.nextSibling
                ), a = n.data === "F!";
                break e;
              }
            }
            ol(a);
          }
          a = !1;
        }
        a && (t = l[0]);
      }
    }
    return l = et(), l.memoizedState = l.baseState = t, a = {
      pending: null,
      lanes: 0,
      dispatch: null,
      lastRenderedReducer: qr,
      lastRenderedState: t
    }, l.queue = a, l = no.bind(
      null,
      te,
      a
    ), a.dispatch = l, a = Ac(!1), u = Cc.bind(
      null,
      te,
      !1,
      a.queue
    ), a = et(), n = {
      state: t,
      dispatch: null,
      action: e,
      pending: null
    }, a.queue = n, l = sy.bind(
      null,
      te,
      n,
      u,
      l
    ), n.dispatch = l, a.memoizedState = e, [t, l, !1];
  }
  function Gr(e) {
    var t = Ye();
    return Xr(t, _e, e);
  }
  function Xr(e, t, l) {
    if (t = Tc(
      e,
      t,
      qr
    )[0], e = Tu(Ft)[0], typeof t == "object" && t !== null && typeof t.then == "function")
      try {
        var a = rn(t);
      } catch (c) {
        throw c === va ? mu : c;
      }
    else a = t;
    t = Ye();
    var n = t.queue, u = n.dispatch;
    return l !== t.memoizedState && (te.flags |= 2048, ja(
      9,
      { destroy: void 0 },
      ry.bind(null, n, l),
      null
    )), [a, u, e];
  }
  function ry(e, t) {
    e.action = t;
  }
  function Qr(e) {
    var t = Ye(), l = _e;
    if (l !== null)
      return Xr(t, l, e);
    Ye(), t = t.memoizedState, l = Ye();
    var a = l.queue.dispatch;
    return l.memoizedState = e, [t, a, !1];
  }
  function ja(e, t, l, a) {
    return e = { tag: e, create: l, deps: a, inst: t, next: null }, t = te.updateQueue, t === null && (t = ju(), te.updateQueue = t), l = t.lastEffect, l === null ? t.lastEffect = e.next = e : (a = l.next, l.next = e, e.next = a, t.lastEffect = e), e;
  }
  function wr() {
    return Ye().memoizedState;
  }
  function xu(e, t, l, a) {
    var n = et();
    te.flags |= e, n.memoizedState = ja(
      1 | t,
      { destroy: void 0 },
      l,
      a === void 0 ? null : a
    );
  }
  function Au(e, t, l, a) {
    var n = Ye();
    a = a === void 0 ? null : a;
    var u = n.memoizedState.inst;
    _e !== null && a !== null && gc(a, _e.memoizedState.deps) ? n.memoizedState = ja(t, u, l, a) : (te.flags |= e, n.memoizedState = ja(
      1 | t,
      u,
      l,
      a
    ));
  }
  function Zr(e, t) {
    xu(8390656, 8, e, t);
  }
  function Rc(e, t) {
    Au(2048, 8, e, t);
  }
  function oy(e) {
    te.flags |= 4;
    var t = te.updateQueue;
    if (t === null)
      t = ju(), te.updateQueue = t, t.events = [e];
    else {
      var l = t.events;
      l === null ? t.events = [e] : l.push(e);
    }
  }
  function Vr(e) {
    var t = Ye().memoizedState;
    return oy({ ref: t, nextImpl: e }), function() {
      if ((ve & 2) !== 0) throw Error(r(440));
      return t.impl.apply(void 0, arguments);
    };
  }
  function Jr(e, t) {
    return Au(4, 2, e, t);
  }
  function Kr(e, t) {
    return Au(4, 4, e, t);
  }
  function kr(e, t) {
    if (typeof t == "function") {
      e = e();
      var l = t(e);
      return function() {
        typeof l == "function" ? l() : t(null);
      };
    }
    if (t != null)
      return e = e(), t.current = e, function() {
        t.current = null;
      };
  }
  function Fr(e, t, l) {
    l = l != null ? l.concat([e]) : null, Au(4, 4, kr.bind(null, t, e), l);
  }
  function Nc() {
  }
  function $r(e, t) {
    var l = Ye();
    t = t === void 0 ? null : t;
    var a = l.memoizedState;
    return t !== null && gc(t, a[1]) ? a[0] : (l.memoizedState = [e, t], e);
  }
  function Wr(e, t) {
    var l = Ye();
    t = t === void 0 ? null : t;
    var a = l.memoizedState;
    if (t !== null && gc(t, a[1]))
      return a[0];
    if (a = e(), Jl) {
      il(!0);
      try {
        e();
      } finally {
        il(!1);
      }
    }
    return l.memoizedState = [a, t], a;
  }
  function Oc(e, t, l) {
    return l === void 0 || (kt & 1073741824) !== 0 && (se & 261930) === 0 ? e.memoizedState = t : (e.memoizedState = l, e = Po(), te.lanes |= e, Sl |= e, l);
  }
  function Ir(e, t, l, a) {
    return dt(l, t) ? l : ba.current !== null ? (e = Oc(e, l, a), dt(e, t) || (Qe = !0), e) : (kt & 42) === 0 || (kt & 1073741824) !== 0 && (se & 261930) === 0 ? (Qe = !0, e.memoizedState = l) : (e = Po(), te.lanes |= e, Sl |= e, t);
  }
  function Pr(e, t, l, a, n) {
    var u = Y.p;
    Y.p = u !== 0 && 8 > u ? u : 8;
    var c = B.T, o = {};
    B.T = o, Cc(e, !1, t, l);
    try {
      var m = n(), _ = B.S;
      if (_ !== null && _(o, m), m !== null && typeof m == "object" && typeof m.then == "function") {
        var N = iy(
          m,
          a
        );
        on(
          e,
          t,
          N,
          gt(e)
        );
      } else
        on(
          e,
          t,
          a,
          gt(e)
        );
    } catch (C) {
      on(
        e,
        t,
        { then: function() {
        }, status: "rejected", reason: C },
        gt()
      );
    } finally {
      Y.p = u, c !== null && o.types !== null && (c.types = o.types), B.T = c;
    }
  }
  function dy() {
  }
  function Mc(e, t, l, a) {
    if (e.tag !== 5) throw Error(r(476));
    var n = eo(e).queue;
    Pr(
      e,
      n,
      t,
      me,
      l === null ? dy : function() {
        return to(e), l(a);
      }
    );
  }
  function eo(e) {
    var t = e.memoizedState;
    if (t !== null) return t;
    t = {
      memoizedState: me,
      baseState: me,
      baseQueue: null,
      queue: {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: Ft,
        lastRenderedState: me
      },
      next: null
    };
    var l = {};
    return t.next = {
      memoizedState: l,
      baseState: l,
      baseQueue: null,
      queue: {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: Ft,
        lastRenderedState: l
      },
      next: null
    }, e.memoizedState = t, e = e.alternate, e !== null && (e.memoizedState = t), t;
  }
  function to(e) {
    var t = eo(e);
    t.next === null && (t = e.alternate.memoizedState), on(
      e,
      t.next.queue,
      {},
      gt()
    );
  }
  function Dc() {
    return Fe(Rn);
  }
  function lo() {
    return Ye().memoizedState;
  }
  function ao() {
    return Ye().memoizedState;
  }
  function hy(e) {
    for (var t = e.return; t !== null; ) {
      switch (t.tag) {
        case 24:
        case 3:
          var l = gt();
          e = ml(l);
          var a = yl(t, e, l);
          a !== null && (ft(a, t, l), un(a, t, l)), t = { cache: cc() }, e.payload = t;
          return;
      }
      t = t.return;
    }
  }
  function my(e, t, l) {
    var a = gt();
    l = {
      lane: a,
      revertLane: 0,
      gesture: null,
      action: l,
      hasEagerState: !1,
      eagerState: null,
      next: null
    }, zu(e) ? uo(t, l) : (l = $i(e, t, l, a), l !== null && (ft(l, e, a), io(l, t, a)));
  }
  function no(e, t, l) {
    var a = gt();
    on(e, t, l, a);
  }
  function on(e, t, l, a) {
    var n = {
      lane: a,
      revertLane: 0,
      gesture: null,
      action: l,
      hasEagerState: !1,
      eagerState: null,
      next: null
    };
    if (zu(e)) uo(t, n);
    else {
      var u = e.alternate;
      if (e.lanes === 0 && (u === null || u.lanes === 0) && (u = t.lastRenderedReducer, u !== null))
        try {
          var c = t.lastRenderedState, o = u(c, l);
          if (n.hasEagerState = !0, n.eagerState = o, dt(o, c))
            return cu(e, t, n, 0), ze === null && iu(), !1;
        } catch (m) {
        }
      if (l = $i(e, t, n, a), l !== null)
        return ft(l, e, a), io(l, t, a), !0;
    }
    return !1;
  }
  function Cc(e, t, l, a) {
    if (a = {
      lane: 2,
      revertLane: df(),
      gesture: null,
      action: a,
      hasEagerState: !1,
      eagerState: null,
      next: null
    }, zu(e)) {
      if (t) throw Error(r(479));
    } else
      t = $i(
        e,
        l,
        a,
        2
      ), t !== null && ft(t, e, 2);
  }
  function zu(e) {
    var t = e.alternate;
    return e === te || t !== null && t === te;
  }
  function uo(e, t) {
    Sa = Su = !0;
    var l = e.pending;
    l === null ? t.next = t : (t.next = l.next, l.next = t), e.pending = t;
  }
  function io(e, t, l) {
    if ((l & 4194048) !== 0) {
      var a = t.lanes;
      a &= e.pendingLanes, l |= a, t.lanes = l, os(e, l);
    }
  }
  var dn = {
    readContext: Fe,
    use: _u,
    useCallback: Ce,
    useContext: Ce,
    useEffect: Ce,
    useImperativeHandle: Ce,
    useLayoutEffect: Ce,
    useInsertionEffect: Ce,
    useMemo: Ce,
    useReducer: Ce,
    useRef: Ce,
    useState: Ce,
    useDebugValue: Ce,
    useDeferredValue: Ce,
    useTransition: Ce,
    useSyncExternalStore: Ce,
    useId: Ce,
    useHostTransitionStatus: Ce,
    useFormState: Ce,
    useActionState: Ce,
    useOptimistic: Ce,
    useMemoCache: Ce,
    useCacheRefresh: Ce
  };
  dn.useEffectEvent = Ce;
  var co = {
    readContext: Fe,
    use: _u,
    useCallback: function(e, t) {
      return et().memoizedState = [
        e,
        t === void 0 ? null : t
      ], e;
    },
    useContext: Fe,
    useEffect: Zr,
    useImperativeHandle: function(e, t, l) {
      l = l != null ? l.concat([e]) : null, xu(
        4194308,
        4,
        kr.bind(null, t, e),
        l
      );
    },
    useLayoutEffect: function(e, t) {
      return xu(4194308, 4, e, t);
    },
    useInsertionEffect: function(e, t) {
      xu(4, 2, e, t);
    },
    useMemo: function(e, t) {
      var l = et();
      t = t === void 0 ? null : t;
      var a = e();
      if (Jl) {
        il(!0);
        try {
          e();
        } finally {
          il(!1);
        }
      }
      return l.memoizedState = [a, t], a;
    },
    useReducer: function(e, t, l) {
      var a = et();
      if (l !== void 0) {
        var n = l(t);
        if (Jl) {
          il(!0);
          try {
            l(t);
          } finally {
            il(!1);
          }
        }
      } else n = t;
      return a.memoizedState = a.baseState = n, e = {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: e,
        lastRenderedState: n
      }, a.queue = e, e = e.dispatch = my.bind(
        null,
        te,
        e
      ), [a.memoizedState, e];
    },
    useRef: function(e) {
      var t = et();
      return e = { current: e }, t.memoizedState = e;
    },
    useState: function(e) {
      e = Ac(e);
      var t = e.queue, l = no.bind(null, te, t);
      return t.dispatch = l, [e.memoizedState, l];
    },
    useDebugValue: Nc,
    useDeferredValue: function(e, t) {
      var l = et();
      return Oc(l, e, t);
    },
    useTransition: function() {
      var e = Ac(!1);
      return e = Pr.bind(
        null,
        te,
        e.queue,
        !0,
        !1
      ), et().memoizedState = e, [!1, e];
    },
    useSyncExternalStore: function(e, t, l) {
      var a = te, n = et();
      if (de) {
        if (l === void 0)
          throw Error(r(407));
        l = l();
      } else {
        if (l = t(), ze === null)
          throw Error(r(349));
        (se & 127) !== 0 || Rr(a, t, l);
      }
      n.memoizedState = l;
      var u = { value: l, getSnapshot: t };
      return n.queue = u, Zr(Or.bind(null, a, u, e), [
        e
      ]), a.flags |= 2048, ja(
        9,
        { destroy: void 0 },
        Nr.bind(
          null,
          a,
          u,
          l,
          t
        ),
        null
      ), l;
    },
    useId: function() {
      var e = et(), t = ze.identifierPrefix;
      if (de) {
        var l = Bt, a = Ht;
        l = (a & ~(1 << 32 - ot(a) - 1)).toString(32) + l, t = "_" + t + "R_" + l, l = Eu++, 0 < l && (t += "H" + l.toString(32)), t += "_";
      } else
        l = cy++, t = "_" + t + "r_" + l.toString(32) + "_";
      return e.memoizedState = t;
    },
    useHostTransitionStatus: Dc,
    useFormState: Yr,
    useActionState: Yr,
    useOptimistic: function(e) {
      var t = et();
      t.memoizedState = t.baseState = e;
      var l = {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: null,
        lastRenderedState: null
      };
      return t.queue = l, t = Cc.bind(
        null,
        te,
        !0,
        l
      ), l.dispatch = t, [e, t];
    },
    useMemoCache: _c,
    useCacheRefresh: function() {
      return et().memoizedState = hy.bind(
        null,
        te
      );
    },
    useEffectEvent: function(e) {
      var t = et(), l = { impl: e };
      return t.memoizedState = l, function() {
        if ((ve & 2) !== 0)
          throw Error(r(440));
        return l.impl.apply(void 0, arguments);
      };
    }
  }, Uc = {
    readContext: Fe,
    use: _u,
    useCallback: $r,
    useContext: Fe,
    useEffect: Rc,
    useImperativeHandle: Fr,
    useInsertionEffect: Jr,
    useLayoutEffect: Kr,
    useMemo: Wr,
    useReducer: Tu,
    useRef: wr,
    useState: function() {
      return Tu(Ft);
    },
    useDebugValue: Nc,
    useDeferredValue: function(e, t) {
      var l = Ye();
      return Ir(
        l,
        _e.memoizedState,
        e,
        t
      );
    },
    useTransition: function() {
      var e = Tu(Ft)[0], t = Ye().memoizedState;
      return [
        typeof e == "boolean" ? e : rn(e),
        t
      ];
    },
    useSyncExternalStore: zr,
    useId: lo,
    useHostTransitionStatus: Dc,
    useFormState: Gr,
    useActionState: Gr,
    useOptimistic: function(e, t) {
      var l = Ye();
      return Cr(l, _e, e, t);
    },
    useMemoCache: _c,
    useCacheRefresh: ao
  };
  Uc.useEffectEvent = Vr;
  var fo = {
    readContext: Fe,
    use: _u,
    useCallback: $r,
    useContext: Fe,
    useEffect: Rc,
    useImperativeHandle: Fr,
    useInsertionEffect: Jr,
    useLayoutEffect: Kr,
    useMemo: Wr,
    useReducer: xc,
    useRef: wr,
    useState: function() {
      return xc(Ft);
    },
    useDebugValue: Nc,
    useDeferredValue: function(e, t) {
      var l = Ye();
      return _e === null ? Oc(l, e, t) : Ir(
        l,
        _e.memoizedState,
        e,
        t
      );
    },
    useTransition: function() {
      var e = xc(Ft)[0], t = Ye().memoizedState;
      return [
        typeof e == "boolean" ? e : rn(e),
        t
      ];
    },
    useSyncExternalStore: zr,
    useId: lo,
    useHostTransitionStatus: Dc,
    useFormState: Qr,
    useActionState: Qr,
    useOptimistic: function(e, t) {
      var l = Ye();
      return _e !== null ? Cr(l, _e, e, t) : (l.baseState = e, [e, l.queue.dispatch]);
    },
    useMemoCache: _c,
    useCacheRefresh: ao
  };
  fo.useEffectEvent = Vr;
  function Hc(e, t, l, a) {
    t = e.memoizedState, l = l(a, t), l = l == null ? t : H({}, t, l), e.memoizedState = l, e.lanes === 0 && (e.updateQueue.baseState = l);
  }
  var Bc = {
    enqueueSetState: function(e, t, l) {
      e = e._reactInternals;
      var a = gt(), n = ml(a);
      n.payload = t, l != null && (n.callback = l), t = yl(e, n, a), t !== null && (ft(t, e, a), un(t, e, a));
    },
    enqueueReplaceState: function(e, t, l) {
      e = e._reactInternals;
      var a = gt(), n = ml(a);
      n.tag = 1, n.payload = t, l != null && (n.callback = l), t = yl(e, n, a), t !== null && (ft(t, e, a), un(t, e, a));
    },
    enqueueForceUpdate: function(e, t) {
      e = e._reactInternals;
      var l = gt(), a = ml(l);
      a.tag = 2, t != null && (a.callback = t), t = yl(e, a, l), t !== null && (ft(t, e, l), un(t, e, l));
    }
  };
  function so(e, t, l, a, n, u, c) {
    return e = e.stateNode, typeof e.shouldComponentUpdate == "function" ? e.shouldComponentUpdate(a, u, c) : t.prototype && t.prototype.isPureReactComponent ? !Wa(l, a) || !Wa(n, u) : !0;
  }
  function ro(e, t, l, a) {
    e = t.state, typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(l, a), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(l, a), t.state !== e && Bc.enqueueReplaceState(t, t.state, null);
  }
  function Kl(e, t) {
    var l = t;
    if ("ref" in t) {
      l = {};
      for (var a in t)
        a !== "ref" && (l[a] = t[a]);
    }
    if (e = e.defaultProps) {
      l === t && (l = H({}, l));
      for (var n in e)
        l[n] === void 0 && (l[n] = e[n]);
    }
    return l;
  }
  function oo(e) {
    uu(e);
  }
  function ho(e) {
    console.error(e);
  }
  function mo(e) {
    uu(e);
  }
  function Ru(e, t) {
    try {
      var l = e.onUncaughtError;
      l(t.value, { componentStack: t.stack });
    } catch (a) {
      setTimeout(function() {
        throw a;
      });
    }
  }
  function yo(e, t, l) {
    try {
      var a = e.onCaughtError;
      a(l.value, {
        componentStack: l.stack,
        errorBoundary: t.tag === 1 ? t.stateNode : null
      });
    } catch (n) {
      setTimeout(function() {
        throw n;
      });
    }
  }
  function Lc(e, t, l) {
    return l = ml(l), l.tag = 3, l.payload = { element: null }, l.callback = function() {
      Ru(e, t);
    }, l;
  }
  function po(e) {
    return e = ml(e), e.tag = 3, e;
  }
  function vo(e, t, l, a) {
    var n = l.type.getDerivedStateFromError;
    if (typeof n == "function") {
      var u = a.value;
      e.payload = function() {
        return n(u);
      }, e.callback = function() {
        yo(t, l, a);
      };
    }
    var c = l.stateNode;
    c !== null && typeof c.componentDidCatch == "function" && (e.callback = function() {
      yo(t, l, a), typeof n != "function" && (El === null ? El = /* @__PURE__ */ new Set([this]) : El.add(this));
      var o = a.stack;
      this.componentDidCatch(a.value, {
        componentStack: o !== null ? o : ""
      });
    });
  }
  function yy(e, t, l, a, n) {
    if (l.flags |= 32768, a !== null && typeof a == "object" && typeof a.then == "function") {
      if (t = l.alternate, t !== null && ma(
        t,
        l,
        n,
        !0
      ), l = mt.current, l !== null) {
        switch (l.tag) {
          case 31:
          case 13:
            return zt === null ? Gu() : l.alternate === null && Ue === 0 && (Ue = 3), l.flags &= -257, l.flags |= 65536, l.lanes = n, a === yu ? l.flags |= 16384 : (t = l.updateQueue, t === null ? l.updateQueue = /* @__PURE__ */ new Set([a]) : t.add(a), sf(e, a, n)), !1;
          case 22:
            return l.flags |= 65536, a === yu ? l.flags |= 16384 : (t = l.updateQueue, t === null ? (t = {
              transitions: null,
              markerInstances: null,
              retryQueue: /* @__PURE__ */ new Set([a])
            }, l.updateQueue = t) : (l = t.retryQueue, l === null ? t.retryQueue = /* @__PURE__ */ new Set([a]) : l.add(a)), sf(e, a, n)), !1;
        }
        throw Error(r(435, l.tag));
      }
      return sf(e, a, n), Gu(), !1;
    }
    if (de)
      return t = mt.current, t !== null ? ((t.flags & 65536) === 0 && (t.flags |= 256), t.flags |= 65536, t.lanes = n, a !== lc && (e = Error(r(422), { cause: a }), en(_t(e, l)))) : (a !== lc && (t = Error(r(423), {
        cause: a
      }), en(
        _t(t, l)
      )), e = e.current.alternate, e.flags |= 65536, n &= -n, e.lanes |= n, a = _t(a, l), n = Lc(
        e.stateNode,
        a,
        n
      ), hc(e, n), Ue !== 4 && (Ue = 2)), !1;
    var u = Error(r(520), { cause: a });
    if (u = _t(u, l), Sn === null ? Sn = [u] : Sn.push(u), Ue !== 4 && (Ue = 2), t === null) return !0;
    a = _t(a, l), l = t;
    do {
      switch (l.tag) {
        case 3:
          return l.flags |= 65536, e = n & -n, l.lanes |= e, e = Lc(l.stateNode, a, e), hc(l, e), !1;
        case 1:
          if (t = l.type, u = l.stateNode, (l.flags & 128) === 0 && (typeof t.getDerivedStateFromError == "function" || u !== null && typeof u.componentDidCatch == "function" && (El === null || !El.has(u))))
            return l.flags |= 65536, n &= -n, l.lanes |= n, n = po(n), vo(
              n,
              e,
              l,
              a
            ), hc(l, n), !1;
      }
      l = l.return;
    } while (l !== null);
    return !1;
  }
  var qc = Error(r(461)), Qe = !1;
  function $e(e, t, l, a) {
    t.child = e === null ? Sr(t, null, l, a) : Vl(
      t,
      e.child,
      l,
      a
    );
  }
  function go(e, t, l, a, n) {
    l = l.render;
    var u = t.ref;
    if ("ref" in a) {
      var c = {};
      for (var o in a)
        o !== "ref" && (c[o] = a[o]);
    } else c = a;
    return Xl(t), a = bc(
      e,
      t,
      l,
      c,
      u,
      n
    ), o = Sc(), e !== null && !Qe ? (Ec(e, t, n), $t(e, t, n)) : (de && o && ec(t), t.flags |= 1, $e(e, t, a, n), t.child);
  }
  function bo(e, t, l, a, n) {
    if (e === null) {
      var u = l.type;
      return typeof u == "function" && !Wi(u) && u.defaultProps === void 0 && l.compare === null ? (t.tag = 15, t.type = u, So(
        e,
        t,
        u,
        a,
        n
      )) : (e = su(
        l.type,
        null,
        a,
        t,
        t.mode,
        n
      ), e.ref = t.ref, e.return = t, t.child = e);
    }
    if (u = e.child, !Jc(e, n)) {
      var c = u.memoizedProps;
      if (l = l.compare, l = l !== null ? l : Wa, l(c, a) && e.ref === t.ref)
        return $t(e, t, n);
    }
    return t.flags |= 1, e = Zt(u, a), e.ref = t.ref, e.return = t, t.child = e;
  }
  function So(e, t, l, a, n) {
    if (e !== null) {
      var u = e.memoizedProps;
      if (Wa(u, a) && e.ref === t.ref)
        if (Qe = !1, t.pendingProps = a = u, Jc(e, n))
          (e.flags & 131072) !== 0 && (Qe = !0);
        else
          return t.lanes = e.lanes, $t(e, t, n);
    }
    return Yc(
      e,
      t,
      l,
      a,
      n
    );
  }
  function Eo(e, t, l, a) {
    var n = a.children, u = e !== null ? e.memoizedState : null;
    if (e === null && t.stateNode === null && (t.stateNode = {
      _visibility: 1,
      _pendingMarkers: null,
      _retryCache: null,
      _transitions: null
    }), a.mode === "hidden") {
      if ((t.flags & 128) !== 0) {
        if (u = u !== null ? u.baseLanes | l : l, e !== null) {
          for (a = t.child = e.child, n = 0; a !== null; )
            n = n | a.lanes | a.childLanes, a = a.sibling;
          a = n & ~u;
        } else a = 0, t.child = null;
        return jo(
          e,
          t,
          u,
          l,
          a
        );
      }
      if ((l & 536870912) !== 0)
        t.memoizedState = { baseLanes: 0, cachePool: null }, e !== null && hu(
          t,
          u !== null ? u.cachePool : null
        ), u !== null ? _r(t, u) : yc(), Tr(t);
      else
        return a = t.lanes = 536870912, jo(
          e,
          t,
          u !== null ? u.baseLanes | l : l,
          l,
          a
        );
    } else
      u !== null ? (hu(t, u.cachePool), _r(t, u), vl(), t.memoizedState = null) : (e !== null && hu(t, null), yc(), vl());
    return $e(e, t, n, l), t.child;
  }
  function hn(e, t) {
    return e !== null && e.tag === 22 || t.stateNode !== null || (t.stateNode = {
      _visibility: 1,
      _pendingMarkers: null,
      _retryCache: null,
      _transitions: null
    }), t.sibling;
  }
  function jo(e, t, l, a, n) {
    var u = sc();
    return u = u === null ? null : { parent: Ge._currentValue, pool: u }, t.memoizedState = {
      baseLanes: l,
      cachePool: u
    }, e !== null && hu(t, null), yc(), Tr(t), e !== null && ma(e, t, a, !0), t.childLanes = n, null;
  }
  function Nu(e, t) {
    return t = Mu(
      { mode: t.mode, children: t.children },
      e.mode
    ), t.ref = e.ref, e.child = t, t.return = e, t;
  }
  function _o(e, t, l) {
    return Vl(t, e.child, null, l), e = Nu(t, t.pendingProps), e.flags |= 2, yt(t), t.memoizedState = null, e;
  }
  function py(e, t, l) {
    var a = t.pendingProps, n = (t.flags & 128) !== 0;
    if (t.flags &= -129, e === null) {
      if (de) {
        if (a.mode === "hidden")
          return e = Nu(t, a), t.lanes = 536870912, hn(null, e);
        if (vc(t), (e = Ne) ? (e = Hd(
          e,
          At
        ), e = e !== null && e.data === "&" ? e : null, e !== null && (t.memoizedState = {
          dehydrated: e,
          treeContext: sl !== null ? { id: Ht, overflow: Bt } : null,
          retryLane: 536870912,
          hydrationErrors: null
        }, l = ur(e), l.return = t, t.child = l, ke = t, Ne = null)) : e = null, e === null) throw ol(t);
        return t.lanes = 536870912, null;
      }
      return Nu(t, a);
    }
    var u = e.memoizedState;
    if (u !== null) {
      var c = u.dehydrated;
      if (vc(t), n)
        if (t.flags & 256)
          t.flags &= -257, t = _o(
            e,
            t,
            l
          );
        else if (t.memoizedState !== null)
          t.child = e.child, t.flags |= 128, t = null;
        else throw Error(r(558));
      else if (Qe || ma(e, t, l, !1), n = (l & e.childLanes) !== 0, Qe || n) {
        if (a = ze, a !== null && (c = ds(a, l), c !== 0 && c !== u.retryLane))
          throw u.retryLane = c, Ll(e, c), ft(a, e, c), qc;
        Gu(), t = _o(
          e,
          t,
          l
        );
      } else
        e = u.treeContext, Ne = Rt(c.nextSibling), ke = t, de = !0, rl = null, At = !1, e !== null && fr(t, e), t = Nu(t, a), t.flags |= 4096;
      return t;
    }
    return e = Zt(e.child, {
      mode: a.mode,
      children: a.children
    }), e.ref = t.ref, t.child = e, e.return = t, e;
  }
  function Ou(e, t) {
    var l = t.ref;
    if (l === null)
      e !== null && e.ref !== null && (t.flags |= 4194816);
    else {
      if (typeof l != "function" && typeof l != "object")
        throw Error(r(284));
      (e === null || e.ref !== l) && (t.flags |= 4194816);
    }
  }
  function Yc(e, t, l, a, n) {
    return Xl(t), l = bc(
      e,
      t,
      l,
      a,
      void 0,
      n
    ), a = Sc(), e !== null && !Qe ? (Ec(e, t, n), $t(e, t, n)) : (de && a && ec(t), t.flags |= 1, $e(e, t, l, n), t.child);
  }
  function To(e, t, l, a, n, u) {
    return Xl(t), t.updateQueue = null, l = Ar(
      t,
      a,
      l,
      n
    ), xr(e), a = Sc(), e !== null && !Qe ? (Ec(e, t, u), $t(e, t, u)) : (de && a && ec(t), t.flags |= 1, $e(e, t, l, u), t.child);
  }
  function xo(e, t, l, a, n) {
    if (Xl(t), t.stateNode === null) {
      var u = ra, c = l.contextType;
      typeof c == "object" && c !== null && (u = Fe(c)), u = new l(a, u), t.memoizedState = u.state !== null && u.state !== void 0 ? u.state : null, u.updater = Bc, t.stateNode = u, u._reactInternals = t, u = t.stateNode, u.props = a, u.state = t.memoizedState, u.refs = {}, oc(t), c = l.contextType, u.context = typeof c == "object" && c !== null ? Fe(c) : ra, u.state = t.memoizedState, c = l.getDerivedStateFromProps, typeof c == "function" && (Hc(
        t,
        l,
        c,
        a
      ), u.state = t.memoizedState), typeof l.getDerivedStateFromProps == "function" || typeof u.getSnapshotBeforeUpdate == "function" || typeof u.UNSAFE_componentWillMount != "function" && typeof u.componentWillMount != "function" || (c = u.state, typeof u.componentWillMount == "function" && u.componentWillMount(), typeof u.UNSAFE_componentWillMount == "function" && u.UNSAFE_componentWillMount(), c !== u.state && Bc.enqueueReplaceState(u, u.state, null), fn(t, a, u, n), cn(), u.state = t.memoizedState), typeof u.componentDidMount == "function" && (t.flags |= 4194308), a = !0;
    } else if (e === null) {
      u = t.stateNode;
      var o = t.memoizedProps, m = Kl(l, o);
      u.props = m;
      var _ = u.context, N = l.contextType;
      c = ra, typeof N == "object" && N !== null && (c = Fe(N));
      var C = l.getDerivedStateFromProps;
      N = typeof C == "function" || typeof u.getSnapshotBeforeUpdate == "function", o = t.pendingProps !== o, N || typeof u.UNSAFE_componentWillReceiveProps != "function" && typeof u.componentWillReceiveProps != "function" || (o || _ !== c) && ro(
        t,
        u,
        a,
        c
      ), hl = !1;
      var x = t.memoizedState;
      u.state = x, fn(t, a, u, n), cn(), _ = t.memoizedState, o || x !== _ || hl ? (typeof C == "function" && (Hc(
        t,
        l,
        C,
        a
      ), _ = t.memoizedState), (m = hl || so(
        t,
        l,
        m,
        a,
        x,
        _,
        c
      )) ? (N || typeof u.UNSAFE_componentWillMount != "function" && typeof u.componentWillMount != "function" || (typeof u.componentWillMount == "function" && u.componentWillMount(), typeof u.UNSAFE_componentWillMount == "function" && u.UNSAFE_componentWillMount()), typeof u.componentDidMount == "function" && (t.flags |= 4194308)) : (typeof u.componentDidMount == "function" && (t.flags |= 4194308), t.memoizedProps = a, t.memoizedState = _), u.props = a, u.state = _, u.context = c, a = m) : (typeof u.componentDidMount == "function" && (t.flags |= 4194308), a = !1);
    } else {
      u = t.stateNode, dc(e, t), c = t.memoizedProps, N = Kl(l, c), u.props = N, C = t.pendingProps, x = u.context, _ = l.contextType, m = ra, typeof _ == "object" && _ !== null && (m = Fe(_)), o = l.getDerivedStateFromProps, (_ = typeof o == "function" || typeof u.getSnapshotBeforeUpdate == "function") || typeof u.UNSAFE_componentWillReceiveProps != "function" && typeof u.componentWillReceiveProps != "function" || (c !== C || x !== m) && ro(
        t,
        u,
        a,
        m
      ), hl = !1, x = t.memoizedState, u.state = x, fn(t, a, u, n), cn();
      var z = t.memoizedState;
      c !== C || x !== z || hl || e !== null && e.dependencies !== null && ou(e.dependencies) ? (typeof o == "function" && (Hc(
        t,
        l,
        o,
        a
      ), z = t.memoizedState), (N = hl || so(
        t,
        l,
        N,
        a,
        x,
        z,
        m
      ) || e !== null && e.dependencies !== null && ou(e.dependencies)) ? (_ || typeof u.UNSAFE_componentWillUpdate != "function" && typeof u.componentWillUpdate != "function" || (typeof u.componentWillUpdate == "function" && u.componentWillUpdate(a, z, m), typeof u.UNSAFE_componentWillUpdate == "function" && u.UNSAFE_componentWillUpdate(
        a,
        z,
        m
      )), typeof u.componentDidUpdate == "function" && (t.flags |= 4), typeof u.getSnapshotBeforeUpdate == "function" && (t.flags |= 1024)) : (typeof u.componentDidUpdate != "function" || c === e.memoizedProps && x === e.memoizedState || (t.flags |= 4), typeof u.getSnapshotBeforeUpdate != "function" || c === e.memoizedProps && x === e.memoizedState || (t.flags |= 1024), t.memoizedProps = a, t.memoizedState = z), u.props = a, u.state = z, u.context = m, a = N) : (typeof u.componentDidUpdate != "function" || c === e.memoizedProps && x === e.memoizedState || (t.flags |= 4), typeof u.getSnapshotBeforeUpdate != "function" || c === e.memoizedProps && x === e.memoizedState || (t.flags |= 1024), a = !1);
    }
    return u = a, Ou(e, t), a = (t.flags & 128) !== 0, u || a ? (u = t.stateNode, l = a && typeof l.getDerivedStateFromError != "function" ? null : u.render(), t.flags |= 1, e !== null && a ? (t.child = Vl(
      t,
      e.child,
      null,
      n
    ), t.child = Vl(
      t,
      null,
      l,
      n
    )) : $e(e, t, l, n), t.memoizedState = u.state, e = t.child) : e = $t(
      e,
      t,
      n
    ), e;
  }
  function Ao(e, t, l, a) {
    return Yl(), t.flags |= 256, $e(e, t, l, a), t.child;
  }
  var Gc = {
    dehydrated: null,
    treeContext: null,
    retryLane: 0,
    hydrationErrors: null
  };
  function Xc(e) {
    return { baseLanes: e, cachePool: mr() };
  }
  function Qc(e, t, l) {
    return e = e !== null ? e.childLanes & ~l : 0, t && (e |= vt), e;
  }
  function zo(e, t, l) {
    var a = t.pendingProps, n = !1, u = (t.flags & 128) !== 0, c;
    if ((c = u) || (c = e !== null && e.memoizedState === null ? !1 : (qe.current & 2) !== 0), c && (n = !0, t.flags &= -129), c = (t.flags & 32) !== 0, t.flags &= -33, e === null) {
      if (de) {
        if (n ? pl(t) : vl(), (e = Ne) ? (e = Hd(
          e,
          At
        ), e = e !== null && e.data !== "&" ? e : null, e !== null && (t.memoizedState = {
          dehydrated: e,
          treeContext: sl !== null ? { id: Ht, overflow: Bt } : null,
          retryLane: 536870912,
          hydrationErrors: null
        }, l = ur(e), l.return = t, t.child = l, ke = t, Ne = null)) : e = null, e === null) throw ol(t);
        return xf(e) ? t.lanes = 32 : t.lanes = 536870912, null;
      }
      var o = a.children;
      return a = a.fallback, n ? (vl(), n = t.mode, o = Mu(
        { mode: "hidden", children: o },
        n
      ), a = ql(
        a,
        n,
        l,
        null
      ), o.return = t, a.return = t, o.sibling = a, t.child = o, a = t.child, a.memoizedState = Xc(l), a.childLanes = Qc(
        e,
        c,
        l
      ), t.memoizedState = Gc, hn(null, a)) : (pl(t), wc(t, o));
    }
    var m = e.memoizedState;
    if (m !== null && (o = m.dehydrated, o !== null)) {
      if (u)
        t.flags & 256 ? (pl(t), t.flags &= -257, t = Zc(
          e,
          t,
          l
        )) : t.memoizedState !== null ? (vl(), t.child = e.child, t.flags |= 128, t = null) : (vl(), o = a.fallback, n = t.mode, a = Mu(
          { mode: "visible", children: a.children },
          n
        ), o = ql(
          o,
          n,
          l,
          null
        ), o.flags |= 2, a.return = t, o.return = t, a.sibling = o, t.child = a, Vl(
          t,
          e.child,
          null,
          l
        ), a = t.child, a.memoizedState = Xc(l), a.childLanes = Qc(
          e,
          c,
          l
        ), t.memoizedState = Gc, t = hn(null, a));
      else if (pl(t), xf(o)) {
        if (c = o.nextSibling && o.nextSibling.dataset, c) var _ = c.dgst;
        c = _, a = Error(r(419)), a.stack = "", a.digest = c, en({ value: a, source: null, stack: null }), t = Zc(
          e,
          t,
          l
        );
      } else if (Qe || ma(e, t, l, !1), c = (l & e.childLanes) !== 0, Qe || c) {
        if (c = ze, c !== null && (a = ds(c, l), a !== 0 && a !== m.retryLane))
          throw m.retryLane = a, Ll(e, a), ft(c, e, a), qc;
        Tf(o) || Gu(), t = Zc(
          e,
          t,
          l
        );
      } else
        Tf(o) ? (t.flags |= 192, t.child = e.child, t = null) : (e = m.treeContext, Ne = Rt(
          o.nextSibling
        ), ke = t, de = !0, rl = null, At = !1, e !== null && fr(t, e), t = wc(
          t,
          a.children
        ), t.flags |= 4096);
      return t;
    }
    return n ? (vl(), o = a.fallback, n = t.mode, m = e.child, _ = m.sibling, a = Zt(m, {
      mode: "hidden",
      children: a.children
    }), a.subtreeFlags = m.subtreeFlags & 65011712, _ !== null ? o = Zt(
      _,
      o
    ) : (o = ql(
      o,
      n,
      l,
      null
    ), o.flags |= 2), o.return = t, a.return = t, a.sibling = o, t.child = a, hn(null, a), a = t.child, o = e.child.memoizedState, o === null ? o = Xc(l) : (n = o.cachePool, n !== null ? (m = Ge._currentValue, n = n.parent !== m ? { parent: m, pool: m } : n) : n = mr(), o = {
      baseLanes: o.baseLanes | l,
      cachePool: n
    }), a.memoizedState = o, a.childLanes = Qc(
      e,
      c,
      l
    ), t.memoizedState = Gc, hn(e.child, a)) : (pl(t), l = e.child, e = l.sibling, l = Zt(l, {
      mode: "visible",
      children: a.children
    }), l.return = t, l.sibling = null, e !== null && (c = t.deletions, c === null ? (t.deletions = [e], t.flags |= 16) : c.push(e)), t.child = l, t.memoizedState = null, l);
  }
  function wc(e, t) {
    return t = Mu(
      { mode: "visible", children: t },
      e.mode
    ), t.return = e, e.child = t;
  }
  function Mu(e, t) {
    return e = ht(22, e, null, t), e.lanes = 0, e;
  }
  function Zc(e, t, l) {
    return Vl(t, e.child, null, l), e = wc(
      t,
      t.pendingProps.children
    ), e.flags |= 2, t.memoizedState = null, e;
  }
  function Ro(e, t, l) {
    e.lanes |= t;
    var a = e.alternate;
    a !== null && (a.lanes |= t), uc(e.return, t, l);
  }
  function Vc(e, t, l, a, n, u) {
    var c = e.memoizedState;
    c === null ? e.memoizedState = {
      isBackwards: t,
      rendering: null,
      renderingStartTime: 0,
      last: a,
      tail: l,
      tailMode: n,
      treeForkCount: u
    } : (c.isBackwards = t, c.rendering = null, c.renderingStartTime = 0, c.last = a, c.tail = l, c.tailMode = n, c.treeForkCount = u);
  }
  function No(e, t, l) {
    var a = t.pendingProps, n = a.revealOrder, u = a.tail;
    a = a.children;
    var c = qe.current, o = (c & 2) !== 0;
    if (o ? (c = c & 1 | 2, t.flags |= 128) : c &= 1, L(qe, c), $e(e, t, a, l), a = de ? Pa : 0, !o && e !== null && (e.flags & 128) !== 0)
      e: for (e = t.child; e !== null; ) {
        if (e.tag === 13)
          e.memoizedState !== null && Ro(e, l, t);
        else if (e.tag === 19)
          Ro(e, l, t);
        else if (e.child !== null) {
          e.child.return = e, e = e.child;
          continue;
        }
        if (e === t) break e;
        for (; e.sibling === null; ) {
          if (e.return === null || e.return === t)
            break e;
          e = e.return;
        }
        e.sibling.return = e.return, e = e.sibling;
      }
    switch (n) {
      case "forwards":
        for (l = t.child, n = null; l !== null; )
          e = l.alternate, e !== null && bu(e) === null && (n = l), l = l.sibling;
        l = n, l === null ? (n = t.child, t.child = null) : (n = l.sibling, l.sibling = null), Vc(
          t,
          !1,
          n,
          l,
          u,
          a
        );
        break;
      case "backwards":
      case "unstable_legacy-backwards":
        for (l = null, n = t.child, t.child = null; n !== null; ) {
          if (e = n.alternate, e !== null && bu(e) === null) {
            t.child = n;
            break;
          }
          e = n.sibling, n.sibling = l, l = n, n = e;
        }
        Vc(
          t,
          !0,
          l,
          null,
          u,
          a
        );
        break;
      case "together":
        Vc(
          t,
          !1,
          null,
          null,
          void 0,
          a
        );
        break;
      default:
        t.memoizedState = null;
    }
    return t.child;
  }
  function $t(e, t, l) {
    if (e !== null && (t.dependencies = e.dependencies), Sl |= t.lanes, (l & t.childLanes) === 0)
      if (e !== null) {
        if (ma(
          e,
          t,
          l,
          !1
        ), (l & t.childLanes) === 0)
          return null;
      } else return null;
    if (e !== null && t.child !== e.child)
      throw Error(r(153));
    if (t.child !== null) {
      for (e = t.child, l = Zt(e, e.pendingProps), t.child = l, l.return = t; e.sibling !== null; )
        e = e.sibling, l = l.sibling = Zt(e, e.pendingProps), l.return = t;
      l.sibling = null;
    }
    return t.child;
  }
  function Jc(e, t) {
    return (e.lanes & t) !== 0 ? !0 : (e = e.dependencies, !!(e !== null && ou(e)));
  }
  function vy(e, t, l) {
    switch (t.tag) {
      case 3:
        Pe(t, t.stateNode.containerInfo), dl(t, Ge, e.memoizedState.cache), Yl();
        break;
      case 27:
      case 5:
        qa(t);
        break;
      case 4:
        Pe(t, t.stateNode.containerInfo);
        break;
      case 10:
        dl(
          t,
          t.type,
          t.memoizedProps.value
        );
        break;
      case 31:
        if (t.memoizedState !== null)
          return t.flags |= 128, vc(t), null;
        break;
      case 13:
        var a = t.memoizedState;
        if (a !== null)
          return a.dehydrated !== null ? (pl(t), t.flags |= 128, null) : (l & t.child.childLanes) !== 0 ? zo(e, t, l) : (pl(t), e = $t(
            e,
            t,
            l
          ), e !== null ? e.sibling : null);
        pl(t);
        break;
      case 19:
        var n = (e.flags & 128) !== 0;
        if (a = (l & t.childLanes) !== 0, a || (ma(
          e,
          t,
          l,
          !1
        ), a = (l & t.childLanes) !== 0), n) {
          if (a)
            return No(
              e,
              t,
              l
            );
          t.flags |= 128;
        }
        if (n = t.memoizedState, n !== null && (n.rendering = null, n.tail = null, n.lastEffect = null), L(qe, qe.current), a) break;
        return null;
      case 22:
        return t.lanes = 0, Eo(
          e,
          t,
          l,
          t.pendingProps
        );
      case 24:
        dl(t, Ge, e.memoizedState.cache);
    }
    return $t(e, t, l);
  }
  function Oo(e, t, l) {
    if (e !== null)
      if (e.memoizedProps !== t.pendingProps)
        Qe = !0;
      else {
        if (!Jc(e, l) && (t.flags & 128) === 0)
          return Qe = !1, vy(
            e,
            t,
            l
          );
        Qe = (e.flags & 131072) !== 0;
      }
    else
      Qe = !1, de && (t.flags & 1048576) !== 0 && cr(t, Pa, t.index);
    switch (t.lanes = 0, t.tag) {
      case 16:
        e: {
          var a = t.pendingProps;
          if (e = wl(t.elementType), t.type = e, typeof e == "function")
            Wi(e) ? (a = Kl(e, a), t.tag = 1, t = xo(
              null,
              t,
              e,
              a,
              l
            )) : (t.tag = 0, t = Yc(
              null,
              t,
              e,
              a,
              l
            ));
          else {
            if (e != null) {
              var n = e.$$typeof;
              if (n === fe) {
                t.tag = 11, t = go(
                  null,
                  t,
                  e,
                  a,
                  l
                );
                break e;
              } else if (n === P) {
                t.tag = 14, t = bo(
                  null,
                  t,
                  e,
                  a,
                  l
                );
                break e;
              }
            }
            throw t = he(e) || e, Error(r(306, t, ""));
          }
        }
        return t;
      case 0:
        return Yc(
          e,
          t,
          t.type,
          t.pendingProps,
          l
        );
      case 1:
        return a = t.type, n = Kl(
          a,
          t.pendingProps
        ), xo(
          e,
          t,
          a,
          n,
          l
        );
      case 3:
        e: {
          if (Pe(
            t,
            t.stateNode.containerInfo
          ), e === null) throw Error(r(387));
          a = t.pendingProps;
          var u = t.memoizedState;
          n = u.element, dc(e, t), fn(t, a, null, l);
          var c = t.memoizedState;
          if (a = c.cache, dl(t, Ge, a), a !== u.cache && ic(
            t,
            [Ge],
            l,
            !0
          ), cn(), a = c.element, u.isDehydrated)
            if (u = {
              element: a,
              isDehydrated: !1,
              cache: c.cache
            }, t.updateQueue.baseState = u, t.memoizedState = u, t.flags & 256) {
              t = Ao(
                e,
                t,
                a,
                l
              );
              break e;
            } else if (a !== n) {
              n = _t(
                Error(r(424)),
                t
              ), en(n), t = Ao(
                e,
                t,
                a,
                l
              );
              break e;
            } else
              for (e = t.stateNode.containerInfo, e.nodeType === 9 ? e = e.body : e = e.nodeName === "HTML" ? e.ownerDocument.body : e, Ne = Rt(e.firstChild), ke = t, de = !0, rl = null, At = !0, l = Sr(
                t,
                null,
                a,
                l
              ), t.child = l; l; )
                l.flags = l.flags & -3 | 4096, l = l.sibling;
          else {
            if (Yl(), a === n) {
              t = $t(
                e,
                t,
                l
              );
              break e;
            }
            $e(e, t, a, l);
          }
          t = t.child;
        }
        return t;
      case 26:
        return Ou(e, t), e === null ? (l = Xd(
          t.type,
          null,
          t.pendingProps,
          null
        )) ? t.memoizedState = l : de || (l = t.type, e = t.pendingProps, a = Ku(
          ue.current
        ).createElement(l), a[Ke] = t, a[lt] = e, We(a, l, e), Ve(a), t.stateNode = a) : t.memoizedState = Xd(
          t.type,
          e.memoizedProps,
          t.pendingProps,
          e.memoizedState
        ), null;
      case 27:
        return qa(t), e === null && de && (a = t.stateNode = qd(
          t.type,
          t.pendingProps,
          ue.current
        ), ke = t, At = !0, n = Ne, xl(t.type) ? (Af = n, Ne = Rt(a.firstChild)) : Ne = n), $e(
          e,
          t,
          t.pendingProps.children,
          l
        ), Ou(e, t), e === null && (t.flags |= 4194304), t.child;
      case 5:
        return e === null && de && ((n = a = Ne) && (a = Ky(
          a,
          t.type,
          t.pendingProps,
          At
        ), a !== null ? (t.stateNode = a, ke = t, Ne = Rt(a.firstChild), At = !1, n = !0) : n = !1), n || ol(t)), qa(t), n = t.type, u = t.pendingProps, c = e !== null ? e.memoizedProps : null, a = u.children, Ef(n, u) ? a = null : c !== null && Ef(n, c) && (t.flags |= 32), t.memoizedState !== null && (n = bc(
          e,
          t,
          fy,
          null,
          null,
          l
        ), Rn._currentValue = n), Ou(e, t), $e(e, t, a, l), t.child;
      case 6:
        return e === null && de && ((e = l = Ne) && (l = ky(
          l,
          t.pendingProps,
          At
        ), l !== null ? (t.stateNode = l, ke = t, Ne = null, e = !0) : e = !1), e || ol(t)), null;
      case 13:
        return zo(e, t, l);
      case 4:
        return Pe(
          t,
          t.stateNode.containerInfo
        ), a = t.pendingProps, e === null ? t.child = Vl(
          t,
          null,
          a,
          l
        ) : $e(e, t, a, l), t.child;
      case 11:
        return go(
          e,
          t,
          t.type,
          t.pendingProps,
          l
        );
      case 7:
        return $e(
          e,
          t,
          t.pendingProps,
          l
        ), t.child;
      case 8:
        return $e(
          e,
          t,
          t.pendingProps.children,
          l
        ), t.child;
      case 12:
        return $e(
          e,
          t,
          t.pendingProps.children,
          l
        ), t.child;
      case 10:
        return a = t.pendingProps, dl(t, t.type, a.value), $e(e, t, a.children, l), t.child;
      case 9:
        return n = t.type._context, a = t.pendingProps.children, Xl(t), n = Fe(n), a = a(n), t.flags |= 1, $e(e, t, a, l), t.child;
      case 14:
        return bo(
          e,
          t,
          t.type,
          t.pendingProps,
          l
        );
      case 15:
        return So(
          e,
          t,
          t.type,
          t.pendingProps,
          l
        );
      case 19:
        return No(e, t, l);
      case 31:
        return py(e, t, l);
      case 22:
        return Eo(
          e,
          t,
          l,
          t.pendingProps
        );
      case 24:
        return Xl(t), a = Fe(Ge), e === null ? (n = sc(), n === null && (n = ze, u = cc(), n.pooledCache = u, u.refCount++, u !== null && (n.pooledCacheLanes |= l), n = u), t.memoizedState = { parent: a, cache: n }, oc(t), dl(t, Ge, n)) : ((e.lanes & l) !== 0 && (dc(e, t), fn(t, null, null, l), cn()), n = e.memoizedState, u = t.memoizedState, n.parent !== a ? (n = { parent: a, cache: a }, t.memoizedState = n, t.lanes === 0 && (t.memoizedState = t.updateQueue.baseState = n), dl(t, Ge, a)) : (a = u.cache, dl(t, Ge, a), a !== n.cache && ic(
          t,
          [Ge],
          l,
          !0
        ))), $e(
          e,
          t,
          t.pendingProps.children,
          l
        ), t.child;
      case 29:
        throw t.pendingProps;
    }
    throw Error(r(156, t.tag));
  }
  function Wt(e) {
    e.flags |= 4;
  }
  function Kc(e, t, l, a, n) {
    if ((t = (e.mode & 32) !== 0) && (t = !1), t) {
      if (e.flags |= 16777216, (n & 335544128) === n)
        if (e.stateNode.complete) e.flags |= 8192;
        else if (ad()) e.flags |= 8192;
        else
          throw Zl = yu, rc;
    } else e.flags &= -16777217;
  }
  function Mo(e, t) {
    if (t.type !== "stylesheet" || (t.state.loading & 4) !== 0)
      e.flags &= -16777217;
    else if (e.flags |= 16777216, !Jd(t))
      if (ad()) e.flags |= 8192;
      else
        throw Zl = yu, rc;
  }
  function Du(e, t) {
    t !== null && (e.flags |= 4), e.flags & 16384 && (t = e.tag !== 22 ? ss() : 536870912, e.lanes |= t, Aa |= t);
  }
  function mn(e, t) {
    if (!de)
      switch (e.tailMode) {
        case "hidden":
          t = e.tail;
          for (var l = null; t !== null; )
            t.alternate !== null && (l = t), t = t.sibling;
          l === null ? e.tail = null : l.sibling = null;
          break;
        case "collapsed":
          l = e.tail;
          for (var a = null; l !== null; )
            l.alternate !== null && (a = l), l = l.sibling;
          a === null ? t || e.tail === null ? e.tail = null : e.tail.sibling = null : a.sibling = null;
      }
  }
  function Oe(e) {
    var t = e.alternate !== null && e.alternate.child === e.child, l = 0, a = 0;
    if (t)
      for (var n = e.child; n !== null; )
        l |= n.lanes | n.childLanes, a |= n.subtreeFlags & 65011712, a |= n.flags & 65011712, n.return = e, n = n.sibling;
    else
      for (n = e.child; n !== null; )
        l |= n.lanes | n.childLanes, a |= n.subtreeFlags, a |= n.flags, n.return = e, n = n.sibling;
    return e.subtreeFlags |= a, e.childLanes = l, t;
  }
  function gy(e, t, l) {
    var a = t.pendingProps;
    switch (tc(t), t.tag) {
      case 16:
      case 15:
      case 0:
      case 11:
      case 7:
      case 8:
      case 12:
      case 9:
      case 14:
        return Oe(t), null;
      case 1:
        return Oe(t), null;
      case 3:
        return l = t.stateNode, a = null, e !== null && (a = e.memoizedState.cache), t.memoizedState.cache !== a && (t.flags |= 2048), Kt(Ge), Le(), l.pendingContext && (l.context = l.pendingContext, l.pendingContext = null), (e === null || e.child === null) && (ha(t) ? Wt(t) : e === null || e.memoizedState.isDehydrated && (t.flags & 256) === 0 || (t.flags |= 1024, ac())), Oe(t), null;
      case 26:
        var n = t.type, u = t.memoizedState;
        return e === null ? (Wt(t), u !== null ? (Oe(t), Mo(t, u)) : (Oe(t), Kc(
          t,
          n,
          null,
          a,
          l
        ))) : u ? u !== e.memoizedState ? (Wt(t), Oe(t), Mo(t, u)) : (Oe(t), t.flags &= -16777217) : (e = e.memoizedProps, e !== a && Wt(t), Oe(t), Kc(
          t,
          n,
          e,
          a,
          l
        )), null;
      case 27:
        if (wn(t), l = ue.current, n = t.type, e !== null && t.stateNode != null)
          e.memoizedProps !== a && Wt(t);
        else {
          if (!a) {
            if (t.stateNode === null)
              throw Error(r(166));
            return Oe(t), null;
          }
          e = k.current, ha(t) ? sr(t) : (e = qd(n, a, l), t.stateNode = e, Wt(t));
        }
        return Oe(t), null;
      case 5:
        if (wn(t), n = t.type, e !== null && t.stateNode != null)
          e.memoizedProps !== a && Wt(t);
        else {
          if (!a) {
            if (t.stateNode === null)
              throw Error(r(166));
            return Oe(t), null;
          }
          if (u = k.current, ha(t))
            sr(t);
          else {
            var c = Ku(
              ue.current
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
            u[Ke] = t, u[lt] = a;
            e: for (c = t.child; c !== null; ) {
              if (c.tag === 5 || c.tag === 6)
                u.appendChild(c.stateNode);
              else if (c.tag !== 4 && c.tag !== 27 && c.child !== null) {
                c.child.return = c, c = c.child;
                continue;
              }
              if (c === t) break e;
              for (; c.sibling === null; ) {
                if (c.return === null || c.return === t)
                  break e;
                c = c.return;
              }
              c.sibling.return = c.return, c = c.sibling;
            }
            t.stateNode = u;
            e: switch (We(u, n, a), n) {
              case "button":
              case "input":
              case "select":
              case "textarea":
                a = !!a.autoFocus;
                break e;
              case "img":
                a = !0;
                break e;
              default:
                a = !1;
            }
            a && Wt(t);
          }
        }
        return Oe(t), Kc(
          t,
          t.type,
          e === null ? null : e.memoizedProps,
          t.pendingProps,
          l
        ), null;
      case 6:
        if (e && t.stateNode != null)
          e.memoizedProps !== a && Wt(t);
        else {
          if (typeof a != "string" && t.stateNode === null)
            throw Error(r(166));
          if (e = ue.current, ha(t)) {
            if (e = t.stateNode, l = t.memoizedProps, a = null, n = ke, n !== null)
              switch (n.tag) {
                case 27:
                case 5:
                  a = n.memoizedProps;
              }
            e[Ke] = t, e = !!(e.nodeValue === l || a !== null && a.suppressHydrationWarning === !0 || zd(e.nodeValue, l)), e || ol(t, !0);
          } else
            e = Ku(e).createTextNode(
              a
            ), e[Ke] = t, t.stateNode = e;
        }
        return Oe(t), null;
      case 31:
        if (l = t.memoizedState, e === null || e.memoizedState !== null) {
          if (a = ha(t), l !== null) {
            if (e === null) {
              if (!a) throw Error(r(318));
              if (e = t.memoizedState, e = e !== null ? e.dehydrated : null, !e) throw Error(r(557));
              e[Ke] = t;
            } else
              Yl(), (t.flags & 128) === 0 && (t.memoizedState = null), t.flags |= 4;
            Oe(t), e = !1;
          } else
            l = ac(), e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = l), e = !0;
          if (!e)
            return t.flags & 256 ? (yt(t), t) : (yt(t), null);
          if ((t.flags & 128) !== 0)
            throw Error(r(558));
        }
        return Oe(t), null;
      case 13:
        if (a = t.memoizedState, e === null || e.memoizedState !== null && e.memoizedState.dehydrated !== null) {
          if (n = ha(t), a !== null && a.dehydrated !== null) {
            if (e === null) {
              if (!n) throw Error(r(318));
              if (n = t.memoizedState, n = n !== null ? n.dehydrated : null, !n) throw Error(r(317));
              n[Ke] = t;
            } else
              Yl(), (t.flags & 128) === 0 && (t.memoizedState = null), t.flags |= 4;
            Oe(t), n = !1;
          } else
            n = ac(), e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = n), n = !0;
          if (!n)
            return t.flags & 256 ? (yt(t), t) : (yt(t), null);
        }
        return yt(t), (t.flags & 128) !== 0 ? (t.lanes = l, t) : (l = a !== null, e = e !== null && e.memoizedState !== null, l && (a = t.child, n = null, a.alternate !== null && a.alternate.memoizedState !== null && a.alternate.memoizedState.cachePool !== null && (n = a.alternate.memoizedState.cachePool.pool), u = null, a.memoizedState !== null && a.memoizedState.cachePool !== null && (u = a.memoizedState.cachePool.pool), u !== n && (a.flags |= 2048)), l !== e && l && (t.child.flags |= 8192), Du(t, t.updateQueue), Oe(t), null);
      case 4:
        return Le(), e === null && pf(t.stateNode.containerInfo), Oe(t), null;
      case 10:
        return Kt(t.type), Oe(t), null;
      case 19:
        if (O(qe), a = t.memoizedState, a === null) return Oe(t), null;
        if (n = (t.flags & 128) !== 0, u = a.rendering, u === null)
          if (n) mn(a, !1);
          else {
            if (Ue !== 0 || e !== null && (e.flags & 128) !== 0)
              for (e = t.child; e !== null; ) {
                if (u = bu(e), u !== null) {
                  for (t.flags |= 128, mn(a, !1), e = u.updateQueue, t.updateQueue = e, Du(t, e), t.subtreeFlags = 0, e = l, l = t.child; l !== null; )
                    nr(l, e), l = l.sibling;
                  return L(
                    qe,
                    qe.current & 1 | 2
                  ), de && Vt(t, a.treeForkCount), t.child;
                }
                e = e.sibling;
              }
            a.tail !== null && st() > Lu && (t.flags |= 128, n = !0, mn(a, !1), t.lanes = 4194304);
          }
        else {
          if (!n)
            if (e = bu(u), e !== null) {
              if (t.flags |= 128, n = !0, e = e.updateQueue, t.updateQueue = e, Du(t, e), mn(a, !0), a.tail === null && a.tailMode === "hidden" && !u.alternate && !de)
                return Oe(t), null;
            } else
              2 * st() - a.renderingStartTime > Lu && l !== 536870912 && (t.flags |= 128, n = !0, mn(a, !1), t.lanes = 4194304);
          a.isBackwards ? (u.sibling = t.child, t.child = u) : (e = a.last, e !== null ? e.sibling = u : t.child = u, a.last = u);
        }
        return a.tail !== null ? (e = a.tail, a.rendering = e, a.tail = e.sibling, a.renderingStartTime = st(), e.sibling = null, l = qe.current, L(
          qe,
          n ? l & 1 | 2 : l & 1
        ), de && Vt(t, a.treeForkCount), e) : (Oe(t), null);
      case 22:
      case 23:
        return yt(t), pc(), a = t.memoizedState !== null, e !== null ? e.memoizedState !== null !== a && (t.flags |= 8192) : a && (t.flags |= 8192), a ? (l & 536870912) !== 0 && (t.flags & 128) === 0 && (Oe(t), t.subtreeFlags & 6 && (t.flags |= 8192)) : Oe(t), l = t.updateQueue, l !== null && Du(t, l.retryQueue), l = null, e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (l = e.memoizedState.cachePool.pool), a = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (a = t.memoizedState.cachePool.pool), a !== l && (t.flags |= 2048), e !== null && O(Ql), null;
      case 24:
        return l = null, e !== null && (l = e.memoizedState.cache), t.memoizedState.cache !== l && (t.flags |= 2048), Kt(Ge), Oe(t), null;
      case 25:
        return null;
      case 30:
        return null;
    }
    throw Error(r(156, t.tag));
  }
  function by(e, t) {
    switch (tc(t), t.tag) {
      case 1:
        return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
      case 3:
        return Kt(Ge), Le(), e = t.flags, (e & 65536) !== 0 && (e & 128) === 0 ? (t.flags = e & -65537 | 128, t) : null;
      case 26:
      case 27:
      case 5:
        return wn(t), null;
      case 31:
        if (t.memoizedState !== null) {
          if (yt(t), t.alternate === null)
            throw Error(r(340));
          Yl();
        }
        return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
      case 13:
        if (yt(t), e = t.memoizedState, e !== null && e.dehydrated !== null) {
          if (t.alternate === null)
            throw Error(r(340));
          Yl();
        }
        return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
      case 19:
        return O(qe), null;
      case 4:
        return Le(), null;
      case 10:
        return Kt(t.type), null;
      case 22:
      case 23:
        return yt(t), pc(), e !== null && O(Ql), e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
      case 24:
        return Kt(Ge), null;
      case 25:
        return null;
      default:
        return null;
    }
  }
  function Do(e, t) {
    switch (tc(t), t.tag) {
      case 3:
        Kt(Ge), Le();
        break;
      case 26:
      case 27:
      case 5:
        wn(t);
        break;
      case 4:
        Le();
        break;
      case 31:
        t.memoizedState !== null && yt(t);
        break;
      case 13:
        yt(t);
        break;
      case 19:
        O(qe);
        break;
      case 10:
        Kt(t.type);
        break;
      case 22:
      case 23:
        yt(t), pc(), e !== null && O(Ql);
        break;
      case 24:
        Kt(Ge);
    }
  }
  function yn(e, t) {
    try {
      var l = t.updateQueue, a = l !== null ? l.lastEffect : null;
      if (a !== null) {
        var n = a.next;
        l = n;
        do {
          if ((l.tag & e) === e) {
            a = void 0;
            var u = l.create, c = l.inst;
            a = u(), c.destroy = a;
          }
          l = l.next;
        } while (l !== n);
      }
    } catch (o) {
      je(t, t.return, o);
    }
  }
  function gl(e, t, l) {
    try {
      var a = t.updateQueue, n = a !== null ? a.lastEffect : null;
      if (n !== null) {
        var u = n.next;
        a = u;
        do {
          if ((a.tag & e) === e) {
            var c = a.inst, o = c.destroy;
            if (o !== void 0) {
              c.destroy = void 0, n = t;
              var m = l, _ = o;
              try {
                _();
              } catch (N) {
                je(
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
      je(t, t.return, N);
    }
  }
  function Co(e) {
    var t = e.updateQueue;
    if (t !== null) {
      var l = e.stateNode;
      try {
        jr(t, l);
      } catch (a) {
        je(e, e.return, a);
      }
    }
  }
  function Uo(e, t, l) {
    l.props = Kl(
      e.type,
      e.memoizedProps
    ), l.state = e.memoizedState;
    try {
      l.componentWillUnmount();
    } catch (a) {
      je(e, t, a);
    }
  }
  function pn(e, t) {
    try {
      var l = e.ref;
      if (l !== null) {
        switch (e.tag) {
          case 26:
          case 27:
          case 5:
            var a = e.stateNode;
            break;
          case 30:
            a = e.stateNode;
            break;
          default:
            a = e.stateNode;
        }
        typeof l == "function" ? e.refCleanup = l(a) : l.current = a;
      }
    } catch (n) {
      je(e, t, n);
    }
  }
  function Lt(e, t) {
    var l = e.ref, a = e.refCleanup;
    if (l !== null)
      if (typeof a == "function")
        try {
          a();
        } catch (n) {
          je(e, t, n);
        } finally {
          e.refCleanup = null, e = e.alternate, e != null && (e.refCleanup = null);
        }
      else if (typeof l == "function")
        try {
          l(null);
        } catch (n) {
          je(e, t, n);
        }
      else l.current = null;
  }
  function Ho(e) {
    var t = e.type, l = e.memoizedProps, a = e.stateNode;
    try {
      e: switch (t) {
        case "button":
        case "input":
        case "select":
        case "textarea":
          l.autoFocus && a.focus();
          break e;
        case "img":
          l.src ? a.src = l.src : l.srcSet && (a.srcset = l.srcSet);
      }
    } catch (n) {
      je(e, e.return, n);
    }
  }
  function kc(e, t, l) {
    try {
      var a = e.stateNode;
      Xy(a, e.type, l, t), a[lt] = t;
    } catch (n) {
      je(e, e.return, n);
    }
  }
  function Bo(e) {
    return e.tag === 5 || e.tag === 3 || e.tag === 26 || e.tag === 27 && xl(e.type) || e.tag === 4;
  }
  function Fc(e) {
    e: for (; ; ) {
      for (; e.sibling === null; ) {
        if (e.return === null || Bo(e.return)) return null;
        e = e.return;
      }
      for (e.sibling.return = e.return, e = e.sibling; e.tag !== 5 && e.tag !== 6 && e.tag !== 18; ) {
        if (e.tag === 27 && xl(e.type) || e.flags & 2 || e.child === null || e.tag === 4) continue e;
        e.child.return = e, e = e.child;
      }
      if (!(e.flags & 2)) return e.stateNode;
    }
  }
  function $c(e, t, l) {
    var a = e.tag;
    if (a === 5 || a === 6)
      e = e.stateNode, t ? (l.nodeType === 9 ? l.body : l.nodeName === "HTML" ? l.ownerDocument.body : l).insertBefore(e, t) : (t = l.nodeType === 9 ? l.body : l.nodeName === "HTML" ? l.ownerDocument.body : l, t.appendChild(e), l = l._reactRootContainer, l != null || t.onclick !== null || (t.onclick = Qt));
    else if (a !== 4 && (a === 27 && xl(e.type) && (l = e.stateNode, t = null), e = e.child, e !== null))
      for ($c(e, t, l), e = e.sibling; e !== null; )
        $c(e, t, l), e = e.sibling;
  }
  function Cu(e, t, l) {
    var a = e.tag;
    if (a === 5 || a === 6)
      e = e.stateNode, t ? l.insertBefore(e, t) : l.appendChild(e);
    else if (a !== 4 && (a === 27 && xl(e.type) && (l = e.stateNode), e = e.child, e !== null))
      for (Cu(e, t, l), e = e.sibling; e !== null; )
        Cu(e, t, l), e = e.sibling;
  }
  function Lo(e) {
    var t = e.stateNode, l = e.memoizedProps;
    try {
      for (var a = e.type, n = t.attributes; n.length; )
        t.removeAttributeNode(n[0]);
      We(t, a, l), t[Ke] = e, t[lt] = l;
    } catch (u) {
      je(e, e.return, u);
    }
  }
  var It = !1, we = !1, Wc = !1, qo = typeof WeakSet == "function" ? WeakSet : Set, Je = null;
  function Sy(e, t) {
    if (e = e.containerInfo, bf = ei, e = Fs(e), Zi(e)) {
      if ("selectionStart" in e)
        var l = {
          start: e.selectionStart,
          end: e.selectionEnd
        };
      else
        e: {
          l = (l = e.ownerDocument) && l.defaultView || window;
          var a = l.getSelection && l.getSelection();
          if (a && a.rangeCount !== 0) {
            l = a.anchorNode;
            var n = a.anchorOffset, u = a.focusNode;
            a = a.focusOffset;
            try {
              l.nodeType, u.nodeType;
            } catch (W) {
              l = null;
              break e;
            }
            var c = 0, o = -1, m = -1, _ = 0, N = 0, C = e, x = null;
            t: for (; ; ) {
              for (var z; C !== l || n !== 0 && C.nodeType !== 3 || (o = c + n), C !== u || a !== 0 && C.nodeType !== 3 || (m = c + a), C.nodeType === 3 && (c += C.nodeValue.length), (z = C.firstChild) !== null; )
                x = C, C = z;
              for (; ; ) {
                if (C === e) break t;
                if (x === l && ++_ === n && (o = c), x === u && ++N === a && (m = c), (z = C.nextSibling) !== null) break;
                C = x, x = C.parentNode;
              }
              C = z;
            }
            l = o === -1 || m === -1 ? null : { start: o, end: m };
          } else l = null;
        }
      l = l || { start: 0, end: 0 };
    } else l = null;
    for (Sf = { focusedElem: e, selectionRange: l }, ei = !1, Je = t; Je !== null; )
      if (t = Je, e = t.child, (t.subtreeFlags & 1028) !== 0 && e !== null)
        e.return = t, Je = e;
      else
        for (; Je !== null; ) {
          switch (t = Je, u = t.alternate, e = t.flags, t.tag) {
            case 0:
              if ((e & 4) !== 0 && (e = t.updateQueue, e = e !== null ? e.events : null, e !== null))
                for (l = 0; l < e.length; l++)
                  n = e[l], n.ref.impl = n.nextImpl;
              break;
            case 11:
            case 15:
              break;
            case 1:
              if ((e & 1024) !== 0 && u !== null) {
                e = void 0, l = t, n = u.memoizedProps, u = u.memoizedState, a = l.stateNode;
                try {
                  var Z = Kl(
                    l.type,
                    n
                  );
                  e = a.getSnapshotBeforeUpdate(
                    Z,
                    u
                  ), a.__reactInternalSnapshotBeforeUpdate = e;
                } catch (W) {
                  je(
                    l,
                    l.return,
                    W
                  );
                }
              }
              break;
            case 3:
              if ((e & 1024) !== 0) {
                if (e = t.stateNode.containerInfo, l = e.nodeType, l === 9)
                  _f(e);
                else if (l === 1)
                  switch (e.nodeName) {
                    case "HEAD":
                    case "HTML":
                    case "BODY":
                      _f(e);
                      break;
                    default:
                      e.textContent = "";
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
              if ((e & 1024) !== 0) throw Error(r(163));
          }
          if (e = t.sibling, e !== null) {
            e.return = t.return, Je = e;
            break;
          }
          Je = t.return;
        }
  }
  function Yo(e, t, l) {
    var a = l.flags;
    switch (l.tag) {
      case 0:
      case 11:
      case 15:
        el(e, l), a & 4 && yn(5, l);
        break;
      case 1:
        if (el(e, l), a & 4)
          if (e = l.stateNode, t === null)
            try {
              e.componentDidMount();
            } catch (c) {
              je(l, l.return, c);
            }
          else {
            var n = Kl(
              l.type,
              t.memoizedProps
            );
            t = t.memoizedState;
            try {
              e.componentDidUpdate(
                n,
                t,
                e.__reactInternalSnapshotBeforeUpdate
              );
            } catch (c) {
              je(
                l,
                l.return,
                c
              );
            }
          }
        a & 64 && Co(l), a & 512 && pn(l, l.return);
        break;
      case 3:
        if (el(e, l), a & 64 && (e = l.updateQueue, e !== null)) {
          if (t = null, l.child !== null)
            switch (l.child.tag) {
              case 27:
              case 5:
                t = l.child.stateNode;
                break;
              case 1:
                t = l.child.stateNode;
            }
          try {
            jr(e, t);
          } catch (c) {
            je(l, l.return, c);
          }
        }
        break;
      case 27:
        t === null && a & 4 && Lo(l);
      case 26:
      case 5:
        el(e, l), t === null && a & 4 && Ho(l), a & 512 && pn(l, l.return);
        break;
      case 12:
        el(e, l);
        break;
      case 31:
        el(e, l), a & 4 && Qo(e, l);
        break;
      case 13:
        el(e, l), a & 4 && wo(e, l), a & 64 && (e = l.memoizedState, e !== null && (e = e.dehydrated, e !== null && (l = Ny.bind(
          null,
          l
        ), Fy(e, l))));
        break;
      case 22:
        if (a = l.memoizedState !== null || It, !a) {
          t = t !== null && t.memoizedState !== null || we, n = It;
          var u = we;
          It = a, (we = t) && !u ? tl(
            e,
            l,
            (l.subtreeFlags & 8772) !== 0
          ) : el(e, l), It = n, we = u;
        }
        break;
      case 30:
        break;
      default:
        el(e, l);
    }
  }
  function Go(e) {
    var t = e.alternate;
    t !== null && (e.alternate = null, Go(t)), e.child = null, e.deletions = null, e.sibling = null, e.tag === 5 && (t = e.stateNode, t !== null && zi(t)), e.stateNode = null, e.return = null, e.dependencies = null, e.memoizedProps = null, e.memoizedState = null, e.pendingProps = null, e.stateNode = null, e.updateQueue = null;
  }
  var Me = null, nt = !1;
  function Pt(e, t, l) {
    for (l = l.child; l !== null; )
      Xo(e, t, l), l = l.sibling;
  }
  function Xo(e, t, l) {
    if (rt && typeof rt.onCommitFiberUnmount == "function")
      try {
        rt.onCommitFiberUnmount(Ya, l);
      } catch (u) {
      }
    switch (l.tag) {
      case 26:
        we || Lt(l, t), Pt(
          e,
          t,
          l
        ), l.memoizedState ? l.memoizedState.count-- : l.stateNode && (l = l.stateNode, l.parentNode.removeChild(l));
        break;
      case 27:
        we || Lt(l, t);
        var a = Me, n = nt;
        xl(l.type) && (Me = l.stateNode, nt = !1), Pt(
          e,
          t,
          l
        ), xn(l.stateNode), Me = a, nt = n;
        break;
      case 5:
        we || Lt(l, t);
      case 6:
        if (a = Me, n = nt, Me = null, Pt(
          e,
          t,
          l
        ), Me = a, nt = n, Me !== null)
          if (nt)
            try {
              (Me.nodeType === 9 ? Me.body : Me.nodeName === "HTML" ? Me.ownerDocument.body : Me).removeChild(l.stateNode);
            } catch (u) {
              je(
                l,
                t,
                u
              );
            }
          else
            try {
              Me.removeChild(l.stateNode);
            } catch (u) {
              je(
                l,
                t,
                u
              );
            }
        break;
      case 18:
        Me !== null && (nt ? (e = Me, Cd(
          e.nodeType === 9 ? e.body : e.nodeName === "HTML" ? e.ownerDocument.body : e,
          l.stateNode
        ), Ua(e)) : Cd(Me, l.stateNode));
        break;
      case 4:
        a = Me, n = nt, Me = l.stateNode.containerInfo, nt = !0, Pt(
          e,
          t,
          l
        ), Me = a, nt = n;
        break;
      case 0:
      case 11:
      case 14:
      case 15:
        gl(2, l, t), we || gl(4, l, t), Pt(
          e,
          t,
          l
        );
        break;
      case 1:
        we || (Lt(l, t), a = l.stateNode, typeof a.componentWillUnmount == "function" && Uo(
          l,
          t,
          a
        )), Pt(
          e,
          t,
          l
        );
        break;
      case 21:
        Pt(
          e,
          t,
          l
        );
        break;
      case 22:
        we = (a = we) || l.memoizedState !== null, Pt(
          e,
          t,
          l
        ), we = a;
        break;
      default:
        Pt(
          e,
          t,
          l
        );
    }
  }
  function Qo(e, t) {
    if (t.memoizedState === null && (e = t.alternate, e !== null && (e = e.memoizedState, e !== null))) {
      e = e.dehydrated;
      try {
        Ua(e);
      } catch (l) {
        je(t, t.return, l);
      }
    }
  }
  function wo(e, t) {
    if (t.memoizedState === null && (e = t.alternate, e !== null && (e = e.memoizedState, e !== null && (e = e.dehydrated, e !== null))))
      try {
        Ua(e);
      } catch (l) {
        je(t, t.return, l);
      }
  }
  function Ey(e) {
    switch (e.tag) {
      case 31:
      case 13:
      case 19:
        var t = e.stateNode;
        return t === null && (t = e.stateNode = new qo()), t;
      case 22:
        return e = e.stateNode, t = e._retryCache, t === null && (t = e._retryCache = new qo()), t;
      default:
        throw Error(r(435, e.tag));
    }
  }
  function Uu(e, t) {
    var l = Ey(e);
    t.forEach(function(a) {
      if (!l.has(a)) {
        l.add(a);
        var n = Oy.bind(null, e, a);
        a.then(n, n);
      }
    });
  }
  function ut(e, t) {
    var l = t.deletions;
    if (l !== null)
      for (var a = 0; a < l.length; a++) {
        var n = l[a], u = e, c = t, o = c;
        e: for (; o !== null; ) {
          switch (o.tag) {
            case 27:
              if (xl(o.type)) {
                Me = o.stateNode, nt = !1;
                break e;
              }
              break;
            case 5:
              Me = o.stateNode, nt = !1;
              break e;
            case 3:
            case 4:
              Me = o.stateNode.containerInfo, nt = !0;
              break e;
          }
          o = o.return;
        }
        if (Me === null) throw Error(r(160));
        Xo(u, c, n), Me = null, nt = !1, u = n.alternate, u !== null && (u.return = null), n.return = null;
      }
    if (t.subtreeFlags & 13886)
      for (t = t.child; t !== null; )
        Zo(t, e), t = t.sibling;
  }
  var Dt = null;
  function Zo(e, t) {
    var l = e.alternate, a = e.flags;
    switch (e.tag) {
      case 0:
      case 11:
      case 14:
      case 15:
        ut(t, e), it(e), a & 4 && (gl(3, e, e.return), yn(3, e), gl(5, e, e.return));
        break;
      case 1:
        ut(t, e), it(e), a & 512 && (we || l === null || Lt(l, l.return)), a & 64 && It && (e = e.updateQueue, e !== null && (a = e.callbacks, a !== null && (l = e.shared.hiddenCallbacks, e.shared.hiddenCallbacks = l === null ? a : l.concat(a))));
        break;
      case 26:
        var n = Dt;
        if (ut(t, e), it(e), a & 512 && (we || l === null || Lt(l, l.return)), a & 4) {
          var u = l !== null ? l.memoizedState : null;
          if (a = e.memoizedState, l === null)
            if (a === null)
              if (e.stateNode === null) {
                e: {
                  a = e.type, l = e.memoizedProps, n = n.ownerDocument || n;
                  t: switch (a) {
                    case "title":
                      u = n.getElementsByTagName("title")[0], (!u || u[Qa] || u[Ke] || u.namespaceURI === "http://www.w3.org/2000/svg" || u.hasAttribute("itemprop")) && (u = n.createElement(a), n.head.insertBefore(
                        u,
                        n.querySelector("head > title")
                      )), We(u, a, l), u[Ke] = e, Ve(u), a = u;
                      break e;
                    case "link":
                      var c = Zd(
                        "link",
                        "href",
                        n
                      ).get(a + (l.href || ""));
                      if (c) {
                        for (var o = 0; o < c.length; o++)
                          if (u = c[o], u.getAttribute("href") === (l.href == null || l.href === "" ? null : l.href) && u.getAttribute("rel") === (l.rel == null ? null : l.rel) && u.getAttribute("title") === (l.title == null ? null : l.title) && u.getAttribute("crossorigin") === (l.crossOrigin == null ? null : l.crossOrigin)) {
                            c.splice(o, 1);
                            break t;
                          }
                      }
                      u = n.createElement(a), We(u, a, l), n.head.appendChild(u);
                      break;
                    case "meta":
                      if (c = Zd(
                        "meta",
                        "content",
                        n
                      ).get(a + (l.content || ""))) {
                        for (o = 0; o < c.length; o++)
                          if (u = c[o], u.getAttribute("content") === (l.content == null ? null : "" + l.content) && u.getAttribute("name") === (l.name == null ? null : l.name) && u.getAttribute("property") === (l.property == null ? null : l.property) && u.getAttribute("http-equiv") === (l.httpEquiv == null ? null : l.httpEquiv) && u.getAttribute("charset") === (l.charSet == null ? null : l.charSet)) {
                            c.splice(o, 1);
                            break t;
                          }
                      }
                      u = n.createElement(a), We(u, a, l), n.head.appendChild(u);
                      break;
                    default:
                      throw Error(r(468, a));
                  }
                  u[Ke] = e, Ve(u), a = u;
                }
                e.stateNode = a;
              } else
                Vd(
                  n,
                  e.type,
                  e.stateNode
                );
            else
              e.stateNode = wd(
                n,
                a,
                e.memoizedProps
              );
          else
            u !== a ? (u === null ? l.stateNode !== null && (l = l.stateNode, l.parentNode.removeChild(l)) : u.count--, a === null ? Vd(
              n,
              e.type,
              e.stateNode
            ) : wd(
              n,
              a,
              e.memoizedProps
            )) : a === null && e.stateNode !== null && kc(
              e,
              e.memoizedProps,
              l.memoizedProps
            );
        }
        break;
      case 27:
        ut(t, e), it(e), a & 512 && (we || l === null || Lt(l, l.return)), l !== null && a & 4 && kc(
          e,
          e.memoizedProps,
          l.memoizedProps
        );
        break;
      case 5:
        if (ut(t, e), it(e), a & 512 && (we || l === null || Lt(l, l.return)), e.flags & 32) {
          n = e.stateNode;
          try {
            aa(n, "");
          } catch (Z) {
            je(e, e.return, Z);
          }
        }
        a & 4 && e.stateNode != null && (n = e.memoizedProps, kc(
          e,
          n,
          l !== null ? l.memoizedProps : n
        )), a & 1024 && (Wc = !0);
        break;
      case 6:
        if (ut(t, e), it(e), a & 4) {
          if (e.stateNode === null)
            throw Error(r(162));
          a = e.memoizedProps, l = e.stateNode;
          try {
            l.nodeValue = a;
          } catch (Z) {
            je(e, e.return, Z);
          }
        }
        break;
      case 3:
        if ($u = null, n = Dt, Dt = ku(t.containerInfo), ut(t, e), Dt = n, it(e), a & 4 && l !== null && l.memoizedState.isDehydrated)
          try {
            Ua(t.containerInfo);
          } catch (Z) {
            je(e, e.return, Z);
          }
        Wc && (Wc = !1, Vo(e));
        break;
      case 4:
        a = Dt, Dt = ku(
          e.stateNode.containerInfo
        ), ut(t, e), it(e), Dt = a;
        break;
      case 12:
        ut(t, e), it(e);
        break;
      case 31:
        ut(t, e), it(e), a & 4 && (a = e.updateQueue, a !== null && (e.updateQueue = null, Uu(e, a)));
        break;
      case 13:
        ut(t, e), it(e), e.child.flags & 8192 && e.memoizedState !== null != (l !== null && l.memoizedState !== null) && (Bu = st()), a & 4 && (a = e.updateQueue, a !== null && (e.updateQueue = null, Uu(e, a)));
        break;
      case 22:
        n = e.memoizedState !== null;
        var m = l !== null && l.memoizedState !== null, _ = It, N = we;
        if (It = _ || n, we = N || m, ut(t, e), we = N, It = _, it(e), a & 8192)
          e: for (t = e.stateNode, t._visibility = n ? t._visibility & -2 : t._visibility | 1, n && (l === null || m || It || we || kl(e)), l = null, t = e; ; ) {
            if (t.tag === 5 || t.tag === 26) {
              if (l === null) {
                m = l = t;
                try {
                  if (u = m.stateNode, n)
                    c = u.style, typeof c.setProperty == "function" ? c.setProperty("display", "none", "important") : c.display = "none";
                  else {
                    o = m.stateNode;
                    var C = m.memoizedProps.style, x = C != null && C.hasOwnProperty("display") ? C.display : null;
                    o.style.display = x == null || typeof x == "boolean" ? "" : ("" + x).trim();
                  }
                } catch (Z) {
                  je(m, m.return, Z);
                }
              }
            } else if (t.tag === 6) {
              if (l === null) {
                m = t;
                try {
                  m.stateNode.nodeValue = n ? "" : m.memoizedProps;
                } catch (Z) {
                  je(m, m.return, Z);
                }
              }
            } else if (t.tag === 18) {
              if (l === null) {
                m = t;
                try {
                  var z = m.stateNode;
                  n ? Ud(z, !0) : Ud(m.stateNode, !1);
                } catch (Z) {
                  je(m, m.return, Z);
                }
              }
            } else if ((t.tag !== 22 && t.tag !== 23 || t.memoizedState === null || t === e) && t.child !== null) {
              t.child.return = t, t = t.child;
              continue;
            }
            if (t === e) break e;
            for (; t.sibling === null; ) {
              if (t.return === null || t.return === e) break e;
              l === t && (l = null), t = t.return;
            }
            l === t && (l = null), t.sibling.return = t.return, t = t.sibling;
          }
        a & 4 && (a = e.updateQueue, a !== null && (l = a.retryQueue, l !== null && (a.retryQueue = null, Uu(e, l))));
        break;
      case 19:
        ut(t, e), it(e), a & 4 && (a = e.updateQueue, a !== null && (e.updateQueue = null, Uu(e, a)));
        break;
      case 30:
        break;
      case 21:
        break;
      default:
        ut(t, e), it(e);
    }
  }
  function it(e) {
    var t = e.flags;
    if (t & 2) {
      try {
        for (var l, a = e.return; a !== null; ) {
          if (Bo(a)) {
            l = a;
            break;
          }
          a = a.return;
        }
        if (l == null) throw Error(r(160));
        switch (l.tag) {
          case 27:
            var n = l.stateNode, u = Fc(e);
            Cu(e, u, n);
            break;
          case 5:
            var c = l.stateNode;
            l.flags & 32 && (aa(c, ""), l.flags &= -33);
            var o = Fc(e);
            Cu(e, o, c);
            break;
          case 3:
          case 4:
            var m = l.stateNode.containerInfo, _ = Fc(e);
            $c(
              e,
              _,
              m
            );
            break;
          default:
            throw Error(r(161));
        }
      } catch (N) {
        je(e, e.return, N);
      }
      e.flags &= -3;
    }
    t & 4096 && (e.flags &= -4097);
  }
  function Vo(e) {
    if (e.subtreeFlags & 1024)
      for (e = e.child; e !== null; ) {
        var t = e;
        Vo(t), t.tag === 5 && t.flags & 1024 && t.stateNode.reset(), e = e.sibling;
      }
  }
  function el(e, t) {
    if (t.subtreeFlags & 8772)
      for (t = t.child; t !== null; )
        Yo(e, t.alternate, t), t = t.sibling;
  }
  function kl(e) {
    for (e = e.child; e !== null; ) {
      var t = e;
      switch (t.tag) {
        case 0:
        case 11:
        case 14:
        case 15:
          gl(4, t, t.return), kl(t);
          break;
        case 1:
          Lt(t, t.return);
          var l = t.stateNode;
          typeof l.componentWillUnmount == "function" && Uo(
            t,
            t.return,
            l
          ), kl(t);
          break;
        case 27:
          xn(t.stateNode);
        case 26:
        case 5:
          Lt(t, t.return), kl(t);
          break;
        case 22:
          t.memoizedState === null && kl(t);
          break;
        case 30:
          kl(t);
          break;
        default:
          kl(t);
      }
      e = e.sibling;
    }
  }
  function tl(e, t, l) {
    for (l = l && (t.subtreeFlags & 8772) !== 0, t = t.child; t !== null; ) {
      var a = t.alternate, n = e, u = t, c = u.flags;
      switch (u.tag) {
        case 0:
        case 11:
        case 15:
          tl(
            n,
            u,
            l
          ), yn(4, u);
          break;
        case 1:
          if (tl(
            n,
            u,
            l
          ), a = u, n = a.stateNode, typeof n.componentDidMount == "function")
            try {
              n.componentDidMount();
            } catch (_) {
              je(a, a.return, _);
            }
          if (a = u, n = a.updateQueue, n !== null) {
            var o = a.stateNode;
            try {
              var m = n.shared.hiddenCallbacks;
              if (m !== null)
                for (n.shared.hiddenCallbacks = null, n = 0; n < m.length; n++)
                  Er(m[n], o);
            } catch (_) {
              je(a, a.return, _);
            }
          }
          l && c & 64 && Co(u), pn(u, u.return);
          break;
        case 27:
          Lo(u);
        case 26:
        case 5:
          tl(
            n,
            u,
            l
          ), l && a === null && c & 4 && Ho(u), pn(u, u.return);
          break;
        case 12:
          tl(
            n,
            u,
            l
          );
          break;
        case 31:
          tl(
            n,
            u,
            l
          ), l && c & 4 && Qo(n, u);
          break;
        case 13:
          tl(
            n,
            u,
            l
          ), l && c & 4 && wo(n, u);
          break;
        case 22:
          u.memoizedState === null && tl(
            n,
            u,
            l
          ), pn(u, u.return);
          break;
        case 30:
          break;
        default:
          tl(
            n,
            u,
            l
          );
      }
      t = t.sibling;
    }
  }
  function Ic(e, t) {
    var l = null;
    e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (l = e.memoizedState.cachePool.pool), e = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (e = t.memoizedState.cachePool.pool), e !== l && (e != null && e.refCount++, l != null && tn(l));
  }
  function Pc(e, t) {
    e = null, t.alternate !== null && (e = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== e && (t.refCount++, e != null && tn(e));
  }
  function Ct(e, t, l, a) {
    if (t.subtreeFlags & 10256)
      for (t = t.child; t !== null; )
        Jo(
          e,
          t,
          l,
          a
        ), t = t.sibling;
  }
  function Jo(e, t, l, a) {
    var n = t.flags;
    switch (t.tag) {
      case 0:
      case 11:
      case 15:
        Ct(
          e,
          t,
          l,
          a
        ), n & 2048 && yn(9, t);
        break;
      case 1:
        Ct(
          e,
          t,
          l,
          a
        );
        break;
      case 3:
        Ct(
          e,
          t,
          l,
          a
        ), n & 2048 && (e = null, t.alternate !== null && (e = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== e && (t.refCount++, e != null && tn(e)));
        break;
      case 12:
        if (n & 2048) {
          Ct(
            e,
            t,
            l,
            a
          ), e = t.stateNode;
          try {
            var u = t.memoizedProps, c = u.id, o = u.onPostCommit;
            typeof o == "function" && o(
              c,
              t.alternate === null ? "mount" : "update",
              e.passiveEffectDuration,
              -0
            );
          } catch (m) {
            je(t, t.return, m);
          }
        } else
          Ct(
            e,
            t,
            l,
            a
          );
        break;
      case 31:
        Ct(
          e,
          t,
          l,
          a
        );
        break;
      case 13:
        Ct(
          e,
          t,
          l,
          a
        );
        break;
      case 23:
        break;
      case 22:
        u = t.stateNode, c = t.alternate, t.memoizedState !== null ? u._visibility & 2 ? Ct(
          e,
          t,
          l,
          a
        ) : vn(e, t) : u._visibility & 2 ? Ct(
          e,
          t,
          l,
          a
        ) : (u._visibility |= 2, _a(
          e,
          t,
          l,
          a,
          (t.subtreeFlags & 10256) !== 0 || !1
        )), n & 2048 && Ic(c, t);
        break;
      case 24:
        Ct(
          e,
          t,
          l,
          a
        ), n & 2048 && Pc(t.alternate, t);
        break;
      default:
        Ct(
          e,
          t,
          l,
          a
        );
    }
  }
  function _a(e, t, l, a, n) {
    for (n = n && ((t.subtreeFlags & 10256) !== 0 || !1), t = t.child; t !== null; ) {
      var u = e, c = t, o = l, m = a, _ = c.flags;
      switch (c.tag) {
        case 0:
        case 11:
        case 15:
          _a(
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
          c.memoizedState !== null ? N._visibility & 2 ? _a(
            u,
            c,
            o,
            m,
            n
          ) : vn(
            u,
            c
          ) : (N._visibility |= 2, _a(
            u,
            c,
            o,
            m,
            n
          )), n && _ & 2048 && Ic(
            c.alternate,
            c
          );
          break;
        case 24:
          _a(
            u,
            c,
            o,
            m,
            n
          ), n && _ & 2048 && Pc(c.alternate, c);
          break;
        default:
          _a(
            u,
            c,
            o,
            m,
            n
          );
      }
      t = t.sibling;
    }
  }
  function vn(e, t) {
    if (t.subtreeFlags & 10256)
      for (t = t.child; t !== null; ) {
        var l = e, a = t, n = a.flags;
        switch (a.tag) {
          case 22:
            vn(l, a), n & 2048 && Ic(
              a.alternate,
              a
            );
            break;
          case 24:
            vn(l, a), n & 2048 && Pc(a.alternate, a);
            break;
          default:
            vn(l, a);
        }
        t = t.sibling;
      }
  }
  var gn = 8192;
  function Ta(e, t, l) {
    if (e.subtreeFlags & gn)
      for (e = e.child; e !== null; )
        Ko(
          e,
          t,
          l
        ), e = e.sibling;
  }
  function Ko(e, t, l) {
    switch (e.tag) {
      case 26:
        Ta(
          e,
          t,
          l
        ), e.flags & gn && e.memoizedState !== null && cp(
          l,
          Dt,
          e.memoizedState,
          e.memoizedProps
        );
        break;
      case 5:
        Ta(
          e,
          t,
          l
        );
        break;
      case 3:
      case 4:
        var a = Dt;
        Dt = ku(e.stateNode.containerInfo), Ta(
          e,
          t,
          l
        ), Dt = a;
        break;
      case 22:
        e.memoizedState === null && (a = e.alternate, a !== null && a.memoizedState !== null ? (a = gn, gn = 16777216, Ta(
          e,
          t,
          l
        ), gn = a) : Ta(
          e,
          t,
          l
        ));
        break;
      default:
        Ta(
          e,
          t,
          l
        );
    }
  }
  function ko(e) {
    var t = e.alternate;
    if (t !== null && (e = t.child, e !== null)) {
      t.child = null;
      do
        t = e.sibling, e.sibling = null, e = t;
      while (e !== null);
    }
  }
  function bn(e) {
    var t = e.deletions;
    if ((e.flags & 16) !== 0) {
      if (t !== null)
        for (var l = 0; l < t.length; l++) {
          var a = t[l];
          Je = a, $o(
            a,
            e
          );
        }
      ko(e);
    }
    if (e.subtreeFlags & 10256)
      for (e = e.child; e !== null; )
        Fo(e), e = e.sibling;
  }
  function Fo(e) {
    switch (e.tag) {
      case 0:
      case 11:
      case 15:
        bn(e), e.flags & 2048 && gl(9, e, e.return);
        break;
      case 3:
        bn(e);
        break;
      case 12:
        bn(e);
        break;
      case 22:
        var t = e.stateNode;
        e.memoizedState !== null && t._visibility & 2 && (e.return === null || e.return.tag !== 13) ? (t._visibility &= -3, Hu(e)) : bn(e);
        break;
      default:
        bn(e);
    }
  }
  function Hu(e) {
    var t = e.deletions;
    if ((e.flags & 16) !== 0) {
      if (t !== null)
        for (var l = 0; l < t.length; l++) {
          var a = t[l];
          Je = a, $o(
            a,
            e
          );
        }
      ko(e);
    }
    for (e = e.child; e !== null; ) {
      switch (t = e, t.tag) {
        case 0:
        case 11:
        case 15:
          gl(8, t, t.return), Hu(t);
          break;
        case 22:
          l = t.stateNode, l._visibility & 2 && (l._visibility &= -3, Hu(t));
          break;
        default:
          Hu(t);
      }
      e = e.sibling;
    }
  }
  function $o(e, t) {
    for (; Je !== null; ) {
      var l = Je;
      switch (l.tag) {
        case 0:
        case 11:
        case 15:
          gl(8, l, t);
          break;
        case 23:
        case 22:
          if (l.memoizedState !== null && l.memoizedState.cachePool !== null) {
            var a = l.memoizedState.cachePool.pool;
            a != null && a.refCount++;
          }
          break;
        case 24:
          tn(l.memoizedState.cache);
      }
      if (a = l.child, a !== null) a.return = l, Je = a;
      else
        e: for (l = e; Je !== null; ) {
          a = Je;
          var n = a.sibling, u = a.return;
          if (Go(a), a === l) {
            Je = null;
            break e;
          }
          if (n !== null) {
            n.return = u, Je = n;
            break e;
          }
          Je = u;
        }
    }
  }
  var jy = {
    getCacheForType: function(e) {
      var t = Fe(Ge), l = t.data.get(e);
      return l === void 0 && (l = e(), t.data.set(e, l)), l;
    },
    cacheSignal: function() {
      return Fe(Ge).controller.signal;
    }
  }, _y = typeof WeakMap == "function" ? WeakMap : Map, ve = 0, ze = null, ie = null, se = 0, Ee = 0, pt = null, bl = !1, xa = !1, ef = !1, ll = 0, Ue = 0, Sl = 0, Fl = 0, tf = 0, vt = 0, Aa = 0, Sn = null, ct = null, lf = !1, Bu = 0, Wo = 0, Lu = 1 / 0, qu = null, El = null, Ze = 0, jl = null, za = null, al = 0, af = 0, nf = null, Io = null, En = 0, uf = null;
  function gt() {
    return (ve & 2) !== 0 && se !== 0 ? se & -se : B.T !== null ? df() : hs();
  }
  function Po() {
    if (vt === 0)
      if ((se & 536870912) === 0 || de) {
        var e = Jn;
        Jn <<= 1, (Jn & 3932160) === 0 && (Jn = 262144), vt = e;
      } else vt = 536870912;
    return e = mt.current, e !== null && (e.flags |= 32), vt;
  }
  function ft(e, t, l) {
    (e === ze && (Ee === 2 || Ee === 9) || e.cancelPendingCommit !== null) && (Ra(e, 0), _l(
      e,
      se,
      vt,
      !1
    )), Xa(e, l), ((ve & 2) === 0 || e !== ze) && (e === ze && ((ve & 2) === 0 && (Fl |= l), Ue === 4 && _l(
      e,
      se,
      vt,
      !1
    )), qt(e));
  }
  function ed(e, t, l) {
    if ((ve & 6) !== 0) throw Error(r(327));
    var a = !l && (t & 127) === 0 && (t & e.expiredLanes) === 0 || Ga(e, t), n = a ? Ay(e, t) : ff(e, t, !0), u = a;
    do {
      if (n === 0) {
        xa && !a && _l(e, t, 0, !1);
        break;
      } else {
        if (l = e.current.alternate, u && !Ty(l)) {
          n = ff(e, t, !1), u = !1;
          continue;
        }
        if (n === 2) {
          if (u = t, e.errorRecoveryDisabledLanes & u)
            var c = 0;
          else
            c = e.pendingLanes & -536870913, c = c !== 0 ? c : c & 536870912 ? 536870912 : 0;
          if (c !== 0) {
            t = c;
            e: {
              var o = e;
              n = Sn;
              var m = o.current.memoizedState.isDehydrated;
              if (m && (Ra(o, c).flags |= 256), c = ff(
                o,
                c,
                !1
              ), c !== 2) {
                if (ef && !m) {
                  o.errorRecoveryDisabledLanes |= u, Fl |= u, n = 4;
                  break e;
                }
                u = ct, ct = n, u !== null && (ct === null ? ct = u : ct.push.apply(
                  ct,
                  u
                ));
              }
              n = c;
            }
            if (u = !1, n !== 2) continue;
          }
        }
        if (n === 1) {
          Ra(e, 0), _l(e, t, 0, !0);
          break;
        }
        e: {
          switch (a = e, u = n, u) {
            case 0:
            case 1:
              throw Error(r(345));
            case 4:
              if ((t & 4194048) !== t) break;
            case 6:
              _l(
                a,
                t,
                vt,
                !bl
              );
              break e;
            case 2:
              ct = null;
              break;
            case 3:
            case 5:
              break;
            default:
              throw Error(r(329));
          }
          if ((t & 62914560) === t && (n = Bu + 300 - st(), 10 < n)) {
            if (_l(
              a,
              t,
              vt,
              !bl
            ), kn(a, 0, !0) !== 0) break e;
            al = t, a.timeoutHandle = Md(
              td.bind(
                null,
                a,
                l,
                ct,
                qu,
                lf,
                t,
                vt,
                Fl,
                Aa,
                bl,
                u,
                "Throttled",
                -0,
                0
              ),
              n
            );
            break e;
          }
          td(
            a,
            l,
            ct,
            qu,
            lf,
            t,
            vt,
            Fl,
            Aa,
            bl,
            u,
            null,
            -0,
            0
          );
        }
      }
      break;
    } while (!0);
    qt(e);
  }
  function td(e, t, l, a, n, u, c, o, m, _, N, C, x, z) {
    if (e.timeoutHandle = -1, C = t.subtreeFlags, C & 8192 || (C & 16785408) === 16785408) {
      C = {
        stylesheets: null,
        count: 0,
        imgCount: 0,
        imgBytes: 0,
        suspenseyImages: [],
        waitingForImages: !0,
        waitingForViewTransition: !1,
        unsuspend: Qt
      }, Ko(
        t,
        u,
        C
      );
      var Z = (u & 62914560) === u ? Bu - st() : (u & 4194048) === u ? Wo - st() : 0;
      if (Z = fp(
        C,
        Z
      ), Z !== null) {
        al = u, e.cancelPendingCommit = Z(
          sd.bind(
            null,
            e,
            t,
            u,
            l,
            a,
            n,
            c,
            o,
            m,
            N,
            C,
            null,
            x,
            z
          )
        ), _l(e, u, c, !_);
        return;
      }
    }
    sd(
      e,
      t,
      u,
      l,
      a,
      n,
      c,
      o,
      m
    );
  }
  function Ty(e) {
    for (var t = e; ; ) {
      var l = t.tag;
      if ((l === 0 || l === 11 || l === 15) && t.flags & 16384 && (l = t.updateQueue, l !== null && (l = l.stores, l !== null)))
        for (var a = 0; a < l.length; a++) {
          var n = l[a], u = n.getSnapshot;
          n = n.value;
          try {
            if (!dt(u(), n)) return !1;
          } catch (c) {
            return !1;
          }
        }
      if (l = t.child, t.subtreeFlags & 16384 && l !== null)
        l.return = t, t = l;
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
  function _l(e, t, l, a) {
    t &= ~tf, t &= ~Fl, e.suspendedLanes |= t, e.pingedLanes &= ~t, a && (e.warmLanes |= t), a = e.expirationTimes;
    for (var n = t; 0 < n; ) {
      var u = 31 - ot(n), c = 1 << u;
      a[u] = -1, n &= ~c;
    }
    l !== 0 && rs(e, l, t);
  }
  function Yu() {
    return (ve & 6) === 0 ? (jn(0), !1) : !0;
  }
  function cf() {
    if (ie !== null) {
      if (Ee === 0)
        var e = ie.return;
      else
        e = ie, Jt = Gl = null, jc(e), ga = null, an = 0, e = ie;
      for (; e !== null; )
        Do(e.alternate, e), e = e.return;
      ie = null;
    }
  }
  function Ra(e, t) {
    var l = e.timeoutHandle;
    l !== -1 && (e.timeoutHandle = -1, Zy(l)), l = e.cancelPendingCommit, l !== null && (e.cancelPendingCommit = null, l()), al = 0, cf(), ze = e, ie = l = Zt(e.current, null), se = t, Ee = 0, pt = null, bl = !1, xa = Ga(e, t), ef = !1, Aa = vt = tf = Fl = Sl = Ue = 0, ct = Sn = null, lf = !1, (t & 8) !== 0 && (t |= t & 32);
    var a = e.entangledLanes;
    if (a !== 0)
      for (e = e.entanglements, a &= t; 0 < a; ) {
        var n = 31 - ot(a), u = 1 << n;
        t |= e[n], a &= ~u;
      }
    return ll = t, iu(), l;
  }
  function ld(e, t) {
    te = null, B.H = dn, t === va || t === mu ? (t = vr(), Ee = 3) : t === rc ? (t = vr(), Ee = 4) : Ee = t === qc ? 8 : t !== null && typeof t == "object" && typeof t.then == "function" ? 6 : 1, pt = t, ie === null && (Ue = 1, Ru(
      e,
      _t(t, e.current)
    ));
  }
  function ad() {
    var e = mt.current;
    return e === null ? !0 : (se & 4194048) === se ? zt === null : (se & 62914560) === se || (se & 536870912) !== 0 ? e === zt : !1;
  }
  function nd() {
    var e = B.H;
    return B.H = dn, e === null ? dn : e;
  }
  function ud() {
    var e = B.A;
    return B.A = jy, e;
  }
  function Gu() {
    Ue = 4, bl || (se & 4194048) !== se && mt.current !== null || (xa = !0), (Sl & 134217727) === 0 && (Fl & 134217727) === 0 || ze === null || _l(
      ze,
      se,
      vt,
      !1
    );
  }
  function ff(e, t, l) {
    var a = ve;
    ve |= 2;
    var n = nd(), u = ud();
    (ze !== e || se !== t) && (qu = null, Ra(e, t)), t = !1;
    var c = Ue;
    e: do
      try {
        if (Ee !== 0 && ie !== null) {
          var o = ie, m = pt;
          switch (Ee) {
            case 8:
              cf(), c = 6;
              break e;
            case 3:
            case 2:
            case 9:
            case 6:
              mt.current === null && (t = !0);
              var _ = Ee;
              if (Ee = 0, pt = null, Na(e, o, m, _), l && xa) {
                c = 0;
                break e;
              }
              break;
            default:
              _ = Ee, Ee = 0, pt = null, Na(e, o, m, _);
          }
        }
        xy(), c = Ue;
        break;
      } catch (N) {
        ld(e, N);
      }
    while (!0);
    return t && e.shellSuspendCounter++, Jt = Gl = null, ve = a, B.H = n, B.A = u, ie === null && (ze = null, se = 0, iu()), c;
  }
  function xy() {
    for (; ie !== null; ) id(ie);
  }
  function Ay(e, t) {
    var l = ve;
    ve |= 2;
    var a = nd(), n = ud();
    ze !== e || se !== t ? (qu = null, Lu = st() + 500, Ra(e, t)) : xa = Ga(
      e,
      t
    );
    e: do
      try {
        if (Ee !== 0 && ie !== null) {
          t = ie;
          var u = pt;
          t: switch (Ee) {
            case 1:
              Ee = 0, pt = null, Na(e, t, u, 1);
              break;
            case 2:
            case 9:
              if (yr(u)) {
                Ee = 0, pt = null, cd(t);
                break;
              }
              t = function() {
                Ee !== 2 && Ee !== 9 || ze !== e || (Ee = 7), qt(e);
              }, u.then(t, t);
              break e;
            case 3:
              Ee = 7;
              break e;
            case 4:
              Ee = 5;
              break e;
            case 7:
              yr(u) ? (Ee = 0, pt = null, cd(t)) : (Ee = 0, pt = null, Na(e, t, u, 7));
              break;
            case 5:
              var c = null;
              switch (ie.tag) {
                case 26:
                  c = ie.memoizedState;
                case 5:
                case 27:
                  var o = ie;
                  if (c ? Jd(c) : o.stateNode.complete) {
                    Ee = 0, pt = null;
                    var m = o.sibling;
                    if (m !== null) ie = m;
                    else {
                      var _ = o.return;
                      _ !== null ? (ie = _, Xu(_)) : ie = null;
                    }
                    break t;
                  }
              }
              Ee = 0, pt = null, Na(e, t, u, 5);
              break;
            case 6:
              Ee = 0, pt = null, Na(e, t, u, 6);
              break;
            case 8:
              cf(), Ue = 6;
              break e;
            default:
              throw Error(r(462));
          }
        }
        zy();
        break;
      } catch (N) {
        ld(e, N);
      }
    while (!0);
    return Jt = Gl = null, B.H = a, B.A = n, ve = l, ie !== null ? 0 : (ze = null, se = 0, iu(), Ue);
  }
  function zy() {
    for (; ie !== null && !$h(); )
      id(ie);
  }
  function id(e) {
    var t = Oo(e.alternate, e, ll);
    e.memoizedProps = e.pendingProps, t === null ? Xu(e) : ie = t;
  }
  function cd(e) {
    var t = e, l = t.alternate;
    switch (t.tag) {
      case 15:
      case 0:
        t = To(
          l,
          t,
          t.pendingProps,
          t.type,
          void 0,
          se
        );
        break;
      case 11:
        t = To(
          l,
          t,
          t.pendingProps,
          t.type.render,
          t.ref,
          se
        );
        break;
      case 5:
        jc(t);
      default:
        Do(l, t), t = ie = nr(t, ll), t = Oo(l, t, ll);
    }
    e.memoizedProps = e.pendingProps, t === null ? Xu(e) : ie = t;
  }
  function Na(e, t, l, a) {
    Jt = Gl = null, jc(t), ga = null, an = 0;
    var n = t.return;
    try {
      if (yy(
        e,
        n,
        t,
        l,
        se
      )) {
        Ue = 1, Ru(
          e,
          _t(l, e.current)
        ), ie = null;
        return;
      }
    } catch (u) {
      if (n !== null) throw ie = n, u;
      Ue = 1, Ru(
        e,
        _t(l, e.current)
      ), ie = null;
      return;
    }
    t.flags & 32768 ? (de || a === 1 ? e = !0 : xa || (se & 536870912) !== 0 ? e = !1 : (bl = e = !0, (a === 2 || a === 9 || a === 3 || a === 6) && (a = mt.current, a !== null && a.tag === 13 && (a.flags |= 16384))), fd(t, e)) : Xu(t);
  }
  function Xu(e) {
    var t = e;
    do {
      if ((t.flags & 32768) !== 0) {
        fd(
          t,
          bl
        );
        return;
      }
      e = t.return;
      var l = gy(
        t.alternate,
        t,
        ll
      );
      if (l !== null) {
        ie = l;
        return;
      }
      if (t = t.sibling, t !== null) {
        ie = t;
        return;
      }
      ie = t = e;
    } while (t !== null);
    Ue === 0 && (Ue = 5);
  }
  function fd(e, t) {
    do {
      var l = by(e.alternate, e);
      if (l !== null) {
        l.flags &= 32767, ie = l;
        return;
      }
      if (l = e.return, l !== null && (l.flags |= 32768, l.subtreeFlags = 0, l.deletions = null), !t && (e = e.sibling, e !== null)) {
        ie = e;
        return;
      }
      ie = e = l;
    } while (e !== null);
    Ue = 6, ie = null;
  }
  function sd(e, t, l, a, n, u, c, o, m) {
    e.cancelPendingCommit = null;
    do
      Qu();
    while (Ze !== 0);
    if ((ve & 6) !== 0) throw Error(r(327));
    if (t !== null) {
      if (t === e.current) throw Error(r(177));
      if (u = t.lanes | t.childLanes, u |= Fi, im(
        e,
        l,
        u,
        c,
        o,
        m
      ), e === ze && (ie = ze = null, se = 0), za = t, jl = e, al = l, af = u, nf = n, Io = a, (t.subtreeFlags & 10256) !== 0 || (t.flags & 10256) !== 0 ? (e.callbackNode = null, e.callbackPriority = 0, My(Zn, function() {
        return md(), null;
      })) : (e.callbackNode = null, e.callbackPriority = 0), a = (t.flags & 13878) !== 0, (t.subtreeFlags & 13878) !== 0 || a) {
        a = B.T, B.T = null, n = Y.p, Y.p = 2, c = ve, ve |= 4;
        try {
          Sy(e, t, l);
        } finally {
          ve = c, Y.p = n, B.T = a;
        }
      }
      Ze = 1, rd(), od(), dd();
    }
  }
  function rd() {
    if (Ze === 1) {
      Ze = 0;
      var e = jl, t = za, l = (t.flags & 13878) !== 0;
      if ((t.subtreeFlags & 13878) !== 0 || l) {
        l = B.T, B.T = null;
        var a = Y.p;
        Y.p = 2;
        var n = ve;
        ve |= 4;
        try {
          Zo(t, e);
          var u = Sf, c = Fs(e.containerInfo), o = u.focusedElem, m = u.selectionRange;
          if (c !== o && o && o.ownerDocument && ks(
            o.ownerDocument.documentElement,
            o
          )) {
            if (m !== null && Zi(o)) {
              var _ = m.start, N = m.end;
              if (N === void 0 && (N = _), "selectionStart" in o)
                o.selectionStart = _, o.selectionEnd = Math.min(
                  N,
                  o.value.length
                );
              else {
                var C = o.ownerDocument || document, x = C && C.defaultView || window;
                if (x.getSelection) {
                  var z = x.getSelection(), Z = o.textContent.length, W = Math.min(m.start, Z), xe = m.end === void 0 ? W : Math.min(m.end, Z);
                  !z.extend && W > xe && (c = xe, xe = W, W = c);
                  var S = Ks(
                    o,
                    W
                  ), g = Ks(
                    o,
                    xe
                  );
                  if (S && g && (z.rangeCount !== 1 || z.anchorNode !== S.node || z.anchorOffset !== S.offset || z.focusNode !== g.node || z.focusOffset !== g.offset)) {
                    var j = C.createRange();
                    j.setStart(S.node, S.offset), z.removeAllRanges(), W > xe ? (z.addRange(j), z.extend(g.node, g.offset)) : (j.setEnd(g.node, g.offset), z.addRange(j));
                  }
                }
              }
            }
            for (C = [], z = o; z = z.parentNode; )
              z.nodeType === 1 && C.push({
                element: z,
                left: z.scrollLeft,
                top: z.scrollTop
              });
            for (typeof o.focus == "function" && o.focus(), o = 0; o < C.length; o++) {
              var M = C[o];
              M.element.scrollLeft = M.left, M.element.scrollTop = M.top;
            }
          }
          ei = !!bf, Sf = bf = null;
        } finally {
          ve = n, Y.p = a, B.T = l;
        }
      }
      e.current = t, Ze = 2;
    }
  }
  function od() {
    if (Ze === 2) {
      Ze = 0;
      var e = jl, t = za, l = (t.flags & 8772) !== 0;
      if ((t.subtreeFlags & 8772) !== 0 || l) {
        l = B.T, B.T = null;
        var a = Y.p;
        Y.p = 2;
        var n = ve;
        ve |= 4;
        try {
          Yo(e, t.alternate, t);
        } finally {
          ve = n, Y.p = a, B.T = l;
        }
      }
      Ze = 3;
    }
  }
  function dd() {
    if (Ze === 4 || Ze === 3) {
      Ze = 0, Wh();
      var e = jl, t = za, l = al, a = Io;
      (t.subtreeFlags & 10256) !== 0 || (t.flags & 10256) !== 0 ? Ze = 5 : (Ze = 0, za = jl = null, hd(e, e.pendingLanes));
      var n = e.pendingLanes;
      if (n === 0 && (El = null), xi(l), t = t.stateNode, rt && typeof rt.onCommitFiberRoot == "function")
        try {
          rt.onCommitFiberRoot(
            Ya,
            t,
            void 0,
            (t.current.flags & 128) === 128
          );
        } catch (m) {
        }
      if (a !== null) {
        t = B.T, n = Y.p, Y.p = 2, B.T = null;
        try {
          for (var u = e.onRecoverableError, c = 0; c < a.length; c++) {
            var o = a[c];
            u(o.value, {
              componentStack: o.stack
            });
          }
        } finally {
          B.T = t, Y.p = n;
        }
      }
      (al & 3) !== 0 && Qu(), qt(e), n = e.pendingLanes, (l & 261930) !== 0 && (n & 42) !== 0 ? e === uf ? En++ : (En = 0, uf = e) : En = 0, jn(0);
    }
  }
  function hd(e, t) {
    (e.pooledCacheLanes &= t) === 0 && (t = e.pooledCache, t != null && (e.pooledCache = null, tn(t)));
  }
  function Qu() {
    return rd(), od(), dd(), md();
  }
  function md() {
    if (Ze !== 5) return !1;
    var e = jl, t = af;
    af = 0;
    var l = xi(al), a = B.T, n = Y.p;
    try {
      Y.p = 32 > l ? 32 : l, B.T = null, l = nf, nf = null;
      var u = jl, c = al;
      if (Ze = 0, za = jl = null, al = 0, (ve & 6) !== 0) throw Error(r(331));
      var o = ve;
      if (ve |= 4, Fo(u.current), Jo(
        u,
        u.current,
        c,
        l
      ), ve = o, jn(0, !1), rt && typeof rt.onPostCommitFiberRoot == "function")
        try {
          rt.onPostCommitFiberRoot(Ya, u);
        } catch (m) {
        }
      return !0;
    } finally {
      Y.p = n, B.T = a, hd(e, t);
    }
  }
  function yd(e, t, l) {
    t = _t(l, t), t = Lc(e.stateNode, t, 2), e = yl(e, t, 2), e !== null && (Xa(e, 2), qt(e));
  }
  function je(e, t, l) {
    if (e.tag === 3)
      yd(e, e, l);
    else
      for (; t !== null; ) {
        if (t.tag === 3) {
          yd(
            t,
            e,
            l
          );
          break;
        } else if (t.tag === 1) {
          var a = t.stateNode;
          if (typeof t.type.getDerivedStateFromError == "function" || typeof a.componentDidCatch == "function" && (El === null || !El.has(a))) {
            e = _t(l, e), l = po(2), a = yl(t, l, 2), a !== null && (vo(
              l,
              a,
              t,
              e
            ), Xa(a, 2), qt(a));
            break;
          }
        }
        t = t.return;
      }
  }
  function sf(e, t, l) {
    var a = e.pingCache;
    if (a === null) {
      a = e.pingCache = new _y();
      var n = /* @__PURE__ */ new Set();
      a.set(t, n);
    } else
      n = a.get(t), n === void 0 && (n = /* @__PURE__ */ new Set(), a.set(t, n));
    n.has(l) || (ef = !0, n.add(l), e = Ry.bind(null, e, t, l), t.then(e, e));
  }
  function Ry(e, t, l) {
    var a = e.pingCache;
    a !== null && a.delete(t), e.pingedLanes |= e.suspendedLanes & l, e.warmLanes &= ~l, ze === e && (se & l) === l && (Ue === 4 || Ue === 3 && (se & 62914560) === se && 300 > st() - Bu ? (ve & 2) === 0 && Ra(e, 0) : tf |= l, Aa === se && (Aa = 0)), qt(e);
  }
  function pd(e, t) {
    t === 0 && (t = ss()), e = Ll(e, t), e !== null && (Xa(e, t), qt(e));
  }
  function Ny(e) {
    var t = e.memoizedState, l = 0;
    t !== null && (l = t.retryLane), pd(e, l);
  }
  function Oy(e, t) {
    var l = 0;
    switch (e.tag) {
      case 31:
      case 13:
        var a = e.stateNode, n = e.memoizedState;
        n !== null && (l = n.retryLane);
        break;
      case 19:
        a = e.stateNode;
        break;
      case 22:
        a = e.stateNode._retryCache;
        break;
      default:
        throw Error(r(314));
    }
    a !== null && a.delete(t), pd(e, l);
  }
  function My(e, t) {
    return Ei(e, t);
  }
  var wu = null, Oa = null, rf = !1, Zu = !1, of = !1, Tl = 0;
  function qt(e) {
    e !== Oa && e.next === null && (Oa === null ? wu = Oa = e : Oa = Oa.next = e), Zu = !0, rf || (rf = !0, Cy());
  }
  function jn(e, t) {
    if (!of && Zu) {
      of = !0;
      do
        for (var l = !1, a = wu; a !== null; ) {
          if (e !== 0) {
            var n = a.pendingLanes;
            if (n === 0) var u = 0;
            else {
              var c = a.suspendedLanes, o = a.pingedLanes;
              u = (1 << 31 - ot(42 | e) + 1) - 1, u &= n & ~(c & ~o), u = u & 201326741 ? u & 201326741 | 1 : u ? u | 2 : 0;
            }
            u !== 0 && (l = !0, Sd(a, u));
          } else
            u = se, u = kn(
              a,
              a === ze ? u : 0,
              a.cancelPendingCommit !== null || a.timeoutHandle !== -1
            ), (u & 3) === 0 || Ga(a, u) || (l = !0, Sd(a, u));
          a = a.next;
        }
      while (l);
      of = !1;
    }
  }
  function Dy() {
    vd();
  }
  function vd() {
    Zu = rf = !1;
    var e = 0;
    Tl !== 0 && wy() && (e = Tl);
    for (var t = st(), l = null, a = wu; a !== null; ) {
      var n = a.next, u = gd(a, t);
      u === 0 ? (a.next = null, l === null ? wu = n : l.next = n, n === null && (Oa = l)) : (l = a, (e !== 0 || (u & 3) !== 0) && (Zu = !0)), a = n;
    }
    Ze !== 0 && Ze !== 5 || jn(e), Tl !== 0 && (Tl = 0);
  }
  function gd(e, t) {
    for (var l = e.suspendedLanes, a = e.pingedLanes, n = e.expirationTimes, u = e.pendingLanes & -62914561; 0 < u; ) {
      var c = 31 - ot(u), o = 1 << c, m = n[c];
      m === -1 ? ((o & l) === 0 || (o & a) !== 0) && (n[c] = um(o, t)) : m <= t && (e.expiredLanes |= o), u &= ~o;
    }
    if (t = ze, l = se, l = kn(
      e,
      e === t ? l : 0,
      e.cancelPendingCommit !== null || e.timeoutHandle !== -1
    ), a = e.callbackNode, l === 0 || e === t && (Ee === 2 || Ee === 9) || e.cancelPendingCommit !== null)
      return a !== null && a !== null && ji(a), e.callbackNode = null, e.callbackPriority = 0;
    if ((l & 3) === 0 || Ga(e, l)) {
      if (t = l & -l, t === e.callbackPriority) return t;
      switch (a !== null && ji(a), xi(l)) {
        case 2:
        case 8:
          l = cs;
          break;
        case 32:
          l = Zn;
          break;
        case 268435456:
          l = fs;
          break;
        default:
          l = Zn;
      }
      return a = bd.bind(null, e), l = Ei(l, a), e.callbackPriority = t, e.callbackNode = l, t;
    }
    return a !== null && a !== null && ji(a), e.callbackPriority = 2, e.callbackNode = null, 2;
  }
  function bd(e, t) {
    if (Ze !== 0 && Ze !== 5)
      return e.callbackNode = null, e.callbackPriority = 0, null;
    var l = e.callbackNode;
    if (Qu() && e.callbackNode !== l)
      return null;
    var a = se;
    return a = kn(
      e,
      e === ze ? a : 0,
      e.cancelPendingCommit !== null || e.timeoutHandle !== -1
    ), a === 0 ? null : (ed(e, a, t), gd(e, st()), e.callbackNode != null && e.callbackNode === l ? bd.bind(null, e) : null);
  }
  function Sd(e, t) {
    if (Qu()) return null;
    ed(e, t, !0);
  }
  function Cy() {
    Vy(function() {
      (ve & 6) !== 0 ? Ei(
        is,
        Dy
      ) : vd();
    });
  }
  function df() {
    if (Tl === 0) {
      var e = ya;
      e === 0 && (e = Vn, Vn <<= 1, (Vn & 261888) === 0 && (Vn = 256)), Tl = e;
    }
    return Tl;
  }
  function Ed(e) {
    return e == null || typeof e == "symbol" || typeof e == "boolean" ? null : typeof e == "function" ? e : In("" + e);
  }
  function jd(e, t) {
    var l = t.ownerDocument.createElement("input");
    return l.name = t.name, l.value = t.value, e.id && l.setAttribute("form", e.id), t.parentNode.insertBefore(l, t), e = new FormData(e), l.parentNode.removeChild(l), e;
  }
  function Uy(e, t, l, a, n) {
    if (t === "submit" && l && l.stateNode === n) {
      var u = Ed(
        (n[lt] || null).action
      ), c = a.submitter;
      c && (t = (t = c[lt] || null) ? Ed(t.formAction) : c.getAttribute("formAction"), t !== null && (u = t, c = null));
      var o = new lu(
        "action",
        "action",
        null,
        a,
        n
      );
      e.push({
        event: o,
        listeners: [
          {
            instance: null,
            listener: function() {
              if (a.defaultPrevented) {
                if (Tl !== 0) {
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
    var mf = ki[hf], Hy = mf.toLowerCase(), By = mf[0].toUpperCase() + mf.slice(1);
    Mt(
      Hy,
      "on" + By
    );
  }
  Mt(Is, "onAnimationEnd"), Mt(Ps, "onAnimationIteration"), Mt(er, "onAnimationStart"), Mt("dblclick", "onDoubleClick"), Mt("focusin", "onFocus"), Mt("focusout", "onBlur"), Mt(Im, "onTransitionRun"), Mt(Pm, "onTransitionStart"), Mt(ey, "onTransitionCancel"), Mt(tr, "onTransitionEnd"), ta("onMouseEnter", ["mouseout", "mouseover"]), ta("onMouseLeave", ["mouseout", "mouseover"]), ta("onPointerEnter", ["pointerout", "pointerover"]), ta("onPointerLeave", ["pointerout", "pointerover"]), Cl(
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
  var _n = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(
    " "
  ), Ly = new Set(
    "beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(_n)
  );
  function _d(e, t) {
    t = (t & 4) !== 0;
    for (var l = 0; l < e.length; l++) {
      var a = e[l], n = a.event;
      a = a.listeners;
      e: {
        var u = void 0;
        if (t)
          for (var c = a.length - 1; 0 <= c; c--) {
            var o = a[c], m = o.instance, _ = o.currentTarget;
            if (o = o.listener, m !== u && n.isPropagationStopped())
              break e;
            u = o, n.currentTarget = _;
            try {
              u(n);
            } catch (N) {
              uu(N);
            }
            n.currentTarget = null, u = m;
          }
        else
          for (c = 0; c < a.length; c++) {
            if (o = a[c], m = o.instance, _ = o.currentTarget, o = o.listener, m !== u && n.isPropagationStopped())
              break e;
            u = o, n.currentTarget = _;
            try {
              u(n);
            } catch (N) {
              uu(N);
            }
            n.currentTarget = null, u = m;
          }
      }
    }
  }
  function ce(e, t) {
    var l = t[Ai];
    l === void 0 && (l = t[Ai] = /* @__PURE__ */ new Set());
    var a = e + "__bubble";
    l.has(a) || (Td(t, e, 2, !1), l.add(a));
  }
  function yf(e, t, l) {
    var a = 0;
    t && (a |= 4), Td(
      l,
      e,
      a,
      t
    );
  }
  var Vu = "_reactListening" + Math.random().toString(36).slice(2);
  function pf(e) {
    if (!e[Vu]) {
      e[Vu] = !0, ps.forEach(function(l) {
        l !== "selectionchange" && (Ly.has(l) || yf(l, !1, e), yf(l, !0, e));
      });
      var t = e.nodeType === 9 ? e : e.ownerDocument;
      t === null || t[Vu] || (t[Vu] = !0, yf("selectionchange", !1, t));
    }
  }
  function Td(e, t, l, a) {
    switch (Pd(t)) {
      case 2:
        var n = op;
        break;
      case 8:
        n = dp;
        break;
      default:
        n = Mf;
    }
    l = n.bind(
      null,
      t,
      l,
      e
    ), n = void 0, !Hi || t !== "touchstart" && t !== "touchmove" && t !== "wheel" || (n = !0), a ? n !== void 0 ? e.addEventListener(t, l, {
      capture: !0,
      passive: n
    }) : e.addEventListener(t, l, !0) : n !== void 0 ? e.addEventListener(t, l, {
      passive: n
    }) : e.addEventListener(t, l, !1);
  }
  function vf(e, t, l, a, n) {
    var u = a;
    if ((t & 1) === 0 && (t & 2) === 0 && a !== null)
      e: for (; ; ) {
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
              continue e;
            }
            o = o.parentNode;
          }
        }
        a = a.return;
      }
    Rs(function() {
      var _ = u, N = Ci(l), C = [];
      e: {
        var x = lr.get(e);
        if (x !== void 0) {
          var z = lu, Z = e;
          switch (e) {
            case "keypress":
              if (eu(l) === 0) break e;
            case "keydown":
            case "keyup":
              z = Om;
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
              if (l.button === 2) break e;
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
              z = gm;
              break;
            case "touchcancel":
            case "touchend":
            case "touchmove":
            case "touchstart":
              z = Cm;
              break;
            case Is:
            case Ps:
            case er:
              z = Em;
              break;
            case tr:
              z = Hm;
              break;
            case "scroll":
            case "scrollend":
              z = pm;
              break;
            case "wheel":
              z = Lm;
              break;
            case "copy":
            case "cut":
            case "paste":
              z = _m;
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
              z = Ym;
          }
          var W = (t & 4) !== 0, xe = !W && (e === "scroll" || e === "scrollend"), S = W ? x !== null ? x + "Capture" : null : x;
          W = [];
          for (var g = _, j; g !== null; ) {
            var M = g;
            if (j = M.stateNode, M = M.tag, M !== 5 && M !== 26 && M !== 27 || j === null || S === null || (M = Za(g, S), M != null && W.push(
              Tn(g, M, j)
            )), xe) break;
            g = g.return;
          }
          0 < W.length && (x = new z(
            x,
            Z,
            null,
            l,
            N
          ), C.push({ event: x, listeners: W }));
        }
      }
      if ((t & 7) === 0) {
        e: {
          if (x = e === "mouseover" || e === "pointerover", z = e === "mouseout" || e === "pointerout", x && l !== Di && (Z = l.relatedTarget || l.fromElement) && (Il(Z) || Z[Wl]))
            break e;
          if ((z || x) && (x = N.window === N ? N : (x = N.ownerDocument) ? x.defaultView || x.parentWindow : window, z ? (Z = l.relatedTarget || l.toElement, z = _, Z = Z ? Il(Z) : null, Z !== null && (xe = E(Z), W = Z.tag, Z !== xe || W !== 5 && W !== 27 && W !== 6) && (Z = null)) : (z = null, Z = _), z !== Z)) {
            if (W = Ms, M = "onMouseLeave", S = "onMouseEnter", g = "mouse", (e === "pointerout" || e === "pointerover") && (W = Cs, M = "onPointerLeave", S = "onPointerEnter", g = "pointer"), xe = z == null ? x : wa(z), j = Z == null ? x : wa(Z), x = new W(
              M,
              g + "leave",
              z,
              l,
              N
            ), x.target = xe, x.relatedTarget = j, M = null, Il(N) === _ && (W = new W(
              S,
              g + "enter",
              Z,
              l,
              N
            ), W.target = j, W.relatedTarget = xe, M = W), xe = M, z && Z)
              t: {
                for (W = qy, S = z, g = Z, j = 0, M = S; M; M = W(M))
                  j++;
                M = 0;
                for (var F = g; F; F = W(F))
                  M++;
                for (; 0 < j - M; )
                  S = W(S), j--;
                for (; 0 < M - j; )
                  g = W(g), M--;
                for (; j--; ) {
                  if (S === g || g !== null && S === g.alternate) {
                    W = S;
                    break t;
                  }
                  S = W(S), g = W(g);
                }
                W = null;
              }
            else W = null;
            z !== null && xd(
              C,
              x,
              z,
              W,
              !1
            ), Z !== null && xe !== null && xd(
              C,
              xe,
              Z,
              W,
              !0
            );
          }
        }
        e: {
          if (x = _ ? wa(_) : window, z = x.nodeName && x.nodeName.toLowerCase(), z === "select" || z === "input" && x.type === "file")
            var ye = Xs;
          else if (Ys(x))
            if (Qs)
              ye = Fm;
            else {
              ye = Km;
              var V = Jm;
            }
          else
            z = x.nodeName, !z || z.toLowerCase() !== "input" || x.type !== "checkbox" && x.type !== "radio" ? _ && Mi(_.elementType) && (ye = Xs) : ye = km;
          if (ye && (ye = ye(e, _))) {
            Gs(
              C,
              ye,
              l,
              N
            );
            break e;
          }
          V && V(e, x, _), e === "focusout" && _ && x.type === "number" && _.memoizedProps.value != null && Oi(x, "number", x.value);
        }
        switch (V = _ ? wa(_) : window, e) {
          case "focusin":
            (Ys(V) || V.contentEditable === "true") && (ca = V, Vi = _, Ia = null);
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
            Ji = !1, $s(C, l, N);
            break;
          case "selectionchange":
            if (Wm) break;
          case "keydown":
          case "keyup":
            $s(C, l, N);
        }
        var le;
        if (Xi)
          e: {
            switch (e) {
              case "compositionstart":
                var re = "onCompositionStart";
                break e;
              case "compositionend":
                re = "onCompositionEnd";
                break e;
              case "compositionupdate":
                re = "onCompositionUpdate";
                break e;
            }
            re = void 0;
          }
        else
          ia ? Ls(e, l) && (re = "onCompositionEnd") : e === "keydown" && l.keyCode === 229 && (re = "onCompositionStart");
        re && (Us && l.locale !== "ko" && (ia || re !== "onCompositionStart" ? re === "onCompositionEnd" && ia && (le = Ns()) : (fl = N, Bi = "value" in fl ? fl.value : fl.textContent, ia = !0)), V = Ju(_, re), 0 < V.length && (re = new Ds(
          re,
          e,
          null,
          l,
          N
        ), C.push({ event: re, listeners: V }), le ? re.data = le : (le = qs(l), le !== null && (re.data = le)))), (le = Xm ? Qm(e, l) : wm(e, l)) && (re = Ju(_, "onBeforeInput"), 0 < re.length && (V = new Ds(
          "onBeforeInput",
          "beforeinput",
          null,
          l,
          N
        ), C.push({
          event: V,
          listeners: re
        }), V.data = le)), Uy(
          C,
          e,
          _,
          l,
          N
        );
      }
      _d(C, t);
    });
  }
  function Tn(e, t, l) {
    return {
      instance: e,
      listener: t,
      currentTarget: l
    };
  }
  function Ju(e, t) {
    for (var l = t + "Capture", a = []; e !== null; ) {
      var n = e, u = n.stateNode;
      if (n = n.tag, n !== 5 && n !== 26 && n !== 27 || u === null || (n = Za(e, l), n != null && a.unshift(
        Tn(e, n, u)
      ), n = Za(e, t), n != null && a.push(
        Tn(e, n, u)
      )), e.tag === 3) return a;
      e = e.return;
    }
    return [];
  }
  function qy(e) {
    if (e === null) return null;
    do
      e = e.return;
    while (e && e.tag !== 5 && e.tag !== 27);
    return e || null;
  }
  function xd(e, t, l, a, n) {
    for (var u = t._reactName, c = []; l !== null && l !== a; ) {
      var o = l, m = o.alternate, _ = o.stateNode;
      if (o = o.tag, m !== null && m === a) break;
      o !== 5 && o !== 26 && o !== 27 || _ === null || (m = _, n ? (_ = Za(l, u), _ != null && c.unshift(
        Tn(l, _, m)
      )) : n || (_ = Za(l, u), _ != null && c.push(
        Tn(l, _, m)
      ))), l = l.return;
    }
    c.length !== 0 && e.push({ event: t, listeners: c });
  }
  var Yy = /\r\n?/g, Gy = /\u0000|\uFFFD/g;
  function Ad(e) {
    return (typeof e == "string" ? e : "" + e).replace(Yy, `
`).replace(Gy, "");
  }
  function zd(e, t) {
    return t = Ad(t), Ad(e) === t;
  }
  function Te(e, t, l, a, n, u) {
    switch (l) {
      case "children":
        typeof a == "string" ? t === "body" || t === "textarea" && a === "" || aa(e, a) : (typeof a == "number" || typeof a == "bigint") && t !== "body" && aa(e, "" + a);
        break;
      case "className":
        $n(e, "class", a);
        break;
      case "tabIndex":
        $n(e, "tabindex", a);
        break;
      case "dir":
      case "role":
      case "viewBox":
      case "width":
      case "height":
        $n(e, l, a);
        break;
      case "style":
        As(e, a, u);
        break;
      case "data":
        if (t !== "object") {
          $n(e, "data", a);
          break;
        }
      case "src":
      case "href":
        if (a === "" && (t !== "a" || l !== "href")) {
          e.removeAttribute(l);
          break;
        }
        if (a == null || typeof a == "function" || typeof a == "symbol" || typeof a == "boolean") {
          e.removeAttribute(l);
          break;
        }
        a = In("" + a), e.setAttribute(l, a);
        break;
      case "action":
      case "formAction":
        if (typeof a == "function") {
          e.setAttribute(
            l,
            "javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')"
          );
          break;
        } else
          typeof u == "function" && (l === "formAction" ? (t !== "input" && Te(e, t, "name", n.name, n, null), Te(
            e,
            t,
            "formEncType",
            n.formEncType,
            n,
            null
          ), Te(
            e,
            t,
            "formMethod",
            n.formMethod,
            n,
            null
          ), Te(
            e,
            t,
            "formTarget",
            n.formTarget,
            n,
            null
          )) : (Te(e, t, "encType", n.encType, n, null), Te(e, t, "method", n.method, n, null), Te(e, t, "target", n.target, n, null)));
        if (a == null || typeof a == "symbol" || typeof a == "boolean") {
          e.removeAttribute(l);
          break;
        }
        a = In("" + a), e.setAttribute(l, a);
        break;
      case "onClick":
        a != null && (e.onclick = Qt);
        break;
      case "onScroll":
        a != null && ce("scroll", e);
        break;
      case "onScrollEnd":
        a != null && ce("scrollend", e);
        break;
      case "dangerouslySetInnerHTML":
        if (a != null) {
          if (typeof a != "object" || !("__html" in a))
            throw Error(r(61));
          if (l = a.__html, l != null) {
            if (n.children != null) throw Error(r(60));
            e.innerHTML = l;
          }
        }
        break;
      case "multiple":
        e.multiple = a && typeof a != "function" && typeof a != "symbol";
        break;
      case "muted":
        e.muted = a && typeof a != "function" && typeof a != "symbol";
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
          e.removeAttribute("xlink:href");
          break;
        }
        l = In("" + a), e.setAttributeNS(
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
        a != null && typeof a != "function" && typeof a != "symbol" ? e.setAttribute(l, "" + a) : e.removeAttribute(l);
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
        a && typeof a != "function" && typeof a != "symbol" ? e.setAttribute(l, "") : e.removeAttribute(l);
        break;
      case "capture":
      case "download":
        a === !0 ? e.setAttribute(l, "") : a !== !1 && a != null && typeof a != "function" && typeof a != "symbol" ? e.setAttribute(l, a) : e.removeAttribute(l);
        break;
      case "cols":
      case "rows":
      case "size":
      case "span":
        a != null && typeof a != "function" && typeof a != "symbol" && !isNaN(a) && 1 <= a ? e.setAttribute(l, a) : e.removeAttribute(l);
        break;
      case "rowSpan":
      case "start":
        a == null || typeof a == "function" || typeof a == "symbol" || isNaN(a) ? e.removeAttribute(l) : e.setAttribute(l, a);
        break;
      case "popover":
        ce("beforetoggle", e), ce("toggle", e), Fn(e, "popover", a);
        break;
      case "xlinkActuate":
        Xt(
          e,
          "http://www.w3.org/1999/xlink",
          "xlink:actuate",
          a
        );
        break;
      case "xlinkArcrole":
        Xt(
          e,
          "http://www.w3.org/1999/xlink",
          "xlink:arcrole",
          a
        );
        break;
      case "xlinkRole":
        Xt(
          e,
          "http://www.w3.org/1999/xlink",
          "xlink:role",
          a
        );
        break;
      case "xlinkShow":
        Xt(
          e,
          "http://www.w3.org/1999/xlink",
          "xlink:show",
          a
        );
        break;
      case "xlinkTitle":
        Xt(
          e,
          "http://www.w3.org/1999/xlink",
          "xlink:title",
          a
        );
        break;
      case "xlinkType":
        Xt(
          e,
          "http://www.w3.org/1999/xlink",
          "xlink:type",
          a
        );
        break;
      case "xmlBase":
        Xt(
          e,
          "http://www.w3.org/XML/1998/namespace",
          "xml:base",
          a
        );
        break;
      case "xmlLang":
        Xt(
          e,
          "http://www.w3.org/XML/1998/namespace",
          "xml:lang",
          a
        );
        break;
      case "xmlSpace":
        Xt(
          e,
          "http://www.w3.org/XML/1998/namespace",
          "xml:space",
          a
        );
        break;
      case "is":
        Fn(e, "is", a);
        break;
      case "innerText":
      case "textContent":
        break;
      default:
        (!(2 < l.length) || l[0] !== "o" && l[0] !== "O" || l[1] !== "n" && l[1] !== "N") && (l = mm.get(l) || l, Fn(e, l, a));
    }
  }
  function gf(e, t, l, a, n, u) {
    switch (l) {
      case "style":
        As(e, a, u);
        break;
      case "dangerouslySetInnerHTML":
        if (a != null) {
          if (typeof a != "object" || !("__html" in a))
            throw Error(r(61));
          if (l = a.__html, l != null) {
            if (n.children != null) throw Error(r(60));
            e.innerHTML = l;
          }
        }
        break;
      case "children":
        typeof a == "string" ? aa(e, a) : (typeof a == "number" || typeof a == "bigint") && aa(e, "" + a);
        break;
      case "onScroll":
        a != null && ce("scroll", e);
        break;
      case "onScrollEnd":
        a != null && ce("scrollend", e);
        break;
      case "onClick":
        a != null && (e.onclick = Qt);
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
        if (!vs.hasOwnProperty(l))
          e: {
            if (l[0] === "o" && l[1] === "n" && (n = l.endsWith("Capture"), t = l.slice(2, n ? l.length - 7 : void 0), u = e[lt] || null, u = u != null ? u[l] : null, typeof u == "function" && e.removeEventListener(t, u, n), typeof a == "function")) {
              typeof u != "function" && u !== null && (l in e ? e[l] = null : e.hasAttribute(l) && e.removeAttribute(l)), e.addEventListener(t, a, n);
              break e;
            }
            l in e ? e[l] = a : a === !0 ? e.setAttribute(l, "") : Fn(e, l, a);
          }
    }
  }
  function We(e, t, l) {
    switch (t) {
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
        ce("error", e), ce("load", e);
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
                  throw Error(r(137, t));
                default:
                  Te(e, t, u, c, l, null);
              }
          }
        n && Te(e, t, "srcSet", l.srcSet, l, null), a && Te(e, t, "src", l.src, l, null);
        return;
      case "input":
        ce("invalid", e);
        var o = u = c = n = null, m = null, _ = null;
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
                  _ = N;
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
                    throw Error(r(137, t));
                  break;
                default:
                  Te(e, t, a, N, l, null);
              }
          }
        js(
          e,
          u,
          o,
          m,
          _,
          c,
          n,
          !1
        );
        return;
      case "select":
        ce("invalid", e), a = c = u = null;
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
                Te(e, t, n, o, l, null);
            }
        t = u, l = c, e.multiple = !!a, t != null ? la(e, !!a, t, !1) : l != null && la(e, !!a, l, !0);
        return;
      case "textarea":
        ce("invalid", e), u = n = a = null;
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
                Te(e, t, c, o, l, null);
            }
        Ts(e, a, n, u);
        return;
      case "option":
        for (m in l)
          l.hasOwnProperty(m) && (a = l[m], a != null) && (m === "selected" ? e.selected = a && typeof a != "function" && typeof a != "symbol" : Te(e, t, m, a, l, null));
        return;
      case "dialog":
        ce("beforetoggle", e), ce("toggle", e), ce("cancel", e), ce("close", e);
        break;
      case "iframe":
      case "object":
        ce("load", e);
        break;
      case "video":
      case "audio":
        for (a = 0; a < _n.length; a++)
          ce(_n[a], e);
        break;
      case "image":
        ce("error", e), ce("load", e);
        break;
      case "details":
        ce("toggle", e);
        break;
      case "embed":
      case "source":
      case "link":
        ce("error", e), ce("load", e);
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
        for (_ in l)
          if (l.hasOwnProperty(_) && (a = l[_], a != null))
            switch (_) {
              case "children":
              case "dangerouslySetInnerHTML":
                throw Error(r(137, t));
              default:
                Te(e, t, _, a, l, null);
            }
        return;
      default:
        if (Mi(t)) {
          for (N in l)
            l.hasOwnProperty(N) && (a = l[N], a !== void 0 && gf(
              e,
              t,
              N,
              a,
              l,
              void 0
            ));
          return;
        }
    }
    for (o in l)
      l.hasOwnProperty(o) && (a = l[o], a != null && Te(e, t, o, a, l, null));
  }
  function Xy(e, t, l, a) {
    switch (t) {
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
        var n = null, u = null, c = null, o = null, m = null, _ = null, N = null;
        for (z in l) {
          var C = l[z];
          if (l.hasOwnProperty(z) && C != null)
            switch (z) {
              case "checked":
                break;
              case "value":
                break;
              case "defaultValue":
                m = C;
              default:
                a.hasOwnProperty(z) || Te(e, t, z, null, a, C);
            }
        }
        for (var x in a) {
          var z = a[x];
          if (C = l[x], a.hasOwnProperty(x) && (z != null || C != null))
            switch (x) {
              case "type":
                u = z;
                break;
              case "name":
                n = z;
                break;
              case "checked":
                _ = z;
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
                  throw Error(r(137, t));
                break;
              default:
                z !== C && Te(
                  e,
                  t,
                  x,
                  z,
                  a,
                  C
                );
            }
        }
        Ni(
          e,
          c,
          o,
          m,
          _,
          N,
          u,
          n
        );
        return;
      case "select":
        z = c = o = x = null;
        for (u in l)
          if (m = l[u], l.hasOwnProperty(u) && m != null)
            switch (u) {
              case "value":
                break;
              case "multiple":
                z = m;
              default:
                a.hasOwnProperty(u) || Te(
                  e,
                  t,
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
                x = u;
                break;
              case "defaultValue":
                o = u;
                break;
              case "multiple":
                c = u;
              default:
                u !== m && Te(
                  e,
                  t,
                  n,
                  u,
                  a,
                  m
                );
            }
        t = o, l = c, a = z, x != null ? la(e, !!l, x, !1) : !!a != !!l && (t != null ? la(e, !!l, t, !0) : la(e, !!l, l ? [] : "", !1));
        return;
      case "textarea":
        z = x = null;
        for (o in l)
          if (n = l[o], l.hasOwnProperty(o) && n != null && !a.hasOwnProperty(o))
            switch (o) {
              case "value":
                break;
              case "children":
                break;
              default:
                Te(e, t, o, null, a, n);
            }
        for (c in a)
          if (n = a[c], u = l[c], a.hasOwnProperty(c) && (n != null || u != null))
            switch (c) {
              case "value":
                x = n;
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
                n !== u && Te(e, t, c, n, a, u);
            }
        _s(e, x, z);
        return;
      case "option":
        for (var Z in l)
          x = l[Z], l.hasOwnProperty(Z) && x != null && !a.hasOwnProperty(Z) && (Z === "selected" ? e.selected = !1 : Te(
            e,
            t,
            Z,
            null,
            a,
            x
          ));
        for (m in a)
          x = a[m], z = l[m], a.hasOwnProperty(m) && x !== z && (x != null || z != null) && (m === "selected" ? e.selected = x && typeof x != "function" && typeof x != "symbol" : Te(
            e,
            t,
            m,
            x,
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
          x = l[W], l.hasOwnProperty(W) && x != null && !a.hasOwnProperty(W) && Te(e, t, W, null, a, x);
        for (_ in a)
          if (x = a[_], z = l[_], a.hasOwnProperty(_) && x !== z && (x != null || z != null))
            switch (_) {
              case "children":
              case "dangerouslySetInnerHTML":
                if (x != null)
                  throw Error(r(137, t));
                break;
              default:
                Te(
                  e,
                  t,
                  _,
                  x,
                  a,
                  z
                );
            }
        return;
      default:
        if (Mi(t)) {
          for (var xe in l)
            x = l[xe], l.hasOwnProperty(xe) && x !== void 0 && !a.hasOwnProperty(xe) && gf(
              e,
              t,
              xe,
              void 0,
              a,
              x
            );
          for (N in a)
            x = a[N], z = l[N], !a.hasOwnProperty(N) || x === z || x === void 0 && z === void 0 || gf(
              e,
              t,
              N,
              x,
              a,
              z
            );
          return;
        }
    }
    for (var S in l)
      x = l[S], l.hasOwnProperty(S) && x != null && !a.hasOwnProperty(S) && Te(e, t, S, null, a, x);
    for (C in a)
      x = a[C], z = l[C], !a.hasOwnProperty(C) || x === z || x == null && z == null || Te(e, t, C, x, a, z);
  }
  function Rd(e) {
    switch (e) {
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
  function Qy() {
    if (typeof performance.getEntriesByType == "function") {
      for (var e = 0, t = 0, l = performance.getEntriesByType("resource"), a = 0; a < l.length; a++) {
        var n = l[a], u = n.transferSize, c = n.initiatorType, o = n.duration;
        if (u && o && Rd(c)) {
          for (c = 0, o = n.responseEnd, a += 1; a < l.length; a++) {
            var m = l[a], _ = m.startTime;
            if (_ > o) break;
            var N = m.transferSize, C = m.initiatorType;
            N && Rd(C) && (m = m.responseEnd, c += N * (m < o ? 1 : (o - _) / (m - _)));
          }
          if (--a, t += 8 * (u + c) / (n.duration / 1e3), e++, 10 < e) break;
        }
      }
      if (0 < e) return t / e / 1e6;
    }
    return navigator.connection && (e = navigator.connection.downlink, typeof e == "number") ? e : 5;
  }
  var bf = null, Sf = null;
  function Ku(e) {
    return e.nodeType === 9 ? e : e.ownerDocument;
  }
  function Nd(e) {
    switch (e) {
      case "http://www.w3.org/2000/svg":
        return 1;
      case "http://www.w3.org/1998/Math/MathML":
        return 2;
      default:
        return 0;
    }
  }
  function Od(e, t) {
    if (e === 0)
      switch (t) {
        case "svg":
          return 1;
        case "math":
          return 2;
        default:
          return 0;
      }
    return e === 1 && t === "foreignObject" ? 0 : e;
  }
  function Ef(e, t) {
    return e === "textarea" || e === "noscript" || typeof t.children == "string" || typeof t.children == "number" || typeof t.children == "bigint" || typeof t.dangerouslySetInnerHTML == "object" && t.dangerouslySetInnerHTML !== null && t.dangerouslySetInnerHTML.__html != null;
  }
  var jf = null;
  function wy() {
    var e = window.event;
    return e && e.type === "popstate" ? e === jf ? !1 : (jf = e, !0) : (jf = null, !1);
  }
  var Md = typeof setTimeout == "function" ? setTimeout : void 0, Zy = typeof clearTimeout == "function" ? clearTimeout : void 0, Dd = typeof Promise == "function" ? Promise : void 0, Vy = typeof queueMicrotask == "function" ? queueMicrotask : typeof Dd != "undefined" ? function(e) {
    return Dd.resolve(null).then(e).catch(Jy);
  } : Md;
  function Jy(e) {
    setTimeout(function() {
      throw e;
    });
  }
  function xl(e) {
    return e === "head";
  }
  function Cd(e, t) {
    var l = t, a = 0;
    do {
      var n = l.nextSibling;
      if (e.removeChild(l), n && n.nodeType === 8)
        if (l = n.data, l === "/$" || l === "/&") {
          if (a === 0) {
            e.removeChild(n), Ua(t);
            return;
          }
          a--;
        } else if (l === "$" || l === "$?" || l === "$~" || l === "$!" || l === "&")
          a++;
        else if (l === "html")
          xn(e.ownerDocument.documentElement);
        else if (l === "head") {
          l = e.ownerDocument.head, xn(l);
          for (var u = l.firstChild; u; ) {
            var c = u.nextSibling, o = u.nodeName;
            u[Qa] || o === "SCRIPT" || o === "STYLE" || o === "LINK" && u.rel.toLowerCase() === "stylesheet" || l.removeChild(u), u = c;
          }
        } else
          l === "body" && xn(e.ownerDocument.body);
      l = n;
    } while (l);
    Ua(t);
  }
  function Ud(e, t) {
    var l = e;
    e = 0;
    do {
      var a = l.nextSibling;
      if (l.nodeType === 1 ? t ? (l._stashedDisplay = l.style.display, l.style.display = "none") : (l.style.display = l._stashedDisplay || "", l.getAttribute("style") === "" && l.removeAttribute("style")) : l.nodeType === 3 && (t ? (l._stashedText = l.nodeValue, l.nodeValue = "") : l.nodeValue = l._stashedText || ""), a && a.nodeType === 8)
        if (l = a.data, l === "/$") {
          if (e === 0) break;
          e--;
        } else
          l !== "$" && l !== "$?" && l !== "$~" && l !== "$!" || e++;
      l = a;
    } while (l);
  }
  function _f(e) {
    var t = e.firstChild;
    for (t && t.nodeType === 10 && (t = t.nextSibling); t; ) {
      var l = t;
      switch (t = t.nextSibling, l.nodeName) {
        case "HTML":
        case "HEAD":
        case "BODY":
          _f(l), zi(l);
          continue;
        case "SCRIPT":
        case "STYLE":
          continue;
        case "LINK":
          if (l.rel.toLowerCase() === "stylesheet") continue;
      }
      e.removeChild(l);
    }
  }
  function Ky(e, t, l, a) {
    for (; e.nodeType === 1; ) {
      var n = l;
      if (e.nodeName.toLowerCase() !== t.toLowerCase()) {
        if (!a && (e.nodeName !== "INPUT" || e.type !== "hidden"))
          break;
      } else if (a) {
        if (!e[Qa])
          switch (t) {
            case "meta":
              if (!e.hasAttribute("itemprop")) break;
              return e;
            case "link":
              if (u = e.getAttribute("rel"), u === "stylesheet" && e.hasAttribute("data-precedence"))
                break;
              if (u !== n.rel || e.getAttribute("href") !== (n.href == null || n.href === "" ? null : n.href) || e.getAttribute("crossorigin") !== (n.crossOrigin == null ? null : n.crossOrigin) || e.getAttribute("title") !== (n.title == null ? null : n.title))
                break;
              return e;
            case "style":
              if (e.hasAttribute("data-precedence")) break;
              return e;
            case "script":
              if (u = e.getAttribute("src"), (u !== (n.src == null ? null : n.src) || e.getAttribute("type") !== (n.type == null ? null : n.type) || e.getAttribute("crossorigin") !== (n.crossOrigin == null ? null : n.crossOrigin)) && u && e.hasAttribute("async") && !e.hasAttribute("itemprop"))
                break;
              return e;
            default:
              return e;
          }
      } else if (t === "input" && e.type === "hidden") {
        var u = n.name == null ? null : "" + n.name;
        if (n.type === "hidden" && e.getAttribute("name") === u)
          return e;
      } else return e;
      if (e = Rt(e.nextSibling), e === null) break;
    }
    return null;
  }
  function ky(e, t, l) {
    if (t === "") return null;
    for (; e.nodeType !== 3; )
      if ((e.nodeType !== 1 || e.nodeName !== "INPUT" || e.type !== "hidden") && !l || (e = Rt(e.nextSibling), e === null)) return null;
    return e;
  }
  function Hd(e, t) {
    for (; e.nodeType !== 8; )
      if ((e.nodeType !== 1 || e.nodeName !== "INPUT" || e.type !== "hidden") && !t || (e = Rt(e.nextSibling), e === null)) return null;
    return e;
  }
  function Tf(e) {
    return e.data === "$?" || e.data === "$~";
  }
  function xf(e) {
    return e.data === "$!" || e.data === "$?" && e.ownerDocument.readyState !== "loading";
  }
  function Fy(e, t) {
    var l = e.ownerDocument;
    if (e.data === "$~") e._reactRetry = t;
    else if (e.data !== "$?" || l.readyState !== "loading")
      t();
    else {
      var a = function() {
        t(), l.removeEventListener("DOMContentLoaded", a);
      };
      l.addEventListener("DOMContentLoaded", a), e._reactRetry = a;
    }
  }
  function Rt(e) {
    for (; e != null; e = e.nextSibling) {
      var t = e.nodeType;
      if (t === 1 || t === 3) break;
      if (t === 8) {
        if (t = e.data, t === "$" || t === "$!" || t === "$?" || t === "$~" || t === "&" || t === "F!" || t === "F")
          break;
        if (t === "/$" || t === "/&") return null;
      }
    }
    return e;
  }
  var Af = null;
  function Bd(e) {
    e = e.nextSibling;
    for (var t = 0; e; ) {
      if (e.nodeType === 8) {
        var l = e.data;
        if (l === "/$" || l === "/&") {
          if (t === 0)
            return Rt(e.nextSibling);
          t--;
        } else
          l !== "$" && l !== "$!" && l !== "$?" && l !== "$~" && l !== "&" || t++;
      }
      e = e.nextSibling;
    }
    return null;
  }
  function Ld(e) {
    e = e.previousSibling;
    for (var t = 0; e; ) {
      if (e.nodeType === 8) {
        var l = e.data;
        if (l === "$" || l === "$!" || l === "$?" || l === "$~" || l === "&") {
          if (t === 0) return e;
          t--;
        } else l !== "/$" && l !== "/&" || t++;
      }
      e = e.previousSibling;
    }
    return null;
  }
  function qd(e, t, l) {
    switch (t = Ku(l), e) {
      case "html":
        if (e = t.documentElement, !e) throw Error(r(452));
        return e;
      case "head":
        if (e = t.head, !e) throw Error(r(453));
        return e;
      case "body":
        if (e = t.body, !e) throw Error(r(454));
        return e;
      default:
        throw Error(r(451));
    }
  }
  function xn(e) {
    for (var t = e.attributes; t.length; )
      e.removeAttributeNode(t[0]);
    zi(e);
  }
  var Nt = /* @__PURE__ */ new Map(), Yd = /* @__PURE__ */ new Set();
  function ku(e) {
    return typeof e.getRootNode == "function" ? e.getRootNode() : e.nodeType === 9 ? e : e.ownerDocument;
  }
  var nl = Y.d;
  Y.d = {
    f: $y,
    r: Wy,
    D: Iy,
    C: Py,
    L: ep,
    m: tp,
    X: ap,
    S: lp,
    M: np
  };
  function $y() {
    var e = nl.f(), t = Yu();
    return e || t;
  }
  function Wy(e) {
    var t = Pl(e);
    t !== null && t.tag === 5 && t.type === "form" ? to(t) : nl.r(e);
  }
  var Ma = typeof document == "undefined" ? null : document;
  function Gd(e, t, l) {
    var a = Ma;
    if (a && typeof t == "string" && t) {
      var n = Et(t);
      n = 'link[rel="' + e + '"][href="' + n + '"]', typeof l == "string" && (n += '[crossorigin="' + l + '"]'), Yd.has(n) || (Yd.add(n), e = { rel: e, crossOrigin: l, href: t }, a.querySelector(n) === null && (t = a.createElement("link"), We(t, "link", e), Ve(t), a.head.appendChild(t)));
    }
  }
  function Iy(e) {
    nl.D(e), Gd("dns-prefetch", e, null);
  }
  function Py(e, t) {
    nl.C(e, t), Gd("preconnect", e, t);
  }
  function ep(e, t, l) {
    nl.L(e, t, l);
    var a = Ma;
    if (a && e && t) {
      var n = 'link[rel="preload"][as="' + Et(t) + '"]';
      t === "image" && l && l.imageSrcSet ? (n += '[imagesrcset="' + Et(
        l.imageSrcSet
      ) + '"]', typeof l.imageSizes == "string" && (n += '[imagesizes="' + Et(
        l.imageSizes
      ) + '"]')) : n += '[href="' + Et(e) + '"]';
      var u = n;
      switch (t) {
        case "style":
          u = Da(e);
          break;
        case "script":
          u = Ca(e);
      }
      Nt.has(u) || (e = H(
        {
          rel: "preload",
          href: t === "image" && l && l.imageSrcSet ? void 0 : e,
          as: t
        },
        l
      ), Nt.set(u, e), a.querySelector(n) !== null || t === "style" && a.querySelector(An(u)) || t === "script" && a.querySelector(zn(u)) || (t = a.createElement("link"), We(t, "link", e), Ve(t), a.head.appendChild(t)));
    }
  }
  function tp(e, t) {
    nl.m(e, t);
    var l = Ma;
    if (l && e) {
      var a = t && typeof t.as == "string" ? t.as : "script", n = 'link[rel="modulepreload"][as="' + Et(a) + '"][href="' + Et(e) + '"]', u = n;
      switch (a) {
        case "audioworklet":
        case "paintworklet":
        case "serviceworker":
        case "sharedworker":
        case "worker":
        case "script":
          u = Ca(e);
      }
      if (!Nt.has(u) && (e = H({ rel: "modulepreload", href: e }, t), Nt.set(u, e), l.querySelector(n) === null)) {
        switch (a) {
          case "audioworklet":
          case "paintworklet":
          case "serviceworker":
          case "sharedworker":
          case "worker":
          case "script":
            if (l.querySelector(zn(u)))
              return;
        }
        a = l.createElement("link"), We(a, "link", e), Ve(a), l.head.appendChild(a);
      }
    }
  }
  function lp(e, t, l) {
    nl.S(e, t, l);
    var a = Ma;
    if (a && e) {
      var n = ea(a).hoistableStyles, u = Da(e);
      t = t || "default";
      var c = n.get(u);
      if (!c) {
        var o = { loading: 0, preload: null };
        if (c = a.querySelector(
          An(u)
        ))
          o.loading = 5;
        else {
          e = H(
            { rel: "stylesheet", href: e, "data-precedence": t },
            l
          ), (l = Nt.get(u)) && zf(e, l);
          var m = c = a.createElement("link");
          Ve(m), We(m, "link", e), m._p = new Promise(function(_, N) {
            m.onload = _, m.onerror = N;
          }), m.addEventListener("load", function() {
            o.loading |= 1;
          }), m.addEventListener("error", function() {
            o.loading |= 2;
          }), o.loading |= 4, Fu(c, t, a);
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
  function ap(e, t) {
    nl.X(e, t);
    var l = Ma;
    if (l && e) {
      var a = ea(l).hoistableScripts, n = Ca(e), u = a.get(n);
      u || (u = l.querySelector(zn(n)), u || (e = H({ src: e, async: !0 }, t), (t = Nt.get(n)) && Rf(e, t), u = l.createElement("script"), Ve(u), We(u, "link", e), l.head.appendChild(u)), u = {
        type: "script",
        instance: u,
        count: 1,
        state: null
      }, a.set(n, u));
    }
  }
  function np(e, t) {
    nl.M(e, t);
    var l = Ma;
    if (l && e) {
      var a = ea(l).hoistableScripts, n = Ca(e), u = a.get(n);
      u || (u = l.querySelector(zn(n)), u || (e = H({ src: e, async: !0, type: "module" }, t), (t = Nt.get(n)) && Rf(e, t), u = l.createElement("script"), Ve(u), We(u, "link", e), l.head.appendChild(u)), u = {
        type: "script",
        instance: u,
        count: 1,
        state: null
      }, a.set(n, u));
    }
  }
  function Xd(e, t, l, a) {
    var n = (n = ue.current) ? ku(n) : null;
    if (!n) throw Error(r(446));
    switch (e) {
      case "meta":
      case "title":
        return null;
      case "style":
        return typeof l.precedence == "string" && typeof l.href == "string" ? (t = Da(l.href), l = ea(
          n
        ).hoistableStyles, a = l.get(t), a || (a = {
          type: "style",
          instance: null,
          count: 0,
          state: null
        }, l.set(t, a)), a) : { type: "void", instance: null, count: 0, state: null };
      case "link":
        if (l.rel === "stylesheet" && typeof l.href == "string" && typeof l.precedence == "string") {
          e = Da(l.href);
          var u = ea(
            n
          ).hoistableStyles, c = u.get(e);
          if (c || (n = n.ownerDocument || n, c = {
            type: "stylesheet",
            instance: null,
            count: 0,
            state: { loading: 0, preload: null }
          }, u.set(e, c), (u = n.querySelector(
            An(e)
          )) && !u._p && (c.instance = u, c.state.loading = 5), Nt.has(e) || (l = {
            rel: "preload",
            as: "style",
            href: l.href,
            crossOrigin: l.crossOrigin,
            integrity: l.integrity,
            media: l.media,
            hrefLang: l.hrefLang,
            referrerPolicy: l.referrerPolicy
          }, Nt.set(e, l), u || up(
            n,
            e,
            l,
            c.state
          ))), t && a === null)
            throw Error(r(528, ""));
          return c;
        }
        if (t && a !== null)
          throw Error(r(529, ""));
        return null;
      case "script":
        return t = l.async, l = l.src, typeof l == "string" && t && typeof t != "function" && typeof t != "symbol" ? (t = Ca(l), l = ea(
          n
        ).hoistableScripts, a = l.get(t), a || (a = {
          type: "script",
          instance: null,
          count: 0,
          state: null
        }, l.set(t, a)), a) : { type: "void", instance: null, count: 0, state: null };
      default:
        throw Error(r(444, e));
    }
  }
  function Da(e) {
    return 'href="' + Et(e) + '"';
  }
  function An(e) {
    return 'link[rel="stylesheet"][' + e + "]";
  }
  function Qd(e) {
    return H({}, e, {
      "data-precedence": e.precedence,
      precedence: null
    });
  }
  function up(e, t, l, a) {
    e.querySelector('link[rel="preload"][as="style"][' + t + "]") ? a.loading = 1 : (t = e.createElement("link"), a.preload = t, t.addEventListener("load", function() {
      return a.loading |= 1;
    }), t.addEventListener("error", function() {
      return a.loading |= 2;
    }), We(t, "link", l), Ve(t), e.head.appendChild(t));
  }
  function Ca(e) {
    return '[src="' + Et(e) + '"]';
  }
  function zn(e) {
    return "script[async]" + e;
  }
  function wd(e, t, l) {
    if (t.count++, t.instance === null)
      switch (t.type) {
        case "style":
          var a = e.querySelector(
            'style[data-href~="' + Et(l.href) + '"]'
          );
          if (a)
            return t.instance = a, Ve(a), a;
          var n = H({}, l, {
            "data-href": l.href,
            "data-precedence": l.precedence,
            href: null,
            precedence: null
          });
          return a = (e.ownerDocument || e).createElement(
            "style"
          ), Ve(a), We(a, "style", n), Fu(a, l.precedence, e), t.instance = a;
        case "stylesheet":
          n = Da(l.href);
          var u = e.querySelector(
            An(n)
          );
          if (u)
            return t.state.loading |= 4, t.instance = u, Ve(u), u;
          a = Qd(l), (n = Nt.get(n)) && zf(a, n), u = (e.ownerDocument || e).createElement("link"), Ve(u);
          var c = u;
          return c._p = new Promise(function(o, m) {
            c.onload = o, c.onerror = m;
          }), We(u, "link", a), t.state.loading |= 4, Fu(u, l.precedence, e), t.instance = u;
        case "script":
          return u = Ca(l.src), (n = e.querySelector(
            zn(u)
          )) ? (t.instance = n, Ve(n), n) : (a = l, (n = Nt.get(u)) && (a = H({}, l), Rf(a, n)), e = e.ownerDocument || e, n = e.createElement("script"), Ve(n), We(n, "link", a), e.head.appendChild(n), t.instance = n);
        case "void":
          return null;
        default:
          throw Error(r(443, t.type));
      }
    else
      t.type === "stylesheet" && (t.state.loading & 4) === 0 && (a = t.instance, t.state.loading |= 4, Fu(a, l.precedence, e));
    return t.instance;
  }
  function Fu(e, t, l) {
    for (var a = l.querySelectorAll(
      'link[rel="stylesheet"][data-precedence],style[data-precedence]'
    ), n = a.length ? a[a.length - 1] : null, u = n, c = 0; c < a.length; c++) {
      var o = a[c];
      if (o.dataset.precedence === t) u = o;
      else if (u !== n) break;
    }
    u ? u.parentNode.insertBefore(e, u.nextSibling) : (t = l.nodeType === 9 ? l.head : l, t.insertBefore(e, t.firstChild));
  }
  function zf(e, t) {
    e.crossOrigin == null && (e.crossOrigin = t.crossOrigin), e.referrerPolicy == null && (e.referrerPolicy = t.referrerPolicy), e.title == null && (e.title = t.title);
  }
  function Rf(e, t) {
    e.crossOrigin == null && (e.crossOrigin = t.crossOrigin), e.referrerPolicy == null && (e.referrerPolicy = t.referrerPolicy), e.integrity == null && (e.integrity = t.integrity);
  }
  var $u = null;
  function Zd(e, t, l) {
    if ($u === null) {
      var a = /* @__PURE__ */ new Map(), n = $u = /* @__PURE__ */ new Map();
      n.set(l, a);
    } else
      n = $u, a = n.get(l), a || (a = /* @__PURE__ */ new Map(), n.set(l, a));
    if (a.has(e)) return a;
    for (a.set(e, null), l = l.getElementsByTagName(e), n = 0; n < l.length; n++) {
      var u = l[n];
      if (!(u[Qa] || u[Ke] || e === "link" && u.getAttribute("rel") === "stylesheet") && u.namespaceURI !== "http://www.w3.org/2000/svg") {
        var c = u.getAttribute(t) || "";
        c = e + c;
        var o = a.get(c);
        o ? o.push(u) : a.set(c, [u]);
      }
    }
    return a;
  }
  function Vd(e, t, l) {
    e = e.ownerDocument || e, e.head.insertBefore(
      l,
      t === "title" ? e.querySelector("head > title") : null
    );
  }
  function ip(e, t, l) {
    if (l === 1 || t.itemProp != null) return !1;
    switch (e) {
      case "meta":
      case "title":
        return !0;
      case "style":
        if (typeof t.precedence != "string" || typeof t.href != "string" || t.href === "")
          break;
        return !0;
      case "link":
        if (typeof t.rel != "string" || typeof t.href != "string" || t.href === "" || t.onLoad || t.onError)
          break;
        return t.rel === "stylesheet" ? (e = t.disabled, typeof t.precedence == "string" && e == null) : !0;
      case "script":
        if (t.async && typeof t.async != "function" && typeof t.async != "symbol" && !t.onLoad && !t.onError && t.src && typeof t.src == "string")
          return !0;
    }
    return !1;
  }
  function Jd(e) {
    return !(e.type === "stylesheet" && (e.state.loading & 3) === 0);
  }
  function cp(e, t, l, a) {
    if (l.type === "stylesheet" && (typeof a.media != "string" || matchMedia(a.media).matches !== !1) && (l.state.loading & 4) === 0) {
      if (l.instance === null) {
        var n = Da(a.href), u = t.querySelector(
          An(n)
        );
        if (u) {
          t = u._p, t !== null && typeof t == "object" && typeof t.then == "function" && (e.count++, e = Wu.bind(e), t.then(e, e)), l.state.loading |= 4, l.instance = u, Ve(u);
          return;
        }
        u = t.ownerDocument || t, a = Qd(a), (n = Nt.get(n)) && zf(a, n), u = u.createElement("link"), Ve(u);
        var c = u;
        c._p = new Promise(function(o, m) {
          c.onload = o, c.onerror = m;
        }), We(u, "link", a), l.instance = u;
      }
      e.stylesheets === null && (e.stylesheets = /* @__PURE__ */ new Map()), e.stylesheets.set(l, t), (t = l.state.preload) && (l.state.loading & 3) === 0 && (e.count++, l = Wu.bind(e), t.addEventListener("load", l), t.addEventListener("error", l));
    }
  }
  var Nf = 0;
  function fp(e, t) {
    return e.stylesheets && e.count === 0 && Pu(e, e.stylesheets), 0 < e.count || 0 < e.imgCount ? function(l) {
      var a = setTimeout(function() {
        if (e.stylesheets && Pu(e, e.stylesheets), e.unsuspend) {
          var u = e.unsuspend;
          e.unsuspend = null, u();
        }
      }, 6e4 + t);
      0 < e.imgBytes && Nf === 0 && (Nf = 62500 * Qy());
      var n = setTimeout(
        function() {
          if (e.waitingForImages = !1, e.count === 0 && (e.stylesheets && Pu(e, e.stylesheets), e.unsuspend)) {
            var u = e.unsuspend;
            e.unsuspend = null, u();
          }
        },
        (e.imgBytes > Nf ? 50 : 800) + t
      );
      return e.unsuspend = l, function() {
        e.unsuspend = null, clearTimeout(a), clearTimeout(n);
      };
    } : null;
  }
  function Wu() {
    if (this.count--, this.count === 0 && (this.imgCount === 0 || !this.waitingForImages)) {
      if (this.stylesheets) Pu(this, this.stylesheets);
      else if (this.unsuspend) {
        var e = this.unsuspend;
        this.unsuspend = null, e();
      }
    }
  }
  var Iu = null;
  function Pu(e, t) {
    e.stylesheets = null, e.unsuspend !== null && (e.count++, Iu = /* @__PURE__ */ new Map(), t.forEach(sp, e), Iu = null, Wu.call(e));
  }
  function sp(e, t) {
    if (!(t.state.loading & 4)) {
      var l = Iu.get(e);
      if (l) var a = l.get(null);
      else {
        l = /* @__PURE__ */ new Map(), Iu.set(e, l);
        for (var n = e.querySelectorAll(
          "link[data-precedence],style[data-precedence]"
        ), u = 0; u < n.length; u++) {
          var c = n[u];
          (c.nodeName === "LINK" || c.getAttribute("media") !== "not all") && (l.set(c.dataset.precedence, c), a = c);
        }
        a && l.set(null, a);
      }
      n = t.instance, c = n.getAttribute("data-precedence"), u = l.get(c) || a, u === a && l.set(null, n), l.set(c, n), this.count++, a = Wu.bind(this), n.addEventListener("load", a), n.addEventListener("error", a), u ? u.parentNode.insertBefore(n, u.nextSibling) : (e = e.nodeType === 9 ? e.head : e, e.insertBefore(n, e.firstChild)), t.state.loading |= 4;
    }
  }
  var Rn = {
    $$typeof: ae,
    Provider: null,
    Consumer: null,
    _currentValue: me,
    _currentValue2: me,
    _threadCount: 0
  };
  function rp(e, t, l, a, n, u, c, o, m) {
    this.tag = 1, this.containerInfo = e, this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = -1, this.callbackNode = this.next = this.pendingContext = this.context = this.cancelPendingCommit = null, this.callbackPriority = 0, this.expirationTimes = _i(-1), this.entangledLanes = this.shellSuspendCounter = this.errorRecoveryDisabledLanes = this.expiredLanes = this.warmLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = _i(0), this.hiddenUpdates = _i(null), this.identifierPrefix = a, this.onUncaughtError = n, this.onCaughtError = u, this.onRecoverableError = c, this.pooledCache = null, this.pooledCacheLanes = 0, this.formState = m, this.incompleteTransitions = /* @__PURE__ */ new Map();
  }
  function Kd(e, t, l, a, n, u, c, o, m, _, N, C) {
    return e = new rp(
      e,
      t,
      l,
      c,
      m,
      _,
      N,
      C,
      o
    ), t = 1, u === !0 && (t |= 24), u = ht(3, null, null, t), e.current = u, u.stateNode = e, t = cc(), t.refCount++, e.pooledCache = t, t.refCount++, u.memoizedState = {
      element: a,
      isDehydrated: l,
      cache: t
    }, oc(u), e;
  }
  function kd(e) {
    return e ? (e = ra, e) : ra;
  }
  function Fd(e, t, l, a, n, u) {
    n = kd(n), a.context === null ? a.context = n : a.pendingContext = n, a = ml(t), a.payload = { element: l }, u = u === void 0 ? null : u, u !== null && (a.callback = u), l = yl(e, a, t), l !== null && (ft(l, e, t), un(l, e, t));
  }
  function $d(e, t) {
    if (e = e.memoizedState, e !== null && e.dehydrated !== null) {
      var l = e.retryLane;
      e.retryLane = l !== 0 && l < t ? l : t;
    }
  }
  function Of(e, t) {
    $d(e, t), (e = e.alternate) && $d(e, t);
  }
  function Wd(e) {
    if (e.tag === 13 || e.tag === 31) {
      var t = Ll(e, 67108864);
      t !== null && ft(t, e, 67108864), Of(e, 67108864);
    }
  }
  function Id(e) {
    if (e.tag === 13 || e.tag === 31) {
      var t = gt();
      t = Ti(t);
      var l = Ll(e, t);
      l !== null && ft(l, e, t), Of(e, t);
    }
  }
  var ei = !0;
  function op(e, t, l, a) {
    var n = B.T;
    B.T = null;
    var u = Y.p;
    try {
      Y.p = 2, Mf(e, t, l, a);
    } finally {
      Y.p = u, B.T = n;
    }
  }
  function dp(e, t, l, a) {
    var n = B.T;
    B.T = null;
    var u = Y.p;
    try {
      Y.p = 8, Mf(e, t, l, a);
    } finally {
      Y.p = u, B.T = n;
    }
  }
  function Mf(e, t, l, a) {
    if (ei) {
      var n = Df(a);
      if (n === null)
        vf(
          e,
          t,
          a,
          ti,
          l
        ), eh(e, a);
      else if (mp(
        n,
        e,
        t,
        l,
        a
      ))
        a.stopPropagation();
      else if (eh(e, a), t & 4 && -1 < hp.indexOf(e)) {
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
                      var m = 1 << 31 - ot(c);
                      o.entanglements[1] |= m, c &= ~m;
                    }
                    qt(u), (ve & 6) === 0 && (Lu = st() + 500, jn(0));
                  }
                }
                break;
              case 31:
              case 13:
                o = Ll(u, 2), o !== null && ft(o, u, 2), Yu(), Of(u, 2);
            }
          if (u = Df(a), u === null && vf(
            e,
            t,
            a,
            ti,
            l
          ), u === n) break;
          n = u;
        }
        n !== null && a.stopPropagation();
      } else
        vf(
          e,
          t,
          a,
          null,
          l
        );
    }
  }
  function Df(e) {
    return e = Ci(e), Cf(e);
  }
  var ti = null;
  function Cf(e) {
    if (ti = null, e = Il(e), e !== null) {
      var t = E(e);
      if (t === null) e = null;
      else {
        var l = t.tag;
        if (l === 13) {
          if (e = R(t), e !== null) return e;
          e = null;
        } else if (l === 31) {
          if (e = b(t), e !== null) return e;
          e = null;
        } else if (l === 3) {
          if (t.stateNode.current.memoizedState.isDehydrated)
            return t.tag === 3 ? t.stateNode.containerInfo : null;
          e = null;
        } else t !== e && (e = null);
      }
    }
    return ti = e, null;
  }
  function Pd(e) {
    switch (e) {
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
        switch (Ih()) {
          case is:
            return 2;
          case cs:
            return 8;
          case Zn:
          case Ph:
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
  var Uf = !1, Al = null, zl = null, Rl = null, Nn = /* @__PURE__ */ new Map(), On = /* @__PURE__ */ new Map(), Nl = [], hp = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(
    " "
  );
  function eh(e, t) {
    switch (e) {
      case "focusin":
      case "focusout":
        Al = null;
        break;
      case "dragenter":
      case "dragleave":
        zl = null;
        break;
      case "mouseover":
      case "mouseout":
        Rl = null;
        break;
      case "pointerover":
      case "pointerout":
        Nn.delete(t.pointerId);
        break;
      case "gotpointercapture":
      case "lostpointercapture":
        On.delete(t.pointerId);
    }
  }
  function Mn(e, t, l, a, n, u) {
    return e === null || e.nativeEvent !== u ? (e = {
      blockedOn: t,
      domEventName: l,
      eventSystemFlags: a,
      nativeEvent: u,
      targetContainers: [n]
    }, t !== null && (t = Pl(t), t !== null && Wd(t)), e) : (e.eventSystemFlags |= a, t = e.targetContainers, n !== null && t.indexOf(n) === -1 && t.push(n), e);
  }
  function mp(e, t, l, a, n) {
    switch (t) {
      case "focusin":
        return Al = Mn(
          Al,
          e,
          t,
          l,
          a,
          n
        ), !0;
      case "dragenter":
        return zl = Mn(
          zl,
          e,
          t,
          l,
          a,
          n
        ), !0;
      case "mouseover":
        return Rl = Mn(
          Rl,
          e,
          t,
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
            e,
            t,
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
            e,
            t,
            l,
            a,
            n
          )
        ), !0;
    }
    return !1;
  }
  function th(e) {
    var t = Il(e.target);
    if (t !== null) {
      var l = E(t);
      if (l !== null) {
        if (t = l.tag, t === 13) {
          if (t = R(l), t !== null) {
            e.blockedOn = t, ms(e.priority, function() {
              Id(l);
            });
            return;
          }
        } else if (t === 31) {
          if (t = b(l), t !== null) {
            e.blockedOn = t, ms(e.priority, function() {
              Id(l);
            });
            return;
          }
        } else if (t === 3 && l.stateNode.current.memoizedState.isDehydrated) {
          e.blockedOn = l.tag === 3 ? l.stateNode.containerInfo : null;
          return;
        }
      }
    }
    e.blockedOn = null;
  }
  function li(e) {
    if (e.blockedOn !== null) return !1;
    for (var t = e.targetContainers; 0 < t.length; ) {
      var l = Df(e.nativeEvent);
      if (l === null) {
        l = e.nativeEvent;
        var a = new l.constructor(
          l.type,
          l
        );
        Di = a, l.target.dispatchEvent(a), Di = null;
      } else
        return t = Pl(l), t !== null && Wd(t), e.blockedOn = l, !1;
      t.shift();
    }
    return !0;
  }
  function lh(e, t, l) {
    li(e) && l.delete(t);
  }
  function yp() {
    Uf = !1, Al !== null && li(Al) && (Al = null), zl !== null && li(zl) && (zl = null), Rl !== null && li(Rl) && (Rl = null), Nn.forEach(lh), On.forEach(lh);
  }
  function ai(e, t) {
    e.blockedOn === t && (e.blockedOn = null, Uf || (Uf = !0, s.unstable_scheduleCallback(
      s.unstable_NormalPriority,
      yp
    )));
  }
  var ni = null;
  function ah(e) {
    ni !== e && (ni = e, s.unstable_scheduleCallback(
      s.unstable_NormalPriority,
      function() {
        ni === e && (ni = null);
        for (var t = 0; t < e.length; t += 3) {
          var l = e[t], a = e[t + 1], n = e[t + 2];
          if (typeof a != "function") {
            if (Cf(a || l) === null)
              continue;
            break;
          }
          var u = Pl(l);
          u !== null && (e.splice(t, 3), t -= 3, Mc(
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
  function Ua(e) {
    function t(m) {
      return ai(m, e);
    }
    Al !== null && ai(Al, e), zl !== null && ai(zl, e), Rl !== null && ai(Rl, e), Nn.forEach(t), On.forEach(t);
    for (var l = 0; l < Nl.length; l++) {
      var a = Nl[l];
      a.blockedOn === e && (a.blockedOn = null);
    }
    for (; 0 < Nl.length && (l = Nl[0], l.blockedOn === null); )
      th(l), l.blockedOn === null && Nl.shift();
    if (l = (e.ownerDocument || e).$$reactFormReplay, l != null)
      for (a = 0; a < l.length; a += 3) {
        var n = l[a], u = l[a + 1], c = n[lt] || null;
        if (typeof u == "function")
          c || ah(l);
        else if (c) {
          var o = null;
          if (u && u.hasAttribute("formAction")) {
            if (n = u, c = u[lt] || null)
              o = c.formAction;
            else if (Cf(n) !== null) continue;
          } else o = c.action;
          typeof o == "function" ? l[a + 1] = o : (l.splice(a, 3), a -= 3), ah(l);
        }
      }
  }
  function nh() {
    function e(u) {
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
    function t() {
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
      return navigation.addEventListener("navigate", e), navigation.addEventListener("navigatesuccess", t), navigation.addEventListener("navigateerror", t), setTimeout(l, 100), function() {
        a = !0, navigation.removeEventListener("navigate", e), navigation.removeEventListener("navigatesuccess", t), navigation.removeEventListener("navigateerror", t), n !== null && (n(), n = null);
      };
    }
  }
  function Hf(e) {
    this._internalRoot = e;
  }
  ui.prototype.render = Hf.prototype.render = function(e) {
    var t = this._internalRoot;
    if (t === null) throw Error(r(409));
    var l = t.current, a = gt();
    Fd(l, a, e, t, null, null);
  }, ui.prototype.unmount = Hf.prototype.unmount = function() {
    var e = this._internalRoot;
    if (e !== null) {
      this._internalRoot = null;
      var t = e.containerInfo;
      Fd(e.current, 2, null, e, null, null), Yu(), t[Wl] = null;
    }
  };
  function ui(e) {
    this._internalRoot = e;
  }
  ui.prototype.unstable_scheduleHydration = function(e) {
    if (e) {
      var t = hs();
      e = { blockedOn: null, target: e, priority: t };
      for (var l = 0; l < Nl.length && t !== 0 && t < Nl[l].priority; l++) ;
      Nl.splice(l, 0, e), l === 0 && th(e);
    }
  };
  var uh = f.version;
  if (uh !== "19.2.4")
    throw Error(
      r(
        527,
        uh,
        "19.2.4"
      )
    );
  Y.findDOMNode = function(e) {
    var t = e._reactInternals;
    if (t === void 0)
      throw typeof e.render == "function" ? Error(r(188)) : (e = Object.keys(e).join(","), Error(r(268, e)));
    return e = D(t), e = e !== null ? A(e) : null, e = e === null ? null : e.stateNode, e;
  };
  var pp = {
    bundleType: 0,
    version: "19.2.4",
    rendererPackageName: "react-dom",
    currentDispatcherRef: B,
    reconcilerVersion: "19.2.4"
  };
  if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ != "undefined") {
    var ii = __REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!ii.isDisabled && ii.supportsFiber)
      try {
        Ya = ii.inject(
          pp
        ), rt = ii;
      } catch (e) {
      }
  }
  return Cn.createRoot = function(e, t) {
    if (!v(e)) throw Error(r(299));
    var l = !1, a = "", n = oo, u = ho, c = mo;
    return t != null && (t.unstable_strictMode === !0 && (l = !0), t.identifierPrefix !== void 0 && (a = t.identifierPrefix), t.onUncaughtError !== void 0 && (n = t.onUncaughtError), t.onCaughtError !== void 0 && (u = t.onCaughtError), t.onRecoverableError !== void 0 && (c = t.onRecoverableError)), t = Kd(
      e,
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
    ), e[Wl] = t.current, pf(e), new Hf(t);
  }, Cn.hydrateRoot = function(e, t, l) {
    if (!v(e)) throw Error(r(299));
    var a = !1, n = "", u = oo, c = ho, o = mo, m = null;
    return l != null && (l.unstable_strictMode === !0 && (a = !0), l.identifierPrefix !== void 0 && (n = l.identifierPrefix), l.onUncaughtError !== void 0 && (u = l.onUncaughtError), l.onCaughtError !== void 0 && (c = l.onCaughtError), l.onRecoverableError !== void 0 && (o = l.onRecoverableError), l.formState !== void 0 && (m = l.formState)), t = Kd(
      e,
      1,
      !0,
      t,
      l != null ? l : null,
      a,
      n,
      m,
      u,
      c,
      o,
      nh
    ), t.context = kd(null), l = t.current, a = gt(), a = Ti(a), n = ml(a), n.callback = null, yl(l, n, a), l = a, t.current.lanes = l, Xa(t, l), qt(t), e[Wl] = t.current, pf(e), new ui(t);
  }, Cn.version = "19.2.4", Cn;
}
var yh;
function Ap() {
  if (yh) return qf.exports;
  yh = 1;
  function i() {
    if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ == "undefined" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"))
      try {
        __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(i);
      } catch (s) {
        console.error(s);
      }
  }
  return i(), qf.exports = xp(), qf.exports;
}
var zp = Ap();
var ph = "popstate";
function vh(i) {
  return typeof i == "object" && i != null && "pathname" in i && "search" in i && "hash" in i && "state" in i && "key" in i;
}
function Rp(i = {}) {
  function s(d, r) {
    var p;
    let v = (p = r.state) == null ? void 0 : p.masked, { pathname: E, search: R, hash: b } = v || d.location;
    return Jf(
      "",
      { pathname: E, search: R, hash: b },
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
  function f(d, r) {
    return typeof r == "string" ? r : Gn(r);
  }
  return Op(
    s,
    f,
    null,
    i
  );
}
function De(i, s) {
  if (i === !1 || i === null || typeof i == "undefined")
    throw new Error(s);
}
function Ot(i, s) {
  if (!i) {
    typeof console != "undefined" && console.warn(s);
    try {
      throw new Error(s);
    } catch (f) {
    }
  }
}
function Np() {
  return Math.random().toString(36).substring(2, 10);
}
function gh(i, s) {
  return {
    usr: i.state,
    key: i.key,
    idx: s,
    masked: i.unstable_mask ? {
      pathname: i.pathname,
      search: i.search,
      hash: i.hash
    } : void 0
  };
}
function Jf(i, s, f = null, d, r) {
  return {
    pathname: typeof i == "string" ? i : i.pathname,
    search: "",
    hash: "",
    ...typeof s == "string" ? Ha(s) : s,
    state: f,
    // TODO: This could be cleaned up.  push/replace should probably just take
    // full Locations now and avoid the need to run through this flow at all
    // But that's a pretty big refactor to the current test suite so going to
    // keep as is for the time being and just let any incoming keys take precedence
    key: s && s.key || d || Np(),
    unstable_mask: r
  };
}
function Gn({
  pathname: i = "/",
  search: s = "",
  hash: f = ""
}) {
  return s && s !== "?" && (i += s.charAt(0) === "?" ? s : "?" + s), f && f !== "#" && (i += f.charAt(0) === "#" ? f : "#" + f), i;
}
function Ha(i) {
  let s = {};
  if (i) {
    let f = i.indexOf("#");
    f >= 0 && (s.hash = i.substring(f), i = i.substring(0, f));
    let d = i.indexOf("?");
    d >= 0 && (s.search = i.substring(d), i = i.substring(0, d)), i && (s.pathname = i);
  }
  return s;
}
function Op(i, s, f, d = {}) {
  let { window: r = document.defaultView, v5Compat: v = !1 } = d, E = r.history, R = "POP", b = null, p = D();
  p == null && (p = 0, E.replaceState({ ...E.state, idx: p }, ""));
  function D() {
    return (E.state || { idx: null }).idx;
  }
  function A() {
    R = "POP";
    let X = D(), G = X == null ? null : X - p;
    p = X, b && b({ action: R, location: w.location, delta: G });
  }
  function H(X, G) {
    R = "PUSH";
    let $ = vh(X) ? X : Jf(w.location, X, G);
    p = D() + 1;
    let I = gh($, p), ae = w.createHref($.unstable_mask || $);
    try {
      E.pushState(I, "", ae);
    } catch (fe) {
      if (fe instanceof DOMException && fe.name === "DataCloneError")
        throw fe;
      r.location.assign(ae);
    }
    v && b && b({ action: R, location: w.location, delta: 1 });
  }
  function K(X, G) {
    R = "REPLACE";
    let $ = vh(X) ? X : Jf(w.location, X, G);
    p = D();
    let I = gh($, p), ae = w.createHref($.unstable_mask || $);
    E.replaceState(I, "", ae), v && b && b({ action: R, location: w.location, delta: 0 });
  }
  function J(X) {
    return Mp(X);
  }
  let w = {
    get action() {
      return R;
    },
    get location() {
      return i(r, E);
    },
    listen(X) {
      if (b)
        throw new Error("A history only accepts one active listener");
      return r.addEventListener(ph, A), b = X, () => {
        r.removeEventListener(ph, A), b = null;
      };
    },
    createHref(X) {
      return s(r, X);
    },
    createURL: J,
    encodeLocation(X) {
      let G = J(X);
      return {
        pathname: G.pathname,
        search: G.search,
        hash: G.hash
      };
    },
    push: H,
    replace: K,
    go(X) {
      return E.go(X);
    }
  };
  return w;
}
function Mp(i, s = !1) {
  let f = "http://localhost";
  typeof window != "undefined" && (f = window.location.origin !== "null" ? window.location.origin : window.location.href), De(f, "No window.location.(origin|href) available to create URL");
  let d = typeof i == "string" ? i : Gn(i);
  return d = d.replace(/ $/, "%20"), !s && d.startsWith("//") && (d = f + d), new URL(d, f);
}
function zh(i, s, f = "/") {
  return Dp(i, s, f, !1);
}
function Dp(i, s, f, d) {
  let r = typeof s == "string" ? Ha(s) : s, v = ul(r.pathname || "/", f);
  if (v == null)
    return null;
  let E = Rh(i);
  Cp(E);
  let R = null;
  for (let b = 0; R == null && b < E.length; ++b) {
    let p = Zp(v);
    R = Qp(
      E[b],
      p,
      d
    );
  }
  return R;
}
function Rh(i, s = [], f = [], d = "", r = !1) {
  let v = (E, R, b = r, p) => {
    let D = {
      relativePath: p === void 0 ? E.path || "" : p,
      caseSensitive: E.caseSensitive === !0,
      childrenIndex: R,
      route: E
    };
    if (D.relativePath.startsWith("/")) {
      if (!D.relativePath.startsWith(d) && b)
        return;
      De(
        D.relativePath.startsWith(d),
        `Absolute route path "${D.relativePath}" nested under path "${d}" is not valid. An absolute child route path must start with the combined path of all its parent routes.`
      ), D.relativePath = D.relativePath.slice(d.length);
    }
    let A = Yt([d, D.relativePath]), H = f.concat(D);
    E.children && E.children.length > 0 && (De(
      // Our types know better, but runtime JS may not!
      // @ts-expect-error
      E.index !== !0,
      `Index routes must not have child routes. Please remove all child routes from route path "${A}".`
    ), Rh(
      E.children,
      s,
      H,
      A,
      b
    )), !(E.path == null && !E.index) && s.push({
      path: A,
      score: Gp(A, E.index),
      routesMeta: H
    });
  };
  return i.forEach((E, R) => {
    var b;
    if (E.path === "" || !((b = E.path) != null && b.includes("?")))
      v(E, R);
    else
      for (let p of Nh(E.path))
        v(E, R, !0, p);
  }), s;
}
function Nh(i) {
  let s = i.split("/");
  if (s.length === 0) return [];
  let [f, ...d] = s, r = f.endsWith("?"), v = f.replace(/\?$/, "");
  if (d.length === 0)
    return r ? [v, ""] : [v];
  let E = Nh(d.join("/")), R = [];
  return R.push(
    ...E.map(
      (b) => b === "" ? v : [v, b].join("/")
    )
  ), r && R.push(...E), R.map(
    (b) => i.startsWith("/") && b === "" ? "/" : b
  );
}
function Cp(i) {
  i.sort(
    (s, f) => s.score !== f.score ? f.score - s.score : Xp(
      s.routesMeta.map((d) => d.childrenIndex),
      f.routesMeta.map((d) => d.childrenIndex)
    )
  );
}
var Up = /^:[\w-]+$/, Hp = 3, Bp = 2, Lp = 1, qp = 10, Yp = -2, bh = (i) => i === "*";
function Gp(i, s) {
  let f = i.split("/"), d = f.length;
  return f.some(bh) && (d += Yp), s && (d += Bp), f.filter((r) => !bh(r)).reduce(
    (r, v) => r + (Up.test(v) ? Hp : v === "" ? Lp : qp),
    d
  );
}
function Xp(i, s) {
  return i.length === s.length && i.slice(0, -1).every((d, r) => d === s[r]) ? (
    // If two routes are siblings, we should try to match the earlier sibling
    // first. This allows people to have fine-grained control over the matching
    // behavior by simply putting routes with identical paths in the order they
    // want them tried.
    i[i.length - 1] - s[s.length - 1]
  ) : (
    // Otherwise, it doesn't really make sense to rank non-siblings by index,
    // so they sort equally.
    0
  );
}
function Qp(i, s, f = !1) {
  let { routesMeta: d } = i, r = {}, v = "/", E = [];
  for (let R = 0; R < d.length; ++R) {
    let b = d[R], p = R === d.length - 1, D = v === "/" ? s : s.slice(v.length) || "/", A = di(
      { path: b.relativePath, caseSensitive: b.caseSensitive, end: p },
      D
    ), H = b.route;
    if (!A && p && f && !d[d.length - 1].route.index && (A = di(
      {
        path: b.relativePath,
        caseSensitive: b.caseSensitive,
        end: !1
      },
      D
    )), !A)
      return null;
    Object.assign(r, A.params), E.push({
      // TODO: Can this as be avoided?
      params: r,
      pathname: Yt([v, A.pathname]),
      pathnameBase: kp(
        Yt([v, A.pathnameBase])
      ),
      route: H
    }), A.pathnameBase !== "/" && (v = Yt([v, A.pathnameBase]));
  }
  return E;
}
function di(i, s) {
  typeof i == "string" && (i = { path: i, caseSensitive: !1, end: !0 });
  let [f, d] = wp(
    i.path,
    i.caseSensitive,
    i.end
  ), r = s.match(f);
  if (!r) return null;
  let v = r[0], E = v.replace(/(.)\/+$/, "$1"), R = r.slice(1);
  return {
    params: d.reduce(
      (p, { paramName: D, isOptional: A }, H) => {
        if (D === "*") {
          let J = R[H] || "";
          E = v.slice(0, v.length - J.length).replace(/(.)\/+$/, "$1");
        }
        const K = R[H];
        return A && !K ? p[D] = void 0 : p[D] = (K || "").replace(/%2F/g, "/"), p;
      },
      {}
    ),
    pathname: v,
    pathnameBase: E,
    pattern: i
  };
}
function wp(i, s = !1, f = !0) {
  Ot(
    i === "*" || !i.endsWith("*") || i.endsWith("/*"),
    `Route path "${i}" will be treated as if it were "${i.replace(/\*$/, "/*")}" because the \`*\` character must always follow a \`/\` in the pattern. To get rid of this warning, please change the route path to "${i.replace(/\*$/, "/*")}".`
  );
  let d = [], r = "^" + i.replace(/\/*\*?$/, "").replace(/^\/*/, "/").replace(/[\\.*+^${}|()[\]]/g, "\\$&").replace(
    /\/:([\w-]+)(\?)?/g,
    (E, R, b, p, D) => {
      if (d.push({ paramName: R, isOptional: b != null }), b) {
        let A = D.charAt(p + E.length);
        return A && A !== "/" ? "/([^\\/]*)" : "(?:/([^\\/]*))?";
      }
      return "/([^\\/]+)";
    }
  ).replace(/\/([\w-]+)\?(\/|$)/g, "(/$1)?$2");
  return i.endsWith("*") ? (d.push({ paramName: "*" }), r += i === "*" || i === "/*" ? "(.*)$" : "(?:\\/(.+)|\\/*)$") : f ? r += "\\/*$" : i !== "" && i !== "/" && (r += "(?:(?=\\/|$))"), [new RegExp(r, s ? void 0 : "i"), d];
}
function Zp(i) {
  try {
    return i.split("/").map((s) => decodeURIComponent(s).replace(/\//g, "%2F")).join("/");
  } catch (s) {
    return Ot(
      !1,
      `The URL path "${i}" could not be decoded because it is a malformed URL segment. This is probably due to a bad percent encoding (${s}).`
    ), i;
  }
}
function ul(i, s) {
  if (s === "/") return i;
  if (!i.toLowerCase().startsWith(s.toLowerCase()))
    return null;
  let f = s.endsWith("/") ? s.length - 1 : s.length, d = i.charAt(f);
  return d && d !== "/" ? null : i.slice(f) || "/";
}
var Vp = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;
function Jp(i, s = "/") {
  let {
    pathname: f,
    search: d = "",
    hash: r = ""
  } = typeof i == "string" ? Ha(i) : i, v;
  return f ? (f = f.replace(/\/\/+/g, "/"), f.startsWith("/") ? v = Sh(f.substring(1), "/") : v = Sh(f, s)) : v = s, {
    pathname: v,
    search: Fp(d),
    hash: $p(r)
  };
}
function Sh(i, s) {
  let f = s.replace(/\/+$/, "").split("/");
  return i.split("/").forEach((r) => {
    r === ".." ? f.length > 1 && f.pop() : r !== "." && f.push(r);
  }), f.length > 1 ? f.join("/") : "/";
}
function Qf(i, s, f, d) {
  return `Cannot include a '${i}' character in a manually specified \`to.${s}\` field [${JSON.stringify(
    d
  )}].  Please separate it out to the \`to.${f}\` field. Alternatively you may provide the full path as a string in <Link to="..."> and the router will parse it for you.`;
}
function Kp(i) {
  return i.filter(
    (s, f) => f === 0 || s.route.path && s.route.path.length > 0
  );
}
function If(i) {
  let s = Kp(i);
  return s.map(
    (f, d) => d === s.length - 1 ? f.pathname : f.pathnameBase
  );
}
function hi(i, s, f, d = !1) {
  let r;
  typeof i == "string" ? r = Ha(i) : (r = { ...i }, De(
    !r.pathname || !r.pathname.includes("?"),
    Qf("?", "pathname", "search", r)
  ), De(
    !r.pathname || !r.pathname.includes("#"),
    Qf("#", "pathname", "hash", r)
  ), De(
    !r.search || !r.search.includes("#"),
    Qf("#", "search", "hash", r)
  ));
  let v = i === "" || r.pathname === "", E = v ? "/" : r.pathname, R;
  if (E == null)
    R = f;
  else {
    let A = s.length - 1;
    if (!d && E.startsWith("..")) {
      let H = E.split("/");
      for (; H[0] === ".."; )
        H.shift(), A -= 1;
      r.pathname = H.join("/");
    }
    R = A >= 0 ? s[A] : "/";
  }
  let b = Jp(r, R), p = E && E !== "/" && E.endsWith("/"), D = (v || E === ".") && f.endsWith("/");
  return !b.pathname.endsWith("/") && (p || D) && (b.pathname += "/"), b;
}
var Yt = (i) => i.join("/").replace(/\/\/+/g, "/"), kp = (i) => i.replace(/\/+$/, "").replace(/^\/*/, "/"), Fp = (i) => !i || i === "?" ? "" : i.startsWith("?") ? i : "?" + i, $p = (i) => !i || i === "#" ? "" : i.startsWith("#") ? i : "#" + i, Wp = class {
  constructor(i, s, f, d = !1) {
    this.status = i, this.statusText = s || "", this.internal = d, f instanceof Error ? (this.data = f.toString(), this.error = f) : this.data = f;
  }
};
function Ip(i) {
  return i != null && typeof i.status == "number" && typeof i.statusText == "string" && typeof i.internal == "boolean" && "data" in i;
}
function Pp(i) {
  return i.map((s) => s.route.path).filter(Boolean).join("/").replace(/\/\/*/g, "/") || "/";
}
var Oh = typeof window != "undefined" && typeof window.document != "undefined" && typeof window.document.createElement != "undefined";
function Mh(i, s) {
  let f = i;
  if (typeof f != "string" || !Vp.test(f))
    return {
      absoluteURL: void 0,
      isExternal: !1,
      to: f
    };
  let d = f, r = !1;
  if (Oh)
    try {
      let v = new URL(window.location.href), E = f.startsWith("//") ? new URL(v.protocol + f) : new URL(f), R = ul(E.pathname, s);
      E.origin === v.origin && R != null ? f = R + E.search + E.hash : r = !0;
    } catch (v) {
      Ot(
        !1,
        `<Link to="${f}"> contains an invalid URL which will probably break when clicked - please update to a valid URL path.`
      );
    }
  return {
    absoluteURL: d,
    isExternal: r,
    to: f
  };
}
Object.getOwnPropertyNames(Object.prototype).sort().join("\0");
var Dh = [
  "POST",
  "PUT",
  "PATCH",
  "DELETE"
];
new Set(
  Dh
);
var ev = [
  "GET",
  ...Dh
];
new Set(ev);
var Ba = T.createContext(null);
Ba.displayName = "DataRouter";
var mi = T.createContext(null);
mi.displayName = "DataRouterState";
var tv = T.createContext(!1), Ch = T.createContext({
  isTransitioning: !1
});
Ch.displayName = "ViewTransition";
var lv = T.createContext(
  /* @__PURE__ */ new Map()
);
lv.displayName = "Fetchers";
var av = T.createContext(null);
av.displayName = "Await";
var bt = T.createContext(
  null
);
bt.displayName = "Navigation";
var Xn = T.createContext(
  null
);
Xn.displayName = "Location";
var Ut = T.createContext({
  outlet: null,
  matches: [],
  isDataRoute: !1
});
Ut.displayName = "Route";
var Pf = T.createContext(null);
Pf.displayName = "RouteError";
var Uh = "REACT_ROUTER_ERROR", nv = "REDIRECT", uv = "ROUTE_ERROR_RESPONSE";
function iv(i) {
  if (i.startsWith(`${Uh}:${nv}:{`))
    try {
      let s = JSON.parse(i.slice(28));
      if (typeof s == "object" && s && typeof s.status == "number" && typeof s.statusText == "string" && typeof s.location == "string" && typeof s.reloadDocument == "boolean" && typeof s.replace == "boolean")
        return s;
    } catch (s) {
    }
}
function cv(i) {
  if (i.startsWith(
    `${Uh}:${uv}:{`
  ))
    try {
      let s = JSON.parse(i.slice(40));
      if (typeof s == "object" && s && typeof s.status == "number" && typeof s.statusText == "string")
        return new Wp(
          s.status,
          s.statusText,
          s.data
        );
    } catch (s) {
    }
}
function fv(i, { relative: s } = {}) {
  De(
    La(),
    // TODO: This error is probably because they somehow have 2 versions of the
    // router loaded. We can help them understand how to avoid that.
    "useHref() may be used only in the context of a <Router> component."
  );
  let { basename: f, navigator: d } = T.useContext(bt), { hash: r, pathname: v, search: E } = Qn(i, { relative: s }), R = v;
  return f !== "/" && (R = v === "/" ? f : Yt([f, v])), d.createHref({ pathname: R, search: E, hash: r });
}
function La() {
  return T.useContext(Xn) != null;
}
function Gt() {
  return De(
    La(),
    // TODO: This error is probably because they somehow have 2 versions of the
    // router loaded. We can help them understand how to avoid that.
    "useLocation() may be used only in the context of a <Router> component."
  ), T.useContext(Xn).location;
}
var Hh = "You should call navigate() in a React.useEffect(), not when your component is first rendered.";
function Bh(i) {
  T.useContext(bt).static || T.useLayoutEffect(i);
}
function yi() {
  let { isDataRoute: i } = T.useContext(Ut);
  return i ? jv() : sv();
}
function sv() {
  De(
    La(),
    // TODO: This error is probably because they somehow have 2 versions of the
    // router loaded. We can help them understand how to avoid that.
    "useNavigate() may be used only in the context of a <Router> component."
  );
  let i = T.useContext(Ba), { basename: s, navigator: f } = T.useContext(bt), { matches: d } = T.useContext(Ut), { pathname: r } = Gt(), v = JSON.stringify(If(d)), E = T.useRef(!1);
  return Bh(() => {
    E.current = !0;
  }), T.useCallback(
    (b, p = {}) => {
      if (Ot(E.current, Hh), !E.current) return;
      if (typeof b == "number") {
        f.go(b);
        return;
      }
      let D = hi(
        b,
        JSON.parse(v),
        r,
        p.relative === "path"
      );
      i == null && s !== "/" && (D.pathname = D.pathname === "/" ? s : Yt([s, D.pathname])), (p.replace ? f.replace : f.push)(
        D,
        p.state,
        p
      );
    },
    [
      s,
      f,
      v,
      r,
      i
    ]
  );
}
T.createContext(null);
function rv() {
  let { matches: i } = T.useContext(Ut), s = i[i.length - 1];
  return s ? s.params : {};
}
function Qn(i, { relative: s } = {}) {
  let { matches: f } = T.useContext(Ut), { pathname: d } = Gt(), r = JSON.stringify(If(f));
  return T.useMemo(
    () => hi(
      i,
      JSON.parse(r),
      d,
      s === "path"
    ),
    [i, r, d, s]
  );
}
function ov(i, s) {
  return Lh(i, s);
}
function Lh(i, s, f) {
  var X;
  De(
    La(),
    // TODO: This error is probably because they somehow have 2 versions of the
    // router loaded. We can help them understand how to avoid that.
    "useRoutes() may be used only in the context of a <Router> component."
  );
  let { navigator: d } = T.useContext(bt), { matches: r } = T.useContext(Ut), v = r[r.length - 1], E = v ? v.params : {}, R = v ? v.pathname : "/", b = v ? v.pathnameBase : "/", p = v && v.route;
  {
    let G = p && p.path || "";
    Yh(
      R,
      !p || G.endsWith("*") || G.endsWith("*?"),
      `You rendered descendant <Routes> (or called \`useRoutes()\`) at "${R}" (under <Route path="${G}">) but the parent route path has no trailing "*". This means if you navigate deeper, the parent won't match anymore and therefore the child routes will never render.

Please change the parent <Route path="${G}"> to <Route path="${G === "/" ? "*" : `${G}/*`}">.`
    );
  }
  let D = Gt(), A;
  if (s) {
    let G = typeof s == "string" ? Ha(s) : s;
    De(
      b === "/" || ((X = G.pathname) == null ? void 0 : X.startsWith(b)),
      `When overriding the location using \`<Routes location>\` or \`useRoutes(routes, location)\`, the location pathname must begin with the portion of the URL pathname that was matched by all parent routes. The current pathname base is "${b}" but pathname "${G.pathname}" was given in the \`location\` prop.`
    ), A = G;
  } else
    A = D;
  let H = A.pathname || "/", K = H;
  if (b !== "/") {
    let G = b.replace(/^\//, "").split("/");
    K = "/" + H.replace(/^\//, "").split("/").slice(G.length).join("/");
  }
  let J = zh(i, { pathname: K });
  Ot(
    p || J != null,
    `No routes matched location "${A.pathname}${A.search}${A.hash}" `
  ), Ot(
    J == null || J[J.length - 1].route.element !== void 0 || J[J.length - 1].route.Component !== void 0 || J[J.length - 1].route.lazy !== void 0,
    `Matched leaf route at location "${A.pathname}${A.search}${A.hash}" does not have an element or Component. This means it will render an <Outlet /> with a null value by default resulting in an "empty" page.`
  );
  let w = pv(
    J && J.map(
      (G) => Object.assign({}, G, {
        params: Object.assign({}, E, G.params),
        pathname: Yt([
          b,
          // Re-encode pathnames that were decoded inside matchRoutes.
          // Pre-encode `%`, `?` and `#` ahead of `encodeLocation` because it uses
          // `new URL()` internally and we need to prevent it from treating
          // them as separators
          d.encodeLocation ? d.encodeLocation(
            G.pathname.replace(/%/g, "%25").replace(/\?/g, "%3F").replace(/#/g, "%23")
          ).pathname : G.pathname
        ]),
        pathnameBase: G.pathnameBase === "/" ? b : Yt([
          b,
          // Re-encode pathnames that were decoded inside matchRoutes
          // Pre-encode `%`, `?` and `#` ahead of `encodeLocation` because it uses
          // `new URL()` internally and we need to prevent it from treating
          // them as separators
          d.encodeLocation ? d.encodeLocation(
            G.pathnameBase.replace(/%/g, "%25").replace(/\?/g, "%3F").replace(/#/g, "%23")
          ).pathname : G.pathnameBase
        ])
      })
    ),
    r,
    f
  );
  return s && w ? /* @__PURE__ */ T.createElement(
    Xn.Provider,
    {
      value: {
        location: {
          pathname: "/",
          search: "",
          hash: "",
          state: null,
          key: "default",
          unstable_mask: void 0,
          ...A
        },
        navigationType: "POP"
        /* Pop */
      }
    },
    w
  ) : w;
}
function dv() {
  let i = Ev(), s = Ip(i) ? `${i.status} ${i.statusText}` : i instanceof Error ? i.message : JSON.stringify(i), f = i instanceof Error ? i.stack : null, d = "rgba(200,200,200, 0.5)", r = { padding: "0.5rem", backgroundColor: d }, v = { padding: "2px 4px", backgroundColor: d }, E = null;
  return console.error(
    "Error handled by React Router default ErrorBoundary:",
    i
  ), E = /* @__PURE__ */ T.createElement(T.Fragment, null, /* @__PURE__ */ T.createElement("p", null, "💿 Hey developer 👋"), /* @__PURE__ */ T.createElement("p", null, "You can provide a way better UX than this when your app throws errors by providing your own ", /* @__PURE__ */ T.createElement("code", { style: v }, "ErrorBoundary"), " or", " ", /* @__PURE__ */ T.createElement("code", { style: v }, "errorElement"), " prop on your route.")), /* @__PURE__ */ T.createElement(T.Fragment, null, /* @__PURE__ */ T.createElement("h2", null, "Unexpected Application Error!"), /* @__PURE__ */ T.createElement("h3", { style: { fontStyle: "italic" } }, s), f ? /* @__PURE__ */ T.createElement("pre", { style: r }, f) : null, E);
}
var hv = /* @__PURE__ */ T.createElement(dv, null), qh = class extends T.Component {
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
  static getDerivedStateFromProps(i, s) {
    return s.location !== i.location || s.revalidation !== "idle" && i.revalidation === "idle" ? {
      error: i.error,
      location: i.location,
      revalidation: i.revalidation
    } : {
      error: i.error !== void 0 ? i.error : s.error,
      location: s.location,
      revalidation: i.revalidation || s.revalidation
    };
  }
  componentDidCatch(i, s) {
    this.props.onError ? this.props.onError(i, s) : console.error(
      "React Router caught the following error during render",
      i
    );
  }
  render() {
    let i = this.state.error;
    if (this.context && typeof i == "object" && i && "digest" in i && typeof i.digest == "string") {
      const f = cv(i.digest);
      f && (i = f);
    }
    let s = i !== void 0 ? /* @__PURE__ */ T.createElement(Ut.Provider, { value: this.props.routeContext }, /* @__PURE__ */ T.createElement(
      Pf.Provider,
      {
        value: i,
        children: this.props.component
      }
    )) : this.props.children;
    return this.context ? /* @__PURE__ */ T.createElement(mv, { error: i }, s) : s;
  }
};
qh.contextType = tv;
var wf = /* @__PURE__ */ new WeakMap();
function mv({
  children: i,
  error: s
}) {
  let { basename: f } = T.useContext(bt);
  if (typeof s == "object" && s && "digest" in s && typeof s.digest == "string") {
    let d = iv(s.digest);
    if (d) {
      let r = wf.get(s);
      if (r) throw r;
      let v = Mh(d.location, f);
      if (Oh && !wf.get(s))
        if (v.isExternal || d.reloadDocument)
          window.location.href = v.absoluteURL || v.to;
        else {
          const E = Promise.resolve().then(
            () => window.__reactRouterDataRouter.navigate(v.to, {
              replace: d.replace
            })
          );
          throw wf.set(s, E), E;
        }
      return /* @__PURE__ */ T.createElement(
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
function yv({ routeContext: i, match: s, children: f }) {
  let d = T.useContext(Ba);
  return d && d.static && d.staticContext && (s.route.errorElement || s.route.ErrorBoundary) && (d.staticContext._deepestRenderedBoundaryId = s.route.id), /* @__PURE__ */ T.createElement(Ut.Provider, { value: i }, f);
}
function pv(i, s = [], f) {
  let d = f == null ? void 0 : f.state;
  if (i == null) {
    if (!d)
      return null;
    if (d.errors)
      i = d.matches;
    else if (s.length === 0 && !d.initialized && d.matches.length > 0)
      i = d.matches;
    else
      return null;
  }
  let r = i, v = d == null ? void 0 : d.errors;
  if (v != null) {
    let D = r.findIndex(
      (A) => A.route.id && (v == null ? void 0 : v[A.route.id]) !== void 0
    );
    De(
      D >= 0,
      `Could not find a matching route for errors on route IDs: ${Object.keys(
        v
      ).join(",")}`
    ), r = r.slice(
      0,
      Math.min(r.length, D + 1)
    );
  }
  let E = !1, R = -1;
  if (f && d) {
    E = d.renderFallback;
    for (let D = 0; D < r.length; D++) {
      let A = r[D];
      if ((A.route.HydrateFallback || A.route.hydrateFallbackElement) && (R = D), A.route.id) {
        let { loaderData: H, errors: K } = d, J = A.route.loader && !H.hasOwnProperty(A.route.id) && (!K || K[A.route.id] === void 0);
        if (A.route.lazy || J) {
          f.isStatic && (E = !0), R >= 0 ? r = r.slice(0, R + 1) : r = [r[0]];
          break;
        }
      }
    }
  }
  let b = f == null ? void 0 : f.onError, p = d && b ? (D, A) => {
    var H, K, J;
    b(D, {
      location: d.location,
      params: (J = (K = (H = d.matches) == null ? void 0 : H[0]) == null ? void 0 : K.params) != null ? J : {},
      unstable_pattern: Pp(d.matches),
      errorInfo: A
    });
  } : void 0;
  return r.reduceRight(
    (D, A, H) => {
      let K, J = !1, w = null, X = null;
      d && (K = v && A.route.id ? v[A.route.id] : void 0, w = A.route.errorElement || hv, E && (R < 0 && H === 0 ? (Yh(
        "route-fallback",
        !1,
        "No `HydrateFallback` element provided to render during initial hydration"
      ), J = !0, X = null) : R === H && (J = !0, X = A.route.hydrateFallbackElement || null)));
      let G = s.concat(r.slice(0, H + 1)), $ = () => {
        let I;
        return K ? I = w : J ? I = X : A.route.Component ? I = /* @__PURE__ */ T.createElement(A.route.Component, null) : A.route.element ? I = A.route.element : I = D, /* @__PURE__ */ T.createElement(
          yv,
          {
            match: A,
            routeContext: {
              outlet: D,
              matches: G,
              isDataRoute: d != null
            },
            children: I
          }
        );
      };
      return d && (A.route.ErrorBoundary || A.route.errorElement || H === 0) ? /* @__PURE__ */ T.createElement(
        qh,
        {
          location: d.location,
          revalidation: d.revalidation,
          component: w,
          error: K,
          children: $(),
          routeContext: { outlet: null, matches: G, isDataRoute: !0 },
          onError: p
        }
      ) : $();
    },
    null
  );
}
function es(i) {
  return `${i} must be used within a data router.  See https://reactrouter.com/en/main/routers/picking-a-router.`;
}
function vv(i) {
  let s = T.useContext(Ba);
  return De(s, es(i)), s;
}
function gv(i) {
  let s = T.useContext(mi);
  return De(s, es(i)), s;
}
function bv(i) {
  let s = T.useContext(Ut);
  return De(s, es(i)), s;
}
function ts(i) {
  let s = bv(i), f = s.matches[s.matches.length - 1];
  return De(
    f.route.id,
    `${i} can only be used on routes that contain a unique "id"`
  ), f.route.id;
}
function Sv() {
  return ts(
    "useRouteId"
    /* UseRouteId */
  );
}
function Ev() {
  var d;
  let i = T.useContext(Pf), s = gv(
    "useRouteError"
    /* UseRouteError */
  ), f = ts(
    "useRouteError"
    /* UseRouteError */
  );
  return i !== void 0 ? i : (d = s.errors) == null ? void 0 : d[f];
}
function jv() {
  let { router: i } = vv(
    "useNavigate"
    /* UseNavigateStable */
  ), s = ts(
    "useNavigate"
    /* UseNavigateStable */
  ), f = T.useRef(!1);
  return Bh(() => {
    f.current = !0;
  }), T.useCallback(
    async (r, v = {}) => {
      Ot(f.current, Hh), f.current && (typeof r == "number" ? await i.navigate(r) : await i.navigate(r, { fromRouteId: s, ...v }));
    },
    [i, s]
  );
}
var Eh = {};
function Yh(i, s, f) {
  !s && !Eh[i] && (Eh[i] = !0, Ot(!1, f));
}
T.memo(_v);
function _v({
  routes: i,
  future: s,
  state: f,
  isStatic: d,
  onError: r
}) {
  return Lh(i, void 0, { state: f, isStatic: d, onError: r });
}
function Tv({
  to: i,
  replace: s,
  state: f,
  relative: d
}) {
  De(
    La(),
    // TODO: This error is probably because they somehow have 2 versions of
    // the router loaded. We can help them understand how to avoid that.
    "<Navigate> may be used only in the context of a <Router> component."
  );
  let { static: r } = T.useContext(bt);
  Ot(
    !r,
    "<Navigate> must not be used on the initial render in a <StaticRouter>. This is a no-op, but you should modify your code so the <Navigate> is only ever rendered in response to some user interaction or state change."
  );
  let { matches: v } = T.useContext(Ut), { pathname: E } = Gt(), R = yi(), b = hi(
    i,
    If(v),
    E,
    d === "path"
  ), p = JSON.stringify(b);
  return T.useEffect(() => {
    R(JSON.parse(p), { replace: s, state: f, relative: d });
  }, [R, p, d, s, f]), null;
}
function fi(i) {
  De(
    !1,
    "A <Route> is only ever to be used as the child of <Routes> element, never rendered directly. Please wrap your <Route> in a <Routes>."
  );
}
function xv({
  basename: i = "/",
  children: s = null,
  location: f,
  navigationType: d = "POP",
  navigator: r,
  static: v = !1,
  unstable_useTransitions: E
}) {
  De(
    !La(),
    "You cannot render a <Router> inside another <Router>. You should never have more than one in your app."
  );
  let R = i.replace(/^\/*/, "/"), b = T.useMemo(
    () => ({
      basename: R,
      navigator: r,
      static: v,
      unstable_useTransitions: E,
      future: {}
    }),
    [R, r, v, E]
  );
  typeof f == "string" && (f = Ha(f));
  let {
    pathname: p = "/",
    search: D = "",
    hash: A = "",
    state: H = null,
    key: K = "default",
    unstable_mask: J
  } = f, w = T.useMemo(() => {
    let X = ul(p, R);
    return X == null ? null : {
      location: {
        pathname: X,
        search: D,
        hash: A,
        state: H,
        key: K,
        unstable_mask: J
      },
      navigationType: d
    };
  }, [
    R,
    p,
    D,
    A,
    H,
    K,
    d,
    J
  ]);
  return Ot(
    w != null,
    `<Router basename="${R}"> is not able to match the URL "${p}${D}${A}" because it does not start with the basename, so the <Router> won't render anything.`
  ), w == null ? null : /* @__PURE__ */ T.createElement(bt.Provider, { value: b }, /* @__PURE__ */ T.createElement(Xn.Provider, { children: s, value: w }));
}
function Av({
  children: i,
  location: s
}) {
  return ov(Kf(i), s);
}
function Kf(i, s = []) {
  let f = [];
  return T.Children.forEach(i, (d, r) => {
    if (!T.isValidElement(d))
      return;
    let v = [...s, r];
    if (d.type === T.Fragment) {
      f.push.apply(
        f,
        Kf(d.props.children, v)
      );
      return;
    }
    De(
      d.type === fi,
      `[${typeof d.type == "string" ? d.type : d.type.name}] is not a <Route> component. All component children of <Routes> must be a <Route> or <React.Fragment>`
    ), De(
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
    )), f.push(E);
  }), f;
}
var si = "get", ri = "application/x-www-form-urlencoded";
function pi(i) {
  return typeof HTMLElement != "undefined" && i instanceof HTMLElement;
}
function zv(i) {
  return pi(i) && i.tagName.toLowerCase() === "button";
}
function Rv(i) {
  return pi(i) && i.tagName.toLowerCase() === "form";
}
function Nv(i) {
  return pi(i) && i.tagName.toLowerCase() === "input";
}
function Ov(i) {
  return !!(i.metaKey || i.altKey || i.ctrlKey || i.shiftKey);
}
function Mv(i, s) {
  return i.button === 0 && // Ignore everything but left clicks
  (!s || s === "_self") && // Let browser handle "target=_blank" etc.
  !Ov(i);
}
function kf(i = "") {
  return new URLSearchParams(
    typeof i == "string" || Array.isArray(i) || i instanceof URLSearchParams ? i : Object.keys(i).reduce((s, f) => {
      let d = i[f];
      return s.concat(
        Array.isArray(d) ? d.map((r) => [f, r]) : [[f, d]]
      );
    }, [])
  );
}
function Dv(i, s) {
  let f = kf(i);
  return s && s.forEach((d, r) => {
    f.has(r) || s.getAll(r).forEach((v) => {
      f.append(r, v);
    });
  }), f;
}
var ci = null;
function Cv() {
  if (ci === null)
    try {
      new FormData(
        document.createElement("form"),
        // @ts-expect-error if FormData supports the submitter parameter, this will throw
        0
      ), ci = !1;
    } catch (i) {
      ci = !0;
    }
  return ci;
}
var Uv = /* @__PURE__ */ new Set([
  "application/x-www-form-urlencoded",
  "multipart/form-data",
  "text/plain"
]);
function Zf(i) {
  return i != null && !Uv.has(i) ? (Ot(
    !1,
    `"${i}" is not a valid \`encType\` for \`<Form>\`/\`<fetcher.Form>\` and will default to "${ri}"`
  ), null) : i;
}
function Hv(i, s) {
  let f, d, r, v, E;
  if (Rv(i)) {
    let R = i.getAttribute("action");
    d = R ? ul(R, s) : null, f = i.getAttribute("method") || si, r = Zf(i.getAttribute("enctype")) || ri, v = new FormData(i);
  } else if (zv(i) || Nv(i) && (i.type === "submit" || i.type === "image")) {
    let R = i.form;
    if (R == null)
      throw new Error(
        'Cannot submit a <button> or <input type="submit"> without a <form>'
      );
    let b = i.getAttribute("formaction") || R.getAttribute("action");
    if (d = b ? ul(b, s) : null, f = i.getAttribute("formmethod") || R.getAttribute("method") || si, r = Zf(i.getAttribute("formenctype")) || Zf(R.getAttribute("enctype")) || ri, v = new FormData(R, i), !Cv()) {
      let { name: p, type: D, value: A } = i;
      if (D === "image") {
        let H = p ? `${p}.` : "";
        v.append(`${H}x`, "0"), v.append(`${H}y`, "0");
      } else p && v.append(p, A);
    }
  } else {
    if (pi(i))
      throw new Error(
        'Cannot submit element that is not <form>, <button>, or <input type="submit|image">'
      );
    f = si, d = null, r = ri, E = i;
  }
  return v && r === "text/plain" && (E = v, v = void 0), { action: d, method: f.toLowerCase(), encType: r, formData: v, body: E };
}
Object.getOwnPropertyNames(Object.prototype).sort().join("\0");
function ls(i, s) {
  if (i === !1 || i === null || typeof i == "undefined")
    throw new Error(s);
}
function Bv(i, s, f, d) {
  let r = typeof i == "string" ? new URL(
    i,
    // This can be called during the SSR flow via PrefetchPageLinksImpl so
    // don't assume window is available
    typeof window == "undefined" ? "server://singlefetch/" : window.location.origin
  ) : i;
  return f ? r.pathname.endsWith("/") ? r.pathname = `${r.pathname}_.${d}` : r.pathname = `${r.pathname}.${d}` : r.pathname === "/" ? r.pathname = `_root.${d}` : s && ul(r.pathname, s) === "/" ? r.pathname = `${s.replace(/\/$/, "")}/_root.${d}` : r.pathname = `${r.pathname.replace(/\/$/, "")}.${d}`, r;
}
async function Lv(i, s) {
  if (i.id in s)
    return s[i.id];
  try {
    let f = await import(
      /* @vite-ignore */
      /* webpackIgnore: true */
      i.module
    );
    return s[i.id] = f, f;
  } catch (f) {
    return console.error(
      `Error loading route module \`${i.module}\`, reloading page...`
    ), console.error(f), window.__reactRouterContext && window.__reactRouterContext.isSpaMode, window.location.reload(), new Promise(() => {
    });
  }
}
function qv(i) {
  return i == null ? !1 : i.href == null ? i.rel === "preload" && typeof i.imageSrcSet == "string" && typeof i.imageSizes == "string" : typeof i.rel == "string" && typeof i.href == "string";
}
async function Yv(i, s, f) {
  let d = await Promise.all(
    i.map(async (r) => {
      let v = s.routes[r.route.id];
      if (v) {
        let E = await Lv(v, f);
        return E.links ? E.links() : [];
      }
      return [];
    })
  );
  return wv(
    d.flat(1).filter(qv).filter((r) => r.rel === "stylesheet" || r.rel === "preload").map(
      (r) => r.rel === "stylesheet" ? { ...r, rel: "prefetch", as: "style" } : { ...r, rel: "prefetch" }
    )
  );
}
function jh(i, s, f, d, r, v) {
  let E = (b, p) => f[p] ? b.route.id !== f[p].route.id : !0, R = (b, p) => {
    var D;
    return (
      // param change, /users/123 -> /users/456
      f[p].pathname !== b.pathname || // splat param changed, which is not present in match.path
      // e.g. /files/images/avatar.jpg -> files/finances.xls
      ((D = f[p].route.path) == null ? void 0 : D.endsWith("*")) && f[p].params["*"] !== b.params["*"]
    );
  };
  return v === "assets" ? s.filter(
    (b, p) => E(b, p) || R(b, p)
  ) : v === "data" ? s.filter((b, p) => {
    var A;
    let D = d.routes[b.route.id];
    if (!D || !D.hasLoader)
      return !1;
    if (E(b, p) || R(b, p))
      return !0;
    if (b.route.shouldRevalidate) {
      let H = b.route.shouldRevalidate({
        currentUrl: new URL(
          r.pathname + r.search + r.hash,
          window.origin
        ),
        currentParams: ((A = f[0]) == null ? void 0 : A.params) || {},
        nextUrl: new URL(i, window.origin),
        nextParams: b.params,
        defaultShouldRevalidate: !0
      });
      if (typeof H == "boolean")
        return H;
    }
    return !0;
  }) : [];
}
function Gv(i, s, { includeHydrateFallback: f } = {}) {
  return Xv(
    i.map((d) => {
      let r = s.routes[d.route.id];
      if (!r) return [];
      let v = [r.module];
      return r.clientActionModule && (v = v.concat(r.clientActionModule)), r.clientLoaderModule && (v = v.concat(r.clientLoaderModule)), f && r.hydrateFallbackModule && (v = v.concat(r.hydrateFallbackModule)), r.imports && (v = v.concat(r.imports)), v;
    }).flat(1)
  );
}
function Xv(i) {
  return [...new Set(i)];
}
function Qv(i) {
  let s = {}, f = Object.keys(i).sort();
  for (let d of f)
    s[d] = i[d];
  return s;
}
function wv(i, s) {
  let f = /* @__PURE__ */ new Set();
  return new Set(s), i.reduce((d, r) => {
    let v = JSON.stringify(Qv(r));
    return f.has(v) || (f.add(v), d.push({ key: v, link: r })), d;
  }, []);
}
function Gh() {
  let i = T.useContext(Ba);
  return ls(
    i,
    "You must render this element inside a <DataRouterContext.Provider> element"
  ), i;
}
function Zv() {
  let i = T.useContext(mi);
  return ls(
    i,
    "You must render this element inside a <DataRouterStateContext.Provider> element"
  ), i;
}
var as = T.createContext(void 0);
as.displayName = "FrameworkContext";
function Xh() {
  let i = T.useContext(as);
  return ls(
    i,
    "You must render this element inside a <HydratedRouter> element"
  ), i;
}
function Vv(i, s) {
  let f = T.useContext(as), [d, r] = T.useState(!1), [v, E] = T.useState(!1), { onFocus: R, onBlur: b, onMouseEnter: p, onMouseLeave: D, onTouchStart: A } = s, H = T.useRef(null);
  T.useEffect(() => {
    if (i === "render" && E(!0), i === "viewport") {
      let w = (G) => {
        G.forEach(($) => {
          E($.isIntersecting);
        });
      }, X = new IntersectionObserver(w, { threshold: 0.5 });
      return H.current && X.observe(H.current), () => {
        X.disconnect();
      };
    }
  }, [i]), T.useEffect(() => {
    if (d) {
      let w = setTimeout(() => {
        E(!0);
      }, 100);
      return () => {
        clearTimeout(w);
      };
    }
  }, [d]);
  let K = () => {
    r(!0);
  }, J = () => {
    r(!1), E(!1);
  };
  return f ? i !== "intent" ? [v, H, {}] : [
    v,
    H,
    {
      onFocus: Un(R, K),
      onBlur: Un(b, J),
      onMouseEnter: Un(p, K),
      onMouseLeave: Un(D, J),
      onTouchStart: Un(A, K)
    }
  ] : [!1, H, {}];
}
function Un(i, s) {
  return (f) => {
    i && i(f), f.defaultPrevented || s(f);
  };
}
function Jv({ page: i, ...s }) {
  let { router: f } = Gh(), d = T.useMemo(
    () => zh(f.routes, i, f.basename),
    [f.routes, i, f.basename]
  );
  return d ? /* @__PURE__ */ T.createElement(kv, { page: i, matches: d, ...s }) : null;
}
function Kv(i) {
  let { manifest: s, routeModules: f } = Xh(), [d, r] = T.useState([]);
  return T.useEffect(() => {
    let v = !1;
    return Yv(i, s, f).then(
      (E) => {
        v || r(E);
      }
    ), () => {
      v = !0;
    };
  }, [i, s, f]), d;
}
function kv({
  page: i,
  matches: s,
  ...f
}) {
  let d = Gt(), { future: r, manifest: v, routeModules: E } = Xh(), { basename: R } = Gh(), { loaderData: b, matches: p } = Zv(), D = T.useMemo(
    () => jh(
      i,
      s,
      p,
      v,
      d,
      "data"
    ),
    [i, s, p, v, d]
  ), A = T.useMemo(
    () => jh(
      i,
      s,
      p,
      v,
      d,
      "assets"
    ),
    [i, s, p, v, d]
  ), H = T.useMemo(() => {
    if (i === d.pathname + d.search + d.hash)
      return [];
    let w = /* @__PURE__ */ new Set(), X = !1;
    if (s.forEach(($) => {
      var ae;
      let I = v.routes[$.route.id];
      !I || !I.hasLoader || (!D.some((fe) => fe.route.id === $.route.id) && $.route.id in b && ((ae = E[$.route.id]) != null && ae.shouldRevalidate) || I.hasClientLoader ? X = !0 : w.add($.route.id));
    }), w.size === 0)
      return [];
    let G = Bv(
      i,
      R,
      r.unstable_trailingSlashAwareDataRequests,
      "data"
    );
    return X && w.size > 0 && G.searchParams.set(
      "_routes",
      s.filter(($) => w.has($.route.id)).map(($) => $.route.id).join(",")
    ), [G.pathname + G.search];
  }, [
    R,
    r.unstable_trailingSlashAwareDataRequests,
    b,
    d,
    v,
    D,
    s,
    i,
    E
  ]), K = T.useMemo(
    () => Gv(A, v),
    [A, v]
  ), J = Kv(A);
  return /* @__PURE__ */ T.createElement(T.Fragment, null, H.map((w) => /* @__PURE__ */ T.createElement("link", { key: w, rel: "prefetch", as: "fetch", href: w, ...f })), K.map((w) => /* @__PURE__ */ T.createElement("link", { key: w, rel: "modulepreload", href: w, ...f })), J.map(({ key: w, link: X }) => {
    var G;
    return (
      // these don't spread `linkProps` because they are full link descriptors
      // already with their own props
      /* @__PURE__ */ T.createElement(
        "link",
        {
          key: w,
          nonce: f.nonce,
          ...X,
          crossOrigin: (G = X.crossOrigin) != null ? G : f.crossOrigin
        }
      )
    );
  }));
}
function Fv(...i) {
  return (s) => {
    i.forEach((f) => {
      typeof f == "function" ? f(s) : f != null && (f.current = s);
    });
  };
}
var $v = typeof window != "undefined" && typeof window.document != "undefined" && typeof window.document.createElement != "undefined";
try {
  $v && (window.__reactRouterVersion = // @ts-expect-error
  "7.13.2");
} catch (i) {
}
function Wv({
  basename: i,
  children: s,
  unstable_useTransitions: f,
  window: d
}) {
  let r = T.useRef();
  r.current == null && (r.current = Rp({ window: d, v5Compat: !0 }));
  let v = r.current, [E, R] = T.useState({
    action: v.action,
    location: v.location
  }), b = T.useCallback(
    (p) => {
      f === !1 ? R(p) : T.startTransition(() => R(p));
    },
    [f]
  );
  return T.useLayoutEffect(() => v.listen(b), [v, b]), /* @__PURE__ */ T.createElement(
    xv,
    {
      basename: i,
      children: s,
      location: E.location,
      navigationType: E.action,
      navigator: v,
      unstable_useTransitions: f
    }
  );
}
var Qh = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i, $l = T.forwardRef(
  function({
    onClick: s,
    discover: f = "render",
    prefetch: d = "none",
    relative: r,
    reloadDocument: v,
    replace: E,
    unstable_mask: R,
    state: b,
    target: p,
    to: D,
    preventScrollReset: A,
    viewTransition: H,
    unstable_defaultShouldRevalidate: K,
    ...J
  }, w) {
    let { basename: X, navigator: G, unstable_useTransitions: $ } = T.useContext(bt), I = typeof D == "string" && Qh.test(D), ae = Mh(D, X);
    D = ae.to;
    let fe = fv(D, { relative: r }), be = Gt(), oe = null;
    if (R) {
      let he = hi(
        R,
        [],
        be.unstable_mask ? be.unstable_mask.pathname : "/",
        !0
      );
      X !== "/" && (he.pathname = he.pathname === "/" ? X : Yt([X, he.pathname])), oe = G.createHref(he);
    }
    let [P, Re, He] = Vv(
      d,
      J
    ), tt = tg(D, {
      replace: E,
      unstable_mask: R,
      state: b,
      target: p,
      preventScrollReset: A,
      relative: r,
      viewTransition: H,
      unstable_defaultShouldRevalidate: K,
      unstable_useTransitions: $
    });
    function U(he) {
      s && s(he), he.defaultPrevented || tt(he);
    }
    let Be = !(ae.isExternal || v), Se = (
      // eslint-disable-next-line jsx-a11y/anchor-has-content
      /* @__PURE__ */ T.createElement(
        "a",
        {
          ...J,
          ...He,
          href: (Be ? oe : void 0) || ae.absoluteURL || fe,
          onClick: Be ? U : s,
          ref: Fv(w, Re),
          target: p,
          "data-discover": !I && f === "render" ? "true" : void 0
        }
      )
    );
    return P && !I ? /* @__PURE__ */ T.createElement(T.Fragment, null, Se, /* @__PURE__ */ T.createElement(Jv, { page: fe })) : Se;
  }
);
$l.displayName = "Link";
var Iv = T.forwardRef(
  function({
    "aria-current": s = "page",
    caseSensitive: f = !1,
    className: d = "",
    end: r = !1,
    style: v,
    to: E,
    viewTransition: R,
    children: b,
    ...p
  }, D) {
    let A = Qn(E, { relative: p.relative }), H = Gt(), K = T.useContext(mi), { navigator: J, basename: w } = T.useContext(bt), X = K != null && // Conditional usage is OK here because the usage of a data router is static
    // eslint-disable-next-line react-hooks/rules-of-hooks
    cg(A) && R === !0, G = J.encodeLocation ? J.encodeLocation(A).pathname : A.pathname, $ = H.pathname, I = K && K.navigation && K.navigation.location ? K.navigation.location.pathname : null;
    f || ($ = $.toLowerCase(), I = I ? I.toLowerCase() : null, G = G.toLowerCase()), I && w && (I = ul(I, w) || I);
    const ae = G !== "/" && G.endsWith("/") ? G.length - 1 : G.length;
    let fe = $ === G || !r && $.startsWith(G) && $.charAt(ae) === "/", be = I != null && (I === G || !r && I.startsWith(G) && I.charAt(G.length) === "/"), oe = {
      isActive: fe,
      isPending: be,
      isTransitioning: X
    }, P = fe ? s : void 0, Re;
    typeof d == "function" ? Re = d(oe) : Re = [
      d,
      fe ? "active" : null,
      be ? "pending" : null,
      X ? "transitioning" : null
    ].filter(Boolean).join(" ");
    let He = typeof v == "function" ? v(oe) : v;
    return /* @__PURE__ */ T.createElement(
      $l,
      {
        ...p,
        "aria-current": P,
        className: Re,
        ref: D,
        style: He,
        to: E,
        viewTransition: R
      },
      typeof b == "function" ? b(oe) : b
    );
  }
);
Iv.displayName = "NavLink";
var Pv = T.forwardRef(
  ({
    discover: i = "render",
    fetcherKey: s,
    navigate: f,
    reloadDocument: d,
    replace: r,
    state: v,
    method: E = si,
    action: R,
    onSubmit: b,
    relative: p,
    preventScrollReset: D,
    viewTransition: A,
    unstable_defaultShouldRevalidate: H,
    ...K
  }, J) => {
    let { unstable_useTransitions: w } = T.useContext(bt), X = ug(), G = ig(R, { relative: p }), $ = E.toLowerCase() === "get" ? "get" : "post", I = typeof R == "string" && Qh.test(R), ae = (fe) => {
      if (b && b(fe), fe.defaultPrevented) return;
      fe.preventDefault();
      let be = fe.nativeEvent.submitter, oe = (be == null ? void 0 : be.getAttribute("formmethod")) || E, P = () => X(be || fe.currentTarget, {
        fetcherKey: s,
        method: oe,
        navigate: f,
        replace: r,
        state: v,
        relative: p,
        preventScrollReset: D,
        viewTransition: A,
        unstable_defaultShouldRevalidate: H
      });
      w && f !== !1 ? T.startTransition(() => P()) : P();
    };
    return /* @__PURE__ */ T.createElement(
      "form",
      {
        ref: J,
        method: $,
        action: G,
        onSubmit: d ? b : ae,
        ...K,
        "data-discover": !I && i === "render" ? "true" : void 0
      }
    );
  }
);
Pv.displayName = "Form";
function eg(i) {
  return `${i} must be used within a data router.  See https://reactrouter.com/en/main/routers/picking-a-router.`;
}
function wh(i) {
  let s = T.useContext(Ba);
  return De(s, eg(i)), s;
}
function tg(i, {
  target: s,
  replace: f,
  unstable_mask: d,
  state: r,
  preventScrollReset: v,
  relative: E,
  viewTransition: R,
  unstable_defaultShouldRevalidate: b,
  unstable_useTransitions: p
} = {}) {
  let D = yi(), A = Gt(), H = Qn(i, { relative: E });
  return T.useCallback(
    (K) => {
      if (Mv(K, s)) {
        K.preventDefault();
        let J = f !== void 0 ? f : Gn(A) === Gn(H), w = () => D(i, {
          replace: J,
          unstable_mask: d,
          state: r,
          preventScrollReset: v,
          relative: E,
          viewTransition: R,
          unstable_defaultShouldRevalidate: b
        });
        p ? T.startTransition(() => w()) : w();
      }
    },
    [
      A,
      D,
      H,
      f,
      d,
      r,
      s,
      i,
      v,
      E,
      R,
      b,
      p
    ]
  );
}
function lg(i) {
  Ot(
    typeof URLSearchParams != "undefined",
    "You cannot use the `useSearchParams` hook in a browser that does not support the URLSearchParams API. If you need to support Internet Explorer 11, we recommend you load a polyfill such as https://github.com/ungap/url-search-params."
  );
  let s = T.useRef(kf(i)), f = T.useRef(!1), d = Gt(), r = T.useMemo(
    () => (
      // Only merge in the defaults if we haven't yet called setSearchParams.
      // Once we call that we want those to take precedence, otherwise you can't
      // remove a param with setSearchParams({}) if it has an initial value
      Dv(
        d.search,
        f.current ? null : s.current
      )
    ),
    [d.search]
  ), v = yi(), E = T.useCallback(
    (R, b) => {
      const p = kf(
        typeof R == "function" ? R(new URLSearchParams(r)) : R
      );
      f.current = !0, v("?" + p, b);
    },
    [v, r]
  );
  return [r, E];
}
var ag = 0, ng = () => `__${String(++ag)}__`;
function ug() {
  let { router: i } = wh(
    "useSubmit"
    /* UseSubmit */
  ), { basename: s } = T.useContext(bt), f = Sv(), d = i.fetch, r = i.navigate;
  return T.useCallback(
    async (v, E = {}) => {
      let { action: R, method: b, encType: p, formData: D, body: A } = Hv(
        v,
        s
      );
      if (E.navigate === !1) {
        let H = E.fetcherKey || ng();
        await d(H, f, E.action || R, {
          unstable_defaultShouldRevalidate: E.unstable_defaultShouldRevalidate,
          preventScrollReset: E.preventScrollReset,
          formData: D,
          body: A,
          formMethod: E.method || b,
          formEncType: E.encType || p,
          flushSync: E.flushSync
        });
      } else
        await r(E.action || R, {
          unstable_defaultShouldRevalidate: E.unstable_defaultShouldRevalidate,
          preventScrollReset: E.preventScrollReset,
          formData: D,
          body: A,
          formMethod: E.method || b,
          formEncType: E.encType || p,
          replace: E.replace,
          state: E.state,
          fromRouteId: f,
          flushSync: E.flushSync,
          viewTransition: E.viewTransition
        });
    },
    [d, r, s, f]
  );
}
function ig(i, { relative: s } = {}) {
  let { basename: f } = T.useContext(bt), d = T.useContext(Ut);
  De(d, "useFormAction must be used inside a RouteContext");
  let [r] = d.matches.slice(-1), v = { ...Qn(i || ".", { relative: s }) }, E = Gt();
  if (i == null) {
    v.search = E.search;
    let R = new URLSearchParams(v.search), b = R.getAll("index");
    if (b.some((D) => D === "")) {
      R.delete("index"), b.filter((A) => A).forEach((A) => R.append("index", A));
      let D = R.toString();
      v.search = D ? `?${D}` : "";
    }
  }
  return (!i || i === ".") && r.route.index && (v.search = v.search ? v.search.replace(/^\?/, "?index&") : "?index"), f !== "/" && (v.pathname = v.pathname === "/" ? f : Yt([f, v.pathname])), Gn(v);
}
function cg(i, { relative: s } = {}) {
  let f = T.useContext(Ch);
  De(
    f != null,
    "`useViewTransitionState` must be used within `react-router-dom`'s `RouterProvider`.  Did you accidentally import `RouterProvider` from `react-router`?"
  );
  let { basename: d } = wh(
    "useViewTransitionState"
    /* useViewTransitionState */
  ), r = Qn(i, { relative: s });
  if (!f.isTransitioning)
    return !1;
  let v = ul(f.currentLocation.pathname, d) || f.currentLocation.pathname, E = ul(f.nextLocation.pathname, d) || f.nextLocation.pathname;
  return di(r.pathname, E) != null || di(r.pathname, v) != null;
}
const Zh = (i) => i.length === 0 ? "/jobs" : i.startsWith("/") ? i : "/" + i, fg = (i) => {
  const s = Zh(i);
  return "/login?redirect-to=" + encodeURIComponent(s);
}, Vh = () => {
  const i = window.PUBLIC_JOBS_BOOT || {}, s = Zh(i.currentPath || window.location.pathname || "/jobs"), f = typeof i.logo == "string" && i.logo.trim() ? i.logo.trim() : null;
  return {
    appName: i.appName || "CareVerse HQ",
    logo: f,
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
    signInLink: i.signInLink || fg(s),
    currentPath: s,
    jobSlug: i.jobSlug
  };
};
function sg({ boot: i }) {
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
const _h = (i, s) => {
  const f = (i || s || "CV").trim();
  if (f.length === 0) return "CV";
  const d = f.split(/\s+/).filter(Boolean);
  return d.length === 1 ? d[0].slice(0, 2).toUpperCase() : (d[0][0] + d[d.length - 1][0]).toUpperCase();
}, rg = async (i) => {
  try {
    await fetch("/api/method/logout", {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...i ? { "X-Frappe-CSRF-Token": i } : {}
      }
    });
  } catch (s) {
  }
  window.location.href = "/jobs";
};
function og({ boot: i }) {
  const s = T.useMemo(() => _h(i.userFullName, i.userEmail), [i.userEmail, i.userFullName]), f = T.useMemo(() => _h(i.appName), [i.appName]);
  return /* @__PURE__ */ h.jsx("header", { className: "pj-header", children: /* @__PURE__ */ h.jsxs("div", { className: "pj-shell pj-header-inner", children: [
    /* @__PURE__ */ h.jsxs("a", { href: "/jobs", className: "pj-brand-link", "aria-label": i.appName + " jobs board", children: [
      /* @__PURE__ */ h.jsx("span", { className: "pj-brand-mark", children: i.logo ? /* @__PURE__ */ h.jsx("img", { src: i.logo, alt: i.appName }) : /* @__PURE__ */ h.jsx("span", { children: f }) }),
      /* @__PURE__ */ h.jsxs("span", { className: "pj-brand-copy", children: [
        /* @__PURE__ */ h.jsx("span", { className: "pj-brand-title", children: i.appName }),
        /* @__PURE__ */ h.jsx("span", { className: "pj-brand-subtitle", children: "Public Jobs Board" })
      ] })
    ] }),
    /* @__PURE__ */ h.jsx("div", { className: "pj-header-actions", children: i.isAuthenticated ? /* @__PURE__ */ h.jsxs(h.Fragment, { children: [
      i.hasAdminAccess ? /* @__PURE__ */ h.jsx("a", { className: "pj-btn pj-btn-ghost", href: i.adminCentralLink, children: "Back to Admin Central" }) : null,
      /* @__PURE__ */ h.jsx("a", { className: "pj-btn pj-btn-ghost", href: i.profileLink, children: "My Profile" }),
      /* @__PURE__ */ h.jsxs("button", { type: "button", className: "pj-user-chip", onClick: () => {
        rg(i.csrfToken);
      }, children: [
        /* @__PURE__ */ h.jsx("span", { className: "pj-user-avatar", children: i.userInitials || s }),
        /* @__PURE__ */ h.jsxs("span", { className: "pj-user-meta", children: [
          /* @__PURE__ */ h.jsx("span", { className: "pj-user-name", children: i.userFullName || i.userEmail || "Signed in user" }),
          /* @__PURE__ */ h.jsx("span", { className: "pj-user-role", children: i.userRoleLabel || "Signed-in applicant" })
        ] }),
        /* @__PURE__ */ h.jsx("span", { className: "pj-user-action", children: "Sign Out" })
      ] })
    ] }) : /* @__PURE__ */ h.jsx("a", { className: "pj-btn pj-btn-primary", href: i.signInLink, children: "Sign In" }) })
  ] }) });
}
const Hn = "/api/method/careverse_hq.api.public_jobs", Bn = (i) => {
  if (i && typeof i == "object") {
    const s = i;
    return s.message && typeof s.message == "object" ? s.message : s;
  }
  return {};
}, Ln = async (i) => {
  try {
    return await i.json();
  } catch (s) {
    return {};
  }
}, qn = (i, s, f) => {
  if (i.ok && s.status === "success")
    return s;
  throw new Error(s.message || f);
}, Th = (i) => {
  const s = new URLSearchParams();
  return Object.entries(i).forEach(([f, d]) => {
    if (d === void 0) return;
    const r = String(d).trim();
    r.length !== 0 && s.set(f, r);
  }), s.toString();
}, Yn = {
  async getFilterOptions() {
    const i = await fetch(Hn + ".get_job_filter_options", {
      method: "GET",
      credentials: "same-origin",
      headers: { Accept: "application/json" }
    }), s = Bn(await Ln(i));
    return qn(i, s, "Failed to load filter options").data || { locations: [], health_facilities: [], employment_types: [], designations: [], companies: [] };
  },
  async getJobs(i) {
    const s = Th(i), f = await fetch(Hn + ".get_public_jobs" + (s ? "?" + s : ""), {
      method: "GET",
      credentials: "same-origin",
      headers: { Accept: "application/json" }
    }), d = Bn(await Ln(f)), r = qn(f, d, "Failed to load jobs");
    return {
      jobs: r.data && Array.isArray(r.data.jobs) ? r.data.jobs : [],
      pagination: r.pagination || { current_page: 1, per_page: 20, total_count: 0 }
    };
  },
  async getJobDetail(i) {
    const s = Th({ slug: i }), f = await fetch(Hn + ".get_public_job_detail?" + s, {
      method: "GET",
      credentials: "same-origin",
      headers: { Accept: "application/json" }
    }), d = Bn(await Ln(f));
    return qn(f, d, "Failed to load job detail").data || {};
  },
  async submitApplication(i) {
    const s = {
      Accept: "application/json",
      "Content-Type": "application/json"
    };
    window.csrf_token && (s["X-Frappe-CSRF-Token"] = window.csrf_token);
    const f = await fetch(Hn + ".submit_application", {
      method: "POST",
      credentials: "same-origin",
      headers: s,
      body: JSON.stringify(i)
    }), d = Bn(await Ln(f));
    return qn(f, d, "Failed to submit application").data || {};
  },
  async getRegulatorOptions() {
    var d;
    const i = await fetch(Hn + ".get_public_regulator_options", {
      method: "GET",
      credentials: "same-origin",
      headers: { Accept: "application/json" }
    }), s = Bn(await Ln(i)), f = qn(i, s, "Failed to load regulator options");
    return Array.isArray((d = f.data) == null ? void 0 : d.regulators) ? f.data.regulators : [];
  }
};
function oi({
  title: i,
  description: s,
  message: f,
  tone: d = "neutral",
  actionLabel: r,
  onAction: v
}) {
  const E = (s || f || "").trim();
  return /* @__PURE__ */ h.jsxs("div", { className: "pj-state-panel pj-state-panel-" + d, role: d === "error" ? "alert" : "status", children: [
    /* @__PURE__ */ h.jsxs("div", { className: "pj-state-panel-copy", children: [
      /* @__PURE__ */ h.jsx("strong", { children: i }),
      E ? /* @__PURE__ */ h.jsx("p", { children: E }) : null
    ] }),
    r && v ? /* @__PURE__ */ h.jsx("button", { type: "button", className: "pj-btn pj-btn-primary", onClick: v, children: r }) : null
  ] });
}
const Jh = (i) => (i.job_title || i.designation || i.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+/, "").replace(/-+$/, "") + "-" + i.name, Ff = (i) => {
  if (i == null || i === "") return "";
  const s = new Date(i);
  return Number.isNaN(s.getTime()) ? String(i) : s.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}, Kh = (i) => {
  const s = typeof i.lower_range == "number" ? i.lower_range : void 0, f = typeof i.upper_range == "number" ? i.upper_range : void 0, d = i.currency || "", r = i.salary_per ? " / " + i.salary_per.toLowerCase() : "";
  return s === void 0 && f === void 0 ? "" : s !== void 0 && f !== void 0 ? d + " " + s.toLocaleString() + " - " + f.toLocaleString() + r : s !== void 0 ? "From " + d + " " + s.toLocaleString() + r : "Up to " + d + " " + String(f) + r;
}, kh = (i) => {
  if (i == null || i === "")
    return { label: "Rolling review", tone: "rolling", closed: !1 };
  const s = new Date(i);
  if (Number.isNaN(s.getTime()))
    return { label: "Deadline set", tone: "neutral", closed: !1 };
  const f = /* @__PURE__ */ new Date();
  f.setHours(0, 0, 0, 0), s.setHours(0, 0, 0, 0);
  const d = Math.floor((s.getTime() - f.getTime()) / 864e5);
  return d < 0 ? { label: "Closed", tone: "today", closed: !0 } : d === 0 ? { label: "Closes today", tone: "today", closed: !1 } : d <= 7 ? { label: "Closes in " + d + " days", tone: "soon", closed: !1 } : { label: "Closes in " + d + " days", tone: "neutral", closed: !1 };
}, dg = (i) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(i), hg = (i) => {
  try {
    const s = new URL(i);
    return s.protocol === "http:" || s.protocol === "https:";
  } catch (s) {
    return !1;
  }
}, mg = /^\+?[0-9][0-9\s().-]{5,31}$/, yg = {
  applicant_name: "",
  email_id: "",
  phone: "",
  resume_link: "",
  cover_letter: "",
  is_health_worker: !1,
  registration_number: "",
  registering_body: "",
  consent_given: !1,
  website: ""
}, xh = () => {
  const i = Vh();
  return {
    ...yg,
    applicant_name: i.userFullName || "",
    email_id: i.userEmail || ""
  };
};
function pg() {
  const { jobSlug: i = "" } = rv(), s = yi(), [f, d] = T.useState(null), [r, v] = T.useState(!0), [E, R] = T.useState(""), [b, p] = T.useState(xh), [D, A] = T.useState(""), [H, K] = T.useState(!1), [J, w] = T.useState(!1), [X, G] = T.useState(1), [$, I] = T.useState(0), [ae, fe] = T.useState([]), [be, oe] = T.useState(!1), [P, Re] = T.useState("");
  T.useEffect(() => {
    let Q = !1;
    return (async () => {
      if (i.trim().length === 0) {
        R("Job not found."), v(!1);
        return;
      }
      v(!0), R("");
      try {
        const O = await Yn.getJobDetail(i);
        if (Q) return;
        d(O);
      } catch (O) {
        if (Q) return;
        const L = O instanceof Error ? O.message : "Failed to load job details.";
        R(L), d(null);
      } finally {
        Q === !1 && v(!1);
      }
    })(), () => {
      Q = !0;
    };
  }, [i, $]), T.useEffect(() => {
    f && (f.job_title || f.designation) && (document.title = (f.job_title || f.designation || "Job Details") + " - CareVerse HQ");
  }, [f]), T.useEffect(() => {
    let Q = !1;
    return (async () => {
      oe(!0), Re("");
      try {
        const O = await Yn.getRegulatorOptions();
        if (Q) return;
        fe(O);
      } catch (O) {
        if (Q) return;
        const L = O instanceof Error ? O.message : "Failed to load regulators.";
        Re(L), fe([]);
      } finally {
        Q === !1 && oe(!1);
      }
    })(), () => {
      Q = !0;
    };
  }, []);
  const He = T.useMemo(() => kh(f == null ? void 0 : f.closes_on), [f == null ? void 0 : f.closes_on]), tt = !!(f && f.status === "Open" && He.closed === !1), U = (Q, y) => {
    p((O) => ({ ...O, [Q]: y }));
  }, Be = (Q) => {
    p((y) => ({
      ...y,
      is_health_worker: Q,
      registration_number: Q ? y.registration_number : "",
      registering_body: Q ? y.registering_body : ""
    }));
  }, Se = () => {
    const Q = b.applicant_name.trim(), y = b.email_id.trim();
    return Q.length === 0 || y.length === 0 ? (A("Please provide your full name and email."), !1) : Q.length > 140 ? (A("Full name must be 140 characters or fewer."), !1) : dg(y) === !1 ? (A("Please provide a valid email address."), !1) : (A(""), !0);
  }, he = () => {
    if (b.phone.trim().length > 0 && mg.test(b.phone.trim()) === !1)
      return A("Please provide a valid phone number."), !1;
    if (b.resume_link.trim().length > 0 && hg(b.resume_link.trim()) === !1)
      return A("Resume link must start with http:// or https://"), !1;
    if (b.is_health_worker) {
      if (b.registration_number.trim().length === 0)
        return A("Registration number is required when applying as a health worker."), !1;
      if (b.registering_body.trim().length === 0)
        return A("Please select your registering body."), !1;
      if (ae.length === 0)
        return A("Registering body options are currently unavailable. Please try again shortly."), !1;
    }
    return b.consent_given === !1 ? (A("You must consent before submitting your application."), !1) : (A(""), !0);
  }, q = () => {
    Se() && G(2);
  }, B = () => {
    G(1), A("");
  }, Y = () => {
    I((Q) => Q + 1);
  }, me = async (Q) => {
    if (Q.preventDefault(), f === null || tt === !1) {
      A("Applications are currently unavailable for this role.");
      return;
    }
    if (Se() === !1) {
      G(1);
      return;
    }
    if (he() === !1) {
      G(2);
      return;
    }
    const y = {
      job_opening: f.name,
      applicant_name: b.applicant_name.trim(),
      email_id: b.email_id.trim(),
      phone: b.phone.trim() || void 0,
      resume_link: b.resume_link.trim() || void 0,
      cover_letter: b.cover_letter.trim() || void 0,
      consent_given: 1,
      is_health_worker: b.is_health_worker ? 1 : 0,
      registration_number: b.is_health_worker && b.registration_number.trim() || void 0,
      registering_body: b.is_health_worker && b.registering_body.trim() || void 0,
      website: b.website.trim() || void 0
    };
    K(!0), A("");
    try {
      await Yn.submitApplication(y), w(!0), p(xh());
    } catch (O) {
      const L = O instanceof Error ? O.message : "Failed to submit application.";
      A(L);
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
        /* @__PURE__ */ h.jsx("article", { className: "pj-detail-card pj-glass-standard", children: /* @__PURE__ */ h.jsxs("div", { className: "pj-state-panel pj-state-panel-neutral pj-skeleton-panel", children: [
          /* @__PURE__ */ h.jsxs("div", { className: "pj-state-panel-copy", children: [
            /* @__PURE__ */ h.jsx("strong", { children: "Loading role details" }),
            /* @__PURE__ */ h.jsx("p", { children: "Fetching the posting, description, and related openings." })
          ] }),
          /* @__PURE__ */ h.jsx("div", { className: "pj-skeleton-line" })
        ] }) }),
        /* @__PURE__ */ h.jsx("aside", { className: "pj-detail-card pj-glass-standard", children: /* @__PURE__ */ h.jsxs("div", { className: "pj-skeleton-card", children: [
          /* @__PURE__ */ h.jsx("div", { className: "pj-skeleton-title" }),
          /* @__PURE__ */ h.jsx("div", { className: "pj-skeleton-line" }),
          /* @__PURE__ */ h.jsx("div", { className: "pj-skeleton-line short" })
        ] }) })
      ] })
    ] }) });
  if (E.length > 0 || f === null)
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
        /* @__PURE__ */ h.jsx("article", { className: "pj-detail-card pj-glass-standard", children: /* @__PURE__ */ h.jsx(
          oi,
          {
            tone: "error",
            title: "Could not load job detail",
            description: E || "Job not found.",
            actionLabel: "Retry detail",
            onAction: Y
          }
        ) }),
        /* @__PURE__ */ h.jsxs("aside", { className: "pj-detail-card pj-glass-standard", children: [
          /* @__PURE__ */ h.jsx("h2", { children: "What you can do" }),
          /* @__PURE__ */ h.jsx("p", { className: "pj-copy", children: "Return to the jobs board and continue browsing other openings." }),
          /* @__PURE__ */ h.jsx("div", { className: "pj-inline-actions", children: /* @__PURE__ */ h.jsx("button", { type: "button", className: "pj-btn pj-btn-primary", onClick: () => s("/"), children: "Back to Jobs Board" }) })
        ] })
      ] })
    ] });
  const Ae = Kh(f);
  return /* @__PURE__ */ h.jsxs("main", { className: "pj-main pj-shell", children: [
    /* @__PURE__ */ h.jsxs("div", { className: "pj-breadcrumbs", children: [
      /* @__PURE__ */ h.jsx($l, { to: "/", children: "Jobs Board" }),
      /* @__PURE__ */ h.jsx("span", { children: " / " }),
      /* @__PURE__ */ h.jsx("span", { children: f.job_title || f.designation || "Role Details" })
    ] }),
    /* @__PURE__ */ h.jsxs("section", { className: "pj-detail-hero", children: [
      /* @__PURE__ */ h.jsxs("div", { children: [
        /* @__PURE__ */ h.jsx("p", { className: "pj-eyebrow", children: f.company || "Healthcare Facility" }),
        /* @__PURE__ */ h.jsx("h1", { children: f.job_title || f.designation || "Open role" }),
        /* @__PURE__ */ h.jsx("p", { className: "pj-detail-subtitle", children: [f.health_facility_name || f.health_facility, f.location, f.employment_type, f.designation].filter(Boolean).join(" • ") || "Published healthcare opportunity" })
      ] }),
      /* @__PURE__ */ h.jsx("span", { className: "pj-deadline " + He.tone, children: He.label })
    ] }),
    /* @__PURE__ */ h.jsxs("section", { className: "pj-detail-grid", children: [
      /* @__PURE__ */ h.jsxs("article", { className: "pj-detail-card pj-glass-standard", children: [
        /* @__PURE__ */ h.jsx("h2", { children: "Role Overview" }),
        /* @__PURE__ */ h.jsxs("div", { className: "pj-fact-grid", children: [
          /* @__PURE__ */ h.jsxs("div", { children: [
            /* @__PURE__ */ h.jsx("span", { children: "Facility" }),
            /* @__PURE__ */ h.jsx("strong", { children: f.company || "Not specified" })
          ] }),
          /* @__PURE__ */ h.jsxs("div", { children: [
            /* @__PURE__ */ h.jsx("span", { children: "Health Facility" }),
            /* @__PURE__ */ h.jsx("strong", { children: f.health_facility_name || f.health_facility || "Not specified" })
          ] }),
          /* @__PURE__ */ h.jsxs("div", { children: [
            /* @__PURE__ */ h.jsx("span", { children: "Location" }),
            /* @__PURE__ */ h.jsx("strong", { children: f.location || "Not specified" })
          ] }),
          /* @__PURE__ */ h.jsxs("div", { children: [
            /* @__PURE__ */ h.jsx("span", { children: "Employment Type" }),
            /* @__PURE__ */ h.jsx("strong", { children: f.employment_type || "Not specified" })
          ] }),
          /* @__PURE__ */ h.jsxs("div", { children: [
            /* @__PURE__ */ h.jsx("span", { children: "Compensation" }),
            /* @__PURE__ */ h.jsx("strong", { children: Ae || "Shared during hiring process" })
          ] }),
          /* @__PURE__ */ h.jsxs("div", { children: [
            /* @__PURE__ */ h.jsx("span", { children: "Posted" }),
            /* @__PURE__ */ h.jsx("strong", { children: Ff(f.posted_on) || "—" })
          ] }),
          /* @__PURE__ */ h.jsxs("div", { children: [
            /* @__PURE__ */ h.jsx("span", { children: "Deadline" }),
            /* @__PURE__ */ h.jsx("strong", { children: Ff(f.closes_on) || "Rolling review" })
          ] })
        ] }),
        /* @__PURE__ */ h.jsx("h3", { children: "Description" }),
        f.description_html ? /* @__PURE__ */ h.jsx("div", { className: "pj-rich-copy", dangerouslySetInnerHTML: { __html: f.description_html } }) : /* @__PURE__ */ h.jsx("p", { className: "pj-copy", children: f.description || "The employer has not added more detail for this role yet." })
      ] }),
      /* @__PURE__ */ h.jsxs("aside", { className: "pj-detail-card pj-glass-standard", children: [
        /* @__PURE__ */ h.jsx("h2", { children: "Apply" }),
        tt ? /* @__PURE__ */ h.jsx(h.Fragment, { children: J ? /* @__PURE__ */ h.jsx("div", { className: "pj-success", children: "Your application has been submitted successfully." }) : /* @__PURE__ */ h.jsxs("form", { className: "pj-form", onSubmit: me, children: [
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
                  value: b.applicant_name,
                  onChange: (Q) => U("applicant_name", Q.target.value),
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
                  value: b.email_id,
                  onChange: (Q) => U("email_id", Q.target.value),
                  maxLength: 254,
                  required: !0
                }
              )
            ] }),
            /* @__PURE__ */ h.jsx("div", { className: "pj-inline-actions", children: /* @__PURE__ */ h.jsx("button", { type: "button", className: "pj-btn pj-btn-primary", onClick: q, children: "Continue" }) })
          ] }) : /* @__PURE__ */ h.jsxs(h.Fragment, { children: [
            /* @__PURE__ */ h.jsxs("label", { children: [
              /* @__PURE__ */ h.jsx("span", { children: "Phone (optional)" }),
              /* @__PURE__ */ h.jsx(
                "input",
                {
                  className: "pj-input",
                  value: b.phone,
                  onChange: (Q) => U("phone", Q.target.value),
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
                  value: b.resume_link,
                  onChange: (Q) => U("resume_link", Q.target.value),
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
                  value: b.cover_letter,
                  onChange: (Q) => U("cover_letter", Q.target.value),
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
                  checked: b.is_health_worker,
                  onChange: (Q) => Be(Q.target.checked)
                }
              ),
              /* @__PURE__ */ h.jsx("span", { children: "I am a health worker and want to include regulatory registration details." })
            ] }),
            b.is_health_worker ? /* @__PURE__ */ h.jsxs("div", { className: "pj-form-group", children: [
              /* @__PURE__ */ h.jsxs("label", { children: [
                /* @__PURE__ */ h.jsx("span", { children: "Registration Number" }),
                /* @__PURE__ */ h.jsx(
                  "input",
                  {
                    className: "pj-input",
                    value: b.registration_number,
                    onChange: (Q) => U("registration_number", Q.target.value),
                    maxLength: 140,
                    required: b.is_health_worker
                  }
                )
              ] }),
              /* @__PURE__ */ h.jsxs("label", { children: [
                /* @__PURE__ */ h.jsx("span", { children: "Registering Body" }),
                /* @__PURE__ */ h.jsxs(
                  "select",
                  {
                    className: "pj-select",
                    value: b.registering_body,
                    onChange: (Q) => U("registering_body", Q.target.value),
                    required: b.is_health_worker,
                    disabled: be || ae.length === 0,
                    children: [
                      /* @__PURE__ */ h.jsx("option", { value: "", children: be ? "Loading regulators..." : "Select registering body" }),
                      ae.map((Q) => /* @__PURE__ */ h.jsx("option", { value: Q.value, children: Q.abbreviation ? `${Q.label} (${Q.abbreviation})` : Q.label }, Q.value))
                    ]
                  }
                )
              ] }),
              P ? /* @__PURE__ */ h.jsx("div", { className: "pj-field-help pj-field-help-error", children: P }) : null
            ] }) : null,
            /* @__PURE__ */ h.jsxs("label", { className: "pj-checkbox-row", children: [
              /* @__PURE__ */ h.jsx(
                "input",
                {
                  type: "checkbox",
                  checked: b.consent_given,
                  onChange: (Q) => U("consent_given", Q.target.checked)
                }
              ),
              /* @__PURE__ */ h.jsx("span", { children: "I consent to processing of my profile and KYC data for hiring review." })
            ] }),
            /* @__PURE__ */ h.jsx(
              "input",
              {
                type: "text",
                className: "pj-hidden-input",
                value: b.website,
                onChange: (Q) => U("website", Q.target.value),
                tabIndex: -1,
                autoComplete: "off",
                "aria-hidden": "true"
              }
            ),
            /* @__PURE__ */ h.jsxs("div", { className: "pj-inline-actions", children: [
              /* @__PURE__ */ h.jsx("button", { type: "button", className: "pj-btn pj-btn-ghost", onClick: B, children: "Back" }),
              /* @__PURE__ */ h.jsx("button", { type: "submit", className: "pj-btn pj-btn-primary", disabled: H, children: H ? "Submitting..." : "Submit Application" })
            ] })
          ] }),
          D.length > 0 ? /* @__PURE__ */ h.jsx("div", { className: "pj-state pj-state-error", children: D }) : null
        ] }) }) : /* @__PURE__ */ h.jsx("div", { className: "pj-state", children: "Applications for this role are currently closed." })
      ] })
    ] }),
    /* @__PURE__ */ h.jsxs("section", { className: "pj-detail-card pj-glass-standard", children: [
      /* @__PURE__ */ h.jsx("h2", { children: "Related Roles" }),
      Array.isArray(f.related_jobs) && f.related_jobs.length > 0 ? /* @__PURE__ */ h.jsx("div", { className: "pj-related-grid", children: f.related_jobs.map((Q) => /* @__PURE__ */ h.jsxs($l, { className: "pj-related-item", to: encodeURIComponent(Jh(Q)), children: [
        /* @__PURE__ */ h.jsx("h3", { children: Q.job_title || Q.designation || "Open role" }),
        /* @__PURE__ */ h.jsx("p", { children: [Q.company, Q.health_facility_name || Q.health_facility, Q.location, Q.employment_type].filter(Boolean).join(" • ") || "Published opportunity" })
      ] }, Q.name)) }) : /* @__PURE__ */ h.jsx("p", { className: "pj-copy", children: "No related openings are currently available." })
    ] })
  ] });
}
const $f = 20, Ah = {
  locations: [],
  health_facilities: [],
  employment_types: [],
  designations: [],
  companies: []
}, Vf = {
  current_page: 1,
  per_page: $f,
  total_count: 0
}, vg = (i, s) => {
  const f = Number(i || "");
  return Number.isFinite(f) && f >= 1 ? Math.floor(f) : s;
}, gg = (i, s) => {
  if (s <= 1) return [1];
  const f = 5;
  let d = Math.max(1, i - Math.floor(f / 2));
  const r = Math.min(s, d + f - 1);
  r - d + 1 < f && (d = Math.max(1, r - f + 1));
  const v = [];
  for (let E = d; E <= r; E += 1)
    v.push(E);
  return v;
};
function bg() {
  const [i, s] = lg(), f = T.useMemo(() => ({
    search: (i.get("search") || "").trim(),
    location: (i.get("location") || "").trim(),
    healthFacility: (i.get("health_facility") || "").trim(),
    employmentType: (i.get("employment_type") || "").trim(),
    designation: (i.get("designation") || "").trim(),
    company: (i.get("company") || "").trim(),
    page: vg(i.get("page"), 1)
  }), [i]), [d, r] = T.useState(f.search), [v, E] = T.useState([]), [R, b] = T.useState(Ah), [p, D] = T.useState(Vf), [A, H] = T.useState(!0), [K, J] = T.useState(""), [w, X] = T.useState(!0), [G, $] = T.useState(""), [I, ae] = T.useState(0);
  T.useEffect(() => {
    r(f.search);
  }, [f.search]), T.useEffect(() => {
    let U = !1;
    return (async () => {
      X(!0), $("");
      try {
        const Se = await Yn.getFilterOptions();
        if (U) return;
        b(Se);
      } catch (Se) {
        if (U) return;
        b(Ah), $("Filter options could not be loaded right now. You can still browse jobs.");
      } finally {
        U === !1 && X(!1);
      }
    })(), () => {
      U = !0;
    };
  }, [I]), T.useEffect(() => {
    let U = !1;
    return (async () => {
      H(!0), J("");
      try {
        const Se = await Yn.getJobs({
          page: f.page,
          page_size: $f,
          search: f.search,
          location: f.location,
          health_facility: f.healthFacility,
          employment_type: f.employmentType,
          designation: f.designation,
          company: f.company
        });
        if (U) return;
        E(Se.jobs), D(Se.pagination || Vf);
      } catch (Se) {
        if (U) return;
        const he = Se instanceof Error ? Se.message : "Failed to load jobs.";
        J(he), E([]), D(Vf);
      } finally {
        U === !1 && H(!1);
      }
    })(), () => {
      U = !0;
    };
  }, [f.company, f.designation, f.employmentType, f.healthFacility, f.location, f.page, f.search, I]);
  const fe = Math.max(1, Math.ceil((p.total_count || 0) / (p.per_page || $f))), be = gg(f.page, fe), oe = (U, Be = !1) => {
    const Se = new URLSearchParams(i), he = (q, B) => {
      if (B == null || String(B).trim().length === 0) {
        Se.delete(q);
        return;
      }
      Se.set(q, String(B));
    };
    U.search !== void 0 && he("search", U.search), U.location !== void 0 && he("location", U.location), U.healthFacility !== void 0 && he("health_facility", U.healthFacility), U.employmentType !== void 0 && he("employment_type", U.employmentType), U.designation !== void 0 && he("designation", U.designation), U.company !== void 0 && he("company", U.company), U.page !== void 0 && he("page", U.page), Be && Se.delete("page"), s(Se, { replace: !0 });
  }, P = (U) => {
    U.preventDefault(), oe({ search: d.trim() }, !0);
  }, Re = () => {
    r(""), s({}, { replace: !0 });
  }, He = () => {
    ae((U) => U + 1);
  }, tt = [
    f.search,
    f.location,
    f.healthFacility,
    f.employmentType,
    f.designation,
    f.company
  ].filter((U) => U.length > 0).length;
  return /* @__PURE__ */ h.jsxs("main", { className: "pj-main", children: [
    /* @__PURE__ */ h.jsxs("section", { className: "pj-hero pj-shell", children: [
      /* @__PURE__ */ h.jsx("p", { className: "pj-eyebrow", children: "Public Healthcare Hiring" }),
      /* @__PURE__ */ h.jsx("h1", { children: "Find your next role with verified healthcare facilities." }),
      /* @__PURE__ */ h.jsx("p", { children: "Browse open postings, compare timelines, and apply securely from one public jobs board." })
    ] }),
    /* @__PURE__ */ h.jsxs("section", { className: "pj-shell pj-list-layout", children: [
      /* @__PURE__ */ h.jsxs("aside", { className: "pj-list-filters pj-detail-card pj-glass-standard", children: [
        /* @__PURE__ */ h.jsxs("div", { className: "pj-panel-head", children: [
          /* @__PURE__ */ h.jsx("h2", { children: "Discover Jobs" }),
          /* @__PURE__ */ h.jsx("p", { className: "pj-section-sub", children: "Candidate filters" })
        ] }),
        /* @__PURE__ */ h.jsxs("form", { className: "pj-search-row", onSubmit: P, children: [
          /* @__PURE__ */ h.jsx(
            "input",
            {
              className: "pj-input",
              value: d,
              onChange: (U) => r(U.target.value),
              placeholder: "Search by role, location, or facility",
              maxLength: 120,
              "aria-label": "Search jobs"
            }
          ),
          /* @__PURE__ */ h.jsx("button", { type: "submit", className: "pj-btn pj-btn-primary", children: "Search" })
        ] }),
        /* @__PURE__ */ h.jsxs("div", { className: "pj-filters-grid", children: [
          /* @__PURE__ */ h.jsxs("label", { children: [
            /* @__PURE__ */ h.jsx("span", { children: "Organization" }),
            /* @__PURE__ */ h.jsxs(
              "select",
              {
                className: "pj-select",
                value: f.company,
                onChange: (U) => oe({ company: U.target.value }, !0),
                disabled: w,
                children: [
                  /* @__PURE__ */ h.jsx("option", { value: "", children: "All facilities" }),
                  R.companies.map((U) => /* @__PURE__ */ h.jsx("option", { value: U, children: U }, U))
                ]
              }
            )
          ] }),
          /* @__PURE__ */ h.jsxs("label", { children: [
            /* @__PURE__ */ h.jsx("span", { children: "Health Facility" }),
            /* @__PURE__ */ h.jsxs(
              "select",
              {
                className: "pj-select",
                value: f.healthFacility,
                onChange: (U) => oe({ healthFacility: U.target.value }, !0),
                disabled: w,
                children: [
                  /* @__PURE__ */ h.jsx("option", { value: "", children: "All facilities" }),
                  R.health_facilities.map((U) => /* @__PURE__ */ h.jsx("option", { value: U, children: U }, U))
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
                value: f.location,
                onChange: (U) => oe({ location: U.target.value }, !0),
                disabled: w,
                children: [
                  /* @__PURE__ */ h.jsx("option", { value: "", children: "All locations" }),
                  R.locations.map((U) => /* @__PURE__ */ h.jsx("option", { value: U, children: U }, U))
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
                value: f.employmentType,
                onChange: (U) => oe({ employmentType: U.target.value }, !0),
                disabled: w,
                children: [
                  /* @__PURE__ */ h.jsx("option", { value: "", children: "All types" }),
                  R.employment_types.map((U) => /* @__PURE__ */ h.jsx("option", { value: U, children: U }, U))
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
                value: f.designation,
                onChange: (U) => oe({ designation: U.target.value }, !0),
                disabled: w,
                children: [
                  /* @__PURE__ */ h.jsx("option", { value: "", children: "All roles" }),
                  R.designations.map((U) => /* @__PURE__ */ h.jsx("option", { value: U, children: U }, U))
                ]
              }
            )
          ] })
        ] }),
        G.length > 0 ? /* @__PURE__ */ h.jsx("div", { className: "pj-state-wrap", children: /* @__PURE__ */ h.jsx(
          oi,
          {
            tone: "neutral",
            title: "Filters unavailable",
            description: G,
            actionLabel: "Retry loading filters",
            onAction: He
          }
        ) }) : null,
        /* @__PURE__ */ h.jsx("button", { type: "button", className: "pj-btn pj-btn-ghost pj-reset-btn", onClick: Re, children: "Reset Filters" })
      ] }),
      /* @__PURE__ */ h.jsxs("section", { className: "pj-list-results pj-detail-card pj-glass-standard", children: [
        /* @__PURE__ */ h.jsx("div", { className: "pj-results-meta", children: /* @__PURE__ */ h.jsxs("div", { children: [
          /* @__PURE__ */ h.jsxs("h2", { children: [
            p.total_count,
            " Open Position",
            p.total_count === 1 ? "" : "s"
          ] }),
          /* @__PURE__ */ h.jsx("p", { children: tt > 0 ? "Filtered results shown." : "Showing all currently published openings." })
        ] }) }),
        A ? /* @__PURE__ */ h.jsx("div", { className: "pj-state-wrap", children: /* @__PURE__ */ h.jsxs("div", { className: "pj-state-panel pj-state-panel-neutral pj-skeleton-panel", "aria-busy": "true", children: [
          /* @__PURE__ */ h.jsxs("div", { className: "pj-state-panel-copy", children: [
            /* @__PURE__ */ h.jsx("strong", { children: "Loading open roles" }),
            /* @__PURE__ */ h.jsx("p", { children: "Fetching current vacancies and publishing metadata." })
          ] }),
          /* @__PURE__ */ h.jsx("div", { className: "pj-skeleton-line" })
        ] }) }) : null,
        K.length > 0 ? /* @__PURE__ */ h.jsx("div", { className: "pj-state-wrap", children: /* @__PURE__ */ h.jsx(
          oi,
          {
            tone: "error",
            title: "Could not load jobs",
            description: K,
            actionLabel: "Retry jobs",
            onAction: He
          }
        ) }) : null,
        A === !1 && K.length === 0 && v.length === 0 ? /* @__PURE__ */ h.jsx("div", { className: "pj-state-wrap", children: /* @__PURE__ */ h.jsx(
          oi,
          {
            tone: "neutral",
            title: "No matching jobs",
            description: "No jobs match your current filters. Try broadening your search or reset the filters to view all openings.",
            actionLabel: "Reset filters",
            onAction: Re
          }
        ) }) : null,
        A === !1 && K.length === 0 && v.length > 0 ? /* @__PURE__ */ h.jsxs(h.Fragment, { children: [
          /* @__PURE__ */ h.jsx("div", { className: "pj-jobs-grid", children: v.map((U) => {
            const Be = Kh(U), Se = kh(U.closes_on), he = encodeURIComponent(Jh(U));
            return /* @__PURE__ */ h.jsxs($l, { className: "pj-job-card", to: he, children: [
              /* @__PURE__ */ h.jsxs("div", { className: "pj-job-card-head", children: [
                /* @__PURE__ */ h.jsx("p", { className: "pj-job-company", children: U.company || U.health_facility_name || U.health_facility || "Healthcare facility" }),
                /* @__PURE__ */ h.jsx("span", { className: "pj-deadline " + Se.tone, children: Se.label })
              ] }),
              /* @__PURE__ */ h.jsx("h3", { children: U.job_title || U.designation || "Open role" }),
              /* @__PURE__ */ h.jsx("p", { className: "pj-job-meta", children: [U.health_facility_name || U.health_facility, U.location, U.employment_type, U.designation].filter(Boolean).join(" • ") || "Details available on role page" }),
              /* @__PURE__ */ h.jsxs("div", { className: "pj-job-highlight-row", children: [
                /* @__PURE__ */ h.jsx("span", { children: Be || "Compensation shared during hiring process" }),
                /* @__PURE__ */ h.jsx("span", { children: U.closes_on ? "Deadline: " + Ff(U.closes_on) : "Rolling review" })
              ] })
            ] }, U.name);
          }) }),
          /* @__PURE__ */ h.jsxs("div", { className: "pj-pagination", children: [
            /* @__PURE__ */ h.jsx(
              "button",
              {
                type: "button",
                className: "pj-page-btn",
                disabled: f.page <= 1,
                onClick: () => oe({ page: f.page - 1 }),
                children: "Previous"
              }
            ),
            be.map((U) => /* @__PURE__ */ h.jsx(
              "button",
              {
                type: "button",
                className: "pj-page-btn" + (U === f.page ? " active" : ""),
                onClick: () => oe({ page: U }),
                children: U
              },
              U
            )),
            /* @__PURE__ */ h.jsx(
              "button",
              {
                type: "button",
                className: "pj-page-btn",
                disabled: f.page >= fe,
                onClick: () => oe({ page: f.page + 1 }),
                children: "Next"
              }
            )
          ] })
        ] }) : null
      ] })
    ] })
  ] });
}
function Sg() {
  const i = Vh();
  return /* @__PURE__ */ h.jsx(Wv, { basename: "/jobs", children: /* @__PURE__ */ h.jsxs("div", { className: "pj-app", children: [
    /* @__PURE__ */ h.jsx(og, { boot: i }),
    /* @__PURE__ */ h.jsxs(Av, { children: [
      /* @__PURE__ */ h.jsx(fi, { path: "/", element: /* @__PURE__ */ h.jsx(bg, {}) }),
      /* @__PURE__ */ h.jsx(fi, { path: ":jobSlug", element: /* @__PURE__ */ h.jsx(pg, {}) }),
      /* @__PURE__ */ h.jsx(fi, { path: "*", element: /* @__PURE__ */ h.jsx(Tv, { to: "/", replace: !0 }) })
    ] }),
    /* @__PURE__ */ h.jsx(sg, { boot: i })
  ] }) });
}
const Eg = () => {
  const i = document.getElementById("public-jobs-root");
  if (i) return i;
  const s = document.createElement("div");
  return s.id = "public-jobs-root", document.body.appendChild(s), s;
}, jg = Eg();
try {
  zp.createRoot(jg).render(
    /* @__PURE__ */ h.jsx(T.StrictMode, { children: /* @__PURE__ */ h.jsx(Sg, {}) })
  ), window.__PUBLIC_JOBS_MOUNTED = !0;
} catch (i) {
  window.__PUBLIC_JOBS_MOUNTED = !1, typeof window.__showPublicJobsFallback == "function" && window.__showPublicJobsFallback("The public jobs application failed to start."), console.error("Public jobs bootstrap failed", i);
}
//# sourceMappingURL=public-jobs.js.map
