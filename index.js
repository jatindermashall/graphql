const express = require('express');
const graphqlHTTP = require('express-graphql');
const { buildSchema } = require('graphql');
const mysql = require('mysql');
const cors = require('cors')

const app = express();
app.use(cors())

const schema = buildSchema(`
  type User {
    id: String
    name: String
    job_title: String
    email: String
   
  }
  type Posts {
    id: Int
    title: String
    userId:Int
    author:[User]
  }
  type Query {
    getUsers: [User],
    getUserInfo(id: Int) : User,
    getPosts: [Posts],
    getPostsandUser: [Posts],
  }
  type Mutation {
    updateUserInfo(id: Int, name: String, email: String, job_title: String) : Boolean
    createUser(name: String, email: String, job_title: String) : Boolean
    deleteUser(id: Int) : Boolean
  }
`);

const queryDB = (req, sql, args) => new Promise((resolve, reject) => {
    req.mysqlDb.query(sql, args, (err, rows) => {
        if (err)
            return reject(err);
        rows.changedRows || rows.affectedRows || rows.insertId ? resolve(true) : resolve(rows);
    });
});

const root = {
  getUsers: (args, req) => queryDB(req, "select * from users").then(data => data),
  getUserInfo: (args, req) => queryDB(req, "select * from users where id = ?", [args.id]).then(data => data[0]),
  getPostsandUser: (args, req) => queryDB(req, "select * from posts,users where posts.userId=users.id").then(data => data),
  getPosts: (args, req) => queryDB(req, "select * from posts").then(data => data),
  updateUserInfo: (args, req) => queryDB(req, "update users SET ? where id = ?", [args, args.id]).then(data => data),
  createUser: (args, req) => queryDB(req, "insert into users SET ?", args).then(data => data),
  deleteUser: (args, req) => queryDB(req, "delete from users where id = ?", [args.id]).then(data => data)
};

app.use((req, res, next) => {
  req.mysqlDb = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'graphqlnew'
  });
  req.mysqlDb.connect();
  next();
});

app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true,
}));

app.listen(4000);

console.log('Running a GraphQL API server at localhost:4000/graphql');
