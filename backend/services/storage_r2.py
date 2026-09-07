"""
Cloudflare R2 Object Storage Integration.

Provides S3-compatible cloud storage for student PDF uploads and AI output files.
Cloudflare R2 gives 10GB free permanent storage with zero bandwidth fees.
"""
import os
import io
import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger("printstation.r2")

# Cloudflare R2 Credentials
R2_ACCOUNT_ID = os.getenv("R2_ACCOUNT_ID")
R2_ACCESS_KEY_ID = os.getenv("R2_ACCESS_KEY_ID")
R2_SECRET_ACCESS_KEY = os.getenv("R2_SECRET_ACCESS_KEY")
R2_BUCKET_NAME = os.getenv("R2_BUCKET_NAME", "printstation-files")

_s3_client = None


def is_r2_enabled() -> bool:
    """Check if Cloudflare R2 is configured."""
    return bool(R2_ACCOUNT_ID and R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY and R2_BUCKET_NAME)


def _get_s3_client():
    """Lazily initialize boto3 S3 client for Cloudflare R2."""
    global _s3_client
    if _s3_client is not None:
        return _s3_client

    if not is_r2_enabled():
        return None

    try:
        import boto3
        from botocore.config import Config

        endpoint_url = f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
        _s3_client = boto3.client(
            service_name="s3",
            endpoint_url=endpoint_url,
            aws_access_key_id=R2_ACCESS_KEY_ID,
            aws_secret_access_key=R2_SECRET_ACCESS_KEY,
            region_name="auto",
            config=Config(signature_version="s3v4"),
        )
        logger.info(f"Connected to Cloudflare R2 bucket: {R2_BUCKET_NAME}")
        return _s3_client
    except Exception as e:
        logger.error(f"Failed to initialize Cloudflare R2 client: {e}")
        return None


def upload_to_r2(data: bytes, key: str, content_type: str = "application/pdf") -> bool:
    """
    Upload raw bytes to Cloudflare R2.
    
    Args:
        data: File binary content
        key: Storage key (e.g. 'uploads/abc1234.pdf')
        content_type: MIME type
    """
    client = _get_s3_client()
    if not client:
        return False

    try:
        client.put_object(
            Bucket=R2_BUCKET_NAME,
            Key=key,
            Body=data,
            ContentType=content_type,
        )
        logger.info(f"Uploaded {key} to Cloudflare R2")
        return True
    except Exception as e:
        logger.error(f"Failed to upload {key} to Cloudflare R2: {e}")
        return False


def download_from_r2(key: str, dest_path: str) -> bool:
    """
    Download file from Cloudflare R2 to a local destination path.
    
    Args:
        key: Storage key in bucket
        dest_path: Local filesystem destination
    """
    client = _get_s3_client()
    if not client:
        return False

    try:
        Path(dest_path).parent.mkdir(parents=True, exist_ok=True)
        client.download_file(R2_BUCKET_NAME, key, dest_path)
        logger.info(f"Downloaded {key} from Cloudflare R2 to {dest_path}")
        return True
    except Exception as e:
        logger.error(f"Failed to download {key} from Cloudflare R2: {e}")
        return False


def delete_from_r2(key: str) -> bool:
    """Delete a file from Cloudflare R2."""
    client = _get_s3_client()
    if not client:
        return False

    try:
        client.delete_object(Bucket=R2_BUCKET_NAME, Key=key)
        logger.info(f"Deleted {key} from Cloudflare R2")
        return True
    except Exception as e:
        logger.error(f"Failed to delete {key} from Cloudflare R2: {e}")
        return False
