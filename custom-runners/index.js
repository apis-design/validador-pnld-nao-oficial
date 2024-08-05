'use strict';

const runner = module.exports = {};

runner.supports = '^8.0.0 || ^8.0.0-alpha || ^8.0.0-beta';

runner.scripts = [];

runner.run = (options, pa11y) => {

	const issueTypeMap = {
		1: 'error',
		2: 'warning',
		3: 'notice'
	};

	function runCode() {

		// expect.js
		// https://github.com/Automattic/expect.js
		// TODO: colocar num arquivo de script
		! function (global, module) {
			var exports = module.exports;
			module.exports = expect, expect.Assertion = Assertion, expect.version = "0.3.1";
			var flags = {
				not: ["to", "be", "have", "include", "only"],
				to: ["be", "have", "include", "only", "not"],
				only: ["have"],
				have: ["own"],
				be: ["an"]
			};

			function expect(t) {
				return new Assertion(t)
			}

			function Assertion(t, e, n) {
				if (this.obj = t, this.flags = {}, void 0 != n)
					for (var r in this.flags[e] = !0, n.flags) n.flags.hasOwnProperty(r) && (this.flags[r] = !0);
				var o = e ? flags[e] : keys(flags),
					i = this;
				if (o) {
					for (var r = 0, u = o.length; r < u; r++)
						if (!this.flags[o[r]]) {
							var s = o[r],
								f = new Assertion(this.obj, s, this);
							if ("function" == typeof Assertion.prototype[s]) {
								var c = this[s];
								for (var a in this[s] = function () {
										return c.apply(i, arguments)
									}, Assertion.prototype) Assertion.prototype.hasOwnProperty(a) && a != s && (this[s][a] = bind(f[a], f))
							} else this[s] = f
						}
				}
			}

			function bind(t, e) {
				return function () {
					return t.apply(e, arguments)
				}
			}

			function every(t, e, n) {
				for (var r = n || global, o = 0, i = t.length; o < i; ++o)
					if (!e.call(r, t[o], o, t)) return !1;
				return !0
			}

			function indexOf(t, e, n) {
				if (Array.prototype.indexOf) return Array.prototype.indexOf.call(t, e, n);
				if (void 0 === t.length) return -1;
				for (var r = t.length, n = n < 0 ? n + r < 0 ? 0 : n + r : n || 0; n < r && t[n] !== e; n++);
				return r <= n ? -1 : n
			}
			Assertion.prototype.assert = function (t, e, n, r) {
				var o, e = this.flags.not ? n : e;
				if (!(this.flags.not ? !t : t)) throw o = Error(e.call(this)), arguments.length > 3 && (o.actual = this.obj, o.expected = r, o.showDiff = !0), o;
				this.and = new Assertion(this.obj)
			}, Assertion.prototype.ok = function () {
				this.assert(!!this.obj, function () {
					return "expected " + i(this.obj) + " to be truthy"
				}, function () {
					return "expected " + i(this.obj) + " to be falsy"
				})
			}, Assertion.prototype.withArgs = function () {
				expect(this.obj).to.be.a("function");
				var t = this.obj,
					e = Array.prototype.slice.call(arguments);
				return expect(function () {
					t.apply(null, e)
				})
			}, Assertion.prototype.throw = Assertion.prototype.throwError = Assertion.prototype.throwException = function (t) {
				expect(this.obj).to.be.a("function");
				var e = !1,
					n = this.flags.not;
				try {
					this.obj()
				} catch (r) {
					if (isRegExp(t)) {
						var o = "string" == typeof r ? r : r.message;
						n ? expect(o).to.not.match(t) : expect(o).to.match(t)
					} else "function" == typeof t && t(r);
					e = !0
				}
				isRegExp(t) && n && (this.flags.not = !1);
				var i = this.obj.name || "fn";
				this.assert(e, function () {
					return "expected " + i + " to throw an exception"
				}, function () {
					return "expected " + i + " not to throw an exception"
				})
			}, Assertion.prototype.empty = function () {
				var t;
				return "object" != typeof this.obj || null === this.obj || isArray(this.obj) ? ("string" != typeof this.obj && expect(this.obj).to.be.an("object"), expect(this.obj).to.have.property("length"), t = !this.obj.length) : t = "number" == typeof this.obj.length ? !this.obj.length : !keys(this.obj).length, this.assert(t, function () {
					return "expected " + i(this.obj) + " to be empty"
				}, function () {
					return "expected " + i(this.obj) + " to not be empty"
				}), this
			}, Assertion.prototype.be = Assertion.prototype.equal = function (t) {
				return this.assert(t === this.obj, function () {
					return "expected " + i(this.obj) + " to equal " + i(t)
				}, function () {
					return "expected " + i(this.obj) + " to not equal " + i(t)
				}), this
			}, Assertion.prototype.eql = function (t) {
				return this.assert(expect.eql(this.obj, t), function () {
					return "expected " + i(this.obj) + " to sort of equal " + i(t)
				}, function () {
					return "expected " + i(this.obj) + " to sort of not equal " + i(t)
				}, t), this
			}, Assertion.prototype.within = function (t, e) {
				var n = t + ".." + e;
				return this.assert(this.obj >= t && this.obj <= e, function () {
					return "expected " + i(this.obj) + " to be within " + n
				}, function () {
					return "expected " + i(this.obj) + " to not be within " + n
				}), this
			}, Assertion.prototype.a = Assertion.prototype.an = function (t) {
				if ("string" == typeof t) {
					var e = /^[aeiou]/.test(t) ? "n" : "";
					this.assert("array" == t ? isArray(this.obj) : "regexp" == t ? isRegExp(this.obj) : "object" == t ? "object" == typeof this.obj && null !== this.obj : t == typeof this.obj, function () {
						return "expected " + i(this.obj) + " to be a" + e + " " + t
					}, function () {
						return "expected " + i(this.obj) + " not to be a" + e + " " + t
					})
				} else {
					var n = t.name || "supplied constructor";
					this.assert(this.obj instanceof t, function () {
						return "expected " + i(this.obj) + " to be an instance of " + n
					}, function () {
						return "expected " + i(this.obj) + " not to be an instance of " + n
					})
				}
				return this
			}, Assertion.prototype.greaterThan = Assertion.prototype.above = function (t) {
				return this.assert(this.obj > t, function () {
					return "expected " + i(this.obj) + " to be above " + t
				}, function () {
					return "expected " + i(this.obj) + " to be below " + t
				}), this
			}, Assertion.prototype.lessThan = Assertion.prototype.below = function (t) {
				return this.assert(this.obj < t, function () {
					return "expected " + i(this.obj) + " to be below " + t
				}, function () {
					return "expected " + i(this.obj) + " to be above " + t
				}), this
			}, Assertion.prototype.match = function (t) {
				return this.assert(t.exec(this.obj), function () {
					return "expected " + i(this.obj) + " to match " + t
				}, function () {
					return "expected " + i(this.obj) + " not to match " + t
				}), this
			}, Assertion.prototype.length = function (t) {
				expect(this.obj).to.have.property("length");
				var e = this.obj.length;
				return this.assert(t == e, function () {
					return "expected " + i(this.obj) + " to have a length of " + t + " but got " + e
				}, function () {
					return "expected " + i(this.obj) + " to not have a length of " + e
				}), this
			}, Assertion.prototype.property = function (t, e) {
				if (this.flags.own) return this.assert(Object.prototype.hasOwnProperty.call(this.obj, t), function () {
					return "expected " + i(this.obj) + " to have own property " + i(t)
				}, function () {
					return "expected " + i(this.obj) + " to not have own property " + i(t)
				}), this;
				if (this.flags.not && void 0 !== e) {
					if (void 0 === this.obj[t]) throw Error(i(this.obj) + " has no property " + i(t))
				} else {
					var n;
					try {
						n = t in this.obj
					} catch (r) {
						n = void 0 !== this.obj[t]
					}
					this.assert(n, function () {
						return "expected " + i(this.obj) + " to have a property " + i(t)
					}, function () {
						return "expected " + i(this.obj) + " to not have a property " + i(t)
					})
				}
				return void 0 !== e && this.assert(e === this.obj[t], function () {
					return "expected " + i(this.obj) + " to have a property " + i(t) + " of " + i(e) + ", but got " + i(this.obj[t])
				}, function () {
					return "expected " + i(this.obj) + " to not have a property " + i(t) + " of " + i(e)
				}), this.obj = this.obj[t], this
			}, Assertion.prototype.string = Assertion.prototype.contain = function (t) {
				return "string" == typeof this.obj ? this.assert(~this.obj.indexOf(t), function () {
					return "expected " + i(this.obj) + " to contain " + i(t)
				}, function () {
					return "expected " + i(this.obj) + " to not contain " + i(t)
				}) : this.assert(~indexOf(this.obj, t), function () {
					return "expected " + i(this.obj) + " to contain " + i(t)
				}, function () {
					return "expected " + i(this.obj) + " to not contain " + i(t)
				}), this
			}, Assertion.prototype.key = Assertion.prototype.keys = function (t) {
				var e, n = !0;
				if (t = isArray(t) ? t : Array.prototype.slice.call(arguments), !t.length) throw Error("keys required");
				var r = keys(this.obj),
					o = t.length;
				if (n = every(t, function (t) {
						return ~indexOf(r, t)
					}), !this.flags.not && this.flags.only && (n = n && t.length == r.length), o > 1) {
					var u = (t = map(t, function (t) {
						return i(t)
					})).pop();
					e = t.join(", ") + ", and " + u
				} else e = i(t[0]);
				return e = (o > 1 ? "keys " : "key ") + e, e = (this.flags.only ? "only have " : "include ") + e, this.assert(n, function () {
					return "expected " + i(this.obj) + " to " + e
				}, function () {
					return "expected " + i(this.obj) + " to not " + e
				}), this
			}, Assertion.prototype.fail = function (t) {
				var e = function () {
					return t || "explicit failure"
				};
				return this.assert(!1, e, e), this
			};
			var getOuterHTML = function (t) {
					if ("outerHTML" in t) return t.outerHTML;
					var e, n = "http://www.w3.org/1999/xhtml",
						r = document.createElementNS(n, "_"),
						o = new XMLSerializer;
					return document.xmlVersion ? o.serializeToString(t) : (r.appendChild(t.cloneNode(!1)), e = r.innerHTML.replace("><", ">" + t.innerHTML + "<"), r.innerHTML = "", e)
				},
				isDOMElement = function (t) {
					return "object" == typeof HTMLElement ? t instanceof HTMLElement : t && "object" == typeof t && 1 === t.nodeType && "string" == typeof t.nodeName
				};

			function i(t, e, n) {
				var r = [];

				function o(t) {
					return t
				}

				function i(t, n) {
					if (t && "function" == typeof t.inspect && t !== exports && !(t.constructor && t.constructor.prototype === t)) return t.inspect(n);
					switch (typeof t) {
						case "undefined":
							return o("undefined", "undefined");
						case "string":
							var u, s, f, c = "'" + json.stringify(t).replace(/^"|"$/g, "").replace(/'/g, "\\'").replace(/\\"/g, '"') + "'";
							return o(c, "string");
						case "number":
							return o("" + t, "number");
						case "boolean":
							return o("" + t, "boolean")
					}
					if (null === t) return o("null", "null");
					if (isDOMElement(t)) return getOuterHTML(t);
					var a = keys(t),
						p = e ? Object.getOwnPropertyNames(t) : a;
					if ("function" == typeof t && 0 === p.length) return isRegExp(t) ? o("" + t, "regexp") : o("[Function" + (t.name ? ": " + t.name : "") + "]", "special");
					if (isDate(t) && 0 === p.length) return o(t.toUTCString(), "date");
					if (t instanceof Error) return o("[" + t.toString() + "]", "Error");
					if (isArray(t) ? (s = "Array", f = ["[", "]"]) : (s = "Object", f = ["{", "}"]), "function" == typeof t) {
						var h = t.name ? ": " + t.name : "";
						u = isRegExp(t) ? " " + t : " [Function" + h + "]"
					} else u = "";
					if (isDate(t) && (u = " " + t.toUTCString()), 0 === p.length) return f[0] + u + f[1];
					if (n < 0) return isRegExp(t) ? o("" + t, "regexp") : o("[Object]", "special");
					r.push(t);
					var l = map(p, function (e) {
						var u, f;
						if (t.__lookupGetter__ && (t.__lookupGetter__(e) ? f = t.__lookupSetter__(e) ? o("[Getter/Setter]", "special") : o("[Getter]", "special") : t.__lookupSetter__(e) && (f = o("[Setter]", "special"))), 0 > indexOf(a, e) && (u = "[" + e + "]"), !f && (0 > indexOf(r, t[e]) ? (f = null === n ? i(t[e]) : i(t[e], n - 1)).indexOf("\n") > -1 && (f = isArray(t) ? map(f.split("\n"), function (t) {
								return "  " + t
							}).join("\n").substr(2) : "\n" + map(f.split("\n"), function (t) {
								return "   " + t
							}).join("\n")) : f = o("[Circular]", "special")), void 0 === u) {
							if ("Array" === s && e.match(/^\d+$/)) return f;
							u = (u = json.stringify("" + e)).match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/) ? o(u = u.substr(1, u.length - 2), "name") : o(u = u.replace(/'/g, "\\'").replace(/\\"/g, '"').replace(/(^"|"$)/g, "'"), "string")
						}
						return u + ": " + f
					});
					r.pop();
					var b = 0;
					return reduce(l, function (t, e) {
						return b++, indexOf(e, "\n") >= 0 && b++, t + e.length + 1
					}, 0) > 50 ? f[0] + ("" === u ? "" : u + "\n ") + " " + l.join(",\n  ") + " " + f[1] : f[0] + u + " " + l.join(", ") + " " + f[1]
				}
				return i(t, void 0 === n ? 2 : n)
			}

			function isArray(t) {
				return "[object Array]" === Object.prototype.toString.call(t)
			}

			function isRegExp(t) {
				var e;
				try {
					e = "" + t
				} catch (n) {
					return !1
				}
				return t instanceof RegExp || "function" == typeof t && "RegExp" === t.constructor.name && t.compile && t.test && t.exec && e.match(/^\/.*\/[gim]{0,3}$/)
			}

			function isDate(t) {
				return t instanceof Date
			}

			function keys(t) {
				if (Object.keys) return Object.keys(t);
				var e = [];
				for (var n in t) Object.prototype.hasOwnProperty.call(t, n) && e.push(n);
				return e
			}

			function map(t, e, n) {
				if (Array.prototype.map) return Array.prototype.map.call(t, e, n);
				for (var r = Array(t.length), o = 0, i = t.length; o < i; o++) o in t && (r[o] = e.call(n, t[o], o, t));
				return r
			}

			function reduce(t, e) {
				if (Array.prototype.reduce) return Array.prototype.reduce.apply(t, Array.prototype.slice.call(arguments, 1));
				var n = +this.length;
				if ("function" != typeof e || 0 === n && 1 === arguments.length) throw TypeError();
				var r = 0;
				if (arguments.length >= 2) var o = arguments[1];
				else
					for (;;) {
						if (r in this) {
							o = this[r++];
							break
						}
						if (++r >= n) throw TypeError()
					}
				for (; r < n; r++) r in this && (o = e.call(null, o, this[r], r, this));
				return o
			}

			function isUndefinedOrNull(t) {
				return null == t
			}

			function isArguments(t) {
				return "[object Arguments]" == Object.prototype.toString.call(t)
			}

			function regExpEquiv(t, e) {
				return t.source === e.source && t.global === e.global && t.ignoreCase === e.ignoreCase && t.multiline === e.multiline
			}

			function objEquiv(t, e) {
				if (isUndefinedOrNull(t) || isUndefinedOrNull(e) || t.prototype !== e.prototype) return !1;
				if (isArguments(t)) return !!isArguments(e) && (t = pSlice.call(t), e = pSlice.call(e), expect.eql(t, e));
				try {
					var n, r, o = keys(t),
						i = keys(e)
				} catch (u) {
					return !1
				}
				if (o.length != i.length) return !1;
				for (o.sort(), i.sort(), r = o.length - 1; r >= 0; r--)
					if (o[r] != i[r]) return !1;
				for (r = o.length - 1; r >= 0; r--)
					if (n = o[r], !expect.eql(t[n], e[n])) return !1;
				return !0
			}
			expect.stringify = i, expect.eql = function t(e, n) {
				if (e === n) return !0;
				if ("undefined" != typeof Buffer && Buffer.isBuffer(e) && Buffer.isBuffer(n)) {
					if (e.length != n.length) return !1;
					for (var r = 0; r < e.length; r++)
						if (e[r] !== n[r]) return !1;
					return !0
				}
				if (e instanceof Date && n instanceof Date) return e.getTime() === n.getTime();
				if ("object" != typeof e && "object" != typeof n) return e == n;
				if (isRegExp(e) && isRegExp(n)) return regExpEquiv(e, n);
				else return objEquiv(e, n)
			};
			var json = function () {
				"use strict";
				if ("object" == typeof JSON && JSON.parse && JSON.stringify) return {
					parse: nativeJSON.parse,
					stringify: nativeJSON.stringify
				};
				var JSON = {};

				function f(t) {
					return t < 10 ? "0" + t : t
				}

				function date(t, e) {
					return isFinite(t.valueOf()) ? t.getUTCFullYear() + "-" + f(t.getUTCMonth() + 1) + "-" + f(t.getUTCDate()) + "T" + f(t.getUTCHours()) + ":" + f(t.getUTCMinutes()) + ":" + f(t.getUTCSeconds()) + "Z" : null
				}
				var gap, indent, rep, cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
					escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
					meta = {
						"\b": "\\b",
						"	": "\\t",
						"\n": "\\n",
						"\f": "\\f",
						"\r": "\\r",
						'"': '\\"',
						"\\": "\\\\"
					};

				function quote(t) {
					return escapable.lastIndex = 0, escapable.test(t) ? '"' + t.replace(escapable, function (t) {
						var e = meta[t];
						return "string" == typeof e ? e : "\\u" + ("0000" + t.charCodeAt(0).toString(16)).slice(-4)
					}) + '"' : '"' + t + '"'
				}

				function str(t, e) {
					var n, r, o, i, u, s = gap,
						f = e[t];
					switch (f instanceof Date && (f = date(t)), "function" == typeof rep && (f = rep.call(e, t, f)), typeof f) {
						case "string":
							return quote(f);
						case "number":
							return isFinite(f) ? String(f) : "null";
						case "boolean":
						case "null":
							return String(f);
						case "object":
							if (!f) return "null";
							if (gap += indent, u = [], "[object Array]" === Object.prototype.toString.apply(f)) {
								for (n = 0, i = f.length; n < i; n += 1) u[n] = str(n, f) || "null";
								return o = 0 === u.length ? "[]" : gap ? "[\n" + gap + u.join(",\n" + gap) + "\n" + s + "]" : "[" + u.join(",") + "]", gap = s, o
							}
							if (rep && "object" == typeof rep)
								for (n = 0, i = rep.length; n < i; n += 1) "string" == typeof rep[n] && (o = str(r = rep[n], f)) && u.push(quote(r) + (gap ? ": " : ":") + o);
							else
								for (r in f) Object.prototype.hasOwnProperty.call(f, r) && (o = str(r, f)) && u.push(quote(r) + (gap ? ": " : ":") + o);
							return o = 0 === u.length ? "{}" : gap ? "{\n" + gap + u.join(",\n" + gap) + "\n" + s + "}" : "{" + u.join(",") + "}", gap = s, o
					}
				}
				return JSON.stringify = function (t, e, n) {
					var r;
					if (gap = "", indent = "", "number" == typeof n)
						for (r = 0; r < n; r += 1) indent += " ";
					else "string" == typeof n && (indent = n);
					if (rep = e, e && "function" != typeof e && ("object" != typeof e || "number" != typeof e.length)) throw Error("JSON.stringify");
					return str("", {
						"": t
					})
				}, JSON.parse = function (text, reviver) {
					var j;

					function walk(t, e) {
						var n, r, o = t[e];
						if (o && "object" == typeof o)
							for (n in o) Object.prototype.hasOwnProperty.call(o, n) && (void 0 !== (r = walk(o, n)) ? o[n] = r : delete o[n]);
						return reviver.call(t, e, o)
					}
					if (text = String(text), cx.lastIndex = 0, cx.test(text) && (text = text.replace(cx, function (t) {
							return "\\u" + ("0000" + t.charCodeAt(0).toString(16)).slice(-4)
						})), /^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, "@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, "]").replace(/(?:^|:|,)(?:\s*\[)+/g, ""))) return j = eval("(" + text + ")"), "function" == typeof reviver ? walk({
						"": j
					}, "") : j;
					throw SyntaxError("JSON.parse")
				}, JSON
			}();
			"undefined" != typeof window && (window.expect = module.exports)
		}(this, "undefined" != typeof module ? module : {
			exports: {}
		});

		// jquery (na verdade, cash)
		// https://github.com/fabiospampinato/cash
		// TODO: colocar num arquivo de script
		(function () {
			"use strict";
			var C = document,
				D = window,
				st = C.documentElement,
				L = C.createElement.bind(C),
				ft = L("div"),
				q = L("table"),
				Mt = L("tbody"),
				ot = L("tr"),
				H = Array.isArray,
				S = Array.prototype,
				Dt = S.concat,
				U = S.filter,
				at = S.indexOf,
				ct = S.map,
				Bt = S.push,
				ht = S.slice,
				z = S.some,
				_t = S.splice,
				Pt = /^#(?:[\w-]|\\.|[^\x00-\xa0])*$/,
				Ht = /^\.(?:[\w-]|\\.|[^\x00-\xa0])*$/,
				$t = /<.+>/,
				jt = /^\w+$/;

			function J(t, n) {
				var r = It(n);
				return !t || !r && !A(n) && !c(n) ? [] : !r && Ht.test(t) ? n.getElementsByClassName(t.slice(1).replace(/\\/g, "")) : !r && jt.test(t) ? n.getElementsByTagName(t) : n.querySelectorAll(t)
			}
			var dt = function () {
					function t(n, r) {
						if (n) {
							if (Y(n)) return n;
							var i = n;
							if (g(n)) {
								var e = r || C;
								if (i = Pt.test(n) && A(e) ? e.getElementById(n.slice(1).replace(/\\/g, "")) : $t.test(n) ? yt(n) : Y(e) ? e.find(n) : g(e) ? o(e).find(n) : J(n, e), !i) return
							} else if (O(n)) return this.ready(n);
							(i.nodeType || i === D) && (i = [i]), this.length = i.length;
							for (var s = 0, f = this.length; s < f; s++) this[s] = i[s]
						}
					}
					return t.prototype.init = function (n, r) {
						return new t(n, r)
					}, t
				}(),
				u = dt.prototype,
				o = u.init;
			o.fn = o.prototype = u, u.length = 0, u.splice = _t, typeof Symbol == "function" && (u[Symbol.iterator] = S[Symbol.iterator]);

			function Y(t) {
				return t instanceof dt
			}

			function B(t) {
				return !!t && t === t.window
			}

			function A(t) {
				return !!t && t.nodeType === 9
			}

			function It(t) {
				return !!t && t.nodeType === 11
			}

			function c(t) {
				return !!t && t.nodeType === 1
			}

			function Ft(t) {
				return !!t && t.nodeType === 3
			}

			function Wt(t) {
				return typeof t == "boolean"
			}

			function O(t) {
				return typeof t == "function"
			}

			function g(t) {
				return typeof t == "string"
			}

			function v(t) {
				return t === void 0
			}

			function P(t) {
				return t === null
			}

			function lt(t) {
				return !isNaN(parseFloat(t)) && isFinite(t)
			}

			function G(t) {
				if (typeof t != "object" || t === null) return !1;
				var n = Object.getPrototypeOf(t);
				return n === null || n === Object.prototype
			}
			o.isWindow = B, o.isFunction = O, o.isArray = H, o.isNumeric = lt, o.isPlainObject = G;

			function d(t, n, r) {
				if (r) {
					for (var i = t.length; i--;)
						if (n.call(t[i], i, t[i]) === !1) return t
				} else if (G(t))
					for (var e = Object.keys(t), i = 0, s = e.length; i < s; i++) {
						var f = e[i];
						if (n.call(t[f], f, t[f]) === !1) return t
					} else
						for (var i = 0, s = t.length; i < s; i++)
							if (n.call(t[i], i, t[i]) === !1) return t;
				return t
			}
			o.each = d, u.each = function (t) {
				return d(this, t)
			}, u.empty = function () {
				return this.each(function (t, n) {
					for (; n.firstChild;) n.removeChild(n.firstChild)
				})
			};

			function $() {
				for (var t = [], n = 0; n < arguments.length; n++) t[n] = arguments[n];
				var r = Wt(t[0]) ? t.shift() : !1,
					i = t.shift(),
					e = t.length;
				if (!i) return {};
				if (!e) return $(r, o, i);
				for (var s = 0; s < e; s++) {
					var f = t[s];
					for (var a in f) r && (H(f[a]) || G(f[a])) ? ((!i[a] || i[a].constructor !== f[a].constructor) && (i[a] = new f[a].constructor), $(r, i[a], f[a])) : i[a] = f[a]
				}
				return i
			}
			o.extend = $, u.extend = function (t) {
				return $(u, t)
			};
			var qt = /\S+/g;

			function j(t) {
				return g(t) ? t.match(qt) || [] : []
			}
			u.toggleClass = function (t, n) {
				var r = j(t),
					i = !v(n);
				return this.each(function (e, s) {
					c(s) && d(r, function (f, a) {
						i ? n ? s.classList.add(a) : s.classList.remove(a) : s.classList.toggle(a)
					})
				})
			}, u.addClass = function (t) {
				return this.toggleClass(t, !0)
			}, u.removeAttr = function (t) {
				var n = j(t);
				return this.each(function (r, i) {
					c(i) && d(n, function (e, s) {
						i.removeAttribute(s)
					})
				})
			};

			function Ut(t, n) {
				if (t) {
					if (g(t)) {
						if (arguments.length < 2) {
							if (!this[0] || !c(this[0])) return;
							var r = this[0].getAttribute(t);
							return P(r) ? void 0 : r
						}
						return v(n) ? this : P(n) ? this.removeAttr(t) : this.each(function (e, s) {
							c(s) && s.setAttribute(t, n)
						})
					}
					for (var i in t) this.attr(i, t[i]);
					return this
				}
			}
			u.attr = Ut, u.removeClass = function (t) {
				return arguments.length ? this.toggleClass(t, !1) : this.attr("class", "")
			}, u.hasClass = function (t) {
				return !!t && z.call(this, function (n) {
					return c(n) && n.classList.contains(t)
				})
			}, u.get = function (t) {
				return v(t) ? ht.call(this) : (t = Number(t), this[t < 0 ? t + this.length : t])
			}, u.eq = function (t) {
				return o(this.get(t))
			}, u.first = function () {
				return this.eq(0)
			}, u.last = function () {
				return this.eq(-1)
			};

			function zt(t) {
				return v(t) ? this.get().map(function (n) {
					return c(n) || Ft(n) ? n.textContent : ""
				}).join("") : this.each(function (n, r) {
					c(r) && (r.textContent = t)
				})
			}
			u.text = zt;

			function T(t, n, r) {
				if (c(t)) {
					var i = D.getComputedStyle(t, null);
					return r ? i.getPropertyValue(n) || void 0 : i[n] || t.style[n]
				}
			}

			function E(t, n) {
				return parseInt(T(t, n), 10) || 0
			}

			function gt(t, n) {
				return E(t, "border".concat(n ? "Left" : "Top", "Width")) + E(t, "padding".concat(n ? "Left" : "Top")) + E(t, "padding".concat(n ? "Right" : "Bottom")) + E(t, "border".concat(n ? "Right" : "Bottom", "Width"))
			}
			var X = {};

			function Jt(t) {
				if (X[t]) return X[t];
				var n = L(t);
				C.body.insertBefore(n, null);
				var r = T(n, "display");
				return C.body.removeChild(n), X[t] = r !== "none" ? r : "block"
			}

			function vt(t) {
				return T(t, "display") === "none"
			}

			function pt(t, n) {
				var r = t && (t.matches || t.webkitMatchesSelector || t.msMatchesSelector);
				return !!r && !!n && r.call(t, n)
			}

			function I(t) {
				return g(t) ? function (n, r) {
					return pt(r, t)
				} : O(t) ? t : Y(t) ? function (n, r) {
					return t.is(r)
				} : t ? function (n, r) {
					return r === t
				} : function () {
					return !1
				}
			}
			u.filter = function (t) {
				var n = I(t);
				return o(U.call(this, function (r, i) {
					return n.call(r, i, r)
				}))
			};

			function x(t, n) {
				return n ? t.filter(n) : t
			}
			u.detach = function (t) {
				return x(this, t).each(function (n, r) {
					r.parentNode && r.parentNode.removeChild(r)
				}), this
			};
			var Yt = /^\s*<(\w+)[^>]*>/,
				Gt = /^<(\w+)\s*\/?>(?:<\/\1>)?$/,
				mt = {
					"*": ft,
					tr: Mt,
					td: ot,
					th: ot,
					thead: q,
					tbody: q,
					tfoot: q
				};

			function yt(t) {
				if (!g(t)) return [];
				if (Gt.test(t)) return [L(RegExp.$1)];
				var n = Yt.test(t) && RegExp.$1,
					r = mt[n] || mt["*"];
				return r.innerHTML = t, o(r.childNodes).detach().get()
			}
			o.parseHTML = yt, u.has = function (t) {
				var n = g(t) ? function (r, i) {
					return J(t, i).length
				} : function (r, i) {
					return i.contains(t)
				};
				return this.filter(n)
			}, u.not = function (t) {
				var n = I(t);
				return this.filter(function (r, i) {
					return (!g(t) || c(i)) && !n.call(i, r, i)
				})
			};

			function R(t, n, r, i) {
				for (var e = [], s = O(n), f = i && I(i), a = 0, y = t.length; a < y; a++)
					if (s) {
						var h = n(t[a]);
						h.length && Bt.apply(e, h)
					} else
						for (var p = t[a][n]; p != null && !(i && f(-1, p));) e.push(p), p = r ? p[n] : null;
				return e
			}

			function bt(t) {
				return t.multiple && t.options ? R(U.call(t.options, function (n) {
					return n.selected && !n.disabled && !n.parentNode.disabled
				}), "value") : t.value || ""
			}

			function Xt(t) {
				return arguments.length ? this.each(function (n, r) {
					var i = r.multiple && r.options;
					if (i || Ot.test(r.type)) {
						var e = H(t) ? ct.call(t, String) : P(t) ? [] : [String(t)];
						i ? d(r.options, function (s, f) {
							f.selected = e.indexOf(f.value) >= 0
						}, !0) : r.checked = e.indexOf(r.value) >= 0
					} else r.value = v(t) || P(t) ? "" : t
				}) : this[0] && bt(this[0])
			}
			u.val = Xt, u.is = function (t) {
				var n = I(t);
				return z.call(this, function (r, i) {
					return n.call(r, i, r)
				})
			}, o.guid = 1;

			function w(t) {
				return t.length > 1 ? U.call(t, function (n, r, i) {
					return at.call(i, n) === r
				}) : t
			}
			o.unique = w, u.add = function (t, n) {
				return o(w(this.get().concat(o(t, n).get())))
			}, u.children = function (t) {
				return x(o(w(R(this, function (n) {
					return n.children
				}))), t)
			}, u.parent = function (t) {
				return x(o(w(R(this, "parentNode"))), t)
			}, u.index = function (t) {
				var n = t ? o(t)[0] : this[0],
					r = t ? this : o(n).parent().children();
				return at.call(r, n)
			}, u.closest = function (t) {
				var n = this.filter(t);
				if (n.length) return n;
				var r = this.parent();
				return r.length ? r.closest(t) : n
			}, u.siblings = function (t) {
				return x(o(w(R(this, function (n) {
					return o(n).parent().children().not(n)
				}))), t)
			}, u.find = function (t) {
				return o(w(R(this, function (n) {
					return J(t, n)
				})))
			};
			var Kt = /^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g,
				Qt = /^$|^module$|\/(java|ecma)script/i,
				Vt = ["type", "src", "nonce", "noModule"];

			function Zt(t, n) {
				var r = o(t);
				r.filter("script").add(r.find("script")).each(function (i, e) {
					if (Qt.test(e.type) && st.contains(e)) {
						var s = L("script");
						s.text = e.textContent.replace(Kt, ""), d(Vt, function (f, a) {
							e[a] && (s[a] = e[a])
						}), n.head.insertBefore(s, null), n.head.removeChild(s)
					}
				})
			}

			function kt(t, n, r, i, e) {
				i ? t.insertBefore(n, r ? t.firstChild : null) : t.nodeName === "HTML" ? t.parentNode.replaceChild(n, t) : t.parentNode.insertBefore(n, r ? t : t.nextSibling), e && Zt(n, t.ownerDocument)
			}

			function N(t, n, r, i, e, s, f, a) {
				return d(t, function (y, h) {
					d(o(h), function (p, M) {
						d(o(n), function (b, W) {
							var rt = r ? M : W,
								it = r ? W : M,
								m = r ? p : b;
							kt(rt, m ? it.cloneNode(!0) : it, i, e, !m)
						}, a)
					}, f)
				}, s), n
			}
			u.after = function () {
				return N(arguments, this, !1, !1, !1, !0, !0)
			}, u.append = function () {
				return N(arguments, this, !1, !1, !0)
			};

			function tn(t) {
				if (!arguments.length) return this[0] && this[0].innerHTML;
				if (v(t)) return this;
				var n = /<script[\s>]/.test(t);
				return this.each(function (r, i) {
					c(i) && (n ? o(i).empty().append(t) : i.innerHTML = t)
				})
			}
			u.html = tn, u.appendTo = function (t) {
				return N(arguments, this, !0, !1, !0)
			}, u.wrapInner = function (t) {
				return this.each(function (n, r) {
					var i = o(r),
						e = i.contents();
					e.length ? e.wrapAll(t) : i.append(t)
				})
			}, u.before = function () {
				return N(arguments, this, !1, !0)
			}, u.wrapAll = function (t) {
				for (var n = o(t), r = n[0]; r.children.length;) r = r.firstElementChild;
				return this.first().before(n), this.appendTo(r)
			}, u.wrap = function (t) {
				return this.each(function (n, r) {
					var i = o(t)[0];
					o(r).wrapAll(n ? i.cloneNode(!0) : i)
				})
			}, u.insertAfter = function (t) {
				return N(arguments, this, !0, !1, !1, !1, !1, !0)
			}, u.insertBefore = function (t) {
				return N(arguments, this, !0, !0)
			}, u.prepend = function () {
				return N(arguments, this, !1, !0, !0, !0, !0)
			}, u.prependTo = function (t) {
				return N(arguments, this, !0, !0, !0, !1, !1, !0)
			}, u.contents = function () {
				return o(w(R(this, function (t) {
					return t.tagName === "IFRAME" ? [t.contentDocument] : t.tagName === "TEMPLATE" ? t.content.childNodes : t.childNodes
				})))
			}, u.next = function (t, n, r) {
				return x(o(w(R(this, "nextElementSibling", n, r))), t)
			}, u.nextAll = function (t) {
				return this.next(t, !0)
			}, u.nextUntil = function (t, n) {
				return this.next(n, !0, t)
			}, u.parents = function (t, n) {
				return x(o(w(R(this, "parentElement", !0, n))), t)
			}, u.parentsUntil = function (t, n) {
				return this.parents(n, t)
			}, u.prev = function (t, n, r) {
				return x(o(w(R(this, "previousElementSibling", n, r))), t)
			}, u.prevAll = function (t) {
				return this.prev(t, !0)
			}, u.prevUntil = function (t, n) {
				return this.prev(n, !0, t)
			}, u.map = function (t) {
				return o(Dt.apply([], ct.call(this, function (n, r) {
					return t.call(n, r, n)
				})))
			}, u.clone = function () {
				return this.map(function (t, n) {
					return n.cloneNode(!0)
				})
			}, u.offsetParent = function () {
				return this.map(function (t, n) {
					for (var r = n.offsetParent; r && T(r, "position") === "static";) r = r.offsetParent;
					return r || st
				})
			}, u.slice = function (t, n) {
				return o(ht.call(this, t, n))
			};
			var nn = /-([a-z])/g;

			function K(t) {
				return t.replace(nn, function (n, r) {
					return r.toUpperCase()
				})
			}
			u.ready = function (t) {
				var n = function () {
					return setTimeout(t, 0, o)
				};
				return C.readyState !== "loading" ? n() : C.addEventListener("DOMContentLoaded", n), this
			}, u.unwrap = function () {
				return this.parent().each(function (t, n) {
					if (n.tagName !== "BODY") {
						var r = o(n);
						r.replaceWith(r.children())
					}
				}), this
			}, u.offset = function () {
				var t = this[0];
				if (t) {
					var n = t.getBoundingClientRect();
					return {
						top: n.top + D.pageYOffset,
						left: n.left + D.pageXOffset
					}
				}
			}, u.position = function () {
				var t = this[0];
				if (t) {
					var n = T(t, "position") === "fixed",
						r = n ? t.getBoundingClientRect() : this.offset();
					if (!n) {
						for (var i = t.ownerDocument, e = t.offsetParent || i.documentElement;
							(e === i.body || e === i.documentElement) && T(e, "position") === "static";) e = e.parentNode;
						if (e !== t && c(e)) {
							var s = o(e).offset();
							r.top -= s.top + E(e, "borderTopWidth"), r.left -= s.left + E(e, "borderLeftWidth")
						}
					}
					return {
						top: r.top - E(t, "marginTop"),
						left: r.left - E(t, "marginLeft")
					}
				}
			};
			var Et = {
				class: "className",
				contenteditable: "contentEditable",
				for: "htmlFor",
				readonly: "readOnly",
				maxlength: "maxLength",
				tabindex: "tabIndex",
				colspan: "colSpan",
				rowspan: "rowSpan",
				usemap: "useMap"
			};
			u.prop = function (t, n) {
				if (t) {
					if (g(t)) return t = Et[t] || t, arguments.length < 2 ? this[0] && this[0][t] : this.each(function (i, e) {
						e[t] = n
					});
					for (var r in t) this.prop(r, t[r]);
					return this
				}
			}, u.removeProp = function (t) {
				return this.each(function (n, r) {
					delete r[Et[t] || t]
				})
			};
			var rn = /^--/;

			function Q(t) {
				return rn.test(t)
			}
			var V = {},
				en = ft.style,
				un = ["webkit", "moz", "ms"];

			function sn(t, n) {
				if (n === void 0 && (n = Q(t)), n) return t;
				if (!V[t]) {
					var r = K(t),
						i = "".concat(r[0].toUpperCase()).concat(r.slice(1)),
						e = "".concat(r, " ").concat(un.join("".concat(i, " "))).concat(i).split(" ");
					d(e, function (s, f) {
						if (f in en) return V[t] = f, !1
					})
				}
				return V[t]
			}
			var fn = {
				animationIterationCount: !0,
				columnCount: !0,
				flexGrow: !0,
				flexShrink: !0,
				fontWeight: !0,
				gridArea: !0,
				gridColumn: !0,
				gridColumnEnd: !0,
				gridColumnStart: !0,
				gridRow: !0,
				gridRowEnd: !0,
				gridRowStart: !0,
				lineHeight: !0,
				opacity: !0,
				order: !0,
				orphans: !0,
				widows: !0,
				zIndex: !0
			};

			function wt(t, n, r) {
				return r === void 0 && (r = Q(t)), !r && !fn[t] && lt(n) ? "".concat(n, "px") : n
			}

			function on(t, n) {
				if (g(t)) {
					var r = Q(t);
					return t = sn(t, r), arguments.length < 2 ? this[0] && T(this[0], t, r) : t ? (n = wt(t, n, r), this.each(function (e, s) {
						c(s) && (r ? s.style.setProperty(t, n) : s.style[t] = n)
					})) : this
				}
				for (var i in t) this.css(i, t[i]);
				return this
			}
			u.css = on;

			function Ct(t, n) {
				try {
					return t(n)
				} catch {
					return n
				}
			}
			var an = /^\s+|\s+$/;

			function St(t, n) {
				var r = t.dataset[n] || t.dataset[K(n)];
				return an.test(r) ? r : Ct(JSON.parse, r)
			}

			function cn(t, n, r) {
				r = Ct(JSON.stringify, r), t.dataset[K(n)] = r
			}

			function hn(t, n) {
				if (!t) {
					if (!this[0]) return;
					var r = {};
					for (var i in this[0].dataset) r[i] = St(this[0], i);
					return r
				}
				if (g(t)) return arguments.length < 2 ? this[0] && St(this[0], t) : v(n) ? this : this.each(function (e, s) {
					cn(s, t, n)
				});
				for (var i in t) this.data(i, t[i]);
				return this
			}
			u.data = hn;

			function Tt(t, n) {
				var r = t.documentElement;
				return Math.max(t.body["scroll".concat(n)], r["scroll".concat(n)], t.body["offset".concat(n)], r["offset".concat(n)], r["client".concat(n)])
			}
			d([!0, !1], function (t, n) {
				d(["Width", "Height"], function (r, i) {
					var e = "".concat(n ? "outer" : "inner").concat(i);
					u[e] = function (s) {
						if (this[0]) return B(this[0]) ? n ? this[0]["inner".concat(i)] : this[0].document.documentElement["client".concat(i)] : A(this[0]) ? Tt(this[0], i) : this[0]["".concat(n ? "offset" : "client").concat(i)] + (s && n ? E(this[0], "margin".concat(r ? "Top" : "Left")) + E(this[0], "margin".concat(r ? "Bottom" : "Right")) : 0)
					}
				})
			}), d(["Width", "Height"], function (t, n) {
				var r = n.toLowerCase();
				u[r] = function (i) {
					if (!this[0]) return v(i) ? void 0 : this;
					if (!arguments.length) return B(this[0]) ? this[0].document.documentElement["client".concat(n)] : A(this[0]) ? Tt(this[0], n) : this[0].getBoundingClientRect()[r] - gt(this[0], !t);
					var e = parseInt(i, 10);
					return this.each(function (s, f) {
						if (c(f)) {
							var a = T(f, "boxSizing");
							f.style[r] = wt(r, e + (a === "border-box" ? gt(f, !t) : 0))
						}
					})
				}
			});
			var Rt = "___cd";
			u.toggle = function (t) {
				return this.each(function (n, r) {
					if (c(r)) {
						var i = vt(r),
							e = v(t) ? i : t;
						e ? (r.style.display = r[Rt] || "", vt(r) && (r.style.display = Jt(r.tagName))) : i || (r[Rt] = T(r, "display"), r.style.display = "none")
					}
				})
			}, u.hide = function () {
				return this.toggle(!1)
			}, u.show = function () {
				return this.toggle(!0)
			};
			var xt = "___ce",
				Z = ".",
				k = {
					focus: "focusin",
					blur: "focusout"
				},
				Nt = {
					mouseenter: "mouseover",
					mouseleave: "mouseout"
				},
				dn = /^(mouse|pointer|contextmenu|drag|drop|click|dblclick)/i;

			function tt(t) {
				return Nt[t] || k[t] || t
			}

			function nt(t) {
				var n = t.split(Z);
				return [n[0], n.slice(1).sort()]
			}
			u.trigger = function (t, n) {
				if (g(t)) {
					var r = nt(t),
						i = r[0],
						e = r[1],
						s = tt(i);
					if (!s) return this;
					var f = dn.test(s) ? "MouseEvents" : "HTMLEvents";
					t = C.createEvent(f), t.initEvent(s, !0, !0), t.namespace = e.join(Z), t.___ot = i
				}
				t.___td = n;
				var a = t.___ot in k;
				return this.each(function (y, h) {
					a && O(h[t.___ot]) && (h["___i".concat(t.type)] = !0, h[t.___ot](), h["___i".concat(t.type)] = !1), h.dispatchEvent(t)
				})
			};

			function Lt(t) {
				return t[xt] = t[xt] || {}
			}

			function ln(t, n, r, i, e) {
				var s = Lt(t);
				s[n] = s[n] || [], s[n].push([r, i, e]), t.addEventListener(n, e)
			}

			function At(t, n) {
				return !n || !z.call(n, function (r) {
					return t.indexOf(r) < 0
				})
			}

			function F(t, n, r, i, e) {
				var s = Lt(t);
				if (n) s[n] && (s[n] = s[n].filter(function (f) {
					var a = f[0],
						y = f[1],
						h = f[2];
					if (e && h.guid !== e.guid || !At(a, r) || i && i !== y) return !0;
					t.removeEventListener(n, h)
				}));
				else
					for (n in s) F(t, n, r, i, e)
			}
			u.off = function (t, n, r) {
				var i = this;
				if (v(t)) this.each(function (s, f) {
					!c(f) && !A(f) && !B(f) || F(f)
				});
				else if (g(t)) O(n) && (r = n, n = ""), d(j(t), function (s, f) {
					var a = nt(f),
						y = a[0],
						h = a[1],
						p = tt(y);
					i.each(function (M, b) {
						!c(b) && !A(b) && !B(b) || F(b, p, h, n, r)
					})
				});
				else
					for (var e in t) this.off(e, t[e]);
				return this
			}, u.remove = function (t) {
				return x(this, t).detach().off(), this
			}, u.replaceWith = function (t) {
				return this.before(t).remove()
			}, u.replaceAll = function (t) {
				return o(t).replaceWith(this), this
			};

			function gn(t, n, r, i, e) {
				var s = this;
				if (!g(t)) {
					for (var f in t) this.on(f, n, r, t[f], e);
					return this
				}
				return g(n) || (v(n) || P(n) ? n = "" : v(r) ? (r = n, n = "") : (i = r, r = n, n = "")), O(i) || (i = r, r = void 0), i ? (d(j(t), function (a, y) {
					var h = nt(y),
						p = h[0],
						M = h[1],
						b = tt(p),
						W = p in Nt,
						rt = p in k;
					b && s.each(function (it, m) {
						if (!(!c(m) && !A(m) && !B(m))) {
							var et = function (l) {
								if (l.target["___i".concat(l.type)]) return l.stopImmediatePropagation();
								if (!(l.namespace && !At(M, l.namespace.split(Z))) && !(!n && (rt && (l.target !== m || l.___ot === b) || W && l.relatedTarget && m.contains(l.relatedTarget)))) {
									var ut = m;
									if (n) {
										for (var _ = l.target; !pt(_, n);)
											if (_ === m || (_ = _.parentNode, !_)) return;
										ut = _
									}
									Object.defineProperty(l, "currentTarget", {
										configurable: !0,
										get: function () {
											return ut
										}
									}), Object.defineProperty(l, "delegateTarget", {
										configurable: !0,
										get: function () {
											return m
										}
									}), Object.defineProperty(l, "data", {
										configurable: !0,
										get: function () {
											return r
										}
									});
									var bn = i.call(ut, l, l.___td);
									e && F(m, b, M, n, et), bn === !1 && (l.preventDefault(), l.stopPropagation())
								}
							};
							et.guid = i.guid = i.guid || o.guid++, ln(m, b, M, n, et)
						}
					})
				}), this) : this
			}
			u.on = gn;

			function vn(t, n, r, i) {
				return this.on(t, n, r, i, !0)
			}
			u.one = vn;
			var pn = /\r?\n/g;

			function mn(t, n) {
				return "&".concat(encodeURIComponent(t), "=").concat(encodeURIComponent(n.replace(pn, `\r`)))
			}
			var yn = /file|reset|submit|button|image/i,
				Ot = /radio|checkbox/i;
			u.serialize = function () {
				var t = "";
				return this.each(function (n, r) {
					d(r.elements || [r], function (i, e) {
						if (!(e.disabled || !e.name || e.tagName === "FIELDSET" || yn.test(e.type) || Ot.test(e.type) && !e.checked)) {
							var s = bt(e);
							if (!v(s)) {
								var f = H(s) ? s : [s];
								d(f, function (a, y) {
									t += mn(e.name, y)
								})
							}
						}
					})
				}), t.slice(1)
			}, typeof exports < "u" ? module.exports = o : D.cash = D.$ = o
		})();


		// Array que acumula o resultado de todos os testes
		let results = []

		/** 
		 * Executa um teste e registra ele na array results 
		 * @param {string} testDescription - 
		 * @param {function} testFunction - 
		 * */
		function testar(testDescription, testFunction) {
			let status;
			let errorMessage = null;

			try {
				testFunction()
				status = 'passed';
			} catch (e) {
				status = 'not passed';
				errorMessage = e.message
			}

			results.push({
				code: testDescription,
				message: testDescription,
				type: 'notice',
				runnerExtras: {
					status: status,
					errorMessage: errorMessage
				}
			});
		}


		testar('Todas as imagens têm atributo alt', () => {
			const images = $('img');
			images.each(function () {
				expect($(this).attr('alt')).to.be.ok();
			});
		});


		testar('Todas as imagens têm id', () => {
			const images = $('img');
			images.each(function () {
				expect($(this).attr('id')).to.have.ok();
			});
		});



		/*
		 *	Teste: Todos os assets carregaram corretamente
		 *	Descrição: Checa se imagens, scripts, arquivos CSS e outros assets foram carregados
		 *  Tentei usar o page.on, mas esse é o contexto errado pra isso. Esse método run 
		 *  é rodado dentro do browser e o page pertence ao puppeteer.
		 *  A solução é, ou desenvolver um código que faz essa checagem no browser ou
		 *  levar esse teste para o contexto do puppeteer
		 */
		// let assetsWithErrors = []
		// Escuta os eventos de request falha e response recebida
		// page.on('requestfailed', request => {
		// 	assetsWithErrors.push({
		// 			url: request.url(),
		// 			error: request.failure().errorText
		// 	});
		// });
		// testar('Todos os assets carregaram corretamente', () => { 
		// 	expect(assetsWithErrors).to.be.empty
		// })

		/*
		 * Teste: Tag meta charset presente e com valor UTF-8
		 *
		 */
		testar('Tag meta charset presente e com valor UTF-8', () => {
			const metaCharset = $('head>meta[charset]');
			expect(metaCharset.length).to.equal(1);
			expect(metaCharset.attr('charset')).to.equal("UTF-8");
		});

		testar('A tag HTML tem o atributo lang', () => {
			const htmlTag = $('html');
			expect(htmlTag.attr('lang')).to.be.ok();
		});

		function verificarIdsDuplicados() {
			const ids = new Set();
			const idsDuplicados = [];
			const elementosComIds = $('[id]');

			elementosComIds.each((index, element) => {
				const id = $(element).attr('id');
				if (ids.has(id)) {
					idsDuplicados.push(id);
				} else {
					ids.add(id);
				}
			});
			expect(idsDuplicados).to.be.empty;
		}
		testar('Verificação de IDs', () => {
			verificarIdsDuplicados();
		});




		// Não funciona porque estamos no contexto errado. 
		//
		// let externalResources = [];
		// page.on('request', request => {
		// 	const url = new URL(request.url());
		// 	if (url.origin !== location.origin) {
		// 		externalResources.push(request.url());
		// 	}
		// });
		// 
		// testar('Nenhum recurso externo está sendo acessado', () => {
		// 	expect(externalResources).to.be.empty;
		// });

		// Ideias para mais testes
		// – tag HTML possui atributo xml:lang 
		// – atributo xml:lang da tag HTML é igual a pt-BR (ou espanhol ou inglês???)
		// – atributo lang da tag HTML é igual a pt-BR (ou espanhol ou inglês???)
		// – atributo lang da tag BODY é igual a pt-BR (ou espanhol ou inglês???)
		// – tag meta viewport existe e está configurada de forma acessível
		// – Todos os assets são locais
		// – Não tem nenhum link <a href> apontando para fora do livro
		// – Glossários tem link de ida e de volta
		// – Glossários tem a formatação correta (dt, dl, dd)
		// – Não tem IDs duplicados
		// – lista de um item
		// – salto hierárquico
		// – Separador de página (n sei bem como testar ele pq o edital não exige uma markup muito específica)
		//      Tem que ler a spec do PNLD, entender como deve ser a section
		// 
		// - Aquele monte de tag de metadados que o edital pede no index.html
		// - 


		return results
	}

	function processIssue(issue) {
		return {
			code: issue.code,
			message: issue.msg,
			type: issueTypeMap[issue.type] || 'unknown',
			element: issue.element
		};
	}

	// temos que enviar um array de issue, se não quebra
	const results = runCode();
	return results;

};