param([Parameter(Mandatory=$true)][string]$FilePath,[Parameter(Mandatory=$true)][string]$ExpectedPublisher,[Parameter(Mandatory=$true)][string]$ExpectedVersion)
$ErrorActionPreference = 'Stop'
$signature = Get-AuthenticodeSignature -LiteralPath $FilePath
if ($signature.Status -ne 'Valid' -or $null -eq $signature.TimeStamperCertificate) { throw 'Missing, invalid or untimestamped Authenticode signature.' }
$publisher = $signature.SignerCertificate.GetNameInfo([System.Security.Cryptography.X509Certificates.X509NameType]::SimpleName, $false)
if ($publisher -cne $ExpectedPublisher) { throw 'Unexpected Authenticode publisher.' }
$info = [System.Diagnostics.FileVersionInfo]::GetVersionInfo((Resolve-Path -LiteralPath $FilePath).Path)
if ($info.ProductName -cne 'UMBRA' -or $info.ProductVersion -cne $ExpectedVersion) { throw 'Unexpected executable product or version.' }
Write-Output 'Authenticode identity, timestamp and product metadata verified.'
