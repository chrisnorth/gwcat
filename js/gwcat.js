function GWCat(callback,inp){
    this.inp = inp;
    this.callback = (typeof callback==="function") ? callback : this.callbackDefault;
    this.init();
    this.length = 0;	// Quick alias for length of catalogue

    this.loadData();
    return this;
}

GWCat.prototype.init = function(){
    // set default parameters
    this.log('inp',this.inp);
    // console.log('inp',this.inp);
    this.debug = (this.inp && (this.inp.debug||this.inp.debug==false)) ? this.inp.debug : true;
    // console.log('debug',this.debug);
    this.datasrc = (this.inp && this.inp.datasrc) ? this.inp.datasrc : "local";
    this.fileIn = (this.inp && this.inp.fileIn) ? this.inp.fileIn : "data/events.json";
    this.gwoscFile = (this.inp && this.inp.gwoscFile) ? this.inp.gwoscFile : "data/gwosc.json";
    this.loadMethod = (this.inp && this.inp.loadMethod) ? this.inp.loadMethod : "";
    return this;
}

GWCat.prototype.log = function(){
	var args = Array.prototype.slice.call(arguments, 0);
	if(console && typeof console.log==="function" && this.debug) console.log('GWCat',args);
	return this;
}

GWCat.prototype.callbackDefault = function(){
    this.log('Successfully loaded data');
	return this;
}
GWCat.prototype.setLinks = function(){
    data=this.data;
    this.log('setting links',this.links)
    for (i in this.data){
        e=data[i].name;
        // if ((this.links[e]) && (this.links[e].LOSCData)){
        //     link=this.links[e].LOSCData;
        //     link.url=link.url;
        //     data[i].opendata=link;
        // }
        link={
            url:"https://www.gw-openscience.org/catalog/GWTC-1-confident/single/"+e,
            text: "Open Data page",
            type: "open-data"
        };
        data[i].opendata=link;
        if ((this.links[e]) && (this.links[e].DetPaper)){
            ref=this.links[e].DetPaper;
            ref.url=ref.url;
            data[i].ref=ref;
        }
        this.log('links set for',e,this.data[i])
    }

    return this;
}

