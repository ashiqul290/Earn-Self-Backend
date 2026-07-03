const express = require('express');
const dotenv = require('dotenv');
const { globalErrHandler } = require('./utils/globalErrHandler');
const notFound = require('./utils/notFound');
const { dbConfig } = require('./config/bd.config');
const router = require('./route');
const session = require('express-session')
const {MongoStore} = require('connect-mongo');
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
dbConfig();

app.use(express.json());



 


app.use(session({
  store: MongoStore.create({ mongoUrl: process.env.DB_URL }),
  name : 'TeamManagementSystem',
  secret: process.env.SESSION_SECRET,
  rolling: true,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}))

app.use('/route', router);

app.use(notFound);
app.use(globalErrHandler);


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });


