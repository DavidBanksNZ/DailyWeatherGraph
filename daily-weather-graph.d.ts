declare class DailyWeatherGraph {
	constructor(config: IDailyWeatherGraphConfig);
}

declare interface IDailyWeatherGraphConfig {
	container: HTMLElement;
	data: IDailyWeatherGraphData[];
	width?: number;
	height?: number;
	dateFormat?: string;
	missingValue?: any;
	missingValueText?: string;
	temperatureUnit?: 'C' | 'F';
	rainfallUnit?: 'mm' | 'inches';
	windUnit?: 'km/h' | 'm/s' | 'knots' | 'mph';
}

declare interface IDailyWeatherGraphData {
	date: string;
	highTemperature: number;
	lowTemperature: number;
	highWindGust: number;
	highWindGustBearing: number;
	rainfall: number;
}