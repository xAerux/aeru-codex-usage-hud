using System.Collections.Concurrent;
using System.Diagnostics;
using System.Drawing;
using System.Net.Http;
using System.Text.Json;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;
namespace Aeru.CodexUsageHud.Desktop;
internal sealed class MainForm : Form
{
    public const string WindowTitle = "CODEX | Token Usage Dashboard";
    private const int WmNcHitTest = 0x0084;
    private const int HtLeft = 10, HtRight = 11, HtTop = 12, HtTopLeft = 13, HtTopRight = 14;
    private const int HtBottom = 15, HtBottomLeft = 16, HtBottomRight = 17;
    private const int WsThickFrame = 0x00040000, WsMinimizeBox = 0x00020000, WsMaximizeBox = 0x00010000, WsSysMenu = 0x00080000;
    private readonly Panel _titleBar = new() { Dock = DockStyle.Top, Height = 36, BackColor = Color.FromArgb(2, 13, 9) };
    private readonly WebView2 _webView = new() { Dock = DockStyle.Fill, Visible = false };
    private readonly Label _loading = new()
    {
        Dock = DockStyle.Fill, Text = "CODEX\r\n\r\nStarting local dashboard…", TextAlign = ContentAlignment.MiddleCenter,
        ForeColor = Color.FromArgb(55, 255, 157), BackColor = Color.FromArgb(2, 8, 6), Font = new Font("Segoe UI", 18, FontStyle.Bold)
    };
    private readonly ConcurrentQueue<string> _serverOutput = new();
    private readonly Button _maximizeButton = new();
    private Process? _backend;
    private bool _closing;
    private readonly string _settingsPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Aeru", "CODEX Monitor", "window.json");
    public MainForm()
    {
        Text = WindowTitle; FormBorderStyle = FormBorderStyle.None; MinimumSize = new Size(1040, 780); StartPosition = FormStartPosition.Manual;
        BackColor = Color.FromArgb(2, 8, 6);
        Icon = new Icon(Path.Combine(AppContext.BaseDirectory, "assets", "codex-monitor.ico"));
        BuildTitleBar();
        Controls.Add(_webView); Controls.Add(_titleBar); Controls.Add(_loading); RestoreWindowBounds();
        Shown += async (_, _) => await StartDashboardAsync();
        FormClosing += (_, _) => CloseBackend();
        Resize += (_, _) => UpdateWindowButtons();
    }

    protected override CreateParams CreateParams
    {
        get
        {
            var parameters = base.CreateParams;
            parameters.Style |= WsThickFrame | WsMinimizeBox | WsMaximizeBox | WsSysMenu;
            return parameters;
        }
    }

    protected override void OnHandleCreated(EventArgs e)
    {
        base.OnHandleCreated(e);
        var borderColor = (9 << 16) | (13 << 8) | 2;
        DwmSetWindowAttribute(Handle, 34, ref borderColor, sizeof(int));
    }

    protected override void WndProc(ref Message message)
    {
        if (message.Msg == WmNcHitTest && WindowState != FormWindowState.Maximized)
        {
            var point = PointToClient(new Point(unchecked((short)(long)message.LParam), unchecked((short)((long)message.LParam >> 16))));
            var edge = Math.Max(6, (int)Math.Round(8 * DeviceDpi / 96.0));
            var left = point.X < edge;
            var right = point.X >= ClientSize.Width - edge;
            var top = point.Y < edge;
            var bottom = point.Y >= ClientSize.Height - edge;
            if (top && left) { message.Result = (IntPtr)HtTopLeft; return; }
            if (top && right) { message.Result = (IntPtr)HtTopRight; return; }
            if (bottom && left) { message.Result = (IntPtr)HtBottomLeft; return; }
            if (bottom && right) { message.Result = (IntPtr)HtBottomRight; return; }
            if (left) { message.Result = (IntPtr)HtLeft; return; }
            if (right) { message.Result = (IntPtr)HtRight; return; }
            if (top) { message.Result = (IntPtr)HtTop; return; }
            if (bottom) { message.Result = (IntPtr)HtBottom; return; }
        }
        base.WndProc(ref message);
    }

