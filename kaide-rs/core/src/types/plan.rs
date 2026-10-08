#[derive(Debug, Clone)]
pub struct PlanStep {
    pub step_type: String,
    pub description: String,
    pub filename: Option<String>,
    pub pattern: Option<String>,
    pub command: Option<String>,
}

#[derive(Debug, Clone)]
pub struct Plan {
    pub steps: Vec<PlanStep>,
}

impl PlanStep {
    fn from_json(value: &crate::json::Value) -> crate::error::Result<Self> {
        let object = value.as_object().ok_or_else(|| crate::error::message("plan step must be an object"))?;
        let text = |key: &str| object.get(key).and_then(|value| value.as_str()).map(str::to_string);
        Ok(Self {
            step_type: text("type").unwrap_or_else(|| "task".into()),
            description: text("description").unwrap_or_default(),
            filename: text("filename"),
            pattern: text("pattern"),
            command: text("command"),
        })
    }
}

impl Plan {
    pub fn from_json(value: &crate::json::Value) -> crate::error::Result<Self> {
        let steps = value.get("steps").and_then(|value| value.as_array())
            .ok_or_else(|| crate::error::message("plan must contain steps"))?
            .iter().map(PlanStep::from_json).collect::<crate::error::Result<Vec<_>>>()?;
        Ok(Self { steps })
    }
}
