const express = require('express');
const cors = require('cors')
const { Pool } = require('pg');
require('dotenv').config()

const PORT = process.env.PORT || 3333; //Heroku irá decidir a porta

//Irá permitir fazer as querys
const pool = new Pool({
    connectionString: process.env.POSTGRES_URL
});

const app = express();

app.use(express.json())
app.use(cors())


app.get('/', (req, res) => {console.log('hello word')});

app.get('/users', async (req, res) =>{
    try{
        const {rows} = await pool.query('SELECT * FROM users')
        return res.status(200).send(rows)
    } catch(err){
        return res.status(400).send(err);
    }
})

//Para inserir usuário
app.post('/session', async (req, res) => {
    const {username} = req.body;

    
    let user = ''; //Para verificar se o usuário já existe
    try{    
        user = await pool.query('SELECT * FROM users WHERE user_name = ($1)', [username])
        
        if(!user.rows[0]){
            const newSession = await pool.query(
            'INSERT INTO users(user_name) VALUES ($1) RETURNING *'
            , [username])
        }
        
        return res.status(200).send(user.rows);
    } catch(err){
        return res.status(400).send(err);
    }
})

//Para inserir todo
app.post('/todo/:user_id', async (req, res) => {
    const {description, done} = req.body //Virá no corpo da requisição
    const {user_id} = req.params //Virá no corpo da url

    try{
        const newTodo = await pool.query(
            'INSERT INTO todos (todo_description, todo_done, user_id) VALUES ($1, $2, $3) RETURNING *', 
            [description, done, user_id]);

        return res.status(200).send(newTodo.rows);
    } catch(err){
        return res.status(400).send(err)
    }
})

//Listar todos os todos de um usuário
app.get('/todo/:user_id', async(req, res) => {
    //Virá no corpo da url
    const {user_id} = req.params
    try{
        const allTodos = await pool.query(
            'SELECT * FROM todos WHERE user_id = ($1)', 
            [user_id]);

        return res.status(200).send(allTodos.rows);
    } catch(err){
    return res.status(400).send(err)
    }
})

//Atualizar um todo
app.patch('/todo/:user_id/:todo_id', async (req, res) => {
    //Virá no corpo da url
    const {user_id, todo_id } = req.params
    const data = req.body;
    try{
        //Verifica se o usuário existe
        const userExists = await pool.query('SELECT * FROM todos WHERE user_id')
        
        if(!userExists.rows[0]){
            return res.status(400).send('Operation not allowed'); 
        }

        const updatedTodo = await pool.query(
            'UPDATE todos SET todo_description = ($1), todo_done = ($2) WHERE todo_id = ($3), RETURNING *',
            [data.description, data.done, todo_id]);
            return res.status(400).send(updatedTodo.rows);

    }catch(err){
        return res.status(400).send(err);
    }

})

app.delete('/todo/:user_id/:todo_id', async (req, res) =>{

    //Vem no corpo da url
    const {user_id, todo_id} = req.params;
    try{
        const userExists = await pool.query('SELECT * FROM todos WHERE user_id = ($1) AND todo_id = ($2)', [user_id, todo_id]);
        
        if(!userExists.rows[0]){
            return res.status(400).send('Operation not allowed'); 
        }

        const deletedTodo = await pool.query(
            'DELETE FROM todos WHERE todo_id = ($1) RETURNING *', 
            [todo_id]);
        return res.status(200).send({
            message: 'Todo succesfully deleted',
            deletedTodo: deletedTodo.rows
        })
    }
    catch(err){
        return res.status(400).send(err);
    }
})

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));