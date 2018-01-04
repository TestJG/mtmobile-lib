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
function logProcessorCore(processor, options) {
    var opts = Object.assign({
        disabled: false,
        processDisabled: false,
        isAliveDisabled: false,
        finishDisabled: false,
        basicProcessLog: true,
        caption: 'Log'
    }, options);
    var process = function (item) {
        if (opts.disabled || opts.processDisabled) {
            return processor.process(item);
        }
        else {
            console.log(opts.caption + ": START process of " + item.kind + " [" + item.uid + "]");
            var result = processor.process(item);
            if (!opts.basicProcessLog) {
                result = result.do({
                    next: function (x) {
                        console.log(opts.caption + ": NEXT process of " + item.kind + " [" + item.uid + "]: " + JSON.stringify(x));
                    },
                    error: function (x) {
                        console.log(opts.caption + ": ERROR process of " + item.kind + " [" + item.uid + "]: " + x);
                    },
                    complete: function () {
                        console.log(opts.caption + ": COMPLETE process of " + item.kind + " [" + item.uid + "]");
                    }
                });
            }
            console.log(opts.caption + ": END process of " + item.kind + " [" + item.uid + "]");
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