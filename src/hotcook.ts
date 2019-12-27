import { URL } from 'url';
import rp from 'request-promise-native';

import SearchResultIterator from './searchResultIterator';
import { Parser, Recipe } from './parser';

export type Model = 'HW24E' | 'HW16E' | 'HT16E' | 'HW10E' | 'HW16D' | 'SH16W' | 'HW24C' | 'HT24B' | 'HT99B' | 'HT99A';

const BASE_URL = 'https://cook-healsio.jp/hotcook';

export class Hotcook {
    private _model: Model;

    get modelUrl(): string {
        return `${BASE_URL}/${this._model}/recipes`;
    }

    constructor(model: Model = "HW24C") {
        this._model = model;
    }

    public search(query: string): SearchResultIterator {
        const url = new URL(`${this.modelUrl}/search`);
        url.searchParams.set('w', query);
        const results = new SearchResultIterator(url);

        return results;
    }

    public async recipe(recipeNumber: string): Promise<{ url: string; recipe: Recipe }> {
        const url = `${this.modelUrl}/${recipeNumber}`;
        console.log(url);
        const res = await rp(url);
        const parser = new Parser(this.modelUrl);
        return {
            url,
            recipe: parser.parseRecipe(res),
        }
    }
}