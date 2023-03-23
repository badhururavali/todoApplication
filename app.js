const express = require("express");
const app = express();
app.use(express.json());

const { open } = require("sqlite");

const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializerDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, (request, response) => {
      console.log("Server is Start at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
  }
};

initializerDbAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query): //if this is true then below query is taken in the code
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}'
    AND priority = '${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}';`;
      break;
    default:
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%';`;
  }

  data = await db.all(getTodosQuery);
  response.send(data);
});
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getIdQuery = `
    SELECT * FROM todo WHERE id = ${todoId};`;
  const result = await db.get(getIdQuery);
  response.send(result);
});

app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status } = todoDetails;
  const updateQuery = `
    INSERT INTO todo (id,todo,priority,status) VALUES (
        ${id},
        '${todo}',
        '${priority}',
        '${status}') ;  `;
  await db.run(updateQuery);
  response.send("Todo Successfully Added");
});

const updateStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};
const updatePriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const updateTodo = (requestQuery) => {
  return requestQuery.todo !== undefined;
};

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { id, todo, priority, status } = request.body;
  let updateQuery = "";
  let updateColumn = "";
  switch (true) {
    case updateStatus(request.body):
      updateQuery = `
            UPDATE todo SET status = '${status}' WHERE id = ${todoId} ;`;
      updateColumn = "Status";
      break;
    case updatePriority(request.body):
      updateQuery = `
          UPDATE todo SET priority = '${priority}' WHERE id = ${todoId} ;`;
      updateColumn = "Priority";
      break;
    case updateTodo(request.body):
      updateQuery = `
          UPDATE todo SET todo = '${todo}' WHERE id = ${todoId} ;`;
      updateColumn = "Todo";
      break;
  }
  await db.run(updateQuery);
  response.send(`${updateColumn} Updated`);
});

app.delete("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `
    DELETE FROM todo WHERE id = ${todoId};`;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