GWCat.prototype.loadData = function(){
    var _gw = this;
    // load external data
    _gw.toLoad=1;
    _gw.loaded=0;
    this.length = 0;	// Quick alias for length of catalogue
    this.data=[];

	// Default data loader
	// It does more than we need
	//=========================================================
	// ajax(url,{'complete':function,'error':function,'dataType':'json'})
	// complete: function - a function executed on completion
	// error: function - a function executed on an error
	// cache: break the cache
	// dataType: json - will convert the text to JSON
	//           jsonp - will add a callback function and convert the results to JSON
	function ajax(url,attrs){

		if(typeof url!=="string") return false;
		if(!attrs) attrs = {};
		var cb = "",qs = "";
		var oReq;
		if(attrs['dataType']=="jsonp"){
			cb = 'fn_'+(new Date()).getTime();
			window[cb] = function(rsp){
				if(typeof attrs.success==="function") attrs.success.call((attrs['this'] ? attrs['this'] : this), rsp, attrs);
			};
		}
		if(typeof attrs.cache==="boolean" && !attrs.cache) qs += (qs ? '&':'')+(new Date()).valueOf();
		if(cb) qs += (qs ? '&':'')+'callback='+cb;
		if(attrs.data) qs += (qs ? '&':'')+attrs.data;

		// Build the URL to query
		attrs['url'] = url+(qs ? '?'+qs:'');

		if(attrs['dataType']=="jsonp"){
			var script = document.createElement('script');
			script.src = attrs['url'];
			document.body.appendChild(script);
			return this;
		}

		// code for IE7+/Firefox/Chrome/Opera/Safari or for IE6/IE5
		oReq = (window.XMLHttpRequest) ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
		oReq.addEventListener("load", window[cb] || complete);
		oReq.addEventListener("error", error);
		if(attrs.beforeSend) oReq = attrs.beforeSend.call((attrs['this'] ? attrs['this'] : this), oReq, attrs);

		function complete(evt) {
			if(oReq.status === 200) {
				attrs.header = oReq.getAllResponseHeaders();
				var rsp = oReq.response || oReq.responseText;
				// Parse out content in the appropriate callback
				if(attrs['dataType']=="json") try { rsp = JSON.parse(rsp.replace(/[\n\r]/g,"\\n").replace(/^([^\(]+)\((.*)\)([^\)]*)$/,function(e,a,b,c){ return (a==cb) ? b:''; }).replace(/\\n/g,"\n")) } catch(e){};
				if(attrs['dataType']=="script"){
					var fileref=document.createElement('script');
					fileref.setAttribute("type","text/javascript");
					fileref.innerHTML = rsp;
					document.head.appendChild(fileref);
				}
				attrs['statusText'] = 'success';
				if(typeof attrs.success==="function") attrs.success.call((attrs['this'] ? attrs['this'] : this), rsp, attrs);
			}else{
				attrs['statusText'] = 'error';
				error(evt);
			}
			if(typeof attrs.complete==="function") attrs.complete.call((attrs['this'] ? attrs['this'] : this), rsp, attrs);
		}

		function error(evt){
			if(typeof attrs.error==="function") attrs.error.call((attrs['this'] ? attrs['this'] : this),evt,attrs);
		}

		if(attrs['dataType']) oReq.responseType = attrs['dataType'];

		try{ oReq.open('GET', attrs['url']); }
		catch(err){ error(err); }

		try{ oReq.send(); }
		catch(err){ error(err); }

		return this;
	} // End default ajax() function

	function parseData(dataIn,attr,_gw){
		_gw.loaded++;
		_gw.datadict=dataIn.datadict;
		newlinks={}
		for (e in dataIn.links){
			// convert links to required format
			if (dataIn.links[e]){
				linkIn=dataIn.links[e];
				newlinks[e]={}
				for (l in linkIn){
					if (linkIn[l].type.search('pub')>=0) newlinks[e]['DetPaper'] = { 'text': linkIn[l].text, 'url': linkIn[l].url, 'type': 'pub' };
					else if (linkIn[l].type.search('open-data')>=0) newlinks[e]['LOSCData'] = { 'text': linkIn[l].text, 'url': linkIn[l].url, 'type': 'open-data' };
					else if (linkIn[l].text.search('GraceDB page')>=0) newlinks[e]['GraceDB'] = { 'text': linkIn[l].text, 'url':linkIn[l].url, 'type': 'web-data' };
					else if (linkIn[l].text.search('Final Skymap')>=0) newlinks[e]['SkyMapFile'] = { 'text': linkIn[l].text, 'url': linkIn[l].url, 'type': 'file' };
					else if (linkIn[l].text.search('Skymap View')>=0) newlinks[e]['SkyMapAladin'] = { 'text': linkIn[l].text, 'url': linkIn[l].url, 'type': 'web' };
				}
			}
            _gw.log('processing links for ',e,newlinks[e]);
		}
		dataIn.links=newlinks;
        _gw.links=dataIn.links;
		for (e in dataIn.data){
			dataIn.data[e].name=e;
			if (dataIn.data[e].type){
				dataIn.data[e].type=dataIn.data[e].type.best
			}else{
				if (e[0]=='G'){t='GW'}
				else if (e[0]=='L'){t='LVT'}
				else{t=''}
				dataIn.data[e].type=t;
			}
			if (e[0]=='G'){c='GW'}
			else if (e[0]=='L'){c='LVT'}
			else{c=''}
			dataIn.data[e].conf=c;
			if ((dataIn.links[e]) && (dataIn.links[e].LOSCData)){
				link=dataIn.links[e].LOSCData;
				link.url=link.url;
				dataIn.data[e].opendata=link;
			}
			if ((dataIn.links[e]) && (dataIn.links[e].DetPaper)){
				ref=dataIn.links[e].DetPaper;
				ref.url=ref.url;
				dataIn.data[e].ref=ref;
			}
			_gw.data.push(dataIn.data[e]);
		}

		// Quick alias for length
		_gw.length = _gw.data.length;

		_gw.log(_gw.loaded+'/'+_gw.toLoad+'local data loaded:',_gw.data);
		if (_gw.loaded==_gw.toLoad){
			_gw.orderData('GPS');
			return _gw.callback(_gw);
		}
	}
    function parseGWOSC(gwoscData,attr,_gw){
        _gw.loaded++
        _gw.gwoscIn=gwoscData;
        gwosc2cat={
            'M1':function(d){return ((d.mass1) ? d.mass1 : null);},
            'M2':function(d){return ((d.mass2) ? d.mass2 : null);},
            'Erad':function(d){return ((d.E_rad) ? d.E_rad : null);},
            'lpeak':function(d){return ((d.L_peak) ? d.L_peak : null);},
            'DL':function(d){return ((d.distance) ? d.distance : null);},
            'z':function(d){return ((d.redshift) ? d.redshift : null);},
            'deltaOmega':function(d){return ((d.sky_size) ? d.sky_size : null);},
            'Mfinal':function(d){return ((d.mfinal) ? d.mfinal : null);},
            'Mchirp':function(d){return ((d.mchirp) ? d.mchirp : null);},
            'chi':function(d){return ((d.chi_eff) ? d.chi_eff : null);},
            'af':function(d){return ((d.a_final) ? d.a_final : null);},
            'GPS':function(d){return ((d.tc) ? d.tc : null);},
            'obsrun':function(d){return ((d.files.ObsRun) ? {'best':d.files.ObsRun} : null);},
            'net':function(d){return ((d.files.OperatingIFOs) ? {'best':d.files.OperatingIFOs} : null);},
            'name':function(d){return ((d.files.eventName) ? d.files.eventName : null)},
            'type':function(d){return ((d.files.eventName[0]=='G') ? 'GW' : 'LVT')},
            'conf':function(d){return ((d.files.eventName[0]=='G') ? 'GW' : 'LVT')},
            'objType':function(d){return {'best':((d.mass1.best<3)&(d.mass1.best)<3) ? 'BNS' : 'BBH'};},
            'UTC':function(d){
                utcin=new Date(d.files.PeakAmpUTC.replace(/\.(.*)UTC/g,' GMT+0000'));
                month=(utcin.getUTCMonth()<9) ? '0'+String(utcin.getUTCMonth()+1) : String(utcin.getUTCMonth()+1);
                date=(utcin.getUTCDate()<10) ? '0'+String(utcin.getUTCDate()) : String(utcin.getUTCDate());
                utcout=utcin.getUTCFullYear()+'-'+month+'-'+date+'T'+d.utctime.best;
                return {'best':utcout};
            },
            'FAR':function(d){
                if (d.far_pycbc.best!="NA") return {'best':d.far_pycbc.best,'fartype':'pycbc'};
                if (d.far_gstlal.best!="NA") return {'best':d.far_gstlal.best,'fartype':'gstlal'};
                if (d.far_cwb.best!="NA") return {'best':d.far_cwb.best,'fartype':'cwb'};
            },
            'rho':function(d){
                if (d.snr_pycbc.best!="NA") return {'best':d.snr_pycbc.best,'fartype':'pycbc'};
                if (d.snr_gstlal.best!="NA") return {'best':d.snr_gstlal.best,'fartype':'gstlal'};
                if (d.smr_cwb.best!="NA") return {'best':d.snr_cwb.best,'fartype':'cwb'};
            }
        }
        _gw.datagwosc=[];
        for (e in gwoscData.data){
            ev=gwoscData.data[e];
            evNew={};
            for (k in gwosc2cat){
                param=gwosc2cat[k](ev);
                if (!param.best){evNew[k]=param;}
                else if ((!param.err)&&(param.best)){evNew[k]={'best':param.best};}
                else if (param.err=="upperbound"){evNew[k]={"upper":param.best};}
                else if (param.err=="lowerbound"){evNew[k]={"lower":param.best};}
                else{evNew[k]={"best":param.best,"err":param.err}}
            }
            _gw.datagwosc.push(evNew);
        }
        _gw.log(_gw.datagwosc[0]);
        _gw.log(_gw.loaded+'/'+_gw.toLoad+'GWOSC data loaded:',_gw.datagwosc);
        if (_gw.loaded==_gw.toLoad){
            _gw.data=_gw.datagwosc;
            _gw.setLinks();
			_gw.orderData('GPS');
			return _gw.callback(_gw);
		}
    }
	// Load the data file
    if (this.datasrc=='local'){
		ajax(this.fileIn,{
			"dataType": "json",
			"this": this,
			"error": function(error,attr) {
				this.log('events error:',error,attr);
				//alert("Fatal error loading input file: '"+attr.url+"'. Sorry!");
			},
			"success": function(dataIn,attr){
				parseData(dataIn,attr,this);
			}
		});

    } else if (this.datasrc=="gwosc"){
        // need to also load GWOSC data as well
        this.toLoad += 1;
        this.log('toLoad:',this.toLoad)
        this.log('reading default')
        this.gwoscdata=[];
        ajax(this.fileIn,{
			"dataType": "json",
			"this": this,
			"error": function(error,attr) {
				this.log('events error:',error,attr);
				//alert("Fatal error loading input file: '"+attr.url+"'. Sorry!");
			},
			"success": function(dataIn,attr){
                this.log('fileIn',dataIn)
				parseData(dataIn,attr,this);
			}
		});
        this.log('reading gwosc')
        ajax(this.gwoscFile,{
            "dataType": "json",
			"this": this,
			"error": function(error,attr) {
				this.log('gwosc events error:',error,attr);
            },
            "success": function(gwoscData,attr){
                this.log('gwoscData',gwoscData)
                parseGWOSC(gwoscData,attr,this);
            }
        });
        // this.testFile="https://www.gw-openscience.org/archive/links/O1/L1/1126051217/1127051217/json/index.html";
        // d3.json(this.testFile, function(error, dataIn) {
        //     if (error){
        //         console.log('events error:',error,dataIn);
        //         alert("Fatal error loading test file: '"+this.testFile+"'. Sorry!");
        //     } else {
	    //         this.log('testData:',testData);
	    //     }
        // });
    } else if (this.loadMethod=="d3"){
        d3.json(_gw.fileIn, function(error, dataIn) {
            if (error){
                console.log('events error:',error,dataIn);
                alert("Fatal error loading input file: '"+_gw.fileIn+"'. Sorry!");
            } else {
	            parseData(dataIn,{ 'url':_gw.fileIn },_gw);
	        }
        });
    }

    return this;
}

