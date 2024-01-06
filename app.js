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

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html')
});

app.post('/', async function (req, res) {
    const fName = req.body.firstName;
    const lName = req.body.lastName;
    const email = req.body.email;

    const messages = [
        { body: `${fName}, ${lName}, ${email}` }
    ];

    // create a Service Bus client using the connection string to the Service Bus namespace
    const sbClient = new ServiceBusClient(connectionString);

    // createSender() can also be used to create a sender for a topic.
    const sender = sbClient.createSender(queueName);

    try {
        // Tries to send all messages in a single batch.
        // Will fail if the messages cannot fit in a batch.
        // await sender.sendMessages(messages);

        // create a batch object
        let batch = await sender.createMessageBatch();
        for (let i = 0; i < messages.length; i++) {
            // for each message in the array

            // try to add the message to the batch
            if (!batch.tryAddMessage(messages[i])) {
                // if it fails to add the message to the current batch
                // send the current batch as it is full
                await sender.sendMessages(batch);

                // then, create a new batch
                batch = await sender.createMessageBatch();

                // now, add the message failed to be added to the previous batch to this batch
                if (!batch.tryAddMessage(messages[i])) {
                    // if it still can't be added to the batch, the message is probably too big to fit in a batch
                    throw new Error("Message too big to fit in a batch");
                }
            }
        }

        // Send the last created batch of messages to the queue
        await sender.sendMessages(batch);

        console.log(`Sent a batch of messages to the queue: ${queueName}`);

        // Close the sender
        await sender.close();
        res.sendFile(__dirname + '/success.html');
    } finally {
        await sbClient.close();
    }


    try {
        await sql.connect(config);
        const request = new sql.Request();

        // Check if the email already exists in the database
        const checkQuery = `SELECT COUNT(*) AS count FROM SignUps WHERE Email = @checkEmail`;
        request.input('checkEmail', sql.VarChar, email);

        const checkResult = await request.query(checkQuery);
        const count = checkResult.recordset[0].count;
        console.log(count);

        if (count > 0) {
            // User already subscribed
            console.log('User with email already subscribed:', email);
            res.sendFile(__dirname + '/alreadySubscribed.html');
        } else {
            console.log('Inside else');
            // User not subscribed, proceed to insert
            const insertQuery = `INSERT INTO SignUps (Email, FirstName, LastName) VALUES (@insertEmail, @fName, @lName)`;
            request.input('insertEmail', sql.VarChar, email);
            request.input('fName', sql.VarChar, fName);
            request.input('lName', sql.VarChar, lName);

            const result = await request.query(insertQuery);
            console.log('Data inserted successfully:', result);
            res.sendFile(__dirname + '/success.html');
        }
    } catch (error) {
        console.error('Error inserting or checking data: ', error);
        res.sendFile(__dirname + '/failure.html');
    } finally {
        sql.close();
    }
});

app.post('/failure', function (req, res) {
    res.redirect('/');
});


app.listen(process.env.PORT || 3000, function () {
    console.log('Server running on port 3000.')
});