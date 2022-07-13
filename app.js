import express from "express";
import mysql from "mysql";
import cors from "cors";
import bodyParser from "body-parser";
import jwt from "jsonwebtoken";
import url from "url";
import axios from "axios";

const app = express();
const jsonParser = bodyParser.json();
const urlencodedParser = bodyParser.urlencoded({ extended: false });
const SECRET_KEY = "testBE";

const jwtTokenValidate = (req, res, next) => {
    // check header or url parameters or post parameters for token
    var token = req?.body?.token || req?.query?.token || req?.headers["authorization"];
    // decode token
	console.log(req.headers)
    if (token) {

      // verifies secret and checks exp
      jwt.verify(token, SECRET_KEY, function(err, decoded) {
        if (err) {
            console.log(err);
          return res.json({ success: false, message: "Failed to authenticate token." });
        } else {
          // if everything is good, save to request for use in other routes
          req.decoded = decoded;
          next();
        }
      });

    } else {

      // if there is no token
      // return an error
      return res.status(403).send({
        success: false,
        message: "No token provided."
      });

    }
  }

var resolveCrossDomain = function(req, res,next) {

	    res.header('Access-Control-Allow-Origin', '*');
	    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
	    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
	    res.header("Access-Control-Allow-Credentials", true);

	    if ('OPTIONS' == req.method) {
		            res.send(200);
		        }
	    else {
		            next();
		        }
}; 
    app.use(resolveCrossDomain);

app.use((req, res, next) => {
    const path = url.parse(req.url).pathname;
    console.log(path);

    //No JWT token check
    if (/^\/login/.test(path)) {
      return next();
    }

    return jwtTokenValidate(req, res, next);
  });

  var corsOptions = {
	  origin: ['*'],
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
  }

  app.use(cors(corsOptions))

const db = mysql.createConnection({
    host: "mytestdb.cfmqtzlsywwt.ap-south-1.rds.amazonaws.com",
    user: "admin",
    password: "test1234",
    database: "testschema",
    port: 3306
});

db.connect((err) => {
    if (err) {
        console.log(err);
    } else {
        console.log("DB Connected Successfully");
    }
});

app.use(jsonParser);
app.post("/login", (req, res) => {
        console.log(req);
    const body = req.body;
    db.query(`select * from AuthTable where EmailID="${body?.userId}" and Password="${body?.password}"`, (err, result, field) => {
        if (err) {
            console.log(err);
            res.status(500).send("Something went wrong");
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
            res.status(401).send("Access denied");
        }
    });
});

app.post("/getData", (req, res) => {
    const { placeId } = req.body;
    console.log(placeId)
    axios.get(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=AIzaSyD6KzAklNI0lRpFqWsn_L7LGxLBV5pNg1U`).then((result) => {
        console.log(result.data);
        res.status(200).send(result.data)
    }).catch((err) => {
        console.log(err);
        res.status(500).send("Something went wrong");
    })
    
});

app.post("/geoReverseCoding", (req, res) => {
    const { LatLng } = req.body;
    console.log(LatLng)
    axios.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${LatLng}&key=AIzaSyCfJFJA4bzonkKfa4geg2CAv2jwbjfxr5o`).then((result) => {
        console.log(result.data);
        res.status(200).send(result.data)
    }).catch((err) => {
        console.log(err);
        res.status(500).send("Something went wrong");
    })
    
});

app.post("/getLocation", (req, res) => {
    const { term } = req.body;
    // console.log(term)
    axios.get(`https://maps.google.com/maps/api/geocode/json?address=${term}&sensor=false&key=AIzaSyCfJFJA4bzonkKfa4geg2CAv2jwbjfxr5o`).then((result) => {
        console.log(result.data);
        res.status(200).send(result.data)
    }).catch((err) => {
        console.log(err);
        res.status(500).send("Something went wrong");
    })
    
});

app.get("/getUsers",cors(), (req, res) => {
    db.query(`select * from UserTable`, (err, result, field) => {
        if (err) {
            console.log(err);
            res.status(500).send("Something went wrong");
        }
        if (result.length) {
            console.log(result);
            res.status(200).json({
                data: result
            })
        } else {
            res.status(404).send("Data not found");
        }
    })
})

app.post("/postData", (req, res) => {
    const body = req.body;
    console.log('post received');
    db.query(`insert into UserTable( address , NoOfIndividuals ,  Above18  ,  Below18 ,  YealyTax ,PlaceId,pendingTax, firstName, middleName, lastName) values ("${body.address}",${body.NoOfIndividuals},${body.Above18}, ${body.Below18}, ${body.YealyTax},"${body.PlaceId}",${body.pendingTax}, "${body.firstName}", "${body.middleName}", "${body.lastName}")`, (err, result, field) => {
        if (err) {
            console.log(err);
            res.status(500).send("Something went wrong");
        }
        if (result) {
            console.log(result);
            res.status(200).json({
                data: result
            })
        }
    })
});

app.get("/", (req, res) => {
    res.send("success")
});

app.listen(5000, () => {
    console.log("server started on 5k");
})
