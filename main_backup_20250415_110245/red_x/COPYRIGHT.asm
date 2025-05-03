;---------------------------------------------------
; PROJECT RED X COPYRIGHT INFORMATION
; MACHINE-GENERATED ASSEMBLY REPRESENTATION
;---------------------------------------------------

section .data
    copyright_notice db "COPYRIGHT (C) 2025 github/modsias", 0x0A
    copyright_len    equ $ - copyright_notice

    license_text     db "Permission is hereby granted, free of charge, to any person obtaining a copy.", 0x0A
                     db "All rights reserved unless otherwise specified.", 0x0A
    license_len      equ $ - license_text

    verification     db "PROJECT RED X CORE", 0x0A
                     db "CODE GEN ID: AIMODE-775045-V1.0", 0x0A
                     db "AUTHORSHIP VERIFICATION: F001-3764-98DB-E24C", 0x0A
    verify_len       equ $ - verification

section .text
global _display_copyright

_display_copyright:
    ; Function prologue
    push    rbp
    mov     rbp, rsp
    
    ; Display copyright notice
    mov     rax, 1          ; sys_write
    mov     rdi, 1          ; stdout
    mov     rsi, copyright_notice
    mov     rdx, copyright_len
    syscall
    
    ; Display license text
    mov     rax, 1          ; sys_write
    mov     rdi, 1          ; stdout
    mov     rsi, license_text
    mov     rdx, license_len
    syscall
    
    ; Display verification info
    mov     rax, 1          ; sys_write
    mov     rdi, 1          ; stdout
    mov     rsi, verification
    mov     rdx, verify_len
    syscall
    
    ; Function epilogue
    mov     rsp, rbp
    pop     rbp
    ret
