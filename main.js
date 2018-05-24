const {
  isSameDay, addMinutes, setYear, getYear
} = require("date-fns")
const ses = require("node-ses")
const client = ses.createClient()
const fetch = require("node-fetch")
const querystring = require("querystring")

const sendEmail = person => new Promise(resolve => client.sendEmail({
  from: "s26c.sayan@gmail.com",
  to: person.email,
  subject: "Happy Birthday!!",
  message: `<p>
  Hey ${person.name},
  </p>
  <p>Wish You Many Happy Returns of This Day!! :=)</p>
  <br/>
  <br/>
  <p>-------------------------------------------------------</p>
  <i style="font-size: small;">Sent using https://github.com/sayanriju/lambda-birthday-wisher</i>
  `
}, (err) => {
  if (err) {
    // console.log("[[SES ERR]] ", err)
    resolve(`[[SES ERR]] ${person.email}`)
  } else {
    // console.log("[[SES SUCCESS]] " + person.email);
    resolve(`[[SES SUCCESS]] ${person.email}`)
  }
}))

const sendSMS = person => new Promise((resolve) => {
  if (!process.env.TEXTLOCAL_API_KEY || !process.env.TEXTLOCAL_SENDER || !process.env.TEXTLOCAL_SERVICE_EP) {
    console.log("==> SMS DISABLED");
    return resolve("SMS DISABLED") // exit silently & gracefully
  }
  const { number, name } = person
  if (number === undefined) {
    console.log(" ==> NO NUMBER for ", person.name);
    return resolve("NO NUMBER") // exit silently & gracefully
  }
  const query = querystring.stringify({
    apiKey: process.env.TEXTLOCAL_API_KEY,
    numbers: number,
    message: `Hello ${name}, Wish You Many Happy Returns of This Day!!`,
    sender: process.env.TEXTLOCAL_SENDER
  })
  return fetch(`${process.env.TEXTLOCAL_SERVICE_EP}?${query}`)
    .then((response) => {
      console.log("TEXTLOCAL Success: ", response)
      resolve("OK")
    })
    .catch((err) => {
      console.log("TEXTLOCAL Error: ", err.message)
      resolve("FAILED TO SEND SMS") // exit silently & gracefully
    })
})

exports.handler = function (event, context) {
  const now = event.now || new Date() // in UTC
  const offset = event.utc_offset_minutes
  const { people } = event
  const promises = []
  console.log("==> %s, %s", offset, JSON.stringify(people))
  people
    .map(p => ({
      name: p.name,
      email: p.email,
      number: p.number,
      birthday: addMinutes(p.birthday, offset) // to UTC
    }))
    .filter(p => isSameDay(setYear(p.birthday, getYear(now)), now))
    .forEach(p => promises.push(sendEmail(p), sendSMS(p)))

  Promise.all(promises)
    .then(() => context.succeed("OK"))
    .catch(e => context.fail(e.message))
}
