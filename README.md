A library for javascript and python access to gravitational wave catalogue data.

## Initialisation
In the <head> of the page, include the gwcat library.


		<script type="text/javascript" src="js/gwcat.js"></script>


To initialise the database of events


		gwcat = new GWCat(callback, {parameters});


    callback [function]: a javascript function to be run once data is loaded.
    parameters [Object, optional]: a dictionary containing input parameters:
        debug: [boolean] set to print useful debugging scripts to the console (default=true)
        fileIn: [string] json file to load data from (default=data/events.json)

The resulting object contains the following objects:

    data: An array containing all the events, each one of which is a javascript object.
    datadict: An object containing the metadata of all the parameter names, default precisions etc.
    dataOrder: An array of the event names, showing the order of data.

See https://github.com/chrisnorth/gwcat/blob/master/index.html for demo, and unit tests.

## Data format

The data array contains an object for each event. Each event has a set of parameters (M1, M2, Mchirp, UTC, etc.), within which is an object containing the relevant values.


	gwcat.data = [
		{
			"Event1 Parameter1": {
				"Event1 Parameter1 Value1": string/number/array
			},
			"Event1 Parameter2": {
				"Event1 Parameter2 Value1": string/array/value
				"Event1 Parameter2 Value2": string/array/value
			},...
		},
		{
			"Event2 Parameter1":{
				"Event2 Parameter1 Value1": string/number/array
			},...
		},...
	]


The parameters are those recorded for each event. Note that not all are present for each event.

 * name: Event name (e.g. GW150914)
 * UTC: UTC time of detection (YYYY-MM-DDThh:mm:ss)
 * GPS: GPS time of detection
 * M1: Primary mass (Msun)
 * M2: Secondary mass (Msun)
 * Mchirp: Chirp mass (Msun)
 * Mtotal: Total mass (Msun)
 * Mfinal: Final mass (Msun)
 * Mratio: Mass ratio
 * chi: Effective inspiral spin
 * af: Final spin
 * DL: Luminosity distance (MPc)
 * z: Redshift
 * lpeak: Peak luminosity (1056 erg s-1)
 * Erad: Radiated energy (Msun c2)
 * FAR: False alarm rate (yr-1)
 * deltaOmega: Sky localization area (deg2)
 * rho: Signal-to-noise ratio

The values can be any of:

 * best: exact of best-fit value of parameter. Can be string (e.g. name, UTC), or number (e.g. masses, spins, GPS).
 * lower: a (numerical) lower limit on the parameter.
 * upper: a (numerical) upper limit on the parameter.
 * lim: a two-element array (of numberse) containing the range of plausible values (where applicable), in order [min, max]. Used where a best-fit value and corresponding error isn't appropriate.
 * err: a two-element array (of numberse) containing the errors on the "best" value (where applicable), in order [upper, lower]. Only accompanies a "best" value.

## Built-in functions

A number of functions exist to allow access to the data.

 * getParamType(event, param): get the type of the value of parameter param [string] for event event (name [string] or index [integer]). Returns string of value type, or '' if not found.
 * hasError(event, param): returns whether the param [string] has an "err" value for event event (name [string] or index [integer]). Returns boolean (true|false), or false if not found.
 * getBest(event, param): gets "best" value for param [string] for event event (name [string] or index [integer]). Returns value, or NaN if not found.
 * getBestErr(event, param): gets "best" and "err" value for param [string] for event event (name [string] or index [integer]). Returns array of [best, err].
 * getLim(event, param): gets "lim" value for param [string] for event event (name [string] or index [integer]). Returns value, or empty array [] if not found.
 * getLower(event, param): gets "lower" value for param [string] for event event (name [string] or index [integer]). Returns value, or NaN if not found.
 * getUpper(event, param): gets "upper" value for param [string] for event event (name [string] or index [integer]). Returns value, or NaN if not found.
 * getError(event, param): gets "err" value for param [string] for event event (name [string] or index [integer]). Returns value, or empty array [] if not found.
 * getNominal(event, param): gets the nominal value for param [string] for event event (name [string] or index [integer]). Returns best, lower or upper value, or average of lim values.
 * getMinValue(event, param): gets the minimum value for param [string] for event event (name [string] or index [integer]). Returns "best"-"err[1]", "lower", lower "lim" values, or -Infinity for "upper" values
 * getMaxValue(event, param): gets the minimum value for param [string] for event event (name [string] or index [integer]). Returns "best"+"err[0]", "upper", higher "lim" values, or +Infinity for "lower" values
 * paramName(param): returns the name of param [string] as stored in datadict, or '' if not found.
 * paramUnit(param): returns the unit of param [string] as stored in datadict, or '' if not found.
 * getRef(event): returns the reference dict of event [string] as stored in datadict, or {} if not found. Result is a dict containing URL and name.
 * getOpenData(event): returns the data link of event [string] as stored in datadict, or {} if not found. Result is a dict containing URL and name.
