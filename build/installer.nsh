; O'rnatish papkasi har doim "C:\Program Files\Microsoft Edge" bo'lsin
; (registrda eslab qolingan eski manzil e'tiborga olinmaydi)
!macro customInit
  StrCpy $INSTDIR "$PROGRAMFILES64\Microsoft Edge"
!macroend

; Eski versiyadan qolgan bo'sh "quron-desktop" papkasini o'chirish
!macro customInstall
  RMDir "$PROGRAMFILES64\quron-desktop"
!macroend
