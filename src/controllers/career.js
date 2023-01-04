'use strict';


const nconf = require('nconf');
const validator = require('validator');
const qs = require('querystring');

const db = require('../database');
const privileges = require('../privileges');
const user = require('../user');
const categories = require('../categories');
const meta = require('../meta');
const pagination = require('../pagination');
const helpers = require('./helpers');
const utils = require('../utils');
const translator = require('../translator');
const analytics = require('../analytics');

const careerController = module.exports;

careerController.get = async function (req, res, next) {
	const userData = await user.getUserFields(req.uid, ['accounttype']);
	
	let accountType = userData['accounttype'];
	let careerData = {};

	if (accountType == 'recruiter') {
		careerData.allData = await user.getAllCareerData();
	} else {
		careerData = await user.getCareerData(req.uid) ?? { newAccount: true };
	}
	
	careerData.accountType = accountType;
	careerData.breadcrumbs = helpers.buildBreadcrumbs([{ text: 'Career', url: '/career' }]);
	res.render('career', careerData);
};
