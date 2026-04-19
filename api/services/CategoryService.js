var constantObj = sails.config.constants;


module.exports = {
    saveCategory: async (data, context, req, res) => {
        if ((!data.name) || data.name == undefined) {
            return res.status(404).json({ "success": false, "error": { "code": 404, "message": constantObj.category.NAME_REQUIRED } });
        }
        data.name = data.name.toLowerCase()
        var category = await Category.findOne({ "name": data.name })

        if (category) {
            return res.status(404).json({ "success": false, "error": { "code": 404, "message": constantObj.category.ALREADY_EXIST } });
        } else {
            var createdCat = await Category.create(data).fetch()
            return res.status(200).json({
                "success": true,
                "message": constantObj.category.CATEGORY_CREATED
            })
        }
    },

    updateCategory: async (data, context, req, res) => {
        data.name = data.name.toLowerCase()
        var existedCategory = await Category.findOne({ name: data.name, id: { '!=': data.id}})
        if (existedCategory) {
            return res.status(404).json({ "success": false, "error": { "code": 404, "message": constantObj.category.ALREADY_EXIST } });
        } else {
            var updatedCat = await Category.update({ id: data.id }, data)
            return res.status(200).json({
                "success": true,
                "message": constantObj.category.CATEGORY_UPDATED
            })
        }

    }
}