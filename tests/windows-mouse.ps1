param(
 [ValidateSet(3,4,5)][int]$Button,
 [ValidateSet('down','up')][string]$State
)
# Inject Windows mouse input so acceptance tests exercise the actual native hook.
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class UmbraMouseTest {
 [DllImport("user32.dll")]
 public static extern void mouse_event(uint flags, uint dx, uint dy, uint data, UIntPtr extra);
}
'@
if ($Button -eq 3) {
 $flags = if ($State -eq 'down') { 0x20 } else { 0x40 }
 $data = 0
} else {
 $flags = if ($State -eq 'down') { 0x80 } else { 0x100 }
 $data = $Button - 3
}
[UmbraMouseTest]::mouse_event($flags, 0, 0, $data, [UIntPtr]::Zero)
