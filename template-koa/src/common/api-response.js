class ApiResponse {
    constructor(data, status) {
        this.data = data;
        this.status = status || 200;
    }
}

ApiResponse.ok = function (data) {
    return new ApiResponse(data);
}

module.exports = ApiResponse;
