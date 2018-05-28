import { Observable } from 'rxjs';
import { Lib } from './lib';

let undef;

export const breakOff = (callback: () => boolean) => <T>(source: Observable<T>) =>
    new Observable<T>(observer => {
        source.subscribe({
            next: function (r) {
                !callback() && observer.next(r);
            },
            error: function (r) {
                !callback() && observer.error(r);
            },
            complete: function () {
                !callback() && observer.complete();
            }
        });
    });

export const cacheToObject = (obj: object, key: string | object) => {
    let _key = key;
    return <T>(source: Observable<T>) =>
        new Observable<T>(observer => {
            let key = obj ? (Lib.isObject(_key) ? JSON.stringify(_key) : _key) : '';
            if (!key) {
                observer.error('cacheToObject key empty');
                observer.complete();
                return;
            }
            let setObjectCache = (value: any, success: boolean, closed: boolean) => {
                let cache = _getObjectCache(obj, key);
                let has = !!cache;

                has || (cache = { fns: [] });
                cache.closed = closed;
                cache.success = success;
                cache.value = value;

                has || _setObjectCache(obj, key, cache);
                if (closed) {
                    let fns = cache.fns;
                    cache.fns = [];
                    fns.forEach(item => item(cache));
                }
            };
            let subFn = () => {
                setObjectCache(null, false, false);
                source.subscribe({
                    next: (rs) => {
                        observer.next(rs);
                        setObjectCache(rs, true, true);
                    },
                    error: (err) => {
                        observer.error(err);
                        setObjectCache(err, true, true);
                    },
                    complete: () => observer.complete()
                });
            };

            let cache = _getObjectCache(obj, key);
            let cacheSubFn = function (cache) {
                if (cache.success)
                    observer.next(cache.value);
                else
                    observer.error(cache.value);
                observer.complete();
            };
            if (cache) {
                if (cache.closed) {
                    cacheSubFn(cache);
                } else {
                    cache.fns.push(cacheSubFn);
                }
            } else
                subFn();
        });
};

interface CacheItem {
    key: string;
    value: any;
}

let _makeKey = function (key: string | object): string {
    return Lib.isObject(key) ? JSON.stringify(key) : key as string;

}, _objectCaches = function (obj: any): CacheItem[] {
    let name = '__objectcache__';
    return obj[name] || (obj[name] = []);

}, _objectCacheIndex = function (objcache: CacheItem[], key: string): number {
    let caches = objcache;
    return caches.findIndex(item => item.key == key);

}, _getObjectCache = function (obj: any, key: string | object): any {
    let objectCaches = _objectCaches(obj);
    key = _makeKey(key);
    let index = _objectCacheIndex(objectCaches, key);
    let cacheItem = index >= 0 ? objectCaches[index] : undef;
    return cacheItem && cacheItem.value;

}, _setObjectCache = function (obj: any, key: string | object, value: any): any {
    let objectCaches = _objectCaches(obj);
    key = _makeKey(key);
    let cacheItem = {
        key: key,
        value: value
    }
    let index = _objectCacheIndex(objectCaches, key);
    if (index >= 0)
        objectCaches[index] = cacheItem;
    else
        objectCaches.push(cacheItem);
    return cacheItem;

};

//#endregion cacheToObject
