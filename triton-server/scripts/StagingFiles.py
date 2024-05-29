#!/usr/bin/python

import os, time,datetime
import subprocess
import syslog

# definitions
testrecall = "/usr/local/bin/testrecall.sh"
tritonUser="nodejs"
tritonServer="bravoportal.genome.mcgill.ca"
tritonDB="/data/triton/triton.db"
globusServer="lims-dtn.genome.mcgill.ca"
httpPrefix="/data/projects"
globusPrefix="/home/users"
keepFiles=7   # nbr of days before deleted

syslog.openlog("StagingFiles", syslog.LOG_PID,syslog.LOG_DAEMON)
syslog.syslog(syslog.LOG_INFO, "Processing started")


# read some values from the DB

httpProjLimit=1000000000000  # 1 TB 
globusProjLimit=1000000000000  # 1 TB 
sftpProjLimit=1000000000000  # 1 TB 

pDB = subprocess.Popen(["ssh", tritonUser + "@" + tritonServer, "/usr/bin/sqlite3", tritonDB, "\"SELECT http_project_size, globus_project_size, sftp_project_size FROM constants\""], stdout=subprocess.PIPE)
myrequests, err = pDB.communicate()
if pDB.returncode != 0:
  print "Can't query DB " + tritonDB + " on " + tritonServer + " : " + str(err)
  syslog.syslog(syslog.LOG_WARNING,"Can't query DB " + tritonDB + " on " + tritonServer + " : " + str(err) )
if myrequests:
  myrow=myrequests.split("|")
  httpProjLimit=int(myrow[0])
  globusProjLimit=int(myrow[1])
  sftpProjLimit=int(myrow[2])

