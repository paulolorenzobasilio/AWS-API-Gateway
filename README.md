# AWS API Gateway

## Table of Contents
+ [About](#about)
+ [Getting Started](#getting_started)
+ [Usage](#usage)
+ [Resources](#resources)

## About <a name = "about"></a>
A simple AWS API Gateway Node.js application that creates rest resources from OpenAPI specification that doesn't overrides REST application.

## Getting Started <a name = "getting_started"></a>
### Prerequisites

You need to set up your AWS security credentials before the code is able
to connect to AWS. You can do this by creating a file named "credentials" at ~/.aws/
(C:\Users\USER_NAME.aws\ for Windows users) and saving the following lines in the file:

```
[default]
aws_access_key_id = <your access key id>
aws_secret_access_key = <your secret key>
```
See the [Security Credentials](http://aws.amazon.com/security-credentials) page.
It's also possible to configure your credentials via a configuration file or
directly in source. See the AWS SDK for Node.js [Developer Guide](http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html)
for more information.

### Installing

Install all dependencies

```
npm install
```
## Usage <a name = "usage"></a>
This application connects to [AWS API Gateway](https://aws.amazon.com/api-gateway/), creates rest resource. The script will automatically create the resource to API Gateway. <br>

**Arguments:**
* --rest-api-id <br>
The REST resource identifier. The REST resources will be looking for API Gateway
* --parent-id <br>
The parent root resource identifier. This is where the REST resources will be created under.
* --swagger-file <br>
The OpenAPI specs file. It is required to be yaml file.

To run:
```
node index.js --rest-api-id=k21xbs0us3 --parent-id=2wn64i --swagger-file="rest.yml"
node index.js --rest-api-id=k21xbs0us3 --parent-id=2wn64i --swagger-file="/home/users/Documents/rest.yml"
```

REST API Resources Architecture
```
/** this is your root resource '/' **/
/
| /pets 
| /resource1
| /resource2
```

Get the rest-api-id and parent-id. Click one of your resources
```
/ /** parent-id: wsx234 **/
| /pets /** parent-id: y5xcy8 **/
| /resource1 /** parent-id: cv5vf2 **/

https://us-east-2.console.aws.amazon.com/apigateway/home?region={region}#/apis/{rest-api-id}/resources/{parent-id}
```

## Resources <a name = "resources"></a>
* [Amazon API Gateway](https://docs.aws.amazon.com/apigateway/latest/developerguide/welcome.html)
* [Setup REST API](https://docs.aws.amazon.com/apigateway/latest/developerguide/create-api-using-awssdk.html)
* [AWS Javascript SDK](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/APIGateway.html)
* [AWS API Gateway References](https://docs.aws.amazon.com/apigateway/api-reference/)
* [REST API Method Execution](https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-method-settings-execution-console.html)