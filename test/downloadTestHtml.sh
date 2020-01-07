#!/bin/sh

set -e

dl_needed() {
    if [ "$HOTCOOK_TEST_FORCE_DOWNLOAD" == "true" ]; then
        return 1;
    fi

    if [ -f $1 ]; then
        return 0;
    else
        return 1;
    fi
}

mkdir -p $(dirname "$0")/data && cd $(dirname "$0")/data;

dl_needed 'recipe.html' || curl 'https://cook-healsio.jp/hotcook/HW24E/recipes/R4068' > recipe.html;
dl_needed 'recipe_noCalorie.html' || curl 'https://cook-healsio.jp/hotcook/HW24C/recipes/R4164' > recipe_noCalorie.html;
dl_needed 'recipe_manyNormalBox.html' || curl 'https://cook-healsio.jp/hotcook/HW24C/recipes/R4427' > recipe_manyNormalBox.html
dl_needed 'recipe_noRecipeNumber.html' || curl 'https://cook-healsio.jp/hotcook/HW24C/recipes/R4151' > recipe_noRecipeNumber.html
dl_needed 'searchResult.html' || curl 'https://cook-healsio.jp/hotcook/HW24C/recipes/search?w=%E3%81%98%E3%82%83%E3%81%8C%E3%81%84%E3%82%82' > searchResult.html;
