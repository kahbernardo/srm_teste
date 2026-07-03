-- Initialize database
-- This file is executed automatically by docker-compose on container startup

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Grant permissions to the user
GRANT ALL PRIVILEGES ON DATABASE srm_credit_engine TO srm_user;

-- Note: Tables will be created via Prisma migrations
-- This file is just for initial setup and extensions
