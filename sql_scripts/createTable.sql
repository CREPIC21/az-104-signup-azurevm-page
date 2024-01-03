CREATE TABLE SignUps
(
Email varchar(1000),
FirstName varchar(1000),
LastName varchar(1000)
)
INSERT INTO SignUps(Email,FirstName,LastName) VALUES ('test@gmail.com','Tim','Old')

INSERT INTO SignUps(Email,FirstName,LastName) VALUES ('anothertest@gmail.com','Steve','Young')

INSERT INTO SignUps(Email,FirstName,LastName) VALUES ('lasttest@gmail.com','Lilly','Pink')

SELECT * FROM SignUps