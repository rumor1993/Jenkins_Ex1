; !macro customInit
;     StrCpy $appExe "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
;     WriteRegStr HKCU "Software\Microsoft\Windows NT\CurrentVersion\AppCompatFlags\Layers" "$appExe" "RUNASADMIN"
; !macroend


; !macro customInit
;   ; SHUT DOWN APP IF CURRENTLY RUNNING
;     ${GetProcessInfo} 0 $0 $1 $2 $3 $4
;     ${if} $3 != "${APP_EXECUTABLE_FILENAME}"
;         ${nsProcess::FindProcess} "${APP_EXECUTABLE_FILENAME}" $R0
;         ${If} $R0 == 0
;             ;MessageBox MB_OK "App currently running - going to shutdown to install new version"
;             ${nsProcess::CloseProcess} "${APP_EXECUTABLE_FILENAME}" $R0
;             Sleep 5000
;             ${nsProcess::KillProcess} "${APP_EXECUTABLE_FILENAME}" $R0
;             Sleep 3000
;         ${EndIf}
;         ${nsProcess::Unload}
;     ${endIf}
; !macroend


!macro customInstall
  RMDir /r "$APPDATA\${PRODUCT_NAME}"
!macroend
		