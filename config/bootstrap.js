/**
 * Seed Function
 * (sails.config.bootstrap)
 *
 * A function that runs just before your Sails app gets lifted.
 * > Need more flexibility?  You can also create a hook.
 *
 * For more information on seeding your app with fake data, check out:
 * https://sailsjs.com/config/bootstrap
 */

const SmtpController = require('../api/controllers/SmtpController');
var constant = require('./local');
var ObjectId = require('mongodb').ObjectID;

const safeCreds = require('./local');
const accountSid = safeCreds.TWILLIO_ACCOUNT_SID;
const authToken = safeCreds.TWILLIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);
module.exports.bootstrap = async function () {
  var cron = require('node-cron');
  process.env.TZ = 'UTC';

  cron.schedule('* * * * *', async () => {
    start = new Date();
    end = new Date();
    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(23, 59, 0, 0);
    var query = {};
    query.date = { '>=': start, '<=': end };
    query.dateRule = false;
    query.isDeleted = false;

    date2 = new Date();
    esterntime1 = date2.setTime(date2.getTime() - 4 * 60 * 60 * 1000);

    console.log(
      new Date(esterntime1),
      '----------current date time---------------',
      esterntime1
    );

    const reminder = await Reminders.find(query)
      .populate('addedBy')
      .sort('updatedAt desc');
    console.log('Reminders length', reminder.length);
    //**Normal Reminder */
    if (reminder && reminder.length > 0) {
      console.log('Remider exist----');
      for await (const itm of reminder) {
        reminderDate = new Date(itm.date);
        reminderDateEnd = new Date(itm.date);
        time = itm.time.split(':');
        reminderDate.setUTCHours(Number(time[0]), time[1], 0, 0);
        reminderDateEnd.setUTCHours(Number(time[0]), Number(time[1]) + 1, 0, 0);
        date = new Date();
        esterntime = date.setTime(date.getTime() - 4 * 60 * 60 * 1000);

        console.log(
          new Date(esterntime),
          '----------current date time---------------',
          esterntime
        );
        if (
          new Date(esterntime) >= reminderDate &&
          new Date(esterntime) < reminderDateEnd
        ) {
          try {
            const data = await TransactionData.findOne({
              id: itm.data_id,
              status: 'open',
            }).populate('transaction');
            itm.detail = data;

            if (
              itm.recipients &&
              itm.recipients.length > 0 &&
              data.transaction &&
              data.transaction.isDeleted == false &&
              data.transaction.status != 'cancelled' &&
              data.transaction.status != 'closed' &&
              data.transaction.status != 'complete' &&
              data.status == 'open'
            ) {
              for await (let contact of itm.recipients) {
                if (contact == 'All Buyers') {
                  contact = 'Buyer';
                }
                if (contact == "All Buyer's Agent") {
                  contact = "Buyer's Agent";
                }
                if (contact == "All Buyer's Coordinator") {
                  contact = "Buyer's Coordinator";
                }
                if (contact == 'All Sellers') {
                  contact = 'seller';
                }
                if (contact == "All Seller's Agent") {
                  contact = "Seller's Agent";
                }
                if (contact == "All Seller's Coordinator") {
                  contact = "Seller's Coordinator";
                }

                contacts = await Contacts.find({
                  transaction: data.transaction.id,
                  roles: { contains: contact },
                  isDeleted: false,
                }).populate('user_id');

                /**Sending  email to cordinators if no Buyer coordinator added to transaction */
                //  if(contact == 'Buyer\'s Coordinator' && contacts.length == 0){
                //   const user = await Users.findOne({id:data.transaction.addedBy})
                //  if(user && user.coordinator && user.coordinator.length > 0){
                //   for await (let cont of user.coordinator) {

                //     if( refrences.time &&  refrences.time != ""){

                //       let result = refrences.time.includes("m");

                //        let refrenceTime = refrences.time.split(":")
                //         if(refrenceTime.length == 2 && result == false){
                //          let AmOrPm = (refrenceTime[0] >= 12 ? 'pm' : 'am').slice(0, 2)
                //          console.log(AmOrPm,  refrenceTime[0] >= 12)
                //           var hours = (refrenceTime[0] % 12) || 12;
                //           refrences.time = hours + ":" +refrenceTime[1] + " " + AmOrPm
                //         }

                //     }
                //     reminderEmail({ email: cont.email, reminder: itm ,time: refrences.time ?  refrences.time:" ", reminderDate: refrences.date})
                //   }
                //  }
                // }
                let refrenceTime = itm.time.split(':');
                let result = itm.time.includes('m');
                if (refrenceTime.length == 2 && result == false) {
                  let AmOrPm = (refrenceTime[0] >= 12 ? 'pm' : 'am').slice(
                    0,
                    2
                  );
                  var hours = refrenceTime[0] % 12 || 12;
                  itm.time = hours + ':' + refrenceTime[1] + ' ' + AmOrPm;
                }
                console.log(contacts.length, refrenceTime);
                if (contacts && contacts.length > 0) {
                  for await (let cont of contacts) {
                    for await (let role of cont.roles) {
                      if (
                        role == contact &&
                        itm.isEmail &&
                        itm.isEmail == true
                      ) {
                        reminderEmail({
                          email: cont.user_id.email,
                          reminder: itm,
                          time: itm.time,
                          reminderDate: itm.date,
                        });
                      }
                      if (role == contact && itm.isText && itm.isText == true) {
                        console.log(
                          'Sending text reminder ------',
                          cont.user_id
                        );
                        textReminder({
                          to: cont.user_id.dileCode + cont.user_id.mobileNo,
                          firstName: cont.user_id.firstName,
                          reminder: itm,
                          time: itm.time,
                          reminderDate: itm.date,
                        });
                      }
                    }
                  }
                }

                if (contacts.length == 0) {
                  try {
                    console.log('sending text remider on unregiterd role');
                    textReminder({
                      to: contact,
                      reminder: itm,
                      time: itm.time,
                      reminderDate: itm.date,
                    });
                  } catch (err) {
                    console.log(err);
                  }
                }
              }
            }
          } catch (err) {
            console.log(err);
          }
        }
      }
    }

    /**Date rule Reminder */
    count = 0;
    var reminderQuery = {};
    reminderQuery.dateRule = true;
    reminderQuery.isDeleted = false;
    const reminders = await Reminders.find(reminderQuery)
      .populate('addedBy')
      .sort('updatedAt desc');

    try {
      if (reminders && reminders.length > 0) {
        for await (const itm of reminders) {
          if (
            itm.day != '' &&
            itm.direction != '' &&
            itm.reference_date != '' &&
            itm.time != ''
          ) {
            // //console.log(itm)
            const refrence = await Reference.findOne({
              id: itm.reference_date,
            });
            if (refrence) {
              const transactionData = await TransactionData.findOne({
                id: itm.data_id,
                status: 'open',
              }).populate('transaction');

              if (
                transactionData &&
                transactionData.transaction &&
                transactionData.transaction.isDeleted == false &&
                transactionData.transaction.status != 'cancelled' &&
                transactionData.transaction.status != 'closed' &&
                transactionData.transaction.status != 'complete' &&
                transactionData.status == 'open'
              ) {
                const referencedChecklist = await TransactionData.find({
                  title: refrence.title,
                  isDeleted: false,
                  transaction: ObjectId(transactionData.transaction.id) + '',
                });
                // console.log(transactionData.transaction.address,"--------Transaction data")
                // console.log(referencedChecklist.length, count,"refrence ---------------")

                if (referencedChecklist && referencedChecklist.length > 0) {
                  for await (let refrences of referencedChecklist) {
                    itm.detail = transactionData;
                    if (
                      refrences.date &&
                      refrences.date != '' &&
                      itm.day &&
                      itm.day != ''
                    ) {
                      reminderDate = new Date(refrences.date);
                      reminderDateEnd = new Date(refrences.date);
                      let date = new Date(refrences.date);
                      daysToAddOrSubtract = itm.day;

                      if (itm.direction == 'After') {
                        // console.log("adding Date",daysToAddOrSubtract,d/
                        reminderDate.setDate(
                          date.getDate() + Number(daysToAddOrSubtract)
                        );
                        reminderDateEnd.setDate(
                          date.getDate() + Number(daysToAddOrSubtract)
                        );
                      } else {
                        reminderDate.setDate(
                          date.getDate() - daysToAddOrSubtract
                        );
                        reminderDateEnd.setDate(
                          date.getDate() - daysToAddOrSubtract
                        );
                      }
                      time = itm.time.split(':');

                      // console.log("time",time,reminderDate,new Date())
                      // //console.log(refrences.time, Number(time[0]) - 5, time[1])
                      reminderDate.setUTCHours(Number(time[0]), time[1], 0, 0);
                      reminderDateEnd.setUTCHours(
                        Number(time[0]),
                        Number(time[1]) + 1,
                        0,
                        0
                      );

                      //console.log(reminderDate, reminderDateEnd, "dates",time)
                      date = new Date();
                      esterntime = date.setTime(
                        date.getTime() - 5 * 60 * 60 * 1000
                      );
                      // console.log(itm.day ,itm.time, "itm.days",new Date(esterntime),"estern",reminderDate)
                      itm.date = reminderDate;
                      // if(transactionData.transaction.address == 'Airport Rd, Jauligrant, Uttarakhand 248143'){

                      // console.log(new Date(esterntime),"----",reminderDate , itm.day)
                      // console.log(itm.time)
                      // }
                      if (
                        new Date(esterntime) >= reminderDate &&
                        new Date(esterntime) < reminderDateEnd
                      ) {
                        // console.log(itm.recipients ,"ready to send email")
                        if (itm.recipients && itm.recipients.length > 0) {
                          for await (let contact of itm.recipients) {
                            console.log(contact, 'role of user');
                            if (contact == 'All Buyers') {
                              contact = 'Buyer';
                            }
                            if (contact == "All Buyer's Agent") {
                              contact = "Buyer's Agent";
                            }
                            if (contact == "All Buyer's Coordinator") {
                              contact = "Buyer's Coordinator";
                            }
                            if (contact == 'All Sellers') {
                              contact = 'seller';
                            }
                            if (contact == "All Seller's Agent") {
                              contact = "Seller's Agent";
                            }
                            if (contact == "All Seller's Coordinator") {
                              contact = "Seller's Coordinator";
                            }
                            //Added becuse getting Seller role in caps and small
                            if (contact == 'seller') {
                              let contacts = await Contacts.find({
                                transaction: transactionData.transaction.id,
                                roles: { contains: 'Seller' },
                              }).populate('user_id');

                              if (contacts && contacts.length > 0) {
                                for await (let cont of contacts) {
                                  let result = refrences.time.includes('m');
                                  if (
                                    refrences.time &&
                                    refrences.time != '' &&
                                    result == false
                                  ) {
                                    console.log(
                                      refrences.time,
                                      'refrences.time1'
                                    );
                                    let refrenceTime =
                                      refrences.time.split(':');
                                    if (refrenceTime.length == 2) {
                                      let AmOrPm = (
                                        refrenceTime[0] >= 12 ? 'pm' : 'am'
                                      ).slice(0, 2);
                                      var hours = refrenceTime[0] % 12 || 12;
                                      refrences.time =
                                        hours +
                                        ':' +
                                        refrenceTime[1] +
                                        ' ' +
                                        AmOrPm;
                                    }
                                  }
                                  for await (let role of cont.roles) {
                                    if (
                                      role == contact &&
                                      itm.isEmail &&
                                      itm.isEmail == true
                                    ) {
                                      reminderEmail({
                                        email: cont.user_id.email,
                                        reminder: itm,
                                        time: refrences.time
                                          ? refrences.time
                                          : ' ',
                                        reminderDate: refrences.date,
                                      });
                                    }
                                  }

                                  if (
                                    role == contact &&
                                    itm.isText &&
                                    itm.isText == true
                                  ) {
                                    textReminder({
                                      to:
                                        cont.user_id.dileCode +
                                        cont.user_id.mobileNo,
                                      reminder: itm,
                                      time: refrences.time
                                        ? refrences.time
                                        : ' ',
                                      reminderDate: refrences.date,
                                      firstName: cont.user_id.firstName,
                                    });
                                  }
                                  // reminderEmail({ email: cont.user_id.email, reminder: itm ,time: refrences.time ?  refrences.time:" ", reminderDate: refrences.date})
                                }
                              }
                            }
                            contacts = await Contacts.find({
                              transaction: transactionData.transaction.id,
                              roles: { contains: contact },
                            }).populate('user_id');
                            /**Sending  email to cordinators if no Buyer coordinator added to transaction */
                            // if(contact == 'Buyer\'s Coordinator' && contacts.length == 0){
                            //   const user = await Users.findOne({id:transactionData.transaction.addedBy})
                            //  if(user && user.coordinator && user.coordinator.length > 0){
                            //   for await (let cont of user.coordinator) {

                            //     if( refrences.time &&  refrences.time != ""){

                            //       let result = refrences.time.includes("m");

                            //        let refrenceTime = refrences.time.split(":")
                            //         if(refrenceTime.length == 2 && result == false){
                            //          let AmOrPm = (refrenceTime[0] >= 12 ? 'pm' : 'am').slice(0, 2)
                            //          console.log(AmOrPm,  refrenceTime[0] >= 12)
                            //           var hours = (refrenceTime[0] % 12) || 12;
                            //           refrences.time = hours + ":" +refrenceTime[1] + " " + AmOrPm
                            //         }

                            //     }
                            //     reminderEmail({ email: cont.email, reminder: itm ,time: refrences.time ?  refrences.time:" ", reminderDate: refrences.date})
                            //   }
                            //  }
                            // }
                            if (contacts && contacts.length > 0) {
                              for await (let cont of contacts) {
                                if (refrences.time && refrences.time != '') {
                                  let result = refrences.time.includes('m');

                                  let refrenceTime = refrences.time.split(':');
                                  if (
                                    refrenceTime.length == 2 &&
                                    result == false
                                  ) {
                                    let AmOrPm = (
                                      refrenceTime[0] >= 12 ? 'pm' : 'am'
                                    ).slice(0, 2);
                                    console.log(AmOrPm, refrenceTime[0] >= 12);
                                    var hours = refrenceTime[0] % 12 || 12;
                                    refrences.time =
                                      hours +
                                      ':' +
                                      refrenceTime[1] +
                                      ' ' +
                                      AmOrPm;
                                  }
                                }
                                for await (let role of cont.roles) {
                                  if (
                                    role == contact &&
                                    itm.isText &&
                                    itm.isText == true
                                  ) {
                                    reminderEmail({
                                      email: cont.user_id.email,
                                      reminder: itm,
                                      time: refrences.time
                                        ? refrences.time
                                        : ' ',
                                      reminderDate: refrences.date,
                                    });
                                  }

                                  if (
                                    role == contact &&
                                    itm.isText &&
                                    itm.isText == true
                                  ) {
                                    textReminder({
                                      to:
                                        cont.user_id.dileCode +
                                        cont.user_id.mobileNo,
                                      reminder: itm,
                                      time: refrences.time
                                        ? refrences.time
                                        : ' ',
                                      reminderDate: refrences.date,
                                      firstName: cont.user_id.firstName,
                                    });
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }

                  count++;
                }
              }
            }
          }
        }
      }
    } catch (err) {
      //console.log(err)
    }
  });
  // By convention, this is a good place to set up fake data during development.
  //
  // For example:
  // ```
  // // Set up fake development data (or if we already have some, avast)
  // if (await User.count() > 0) {
  //   return;
  // }
  //

  /**Seeding the user in db  */
  Users.findOne({ email: 'amit@yopmail.com' }).then(async (user) => {
    if (!user) {
      await Users.createEach([
        {
          email: 'amit@yopmail.com',
          firstName: 'Amit',
          lastName: 'Kumar',
          status: 'active',
          password: 'amit@17231',
          isVerified: 'Y',
          date_verified: new Date(),
          role: 'admin',
        },
        {
          email: 'user@yopmail.com',
          firstName: 'Amit',
          lastName: 'Kumar',
          status: 'active',
          password: 'amit@17231',
          isVerified: 'Y',
          date_verified: new Date(),
          role: 'user',
        },

        // etc.
      ]);
    }
  });

  /**Seeding SMTP Detail into db */

  if ((await Smtp.count()) == 0) {
    var smtp = await Smtp.create({
      service: 'Gmail',
      host: 'smtp.gmail.com',
      port: 587,
      debug: true,
      sendmail: true,
      requiresAuth: true,
      domains: ['gmail.com', 'googlemail.com'],
      user: 'jcgdeeds@gmail.com',
      pass: 'jcsoftware!234',
    });
  }

  // ```
};

reminderEmail = function (options) {
  var email = options.email;

  var firstName = options.reminder.firstName;
  if (!firstName) {
    firstName = email;
  }
  message = '';
  style = {
    header: `
          padding:30px 15px;
          text-align:center;
          background-color:#f2f2f2;
          `,
    body: `
          padding:15px;
          height: 230px;
          `,
    hTitle: `font-family: 'Raleway', sans-serif;
          font-size: 37px;
          height:auto;
          line-height: normal;
          font-weight: bold;
          background:none;
          padding:0;
          color:#333;
          `,
    maindiv: `
          width:600px;
          margin:auto;
          font-family: Lato, sans-serif;
          font-size: 14px;
          color: #333;
          line-height: 24px;
          font-weight: 300;
          border: 1px solid #eaeaea;
          `,
    textPrimary: `color:#3e3a6e;
          `,
    h5: `font-family: Raleway, sans-serif;
          font-size: 22px;
          background:none;
          padding:0;
          color:#333;
          height:auto;
          font-weight: bold;
          line-height:normal;
          `,
    m0: `margin:0;`,
    mb3: 'margin-bottom:15px;',
    textCenter: `text-align:center;`,
    btn: `padding:10px 30px;
          font-weight:500;
          font-size:14px;
          line-height:normal;
          border:0;
          display:inline-block;
          text-decoration:none;
          `,
    btnPrimary: `
          background-color:#3e3a6e;
          color:#fff;
          `,
    footer: `
          padding:10px 15px;
          font-weight:500;
          color:#fff;
          text-align:center;
          background-color:#000;
          `,
  };

  message +=
    `<div class="container" style="` +
    style.maindiv +
    `">
      <div class="header" style="` +
    style.header +
    `text-align:center">
          <img style="margin-bottom:20px;width: 39%!important;height: 39%;"src="` +
    constant.FRONT_WEB_URL +
    `assets/img/logo.png"   />
          <h2 style="` +
    style.hTitle +
    style.m0 +
    `">You Have an Important Reminder for ${options.reminder.detail.transaction.address}</h2>
      </div>
      <div class="body" style="` +
    style.body +
    `">
          <h5 style="` +
    style.h5 +
    style.m0 +
    style.mb3 +
    style.textCenter +
    `">Hello ` +
    firstName +
    `</h5>
          <p style="` +
    style.m0 +
    style.mb3 +
    style.textCenter +
    `margin-bottom:20px;font-weight: 600">This is an important reminder that the ${
      options.reminder.detail.title
    } on ${new Date(options.reminderDate).toLocaleDateString('En', {
      month: 'long',
      day: 'numeric',
    })} for ${options.reminder.detail.transaction.address} is  at ${
      options.time
    }. <br>
     If you have questions or need more information please contact your transaction coordinator or agent. <br>
          
          </p>
          <p style="` +
    style.m0 +
    style.mb3 +
    style.textCenter +
    `margin-bottom:20px;font-weight: 600"> <br>
          
          </p>

       
        
      </div>
     
      <div class="footer" style="` +
    style.footer +
    `">
    © 2022 Smart Cloze   All rights reserved.
      </div>
    </div>`;

  SmtpController.sendEmail(
    email,
    `You Have an Important Reminder for ${options.reminder.detail.transaction.address}`,
    message
  );
};

textReminder = async (options) => {
  const data = {};

  const toNumber = options.to;
  const fromNumber = safeCreds.TWILLIO_NUMBER;
  var message = `Hello ${
    options.firstName ? options.firstName : options.to
  }'\n\n`;
  message += `You Have an Important Reminder for ${options.reminder.detail.transaction.address}\n\n`;
  message += `This is an important reminder that the ${
    options.reminder.detail.title
  } on ${new Date(options.reminderDate).toLocaleDateString('En', {
    month: 'long',
    day: 'numeric',
  })} for ${options.reminder.detail.transaction.address} is  at ${
    options.time
  }.\n\n`;
  message += `If you have questions or need more information please contact your transaction coordinator or agent.`;

  try {
    const sentSMS = await client.messages.create({
      body: message,
      from: fromNumber,
      to: toNumber,
    });

    console.log(sentSMS);
  } catch (err) {
    console.log(err);
  }
};
