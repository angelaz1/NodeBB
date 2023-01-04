'use strict';

const db = require('../../database');
const batch = require('../../batch');

module.exports = {
	name: 'Creates user account',
	timestamp: Date.UTC(2023, 1, 1),
	method: async function () {
		const { progress } = this;

		await batch.processSortedSet('users:joindate', async (uids) => {
			progress.incr(uids.length);

			await Promise.all(uids.map(async (uid) => {
				const user_key = `user:${uid}`;
				const settings_key = `user:${uid}:settings`;

				if (!db.isObjectField(user_key, 'accounttype')) {
					await db.setObjectField(
						user_key, 
						'accounttype',
						'student'
					);
				}
			}));
		}, {
			batch: 500,
			progress: progress,
		});
	},
};
