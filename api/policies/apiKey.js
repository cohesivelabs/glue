module.exports = function hasApiKey (req, res, next) {
    var apiKey = req.body.apiKey;

    // if we have neither, let's just stop them now
    if (!apiKey)
        return res.forbidden('Please register for an API Key.');

    User.findOne({ apiKey: apiKey }, function (err, user) {
        if (err || !(user || {}).id) return res.forbidden('Invalid/expired API Key.');
        req.user = user;
        next();
    });
};