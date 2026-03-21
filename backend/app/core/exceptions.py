class AppException(Exception):
    def __init__(self, message: str = "An error occurred", status_code: int = 500) -> None:
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class NotFoundException(AppException):
    def __init__(self, message: str = "Resource not found") -> None:
        super().__init__(message=message, status_code=404)


class BadRequestException(AppException):
    def __init__(self, message: str = "Bad request") -> None:
        super().__init__(message=message, status_code=400)


class UnauthorizedException(AppException):
    def __init__(self, message: str = "Unauthorized") -> None:
        super().__init__(message=message, status_code=401)


class BadGatewayException(AppException):
    def __init__(self, message: str = "Bad gateway") -> None:
        super().__init__(message=message, status_code=502)
