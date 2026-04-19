/**
 * Policy Mappings
 * (sails.config.policies)
 *
 * Policies are simple functions which run **before** your actions.
 *
 * For more information on configuring policies, check out:
 * https://sailsjs.com/docs/concepts/policies
 */

module.exports.policies = {
  /***************************************************************************
   *                                                                          *
   * Default policy for all controllers and actions, unless overridden.       *
   * (`true` allows public access)                                            *
   *                                                                          *
   ***************************************************************************/

  '*': 'isAuthorized',

  UsersController: {
    adminSignin: true,
    forgotPassword: true,
    resetPassword: true,
    register: true,
    userSignin: true,
    verifyUser: true,
    register: true,
    verifyOtp: true,
    userSignin: true,
    // contactUs:true
  },

  FAQController: {
    getAllFAQs: true,
  },
  ContentManagmentController: {
    getSingleContent: true,
  },

  ContactsController: {
    acceptRejectInvite: true,
  },
  PlansController: {
    getAllPlans: true,
  },

  CommonController:{
    uploadImage:true,
    uploadMultiImages:true
  },
  PaymentController:{
    subscriptionWebhooks:true
  }
 
};
