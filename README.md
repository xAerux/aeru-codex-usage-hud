<img width="1702" height="1375" alt="image" src="https://github.com/user-attachments/assets/2068ee45-4919-4013-8a97-570e50696061" />

# ⚡ AERUS AI USAGE HUD

### 📊 Your AI Tokens. Your Dashboard. Your Data.

**Created by Aeru Creations**

**Windows Desktop Application | Official Release: v1.0.1**

![Aerus AI Usage HUD]

Ever wondered how many tokens you've burned through while building your next big idea? 😂

Maybe you're coding an entire application, experimenting with local AI models, or just wondering where the hell all those tokens went.

**Aerus AI Usage HUD** was built to answer that question.

Instead of digging through scattered usage logs, switching between tools, and trying to calculate everything yourself, this application brings supported usage from **OpenAI Codex, Claude Code, and Ollama** together in one futuristic Windows dashboard.

No complicated analytics subscription. No unnecessary cloud dashboard. Just a powerful little desktop application designed to help you understand your AI usage.

**Because if we're going to burn through billions of tokens, we might as well know where they went.** 😂🚀

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔵 **Codex Tracking** | Track supported local Codex sessions and available account lifetime usage. |
| 🟠 **Claude Code Tracking** | Monitor supported Claude Code token usage from available local session records. |
| 🟢 **Ollama Tracking** | Include token usage captured through compatible local Ollama adapters. |
| 🧮 **Grand Total** | See combined, deduplicated usage across all three providers. |
| 📊 **Model Proportion** | Discover which AI models consume the most recorded tokens. |
| 📈 **Usage Over Time** | Visualize activity and compare usage across different periods. |
| 🍩 **Usage Comparison** | See how your usage is distributed between supported providers. |
| 📂 **Recent Sessions** | Explore recorded sessions, projects, models, and usage details. |
| 💰 **Estimated API Costs** | See approximate API-equivalent usage costs where sufficient data exists. |
| 🖥️ **Native Windows App** | Run the HUD in its own desktop window without opening a browser. |
| 🔐 **Local Usage Database** | Preserve supported usage records locally for viewing and analysis. |
| ⚡ **Responsive Dashboard** | A futuristic interface that adapts to different window sizes. |

Some features depend on the software installed on your computer and the records available from each provider.

---

## 🛠️ Meet Your New Token Dashboard

### 🔵 OpenAI Codex

Codex can generate an incredible amount of token activity when you're building applications, troubleshooting code, or working across multiple projects.

Aerus AI Usage HUD helps you see the bigger picture.

- Local Codex session history
- Available account lifetime usage
- Recorded input and output tokens
- Cache-related usage where available
- Model and project information
- Usage trends over time

When supported, the HUD can reconcile account lifetime totals with locally recorded sessions.

**Important:** Account-only usage may not include individual session, model, or daily information. The HUD keeps that usage separate from detailed model breakdowns rather than inventing missing data.

### 🟠 Claude Code

Using Claude Code alongside Codex?

Now you can see supported Claude Code usage without having to switch dashboards.

- Recorded Claude Code sessions
- Model usage information
- Input and output tokens
- Cache usage where available
- Recent activity and project details
- Contribution to your combined grand total

Claude Code tracking uses supported local session records. It does not automatically include all conversations from Claude's website or desktop chat application.

### 🟢 Ollama

Running your own AI models locally? Hell yeah. 🤖

Aerus AI Usage HUD also supports token tracking through compatible Ollama capture adapters.

- Supported local model usage
- Captured input and output token counts
- Model identification when recorded
- Usage comparisons alongside Codex and Claude
- Separate Ollama totals

**Note:** Ollama tracking currently depends on supported usage captures. It does not automatically monitor every Ollama application or request on your computer.

---

## 📊 Model Proportion — Who's Eating All the Tokens?

This is where things get interesting. 😂

The **Model Proportion** chart ranks your recorded AI models by total token usage.

Whether you're switching between Codex models, experimenting with Claude, or testing local Ollama models, you can see which ones account for the most recorded activity.

Features include:

- 🌈 Color-coded model bars
- 🏆 Rankings based on recorded token usage
- 🔵 Codex model comparisons
- 🟠 Claude Code model comparisons
- 🟢 Ollama model comparisons
- 📅 Usage filtering across supported time ranges
- 📊 Grouping of additional models when necessary

Models beyond the displayed top rankings can be grouped into an **Other** category.

Account-only tokens without a known model are not falsely assigned to an individual model.

**Real numbers. No imaginary tokens. No intentional double counting.**

---

## 📅 Track Your Usage Over Time

Sometimes you just want to know how much damage you've done today. 😂

The dashboard includes convenient filters:

| Filter | What It Shows |
|---|---|
| ☀️ **Today** | Recorded activity for the selected day. |
| 📆 **7 Days** | Recent usage across the last seven days. |
| 📈 **30 Days** | A broader view of recorded usage trends. |
| ♾️ **All Time** | Available lifetime usage, including supported account-level totals. |

Charts and detailed histories reflect the information actually available for the selected range.

Some account-only lifetime usage cannot be assigned to a specific date and may appear only in **All Time** totals.

---

## 💰 What Would All Those Tokens Cost?

Ever look at your token usage and wonder what the equivalent API bill might look like?

Aerus AI Usage HUD includes **estimated API-equivalent costs** for supported models and recorded activity.

These estimates are provided for educational and analytical purposes.

**They are NOT your actual subscription bill.**

- ChatGPT subscriptions are not necessarily billed per token.
- Claude subscriptions may have different billing arrangements.
- Actual API costs depend on provider pricing and model usage.
- Unattributed account-only usage may not have enough detail for pricing.
- Local Ollama inference normally has no model-provider API charge, but hardware and electricity still cost money.

