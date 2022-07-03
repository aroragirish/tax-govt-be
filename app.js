const express = require('express');
const mysql = require('mysql');
var bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

const app = express();
const jsonParser = bodyParser.json();
const urlencodedParser = bodyParser.urlencoded({ extended: false });
const SECRET_KEY = 'testBE'

const db = mysql.createConnection({
    host: 'mytestdb.cfmqtzlsywwt.ap-south-1.rds.amazonaws.com',
    user: 'admin',
    password: 'test1234',
    database: 'testschema',
    port: 3306
});

db.connect((err) => {
    if (err) {
        console.log(err);
    } else {
        console.log("DB Connected Successfully");
    }
})

app.post('/login', jsonParser, (req, res) => {
    const body = req.body;
    db.query(`select * from AuthTable where EmailID="${body.userId}" and Password="${body.password}"`, (err, result, field) => {
        if (err) {
            console.log(err);
        }
        if (result.length) {
            const token = jwt.sign({
                email: body.userId,
                id: result[0].id
            }, SECRET_KEY)
            console.log(result[0]);
            res.status(200).json({
                user: result[0],
                token: token
            })
        } else {
            res.status(401).send('Access denied');
        }
    });
});

app.listen(5000, () => {
    console.log('server started on 5k');
})