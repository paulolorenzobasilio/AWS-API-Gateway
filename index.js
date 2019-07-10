let AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-2' });

let apiGateway = new AWS.APIGateway();

var argv = require('minimist')(process.argv.slice(2));

const restApiId = argv["rest-api-id"] || 'k21xbs0us3';
const parentId = argv["parent-id"] || 'yay805daa8';
const swaggerfile = argv["swagger-file"];
let parentResource = "";

let fs = require('fs');
let yaml = require('js-yaml');
let restapi = yaml.safeLoad(fs.readFileSync(swaggerfile, { encoding: 'utf8' }));
let baseUrl = `${restapi.host}${restapi.basePath}`

console.log('restapi: \n', restapi);
console.log('baseUrl: ', baseUrl);
console.log('--------------------------------------------------------');

const waitFor = (ms) => new Promise(r => setTimeout(r, ms))
const asyncForEach = async (array, callback) => {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array)
    }
}

async function awsGetResources() {
    return await apiGateway.getResources({
        restApiId: restApiId,
        limit: 500
    }).promise().then(data => data.items).catch(err => {
        console.log('Error createResourceObj: \n', err);
        console.log('--------------------------------------------------------')
    });
}

async function awsCreateResource(resource) {
    await apiGateway.createResource(resource).promise().then((data) => {
        console.log('createResource response: \n', data)
        console.log('--------------------------------------------------------')
    }).catch(err => {
        console.log('Error createResource response: \n', err);
        console.log('--------------------------------------------------------')
    });
}

async function awsPutMethod(options) {
    await apiGateway.putMethod(options).promise().then((data) => {
        console.log('putMethod: \n', data)
        console.log('--------------------------------------------------------')
    }).catch(err => {
        console.log('Error putMethod: \n', err);
        console.log('--------------------------------------------------------')
    });
}

async function awsPutIntegration(options) {
    await apiGateway.putIntegration(options).promise().then(data => {
        console.log('putIntegration:\n', data)
        console.log('--------------------------------------------------------')
    }).catch(err => {
        console.log('Error putIntegration:\n', err)
        console.log('--------------------------------------------------------')
    })
}

async function awsPutMethodResponse(options) {
    await apiGateway.putMethodResponse(options).promise().then(data => {
        console.log('putMethodResponse:\n', data);
        console.log('--------------------------------------------------------')
    }).catch(err => {
        console.log('Error: putMethodResponse:\n', err);
        console.log('--------------------------------------------------------')
    })
}

async function awsPutIntegrationResponse(options) {
    await apiGateway.putIntegrationResponse(options).promise().then(data => {
        console.log('putIntegrationResponse: \n', data)
        console.log('--------------------------------------------------------')
    }).catch(err => {
        console.log('Error: putIntegrationResponse: \n', err)
        console.log('--------------------------------------------------------')
    })
}

async function addPathToResource(_path, index, _paths) {
    await waitFor(69);

    let resourceData = {
        restApiId: restApiId,
        parentId: '',
        pathPart: _path
    }

    const pathPart = index === 0
        ? `/${_path}` : constructPath(_paths, index + 1)
    const resources = await awsGetResources()
    const isResourceDefine = resources.find(resource => resource.path === fullPath(pathPart))

    if (isResourceDefine) {
        return;
    }

    /**
     * if the path being evaluated is /users/{users_id}/security_update
     * and the pathPart being evaluated is /users and the resource does not exists.
     * This will create the resource for /users
    */
    if (isResourceDefine === undefined && index === 0) {
        resourceData.parentId = parentId
        await awsCreateResource(resourceData)
        return;
    }

    /**
     * get the parent resource for the given path part
     * e.g. /users/{users_id}/security_update
     * if the pathPart being tested is /{users_id}
     * the parentResourcePath will be /users
     * if the pathPart being tested is /security_update
     * the parentResource path will be /users/{users_id} 
     */
    const parentResourcePath = constructPath(_paths, index)
    const parentResource = resources.find(resource => resource.path === fullPath(parentResourcePath))
    resourceData.parentId = parentResource.id
    await awsCreateResource(resourceData)
}

async function createResource(path) {
    let paths = path.split('/');
    paths.shift(); //remove the forward '/'
    await asyncForEach(paths, addPathToResource)
    return (await awsGetResources()).find(resource => resource.path === fullPath(path))
}

function isValidParameter(parameter) {
    return ['query', 'path'].includes(parameter.in);
}

/**
 * Parameters for method and integration request
 * @param {*} parameters 
 */
function constructRequestParameters(parameters = []) {
    let requestParameters = {
        "methodRequestParameters": {},
        "integrationRequestParameters": {}
    };

    parameters.filter(isValidParameter).forEach(parameter => {
        const dataMapping = parameter.in === 'query'
            ? `querystring.${parameter.name}`
            : `${parameter.in}.${parameter.name}`;

        const methodRequest = `method.request.${dataMapping}`
        const integrationRequest = `integration.request.${dataMapping}`

        requestParameters.methodRequestParameters[methodRequest] = parameter.required
        requestParameters.integrationRequestParameters[integrationRequest] = methodRequest
    })

    return requestParameters;
}

function cleanURI(path) {
    return path.replace(/\/+/g, '/');
}

function fullPath(path) {
    return cleanURI(`${parentResource.path}${path}`);
}
/**
 * This creates an array of new path then joined by ('/') to form into string
 * @param {*} paths 
 * @param {*} end - the end string
 */
function constructPath(paths, end) {
    return `/${paths.slice(0, end).join('/')}`
}

(async function () {
    parentResource = (await awsGetResources()).find(resource => resource.id === parentId);
    for (let [path, httpResource] of Object.entries(restapi.paths)) {
        const resourceId = (await createResource(path)).id;

        for (let [httpMethod, methodResource] of Object.entries(httpResource)) {
            let requestParameters = constructRequestParameters(methodResource.parameters);
            httpMethod = httpMethod.toUpperCase();

            /**
             * Put the method and integration requests
             */
            await awsPutMethod({
                restApiId: restApiId,
                resourceId: resourceId,
                httpMethod: httpMethod,
                authorizationType: 'NONE',
                requestParameters: requestParameters.methodRequestParameters
            })

            const uri = cleanURI(`${baseUrl}${path}`)
            await awsPutIntegration({
                restApiId: restApiId,
                resourceId: resourceId,
                httpMethod: httpMethod,
                type: 'HTTP',
                integrationHttpMethod: httpMethod,
                uri: `http://${uri}`,
                requestParameters: requestParameters.integrationRequestParameters
            })

            /**
             * put the http method response
             */
            const responses = Object.keys(methodResource.responses).filter(response => response !== 'default');
            await asyncForEach(responses, async function (response) {
                const properties = {
                    restApiId: restApiId,
                    resourceId: resourceId,
                    httpMethod: httpMethod, //case sensitive needs to be uppercase
                    statusCode: response
                };

                await awsPutMethodResponse(properties)

                properties['selectionPattern'] = response
                await awsPutIntegrationResponse(properties)
            })
        }
    }
})();










