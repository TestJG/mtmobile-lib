"use strict";
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var _a = require('js-csp'), chan = _a.chan, go = _a.go, spawn = _a.spawn, timeout = _a.timeout, alts = _a.alts, put = _a.put, take = _a.take, putAsync = _a.putAsync;
/**
 * Returns a channel that will produce { value: x } or { error: e } if the first
 * issue of the observable is a value or an error. Afterwards, or if the issue
 * is a complete, the channel will close.
 * @param obs The observable to use a value/error generator
 */
exports.firstToChannel = function (obs, autoClose) {
    if (autoClose === void 0) { autoClose = true; }
    var ch = chan();
    obs.take(1).subscribe({
        next: function (value) {
            go(function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, put(ch, { value: value })];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        },
        error: function (error) {
            go(function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, put(ch, { error: error })];
                        case 1:
                            _a.sent();
                            if (autoClose) {
                                ch.close();
                            }
                            return [2 /*return*/];
                    }
                });
            });
        },
        complete: function () {
            if (autoClose && !ch.isClosed()) {
                ch.close();
            }
        }
    });
    return ch;
};
exports.startLeasing = function (leaseFn, releaseFn, options) {
    var _a = Object.assign({
        timeoutSecs: 60,
        leaseMarginSecs: 15,
        autoClose: true,
    }, options), timeoutSecs = _a.timeoutSecs, leaseMarginSecs = _a.leaseMarginSecs, autoClose = _a.autoClose;
    var leaseCh = chan();
    var pingCh = chan();
    var releaseCh = chan();
    var leaseTimeSecs = timeoutSecs + leaseMarginSecs;
    go(function () {
        var firstTime, leaseResult, endTime, pingCalled, releaseCalled, timeoutCalled, toWait, tout, waitResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    firstTime = true;
                    _a.label = 1;
                case 1:
                    if (!true) return [3 /*break*/, 6];
                    return [4 /*yield*/, take(exports.firstToChannel(leaseFn(leaseTimeSecs), false))];
                case 2:
                    leaseResult = _a.sent();
                    if (!leaseResult || leaseResult.error || !leaseResult.value) {
                        // Signal a lease lost, and stop trying to further lease resource
                        if (firstTime) {
                            putAsync(leaseCh, false);
                        }
                        return [3 /*break*/, 6];
                    }
                    else {
                        if (firstTime) {
                            putAsync(leaseCh, true);
                        }
                    }
                    firstTime = false;
                    endTime = new Date().getTime() + timeoutSecs * 1000;
                    pingCalled = false;
                    releaseCalled = false;
                    timeoutCalled = false;
                    _a.label = 3;
                case 3:
                    if (!(!releaseCalled && !timeoutCalled)) return [3 /*break*/, 5];
                    toWait = endTime - new Date().getTime();
                    if (toWait <= 0) {
                        timeoutCalled = true;
                        return [3 /*break*/, 5];
                    }
                    tout = timeout(toWait);
                    return [4 /*yield*/, alts([pingCh, releaseCh, tout], {
                            priority: true
                        })];
                case 4:
                    waitResult = _a.sent();
                    pingCalled = pingCalled || waitResult.channel === pingCh;
                    releaseCalled =
                        releaseCalled || waitResult.channel === releaseCh;
                    timeoutCalled = timeoutCalled || waitResult.channel === tout;
                    return [3 /*break*/, 3];
                case 5:
                    if (releaseCalled || (timeoutCalled && !pingCalled)) {
                        putAsync(leaseCh, false);
                        return [3 /*break*/, 6];
                    }
                    return [3 /*break*/, 1];
                case 6:
                    releaseFn().subscribe();
                    if (autoClose) {
                        leaseCh.close();
                        pingCh.close();
                        releaseCh.close();
                    }
                    return [2 /*return*/];
            }
        });
    });
    return { leaseCh: leaseCh, pingCh: pingCh, releaseCh: releaseCh };
};
//# sourceMappingURL=csp.js.map