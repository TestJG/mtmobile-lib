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
var js_csp_1 = require("js-csp");
var common_1 = require("./common");
var rxutils_1 = require("./rxutils");
/**
 * Returns a channel that will produce { value: x } or { error: e } if the first
 * issue of the observable is a value or an error. Afterwards, or if the issue
 * is a complete, the channel will close.
 * @param obs The observable to use a value/error generator
 */
exports.firstToChannel = function (obs, channel, autoClose, finishCh) { return exports.observableToChannel(obs.take(1), channel, autoClose); };
exports.observableToChannel = function (obs, channel, autoClose, finishCh) {
    autoClose = typeof autoClose === 'boolean' ? autoClose : !channel;
    var ch = channel || js_csp_1.chan();
    obs.subscribe({
        next: function (value) {
            js_csp_1.go(function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, js_csp_1.put(ch, { value: value })];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        },
        error: function (error) {
            js_csp_1.go(function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, js_csp_1.put(ch, { error: error })];
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
            if (autoClose) {
                ch.close();
            }
        }
    });
    return ch;
};
function startPinging(req) {
    var log, error, result, e_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                log = common_1.conditionalLog(req.logToConsole, { prefix: 'PING: ' });
                log('Start');
                _a.label = 1;
            case 1:
                _a.trys.push([1, 7, , 8]);
                _a.label = 2;
            case 2:
                if (!true) return [3 /*break*/, 6];
                result = js_csp_1.alts([
                    req.cancelCh,
                    js_csp_1.timeout(req.pingTimeMilliseconds)
                ]);
                if (result.channel === req.cancelCh) {
                    log('canceling');
                    return [3 /*break*/, 6];
                }
                if (!req.pingAsync) return [3 /*break*/, 3];
                log('pinging (async)');
                js_csp_1.putAsync(req.pingCh, req.pingValue);
                return [3 /*break*/, 5];
            case 3:
                log('pinging');
                return [4 /*yield*/, js_csp_1.put(req.pingCh, req.pingValue)];
            case 4:
                _a.sent();
                _a.label = 5;
            case 5: return [3 /*break*/, 2];
            case 6: return [3 /*break*/, 8];
            case 7:
                e_1 = _a.sent();
                error = e_1;
                log('ERROR', e_1);
                return [3 /*break*/, 8];
            case 8:
                if (req.onFinish) {
                    req.onFinish(error);
                }
                log('End');
                return [2 /*return*/];
        }
    });
}
exports.startPinging = startPinging;
/**
 * Starts a leasing process that works like so:
 * - A leaseFn is used to borrow a lease for a given duration in seconds.
 *   Upon failure to get the lease the process stops.
 * - Every timeout seconds, a ping is expected from outside the leasing process,
 *   through the channel pingCh. If at least one ping arrives by that time,
 *   the lease is tried to be renewed, otherwise the lease is released and the
 *   process stops.
 * -
 * @param leaseFn   A leasing function to perform a lease for a given amount of
 *                  time. This is a client defined operation. It should accept a
 *                  duration in seconds and return an observable that returns
 *                  true or false whether the lease is acquired for the given
 *                  time or not.
 * @param releaseFn A lease releasing function. This is a client defined
 *                  operation that should release a previously acquired lease.
 *                  It could be called even if no lease is reserved, to ensure
 *                  release.
 * @param options   - timeoutSecs: Represents maximum time in seconds when the
 *                  client is expected to use the ping channel to communicate
 *                  it's interest in keeping the lease. If that time elapses and
 *                  no ping is received the lease will be released.
 *                  - leaseMarginSecs: Represents a margin time in seconds to
 *                  add to timeoutSecs to reserve the lease. After that time the
 *                  underlying lease mechanism could decide to automatically
 *                  release the lease for other processes.
 *                  - autoClose: Indicates whether the lease channels will be
 *                  closed after the process has stopped.
 *                  - logToConsole: Indicates whether the process steps should
 *                  be logged to the console.
 * @returns A lease channels to communicate with the client code, with channels:
 *          - leaseCh:  To communicate lease status. true to indicate the first
 *                      lease acquisition, before that the lease cannot be
 *                      considered taken. false to indicate that the lease was
 *                      not taken or that it was released, due to timeout or
 *                      explicit request.
 */
