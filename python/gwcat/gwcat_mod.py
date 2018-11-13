import json
import pandas as pd
import numpy as np
import os

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
                pv=''
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
        """Initialise catalogue from input file
        Input: fileIn [string, OPTIONAL]: filename to read data from
        """
        eventsIn=json.load(open(fileIn))
        self.data=eventsIn['data']
        self.datadict=eventsIn['datadict']
        self.cols=list(self.datadict.keys())
        self.links=eventsIn['links']
        # self.json2dataframe()
        return

    def json2dataframe(self,verbose=False):
        """Convert dictionaries into pandas DataFrames
        data -> events
        datadict -> units
        links -> eventrefs
        Inputs:
            * None
        Outputs:
            * Tuple of DataFrames:
                - 0: events
                - 1: units
                - 2: eventlinks
        """

        # convert datadict into units DataFrame
        units=pd.DataFrame(self.datadict).transpose()
        self.units=units

        # convert data into events DataFrame
        data=self.data
        dataOut={}
        series={}
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
        # convert to series
        for dOut in dataOut:
            series[dOut]=pd.Series(dataOut[dOut],index=dataOut[dOut].keys())
            # rows.append(d)
        # combine into DataFrame
        events=pd.DataFrame(series).T
        self.events=events

        # convert links into eventlinks DataFrame

        linksSeries=[]
        for ev in self.links:
            for l in range(len(self.links[ev])):
                link=self.links[ev][l]
                linkOut={'event':ev}
                for r in link:
                    linkOut[r]=link[r]
                # convert to series
                linksSeries.append(pd.Series(linkOut))
        # combine into DataFrame
        eventrefs=pd.DataFrame(linksSeries).T
        self.eventrefs=eventrefs

        return(events,units,eventrefs)

    def dataframe2json(self,dataIn,unitsIn,linksIn,mode,verbose=False):
        """Convert pandas DataFrame objects into dictionaries, merging with existing. Used to read from CSV files
        Inputs:
            * dataIn [dictionary]: data for events (merge with data)
            * unitsIn [dictionary]: units information (merge with datadict)
            * linksIn [dictionary]: links information (merge with links)
            * mode [string]: Mode to use:
                - "replace": Remove and replace entire dataset from imports
                - "update": Update existing data from imports
                - "append": Append new events/parameters, leave existing events/parameters unchanged
        Outputs:
            * Tuple of Dictionary:
                - 0: data
                - 1: datadict
                - 2: links
        """
        paramsIn=unitsIn.index.tolist()
        eventsIn=dataIn.index.tolist()

        eventsInDict=dataIn.to_dict(orient='index')
        unitsInDict=unitsIn.to_dict(orient='index')
        linksInDict=linksIn.to_dict(orient='index')

        if mode=='replace':
            # remove existing dataset
            self.datadict={}
            self.events={}
            self.links={}

        if verbose: print('\n*** Udating parameters ***')
        # create list of parameters
        for param in unitsInDict:
            # check parameters are in current database
            if param not in self.datadict:
                if verbose: print('Adding parameter {}'.format(param))
                self.datadict[param]=unitsInDict[param]
            elif mode=="append":
                # don't update existing parameter
                if verbose: print('Mode=append. Skipping parameter {}'.format(param))
                pass
            else:
                # replace existing parameter
                if verbose: print('Updating parameter {}'.format(param))
                self.datadict[param]=unitsInDict[param]

        if verbose: print('\n*** Updating event data ***')
        # update events dictionary
        for ev in eventsInDict:
            if ev not in self.data:
                # event is new
                if verbose: print('Adding event %s'%(ev))
                event=dataframe2jsonEvent(eventsInDict[ev],paramsIn,verbose=verbose)
                self.data[ev]=event
            else:
                # event exists in data
                if mode=="append":
                    # don't update existing events
                    if verbose: print('Mode=append. Skipping event {}'.format(ev))
                    pass
                else:
                    # update existing event
                    if verbose: print('Merging events {}'.format(ev))
                    event=dataframe2jsonEvent(eventsInDict[ev],paramsIn,verbose=verbose)
                    for el in event:
                        if el not in self.data[ev]:
                            print ('Adding value {}'.format(el))
                            self.data[ev][el]=event[el]
                        else:
                            if verbose: print('Comapring element {} for event {}'.format(el,ev))
                            if not compareElement(self.data[ev][el],event[el],verbose=verbose):
                                if verbose: print('Updating value {}'.format(el))
                                self.data[ev][el]=event[el]
                            else:
                                if verbose: print('Keeping value {}'.format(el))
                    for el in self.data[ev]:
                        if el not in event:
                            # element existed, but not in input.
                            if mode=='replace':
                                # Remove from dictionary
                                self.data[ev].pop(el,None)

        if verbose: print('\n*** Udating links ***')

        # get current links
        oldLinks=[]
        newLinks=[]
        skipLinks=[]
        for ev in self.links:
            oldLinks.append(ev)

        # update links
        for l in linksInDict:
            link=linksInDict[l]
            ev=link['event']
            if ev not in oldLinks and ev not in newLinks:
                # event is new in links
                if verbose: print('Adding links for event {}'.format(ev))
                self.links[ev]=[]

            if mode=="append":
                # don't update existing events
                if ev not in skipLinks:
                    if verbose: print('Skipping event {}'.format(ev))
                    skipLinks.append(ev)
                pass
            else:
                if ev not in newLinks:
                    # links haven't been replaced yet for this event
                    if verbose: print('Updating links for event {}'.format(ev))
                    self.links[ev]=[]
                    newLinks.append(ev)
                # add link to links-list for event
                newLink={}
                for key in link:
                    if key!='event' and link[key]!='':
                        newLink[key]=link[key]
                self.links[ev].append(newLink)

        return(self.data,self.datadict,self.links)


    def getValue(self,event,param,value):
        try:
            return self.data[event][param][value]
        except:
            print('Error finding value %s for parameter %s in event %s'%(value,param,event))
            return np.NaN

    def exportJson(self,fileout,dir='',verbose=False):
        """Export parameters, data and links to single JSON file
        Inputs:
            * fileout [string]: filename to write all data to
            * dir [string OPTIONAL]: directory to write files to. Default=''
        """
        alldata={'datadict':self.datadict,'data':self.data,'links':self.links}
        if verbose: print('Writing data to JSON: {}'.format(os.path.join(dir,fileout)))
        json.dump(alldata,open(os.path.join(dir,fileout),'w'),indent=4)


        return()

    def exportCSV(self,datafileout,dictfileout=None,linksfileout=None,dir='',verbose=False):
        """Export data to CSV file(s)
        Inputs:
            * datafileout [string]: filename to write events data to
            * dictfileout [string, OPTIONAL]: filename to write data dictionary to. Default: do not export
            * linksfileout [string OPTIONAL]: filename to write references to. Default: to not export
            * dir [string OPTIONAL]: directory to write files to. Default=''
        """
        (dataframe,units,links) = self.json2dataframe(verbose=verbose)

        if verbose: print('Writing data to CSV: {}'.format(os.path.join(dir,datafileout)))
        dataframe.transpose().to_csv(os.path.join(dir,datafileout),encoding='utf8',index_label='Event')

        if dictfileout!=None:
            if verbose: print('Writing datadict to CSV: {}'.format(os.path.join(dir,dictfileout)))
            units.to_csv(os.path.join(dir,dictfileout),encoding='utf8',index_label='Parameter')

        if linksfileout!=None:
            if verbose: print('Writing links to CSV:{}'.format(os.path.join(dir,linksfileout)))
            links.transpose().to_csv(os.path.join(dir,linksfileout),encoding='utf8',index_label='Ref')

        return()

    def exportExcel(self,fileout,dir='',verbose=False):
        """Export datadict, events data and links to CSV file(s)
        Inputs:
            * fileout [string]: filename to write all data to
            * dir [string OPTIONAL]: directory to write files to. Default=''
        """
        (dataframe,units,links) = self.json2dataframe(verbose=verbose)

        writer=pd.ExcelWriter(os.path.join(dir,fileout),engine='xlsxwriter')

        if verbose: print('Writing data to Excel: {}'.format(os.path.join(dir,fileout)))
        dataframe.transpose().to_excel(writer,sheet_name='Events',encoding='utf8',index_label='Event')

        if verbose: print('Writing datadict to Excel: {}'.format(os.path.join(dir,fileout)))
        units.to_excel(writer,sheet_name='Parameters',encoding='utf8',index_label='Parameter')

        if verbose: print('Writing links to Excel:{}'.format(os.path.join(dir,fileout)))
        links.transpose().to_excel(writer,sheet_name='Links',encoding='utf8',index_label='Ref')

        writer.save()

        return()

    def importCSV(self,datafilein,dictfilein=None,linksfilein=None,dir='',mode=None,verbose=False):
        """Read CSV file of data and replace in database
        Inputs:
            * datafilein [string]: filename of events data file to read in
            * dictfilein [string, OPTIONAL]: filename of data dictionary to read in
            * linkfile [string OPTIONAL]: filename of references csv file to read in
            * dir [string OPTIONAL]: directory to read from. Default=''
            * mode [string, OPTIONAL]: import mode [replace,update,append]
                - replace: replace entire dataset with input data
                - update: update existing events and add new events [default]
                - append: add new events, leave existing events unchanged
        """

        # set mode to default if not set
        if mode==None:
            mode='update'

        # read CSV files
        if verbose: print('Reading data from {}'.format(os.path.join(dir,datafilein)))
        datain=pd.read_csv(os.path.join(dir,datafilein),index_col=0)
        if dictfilein!=None:
            if verbose: print('Reading data dict from {}'.format(os.path.join(dir,dictfilein)))
            unitsin=pd.read_csv(os.path.join(dir,dictfilein),index_col=0)
        else:
            unitsin=self.units
        if linksfilein!=None:
            if verbose: print('Reading links from {}'.format(os.path.join(dir,linksfilein)))
            linksin=pd.read_csv(os.path.join(dir,linksfilein),index_col=0)
        else:
            linksin=self.links

        # merge imports with existing
        self.dataframe2json(datain,unitsin,linksin,mode=mode,verbose=verbose)

        return()

    def importExcel(self,filein,dir='',sheet_events='Events',sheet_dict='Parameters',sheet_links='Links',mode=None,verbose=False):
        """Read Excel file of data and replace in database
        Inputs:
            * filein [string]: filename of data file to read in from
            * sheet_events [string, OPTIONAL]: sheet name for events data. Default="Events"
            * sheet_dict [string, OPTIONAL]: sheet name for parameters data. Default="Parameters"
            * sheet_links [string, OPTIONAL]: sheet name for links data. Default="Links"
            * dir [string OPTIONAL]: directory to read from. Default=''
            * mode [string, OPTIONAL]: import mode [replace,update,append]
                - replace: replace entire dataset with input data
                - update: update existing events and add new events [default]
                - append: add new events, leave existing events unchanged
        """

        # set mode to default if not set
        if mode==None:
            mode='update'

        # read Excel file
        if verbose: print('Reading data from {}'.format(os.path.join(dir,filein)))
        datain=pd.read_excel(os.path.join(dir,filein),sheet_name='Events',index_col=0)

        if verbose: print('Reading data dict from {}'.format(os.path.join(dir,filein)))
        unitsin=pd.read_excel(os.path.join(dir,filein),sheet_name='Parameters',index_col=0)

        if verbose: print('Reading links from {}'.format(os.path.join(dir,filein)))
        linksin=pd.read_excel(os.path.join(dir,filein),sheet_name='Links',index_col=0)


        # merge imports with existing
        self.dataframe2json(datain,unitsin,linksin,mode=mode,verbose=verbose)

        return()
