Add-Type -AssemblyName System.Drawing
$assetRoot = Join-Path $PSScriptRoot '..\assets'
$sourceImage = [System.Drawing.Image]::FromFile((Join-Path $assetRoot 'codex-monitor-master.png'))
$iconPath = Join-Path $assetRoot 'codex-monitor.ico'
$sizes = @(16,24,32,48,64,128,256)
$frames = [System.Collections.Generic.List[byte[]]]::new()
foreach ($size in $sizes) {
  $bitmap = [System.Drawing.Bitmap]::new($size,$size,[System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $graphics.DrawImage($sourceImage,0,0,$size,$size)
  $stream = [System.IO.MemoryStream]::new()
  $bitmap.Save($stream,[System.Drawing.Imaging.ImageFormat]::Png); $frames.Add($stream.ToArray())
  $stream.Dispose(); $graphics.Dispose(); $bitmap.Dispose()
}
$sourceImage.Dispose()
$file = [System.IO.File]::Create($iconPath); $writer = [System.IO.BinaryWriter]::new($file)
$writer.Write([UInt16]0); $writer.Write([UInt16]1); $writer.Write([UInt16]$sizes.Count)
$offset = 6 + (16 * $sizes.Count)
for ($i=0; $i -lt $sizes.Count; $i++) {
  $dimension = if ($sizes[$i] -eq 256) { [byte]0 } else { [byte]$sizes[$i] }
  $writer.Write($dimension); $writer.Write($dimension); $writer.Write([byte]0); $writer.Write([byte]0)
  $writer.Write([UInt16]1); $writer.Write([UInt16]32); $writer.Write([UInt32]$frames[$i].Length)
  $writer.Write([UInt32]$offset); $offset += $frames[$i].Length
}
foreach ($frame in $frames) { $writer.Write($frame) }
$writer.Dispose(); $file.Dispose()
Write-Output "Created $iconPath with sizes $($sizes -join ', ') px"