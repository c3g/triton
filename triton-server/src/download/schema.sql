CREATE TABLE constants (
  id INTEGER PRIMARY KEY ASC check(id = 1),
  http_project_size integer not null,
  globus_project_size integer not null,
  sftp_project_size integer not null
);
CREATE TABLE contacts (
    id INTEGER PRIMARY KEY ASC,
    project_id text not null,
    depth      text,
    status     text check(status IN ('NEW', 'MODIFIED')) not null,
    type       text check(type IN ('SFTP', 'GLOBUS')) not null,

   unique(project_id, type)
);
CREATE TABLE files (
   id INTEGER PRIMARY KEY ASC,
   dataset_id text not null,
   source text not null,
   destination text not null,

   UNIQUE(dataset_id,  source)

);
CREATE TABLE historical_files (

   dataset_id text not null,
   source text not null,
   destination text not null

);
CREATE TABLE historical_requests (
   status  TEXT CHECK( status IN ('REQUESTED', 'PENDING', 'SUCCESS', 'FAILED') ) NOT NULL DEFAULT 'REQUESTED',
   type TEXT CHECK( type IN ('HTTP', 'SFTP', 'GLOBUS') ) NOT NULL,
   dataset_id text not null,  

   completion_date text,

   expiry_date text,
   creation_date text,

   project_id text not null

  , should_delete tinyint not null default 0);
CREATE TABLE requests (
   id INTEGER PRIMARY KEY ASC,
   status  TEXT CHECK( status IN ('REQUESTED', 'PENDING', 'SUCCESS', 'FAILED', 'QUEUED') ) NOT NULL DEFAULT 'REQUESTED',
type TEXT CHECK( type IN ('HTTP', 'SFTP', 'GLOBUS') ) NOT NULL,
   dataset_id text not null,  

   completion_date text,
   failure_date text,

   expiry_date text,
   creation_date text,

   project_id text not null,
   should_delete tinyint not null default 0,
   notification_date text,
   requester       text,
  );
CREATE INDEX idx_dataset_files on files(dataset_id);
CREATE UNIQUE INDEX idx_dataset_request on requests(dataset_id);
