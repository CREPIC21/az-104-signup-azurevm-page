CREATE TABLE SignUps
(
Email varchar(1000),
FirstName varchar(1000),
LastName varchar(1000),
VMName varchar(1000)
)
INSERT INTO SignUps(Email,FirstName,LastName,VMName) VALUES ('test@gmail.com','Tim','Old','VM-01')

INSERT INTO SignUps(Email,FirstName,LastName,VMName) VALUES ('anothertest@gmail.com','Steve','Young','VM-02')

INSERT INTO SignUps(Email,FirstName,LastName,VMName) VALUES ('lasttest@gmail.com','Lilly','Pink','VM-03')

SELECT * FROM SignUps