    private void BuildTitleBar()
    {
        _titleBar.Padding = new Padding(12, 0, 0, 1);
        _titleBar.Paint += (_, e) =>
        {
            using var pen = new Pen(Color.FromArgb(30, 210, 135));
            e.Graphics.DrawLine(pen, 0, _titleBar.Height - 1, _titleBar.Width, _titleBar.Height - 1);
        };

        var appIcon = new PictureBox
        {
            Image = Icon!.ToBitmap(), SizeMode = PictureBoxSizeMode.StretchImage,
            Size = new Size(19, 19), Location = new Point(13, 8), BackColor = Color.Transparent
        };
        var title = new Label
        {
            Text = "CODEX  |  TOKEN USAGE DASHBOARD", AutoSize = true,
            Font = new Font("Segoe UI", 8.5f, FontStyle.Bold), ForeColor = Color.FromArgb(188, 222, 206),
            BackColor = Color.Transparent, Location = new Point(41, 10)
        };
        _titleBar.Controls.Add(appIcon);
        _titleBar.Controls.Add(title);
        MakeDraggable(_titleBar);
        MakeDraggable(appIcon);
        MakeDraggable(title);

        var controls = new FlowLayoutPanel
        {
            Dock = DockStyle.Right, Width = 138, Height = 36, FlowDirection = FlowDirection.RightToLeft,
            WrapContents = false, Margin = Padding.Empty, Padding = Padding.Empty, BackColor = Color.Transparent
        };
        var close = CreateWindowButton("×", "Close", 13);
        close.FlatAppearance.MouseOverBackColor = Color.FromArgb(190, 42, 55);
        close.Click += (_, _) => Close();
        _maximizeButton.Text = "□";
        StyleWindowButton(_maximizeButton, "Maximize", 10);
        _maximizeButton.Click += (_, _) => ToggleMaximize();
        var minimize = CreateWindowButton("—", "Minimize", 10);
        minimize.Click += (_, _) => WindowState = FormWindowState.Minimized;
        controls.Controls.Add(close);
        controls.Controls.Add(_maximizeButton);
        controls.Controls.Add(minimize);
        _titleBar.Controls.Add(controls);
        UpdateWindowButtons();
    }

    private static Button CreateWindowButton(string glyph, string name, float fontSize)
    {
        var button = new Button { Text = glyph };
        StyleWindowButton(button, name, fontSize);
        return button;
    }

    private static void StyleWindowButton(Button button, string name, float fontSize)
    {
        button.AccessibleName = name;
        button.Size = new Size(46, 36);
        button.Margin = Padding.Empty;
        button.Padding = Padding.Empty;
        button.TabStop = false;
        button.Cursor = Cursors.Hand;
        button.Font = new Font("Segoe UI Symbol", fontSize, FontStyle.Regular);
        button.ForeColor = Color.FromArgb(205, 238, 222);
        button.BackColor = Color.FromArgb(2, 13, 9);
        button.FlatStyle = FlatStyle.Flat;
        button.FlatAppearance.BorderSize = 0;
        button.FlatAppearance.MouseOverBackColor = Color.FromArgb(15, 53, 38);
    }

    private void MakeDraggable(Control control)
    {
        control.MouseDown += (_, args) =>
        {
            if (args.Button != MouseButtons.Left) return;
            if (args.Clicks > 1) { ToggleMaximize(); return; }
            ReleaseCapture();
            SendMessage(Handle, 0x00A1, (IntPtr)2, IntPtr.Zero);
        };
    }

    private void ToggleMaximize() => WindowState = WindowState == FormWindowState.Maximized ? FormWindowState.Normal : FormWindowState.Maximized;

