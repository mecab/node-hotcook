export const TESTMODE_ENV_KEY = 'HOTCOOK_TEST_TESTMODE';

export function testMode(): string {
    if (!process.env[TESTMODE_ENV_KEY]) {
        console.log('testmode = "src"');
        return 'src'
    }

    if (process.env[TESTMODE_ENV_KEY] === 'src') {
        console.log('testmode = "src"');
        return 'src';
    }

    if (process.env[TESTMODE_ENV_KEY] === 'dist') {
        console.log('testmode = "dist"');
        return 'dist';
    }

    throw new Error(`${TESTMODE_ENV_KEY} must be 'src', 'dist' or empty`);
}