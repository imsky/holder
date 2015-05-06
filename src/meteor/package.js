Package.describe({
    summary: '%summary%',
    version: '%version%',
    name: 'imsky:holder',
    git: 'https://github.com/imsky/holder',
});

Package.onUse(function(api) {
    api.versionsFrom('0.9.0');
    api.export('Holder', 'client');
    api.addFiles('holder.js', 'client');
});
