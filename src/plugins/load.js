'use strict';

const semver = require('semver');
const async = require('async');
const winston = require('winston');
const nconf = require('nconf');
const _ = require('lodash');

const meta = require('../meta');
const { themeNamePattern } = require('../constants');

module.exports = function (Plugins) {
	async function registerPluginAssets(pluginData, fields) {
		function add(dest, arr) {
			dest.push(...(arr || []));
		}

		const handlers = {
			staticDirs: async function (next) {
				next(null, await Plugins.data.getStaticDirectories(pluginData));
			},
			cssFiles: async function (next) {
				next(null, await Plugins.data.getFiles(pluginData, 'css'));
			},
			lessFiles: async function (next) {
				next(null, await Plugins.data.getFiles(pluginData, 'less'));
			},
			acpLessFiles: async function (next) {
				next(null, await Plugins.data.getFiles(pluginData, 'acpLess'));
			},
			clientScripts: async function (next) {
				next(null, await Plugins.data.getScripts(pluginData, 'client'));
			},
			acpScripts: async function (next) {
				next(null, await Plugins.data.getScripts(pluginData, 'acp'));
			},
			modules: async function (next) {
				next(null, await Plugins.data.getModules(pluginData));
			},
			languageData: async function (next) {
				next(null, await Plugins.data.getLanguageData(pluginData));
			},
		};

		let methods = {};
		if (Array.isArray(fields)) {
			fields.forEach((field) => {
				methods[field] = handlers[field];
			});
		} else {
			methods = handlers;
		}

		async.parallel(methods).then((results) => {
			Object.assign(Plugins.staticDirs, results.staticDirs || {});

			add(Plugins.cssFiles, results.cssFiles);
			add(Plugins.lessFiles, results.lessFiles);
			add(Plugins.acpLessFiles, results.acpLessFiles);
			add(Plugins.clientScripts, results.clientScripts);
			add(Plugins.acpScripts, results.acpScripts);
			Object.assign(meta.js.scripts.modules, results.modules || {});

			if (results.languageData) {
				Plugins.languageData.languages = _.union(Plugins.languageData.languages, results.languageData.languages);
				Plugins.languageData.namespaces = _.union(Plugins.languageData.namespaces, results.languageData.namespaces);
				pluginData.languageData = results.languageData;
			}

			Plugins.pluginsData[pluginData.id] = pluginData;
		});
	}

	Plugins.prepareForBuild = async function (targets) {
		const map = {
			'plugin static dirs': ['staticDirs'],
			'requirejs modules': ['modules'],
			'client js bundle': ['clientScripts'],
			'admin js bundle': ['acpScripts'],
			'client side styles': ['cssFiles', 'lessFiles'],
			'admin control panel styles': ['cssFiles', 'lessFiles', 'acpLessFiles'],
			languages: ['languageData'],
		};

		const fields = _.uniq(_.flatMap(targets, target => map[target] || []));

		// clear old data before build
		fields.forEach((field) => {
			switch (field) {
				case 'clientScripts':
				case 'acpScripts':
				case 'cssFiles':
				case 'lessFiles':
				case 'acpLessFiles':
					Plugins[field].length = 0;
					break;
				case 'languageData':
					Plugins.languageData.languages = [];
					Plugins.languageData.namespaces = [];
					break;
			// do nothing for modules and staticDirs
			}
		});

		winston.verbose(`[plugins] loading the following fields from plugin data: ${fields.join(', ')}`);
		const plugins = await Plugins.data.getActive();
		await Promise.all(plugins.map(p => registerPluginAssets(p, fields)));
	};

	Plugins.loadPlugin = async function (pluginPath) {
		let pluginData;
		try {
			pluginData = await Plugins.data.loadPluginInfo(pluginPath);
		} catch (err) {
			if (err.message === '[[error:parse-error]]') {
				return;
			}
			if (!themeNamePattern.test(pluginPath)) {
				throw err;
			}
			return;
		}
		checkVersion(pluginData);

		try {
			registerHooks(pluginData);
			await registerPluginAssets(pluginData);
		} catch (err) {
			winston.error(err.stack);
			winston.verbose(`[plugins] Could not load plugin : ${pluginData.id}`);
			return;
		}

		if (!pluginData.private) {
			Plugins.loadedPlugins.push({
				id: pluginData.id,
				version: pluginData.version,
			});
		}

		winston.verbose(`[plugins] Loaded plugin: ${pluginData.id}`);
	};

	function checkVersion(pluginData) {
		function add() {
			if (!Plugins.versionWarning.includes(pluginData.id)) {
				Plugins.versionWarning.push(pluginData.id);
			}
		}

		if (pluginData.nbbpm && pluginData.nbbpm.compatibility && semver.validRange(pluginData.nbbpm.compatibility)) {
			if (!semver.satisfies(nconf.get('version'), pluginData.nbbpm.compatibility)) {
				add();
			}
		} else {
			add();
		}
	}

	function registerHooks(pluginData) {
		try {
			if (!Plugins.libraries[pluginData.id]) {
				Plugins.requireLibrary(pluginData);
			}

			if (Array.isArray(pluginData.hooks)) {
				pluginData.hooks.forEach(hook => Plugins.hooks.register(pluginData.id, hook));
			}
		} catch (err) {
			winston.warn(`[plugins] Unable to load library for: ${pluginData.id}`);
			throw err;
		}
	}
};
