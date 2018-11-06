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
        ddOut={}
        dataOut={}
        series={}
        ddSeries={}
        self.cols=['Mchirp','M1','M2','Mtotal','Mfinal','Mratio','DL','z','deltaOmega','chi','af','Erad','lpeak','rho','FAR','UTC','GPS']
        for d in self.cols:
            ddOut[d]={}
            if 'unit_en' in ddIn[d]:
                ddOut[d]['unit']=ddIn[d]['unit_en']
            if 'name_en' in ddIn[d]:
                ddOut[d]['description']=ddIn[d]['name_en']
        for e in data:
            dataOut[e]={}
            for d in self.cols:
                if d not in data[e]:
                    continue
                if 'best' in data[e][d]:
                    dataOut[e][d]=data[e][d]['best']
                    if 'err' in data[e][d]:
                        dataOut[e][d+'_valtype']='err'
                        dataOut[e][d+'_errp']=data[e][d]['err'][0]
                        dataOut[e][d+'_errm']=data[e][d]['err'][1]
                    elif 'lim' in data[e][d]:
                        dataOut[e][d+'_valtype']='range'
                        dataOut[e][d+'_errp']=data[e][d]['lim'][0]
                        dataOut[e][d+'_errm']=data[e][d]['lim'][1]
                elif 'lower' in data[e][d]:
                    dataOut[e][d]=data[e][d]['lower']
                    dataOut[e][d+'_valtype']='lower_limit'
                elif 'upper' in data[e][d]:
                    dataOut[e][d]=data[e][d]['upper']
                    dataOut[e][d+'_valtype']='upper'

        for d in ddOut:
            ddSeries[d]=pd.Series(ddOut[d],index=ddOut[d].keys())
        # ddSeries['description']=pd.Series(ddOut['description'],index=ddOut['description'].keys())

        ddFrame=pd.DataFrame(ddSeries)
        self.units=ddFrame.T

        # rows=['description','unit']
        rows=[]
        for e in data:
            series[e]=pd.Series(dataOut[e],index=dataOut[e].keys())
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

    def exportCSV(self,datafileout,dictfileout=None):
        # rows=['description','unit']
        rows=[]
        for e in self.data:
            rows.append(e)
        print(rows)
        colsAll=[]
        for c in self.cols:
            # print c
            try:
                self.dataframe[c]
                colsAll.append(c)
            except:
                pass
            try:
                self.dataframe[c+'_valtype']
                colsAll.append(c+'_valtype')
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
        pd.DataFrame(self.dataframe,index=rows).to_csv(datafileout,columns=colsAll,encoding='utf8',index_label='Event')

        if dictfileout!=None:
            pd.DataFrame(self.units,index=self.cols).to_csv(dictfileout,columns=['description','unit'],encoding='utf8',index_label='Parameter')
        return

    # def importCSV(self,filein):

