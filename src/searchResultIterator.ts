import { URL } from 'url';
import rp from 'request-promise-native';

import { Parser, RecipeInfo } from './parser';
import { sleep } from './util';

export default class SearchResultIterator implements AsyncIterableIterator<RecipeInfo> {
    private _url: URL
    private _currentPage: number;
    private _pageResults: RecipeInfo[] = [];
    private _pageIndex = 0;
    private _lastRequest: Date = new Date(0);
    private _throttleTimeInMs = 500;

    constructor(url: URL) {
        this._url = url;
        this._currentPage = parseInt(this._url.searchParams.get('page') || '1', 10) - 1;
    }

    private async doWithThrottle<T>(fn: () => Promise<T>): Promise<T>  {
        const now = new Date();
        if (now.getTime() - this._lastRequest.getTime() > this._throttleTimeInMs) {
            this._lastRequest = now;
            return fn();
        }
        await sleep(500);
        return await this.doWithThrottle(fn);
    }

    public async next(): Promise<IteratorResult<RecipeInfo>> {
        this._pageIndex++;
        const result = this._pageResults[this._pageIndex];
        if (result) {
            return {
                done: false,
                value: result
            }
        }

        this._currentPage++;
        this._url.searchParams.set('page', (this._currentPage).toString());
        console.log(`requesting ${this._url.toString()}`);
        const nextPage: string = await this.doWithThrottle(async () => {
            return await rp({
                uri: this._url.toString(),
                method: 'GET',
                json: false
            });
        });

        const recipes = new Parser(this._url.toString()).parseSearchResult(nextPage);
        if (recipes.length === 0) {
            return {
                done: true,
                value: null
            }
        }

        this._pageIndex = 0;
        this._pageResults = recipes;

        return {
            done: false,
            value: this._pageResults[0]
        }
    }

    [Symbol.asyncIterator](): SearchResultIterator {
        return this;
    }
}