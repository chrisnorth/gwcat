import json
import pandas as pd
import numpy as np

def compareElement(el1,el2,verbose=False):
    if type(el1)!=type(el2):
        # types are different
        if verbose: print('inconsistent types [{},{}]'.format(type(el1),type(el2)))
        return(False)
    elif type(el1)==dict and type(el2)==dict:
        for el in el1:
            if el in el2:
                if verbose: print('Comparing elements {}'.format(el))
                return(compareElement(el1[el],el2[el],verbose=verbose))
            else:
                if verbose: print('element {} not in dict 2'.format(el))
                return(False)
        for el in el2:
            if el not in el1:
                if verbose: print('element {} not in dict 1'.format(el))
                return(False)
    else:
        try:
            # if verbose: print('Comparing elements {}'.format(el1))
            if el1==el2:
                if verbose: print('{}=={}'.format(el1,el2))
                return(True)
            else:
                if verbose: print('{}!={}'.format(el1,el2))
                return(False)
        except:
            print('ERROR: unable to compare [{} , {}] / [{},{}]'.format(el1,el2),type(el1),type(el2))
            return()

    return()

def dataframe2jsonEvent(evIn,params,verbose=False):
    # convert dataframe element to json
    evOut={}
    for p in range(len(params)):
        param=params[p]
        if verbose: print('Converting value {}'.format(param))
        if param in evIn:
            try:
                pv=evIn[param+'_valtype']
            except:
                if verbose: print('ERROR: No valtype found for {}'.format(param))
                pass
            try:
                np.isnan(pv)
                pass
            except:
                evOut[param]={}
            if pv=='value':
                evOut[param]['best']=evIn[param]
            elif pv=='bestfit':
                evOut[param]['best']=evIn[param]
                try:
                    evOut[param]['err']=[evIn[param+'_errp'],evIn[param+'_errm']]
                except:
                    if verbose: print('WARNING: no err found form {}'.format(param))
            elif pv=='range':
                try:
                    evOut[param]['lim']=[evIn[param+'_errp'],evIn[param+'_errm']]
                except:
                    if verbose: print('WARNING: no lim found form {}'.format(param))
            elif pv=='upper':
                evOut[param]['upper']=evIn[param]
            elif pv=='lower':
                evOut[param]['lower']=evIn[param]
            else:
                if verbose: print('ERROR: unknown type for {} [{}]'.format(param,pv))
    return(evOut)

class GWCat(object):
    def __init__(self,fileIn='../data/events.json'):
        eventsIn=json.load(open(fileIn))
        self.data=eventsIn['data']
        self.datadict=eventsIn['datadict']
        self.cols=list(self.datadict.keys())
        self.links=eventsIn['links']
        # self.json2dataframe()
        return

    def json2dataframe(self):
        data=self.data
        dataOut={}
        series={}

        units=pd.DataFrame(self.datadict).transpose()
        self.units=units

        for d in self.cols:
            dataOut[d]={}
            dataOut[d+'_valtype']={}
            dataOut[d+'_errp']={}
            dataOut[d+'_errm']={}
            for e in data:
                if d not in data[e]:
                    continue
                if 'best' in data[e][d]:
                    dataOut[d][e]=data[e][d]['best']
                    if 'err' in data[e][d]:
                        dataOut[d+'_valtype'][e]='bestfit'
                        dataOut[d+'_errp'][e]=data[e][d]['err'][0]
                        dataOut[d+'_errm'][e]=data[e][d]['err'][1]
                    else:
                        dataOut[d+'_valtype'][e]='value'
                elif 'lim' in data[e][d]:
                    dataOut[d+'_valtype'][e]='range'
                    dataOut[d+'_errp'][e]=data[e][d]['lim'][0]
                    dataOut[d+'_errm'][e]=data[e][d]['lim'][1]
                elif 'lower' in data[e][d]:
                    dataOut[d+'_valtype'][e]='lower'
                    dataOut[d][e]=data[e][d]['lower']
                elif 'upper' in data[e][d]:
                    dataOut[d][e]=data[e][d]['upper']
                    dataOut[d+'_valtype'][e]='upper'

        # rows=['description','unit']
        # rows=[]
        for d in dataOut:
            series[d]=pd.Series(dataOut[d],index=dataOut[d].keys())
            # rows.append(d)

        df=pd.DataFrame(series)
        dfT=df.T
        self.events=dfT

        return(df.T,units)

    def dataframe2json(self,dataIn,unitsIn,verbose=False):
        paramsIn=unitsIn.index.tolist()
        eventsIn=dataIn.index.tolist()

        eventsInDict=dataIn.to_dict(orient='index')
        unitsInDict=unitsIn.to_dict(orient='index')

        format
        for param in unitsInDict:
            # check parameters are in current database
            if param not in self.datadict:
                print('Adding parameter %s'%(param))
                self.datadict[param]=unitsInDict[param]

        for ev in eventsInDict:
            if verbose: print('merging event {}'.format(ev))
            event=dataframe2jsonEvent(eventsInDict[ev],paramsIn,verbose=verbose)
            if ev not in self.data:
                print('Adding event %s'%(ev))
                self.data[ev]={}
            else:
                print('Comparing events {}'.format(ev))
                for el in event:
                    if el not in self.data[ev]:
                        print ('Adding value {}'.format(el))
                        self.data[ev][el]=event[el]
                    else:
                        if verbose: print('Comapring element {}'.format(el))
                        if not compareElement(self.data[ev][el],event[el],verbose=verbose):
                            if verbose: print('Updating value {}'.format(el))
                            self.data[ev][el]=event[el]
                        else:
                            if verbose: print('Keeping value {}'.format(el))
        return()


    def getValue(self,event,param,value):
        try:
            return self.data[event][param][value]
        except:
            print('Error finding value %s for parameter %s in event %s'%(value,param,event))
            return np.NaN

    def exportCSV(self,datafileout,dictfileout=None):
        dataframe,units = self.json2dataframe()
        dataframe.transpose().to_csv(datafileout,encoding='utf8',index_label='Event')

        if dictfileout!=None:
            units.to_csv(dictfileout,encoding='utf8',index_label='Parameter')
        return

    def importCSV(self,datafilein,dictfilein=None):
        # read csv file
        datain=pd.read_csv(datafilein,index_col=0)
        if dictfilein!=None:
            unitsin=pd.read_csv(dictfilein,index_col=0)
        else:
            unitsin=self.units
        self.dataframe2json(datain,unitsin,verbose=True)
