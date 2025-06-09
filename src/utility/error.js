const ApiError = (message, statusCode) => {
    return {
        status: statusCode || 500,
        message: message || "Internal Server Error",
        data: null,
    };
}

module.exports = ApiError;
