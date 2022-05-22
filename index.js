const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion } = require('mongodb');
const res = require('express/lib/response');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 4000

app.use(cors());
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gr1ny.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const servicesCollection = client.db('doctor_portal').collection('services');
        const bookingsCollection = client.db('doctor_portal').collection('bookings');

        app.get('/service', async (req, res) => {
            const query = {};
            const cursor = servicesCollection.find(query)
            const services = await cursor.toArray()
            res.send(services);

        })
        app.post('/booking', async (req, res) => {
            const booking = req.body;
            const query={treatment:booking.treatment,date:booking.date,patient:booking.patient}
            const exists=await bookingsCollection.findOne(query)
            if(exists){
                return res.send({success:false,booking:exists});
            }
            const result = await bookingsCollection.insertOne(booking);
            res.send({success : true ,result})


        })
        app.get('/available',async(req,res)=>{
            const date=req.query.date;
            services=await servicesCollection.find().toArray();
            const query={date:date};
            const booking=await bookingsCollection.find(query).toArray();
            services.forEach(service=>{
                const serviceBookings=booking.filter(b=> b.treatment===service.name);
                const booked =serviceBookings.map(s=>s.slot);
                const available=service.slots.filter(s=>!booked.includes(s))
                service.slots=available;
            })
            res.send(services);
        })
        

    }
    finally {

    }


}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('hello doctor')
})

app.listen(port, () => {
    console.log('port is', port)
})