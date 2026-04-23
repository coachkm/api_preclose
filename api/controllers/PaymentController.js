/**
 * PaymentController
 *
 * @description :: Server-side logic for managing Blog
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 *  Author :: jcsoftwaresolution
 */

var constantObj = sails.config.constants;
var constant = require('../../config/local.js');

var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');

var STRIPE_WEBHOOK_SECRET = constant.PAYMENT_INFO.STRIPE_WEBHOOK_SECRET; //""

var stripe = require('stripe')(constant.PAYMENT_INFO.SECREATKEY);
function constructStripeEvent(request) {
  try {
    const sig = request.headers['stripe-signature'];
    //console.log(sig);
    return stripe.webhooks.constructEvent(
      request.body,
      sig,
      STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    //console.log('errrrrrrrrrrrrrrrr', err);
  }
}

function addDays(date, days) {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
module.exports = {
  /**
   *
   * @param {*} req
   * @param {*} res
   * @returns
   * @description used to save the card on stripe
   * @createdAt 19/04/2022
   * @createdBy jcsoftwaresolution
   */
  addCard: function (req, res) {
    stripe.tokens.create(
      {
        card: {
          number: req.body.card_number,
          exp_month: req.body.exp_month,
          exp_year: req.body.exp_year,
          cvc: req.body.cvc,
          name: req.body.ownerName,
        },
      },
      (err, token) => {
        if (err) {
          return res.status(404).json({
            success: false,
            error: { code: 404, message: err.message },
          });
        } else {
          /**If user is alreadyregistered on stripe  */
          if (
            req.identity.paymentMethod != undefined &&
            req.identity.customer_id != ''
          ) {
            if (req.identity.paymentMethod.length > 0) {
              var cardNumber = String(req.body.card_number);
              last4 = cardNumber.slice(cardNumber.length - 4);
              paymentMethod = req.identity.paymentMethod;

              const cards = paymentMethod.filter((card) => {
                return card.last4 === last4;
              });
              /**User cant add same card multiple time */
              if (cards && cards.length > 0) {
                return res.status(400).json({
                  success: false,
                  error: {
                    code: 400,
                    message: constantObj.messages.CARD_EXIST,
                  },
                });
              }

              stripe.customers.createSource(
                req.identity.paymentMethod[0].customer_id,
                {
                  source: token.id,
                },
                async (err, customer) => {
                  if (err) {
                    return res.status(404).json({
                      success: false,
                      error: { code: 404, message: err.raw.message },
                    });
                  }
                  try {
                    /**Making last added card default on stripe */
                    const updatedcustomer = await stripe.customers.update(
                      req.identity.paymentMethod[0].customer_id,
                      {
                        default_source: customer.id,
                      }
                    );
                  } catch (err) {
                    return res.status(400).json({
                      success: false,
                      error: { code: 404, message: '' + err },
                    });
                  }
                  var query = req.identity.paymentMethod;
                  query.forEach((element, index) => {
                    query[index].isDefault = false;
                  });
                  query[req.identity.paymentMethod.length] = {
                    customer_id: req.identity.paymentMethod[0].customer_id,
                    card_id: customer.id,
                    last4: customer.last4,
                    exp_month: customer.exp_month,
                    exp_year: customer.exp_year,
                    ownerName: req.body.ownerName,
                    brand: customer.brand,
                    isDefault: true,
                  };
                  /**adding added card into user and making it default */
                  Users.update(
                    { id: req.identity.id },
                    {
                      paymentMethod: query,
                    }
                  ).then((data) => {
                    return res.status(200).json({
                      success: true,
                      data: customer,
                      message: constantObj.messages.CARD_ADDED,
                    });
                  });
                }
              );
            } else {
              stripe.customers.create(
                {
                  description: req.body.email,
                  name: req.identity.firstName,
                  address: {
                    line1: '52 N Main ST',
                    city: req.identity.city || 'Johnstown',
                    state: 'OH',
                    postal_code: '43210',
                    country: 'US',
                  },

                  source: token.id, // obtained with Stripe.js
                },
                (err, customer) => {
                  if (err) {
                    return res.status(404).json({
                      success: false,
                      error: { code: 404, message: err.raw.message },
                    });
                  }
                  var query = req.identity.paymentMethod;

                  query[0] = {
                    customer_id: customer.id,
                    card_id: customer.default_source,
                    last4: token.card.last4,
                    exp_month: token.card.exp_month,
                    exp_year: token.card.exp_year,
                    ownerName: req.body.ownerName,
                    brand: token.card.brand,
                    isDefault: true,
                  };

                  Users.update(
                    { id: req.identity.id },
                    { customer_id: customer.id, paymentMethod: query }
                  ).then((data) => {
                    return res.status(200).json({
                      success: true,
                      data: customer,
                      message: constantObj.messages.CARD_ADDED,
                    });
                  });
                }
              );
            }
          } else {
            /**If user is not registered on stripe */
            stripe.customers.create(
              {
                description: req.body.email,
                name: req.identity.firstName,
                address: {
                  line1: '52 N Main ST',
                  city: 'Johnstown',
                  state: 'OH',
                  postal_code: '43210',
                  country: 'US',
                },

                source: token.id, // obtained with Stripe.js
              },
              (err, customer) => {
                if (err) {
                  return res.status(404).json({
                    success: false,
                    error: { code: 404, message: err.raw.message },
                  });
                }

                var query = [
                  {
                    customer_id: customer.id,
                    card_id: customer.default_source,
                    last4: token.card.last4,
                    exp_month: token.card.exp_month,
                    exp_year: token.card.exp_year,
                    ownerName: req.body.ownerName,
                    brand: token.card.brand,
                    isDefault: true,
                  },
                ];

                Users.update(
                  { id: req.identity.id },
                  {
                    customer_id: customer.id,
                    paymentMethod: query,
                  }
                ).then((data) => {
                  return res.status(200).json({
                    success: true,
                    data: customer,
                    message: constantObj.messages.CARD_ADDED,
                  });
                });
              }
            );
          }
        }
      }
    );
  },

  /**
   *
   * @param {*} req
   * @param {*} res
   * @returns
   * @description used to delete existing card
   * @createdAt 19/04/2022
   * @createdBy jcsoftwaresolution
   */
  deleteCard: function (req, res) {
    var customerId = req.param('customerId');
    var cardId = req.param('cardId');
    var id = req.identity.id;
    try {
      Users.findOne({ id: id }).then((userDetail) => {
        if (userDetail.paymentMethod.length == 1) {
          return res.status(400).json({
            success: false,
            error: {
              code: 400,
              message: "Can't delete this card.Please add another card first.",
            },
          });
        } else {
          stripe.customers.deleteSource(
            customerId,
            cardId,
            (err, confirmation) => {
              if (err) {
                return res.status(400).json({
                  success: false,
                  code: 400,
                  message: '' + err.raw.message,
                });
              } else {
                Users.findOne({ id: id }).then(async (user) => {
                  var counter = 0;
                  const paymentMethod = user.paymentMethod;

                  paymentMethod.forEach((element) => {
                    //console.log(element);
                    if (element.card_id == cardId) {
                      user.paymentMethod.splice(counter, 1);
                    }
                  });

                  if (user.paymentMethod.length > 0) {
                    try {
                      var stripeCustomer = user.paymentMethod[0].customer_id;
                      var card = user.paymentMethod[0].card_id;

                      const updatedcustomer = await stripe.customers.update(
                        stripeCustomer,
                        {
                          default_source: card,
                        }
                      );

                      user.paymentMethod[0].isDefault = true;
                    } catch (err) {
                      //console.log(err);
                    }
                  }

                  Users.update(
                    { id },
                    { paymentMethod: user.paymentMethod }
                  ).then((Users) => {
                    return res.status(200).json({
                      success: true,
                      code: 200,
                      message: constantObj.messages.CARD_DELETED,
                    });
                  });
                });
              }
            }
          );
        }
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: {
          code: 400,
          message: '' + err,
        },
      });
    }
  },

  /**
   *
   * @param {*} req
   * @param {*} res
   * @returns
   * @description Used to payment of subscription plans
   * @createdAt 19/04/2022
   * @createdBy jcsoftwaresolution
   */
  stripePayment: async (req, res) => {
    let plan_id = req.param('plan_id');
    let subscriptionPlanID = req.param('subscriptionPlanID');
    let user_id = req.param('user_id');
    let customer_id = req.param('customer_id');
    let card_id = req.param('card_id');
    let amount = req.param('amount');
    let planInfo = await Plans.findOne({ id: plan_id });
    let userInfo = await Users.findOne({ id: user_id });

    if (
      userInfo.plan_id == plan_id &&
      new Date(userInfo.validupto).getTime() > new Date().getTime()
    ) {
      return res.status(400).json({
        success: false,
        error: { code: 400, message: constantObj.messages.ALREADY_ACTIVE },
      });
    } else {
      try {
        //console.log(customer_id, plan_id);
        try {
          if (userInfo.subscription_id) {
            const existedSubscription = await stripe.subscriptions.retrieve(
              String(userInfo.subscription_id)
            );
            //console.log('existedSubscription', existedSubscription);
            if (existedSubscription) {
              const deleted = await stripe.subscriptions.del(
                userInfo.subscription_id
              );
            }
          }
        } catch (err) {
          //console.log(err);
        }

        var quantity = 1;
        var validupto = addDays(new Date(), 30);

        var subscription = await stripe.subscriptions.create({
          customer: customer_id,
          items: [
            {
              plan: subscriptionPlanID,
              quantity: quantity,
            },
          ],
        });
        if ((subscription.status = 'complete')) {
          var query = {};

          query.price = planInfo.price;

          query.plan_id = planInfo.id;
          query.validupto = validupto;
          query.subscription_id = subscription.id;
          query.validFrom = new Date();

          Users.update({ id: user_id }, query).then((user) => {
            //console.log(user, '=============');
            UserTransactions.create({
              name: userInfo.name,
              plan_id: plan_id,
              price: amount,
              subscriptionObject: subscription,
              user_id: user_id,
              status: subscription.status,
            }).then((data) => {
              //   paymentEmail({
              //     email: userInfo.email,
              //     firstName: userInfo.name,
              //     subscription_id: subscription.id,
              //   });

              return res.status(200).json({
                success: true,
                code: 200,
                message: 'Payment successful.',
                response: subscription,
              });
            });
          });
        } else {
          UserTransactions.create({
            name: user[0].firstName,
            plan_id: plan_id,
            amount: amount,
            subscriptionObject: subscription,
            user_id: user_id,
            status: subscription.status,
          }).then((data) => {
            return res.status(400).json({
              success: false,
              error: {
                code: 400,
                message: 'Payment ' + subscription.status,
                response: subscription,
              },
            });
          });
        }
      } catch (err) {
        //console.log(err);
        return res
          .status(400)
          .json({ success: false, error: { code: 400, message: '' + err } });
      }
    }
  },

  /**
   *
   * @param {*} req
   * @param {*} res
   * @returns
   * @description Used to manage the webhook event fired by stripe
   * @createdAt 19/04/2022
   * @createdBy jcsoftwaresolution
   */
  subscriptionWebhooks: async (request, response) => {
    console.log('<<<<<<<<<<<<<<<<<< in webhook event >>>>>>>>>>>>>>>>>>>>>');
    // //console.log(request.body,request.param('id'))
    let event = request.body;
    //console.log(typeof request.body);

    // try {
    //   event = await constructStripeEvent(request);
    //   //console.log(event,"this  event ==========================================")
    // }
    // catch (err) {
    //   response.status(400).send(`Webhook Error: ${err.message}`);
    // }
    let message = 'webhook event received';
    // let dataObject = event.data.object;
    //console.log('data Object=======', request.body);
    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.deleted':
        //console.log(event.type + 'handeled');
        break;

      case 'customer.subscription.updated':
        console.log(event.type + '   handeled');
        syncSubscriptionInDB(event);
        break;
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        //console.log(
        //   `PaymentIntent for ${paymentIntent.amount} was successful!`
        // );
        // Then define and call a method to handle the successful payment intent.
        // handlePaymentIntentSucceeded(paymentIntent);
        break;
      case 'payment_method.attached':
        const paymentMethod = event.data.object;
        // Then define and call a method to handle the successful attachment of a PaymentMethod.
        // handlePaymentMethodAttached(paymentMethod);
        break;
      default:
      // Unexpected event type
      //console.log(`Unhandled event type ${event.type}.`);
    }
    // Return a response to acknowledge receipt of the event
    response.json({ received: true, message });
  },
  /**
   *
   * @param {*} req
   * @param {*} res
   * @returns
   * @description used to change primary card
   * @createdAt 19/04/2022
   * @createdBy jcsoftwaresolution
   */
  setPrimaryCard: async (req, res) => {
    let customer_id = req.param('customer_id');
    let card_id = req.param('card_id');

    try {
      const updatedcustomer = await stripe.customers.update(customer_id, {
        default_source: card_id,
      });

      return res.status(200).json({
        success: true,
        code: 200,
        message: 'Default card set successfully.',
        updatedcustomer,
      });
    } catch (err) {
      return res
        .status(400)
        .json({ success: false, error: { code: 404, message: '' + err } });
    }
  },

  transactionListing: (req, res) => {
    var search = req.param('search');
    var page = req.param('page');
    var count = req.param('count');
    var user_id = req.param('user_id');
    var sortBy = req.param('sortBy');

    if (page == undefined) {
      page = 1;
    }

    if (count == undefined) {
      count = 10;
    }

    var skipNo = (page - 1) * count;
    var query = {};

    if (search) {
      query.or = [
        {
          name: { like: '%' + search + '%' },
        },
      ];
    }
    if (user_id) {
      query.user_id = user_id;
    }
    if (!sortBy) {
      sortBy = 'createdAt desc';
    }

    UserTransactions.count(query).then((total) => {
      UserTransactions.find(query)
        .populate('user_id')
        .sort(sortBy)
        .skip(skipNo)
        .limit(count)
        .then((UserTransactions) => {
          return res.status(200).json({
            success: true,
            data: UserTransactions,
            total: total,
          });
        });
    });
  },
};

/**Email template used to send user after payment */
paymentEmail = function (options) {
  (email = options.email), (firstName = options.firstName);

  hello = '';
  message = hello;
  message += 'Hi ' + firstName + ',';
  message += '<br/><br/>';
  message += 'Subscription purchased successfully.';
  message += '<br/><br/>';
  message += '<br/>';
  message += 'Thanks';

  transport.sendMail(
    {
      from: 'L3 Times <' + sails.config.appSMTP.auth.user + '>',
      to: email,
      subject: 'Subscription Plan Purchase',
      html: message,
    },
    function (err, info) {
      //console.log('err', err, info);
    }
  );
};

syncSubscriptionInDB = async function (subscriptionObject) {
  console.log(subscriptionObject.data.object.customer);
  var query = {};
  // query.paymentMethod = {
  //   customer_id: subscriptionObject.data.object.customer,
  // };

  query.customer_id = subscriptionObject.data.object.customer;
  let user = await Users.find(query).limit(1);

  if (user && user.length == 0) {
    console.error("user doesn't exist in db");
    return;
  }
  console.log(user.email);
  switch (subscriptionObject.data.object.status) {
    case 'active':
      var updateQuery = {};

      updateQuery.validupto = addDays(new Date(), 30);

      Users.update({ id: user[0].id }, updateQuery).then((updatedUser) => {
        console.log('User updated');
        let amount =
          (subscriptionObject.data.object.items.data[0].quantity *
            subscriptionObject.data.object.items.data[0].price.unit_amount) /
          100;
        UserTransactions.create({
          name: user[0].firstName,
          plan_id: user[0].plan_id,
          amount: amount,
          subscriptionObject: subscriptionObject,
          user_id: updatedUser[0].id,
          status: 'complete',
          type: 'webhook',
        }).then((data) => {
          console.log('transaction created');
        });
      });
      break;
    case 'unpaid':
    case 'past_due':
    case 'canceled':
      break;
    default:
      console.log();
  }
};
