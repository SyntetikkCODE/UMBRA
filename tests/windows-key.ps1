param(
 [ValidateRange(1,254)][int]$VirtualKey,
 [ValidateSet('down','up')][string]$State
)
# Exercise the real Windows keyboard hook, including OEM virtual keys.
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class UmbraKeyboardTest {
 [DllImport("user32.dll")]
 public static extern uint MapVirtualKey(uint code, uint type);
 [DllImport("user32.dll")]
 public static extern void keybd_event(byte key, byte scan, uint flags, UIntPtr extra);
}
'@
$flags = if ($State -eq 'up') { 2 } else { 0 }
[UmbraKeyboardTest]::keybd_event([byte]$VirtualKey, [byte][UmbraKeyboardTest]::MapVirtualKey($VirtualKey,0), $flags, [UIntPtr]::Zero)
