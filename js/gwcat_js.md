# GWCat demo

Summary: <span id="message">It doesn't work :(</span>

## Initialisation

In the <head> of the page, include the `gwcat` and `d3` libraries.

    <script type="text/javascript" src="js/lib/d3.v4.min.js"></script>
    <script type="text/javascript" src="js/gwcat.js"></script>

To initialise the database of events

    gwcat = new GWCat(callback, {parameters});

*   **_callback_** [function]: a javascript function to be run once data is loaded.
*   **_parameters_** [Object, optional]: a dictionary containing input parameters:
    *   _debug_: [boolean] set to print useful debugging scripts to the console (default=true)
    *   _fileIn_: [string] json file to load data from (default=data/events.json)

The resulting object contains the following objects:

*   **_data_**: An array containing all the events, each one of which is a javascript object.
*   **_datadict_**: An object containing the metadata of all the parameter names, default precisions etc.
*   **_dataOrder_**: An array of the event names, showing the order of _data_.

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

*   **_name_**: Event name (e.g. GW150914)
*   **_UTC_**: UTC time of detection (YYYY-MM-DDThh:mm:ss)
*   **_GPS_**: GPS time of detection
*   **_M1_**: Primary mass (Msun)
*   **_M2_**: Secondary mass (Msun)
*   **_Mchirp_**: Chirp mass (Msun)
*   **_Mtotal_**: Total mass (Msun)
*   **_Mfinal_**: Final mass (Msun)
*   **_Mratio_**: Mass ratio
*   **_chi_**: Effective inspiral spin
*   **_af_**: Final spin
*   **_DL_**: Luminosity distance (MPc)
*   **_z_**: Redshift
*   **_lpeak_**: Peak luminosity (10<sup>56</sup> erg s<sup>-1</sup>)
*   **_Erad_**: Radiated energy (Msun c<sup>2</sup>)
*   **_FAR_**: False alarm rate (yr<sup>-1</sup>)
*   **_deltaOmega_**: Sky localization area (deg<sup>2</sup>)
*   **_rho_**: Signal-to-noise ratio

The values can be any of:

*   **_best_**: exact of best-fit value of parameter. Can be string (e.g. name, UTC), or number (e.g. masses, spins, GPS).
*   **_lower_**: a (numerical) lower limit on the parameter.
*   **_upper_**: a (numerical) upper limit on the parameter.
*   **_lim_**: a two-element array (of numberse) containing the range of plausible values (where applicable), in order [_min_, _max_]. Used where a best-fit value and corresponding error isn't appropriate.
*   **_err_**: a two-element array (of numberse) containing the errors on the "best" value (where applicable), in order [_upper_, _lower_]. Only accompanies a "best" value.

## Built-in functions

A number of functions exist to allow access to the data.

*   **_getParamType_**(_event_, _param_): get the type of the value of parameter _param_ [string] for event _event_ (name [string] or index [integer]). Returns string of value type, or '' if not found.
*   **_hasError_**(_event_, _param_): returns whether the _param_ [string] has an "err" value for event _event_ (name [string] or index [integer]). Returns boolean (true|false), or false if not found.
*   **_getBest_**(_event_, _param_): gets "best" value for _param_ [string] for event _event_ (name [string] or index [integer]). Returns value, or NaN if not found.
*   **_getBestErr_**(_event_, _param_): gets "best" and "err" value for _param_ [string] for event _event_ (name [string] or index [integer]). Returns array of [best, err].
*   **_getLim_**(_event_, _param_): gets "lim" value for _param_ [string] for event _event_ (name [string] or index [integer]). Returns value, or empty array [] if not found.
*   **_getLower_**(_event_, _param_): gets "lower" value for _param_ [string] for event _event_ (name [string] or index [integer]). Returns value, or NaN if not found.
*   **_getUpper_**(_event_, _param_): gets "upper" value for _param_ [string] for event _event_ (name [string] or index [integer]). Returns value, or NaN if not found.
*   **_getError_**(_event_, _param_): gets "err" value for _param_ [string] for event _event_ (name [string] or index [integer]). Returns value, or empty array [] if not found.
*   **_getNominal_**(_event_, _param_): gets the nominal value for _param_ [string] for event _event_ (name [string] or index [integer]). Returns best, lower or upper value, or average of lim values.
*   **_getMinValue_**(_event_, _param_): gets the minimum value for _param_ [string] for event _event_ (name [string] or index [integer]). Returns "best"-"err[1]", "lower", lower "lim" values, or -Infinity for "upper" values
*   **_getMaxValue_**(_event_, _param_): gets the minimum value for _param_ [string] for event _event_ (name [string] or index [integer]). Returns "best"+"err[0]", "upper", higher "lim" values, or +Infinity for "lower" values
*   **_paramName_**(_param_): returns the name of _param_ [string] as stored in datadict, or '' if not found.
*   **_paramUnit_**(_param_): returns the unit of _param_ [string] as stored in datadict, or '' if not found.

## Example Tests

    gwcat.getBest("GW150914","M1") + gwcat.paramUnit("M1")
    // 36.2 M_sun

    gwcat.getParamType("GW170817","Mfinal")
    // upper

    gwcat.getUpper("GW170817","Mfinal") + gwcat.paramUnit("Mfinal")
    // 2.755 M_sun

    gwcat.getValue("GW170817","Erad","lower") + gwcat.paramUnit("Erad")
    // 0.025 M_sun c^2

    gwcat.getLim("GW170817","Mratio") + gwcat.paramUnit("Mratio")
    // [0.7,1]

    gwcat.paramName("chi")
    // Effective inspiral spin

    gwcat.paramUnit("lpeak")
    // 10^56 erg s^-1