/**
 * lab.js plugin for pavlovia.org
 *
 * @author Alain Pitiot
 * @version 2020.5
 * @copyright (c) 2020 Ilixa Ltd. ({@link http://ilixa.com})
 * @license Distributed under the terms of the MIT License
 */


/**
 * The version number.
 *
 * @type {string}
 * @public
 */
Pavlovia.version = '2020.5';


/**
 * This plugin handles communications with the pavlovia.org server: it opens and closes sessions, and uploads data
 * to the server.
 *
 * @class
 * @param {Object} options
 * @param {string} [options.configUrl= "config.json"] - the URL of the pavlovia.org json configuration file
 * @param [options.errorCallback= Pavlovia._defaultErrorCallback] - The callback function called whenever an error has
 * occurred
 */
function Pavlovia(options = {})
{
	this._configUrl = options.configUrl || 'config.json';
	this._errorCallback = options.errorCallback || Pavlovia._defaultErrorCallback;

	// the pavlovia.org configuration (usually read from the config.json configuration file):
	this._config = {};
	this._serverMsg = new Map();
}


/**
 * Handle a new event.
 *
 * @param context - the lab.js component on which the event was triggered
 * @param event - the lab.js event
 */
Pavlovia.prototype.handle = function (context, event)
{
	switch (event)
	{
		case 'plugin:init':
			this._log('init | context=', context);
			break;
		case 'run':
			this._init();
			break;
		case 'after:end':
			if (typeof context.options.datastore !== 'undefined')
			{
				const data = context.options.datastore.exportCsv();
				this._finish(data);
			} else {
				this._errorCallback('unable to save data to pavlovia.org: the lab.js component does not appear to have a datastore.');
			}
			break;
	}
};


/**
 * Initialise the connection with pavlovia.org: configure the plugin and open a new session.
 *
 * @returns {Promise<void>}
 * @private
 */
Pavlovia.prototype._init = async function()
{
	try {
		// configure:
		let response = await this._configure();
		this._config = response.config;
		this._log('init | _configure.response=', response);

		// open a new session:
		response = await this._openSession();
		// this._config.experiment.token = response.token;
		this._log('init | _openSession.response=', response);

		// warn the user when they attempt to close the tab or browser:
		this._beforeunloadCallback = (event) =>
		{
			// preventDefault should ensure that the user gets prompted:
			event.preventDefault();

			// Chrome requires returnValue to be set:
			event.returnValue = '';
		};
		window.addEventListener('beforeunload', this._beforeunloadCallback);

		// when the user closes the tab or browser, we attempt to close the session and optionally save the results
		// note: we communicate with the server using the Beacon API
		window.addEventListener('unload', (event) =>
		{
			if (self._config.session.status === 'OPEN')
			{
				// get and save the incomplete results if need be:
				if (_config.experiment.saveIncompleteResults)
				{
					const data = jsPsych.data.get().csv();
					self._save(trial, data, true);
				}

				// close the session:
				self._closeSession(false, true);
			}
		});

	}
	catch (error)
	{
		this._errorCallback(error);
	}
};


/**
 * Finish the connection with pavlovia.org: upload the collected data and close the session.
 *
 * @param {Object} data - the experiment data to be uploaded
 * @returns {Promise<void>}
 * @private
 */
Pavlovia.prototype._finish = async function(data)
{
	try
	{
		// remove the beforeunload listener:
		window.removeEventListener('beforeunload', this._beforeunloadCallback);

		// upload the data to pavlovia.org:
		let response = await _save(data, false);
		this._log('finish | _save.response=', response);

		// close the session:
		response = await this._closeSession();
		this._log('finish | _closeSession.response=', response);
	}
	catch (error)
	{
		this._errorCallback(error);
	}
};



/**
 * Configure the plugin by reading the configuration file created upon activation of the experiment.
 *
 * @returns {Promise<any>}
 * @private
 */
