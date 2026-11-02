@echo off
title LaunchControl - Backend Java e MySQL
cd /d "%~dp0backend"
where java >nul 2>&1 || (echo ERRO: Java nao encontrado no PATH.&pause&exit /b 1)
where mvn >nul 2>&1 || (echo ERRO: Maven nao encontrado no PATH.&pause&exit /b 1)
echo Iniciando LaunchControl em http://localhost:8080
echo Mantenha esta janela aberta enquanto usa o Live Server.
call mvn spring-boot:run
echo.
echo Backend encerrado. Confira o erro acima se a inicializacao falhou.
pause
