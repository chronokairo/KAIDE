use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Action {
    CreateFile { filename: String, content: String },
    EditFile { filename: String, new_content: String },
    ReadFile { filename: String },
    SearchCode { pattern: String },
    RunCommand { command: String },
    RunTests { path: String },
    Answer { text: String },
    GitInit,
    GitCommit { message: String },
    GitStatus,
    Done { description: String },
}
