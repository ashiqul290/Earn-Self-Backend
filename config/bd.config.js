const { default: mongoose } = require("mongoose")

exports.dbConfig = ()=>{
    mongoose.connect(process.env.DB_URL).then(()=>{
        console.log('DB connected')
    }).catch((err)=>{
        console.log(err)
    })
}