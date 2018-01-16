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
function logProcessorCore(processor, options) {
    var opts = Object.assign({
        disabled: false,
        processDisabled: false,
        isAliveDisabled: false,
        finishDisabled: false,
        basicProcessLog: false,
        caption: processor.caption || 'Log',
        preCaption: '',
        taskFormatter: exports.defaultTaskFormatter(60)
    }, options);
    if (opts.disabled) {
        return processor;
    }
    var process = function (item) {
        if (opts.processDisabled) {
            return processor.process(item);
        }
        else {
            var msg_1 = opts.taskFormatter(item);
            var print_1 = function (op) {
                return "" + opts.preCaption + opts.caption + ": " + op + " process.";
            };
            console.log(print_1('START'), msg_1);
            var result = processor.process(item);
            if (!opts.basicProcessLog) {
                result = result.do({
                    next: function (x) { return console.log(print_1('NEXT'), x, msg_1); },
                    error: function (x) { return console.log(print_1('ERROR'), x, msg_1); },
                    complete: function () { return console.log(print_1('COMPLETE'), msg_1); },
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
            console.log(print_2('START'), result);
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
                    error: function (x) { return console.log(print_3('ERROR'), x); },
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