GWCat.prototype.showWarning = function(message){
    if (this.debug) this.log('WARNING: ',message);
    return this;
}

GWCat.prototype.showError = function(message){
    if (this.debug) this.log('ERROR: ',message);
    return this;
}


// Function to sort the catalogue using a data key
// If reverse is true then the order will be reversed
GWCat.prototype.orderData = function(order='GPS',reverse){
    sign = ((typeof reverse==="boolean") ? reverse : false) ? -1 : 1;
    if(this.data[0][order]){
	    best = (typeof this.data[0][order]==="object");
		this.data=this.data.sort(function(a,b){
			if(best && !a[order].best) return -1;	// No value for best set
			if(best) return a[order].best < b[order].best ? -(sign)*1 : (sign)*1;
			else return a[order] < b[order] ? -(sign)*1 : (sign)*1;
		});
		var dataOrder = [];
		this.data.forEach(function(d){dataOrder.push(d.name);});
		this.dataOrder = dataOrder;
	}else{
		this.log("No key "+order+". Data order stays the same.");
	}
    return this;
}

GWCat.prototype.event2idx = function(event){
    if (typeof event == "number") idx=event;
    else idx=this.dataOrder.indexOf(event);
    return idx;
}

GWCat.prototype.checkEventParam = function(event,param,txt){
    error=''
    idx=this.event2idx(event);
    if (!this.data[idx]){
        error='No known event '+event;
    }else if (!this.data[idx].hasOwnProperty(param)){
        error='No known value for "'+param+'" in event '+event;
    }
    if (error){
        if (txt){this.showError(txt+' ; '+error);}
        else{this.showError(error)}
        return true;
    }else{
        return false;
    }
}

