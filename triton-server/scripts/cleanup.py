#!/usr/bin/python

import os, time,datetime
import subprocess
import syslog
import dateutil.parser

# definitions
testrecall = "/usr/local/bin/testrecall.sh"
tritonUser="nodejs"
tritonServer="bravoportal.genome.mcgill.ca"
tritonDB="/data/triton/triton.db"
globusServer="lims-dtn.genome.mcgill.ca"
httpPrefix="/data/projects"
globusPrefix="/home/users"

syslog.openlog("CleanupStagingFiles", syslog.LOG_PID,syslog.LOG_DAEMON)
syslog.syslog(syslog.LOG_INFO, "Processing started")

pDB = subprocess.Popen(["ssh", tritonUser + "@" + tritonServer, "/usr/bin/sqlite3", tritonDB, "\"SELECT * FROM requests WHERE status = 'SUCCESS' or status = 'FAILED'\""], stdout=subprocess.PIPE)
myrequests, err = pDB.communicate()
if pDB.returncode != 0:
    print "Can't query DB " + tritonDB + " on " + tritonServer + " : " + str(err)
    syslog.syslog(syslog.LOG_WARNING,"Can't query DB " + tritonDB + " on " + tritonServer + " : " + str(err) )
    exit()


if myrequests: 
    for row in myrequests.splitlines():
      #print(dataset);
      myrow=row.split("|")
      dataset=myrow[2]
      user=myrow[6]   # user=project_id for sftp, globus
      mytype=myrow[1]
      expiry=myrow[4]
      should_delete=int(myrow[7])

      d1=dateutil.parser.parse(expiry)
      d2=datetime.datetime.now()

      # print "d1 " + d1 + " d2 " +d2

      if d1<d2 or should_delete>0:
        # ready to cleanup files

        if (mytype=='HTTP'):
          remoteUser=tritonUser
          remoteServer=tritonServer
          prefix=httpPrefix
        else:
          # GLOBUS
          remoteUser=user
          remoteServer=globusServer
          prefix=globusPrefix
            
        destination=prefix + "/" + user + "/" + dataset 
        p = subprocess.Popen(["ssh", remoteUser + "@" + remoteServer, "rm", "-rf",  destination], stdout=subprocess.PIPE)
        output, err = p.communicate()

        print "Deleting " + destination + " on server " + remoteServer

        # DB update files
        pUpd = subprocess.Popen(["ssh", tritonUser + "@" + tritonServer, "/usr/bin/sqlite3", tritonDB, "\"insert into historical_files select * from files WHERE dataset_id='" + dataset + "'\""], stdout=subprocess.PIPE)
        out,err = pUpd.communicate()

        pUpd = subprocess.Popen(["ssh", tritonUser + "@" + tritonServer, "/usr/bin/sqlite3", tritonDB, "\"delete from files WHERE dataset_id='" + dataset + "'\""], stdout=subprocess.PIPE)
        out,err = pUpd.communicate()

        # DB update requests
        pUpd = subprocess.Popen(["ssh", tritonUser + "@" + tritonServer, "/usr/bin/sqlite3", tritonDB, "\"insert into historical_requests select * from requests WHERE dataset_id='" + dataset + "' and type = '" + mytype + "'\""], stdout=subprocess.PIPE)
        out,err = pUpd.communicate()
        
        pUpd = subprocess.Popen(["ssh", tritonUser + "@" + tritonServer, "/usr/bin/sqlite3", tritonDB, "\"delete from requests WHERE dataset_id='" + dataset + "' and type = '" + mytype + "'\""], stdout=subprocess.PIPE)
        out,err = pUpd.communicate()