while 1:
  time.sleep (5)
  pDB = subprocess.Popen(["ssh", tritonUser + "@" + tritonServer, "/usr/bin/sqlite3", tritonDB, "\"SELECT dataset_id,project_id,type FROM requests WHERE status = 'REQUESTED' or status = 'PENDING' or status = 'QUEUED'\""], stdout=subprocess.PIPE)
  myrequests, err = pDB.communicate()
  if pDB.returncode != 0:
    print "Can't query DB " + tritonDB + " on " + tritonServer + " : " + str(err)
    syslog.syslog(syslog.LOG_WARNING,"Can't query DB " + tritonDB + " on " + tritonServer + " : " + str(err) )
    #exit()
    time.sleep (10)


  if myrequests: 
    for row in myrequests.splitlines():
      #print(dataset);
      myrow=row.split("|")
      dataset=myrow[0]
      user=myrow[1]   # user=project_id for sftp, globus
      mytype=myrow[2]

      # set dataset to PENDING
      pUpd = subprocess.Popen(["ssh", tritonUser + "@" + tritonServer, "/usr/bin/sqlite3", tritonDB, "\"UPDATE requests SET status = 'PENDING' WHERE dataset_id='" + dataset + "' and type='" + mytype + "' and status='REQUESTED'\""], stdout=subprocess.PIPE)
      pUpd.communicate()

      if (mytype=='HTTP'):
        remoteUser=tritonUser
        remoteServer=tritonServer
        prefix=httpPrefix
        projLimit=httpProjLimit
      else:
        # GLOBUS
        remoteUser=user
        remoteServer=globusServer
        prefix=globusPrefix
        projLimit=globusProjLimit
        
        # special check: does user exist?
        p = subprocess.Popen(["ssh", remoteServer, "id", remoteUser], stdout=subprocess.PIPE)
        output, err = p.communicate()
        if p.returncode != 0:
          p = subprocess.Popen(["ssh", remoteServer, "sudo", "/root/addnewuser", "-t", remoteUser], stdout=subprocess.PIPE)
          output, err = p.communicate()
          if p.returncode != 0:
            syslog.syslog(syslog.LOG_WARNING, "Dataset " + dataset + " can't create user " + remoteUser + " on globus.")
            break   # next request
            
      # get all src, dest from fles table
      pFiles = subprocess.Popen(["ssh", tritonUser + "@" + tritonServer, "/usr/bin/sqlite3", tritonDB, "\"SELECT source, destination from files WHERE dataset_id='" + dataset + "'\""], stdout=subprocess.PIPE)
      myfiles, err = pFiles.communicate()

      failure=0
      if myfiles:

        # verify there is enough space on remoteServer
        datasetSize=0
        for line in myfiles.splitlines():
           myList= line.split("|")
           src=myList[0]
           statinfo=os.stat(src)
           datasetSize = datasetSize + statinfo.st_size

        p = subprocess.Popen(["ssh", remoteUser + "@" + remoteServer, "df", "-P", prefix, "|", "tail", "-1"], stdout=subprocess.PIPE)
        output, err = p.communicate()
        if p.returncode != 0:
          available=0
        else:
          print "DEBUG dataset_id=" + dataset + ", output=" + output
          myList= output.split()
          available=int(myList[3])*1024

        if available - datasetSize < 0:
          # not enough space left, skip for now
          syslog.syslog(syslog.LOG_WARNING, "Dataset " + dataset + " requires " + str(datasetSize) + " bytes but there is only " + str(available) + " bytes on " + remoteServer)
          pUpd = subprocess.Popen(["ssh", tritonUser + "@" + tritonServer, "/usr/bin/sqlite3", tritonDB, "\"UPDATE requests SET status = 'QUEUED' WHERE dataset_id='" + dataset + "' and type='" + mytype + "'\""], stdout=subprocess.PIPE)
          pUpd.communicate()
          break

        # verify there is enough space left in project
        p = subprocess.Popen(["ssh", remoteUser + "@" + remoteServer, "du", "-bs", prefix + "/" + user], stdout=subprocess.PIPE)
        output, err = p.communicate()
        if p.returncode != 0:
          projSize=0
        else:
          myList= output.split()
          projSize=int(myList[0])

        if projSize + datasetSize > projLimit:
          # not enough space left, skip for now
          syslog.syslog(syslog.LOG_WARNING, "Dataset " + dataset + " requires " + str(datasetSize) + " bytes but there is already " + str(projSize) + " bytes on " + remoteServer + " for a quota of " + str(projLimit))
          pUpd = subprocess.Popen(["ssh", tritonUser + "@" + tritonServer, "/usr/bin/sqlite3", tritonDB, "\"UPDATE requests SET status = 'QUEUED' WHERE dataset_id='" + dataset + "' and type='" + mytype + "'\""], stdout=subprocess.PIPE)
          pUpd.communicate()
          break

        # enough space, proceed

        for line in myfiles.splitlines():
           myList= line.split("|")
           src=myList[0]
           dest=myList[1]
      
           if os.path.isfile(src):

             destination=prefix + "/" + user + "/" + dataset + "/" + dest
             # verify if dest already exists
             # comlicated, we need to check size as well, as scp truncates file if fails
             #p = subprocess.Popen(["ssh",  remoteUser + "@" + remoteServer, "ls", "-d", destination], stdout=subprocess.PIPE)
             #output, err = p.communicate()
             #if p.returncode == 0:
               # remote file already exists, skip
             #  syslog.syslog(syslog.LOG_INFO, "Dataset " + dataset + " : " + src + " to " + destination + " already transferred.")
             #  break

             # do a test recall on the file
             p = subprocess.Popen([testrecall, src], stdout=subprocess.PIPE)
             output, err = p.communicate()

 
             # mkdir the path
             destpath=os.path.dirname(destination)
             p = subprocess.Popen(["ssh",  remoteUser + "@" + remoteServer, "mkdir", "-p", destpath], stdout=subprocess.PIPE)
             output, err = p.communicate()
             if p.returncode != 0:
               failure=1
               syslog.syslog(syslog.LOG_WARNING, "Dataset " + dataset + " remote mkdir " + destpath + " failed: " + str(err))

             # scp the file
             #dest=remoteUser + "@" + remoteServer + ":" + dest
             p = subprocess.Popen(["scp", src, remoteUser + "@" + remoteServer + ":" + destination], stdout=subprocess.PIPE)
             # print "scp of " + src + " to " + dest + " pid " + str(p.pid)
             output, err = p.communicate()
             if p.returncode != 0:
               failure=1
               syslog.syslog(syslog.LOG_WARNING, "Dataset " + dataset + " transfer of " +  src + " to " + destination + " failed: " + str(err))
             else:
               syslog.syslog(syslog.LOG_INFO, "Dataset " + dataset + " : " + src + " to " + destination + " pid " + str(p.pid) + " transferred.")

           else:
             failure=1
             syslog.syslog(syslog.LOG_WARNING, "Dataset " + dataset + " source file " + src + " doesn't exist.")

      else:
        # no files is an error
        syslog.syslog(syslog.LOG_WARNING, "Dataset " + dataset + " has no files associated with it.")
        failure=1

      if (failure==1):
        pUpd = subprocess.Popen(["ssh", tritonUser + "@" + tritonServer, "/usr/bin/sqlite3", tritonDB, "\"UPDATE requests SET status = 'FAILED',failure_date='" + datetime.datetime.now().isoformat() + " WHERE dataset_id='" + dataset + "' and type='" + mytype + "'\""], stdout=subprocess.PIPE)
        pUpd.communicate()
      else:
        completed=datetime.datetime.now()
        expiry=datetime.datetime.now() + datetime.timedelta(days=keepFiles)
        pUpd = subprocess.Popen(["ssh", tritonUser + "@" + tritonServer, "/usr/bin/sqlite3", tritonDB, "\"UPDATE requests SET status = 'SUCCESS',completion_date='" + datetime.datetime.now().isoformat() + "', expiry_date='" + expiry.isoformat() + "' WHERE dataset_id='" + dataset + "' and type ='" + mytype + "'\""], stdout=subprocess.PIPE)
        pUpd.communicate()
