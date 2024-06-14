/*
 * downloads.sql
 */

create table requests (
    id INTEGER PRIMARY KEY ASC,
    status     text check(status IN ('REQUESTED', 'PENDING', 'SUCCESS', 'FAILED', 'QUEUED')) not null default 'REQUESTED',
    type       text check(type IN ('HTTP', 'SFTP', 'GLOBUS')) not null,
    dataset_id text not null,
    project_id text not null,

    creation_date   text not null, -- ISO8601
    completion_date text, -- ISO8601
    expiry_date     text, -- ISO8601
    failure_date text, -- ISO8601

    requester       text,
    notification_date text, -- ISO8601

    should_delete tinyint not null default 0,

);

create unique index idx_dataset_request on requests(dataset_id);

CREATE TABLE historical_requests (
    id INTEGER PRIMARY KEY ASC,
    status     text check(status IN ('REQUESTED', 'PENDING', 'SUCCESS', 'FAILED', 'QUEUED')) not null default 'REQUESTED',
    type       text check(type IN ('HTTP', 'SFTP', 'GLOBUS')) not null,
    dataset_id text not null,
    project_id text not null,

    creation_date   text not null, -- ISO8601
    completion_date text, -- ISO8601
    expiry_date     text, -- ISO8601
    failure_date text, -- ISO8601

    requester       text,
    notification_date text, -- ISO8601

    should_delete tinyint not null default 0,
);


create table files (
   id INTEGER PRIMARY KEY ASC,
   dataset_id  text not null,
   source      text not null, -- absolute path
   destination text not null, -- filename

   unique(dataset_id, source)
);

create index idx_dataset_files on files(dataset_id);

CREATE TABLE historical_files (
   id INTEGER PRIMARY KEY ASC,
   dataset_id  text not null,
   source      text not null, -- absolute path
   destination text not null, -- filename
);


create table contacts (
    id INTEGER PRIMARY KEY ASC,
    project_id text not null,
    depth      text,
    status     text check(status IN ('NEW', 'MODIFIED')) not null,
    type       text check(type IN ('SFTP', 'GLOBUS')) not null,

   unique(project_id, type)
);

create table constants (
    id                  INTEGER PRIMARY KEY ASC check(id = 1),
    http_project_size   INTEGER not null,
    globus_project_size INTEGER not null,
    sftp_project_size   INTEGER not null
);
insert into constants (http_project_size, globus_project_size, sftp_project_size) values (0, 1000000000000, 1000000000000)