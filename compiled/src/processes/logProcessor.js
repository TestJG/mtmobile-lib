"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
        return console.log("(" + processor.caption + ") COMPL :", JSON.stringify(t));
    });
    processor.onFinished$.subscribe(function () {
        return console.log("(" + processor.caption + ") FINISHED");
    });
    return processor;
}
exports.logProcessor = logProcessor;
exports.defaultTaskFormatter = function (maxPayloadLength) {
    if (maxPayloadLength === void 0) { maxPayloadLength = 60; }
    return function (item) {
        var payload = item.payload && maxPayloadLength
            ? JSON.stringify(item.payload)
            : undefined;
        if (maxPayloadLength && payload && payload.length > maxPayloadLength) {
            payload = ' ' + payload.substr(0, maxPayloadLength - 3) + '...';
        }
        return item.kind + " [" + item.uid + "]" + payload;
    };
};
exports.defaultValueFormatter = function (maxValueLength) {
    if (maxValueLength === void 0) { maxValueLength = 30; }
    return function (v, item) {
        var value = maxValueLength ? JSON.stringify(v) : undefined;
        if (maxValueLength && value && value.length > maxValueLength) {
            value = ' ' + value.substr(0, maxValueLength - 3) + '...';
        }
        return value;
    };
};
function logProcessorCore(processor, options) {
    var opts = Object.assign({
        disabled: false,
        processDisabled: false,
        isAliveDisabled: false,
        finishDisabled: false,
        basicProcessLog: false,
        caption: processor.caption || 'Log',
        taskFormatter: exports.defaultTaskFormatter(60),
        valueFormatter: exports.defaultValueFormatter(30)
    }, options);
    var process = function (item) {
        if (opts.disabled || opts.processDisabled) {
            return processor.process(item);
        }
        else {
            var msg_1 = opts.taskFormatter(item);
            console.log(opts.caption + ": START process. " + msg_1);
            var result = processor.process(item);
            if (!opts.basicProcessLog) {
                result = result.do({
                    next: function (x) {
                        console.log(opts.caption + ": NEXT process. " + msg_1, x);
                    },
                    error: function (x) {
                        console.log(opts.caption + ": ERROR process. " + msg_1, x);
                    },
                    complete: function () {
                        console.log(opts.caption + ": COMPLETE process. " + msg_1);
                    }
                });
            }
            return result;
        }
    };
    var isAlive = function () {
        if (opts.disabled || opts.isAliveDisabled) {
            return processor.isAlive();
        }
        else {
            console.log(opts.caption + ": START isAlive");
            var result = processor.isAlive();
            console.log(opts.caption + ": END isAlive: " + result);
            return result;
        }
    };
    var finish = function () {
        if (opts.disabled || opts.finishDisabled) {
            return processor.finish();
        }
        else {
            console.log(opts.caption + ": START finish");
            var result = processor.finish();
            if (!opts.basicProcessLog) {
                result = result.do({
                    next: function () {
                        console.log(opts.caption + ": NEXT finish");
                    },
                    error: function (x) {
                        console.log(opts.caption + ": ERROR finish");
                    },
                    complete: function () {
                        console.log(opts.caption + ": COMPLETE finish");
                    }
                });
            }
            console.log(opts.caption + ": END finish");
            return result;
        }
    };
    return Object.assign({}, processor, { process: process, isAlive: isAlive, finish: finish });
}
exports.logProcessorCore = logProcessorCore;
//# sourceMappingURL=logProcessor.js.map