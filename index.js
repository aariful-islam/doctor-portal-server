const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion } = require('mongodb');
const res = require('express/lib/response');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000

app.use(cors());
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gr1ny.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const servicesCollection = client.db('doctor_portal').collection('services');
        const bookingsCollection = client.db('doctor_portal').collection('bookings');
        const userCollection = client.db('doctor_portal').collection('user');

        app.get('/service', async (req, res) => {
            const query = {};
            const cursor = servicesCollection.find(query)
            const services = await cursor.toArray()
            res.send(services);

        })
        app.put('/user/:email', async (req,res)=>{
            const email= req.params.email;
            const user=req.body
            const filter={email:email};
            const options={upsert:true};
            const updatedDoc={
                $set:user,

            }

            const result = await userCollection.updateOne(filter,updatedDoc,options);
            res.send(result)

        })
        
        
        app.post('/booking', async (req, res) => {
            const booking = req.body;
            const query = { treatment: booking.treatment, date: booking.date, patient: booking.patient }
            const exists = await bookingsCollection.findOne(query)
            if (exists) {
                return res.send({ success: false, booking: exists });
            }
            const result = await bookingsCollection.insertOne(booking);
            res.send({ success: true, result })


        })
        app.get('/booking', async(req, res) =>{
            const patient = req.query.patient;
            const query = {patient: patient};
            const bookings = await bookingsCollection.find(query).toArray();
            res.send(bookings);
          })

        

        app.get('/available', async (req, res) => {
            const date = req.query.date ;
           
            

            // step 1:  get all services
            const services = await servicesCollection.find().toArray();

            // step 2: get the booking of that day. output: [{}, {}, {}, {}, {}, {}]
            const query = { date: date };
            const bookings = await bookingsCollection.find(query).toArray();

            // step 3: for each service
            services.forEach(service => {
                // step 4: find bookings for that service. output: [{}, {}, {}, {}]
                const serviceBookings = bookings.filter(book => book.treatment === service.name);
                // step 5: select slots for the service Bookings: ['', '', '', '']
                const bookedSlots = serviceBookings.map(book => book.slot);
                // step 6: select those slots that are not in bookedSlots
                const available = service.slots.filter(slot => !bookedSlots.includes(slot));
                //step 7: set available to slots to make it easier 
                service.slots = available;
            });


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