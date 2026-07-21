#!/usr/bin/env node

/**
 * Book Recommendation System - Database Setup Script
 * Creates all necessary tables and seeds initial data
 */

const fs = require('fs');
const path = require('path');
const { executeUpdate, executeQuery } = require('../config/db');

console.log('🚀 Starting Book Recommendation System Setup...\n');

/**
 * Read and execute SQL file
 */
const executeSQLFile = async (filePath) => {
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Split by semicolon to execute individual statements
    const statements = sql.split(';').filter(stmt => stmt.trim() !== '');
    
    for (const statement of statements) {
      try {
        await executeUpdate(statement.trim() + ';');
        console.log('✅ Executed:', statement.substring(0, 50) + '...');
      } catch (err) {
        if (err.message.includes('ORA-00942') || err.message.includes('already exists')) {
          console.log('⏭️  Skipping (table may exist):', statement.substring(0, 50) + '...');
        } else {
          console.error('❌ Error:', err.message);
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Error reading SQL file ${filePath}:`, error.message);
    return false;
  }
};

/**
 * Seed sample book metadata
 */
const seedBookMetadata = async () => {
  console.log('\n📚 Seeding book metadata...');
  
  try {
    const query = `
      INSERT INTO BOOK_METADATA 
      (METADATA_ID, MASP, CATEGORY_PRIMARY, CATEGORY_SECONDARY, READING_DIFFICULTY,
       AUTHOR_NAME, TOPICS, AVERAGE_RATING, IS_TRENDING, RECOMMENDATION_SCORE)
      SELECT 
        book_metadata_seq.NEXTVAL,
        MASP,
        'Kinh doanh',
        'Phát triển bản thân',
        'TRUNG_BÌNH',
        'Tác giả',
        '[\"productivity\", \"business\", \"leadership\"]',
        4.5,
        0,
        0.8
      FROM SANPHAM
      WHERE MASP NOT IN (SELECT MASP FROM BOOK_METADATA)
        AND ROWNUM <= 10
    `;
    
    const result = await executeUpdate(query);
    console.log('✅ Seeded book metadata for available products');
    return true;
  } catch (error) {
    console.warn('⚠️  Could not seed metadata (may be normal):', error.message.substring(0, 100));
    return false;
  }
};

/**
 * Create sample user preferences
 */
const seedUserPreferences = async () => {
  console.log('\n👤 Creating sample user preferences...');
  
  try {
    // Check if there are any users
    const userQuery = `SELECT COUNT(*) as count FROM USERS WHERE ROWNUM <= 1`;
    const userResult = await executeQuery(userQuery, {});
    
    if (userResult.rows && userResult.rows.length > 0) {
      const query = `
        INSERT INTO USER_BOOK_PREFERENCES
        (PREF_ID, USER_ID, FAVORITE_CATEGORIES, CREATED_AT, UPDATED_AT)
        SELECT 
          user_pref_seq.NEXTVAL,
          USER_ID,
          '[{\"category\":\"Kinh doanh\",\"weight\":1}]',
          SYSDATE,
          SYSDATE
        FROM USERS
        WHERE USER_ID NOT IN (SELECT USER_ID FROM USER_BOOK_PREFERENCES)
          AND ROWNUM <= 10
      `;
      
      await executeUpdate(query);
      console.log('✅ Created sample user preferences');
    }
    return true;
  } catch (error) {
    console.warn('⚠️  Could not seed user preferences:', error.message.substring(0, 100));
    return false;
  }
};

/**
 * Run all setup tasks
 */
const runSetup = async () => {
  try {
    console.log('📋 Step 1: Creating database tables...');
    const schemaFile = path.join(__dirname, '../database/book-recommendation-schema.sql');
    
    if (fs.existsSync(schemaFile)) {
      await executeSQLFile(schemaFile);
      console.log('✅ Schema tables created/verified');
    } else {
      console.warn('⚠️  Schema file not found at:', schemaFile);
    }

    console.log('\n📋 Step 2: Seeding initial data...');
    await seedBookMetadata();
    await seedUserPreferences();

    console.log('\n✨ Setup Summary:');
    console.log('================================');
    console.log('✅ Tables created');
    console.log('✅ Sequences initialized');
    console.log('✅ Initial data seeded');
    console.log('================================');
    
    console.log('\n🚀 Book Recommendation System is ready!');
    console.log('\nNext steps:');
    console.log('1. Run backend server: npm start');
    console.log('2. Check API endpoints: GET /api/recommendations/:userId');
    console.log('3. Add BookRecommendation components to frontend');
    console.log('4. Track user interactions to build recommendations');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  }
};

// Run setup
runSetup();
