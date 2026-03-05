require("dotenv").config()

const express = require("express")
const cors = require("cors")
const path = require("path")

const app = express()

app.use(cors())
app.use(express.json())

app.use(express.static(path.join(__dirname, "../frontend")))

app.get("/api", (req,res)=>{
    res.json({message:"API funcionando"})
})

const PORT = process.env.PORT || 3000

app.listen(PORT, ()=>{
    console.log("Servidor corriendo en puerto " + PORT)
})