import { URL } from 'url';
import cheerio from 'cheerio';

export interface RecipeInfo {
    id: string;
    name: string;
    url: string;
    imageUrl: string;
}

export interface Recipe {
    title: string;
    materialTitle: string;
    recipeNumber: string;
    time: string;
    calorie: string | null;
    materials: MaterialGroup[];
    note: string;
    process: string[];
    imageUrl: string;
}

export interface MaterialGroup {
    materials: Material[];
    title?: string;
}

export interface Material {
    name: string;
    amount: string;
}

const BASE_URL = 'https://cook-healsio.jp/hotcook/HW24C/recipes';

export class Parser {
    private _baseUrl: string;

    constructor(baseUrl = BASE_URL) {
        this._baseUrl = baseUrl;
    }

    private _extractUrlFromCssValue(css: string): string  {
        return css.match(/url\((.+)\)/)?.[1] ?? '';
    }

    parseSearchResult(html: string): RecipeInfo[] {
        const $ = cheerio.load(html);

        const data = $('.recipe_item')
            .toArray()
            .map((e) => {
                const $item = $(e);
                const url = $item.find('a').first().attr('href') || '';
                const imageUrl = $item.find('.recipe_itemImg > img.pc').attr('style') || '';
                return {
                    url: new URL(url, this._baseUrl).toString(),
                    imageUrl: new URL(this._extractUrlFromCssValue(imageUrl), this._baseUrl).toString(),
                    name: $item.find('.recipe_recipeName').text() || '',
                    id: url.split('/').slice(-1)[0] || '0',
                };
            });

        return data;
    }

    parseRecipe(html: string): Recipe {
        const $ = cheerio.load(html);

        const title = $('.mv_ttl').text();
        const $material = $('.material');
        const materialTitle = $material.find('.subTtl').text();
        const recipeNumber = $('.iconBox .iconBox_item-2row').first().text().replace(/(\r|\n|\r\n|\s)/gm, '');
        const time = $('.mv_timeKcalItem .mv_iconText').first().text().trim();
        const calorie = $('.mv_timeKcalItem .mv_iconText').length === 2 ? $('.mv_timeKcalItem .mv_iconText').last().text().replace('カロリー：', '').trim() : null;

        const imageUrl = new URL($('.mv_img img').attr('src') ?? '', this._baseUrl).toString();

        const $recipeBoxes = $material.find('.inner > div');

        let materials = $recipeBoxes.toArray()
            .map((e): MaterialGroup => {
                const $box = $(e);
                const groupTitle = $box.find('h4').text().trim();

                const materials = $box.find('tr')
                    .toArray()
                    .map((row): Material => {
                        const $row= $(row);
                        return {
                            name: $row.find('td').first().text().trim(),
                            amount: $row.find('td').last().text().trim(),
                        }
                    });

                return {
                    title: !!groupTitle ? groupTitle : undefined,
                    materials: materials
                }
            });

        // 同じグループタイトル（タイトルなし、A、Bとか）の連続したMaterialGroupがあったらまとめる。
        // （特にタイトルなしの場合、1具ににつき1テーブルになってる（ナンデ！？！？）のでまとめるべき）。
        materials = materials.reduce((current: MaterialGroup[], next: MaterialGroup): MaterialGroup[] => {
            const lastGroup = current[current.length - 1];

            // !lastGroup <= これは一番最初のreducer呼び出し
            if (!lastGroup || lastGroup.title != next.title) {
                current.push(next);
            }
            else {
                lastGroup.materials.push(...next.materials);
            }
            return current;
        }, []);

        const note = $material.find('.recipe_note')
            .text()
            .trim()
            .split('\n')
            .map(e => e.trim())
            .join(' ');
        const $recipeBox = $('.recipeBox');
        const process = $recipeBox.find('.recipe_textItem')
            .toArray()
            .map((e): string => {
                const $process = $(e);
                return $process.find('.recipe_text')
                    .toArray()
                    .map(line => $(line).text())
                    .join('\n');
            });

        return {
            title,
            materialTitle,
            materials,
            time,
            calorie,
            note,
            process,
            recipeNumber: recipeNumber || '手動',
            imageUrl
        }
    }
}