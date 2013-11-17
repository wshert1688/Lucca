var async = require("async"),
    redis = require("redis"),
    client = redis.createClient();

exports.index = function (req, res) {
    client.keys("K_T*", function (err, data) {
        async.map(data, function (t, cb) {
            client.hgetall(t, function (err, d) {
                cb(err, d);
            });
        }, function (err, results) {
            console.log(results);
            res.render('index', { title: 'Express', d: data, item: results });
        });

    })

};


