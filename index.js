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
        const ManagerloansCollection = db.collection('Manager-Loans')
        const usersCollection = db.collection('users')
        const appliedLoanCollection = db.collection('Application-collection')
        const approvedLoansCollection = db.collection('Approved-collection')

        app.get('/Allloans', async (req, res) => {

            const result = await loansCollection.find().toArray()
            res.send(result)
        })

        // add loan-manager
        app.post('/add-loans', async (req, res) => {
            const loanData = req.body
            loanData.created_at = new Date().toISOString()
            const result = await ManagerloansCollection.insertOne(loanData)
            res.send(result)
        })
        // manage manager loans
        app.get('/manager-loan/:email', async (req, res) => {
            const email = req.params.email
            const result = await ManagerloansCollection.find({ created_by: email }).toArray()
            res.send(result)
        })

        // deleting managers loan
        app.delete('/manager-loans/:id', async (req, res) => {
            const id = req.params.id

            const result = await ManagerloansCollection.deleteOne({
                _id: new ObjectId(id)
            })

            res.send(result)
        })

        // updating loans
        app.put('/manager-loan/:id', async (req, res) => {
            const id = req.params.id;
            const updatedData = req.body;

            const filter = { _id: new ObjectId(id) };

            const updateDoc = {
                $set: {
                    ...updatedData
                }
            };

            const result = await ManagerloansCollection.updateOne(filter, updateDoc);
            res.send(result);
        });
        //    searching managers data
        app.get('/manager-data', async (req, res) => {

            const searchText = req.query.search
            const result = await ManagerloansCollection.find({ loanTitle: { $regex: searchText, $options: "i" } }).toArray()
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
        //   getting user
        app.get('/users', async (req, res) => {

            const result = await usersCollection.find().toArray()
            res.send(result)
        })





        // user role
        app.get('/users/role/:email', async (req, res) => {
            const email = req.params.email
            const result = await usersCollection.findOne({ email })
            res.send({ role: result?.role })
        })

        app.post('/loan-application', async (req, res) => {
            const loanData = req.body
            loanData.status = 'pending';
            const result = await appliedLoanCollection.insertOne(loanData)
            res.send(result)
        })
        app.get('/loan-application/:email', async (req, res) => {
            const email = req.params.email
            const result = await appliedLoanCollection.find({ email }).toArray()
            res.send(result)
        })
        //    deleting a pending application
        app.delete('/loan-application/:id', async (req, res) => {
            const id = req.params.id

            const result = await appliedLoanCollection.deleteOne({
                _id: new ObjectId(id)
            })

            res.send(result)
        })


        // getting applications for admin
        app.get('/loan-application', async (req, res) => {
            const result = await appliedLoanCollection.find().toArray()
            res.send(result)
        })

        //   gettingg pending loans

        app.get('/Pending-application', async (req, res) => {
            try {
                const result = await appliedLoanCollection
                    .find({ status: 'pending' })
                    .toArray()

                res.send(result)
            } catch (error) {
                res.send({ message: 'Server error' })
            }
        })

        //  approving loan
        
        app.post('/loan-application/approve/:id', async (req, res) => {
            const id = req.params.id;

            try {
                const loan = await appliedLoanCollection.findOne({ _id: new ObjectId(id) });

                if (!loan) {
                    return res.status(404).send({ message: 'Loan not found' });
                }

                await approvedLoansCollection.insertOne({
                    ...loan,
                    status: 'approved',
                    approvedAt: new Date()
                });

                await appliedLoanCollection.deleteOne({ _id: new ObjectId(id) });

                res.send({ success: true, message: 'Loan approved successfully' });
            } catch (error) {
                res.status(500).send({ message: 'Approval failed' });
            }
        });



        // updating role
        app.patch('/update-role', async (req, res) => {
            const { email, role } = req.body
            const result = await usersCollection.updateOne({ email }, { $set: { role: role } })
            res.send(result)

        })


        app.delete('/all-loans/:id', async (req, res) => {
            const id = req.params.id

            const result = await loansCollection.deleteOne({
                _id: new ObjectId(id)
            })

            res.send(result)
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