GWCat.prototype.getParamType = function(event,param){
    idx=this.event2idx(event);
    try{
        valtype=''
        value=this.data[idx][param];
        if (value.hasOwnProperty('best')){
            valtype='best'
        }else if (value.hasOwnProperty('lower')){
            valtype='lower'
        }else if (value.hasOwnProperty('upper')){
            valtype='upper'
        }else if (value.hasOwnProperty('lim')){
            valtype='lim'
        }else{
            valtype='unknown'
        }
        return valtype;
    }catch(err){
        this.checkEventParam(event,param,err.message);
        return '';
    }
}

GWCat.prototype.hasError = function(event,param){
    idx=this.event2idx(event);
    try{
        return this.data[idx][param].hasOwnProperty('err')
    }catch(err){
        this.checkEventParam(event,param,err.message);
        return false;
    }
}

GWCat.prototype.getBest = function(event,param){
    return this.getValue(event,param,'best');
}

GWCat.prototype.getBestErr = function(event,param){
    best=this.getValue(event,param,'best');
    err = (this.hasError(event,param)) ? this.getValue(event,param,'err') : [];
    return [best,err]
}

GWCat.prototype.getLower = function(event,param){
    return this.getValue(event,param,'lower');
}

GWCat.prototype.getUpper = function(event,param){
    return this.getValue(event,param,'upper');
}

