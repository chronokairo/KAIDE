use crate::error::Context;

/// Fetch a URL (http/https) and return its text content. HTML pages are
/// stripped to readable text. The response body is capped at `max_bytes`.
pub fn http_fetch(url: &str, max_bytes: usize, timeout_secs: u64) -> crate::error::Result<String> {
    let parsed = crate::http::Url::parse(url).map_err(|e| crate::error::message(e)).context("invalid URL")?;
    if !matches!(parsed.scheme(), "http" | "https") {
        crate::error::bail!("only http/https URLs are allowed");
    }
    let client = crate::http::blocking::Client::builder()
        .user_agent(web_ua())
        .timeout(std::time::Duration::from_secs(timeout_secs.max(1)))
        .build()
        .context("building HTTP client")?;
    let response = client.get(parsed.as_str()).send().context("HTTP request failed")?;
    if !response.status().is_success() {
        crate::error::bail!("HTTP {}", response.status());
    }
    let content_type = response
        .headers()
        .get(crate::http::header::CONTENT_TYPE)
        .cloned()
        .unwrap_or_default();
    let body = response.bytes().context("reading response body")?;
    let body = String::from_utf8_lossy(&body).into_owned();
    let text = if content_type.contains("html") {
        strip_html(&body)
    } else {
        body
    };
    Ok(truncate_chars(&text, max_bytes))
}

/// Web search with no API key. Uses a SearXNG instance when `WEB_SEARCH_URL`
/// is set (JSON endpoint), otherwise falls back to DuckDuckGo's HTML results.
pub fn web_search(query: &str, max_results: usize, timeout_secs: u64) -> crate::error::Result<String> {
    let query = query.trim();
    if query.is_empty() {
        crate::error::bail!("query must not be empty");
    }
    let client = crate::http::blocking::Client::builder()
        .user_agent(web_ua())
        .timeout(std::time::Duration::from_secs(timeout_secs.max(1)))
        .build()
        .context("building HTTP client")?;

    match std::env::var("WEB_SEARCH_URL").ok() {
        Some(searxng_url) => searxng_search(&client, &searxng_url, query, max_results),
        None => duckduckgo_search(&client, query, max_results),
    }
}

fn searxng_search(
    client: &crate::http::blocking::Client,
    searxng_url: &str,
    query: &str,
    max_results: usize,
) -> crate::error::Result<String> {
    let url = crate::http::Url::parse_with_params(searxng_url, &[("q", query), ("format", "json")])
        .map_err(|e| crate::error::message(e))
        .context("invalid WEB_SEARCH_URL")?;
    let response = client.get(url.as_str()).send().context("SearXNG request failed")?;
    if !response.status().is_success() {
        crate::error::bail!("SearXNG HTTP {}", response.status());
    }
    let json: serde_json::Value = response.json().context("SearXNG returned invalid JSON")?;
    let results = json
        .get("results")
        .and_then(|value| value.as_array())
        .cloned()
        .unwrap_or_default();
    let mut out = Vec::new();
    for result in results.iter().take(max_results.clamp(1, 20)) {
        let title = result
            .get("title")
            .and_then(|v| v.as_str())
            .unwrap_or("(untitled)");
        let url = result.get("url").and_then(|v| v.as_str()).unwrap_or("");
        let snippet = result.get("content").and_then(|v| v.as_str()).unwrap_or("");
        out.push(format!("{title}\n{url}\n{snippet}"));
    }
    if out.is_empty() {
        crate::error::bail!("no results for query");
    }
    Ok(out.join("\n\n"))
}

fn duckduckgo_search(
    client: &crate::http::blocking::Client,
    query: &str,
    max_results: usize,
) -> crate::error::Result<String> {
    let url =
        crate::http::Url::parse_with_params("https://html.duckduckgo.com/html/", &[("q", query)])
            .map_err(|e| crate::error::message(e))?;
    let response = client
        .get(url.as_str())
        .send()
        .context("DuckDuckGo request failed")?;
    if !response.status().is_success() {
        crate::error::bail!("DuckDuckGo HTTP {}", response.status());
    }
    let body = response.text().context("reading DuckDuckGo response")?;
    let results = parse_ddg_results(&body, max_results.clamp(1, 20));
    if results.is_empty() {
        crate::error::bail!("no results for query");
    }
    Ok(results.join("\n\n"))
}

