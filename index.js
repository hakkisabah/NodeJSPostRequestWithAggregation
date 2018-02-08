/**
 * Created by hakki on 25.01.2018.
 */
var express = require("express");
var bodyParser = require("body-parser");
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');


var app = express();
app.use(bodyParser.json());
// Connection URL
const url = 'mongodb://dbUser:dbPassword@ds155428.mlab.com:55428/getir-bitaksi-hackathon';
// Database Name
const dbName = 'records';
var db;
var col;
// Use connect method to connect to the Server
MongoClient.connect(url, function(err, client) {
    assert.equal(null, err);
    console.log("Connected correctly to server");
    db = client
    //col = db.collection(dbName);
    var server = app.listen(process.env.PORT || 8081, function () {
        var port = server.address().port;
        console.log("App now running on port", port);
    });
});
app.use(function (req, res, next) {
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();

});

// Generic error handler used by all endpoints.
function handleError(res, reason, message, code) {
    console.log("ERROR: " + reason);
    res.status(code || 500).json({"error": message});
}
app.post("/searchRecord", function(req, res) {
    //Burada Olan biteni anlamamızı sağlayan bir kaç değişken ve bunları console log dan görebiliyoruz
    var splitstart = req.body.startDate.split('-');
    var splitend = req.body.endDate.split('-');
    var dateforstart = splitstart[0] +', ' +splitstart[1] +', ' +splitstart[2];
    var dateforend = splitend[0] +', ' +splitend[1] +', ' +splitend[2];
    var minCountVar = req.body.minCount;
    var maxCountVar = req.body.maxCount;
    console.log(
        'Start Date ' + splitstart[0] +', ' +splitstart[1] +', ' +splitstart[2] +
        ' End Date ' + splitend[0] +', ' +splitend[1] +', ' +splitend[2] +
        ' Min Count ' + minCountVar +
        ' Max Count ' + maxCountVar
    );
    if (!req.body.startDate || !req.body.endDate || !req.body.minCount || !req.body.maxCount ) {
        handleError(res, "Gecersiz Giris startDate => " + req.body.startDate + " ,endDate => " + req.body.startDate + " ,minCount => " + req.body.minCount + " ,maxCount => " + req.body.maxCount ,
            "Istek Parametrelerini dogru girdiginizden emin olun. startDate => " + req.body.startDate + " ,endDate => " + req.body.startDate + " ,minCount => " + req.body.minCount + " ,maxCount => " + req.body.maxCount , 400);
    }
    db.collection(dbName).aggregate(
        { $match: {  createdAt: { $gte: new Date(dateforstart), $lt: new Date(dateforend) } } },
        {$unwind:"$counts"},
        {$group: {
                _id: {createdAt: "$createdAt",key:"$key"},
                counts: {$sum: "$counts"}
            }
        },
        {$sort:{counts:+1}},
        {$match: {  counts: { $gt: minCountVar, $lt: maxCountVar } }},
        { $group:
                {
                    _id : null,
                    createdMax:  { $last: "$_id.createdAt" },
                    keyMax:  { $last: "$_id.key" },
                    countMax:   { $last: "$counts" },
                    createdMin:  { $first: "$_id.createdAt" },
                    keyMin: { $first: "$_id.key" },
                    countMin:  { $first: "$counts" }
                }
        },
        { $project:
                { _id: 0,
                    code:"0",
                    msg:"Success",
                    records:[
                        { key:"$keyMin",createdAt: "$createdMin", totalCount: "$countMin" },
                        { key:"$keyMax", createdAt: "$createdMax",  totalCount: "$countMax" }
                    ]
                }
        }
        , function(err, result) {
            if (err) {
                console.log(err);
                handleError(result, err.message, "Wrong anything on database / try again later.");
            }
            else {
                //dateres = new Date(result[0].createdAt);
                console.log(JSON.stringify(result[0], null, '\t'));
                res.status(200).json(result[0]);
            }
        }
    );

});