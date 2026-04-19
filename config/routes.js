/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes tell Sails what to do each time it receives a request.
 *
 * For more information on configuring custom routes, check out:
 * https://sailsjs.com/anatomy/config/routes-js
 */

module.exports.routes = {
  /***************************************************************************
   *                                                                          *
   * Make the view located at `views/homepage.ejs` your home page.            *
   *                                                                          *
   * (Alternatively, remove this and add an `index.html` file in your         *
   * `assets` directory)                                                      *
   *                                                                          *
   ***************************************************************************/

  '/': { view: 'pages/homepage' },

  /***************************************************************************
   *                                                                          *
   * More custom routes here...                                               *
   * (See https://sailsjs.com/config/routes for examples.)                    *
   *                                                                          *
   * If a request to a URL doesn't match any of the routes in this file, it   *
   * is matched against "shadow routes" (e.g. blueprint routes).  If it does  *
   * not match any of those, it is matched against static assets.             *
   *                                                                          *
   ***************************************************************************/

  // 'get /users': 'UsersController.getUsers'

  'post /admin/signin': 'UsersController.adminSignin',
  'put /change/password': 'UsersController.changePassword',
  'get /user': 'UsersController.userDetail',
  'put /user': 'UsersController.editProfile',
  'post /forgotpassword': 'UsersController.forgotPassword',
  'put /reset/password': 'UsersController.resetPassword',
  'post /add/user': 'UsersController.addUser',
  'get /users': 'UsersController.getAllUsers',
  'get /users/csv': 'UsersController.userCSV',
  'get /verifyUser': 'UsersController.verifyUser',
  'post /inviteUser': 'UsersController.inviteUser',
  'get /inviteUser/List': 'UsersController.inviteUserList',
  'post /resend/invite': 'UsersController.resendInvite',

  /**User Routes */

  'post /signup': 'UsersController.register',
  'post /verifiy/otp': 'UsersController.verifyOtp',
  'post /signin': 'UsersController.userSignin',
  'delete /delete/user': 'UsersController.deleteUser',
  'put /actvate/deactivate/access': 'UsersController.activateDeactivatePlan',

  /**Common Routes */

  'post /upload/image': 'CommonController.uploadImage',
  'post /upload/document': 'CommonController.uploaDocument',
  'put /change/status': 'CommonController.changeStatus',
  'delete /delete': 'CommonController.commonDelete',
  'post /upload/images': 'CommonController.uploadMultiImages',
  'delete /remove/image': 'CommonController.removeImage',
  'put /rollback/record': 'CommonController.commonRollback',
  'delete /delete/permanently': 'CommonController.permanentDelete',

  /**Category Routes */

  'post /category': 'CategoryController.saveCategory',
  'put /category': 'CategoryController.updateCategory',
  'get /category': 'CategoryController.categoryDetail',
  'get /categories': 'CategoryController.categoryListing',
  'delete /delete/category': 'CategoryController.deleteCategory',
  'get /categories/dropdown': 'CategoryController.categoryDropdown',
  'get /subcategories/dropdown': 'CategoryController.subcategoryDropdown',

  /** FAQ's Routes */

  'post /faq': 'FAQController.save',
  'put /faq': 'FAQController.update',
  'get /getAllFaq': 'FAQController.getAllFAQs',
  'get /faq': 'FAQController.getSingleFAQ',

  /**Content Managment routes */
  'put /content': 'ContentManagmentController.update',
  'get /contents': 'ContentManagmentController.getAllContentList',
  'get /content': 'ContentManagmentController.getSingleContent',

  /**ContarctType Routes */

  'post /contact/type': 'ContactTypeController.saveType',
  'put /contact/type': 'ContactTypeController.updateDetail',
  'get /contact/type': 'ContactTypeController.getDetail',
  'get /contact/types': 'ContactTypeController.getListing',
  'delete /contact/type': 'ContactTypeController.deleteContactType',

  /**Patterns Route */

  'post /pattren': 'PatternsController.addPattern',
  'get /pattrens': 'PatternsController.getPatterns',

  /**IntakeQuestion Routes */

  'post /intake/question': 'IntakeQuestionsController.addIntakeQuestions',
  'put /intake/question': 'IntakeQuestionsController.updateQuestion',
  'get /intake/question': 'IntakeQuestionsController.getDetail',
  'get /intake/questions': 'IntakeQuestionsController.getListing',
  'post /users/intake': 'IntakeQuestionsController.addUsersIntake',
  'put /update/index': 'IntakeQuestionsController.updateIndex',

  /**WorkFlow Routes */

  'post /workflow': 'WorkflowsController.addWorkFlow',
  'get /workflows': 'WorkflowsController.getWorkFlows',

  /** Transaction Routes */

  'post /transaction': 'TransactionsController.addTransaction',
  'put /transaction': 'TransactionsController.updateTransaction',
  'get /transaction': 'TransactionsController.getDetail',
  'get /transactions': 'TransactionsController.getListing',
  'get /transactions/columns': 'TransactionsController.getColumnsOfTable',
  'get /total/count': 'TransactionsController.getCounts',
  'get /transaction/users': 'TransactionsController.getTransactionUsers',
  'put /assign/transactions': 'TransactionsController.assignTransactions',
  /** Transaction Data Routes */
  'get /transaction/data': 'TransactionDataController.fetchTransactionData',
  'post /transaction/data': 'TransactionDataController.addTransactionData',
  'put /transaction/data': 'TransactionDataController.updateTransactionData',
  'get /transaction/data/detail': 'TransactionDataController.getDetail',
  'get /calender/data': 'TransactionDataController.getCalenderData',
  'get /checklist': 'TransactionDataController.getChecklists',
  'get /all/checklist': 'TransactionDataController.getAllChecklists',
  'put /update/transaction/status':
    'TransactionDataController.markTransactionCompleteSkippedClosed',

  'get /typelist': 'TransactionDataController.fetchlistingType',
  'post /transaction/email/template':
    'TransactionDataController.sendEmailTemplate',

  /**Notes Routes */

  'post /note': 'NotesController.addNote',
  'put /note': 'NotesController.updateNote',
  'get /note': 'NotesController.getNote',
  'delete /note': 'NotesController.destroyNote',
  'get /notes': 'NotesController.getNotesListing',

  /**Roles Routes */
  'post /role': 'RolesController.addRole',
  'put /role': 'RolesController.updateRole',
  'get /role': 'RolesController.viewRole',
  'get /roles': 'RolesController.getAllRoles',
  'get /roles/listing': 'RolesController.roleListing',

  /**Contact Routes */

  'post /contact': 'ContactsController.addContact',
  'delete /contact': 'ContactsController.deleteContact',
  'get /contact': 'ContactsController.detail',
  'get /contacts': 'ContactsController.getContacts',
  'get /to/contacts': 'ContactsController.getToContacts',
  'get /acceptRejectInvite': 'ContactsController.acceptRejectInvite',
  'post /contacts/merge': 'ContactsController.mergeContacts',
  'get /client/team': 'ContactsController.getClientTeamMember',

  /** Plans Route */

  'post /plan': 'PlansController.createPlan',
  'get /plan': 'PlansController.getPlan',
  'put /plan': 'PlansController.updatePlan',
  'get /plans': 'PlansController.getAllPlans',
  'delete /plan': 'PlansController.deletePlan',
  'get /user/plan': 'PlansController.getUserPlan',

  /***Payment Routes */

  'post /add/card': 'PaymentController.addCard',
  'delete /remove/card': 'PaymentController.deleteCard',
  'post /payment': 'PaymentController.stripePayment',
  'put /primary/card': 'PaymentController.setPrimaryCard',
  'post /webhooks': 'PaymentController.subscriptionWebhooks',

  /**Tasks Routes */

  'post /task': 'TasksController.addTask',
  'get /task': 'TasksController.viewTask',
  'get /tasks': 'TasksController.getTasksListing',
  'put /task': 'TasksController.updateTask',
  'delete /task': 'TasksController.removeTask',

  /**Transaction templates */

  'post /transaction/template': 'TransactionsTemplatesController.add',
  'get /transaction/template': 'TransactionsTemplatesController.detail',
  'get /transaction/templates':
    'TransactionsTemplatesController.getTransactionTemplatesListing',
  'put /transaction/template': 'TransactionsTemplatesController.update',
  'delete /transaction/template':
    'TransactionsTemplatesController.removeTemplate',
  'post /duplicate/template':
    'TransactionsTemplatesController.duplicateTemplate',
  'post /apply/template': 'TransactionsController.applyTemplate',

  /**Tasks Routes */

  'post /template/task': 'TemplateTasksController.addTask',
  'get /template/task': 'TemplateTasksController.viewTask',
  'get /template/tasks': 'TemplateTasksController.getTemplateTasksListing',
  'put /template/task': 'TemplateTasksController.updateTask',
  'delete /template/task': 'TemplateTasksController.removeTask',

  /**Template Detail routes */

  'post /template/detail': 'DocumentDetailController.addDetail',
  'get /template/detail': 'DocumentDetailController.viewDetail',
  'get /template/details': 'DocumentDetailController.getDocumentDetailListing',
  'put /template/detail': 'DocumentDetailController.updateDetail',
  'delete /template/detail': 'DocumentDetailController.removeTask',

  /**Owner routes */

  'post /owner': 'OwnerController.addOwner',
  'get /owners': 'OwnerController.getAllOwners',
  'get /owner': 'OwnerController.getOwner',
  'put /owner': 'OwnerController.updateDetail',
  'delete /owner': 'OwnerController.deleteOwner',

  /**Reference Routes */

  'post /reference': 'ReferenceController.addReference',
  'get /references': 'ReferenceController.getAllReferences',

  /**Reminder Routes */

  'post /reminder': 'RemindersController.addReminder',
  'get /reminder': 'RemindersController.getReminderDetail',
  'put /reminder': 'RemindersController.updateReminder',
  'get /reminders': 'RemindersController.getAllReminders',

  /**Email Template routes */

  'post /email/template': 'EmailTemplatesController.addTemplate',
  'get /email/template': 'EmailTemplatesController.getDetail',
  'put /email/template': 'EmailTemplatesController.updateDetail',
  'get /email/templates': 'EmailTemplatesController.getListing',
  'get /email/inbox': 'EmailTemplatesController.getInbox',
  'post /add/smtp': 'EmailTemplatesController.addEmailSMTP',
  'put /replace/template': 'EmailTemplatesController.replacingEmailTemplate',
  'post /send/email': 'EmailTemplatesController.sendEmail',

  /**Text Template routes */

  'post /text/template': 'TextTemplatesController.addTextTemplate',
  'get /text/template': 'TextTemplatesController.getDetail',
  'put /text/template': 'TextTemplatesController.updateDetail',
  'get /text/templates': 'TextTemplatesController.getListing',
  'delete /text/template': 'TextTemplatesController.deleteTextTemplate',
  'post /send/text-message': 'TextTemplatesController.sendTextMessage',

  // Sms Routes

  'get /text-messeges': 'SMSController.getSentSMS',

  /**Email Template Variables */

  'post /email/constant': 'EmailTemplateVariables.addvariables',
  'put /email/constant': 'EmailTemplateVariables.updateDetail',
  'get /email/constant': 'EmailTemplateVariables.variableDetail',
  'get /email/constants': 'EmailTemplateVariables.getAllVariables',

  /**Chat Routes */

  'post /transaction/message': 'ChatsController.sendGroupMessage',
  'get /transaction/messages': 'ChatsController.getTransactionMessages',
  'delete /delete/message': 'ChatsController.deleteMessage',
  'put /update/message': 'ChatsController.updateMessage',
  'post /message': 'ChatsController.sendMessage',
  'get /connected/users': 'ChatsController.getConnectedUsers',
  'get /messages': 'ChatsController.getMesseges',
  'post /chat': 'ChatsController.createDirectChat',
  'get /direct/messages': 'ChatsController.getDirectMessages',
  'put /update/directmessage': 'ChatsController.updateDirectMessage',
  'delete /delete/directmessage': 'ChatsController.deleteDirectMessage',
  /**ChannelRoutes */
  'post /channel': 'ChannelsController.createChannel',
  'get /channel': 'ChannelsController.getDetail',
  'delete /channel': 'ChannelsController.deleteChannel',
  'put /channel': 'ChannelsController.updateChannel',
  'get /channels': 'ChannelsController.getListing',

  /**Decision Page Routes */

  'post /decision': 'DecisionPageController.createDecisionPage',
  'get /decision': 'DecisionPageController.getDecisionPage',
  'delete /decision': 'DecisionPageController.destroyDecisionPage',
  'put /decision': 'DecisionPageController.updateDecisionPage',
  'get /decisions': 'DecisionPageController.getDecisionPageListing',

  /**Transaction decisions */
  'post /assign/unassign/decision':
    'TransactionsDecisionsController.assignUnassignDecision',

  /**View Routes */

  'post /view': 'MyViewsController.createView',
  'get /views': 'MyViewsController.getMyViews',
  'get /view': 'MyViewsController.viewDetail',
  'put /view': 'MyViewsController.editView',
  'delete /view': 'MyViewsController.deleteView',

  /**Email Routes */

  'get /sent/emails': 'EmailController.getSentEmail',
  'get /inbox/emails': 'EmailController.getTransactionInbox',
  'post /save/email': 'EmailController.saveSentEmail',

  /**Signatures Routes */

  'post /signature': 'SignaturesController.addSignature',
  'get /signature': 'SignaturesController.getSignature',

  /***Bomb bomb Routes */

  'get /videos': 'BombbombController.getVideos',
  'get /video': 'BombbombController.getVideoDetail',
  'post /bombbomb/email': 'BombbombController.sendEmailThroghBombBomb',
};

//fetchListingtype
