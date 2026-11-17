function validateBody(schema) {
    return function (req, res, next) {
        const result = schema.safeParse(req.body);
        if (result.success) {
            req.validatedBody = result.data;
            next();
        } else {
            return res.status(400).json({
                errors: result.error.issues
            });
        }
    };
}

module.exports = validateBody;