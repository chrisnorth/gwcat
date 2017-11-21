import json
import pandas as pd
import numpy as np

class GWCat(object):
    def __init__(self,fileIn='../data/events.json'):
        eventsIn=json.load(open(fileIn))
        self.data=eventsIn['data']
        self.datadict=eventsIn['datadict']
        self.links=eventsIn['links']
        self.json2dataframe()
        return

    def json2dataframe(self):
        data=self.data
        ddIn=self.datadict
        dOut={'unit':{},'description':{}}
        series={}
        self.cols=['Mchirp','M1','M2','Mtotal','Mfinal','Mratio','DL','z','deltaOmega','chi','af','Erad','lpeak','rho','FAR','UTC','GPS']
        for e in data:
            dOut[e]={}
            for d in self.cols:
                if ddIn[d].has_key('unit_en'):
                    dOut['unit'][d]=ddIn[d]['unit_en']
                if ddIn[d].has_key('name_en'):
                    dOut['description'][d]=ddIn[d]['name_en']
                if not data[e].has_key(d):
                    continue
                if data[e][d].has_key('best'):
                    dOut[e][d]=data[e][d]['best']
                    if data[e][d].has_key('err'):
                        dOut[e][d+'_errtype']='+/- (90%)'
                        dOut[e][d+'_errp']=data[e][d]['err'][0]
                        dOut[e][d+'_errm']=data[e][d]['err'][1]
                    elif data[e][d].has_key('lim'):
                        dOut[e][d+'_errtype']='+/- (range)'
                        dOut[e][d+'_errp']=data[e][d]['lim'][0]
                        dOut[e][d+'_errm']=data[e][d]['lim'][1]
                elif data[e][d].has_key('lower'):
                    dOut[e][d]=data[e][d]['lower']
                    dOut[e][d+'_errtype']='lower_limit'
                elif data[e][d].has_key('upper'):
                    dOut[e][d]=data[e][d]['upper']
                    dOut[e][d+'_errtype']='upper'
        series['unit']=pd.Series(dOut['unit'],index=dOut['unit'].keys())
        series['description']=pd.Series(dOut['description'],index=dOut['description'].keys())

        rows=['description','unit']
        for e in data:
            series[e]=pd.Series(dOut[e],index=dOut[e].keys())
            rows.append(e)

        df=pd.DataFrame(series)
        dfT=df.T
        self.dataframe=dfT

        return

    def getValue(self,event,param,value):
        try:
            return self.data[event][param][value]
        except:
            print('Error finding value %s for parameter %s in event %s'%(value,param,event))
            return np.NaN

    def exportCSV(self,fileout):
        rows=['description','unit']
        for e in self.data:
            rows.append(e)

        colsAll=[]
        for c in self.cols:
            # print c
            try:
                self.dataframe[c]
                colsAll.append(c)
            except:
                pass
            try:
                self.dataframe[c+'_errtype']
                colsAll.append(c+'_errtype')
            except:
                pass
            try:
                self.dataframe[c+'_errp']
                colsAll.append(c+'_errp')
            except:
                pass
            try:
                self.dataframe[c+'_errm']
                colsAll.append(c+'_errm')
            except:
                pass
        # print colsAll
        pd.DataFrame(self.dataframe,index=rows).to_csv(fileout,columns=colsAll,encoding='utf8')
        return
