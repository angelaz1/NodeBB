import _ from 'lodash';
import plugins from './plugins';
import db from './database';

import { Network } from './types';

let postSharing: Network[] | null = null;

export async function getPostSharing(): Promise<Network[]> {
	if (postSharing) {
		return _.cloneDeep(postSharing);
	}

	let networks : Network[] = [
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

	networks = await plugins.hooks.fire('filter:social.posts', networks) as Network[];

	// The next line calls a module that has not been updated to TS yet
	// eslint-disable-next-line
	const activated: string[] = await db.getSetMembers('social:posts.activated');

	networks.forEach((network) => {
		network.activated = activated.includes(network.id);
	});

	postSharing = networks;
	return _.cloneDeep(networks);
}

export async function getActivePostSharing(): Promise<Network[]> {
	const networks: Network[] = await getPostSharing();
	return networks.filter(network => network && network.activated);
}

export async function setActivePostSharingNetworks(networkIDs: string[]): Promise<void> {
	postSharing = null;

	// The next line calls a module that has not been updated to TS yet
	// eslint-disable-next-line
	await db.delete('social:posts.activated');

	if (!networkIDs.length) {
		return;
	}

	// The next line calls a module that has not been updated to TS yet
	// eslint-disable-next-line
	await db.setAdd('social:posts.activated', networkIDs);
}
