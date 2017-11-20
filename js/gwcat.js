
function GWCat(callback,inp){
    this.inp=inp;
    this.callback = (callback) ? callback : this.callbackDefault;
    this.init();

    this.loadData();
}
GWCat.prototype.init = function(){
    // set default parameters
    console.log('inp',this.inp)
    this.debug = (this.inp)&&(this.inp.debug) ? this.inp.debug : true;
    this.fileIn = (this.inp)&&(this.inp.fileIn) ? this.inp.fileIn : "data/events.json";
    this.loadMethod = (this.inp)&&(inp.loadMethod) ? this.inp.loadMethod : "d3";
}
GWCat.prototype.callbackDefault = function(){
    console.log('Successfully loaded data')
}

GWCat.prototype.loadData = function(){
    var gw=this;
    // load external data (assumes d3 is loaded)
    var toLoad=1;
    var loaded=0;
    this.data=[];

    if (this.loadMethod=="d3"){
        d3.json(gw.fileIn, function(error, dataIn) {
            if (error){
                console.log('events error:',error,dataIn);
                alert("Fatal error loading input file: '"+gw.fileIn+"'. Sorry!");
            }else{
                // if (gw.debug){console.log("dataIn (events:)",dataIn)}
            }
            // if (this.debug){console.log('dataIn.links',dataIn.links)}
            loaded++;
            gw.datadict=dataIn.datadict;
            newlinks={}
            for (e in dataIn.data){
                // if(gw.debug){console.log(e,dataIn.data[e])}
                // convert links to required format
                // if(gw.debug){console.log(e,dataIn.links)}
                if (dataIn.links[e]){
                    linkIn=dataIn.links[e];
                    // if(gw.debug){console.log('linkIn',e,linkIn)}
                    newlinks[e]={}
                    for (l in linkIn){
                        if (linkIn[l].text.search('Paper')>=0){
                            newlinks[e]['DetPaper']={
                                text:linkIn[l].text,
                                url:linkIn[l].url,
                                type:'paper'}
                        }
                        else if (linkIn[l].text.search('Open Data page')>=0){
                            newlinks[e]['LOSCData']={
                                text:linkIn[l].text,
                                url:linkIn[l].url,
                                type:'web-data'}
                        }
                        else if (linkIn[l].text.search('GraceDB page')>=0){
                            newlinks[e]['GraceDB']={
                                text:linkIn[l].text,
                                url:linkIn[l].url,
                                type:'web-data'}
                        }
                        else if (linkIn[l].text.search('Final Skymap')>=0){
                            newlinks[e]['SkyMapFile']={
                                text:linkIn[l].text,
                                url:linkIn[l].url,
                                type:'file'}
                        }
                        else if (linkIn[l].text.search('Skymap View')>=0){
                            newlinks[e]['SkyMapAladin']={
                                text:linkIn[l].text,
                                url:linkIn[l].url,
                                type:'web'}
                        }
                    }
                    // if(gw.debug){console.log('links',e,newlinks[e])}
                }
            }
            dataIn.links=newlinks;
            // if (gw.debug){console.log('dataIn.links',dataIn.links,newlinks)}
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
                    dataIn.data[e].link=link;
                }
                if ((dataIn.links[e]) && (dataIn.links[e].DetPaper)){
                    ref=dataIn.links[e].DetPaper;
                    ref.url=ref.url;
                    dataIn.data[e].ref=ref;
                    // if(this.debug){console.log(dataIn.data[e].name,ref)}
                }
                gw.data.push(dataIn.data[e]);
            }
            if(gw.debug){console.log('data loaded:',gw.data);}
            if (loaded==toLoad){
                gw.orderData('GPS');
                gw.callback();
            }
        });
    }
}

GWCat.prototype.showWarning = function(message){
    if (this.debug){console.log('WARNING: ',message)}
}
GWCat.prototype.showError = function(message){
    if (this.debug){console.log('ERROR: ',message)}
}
GWCat.prototype.orderData = function(order='GPS'){
    this.data=this.data.sort(function(a,b){
        return b[order].best - a[order].best
    });
    var dataOrder=[];
    this.data.forEach(function(d){dataOrder.push(d.name);});
    this.dataOrder=dataOrder;
}

GWCat.prototype.event2idx = function(event){
    if (typeof event == "number"){
        idx=event;
    }else{
        idx=this.dataOrder.indexOf(event);
    }
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
            valtype='limit'
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
            return this.getBest(event,param)-this.getError(event,param)[1];
        }else{
            return this.getBest(event,param);
        }
    }else if(valType=='lower'){
        return this.getLower(event,param);
    }else if(valType=='upper'){
        return Number.POSITIVE_INFINITY;
    }
}
GWCat.prototype.getMaxVal = function(event,param){
    valType=this.getParamType(event,param);
    if (valType=='lim'){
        return this.getLim(event,param)[1];
    }else if(valType=='best'){
        if (this.hasError(event,param)){
            return this.getBest(event,param)+this.getError(event,param)[0];
        }else{
            return this.getBest(event,param);
        }
    }else if(valType=='lower'){
        return Number.NEGATIVE_INFINITY;
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


