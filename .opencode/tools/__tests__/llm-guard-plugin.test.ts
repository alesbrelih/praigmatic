import { beforeEach, describe, expect, it, vi } from "vitest";
import PragmaticLlmGuardPlugin, {
  createLlmGuardHooks,
} from "../../plugins/praigmatic-llm-guard-plugin/index.js";
import { DEFAULT_TIMEOUT_MS, loadConfig } from "../../plugins/praigmatic-llm-guard-plugin/lib/config.js";

function createContext() {
  return {
    directory: "/tmp/project",
    client: {
      tui: {
        showToast: vi.fn().mockResolvedValue(undefined),
      },
    },
  };
}

describe("praigmatic llm guard plugin", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal("fetch", vi.fn());
    delete process.env.ANONYMIZE;
    delete process.env.PRAIGMATIC_LLM_GUARD_ENABLED;
    delete process.env.PRAIGMATIC_LLM_GUARD_TIMEOUT_MS;
  });

  it("sanitizes text and tool output before provider dispatch", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          messages: [
            {
              parts: [
                {
                  fields: [
                    {
                      key: "0:0:text:0",
                      text: "Contact [REDACTED_EMAIL_ADDRESS_1]",
                    },
                  ],
                },
              ],
            },
            {
              parts: [
                {
                  fields: [
                    {
                      key: "1:0:output:2",
                      text: "Password reset sent to [REDACTED_EMAIL_ADDRESS_2]",
                    },
                  ],
                },
              ],
            },
          ],
        }),
    } as Response);

    const output = {
      messages: [
        {
          info: { id: "msg-1", role: "user", sessionID: "session-1" },
          parts: [{ id: "part-1", type: "text", text: "Contact alice@example.com" }],
        },
        {
          info: { id: "msg-2", role: "assistant", sessionID: "session-1" },
          parts: [
            {
              id: "part-2",
              type: "tool",
              state: {
                status: "completed",
                input: {},
                raw: "noop",
                title: "tool title",
                output: "Password reset sent to alice@example.com",
                time: { start: 0, end: 1 },
              },
            },
          ],
        },
      ],
    };

    const hooks = createLlmGuardHooks(createContext(), {
      enabled: true,
      url: "http://127.0.0.1:8765",
      profile: "pentest-default",
    });

    await hooks["experimental.chat.messages.transform"]?.({}, output as any);

    expect(output.messages[0].parts[0].text).toBe("Contact [REDACTED_EMAIL_ADDRESS_1]");
    expect(output.messages[1].parts[0].state.output).toBe(
      "Password reset sent to [REDACTED_EMAIL_ADDRESS_2]",
    );
  });

  it("is disabled by default without ANONYMIZE", async () => {
    const hooks = createLlmGuardHooks(createContext(), {
      url: "http://127.0.0.1:8765",
    });

    const output = {
      messages: [
        {
          info: { id: "msg-1", role: "user", sessionID: "session-1" },
          parts: [{ id: "part-1", type: "text", text: "alice@example.com" }],
        },
      ],
    };

    await hooks["experimental.chat.messages.transform"]?.({}, output as any);

    expect(output.messages[0].parts[0].text).toBe("alice@example.com");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("is enabled when ANONYMIZE=true", async () => {
    process.env.ANONYMIZE = "true";
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          messages: [
            {
              parts: [
                {
                  fields: [
                    {
                      key: "0:0:text:0",
                      text: "[REDACTED_EMAIL_ADDRESS_1]",
                    },
                  ],
                },
              ],
            },
          ],
        }),
    } as Response);

    const hooks = createLlmGuardHooks(createContext(), {
      url: "http://127.0.0.1:8765",
    });

    const output = {
      messages: [
        {
          info: { id: "msg-1", role: "user", sessionID: "session-1" },
          parts: [{ id: "part-1", type: "text", text: "alice@example.com" }],
        },
      ],
    };

    await hooks["experimental.chat.messages.transform"]?.({}, output as any);

    expect(output.messages[0].parts[0].text).toBe("[REDACTED_EMAIL_ADDRESS_1]");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("deanonymizes assistant text before display", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          text: "Call alice@example.com",
        }),
    } as Response);

    const hooks = createLlmGuardHooks(createContext(), {
      enabled: true,
      url: "http://127.0.0.1:8765",
    });

    const output = { text: "Call [REDACTED_EMAIL_ADDRESS_1]" };
    await hooks["experimental.text.complete"]?.(
      {
        sessionID: "session-1",
        messageID: "msg-1",
        partID: "part-1",
      } as any,
      output as any,
    );

    expect(output.text).toBe("Call alice@example.com");
  });

  it("uses a 20s timeout by default", () => {
    const config = loadConfig();
    expect(DEFAULT_TIMEOUT_MS).toBe(20_000);
    expect(config.timeoutMs).toBe(20_000);
  });

  it("respects timeout override from env", () => {
    process.env.PRAIGMATIC_LLM_GUARD_TIMEOUT_MS = "30000";
    const config = loadConfig();
    expect(config.timeoutMs).toBe(30_000);
    delete process.env.PRAIGMATIC_LLM_GUARD_TIMEOUT_MS;
  });

  it("blocks when the sidecar is unavailable", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("connect ECONNREFUSED"));

    const hooks = createLlmGuardHooks(createContext(), {
      enabled: true,
      url: "http://127.0.0.1:8765",
    });

    await expect(
      hooks["experimental.chat.messages.transform"]?.(
        {},
        {
          messages: [
            {
              info: { id: "msg-1", role: "user", sessionID: "session-1" },
              parts: [{ id: "part-1", type: "text", text: "alice@example.com" }],
            },
          ],
        } as any,
      ),
    ).rejects.toThrow(/blocked the request/i);
  });

  it("passes through unchanged and warns once when bypass is enabled", async () => {
    const ctx = createContext();
    const hooks = await PragmaticLlmGuardPlugin(ctx as any, {
      enabled: true,
      bypass: true,
      url: "http://127.0.0.1:8765",
    });

    const output = {
      messages: [
        {
          info: { id: "msg-1", role: "user", sessionID: "session-1" },
          parts: [{ id: "part-1", type: "text", text: "alice@example.com" }],
        },
      ],
    };

    await hooks["experimental.chat.messages.transform"]?.({}, output as any);
    await hooks["experimental.chat.messages.transform"]?.({}, output as any);

    expect(output.messages[0].parts[0].text).toBe("alice@example.com");
    expect(ctx.client.tui.showToast).toHaveBeenCalledTimes(1);
    expect(fetch).not.toHaveBeenCalled();
  });
});
