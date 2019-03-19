const exec = require('child_process').exec;
let Service, Characteristic;

module.exports = function (homebridge) {
	Service = homebridge.hap.Service;
	Characteristic = homebridge.hap.Characteristic;

	homebridge.registerAccessory('homebridge-wifi-room-sensor', 'WiFiRoomSensor', WifiRoomSensor);
}

function WifiRoomSensor(log, config) {
	this.services = [];
	this.log = log;
	this.name = config.name || 'WiFi Room Sensor';
	this.ip = config.ip;
	this.mac = config.mac;
	this.interval = Number(config.interval) || 60000;
	this.sensorState = null;

	if (!this.ip) {
		throw new Error('Your must provide IP address of the room sensor.');
	}

	if (!this.mac) {
		throw new Error('Your must provide MAC address of the room sensor.');
	}

	this.service = new Service.MotionSensor(this.name);

	this.service
		.getCharacteristic(Characteristic.MotionDetected)
		.on('get', this.getRoomSensorState.bind(this));

	this.serviceInfo = new Service.AccessoryInformation();

	this.serviceInfo
		.setCharacteristic(Characteristic.Manufacturer, 'Clauzewitz')
		.setCharacteristic(Characteristic.Model, 'WiFi Room Sensor')
		.setCharacteristic(Characteristic.SerialNumber, this.mac.toUpperCase());

	this.services.push(this.service);
	this.services.push(this.serviceInfo);
	
	this.discover();
}

WifiRoomSensor.prototype = {
	discover: function () {
		setInterval(this.updateRoomSensorState.bind(this), this.interval);
	},
	getRoomSensorState: function (callback) {
		callback(null, this.sensorState);
	},
	updateRoomSensorState: function () {
		let that = this;
		exec('nmap -sP -n 192.168.0.0/24', function (error, stdout, stderr) {
			if (error !== undefined && error !== null) {
				callback(error);
			} else {
				that.sensorState = stdout.includes(that.ip);
				that.service.getCharacteristic(Characteristic.MotionDetected).updateValue(that.sensorState);
			}
		});
	},
	identify: function (callback) {
		callback();
	},

	getServices: function () {
		return this.services;
	}
};
