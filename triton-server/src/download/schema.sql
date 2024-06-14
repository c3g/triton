CREATE TABLE constants (
  http_project_size integer not null,
  globus_project_size integer not null,
  sftp_project_size integer not null
);
CREATE TABLE contacts (
    project_id text not null,
    depth      text,
    status     text check(status IN ('NEW', 'MODIFIED')) not null,
    type       text check(type IN ('SFTP', 'GLOBUS')) not null,

   unique(project_id, type)
);
CREATE TABLE files (

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
   status  TEXT CHECK( status IN ('REQUESTED', 'PENDING', 'SUCCESS', 'FAILED', 'QUEUED') ) NOT NULL DEFAULT 'REQUESTED',
type TEXT CHECK( type IN ('HTTP', 'SFTP', 'GLOBUS') ) NOT NULL,
   dataset_id text not null,  

   completion_date text,

   expiry_date text,
   creation_date text,

   project_id text not null, should_delete tinyint not null default 0, notified        tinyint not null default 0, requester       text,

   UNIQUE(TYPE,  dataset_id)

  );
CREATE INDEX idx_dataset_files on files(dataset_id);
CREATE INDEX idx_dataset_request on requests(dataset_id);
