import { URL } from 'url';
import rp from 'request-promise-native';

import { Pager } from './pager';
import { Parser, Recipe } from './parser';
import { RecipeInfo } from './parser';
import { PagenatedOptions } from './pager';

export type Model = 'HW24E' | 'HW16E' | 'HT16E' | 'HW10E' | 'HW16D' | 'SH16W' | 'HW24C' | 'HT24B' | 'HT99B' | 'HT99A';
export type RecipeKindOptions = '煮物' | 'カレー・シチュー' | 'スープ・汁物' | 'ゆで物' | '蒸し物' | 'めん類' | '発酵・低温調理' | 'お菓子・パン';
export type CookingTimeOptions = '30分未満' | '30分以上1時間未満' | '1時間以上';
export type MaterialOptions =
    '牛肉' | '豚肉,鶏肉' | 'ひき肉' | '肉・その他'
    | '魚,貝類' | 'えび・いか・たこ' | '魚介・その他'
    | 'いも・かぼちゃ' | '白菜・キャベツ' | 'ほうれん草・小松菜' | 'トマト・なす' | 'ピーマン・パプリカ' | 'ブロッコリー・アスパラガス' | '大根・にんじん' | '玉ねぎ' | 'れんこん・ごぼう' | '果物' | 'きのこ類' | '野菜・その他'
    | '米' | 'めん・パスタ' | 'その他穀物' | '乾物' | '豆・豆製品'
    | '卵' | '乳製品' | '缶詰' | '加工食品';

export interface SearchOptions {
    query?: string;
    kind?: RecipeKindOptions[];
    time?: CookingTimeOptions[];
    reservationCapable?: boolean;
    materials?: MaterialOptions[];
}

type SearchPageOptions = SearchOptions & PagenatedOptions;

const BASE_URL = 'https://cook-healsio.jp/hotcook';

export class Hotcook {
    private _model: Model;

    get modelUrl(): string {
        return `${BASE_URL}/${this._model}/recipes`;
    }

    constructor(model: Model = "HW24C") {
        this._model = model;
    }

    public search(query?: string, options?: SearchOptions): Pager<RecipeInfo, SearchPageOptions>
    public search(options: SearchOptions): Pager<RecipeInfo, SearchPageOptions>
    public search(queryOrOptions: string | SearchOptions | undefined, options?: SearchOptions): Pager<RecipeInfo, SearchPageOptions> {
        let options_;
        if (typeof queryOrOptions === 'string') {
            options_ = options ? { ...options } : {};
            options_.query = queryOrOptions;
        }
        else {
            options_ = { ... queryOrOptions ?? {} };
        }
        if (!options_.query) {
            options_.query = '';
        }

        return new Pager(this._searchPage.bind(this), { ...options_, page: 1 } as SearchPageOptions);
    }

    private async _searchPage(options: SearchPageOptions): Promise<RecipeInfo[]> {
        options.query = options.query ?? '';
        options.page = options.page ?? 1;

        const url = new URL(`${this.modelUrl}/search`);
        url.searchParams.set('w', options.query);
        if (options.kind) {
            url.searchParams.set('c', options.kind.join(','));
        }
        if (options.time) {
            url.searchParams.set('time', options.time.join(','));
        }
        if (options.reservationCapable) {
            url.searchParams.set('r', '予約ができる');
        }
        if (options.materials) {
            url.searchParams.set('m', options.materials.join(','));
        }

        url.searchParams.set('page', options.page.toString());

        const res = await rp({
            uri: url.toString(),
            method: 'GET',
            json: false
        });

        const recipes = new Parser(url.toString()).parseSearchResult(res);
        return recipes;
    }

    public async recipe(recipeNumber: string): Promise<{ url: string; recipe: Recipe }> {
        const url = `${this.modelUrl}/${recipeNumber}`;
        const res = await rp(url);
        const parser = new Parser(this.modelUrl);
        return {
            url,
            recipe: parser.parseRecipe(res),
        }
    }
}