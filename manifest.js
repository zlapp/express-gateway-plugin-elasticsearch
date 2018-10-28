var elasticsearch = require('elasticsearch');

var elasticClient = new elasticsearch.Client({
    host: 'localhost:9200',
    log: 'trace'
  });
  

module.exports = {
  version: '1.0.0',
  policies: ['elasticsearch'],
  init: function (pluginContext) {

    pluginContext.registerPolicy({
      schema: {
        $id: 'http://express-gateway.io/policies/metrics.json',
        type: 'object',
        properties: {
          consumerIdHeaderName: {
            type: 'string',
            default: 'eg-consumer-id'
          }
        }, required: ['consumerIdHeaderName']
      },
      name: 'elasticsearch',
      policy: ({ consumerIdHeaderName }) => (req, res, next) => {
        res.once('finish', () => {
          const apiEndpoint = req.egContext.apiEndpoint.apiEndpointName;
          const consumerHeader = req.header(consumerIdHeaderName) || 'anonymous';
          const requestID = req.egContext.requestID
          const statusCode = res.statusCode.toString();
          const responseType = res.statusCode >= 200 && res.statusCode < 300 ? 'SUCCESS' : 'FAILED';
          
          elasticClient.index({
                    index: apiEndpoint,
                    id: requestID,
                    type: "document",
                    body: {
                        title: apiEndpoint,
                        content: {
                            consumer:consumerHeader,
                            code:statusCode,
                            respType:responseType,
                            req:req,
                            res:res
                        }
                    }
                });
        });
        next();
      }
    });
  }
};
