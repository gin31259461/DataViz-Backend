import swaggerAutogen from 'swagger-autogen';

const doc = {
  host: 'localhost:3080',
  basePath: '/',
  tags: [
    {
      name: 'API',
      description: '依照參數需求',
    },
    {
      name: 'Class',
      description: '依照參數需求',
    },
  ],
};

const outputFile = './src/swagger/swagger_output.json'; // output swagger file
const endpointsFiles = ['./src/routes/*.ts', './src/controllers/*.ts']; // point to routes

swaggerAutogen(outputFile, endpointsFiles, doc); // ways of swagger autoGen
