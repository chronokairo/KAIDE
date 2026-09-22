# Bugfix Requirements Document

## Introduction

This bugfix addresses seven related P0 safety and reliability defects in command execution, GGUF model processing, and workspace file access. The goal is to reject command-injection attempts, bound and terminate command execution, enforce policy consistently, handle untrusted or malformed model data without undefined behavior or panics, prevent out-of-bounds tensor access, and close symlink race escapes while preserving correct behavior for valid commands, valid models, and workspace-contained file operations.

## Bug Analysis

### Current Behavior (Defect)

Command, binary-model, and file-path boundaries do not consistently fail safely under adversarial or malformed input.

1.1 WHEN a command begins with an allowed prefix but includes shell chaining, redirection, substitution, quoting tricks, control characters, or other shell metacharacters THEN the system can execute operations beyond the allowed command.
1.2 WHEN an allowed command hangs, exceeds its execution budget, or creates descendant processes THEN the system can wait indefinitely and leave the command or descendants running.
1.3 WHEN a command is submitted through the raw command execution path THEN the system can bypass the command policy applied to the standard execution path.
1.4 WHEN an untrusted GGUF tensor type integer is not a defined supported type THEN the system interprets the integer as an enum value without validated conversion, permitting undefined behavior.
1.5 WHEN a GGUF file or Q4_0/Q8_0 tensor block is truncated, corrupt, or shorter than the declared data THEN primitive reads or dequantization can index or unwrap outside available data and panic.
1.6 WHEN GGUF tensor offsets, dimensions, element counts, block calculations, or byte sizes are invalid, overflow, or exceed the backing buffer THEN tensor data access can construct an out-of-bounds slice or panic.
1.7 WHEN a workspace path or one of its ancestors is replaced with or redirected through a symlink after validation but before the file operation THEN FileTools can read, write, append, create, or list outside the workspace.
1.8 WHEN safety-critical boundaries are tested only with ordinary examples THEN command-injection variants, timeout and descendant behavior, malformed binary inputs, integer boundaries, path traversal, and symlink races can regress without detection.

### Expected Behavior (Correct)

All affected trust boundaries must reject unsafe input deterministically, avoid panics and undefined behavior, and report actionable failures.

2.1 WHEN a command includes chaining, redirection, substitution, control characters, malformed quoting, executable-prefix confusion, or any other disallowed shell syntax THEN the system SHALL reject it before execution and SHALL NOT execute any part of it.
2.2 WHEN an allowed command exceeds its configured execution timeout THEN the system SHALL stop the command and its spawned process group or equivalent descendant set within a bounded interval, reap terminated processes, and report that execution timed out.
2.3 WHEN a command is submitted through any command execution entry point, including the raw output path, THEN the system SHALL apply the same executable, argument, blocklist, allowlist, shell-syntax, and timeout policy before execution.
2.4 WHEN an untrusted GGUF tensor type integer is not a defined supported type THEN the system SHALL reject the model with a descriptive unsupported-or-invalid-type error and SHALL NOT construct an invalid enum value.
2.5 WHEN a GGUF primitive, string, metadata value, tensor descriptor, or Q4_0/Q8_0 block is truncated, corrupt, or shorter than declared THEN the system SHALL return a descriptive error without panicking, reading out of bounds, or producing partial dequantized output as if valid.
2.6 WHEN tensor offsets, dimensions, element counts, alignment, block calculations, or byte ranges are negative, invalid, overflow a supported integer boundary, or exceed the backing buffer THEN the system SHALL reject access with a descriptive error and SHALL NOT create an out-of-bounds slice.
2.7 WHEN a requested file operation could escape the workspace through traversal, an absolute outside path, a symlink, or a symlink replacement race between validation and use THEN FileTools SHALL reject the operation and SHALL NOT read, modify, create, or disclose content outside the workspace.
2.8 WHEN the safety-hardening behavior is validated THEN the test suite SHALL include regression examples and property-based tests covering shell chaining and injection variants, executable-prefix confusion, timeout and descendant termination behavior, malformed and truncated binary inputs, unknown type identifiers, integer and arithmetic boundaries, tensor range overflow, path traversal variants, and symlink replacement races.

### Unchanged Behavior (Regression Prevention)

Inputs outside the bug conditions must retain their established successful behavior and useful diagnostics.

3.1 WHEN a command has an explicitly allowed executable and permitted arguments, contains no disallowed shell syntax, and completes within its timeout THEN the system SHALL CONTINUE TO execute it in the configured workspace and return its exit status, standard output, and standard error.
3.2 WHEN command execution fails policy validation, spawning, waiting, timeout handling, or process termination THEN the system SHALL CONTINUE TO provide useful error reporting while avoiding disclosure of secrets or misleading success results.
3.3 WHEN a GGUF model has a supported type identifier, valid metadata and dimensions, non-overflowing offsets and sizes, complete tensor data, and valid Q4_0/Q8_0 blocks THEN the system SHALL CONTINUE TO load and dequantize it according to the existing supported format behavior.
3.4 WHEN a valid GGUF model uses values at supported integer and buffer boundaries THEN the system SHALL CONTINUE TO accept the model when all checked calculations and ranges remain valid.
3.5 WHEN a read, write, append, create, or list request resolves to a stable path contained within the configured workspace THEN FileTools SHALL CONTINUE TO perform the requested operation with the existing observable content and listing behavior.
3.6 WHEN a file path is missing, invalid, denied, raced, or otherwise cannot be operated on safely THEN FileTools SHALL CONTINUE TO return a useful failure result without affecting paths outside the workspace.
3.7 WHEN regression and property-based tests generate inputs outside the identified bug conditions THEN the system SHALL CONTINUE TO satisfy the preserved valid-command, valid-GGUF, workspace-contained file-operation, and error-reporting behavior.