Pavlovia.prototype._configure = async function()
{
	let response = { origin: '_configure', context: 'when configuring the plugin' };

	try {
		const configurationResponse = await this._getConfiguration();

		// legacy experiments had a psychoJsManager block instead of a pavlovia block, and the URL
		// pointed to https://pavlovia.org/server
		if ('psychoJsManager' in configurationResponse.config) {
			delete configurationResponse.config.psychoJsManager;
			configurationResponse.config.pavlovia = {
				URL: 'https://pavlovia.org'
			};
		}

		// tests for the presence of essential blocks in the configuration:
		if (!('experiment' in configurationResponse.config))
			throw 'missing experiment block in configuration';
		if (!('name' in configurationResponse.config.experiment))
			throw 'missing name in experiment block in configuration';
		if (!('fullpath' in configurationResponse.config.experiment))
			throw 'missing fullpath in experiment block in configuration';
		if (!('pavlovia' in configurationResponse.config))
			throw 'missing pavlovia block in configuration';
		if (!('URL' in configurationResponse.config.pavlovia))
			throw 'missing URL in pavlovia block in configuration';

		// get the server parameters (those starting with a double underscore):
		const urlQuery = window.location.search.slice(1);
		const urlParameters = new URLSearchParams(urlQuery);
		urlParameters.forEach((value, key) => {
			if (key.indexOf('__') === 0)
				this._serverMsg.set(key, value);
		});

		return configurationResponse;
	}
	catch (error)
	{
		throw { ...response, error };
	}
};


/**
 * Get the pavlovia.org json configuration file.
 *
 * @returns {Promise<any>}
 * @private
 */
Pavlovia.prototype._getConfiguration = function()
{
	let response = { origin: '_getConfiguration', context: 'when reading the configuration file: ' + this._configUrl };

	return new Promise((resolve, reject) => {
		$.get(this._configUrl, 'json')
			.done((config, textStatus) => {
				resolve({ ...response, config });
			})
			.fail((jqXHR, textStatus, errorThrown) => {
				reject({ ...response, error: errorThrown });
			});
	});
};


/**
 * Open a new session for this experiment on pavlovia.org.
 *
 * @returns {Promise<any>}
 * @private
 */
Pavlovia.prototype._openSession = function()
{
	let response = {
		origin: '_openSession',
		context: 'when opening a session for experiment: ' + this._config.experiment.fullpath
	};

	// prepare POST query:
	let data = {};
	if (this._serverMsg.has('__pilotToken'))
		data.pilotToken = this._serverMsg.get('__pilotToken');

	// query pavlovia server:
	const self = this;
	return new Promise((resolve, reject) =>
	{
		const url = self._config.pavlovia.URL + '/api/v2/experiments/' + encodeURIComponent(self._config.experiment.fullpath) + '/sessions';
		$.post(url, data, null, 'json').done((data, textStatus) =>
		{
			// check for required attributes:
			if (!('token' in data)) {
				reject(Object.assign(response, { error: 'unexpected answer from server: no token'}));
			}
			if (!('experiment' in data)) {
				reject(Object.assign(response, { error: 'unexpected answer from server: no experiment'}));
			}

			// update the configuration:
			self._config.session = { token: data.token, status: 'OPEN' };
			self._config.experiment.status = data.experiment.status2;
			self._config.experiment.saveFormat = Symbol.for(data.experiment.saveFormat);
			self._config.experiment.saveIncompleteResults = data.experiment.saveIncompleteResults;
			self._config.experiment.license = data.experiment.license;
			self._config.runMode = data.experiment.runMode;

			resolve(Object.assign(response, { token: data.token, status: data.status }));
		})
		.fail((jqXHR, textStatus, errorThrown) =>
		{
			console.error('error:', jqXHR.responseText);
			reject(Object.assign(response, { error: jqXHR.responseJSON }));
		});
	});

};


/**
 * Close the previously opened session on pavlovia.org.
 *
 * @param {boolean} isCompleted - whether or not the participant completed the experiment
 * @param {boolean} [sync = false] - whether or not to use the Beacon API to comminucate with the server
 * @private
 */
Pavlovia.prototype._closeSession = function(isCompleted = true, sync = false)
{
	let response = {
		origin: '_closeSession',
		context: 'when closing the session for experiment: ' + this._config.experiment.fullpath
	};

	// prepare DELETE query:
	const url = this._config.pavlovia.URL + '/api/v2/experiments/' + encodeURIComponent(this._config.experiment.fullpath) + '/sessions/' + this._config.session.token;

	// synchronous query the pavlovia server:
	if (sync)
	{
		const formData = new FormData();
		formData.append('isCompleted', isCompleted);
		navigator.sendBeacon(url + '/delete', formData);
		this._config.session.status = 'CLOSED';
	}
	else
	{
		// asynchronously query the pavlovia server:
		return new Promise((resolve, reject) =>
		{
			$.ajax({
				url,
				type: 'delete',
				data: { isCompleted },
				dataType: 'json'
			}).done((data, textStatus) =>
			{
				this._config.session.status = 'CLOSED';
				resolve(Object.assign(response, {data}));
			})
			.fail((jqXHR, textStatus, errorThrown) =>
			{
				console.error('error:', jqXHR.responseText);
				reject(Object.assign(response, {error: jqXHR.responseJSON}));
			});
		});
	}
};



