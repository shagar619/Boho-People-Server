const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;




// middle-ware
const corsOptions = {
    origin: ['http://localhost:5173', 'http://localhost:5174','https://boho-people.web.app'],
    credentials: true,
    optionSuccessStatus: 200,
}

app.use(cors(corsOptions));
app.use(express.json());





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hj90b.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
    }
});

async function run() {
    try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();



    const userCollection = client.db('BoHoPeopleDB').collection('users');
    const blogCollection = client.db('BoHoPeopleDB').collection('blogs');
    const commentCollection = client.db('BoHoPeopleDB').collection('comments');
    const wishlistCollection = client.db('BoHoPeopleDB').collection('wishlist');







    // JWT-related API (create a JWT token)
    app.post('/jwt', async (req, res) => {
    const user = req.body;
    const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '365d'
    });
        res.send({ token });
    });
    
    // Middlewares
    const verifyToken = (req, res, next) => {
    if (!req.headers.authorization) {
        return res.status(401).send({ message: 'unauthorized access' });
    }
    const token = req.headers.authorization.split(' ')[1];
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'unauthorized access' });
    }
        req.decoded = decoded;
        next();
    });
    };












    // users collection apis

    app.post('/users', async(req, res) => {
        const user = req.body;

        // insert email if user doesn't exists: 
        // you can do this many ways (1. email unique, 2. upsert 3. simple checking)
        const query = {email: user.email}
        const existingUser = await userCollection.findOne(query);
        if(existingUser){
            return res.send({message: 'user already exists!', insertedId: null})
        }

        const result = await userCollection.insertOne(user);
        res.send(result);
    });

    app.get('/blog/:id', verifyToken, async(req, res) => {
        const id = req.params.id;
        const filter = { _id: id }
        const result = await blogCollection.findOne(filter);
        res.send(result);
    });














    // blogs collection apis

    app.get('/blogs', async(req, res) => {
        const result = await blogCollection.find().toArray();
        res.send(result);
    });

    app.get('/blogs/:id', verifyToken, async(req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await blogCollection.findOne(query);
        res.send(result);
    });

    app.patch('/blogs/:id', verifyToken, async(req, res) => {
        const item = req.body;
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const updatedDoc = {
            $set: {
                author_name: item.author_name,
                date_time: item.date_time,
                category: item.category,
                image: item.image,
                short_description: item.short_description,
                long_description: item.long_description
            }
        }

        const result = await blogCollection.updateOne(filter, updatedDoc);
        res.send(result);
    });

    app.post('/blogs', async(req, res) => {
        const item = req.body;
        const result = await blogCollection.insertOne(item);
        res.send(result);
    });












    // wishlist collection

    app.get('/wishlist', verifyToken, async(req, res) => {
        const email = req.query.email;
        const query = { email: email };
        const result = await wishlistCollection.find(query).toArray();
        res.send(result);
    });

    app.post('/wishlist', verifyToken, async(req, res) => {
        const list = req.body;
        const result = await wishlistCollection.insertOne(list);
        res.send(result);
    });

    app.delete('/wishlist/:id', verifyToken, async(req, res) => {
        const id = req.params.id;
        const query = {_id: new ObjectId(id)};
        const result = await wishlistCollection.deleteOne(query);
        res.send(result);
    });



















    // comments collection apis

    app.get('/comments', async(req, res) => {
        const result = await commentCollection.find().toArray();
        res.send(result);
    });

    app.post('/comments', async(req, res) => {
        const comment = req.body;

        const result = await commentCollection.insertOne(comment);
        res.send(result);
    });

    app.get('/comment/:id', async(req, res) => {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) }
        const result = await commentCollection.findOne(filter);
        res.send(result);
    });

















    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
    }
}
run().catch(console.dir);









app.get('/', (req, res) => {
    res.send('BoHo People are joining');
});

app.listen(port, () => {
    console.log(`BoHo People are joining on port ${port}`)
});