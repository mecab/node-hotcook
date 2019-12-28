import { PagenatedOptions } from './hotcook';
import { sleep } from './util';

interface PagerInternal<T> extends AsyncIterableIterator<T> {
    _currentPage: number;
    _maxPage: number | null;
    _pageResults: T[];
    _pageIndex: number;
    _lastRequest: Date;
    _throttleTimeInMs: number;
    _doWithThrottle(fn: () => Promise<T[]>): Promise<T[]>;
    getPage: (page: number) => Promise<T[]>;
    maxPage: (maxPage: number) => Pager<T>;
}

export type Pager<T> = Pick<PagerInternal<T>, 'getPage' | 'maxPage'> & AsyncIterableIterator<T>

export class PagerFactory {
    public static create<T, U extends PagenatedOptions>(fn: (options: U) => Promise<T[]>, options: U): Pager<T> {
        const options_: U = { ...options };
        const iterator = {
            _currentPage: 0,
            _maxPage: null,
            _pageResults: [],
            _pageIndex: 0,
            _lastRequest: new Date(0),
            _throttleTimeInMs: 500,
            getPage: async (page: number): Promise<T[]> => {
                options_.page = page;
                return await fn(options_);
            },
            maxPage(maxPage: number | null): Pager<T> {
                this._maxPage = maxPage
                return this;
            },
            async _doWithThrottle(fn: () => Promise<T[]>): Promise<T[]>  {
                const now = new Date();
                if (now.getTime() - this._lastRequest.getTime() > this._throttleTimeInMs) {
                    this._lastRequest = now;
                    return await fn();
                }
                await sleep(500);
                return await this._doWithThrottle(fn);
            },
            async next(): Promise<IteratorResult<T>> {
                this._pageIndex++;
                const result = this._pageResults[this._pageIndex];
                if (result) {
                    return {
                        done: false,
                        value: result
                    };
                }

                this._currentPage++;

                if (this._maxPage && this._currentPage > this._maxPage) {
                    return {
                        done: true,
                        value: null
                    };
                }
                options_.page = this._currentPage;
                const items = await this._doWithThrottle(async () => {
                    return await fn(options_);
                });
                if (items.length === 0) {
                    return {
                        done: true,
                        value: null
                    }
                }

                this._pageIndex = 0;
                this._pageResults = items;

                return {
                    done: false,
                    value: this._pageResults[0]
                }
            },
            [Symbol.asyncIterator](): Pager<T> {
                return this as Pager<T>;
            }
        } as PagerInternal<T>
        return iterator as Pager<T>;
    }
}