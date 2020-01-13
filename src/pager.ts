import { sleep } from './util';

export interface PagenatedOptions {
    page?: number;
}

export class Pager<T, U extends PagenatedOptions> {
    private _currentPage = 0;
    private _maxPage: number | null  = null;
    private _pageResults: T[] = [];
    private _pageIndex = 0;
    private _lastRequest = new Date(0);
    private _throttleTimeInMs = 500;
    private _options: U;
    private _fn: (options: U) => Promise<T[]>;

    constructor(fn: (options: U) => Promise<T[]>, options: U) {
        this._options = { ...options };
        this._fn = fn;
    }

    async getPage(page: number): Promise<T[]> {
        this._options.page = page;
        return await this._fn(this._options);
    }

    maxPage(maxPage: number | null): Pager<T, U> {
        this._maxPage = maxPage
        return this;
    }

    async _doWithThrottle(fn: () => Promise<T[]>): Promise<T[]>  {
        const now = new Date();
        if (now.getTime() - this._lastRequest.getTime() > this._throttleTimeInMs) {
            this._lastRequest = now;
            return await fn();
        }
        await sleep(500);
        return await this._doWithThrottle(fn);
    }

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
        this._options.page = this._currentPage;
        const items = await this._doWithThrottle(async () => {
            return await this._fn(this._options);
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
    }

    [Symbol.asyncIterator](): Pager<T, U> {
        return this;
    }
}
