/**
 * BombbombController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

// const BombBomb = require('bombbomb');
// var Bombbomb = require('bombbomb');
const axios = require('axios').default;
const apiKey = 'efae78a5-6ad2-db8c-d75c-ee5ec355aa75';

const bombbombUrl = 'https://api.bombbomb.com/v2';
module.exports = {
  getVideos: async (req, res) => {
    try {
      const pageNumber = req.param('pageNumber') || 0;
      const search = req.param('search');
      var url = bombbombUrl + `/videos?pageNumber=${pageNumber}&detailed=true`;

      if (search) {
        url = url + `&searchTerm=${search}`;
      }

      //   const auth = await axios.post(
      //     'https://app.bombbomb.com/auth/access_token',
      //     {
      //       grant_type: 'client_credentials',
      //       client_id: '1e283f57-0c80-7e76-3bfb-3aa9c7fc4383',
      //       client_secret: '1e283f57-0c80-7e76-3bfb-3aa9c7fc4383',
      //     },
      //     {
      //       headers: {
      //         'Content-Type': 'application/json',
      //       },
      //     }
      //   );

      console.log(url, '--------');
      const response = await axios.get(url, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          Authorization:
            'Bearer ' +
            'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6IjMxNTUzNDdjMzZlYTNjODcxNzlmZTk4NzU3MTNkZmIyNzk1MDhlMDZlMmU3OWM1ODgxY2MyYTg1ZTcwMDg3NWNmNDcwZTk4OGQ0MzZhNjRkIn0.eyJhdWQiOiI1MWY4Y2JhZi1mMzk5LTg0MDYtYTY5Ni04ZDJmZGEwMWFlOTEiLCJqdGkiOiIzMTU1MzQ3YzM2ZWEzYzg3MTc5ZmU5ODc1NzEzZGZiMjc5NTA4ZTA2ZTJlNzljNTg4MWNjMmE4NWU3MDA4NzVjZjQ3MGU5ODhkNDM2YTY0ZCIsImlhdCI6MTY4MzU0NDE5Ny4yODM1MTgsIm5iZiI6MTY4MzU0NDE5Ny4yODM1MTgsImV4cCI6MTY4NjEzNjE5Ny4yNzM1NzUsInN1YiI6IjcxZGM0ZDg1LTk5MWYtOGQ4NC0wNTViLWFiMGViNDZhN2Q5NiIsInNjb3BlcyI6WyJ3ZWJob29rOm1hbmFnZSIsImFjY291bnQ6bWFuYWdlIiwiYWNjb3VudDpyZWFkIiwiZmlsZTptYW5hZ2UiLCJvcmRlcjptYW5hZ2UiLCJzZXR0aW5nczptYW5hZ2UiLCJ0ZWFtOm1hbmFnZSIsImxpc3Q6bWFuYWdlIiwibGlzdDpyZWFkIiwidGVhbTpyZWFkIiwiZm9ybTptYW5hZ2UiLCJhdXRvbWF0aW9uOm1hbmFnZSIsImF1dG9tYXRpb246cmVhZCIsInZpZGVvOnJlYWQiLCJjb250YWN0Om1hbmFnZSIsInZpZGVvOm1hbmFnZSIsImxhbmRpbmdQYWdlOnJlYWQiLCJzb2NpYWw6bWFuYWdlIiwiZW1haWw6bWFuYWdlIiwiYmlsbGluZzpyZWFkIiwiZW1haWw6cmVhZCIsImFsbDpyZWFkIiwic29jaWFsOnJlYWQiLCJwcm92aXNpb246cmVhZCIsInByb3Zpc2lvbjptYW5hZ2UiLCJ3ZWJob29rOnJlYWQiLCJmaWxlOnJlYWQiLCJmb3JtOnJlYWQiLCJjb250YWN0OnJlYWQiLCJhbGw6bWFuYWdlIl0sImJiY2lkIjoiM2VhYTQ3MzctODE5ZC0wOTk5LTBlNWQtN2M5MmFkNTRjNjg3In0.GRUmfx-q55IAxJ2CdMNqBV35nXG7I0xqLC9W8XSGqz3Sdv6v0stb42wjycnTi6QYe_8UaHgAxWFd-xKyC5IzvwRAaHX3gUcK-x6RQ2QuDGKB6qUOwYJvbst92Ib_9sBim2Tso_zuki-1xgscVmDH6ppdNkTDSmELwanHV79qrBc',
        },
      });
      //   console.log(videos);
      return res.status(200).json({
        success: true,
        data: response.data,
      });
    } catch (err) {
      console.log(err, 'errrr------');
      return res.status(500).json({
        success: false,
        error: { code: 500, message: '' + err },
      });
    }
  },

  getVideoDetail: async (req, res) => {
    try {
      const id = req.param('id');

      var url = bombbombUrl + `/videos/${id}`;

      const response = await axios.get(url, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          Authorization:
            'Bearer ' +
            'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6IjMxNTUzNDdjMzZlYTNjODcxNzlmZTk4NzU3MTNkZmIyNzk1MDhlMDZlMmU3OWM1ODgxY2MyYTg1ZTcwMDg3NWNmNDcwZTk4OGQ0MzZhNjRkIn0.eyJhdWQiOiI1MWY4Y2JhZi1mMzk5LTg0MDYtYTY5Ni04ZDJmZGEwMWFlOTEiLCJqdGkiOiIzMTU1MzQ3YzM2ZWEzYzg3MTc5ZmU5ODc1NzEzZGZiMjc5NTA4ZTA2ZTJlNzljNTg4MWNjMmE4NWU3MDA4NzVjZjQ3MGU5ODhkNDM2YTY0ZCIsImlhdCI6MTY4MzU0NDE5Ny4yODM1MTgsIm5iZiI6MTY4MzU0NDE5Ny4yODM1MTgsImV4cCI6MTY4NjEzNjE5Ny4yNzM1NzUsInN1YiI6IjcxZGM0ZDg1LTk5MWYtOGQ4NC0wNTViLWFiMGViNDZhN2Q5NiIsInNjb3BlcyI6WyJ3ZWJob29rOm1hbmFnZSIsImFjY291bnQ6bWFuYWdlIiwiYWNjb3VudDpyZWFkIiwiZmlsZTptYW5hZ2UiLCJvcmRlcjptYW5hZ2UiLCJzZXR0aW5nczptYW5hZ2UiLCJ0ZWFtOm1hbmFnZSIsImxpc3Q6bWFuYWdlIiwibGlzdDpyZWFkIiwidGVhbTpyZWFkIiwiZm9ybTptYW5hZ2UiLCJhdXRvbWF0aW9uOm1hbmFnZSIsImF1dG9tYXRpb246cmVhZCIsInZpZGVvOnJlYWQiLCJjb250YWN0Om1hbmFnZSIsInZpZGVvOm1hbmFnZSIsImxhbmRpbmdQYWdlOnJlYWQiLCJzb2NpYWw6bWFuYWdlIiwiZW1haWw6bWFuYWdlIiwiYmlsbGluZzpyZWFkIiwiZW1haWw6cmVhZCIsImFsbDpyZWFkIiwic29jaWFsOnJlYWQiLCJwcm92aXNpb246cmVhZCIsInByb3Zpc2lvbjptYW5hZ2UiLCJ3ZWJob29rOnJlYWQiLCJmaWxlOnJlYWQiLCJmb3JtOnJlYWQiLCJjb250YWN0OnJlYWQiLCJhbGw6bWFuYWdlIl0sImJiY2lkIjoiM2VhYTQ3MzctODE5ZC0wOTk5LTBlNWQtN2M5MmFkNTRjNjg3In0.GRUmfx-q55IAxJ2CdMNqBV35nXG7I0xqLC9W8XSGqz3Sdv6v0stb42wjycnTi6QYe_8UaHgAxWFd-xKyC5IzvwRAaHX3gUcK-x6RQ2QuDGKB6qUOwYJvbst92Ib_9sBim2Tso_zuki-1xgscVmDH6ppdNkTDSmELwanHV79qrBc',
        },
      });

      return res.status(200).json({
        success: true,
        data: response.data,
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: { code: 500, message: '' + err },
      });
    }
  },
  sendEmailThroghBombBomb: async (req, res) => {
    try {
      const data = req.body;

      var url = bombbombUrl + `/emails/quicksend`;
      var payload = {};
      if (data.vedioId) {
        payload.videoId = data.videoId;
      }

      if (data.to && data.to.length > 0) {
        payload.emailAddresses = data.to.toString();
      }

      payload.subject = data.subject;
      payload.message = data.message;

      console.log(data);
      const response = await axios.post(url, payload, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + req.body.accessToken,
        },
      });

      data.to = req.body.to;
      data.from = req.identity.imapEmail;
      data.subject = req.body.subject;
      data.message = req.body.message;
      data.attachments = req.body.attachments;
      data.transactionId = req.body.transactionId;
      data.sendBy = req.identity.id;
      data.cc = req.body.cc;
      data.bcc = req.body.bcc;

      const sentEmail = await Email.create(data);

      return res.status(200).json({
        success: true,
        data: response.data,
      });
    } catch (err) {
      console.log(err);
      return res.status(500).json({
        success: false,
        error: { code: 500, message: '' + err },
      });
    }
  },
};
