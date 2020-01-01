#!/bin/sh

set -e

mkdir -p $(dirname "$0")/data && cd $(dirname "$0")/data;
curl 'https://cook-healsio.jp/hotcook/HW24E/recipes/R4068' > recipe.html;
curl 'https://cook-healsio.jp/hotcook/HW24C/recipes/R4164' > recipe_noCalorie.html;
curl 'https://cook-healsio.jp/hotcook/HW24C/recipes/R4427' > recipe_manyNormalBox.html
curl 'https://cook-healsio.jp/hotcook/HW24C/recipes/R4151' > recipe_noRecipeNumber.html
curl 'https://cook-healsio.jp/hotcook/HW24C/recipes/search?w=%E3%81%98%E3%82%83%E3%81%8C%E3%81%84%E3%82%82' > searchResult.html;
