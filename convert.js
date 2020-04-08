const csvFilePath='./WOTVSheet.csv'
const csv=require('csvtojson')
csv()
.fromFile(csvFilePath)
.then((jsonObj)=>{
    console.log(jsonObj);
})

// Async / await usage
// const jsonArray = await csv().fromFile(csvFilePath);