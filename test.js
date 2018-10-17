'use strict';

const {join, parse} = require('path');
const {lstat, readFile} = require('fs').promises;

const tmp = join(__dirname, 'tmp');

process.env.npm_config_cache = tmp;

const restoreNpmCache = require('restore-npm-cache');
const fileToNpmCache = require('.');
const rmfr = require('rmfr');
const test = require('tape');

const {root} = parse(__dirname);

process.chdir(root);

test('fileToNpmCache()', async t => {
	await rmfr(tmp);

	const fixturePath = join(__dirname, '.gitignore');
	const expected = await readFile(fixturePath);
	const {key, size, path} = await fileToNpmCache(fixturePath, 'a');

	await restoreNpmCache(key, {cwd: tmp});

	t.ok(
		(await readFile(join(tmp, '.gitignore'))).equals(expected),
		'should cache a file to the npm cache folder.'
	);

	t.equal(
		(await lstat(path)).size,
		size,
		'should obtain created cache info.'
	);

	await fileToNpmCache(fixturePath, 'b', {
		metadata: {
			customData: [1, 2, 3]
		}
	});

	const {metadata} = await restoreNpmCache('b', {cwd: join(tmp, 'another')});

	t.ok(
		(await readFile(join(tmp, 'another', '.gitignore'))).equals(expected),
		'should support cacache options.'
	);

	t.deepEqual(
		metadata,
		{
			customData: [1, 2, 3]
		},
		'should reflect options to the result.'
	);

	try {
		await fileToNpmCache(join(__dirname, 'this', 'file', 'does', 'not', 'exist'), '_');
		t.fail('.');
	} catch ({code}) {
		t.equal(
			code,
			'ENOENT',
			'should fail when the files doesn\'t exist.'
		);
	}

	try {
		await fileToNpmCache('.', '_');
		t.fail('Unexpectedly succeeded.');
	} catch ({message}) {
		t.equal(
			message,
			`Expected a file path to save it as an npm cache, but the entry at . (${root}) is not a file.`,
			'should fail when it takes a non-file relative path.'
		);
	}

	try {
		await fileToNpmCache(__dirname, '_');
		t.fail('Unexpectedly succeeded.');
	} catch ({message}) {
		t.equal(
			message,
			`Expected a file path to save it as an npm cache, but the entry at ${__dirname} is not a file.`,
			'should fail when it takes a non-file absolute path.'
		);
	}

	t.end();
});

test('Argument validation', async t => {
	async function getError(...args) {
		try {
			return await fileToNpmCache(...args);
		} catch (err) {
			return err;
		}
	}

	t.equal(
		(await getError(Symbol('_'), '_')).toString(),
		'TypeError: Expected a file path (<string>) to save its contents to the npm cache folder, but got a non-string value \'_\' (string).',
		'should fail when the first argument is not a string.'
	);

	t.equal(
		(await getError('', '_')).toString(),
		'Error: Expected a file path  to save its contents to the npm cache folder, but got \'\' (empty string).',
		'should fail when the first argument is an empty string.'
	);

	t.equal(
		(await getError('_', new Int32Array())).toString(),
		'TypeError: Expected an npm cache key (<string>) used to save a file, but got a non-string value Int32Array [].',
		'should fail when the second argument is not a string.'
	);

	t.equal(
		(await getError('a', 'b', [-0])).toString(),
		'TypeError: Expected an <Object> to set file-to-npm-cache, but got [ -0 ] (array).',
		'should fail when the third argument is not a plain object.'
	);

	t.equal(
		(await getError()).toString(),
		'RangeError: Expected 2 or 3 arguments (<string>, <string>[, <Object>]), but got no arguments.',
		'should fail when it takes no arguments.'
	);

	t.equal(
		(await getError('_', '_', {}, {})).toString(),
		'RangeError: Expected 2 or 3 arguments (<string>, <string>[, <Object>]), but got 4 arguments.',
		'should fail when it takes too many arguments.'
	);

	t.end();
});
