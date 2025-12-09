require('dotenv').config();
const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');



const app = express()
const port = process.env.PORT || 5000
const cors = require("cors")
app.use(cors())
app.use(express.json())
const uri = process.env.URI;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


app.get('/', (req, res) => {
    res.send('Hello World!')
})



async function run() {
    try {
        // await client.connect();
        // Send a ping to confirm a successful connection
        const db = client.db('loansDB')
        const loansCollection = db.collection('loans')
        const usersCollection = db.collection('users')


        app.get('/Allloans', async (req, res) => {

            const result = await loansCollection.find().toArray()
            res.send(result)
        })
        //  home loans
        app.get('/Homeloans', async (req, res) => {

            const result = await loansCollection.find().limit(6).toArray()
            res.send(result)
        })
        // detail api
        app.get('/loans/:id', async (req, res) => {
            const id = req.params.id
            const result = await loansCollection.findOne({ _id: new ObjectId(id) })
            res.send(result)
        })
        //    saving user and updating

        app.post('/users', async (req, res) => {
            const userData = req.body

            userData.created_at = new Date().toISOString()
            userData.last_loggedIn = new Date().toISOString()
            userData.role = userData.role || 'borrower'
            const query = { email: userData.email }

            const alreadyExist = await usersCollection.findOne(query)

            console.log('user already exist', !!alreadyExist);
            if (alreadyExist) {
                console.log('updating user');
                const result = await usersCollection.updateOne(query, {
                    $set: {
                        last_loggedIn: new Date().toISOString()
                    }
                })

                return res.send(result)
            }

            console.log('saving  user');
            const result = await usersCollection.insertOne(userData)
            res.send(result)
        })

        // user role
        app.get('/users/role/:email', async (req, res) => {
            const email = req.params.email
            const result = await usersCollection.findOne({ email })
            res.send({ role: result?.role })
        })

        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
