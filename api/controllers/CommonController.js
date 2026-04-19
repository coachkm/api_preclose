/* eslint-disable no-unused-vars */

var constantObj = sails.config.constants;
var constant = require('../../config/local.js');
const SmtpController = require('../controllers/SmtpController');
var fs = require('fs');
var url = require('url');

var async = require('async');
var fs = require('fs');
var sharp = require('sharp');

const db = sails.getDatastore().manager;

// const CommonService = require('../services/CommonService');

generateName = function () {
  // action are perform to generate random name for every file
  var uuid = require('uuid');
  var randomStr = uuid.v4();
  var date = new Date();
  var currentDate = date.valueOf();

  retVal = randomStr + currentDate;
  return retVal;
};

module.exports = {
  /**
   *
   * @param {*} req
   * @param {*} res
   * @description Used to upload binary image using normal file uploader
   * @createdAt : 25/01/2022
   *
   */

  uploadImage: async (req, res) => {
    var modelName = req.param('modelName');
    try {
      req
        .file('file')
        .upload(
          { maxBytes: 19000000, dirname: '../../assets/images/' + modelName },
          async (err, file) => {
            if (err) {
              if (err.code == 'E_EXCEEDS_UPLOAD_LIMIT') {
                return res.status(404).json({
                  success: false,
                  error: {
                    code: 404,
                    message: 'Image size must be less than 19 MB',
                  },
                });
              }
            }
            //console.log('ok---------------')
            var responseData = {};
            file.forEach(async (element, index) => {
              var name = generateName();
              //console.log(element.fd);
              typeArr = element.type.split('/');
              fileExt = typeArr[1];
              var orignalName = element.filename;

              if (
                fileExt === 'jpeg' ||
                fileExt === 'JPEG' ||
                fileExt === 'JPG' ||
                fileExt === 'jpg' ||
                fileExt === 'PNG' ||
                fileExt === 'png'
              ) {
                fs.readFile(file[index].fd, async (err, data) => {
                  if (err) {
                    return res.status(403).json({
                      success: false,
                      error: {
                        code: 403,
                        message: err,
                      },
                    });
                  } else {
                    if (data) {
                      var path = file[index].fd;
                      fs.writeFile(
                        'assets/images/' +
                          modelName +
                          '/' +
                          name +
                          '.' +
                          fileExt,
                        data,
                        function (err, image) {
                          if (err) {
                            return res.status(400).json({
                              success: false,
                              error: {
                                code: 400,
                                message: err,
                              },
                            });
                          }
                        }
                      );

                      responseData.fullpath = name + '.' + fileExt;
                      responseData.imagePath =
                        'images/' + modelName + '/' + name + '.' + fileExt;

                      var thumbpath =
                        'assets/images/' +
                        modelName +
                        '/thumbnail/200/' +
                        name +
                        '.' +
                        fileExt;
                      sharp(path)
                        .resize({ height: 200, width: 200 })
                        .toFile(thumbpath)
                        .then(function (newFileInfo) {})
                        .catch(function (err) {
                          //console.log('Got Error', err);
                        });
                      var thumbpath1 =
                        'assets/images/' +
                        modelName +
                        '/thumbnail/300/' +
                        name +
                        '.' +
                        fileExt;
                      var thumbpath2 =
                        'assets/images/' +
                        modelName +
                        '/thumbnail/500/' +
                        name +
                        '.' +
                        fileExt;
                      sharp(path)
                        .resize({ height: 300, width: 300 })
                        .toFile(thumbpath1)
                        .then(function (newFileInfo) {})
                        .catch(function (err) {
                          //console.log('Got Error', err);
                        });
                      sharp(path)
                        .resize({ height: 500, width: 500 })
                        .toFile(thumbpath2)
                        .then(function (newFileInfo) {})
                        .catch(function (err) {
                          //console.log('Got Error');
                        });

                      if (index == file.length - 1) {
                        await new Promise((resolve) =>
                          setTimeout(resolve, 6000)
                        ); //Because file take times to write in .tmp folder
                        fs.unlink(file[index].fd, function (err) {
                          if (err) throw err;
                        });
                        return res.json({
                          success: true,
                          code: 200,
                          data: responseData,
                          originalName: orignalName,
                          imageUrl:
                            constant.BACK_WEB_URL +
                            '' +
                            'images/' +
                            modelName +
                            '/' +
                            name +
                            '.' +
                            fileExt,
                          location:
                            constant.BACK_WEB_URL +
                            '' +
                            'images/' +
                            modelName +
                            '/' +
                            name +
                            '.' +
                            fileExt,
                          generatedName: name,
                          msg: 'Image upload successful',
                        });
                      }
                    }
                  }
                }); //end of loop
              } else {
                return res.status(404).json({
                  success: false,
                  error: {
                    code: 404,
                    message: 'Please upload a valid image file.',
                  },
                });
              }
            });
          }
        );
    } catch (err) {
      return res
        .status(500)
        .json({ success: false, error: { code: 500, message: '' + err } });
    }
  },

  /**
   *
   * @param {*} req
   * @param {*} res
   * @description Used to upload document using normal file uploader
   * @createdAt : 18/04/2022
   *
   */

  uploaDocument: async (req, res) => {
    var modelName = req.param('modelName');
    try {
      req
        .file('file')
        .upload(
          { maxBytes: 19000000, dirname: '../../assets/images/' + modelName },
          async (err, file) => {
            if (err) {
              if (err.code == 'E_EXCEEDS_UPLOAD_LIMIT') {
                return res.status(404).json({
                  success: false,
                  error: {
                    code: 404,
                    message: 'Document size must be less than 20 MB',
                  },
                });
              }
            }
            var responseData = {};
            file.forEach(async (element, index) => {
              //Code added by chandra shekhar on 16/11/2022
              var fileName = element.filename;
              var splitName = fileName.split('.');
              var name = splitName[0].replace(/[^\w\s]/gi, '-');

              //var name = generateName();
              typeArr = element.type.split('/');
              fileExt = typeArr[1];
              fileExt = fileExt.toLowerCase();

              if (fileExt) {
                if (
                  fileExt ==
                  'vnd.openxmlformats-officedocument.wordprocessingml.document'
                ) {
                  fileExt = 'docx';
                }

                fs.readFile(file[index].fd, async (err, data) => {
                  if (err) {
                    return res.status(403).json({
                      success: false,
                      error: {
                        code: 403,
                        message: err,
                      },
                    });
                  } else {
                    if (data) {
                      var path = file[index].fd;
                      fs.writeFile(
                        'assets/docs/' + name + '.' + fileExt,
                        data,
                        function (err, image) {
                          fs.writeFile(
                            '.tmp/public/docs/' + name + '.' + fileExt,
                            data,
                            function (err, image) {
                              if (err) {
                                return res.status(400).json({
                                  success: false,
                                  error: {
                                    code: 400,
                                    message: err,
                                  },
                                });
                              }
                            }
                          );
                        }
                      );

                      responseData.fullpath = name + '.' + fileExt;
                      responseData.docPath = 'docs/' + name + '.' + fileExt;
                      responseData.filename = `${name}.${fileExt}`;
                      responseData.contentType = element.type;
                      responseData.path = `assets/${responseData.docPath}`;

                      if (index == file.length - 1) {
                        await new Promise((resolve) =>
                          setTimeout(resolve, 3000)
                        ); //Because file take times to write in .tmp folder
                        fs.unlink(file[index].fd, function (err) {
                          if (err) throw err;
                        });

                        // await documentEmail({
                        //   email: req.identity.email,
                        //   firstName: req.identity.firstName,
                        // });
                        return res.json({
                          success: true,
                          code: 200,
                          data: responseData,
                        });
                      }
                    }
                  }
                }); //end of loop
              } else {
                return res.status(404).json({
                  success: false,
                  error: {
                    code: 404,
                    message: 'Please upload a valid document file.',
                  },
                });
              }
            });
          }
        );
    } catch (err) {
      return res
        .status(500)
        .json({ success: false, error: { code: 500, message: '' + err } });
    }
  },

  // uploadMultiImages: async (req, res) => {
  //     try {

  //         //for Check Folder is Exit Or notvar rootpath = process.cwd();
  //         var modelName = req.query.modelName;
  //         if ((!modelName) || typeof modelName == undefined) {
  //             return res.status(404).json({ "success": false, "error": { "code": 404, "message": "Please Add Model Name" } });
  //         }
  //         var rootpath = process.cwd();
  //         var fullpath = rootpath + "/assets/images/" + modelName;
  //         var fullpaththumbnail =
  //             rootpath + "/assets/images/" + modelName + "/thumbnail";
  //         var fullpath200 =
  //             rootpath + "/assets/images/" + modelName + "/thumbnail/200";
  //         var fullpath300 =
  //             rootpath + "/assets/images/" + modelName + "/thumbnail/300";
  //         var fullpath500 =
  //             rootpath + "/assets/images/" + modelName + "/thumbnail/500";

  //         //Check image upload folder is exists or not. If not create all folders
  //         if (fs.existsSync(fullpath) == false) {
  //             fs.mkdirSync(fullpath);
  //             fs.mkdirSync(fullpaththumbnail);
  //             fs.mkdirSync(fullpath200);
  //             fs.mkdirSync(fullpath300);
  //             fs.mkdirSync(fullpath500);
  //         }

  //         req.file('data').upload({ maxBytes: 5000000, dirname: '../../assets/images' }, async (err, file) => {
  //             if (err) {
  //                 if (err.code == 'E_EXCEEDS_UPLOAD_LIMIT') {
  //                     return res.status(404).json({ "success": false, "error": { "code": 404, "message": "Please Select Image Below 5Mb" } });
  //                 }
  //             }
  //             let fullpath = []
  //             let resImagePath = []
  //             file.forEach(async (element, index) => {
  //                 var name = generateName()
  //                 typeArr = element.type.split("/");
  //                 fileExt = typeArr[1]
  //                 if ((fileExt === 'jpeg') || (fileExt === 'JPEG') || (fileExt === 'JPG') || (fileExt === 'jpg') || (fileExt === 'PNG') || (fileExt === 'png')) {
  //                     fs.readFile(file[index].fd, async (err, data) => {
  //                         if (err) {
  //                             return res.status(403).json({ "success": false, "error": { "code": 403, "message": err }, });
  //                         } else {
  //                             if (data) {
  //                                 var path = file[index].fd
  //                                 fs.writeFile('assets/images/' + modelName + '/' + name + '.' + fileExt, data, function (err, image) {
  //                                     if (err) {

  //                                         return res.status(400).json({ "success": false, "error": { "code": 400, "message": err }, });
  //                                     }
  //                                 })

  //                                 fullpath.push(name + '.' + fileExt)
  //                                 resImagePath.push('assets/images/' + modelName + '/' + name + '.' + fileExt)
  //                                 var thumbpath = 'assets/images/' + modelName + '/thumbnail/200/' + name + '.' + fileExt;
  //                                 sharp(path).resize({ height: 200, width: 200 }).toFile(thumbpath).then(function (newFileInfo) { })
  //                                     .catch(function (err) { //console.log("Got Error", err); });
  //                                 var thumbpath1 = 'assets/images/' + modelName + '/thumbnail/300/' + name + '.' + fileExt;
  //                                 var thumbpath2 = 'assets/images/' + modelName + '/thumbnail/500/' + name + '.' + fileExt;
  //                                 sharp(path).resize({ height: 300, width: 300 }).toFile(thumbpath1)
  //                                     .then(function (newFileInfo) { })
  //                                     .catch(function (err) { //console.log("Got Error", err); });
  //                                 sharp(path).resize({ height: 500, width: 500 }).toFile(thumbpath2)
  //                                     .then(function (newFileInfo) {
  //                                     }).catch(function (err) { //console.log("Got Error"); });

  //                                 await new Promise(resolve => setTimeout(resolve, 3000));

  //                                 if (index == file.length - 1) {
  //                                     return res.json({
  //                                         "success": true,
  //                                         "code": 200,
  //                                         "data": {
  //                                             "fullPath": resImagePath,
  //                                             "imagePath": fullpath,
  //                                         },
  //                                     });
  //                                 }
  //                             }
  //                         }
  //                     });//end of loop
  //                 } else {
  //                     return res.status(404).json({
  //                         "success": false,
  //                         "error": { "code": 400, "message": constantObj.messages.IVALID_FILE }
  //                     })
  //                 }

  //             })
  //         })
  //     } catch (err) {
  //
  //         return res.status(500).json({ "success": false, "error": { "code": 500, "message": "" + err } })
  //     }
  // },

  /**
     * 
      @param {} req 
      @param {} res 
     * @description Used to upload binary image using normal file uploader
     * 
     * 
     */

  //  uploadImage: async (req, res)=> {

  //     var modelName = req.param('modelName')
  //     try{

  //     req.file('file').upload({maxBytes: 5242880, dirname: '../../assets/images/'+modelName },async(err,file)=>{
  //         if (err) {
  //             if (err.code == 'E_EXCEEDS_UPLOAD_LIMIT') {
  //                 return res.status(404).json({ "success": false, "error": { "code": 404, "message": "Image size must be less than 5 MB" } });
  //             }
  //         }

  //         var responseData = {}
  //         file.forEach(async (element,index) => {
  //             var name = generateName()
  //             //console.log(element.fd)
  //             typeArr = element.type.split("/");
  //             fileExt = typeArr[1]

  //             if ((fileExt === 'jpeg') || (fileExt === 'JPEG') || (fileExt === 'JPG') || (fileExt === 'jpg') || (fileExt === 'PNG') || (fileExt === 'png')) {
  //                 fs.readFile(file[index].fd, async(err, data)=>{
  //                     if (err) {
  //                         return res.status(403).json({
  //                             "success": false,
  //                             "error": {
  //                                 "code": 403,
  //                                 "message": err
  //                             },
  //                         });
  //                     }else{

  //                         if (data) {
  //                             var path = file[index].fd
  //                             fs.writeFile( 'assets/images/'+modelName+ '/' + name +'.'+fileExt, data, function (err, image) {
  //                                 if (err) {
  //
  //                                     return res.status(400).json({
  //                                         "success": false,
  //                                         "error": {
  //                                             "code": 400,
  //                                             "message": err
  //                                         },
  //                                     });
  //                                 }

  //                             })
  //                             let avifPath =  'assets/images/'+modelName+'/avif/thumbnail/200/' + name +'.'+'avif'
  //                             let avifPath1 =  'assets/images/'+modelName+'/avif/thumbnail/300/' + name +'.'+'avif'
  //                             let avifPath2 =  'assets/images/'+modelName+'/avif/thumbnail/500/' + name +'.'+'avif'
  //                             responseData.avifPath  = avifPath
  //                             responseData.fullpath =  name+'.png'
  //                             responseData.imagePath = 'images/'+modelName+'/'  + name+'.'+fileExt
  //                             var pngThumbpath = 'assets/images/' + modelName + '/png/thumbnail/200/' + name + '.' + 'png';
  //                             var pngThumbpath1 = 'assets/images/' + modelName + '/png/thumbnail/200/' + name + '.' + 'png';
  //                             var pngThumbpath2 = 'assets/images/' + modelName + '/png/thumbnail/200/' + name + '.' + 'png';

  //                             sharp(path)
  //                             .resize({ height: 200, width: 200 })
  //                             .toFormat('heif', { quality: 30, compression: 'png' })
  //                             .toFile(pngThumbpath)
  //                             .then(info => //console.log());
  //                             sharp(path)
  //                             .resize({ height: 300, width: 300 })
  //                             .toFormat('heif', { quality: 30, compression: 'png' })
  //                             .toFile(pngThumbpath1)
  //                             .then(info => //console.log());
  //                             sharp(path)
  //                             .resize({ height: 500, width: 500 })
  //                             .toFormat('heif', { quality: 30, compression: 'png' })
  //                             .toFile(pngThumbpath2)
  //                             .then(info => //console.log());

  //                             sharp(path)
  //                             .resize({ height: 200, width: 200 })
  //                             .toFormat('heif', { quality: 30, compression: 'av1' })
  //                             .toFile(avifPath)
  //                             .then(info => //console.log());
  //                             sharp(path)
  //                             .resize({ height: 300, width: 300 })
  //                             .toFormat('heif', { quality: 30, compression: 'av1' })
  //                             .toFile(avifPath1)
  //                             .then(info => //console.log());
  //                             sharp(path)
  //                             .resize({ height: 500, width: 500 })
  //                             .toFormat('heif', { quality: 30, compression: 'av1' })
  //                             .toFile(avifPath2)
  //                             .then(info => //console.log());
  //                             if(index == file.length -1){
  //                                 await new Promise(resolve => setTimeout(resolve, 2000)); //Because file take times to write in .tmp folder
  //                                 fs.unlink(file[index].fd, function (err) {
  //                                     if (err) throw err;
  //                                     //console.log("File deleted");
  //                                 });
  //                                 return res.json({
  //                                     "success": true,
  //                                     "code":200,
  //                                     "data": responseData
  //                                 });

  //                             }

  //                         }

  //                     }
  //                 });//end of loop
  //             }else{
  //                 return res.status(404).json({
  //                     "success":false,
  //                     "error":{"code":404,"message":"Please upload a valid image file."}
  //                 })
  //             }

  //         })

  //      })
  // }catch(err){
  //
  //     return res.status(500).json({"success": false , "error":{"code":500,"message":""+err}})
  // }
  // },

  uploadMultiImages: async (req, res) => {
    try {
      // //console.log("In Upload Image");
      // var modelName = 'users';

      var modelName = req.query.modelName;
      if (!modelName || typeof modelName == undefined) {
        return res.status(404).json({
          success: false,
          error: { code: 404, message: 'Please Add Model Name' },
        });
      }
      req
        .file('data')
        .upload(
          { maxBytes: 5242880, dirname: '../../assets/images' },
          async (err, file) => {
            if (err) {
              if (err.code == 'E_EXCEEDS_UPLOAD_LIMIT') {
                return res.status(404).json({
                  success: false,
                  error: {
                    code: 404,
                    message: 'Image size msut be less than 5 MB',
                  },
                });
              }
            } else {
              let fullpath = [];
              let resImagePath = [];
              let pngPath = [];
              let aviPath = [];
              file.forEach(async (element, index) => {
                var name = generateName();
                typeArr = element.type.split('/');
                fileExt = typeArr[1];

                fs.readFile(file[index].fd, async (err, data) => {
                  if (err) {
                    return res.status(403).json({
                      success: false,
                      error: { code: 403, message: err },
                    });
                  } else {
                    if (data) {
                      var path = file[index].fd;
                      fs.writeFile(
                        'assets/images/' +
                          modelName +
                          '/' +
                          name +
                          '.' +
                          fileExt,
                        data,
                        function (err, image) {
                          if (err) {
                            return res.status(400).json({
                              success: false,
                              error: { code: 400, message: err },
                            });
                          }
                        }
                      );
                      let avifPath =
                        'assets/images/' +
                        modelName +
                        '/avif/thumbnail/200/' +
                        name +
                        '.' +
                        'avif';
                      let avifPath1 =
                        'assets/images/' +
                        modelName +
                        '/avif/thumbnail/300/' +
                        name +
                        '.' +
                        'avif';
                      let avifPath2 =
                        'assets/images/' +
                        modelName +
                        '/avif/thumbnail/500/' +
                        name +
                        '.' +
                        'avif';

                      // fullpath.push(name + '.' + fileExt)
                      fullpath.push(name + '.png');

                      resImagePath.push(
                        'assets/images/' +
                          modelName +
                          '/' +
                          name +
                          '.' +
                          fileExt
                      );
                      var pngImgPath =
                        'assets/images/' +
                        modelName +
                        '/png/' +
                        name +
                        '.' +
                        'png';
                      var avifImgPath =
                        'assets/images/' +
                        modelName +
                        '/avif/' +
                        name +
                        '.' +
                        'avif';
                      var pngThumbpath =
                        'assets/images/' +
                        modelName +
                        '/png/thumbnail/200/' +
                        name +
                        '.' +
                        'png';
                      var pngThumbpath1 =
                        'assets/images/' +
                        modelName +
                        '/png/thumbnail/200/' +
                        name +
                        '.' +
                        'png';
                      var pngThumbpath2 =
                        'assets/images/' +
                        modelName +
                        '/png/thumbnail/200/' +
                        name +
                        '.' +
                        'png';

                      sharp(path)
                        .png()
                        .toFile(pngImgPath)
                        .then((info) => console.log());
                      sharp(path)
                        .resize({ height: 200, width: 200 })
                        .png()
                        .toFile(pngThumbpath)
                        .then((info) => console.log());
                      sharp(path)
                        .resize({ height: 300, width: 300 })
                        .png()
                        .toFile(pngThumbpath1)
                        .then((info) => console.log());
                      sharp(path)
                        .resize({ height: 500, width: 500 })
                        .png()
                        .toFile(pngThumbpath2)
                        .then((info) => console.log());
                      sharp(path)
                        .toFormat('heif', { quality: 30, compression: 'av1' })
                        .toFile(avifImgPath)
                        .then((info) => console.log());
                      sharp(path)
                        .resize({ height: 200, width: 200 })
                        .toFormat('heif', { quality: 30, compression: 'av1' })
                        .toFile(avifPath)
                        .then((info) => console.log());
                      sharp(path)
                        .resize({ height: 300, width: 300 })
                        .toFormat('heif', { quality: 30, compression: 'av1' })
                        .toFile(avifPath1)
                        .then((info) => console.log());
                      sharp(path)
                        .resize({ height: 500, width: 500 })
                        .toFormat('heif', { quality: 30, compression: 'av1' })
                        .toFile(avifPath2)
                        .then((info) => console.log());

                      if (index == file.length - 1) {
                        await new Promise((resolve) =>
                          setTimeout(resolve, 6000)
                        );
                        return res.json({
                          success: true,
                          code: 200,
                          data: {
                            imagePath: fullpath,
                          },
                        });
                      }
                    }
                  }
                }); //end of loop
              });
            }
          }
        );
    } catch (err) {
      return res
        .status(500)
        .json({ success: false, error: { code: 500, message: '' + err } });
    }
  },
  changeStatus: function (req, res) {
    try {
      var modelName = req.param('model');
      var Model = sails.models[modelName];
      var itemId = req.param('id');
      var updated_status = req.param('status');

      let query = {};
      query.id = itemId;

      Model.findOne(query).exec(function (err, data) {
        if (err) {
          return res.json({
            success: false,
            error: {
              code: 400,
              message: constantObj.messages.DATABASE_ISSUE,
            },
          });
        } else {
          Model.update(
            {
              id: itemId,
            },
            {
              status: updated_status,
            },
            function (err, response) {
              if (err) {
                return res.json({
                  success: false,
                  error: {
                    code: 400,
                    message: '' + err,
                  },
                });
              } else {
                return res.json({
                  success: true,
                  code: 200,
                  message: constantObj.messages.STATUS_CHANGED,
                });
              }
            }
          );
        }
      });
    } catch (err) {
      return res
        .status(400)
        .json({ success: false, error: err, message: 'Server Error' });
    }
  },

  commonDelete: function (req, res) {
    try {
      var modelName = req.param('model');
      var Model = sails.models[modelName];
      var itemId = req.param('id');

      let query = {};
      query.id = itemId;

      Model.findOne(query).exec(async (err, data) => {
        if (err) {
          return res.json({
            success: false,
            error: {
              code: 400,
              message: constantObj.messages.DATABASE_ISSUE,
            },
          });
        } else {
          if (modelName == 'category') {
            const poll = await PollQuestions.find({ category: itemId });
            if (poll.length > 0) {
              return res.status(400).json({
                success: false,
                error: {
                  code: 400,
                  message: "Can't delete category as associated poll exist.",
                },
              });
            }
          }

          if (modelName == 'contacts') {
            Model.findOne({ id: itemId }).then((data) => {
              Model.update({ user_id: data.user_id }, { isDeleted: true }).then(
                (updated) => {}
              );
            });
          }
          Model.update(
            {
              id: itemId,
            },
            {
              isDeleted: true,
              deletedBy: req.identity.id,
              deletedAt: new Date(),
            },
            function (err, response) {
              if (err) {
                return res.json({
                  success: false,
                  error: {
                    code: 400,
                    message: constantObj.messages.DATABASE_ISSUE,
                  },
                });
              } else {
                return res.json({
                  success: true,
                  code: 200,
                  message: constantObj.messages.DELETE_SUCCESS,
                });
              }
            }
          );
        }
      });
    } catch (err) {
      return res
        .status(400)
        .json({ success: false, error: err, message: 'Server Error' });
    }
  },
  /**
   *
   * @param {*} req
   * @param {*} res
   * @description Used to hard delete records
   * @createdAt : 08/03/2022
   *
   */
  permanentDelete: async (req, res) => {
    try {
      var modelName = req.param('model');
      var Model = sails.models[modelName];
      var itemId = req.param('id');

      if (!modelName || !itemId) {
        return res.status(404).json({
          success: false,
          error: { code: 404, message: 'Keys missing from frontend' },
        });
      }

      let query = {};
      query.id = itemId;

      Model.findOne(query).exec(function (err, data) {
        if (err) {
          return res.status(400).json({
            success: false,
            error: {
              code: 400,
              message: '' + err,
            },
          });
        } else {
          Model.destroy({ id: itemId }).then((deleted) => {
            return res.status(200).json({
              success: true,
              message: constantObj.messages.HARD_DELETE,
            });
          });
        }
      });
    } catch (err) {
      return res
        .status(400)
        .json({ success: false, error: err, message: '' + err });
    }
  },

  /**
   *
   * @param {*} req
   * @param {*} res
   * @description Used to rollback softdelted records
   * @createdAt : 08/03/2022
   *
   */
  commonRollback: (req, res) => {
    try {
      var modelName = req.param('model');
      var Model = sails.models[modelName];
      var itemId = req.param('id');
      if (!modelName || !itemId) {
        return res.status(404).json({
          success: false,
          error: { code: 404, message: 'Keys missing from frontend' },
        });
      }

      let query = {};
      query.id = itemId;

      Model.findOne(query).exec(async (err, data) => {
        if (err) {
          return res.json({
            success: false,
            error: {
              code: 400,
              message: '' + err,
            },
          });
        } else {
          Model.update(
            {
              id: itemId,
            },
            {
              isDeleted: false,
            },
            (err, response) => {
              if (err) {
                return res.status(400).json({
                  success: false,
                  error: {
                    code: 400,
                    message: '' + err,
                  },
                });
              } else {
                return res.json({
                  success: true,
                  code: 200,
                  message: constantObj.messages.ROLLBACK_SUCCESS,
                });
              }
            }
          );
        }
      });
    } catch (err) {
      return res
        .status(400)
        .json({ success: false, error: err, message: '' + err });
    }
  },

  removeImage: (req, res) => {
    var Imagename = req.param('name');
    modelName = req.param('model');
    //console.log('In image remove');
    if (!modelName || !Imagename) {
      return res.status(404).json({
        success: false,
        error: { code: 404, message: 'Keys missing from frontend' },
      });
    }

    var thumbpath =
      'assets/images/' + modelName + '/thumbnail/200/' + Imagename;
    var thumbpath1 =
      'assets/images/' + modelName + '/thumbnail/300/' + Imagename;
    var thumbpath2 =
      'assets/images/' + modelName + '/thumbnail/500/' + Imagename;

    fs.unlink('assets/images/' + modelName + '/' + Imagename, function (err) {
      if (err) throw err;
    });
    fs.unlink(thumbpath, function (err) {
      if (err) throw err;
    });
    fs.unlink(thumbpath1, function (err) {
      if (err) throw err;
    });
    fs.unlink(thumbpath2, function (err) {
      if (err) throw err;
    });

    return res.json({
      success: true,
      message: 'image deleted successfully.',
    });
  },
}; // End of module export
/*function to decode base64 image*/
function decodeBase64Image(dataString) {
  var matches = dataString.match(/^data:([A-Za-z-+-.\/]+);base64,(.+)$/),
    response = {};
  if (matches) {
    if (matches.length !== 3) {
      return new Error('Invalid input string');
    }

    response.type = matches[1];
    response.data = new Buffer.from(matches[2], 'base64');
  } else {
    response.error = constantObj.messages.INVALID_IMAGE;
  }

  return response;
}

documentEmail = function (options) {
  var email = options.email;
  var firstName = options.firstName;

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
          <img src="` +
    constant.FRONT_WEB_URL +
    `assets/images/logo.png" style="margin-bottom:20px;  width=100px;" />
          <h2 style="` +
    style.hTitle +
    style.m0 +
    `">Document Email</h2>
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
    `margin-bottom:20px;font-weight: 600">New file added in smartcloze
    <br>
          
          </p>
        
      </div>
     
      <div class="footer" style="` +
    style.footer +
    `">
      &copy 2021 Smart Cloze  All rights reserved.
      </div>
    </div>`;

  SmtpController.sendEmail(email, 'Document email', message);
};
