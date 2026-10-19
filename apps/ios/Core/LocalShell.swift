import Foundation
#if canImport(Darwin)
import Darwin
#endif

public struct LocalShellResult: Codable {
    public let stdout: String
    public let stderr: String
    public let exitStatus: Int32

    public var isSuccess: Bool { exitStatus == 0 }

    public init(stdout: String, stderr: String, exitStatus: Int32) {
        self.stdout = stdout
        self.stderr = stderr
        self.exitStatus = exitStatus
    }
}

public enum LocalShellError: LocalizedError {
    case blockedCommand(String)
    case spawnFailed(Int32)
    case timeout
    case executionFailed(String)

    public var errorDescription: String? {
        switch self {
        case .blockedCommand(let pattern):
            return "Comando bloqueado por segurança: \(pattern)"
        case .spawnFailed(let code):
            return "Falha ao iniciar shell Darwin (código \(code)). Verifique o ambiente jailbreak/TrollStore."
        case .timeout:
            return "Tempo limite excedido na execução do comando."
        case .executionFailed(let msg):
            return msg
        }
    }
}

public enum LocalShell {
    private static let blockedPatterns = [
        "rm -rf /", "rm -rf /*", "rm -fr /",
        "mkfs", ":(){:|:&};:", "dd if=", "dd of=/dev/",
        "shutdown", "reboot", "halt", "poweroff",
        "> /dev/sd", "chmod -R 777 /",
        "cp /dev/null /etc/"
    ]

    public static func isBlocked(_ command: String) -> String? {
        let lower = command.lowercased()
        return blockedPatterns.first { lower.contains($0) }
    }

    public static func exec(command: String, timeoutSeconds: Int = 60, currentDirectory: String? = nil) async throws -> LocalShellResult {
        if let blocked = isBlocked(command) {
            throw LocalShellError.blockedCommand(blocked)
        }

        return try await withCheckedThrowingContinuation { continuation in
            DispatchQueue.global(qos: .userInitiated).async {
                do {
                    let result = try runBlocking(command: command, timeoutSeconds: timeoutSeconds, currentDirectory: currentDirectory)
                    continuation.resume(returning: result)
                } catch {
                    continuation.resume(throwing: error)
                }
            }
        }
    }

    private static func runBlocking(command: String, timeoutSeconds: Int, currentDirectory: String?) throws -> LocalShellResult {
        #if canImport(Darwin)
        var outFDs: [Int32] = [0, 0]
        var errFDs: [Int32] = [0, 0]
        guard pipe(&outFDs) == 0 else {
            throw LocalShellError.executionFailed("Falha ao criar stdout pipe")
        }
        guard pipe(&errFDs) == 0 else {
            close(outFDs[0])
            close(outFDs[1])
            throw LocalShellError.executionFailed("Falha ao criar stderr pipe")
        }

        var pid = pid_t()
        let wrappedCommand: String
        if let cd = currentDirectory, !cd.isEmpty {
            wrappedCommand = "cd \(escapeForShell(cd)) && " + command
        } else {
            wrappedCommand = command
        }

        let args = ["sh", "-c", wrappedCommand]
        let cArgs: [UnsafeMutablePointer<CChar>?] = args.map { strdup($0) } + [nil]
        defer {
            for case let pointer? in cArgs { free(pointer) }
        }

        let env = [
            "PATH=/var/jb/usr/bin:/var/jb/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin",
            "HOME=/var/mobile",
            "TMPDIR=/var/mobile/Library/Caches",
            "SHELL=/bin/sh",
            "USER=mobile",
            "TERM=xterm-256color",
            "LANG=en_US.UTF-8"
        ]
        let cEnv: [UnsafeMutablePointer<CChar>?] = env.map { strdup($0) } + [nil]
        defer {
            for case let pointer? in cEnv { free(pointer) }
        }

        let shellCandidates = [
            "/var/jb/bin/zsh",
            "/var/jb/usr/bin/zsh",
            "/var/jb/bin/bash",
            "/var/jb/usr/bin/bash",
            "/var/jb/bin/sh",
            "/var/jb/usr/bin/sh",
            "/bin/zsh",
            "/bin/bash",
            "/bin/sh",
            "/usr/bin/sh"
        ].filter { FileManager.default.isExecutableFile(atPath: $0) }

        var spawnError = ENOENT
        var started = false

        for shellPath in shellCandidates {
            var actions: posix_spawn_file_actions_t? = nil
            let actionsError = posix_spawn_file_actions_init(&actions)
            guard actionsError == 0 else {
                spawnError = actionsError
                continue
            }

            posix_spawn_file_actions_adddup2(&actions, outFDs[1], STDOUT_FILENO)
            posix_spawn_file_actions_addclose(&actions, outFDs[0])
            posix_spawn_file_actions_adddup2(&actions, errFDs[1], STDERR_FILENO)
            posix_spawn_file_actions_addclose(&actions, errFDs[0])

            let result = cArgs.withUnsafeBufferPointer { argvBuffer in
                cEnv.withUnsafeBufferPointer { envBuffer in
                    posix_spawn(&pid, shellPath, &actions, nil, argvBuffer.baseAddress, envBuffer.baseAddress)
                }
            }
            posix_spawn_file_actions_destroy(&actions)
            spawnError = result
            if result == 0 {
                started = true
                break
            }
        }

        close(outFDs[1])
        close(errFDs[1])

        if !started {
            close(outFDs[0])
            close(errFDs[0])
            throw LocalShellError.spawnFailed(spawnError)
        }

        var outData = Data()
        var errData = Data()
        let group = DispatchGroup()

        group.enter()
        DispatchQueue.global(qos: .userInitiated).async {
            outData = readAll(fd: outFDs[0])
            group.leave()
        }

        group.enter()
        DispatchQueue.global(qos: .userInitiated).async {
            errData = readAll(fd: errFDs[0])
            group.leave()
        }

        var status: Int32 = 0
        let deadline = Date().addingTimeInterval(TimeInterval(timeoutSeconds))
        var timedOut = false

        while true {
            let waited = waitpid(pid, &status, WNOHANG)
            if waited == pid { break }
            if Date() > deadline {
                timedOut = true
                kill(pid, SIGKILL)
                waitpid(pid, &status, 0)
                break
            }
            usleep(20_000)
        }

        group.wait()
        close(outFDs[0])
        close(errFDs[0])

        if timedOut {
            throw LocalShellError.timeout
        }

        let exitCode: Int32
        if (status & 0x7f) == 0 {
            exitCode = (status >> 8) & 0xff
        } else {
            exitCode = -1
        }

        return LocalShellResult(
            stdout: String(data: outData, encoding: .utf8) ?? String(decoding: outData, as: UTF8.self),
            stderr: String(data: errData, encoding: .utf8) ?? String(decoding: errData, as: UTF8.self),
            exitStatus: exitCode
        )
        #else
        // Fallback para compilação/teste fora do Darwin (ex: Windows/Linux)
        return LocalShellResult(
            stdout: "LocalShell Darwin posix_spawn disponível apenas no iOS/macOS",
            stderr: "",
            exitStatus: 0
        )
        #endif
    }

    #if canImport(Darwin)
    private static func readAll(fd: Int32) -> Data {
        var data = Data()
        var buffer = [UInt8](repeating: 0, count: 4096)
        while true {
            let count = read(fd, &buffer, buffer.count)
            if count <= 0 { break }
            data.append(buffer, count: count)
        }
        return data
    }
    #endif

    private static func escapeForShell(_ path: String) -> String {
        return "'" + path.replacingOccurrences(of: "'", with: "'\\''") + "'"
    }
}
