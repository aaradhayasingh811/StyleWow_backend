const ApiResponse = (status, message, data) => {
    return {
        status: status || 200,
        message: message || "Success",
        data: data || null,
    };
}

module.exports = ApiResponse;
