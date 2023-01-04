'use strict';

const helpers = require('../helpers');
const user = require('../../user');
const db = require('../../database');
const {spawn} = require('child_process');

const Career = module.exports;

Career.register = async (req, res) => {
    const userData = req.body;
	try {
        let userCareerData = {
            name: userData.name,
            email: userData.email,
            age: parseInt(userData.age, 10),
            gender: userData.gender
        };

        userCareerData.prediction = Math.random(); // TODO: Somehow call python script???

        await user.setCareerData(req.uid, userCareerData);
        db.sortedSetAdd('users:career', req.uid, req.uid)
        res.json({});

	} catch (err) {
        console.log(err);
		helpers.noScriptErrors(req, res, err.message, 400);
	}
};
