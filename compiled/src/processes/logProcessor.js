"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var common_1 = require("../utils/common");
function logProcessor(processor) {
    processor.onTaskStarted$.subscribe(function (t) {
        return console.log("(" + processor.caption + ") START :", JSON.stringify(t));
    });
    processor.onTaskReStarted$.subscribe(function (t) {
        return console.log("(" + processor.caption + ") RETRY :", JSON.stringify(t));
    });
    processor.onTaskResult$.subscribe(function (t) {
        return console.log("(" + processor.caption + ") RESULT:", JSON.stringify(t));
    });
    processor.onTaskError$.subscribe(function (t) {
        return console.log("(" + processor.caption + ") ERROR :", JSON.stringify(t));
    });
    processor.onTaskCompleted$.subscribe(function (t) {
        return console.log("(" + processor.caption + ") COMPLETE :", JSON.stringify(t));
    });
    processor.onFinished$.subscribe(function () {
        return console.log("(" + processor.caption + ") FINISHED");
    });
    return processor;
}
exports.logProcessor = logProcessor;
exports.defaultTaskFormatter = function (maxPayloadLength, maxTaskIdLength) {
    if (maxPayloadLength === void 0) { maxPayloadLength = 60; }
    if (maxTaskIdLength === void 0) { maxTaskIdLength = undefined; }
    return function (item, showPayload) {
        var payload = showPayload && item.payload && maxPayloadLength
            ? JSON.stringify(item.payload)
            : '';
        if (maxPayloadLength && payload) {
            payload = common_1.capString(payload, maxPayloadLength);
        }
        if (payload) {
            payload = " " + payload;
        }
        var taskId = item.uid;
        if (maxTaskIdLength && taskId) {
            taskId = common_1.capString(taskId, maxTaskIdLength, '');
        }
        if (taskId) {
            taskId = " [" + taskId + "]";
        }
        return "" + item.kind + taskId + payload;
    };
};
exports.defaultValueFormatter = function (maxValueLength) {
    if (maxValueLength === void 0) { maxValueLength = 60; }
    return function (value) {
        return common_1.capString(JSON.stringify(value), maxValueLength);
    };
};
exports.defaultErrorFormatter = function (showStack) {
    if (showStack === void 0) { showStack = true; }
    return function (error) {
        if (error instanceof Error) {
            var result = (error.name || 'Error') + ": " + (error.message ||
                '(no message)');
            if (error.stack && showStack) {
                result = result + '\n' + error.stack;
            }
            return result;
        }
        return undefined;
    };
};
function logProcessorCore(processor, options) {
    var opts = Object.assign({
        disabled: false,
        processDisabled: false,
        isAliveDisabled: false,
        finishDisabled: false,
        basicProcessLog: false,
        showPayloads: true,
        caption: processor.caption || 'Log',
        preCaption: '',
        taskFormatter: exports.defaultTaskFormatter(60),
        valueFormatter: exports.defaultValueFormatter(30),
        errorFormatter: exports.defaultErrorFormatter(true)
    }, options);
    if (opts.disabled) {
        return processor;
    }
    var process = function (item) {
        if (opts.processDisabled) {
            return processor.process(item);
        }
        else {
            var msg_1 = opts.taskFormatter(item, opts.showPayloads);
            var print_1 = function (op) {
                return "" + opts.preCaption + opts.caption + ": " + op + " process. " + msg_1;
            };
            console.log("" + print_1('START'));
            var result = processor.process(item);
            if (!opts.basicProcessLog) {
                result = result.do({
                    next: function (x) {
                        return console.log(print_1('NEXT') + " VAL: " + opts.valueFormatter(x));
                    },
                    error: function (x) {
                        return console.log(print_1('ERROR') + " ERR: " + (opts.errorFormatter(x) ||
                            opts.valueFormatter(x)));
                    },
                    complete: function () { return console.log("" + print_1('COMPLETE')); }
                });
            }
            return result;
        }
    };
    var isAlive = function () {
        if (opts.isAliveDisabled) {
            return processor.isAlive();
        }
        else {
            var print_2 = function (op) {
                return "" + opts.preCaption + opts.caption + ": " + op + " isAlive.";
            };
            var result = processor.isAlive();
            console.log(print_2('START') + ": " + (result ? 'isAlive' : 'isDead'));
            return result;
        }
    };
    var finish = function () {
        if (opts.finishDisabled) {
            return processor.finish();
        }
        else {
            var print_3 = function (op) {
                return "" + opts.preCaption + opts.caption + ": " + op + " finish.";
            };
            console.log(print_3('START'));
            var result = processor.finish();
            if (!opts.basicProcessLog) {
                result = result.do({
                    next: function () { return console.log(print_3('NEXT')); },
                    error: function (x) {
                        return console.log(print_3('ERROR') + " " + (opts.errorFormatter(x) ||
                            opts.valueFormatter(x)));
                    },
                    complete: function () { return console.log(print_3('COMPLETE')); }
                });
            }
            return result;
        }
    };
    return Object.assign({}, processor, { process: process, isAlive: isAlive, finish: finish });
}
exports.logProcessorCore = logProcessorCore;
//# sourceMappingURL=logProcessor.js.map