require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const bodyParser = require('body-parser');
const sql = require('mssql');
const { ServiceBusClient } = require("@azure/service-bus");

const app = express();

// Azure SQL database configuration
const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    port: 1433,
    options: {
        encrypt: true, // For secure Azure SQL connection
        trustServerCertificate: false // Change to true for self-signed certificates
    }
};

// connection string to your Service Bus namespace
const connectionString = process.env.SERVICE_BUS_CONNECTION_STRING

// name of the queue
const queueName = process.env.SERVICE_BUS_QUEUE_NAME

// access to static files - css, images
app.use(express.static('public'));

// allows to grab inputs from user in forms and place them to variables
app.use(bodyParser.urlencoded({ extended: true }));

// Function to send message to Service Bus
async function sendMessageToServiceBus(messageBody) {
    const sbClient = new ServiceBusClient(connectionString);
    const sender = sbClient.createSender(queueName);

    try {
        await sender.sendMessages(messageBody);
        console.log(`Sent message to the queue: ${JSON.stringify(messageBody)}`);
        await sender.close();
    } catch (error) {
        console.error('Error sending message to Service Bus: ', error);
        throw error; // Rethrow the error to handle it at the caller level
    } finally {
        await sbClient.close();
    }
}

// Function to insert record into SQL database
async function insertRecordIntoSQL(fName, lName, email) {
    await sql.connect(config);
    const request = new sql.Request();

    try {
        const checkQuery = `SELECT COUNT(*) AS count FROM SignUps WHERE Email = @checkEmail`;
        request.input('checkEmail', sql.VarChar, email);

        const checkResult = await request.query(checkQuery);
        const count = checkResult.recordset[0].count;

        if (count > 0) {
            console.log('User with email already subscribed:', email);
            return false; // Return false indicating user already subscribed
        } else {
            const insertQuery = `INSERT INTO SignUps (Email, FirstName, LastName) VALUES (@insertEmail, @fName, @lName)`;
            request.input('insertEmail', sql.VarChar, email);
            request.input('fName', sql.VarChar, fName);
            request.input('lName', sql.VarChar, lName);

            const result = await request.query(insertQuery);
            console.log('Data inserted successfully:', result);
            return true; // Return true indicating successful insertion
        }
    } catch (error) {
        console.error('Error inserting data into SQL: ', error);
        throw error; // Rethrow the error to handle it at the caller level
    } finally {
        sql.close();
    }
}

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html')
});

// Express route handler
app.post('/', async function (req, res) {
    const fName = req.body.firstName;
    const lName = req.body.lastName;
    const email = req.body.email;

    try {
        const isInserted = await insertRecordIntoSQL(fName, lName, email);

        if (isInserted) {
            const message = [
                {
                    body: {
                        "firstName": fName,
                        "lastName": lName,
                        "email": email
                    }
                }
            ];
            await sendMessageToServiceBus(message);
            res.sendFile(__dirname + '/success.html');
        } else {
            res.sendFile(__dirname + '/alreadySubscribed.html');
        }
    } catch (error) {
        console.error('Error in processing request: ', error);
        res.sendFile(__dirname + '/failure.html');
    }
});

app.post('/failure', function (req, res) {
    res.redirect('/');
});


app.listen(process.env.PORT || 3000, function () {
    console.log('Server running on port 3000.')
});