const i18n = require('i18next');
const request = require('request');

const queryParams = "?complete=true"; // for getting the whole Project with Collections with Items

class VoiceCMS {

	endpoint; // Endpoint of the Voice CMS API
	projectId; // The ID of the Project in the CMS

	constructor(options) {
		this.endpoint = options.endpoint;
		this.projectId = options.projectId;
	}

	install(app) {
		app.middleware('setup').use(this.setResources.bind(this));
	}

	async setResources(handleRequest) {
		try {
			const response = await this.getProject(this.projectId);
			const project = response.project;

			// collections as arrays of objects
			const resourcesAsObjArrays = this.parseResourcesAsObjArrays(project);

			// resources for i18n (works only for Collections, that have a 'key' column)
			const i18nResources = this.parseI18nResourcesComplete(project);

			handleRequest.app.$cms.I18Next.i18n = i18n
				.init(
					{
						resources: i18nResources,
						load: 'all',
						returnObjects: true,
						interpolation: {
							escapeValue: false, // do not escape ssml tags
						},
					}
				);

			// put every collection (as an array of objects) into the jovo $cms object
			for (const collection in resourcesAsObjArrays) {
				handleRequest.app.$cms[collection] = resourcesAsObjArrays[collection];
			}

		} catch (err) {
			console.log(err);
		}
	}


	// a collection as an array of objects
	parseResourcesAsObjArrays(project) {
		let resources = {};
		try {
			for (let index = 0; index < project.collections.length; index++) {
				const collection = project.collections[index];

				// make it an array of items, named like the collection
				// but without the _id (only the relevant data)
				resources[collection.name] = collection.items.map(item => item.data);
			}
			return resources;
		} catch (error) {
			console.log(error);
		}
	}

	// currently not used
	// a collection as an object with nested objects named like the item.key
	// (works only for collections, that have a 'key' property)
	parseResourcesAsObjects(project) {
		let resources = {};
		try {
			for (let index = 0; index < project.collections.length; index++) {
				const collection = project.collections[index];
				resources[collection.name] = {};
				// does the collection have a 'key' property? 
				const keyProp = collection.properties.find(prop => prop.name === "key");
				if (keyProp) {
					collection.items.forEach(item => {
						resources[collection.name][item.data.key] = {};
						for (const prop in item.data) {
							if (prop != "key") {
								resources[collection.name][item.data.key][prop] = item.data[prop];
							}
						}
					});
				} else {
					console.log("This collection has no 'key' property!");
				}
			}
			return resources;
		} catch (error) {
			console.log(error);
		}
	}


	// for i18Next
	// every prop of an item is put into the locale object, not just the props that have i18n
	parseI18nResourcesComplete(project) {
		// everything needs to be put in the locale objects, named by collection and key names
		console.time("parseI18nResourcesComplete");
		let resources = {};
		for (const locale of project.locales) {
			resources[locale] = {
				'translation': {}
			}
			try {
				for (let index = 0; index < project.collections.length; index++) {
					const collection = project.collections[index];
					resources[locale]['translation'][collection.name] = {};

					// does the collection have a key property? 
					const keyProp = collection.properties.find(prop => prop.name === "key");
					if (keyProp) {

						for (const item of collection.items) {

							const key = item.data.key;
							resources[locale]['translation'][collection.name][key] = {};

							for (const prop in item.data) {
								if (prop !== 'i18n' && prop !== 'key') {
									resources[locale]['translation'][collection.name][key][prop] = item.data[prop];
								}
							}
							for (const prop in item.data.i18n) {
								resources[locale]['translation'][collection.name][key][prop] = item.data.i18n[prop][locale];
							}
						}
					} else {
						console.log("The collection " + collection.name + " has no 'key' property!");
					}
				}
			} catch (error) {
				console.log(error);
			}
		}
		console.timeEnd("parseI18nResourcesComplete");
		return resources;
	}

	// currently not used
	// another version for i18Next
	// only take and parse the props of an item that have i18n (in the item.data.i18n obj) 
	parseI18nResourcesOnly(project) {
		// everything needs to be put in the locale objects, named by collection and key names
		let resources = {};
		for (const locale of project.locales) {
			resources[locale] = {
				'translation': {}
			}
			try {
				for (let index = 0; index < project.collections.length; index++) {
					const collection = project.collections[index];
					// check if there is any property that has i18n
					const i18nProp = collection.properties.find(prop => prop.i18n === true);
					if (i18nProp) {
						resources[locale]['translation'][collection.name] = {};
						// does the collection have a key property? 
						const keyProp = collection.properties.find(prop => prop.name === "key");
						if (keyProp) {
							for (const item of collection.items) {
								const key = item.data.key;
								resources[locale]['translation'][collection.name][key] = {};
								for (const prop in item.data.i18n) {
									resources[locale]['translation'][collection.name][key][prop] = item.data.i18n[prop][locale];
								}
							}
						} else {
							console.log("The collection " + collection.name + " has no 'key' property!");
						}
					} else {
						console.log("The collection " + collection.name + " has no properties with i18n.");
					}
				}
			} catch (error) {
				console.log(error);
			}
		}
		return resources;
	}

	// API call
	getProject(id) {
		return new Promise((resolve, reject) => {
			const url = this.endpoint + "/projects/" + id + queryParams;
			request({
				url: url,
				json: true,
			}, function (error, response, body) {
				if (error) {
					return reject(error);
				}
				resolve(body);
			});
		});
	}
}

module.exports.VoiceCMS = VoiceCMS;