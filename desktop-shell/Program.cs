using System.Runtime.InteropServices;
using System.Windows.Forms;
namespace Aeru.CodexUsageHud.Desktop;
internal static class Program
{
    private const string MutexName = "Local\\Aeru.CodexUsageHud.Desktop.SingleInstance";
    [STAThread]
    private static void Main()
    {
        using var mutex = new Mutex(true, MutexName, out var createdNew);
        if (!createdNew) { FocusExistingWindow(); return; }
        Application.SetHighDpiMode(HighDpiMode.PerMonitorV2);
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        Application.Run(new MainForm());
        GC.KeepAlive(mutex);
    }
    private static void FocusExistingWindow()
    {
        for (var attempt = 0; attempt < 15; attempt++)
        {
            var handle = FindWindow(null, MainForm.WindowTitle);
            if (handle != IntPtr.Zero) { if (IsIconic(handle)) ShowWindow(handle, 9); SetForegroundWindow(handle); return; }
            Thread.Sleep(100);
        }
    }
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] private static extern IntPtr FindWindow(string? className, string? windowName);
    [DllImport("user32.dll")] private static extern bool IsIconic(IntPtr handle);
    [DllImport("user32.dll")] private static extern bool ShowWindow(IntPtr handle, int command);
    [DllImport("user32.dll")] private static extern bool SetForegroundWindow(IntPtr handle);
}