It's a useful comparison—not an invoice. 💸

---

## 📦 Download & Installation

### 🚀 Latest Official Release — v1.0.1

**Windows Installer:**

`AerusAIUsageHUD-Setup-v1.0.1.exe`

### How to Install

1. 📥 Download **AerusAIUsageHUD-Setup-v1.0.1.exe** from the official GitHub release.
2. 🖱️ Double-click the installer.
3. ⚙️ Follow the Windows setup instructions.
4. 💻 Launch **Aerus AI Usage HUD** from your Desktop or Start Menu.
5. 📊 Start exploring your available AI usage!

**THAT'S IT!** 🎉

No manually installing Node.js, running npm commands, or opening a development server.

The standalone installer bundles the application's required runtime components. Windows WebView2 is also required and may need to be installed if it isn't already available.

For more advanced tracking, the corresponding AI tools and supported usage records must already exist on your computer.

### ⚠️ Windows Security Notice

Aerus AI Usage HUD is independently developed and currently distributed without a code-signing certificate.

Windows may display an unknown-publisher or SmartScreen warning.

Only run installers obtained from a source you trust. Do not disable Windows security protections to install the application.

---

## 🧠 How Token Tracking Works

Not every AI provider records usage the same way.

Some provide session-level information, some provide cumulative counters, and others expose account lifetime totals.

Aerus AI Usage HUD brings together supported information while accounting for possible overlap between sources.

For example:

- **Codex:** Supported session records and available account lifetime totals.
- **Claude Code:** Supported local session and model usage records.
- **Ollama:** Supported token captures from compatible adapters.

### Why Some Numbers May Differ

Your local session history might contain fewer tokens than an account-wide lifetime total.

That's because account-level usage can include activity not available in the local records.

Rather than pretending that missing information belongs to a particular model or session, the HUD distinguishes attributable usage from usage without those details.

**The goal is accurate tracking—not artificially inflated numbers.**

---

## 🔐 Privacy & Local Operation

Aerus AI Usage HUD is designed around a local Windows desktop experience.

- 🔒 Personal usage histories are not bundled into the public installer.
- 💾 Supported records and application history are stored locally.
- 🖥️ The dashboard can display supported locally available data without an external browser.
- 🌐 Optional account usage lookups may require an internet connection and authentication through the supported provider.
- 🔑 The application does not unlock paid AI services or provide additional AI credits.
- 📊 Usage coverage depends on supported providers and accessible records.

Some local AI capture files may contain conversation or model-response content. Treat your usage directories and backups as private.

Aerus AI Usage HUD is an independent analytics application, not an official replacement for provider usage or billing reports.

---

## ⚠️ Known Limitations

AI software evolves constantly, and usage tracking isn't always straightforward.

Current limitations include:

- Some account lifetime usage lacks individual model or session information.
- Claude.ai website and desktop chat conversations aren't automatically included in Claude Code tracking.
- Ollama tracking requires compatible capture records.
- Provider log formats and supported account interfaces may change.
- Some models cannot be priced accurately without additional usage details.
- A completely clean Windows installation may require the WebView2 runtime.
- The Windows installer is currently unsigned.

These limitations may change as development continues.

---

## 🗺️ What's Next?

This project started with one simple question:

**"How many damn tokens have I used?"** 😂

What started as a Codex usage counter eventually grew into a multi-provider analytics dashboard.

And there are always more ideas.

Potential future improvements include:

- 📊 More advanced model analytics
- 🤖 Additional supported AI providers
- 📈 Expanded charts and statistics
- 🧠 Better model usage comparisons
- 💰 More detailed cost-estimation tools
- ⚡ Continued performance and interface improvements
- 🛠️ Additional Aeru Creations integrations

These are ideas for future development, not guarantees of currently available features.

---

## 🐛 Feedback & Contributions

Found a bug? Have an idea? Think something could work better?

I appreciate feedback, testing, and constructive suggestions.

Explore the project, report problems, or contribute improvements through GitHub.

Please avoid uploading private session records, account credentials, personal conversations, or access tokens in public reports.

**Current Release:** `v1.0.1`

---

## ⚖️ MIT License & Third-Party Branding

Aerus AI Usage HUD is an independent project developed by **Aeru Creations**.

The project's original code is licensed under the **MIT License**, subject to the terms in the repository's LICENSE file.

MIT permits use, modification, distribution, and commercial use of covered material under its conditions.

### Third-Party Disclaimer

All third-party software names, logos, icons, trademarks, and associated branding remain the property of their respective owners.

Aerus AI Usage HUD is not affiliated with, sponsored by, officially partnered with, or endorsed by OpenAI, Anthropic, Ollama, or other third-party software providers unless explicitly stated otherwise.

References to Codex, Claude Code, Ollama, and other products identify supported software and compatibility.

The project's MIT License does not automatically grant permission to redistribute third-party trademarks, logos, artwork, or separately licensed components.

---

## ❤️ Built by Aeru Creations

I'm an independent creator who enjoys experimenting with AI, developing software, solving problems, and turning random ideas into actual working programs.

Sometimes that starts with a simple script.

Other times it turns into an entire Windows application because I couldn't leave the idea alone. 😂

**Aerus AI Usage HUD** is one of those projects.

Built through experimentation, troubleshooting, late nights, lots of testing, and probably more AI tokens than I care to admit.

And honestly?

**That's half the fun of creating things.**

### ⚡ Imagine It. I Produce It.

**Aeru Creations — Software. Technology. Creativity.**

*Made with curiosity, persistence, a little chaos, and a passion for building cool stuff.* 🚀

---

**© 2026 Aeru Creations.**

Third-party software and services remain the property of their respective owners and retain their applicable license terms.
