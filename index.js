const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;
//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kvip9bz.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const toysCollection = client.db("legoDB").collection("toys");
    const questionAnswers = client.db("legoDB").collection("questionAnswer");
    const legoGalleryInfo = client.db("legoDB").collection("legoGalleryInfo");
    app.post("/toys", async (req, res) => {
      const toy = req.body;
      const result = await toysCollection.insertOne(toy);
      res.send(result);
    });

    app.get("/toys", async (req, res) => {
      const cursor = toysCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/questionanswers", async (req, res) => {
      const cursor = questionAnswers.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/legosinfo", async (req, res) => {
      const cursor = legoGalleryInfo.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/toys/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await toysCollection.findOne(query);
      res.send(result);
    });

    app.get("/categorytoys/:cat", async (req, res) => {
      const cat = req.params.cat;
      const query = { category: { $eq: cat } };
      const cursor = toysCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/mytoys", async (req, res) => {
      let query = {};
      if (req.query?.email) {
        query = { sellerEmail: req.query.email };
      }

      const result = await toysCollection.find(query).toArray();
      res.send(result);
    });

    //sorting implementation
    app.get("/mysortedtoys", async (req, res) => {
      let query = {};
      let flag;
      let pipeline;
      if (req.query?.email) {
        query = { sellerEmail: req.query.email };
        flag = req.query.sort;
        if (flag == "true") {
          pipeline = [{ $match: query }, { $sort: { price: 1 } }];
        } else {
          pipeline = [{ $match: query }, { $sort: { price: -1 } }];
        }
      }

      const result = await toysCollection.aggregate(pipeline).toArray();

      res.send(result);
    });

    app.get("/search", async (req, res) => {
      let query = {};
      if (req.query?.q) {
        const searchQuery = req.query.q;
        const regexPattern = new RegExp(searchQuery, "i");
        query = { toyName: regexPattern };
      }

      const cursor = toysCollection.find(query);

      const result = await cursor.toArray();

      res.send(result);
    });

    app.patch("/toys/:id", async (req, res) => {
      const id = req.params.id;
      const updatedToy = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const finalUpdate = {
        $set: {
          price: updatedToy.price,
          desciption: updatedToy.desciption,
          qty: updatedToy.qty,
        },
      };
      const result = await toysCollection.updateOne(
        filter,
        finalUpdate,
        options
      );
      res.send(result);
    });

    app.delete("/toys/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await toysCollection.deleteOne(query);
      res.send(result);
    });
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Toy server is running");
});

app.listen(port, () => {
  console.log(`Toy server running at port ${port}`);
});
