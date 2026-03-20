from app.config.settings import Settings


class BaseService:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
