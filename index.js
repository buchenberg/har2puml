'use strict';
const Argv = require('minimist')(process.argv.slice(2));
const Fs = require('fs');
const Plantuml = require('node-plantuml');

const pumlfy = function (har, callback) {
    var log = har.log;
    var pumlText = '@startuml\n';
    for (let entry in log.entries) {
        if (log.entries.hasOwnProperty(entry)) {
            var requestUrlObj = require('url').parse(log.entries[entry].request.url);
            var serviceName = log.entries[entry]['x-service-name'] || requestUrlObj.pathname;
            var resourceName = log.entries[entry]['x-resource-name'] || requestUrlObj.pathname.split("/").pop();
            var method = log.entries[entry].request.method.toLowerCase();
            var resStatus = log.entries[entry].response.status;

            var resStatusText;
            switch (log.entries[entry].response.status) {
                case 200:
                    resStatusText = '';
                    break;
                default:
                    resStatusText = ' ' + log.entries[entry].response.statusText;
                    break;
            }

            // Query params
            var queryParams = '';
            for (var qParam in log.entries[entry].request.queryString) {
                queryParams += log.entries[entry].request.queryString[qParam].name + ', '
            }
            // Path params
            var pathParams = '';
            for (var pParam in log.entries[entry].request['x-path-params']) {
                pathParams += log.entries[entry].request['x-path-params'][pParam].name + ', '
            }

            var allParams = queryParams + pathParams;

            pumlText +=
                '"User Agent" -> ' + //request
                '"' + serviceName + '"' +
                ': ' + method + resourceName.charAt(0).toUpperCase() + resourceName.slice(1) +
                '(' +
                allParams.replace(/,\s*$/, '') +
                ') \n' +
                'note right: ' +
                requestUrlObj.pathname +
                '\n' + //response
                '"' + serviceName + '"' + //service
                ' -> "User Agent": ' + //client
                resStatus + //method (status?)
                '( ' +
                resourceName + resStatusText + //params (payload)
                ' ) \n';
        }
    }
    pumlText += '@enduml'
    callback(pumlText);
}

const makePng = function (puml) {
    var gen = Plantuml.generate(puml)
    gen.out.pipe(Fs.createWriteStream("out.png"));
}

if (Argv.h) {

    let json = JSON.parse(Fs.readFileSync(Argv.h, 'utf8'));
    
    
    pumlfy(json, function (puml) {
        Fs.writeFile("out.puml", puml, function (err) {
            if (err) {
                return console.error(err);
            }
            return makePng(puml);
        });
    
    })

}








