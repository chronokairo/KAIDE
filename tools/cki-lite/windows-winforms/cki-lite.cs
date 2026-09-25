// cki-lite desktop - Native C# / WinForms NVIDIA NIM agent for Windows.
// Compiled with the built-in .NET Framework csc.exe - no installs required.
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Drawing;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Net;
using System.Security.Cryptography;
using System.Security.Authentication;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Windows.Forms;

namespace CkiLite
{
    static class Program
    {
        [STAThread]
        static void Main()
        {
            CkiNet.Configure();
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new MainForm());
        }
    }

    // ---------- API result helpers ----------
    public class ChatMessage
    {
        public string Role;
        public string Content;
        public string ToolCallId;
        public string ToolName;
        public string ToolArguments;
    }

    public class SessionSnapshot
    {
        public string Id;
        public string Model;
        public string StartedAt;
        public List<ChatMessage> Messages = new List<ChatMessage>();
    }

    public class UserSettings
    {
        public string Provider;
        public string Model;
        public ShellMode ApprovalMode = ShellMode.Ask;
    }

    public class ModelChoice
    {
        public string Id;
    }

    public static class CkiHttp
    {
        public static string Api(string baseUrl, string key, string path, string dataJson, string method)
        {
            CkiNet.Configure();
            var req = (HttpWebRequest)WebRequest.Create(baseUrl.TrimEnd('/') + path);
            req.Method = method;
            req.Timeout = 180000;
            req.ContentType = "application/json";
            req.Accept = "application/json";
            req.Headers["Authorization"] = "Bearer " + key;
            if (!String.IsNullOrEmpty(dataJson))
            {
                byte[] body = Encoding.UTF8.GetBytes(dataJson);
                req.ContentLength = body.Length;
                using (var stream = req.GetRequestStream())
                {
                    stream.Write(body, 0, body.Length);
                }
            }
            else
            {
                req.ContentLength = 0;
            }
            try
            {
                using (var response = (HttpWebResponse)req.GetResponse())
                using (var reader = new StreamReader(response.GetResponseStream(), Encoding.UTF8))
                {
                    return reader.ReadToEnd();
                }
            }
            catch (WebException webEx)
            {
                int code = 0;
                string detail = "";
                if (webEx.Response != null)
                {
                    var resp = (HttpWebResponse)webEx.Response;
                    code = (int)resp.StatusCode;
                    using (var reader = new StreamReader(resp.GetResponseStream(), Encoding.UTF8))
                    {
                        detail = reader.ReadToEnd();
                    }
                }
                else
                {
                    // No HTTP response: network-level failure (DNS, connection
                    // refused, TLS, timeout). Surface the underlying cause.
                    string cause = webEx.InnerException != null ? webEx.InnerException.Message : webEx.Message;
                    if (cause.ToLowerInvariant().Contains("ssl") || cause.ToLowerInvariant().Contains("secure channel") || cause.ToLowerInvariant().Contains("tls"))
                        cause = cause + " [dica: problema de criptografia TLS - use o botão Testar]";
                    detail = "sem resposta HTTP: " + cause + " (verifique a conexão e a URL " + baseUrl + ")";
                }
                detail = detail.Replace(key, "[REDACTED]");
                if (detail.Length > 500) detail = detail.Substring(0, 500);
                throw new CkiHttpException(code, detail);
            }
        }

        // Call without an Authorization header (used by Gemini, whose key lives
        // in the query string as ?key=).
        public static string ApiNoAuth(string baseUrl, string path, string dataJson, string method)
        {
            CkiNet.Configure();
            var req = (HttpWebRequest)WebRequest.Create(baseUrl.TrimEnd('/') + path);
            req.Method = method;
            req.Timeout = 180000;
            req.ContentType = "application/json";
            req.Accept = "application/json";
            if (!String.IsNullOrEmpty(dataJson))
            {
                byte[] body = Encoding.UTF8.GetBytes(dataJson);
                req.ContentLength = body.Length;
                using (var stream = req.GetRequestStream())
                {
                    stream.Write(body, 0, body.Length);
                }
            }
            else
            {
                req.ContentLength = 0;
            }
            try
            {
                using (var response = (HttpWebResponse)req.GetResponse())
                using (var reader = new StreamReader(response.GetResponseStream(), Encoding.UTF8))
                {
                    return reader.ReadToEnd();
                }
            }
            catch (WebException webEx)
            {
                int code = 0;
                string detail = "";
                if (webEx.Response != null)
                {
                    var resp = (HttpWebResponse)webEx.Response;
                    code = (int)resp.StatusCode;
                    using (var reader = new StreamReader(resp.GetResponseStream(), Encoding.UTF8))
                    {
                        detail = reader.ReadToEnd();
                    }
                }
                else
                {
                    string cause = webEx.InnerException != null ? webEx.InnerException.Message : webEx.Message;
                    if (cause.ToLowerInvariant().Contains("ssl") || cause.ToLowerInvariant().Contains("secure channel") || cause.ToLowerInvariant().Contains("tls"))
                        cause = cause + " [dica: problema de criptografia TLS - use o botão Testar]";
                    detail = "sem resposta HTTP: " + cause + " (verifique a conexão e a URL " + baseUrl + ")";
                }
                if (detail.Length > 500) detail = detail.Substring(0, 500);
                throw new CkiHttpException(code, detail);
            }
        }

        public static bool IsRateLimit(CkiHttpException ex)
        {
            return ex.Code == 429 ||
                ex.Detail.ToLowerInvariant().Contains("rate limit") ||
                ex.Detail.ToLowerInvariant().Contains("too many requests");
        }
    }

    public class CkiHttpException : Exception
    {
        public int Code;
        public string Detail;
        public CkiHttpException(int code, string detail)
            : base("HTTP " + code + ": " + detail)
        {
            Code = code;
            Detail = detail;
        }
    }

    // ---------- Network / TLS ----------
    public static class CkiNet
    {
        public static void Configure()
        {
            try
            {
                // Enable TLS 1.3 + 1.2 + 1.1 + 1.0 (+ SSL3) using numeric enum
                // values so this compiles against .NET 4.0 references yet works
                // on modern runtimes. Fixes "Could not create SSL/TLS secure
                // channel" on Cloudflare/Groq/OpenRouter/Google front-ends.
                ServicePointManager.SecurityProtocol =
                    (SecurityProtocolType)((int)SecurityProtocolType.SystemDefault | 12288 | 3072 | 768 | 192 | 48);
            }
            catch (Exception)
            {
                try
                {
                    ServicePointManager.SecurityProtocol =
                        (SecurityProtocolType)((int)SecurityProtocolType.SystemDefault | 3072 | 768 | 192 | 48);
                }
                catch (Exception) { }
            }
            try { ServicePointManager.Expect100Continue = false; } catch (Exception) { }
            try { ServicePointManager.DefaultConnectionLimit = 64; } catch (Exception) { }
        }

        // --- diagnostic steps ---
        public class DiagStep
        {
            public string Label;
            public bool Ok;
            public string Detail;
            public DiagStep(string label, bool ok, string detail)
            {
                Label = label;
                Ok = ok;
                Detail = detail;
            }
        }

        public static string HostOf(string baseUrl)
        {
            Uri uri;
            try { uri = new Uri(baseUrl); }
            catch (Exception) { return null; }
            return uri.Host;
        }

        public static bool IsHttps(string baseUrl)
        {
            try { return new Uri(baseUrl).Scheme == "https"; }
            catch (Exception) { return false; }
        }

        public static int PortOf(string baseUrl)
        {
            try
            {
                Uri uri = new Uri(baseUrl);
                return uri.IsDefaultPort ? (uri.Scheme == "https" ? 443 : 80) : uri.Port;
            }
            catch (Exception) { return IsHttps(baseUrl) ? 443 : 80; }
        }

        public static List<DiagStep> Diagnose(string baseUrl)
        {
            var steps = new List<DiagStep>();
            string host = HostOf(baseUrl);

            // 1) DNS
            if (host == null)
            {
                steps.Add(new DiagStep("URL inválida", false, baseUrl ?? "(vazia)"));
                return steps;
            }
            string ip = null;
            try
            {
                var addresses = System.Net.Dns.GetHostAddresses(host);
                if (addresses.Length > 0) ip = addresses[0].ToString();
                steps.Add(new DiagStep("Resolução DNS", ip != null, host + " -> " + (ip ?? "sem registros")));
            }
            catch (Exception ex)
            {
                steps.Add(new DiagStep("Resolução DNS", false, host + " : " + ex.Message));
            }

            // 2) TCP connect
            int port = PortOf(baseUrl);
            bool tcpOk = false;
            string tcpDetail = "";
            using (var client = new System.Net.Sockets.TcpClient())
            {
                try
                {
                    var task = client.ConnectAsync(host, port);
                    bool done = task.Wait(5000);
                    tcpOk = done && client.Connected;
                    tcpDetail = tcpOk ? "conectado" : (done ? "recusada" : "timeout (5s)");
                }
                catch (Exception ex)
                {
                    tcpDetail = ex.Message;
                }
            }
            steps.Add(new DiagStep("Conexão TCP :" + port, tcpOk, tcpDetail));

            // 3) TLS handshake
            if (IsHttps(baseUrl) && tcpOk)
            {
                bool tlsOk = false;
                string tlsDetail = "";
                try
                {
                    using (var client = new System.Net.Sockets.TcpClient())
                    {
                        var t2 = client.ConnectAsync(host, port);
                        t2.Wait(5000);
                        if (client.Connected)
                        {
                            using (var ssl = new System.Net.Security.SslStream(client.GetStream(), false))
                            {
                                // Offer TLS 1.2/1.3 explicitly: SslProtocols.Default
                                // maps to the legacy SSL3|TLS1.0 combo on .NET
                                // Framework, which modern Schannel on Windows 11
                                // rejects ("requested operation is not supported").
                                // This mirrors what Configure() does for the app.
                                ssl.AuthenticateAsClient(host, null,
                                    (SslProtocols)(12288 | 3072 | 768 | 192 | 48), false);
                                if (ssl.IsAuthenticated)
                                {
                                    tlsOk = true;
                                    tlsDetail = "TLS " + ssl.SslProtocol + " | cifra " + ssl.CipherAlgorithm;
                                }
                                else tlsDetail = "handshake incompleto";
                            }
                        }
                        else tlsDetail = "TCP não conectou";
                    }
                }
                catch (Exception ex)
                {
                    tlsDetail = "SSL/TLS: " + ex.Message;
                }
                steps.Add(new DiagStep("Handshake TLS", tlsOk, tlsDetail));
            }
            else if (IsHttps(baseUrl))
            {
                steps.Add(new DiagStep("Handshake TLS", false, "pulando (TCP falhou)"));
            }

            // 4) HTTP GET (status only, no auth)
            try
            {
                var req = (HttpWebRequest)WebRequest.Create(baseUrl.TrimEnd('/') + "/");
                req.Method = "GET";
                req.Timeout = 15000;
                req.AllowAutoRedirect = false;
                int code;
                try
                {
                    using (var resp = (HttpWebResponse)req.GetResponse()) code = (int)resp.StatusCode;
                }
                catch (WebException webEx)
                {
                    var resp = webEx.Response as HttpWebResponse;
                    code = resp != null ? (int)resp.StatusCode : 0;
                    if (code == 0) throw;
                }
                steps.Add(new DiagStep("Resposta HTTP", true, "servidor respondeu HTTP " + code));
            }
            catch (Exception)
            {
                steps.Add(new DiagStep("Resposta HTTP", false, "servidor não respondeu"));
            }

            return steps;
        }
    }

    // ---------- Providers ----------
    public class Provider
    {
        public string Name;
        public string EnvKey;
        public string DefaultBaseUrl;
        public bool IsGemini;

        public Provider(string name, string envKey, string defaultBaseUrl, bool isGemini)
        {
            Name = name;
            EnvKey = envKey;
            DefaultBaseUrl = defaultBaseUrl;
            IsGemini = isGemini;
        }

        public static List<Provider> All()
        {
            return new List<Provider>
            {
                new Provider("NVIDIA NIM", "NVIDIA_API_KEY", "https://integrate.api.nvidia.com/v1", false),
                new Provider("Groq", "GROQ_API_KEY", "https://api.groq.com/openai/v1", false),
                new Provider("OpenRouter", "OPENROUTER_API_KEY", "https://openrouter.ai/api/v1", false),
                new Provider("Ollama", "OLLAMA_API_KEY", "http://localhost:11434/v1", false),
                new Provider("Google Gemini", "GEMINI_API_KEY", "https://generativelanguage.googleapis.com/v1beta", true)
            };
        }

        public string BaseUrl(string fallback)
        {
            if (!String.IsNullOrEmpty(fallback)) return fallback;
            return DefaultBaseUrl;
        }
    }

    public static class ProviderEnv
    {
        // key name used to override base URL: e.g. NVIDIA -> NIM_BASE_URL, rest -> <UPPER>_BASE_URL
        public static string BaseUrlEnvKey(Provider p)
        {
            if (p.Name == "NVIDIA NIM") return "NIM_BASE_URL";
            return p.EnvKey.Replace("_API_KEY", "_BASE_URL");
        }
    }

    // ---------- Model catalog ----------
    public class ModelCatalog
    {
        public static List<string> VisibleModels(Provider provider, string baseUrl, string key, bool refresh, bool benchmark = false)
        {
            string home = Sessions.SessionDir();
            string cacheDir = Path.Combine(home, "cache");
            Directory.CreateDirectory(cacheDir);
            string hash = HashBase(provider.Name + "|" + baseUrl);
            string cache = Path.Combine(cacheDir, "models-" + hash + ".json");

            List<string> models = null;
            string cachedRaw = null;
            if (!refresh && File.Exists(cache))
            {
                try { cachedRaw = File.ReadAllText(cache); } catch (Exception) { cachedRaw = null; }
                if (!String.IsNullOrEmpty(cachedRaw))
                    models = ParseModelIds(cachedRaw, provider);
            }
            if (models == null)
            {
                string raw = FetchModelsRaw(provider, baseUrl, key);
                models = ParseModelIds(raw, provider);
                try { File.WriteAllText(cache, raw, Encoding.UTF8); } catch (Exception) { }
            }

            if (benchmark && provider != null && provider.Name == "NVIDIA NIM")
                models = DailyValidatedModels(provider, baseUrl, key, models, cacheDir, hash);

            string selected = Path.Combine(cacheDir, "selected.json");
            if (File.Exists(selected))
            {
                List<string> ranked = ParseJsonStringArray(File.ReadAllText(selected));
                if (ranked != null)
                {
                    var available = new HashSet<string>(models);
                    List<string> filtered = ranked.Where(m => available.Contains(m)).ToList();
                    if (filtered.Count > 0) return filtered;
                }
            }
            return models;
        }

        private class BenchmarkResult
        {
            public string Model;
            public long Milliseconds;
        }

        private static List<string> DailyValidatedModels(Provider provider, string baseUrl, string key,
            List<string> models, string cacheDir, string hash)
        {
            string daily = Path.Combine(cacheDir, "nim-validated-v2-" + hash + "-" + DateTime.Now.ToString("yyyyMMdd") + ".json");
            if (File.Exists(daily))
            {
                try
                {
                    List<string> saved = ParseJsonStringArray(File.ReadAllText(daily));
                    if (saved != null)
                    {
                        var current = new HashSet<string>(models);
                        return saved.Where(m => current.Contains(m)).ToList();
                    }
                }
                catch (Exception) { }
            }

            List<BenchmarkResult> results = new List<BenchmarkResult>();
            object gate = new object();
            int next = -1;
            int workers = Math.Min(4, Math.Max(1, models.Count));
            var threads = new List<Thread>();
            for (int w = 0; w < workers; w++)
            {
                Thread thread = new Thread((ThreadStart)delegate
                {
                    while (true)
                    {
                        int index = Interlocked.Increment(ref next);
                        if (index >= models.Count) break;
                        string model = models[index];
                        try
                        {
                            string body = BenchmarkBody(model);
                            var watch = System.Diagnostics.Stopwatch.StartNew();
                            string response = CkiHttp.Api(baseUrl, key, "/chat/completions", body, "POST");
                            watch.Stop();
                            if (SupportsTerminalTool(response))
                                lock (gate) results.Add(new BenchmarkResult { Model = model, Milliseconds = watch.ElapsedMilliseconds });
                        }
                        catch (Exception) { }
                    }
                });
                thread.IsBackground = true;
                threads.Add(thread);
                thread.Start();
            }
            foreach (Thread thread in threads) thread.Join();

            if (results.Count == 0) return new List<string>();
            results.Sort(delegate(BenchmarkResult a, BenchmarkResult b) { return a.Milliseconds.CompareTo(b.Milliseconds); });
            var times = results.Select(r => r.Milliseconds).ToList();
            long median = times[times.Count / 2];
            long maxLatency = Math.Max(2500L, median * 2L);
            List<string> validated = results.Where(r => r.Milliseconds <= maxLatency).Select(r => r.Model).ToList();
            if (validated.Count == 0) validated.Add(results[0].Model);

            var json = new JsonArray();
            foreach (string model in validated) json.Add(new JsonValue(model));
            try { File.WriteAllText(daily, json.ToJson(0), Encoding.UTF8); } catch (Exception) { }
            return validated;
        }

        private static string BenchmarkBody(string model)
        {
            var body = new JsonObject();
            body["model"] = new JsonValue(model);
            var messages = new JsonArray();
            var message = new JsonObject();
            message["role"] = new JsonValue("user");
            message["content"] = new JsonValue("Reply only with OK.");
            messages.Add(message);
            body["messages"] = messages;
            var function = new JsonObject();
            function["name"] = new JsonValue("terminal");
            function["description"] = new JsonValue("Execute a terminal command.");
            var parameters = new JsonObject();
            parameters["type"] = new JsonValue("object");
            var properties = new JsonObject();
            var command = new JsonObject();
            command["type"] = new JsonValue("string");
            properties["command"] = command;
            parameters["properties"] = properties;
            var required = new JsonArray();
            required.Add(new JsonValue("command"));
            parameters["required"] = required;
            function["parameters"] = parameters;
            var tool = new JsonObject();
            tool["type"] = new JsonValue("function");
            tool["function"] = function;
            var tools = new JsonArray();
            tools.Add(tool);
            body["tools"] = tools;
            var choice = new JsonObject();
            choice["type"] = new JsonValue("function");
            var choiceFunction = new JsonObject();
            choiceFunction["name"] = new JsonValue("terminal");
            choice["function"] = choiceFunction;
            body["tool_choice"] = choice;
            body["temperature"] = new JsonNumber("0");
            body["max_tokens"] = new JsonNumber("64");
            return body.ToJson(0);
        }

        private static bool SupportsTerminalTool(string response)
        {
            try
            {
                Json doc = Json.Parse(response);
                Json choices = doc.Get("choices");
                if (choices == null || !choices.IsArray || choices.Count == 0) return false;
                Json message = choices[0].Get("message");
                Json calls = message != null ? message.Get("tool_calls") : null;
                if (calls == null || !calls.IsArray || calls.Count == 0) return false;
                Json function = calls[0].Get("function");
                Json name = function != null ? function.Get("name") : null;
                return name != null && name.Value == "terminal";
            }
            catch (Exception) { return false; }
        }

        public static string PickInitialModel(Provider provider, List<string> available, string current)
        {
            if (available == null || available.Count == 0) return null;
            if (!String.IsNullOrEmpty(current) && available.Contains(current)) return current;

            string configured = provider != null && provider.Name == "NVIDIA NIM"
                ? Environment.GetEnvironmentVariable("NIM_MODEL") : null;
            if (!String.IsNullOrEmpty(configured) && available.Contains(configured)) return configured;

            return available[0];
        }

        private static string FetchModelsRaw(Provider provider, string baseUrl, string key)
        {
            if (provider.IsGemini)
            {
                // GET /models returns { models: [ {name: "models/gemini-...", ...} ] }
                string path = "/models?key=" + Uri.EscapeDataString(key ?? "");
                return CkiHttp.ApiNoAuth(baseUrl, path, null, "GET");
            }
            return CkiHttp.Api(baseUrl, key, "/models", null, "GET");
        }

        private static string HashBase(string value)
        {
            using (SHA256 sha = SHA256.Create())
            {
                byte[] bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(value));
                var sb = new StringBuilder();
                for (int i = 0; i < 8; i++) sb.Append(bytes[i].ToString("x2"));
                return sb.ToString();
            }
        }

        private static List<string> ParseModelIds(string text, Provider provider)
        {
            if (String.IsNullOrEmpty(text)) return new List<string>();
            var list = new List<string>();
            try
            {
                var doc = Json.Parse(text);
                if (provider != null && provider.IsGemini)
                {
                    var models = doc.Get("models");
                    if (models != null && models.IsArray)
                    {
                        for (int i = 0; i < models.Count; i++)
                        {
                            var name = models[i].Get("name");
                            if (name != null && name.Value != null)
                            {
                                string m = name.Value;
                                if (m.StartsWith("models/")) m = m.Substring(7);
                                list.Add(m);
                            }
                        }
                    }
                    return list;
                }
                var data = doc.Get("data");
                if (data != null && data.IsArray)
                {
                    for (int i = 0; i < data.Count; i++)
                    {
                        var id = data[i].Get("id");
                        if (id != null && id.Value != null) list.Add(id.Value);
                    }
                }
            }
            catch (Exception) { }
            return list;
        }

        private static List<string> ParseJsonStringArray(string raw)
        {
            try
            {
                var doc = Json.Parse(raw); 
                {
                    var list = new List<string>();
                    if (doc.IsArray)
                    {
                        for (int i = 0; i < doc.Count; i++)
                        {
                            if (doc[i].Value != null) list.Add(doc[i].Value);
                        }
                    }
                    return list;
                }
            }
            catch (Exception) { return null; }
        }
    }

    // ---------- Sessions ----------
    public static class Sessions
    {
        public static string SessionDir()
        {
            string home = Environment.GetEnvironmentVariable("CKI_LITE_HOME");
            if (String.IsNullOrEmpty(home)) home = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.UserProfile),
                ".cki-lite");
            Directory.CreateDirectory(home);
            return home;
        }

        public static void LoadDotenv()
        {
            string[] paths = new string[] {
                Path.Combine(AppDomain.CurrentDomain.BaseDirectory, ".env"),
                Path.Combine(SessionDir(), ".env"),
                Path.Combine(Directory.GetCurrentDirectory(), ".env")
            };
            foreach (string path in paths)
            {
                if (!File.Exists(path)) continue;
                foreach (string line in File.ReadAllLines(path))
                {
                    string ln = line.Trim();
                    if (String.IsNullOrEmpty(ln) || ln.StartsWith("#")) continue;
                    if (ln.StartsWith("export ")) ln = ln.Substring(7).Trim();
                    int eq = ln.IndexOf('=');
                    if (eq < 0) continue;
                    string name = ln.Substring(0, eq).Trim();
                    string value = ln.Substring(eq + 1).Trim();
                    value = value.Trim('"').Trim('\'');
                    if (name.Length > 0 && Environment.GetEnvironmentVariable(name) == null)
                        Environment.SetEnvironmentVariable(name, value);
                }
            }
        }

        // Persists a provider key to the user-local .env (rewrites in place).
        public static void WriteKeyToDotenv(Provider provider, string key)
        {
            if (provider == null) return;
            string envName = provider.EnvKey;
            string path = Path.Combine(SessionDir(), ".env");
            if (!File.Exists(path)) path = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, ".env");
            if (!File.Exists(path)) path = Path.Combine(SessionDir(), ".env");

            var lines = File.Exists(path) ? new List<string>(File.ReadAllLines(path)) : new List<string>();
            bool replaced = false;
            for (int i = 0; i < lines.Count; i++)
            {
                string ln = lines[i].Trim();
                int eq = ln.IndexOf('=');
                if (eq > 0 && ln.Substring(0, eq).Trim() == envName)
                {
                    lines[i] = envName + "=" + key;
                    replaced = true;
                    break;
                }
            }
            if (!replaced) lines.Add(envName + "=" + key);
            Directory.CreateDirectory(Path.GetDirectoryName(path));
            File.WriteAllLines(path, lines.ToArray(), Encoding.UTF8);
            Environment.SetEnvironmentVariable(envName, key);
        }

        public static void Save(string sessionId, string model, List<ChatMessage> history, string startedAt)
        {
            var s = new JsonObject();
            s["session_id"] = new JsonValue(sessionId);
            s["started_at"] = new JsonValue(startedAt);
            s["updated_at"] = new JsonValue(DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ"));
            s["model"] = new JsonValue(model);
            var msgs = new JsonArray();
            foreach (var m in history)
            {
                var mo = new JsonObject();
                mo["role"] = new JsonValue(m.Role);
                mo["content"] = new JsonValue(m.Content);
                msgs.Add(mo);
            }
            s["messages"] = msgs;
            File.WriteAllText(Path.Combine(SessionDir(), sessionId + ".json"),
                s.ToJson(0), Encoding.UTF8);
        }

        public static List<string> ListSessionIds()
        {
            var result = new List<string>();
            foreach (string path in Directory.GetFiles(SessionDir(), "*.json"))
            {
                string name = Path.GetFileNameWithoutExtension(path);
                if (!String.IsNullOrEmpty(name) && name != "selected" && name != "settings") result.Add(name);
            }
            result.Sort();
            result.Reverse();
            return result;
        }

        public static SessionSnapshot Load(string sessionId)
        {
            string path = Path.Combine(SessionDir(), sessionId + ".json");
            if (!File.Exists(path)) return null;
            var doc = Json.Parse(File.ReadAllText(path));
            if (doc == null || !doc.IsObject) return null;
            var result = new SessionSnapshot();
            result.Id = sessionId;
            Json model = doc.Get("model");
            Json started = doc.Get("started_at");
            result.Model = model != null ? model.Value : "";
            result.StartedAt = started != null ? started.Value : "";
            Json messages = doc.Get("messages");
            if (messages != null && messages.IsArray)
            {
                for (int i = 0; i < messages.Count; i++)
                {
                    Json item = messages[i];
                    if (item == null || !item.IsObject) continue;
                    Json role = item.Get("role");
                    Json content = item.Get("content");
                    result.Messages.Add(new ChatMessage
                    {
                        Role = role != null ? role.Value : "user",
                        Content = content != null ? content.Value : ""
                    });
                }
            }
            return result;
        }

        public static void Delete(string sessionId)
        {
            string path = Path.Combine(SessionDir(), sessionId + ".json");
            if (File.Exists(path)) File.Delete(path);
        }

        public static UserSettings LoadSettings()
        {
            UserSettings result = new UserSettings();
            try
            {
                string path = Path.Combine(SessionDir(), "settings.json");
                if (!File.Exists(path)) return result;
                Json doc = Json.Parse(File.ReadAllText(path));
                if (doc == null || !doc.IsObject) return result;
                Json provider = doc.Get("provider");
                Json model = doc.Get("model");
                Json approval = doc.Get("approval_mode");
                if (provider != null) result.Provider = provider.Value;
                if (model != null) result.Model = model.Value;
                int mode;
                if (approval != null && Int32.TryParse(approval.Value, out mode) && mode >= 0 && mode <= 2)
                    result.ApprovalMode = (ShellMode)mode;
            }
            catch (Exception) { }
            return result;
        }

        public static void SaveSettings(UserSettings settings)
        {
            if (settings == null) return;
            var doc = new JsonObject();
            doc["provider"] = new JsonValue(settings.Provider ?? "");
            doc["model"] = new JsonValue(settings.Model ?? "");
            doc["approval_mode"] = new JsonNumber(((int)settings.ApprovalMode).ToString());
            File.WriteAllText(Path.Combine(SessionDir(), "settings.json"), doc.ToJson(0), Encoding.UTF8);
        }
    }

    // ---------- Shell execution ----------
    public enum ShellKind { PowerShell = 0, Cmd = 1 }
    public enum ShellMode { Safe = 0, Ask = 1, Auto = 2 }

    public static class CkiShell
    {
        public static string Run(string command, string cwd, int timeoutSec)
        {
            return Run(command, cwd, timeoutSec, ShellKind.PowerShell);
        }

        public static string Run(string command, string cwd, int timeoutSec, ShellKind kind)
        {
            if (timeoutSec <= 0) timeoutSec = 120;
            if (timeoutSec > 900) timeoutSec = 900;

            System.Diagnostics.ProcessStartInfo psi = null;
            if (kind == ShellKind.Cmd)
            {
                psi = new System.Diagnostics.ProcessStartInfo("cmd.exe")
                {
                    Arguments = "/c \"" + command + "\"",
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    CreateNoWindow = true
                };
            }
            else
            {
                // PowerShell-first. EncodedCommand (UTF-16LE base64) keeps any
                // quotes/$/braces in the command intact regardless of shell parsing.
                string encoded = Convert.ToBase64String(Encoding.Unicode.GetBytes(command));
                psi = new System.Diagnostics.ProcessStartInfo("powershell.exe")
                {
                    Arguments = "-NoLogo -NoProfile -NonInteractive -ExecutionPolicy Bypass -EncodedCommand " + encoded,
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    CreateNoWindow = true
                };
            }

            psi.WorkingDirectory = String.IsNullOrEmpty(cwd) ? Directory.GetCurrentDirectory() : cwd;
            psi.StandardOutputEncoding = Encoding.UTF8;
            psi.StandardErrorEncoding = Encoding.UTF8;

            using (var proc = System.Diagnostics.Process.Start(psi))
            {
                var outTask = proc.StandardOutput.ReadToEndAsync();
                var errTask = proc.StandardError.ReadToEndAsync();
                if (!proc.WaitForExit(timeoutSec * 1000))
                {
                    try { proc.Kill(); } catch (Exception) { }
                    return "{\"code\":124,\"stdout\":\"\",\"stderr\":\"command timeout\"}";
                }
                string stdout = outTask.Result;
                string stderr = errTask.Result;
                var o = new JsonObject();
                o["code"] = new JsonValue(proc.ExitCode.ToString());
                o["stdout"] = new JsonValue(CleanTerminal(stdout).TrimEnd('\r', '\n'));
                o["stderr"] = new JsonValue(CleanTerminal(stderr).TrimEnd('\r', '\n'));
                return o.ToJson(0);
            }
        }

        public static string CleanTerminal(string text)
        {
            if (text == null) return "";
            text = Regex.Replace(text, @"\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)", "");
            text = Regex.Replace(text, @"\x1b\[[0-?]*[ -/]*[@-~]", "");
            return Regex.Replace(text, @"[\x00-\x08\x0b-\x1f\x7f]", "");
        }
    }

    // ---------- Minimal JSON parser (C#5 friendly) ----------
    public abstract class Json
    {
        public abstract bool IsArray { get; }
        public abstract bool IsObject { get; }
        public string Value;
        public List<Json> Items = new List<Json>();
        public List<string> Keys = new List<string>();
        public Dictionary<string, Json> Map = new Dictionary<string, Json>();
        public int Count { get { return Items.Count; } }
        public Json this[int i] { get { return Items[i]; } }

        public Json Get(string key)
        {
            Json v;
            if (Map.TryGetValue(key, out v)) return v;
            return null;
        }

        public static Json Parse(string text)
        {
            int pos = 0;
            return ParseValue(text, ref pos);
        }

        private static void SkipWs(string t, ref int p)
        {
            while (p < t.Length && Char.IsWhiteSpace(t[p])) p++;
        }

        private static Json ParseValue(string t, ref int p)
        {
            SkipWs(t, ref p);
            if (p >= t.Length) return null;
            char c = t[p];
            if (c == '{') return ParseObject(t, ref p);
            if (c == '[') return ParseArray(t, ref p);
            if (c == '"') return new JsonValue(ParseString(t, ref p));
            return ParsePrimitive(t, ref p);
        }

        private static Json ParseObject(string t, ref int p)
        {
            p++; // {
            var obj = new JsonObject();
            SkipWs(t, ref p);
            if (p < t.Length && t[p] == '}') { p++; return obj; }
            while (true)
            {
                SkipWs(t, ref p);
                string key = ParseString(t, ref p);
                SkipWs(t, ref p);
                if (p < t.Length && t[p] == ':') p++;
                Json val = ParseValue(t, ref p);
                obj[key] = val;
                SkipWs(t, ref p);
                if (p < t.Length && t[p] == ',') { p++; continue; }
                if (p < t.Length && t[p] == '}') { p++; break; }
                break;
            }
            return obj;
        }

        private static Json ParseArray(string t, ref int p)
        {
            p++; // [
            var arr = new JsonArray();
            SkipWs(t, ref p);
            if (p < t.Length && t[p] == ']') { p++; return arr; }
            while (true)
            {
                Json val = ParseValue(t, ref p);
                arr.Add(val);
                SkipWs(t, ref p);
                if (p < t.Length && t[p] == ',') { p++; continue; }
                if (p < t.Length && t[p] == ']') { p++; break; }
                break;
            }
            return arr;
        }

        private static string ParseString(string t, ref int p)
        {
            p++; // "
            var sb = new StringBuilder();
            while (p < t.Length)
            {
                char c = t[p];
                if (c == '\\')
                {
                    p++;
                    if (p >= t.Length) break;
                    char e = t[p];
                    switch (e)
                    {
                        case 'n': sb.Append('\n'); break;
                        case 'r': sb.Append('\r'); break;
                        case 't': sb.Append('\t'); break;
                        case 'b': sb.Append('\b'); break;
                        case 'f': sb.Append('\f'); break;
                        case 'u':
                            if (p + 4 < t.Length)
                            {
                                sb.Append((char)Int32.Parse(t.Substring(p + 1, 4),
                                    NumberStyles.HexNumber));
                                p += 4;
                            }
                            break;
                        default: sb.Append(e); break;
                    }
                    p++;
                }
                else if (c == '"') { p++; break; }
                else { sb.Append(c); p++; }
            }
            return sb.ToString();
        }

        private static Json ParsePrimitive(string t, ref int p)
        {
            int start = p;
            while (p < t.Length && t[p] != ',' && t[p] != '}' && t[p] != ']'
                && !Char.IsWhiteSpace(t[p])) p++;
            return new JsonValue(t.Substring(start, p - start).Trim());
        }
    }

    public class JsonValue : Json
    {
        public JsonValue(string v) { Value = v; }
        public override bool IsArray { get { return false; } }
        public override bool IsObject { get { return false; } }
    }

    public class JsonNumber : Json
    {
        public JsonNumber(string v) { Value = v; }
        public override bool IsArray { get { return false; } }
        public override bool IsObject { get { return false; } }
    }

    public class JsonArray : Json
    {
        public JsonArray() { }
        public override bool IsArray { get { return true; } }
        public override bool IsObject { get { return false; } }
        public void Add(Json j) { Items.Add(j); }
        public string ToJson(int indent)
        {
            var sb = new StringBuilder();
            sb.Append("[");
            for (int i = 0; i < Items.Count; i++)
            {
                if (i > 0) sb.Append(",");
                sb.Append(ItemToJson(Items[i]));
            }
            sb.Append("]");
            return sb.ToString();
        }
        private static string ItemToJson(Json j)
        {
            var v = j as JsonValue;
            if (v != null) return JsonObject.EscapeValue(v.Value);
            var n = j as JsonNumber;
            if (n != null) return n.Value;
            var o = j as JsonObject;
            if (o != null) return o.ToJson(0);
            var a = j as JsonArray;
            if (a != null) return a.ToJson(0);
            return "null";
        }
    }

    public class JsonObject : Json
    {
        public JsonObject() { }
        public override bool IsArray { get { return false; } }
        public override bool IsObject { get { return true; } }

        public Json this[string key]
        {
            get { return Get(key); }
            set
            {
                if (!Map.ContainsKey(key)) { Keys.Add(key); Map[key] = value; }
                else Map[key] = value;
                Items.Clear();
                foreach (var k in Keys) Items.Add(Map[k]);
            }
        }

        public string ToJson(int indent)
        {
            var sb = new StringBuilder();
            sb.Append("{");
            bool first = true;
            foreach (var k in Keys)
            {
                if (!first) sb.Append(",");
                first = false;
                sb.Append("\"").Append(k).Append("\":");
                sb.Append(ItemToJson(Map[k]));
            }
            sb.Append("}");
            return sb.ToString();
        }

        private string ItemToJson(Json j)
        {
            var v = j as JsonValue;
            if (v != null) return EscapeValue(v.Value);
            var n = j as JsonNumber;
            if (n != null) return n.Value;
            var o = j as JsonObject;
            if (o != null) return o.ToJson(0);
            var a = j as JsonArray;
            if (a != null) return a.ToJson(0);
            return "null";
        }

        public static string EscapeValue(string raw)
        {
            if (raw == null) return "null";
            var sb = new StringBuilder();
            sb.Append("\"");
            foreach (char c in raw)
            {
                switch (c)
                {
                    case '"': sb.Append("\\\""); break;
                    case '\\': sb.Append("\\\\"); break;
                    case '\n': sb.Append("\\n"); break;
                    case '\r': sb.Append("\\r"); break;
                    case '\t': sb.Append("\\t"); break;
                    default: sb.Append(c); break;
                }
            }
            sb.Append("\"");
            return sb.ToString();
        }
    }

    // ---------- Main Form ----------
    public class MainForm : Form
    {
        private RichTextBox chatBox;
        private TextBox inputBox;
        private Button sendButton;
        private ComboBox providerCombo;
        private ComboBox modelCombo;
        private ToolStripLabel statusLabel;
        private CheckBox verboseCheck;
        private Button clearButton;
        private Button exportButton;
        private Button refreshButton;
        private Button testButton;
        private Button settingsButton;
        private Button optimizeButton;
        private ComboBox approvalCombo;
        private ListBox terminalBox;
        private ListBox sessionList;
        private TextBox traceBox;
        private Panel tracePanel;
        private Button newSessionButton;
        private Button deleteSessionButton;

        private Provider provider;
        private string baseUrl;
        private string apiKey;
        private string sessionId;
        private string startedAt;
        private string currentModel;
        private List<string> models;
        private List<ChatMessage> history;
        private bool busy;
        private bool verbose;
        private ShellMode shellMode;
        private UserSettings userSettings;

        private const string ToolJson = "{\"type\":\"function\",\"function\":{\"name\":\"terminal\",\"description\":\"Execute a shell command on this Windows host (PowerShell by default) for the user request.\",\"parameters\":{\"type\":\"object\",\"properties\":{\"command\":{\"type\":\"string\"},\"cwd\":{\"type\":\"string\"},\"timeout\":{\"type\":\"integer\"},\"shell\":{\"type\":\"string\",\"enum\":[\"powershell\",\"cmd\"]}},\"required\":[\"command\"]}}}";

        private const string GeminiToolJson = "{\"functionDeclarations\":[{\"name\":\"terminal\",\"description\":\"Execute a shell command on this Windows host (PowerShell by default) for the user request.\",\"parameters\":{\"type\":\"object\",\"properties\":{\"command\":{\"type\":\"string\"},\"cwd\":{\"type\":\"string\"},\"timeout\":{\"type\":\"integer\"},\"shell\":{\"type\":\"string\",\"enum\":[\"powershell\",\"cmd\"]}},\"required\":[\"command\"]}}]}";

        public MainForm()
        {
            Text = "cki-lite desktop - Multi-provider AI agent";
            Size = new Size(1000, 740);
            StartPosition = FormStartPosition.CenterScreen;
            Font = new Font("Segoe UI", 10F);
            try
            {
                Icon = System.Drawing.Icon.ExtractAssociatedIcon(Application.ExecutablePath);
            }
            catch (Exception) { }
            busy = false;
            verbose = false;
            shellMode = ShellMode.Ask;

            BuildUi();
            InitializeApp();
        }

        private void BuildUi()
        {
            chatBox = new RichTextBox();
            chatBox.Dock = DockStyle.Fill;
            chatBox.ReadOnly = true;
            chatBox.BorderStyle = BorderStyle.FixedSingle;
            chatBox.BackColor = Color.White;
            chatBox.Font = new Font("Consolas", 10F);
            chatBox.DetectUrls = false;
            chatBox.Multiline = true;
            chatBox.ScrollBars = RichTextBoxScrollBars.Vertical;

            var chatMenu = new ContextMenuStrip();
            chatMenu.Items.Add("Copiar", null, delegate { chatBox.Copy(); });
            chatMenu.Items.Add("Copiar tudo", null, delegate { chatBox.SelectAll(); chatBox.Copy(); });
            chatMenu.Items.Add(new ToolStripSeparator());
            chatMenu.Items.Add("Limpar", null, delegate { ClearHistory(); });
            chatBox.ContextMenuStrip = chatMenu;

            terminalBox = new ListBox();
            terminalBox.Dock = DockStyle.Fill;
            terminalBox.Font = new Font("Consolas", 9.5F);
            terminalBox.HorizontalScrollbar = true;
            terminalBox.Visible = false;

            var tabs = new TabControl();
            tabs.Dock = DockStyle.Fill;

            var chatPage = new TabPage("Chat");
            chatPage.Controls.Add(chatBox);
            var termPage = new TabPage("Terminal");
            termPage.Controls.Add(terminalBox);

            tabs.TabPages.Add(chatPage);
            tabs.TabPages.Add(termPage);

            var sessionPanel = new Panel();
            sessionPanel.Dock = DockStyle.Left;
            sessionPanel.Width = 210;
            sessionPanel.Padding = new Padding(6);
            sessionPanel.BackColor = Color.FromArgb(242, 242, 242);

            var sessionTitle = new Label();
            sessionTitle.Text = "Sessões";
            sessionTitle.Dock = DockStyle.Top;
            sessionTitle.Height = 28;
            sessionTitle.Font = new Font("Segoe UI", 10F, FontStyle.Bold);
            sessionPanel.Controls.Add(sessionTitle);

            sessionList = new ListBox();
            sessionList.Dock = DockStyle.Fill;
            sessionList.Font = new Font("Segoe UI", 9F);
            sessionList.IntegralHeight = false;
            sessionPanel.Controls.Add(sessionList);

            var sessionActions = new Panel();
            sessionActions.Dock = DockStyle.Bottom;
            sessionActions.Height = 34;
            newSessionButton = new Button();
            newSessionButton.Text = "Nova";
            newSessionButton.Width = 88;
            newSessionButton.Location = new Point(0, 2);
            deleteSessionButton = new Button();
            deleteSessionButton.Text = "Excluir";
            deleteSessionButton.Width = 88;
            deleteSessionButton.Location = new Point(92, 2);
            sessionActions.Controls.Add(newSessionButton);
            sessionActions.Controls.Add(deleteSessionButton);
            sessionPanel.Controls.Add(sessionActions);

            tracePanel = new Panel();
            tracePanel.Dock = DockStyle.Bottom;
            tracePanel.Height = 140;
            tracePanel.Padding = new Padding(6, 4, 6, 4);
            tracePanel.Visible = false;
            var traceTitle = new Label();
            traceTitle.Text = "Agent trace";
            traceTitle.Dock = DockStyle.Top;
            traceTitle.Height = 22;
            traceTitle.Font = new Font("Segoe UI", 9F, FontStyle.Bold);
            tracePanel.Controls.Add(traceTitle);
            traceBox = new TextBox();
            traceBox.Multiline = true;
            traceBox.ReadOnly = true;
            traceBox.ScrollBars = ScrollBars.Vertical;
            traceBox.Dock = DockStyle.Fill;
            traceBox.BackColor = Color.FromArgb(30, 30, 30);
            traceBox.ForeColor = Color.LightGreen;
            traceBox.Font = new Font("Consolas", 9F);
            tracePanel.Controls.Add(traceBox);

            // Top toolbar (compact: provider + model + actions; keys live in Config)
            var topBar = new ToolStrip();
            topBar.GripStyle = ToolStripGripStyle.Hidden;

            topBar.Items.Add(new ToolStripLabel("Provider:"));
            providerCombo = new ComboBox();
            providerCombo.DropDownStyle = ComboBoxStyle.DropDownList;
            providerCombo.Width = 150;
            var provHost = new ToolStripControlHost(providerCombo);
            topBar.Items.Add(provHost);

            topBar.Items.Add(new ToolStripLabel("Modelo:"));
            modelCombo = new ComboBox();
            modelCombo.DropDownStyle = ComboBoxStyle.DropDownList;
            modelCombo.Width = 280;
            var host = new ToolStripControlHost(modelCombo);
            topBar.Items.Add(host);

            topBar.Items.Add(new ToolStripLabel("Modo:"));
            approvalCombo = new ComboBox();
            approvalCombo.DropDownStyle = ComboBoxStyle.DropDownList;
            approvalCombo.Width = 120;
            approvalCombo.Items.Add("plan");
            approvalCombo.Items.Add("accept-edits");
            approvalCombo.Items.Add("auto-approve");
            approvalCombo.SelectedIndex = 1;
            topBar.Items.Add(new ToolStripControlHost(approvalCombo));

            refreshButton = new Button();
            refreshButton.Text = "Atualizar";
            refreshButton.Width = 70;
            topBar.Items.Add(new ToolStripControlHost(refreshButton));

            testButton = new Button();
            testButton.Text = "Testar";
            testButton.Width = 55;
            topBar.Items.Add(new ToolStripControlHost(testButton));

            verboseCheck = new CheckBox();
            verboseCheck.Text = "Trace";
            verboseCheck.Width = 55;
            topBar.Items.Add(new ToolStripControlHost(verboseCheck));

            clearButton = new Button();
            clearButton.Text = "Limpar";
            clearButton.Width = 60;
            topBar.Items.Add(new ToolStripControlHost(clearButton));

            exportButton = new Button();
            exportButton.Text = "Exportar";
            exportButton.Width = 70;
            topBar.Items.Add(new ToolStripControlHost(exportButton));

            settingsButton = new Button();
            settingsButton.Text = "Config";
            settingsButton.Width = 55;
            topBar.Items.Add(new ToolStripControlHost(settingsButton));

            optimizeButton = new Button();
            optimizeButton.Text = "Otimizar";
            optimizeButton.Width = 70;
            topBar.Items.Add(new ToolStripControlHost(optimizeButton));

            topBar.Items.Add(new ToolStripSeparator());

            statusLabel = new ToolStripLabel("inicializando...");
            topBar.Items.Add(statusLabel);

            // Input panel
            var inputPanel = new Panel();
            inputPanel.Dock = DockStyle.Bottom;
            inputPanel.Height = 60;
            inputPanel.Padding = new Padding(6);
            inputPanel.BackColor = Color.FromArgb(245, 245, 245);

            inputBox = new TextBox();
            inputBox.Multiline = true;
            inputBox.Dock = DockStyle.Fill;
            inputBox.Font = new Font("Segoe UI", 10F);
            inputBox.AcceptsReturn = false;
            inputBox.ScrollBars = ScrollBars.Vertical;

            sendButton = new Button();
            sendButton.Text = "Enviar";
            sendButton.Width = 90;
            sendButton.Dock = DockStyle.Right;
            sendButton.BackColor = Color.FromArgb(230, 230, 230);

            inputPanel.Controls.Add(inputBox);
            inputPanel.Controls.Add(sendButton);
            inputBox.Dock = DockStyle.Fill;
            inputBox.BringToFront();

            var mainPanel = new Panel();
            mainPanel.Dock = DockStyle.Fill;
            mainPanel.Controls.Add(tabs);
            mainPanel.Controls.Add(tracePanel);
            mainPanel.Controls.Add(topBar);
            tabs.Dock = DockStyle.Fill;
            topBar.Dock = DockStyle.Top;

            var workspace = new Panel();
            workspace.Dock = DockStyle.Fill;
            workspace.Controls.Add(mainPanel);
            workspace.Controls.Add(sessionPanel);

            var layout = new Panel();
            layout.Dock = DockStyle.Fill;
            layout.Controls.Add(workspace);
            layout.Controls.Add(inputPanel);
            Controls.Add(layout);

            sendButton.Click += delegate { SendPrompt(); };
            inputBox.KeyDown += InputBox_KeyDown;
            refreshButton.Click += delegate { RefreshModels(); };
            testButton.Click += delegate { TestConnection(); };
            clearButton.Click += delegate { ClearHistory(); };
            exportButton.Click += delegate { ExportSession(); };
            settingsButton.Click += delegate { OpenSettingsDialog(); };
            optimizeButton.Click += delegate { OptimizeModels(); };
            modelCombo.SelectedIndexChanged += ModelCombo_Changed;
            providerCombo.SelectedIndexChanged += ProviderCombo_Changed;
            approvalCombo.SelectedIndexChanged += ApprovalCombo_Changed;
            verboseCheck.CheckedChanged += delegate
            {
                verbose = verboseCheck.Checked;
                tracePanel.Visible = verbose;
            };
            sessionList.SelectedIndexChanged += delegate { LoadSelectedSession(); };
            newSessionButton.Click += delegate { NewSession(); };
            deleteSessionButton.Click += delegate { DeleteSelectedSession(); };
        }

        private void ApprovalCombo_Changed(object sender, EventArgs e)
        {
            if (approvalCombo.SelectedIndex == 0) shellMode = ShellMode.Safe;
            else if (approvalCombo.SelectedIndex == 2) shellMode = ShellMode.Auto;
            else shellMode = ShellMode.Ask;
            SaveUserSettings();
        }

        private void OpenSettingsDialog()
        {
            if (provider == null) return;
            ConfigDialog dlg = new ConfigDialog(provider, baseUrl, apiKey, shellMode);
            if (dlg.ShowDialog(this) == DialogResult.OK)
            {
                apiKey = dlg.KeyText;
                if (dlg.SaveToEnv) Sessions.WriteKeyToDotenv(provider, apiKey);
                if (dlg.BaseUrl.Length > 0) baseUrl = dlg.BaseUrl;
                shellMode = dlg.ShellMode;
                approvalCombo.SelectedIndex = (int)shellMode;
                SaveUserSettings();
                Status("configuração salva");
                TryLoadModels(true);
            }
        }

        private void InputBox_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.KeyCode == Keys.Enter && !e.Shift)
            {
                e.SuppressKeyPress = true;
                SendPrompt();
            }
        }

        private void ModelCombo_Changed(object sender, EventArgs e)
        {
            if (modelCombo.SelectedIndex >= 0 && models != null && modelCombo.SelectedIndex < models.Count)
            {
                currentModel = models[modelCombo.SelectedIndex];
                SaveUserSettings();
            }
        }

        private void ProviderCombo_Changed(object sender, EventArgs e)
        {
            List<Provider> all = Provider.All();
            if (providerCombo.SelectedIndex >= 0 && providerCombo.SelectedIndex < all.Count)
            {
                provider = all[providerCombo.SelectedIndex];
                string baseEnv = ProviderEnv.BaseUrlEnvKey(provider);
                string b = Environment.GetEnvironmentVariable(baseEnv);
                baseUrl = provider.BaseUrl(b);
                apiKey = Environment.GetEnvironmentVariable(provider.EnvKey);
                if (apiKey == null) apiKey = "";
                SaveUserSettings();
                Status("carregando catálogo (" + provider.Name + ")...");
                TryLoadModels(false);
            }
        }

        private void InitializeApp()
        {
            Sessions.LoadDotenv();
            userSettings = Sessions.LoadSettings();
            shellMode = userSettings.ApprovalMode;

            sessionId = DateTime.Now.ToString("yyyyMMdd-HHmmss");
            startedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");
            history = new List<ChatMessage>();

            List<Provider> all = Provider.All();
            providerCombo.Items.Clear();
            foreach (var p in all) providerCombo.Items.Add(p.Name);

            // Prefer a provider whose key is already configured.
            int preferred = 0;
            if (!String.IsNullOrEmpty(userSettings.Provider))
            {
                for (int i = 0; i < all.Count; i++)
                    if (all[i].Name == userSettings.Provider) { preferred = i; break; }
            }
            for (int i = 0; i < all.Count; i++)
            {
                if (!String.IsNullOrEmpty(userSettings.Provider)) break;
                string envKey = Environment.GetEnvironmentVariable(all[i].EnvKey);
                if (!String.IsNullOrEmpty(envKey)) { preferred = i; break; }
            }
            providerCombo.SelectedIndex = preferred;
            provider = all[preferred];
            approvalCombo.SelectedIndex = (int)shellMode;
            RefreshSessionList();

            string baseEnv = ProviderEnv.BaseUrlEnvKey(provider);
            string b = Environment.GetEnvironmentVariable(baseEnv);
            baseUrl = provider.BaseUrl(b);
            apiKey = Environment.GetEnvironmentVariable(provider.EnvKey);
            if (apiKey == null) apiKey = "";

            AppendLine("cki-lite desktop | multi-provider | terminal agent enabled", Color.FromArgb(0, 100, 0));
            AppendLine("Providers: NVIDIA NIM, Groq, OpenRouter, Ollama, Google Gemini", Color.DarkGray);
            AppendLine("session: " + sessionId, Color.DarkGray);
            AppendLine("Provider ativo: " + provider.Name + " (" + baseUrl + ")", Color.DarkGray);

            if (String.IsNullOrEmpty(apiKey) && !provider.IsGemini && baseUrl.StartsWith("http://"))
            {
                // local Ollama may work without a key
                AppendLine("Sem chave definida para " + provider.Name + ". Observe que Ollama local pode funcionar sem chave.", Color.Orange);
            }
            else if (String.IsNullOrEmpty(apiKey))
            {
                AppendLine("Sem chave de API para " + provider.Name + ". Use o botão 'Config' para informar.", Color.Orange);
                AppendLine("O catálogo de modelos não será carregado até que uma chave seja fornecida.", Color.DarkGray);
            }
            else
            {
                LoadModels(false);
            }
        }

        private void LoadModels(bool force)
        {
            if (provider == null) return;
            statusLabel.Text = "carregando catálogo (" + provider.Name + ")...";
            try
            {
                models = ModelCatalog.VisibleModels(provider, baseUrl, apiKey, force);
                modelCombo.Items.Clear();
                foreach (var m in models) modelCombo.Items.Add(m);
                if (models.Count > 0)
                {
                    currentModel = ModelCatalog.PickInitialModel(provider, models, currentModel);
                    if (!String.IsNullOrEmpty(currentModel)) modelCombo.SelectedItem = currentModel;
                }
                else
                {
                    currentModel = null;
                }
                statusLabel.Text = "pronto - " + provider.Name + (currentModel != null ? " | " + currentModel : " | sem modelos");
            }
            catch (Exception ex)
            {
                AppendLine("Falha ao carregar catálogo de " + provider.Name + ": " + ex.Message, Color.Red);
                statusLabel.Text = "falha no catálogo";
            }
        }

        private void TryLoadModels(bool force)
        {
            if (String.IsNullOrEmpty(apiKey) && !(provider != null && provider.IsGemini) && !baseUrl.StartsWith("http://"))
            {
                AppendLine("Sem chave para " + provider.Name + ". Use 'Config' para informar e depois Atualizar.", Color.Orange);
                return;
            }
            LoadModels(force);
        }

        private void RefreshModels()
        {
            if (provider == null) return;
            statusLabel.Text = "carregando catálogo (" + provider.Name + ")...";
            try
            {
                models = ModelCatalog.VisibleModels(provider, baseUrl, apiKey, true);
                modelCombo.Items.Clear();
                foreach (var m in models) modelCombo.Items.Add(m);
                if (models.Count > 0)
                {
                    currentModel = ModelCatalog.PickInitialModel(provider, models, currentModel);
                    if (!String.IsNullOrEmpty(currentModel)) modelCombo.SelectedItem = currentModel;
                }
                else
                {
                    currentModel = null;
                }
                statusLabel.Text = "pronto - " + provider.Name + (currentModel != null ? " | " + currentModel : " | sem modelos");
                AppendLine("Catálogo de modelos (" + provider.Name + ", " + models.Count + "):", Color.DarkGray);
                for (int i = 0; i < models.Count && i < 8; i++)
                    AppendLine("  - " + models[i], Color.Gray);
                if (models.Count > 8) AppendLine("  ... (+" + (models.Count - 8) + ")", Color.Gray);
            }
            catch (Exception ex)
            {
                AppendLine("Falha ao carregar catálogo de " + provider.Name + ": " + ex.Message, Color.Red);
                statusLabel.Text = "falha no catálogo";
            }
        }

        private void OptimizeModels()
        {
            if (provider == null || provider.Name != "NVIDIA NIM")
            {
                AppendLine("A otimização de latência está disponível para NVIDIA NIM.", Color.DarkGray);
                return;
            }
            Provider targetProvider = provider;
            string targetBaseUrl = baseUrl;
            string targetKey = apiKey;
            optimizeButton.Enabled = false;
            Status("validando modelos NIM; isso pode levar alguns minutos...");
            AppendLine("Iniciando validação dinâmica do catálogo NIM. O resultado será salvo no cache diário.", Color.DarkGray);
            ThreadPool.QueueUserWorkItem(delegate
            {
                List<string> result = null;
                Exception error = null;
                try { result = ModelCatalog.VisibleModels(targetProvider, targetBaseUrl, targetKey, true, true); }
                catch (Exception ex) { error = ex; }
                if (!IsHandleCreated) return;
                BeginInvoke((MethodInvoker)delegate
                {
                    optimizeButton.Enabled = true;
                    if (error != null)
                    {
                        AppendLine("Falha ao otimizar modelos: " + error.Message, Color.Red);
                        Status("falha na otimização");
                        return;
                    }
                    if (provider != targetProvider) return;
                    models = result ?? new List<string>();
                    modelCombo.Items.Clear();
                    foreach (string model in models) modelCombo.Items.Add(model);
                    currentModel = ModelCatalog.PickInitialModel(provider, models, currentModel);
                    if (!String.IsNullOrEmpty(currentModel)) modelCombo.SelectedItem = currentModel;
                    Status("modelos validados - " + models.Count + " disponíveis");
                    AppendLine("Validação concluída: " + models.Count + " modelos com tool calling e latência aceitável.", Color.DarkGreen);
                });
            });
        }

        private void TestConnection()
        {
            if (provider == null) return;
            Status("testando conexão (" + provider.Name + ")...");
            string targetUrl = baseUrl;
            StrictAppend("=== Teste de conexão: " + provider.Name + " ===", Color.FromArgb(0, 100, 160));
            StrictAppend("URL: " + targetUrl, Color.DarkGray);
            StrictAppend("Criptografia TLS habilitada: " + ServicePointManager.SecurityProtocol, Color.DarkGray);
            if (String.IsNullOrEmpty(apiKey))
                StrictAppend("Aviso: sem chave de API (o catálogo pode exigir autenticação).", Color.Orange);

            TestConnectionAsync(targetUrl);
        }

        private void TestConnectionAsync(string targetUrl)
        {
            ThreadPool.QueueUserWorkItem(delegate
            {
                List<CkiNet.DiagStep> steps = null;
                Exception err = null;
                try { steps = CkiNet.Diagnose(targetUrl); }
                catch (Exception ex) { err = ex; }

                if (chatBox.IsHandleCreated)
                {
                    chatBox.BeginInvoke((MethodInvoker)delegate
                    {
                        bool allOk = true;
                        if (err != null)
                        {
                            StrictAppend("Falha no teste: " + err.Message, Color.Red);
                            allOk = false;
                        }
                        else
                        {
                            foreach (var s in steps)
                            {
                                if (!s.Ok) allOk = false;
                                StrictAppend("[" + (s.Ok ? "OK" : "FALHA") + "] " + s.Label + " : " + s.Detail,
                                    s.Ok ? Color.FromArgb(0, 120, 0) : Color.Red);
                            }
                        }
                        StrictAppend(allOk
                            ? "Conclusão: conexão OK. Se o catálogo falhar, verifique a chave de API."
                            : "Conclusão: problemas de rede/TLS. Veja os passos acima.",
                            allOk ? Color.Green : Color.Red);
                        Status(allOk ? "teste: OK" : "teste: falha");
                    });
                }
            });
        }

        private void StrictAppend(string text, Color color)
        {
            chatBox.SelectionStart = chatBox.TextLength;
            chatBox.SelectionLength = 0;
            chatBox.SelectionColor = color;
            chatBox.AppendText(text + "\n");
            chatBox.ScrollToCaret();
        }

        // Runs the user-controlled confirmation dialog (mode Ask). Safe blocks,
        // Auto skips. Called from the agent loop (background thread).
        private bool ConfirmCommand(string command)
        {
            if (shellMode == ShellMode.Auto) return true;
            if (shellMode == ShellMode.Safe) return false;

            var evt = new ManualResetEvent(false);
            bool allow = false;
            chatBox.BeginInvoke((MethodInvoker)delegate
            {
                ConfirmDialog dlg = new ConfirmDialog("O agente quer executar no terminal:", command);
                allow = (dlg.ShowDialog(this) == DialogResult.Yes);
                evt.Set();
            });
            evt.WaitOne();
            return allow;
        }

        private void ClearHistory()
        {
            history.Clear();
            chatBox.Clear();
            terminalBox.Items.Clear();
            statusLabel.Text = "histórico limpo";
            AppendLine("Histórico limpo.", Color.DarkGray);
        }

        private void ExportSession()
        {
            try
            {
                string target = Path.Combine(Sessions.SessionDir(), sessionId + ".json");
                Sessions.Save(sessionId, currentModel, history, startedAt);
                AppendLine("Sessão exportada: " + target, Color.DarkGray);
                statusLabel.Text = "exportado";
            }
            catch (Exception ex)
            {
                AppendLine("Falha na exportação: " + ex.Message, Color.Red);
            }
        }

        private void SendPrompt()
        {
            if (busy) return;
            string prompt = inputBox.Text.Trim();
            if (String.IsNullOrEmpty(prompt)) return;

            if (String.IsNullOrEmpty(apiKey) && !(baseUrl != null && baseUrl.StartsWith("http://")))
            {
                AppendLine("Configure uma chave de API para " + (provider != null ? provider.Name : "o provider") + " no botão 'Config'.", Color.Red);
                return;
            }

            if (String.IsNullOrEmpty(currentModel))
            {
                AppendLine("Selecione um modelo.", Color.Red);
                return;
            }

            if (prompt == "/terminal")
            {
                inputBox.Clear();
                Status("modo terminal - digite um comando e Enter (use /exit para voltar)");
                var runner = new TerminalRunner();
                runner.Run(terminalBox, inputBox);
                busy = false;
                return;
            }

            inputBox.Clear();
            busy = true;
            Status("aguardando " + (provider != null ? provider.Name : "resposta") + "...");

            AppendLine("Você> " + prompt, Color.FromArgb(0, 90, 160));
            history.Add(new ChatMessage { Role = "user", Content = prompt });
            SessionSave();

            var state = new AgentContext { Prompt = prompt };
            ThreadPool.QueueUserWorkItem(delegate { RunAgentCallback(state); });
        }

        private class AgentResult
        {
            public string Text;
            public List<ChatMessage> NewHistory;
            public bool Failed;
            public string Model;
        }

        private class AgentContext
        {
            public string Prompt;
        }

        private void RunAgentCallback(AgentContext ctx)
        {
            AgentResult res = new AgentResult();
            try
            {
                res.Text = DoAgentLoop(ctx.Prompt, out res.NewHistory);
                res.Model = currentModel;
                res.Failed = false;
            }
            catch (Exception ex)
            {
                res.Failed = true;
                res.Text = ex.Message;
            }
            if (chatBox.IsHandleCreated)
                chatBox.BeginInvoke((MethodInvoker)delegate { OnAgentDone(res); });
        }

        private void OnAgentDone(AgentResult res)
        {
            busy = false;
            if (res.Failed)
            {
                AppendLine("NIM error: " + res.Text, Color.Red);
                Status("falha - " + res.Text);
            }
            else
            {
                if (res.NewHistory != null) history = res.NewHistory;
                if (res.Text != null && res.Text.Length > 0)
                {
                    AppendRichMarkdown((String.IsNullOrEmpty(res.Model) ? "modelo" : res.Model) + "> ", Color.FromArgb(128, 0, 128), res.Text);
                }
                Status("pronto - " + res.Model);
                SessionSave();
            }
        }

        private string DoAgentLoop(string prompt, out List<ChatMessage> newHistory)
        {
            newHistory = null;
            string current = currentModel;
            Provider prov = provider != null ? provider : Provider.All()[0];
            for (int loop = 0; loop < 8; loop++)
            {
                string body = BuildRequest(prov, current);
                if (verbose)
                {
                    string trace = "loop=" + (loop + 1) + " provider=" + prov.Name + " model=" + current + " messages=" + history.Count;
                    AppendAsync("\r[agent] " + trace, Color.DarkGray);
                    TraceAsync(trace);
                }

                string raw = null;
                int retries = 0;
                bool allowFallback = true;
                while (true)
                {
                    try
                    {
                        raw = SendChat(prov, current, body);
                        break;
                    }
                    catch (Exception ex)
                    {
                        CkiHttpException httpEx = ex as CkiHttpException;
                        if (httpEx != null && CkiHttp.IsRateLimit(httpEx))
                        {
                            retries++;
                            int delay = retries * 5;
                            AppendAsync("\r[rate-limit] " + current + " retrying in " + delay + "s (attempt " + retries + ")", Color.OrangeRed);
                            Thread.Sleep(delay * 1000);
                            continue;
                        }
                        if (httpEx != null && httpEx.Code == 404)
                        {
                            // NIM can advertise models globally while the account
                            // has no deployment/function for that model. Trying
                            // every catalog entry only creates noisy 404s.
                            allowFallback = false;
                        }
                        raw = null;
                        AppendAsync("\r[erro] " + prov.Name + " " + current + ": " + ex.Message, Color.Red);
                        break;
                    }
                }

                if (raw == null)
                {
                    if (!allowFallback)
                    {
                        newHistory = history;
                        currentModel = current;
                        return "O modelo '" + current + "' não está disponível para esta conta NVIDIA NIM. Selecione outro modelo no catálogo; o endpoint /models pode listar modelos que não estão habilitados para sua conta.";
                    }
                    bool switched = false;
                    foreach (string candidate in models)
                    {
                        if (candidate == current) continue;
                        try
                        {
                            string fbBody = BuildChatBody(prov, candidate, history);
                            raw = SendChat(prov, candidate, fbBody);
                            current = candidate;
                            switched = true;
                            AppendAsync("\r[auto] continuando com " + current, Color.Orange);
                            break;
                        }
                        catch (Exception fbEx)
                        {
                            AppendAsync("\r[auto] " + candidate + " falhou: " + fbEx.Message, Color.Red);
                        }
                    }
                    if (!switched)
                    {
                        AppendAsync("\r[auto] nenhum modelo disponível.", Color.Red);
                        newHistory = history;
                        currentModel = current;
                        return "Nenhum modelo disponível; tarefa pausada.";
                    }
                }

                ChatMessage message = ParseChatResponse(prov, raw);
                history.Add(message);
                if (message.ToolCallId == null)
                {
                    currentModel = current;
                    newHistory = history;
                    return message.Content;
                }

                if (message.Content != null && message.Content.Length > 0)
                {
                    AppendAsync("\r" + current + "> " + message.Content + "\r", Color.FromArgb(60, 60, 60));
                }

                string json = message.ToolArguments != null ? message.ToolArguments : "{}";
                string cmd = "";
                string cwd = "";
                int timeout = 120;
                ShellKind sk = ShellKind.PowerShell;
                try
                {
                    var parsed = Json.Parse(json);
                    var c = parsed.Get("command");
                    if (c != null && c.Value != null) cmd = c.Value;
                    var cd = parsed.Get("cwd");
                    if (cd != null && cd.Value != null) cwd = cd.Value;
                    var t = parsed.Get("timeout");
                    if (t != null && t.Value != null) int.TryParse(t.Value, out timeout);
                    var sh = parsed.Get("shell");
                    if (sh != null && sh.Value != null && sh.Value == "cmd") sk = ShellKind.Cmd;
                }
                catch (Exception) { }

                if (String.IsNullOrEmpty(cmd)) cmd = "echo sem comando";

                AppendAsync("\r[terminal] " + cmd + (sk == ShellKind.Cmd ? "  (cmd)" : "") + "\r", Color.FromArgb(140, 90, 0));
                TraceAsync("tool=" + (sk == ShellKind.Cmd ? "cmd" : "powershell") + " command=" + cmd + " cwd=" + (String.IsNullOrEmpty(cwd) ? "." : cwd));
                if (!ConfirmCommand(cmd))
                {
                    string cancelled = "{\"code\":0,\"stdout\":\"\",\"stderr\":\"execução cancelada pelo usuário\"}";
                    AppendAsync("\r[terminal] execução cancelada pelo usuário\r", Color.Orange);
                    history.Add(new ChatMessage
                    {
                        Role = "tool",
                        ToolCallId = message.ToolCallId,
                        Content = cancelled
                    });
                    currentModel = current;
                    SessionSave();
                    continue;
                }
                string output = CkiShell.Run(cmd, cwd, timeout, sk);
                AppendAsync("\r" + FormatShellOutput(output) + "\r", Color.DarkSlateGray);
                TraceAsync("result=" + FormatShellOutput(output));
                history.Add(new ChatMessage
                {
                    Role = "tool",
                    ToolCallId = message.ToolCallId,
                    Content = output
                });
                currentModel = current;
                SessionSave();
            }
            currentModel = current;
            newHistory = history;
            return "(atingiu o limite de 8 iterações)";
        }

        private string SendChat(Provider prov, string model, string body)
        {
            if (prov.IsGemini)
            {
                string path = "/models/" + Uri.EscapeDataString(model) + ":generateContent?key=" + Uri.EscapeDataString(apiKey);
                return CkiHttp.ApiNoAuth(prov.BaseUrl(baseUrl), path, body, "POST");
            }
            return CkiHttp.Api(prov.BaseUrl(baseUrl), apiKey, "/chat/completions", body, "POST");
        }

        private JsonObject BuildOpenAiMessage(ChatMessage message)
        {
            var result = new JsonObject();
            result["role"] = new JsonValue(message.Role);
            result["content"] = new JsonValue(message.Content);
            if (message.Role == "assistant" && !String.IsNullOrEmpty(message.ToolCallId))
            {
                var call = new JsonObject();
                call["id"] = new JsonValue(message.ToolCallId);
                call["type"] = new JsonValue("function");
                var function = new JsonObject();
                function["name"] = new JsonValue(String.IsNullOrEmpty(message.ToolName) ? "terminal" : message.ToolName);
                function["arguments"] = new JsonValue(message.ToolArguments ?? "{}");
                call["function"] = function;
                var calls = new JsonArray();
                calls.Add(call);
                result["tool_calls"] = calls;
            }
            if (message.Role == "tool" && !String.IsNullOrEmpty(message.ToolCallId))
                result["tool_call_id"] = new JsonValue(message.ToolCallId);
            return result;
        }

        private string BuildRequest(Provider prov, string model)
        {
            if (prov.IsGemini) return BuildGeminiRequest(prov, model, history, false, true);
            var body = new JsonObject();
            body["model"] = new JsonValue(model);
            var msgs = new JsonArray();
            foreach (var m in history)
                msgs.Add(BuildOpenAiMessage(m));
            body["messages"] = msgs;
            var toolObj = Json.Parse(GeminiToTool(prov)) as JsonObject;
            var toolsArr = new JsonArray();
            if (toolObj != null) toolsArr.Add(toolObj);
            body["tools"] = toolsArr;
            body["tool_choice"] = new JsonValue("auto");
            body["temperature"] = new JsonNumber("0.2");
            body["max_tokens"] = new JsonNumber("4096");
            return body.ToJson(0);
        }

        private string BuildChatBody(Provider prov, string model, List<ChatMessage> msgs)
        {
            if (prov.IsGemini) return BuildGeminiRequest(prov, model, msgs, false, false);
            var body = new JsonObject();
            body["model"] = new JsonValue(model);
            var arr = new JsonArray();
            foreach (var m in msgs)
                arr.Add(BuildOpenAiMessage(m));
            body["messages"] = arr;
            var toolObj = Json.Parse(GeminiToTool(prov)) as JsonObject;
            var toolsArr = new JsonArray();
            if (toolObj != null) toolsArr.Add(toolObj);
            body["tools"] = toolsArr;
            body["tool_choice"] = new JsonValue("auto");
            body["temperature"] = new JsonNumber("0.2");
            body["max_tokens"] = new JsonNumber("4096");
            return body.ToJson(0);
        }

        private string BuildGeminiRequest(Provider prov, string model, List<ChatMessage> msgs, bool image, bool withTools)
        {
            var body = new JsonObject();
            body["model"] = new JsonValue(model);
            var contents = new JsonArray();
            foreach (var m in msgs)
            {
                if (m.Role == "system") continue; // handled via systemInstruction below
                var co = new JsonObject();
                string role = m.Role;
                if (role == "assistant") role = "model";
                if (role == "tool") role = "model"; // function result becomes model/fn response
                co["role"] = new JsonValue(role);
                var parts = new JsonArray();
                if (m.Role == "tool")
                {
                    var po = new JsonObject();
                    var fr = new JsonObject();
                    var outObj = new JsonObject();
                    outObj["result"] = new JsonValue(m.Content);
                    fr["name"] = new JsonValue("terminal");
                    fr["response"] = outObj;
                    po["functionResponse"] = fr;
                    parts.Add(po);
                }
                else if (m.Role == "assistant" && !String.IsNullOrEmpty(m.ToolCallId))
                {
                    var po = new JsonObject();
                    var fc = new JsonObject();
                    fc["name"] = new JsonValue(String.IsNullOrEmpty(m.ToolName) ? "terminal" : m.ToolName);
                    Json args = null;
                    try { args = Json.Parse(m.ToolArguments ?? "{}"); } catch (Exception) { }
                    fc["args"] = args as JsonObject != null ? args : new JsonObject();
                    po["functionCall"] = fc;
                    parts.Add(po);
                }
                else
                {
                    var po = new JsonObject();
                    po["text"] = new JsonValue(m.Content);
                    parts.Add(po);
                }
                co["parts"] = parts;
                contents.Add(co);
            }
            body["contents"] = contents;

            // system instruction
            for (int i = 0; i < msgs.Count; i++)
            {
                if (msgs[i].Role == "system")
                {
                    var si = new JsonObject();
                    var sp = new JsonArray();
                    var spo = new JsonObject();
                    spo["text"] = new JsonValue(msgs[i].Content);
                    sp.Add(spo);
                    si["parts"] = sp;
                    body["systemInstruction"] = si;
                    break;
                }
            }

            if (withTools)
            {
                var toolsArr = new JsonArray();
                var toolObj = Json.Parse(GeminiToolJson) as JsonObject;
                if (toolObj != null) toolsArr.Add(toolObj);
                body["tools"] = toolsArr;
            }
            var gen = new JsonObject();
            gen["temperature"] = new JsonNumber("0.2");
            gen["maxOutputTokens"] = new JsonNumber("4096");
            body["generationConfig"] = gen;
            return body.ToJson(0);
        }

        private static string GeminiToTool(Provider prov)
        {
            return prov.Name == "Google Gemini" ? GeminiToolJson : ToolJson;
        }

        private ChatMessage ParseChatResponse(Provider prov, string raw)
        {
            ChatMessage msg = new ChatMessage();
            msg.Role = "assistant";
            if (String.IsNullOrEmpty(raw)) return msg;
            try
            {
                var doc = Json.Parse(raw);
                if (prov != null && prov.IsGemini)
                {
                    ParseGeminiResponse(doc, msg);
                    return msg;
                }
                var choices = doc.Get("choices");
                if (choices == null || !choices.IsArray || choices.Count == 0) return msg;
                var message = choices[0].Get("message");
                if (message == null) return msg;
                var role = message.Get("role");
                if (role != null && role.Value != null) msg.Role = role.Value;
                var content = message.Get("content");
                if (content != null && content.Value != null) msg.Content = content.Value;
                var calls = message.Get("tool_calls");
                if (calls != null && calls.IsArray && calls.Count > 0)
                {
                    var c0 = calls[0];
                    var id = c0.Get("id");
                    var fn = c0.Get("function");
                    if (fn != null)
                    {
                        string name = "";
                        string args = "";
                        var n = fn.Get("name");
                        if (n != null && n.Value != null) name = n.Value;
                        var a = fn.Get("arguments");
                        if (a != null && a.Value != null) args = a.Value;
                        msg.ToolCallId = id != null && id.Value != null ? id.Value : Guid.NewGuid().ToString();
                        msg.ToolName = name;
                        msg.ToolArguments = args;
                    }
                }
            }
            catch (Exception) { }
            return msg;
        }

        private void ParseGeminiResponse(Json doc, ChatMessage msg)
        {
            var candidates = doc.Get("candidates");
            if (candidates == null || !candidates.IsArray || candidates.Count == 0)
            {
                var error = doc.Get("error");
                if (error != null)
                {
                    var em = error.Get("message");
                    if (em != null && em.Value != null) msg.Content = "Gemini error: " + em.Value;
                }
                return;
            }
            var content = candidates[0].Get("content");
            if (content == null) return;
            var parts = content.Get("parts");
            if (parts != null && parts.IsArray)
            {
                foreach (var part in parts.Items)
                {
                    var text = part.Get("text");
                    if (text != null && text.Value != null)
                        msg.Content = (msg.Content ?? "") + text.Value;
                    var fc = part.Get("functionCall");
                    if (fc != null)
                    {
                        var fname = fc.Get("name");
                        if (fname != null && fname.Value != null) msg.ToolName = fname.Value;
                        var fargs = fc.Get("args");
                        if (fargs != null)
                        {
                            var fobj = fargs as JsonObject;
                            msg.ToolArguments = fobj != null ? fobj.ToJson(0) : "{}";
                            msg.ToolCallId = Guid.NewGuid().ToString();
                        }
                    }
                }
            }
        }

        private string FormatShellOutput(string json)
        {
            var o = new StringBuilder();
            try
            {
                var doc = Json.Parse(json); 
                {
                    var code = doc.Get("code");
                    var stdout = doc.Get("stdout");
                    var stderr = doc.Get("stderr");
                    if (stdout != null && stdout.Value != null && stdout.Value.Length > 0)
                    {
                        o.AppendLine("[stdout]");
                        o.AppendLine(stdout.Value);
                    }
                    if (stderr != null && stderr.Value != null && stderr.Value.Length > 0)
                    {
                        o.AppendLine("[stderr]");
                        o.AppendLine(stderr.Value);
                    }
                    o.Append("[exit " + (code != null ? code.Value : "?") + "]");
                }
            }
            catch (Exception) { }
            return o.ToString();
        }

        private void RefreshSessionList()
        {
            if (sessionList == null) return;
            string selected = sessionId;
            sessionList.BeginUpdate();
            sessionList.Items.Clear();
            foreach (string id in Sessions.ListSessionIds()) sessionList.Items.Add(id);
            if (!String.IsNullOrEmpty(selected))
            {
                int index = sessionList.Items.IndexOf(selected);
                if (index >= 0) sessionList.SelectedIndex = index;
            }
            sessionList.EndUpdate();
        }

        private void LoadSelectedSession()
        {
            if (sessionList == null || sessionList.SelectedItem == null || busy) return;
            string id = sessionList.SelectedItem.ToString();
            if (id == sessionId) return;
            try
            {
                SessionSnapshot snapshot = Sessions.Load(id);
                if (snapshot == null) return;
                sessionId = snapshot.Id;
                startedAt = snapshot.StartedAt;
                history = snapshot.Messages;
                if (!String.IsNullOrEmpty(snapshot.Model) && models != null && models.Contains(snapshot.Model))
                {
                    currentModel = snapshot.Model;
                    modelCombo.SelectedItem = snapshot.Model;
                }
                chatBox.Clear();
                foreach (ChatMessage message in history)
                {
                    Color color = message.Role == "user" ? Color.FromArgb(0, 90, 160) : Color.FromArgb(60, 60, 60);
                    string label = message.Role == "user" ? "Você> " : (String.IsNullOrEmpty(snapshot.Model) ? "modelo> " : snapshot.Model + "> ");
                    AppendLine(label + (message.Content ?? ""), color);
                }
                Status("sessão carregada - " + sessionId);
            }
            catch (Exception ex)
            {
                AppendLine("Falha ao carregar sessão: " + ex.Message, Color.Red);
            }
        }

        private void NewSession()
        {
            if (busy) return;
            if (!String.IsNullOrEmpty(sessionId)) SessionSave();
            sessionId = DateTime.Now.ToString("yyyyMMdd-HHmmss");
            startedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");
            history = new List<ChatMessage>();
            chatBox.Clear();
            traceBox.Clear();
            AppendLine("Nova sessão: " + sessionId, Color.DarkGray);
            RefreshSessionList();
            Status("nova sessão");
        }

        private void DeleteSelectedSession()
        {
            if (sessionList == null || sessionList.SelectedItem == null) return;
            string id = sessionList.SelectedItem.ToString();
            if (MessageBox.Show(this, "Excluir a sessão " + id + "?", "Confirmar exclusão", MessageBoxButtons.YesNo, MessageBoxIcon.Warning) != DialogResult.Yes) return;
            Sessions.Delete(id);
            if (id == sessionId) NewSession();
            RefreshSessionList();
        }

        private void SessionSave()
        {
            try { Sessions.Save(sessionId, currentModel, history, startedAt); }
            catch (Exception) { }
        }

        private void SaveUserSettings()
        {
            if (provider == null) return;
            if (userSettings == null) userSettings = new UserSettings();
            userSettings.Provider = provider.Name;
            userSettings.Model = currentModel ?? "";
            userSettings.ApprovalMode = shellMode;
            try { Sessions.SaveSettings(userSettings); }
            catch (Exception) { }
        }

        private void Status(string text)
        {
            statusLabel.Text = text;
        }

        // ---------- Append helpers (thread-safe) ----------
        private void TraceAsync(string text)
        {
            if (!verbose || traceBox == null || !traceBox.IsHandleCreated) return;
            traceBox.BeginInvoke((MethodInvoker)delegate
            {
                traceBox.AppendText(DateTime.Now.ToString("HH:mm:ss") + " " + text + "\r\n");
                traceBox.SelectionStart = traceBox.TextLength;
                traceBox.ScrollToCaret();
            });
        }

        private void AppendAsync(string text, Color color)
        {
            if (chatBox.IsHandleCreated)
                chatBox.BeginInvoke((MethodInvoker)delegate { AppendLine(text, color); });
        }

        private void AppendLine(string text, Color color)
        {
            chatBox.SelectionStart = chatBox.TextLength;
            chatBox.SelectionLength = 0;
            chatBox.SelectionColor = color;
            chatBox.AppendText(text + "\n");
            chatBox.SelectionColor = chatBox.ForeColor;
            chatBox.ScrollToCaret();
        }

        private void AppendRichMarkdown(string prefix, Color prefixColor, string markdown)
        {
            chatBox.SelectionStart = chatBox.TextLength;
            chatBox.SelectionLength = 0;
            chatBox.SelectionColor = prefixColor;
            chatBox.SelectionFont = new Font(chatBox.Font, FontStyle.Bold);
            chatBox.AppendText(prefix);
            chatBox.SelectionColor = chatBox.ForeColor;
            chatBox.SelectionFont = chatBox.Font;
            AppendMarkdownPlain(markdown);
            chatBox.AppendText("\n");
            chatBox.ScrollToCaret();
        }

        private void AppendMarkdownPlain(string markdown)
        {
            bool inFence = false;
            foreach (string rawLine in markdown.Split('\n'))
            {
                string line = rawLine.TrimEnd('\r');
                Match fenceMatch = Regex.Match(line, @"^\s*(`{3,}|~{3,})(.*)$");
                if (fenceMatch.Success)
                {
                    if (!inFence)
                    {
                        inFence = true;
                        AppendLine("  [code" + (fenceMatch.Groups[2].Value.Trim().Length > 0 ? ": " + fenceMatch.Groups[2].Value.Trim() : "") + "]", Color.Gray);
                    }
                    else
                    {
                        inFence = false;
                    }
                    continue;
                }
                if (inFence)
                {
                    AppendLine("  " + line, Color.FromArgb(0, 0, 139));
                    continue;
                }
                Match heading = Regex.Match(line, @"^#{1,6}\s+(.+?)(?:\s+#+)?$");
                if (heading.Success)
                {
                    RichBoldLine(StripInline(heading.Groups[1].Value), Color.FromArgb(128, 0, 128));
                    continue;
                }
                if (Regex.IsMatch(line, @"^\s*(?:---+|\*\*\*+)\s*$"))
                {
                    AppendLine("────────────────────────────────", Color.Gray);
                    continue;
                }
                if (Regex.IsMatch(line, @"^\s*[-*+]\s+"))
                {
                    line = Regex.Replace(line, @"^(\s*)[-*+]\s+", "$1• ");
                }
                if (line.StartsWith("> ")) line = "│ " + line.Substring(2);
                RichInlineLine(line, Color.Black);
            }
        }

        private void RichInlineLine(string line, Color baseColor)
        {
            // Simple inline markdown: **bold**, `code`, *italic*, [text](url)
            var segments = new List<KeyValuePair<string, int>>(); // text + style flag 0=normal 1=bold 2=code 3=italic
            string pattern = @"(`+)(.+?)\1|\*\*(.+?)\*\*|__([^_]+)__|\[([^\]]+)\]\(([^)]+)\)|(?<!\w)\*([^*\n]+)\*(?!\w)";
            int start = 0;
            foreach (Match m in Regex.Matches(line, pattern))
            {
                if (m.Index > start)
                    segments.Add(new KeyValuePair<string, int>(line.Substring(start, m.Index - start), 0));
                if (m.Groups[2].Value != null && m.Groups[2].Length > 0)
                    segments.Add(new KeyValuePair<string, int>(m.Groups[2].Value, 2));
                else if (m.Groups[3].Value != null && m.Groups[3].Length > 0)
                    segments.Add(new KeyValuePair<string, int>(m.Groups[3].Value, 1));
                else if (m.Groups[4].Value != null && m.Groups[4].Length > 0)
                    segments.Add(new KeyValuePair<string, int>(m.Groups[4].Value, 1));
                else if (m.Groups[5].Value != null && m.Groups[5].Length > 0)
                    segments.Add(new KeyValuePair<string, int>(m.Groups[5].Value + " (" + m.Groups[6].Value + ")", 3));
                else if (m.Groups[7].Value != null && m.Groups[7].Length > 0)
                    segments.Add(new KeyValuePair<string, int>(m.Groups[7].Value, 4));
                start = m.Index + m.Length;
            }
            if (start < line.Length)
                segments.Add(new KeyValuePair<string, int>(line.Substring(start), 0));

            foreach (var seg in segments)
            {
                chatBox.SelectionStart = chatBox.TextLength;
                chatBox.SelectionLength = 0;
                switch (seg.Value)
                {
                    case 1: chatBox.SelectionFont = new Font(chatBox.Font, FontStyle.Bold); break;
                    case 2:
                        chatBox.SelectionFont = new Font("Consolas", chatBox.Font.Size, FontStyle.Regular);
                        chatBox.SelectionColor = Color.FromArgb(0, 0, 139);
                        break;
                    case 4:
                        chatBox.SelectionFont = new Font(chatBox.Font, FontStyle.Italic);
                        break;
                    default:
                        chatBox.SelectionFont = new Font(chatBox.Font, FontStyle.Italic);
                        chatBox.SelectionColor = Color.Blue;
                        break;
                }
                if (seg.Value == 0)
                {
                    chatBox.SelectionFont = new Font(chatBox.Font, FontStyle.Regular);
                    chatBox.SelectionColor = baseColor;
                }
                chatBox.AppendText(seg.Value == 3 ? SegUrl(seg.Key) : seg.Key);
            }
            chatBox.SelectionFont = chatBox.Font;
            chatBox.SelectionColor = chatBox.ForeColor;
            chatBox.AppendText("\n");
        }

        private static string SegUrl(string key)
        {
            if (key.Contains(" (") && key.EndsWith(")"))
            {
                int idx = key.LastIndexOf(" (");
                return key.Substring(0, idx) + "  " + key.Substring(idx + 2, key.Length - idx - 3);
            }
            return key;
        }

        private void RichBoldLine(string text, Color color)
        {
            chatBox.SelectionStart = chatBox.TextLength;
            chatBox.SelectionLength = 0;
            chatBox.SelectionFont = new Font(chatBox.Font, FontStyle.Bold);
            chatBox.SelectionColor = color;
            chatBox.AppendText(text + "\n");
            chatBox.SelectionFont = chatBox.Font;
            chatBox.SelectionColor = chatBox.ForeColor;
        }

        private static string StripInline(string text)
        {
            text = Regex.Replace(text, @"\*\*(.+?)\*\*", "$1");
            text = Regex.Replace(text, @"`(.+?)`", "$1");
            return text;
        }

        // ---------- Terminal runner ----------
        private class TerminalRunner
        {
            public void Run(ListBox listBox, TextBox inputBox)
            {
                // Show terminal prompt in the chat area via the list box
                listBox.Items.Clear();
                listBox.Visible = true;
                Append(listBox, "Modo terminal direto. Digite um comando e pressione Enter. Digite /quit para sair.");
                inputBox.Text = "";
                inputBox.Focus();
                KeyEventHandler handler = null;
                handler = (s, e) =>
                {
                    if (e.KeyCode == Keys.Enter)
                    {
                        e.SuppressKeyPress = true;
                        string cmd = inputBox.Text.Trim();
                        inputBox.Clear();
                        if (cmd == "/quit" || cmd == "/exit")
                        {
                            Append(listBox, "Saindo do modo terminal.");
                            inputBox.KeyDown -= handler;
                            return;
                        }
                        Append(listBox, "$ " + cmd);
                        string output = CkiShell.Run(cmd, "", 120);
                        Append(listBox, NiceFormat(output));
                    }
                };
                inputBox.KeyDown += handler;
            }

            private void Append(ListBox box, string text)
            {
                if (box.IsHandleCreated)
                    box.BeginInvoke((MethodInvoker)delegate { box.Items.Add(text); box.TopIndex = box.Items.Count - 1; });
                else
                    box.Items.Add(text);
            }

            private string NiceFormat(string json)
            {
                try
                {
                    var doc = Json.Parse(json); 
                    {
                        var o = new StringBuilder();
                        var code = doc.Get("code");
                        var stdout = doc.Get("stdout");
                        var stderr = doc.Get("stderr");
                        if (stdout != null && stdout.Value != null && stdout.Value.Length > 0) o.AppendLine(stdout.Value);
                        if (stderr != null && stderr.Value != null && stderr.Value.Length > 0) o.AppendLine("[stderr] " + stderr.Value);
                        o.Append("[exit " + (code != null ? code.Value : "?") + "]");
                        return o.ToString();
                    }
                }
                catch (Exception) { return json; }
            }
        }
    }

    public class ConfigDialog : Form
    {
        private TextBox keyBox;
        private TextBox urlBox;
        private CheckBox showKey;
        private CheckBox saveEnv;
        private ComboBox confirmCombo;

        public string KeyText { get { return keyBox.Text.Trim(); } }
        public string BaseUrl { get { return urlBox.Text.Trim(); } }
        public bool SaveToEnv { get { return saveEnv.Checked; } }
        public ShellMode ShellMode
        {
            get
            {
                if (confirmCombo.SelectedIndex == 0) return ShellMode.Safe;
                if (confirmCombo.SelectedIndex == 2) return ShellMode.Auto;
                return ShellMode.Ask;
            }
        }

        public ConfigDialog(Provider provider, string baseUrl, string apiKey, ShellMode mode)
        {
            Text = "Configurações - " + provider.Name;
            Size = new Size(430, 300);
            StartPosition = FormStartPosition.CenterParent;
            FormBorderStyle = FormBorderStyle.FixedDialog;
            MaximizeBox = false;
            MinimizeBox = false;
            Font = new Font("Segoe UI", 9F);

            int y = 14;
            var lbl = new Label();
            lbl.Text = "Provider: " + provider.Name + "\nChave no .env: " + provider.EnvKey;
            lbl.AutoSize = true;
            lbl.Location = new Point(14, y);
            Controls.Add(lbl);
            y += (int)lbl.PreferredHeight + 12;

            Controls.Add(new Label { Text = "Chave de API:", Location = new Point(14, y), AutoSize = true });
            y += 22;
            keyBox = new TextBox();
            keyBox.Width = 390;
            keyBox.UseSystemPasswordChar = true;
            keyBox.Font = new Font("Consolas", 9F);
            keyBox.Text = apiKey;
            keyBox.Location = new Point(14, y);
            Controls.Add(keyBox);
            y += 30;

            showKey = new CheckBox();
            showKey.Text = "mostrar chave";
            showKey.AutoSize = true;
            showKey.Location = new Point(14, y);
            showKey.CheckedChanged += delegate { keyBox.UseSystemPasswordChar = !showKey.Checked; };
            Controls.Add(showKey);
            y += 30;

            Controls.Add(new Label { Text = "Base URL (opcional; vazio = padrão):", Location = new Point(14, y), AutoSize = true });
            y += 22;
            urlBox = new TextBox();
            urlBox.Width = 390;
            urlBox.Text = baseUrl;
            urlBox.Location = new Point(14, y);
            Controls.Add(urlBox);
            y += 34;

            Controls.Add(new Label { Text = "Confirmação de comandos do agente:", Location = new Point(14, y), AutoSize = true });
            y += 22;
            confirmCombo = new ComboBox();
            confirmCombo.DropDownStyle = ComboBoxStyle.DropDownList;
            confirmCombo.Width = 200;
            confirmCombo.Items.Add("Seguro (bloquear tudo)");
            confirmCombo.Items.Add("Perguntar");
            confirmCombo.Items.Add("Automático (executar tudo)");
            confirmCombo.SelectedIndex = (int)mode;
            confirmCombo.Location = new Point(14, y);
            Controls.Add(confirmCombo);
            y += 34;

            saveEnv = new CheckBox();
            saveEnv.Text = "salvar chave no .env (reutilizar nas próximas execuções)";
            saveEnv.AutoSize = true;
            saveEnv.Checked = true;
            saveEnv.Location = new Point(14, y);
            Controls.Add(saveEnv);
            y += 34;

            var ok = new Button();
            ok.Text = "OK";
            ok.DialogResult = DialogResult.OK;
            ok.Size = new Size(90, 28);
            ok.Location = new Point(220, y);
            Controls.Add(ok);

            var cancel = new Button();
            cancel.Text = "Cancelar";
            cancel.DialogResult = DialogResult.Cancel;
            cancel.Size = new Size(90, 28);
            cancel.Location = new Point(320, y);
            Controls.Add(cancel);

            AcceptButton = ok;
            CancelButton = cancel;
        }
    }

    public class ConfirmDialog : Form
    {
        public ConfirmDialog(string message, string command)
        {
            Text = "Confirmar execução";
            Size = new Size(520, 210);
            StartPosition = FormStartPosition.CenterParent;
            FormBorderStyle = FormBorderStyle.FixedDialog;
            MaximizeBox = false;
            MinimizeBox = false;
            Font = new Font("Segoe UI", 9F);

            var msg = new Label();
            msg.Text = message;
            msg.AutoSize = true;
            msg.Location = new Point(14, 14);
            Controls.Add(msg);

            var cmdBox = new TextBox();
            cmdBox.Multiline = true;
            cmdBox.ReadOnly = true;
            cmdBox.Font = new Font("Consolas", 10F);
            cmdBox.BackColor = Color.White;
            cmdBox.ScrollBars = ScrollBars.Vertical;
            cmdBox.Text = command;
            cmdBox.Location = new Point(14, 40);
            cmdBox.Size = new Size(478, 90);
            Controls.Add(cmdBox);

            var run = new Button();
            run.Text = "Executar";
            run.DialogResult = DialogResult.Yes;
            run.Size = new Size(110, 30);
            run.Location = new Point(268, 140);
            Controls.Add(run);

            var cancel = new Button();
            cancel.Text = "Cancelar";
            cancel.DialogResult = DialogResult.No;
            cancel.Size = new Size(110, 30);
            cancel.Location = new Point(388, 140);
            Controls.Add(cancel);

            AcceptButton = run;
            CancelButton = cancel;
        }
    }
}
