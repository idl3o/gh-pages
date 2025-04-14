@echo off
REM Set Java environment variables for VS Code

REM Configure Java 8
set JAVA_HOME_8=c:\Users\Sam\Documents\GitHub\MASTER\Oracle_JDK-8
REM Configure Java 11
set JAVA_HOME_11=c:\Users\Sam\Documents\GitHub\MASTER\Oracle_JDK-11
REM Configure Java 17
set JAVA_HOME_17=c:\Users\Sam\Documents\GitHub\MASTER\Oracle_JDK-17
REM Configure Java 23
set JAVA_HOME_23=c:\Users\Sam\Documents\GitHub\MASTER\Oracle_JDK-23

REM Set current JAVA_HOME to Java 17
set JAVA_HOME=%JAVA_HOME_17%
set PATH=%JAVA_HOME%\bin;%PATH%

REM Verify Java setup
echo Current Java setup:
java -version

echo.
echo Environment variables set:
echo JAVA_HOME=%JAVA_HOME%
echo JAVA_HOME_8=%JAVA_HOME_8%
echo JAVA_HOME_11=%JAVA_HOME_11%
echo JAVA_HOME_17=%JAVA_HOME_17%
echo JAVA_HOME_23=%JAVA_HOME_23%

REM Launch VS Code with proper environment
code .
