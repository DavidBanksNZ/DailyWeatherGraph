var data = [
    {date: "2015-06-12", highTemperature: 17, lowTemperature: 10, rainfall: 1.4, highWindGust:52, highWindGustBearing: 236},
    {date: "2015-06-13", highTemperature: 16, lowTemperature: 13, rainfall: 0, highWindGust: 41,highWindGustBearing: 240},
    {date: "2015-06-14", highTemperature: 16, lowTemperature: 12, rainfall: 2.4, highWindGust: 41,highWindGustBearing: 233},
    {date: "2015-06-15", highTemperature: 16, lowTemperature: 10, rainfall: 8.4, highWindGust: 40,highWindGustBearing: 261},
    {date: "2015-06-16", highTemperature: 12, lowTemperature: 4, rainfall: 1, highWindGust: 36,highWindGustBearing: 229},
    {date: "2015-06-17", highTemperature: 14, lowTemperature: 4, rainfall: 0, highWindGust: 10,highWindGustBearing: 74},
    {date: "2015-06-18", highTemperature: 15, lowTemperature: 11, rainfall: 0, highWindGust: 24,highWindGustBearing: 321},
    {date: "2015-06-19", highTemperature: 18, lowTemperature: 12, rainfall: 0, highWindGust: 35, highWindGustBearing: 340},
    {date: "2015-06-20", highTemperature: 17, lowTemperature: 15, rainfall: 9.6, highWindGust: 36, highWindGustBearing: 302},
    {date: "2015-06-21", highTemperature: 15, lowTemperature: 9, rainfall: 0.2, highWindGust: 33, highWindGustBearing: 238},
    {date: "2015-06-22", highTemperature: 14, lowTemperature: 4, rainfall: 0.4, highWindGust: 31, highWindGustBearing: 218},
    {date: "2015-06-23", highTemperature: 11, lowTemperature: 1, rainfall: 0, highWindGust: 26, highWindGustBearing: 222},
    {date: "2015-06-24", highTemperature: 11, lowTemperature: 0, rainfall: 0, highWindGust: 31, highWindGustBearing: 213},
    {date: "2015-06-25", highTemperature: 13, lowTemperature: 4, rainfall: 0, highWindGust: 43, highWindGustBearing: 241},
    {date: "2015-06-26", highTemperature: 16, lowTemperature: 9, rainfall: 0.4, highWindGust: 40, highWindGustBearing: 230},
    {date: "2015-06-27", highTemperature: 15, lowTemperature: 10, rainfall: 2.4, highWindGust: 43, highWindGustBearing: 250},
    {date: "2015-06-28", highTemperature: 16, lowTemperature: 9, rainfall: 0.6, highWindGust: 31, highWindGustBearing: 240},
    {date: "2015-06-29", highTemperature: 16, lowTemperature: 10, rainfall: 1.2, highWindGust: 45, highWindGustBearing: 250},
    {date: "2015-06-30", highTemperature: 16, lowTemperature: 11, rainfall: 1.8, highWindGust: 38, highWindGustBearing: 228},
    {date: "2015-07-01", highTemperature: 16, lowTemperature: 9, rainfall: 0.8, highWindGust: 47, highWindGustBearing: 250},
    {date: "2015-07-02", highTemperature: 14, lowTemperature: 7, rainfall: 0.2, highWindGust: 12, highWindGustBearing :47},
    {date: "2015-07-03", highTemperature: 16, lowTemperature: 7, rainfall: 1.2, highWindGust: 29, highWindGustBearing: 65},
    {date: "2015-07-04", highTemperature: 16, lowTemperature: 12, rainfall: 5.6, highWindGust: 22, highWindGustBearing: 107},
    {date: "2015-07-05", highTemperature: 15, lowTemperature: 11, rainfall: 0.2, highWindGust: 47, highWindGustBearing: 248},
    {date: "2015-07-06", highTemperature: 16, lowTemperature: 10, rainfall: 1.8, highWindGust: 28, highWindGustBearing: 312},
    {date: "2015-07-07", highTemperature: 17, lowTemperature: 11, rainfall: 41.4, highWindGust: 33, highWindGustBearing: 330},
    {date: "2015-07-08", highTemperature: 12, lowTemperature: 3, rainfall: 0.8, highWindGust: 31, highWindGustBearing: 214},
    {date: "2015-07-09", highTemperature: 10, lowTemperature: 3, rainfall: 0, highWindGust: 45, highWindGustBearing: 225},
    {date: "2015-07-10", highTemperature: 10, lowTemperature: 0, rainfall: 0, highWindGust: 28, highWindGustBearing: 215},
    {date: "2015-07-11", highTemperature: 12, lowTemperature: 0, rainfall: 0, highWindGust: 33, highWindGustBearing: 150}
];

var graph = new DailyWeatherGraph({
    data: data,
    container: document.getElementById('test'),
    width: 880,
    height: 440
});
