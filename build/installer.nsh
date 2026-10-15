!macro customInstall
  FileOpen $0 "$INSTDIR\umbra-installed" w
  FileWrite $0 "UMBRA installation"
  FileClose $0
!macroend
