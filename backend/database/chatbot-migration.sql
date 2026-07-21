/**
 * Chatbot Database Migration Script
 * Run this to update existing chatbot tables to support anonymous users
 * 
 * If tables don't exist yet, just run chatbot-schema.sql instead
 */

-- Drop old tables and constraints
BEGIN
  BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE CHATBOT_MESSAGES';
  EXCEPTION
    WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE CHATBOT_CONVERSATIONS';
  EXCEPTION
    WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE CHATBOT_USER_PREFERENCES';
  EXCEPTION
    WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE CHATBOT_LEARNING';
  EXCEPTION
    WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE CHATBOT_QUICK_RESPONSES';
  EXCEPTION
    WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    EXECUTE IMMEDIATE 'DROP SEQUENCE chatbot_conversation_seq';
  EXCEPTION
    WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    EXECUTE IMMEDIATE 'DROP SEQUENCE chatbot_message_seq';
  EXCEPTION
    WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    EXECUTE IMMEDIATE 'DROP SEQUENCE chatbot_learning_seq';
  EXCEPTION
    WHEN OTHERS THEN NULL;
  END;
END;
/

COMMIT;

-- Now run the main schema script
-- @chatbot-schema.sql
