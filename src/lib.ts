
let stringEmpty = "",
    toString = Object.prototype.toString,
    core_hasOwn = Object.prototype.hasOwnProperty,
    slice = Array.prototype.slice;

function testObject(obj: any) {
    if (obj.constructor &&
        !core_hasOwn.call(obj, "constructor") &&
        !core_hasOwn.call(obj.constructor.prototype, "isPrototypeOf")) {
        return false;
    }
}

export class Lib {
    static stringEmpty = stringEmpty;

    static noop() { }

    static hasOwnProp(obj: any, prop: string) {
        return core_hasOwn.call(obj, prop);
    }

    static trace(e: any) {
        console.error && console.error(e.stack || e.message || e + '');
    }

    static isType(typename: string, value: any) {
        //typename:String, Array, Boolean, Object, RegExp, Date, Function,Number //兼容
        //typename:Null, Undefined,Arguments    //IE不兼容
        return toString.apply(value) === '[object ' + typename + ']';
    }

    static toStr(p: any): string {
        return Lib.isNull(p) ? '' : p.toString();
    }

    static isUndefined(obj: any) {
        ///<summary>是否定义</summary>

        return (typeof (obj) === "undefined" || obj === undefined);
    }

    static isNull(obj: any) {
        ///<summary>是否Null</summary>

        return (obj === null || Lib.isUndefined(obj));
    }

    static isBoolean(obj: any) {
        return Lib.isType("Boolean", obj);
    }

    static isNullEmpty(s: any) {
        return (Lib.isNull(s) || s === stringEmpty);
    }

    static isFunction(fun: any) {
        return Lib.isType("Function", fun);
    }

    static isNumeric(n: any) {
        //return cmpx.isType("Number", n) && !isNaN(n) && isFinite(n);;
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

    static isString(obj: any) {
        return Lib.isType("String", obj);
    }

    static isObject(obj: any) {
        return obj && Lib.isType("Object", obj)
            && !Lib.isElement(obj) && !Lib.isWindow(obj);//IE8以下isElement, isWindow认为Object
    }

    static isPlainObject(obj: any) {
        if (!Lib.isObject(obj)) return false;

        try {
            if (testObject(obj) === false) return false;
        } catch (e) {
            return false;
        }

        var key;
        for (key in obj) { }

        return key === undefined || core_hasOwn.call(obj, key);
    }

    static isArray(value: any) {
        return Array.isArray ? Array.isArray(value) : Lib.isType("Array", value);
    }

    static isWindow(obj: any) { return !!(obj && obj == obj.window); }

    static isElement(obj: any) { var t = obj && (obj.ownerDocument || obj).documentElement; return t ? true : false; }

    static trim(str: string, newline?: boolean) {
        if (str) {
            return newline ? str.replace(/^(?:\s|\u3000|\ue4c6|\n|\r)*|(?:\s|\u3000|\ue4c6|\n|\r)*$/g, '') :
                str.replace(/^(?:\s|\u3000|\ue4c6)*|(?:\s|\u3000|\ue4c6)*$/g, '');
        } else {
            return '';
        }
    }

    static replaceAll(s: string, str: string, repl: string, flags: string = "g") {
        if (Lib.isNullEmpty(s) || Lib.isNullEmpty(str)) return s;
        str = str.replace(/([^A-Za-z0-9 ])/g, "\\$1");
        s = s.replace(new RegExp(str, flags), repl);
        return s;
    }

    static inArray(list: Array<any>, p: any, thisArg: any = null): number {
        var isF = Lib.isFunction(p),
            index = -1;
        Lib.each(list, (item, idx) => {
            var ok = isF ? p.call(thisArg, item, idx) : (item == p);
            if (ok) {
                index = idx;
                return false;
            }
        }, thisArg);
        return index;
    }

    static toArray(p: any, start: number = 0, count: number = Number.MAX_VALUE): Array<any> {
        return p ? slice.apply(p, [start, count]) : p;
    }

    static arrayToObject<T>(array: Array<T>, fieldName: string): { [name: string]: T } {
        var obj: { [name: string]: T } = {};
        Lib.each(array, function (item: any, index: number) {
            obj[item[fieldName]] = item;
        });
        return obj;
    }

    static each(list: any, fn: (item: any, idx: number) => any, thisArg: any = null) {
        if (!list) return;
        var len = list.length;
        for (let i = 0, len = list.length; i < len; i++) {
            if (fn.call(thisArg, list[i], i) === false) break;
        }
    }

    static eachProp(obj: any, callback: (item: any, name: string) => void, thisArg: any = null) {
        if (!obj) return;
        var item;
        for (var n in obj) {
            if (Lib.hasOwnProp(obj, n)) {
                item = obj[n];
                if (callback.call(thisArg, item, n) === false) break;
            }
        }
    }

    static extend(obj: Object, ...args: Object[]): Object {
        if (obj) {
            Lib.each(args, function (p: Object) {
                p && Lib.eachProp(p, function (item: string, name: string) { obj[name] = item; });
            });
        }
        return obj;
    }

    static makeAutoId() {
        var t = new Date().valueOf();
        if ((++_tick) > 100000) _tick = 0;
        return [t, _tick].join('_');
    }

    static format(str: string, ...args: any[]): string {
        Lib.each(args, function (item, index) {
            str = Lib.replaceAll(str, '{' + index + '}', item);
        });
        return str;
    }

    static formatObject(str: string, ...args: any[]): string {
        Lib.each(args, function (item, index) {
            str = Lib.replaceAll(str, '{' + index + '}', item);
        });
        return str;
    }

    /**
     * 是否类
     * @param p 参数
     * @param cls 类
     */
    static isClass(p, cls) {
        return p ? (p == cls || (p.prototype && p.prototype instanceof cls)) : false;
    }

    static offset(element: HTMLElement, offset?: { top: number; left: number; }): { top: number; left: number; } {
        if (offset) {
            let curOffset = Lib.offset(element);
            return {
                top: offset.top - curOffset.top,
                left: offset.left - curOffset.left
            }
        } else {
            let box;
            if (element.getBoundingClientRect)
                box = element.getBoundingClientRect();
            let win = window, docElem = document.documentElement;
            return {
                top: box.top + (win.pageYOffset || docElem.scrollTop) - (docElem.clientTop || 0),
                left: box.left + (win.pageXOffset || docElem.scrollLeft) - (docElem.clientLeft || 0)
            }
        }
    }
}

let _tick = 0;