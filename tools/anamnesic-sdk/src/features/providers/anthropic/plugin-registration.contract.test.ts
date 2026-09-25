import { describePluginRegistrationContract } from "code/plugin-sdk/plugin-test-contracts";

describePluginRegistrationContract({
  pluginId: "anthropic",
  providerIds: ["anthropic"],
  manifestAuthChoice: {
    pluginId: "anthropic",
    choiceId: "anthropic-api-key",
    choiceLabel: "Anthropic API key",
    groupId: "anthropic",
    groupLabel: "Anthropic",
    groupHint: "Claude API",
  },
});