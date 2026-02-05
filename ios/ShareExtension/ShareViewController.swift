import UIKit
import Social
import MobileCoreServices
import UniformTypeIdentifiers
import SQLite3

class ShareViewController: UIViewController {

    private let appGroupIdentifier = "group.com.clibber.shared"
    private let databaseName = "clibber.db"

    private var containerView: UIView!
    private var messageLabel: UILabel!
    private var checkmarkView: UIImageView!

    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        handleSharedContent()
    }

    private func setupUI() {
        view.backgroundColor = UIColor.black.withAlphaComponent(0.4)

        containerView = UIView()
        containerView.backgroundColor = .white
        containerView.layer.cornerRadius = 16
        containerView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(containerView)

        checkmarkView = UIImageView()
        checkmarkView.image = UIImage(systemName: "checkmark.circle.fill")
        checkmarkView.tintColor = .systemGreen
        checkmarkView.contentMode = .scaleAspectFit
        checkmarkView.translatesAutoresizingMaskIntoConstraints = false
        checkmarkView.alpha = 0
        containerView.addSubview(checkmarkView)

        messageLabel = UILabel()
        messageLabel.text = "Saving..."
        messageLabel.textAlignment = .center
        messageLabel.font = .systemFont(ofSize: 17, weight: .medium)
        messageLabel.textColor = .label
        messageLabel.translatesAutoresizingMaskIntoConstraints = false
        containerView.addSubview(messageLabel)

        NSLayoutConstraint.activate([
            containerView.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            containerView.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            containerView.widthAnchor.constraint(equalToConstant: 200),
            containerView.heightAnchor.constraint(equalToConstant: 120),

            checkmarkView.centerXAnchor.constraint(equalTo: containerView.centerXAnchor),
            checkmarkView.topAnchor.constraint(equalTo: containerView.topAnchor, constant: 20),
            checkmarkView.widthAnchor.constraint(equalToConstant: 44),
            checkmarkView.heightAnchor.constraint(equalToConstant: 44),

            messageLabel.centerXAnchor.constraint(equalTo: containerView.centerXAnchor),
            messageLabel.topAnchor.constraint(equalTo: checkmarkView.bottomAnchor, constant: 12),
            messageLabel.leadingAnchor.constraint(equalTo: containerView.leadingAnchor, constant: 16),
            messageLabel.trailingAnchor.constraint(equalTo: containerView.trailingAnchor, constant: -16)
        ])
    }

    private func handleSharedContent() {
        guard let extensionItem = extensionContext?.inputItems.first as? NSExtensionItem,
              let attachments = extensionItem.attachments else {
            showError("No content to share")
            return
        }

        for attachment in attachments {
            if attachment.hasItemConformingToTypeIdentifier(UTType.plainText.identifier) {
                attachment.loadItem(forTypeIdentifier: UTType.plainText.identifier, options: nil) { [weak self] (item, error) in
                    DispatchQueue.main.async {
                        if let text = item as? String {
                            self?.saveToDatabase(content: text)
                        } else {
                            self?.showError("Could not read text")
                        }
                    }
                }
                return
            } else if attachment.hasItemConformingToTypeIdentifier(UTType.url.identifier) {
                attachment.loadItem(forTypeIdentifier: UTType.url.identifier, options: nil) { [weak self] (item, error) in
                    DispatchQueue.main.async {
                        if let url = item as? URL {
                            self?.saveToDatabase(content: url.absoluteString)
                        } else {
                            self?.showError("Could not read URL")
                        }
                    }
                }
                return
            }
        }

        showError("Unsupported content type")
    }

    private func saveToDatabase(content: String) {
        guard let containerURL = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroupIdentifier) else {
            showError("Could not access app group")
            return
        }

        let databasePath = containerURL.appendingPathComponent(databaseName).path
        var db: OpaquePointer?

        if sqlite3_open(databasePath, &db) != SQLITE_OK {
            showError("Could not open database")
            return
        }

        defer {
            sqlite3_close(db)
        }

        // Create table if it doesn't exist
        let createTableSQL = """
            CREATE TABLE IF NOT EXISTS clipboard_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                content TEXT NOT NULL,
                content_preview TEXT,
                created_at INTEGER NOT NULL,
                is_favorite INTEGER DEFAULT 0,
                source TEXT DEFAULT 'share'
            );
            """

        if sqlite3_exec(db, createTableSQL, nil, nil, nil) != SQLITE_OK {
            showError("Could not create table")
            return
        }

        // Check for duplicate (most recent item)
        let checkDuplicateSQL = "SELECT content FROM clipboard_items ORDER BY created_at DESC LIMIT 1"
        var checkStmt: OpaquePointer?

        if sqlite3_prepare_v2(db, checkDuplicateSQL, -1, &checkStmt, nil) == SQLITE_OK {
            if sqlite3_step(checkStmt) == SQLITE_ROW {
                if let existingContent = sqlite3_column_text(checkStmt, 0) {
                    let existingString = String(cString: existingContent)
                    if existingString == content {
                        sqlite3_finalize(checkStmt)
                        showSuccess("Already saved")
                        return
                    }
                }
            }
        }
        sqlite3_finalize(checkStmt)

        // Insert new item
        let trimmedContent = content.trimmingCharacters(in: .whitespacesAndNewlines)
        let preview = generatePreview(content: trimmedContent)
        let timestamp = Int64(Date().timeIntervalSince1970 * 1000)

        let insertSQL = "INSERT INTO clipboard_items (content, content_preview, created_at, source) VALUES (?, ?, ?, 'share')"
        var insertStmt: OpaquePointer?

        if sqlite3_prepare_v2(db, insertSQL, -1, &insertStmt, nil) == SQLITE_OK {
            sqlite3_bind_text(insertStmt, 1, trimmedContent, -1, nil)
            sqlite3_bind_text(insertStmt, 2, preview, -1, nil)
            sqlite3_bind_int64(insertStmt, 3, timestamp)

            if sqlite3_step(insertStmt) == SQLITE_DONE {
                sqlite3_finalize(insertStmt)
                showSuccess("Saved to Clibber")
            } else {
                sqlite3_finalize(insertStmt)
                showError("Could not save")
            }
        } else {
            showError("Database error")
        }
    }

    private func generatePreview(content: String) -> String {
        let singleLine = content.components(separatedBy: .whitespacesAndNewlines)
            .filter { !$0.isEmpty }
            .joined(separator: " ")

        if singleLine.count <= 100 {
            return singleLine
        }

        return String(singleLine.prefix(100)) + "..."
    }

    private func showSuccess(_ message: String) {
        messageLabel.text = message

        UIView.animate(withDuration: 0.3) {
            self.checkmarkView.alpha = 1
        } completion: { _ in
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) {
                self.dismiss()
            }
        }
    }

    private func showError(_ message: String) {
        checkmarkView.image = UIImage(systemName: "xmark.circle.fill")
        checkmarkView.tintColor = .systemRed
        checkmarkView.alpha = 1
        messageLabel.text = message

        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            self.dismiss()
        }
    }

    private func dismiss() {
        extensionContext?.completeRequest(returningItems: nil, completionHandler: nil)
    }
}
