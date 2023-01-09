import nconf from 'nconf';

import { Request, Response, NextFunction } from 'express';
import { TopicObject } from '../types';

import user from '../user';
import plugins from '../plugins';
import topics from '../topics';
import posts from '../posts';
import helpers from './helpers';

type ComposerBuildData = {
    templateData: TemplateData
}

type TemplateData = {
    title: string,
    disabled: boolean
}

type Locals = {
    metaTags: { [key: string]: string };
}

export async function get(req: Request, res: Response<object, Locals>, callback: NextFunction): Promise<void> {
	res.locals.metaTags = {
		...res.locals.metaTags,
		name: 'robots',
		content: 'noindex',
	};

	const data: ComposerBuildData = await plugins.hooks.fire('filter:composer.build', {
		req: req,
		res: res,
		next: callback,
		templateData: {},
	}) as ComposerBuildData;

	if (res.headersSent) {
		return;
	}
	if (!data || !data.templateData) {
		return callback(new Error('[[error:invalid-data]]'));
	}

	if (data.templateData.disabled) {
		res.render('', {
			title: '[[modules:composer.compose]]',
		});
	} else {
		data.templateData.title = '[[modules:composer.compose]]';
		res.render('compose', data.templateData);
	}
}

type ComposerData = {
    uid: number,
    req: Request<object, object, ComposerData>,
    timestamp: number,
    content: string,
    fromQueue: boolean,
    tid?: number,
    cid?: number,
    title?: string,
    tags?: string[],
    thumb?: string,
    noscript?: string
}

type QueueResult = {
    uid: number,
    queued: boolean,
    topicData: TopicObject,
    pid: number
}

export async function post(req: Request<object, object, ComposerData> & { uid: number }, res: Response): Promise<void> {
	const { body } = req;
	const data: ComposerData = {
		uid: req.uid,
		req: req,
		timestamp: Date.now(),
		content: body.content,
		fromQueue: false,
	};
	req.body.noscript = 'true';

	if (!data.content) {
		await helpers.noScriptErrors(req, res, '[[error:invalid-data]]', 400);
		return;
	}
	async function queueOrPost(postFn: (data: ComposerData) => Promise<QueueResult>, data: ComposerData) {
		// The next line calls a module that has not been updated to TS yet
		// eslint-disable-next-line
        const shouldQueue = await posts.shouldQueue(req.uid, data);
		if (shouldQueue) {
			delete data.req;

			// The next line calls a module that has not been updated to TS yet
			// eslint-disable-next-line
			return await posts.addToQueue(data);
		}
		return await postFn(data);
	}

	try {
		let result: QueueResult;
		if (body.tid) {
			data.tid = body.tid;

			// The next line calls a module that has not been updated to TS yet
			// eslint-disable-next-line
			result = await queueOrPost(topics.reply, data);
		} else if (body.cid) {
			data.cid = body.cid;
			data.title = body.title;
			data.tags = [];
			data.thumb = '';

			// The next line calls a module that has not been updated to TS yet
			// eslint-disable-next-line
			result = await queueOrPost(topics.post, data);
		} else {
			throw new Error('[[error:invalid-data]]');
		}
		if (result.queued) {
			return res.redirect(`${nconf.get('relative_path') as string || '/'}?noScriptMessage=[[success:post-queued]]`);
		}
		const uid: number = result.uid ? result.uid : result.topicData.uid;

		// The next line calls a module that has not been updated to TS yet
		// eslint-disable-next-line
		user.updateOnlineUsers(uid);

		const path: string = result.pid ? `/post/${result.pid}` : `/topic/${result.topicData.slug}`;
		res.redirect((nconf.get('relative_path') as string) + path);
	} catch (err: unknown) {
		if (err instanceof Error) {
			await helpers.noScriptErrors(req, res, err.message, 400);
		}
	}
}
