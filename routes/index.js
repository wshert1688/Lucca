var async = require("async"),
    redis = require("redis"),
    client = redis.createClient(6379,'218.24.198.133');

exports.index = function (req, res) {
    client.keys("VOD_PER*", function (err, data) {
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