exports.startLeasing = function (leaseFn, releaseFn, options) {
    var _a = Object.assign({
        timeoutSecs: 60,
        leaseMarginSecs: 15,
        autoClose: true,
        logToConsole: false
    }, options), timeoutSecs = _a.timeoutSecs, leaseMarginSecs = _a.leaseMarginSecs, autoClose = _a.autoClose, logToConsole = _a.logToConsole;
    var log = common_1.conditionalLog(logToConsole, {
        prefix: function () { return "LEASING: "; }
    });
    log('Start');
    var leaseCh = js_csp_1.chan();
    var pingCh = js_csp_1.chan();
    var releaseCh = js_csp_1.chan();
    var leaseTimeSecs = timeoutSecs + leaseMarginSecs;
    js_csp_1.go(function () {
        var firstTime, leaseResult, endTime, pingCalled, releaseCalled, timeoutCalled, toWait, tout, waitResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    firstTime = 0;
                    _a.label = 1;
                case 1:
                    if (!true) return [3 /*break*/, 6];
                    log('MAIN loop #', firstTime);
                    return [4 /*yield*/, js_csp_1.take(exports.firstToChannel(leaseFn(leaseTimeSecs), undefined, false))];
                case 2:
                    leaseResult = _a.sent();
                    if (!leaseResult || leaseResult.error || !leaseResult.value) {
                        // Signal a lease lost, and stop trying to further lease resource
                        if (firstTime === 0) {
                            js_csp_1.putAsync(leaseCh, false);
                        }
                        return [3 /*break*/, 6];
                    }
                    else {
                        if (firstTime === 0) {
                            js_csp_1.putAsync(leaseCh, true);
                        }
                    }
                    firstTime++;
                    endTime = new Date().getTime() + timeoutSecs * 1000;
                    pingCalled = 0;
                    releaseCalled = false;
                    timeoutCalled = false;
                    _a.label = 3;
                case 3:
                    if (!(!releaseCalled && !timeoutCalled)) return [3 /*break*/, 5];
                    log('PING loop #', pingCalled);
                    toWait = endTime - new Date().getTime();
                    if (toWait <= 0) {
                        timeoutCalled = true;
                        return [3 /*break*/, 5];
                    }
                    tout = js_csp_1.timeout(toWait);
                    return [4 /*yield*/, js_csp_1.alts([pingCh, releaseCh, tout], {
                            priority: true
                        })];
                case 4:
                    waitResult = _a.sent();
                    pingCalled =
                        pingCalled + (waitResult.channel === pingCh ? 1 : 0);
                    releaseCalled =
                        releaseCalled || waitResult.channel === releaseCh;
                    timeoutCalled = timeoutCalled || waitResult.channel === tout;
                    return [3 /*break*/, 3];
                case 5:
                    log('TESTING #', pingCalled > 0 ? 'PING' : '', releaseCalled ? 'RELEASE' : '', timeoutCalled ? 'TIMEOUT' : '');
                    if (releaseCalled || (timeoutCalled && pingCalled === 0)) {
                        js_csp_1.putAsync(leaseCh, false);
                        log('Breaking');
                        return [3 /*break*/, 6];
                    }
                    return [3 /*break*/, 1];
                case 6:
                    releaseFn().subscribe();
                    if (autoClose) {
                        log('Closing');
                        leaseCh.close();
                        pingCh.close();
                        releaseCh.close();
                    }
                    log('End');
                    return [2 /*return*/];
            }
        });
    });
    return { leaseCh: leaseCh, pingCh: pingCh, releaseCh: releaseCh };
};
var PipelineTarget = (function () {
    function PipelineTarget(value, options) {
        this.value = value;
        if (!options) {
            this.targetOffset = 1;
        }
        else if (typeof options.targetName === 'string') {
            this.targetName = options.targetName;
        }
        else if (typeof options.targetIndex === 'number') {
            this.targetIndex = options.targetIndex;
        }
        else if (typeof options.targetOffset === 'number') {
            this.targetOffset = options.targetOffset;
        }
        else {
            this.targetOffset = 1;
        }
    }
    PipelineTarget.fromValue = function (value) {
        if (value instanceof PipelineTarget) {
            return value;
        }
        else {
            return new PipelineTarget(value);
        }
    };
    PipelineTarget.prototype.select = function (dict, currentIndex) {
        if (this.targetName) {
            if (!dict.has(this.targetName)) {
                throw new Error("Expected to find element with name " + this.targetName);
            }
            return dict.get(this.targetName);
        }
        else {
            var index = typeof this.targetIndex === 'number'
                ? this.targetIndex
                : typeof this.targetOffset === 'number'
                    ? currentIndex + this.targetOffset
                    : currentIndex;
            if (!dict.has(index)) {
                throw new Error("Expected to find element with index " + index);
            }
            return dict.get(index);
        }
    };
    return PipelineTarget;
}());
exports.PipelineTarget = PipelineTarget;
exports.runPipelineNode = function (req, options) {
    var opts = Object.assign({
        logToConsole: false
    }, options);
    var name = req.name;
    var log = common_1.conditionalLog(opts.logToConsole, {
        prefix: "PIPELINE NODE [" + name + "]: "
    });
    var outputCh = req.outputCh;
    var inputCh = common_1.getAsValue(req.inputCh) || js_csp_1.chan(req.bufferSize);
    var cancelCh = req.cancelCh || js_csp_1.chan();
    var statusCh = js_csp_1.chan(1);
    var waitChannels = req.cancelFast
        ? [cancelCh, inputCh]
        : [inputCh, cancelCh];
    log('Start');
    js_csp_1.go(function () {
        var _loop_1, state_1, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    js_csp_1.putAsync(statusCh, true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    _loop_1 = function () {
                        var result, doneCh_1, processed, done;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    log('Waiting');
                                    return [4 /*yield*/, js_csp_1.alts([inputCh, cancelCh], {
                                            priority: true
                                        })];
                                case 1:
                                    result = _a.sent();
                                    if (!(result.channel === cancelCh)) return [3 /*break*/, 2];
                                    log('cancelling');
                                    return [2 /*return*/, "break"];
                                case 2:
                                    log(function () {
                                        return "process " + common_1.capString(JSON.stringify(result.value), 40);
                                    });
                                    doneCh_1 = js_csp_1.chan();
                                    processed = req.process(result.value).do({
                                        next: function (value) {
                                            return log(function () {
                                                return "processed INTO " + common_1.capString(JSON.stringify(value), 40);
                                            });
                                        },
                                        error: function (error) {
                                            js_csp_1.putAsync(doneCh_1, false);
                                            log(function () { return "process ERROR! " + error; });
                                        },
                                        complete: function () {
                                            js_csp_1.putAsync(doneCh_1, true);
                                            log("process DONE!");
                                        }
                                    });
                                    exports.observableToChannel(processed, outputCh, false);
                                    return [4 /*yield*/, js_csp_1.take(doneCh_1)];
                                case 3:
                                    done = _a.sent();
                                    if (!done) {
                                        log('breaking due to ERROR');
                                        return [2 /*return*/, "break"];
                                    }
                                    _a.label = 4;
                                case 4: return [2 /*return*/];
                            }
                        });
                    };
                    _a.label = 2;
                case 2:
                    if (!true) return [3 /*break*/, 4];
                    return [5 /*yield**/, _loop_1()];
                case 3:
                    state_1 = _a.sent();
                    if (state_1 === "break")
                        return [3 /*break*/, 4];
                    return [3 /*break*/, 2];
                case 4:
                    js_csp_1.putAsync(statusCh, false);
                    return [3 /*break*/, 6];
                case 5:
                    error_1 = _a.sent();
                    log('PROCESSING ERROR', error_1);
                    js_csp_1.putAsync(statusCh, false);
                    throw error_1;
                case 6: return [2 /*return*/];
            }
        });
    });
    return { name: name, inputCh: inputCh, statusCh: statusCh };
};
exports.runPipeline = function (nodes, options) {
    var opts = Object.assign({
        logToConsole: false,
        leasing: null,
        leasingPingTimeSecs: 60
    }, options);
    var log = common_1.conditionalLog(opts.logToConsole, {
        prefix: function () { return "PIPELINE: "; }
    });
    var cancelCh = opts.cancelCh || js_csp_1.chan();
    var cancelMult = js_csp_1.mult(cancelCh);
    var statusCh = js_csp_1.chan(1);
    var inputChByName = {};
    var inputChByIndex = [];
    function runPipeline$$() {
        var nodesByNameAndIndex, startChannels, finishChannels, _loop_2, i, i, i;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    nodesByNameAndIndex = new Map();
                    startChannels = [];
                    finishChannels = [];
                    _loop_2 = function (i) {
                        var index = i; /// Avoid closure problems!!!
                        var node = nodes[index];
                        var nodeLog = common_1.conditionalLog(opts.logToConsole, {
                            prefix: function () { return "PIPELINE [" + node.name + "]: "; }
                        });
                        nodeLog('INIT');
                        var outputCh = js_csp_1.chan();
                        var nodeCancelCh = js_csp_1.chan();
                        var startCh = js_csp_1.chan();
                        var finishCh = js_csp_1.chan();
                        startChannels.push(startCh);
                        finishChannels.push(finishCh);
                        js_csp_1.mult.tap(cancelMult, nodeCancelCh);
                        var nodeController = exports.runPipelineNode({
                            name: node.name,
                            process: node.process,
                            inputCh: node.inputCh,
                            bufferSize: node.bufferSize,
                            cancelFast: node.cancelFast,
                            outputCh: outputCh,
                            cancelCh: nodeCancelCh
                        });
                        nodesByNameAndIndex.set(index, nodeController);
                        nodesByNameAndIndex.set(node.name, nodeController);
                        inputChByName[node.name] = node.inputCh;
                        inputChByIndex[index] = node.inputCh;
                        if (node.initialValues) {
                            var initialValues = rxutils_1.getAsObs(node.initialValues);
                            var onlyWithValueCh = js_csp_1.mapInto(function (x) { return x.value; }, node.inputCh);
                            var withoutErrorsCh = js_csp_1.removeInto(function (x) { return x.error; }, onlyWithValueCh);
                            exports.observableToChannel(initialValues, withoutErrorsCh, false);
                        }
                        js_csp_1.go(function () {
                            var error, result, outValue, targetNode, e_2;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        nodeLog('Starting');
                                        return [4 /*yield*/, js_csp_1.take(startCh)];
                                    case 1:
                                        _a.sent();
                                        _a.label = 2;
                                    case 2:
                                        _a.trys.push([2, 8, , 9]);
                                        _a.label = 3;
                                    case 3:
                                        if (!true) return [3 /*break*/, 7];
                                        result = js_csp_1.alts([outputCh, nodeCancelCh], {
                                            priority: true
                                        });
                                        if (!(result.channel === nodeCancelCh)) return [3 /*break*/, 4];
                                        nodeLog('cancelled');
                                        return [3 /*break*/, 7];
                                    case 4:
                                        outValue = PipelineTarget.fromValue(result.value);
                                        targetNode = outValue.select(nodesByNameAndIndex, index);
                                        return [4 /*yield*/, js_csp_1.put(targetNode.inputCh, outValue.value)];
                                    case 5:
                                        _a.sent();
                                        _a.label = 6;
                                    case 6: return [3 /*break*/, 3];
                                    case 7: return [3 /*break*/, 9];
                                    case 8:
                                        e_2 = _a.sent();
                                        error = e_2;
                                        nodeLog('ERROR', e_2);
                                        return [3 /*break*/, 9];
                                    case 9:
                                        js_csp_1.mult.untap(cancelMult, nodeCancelCh);
                                        return [4 /*yield*/, js_csp_1.put(finishCh, error || true)];
                                    case 10:
                                        _a.sent();
                                        nodeLog('Finished');
                                        return [2 /*return*/];
                                }
                            });
                        });
                    };
                    for (i = 0; i < nodes.length; i++) {
                        _loop_2(i);
                    }
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(i < startChannels.length)) return [3 /*break*/, 4];
                    return [4 /*yield*/, js_csp_1.put(startChannels[i], true)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    i++;
                    return [3 /*break*/, 1];
                case 4:
                    i = 0;
                    _a.label = 5;
                case 5:
                    if (!(i < finishChannels.length)) return [3 /*break*/, 8];
                    return [4 /*yield*/, js_csp_1.take(finishChannels[i])];
                case 6:
                    _a.sent();
                    _a.label = 7;
                case 7:
                    i++;
                    return [3 /*break*/, 5];
                case 8: return [2 /*return*/];
            }
        });
    }
    function main$$() {
        var leasing, leaseAcquired, cancelLeaseCh_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    log('MAIN Start');
                    leasing = common_1.getAsValue(opts.leasing);
                    if (!leasing) return [3 /*break*/, 5];
                    log('Using LEASING');
                    return [4 /*yield*/, js_csp_1.take(leasing.leaseCh)];
                case 1:
                    leaseAcquired = _a.sent();
                    if (!leaseAcquired) return [3 /*break*/, 3];
                    log('Lease acquired');
                    cancelLeaseCh_1 = js_csp_1.chan();
                    js_csp_1.mult.tap(cancelMult, cancelLeaseCh_1);
                    js_csp_1.go(startPinging, {
                        pingCh: leasing.pingCh,
                        pingValue: true,
                        pingTimeMilliseconds: opts.leasingPingTimeSecs * 1000,
                        cancelCh: cancelLeaseCh_1,
                        pingAsync: false,
                        onFinish: function () {
                            js_csp_1.mult.untap(cancelMult, cancelLeaseCh_1);
                            js_csp_1.putAsync(leasing.releaseCh, true);
                        }
                    });
                    js_csp_1.putAsync(statusCh, true);
                    return [4 /*yield*/, js_csp_1.take(js_csp_1.go(runPipeline$$))];
                case 2:
                    _a.sent();
                    js_csp_1.putAsync(statusCh, false);
                    return [3 /*break*/, 4];
                case 3:
                    log('Lease NOT ACQUIRED');
                    js_csp_1.putAsync(statusCh, false);
                    _a.label = 4;
                case 4: return [3 /*break*/, 7];
                case 5:
                    log('NOT using LEASING');
                    js_csp_1.putAsync(statusCh, true);
                    return [4 /*yield*/, js_csp_1.take(js_csp_1.go(runPipeline$$))];
                case 6:
                    _a.sent();
                    js_csp_1.putAsync(statusCh, false);
                    _a.label = 7;
                case 7:
                    log('MAIN End');
                    return [2 /*return*/];
            }
        });
    }
    js_csp_1.go(main$$);
    return { statusCh: statusCh, inputChByName: inputChByName, inputChByIndex: inputChByIndex };
};
//# sourceMappingURL=csp.js.map