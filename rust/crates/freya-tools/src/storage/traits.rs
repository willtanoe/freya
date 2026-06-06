//! MemoryBackend trait for all storage backends.

use freya_core::{FreyaError, RetrievalResult};
use serde_json::Value;

pub trait MemoryBackend: Send + Sync {
    fn backend_id(&self) -> &str;
    fn store(
        &self,
        content: &str,
        source: &str,
        metadata: Option<&Value>,
    ) -> Result<String, FreyaError>;
    fn retrieve(
        &self,
        query: &str,
        top_k: usize,
    ) -> Result<Vec<RetrievalResult>, FreyaError>;
    fn delete(&self, doc_id: &str) -> Result<bool, FreyaError>;
    fn clear(&self) -> Result<(), FreyaError>;
    fn count(&self) -> Result<usize, FreyaError>;
}
