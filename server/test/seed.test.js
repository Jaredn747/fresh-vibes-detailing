const assert = require('node:assert/strict');
const { afterEach, describe, it } = require('node:test');

const mongoose = require('mongoose');
const Service = require('../models/service');
const seed = require('../seed');

const originalConnect = mongoose.connect;
const originalDisconnect = mongoose.disconnect;
const originalDeleteMany = Service.deleteMany;
const originalInsertMany = Service.insertMany;
const originalMongoUri = process.env.MONGODB_URI;

afterEach(() => {
	mongoose.connect = originalConnect;
	mongoose.disconnect = originalDisconnect;
	Service.deleteMany = originalDeleteMany;
	Service.insertMany = originalInsertMany;

	if (originalMongoUri === undefined) {
		delete process.env.MONGODB_URI;
	} else {
		process.env.MONGODB_URI = originalMongoUri;
	}
});

describe('service seed utility', () => {
	it('builds all 16 services with HTML descriptions from booking.html', () => {
		const services = seed.buildServices();

		assert.equal(services.length, 16);
		assert.deepEqual(services.map((service) => service.serviceKey), seed.serviceDetails.map((service) => service.serviceKey));

		for (const service of services) {
			assert.ok(service.title);
			assert.ok(service.price);
			assert.ok(service.duration);
			assert.ok(service.shortDescription);
			assert.match(service.fullDescription, /<\w+[\s>]/);
		}
	});

	it('clears and inserts all services, then disconnects', async () => {
		const calls = [];
		let insertedServices;
		process.env.MONGODB_URI = 'mongodb://test.example/services';
		mongoose.connect = async (uri) => calls.push(['connect', uri]);
		mongoose.disconnect = async () => calls.push(['disconnect']);
		Service.deleteMany = async (filter) => calls.push(['deleteMany', filter]);
		Service.insertMany = async (services) => {
			insertedServices = services;
			calls.push(['insertMany', services]);
		};

		await seed.seedServices();

		assert.deepEqual(calls.map(([operation]) => operation), ['connect', 'deleteMany', 'insertMany', 'disconnect']);
		assert.deepEqual(calls[1][1], {});
		assert.equal(insertedServices.length, 16);
		assert.deepEqual(Object.keys(insertedServices[0]).sort(), [
			'duration',
			'fullDescription',
			'price',
			'serviceKey',
			'shortDescription',
			'title'
		]);
	});
});
