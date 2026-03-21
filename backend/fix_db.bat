@echo off
echo Dang ket noi SQL Server de sua loi "Password expired"...
sqlcmd -S localhost,1433 -U sa -P 123456 -Q "ALTER LOGIN sa WITH PASSWORD = 'HealthHub123'; ALTER LOGIN sa WITH CHECK_POLICY = OFF;"
if %errorlevel% neq 0 (
    echo Khong the tu dong sua. Vui long mo SQL Server Management Studio va doi mat khau user 'sa' thanh 'HealthHub123'
    echo Hoac chay file nay voi quyen Administrator.
) else (
    echo ---
    echo SUCCESSS: Da doi mat khau 'sa' thanh 'HealthHub123' va tat tinh nang het han mat khau.
    echo Vui long khoi dong lai backend.
)
pause
