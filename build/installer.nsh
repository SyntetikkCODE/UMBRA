!macro customInstall
  FileOpen $0 "$INSTDIR\umbra-installed" w
  FileWrite $0 "HEXAGONE installation"
  FileClose $0
!macroend