GWCat.prototype.getLim = function(event,param){
    lim=this.getValue(event,param,'lim');
    if (lim){return lim}
    else{return []}
}

GWCat.prototype.getError = function(event,param){
    err=this.getValue(event,param,'err');
    if (err){return err}
    else{return []}
}

GWCat.prototype.getPosError = function(event,param){
    err=this.getValue(event,param,'err');
    if (err){
        // assumes positive error is the highest value
        posErr=Math.max(...err)
        return posErr}
    else{return NaN}
}
GWCat.prototype.getNegError = function(event,param){
    err=this.getValue(event,param,'err');
    if (err){
        // assumes negative error is the lower value
        negErr=Math.min(...err)
        return negErr}
    else{return NaN}
}

GWCat.prototype.getNominal = function(event,param){
    valType=this.getParamType(event,param);
    if (valType=='lim'){
        lim=this.getValue(event,param,'lim');
        nom=0.5*(lim[0]+lim[1])
    }else{
        nom=this.getValue(event,param,valType);
    }
}

GWCat.prototype.getMinVal = function(event,param){
    valType=this.getParamType(event,param);
    if (valType=='lim'){
        return this.getLim(event,param)[0];
    }else if(valType=='best'){
        if (this.hasError(event,param)){
            return this.getBest(event,param)+this.getNegError(event,param);
        }else{
            return this.getBest(event,param);
        }
    }else if(valType=='lower'){
        return this.getLower(event,param);
    }else if(valType=='upper'){
        return Number.NEGATIVE_INFINITY;
    }
}

GWCat.prototype.getMaxVal = function(event,param){
    valType=this.getParamType(event,param);
    if (valType=='lim'){
        return this.getLim(event,param)[1];
    }else if(valType=='best'){
        if (this.hasError(event,param)){
            return this.getBest(event,param)+this.getPosError(event,param);
        }else{
            return this.getBest(event,param);
        }
    }else if(valType=='lower'){
        return Number.POSITIVE_INFINITY;
    }else if(valType=='upper'){
        return this.getUpper(event,param);
    }
}

GWCat.prototype.getValue = function(event,param,valtype){
    idx=this.event2idx(event);
    try{
        if (!this.data[idx][param].hasOwnProperty(valtype)){
            warning='No known "'+valtype+'" value for "'+param+'" in event '+event;
            this.showWarning(warning);
        }
        return this.data[idx][param][valtype];
    }catch(err){
        this.checkEventParam(event,param,err.message);
        return Number.NaN;
    }
}

GWCat.prototype.paramName = function(param){
    name= this.datadict[param].name_en
    if(name){
        return name;
    }else{
        return '';
    }
}

GWCat.prototype.paramUnit = function(param){
    unit = this.datadict[param].unit_en;
    if (unit){
        return unit;
    }else{
        return '';
    }
}

GWCat.prototype.getRef = function(event){
    idx=this.event2idx(event);
    param="ref";
    try{
        if (!this.data[idx].hasOwnProperty(param)){
            warning='No known "'+param+'" in event '+event;
            this.showWarning(warning);
        }
        return this.data[idx][param];
    }catch(err){
        this.checkEventParam(event,param,err.message);
        return {};
    }
}
GWCat.prototype.getOpenData = function(event){
    idx=this.event2idx(event);
    param="opendata";
    try{
        if (!this.data[idx].hasOwnProperty(param)){
            warning='No known "'+param+'" in event '+event;
            this.showWarning(warning);
        }
        return this.data[idx][param];
    }catch(err){
        this.checkEventParam(event,param,err.message);
        return {};
    }
}