/// Extract DuckDuckGo HTML results (`result__a` title links + `result__snippet`
/// summaries) with lightweight regex parsing — no HTML dependency needed.
fn parse_ddg_results(html: &str, max_results: usize) -> Vec<String> {
    let mut results = Vec::new();
    let mut cursor = 0;

    while let Some(anchor_start) = html[cursor..].find("result__a") {
        let abs_anchor = cursor + anchor_start;
        // Find href
        let Some(href_start_rel) = html[abs_anchor..].find("href=\"") else { break; };
        let href_val_start = abs_anchor + href_start_rel + 6;
        let Some(href_val_end_rel) = html[href_val_start..].find('"') else { break; };
        let href = html_unescape(&html[href_val_start..href_val_start + href_val_end_rel]);

        // Find closing > of anchor tag
        let Some(tag_close_rel) = html[href_val_start + href_val_end_rel..].find('>') else { break; };
        let content_start = href_val_start + href_val_end_rel + tag_close_rel + 1;
        let Some(tag_end_rel) = html[content_start..].find("</a>") else { break; };
        let title = strip_tags(&html_unescape(&html[content_start..content_start + tag_end_rel]));

        // Search snippet
        let mut snippet = String::new();
        if let Some(snip_start_rel) = html[content_start + tag_end_rel..].find("result__snippet") {
            let snip_abs = content_start + tag_end_rel + snip_start_rel;
            if let Some(snip_open_rel) = html[snip_abs..].find('>') {
                let snip_content_start = snip_abs + snip_open_rel + 1;
                if let Some(snip_close_rel) = html[snip_content_start..].find("</a>") {
                    snippet = strip_tags(&html_unescape(&html[snip_content_start..snip_content_start + snip_close_rel]));
                }
            }
        }

        results.push(format!("{title}\n{href}\n{snippet}"));
        if results.len() >= max_results {
            break;
        }

        cursor = content_start + tag_end_rel + 4;
    }

    results
}

fn strip_tags(input: &str) -> String {
    let mut out = String::with_capacity(input.len());
    let mut inside_tag = false;
    for c in input.chars() {
        if c == '<' {
            inside_tag = true;
        } else if c == '>' {
            inside_tag = false;
        } else if !inside_tag {
            out.push(c);
        }
    }
    out.trim().to_string()
}

fn html_unescape(text: &str) -> String {
    text.replace("&amp;", "&")
        .replace("&quot;", "\"")
        .replace("&#x27;", "'")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&nbsp;", " ")
}

fn strip_html(html: &str) -> String {
    let mut out = String::with_capacity(html.len());
    let mut in_script_or_style = false;
    let mut chars = html.chars().peekable();

    while let Some(c) = chars.next() {
        if c == '<' {
            let mut tag_name = String::new();
            let mut tag_chars = Vec::new();
            while let Some(&nc) = chars.peek() {
                chars.next();
                if nc == '>' {
                    break;
                }
                tag_chars.push(nc);
                if !nc.is_ascii_whitespace() && tag_name.len() < 10 {
                    tag_name.push(nc.to_ascii_lowercase());
                }
            }

            if tag_name.starts_with("script") || tag_name.starts_with("style") {
                in_script_or_style = true;
            } else if tag_name.starts_with("/script") || tag_name.starts_with("/style") {
                in_script_or_style = false;
            }
            out.push(' ');
            continue;
        }

        if !in_script_or_style {
            out.push(c);
        }
    }

    // Collapse whitespace
    let mut clean = String::with_capacity(out.len());
    let mut last_was_ws = false;
    for c in out.chars() {
        if c.is_ascii_whitespace() {
            if !last_was_ws {
                clean.push(' ');
                last_was_ws = true;
            }
        } else {
            clean.push(c);
            last_was_ws = false;
        }
    }
    clean.trim().to_string()
}

fn truncate_chars(text: &str, max_bytes: usize) -> String {
    if text.len() <= max_bytes {
        return text.to_string();
    }
    let mut end = max_bytes;
    while !text.is_char_boundary(end) {
        end -= 1;
    }
    format!("{}…[truncated]", &text[..end])
}

fn web_ua() -> String {
    format!("ckc/{}", env!("CARGO_PKG_VERSION"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn strip_html_removes_tags() {
        let html = "<html><body><h1>Title</h1><p>Hello <b>world</b>.</p></body></html>";
        assert_eq!(strip_html(html), "Title Hello world .");
    }

    #[test]
    fn truncate_keeps_utf8_boundaries() {
        let text = "açãodólar".repeat(1000);
        let capped = truncate_chars(&text, 10);
        assert!(capped.len() <= 10 + "[truncated]".len() + 8);
        assert!(String::from_utf8(capped.into_bytes()).is_ok());
    }

    #[test]
    fn ddg_parser_extracts_results() {
        let html = r#"
            <a class="result__a" href="//example.com/1">First <b>Result</b></a>
            <a class="result__snippet" href="//example.com/1">A snippet.</a>
            <a class="result__a" href="//example.com/2">Second</a>
            <a class="result__snippet" href="//example.com/2">More text.</a>
        "#;
        let results = parse_ddg_results(html, 2);
        assert_eq!(results.len(), 2);
        assert!(results[0].contains("First Result"));
        assert!(results[0].contains("//example.com/1"));
        assert!(results[0].contains("A snippet."));
    }

    #[test]
    #[ignore = "live network"]
    fn http_fetch_live_strips_html() {
        let text = http_fetch("https://example.com/", 8_000, 20).unwrap();
        assert!(text.contains("Example Domain"), "got: {text}");
        assert!(!text.contains("<html"), "HTML not stripped: {text}");
    }

    #[test]
    #[ignore = "live network"]
    fn web_search_live_returns_results() {
        let results = web_search("rust programming language", 3, 20).unwrap();
        assert!(results.contains("rust"), "got: {results}");
    }
}
