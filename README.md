ホットクック レシピ検索 パッケージ
=============================

[ホットクック](https://cook-healsio.jp/hotcook/)の公式レシピ検索サイトを楽にスクレイピングするAPIを提供します。

インストール
----------

```bash
$ npm install @mecab/hotcook
```
### 以下の環境を想定しています
  - Node.js >= v.10.0.0
  - TypeScript での利用を推奨します。（型定義ファイルを用意してあり、特に検索時のオプションの指定が便利です。）

使い方
-----

### 1. レシピを検索する

#### 1.1 簡単な例

```typescript
(async () => {
    const hotcook = new Hotcook('HW24C'); // 省略した場合、デフォルトはHW24Cです。
    const result = hotcook.search('じゃがいも');
    for await (const recipe of result) {
        console.log(recipe);
    }
})();

// {
// url: 'https://cook-healsio.jp/hotcook/HW24C/recipes/R4086',
// imageUrl: 'https://cook-healsio.jp/hotcook/asset/images/search/img_recipe_pc.png',
// name: 'いも・かぼちゃ(ゆで)',
// id: 'R4086'
// }
// {
// url: 'https://cook-healsio.jp/hotcook/HW24C/recipes/R4012',
// imageUrl: 'https://cook-healsio.jp/hotcook/asset/images/search/img_recipe_pc.png',
// name: 'おでん',
// id: 'R4012'
// }
// ...
// {
// url: 'https://cook-healsio.jp/hotcook/HW24C/recipes/R4080',
// imageUrl: 'https://cook-healsio.jp/hotcook/asset/images/search/img_recipe_pc.png',
// name: '野菜スープ',
// id: 'R4080'
// }
```

レシピの検索結果を返すイテレーターを返します。このイテレーターは、必要に応じて後ろのページを自動的に取得します。すなわち、`for await` 文で最後まで反復させると、ページをまたいで最後のレシピまで全て取得します。

結果のレシピ名が長い場合（1.3., 1.4. 参照）省略されてしまいますが、検索結果ページのHTML上で結果が省略されているので、元のレシピ名を取得することはできません。完全なレシピ名が必要な場合、2. のレシピ詳細を取得してください。

#### 1.2. 完全なオプション
```typescript
(async () => {
    const hotcook = new Hotcook();
    const result = hotcook.search('じゃがいも', {
        kind: ['ゆで物', '煮物'],
        time: ['30分未満', '30分以上1時間未満', '1時間以上'],
        materials: ['大根・にんじん'],
        reservationCapable: true
    });
    for await (const recipe of result) {
        console.log(recipe.name);
    }
})();

// おでん
// 豚バラ肉と野菜の煮物
```

クエリをオプションに含めて、

```typescript
hotcook.search({
    query: 'じゃがいも',
    kind: ['ゆで物', '煮物'],
    ...
})
```

としても良いです。全てのオプションは省略できます。オプションとして利用できる値は、公式の検索ページで利用できる値そのままです。詳しくは型定義ファイルをご覧ください。

#### 1.3. 最大ページ数を指定
```typescript
(async () => {
    const hotcook = new Hotcook();
    const result = hotcook.search('じゃがいも').maxPage(1);
    for await (const recipe of result) {
        console.log(recipe.name);
    }
})();

// いも・かぼちゃ(ゆで)
// おでん
// かぼちゃのポテトサラ...
// 殻付きあさりのクラム...
// キャベツとじゃがいも...
// クラムチャウダー
// クリームシチュー
// コクうまカムジャタン...
// ごろっと具材のクリー...
// じゃがいもと牛肉の中...
// じゃがいもとれんこん...
// じゃがいもの甘辛炒め
```

#### 1.4. 特定のページのみを取得
```typescript
(async () => {
    const hotcook = new Hotcook();
    const result = hotcook.search('じゃがいも');
    for (const recipe of await result.getPage(2)) { // awaitの位置に注意
        console.log(recipe.name);
    }
})();

// じゃがいものポタージ...
// じゃがいものみそシチ...
// じゃがいもの冷製スー...
// 卵入りポテトサラダ
// 大豆のミネストローネ...
// トマトたっぷりビーフ...
// 鶏とじゃがいもの炒め...
// 肉じゃが
// バターチキンカレー(...
// ビーフカレー
// ビーフシチュー
// 豚バラ肉と野菜の煮物
```

`hotcook.search()` が返すイテレータには、`getPage(page: Number)` メソッドがあります。このメソッドは、指定されたページ上のレシピ一覧を取得し、その配列に解決されるPromiseを返します。

### 2. レシピの詳細を取得する
```typescript
(async () => {
    const hotcook = new Hotcook();
    const recipe = await hotcook.recipe('R4006'); // 検索結果の`recipe.id`
    console.log(recipe);
    console.log();
    console.log('materials')
    recipe.recipe.materials.forEach(e => {
        console.log(`=== ${e.title ?? ''} ===`);
        console.log(e.materials);
    })
})();

// {
// url: 'https://cook-healsio.jp/hotcook/HW24C/recipes/R4006',
// recipe: {
//     title: '八宝菜',
//     materialTitle: '材料：4人分',
//     materials: [ [Object], [Object] ],
//     time: '20分',
//     calorie: '約119kcal',
//     note: '＊4～6人分まで自動でできます。',
//     process: [
//     'まぜ技ユニットを本体にセットする。',
//     'えびは殻、尾、背ワタを取る。肉・魚介類に片栗粉をまぶす。にんじんは短冊切りにする。その他の食材はひと口大に切る。',
//     '内鍋に野菜、肉・魚介類の順に入れ、よく混ぜ合わせた[A]を加えて本体にセットする。\n' +
//         'メニューを選ぶ → メニュー番号で探す → No.006（八宝菜） → 調理を開始する → ' +
//         'スタート',
//     ' 加熱後、全体を混ぜる。\n※写真は、加熱後にゆでたうずら卵を加えています。'
//     ],
//     recipeNumber: '自動6',
//     imageUrl: 'https://cook-healsio.jp/hotcook/images/800x600/R4006.jpg'
// }
// }
//
// materials
// ===  ===
// [
// { name: '肉・魚介類　(豚、えび、いかなど）', amount: '250g' },
// { name: '片栗粉', amount: '大さじ2' },
// { name: '緑黄色野菜　(ピーマン、パプリカ、にんじんなど）', amount: '300g' },
// { name: '白菜', amount: '300g' }
// ]
// === A ===
// [
// { name: '酒', amount: '大さじ4' },
// { name: '薄口しょうゆ', amount: '小さじ2' },
// { name: '鶏がらスープの素（顆粒）', amount: '小さじ2' },
// { name: '塩、こしょう', amount: '各少々' }
// ]
```
