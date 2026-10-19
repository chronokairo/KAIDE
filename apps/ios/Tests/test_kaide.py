#!/usr/bin/env python3
"""Contract tests for Kaide standalone Agent Coding application and CLI."""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parent.parent
KAIDE = ROOT


class KaideStructureTests(unittest.TestCase):
    def test_kaide_directories_exist(self):
        self.assertTrue((KAIDE / "Core").is_dir(), "Kaide/Core deve existir")
        self.assertTrue((KAIDE / "UI").is_dir(), "Kaide/UI deve existir")
        self.assertTrue((KAIDE / "App").is_dir(), "Kaide/App deve existir")
        self.assertTrue((KAIDE / "CLI").is_dir(), "Kaide/CLI deve existir")

    def test_core_files_exist(self):
        core_files = [
            "LocalShell.swift",
            "KaideFileOps.swift",
            "RepoAnalysis.swift",
            "CodeReview.swift",
            "CodeDebugger.swift",
            "NIMClient.swift",
            "KaideTools.swift",
            "KaideAgent.swift",
            "AgentsMdManager.swift",
            "CommandSafety.swift",
            "TurnDiffTracker.swift",
            "TurnMetrics.swift",
            "ApplyPatch.swift",
            "SessionPersistence.swift"
        ]
        for name in core_files:
            with self.subTest(file=name):
                self.assertTrue((KAIDE / "Core" / name).is_file(), f"{name} deve existir em Kaide/Core")

    def test_ui_and_app_files_exist(self):
        self.assertTrue((KAIDE / "App" / "KaideApp.swift").is_file())
        self.assertTrue((KAIDE / "App" / "Info.plist").is_file())
        self.assertTrue((KAIDE / "App" / "entitlements.plist").is_file())
        self.assertTrue((KAIDE / "CLI" / "main.swift").is_file())
        self.assertTrue((KAIDE / "UI" / "KaideMainView.swift").is_file())
        self.assertTrue((KAIDE / "UI" / "KaideSettingsView.swift").is_file())
        self.assertTrue((KAIDE / "UI" / "KaideTerminalView.swift").is_file())
        self.assertTrue((KAIDE / "UI" / "KaideSessionsView.swift").is_file())

    def test_nim_client_exclusively_targets_nvidia(self):
        text = (KAIDE / "Core" / "NIMClient.swift").read_text(encoding="utf-8")
        self.assertIn("https://integrate.api.nvidia.com/v1", text)
        self.assertIn("NVIDIA_API_KEY", text)
        for forbidden in ["openrouter.ai", "api.anthropic.com", "api.openai.com", "generativelanguage.googleapis.com"]:
            self.assertNotIn(forbidden, text, f"NIMClient não deve conter outros providers: {forbidden}")

    def test_turn_metrics_contract(self):
        text = (KAIDE / "Core" / "TurnMetrics.swift").read_text(encoding="utf-8")
        self.assertIn("struct TurnMetrics", text)
        self.assertIn("promptTokens", text)
        self.assertIn("completionTokens", text)
        self.assertIn("reasoningTokens", text)
        self.assertIn("latencySeconds", text)
        self.assertIn("estimatedCostUSD", text)
        self.assertIn("formattedSummary", text)

    def test_apply_patch_contract(self):
        text = (KAIDE / "Core" / "ApplyPatch.swift").read_text(encoding="utf-8")
        self.assertIn("class ApplyPatch", text)
        self.assertIn("apply(", text)
        self.assertIn("parseCodexEnvelope", text)
        self.assertIn("parseUnifiedDiff", text)
        self.assertIn("ApplyPatchError", text)

        # KaideTools must expose apply_patch
        tools_text = (KAIDE / "Core" / "KaideTools.swift").read_text(encoding="utf-8")
        self.assertIn('"apply_patch"', tools_text)
        self.assertIn("ApplyPatch()", tools_text)

    def test_session_persistence_contract(self):
        text = (KAIDE / "Core" / "SessionPersistence.swift").read_text(encoding="utf-8")
        self.assertIn("struct SessionMeta", text)
        self.assertIn("class SessionPersistence", text)
        self.assertIn("createSession", text)
        self.assertIn("appendTurn", text)
        self.assertIn("loadSession", text)
        self.assertIn("listSessions", text)

    def test_builder_tool_exists(self):
        self.assertTrue((KAIDE / "build_kaide.py").is_file())


if __name__ == "__main__":
    unittest.main()
