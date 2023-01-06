'use strict';

const __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
	function adopt(value) { return value instanceof P ? value : new P((resolve) => { resolve(value); }); }
	return new (P || (P = Promise))((resolve, reject) => {
		function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
		function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
		function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
		step((generator = generator.apply(thisArg, _arguments || [])).next());
	});
};
const _ = require('lodash');
const plugins = require('./plugins');
const db = require('./database');

const social = module.exports;
social.postSharing = null;
social.getPostSharing = function () {
	return __awaiter(this, void 0, void 0, function* () {
		if (social.postSharing) {
			return _.cloneDeep(social.postSharing);
		}
		let networks = [
			{
				id: 'facebook',
				name: 'Facebook',
				class: 'fa-facebook',
				activated: null,
			},
			{
				id: 'twitter',
				name: 'Twitter',
				class: 'fa-twitter',
				activated: null,
			},
		];
		networks = yield plugins.hooks.fire('filter:social.posts', networks);
		const activated = yield db.getSetMembers('social:posts.activated');
		networks.forEach((network) => {
			network.activated = activated.includes(network.id);
		});
		social.postSharing = networks;
		return _.cloneDeep(networks);
	});
};
social.getActivePostSharing = function () {
	return __awaiter(this, void 0, void 0, function* () {
		const networks = yield social.getPostSharing();
		return networks.filter(network => network && network.activated);
	});
};
social.setActivePostSharingNetworks = function (networkIDs) {
	return __awaiter(this, void 0, void 0, function* () {
		social.postSharing = null;
		yield db.delete('social:posts.activated');
		if (!networkIDs.length) {
			return;
		}
		yield db.setAdd('social:posts.activated', networkIDs);
	});
};
require('./promisify')(social);
