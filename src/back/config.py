from datetime import timedelta

# Security
SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Database
SQLALCHEMY_DATABASE_URL = "sqlite:///./voting.db" 