use super::types::MCPServerConfig;
use crate::database::{Database, DbError};
use rusqlite::params;

impl Database {
    pub fn create_mcp_tables(&self) -> Result<(), DbError> {
        let conn = self.conn.lock().map_err(|_| DbError::Lock)?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS mcp_servers (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                server_url TEXT NOT NULL,
                oauth_client_id TEXT,
                oauth_client_secret TEXT,
                enabled BOOLEAN NOT NULL DEFAULT 0,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL
            )",
            [],
        )?;

        Ok(())
    }

    pub fn save_mcp_server(&self, config: &MCPServerConfig) -> Result<(), DbError> {
        let conn = self.conn.lock().map_err(|_| DbError::Lock)?;

        conn.execute(
            "INSERT OR REPLACE INTO mcp_servers
             (id, name, server_url, oauth_client_id, oauth_client_secret, enabled, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![
                config.id,
                config.name,
                config.server_url,
                config.oauth_client_id,
                config.oauth_client_secret,
                config.enabled,
                config.created_at,
                config.updated_at,
            ],
        )?;
        Ok(())
    }

    pub fn get_mcp_servers(&self) -> Result<Vec<MCPServerConfig>, DbError> {
        let conn = self.conn.lock().map_err(|_| DbError::Lock)?;

        let mut stmt = conn.prepare(
            "SELECT id, name, server_url, oauth_client_id, oauth_client_secret, enabled, created_at, updated_at
             FROM mcp_servers ORDER BY name"
        )?;

        let server_iter = stmt.query_map([], |row| {
            Ok(MCPServerConfig {
                id: row.get(0)?,
                name: row.get(1)?,
                server_url: row.get(2)?,
                oauth_client_id: row.get(3)?,
                oauth_client_secret: row.get(4)?,
                enabled: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        })?;

        let mut servers = Vec::new();
        for server in server_iter {
            servers.push(server?);
        }
        Ok(servers)
    }

    pub fn get_mcp_server(&self, id: &str) -> Result<Option<MCPServerConfig>, DbError> {
        let conn = self.conn.lock().map_err(|_| DbError::Lock)?;

        let mut stmt = conn.prepare(
            "SELECT id, name, server_url, oauth_client_id, oauth_client_secret, enabled, created_at, updated_at
             FROM mcp_servers WHERE id = ?1"
        )?;

        let mut server_iter = stmt.query_map([id], |row| {
            Ok(MCPServerConfig {
                id: row.get(0)?,
                name: row.get(1)?,
                server_url: row.get(2)?,
                oauth_client_id: row.get(3)?,
                oauth_client_secret: row.get(4)?,
                enabled: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        })?;

        match server_iter.next() {
            Some(server) => Ok(Some(server?)),
            None => Ok(None),
        }
    }

    pub fn delete_mcp_server(&self, id: &str) -> Result<(), DbError> {
        let conn = self.conn.lock().map_err(|_| DbError::Lock)?;

        conn.execute(
            "DELETE FROM mcp_servers WHERE id = ?1",
            params![id],
        )?;
        Ok(())
    }

    pub fn update_mcp_server_enabled(&self, id: &str, enabled: bool) -> Result<(), DbError> {
        let conn = self.conn.lock().map_err(|_| DbError::Lock)?;

        conn.execute(
            "UPDATE mcp_servers SET enabled = ?1, updated_at = ?2 WHERE id = ?3",
            params![enabled, chrono::Utc::now().to_rfc3339(), id],
        )?;
        Ok(())
    }
}