
from app.core.security.jwt import create_access_token, create_refresh_token

access = create_access_token(1)

refresh = create_refresh_token(1)

print("access:", access)
print("refresh:", refresh)
