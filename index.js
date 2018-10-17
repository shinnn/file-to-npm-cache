'use strict';

const {lstat} = require('fs');
const {promisify} = require('util');
const {isAbsolute, parse, resolve} = require('path');

const {get: {info}, put: {stream}} = require('npcache');
const inspectWithKind = require('inspect-with-kind');
const isPlainObj = require('is-plain-obj');
const pump = require('pump');
const {create} = require('tar');

const PATH_ERROR = 'Expected a file path (<string>) to save its contents to the npm cache folder';
const promisifiedLstat = promisify(lstat);
const promisifiedPump = promisify(pump);

module.exports = async function fileToNpmCache(...args) {
	const argLen = args.length;

	if (argLen !== 2 && argLen !== 3) {
		throw new RangeError(`Expected 2 or 3 arguments (<string>, <string>[, <Object>]), but got ${
			argLen === 0 ? 'no' : argLen
		} arguments.`);
	}

	const [path, key, options] = args;

	// support more path types for example `URL` and `Buffer` when we drop support for Node.js < 10
	if (typeof path !== 'string') {
		const error = new TypeError(`${PATH_ERROR}, but got a non-string value ${
			inspectWithKind(key)
		}.`);
		error.code = 'ERR_INVALID_ARG_TYPE';

		throw error;
	}

	if (path === '') {
		const error = new Error(`${PATH_ERROR.replace('(<string>)', '')}, but got '' (empty string).`);
		error.code = 'ERR_INVALID_ARG_VALUE';

		throw error;
	}

	if (typeof key !== 'string') {
		const error = new TypeError(`Expected an npm cache key (<string>) used to save a file, but got a non-string value ${
			inspectWithKind(key)
		}.`);
		error.code = 'ERR_INVALID_ARG_VALUE';

		throw error;
	}

	if (argLen === 3) {
		if (!isPlainObj(options)) {
			const error = new TypeError(`Expected an <Object> to set file-to-npm-cache, but got ${
				inspectWithKind(options)
			}.`);
			error.code = 'ERR_INVALID_ARG_TYPE';

			throw error;
		}
	}

	const absolutePath = resolve(path);
	const [putStream, stat] = await Promise.all([
		stream(key, options),
		promisifiedLstat(absolutePath)
	]);
	let getInfo;

	if (!stat.isFile()) {
		throw new Error(`Expected a file path to save it as an npm cache, but the entry at ${path}${
			isAbsolute(path) ? '' : ` (${absolutePath})`
		} is not a file.`);
	}

	putStream.on('integrity', () => {
		getInfo = info(key);
	});

	const {dir, base} = parse(absolutePath);
	const tarStream = create({
		cwd: dir,
		strict: true,
		gzip: true
	}, [base]);

	await promisifiedPump(tarStream, putStream);
	return getInfo;
};
