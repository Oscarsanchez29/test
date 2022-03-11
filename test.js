const fetch = require("node-fetch");

// iniciar un servidor con express
const express = require("express");
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const port = process.env.PORT || 3000;
const HASURA_OPERATION = `
mutation addFile($id: String!, $name: String!) {
  insert_files(objects: {id: $id, name: $name}) {
    affected_rows
  }
}
`;

// execute the parent operation in Hasura
const execute = async (getHeaders, variables) => {
  console.log("headers", getHeaders);
  const fetchResponse = await fetch("http://localhost:9090/v1/graphql", {
    headers: getHeaders,
    method: "POST",
    body: JSON.stringify({
      query: HASURA_OPERATION,
      variables,
    }),
  });
  const data = await fetchResponse.json();
  console.log("DEBUG: ", data);
  return data;
};

// Request Handler
app.post("/InsertFilesDerived", async (req, res) => {
  // get request input
  const { id, name } = req.body.input;

  // run some business logic
  const headers = (req.body.session_variables = {
    ...req.body.session_variables,
    "x-hasura-admin-secret": "dev",
  });
  console.log(headers);
  // execute the Hasura operation
  const { data, errors } = await execute(req.body.session_variables, {
    id,
    name,
  });

  // if Hasura operation errors, then throw error
  if (errors) {
    return res.status(400).json(errors[0]);
  }

  // success
  return res.json({
    ...data,
  });
});

app.listen(port, () => {
  console.log("Server started on port " + port);
});
