package com.clibber

import android.content.Intent
import android.database.sqlite.SQLiteDatabase
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import java.io.File

class ShareActivity : AppCompatActivity() {

    private val databaseName = "clibber.db"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        handleIntent(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleIntent(intent)
    }

    private fun handleIntent(intent: Intent?) {
        if (intent?.action == Intent.ACTION_SEND && intent.type?.startsWith("text/") == true) {
            intent.getStringExtra(Intent.EXTRA_TEXT)?.let { sharedText ->
                saveToDatabase(sharedText.trim())
            } ?: run {
                showToast("No text to save")
                finish()
            }
        } else {
            showToast("Unsupported content")
            finish()
        }
    }

    private fun saveToDatabase(content: String) {
        if (content.isEmpty()) {
            showToast("Empty content")
            finish()
            return
        }

        try {
            val dbFile = File(filesDir, databaseName)
            val database = SQLiteDatabase.openOrCreateDatabase(dbFile, null)

            // Create table if it doesn't exist
            database.execSQL("""
                CREATE TABLE IF NOT EXISTS clipboard_items (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    content TEXT NOT NULL,
                    content_preview TEXT,
                    created_at INTEGER NOT NULL,
                    is_favorite INTEGER DEFAULT 0,
                    source TEXT DEFAULT 'share'
                )
            """.trimIndent())

            // Check for duplicate (most recent item)
            val cursor = database.rawQuery(
                "SELECT content FROM clipboard_items ORDER BY created_at DESC LIMIT 1",
                null
            )

            if (cursor.moveToFirst()) {
                val existingContent = cursor.getString(0)
                if (existingContent == content) {
                    cursor.close()
                    database.close()
                    showToast("Already saved")
                    finish()
                    return
                }
            }
            cursor.close()

            // Generate preview
            val preview = generatePreview(content)
            val timestamp = System.currentTimeMillis()

            // Insert new item
            database.execSQL(
                "INSERT INTO clipboard_items (content, content_preview, created_at, source) VALUES (?, ?, ?, 'share')",
                arrayOf(content, preview, timestamp)
            )

            database.close()
            showToast("Saved to Clibber")

        } catch (e: Exception) {
            e.printStackTrace()
            showToast("Failed to save")
        }

        finish()
    }

    private fun generatePreview(content: String): String {
        val singleLine = content
            .split(Regex("\\s+"))
            .filter { it.isNotEmpty() }
            .joinToString(" ")

        return if (singleLine.length <= 100) {
            singleLine
        } else {
            singleLine.take(100) + "..."
        }
    }

    private fun showToast(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
    }
}
