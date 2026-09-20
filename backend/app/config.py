"""
PrintStation — Configuration.

All settings are loaded from environment variables.
Uses pydantic-settings for validation and type coercion.
"""

from pathlib import Path
from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings, loaded from .env file or environment."""

    # Database
    database_url: str = "postgresql://postgres:postgres@localhost:5432/printstation"

    # File storage
    upload_dir: Path = Path("./uploads")
    ai_output_dir: Path = Path("./ai_output")

    # Frontend (CORS)
    frontend_url: str = "http://localhost:5173"

    # AI
    gemini_api_key: str = ""  # Empty = simulation mode

    # Payment
    paymob_api_key: str = ""  # Empty = simulated payments
    paymob_integration_id: str = ""
    paymob_hmac_secret: str = ""

    # Auth
    clerk_secret_key: str = ""  # Empty = anonymous mode
    clerk_webhook_secret: str = ""

    # Kiosk auth
    kiosk_api_keys: str = "test-kiosk-key-dev"  # Comma-separated

    # App
    debug: bool = True
    max_upload_size_mb: int = 50
    max_pages: int = 500
    pickup_code_expiry_hours: int = 24

    # Pricing (EGP)
    price_bw_per_page: float = 1.25
    price_color_per_page: float = 3.50
    price_ai_fee: float = 2.00
    price_minimum: float = 3.00

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

    @property
    def kiosk_api_key_list(self) -> list[str]:
        """Parse comma-separated kiosk API keys into a list."""
        return [k.strip() for k in self.kiosk_api_keys.split(",") if k.strip()]

    @property
    def max_upload_size_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024

    @property
    def is_ai_enabled(self) -> bool:
        return bool(self.gemini_api_key)

    @property
    def is_payment_live(self) -> bool:
        return bool(self.paymob_api_key)

    @property
    def is_auth_enabled(self) -> bool:
        return bool(self.clerk_secret_key)


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance. Call this instead of Settings() directly."""
    return Settings()
