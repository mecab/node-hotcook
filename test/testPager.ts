import assert = require('assert');

import * as sinon from 'sinon';
import { PagenatedOptions } from '../src/pager';
import { PagerFactory } from '../src/pager';
import { after } from 'mocha';

function range(start: number, num: number) {
    return Array.from(Array(num).keys()).map(e => e + start);
}

describe('PagerFactory test', function() {
    const fake = sinon.fake();
    const testFunc = (options: PagenatedOptions): Promise<Number[]> =>  {
        fake();
        if (!options.page) {
            assert.fail();
        }
        if (options.page < 4) {
            // page 1: 1
            // page 2: 2, 2
            // ...
            // page 4: 1, 2, 3, 4
            return Promise.resolve(range(1, options.page));
        }
        else {
            return Promise.resolve([]);
        }
    };

    describe('Create the iterator to iterate items on all pages', function() {
        it('returns an iterator represents flatten items', async function() {
            const arr = [];

            for await (const i of PagerFactory.create(testFunc, {})) {
                arr.push(i);
            }

            assert.deepEqual(arr, [1, 1, 2, 1, 2, 3]);
        });

        it ('calls test function correct times', async function() {
            assert(fake.callCount === 4);
        });

        after(() => {
            fake.resetHistory();
        })
    });

    describe('maxPage specified iterator test', function() {
        it('returns an iterator represents flatten items but up to page 2', async function() {
            const arr = [];

            for await (const i of PagerFactory.create(testFunc, {}).maxPage(2)) {
                arr.push(i);
            }

            assert.deepEqual(arr, [1, 1, 2]);
        });

        it ('calls test function correct times', async function() {
            assert(fake.callCount === 2);
        });

        after(() => {
            fake.resetHistory();
        });
    });

    describe('getPage test', function() {
        it('returns the promise of items array', async function() {
            const arr = await PagerFactory.create(testFunc, {}).getPage(2);

            assert.deepEqual(arr, [1, 2]);
        });

        it ('calls test function correct times', async function() {
            assert(fake.callCount === 1);
        });

        after(() => {
            fake.resetHistory();
        })
    })
});