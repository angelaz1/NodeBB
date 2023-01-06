'use strict';

import { LoDashStatic } from "lodash";

const _ : LoDashStatic = require('lodash');
const plugins = require('./plugins');
const db = require('./database');

const social = module.exports;

social.postSharing = null;

social.getPostSharing = async function () {
	if (social.postSharing) {
		return _.cloneDeep(social.postSharing);
	}

	let networks : { id: string; name: string; class: string; activated: boolean | null; }[] = [
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
	networks = await plugins.hooks.fire('filter:social.posts', networks);
	const activated = await db.getSetMembers('social:posts.activated');
	networks.forEach((network) => {
		network.activated = activated.includes(network.id);
	});

	social.postSharing = networks;
	return _.cloneDeep(networks);
};

social.getActivePostSharing = async function () {
	const networks = await social.getPostSharing();
	return networks.filter(network => network && network.activated);
};

social.setActivePostSharingNetworks = async function (networkIDs) {
	social.postSharing = null;
	await db.delete('social:posts.activated');
	if (!networkIDs.length) {
		return;
	}
	await db.setAdd('social:posts.activated', networkIDs);
};

require('./promisify')(social);
