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
var rxjs_1 = require("rxjs");
var js_csp_1 = require("js-csp");
var common_1 = require("./common");
var index_1 = require("../../index");
exports.isChan = function (value) {
    return value instanceof Object && value.constructor.name === 'Channel';
};
exports.isInstruction = function (value) {
    return value instanceof Object && value.constructor.name.endsWith('Instruction');
};
exports.bufferedObserver = function (options) {
    var opts = Object.assign({
        keepOpen: false,
        includeErrors: true
    }, options);
    var log = common_1.conditionalLog(opts, { prefix: 'BUFFER: ' });
    var channel = js_csp_1.chan(opts.bufferOrN, opts.transducer, opts.exHandler);
    var data = {
        buffer: [],
        isClosed: false,
        waiter: null
    };
    var finish = function () {
        data.isClosed = true;
        if (data.buffer.length === 0 && data.waiter) {
            js_csp_1.putAsync(data.waiter, false);
        }
    };
    var checkClosed = function () {
        if (data.isClosed) {
            throw new Error('Observer is closed');
        }
    };
    var push = function (value) {
        data.buffer.push(value);
        log('PUSH', value, data.buffer);
        if (data.buffer.length === 1 && data.waiter) {
            js_csp_1.putAsync(data.waiter, true);
        }
    };
    var next = function (value) {
        checkClosed();
        push(value);
    };
    var error = function (e) {
        checkClosed();
        if (opts.includeErrors) {
            push(e);
        }
        finish();
    };
    var complete = function () {
        log('OBS: COMPLETE');
        checkClosed();
        finish();
    };
    js_csp_1.go(function () {
        var wait, value;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!true) return [3 /*break*/, 4];
                    if (!(data.buffer.length === 0)) return [3 /*break*/, 2];
                    if (data.isClosed) {
                        log('GO: BREAK');
                        return [3 /*break*/, 4];
                    }
                    if (data.waiter) {
                        throw new Error('I should not be already waiting!!!');
                    }
                    data.waiter = js_csp_1.chan();
                    log('GO: WAIT', new Date().toISOString(), data.buffer);
                    return [4 /*yield*/, data.waiter];
                case 1:
                    wait = _a.sent();
                    data.waiter = null;
                    if (wait === false) {
                        log('GO: BREAK');
                        return [3 /*break*/, 4];
                    }
                    _a.label = 2;
                case 2:
                    value = data.buffer.shift();
                    log('GO: PUT', value, data.buffer);
                    return [4 /*yield*/, js_csp_1.put(channel, value)];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 0];
                case 4:
                    log('GO: CLOSING', opts.keepOpen, data.buffer);
                    if (!opts.keepOpen) {
                        channel.close();
                    }
                    return [2 /*return*/];
            }
        });
    });
    var result = { next: next, error: error, complete: complete, channel: channel };
    Object.defineProperty(result, 'closed', {
        enumerable: true,
        configurable: false,
        get: function () { return data.isClosed; }
    });
    return result;
};
exports.generatorToChan = function (gen, options) {
    var opts = Object.assign({
        keepOpen: false,
        includeErrors: true
    }, options);
    var ch = js_csp_1.chan(opts.bufferOrN, opts.transducer, opts.exHandler);
    js_csp_1.go(function () {
        var _a, done, value, e_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!true) return [3 /*break*/, 7];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 6]);
                    _a = gen.next(), done = _a.done, value = _a.value;
                    if (done) {
                        return [3 /*break*/, 7];
                    }
                    return [4 /*yield*/, js_csp_1.put(ch, value)];
                case 2:
                    _b.sent();
                    return [3 /*break*/, 6];
                case 3:
                    e_1 = _b.sent();
                    if (!opts.includeErrors) return [3 /*break*/, 5];
                    return [4 /*yield*/, js_csp_1.put(ch, e_1)];
                case 4:
                    _b.sent();
                    _b.label = 5;
                case 5: return [3 /*break*/, 7];
                case 6: return [3 /*break*/, 0];
                case 7:
                    if (!opts.keepOpen) {
                        ch.close();
                    }
                    return [2 /*return*/];
            }
        });
    });
    return ch;
};
exports.iterableToChan = function (iterable, options) {
    var opts = Object.assign({
        keepOpen: false,
        includeErrors: true
    }, options);
    try {
        var generator = iterable[rxjs_1.Symbol.iterator]();
        return exports.generatorToChan(generator, options);
    }
    catch (error) {
        if (opts.includeErrors) {
            return exports.iterableToChan([error], options);
        }
        else {
            return exports.iterableToChan([], options);
        }
    }
};
exports.promiseToChan = function (promise, options) {
    var opts = Object.assign({
        keepOpen: false,
        includeErrors: true
    }, options);
    var ch = js_csp_1.chan(opts.bufferOrN, opts.transducer, opts.exHandler);
    var finish = function () {
        if (!opts.keepOpen) {
            ch.close();
        }
    };
    try {
        promise
            .then(function (value) {
            js_csp_1.go(function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, js_csp_1.put(ch, value)];
                        case 1:
                            _a.sent();
                            finish();
                            return [2 /*return*/];
                    }
                });
            });
        })
            .catch(function (error) {
            js_csp_1.go(function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!opts.includeErrors) return [3 /*break*/, 2];
                            return [4 /*yield*/, js_csp_1.put(ch, error)];
                        case 1:
                            _a.sent();
                            _a.label = 2;
                        case 2:
                            finish();
                            return [2 /*return*/];
                    }
                });
            });
        });
    }
    catch (error) {
        js_csp_1.go(function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!opts.includeErrors) return [3 /*break*/, 2];
                        return [4 /*yield*/, js_csp_1.put(ch, error)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        finish();
                        return [2 /*return*/];
                }
            });
        });
    }
    return ch;
};
exports.firstToChan = function (obs, options) { return exports.observableToChan(obs.take(1), options); };
exports.observableToChan = function (obs, options) {
    var observer = exports.bufferedObserver(options);
    obs.subscribe(observer);
    return observer.channel;
};
exports.toChan = function (source, options) {
    var opts = Object.assign({
        keepOpen: false,
        includeErrors: true
    }, options);
    if (exports.isChan(source)) {
        return source;
    }
    else if (typeof source === 'function') {
        try {
            var newSource = source();
            return exports.toChan(newSource, options);
        }
        catch (error) {
            if (opts.includeErrors) {
                return exports.iterableToChan([error], options);
            }
            else {
                return exports.iterableToChan([], options);
            }
        }
    }
    else if (index_1.isNothing(source) ||
        typeof source === 'boolean' ||
        typeof source === 'string' ||
        typeof source === 'number') {
        return exports.iterableToChan([source], options);
    }
    else if (rxjs_1.Symbol.iterator in source) {
        return exports.iterableToChan(source, options);
    }
    else if (rxjs_1.Symbol.observable in source) {
        return exports.observableToChan(source, options);
    }
    else if (source && typeof source.next === 'function') {
        return exports.generatorToChan(source, options);
    }
    else if (Promise.resolve(source) === source) {
        return exports.promiseToChan(source, options);
    }
    else {
        return exports.iterableToChan([source], options);
    }
};
exports.toYielder = function (source) {
    if (exports.isInstruction(source)) {
        return source;
    }
    else {
        return exports.toChan(source);
    }
};
exports.chanToObservable = function (ch, options) {
    var opts = Object.assign({}, options);
    var log = common_1.conditionalLog(opts, { prefix: 'CHAN_OBS: ' });
    return rxjs_1.Observable.create(function (o) {
        log('Start');
        var cancelCh = js_csp_1.promiseChan();
        js_csp_1.go(function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!true) return [3 /*break*/, 2];
                        return [4 /*yield*/, js_csp_1.alts([ch, cancelCh], { priority: true })];
                    case 1:
                        result = _a.sent();
                        if (result.channel === cancelCh || result.value === js_csp_1.CLOSED) {
                            log('Completing', result.value);
                            o.complete();
                            return [3 /*break*/, 2];
                        }
                        else {
                            log('Value', result.value);
                            o.next(result.value);
                        }
                        return [3 /*break*/, 0];
                    case 2: return [2 /*return*/];
                }
            });
        });
        return function () {
            log('Unsubscribe');
            js_csp_1.putAsync(cancelCh, true);
        };
    });
};
exports.startPinging = function (pingCh, pingTimeMilliseconds, options) {
    var opts = Object.assign({
        pingAsync: false,
        autoClose: false
    }, options);
    var pingAsync = opts.pingAsync;
    var releaseCh = js_csp_1.promiseChan();
    var finishedProm = js_csp_1.go(function () {
        var log, error, index, result, e_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    log = common_1.conditionalLog(opts);
                    log('Start');
                    index = 0;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 8, , 9]);
                    _a.label = 2;
                case 2:
                    if (!true) return [3 /*break*/, 7];
                    return [4 /*yield*/, js_csp_1.alts([releaseCh, js_csp_1.timeout(pingTimeMilliseconds)], { priority: true })];
                case 3:
                    result = _a.sent();
                    if (result.channel === releaseCh) {
                        log('canceling before ping', index + 1);
                        return [3 /*break*/, 7];
                    }
                    index++;
                    if (!pingAsync) return [3 /*break*/, 4];
                    js_csp_1.putAsync(pingCh, index);
                    return [3 /*break*/, 6];
                case 4: return [4 /*yield*/, js_csp_1.put(pingCh, index)];
                case 5:
                    _a.sent();
                    _a.label = 6;
                case 6:
                    log(function () { return 'ping #' + index; });
                    return [3 /*break*/, 2];
                case 7: return [3 /*break*/, 9];
                case 8:
                    e_2 = _a.sent();
                    error = e_2;
                    log('ERROR', e_2);
                    return [3 /*break*/, 9];
                case 9:
                    if (opts.autoClose) {
                        pingCh.close();
                    }
                    log('End');
                    return [2 /*return*/];
            }
        });
    });
    var release = function () {
        return js_csp_1.go(function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, js_csp_1.put(releaseCh, true)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return { release: release, finishedProm: finishedProm };
};
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
 *                  duration in seconds and return a channel that returns
 *                  true or false whether the lease was acquired for the given
 *                  time or not.
 * @param releaseFn A lease releasing function. This is a client defined
 *                  operation that should release a previously acquired lease.
 *                  It could be called even if no lease was reserved, to ensure
 *                  release.
 * @param options   - leaseTimeoutSecs: Represents the lease time in seconds.
 *                  - leaseMarginSecs: Represents a margin time in seconds to
 *                  subtract from leaseTimeoutSecs to consider that the client
 *                  will not issue a ping in time.
 *                  - logToConsole: Indicates whether the process steps should
 *                  be logged to the console.
 */
exports.startLeasing = function (leaseFn, releaseFn, options) {
    var opts = Object.assign({
        leaseTimeoutSecs: 60
    }, options);
    var leaseTimeoutSecs = opts.leaseTimeoutSecs;
    var leaseMarginSecs = typeof opts.leaseMarginSecs === 'number'
        ? opts.leaseMarginSecs
        : leaseTimeoutSecs * 0.1;
    var log = common_1.conditionalLog(opts);
    log('Start');
    // const leaseCh = chan();
    var releaseCh = js_csp_1.chan();
    var pingCh = js_csp_1.chan();
    var startedProm = js_csp_1.promiseChan();
    var timeoutSecs = leaseTimeoutSecs - leaseMarginSecs;
    var onePing = function () {
        var resultCh = js_csp_1.promiseChan();
        js_csp_1.go(function () {
            var endTime, pingCalled, toWait, tout, waitResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        endTime = new Date().getTime() + timeoutSecs * 1000;
                        pingCalled = false;
                        _a.label = 1;
                    case 1:
                        if (!true) return [3 /*break*/, 8];
                        toWait = endTime - new Date().getTime();
                        if (toWait <= 0) {
                            return [3 /*break*/, 8];
                        }
                        tout = js_csp_1.timeout(toWait);
                        return [4 /*yield*/, js_csp_1.alts([pingCh, releaseCh, tout], {
                                priority: true
                            })];
                    case 2:
                        waitResult = _a.sent();
                        if (!(waitResult.channel === pingCh)) return [3 /*break*/, 3];
                        log('ping #' + waitResult.value);
                        pingCalled = true;
                        return [3 /*break*/, 7];
                    case 3:
                        if (!(waitResult.channel === releaseCh)) return [3 /*break*/, 5];
                        log('releasing');
                        return [4 /*yield*/, js_csp_1.put(resultCh, false)];
                    case 4:
                        _a.sent();
                        return [3 /*break*/, 8];
                    case 5:
                        if (!pingCalled) {
                            log('timeout');
                        }
                        return [4 /*yield*/, js_csp_1.put(resultCh, pingCalled)];
                    case 6:
                        _a.sent();
                        _a.label = 7;
                    case 7: return [3 /*break*/, 1];
                    case 8: return [2 /*return*/];
                }
            });
        });
        return resultCh;
    };
    var finishedProm = js_csp_1.go(function () {
        var firstTime, leaseGranted, continueLeasing;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    firstTime = true;
                    _a.label = 1;
                case 1:
                    if (!true) return [3 /*break*/, 11];
                    return [4 /*yield*/, leaseFn(leaseTimeoutSecs)];
                case 2:
                    leaseGranted = _a.sent();
                    if (!!leaseGranted) return [3 /*break*/, 5];
                    if (!firstTime) return [3 /*break*/, 4];
                    log('lease was not granted');
                    return [4 /*yield*/, js_csp_1.put(startedProm, false)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4: return [3 /*break*/, 11];
                case 5:
                    if (!firstTime) return [3 /*break*/, 7];
                    log('lease was granted');
                    return [4 /*yield*/, js_csp_1.put(startedProm, true)];
                case 6:
                    _a.sent();
                    _a.label = 7;
                case 7:
                    firstTime = false;
                    return [4 /*yield*/, onePing()];
                case 8:
                    continueLeasing = _a.sent();
                    if (!!continueLeasing) return [3 /*break*/, 10];
                    log('releasing lease');
                    return [4 /*yield*/, js_csp_1.put(releaseFn(), true)];
                case 9:
                    _a.sent();
                    return [3 /*break*/, 11];
                case 10:
                    log('continue lease');
                    return [3 /*break*/, 1];
                case 11:
                    releaseCh.close();
                    pingCh.close();
                    startedProm.close();
                    log('End');
                    return [2 /*return*/];
            }
        });
    });
    var release = function () {
        return js_csp_1.go(function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, js_csp_1.put(releaseCh, true)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return { release: release, pingCh: pingCh, startedProm: startedProm, finishedProm: finishedProm };
};
exports.runPipelineNode = function (opts) {
    var log = common_1.conditionalLog(opts);
    log('Start');
    var RELEASE = global.Symbol('RELEASE');
    var startedProm = js_csp_1.promiseChan();
    var cancelProm = js_csp_1.promiseChan();
    var inputCh = typeof opts.inputCh === 'number'
        ? js_csp_1.chan(opts.inputCh)
        : opts.inputCh ? opts.inputCh : js_csp_1.chan();
    var finishedProm = js_csp_1.go(function () {
        var index, result, e_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, js_csp_1.put(startedProm, true)];
                case 1:
                    _a.sent();
                    index = 0;
                    _a.label = 2;
                case 2:
                    if (!true) return [3 /*break*/, 10];
                    return [4 /*yield*/, js_csp_1.alts([cancelProm, inputCh], {
                            priority: true
                        })];
                case 3:
                    result = _a.sent();
                    if (!(result.channel === inputCh && result.value !== RELEASE)) return [3 /*break*/, 8];
                    _a.label = 4;
                case 4:
                    _a.trys.push([4, 6, , 7]);
                    log('Processing input #' + ++index, result.value);
                    return [4 /*yield*/, opts.process(result.value)];
                case 5:
                    _a.sent();
                    return [3 /*break*/, 7];
                case 6:
                    e_3 = _a.sent();
                    log('ERROR', e_3);
                    return [3 /*break*/, 7];
                case 7: return [3 /*break*/, 9];
                case 8:
                    log(result.channel === cancelProm ? 'cancelled' : 'released');
                    return [3 /*break*/, 10];
                case 9: return [3 /*break*/, 2];
                case 10: return [2 /*return*/];
            }
        });
    });
    if (opts.initialValues) {
        js_csp_1.go(function () {
            var index, initCh, value;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        index = 0;
                        initCh = exports.toChan(opts.initialValues);
                        _a.label = 1;
                    case 1:
                        if (!true) return [3 /*break*/, 4];
                        return [4 /*yield*/, initCh];
                    case 2:
                        value = _a.sent();
                        if (value === js_csp_1.CLOSED) {
                            return [3 /*break*/, 4];
                        }
                        log('Insert init #' + (++index), value);
                        return [4 /*yield*/, js_csp_1.put(inputCh, value)];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 1];
                    case 4:
                        log('Insert init done');
                        return [2 /*return*/];
                }
            });
        });
    }
    var input = function (value) {
        log('INPUT ', value);
        return js_csp_1.put(inputCh, value);
    };
    var release = function () { return js_csp_1.put(inputCh, RELEASE); };
    var cancel = function () { return cancelProm.close(); };
    return { startedProm: startedProm, finishedProm: finishedProm, input: input, release: release, cancel: cancel };
};
var PipelineSequenceTarget = (function () {
    function PipelineSequenceTarget(value, options) {
        this.value = value;
        if (options) {
            var opts = options;
            if (typeof opts.name === 'string') {
                this.name = opts.name;
            }
            else if (typeof opts.index === 'number') {
                this.index = opts.index;
            }
            else if (typeof opts.offset === 'number') {
                this.offset = opts.offset;
            }
        }
        else {
            this.offset = 0;
        }
    }
    PipelineSequenceTarget.fromValue = function (value, factory) {
        if (value instanceof PipelineSequenceTarget) {
            return value;
        }
        else if (factory) {
            return factory(value);
        }
        else {
            return new PipelineSequenceTarget(value);
        }
    };
    PipelineSequenceTarget.prototype.selectWith = function (dict, arr, currentIndex, foundFn, notFoundFn) {
        if (this.name) {
            if (!dict.has(this.name)) {
                return notFoundFn(false);
            }
            return foundFn(dict.get(this.name));
        }
        else {
            var index = typeof this.index === 'number'
                ? this.index
                : typeof this.offset === 'number'
                    ? currentIndex + this.offset
                    : currentIndex;
            if (index < 0 || index >= arr.length) {
                return notFoundFn(index === arr.length);
            }
            return foundFn(arr[index]);
        }
    };
    PipelineSequenceTarget.prototype.select = function (dict, arr, currentIndex) {
        var _this = this;
        var notFoundFn = function (lastIndex) {
            if (_this.name) {
                throw new Error("Expected to find element with name " + _this.name);
            }
            else if (typeof _this.index === 'number') {
                throw new Error("Expected to find element at index " + _this.index);
            }
            else if (typeof _this.offset === 'number') {
                throw new Error("Expected to find element with offset " + _this
                    .offset + " from index " + currentIndex);
            }
            else {
                throw new Error("Expected to find element but no index was supplied");
            }
        };
        return this.selectWith(dict, arr, currentIndex, common_1.id, notFoundFn);
    };
    PipelineSequenceTarget.prototype.toString = function () {
        var valStr = common_1.capString(JSON.stringify(this.value), 40);
        if (this.name) {
            return "name " + this.name + ": " + valStr;
        }
        else if (typeof this.index === 'number') {
            return "index " + this.index + ": " + valStr;
        }
        else if (typeof this.offset === 'number') {
            return "offset " + this.offset + ": " + valStr;
        }
        else {
            return "unknown: " + valStr;
        }
    };
    return PipelineSequenceTarget;
}());
exports.PipelineSequenceTarget = PipelineSequenceTarget;
exports.toNamedTarget = function (value, name) {
    return new PipelineSequenceTarget(value, { name: name });
};
exports.toIndexedTarget = function (value, index) {
    return new PipelineSequenceTarget(value, { index: index });
};
exports.toOffsetTarget = function (value, offset) {
    return new PipelineSequenceTarget(value, { offset: offset });
};
exports.toCurrentTarget = function (value) { return exports.toOffsetTarget(value, 0); };
exports.toNextTarget = function (value) { return exports.toOffsetTarget(value, 1); };
exports.toPreviousTarget = function (value) { return exports.toOffsetTarget(value, -1); };
exports.runPipelineSequence = function (opts) {
    if (!opts.nodes || opts.nodes.length === 0) {
        throw new Error('At least one node must be supplied.');
    }
    var log = common_1.conditionalLog(opts);
    log('Start');
    var RELEASE = global.Symbol('RELEASE');
    var startedProm = js_csp_1.promiseChan();
    var pipeDict = new Map();
    var pipeArr = new Array();
    var startPipeline = function () {
        var _loop_1 = function (i) {
            var nodeInit = opts.nodes[i];
            var index = i;
            var process_1 = function (value) {
                return js_csp_1.go(function () {
                    var proc, procCh, _loop_2, state_1;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                proc = nodeInit.process(value);
                                if (!exports.isInstruction(proc)) return [3 /*break*/, 2];
                                return [4 /*yield*/, proc];
                            case 1:
                                _a.sent();
                                return [2 /*return*/];
                            case 2:
                                procCh = exports.toChan(proc);
                                _loop_2 = function () {
                                    var result, target;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, procCh];
                                            case 1:
                                                result = _a.sent();
                                                if (result === js_csp_1.CLOSED) {
                                                    return [2 /*return*/, "break"];
                                                }
                                                target = PipelineSequenceTarget.fromValue(result, exports.toNextTarget);
                                                return [4 /*yield*/, target.selectWith(pipeDict, pipeArr, index, function (n) { return n.input(target.value); }, function (last) {
                                                        if (last) {
                                                            return opts.processLast(target.value);
                                                        }
                                                        else {
                                                            throw new Error('Invalid index: ' + target.toString());
                                                        }
                                                    })];
                                            case 2:
                                                _a.sent();
                                                return [2 /*return*/];
                                        }
                                    });
                                };
                                _a.label = 3;
                            case 3:
                                if (!true) return [3 /*break*/, 5];
                                return [5 /*yield**/, _loop_2()];
                            case 4:
                                state_1 = _a.sent();
                                if (state_1 === "break")
                                    return [3 /*break*/, 5];
                                return [3 /*break*/, 3];
                            case 5: return [2 /*return*/];
                        }
                    });
                });
            };
            var node = exports.runPipelineNode({
                process: process_1,
                inputCh: nodeInit.inputCh,
                initialValues: nodeInit.initialValues,
                logs: log.enabled && nodeInit.logs
            });
            pipeArr.push(node);
            if (nodeInit.name) {
                pipeDict.set(nodeInit.name, node);
            }
            log('Node initialized', index, nodeInit.name);
        };
        for (var i = 0; i < opts.nodes.length; i++) {
            _loop_1(i);
        }
        // Return a process that finishes when all nodes finish
        return js_csp_1.go(function () {
            var i;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < pipeArr.length)) return [3 /*break*/, 5];
                        return [4 /*yield*/, pipeArr[i].finishedProm];
                    case 2:
                        _a.sent();
                        log('Finished node #' + i);
                        if (!(i + 1 < opts.nodes.length)) return [3 /*break*/, 4];
                        return [4 /*yield*/, pipeArr[i + 1].release()];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        i++;
                        return [3 /*break*/, 1];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    var finishedProm = js_csp_1.go(function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, js_csp_1.put(startedProm, true)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, startPipeline()];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
    var input = function (index, value) {
        return (typeof index === 'number'
            ? exports.toIndexedTarget(value, index)
            : exports.toNamedTarget(value, index))
            .select(pipeDict, pipeArr, 0)
            .input(value);
    };
    var release = function () { return pipeArr[0].release(); };
    var cancel = function () {
        for (var i = 0; i < pipeArr.length; i++) {
            pipeArr[i].cancel();
        }
    };
    return { startedProm: startedProm, finishedProm: finishedProm, input: input, release: release, cancel: cancel };
};
//# sourceMappingURL=csp.js.map