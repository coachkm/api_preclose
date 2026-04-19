module.exports.constants = {
  user: {
    USERNAME_REQUIRED: 'Email is required',
    FIRSTNAME_REQUIRED: 'Firstname is required',
    LASTNAME_REQUIRED: 'Lastname is required',
    PHONE_REQUIRED: 'Phone number is required',
    EMAIL_REQUIRED: 'Email is required',
    EMAIL_EXIST: 'Email-Id already exists.',
    WRONG_EMAIL: 'Email-Id does not exists',
    PASSWORD_REQUIRED: 'Password is required',
    UNVERIFIED: 'You have not verified your account. Please verify',
    USERNAME_NOT_APPROVED: 'You have not approved by the admin',
    SUCCESSFULLY_REGISTERED: 'Successfully registered',
    SUCCESSFULLY_LOGGEDIN: 'Successfully logged in',
    WRONG_USERNAME: 'Username does not exists',
    WRONG_PASSWORD: 'Password is wrong!',
    CURRENT_PASSWORD: 'Current Password is wrong!',
    INVALID_USER: 'Invalid User. Your email does not exist to our system.',
    ALREADY_VERIFIED:
      'You have already verified your email. Please login to website.',
    ERROR_MAIL: 'There is some error to send mail to your email id.',
    LINK_MAIL: 'Link for reset password has been sent to your email id.',
    PASSWORD_CHANGED: 'Password has been changed',
    ROLE_REQUIRED: 'Role is required.',
    USERNAME_ALREADY: 'Username is already exits.',
    USERNAME_INACTIVE: 'User is inactive',
    CONPASSWORD_REQUIRED: 'Confirm Password is required',
    CURRENTPASSWORD_REQUIRED: 'Current Password is required',
    CONFIRM_PASSWORD_NOTMATCH: 'Confirm Password is not Match',
    ID_REQUIRED: 'id Is Required',
    UPDATED_USER: 'User updated successfully.',
    USERNAME_VERIFIED: 'You are not authorized.Please varify your email first.',
    INVALID_CRED: 'Invalid login credentials.',
    COMPANY_REQUIRED: ' Company id required.',
    DOMAIN_REQUIRED: 'Domain key required.',
    CONTACT_ADMIN: 'Unable to login. Please contact admin.',
    INVALID_IP: 'Ip address is not in whitelist.',
    INVALID_LOCATION: "Unable to login .Please login at company's location.",
    VERIFICATION_SENT: 'Verification code is sent on email.',
    EMAIL_USED: 'Email is being used by another user already.',
    CONTACT_US: 'We will back to you soon.',
    ACCOUNT_EXIST: 'Account Already exist.',
    OTP_REQUIRED: 'Otp required',
    WRONG_OTP: 'Invalid otp.',
    OTP_MATCH: 'Account verified successfully.',
    ALREADY_INVITED: 'Contact already invited.',
    INVITE_SENT: 'Invite sent successfully.',
    CONTACT_ADDED: 'Contact added successfully.',
    CONTACT_DELETED: 'Contact deleted successfully.',
  },

  messages: {
    STATUS_CHANGED: 'Status changed successfully.',
    DATABASE_ISSUE: 'Some issue occur . Please try after some time.',
    DELETE_SUCCESS: 'Record soft deleted.',
    HARD_DELETE: 'Record deleted permanently.',
    ROLLBACK_SUCCESS: 'Record rollback successfully.',
    PATTEREN_ADDED: 'Pattren added sucessfully.',
    CARD_EXIST: 'Card already exist.',
    CARD_DELETED: 'Card deleted successfully.',
    CARD_ADDED: 'Card added successfully.',
    ALREADY_ACTIVE: 'Plan already purchased and active.',
  },

  category: {
    NAME_REQUIRED: 'Category name required.',
    ALREADY_EXIST: 'Category already exist.',
    CATEGORY_CREATED: 'Category created successfully.',
    CATEGORY_UPDATED: 'Category updated successfully.',
  },

  faq: {
    QUESTION_REQUIRED: 'Question required.',
    ISSUE_IN_UPDATE: 'There is some issue with updating faq.',
    FAQ_ALREADY_EXIST: 'Faq already exist.',
    FAQ_SAVED: 'Faq saved successfully.',
    ID_REQUIRED: 'Id required',
    FAQ_UPDATED: 'Faq updated successfully.',
    ID_REQUIRED: 'Id required.',
  },

  Role: {
    ALREADY_EXIST: 'Role already exist.',
    CREATED: 'Role created successfully.',
    UPDATED: 'Role updated successfully.',
  },

  contractType: {
    ALREADY_EXIST: 'Contact type already exist.',
    CREATED: 'Contact type created successfully.',
    UPDATED: 'Contact type updated successfully.',
    SOFT_DELETED: 'Contact type soft deleted successfully.',
  },

  intakeQuestions: {
    ALREADY_EXIST: 'Question  already exist.',
    CREATED: 'Question created successfully.',
    UPDATED: 'Question updated successfully.',
    SOFT_DELETED: 'Question soft deleted successfully.',
    INDEX_UPDATED: 'Index updated successfully.',
    NOT_FOUND: 'Record not found',
  },

  Workflow: {
    TITLE_REQUIRED: 'Title required.',
    ALREADY_EXIST: 'Workflow already exist.',
    CREATED: 'Workflow created successfully.',
  },

  Transaction: {
    ALREADY_EXIST: 'Transaction already exist.',
    CREATED: 'Transaction created successfully.',
    UPDATED: 'Transaction updated successfully.',
    TITLE_REQUIRED: 'Title required.',
    TEMPLATE_EXIST: ' Template already exist with same title.',
    TEMPLATE_CREATED: 'Template created sucessfully.',
    TEMPLATE_UPDATED: 'Template updated successfully.',
    TEMPLATE_REMOVED: 'Template removed successfully.',
    ALREADY_APPLIED: 'Template already applied on transaction.',
    TEMPLATE_APPLIED: 'Template applied successfully.',
  },

  plan: {
    NAME_REQUIRED: 'Plan name required.',
    PRICE_REQUIRED: 'Plan price required.',
    ALREADY_EXIST: 'Plan already exist.',
    PLAN_CREATED: 'Plan created successfully.',
    PLAN_UPDATED: 'Plan updated successfully.',
  },

  tasks: {
    TRANSACTION_REQUIRED: 'Transaction id required.',
    DATE_REQUIRED: 'Task date required.',
    CREATED: 'Task created successfully.',
    UPDATED: 'Task updated successfully.',
    REMOVED: 'Task removed succesfully.',
    TEMPLATE_REQUIRED: 'Template id required',
    DUPLICATE_SUCCESS: 'Template created successfully.',
    TEMPLATE_NOT_FOUND: 'Template not found.',
  },

  contact: {
    MERGE_USER: 'Merged contact required.',
    MERGETO_USER: 'Merge to contact required.',
    CONTACT_NOT_FOUND: 'Contact not found',
    MERGED: 'Contacts merged successfully.',
  },

  notes: {
    DELETED: 'Note deleted successfully.',
    UPDATED: 'Note updated successfully.',
    CREATED: 'Note created successfully.',
  },

  owner: {
    OWNER_REQUIRED: 'Owner required.',
    ALREADY_EXIST: 'Owner already exist.',
    CREATED: 'Owner created successfully.',
    UPDATED: 'Owner updated successfully.',
    SOFT_DELETED: 'Owner soft deleted successfully.',
  },

  reference: {
    TITLE_REQUIRED: 'Title required.',
    ALREADY_EXIST: 'Reference already exist.',
    CREATED: 'Reference created successfully.',
  },

  reminder: {
    ADDED: 'Reminder added successfully.',
    UPDATED: 'Reminder updated successfully.',
  },

  emailTemplates: {
    ALREADY_EXIST: 'Email template already exist with same name.',
    CREATED: 'Email template created successfully.',
    UPDATED: 'Email Template updated successfully.',
    SOFT_DELETED: 'Email template deleted successfully.',
    EMAIL_CONNECTED: 'Email connected successfully.',
    EMAIL_NOT_CONNECTED: 'Email is not connected.',
  },

  TEXTTEMPLATES: {
    ALREADY_EXIST: 'Text template already exist with same name.',
    CREATED: 'Text template created successfully.',
    UPDATED: 'Text Template updated successfully.',
    SOFT_DELETED: 'Text template deleted successfully.',
  },

  chat: {
    MESSAGE_SENT: 'Message sent successfully.',
    MESSAGE_DELETED: 'Message deleted successfully.',
    NOT_FOUND: 'Message not found.',
    MESSAGE_UPDATED: 'Message updated successfully.',
  },

  decisionPage: {
    CREATED: 'Decision page created successfully.',
    UPDATED: 'Decision page updated successfully.',
    DELETED: 'Decision page deleted successfully.',
  },

  Views: {
    CREATED: 'View created successfully.',
    UPDATED: 'View updated successfully.',
    DELETED: 'View deleted successfully.',
  },
};
