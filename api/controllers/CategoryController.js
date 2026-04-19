/**
 * CategoryController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
const db = sails.getDatastore().manager;

module.exports = {
  /**
   * 
   * @param {*} req.body 
   * @param {*} res 
   * @returns success
   * @description: Used to save the categories 
   * @createdBy jcsoftwaresolution
   */


  saveCategory: (req, res) => {
    API(CategoryService.saveCategory, req, res);
  },

  /**
   * 
   * @param {*} req.body 
   * @param {*} res 
   * @returns success
   * @description: Used to save the categories
   * @createdBy jcsoftwaresolution
   */


  updateCategory: (req, res) => {
    API(CategoryService.updateCategory, req, res);
  },

  /**
  * 
  * @param {*} {id:""} 
  * @param {*} res 
  * @returns success
  * @description: Used to get detail of categories
  * @createdBy jcsoftwaresolution
  */

  categoryDetail: async (req, res) => {
    var id = req.param('id')
    var category = await Category.findOne({ id: id }).populate('parentCategory')
    return res.status(200).json({
      "success": true,
      "data": category
    })
  },

  categoryListing: (req, res) => {
    var page = req.param('page');
    var count = req.param('count');
    var search = req.param('search');
    var sortBy = req.param('sortBy');
    var status = req.param('status');
    var type = req.param('type')
    var isDeleted = req.param('isDeleted');

    if (sortBy) {
      sortBy = sortBy.toString();
    } else {
      sortBy = 'createdAt desc';
    }

    if (page == undefined || !page) { page = 1 }
    if (count == undefined || !count) { count = 5 }
    var skipNo = (page - 1) * count;

    let query = {}
    query.isDeleted = false


    if (search) {

      query.$or = [
        { name: { $regex: search, '$options': 'i' } },
        { parent_category: { $regex: search, '$options': 'i' } },
      ]

    }

    if (status) {
      query.status = status
    }
    if (type) {
      query.type = type
    }

    if (isDeleted) {
      if (isDeleted === 'true') {
        isDeleted = true;
      } else {
        isDeleted = false;
      }
      query.isDeleted = isDeleted;
    }
    db.collection('category').aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'deletedBy',
          foreignField: '_id',
          as: "deletedBy"
        }
      },
      {
        $unwind: {
          path: '$deletedBy',
          preserveNullAndEmptyArrays: true
        }
      },

      {
        $lookup: {
          from: 'category',
          localField: 'parentCategory',
          foreignField: '_id',
          as: "parentCategory"
        }
      },
      {
        $unwind: {
          path: '$parentCategory',
          preserveNullAndEmptyArrays: true
        }
      },

      {
        $project: {
          name: "$name",
          parentCategory:"$parentCategory",
          type: "$type",
          imgae: "$imgae",
          status: "$status",
          createdAt: "$createdAt",
          isDeleted: "$isDeleted",
          deletedBy: "$deletedBy.fullName",
          deletedAt: '$deletedAt'
        }
      },
      {
        $match: query
      },
    ]).toArray((err, totalResult) => {

      db.collection('category').aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'deletedBy',
            foreignField: '_id',
            as: "deletedBy"
          }
        },
        {
          $unwind: {
            path: '$deletedBy',
            preserveNullAndEmptyArrays: true
          }
        },

        {
          $lookup: {
            from: 'category',
            localField: 'parentCategory',
            foreignField: '_id',
            as: "parentCategory"
          }
        },
        {
          $unwind: {
            path: '$parentCategory',
            preserveNullAndEmptyArrays: true
          }
        },

        {
          $project: {
            name: "$name",
            parentCategory:"$parentCategory",
            imgae: "$imgae",
            type: "$type",
            status: "$status",
            createdAt: "$createdAt",
            isDeleted: "$isDeleted",
            deletedBy: "$deletedBy.fullName",
            deletedAt: '$deletedAt'

          }
        },
        {
          $match: query
        },
        {
          $sort: {
            createdAt: -1
          }
        },

        {
          $skip: Number(skipNo)
        },
        {
          $limit: Number(count)
        }
      ]).toArray((err, result) => {
        return res.status(200).json({
          "success": true,
          "code": 200,
          "data": result,
          "total": totalResult.length,
        });
      })

    })

  },

  /**
* 
* @param {*} {id:""} 
* @param {*} res 
* @returns success
* @description: Used to delete categoroy
* @createdBy jcsoftwaresolution
*/

  deleteCategory: async (req, res) => {
    var id = req.param('id')

    var deletedCat = await Category.update({ id: id }, { isDeleted: true })
    return res.status(200).json({
      "success": true,
      "message": "Category deleted successfully."
    })
  },

  /**
* 
* @param {*} {id:""} 
* @param {*} res 
* @returns success
* @description: Used to get categories for dropdown
* @createdBy jcsoftwaresolution
*/

  categoryDropdown: async (req, res) => {
    try {
      const data = await Category.find({ isDeleted: false, parentCategory:null }).sort('name ASC')
      return res.status(200).json({
        "success": true,
        "data": data
      })
    } catch (err) {
      return res.status(400).json({
        "success": false,
        "error": { "code": 400, "message": "" + err }
      })
    }
  },

    /**
* 
* @param {*} {id:""} 
* @param {*} res 
* @returns success
* @description: Used to get categories for dropdown
* @createdBy jcsoftwaresolution
*/

subcategoryDropdown: async (req, res) => {
  try {
    const id = req.param('id')
    if(!id){
      return res.status(404).json({
        "success":false,
        "error":{
          "code":404,
          "message": "Id required"
        }
      })
    }
    const data = await Category.find({ isDeleted: false, parentCategory:id }).sort('name ASC')
    return res.status(200).json({
      "success": true,
      "data": data
    })
  } catch (err) {
    return res.status(400).json({
      "success": false,
      "error": { "code": 400, "message": "" + err }
    })
  }
}
};