    private void UpdateWindowButtons()
    {
        if (_maximizeButton.IsDisposed) return;
        var maximized = WindowState == FormWindowState.Maximized;
        _maximizeButton.Text = maximized ? "❐" : "□";
        _maximizeButton.AccessibleName = maximized ? "Restore" : "Maximize";
    }

    [System.Runtime.InteropServices.DllImport("user32.dll")]
    private static extern bool ReleaseCapture();

    [System.Runtime.InteropServices.DllImport("user32.dll")]
    private static extern IntPtr SendMessage(IntPtr handle, int message, IntPtr wParam, IntPtr lParam);

    [System.Runtime.InteropServices.DllImport("dwmapi.dll")]
    private static extern int DwmSetWindowAttribute(IntPtr handle, int attribute, ref int value, int valueSize);
    private async Task StartDashboardAsync()
    {
        try
        {
            var runtime = CoreWebView2Environment.GetAvailableBrowserVersionString();
            if (string.IsNullOrWhiteSpace(runtime)) throw new InvalidOperationException("The Microsoft Edge WebView2 Runtime is not installed.");
            var webData = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Aeru", "CODEX Monitor", "WebView2");
            Directory.CreateDirectory(webData);
            var environment = await CoreWebView2Environment.CreateAsync(userDataFolder: webData);
            await _webView.EnsureCoreWebView2Async(environment);
            _webView.CoreWebView2.Settings.AreDefaultContextMenusEnabled = false;
            _webView.CoreWebView2.Settings.AreDevToolsEnabled = false;
            _webView.CoreWebView2.Settings.IsStatusBarEnabled = false;
            _webView.CoreWebView2.Settings.IsZoomControlEnabled = false;
            _webView.CoreWebView2.NavigationStarting += (_, args) =>
            {
                if (!Uri.TryCreate(args.Uri, UriKind.Absolute, out var uri) || uri.Scheme != Uri.UriSchemeHttp || uri.Host != "127.0.0.1")
                    args.Cancel = true;
            };
            var ready = new TaskCompletionSource<string>(TaskCreationOptions.RunContinuationsAsynchronously);
            StartBackend(ready);
            var completed = await Task.WhenAny(ready.Task, Task.Delay(TimeSpan.FromSeconds(35)));
            if (completed != ready.Task) throw new TimeoutException("The local dashboard did not become ready within 35 seconds." + GetRecentOutput());
            var address = await ready.Task;
            using var client = new HttpClient { Timeout = TimeSpan.FromSeconds(10) };
            using var response = await client.GetAsync(address);
            response.EnsureSuccessStatusCode();
            _webView.Source = new Uri(address);
            _webView.Visible = true; _loading.Visible = false;
        }
        catch (Exception error) { ShowStartupError(error); }
    }
    private void StartBackend(TaskCompletionSource<string> ready)
    {
        var baseDirectory = AppContext.BaseDirectory;
        var node = Path.Combine(baseDirectory, "runtime", "node.exe");
        var server = Path.Combine(baseDirectory, "server.js");
        if (!File.Exists(node) || !File.Exists(server)) throw new FileNotFoundException("The local dashboard runtime files are missing.");
        var start = new ProcessStartInfo
        {
            FileName = node, Arguments = "\"server.js\" --no-open", WorkingDirectory = baseDirectory,
            UseShellExecute = false, CreateNoWindow = true, WindowStyle = ProcessWindowStyle.Hidden,
            RedirectStandardOutput = true, RedirectStandardError = true
        };
        start.Environment["CODEX_DESKTOP"] = "1"; start.Environment.Remove("PORT");
        _backend = new Process { StartInfo = start, EnableRaisingEvents = true };
        _backend.OutputDataReceived += (_, e) => HandleServerLine(e.Data, ready);
        _backend.ErrorDataReceived += (_, e) => HandleServerLine(e.Data, ready);
        _backend.Exited += (_, _) =>
        {
            if (!_closing && !ready.Task.IsCompleted)
                ready.TrySetException(new InvalidOperationException("The local server exited before it was ready." + GetRecentOutput()));
            else if (!_closing && IsHandleCreated)
                BeginInvoke(new Action(() => ShowStartupError(new InvalidOperationException("The local dashboard server stopped. Close and reopen the dashboard to restart it."))));
        };
        if (!_backend.Start()) throw new InvalidOperationException("Windows could not start the bundled local dashboard runtime.");
        _backend.BeginOutputReadLine(); _backend.BeginErrorReadLine();
    }
    private void HandleServerLine(string? line, TaskCompletionSource<string> ready)
    {
        if (string.IsNullOrWhiteSpace(line)) return;
        _serverOutput.Enqueue(line);
        while (_serverOutput.Count > 30) _serverOutput.TryDequeue(out _);
        const string marker = "http://127.0.0.1:";
        var addressStart = line.IndexOf(marker, StringComparison.Ordinal);
        if (addressStart >= 0)
        {
            var addressEnd = addressStart + marker.Length;
            while (addressEnd < line.Length && char.IsAsciiDigit(line[addressEnd])) addressEnd++;
            if (addressEnd > addressStart + marker.Length)
                ready.TrySetResult(line[addressStart..addressEnd]);
        }
    }
    private string GetRecentOutput()
    {
        var lines = _serverOutput.ToArray();
        return lines.Length == 0 ? string.Empty : Environment.NewLine + string.Join(Environment.NewLine, lines);
    }
    private void ShowStartupError(Exception error)
    {
        if (_closing || IsDisposed) return;
        var detail = error.Message;
        if (detail.Contains("WebView2 Runtime", StringComparison.OrdinalIgnoreCase))
            detail += Environment.NewLine + Environment.NewLine + "Install the Microsoft Edge WebView2 Runtime from Microsoft's official download page, then reopen CODEX Monitor.";
        _loading.Text = "CODEX\r\n\r\nDashboard startup failed\r\n\r\n" + detail + "\r\n\r\nYou can close this window and try again.";
        _loading.ForeColor = Color.FromArgb(255, 170, 90); _loading.Font = new Font("Segoe UI", 11, FontStyle.Regular); _loading.Padding = new Padding(36);
    }
    private void RestoreWindowBounds()
    {
        try
        {
            if (!File.Exists(_settingsPath)) { StartPosition = FormStartPosition.CenterScreen; Size = new Size(1500, 1080); return; }
            var state = JsonSerializer.Deserialize<SavedWindowState>(File.ReadAllText(_settingsPath));
            if (state is null || state.Width < MinimumSize.Width || state.Height < MinimumSize.Height) throw new InvalidDataException();
            var bounds = new Rectangle(state.X, state.Y, state.Width, state.Height);
            if (!Screen.AllScreens.Any(s => s.WorkingArea.IntersectsWith(bounds))) { StartPosition = FormStartPosition.CenterScreen; Size = new Size(1500, 1080); return; }
            Bounds = bounds; WindowState = state.Maximized ? FormWindowState.Maximized : FormWindowState.Normal;
        }
        catch { StartPosition = FormStartPosition.CenterScreen; Size = new Size(1500, 1080); }
    }
    private void SaveWindowBounds()
    {
        try
        {
            var bounds = WindowState == FormWindowState.Normal ? Bounds : RestoreBounds;
            Directory.CreateDirectory(Path.GetDirectoryName(_settingsPath)!);
            File.WriteAllText(_settingsPath, JsonSerializer.Serialize(new SavedWindowState(bounds.X, bounds.Y, bounds.Width, bounds.Height, WindowState == FormWindowState.Maximized)));
        }
        catch { }
    }
    private void CloseBackend()
    {
        _closing = true; SaveWindowBounds();
        if (_backend is null) return;
        try { if (!_backend.HasExited) { _backend.Kill(true); _backend.WaitForExit(3000); } } catch { }
        _backend.Dispose(); _backend = null;
    }
    private sealed record SavedWindowState(int X, int Y, int Width, int Height, bool Maximized);
}

