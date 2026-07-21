# 🗄️ Chatbot Database Setup Guide

## Setup Steps

### Option 1: Fresh Installation (Recommended)

If you haven't created the chatbot tables yet:

```bash
sqlplus user/password@database @backend/database/chatbot-schema.sql
```

This creates all tables with support for:
- ✅ Registered users (numeric user ID from USERS table)
- ✅ Anonymous users (string ID like 'anon_xxx' or 'guest')

### Option 2: Update Existing Tables

If you already created chatbot tables and want to support anonymous users:

```bash
# Step 1: Run migration (drops old tables)
sqlplus user/password@database @backend/database/chatbot-migration.sql

# Step 2: Run new schema
sqlplus user/password@database @backend/database/chatbot-schema.sql
```

**Warning**: This will delete all existing chatbot data!

## Database Schema

### CHATBOT_CONVERSATIONS
```sql
CONVERSATION_ID    NUMBER (PK)
USER_ID            VARCHAR2(50)      -- Can be "123" (user) or "anon_xxx" (anonymous)
SESSION_TOKEN      VARCHAR2(100)
TOTAL_MESSAGES     NUMBER
LAST_MESSAGE_AT    TIMESTAMP
SATISFIED_FLAG     NUMBER (-1, 0, 1)
FEEDBACK_TEXT      VARCHAR2(1000)
CREATED_AT         TIMESTAMP
UPDATED_AT         TIMESTAMP
```

### CHATBOT_MESSAGES
```sql
MESSAGE_ID         NUMBER (PK)
CONVERSATION_ID    NUMBER (FK) → CHATBOT_CONVERSATIONS
USER_ID            VARCHAR2(50)
MESSAGE_TYPE       VARCHAR2(20)     -- 'user' or 'bot'
CONTENT            CLOB
INTENT             VARCHAR2(50)
CONFIDENCE_SCORE   NUMBER(3,2)
RESPONSE_TIME_MS   NUMBER
IS_HELPFUL         NUMBER (-1, 0, 1)
CREATED_AT         TIMESTAMP
```

### CHATBOT_USER_PREFERENCES
```sql
PREFERENCE_ID           NUMBER (PK)
USER_ID                 VARCHAR2(50)  -- For registered users only
CATEGORY_INTEREST       VARCHAR2(100)
PRICE_RANGE             VARCHAR2(50)
FAVORITE_AUTHORS        CLOB
INTERACTION_COUNT       NUMBER
LAST_INTEREST_UPDATE    TIMESTAMP
CREATED_AT              TIMESTAMP
UPDATED_AT              TIMESTAMP
```

### CHATBOT_LEARNING
```sql
LEARNING_ID        NUMBER (PK)
QUESTION_PATTERN   VARCHAR2(500)
CATEGORY           VARCHAR2(50)
RESPONSE_TEMPLATE  CLOB
FREQUENCY          NUMBER
AVERAGE_RATING     NUMBER(3,2)
IS_ACTIVE          NUMBER (0, 1)
CREATED_AT         TIMESTAMP
UPDATED_AT         TIMESTAMP
LAST_USED_AT       TIMESTAMP
```

### CHATBOT_QUICK_RESPONSES
```sql
RESPONSE_ID        NUMBER (PK)
TRIGGER_KEYWORDS   CLOB
RESPONSE_TEXT      CLOB
CATEGORY           VARCHAR2(50)
PRIORITY           NUMBER (1-10)
USAGE_COUNT        NUMBER
IS_ACTIVE          NUMBER (0, 1)
CREATED_AT         TIMESTAMP
UPDATED_AT         TIMESTAMP
```

## User ID Formats

### Registered Users
- Format: `"123"` (converted from numeric USER_ID)
- Origin: From USERS table
- Scope: Full chatbot features + preference tracking

### Anonymous Users
- Format: `"anon_1713398400000_a1b2c3d4e"` (timestamp + random)
- Origin: Generated on browser (stored in localStorage)
- Scope: Basic chatbot interaction, no preference tracking

### Guest User
- Format: `"guest"`
- Origin: Default if no user detected
- Scope: Basic chatbot interaction

## Troubleshooting

### Error: ORA-00942: table or view does not exist
**Solution**: Run the schema setup:
```bash
sqlplus user/password@database @backend/database/chatbot-schema.sql
```

### Error: User ID is not a number
**Solution**: This is expected! The new schema supports both:
- Numeric IDs for registered users
- String IDs for anonymous users

Backend automatically handles the conversion.

### Error: Foreign key constraint violation
**Solution**: Run the migration first:
```bash
sqlplus user/password@database @backend/database/chatbot-migration.sql
sqlplus user/password@database @backend/database/chatbot-schema.sql
```

## Verification

After setup, verify tables were created:

```sql
-- List chatbot tables
SELECT table_name FROM user_tables 
WHERE table_name LIKE 'CHATBOT%' 
ORDER BY table_name;

-- Expected output:
-- CHATBOT_CONVERSATIONS
-- CHATBOT_LEARNING
-- CHATBOT_MESSAGES
-- CHATBOT_QUICK_RESPONSES
-- CHATBOT_USER_PREFERENCES

-- Count sequences
SELECT sequence_name FROM user_sequences 
WHERE sequence_name LIKE 'CHATBOT%' 
ORDER BY sequence_name;

-- Expected output:
-- CHATBOT_CONVERSATION_SEQ
-- CHATBOT_LEARNING_SEQ
-- CHATBOT_MESSAGE_SEQ
```

## Performance Optimization

Indexes are automatically created:
- `idx_conversation_user` - Fast user lookup
- `idx_message_conversation` - Message retrieval
- `idx_message_user` - User message filtering
- `idx_message_intent` - Analytics
- `idx_message_created` - Time-based queries
- `idx_learning_category` - FAQ lookup
- `idx_quick_response_category` - Quick response lookup

For large datasets (>1M messages), consider adding:
```sql
-- Composite index for common queries
CREATE INDEX idx_message_conv_type ON CHATBOT_MESSAGES(CONVERSATION_ID, MESSAGE_TYPE);

-- For analytics
CREATE INDEX idx_message_intent_helpful ON CHATBOT_MESSAGES(INTENT, IS_HELPFUL);
```

## Data Retention Policy

Recommended retention:
- Active conversations: Keep indefinitely
- Old conversations (>1 year): Archive to separate schema
- Learning data: Keep for continuous improvement
- User preferences: Update on each interaction

Example archival query:
```sql
-- Archive old conversations (optional)
INSERT INTO CHATBOT_CONVERSATIONS_ARCHIVE
SELECT * FROM CHATBOT_CONVERSATIONS
WHERE UPDATED_AT < TRUNC(SYSDATE) - 365;

DELETE FROM CHATBOT_CONVERSATIONS
WHERE UPDATED_AT < TRUNC(SYSDATE) - 365;
```

## Backup Strategy

```bash
# Export chatbot data
expdp user/password@database \
  DIRECTORY=backup_dir \
  DUMPFILE=chatbot_backup.dmp \
  TABLES=CHATBOT_CONVERSATIONS,CHATBOT_MESSAGES,CHATBOT_LEARNING,CHATBOT_USER_PREFERENCES,CHATBOT_QUICK_RESPONSES

# Import chatbot data
impdp user/password@database \
  DIRECTORY=backup_dir \
  DUMPFILE=chatbot_backup.dmp
```

---

**Last Updated**: April 17, 2024  
**Version**: 1.0  
**Status**: Production Ready ✅
