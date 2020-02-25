create table profile(
       email varchar(200),
       password blob(100),
       firstName varchar(40),
       familyName varchar(40),
       gender varchar(20),
       city varchar(50),
       country varchar(50),
       primary key(email)
);

create table messages(
       email varchar(200),
       messages varchar(1000),
       primary key(email)
);
