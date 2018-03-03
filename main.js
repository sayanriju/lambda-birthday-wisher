const { isSameDay, addMinutes, setYear, getYear } = require("date-fns")
const ses = require("node-ses")
const client = ses.createClient()

const sendEmail = person => new Promise(resolve => client.sendEmail({
  from: "s26c.sayan@gmail.com",
  to: person.email,
  subject: "Happy Birthday!!",
  message: `Hey ${person.name}, \r\n Wish You Many Happy Returns of This Day!! :=)`
}, (err) => {
  if (err) {
    // console.log("[[SES ERR]] ", err)
    resolve("[[SES ERR]] " + person.email)
  } else {
    // console.log("[[SES SUCCESS]] " + person.email);
    resolve("[[SES SUCCESS]] " + person.email);
  }
}))

exports.handler = function (event, context) {
  const now = event.now || new Date()  // in UTC
  const offset = event.utc_offset_minutes
  const people = event.people
  const promises = []
  console.log("==> %s, %s", offset, JSON.stringify(people));
  people
  .map(p => ({
    name: p.name,
    email: p.email,
    birthday: addMinutes(p.birthday, offset)  // to UTC
  }))
  .filter(p => isSameDay(setYear(p.birthday, getYear(now)), now))
  .forEach(p => promises.push(sendEmail(p)))

  Promise.all(promises)
  .then(() => context.succeed("OK"))
  .catch((e) => context.fail(e.message))
}