/**
 * Upload data to the pavlovia.org server.
 *
 * @param {string} data - the experiment data to be uploaded
 * @param {boolean} [sync = false] - whether or not to use the Beacon API to communicate with the server
 * @return {Promise<any>}
 * @private
 */
Pavlovia.prototype._save = async function(data, sync = false)
{
	const date = new Date();
	let dateString = date.getFullYear() + '-' + ('0' + (1 + date.getMonth())).slice(-2) + '-' + ('0' + date.getDate()).slice(-2) + '_';
	dateString += ('0' + date.getHours()).slice(-2) + 'h' + ('0' + date.getMinutes()).slice(-2) + '.' + ('0' + date.getSeconds()).slice(-2) + '.' + date.getMilliseconds();

	const key = this._config.experiment.name + '_' + 'PARTICIPANT' + '_' + 'SESSION' + '_' + dateString + '.csv';

	if (_config.experiment.status === 'RUNNING' && !_serverMsg.has('__pilotToken'))
	{
		return await this._uploadData(key, data, sync);
	}
	else
	{
		this._offerDataForDownload(key, data, 'text/csv');
		return {
			origin: '_save',
			context: 'when saving results for experiment: ' + _config.experiment.fullpath,
			message: 'offered the .csv file for download'
		};
	}
};



/**
 * Upload data (a key/value pair) to pavlovia.org.
 *
 * @param {string} key - the key
 * @param {Object} value - the value
 * @param {boolean} [sync = false] - whether or not to upload the data using the Beacon API
 * @returns {Promise<any>}
 * @private
 */
Pavlovia.prototype._uploadData = function(key, value, sync = false)
{
	let response = {
		origin: '_uploadData',
		context: 'when uploading participant\' results for experiment: ' + this._config.experiment.fullpath
	};

	const url = this._config.pavlovia.URL + '/api/v2/experiments/' + encodeURIComponent(this._config.experiment.fullpath) + '/sessions/' + this._config.session.token + '/results';

	// synchronous query the pavlovia server:
	if (sync)
	{
		const formData = new FormData();
		formData.append('key', key);
		formData.append('value', value);
		navigator.sendBeacon(url, formData);
	}
	// asynchronously query the pavlovia server:
	else
	{
		// query the pavlovia server:
		return new Promise((resolve, reject) =>
		{
			const data = {
				key,
				value
			};

			$.post(url, data, null, 'json').done((serverData, textStatus) =>
			{
				resolve(Object.assign(response, {serverData}));
			})
				.fail((jqXHR, textStatus, errorThrown) =>
				{
					console.error('error:', jqXHR.responseText);
					reject(Object.assign(response, {error: jqXHR.responseJSON}));
				});
		});
	}

};


/**
 * Log messages to the browser's console.
 *
 * @param {...*} messages - the messages to be displayed in the browser's console
 * @private
 */
Pavlovia.prototype._log = function(...messages) {
	console.log('[pavlovia ' + Pavlovia.version + ']', ...messages);
};


/**
 * The default error callback function.
 *
 * Error messages are displayed in the body of the document and in the browser's console.
 *
 * @param {Object} error - the error json object to be displayed.
 * @private
 */
Pavlovia.prototype._defaultErrorCallback = function (error)
{
	// output the error to the console:
	console.error('[pavlovia ' + Pavlovia.version + ']', error);

	// output the error to the html body:
	let htmlCode = '<h3>[labjs-pavlovia plugin ' + Pavlovia.version + '] Error</h3><ul>';
	while (true) {
		if (typeof error === 'object' && 'context' in error) {
			htmlCode += '<li>' + error.context + '</li>';
			error = error.error;
		} else {
			htmlCode += '<li><b>' + error + '</b></li>';
			break;
		}
	}
	htmlCode += '</ul>';
	document.querySelector('body').innerHTML = htmlCode;
};


/**
 * Offer data as download in the browser.
 *
 * @param {string} filename - the name of the file to be downloaded
 * @param {*} data - the data
 * @param {string} type - the MIME type of the data, e.g. 'text/csv' or 'application/json'
 * @private
 */
Pavlovia.prototype._offerDataForDownload = function (filename, data, type)
{
	const blob = new Blob([data], { type });

	if (window.navigator.msSaveOrOpenBlob)
	{
		window.navigator.msSaveBlob(blob, filename);
	}
	else
	{
		const elem = window.document.createElement('a');
		elem.href = window.URL.createObjectURL(blob);
		elem.download = filename;
		document.body.appendChild(elem);
		elem.click();
		document.body.removeChild(elem);
	}
};
